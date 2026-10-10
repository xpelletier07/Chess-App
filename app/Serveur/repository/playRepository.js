import { pool } from "./db.js"

// sauvegarde le pgn, le fen et le résultat après un coup, et incrémente move_count
export async function saveMove(gameId, pgn, fen, result) {
    await pool.query(`update game_details
        set pgn = $2, fen = $3, result = $4, move_count = move_count + 1
        where game_id = $1`, [gameId, pgn, fen, result])
}

// change l'état de la game ('lobby' | 'en_cours' | 'finished')
export async function setGameState(gameId, state) {
    await pool.query('update game set state = $2 where id = $1', [gameId, state])
}