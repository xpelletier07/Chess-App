import express from 'express'
import {Chess} from 'chess.js'
import * as repository from '../repository/rewpository.js'
import checkAuth from '../middlewares/checkAuth.js'
import {toState, getColor} from '../utils/gameState.js'

const router = express.Router()
router.use(checkAuth)

// GET /games/:code?since=<version> : le client poll pour voir si l'adversaire a joué
router.get('/:code', async (req, res) => {
    const {code} = req.params
    const {since} = req.query
    try {
        const game = await repository.findGameByCode(code)
        if (!game) return res.status(404).json({error: 'Partie introuvable'})

        const state = toState(game, req.user.id)
        if (since !== undefined && Number(since) === state.version) {
            return res.json({changed: false})
        }
        res.json({changed: true, ...state})
    } catch (err) {
        console.error(err)
        res.status(500).json({error: 'Server error'})
    }
})

// POST /games/:code/move : valide le coup avec chess.js puis le stocke
router.post('/:code/move', async (req, res) => {
    const {code} = req.params
    const {from, to, promotion} = req.body
    const userId = req.user.id
    try {
        const game = await repository.findGameByCode(code)
        if (!game) return res.status(404).json({error: 'Partie introuvable'})

        const color = getColor(game, userId)
        if (!color) return res.status(403).json({error: "Tu ne joues pas dans cette partie"})
        if (game.state !== 'en_cours') return res.status(409).json({error: 'Partie non active'})

        // on recharge la partie depuis le pgn
        const chess = new Chess()
        if (game.pgn) chess.loadPgn(game.pgn)
        if (chess.turn() !== color) return res.status(409).json({error: "Ce n'est pas ton tour"})

        // chess.js lance une erreur si le coup est illégal
        try {
            chess.move({from, to, promotion: promotion || 'q'})
        } catch {
            return res.status(400).json({error: 'Coup illégal'})
        }

        // fin de partie : mat ou nulle
        let result = null
        if (chess.isGameOver()) {
            result = chess.isCheckmate() ? (color === 'w' ? 'white' : 'black') : 'draw'
        }

        await repository.saveMove(game.id, chess.pgn(), chess.fen(), result)
        if (result) await repository.setGameState(game.id, 'finished')

        const fresh = await repository.findGameByCode(code)
        res.json({changed: true, ...toState(fresh, userId)})
    } catch (err) {
        console.error(err)
        res.status(500).json({error: 'Server error'})
    }
})

export default router