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

export async function findOrCreateGithubUser(githubId, githubLogin) {
    // Un identifiant GitHub déjà lié retrouve toujours le même compte Chess-App.
    const { rows: existingUsers } = await pool.query(
        "select id, username, email from users where github_id = $1",
        [githubId]
    )
    if (existingUsers[0]) return existingUsers[0]

    // Réutilise le nom GitHub comme nom d'utilisateur, en le limitant à la taille SQL autorisée.
    let username = githubLogin.slice(0, 50)
    const { rows: matchingUsers } = await pool.query(
        "select id from users where username = $1",
        [username]
    )
    if (matchingUsers[0]) {
        // Évite d'écraser le compte existant si ce nom d'utilisateur est déjà pris.
        const suffix = `-${githubId}`
        username = `${githubLogin.slice(0, 50 - suffix.length)}${suffix}`
    }

    // Les comptes OAuth peuvent ne pas avoir d'email public ni de mot de passe local.
    // ON CONFLICT évite de créer deux comptes si deux callbacks du même compte arrivent ensemble.
    const { rows } = await pool.query(
        `insert into users (username, github_id)
         values ($1, $2)
         on conflict (github_id) do update set github_id = excluded.github_id
         returning id, username, email`,
        [username, githubId]
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
