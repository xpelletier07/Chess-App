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

