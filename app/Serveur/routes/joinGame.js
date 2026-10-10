import * as repository from '../repository/repository.js'
import express from 'express'

const router = express.Router()

// POST pour créer une nouvelle partie
router.post("/newGame", async (req, res) => {
    try {
        // ***************** TODO *****************
        // à changer pour que le creatorId soit prit du token
        const code = String(Math.floor(100000 + Math.random() * 900000))
        await repository.createGame(code, creatorId)
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
        // premier check pour voir si la game existe 
        const rows = await repository.pool.query('select * from game where code = $1', [code])
        // erreur si on essaye de join la game qui n'est plus dans le lobby, aka game en cours ou game finie
        if (rows[0].state !== "lobby") {
            res.status(409).json({ error: "impossible de join une game en cours ou completée" })
        }
        // erreur si qqun veut join la game qu'il vient de créer lui meme
        if (rows[0].creator_id === playerId) {
            res.status(409).json({ error: "Impossible de join la game que vous avez créé" })
        }
        if (rows[0].joiner_id !== null) {
            res.status(409).json({ error: "Impossible de join la game, déjà deux joueurs de connectés" })
        }
    }
    catch {
        console.error("Erreur dans POST /game/join", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router