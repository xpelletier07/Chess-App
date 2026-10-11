import express from "express"
import gameRouter from "./joinGame.js"
import authRouter from "./auth.js"
import rankingRouter from "./ranking.js"

/* sert un peu de barrel export aussi, ajouter vos routeurs en haut en imports
   et donnez un nom à votre racine de routes en bas. Rien besoin de faire d'autre.*/

const apiRouter = express.Router()

apiRouter.use("/game", gameRouter)
apiRouter.use("/auth", authRouter)
// API consommée par la page de classement.
apiRouter.use("/ranking", rankingRouter)

export default apiRouter