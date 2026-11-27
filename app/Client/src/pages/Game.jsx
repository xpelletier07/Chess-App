import { useEffect, useState, useRef, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import Forfeit from "../components/forfeit.jsx"
import { API_BASE_URL } from "../config"
import { useAuth } from "../auth/AuthContext"
import { io } from 'socket.io-client'

export default function Game() {
    const { code } = useParams()
    const { token, user } = useAuth()
    const [state, setState] = useState(null) // plateau + statut (/games/details/:code)
    const [gameResult, setGameResult] = useState(null)
    const [savingResult, setSavingResult] = useState(false)
    const [error, setError] = useState("")
    const versionRef = useRef(null)  // dernière version reçue du serveur
    const pendingRef = useRef(false) // true pendant qu'un coup est envoyé

    // récupère le game state du serveur et update le game state de l'utilisateur
    const applyServerState = useCallback((nextState) => {
        // si pas de changements
        if (!nextState || nextState.changed === false) return

        const nextVersion = Number(nextState.version)
        const currentVersion = versionRef.current
        // si l'utilisateur a une version plus récente (aka vient de faire un move), exit la fonction
        if (currentVersion !== null && nextVersion < Number(currentVersion)) {
            return
        }

        versionRef.current = nextVersion
        setState((currentState) => {
            if (!currentState) return nextState
            return { ...currentState, ...nextState }
        })
    }, [])

    // nouveau polling avec socket.io
    useEffect(() => {
        let active = true
        // début de partie        
        async function loadInitialState() {
            try {
                const response = await fetch(`${API_BASE_URL}/games/details/${code}`,
                    // si token, on l'envoie pour que le serveur puisse vérifier l'authentification
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                )
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Impossible de récupérer la partie")
                }
                // si socket.io tjrs actif, update le game state
                if (active) {
                    applyServerState(data)
                }
            } catch (error) {
                if (active) {
                    setError(error.message)
                }
            }
        }
        loadInitialState()

        // crée la connection websocket
        const socket = io(API_BASE_URL, {
            // si token, on l'envoie pour que le serveur puisse vérifier l'authentification
            auth: token ? { token } : {},
            autoConnect: false
        })

        // événement websocket
        socket.on("connect", () => {
            // lors du join
            socket.emit("game:join", { code }, (response) => {
                if (!active) return

                if (!response?.ok) {
                    setError(response?.error || "Impossible de rejoindre la partie")
                    return
                }

                setError("")
                applyServerState(response.state)
            })
        })

        // recevoir le game state
        socket.on("game:state", (nextState) => {
            if (!active) return
            setError("")
            applyServerState(nextState)
        })

        // si erreurs
        socket.on("connect_error", (error) => {
            if (active) {
                setError(error.message || "Connexion temps réel impossible")
            }
        })

        socket.connect()

        return () => {
            active = false
            socket.disconnect()
        }
    }, [code, token, applyServerState])


    /* 
    ancien polling, je le garde juste pour etre sur que si qqch plante on a le code encore     
    // un seul poll : plateau, statut de la partie et gagnant
        useEffect(() => {
            if (state?.state === "finished") return
            let active = true
    
            async function poll() {
                if (pendingRef.current) return
                try {
                    const since = versionRef.current
                    const response = await fetch(
                        `${API_BASE_URL}/games/details/${code}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    const data = await response.json()
                    if (!response.ok) throw new Error(data.error || "Impossible de récupérer la partie")
                    // on ignore la réponse si démonté ou si un coup est parti entre temps
                    if (!active || pendingRef.current || data.changed === false) return
                    versionRef.current = data.version
                    setState(data)
                } catch (e) {
                    if (active) setError(e.message)
                }
            }
    
            poll()
            const timer = setInterval(poll, 2000)
            return () => {
                active = false
                clearInterval(timer)
            }
        }, [code, token, state?.state]) 
    */

    // modal de fin de partie
    useEffect(() => {
        if (state?.state !== "finished" || gameResult) return
        
        const isWinner = Number(state.winnerId) === Number(user?.id)
        let message
        if (state.endedBy === "forfeit") {
            if (isSpectator) {
                message = `Les ${state.winnerColor === "w" ? "blancs" : "noirs"} ont gagné par abandon.`
            } else {
                message = isWinner ? "Victoire ! Votre adversaire a abandonné la partie." : "La partie a été enregistrée comme un abandon."
            }
        } else if (state.endedBy === "checkmate") {
            if (isSpectator) {
                message = `Les ${state.winnerColor === "w" ? "blancs" : "noirs"} ont gagné par échec et mat.`
            } else {
                message = isWinner ? "Victoire par échec et mat !" : "Défaite : échec et mat."
            }
        } else {
            message = "Partie nulle."
        }
        setGameResult({ message, isWinner, endedBy: state.endedBy })
    }, [state, gameResult, user])

    async function forfeit() {
        // si pas de couleur (spectateur), on ne fait rien
        if (!state?.color) return false
        if (savingResult || gameResult) return

        setSavingResult(true)
        setError("")
        try {
            const response = await fetch(`${API_BASE_URL}/games/${code}/forfeit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Impossible d'enregistrer l'abandon.")
            setGameResult({ ...data, endedBy: "forfeit" })
        } catch (e) {
            setError(e.message)
        } finally {
            setSavingResult(false)
        }
    }

    async function onPieceDrop({ sourceSquare, targetSquare }) {
        // si pas de couleur (spectateur), on ne fait rien
        if (!state?.color) return false
        if (!targetSquare || !state) return false
        if (state.state !== "en cours" || state.turn !== state.color) return false

        const move = { from: sourceSquare, to: targetSquare, promotion: "q" }

        // légalité vérifiée en local : la pièce revient tout de suite si le coup est illégal
        const local = new Chess(state.fen)
        try {
            local.move(move)
        } catch {
            return false
        }

        const previous = state
        pendingRef.current = true
        setState({ ...state, fen: local.fen(), turn: local.turn() })

        sendMove(move, previous)
        return true
    }

    async function sendMove(move, previous) {
        // si pas de couleur (spectateur), on ne fait rien
        if (!state?.color) return false
        try {
            const response = await fetch(`${API_BASE_URL}/games/${code}/move`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(move)
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Coup refusé")
            applyServerState(data)
        } catch (e) {
            setError(e.message)
            setState(previous)        // on annule le coup affiché
            versionRef.current = null // le prochain poll recharge tout
        } finally {
            pendingRef.current = false
        }
    }

    if (!state) return <p>{error || "Chargement..."}</p>
    const isSpectator = !state.color

    const highlight = { backgroundColor: "rgba(255, 255, 0, 0.4)" }
    const squareStyles = state.lastMove
        ? { [state.lastMove.from]: highlight, [state.lastMove.to]: highlight }
        : {}

    const chessboardOptions = {
        position: state.fen,
        allowDragging: !isSpectator,
        allowPremoves: !isSpectator,
        onPieceDrop,
        boardOrientation: state.color === "b" ? "black" : "white",
        squareStyles,
        id: "main-board",
    }

    const message = isSpectator
    ? `Trait aux ${state.turn === "w" ? "blancs" : "noirs"}`
    : state.turn === state.color ? "À toi de jouer" : "Tour de l'adversaire"

    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <section className="box">
                        <div style={{ position: "relative" }}>
                            { isSpectator && (
                                <Link to="/" className="button is-link is-light" style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }}>
                                    Retour à l'accueil
                                </Link>
                            )}
                            <h1 className="title is-2">Partie en cours</h1>
                            <p className="subtitle is-5">La partie {code} est prête.</p>
                        </div>
                        <div className="notification is-info is-light mt-4">
                            {state.color
                                ? `Tu joues les ${state.color === "w" ? "blancs" : "noirs"}. `
                                : "Spectateur. "}
                            {message}
                        </div>

                        <div className="columns is-centered">
                            <div className="column is-one-fifth has-text-right"></div>
                            <div className="column is-three-fifths has-text-centered">
                                <Chessboard options={chessboardOptions} />
                            </div>

                            <div className="column is-one-fifth has-text-left">
                                <ol className="ml-5">
                                    {Array.from({ length: Math.ceil(state.history.length / 2) }, (_, i) => (
                                        <li key={i}>
                                            {state.history[2 * i]} {state.history[2 * i + 1] ?? ""}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {error && <div className="notification is-danger is-light">{error}</div>}
                        {!isSpectator && <Forfeit onForfeit={forfeit} disabled={savingResult || Boolean(gameResult)} />}
                        {savingResult && <p className="mt-4">Enregistrement de l'abandon...</p>}
                    </section>
                </div>
            </div>

            {gameResult && (
                <div className="modal is-active" role="dialog" aria-modal="true" aria-labelledby="game-result-title">
                    <div className="modal-background" />
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title" id="game-result-title">Partie terminée</p>
                        </header>
                        <section className="modal-card-body">
                            <p>{gameResult.message}</p>
                            {gameResult.endedBy === "forfeit" && (
                                <p className="is-size-7 mt-3">L'abandon a été enregistré dans l'historique.</p>
                            )}
                        </section>
                        <footer className="modal-card-foot">
                            <Link className="button" to="/">Retour à l'accueil</Link>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    )
}