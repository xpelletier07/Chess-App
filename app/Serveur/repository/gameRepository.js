import { pool } from "./db.js"

// logique pour créer une nouvelle partie
export async function createGame(code, creatorId) {
    const { rows } = await pool.query(
        `insert into game (creator_id, code)
         values ($1, $2)
         returning *`,
        [creatorId, code]
    )
    return rows[0].id
}

// check si la game avec un code X existe, sinon retourne undefined
export async function findGameByCode(code) {
    const {rows} = await pool.query('select * from game where code = $1', [code])
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

