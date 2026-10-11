import * as repository from '../repository/repository.js'
import express from 'express'
import { checkAuth } from '../middlewares/checkAuth.js'

const router = express.Router()

// POST pour créer une nouvelle partie
router.post("/newGame", checkAuth, async (req, res) => {
    try {
        const code = String(Math.floor(100000 + Math.random() * 900000))
        await repository.createGame(code, req.user.id)
        return repository.findGameByCode(code)
    } catch {
        console.error("Erreur dans POST /game/newGame", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

// PUT pour join une partie
router.put("/join/:code", checkAuth, async (req, res) => {
    try {
        // bcp d'erreurs 409 CONFLICT => pas necessairement une mauvaise requête
        // mais entre en conflit avec les règles mértier
        const code = req.params.code
        const game = await repository.findGameByCode(code)
        const retour = await repository.joinGame(game.id, req.user.id)

        // comme un gros if | else if | .....
        switch (retour) {
            // si aucune erreur
            case 0:
                res.status(200).json({ message: "Connexion à la partie en cours..." })
            // si game est pas dans le lobby
            case 1:
                res.status(409).json({ error: "impossible de join une game en cours ou completée" })
            // si qqun veut join la game qu'il vient de créer lui meme
            case 2:
                res.status(409).json({ error: "Impossible de join la game que vous avez créé" })
            // si déjà 2 joueurs dans la partie
            case 3:
                res.status(409).json({ error: "Impossible de join la game, déjà deux joueurs de connectés" })
        }
    } catch {
        console.error("Erreur dans PUT /game/join/:code", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

// PUT pour changer l'état de la partie (lobby, en cours, finished)
router.put("/changeState/:code", checkAuth, async (req, res) => {
    try {
        // trouve la game selon le code, affecte le nouvel état, retourne rien donc 204
        const code = req.params.code
        const newState = req.body.newState
        const game = await repository.findGameByCode(code)
        await repository.changeGameState(newState, game)
        return res.status(204)
    } catch {
        console.error("Erreur dans PUT /game/changeState", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})
export default router