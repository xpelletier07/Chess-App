import { pool } from "./db.js"

export async function findUserByEmailOrUsername(email, username) {
    const { rows } = await pool.query(
        "select id from users where email = $1 or username = $2",
        [email, username]
    )
    return rows[0]
}

export async function createUser(username, email, passwordHash) {
    const { rows } = await pool.query(
        `insert into users (username, email, password)
         values ($1, $2, $3)
         returning id, username, email, created_at`,
        [username, email, passwordHash]
    )
    return rows[0]
}

export async function findUserByEmail(email) {
    const { rows } = await pool.query(
        "select id, username, email, password from users where email = $1",
        [email]
    )
    return rows[0]
}

export async function userEmailExists(email) {
    const { rows } = await pool.query(
        "select id from users where email = $1",
        [email]
    )
    return rows.length > 0
}
