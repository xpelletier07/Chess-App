import * as repository from '../repository/repository.js'
import express from 'express'
import { checkAuth } from '../middlewares/checkAuth.js'

const router = express.Router()

// POST /game/:code/finish clôt une partie et ajoute son résultat à l'historique Elo après vérification du jeton.
router.post("/:code/finish", checkAuth, async (req, res) => {
    const { winnerId } = req.body ?? {}

    // Exige winnerId: null représente une nulle et un entier positif désigne le gagnant.
    if (
        !Object.hasOwn(req.body ?? {}, "winnerId") ||
        (winnerId !== null && (!Number.isInteger(winnerId) || winnerId <= 0))
    ) {
        return res.status(400).json({ error: "winnerId doit être l'identifiant d'un joueur ou null pour une nulle" })
    }

    try {
        // L'identité du déclarant provient du jeton vérifié, pas du corps envoyé.
        const result = await repository.finishGame(
            req.params.code,
            req.user.id,
            winnerId
        )
        // Le dépôt retourne des erreurs métier avec leur code HTTP adapté.
        if (result.error) {
            return res.status(result.status).json({ error: result.error })
        }
        return res.status(200).json(result)
    } catch (error) {
        console.error("Erreur dans POST /game/:code/finish", error)
        return res.status(500).json({ error: "Erreur serveur" })
    }
})

// POST pour créer une nouvelle partie
router.post("/newGame", checkAuth, async (req, res) => {
    try {
        const code = String(Math.floor(100000 + Math.random() * 900000))
        // Associe la partie au compte authentifié et renvoie l'objet nouvellement créé.
        const game = await repository.createGame(code, req.user.id)
        return res.status(201).json({ game })
    } catch (error) {
        console.error("Erreur dans POST /game/newGame", error)
        return res.status(500).json({ error: "Erreur serveur" })
    }
})

// POST pour join une partie
router.post("/join/:code", checkAuth, async (req, res) => {
    try {
        // Le dépôt valide l'état du lobby et empêche les arrivées concurrentes.
        const result = await repository.joinGame(req.params.code, req.user.id)
        if (result.error) {
            return res.status(result.status).json({ error: result.error })
        }
        return res.status(200).json(result)
    } catch (error) {
        console.error("Erreur dans POST /game/join", error)
        return res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router