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

export async function joinGame(code, playerId) {
    // premier check pour voir si la game existe
    const check = findGameByCode(code)
    if (check == undefined){
        // retours d'erreurs avec valeurs spécifiques 
        // qu'on va utiliser dans les routes pour afficher les bonnes erreurs
        return 1
    }
    // si partie déjà en cours ou completée
    if (check[0].state !== 'lobby'){
        // impossible de join une game en cours ou completée
        return 2
    }
    if (check[0].creator_id === playerId){
        // impossible de join la game que vous avez créé
        return 3
    }
    if (check[0].joiner_id !== null){
        // impossible de join la game si déjà 2 joueurs
        return 4
    }
    return 0
}