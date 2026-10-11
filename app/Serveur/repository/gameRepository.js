import { pool } from "./db.js"

// logique pour créer une nouvelle partie
export async function createGame(code, creatorId) {
    const { rows } = await pool.query(`with g as (
            insert into game (creator_id, code) values ($2, $1) returning id
        )
        insert into game_details (game_id) select id from g returning game_id`, [code, creatorId])
    return rows[0]
}

// check si la game avec un code X existe, sinon retourne undefined
export async function findGameByCode(code) {
    const { rows } = await pool.query('select * from game where code = $1', [code])
    return rows[0]
}

// retourne les détails d'une partie (pgn, fen, result, move_count, state)
export async function getDetailsGame(game_id) {
    const { rows } = await pool.query(
        `select g.code, g.creator_id, g.joiner_id, g.state,
                d.pgn, d.fen, d.move_count, d.result
         from game_details d
         join game g on g.id = d.game_id
         where d.game_id = $1`, [game_id])
    return rows[0]
}

// sauvegarde le pgn, le fen et le résultat après un coup, et incrémente move_count
export async function saveMove(game_id, pgn, fen, result) {
    await pool.query(`update game_details
        set pgn = $2, fen = $3, result = $4, move_count = move_count + 1
        where game_id = $1`, [game_id, pgn, fen, result])
}

// change l'état de la game ('lobby' | 'en_cours' | 'finished')
export async function setGameState(game_id, state) {
    await pool.query('update game set state = $2 where id = $1', [game_id, state])
}

export async function getGameStatus(code) {
    const { rows } = await pool.query(
        `select game.*, creator.username as creator_username, joiner.username as joiner_username,
                result.result as last_result,
                result.ended_by as last_ended_by,
                result.winner_id as last_winner_id
         from game
         join users as creator on creator.id = game.creator_id
         left join users as joiner on joiner.id = game.joiner_id
         left join lateral (
             select h.result, h.ended_by, h.winner_id
             from history_games h
             where h.game_id = game.id
             order by h.id desc
             limit 1
         ) as result on true
         where game.code = $1`,
        [code]
    )
    return rows[0]
}

export async function startGame(code, creatorId) {
    const { rows } = await pool.query(
        `update game
         set state = 'en cours'
         where code = $1
           and creator_id = $2
           and joiner_id is not null
           and state = 'lobby'
         returning id, creator_id, joiner_id, code, state`,
        [code, creatorId]
    )
    return rows[0]
}

export async function forfeitGame(code, playerId) {
    const client = await pool.connect()

    try {
        await client.query("begin")
        const { rows } = await client.query(
            `select id, creator_id, joiner_id, state
             from game
             where code = $1
             for update`,
            [code]
        )
        const game = rows[0]

        if (!game) {
            await client.query("rollback")
            return { error: "Partie introuvable", status: 404 }
        }

        const players = [Number(game.creator_id), Number(game.joiner_id)]
        if (game.state !== "en cours" || !players.includes(Number(playerId))) {
            await client.query("rollback")
            return { error: "Vous ne pouvez pas abandonner cette partie", status: 409 }
        }

        const winnerId = players.find((id) => id !== Number(playerId))
        const { rows: historyRows } = await client.query(
            `insert into history_games
                (game_id, player1_id, player2_id, winner_id, result, ended_by)
             values ($1, $2, $3, $4, 'Abandon', 'forfeit')
             returning id, game_id, player1_id, player2_id, winner_id, result, ended_by, created_at`,
            [game.id, game.creator_id, game.joiner_id, winnerId]
        )
        await client.query("update game set state = 'finished' where id = $1", [game.id])
        await client.query("commit")

        return {
            game: historyRows[0],
            message: "La partie a été enregistrée comme un abandon."
        }
    } catch (error) {
        await client.query("rollback")
        throw error
    } finally {
        client.release()
    }
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

export async function findHistoryGames(playerId) {
    const { rows } = await pool.query(
    `select history_games.*,
        row_number() over (order by history_games.created_at asc, history_games.id asc) as player_game_number,
                case
                    when history_games.result = 'Abandon' and history_games.winner_id = $1 then 'Victoire'
                    when history_games.result = 'Abandon' and history_games.winner_id is not null then 'Défaite'
                    else null
                end as player_outcome,
                player1.username as player1_name,
                player2.username as player2_name
         from history_games
         left join users as player1 on player1.id = history_games.player1_id
         left join users as player2 on player2.id = history_games.player2_id
         where history_games.player1_id = $1
            or history_games.player2_id = $1
         order by history_games.created_at desc`
        , [playerId]
    )
    return rows
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
               set joiner_id = $1
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

export async function changeGameState(newState, gameId) {
    await pool.query('update game set state = $1 where id = $2', [newState, gameId])
}
