import { pool } from "./db.js"

// logique pour créer une nouvelle partie
export async function createGame(code, creatorId) {
    const { rows } = await pool.query(
        await repository.pool.query(`insert into game (creator_id, code) 
            values ($1, $2)`, [creatorId, code])
    )
    return rows[0]
}

// check si la game avec un code X existe, sinon retourne undefined
export async function findGameByCode(code) {
    const { rows } = await pool.query('select * from game where code = $1', [code])
    return rows[0]
}

export async function findHistoryGames() {
    const { rows } = await pool.query(
        'select * from history_games order by created_at desc'
    )
    return rows
}

export async function createGameResult(result, endedBy, winnerId = null) {
    const { rows } = await pool.query(
        `insert into history_games (winner_id, result, ended_by)
         values ($1, $2, $3)
         returning id, result, ended_by, created_at`,
        [winnerId, result, endedBy]
    )
    return rows[0]
}

export async function findHistoryGames() {
    const { rows } = await pool.query(
        `select history_games.*,
                player1.username as player1_name,
                player2.username as player2_name
         from history_games
         left join users as player1 on player1.id = history_games.player1_id
         left join users as player2 on player2.id = history_games.player2_id
         order by history_games.created_at desc`
    )
    return rows
}

export async function createGameResult(result, endedBy, winnerId = null, player1Id = null, player2Id = null) {
    const { rows } = await pool.query(
        `insert into history_games (winner_id, result, ended_by, player1_id, player2_id)
         values ($1, $2, $3, $4, $5)
         returning id, result, ended_by, player1_id, player2_id, created_at`,
        [winnerId, result, endedBy, player1Id, player2Id]
    )
    return rows[0]
}

export async function findHistoryGames() {
    const { rows } = await pool.query(
        `select history_games.*,
                player1.username as player1_name,
                player2.username as player2_name
         from history_games
         left join users as player1 on player1.id = history_games.player1_id
         left join users as player2 on player2.id = history_games.player2_id
         order by history_games.created_at desc`
    )
    return rows
}

export async function createGameResult(result, endedBy, winnerId = null, player1Id = null, player2Id = null) {
    const { rows } = await pool.query(
        `insert into history_games (winner_id, result, ended_by, player1_id, player2_id)
         values ($1, $2, $3, $4, $5)
         returning id, result, ended_by, player1_id, player2_id, created_at`,
        [winnerId, result, endedBy, player1Id, player2Id]
    )
    return rows[0]
}

export async function findHistoryGames() {
    const { rows } = await pool.query(
        'select * from history_games order by created_at desc'
    )
    return rows
}

export async function createGameResult(result, endedBy, winnerId = null) {
    const { rows } = await pool.query(
        `insert into history_games (winner_id, result, ended_by)
         values ($1, $2, $3)
         returning id, result, ended_by, created_at`,
        [winnerId, result, endedBy]
    )
    return rows[0]
}

export async function joinGame(code, playerId) {
    // Une connexion réservée permet de verrouiller et modifier la ligne dans une seule transaction.
    const client = await pool.connect()

    try {
        await client.query("begin")
        // Sérialise les demandes concurrentes: la deuxième requête attend puis voit l'état modifié par la première.
        const { rows } = await client.query(
            `select id, creator_id, joiner_id, state
             from game
             where code = $1
             for update`,
            [code]
        )
        const game = rows[0]

        // Fournit une réponse métier claire si le code ne correspond à aucune partie.
        if (!game) {
            await client.query("rollback")
            return { error: "Partie introuvable", status: 404 }
        }
        // Un lobby déjà lancé ou rempli ne peut pas accueillir un autre joueur.
        if (game.state !== "lobby" || game.joiner_id != null) {
            await client.query("rollback")
            return { error: "Cette partie n'accepte plus de joueur", status: 409 }
        }
        // Le créateur ne peut pas jouer contre lui-même.
        if (Number(game.creator_id) === Number(playerId)) {
            await client.query("rollback")
            return { error: "Impossible de rejoindre votre propre partie", status: 409 }
        }

        // L'arrivée du second joueur fait passer la partie du lobby à l'état en cours.
        const { rows: updatedRows } = await client.query(
            `update game
             set joiner_id = $1, state = 'en cours'
             where id = $2
             returning id, creator_id, joiner_id, code, state`,
            [playerId, game.id]
        )
        await client.query("commit")
        return { game: updatedRows[0] }
    } catch (error) {
        // Annule l'affectation du joueur si une étape de la transaction échoue.
        await client.query("rollback")
        throw error
    } finally {
        // Libère la connexion réservée, y compris en cas de retour anticipé.
        client.release()
    }
}
