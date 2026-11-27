import { Server } from "socket.io"
import * as repository from './repository/repository.js'
import jwt from "jsonwebtoken"
import { getColor, toState } from "./utils/gameState.js";

// initialise le serveur socket.io mais reste null tant que pas appellé
let io = null

// fonction qui vient ajouter socket.io au serveur express
export function attachRealtime(server) {
    io = new Server(server, {
        cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" }
    });

    // middleware pour vérifier le token du joueur
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        // si pas de token, on laisse passer mais on met user à null
        if (!token) {
            socket.data.user = null
            return next()
        }

        // jwt.verify LANCE une erreur si le token est invalide/expiré
        try {
            socket.data.user = jwt.verify(token, process.env.JWT_SECRET)
            next()
        } catch {
            next(new Error('Jeton invalide.'))
        }
    });

    // fonction de base qui gère tous les événements, mettre vos autres fonctions/évenements plus bas 
    io.on("connection", (socket) => {
        const userId = socket.data.user?.id ?? null
        console.log(`utilisateur ${userId ?? "invité"} connecté`)
        socket.on("game:join", async ({ code }, ack) => {
            if (typeof ack !== "function") return
            try {
                //
                const game = await repository.getDetailsGameByCode(code)
                if (!game) {
                    return ack({
                        ok: false, error: "Partie introuvable"
                    })
                }

                // récupère la couleur (blancs ou noirs) pour la partie selon le user
                // 'w', 'b' ou null (spectateur, connecté ou invité)
                const couleur = getColor(game, userId)
                const role = couleur ?? "spectator"
                // rejoin la partie si tout est ok et retourne le ack
                socket.join(`game:${game.id}`)
                ack({
                    ok: true, role, state: toState(game, userId)
                })
            }
            catch (error) {
                console.error("Erreur pendant game:join", error)
                ack({
                    ok: false, error: "Erreur serveur"
                })
            }
        })
    })

    return io;
}

// fonction pour s'assurer que socket.io a été initialisé
export function getIO() {
    if (!io) {
        throw new Error("Socket.IO n'est pas initialisé")
    }

    return io
}


export default attachRealtime