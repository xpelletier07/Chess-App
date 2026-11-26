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
        if (token !== undefined) {
            const payload = jwt.verify(token, process.env.JWT_SECRET)
            if (!payload) return next(new Error('Jeton invalide.'))
            socket.data.user = payload
        }
        next();
    });

    // fonction de base qui gère tous les événements, mettre vos autres fonctions/évenements plus bas 
    io.on("connection", (socket) => {
        // pour tests & debugging
        console.log(`utilisateur ${socket.data.user.id} connecté`)
        socket.on("game:join", async ({ code }, ack) => {
            try {
                //
                const game = await repository.getDetailsGameByCode(code)
                if (!game) {
                    return ack({
                        ok: false, error: "Partie introuvable"
                    })
                }

                // récupère la couleur (blancs ou noirs) pour la partie selon le user
                // doit peut être être changé plus tard pour permettre aux spectateurs? 
                const couleur = getColor(game, socket.data.user.id)
                if (!couleur) {
                    return ack({
                        ok: false, error: "Ce joueur n'est pas dans cette partie"
                    })
                }

                // rejoin la partie si tout est ok et retourne le ack
                socket.join(`game:${game.id}`)
                ack({
                    ok: true, state: toState(game, socket.data.user.id)
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