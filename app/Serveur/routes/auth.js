import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import * as repository from "../repository/repository.js"

const router = express.Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post("/signup", async (req, res) => {
    const { nom_utilisateur, email, password } = req.body ?? {}

    if (
        typeof nom_utilisateur !== "string" || !nom_utilisateur.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password
    ) {
        return res.status(400).json({ error: "Nom d'utilisateur, email et mot de passe requis" })
    }

    const username = nom_utilisateur.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: "Format d'email invalide" })
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" })
    }
    try {
        const existing = await repository.findUserByEmailOrUsername(normalizedEmail, username)
        if (existing) {
            return res.status(409).json({ error: "Email ou nom d'utilisateur déjà utilisé" })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await repository.createUser(username, normalizedEmail, passwordHash)

        res.status(201).json({
            user: {
                id: user.id,
                nom_utilisateur: user.username,
                email: user.email,
                cree_le: user.created_at
            }
        })
    } catch (error) {
        // 23505 = violation de contrainte UNIQUE (ex. race condition entre le check et l'insert)
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email ou nom d'utilisateur déjà utilisé" })
        }
        console.error("Erreur dans /auth/signup", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body ?? {}

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" })
    }

    try {
        const user = await repository.findUserByEmail(email.trim().toLowerCase())

        // Même message d'erreur peu importe la cause, pour ne pas révéler si l'email existe
        if (!user) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" })
        }

        const motDePasseValide = await bcrypt.compare(password, user.password)

        if (!motDePasseValide) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" })
        }

        const token = jwt.sign(
            { id: user.id, nom_utilisateur: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )

        res.status(200).json({
            token,
            user: { id: user.id, nom_utilisateur: user.username, email: user.email }
        })
    } catch (error) {
        console.error("Erreur dans /auth/login", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

router.post("/check-email", async (req, res) => {
    const { email } = req.body ?? {}

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email requis" })
    }

    try {
        const exists = await repository.userEmailExists(email.trim().toLowerCase())
        res.status(200).json({ exists })
    } catch (error) {
        console.error("Erreur dans /auth/check-email", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router
