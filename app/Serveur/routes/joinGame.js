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
    }
    catch {
        console.error("Erreur dans POST /game/newGame", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

// POST pour join une partie
router.post("/join/:code", async (req, res) => {
    try {
        // bcp d'erreurs 409 CONFLICT => pas necessairement une mauvaise requête
        // mais entre en conflit avec les règles mértier
        const code = req.params.code
        const retour = await repository.joinGame(code, req.user.id)

        // comme un gros if/else if/else if
        switch (retour) {
            // si aucune erreur
            case 0:
                res.status(200).json({ message: "Connexion à la partie en cours..." })
            // si game pas trouvée
            case 1:
                res.status(404).json({ error: "Code de partie invalide, partie non trouvée" })
            // si game est pas dans le lobby
            case 2:
                res.status(409).json({ error: "impossible de join une game en cours ou completée" })
            // si qqun veut join la game qu'il vient de créer lui meme
            case 3:
                res.status(409).json({ error: "Impossible de join la game que vous avez créé" })
            // si déjà 2 joueurs dans la partie
            case 4:
                res.status(409).json({ error: "Impossible de join la game, déjà deux joueurs de connectés" })
        }
    }
    catch {
        console.error("Erreur dans POST /game/join", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router