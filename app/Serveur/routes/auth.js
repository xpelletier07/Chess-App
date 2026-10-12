import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { randomBytes, timingSafeEqual } from "node:crypto"
import * as repository from "../repository/repository.js"

const router = express.Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GITHUB_STATE_COOKIE = "github_oauth_state"

// Construit les URL de retour vers le client avec une adresse configurable pour le déploiement.
function getClientUrl(path) {
    return new URL(path, process.env.CLIENT_URL || "http://localhost:5173")
}

// Renvoie vers la connexion avec un code d'erreur que l'interface peut traduire.
function redirectToLogin(res, error) {
    const url = getClientUrl("/login")
    url.searchParams.set("oauth_error", error)
    res.redirect(url.href)
}

// Supprime le cookie à usage unique après la vérification, qu'elle réussisse ou non.
function clearGithubStateCookie(res) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
    res.setHeader(
        "Set-Cookie",
        `${GITHUB_STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/auth/github/callback; Max-Age=0${secure}`
    )
}

// Lit le cookie OAuth sans dépendance additionnelle; le nom du cookie est fourni par le serveur.
function readCookie(req, name) {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) return null

    const cookie = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`))
    return cookie ? cookie.slice(name.length + 1) : null
}

// Émet le même JWT de session que celui utilisé par la connexion classique.
function createAuthToken(user) {
    return jwt.sign(
        {
            id: user.id,
            nom_utilisateur: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    )
}

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

        const token = createAuthToken(user)

        res.status(200).json({
            token,
            user: { id: user.id, nom_utilisateur: user.username, email: user.email }
        })
    } catch (error) {
        console.error("Erreur dans /auth/login", error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

// Étape de départ OAuth : crée un state secret, le place dans un cookie et redirige vers GitHub.
router.get("/github", (req, res) => {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return redirectToLogin(res, "github_not_configured")
    }

    // 32 octets aléatoires empêchent un tiers de fabriquer un retour OAuth correspondant.
    const state = randomBytes(32).toString("hex")
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
    res.setHeader(
        "Set-Cookie",
        `${GITHUB_STATE_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/auth/github/callback; Max-Age=600${secure}`
    )

    // Aucun scope n'est demandé : l'identifiant et le nom publics suffisent à créer le compte.
    const authorizationUrl = new URL("https://github.com/login/oauth/authorize")
    authorizationUrl.searchParams.set("client_id", GITHUB_CLIENT_ID)
    authorizationUrl.searchParams.set(
        "redirect_uri",
        process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/github/callback"
    )
    authorizationUrl.searchParams.set("state", state)
    res.redirect(authorizationUrl.href)
})

// Étapes de retour OAuth : vérifie state, échange le code et récupère l'identité GitHub.
router.get("/github/callback", async (req, res) => {
    const { code, state, error: providerError } = req.query
    const savedState = readCookie(req, GITHUB_STATE_COOKIE)
    clearGithubStateCookie(res)

    // Comparaison à temps constant après vérification des longueurs pour limiter les fuites temporelles.
    const stateMatches = typeof state === "string" &&
        typeof savedState === "string" &&
        Buffer.byteLength(state) === Buffer.byteLength(savedState) &&
        timingSafeEqual(Buffer.from(state), Buffer.from(savedState))

    if (!stateMatches) return redirectToLogin(res, "invalid_state")
    if (providerError) return redirectToLogin(res, "access_denied")
    if (typeof code !== "string" || !code) return redirectToLogin(res, "invalid_code")

    try {
        // Le secret reste sur le serveur : le navigateur ne reçoit jamais le jeton GitHub.
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Chess-App"
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL ||
                    "http://localhost:3000/auth/github/callback"
            })
        })
        const tokenData = await tokenResponse.json()
        if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
            throw new Error("GitHub n'a pas accepté le code OAuth.")
        }

        // Utilise le jeton GitHub uniquement pour obtenir le profil de l'utilisateur authentifié.
        const profileResponse = await fetch("https://api.github.com/user", {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${tokenData.access_token}`,
                "User-Agent": "Chess-App"
            }
        })
        const profile = await profileResponse.json()
        if (
            !profileResponse.ok ||
            !Number.isSafeInteger(profile.id) ||
            typeof profile.login !== "string" ||
            !profile.login.trim()
        ) {
            throw new Error("GitHub a retourné un profil invalide.")
        }

        // Retrouve ou crée le compte local à partir de l'identifiant GitHub stable.
        const user = await repository.findOrCreateGithubUser(
            String(profile.id),
            profile.login.trim()
        )
        const token = createAuthToken(user)
        const callbackUrl = getClientUrl("/auth/github/callback")
        // Le fragment n'est pas transmis au serveur web; la page de callback l'efface après lecture.
        callbackUrl.hash = new URLSearchParams({ token }).toString()
        res.redirect(callbackUrl.href)
    } catch (error) {
        // Journalise le détail côté serveur et n'expose au navigateur qu'un message générique.
        console.error("Erreur dans /auth/github/callback", error)
        redirectToLogin(res, "oauth_failed")
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
