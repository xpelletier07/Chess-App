import jwt from "jsonwebtoken"

// Vérifie qu'un token JWT valide est fourni avant de laisser passer la requête
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next() // Pas de token, on laisse passer mais req.user sera undefined
    }

    const token = authHeader.split(" ")[1]

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload
        next()
    } catch (error) {
        return res.status(401).json({ error: "Token invalide ou expiré" })
    }
}
