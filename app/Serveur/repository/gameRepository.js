import { pool } from "./db.js"

// logique pour créer une nouvelle partie
export async function createGame(code, creatorId) {
    const { rows } = await pool.query(
        await repository.pool.query(`insert into game (creator_id, code) 
            values ($1, $2)`, [creatorId, code])
    )
    return rows[0].id
}

// check si la game avec un code X existe, sinon retourne undefined
export async function findGameByCode(code) {
    const { rows } = await pool.query('select * from game where code = $1', [code])
    return rows[0]
}

export async function joinGame(gameId, playerId) {
    const { rows } = await pool.query('select * from game where id = $1', [gameId])
    // si partie déjà en cours ou completée
    if (rows[0].state !== 'lobby') {
        // impossible de join une game en cours ou completée
        return 1
    }
    if (rows[0].creator_id === playerId) {
        // impossible de join la game que vous avez créé
        return 2
    }
    if (rows[0].joiner_id !== null) {
        // impossible de join la game si déjà 2 joueurs
        return 3
    }
    // si tout est ok, on mets l'id dans joiner_id.
    // Laisse en lobby pour laisser les joueurs confirmer quand lancer la partie
    await pool.query('update game set joiner_id = $1 where id = $2', [playerId, gameId])
    return 0
}

// changer l'état de la partie (lobby, en cours, finished)
export async function changeGameState(newState, gameId) {
    await pool.query('update game set state = $1 where id = $2', [newState, gameId])
}