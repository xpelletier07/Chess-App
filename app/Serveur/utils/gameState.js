import { Chess } from 'chess.js'
import { RECONNECT_WINDOW_SECONDS } from '../repository/gameRepository.js'

// Un joueur poll toutes les 2 s: au-delà de ce délai sans poll, il est considéré hors ligne
const ONLINE_THRESHOLD_SECONDS = 6

// Statut de l'adversaire vu par userId (null pour un spectateur).
// Les secondes sont calculées par la base de données, donc sans décalage d'horloge.
export function getOpponentStatus(game, userId) {
    const color = getColor(game, userId)
    if (!color) return null
    const isCreator = color === 'w'
    const name = isCreator ? game.joiner_username : game.creator_username
    const idle = Number((isCreator ? game.joiner_idle : game.creator_idle) ?? 0)
    const online = idle <= ONLINE_THRESHOLD_SECONDS
    return {
        name: name ?? null,
        online,
        // compte à rebours avant la fin de la partie; échéance = dernière présence + 60 s
        secondsLeft: online ? null : Math.max(0, Math.ceil(RECONNECT_WINDOW_SECONDS - idle))
    }
}

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