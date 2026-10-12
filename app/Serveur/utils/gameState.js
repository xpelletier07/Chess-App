import { Chess } from 'chess.js'

export function getColor(game, userId) {
    if (Number(game.creator_id) === Number(userId)) return 'w'
    if (Number(game.joiner_id) === Number(userId)) return 'b'
    return null // spectateur
}

export function toState(game, userId) {
    const chess = new Chess()
    if (game.pgn) chess.loadPgn(game.pgn)

    const moves = chess.history({ verbose: true })
    const last = moves.at(-1)

    return {
        code: game.code,
        fen: game.fen,
        turn: chess.turn(),
        state: game.state,
        result: game.result,
        winnerId: game.last_winner_id ?? null,
        endedBy: game.last_ended_by ?? null,
        color: getColor(game, userId),
        history: moves.map((m) => m.san),
        lastMove: last ? { from: last.from, to: last.to } : null,
        version: game.move_count
    }
}