import { pool } from "./db.js"
import { calculateGameRatings, rankPlayers } from "./elo.js"

export async function getLeaderboard() {
    // La cote est stockée dans users.elo; le nombre de parties vient de history_games.
    const { rows } = await pool.query(
        `select u.id, u.username, u.elo,
                (select count(*)::int from history_games h
                 where h.player1_id = u.id or h.player2_id = u.id) as "gamesPlayed"
         from users u`
    )

    // Le rang est ajouté après tri par cote décroissante.
    return rankPlayers(rows.map((row) => ({ ...row, id: Number(row.id) })))
}

export async function finishGame(gameCode, requesterId, winnerId) {
    // Utilise une connexion dédiée pour que toutes les requêtes de transaction passent par le même client PostgreSQL.
    const client = await pool.connect()

    try {
        // L'historique du résultat et le passage à l'état terminé doivent réussir ensemble.
        await client.query("begin")
        // Le verrou empêche deux demandes simultanées de finaliser cette même partie.
        const { rows } = await client.query(
            `select id, creator_id, joiner_id, state
             from game
             where code = $1
             for update`,
            [gameCode]
        )
        const game = rows[0]

        // Une partie inconnue ne peut pas être ajoutée à l'historique.
        if (!game) {
            await client.query("rollback")
            return { error: "Partie introuvable", status: 404 }
        }
        // La partie doit avoir son deuxième joueur et être commencée avant sa fin.
        if (game.state !== "en cours" || game.joiner_id == null) {
            await client.query("rollback")
            return { error: "Cette partie n'est pas en cours", status: 409 }
        }

        // Convertit les IDs PostgreSQL en nombres pour les comparer aux IDs du JWT.
        const playerIds = [Number(game.creator_id), Number(game.joiner_id)]
        // Seul un participant est autorisé à soumettre le résultat de la partie.
        if (!playerIds.includes(Number(requesterId))) {
            await client.query("rollback")
            return { error: "Vous ne participez pas à cette partie", status: 403 }
        }
        // null est accepté pour une nulle; sinon le gagnant doit faire partie du match.
        if (winnerId !== null && !playerIds.includes(winnerId)) {
            await client.query("rollback")
            return { error: "Le gagnant doit être un joueur de la partie", status: 400 }
        }

        // Verrouille les deux comptes (ordre d'id stable pour éviter les blocages) et lit leurs cotes actuelles.
        const { rows: users } = await client.query(
            "select id, elo from users where id = any($1) order by id for update",
            [playerIds]
        )
        const player1 = users.find((u) => Number(u.id) === playerIds[0])
        const player2 = users.find((u) => Number(u.id) === playerIds[1])
        if (!player1 || !player2) {
            await client.query("rollback")
            return { error: "Joueur introuvable", status: 404 }
        }
        const { elo1, elo2 } = calculateGameRatings(player1, player2, winnerId)

        // history_games garde le résultat, lié à la partie (idGame du diagramme).
        await client.query(
            `insert into history_games (game_id, player1_id, player2_id, winner_id)
             values ($1, $2, $3, $4)`,
            [game.id, playerIds[0], playerIds[1], winnerId]
        )
        // Les nouvelles cotes sont enregistrées dans les comptes (Compte.ELO).
        await client.query("update users set elo = $1 where id = $2", [elo1, playerIds[0]])
        await client.query("update users set elo = $1 where id = $2", [elo2, playerIds[1]])
        // Marque le match terminé dans la même transaction que l'ajout à l'historique.
        await client.query(
            "update game set state = 'finished' where id = $1",
            [game.id]
        )
        // Publie les deux changements en une seule validation atomique.
        await client.query("commit")
        return { gameId: game.id, winnerId }
    } catch (error) {
        // En cas d'erreur SQL, annule aussi tout changement déjà effectué.
        await client.query("rollback")
        throw error
    } finally {
        // Rend la connexion au pool qu'on ait réussi ou non.
        client.release()
    }
}
