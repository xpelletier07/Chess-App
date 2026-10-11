import express from "express"
import { getLeaderboard } from "../repository/rankingRepository.js"

const router = express.Router()

// GET /ranking est appelé par le client lorsqu'il ouvre ou actualise la page.
router.get("/", async (req, res) => {
    try {
        // Le dépôt renvoie déjà les joueurs triés avec leur Elo et leur rang calculés.
        const players = await getLeaderboard()
        res.json({ players })
    } catch (error) {
        // Consigne l'erreur côté serveur sans renvoyer de détails internes au client.
        console.error("Erreur dans GET /ranking", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router
