import { pool } from "./db.js"

// logique pour créer une nouvelle partie
export async function createGame(code, creatorId) {
    const { rows } = await pool.query(
        await repository.pool.query(`insert into game (creator_id, code) 
            values ($1, $2) returning *`, [creatorId, code])
    )
    return rows[0].id
}

// check si la game avec un code X existe, sinon retourne undefined
export async function findGameByCode(code) {
    const {rows} = await pool.query('select * from game where code = $1', [code])
    return rows[0]
}

