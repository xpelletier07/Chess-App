import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { API_BASE_URL } from "../config"
import { useAuth } from "../auth/AuthContext"

export default function Lobby() {
    const { code } = useParams()
    const token = localStorage.getItem("token")
    const { user } = useAuth()
    const navigate = useNavigate()
    const [game, setGame] = useState(null)
    const [error, setError] = useState(null)
    const [starting, setStarting] = useState(false)

    useEffect(() => {
        let active = true

        async function loadGame() {
            try {
                const response = await fetch(`${API_BASE_URL}/games/${code}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.error || "Impossible de récupérer la partie")
                }
                if (active) {
                    setGame(data.game)
                    setError(null)
                }
            } catch (requestError) {
                if (active) setError(requestError.message)
            }
        }

        loadGame()
        const interval = setInterval(loadGame, 2000)
        return () => {
            active = false
            clearInterval(interval)
        }
    }, [code, token])

    useEffect(() => {
        if (game?.state === "en cours") {
            navigate(`/game/${code}`, { replace: true })
        }
    }, [code, game?.state, navigate])

    async function startGame(event) {
        event.preventDefault()
        setStarting(true)
        try {
            const response = await fetch(`${API_BASE_URL}/games/${code}/start`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.error || "Impossible de démarrer la partie")
                return
            }
            setGame((currentGame) => ({ ...currentGame, ...data.game }))
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setStarting(false)
        }
    }

    const isCreator = game && Number(game.creator_id) === Number(user?.id)
    const hasOpponent = game?.joiner_id !== null && game?.joiner_id !== undefined

    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <div className="columns is-centered">
                        <div className="column is-half">
                            <section className="box">
                                <h1 className="title is-2">Salon d'attente</h1>
                                <p className="subtitle is-5 mb-5">
                                    Partagez ce code avec l'autre joueur
                                </p>
                                <div className="notification is-link is-light">
                                    <p className="heading">Code de partie</p>
                                    <p className="title is-1">{code}</p>
                                </div>
                                {error && <div className="notification is-danger is-light">{error}</div>}
                                <div className="content has-text-left">
                                    <p><strong>Créateur :</strong> {game?.creator_username || "..."}</p>
                                    <p><strong>Adversaire :</strong> {game?.joiner_username || "En attente..."}</p>
                                </div>
                                {!hasOpponent && <progress className="progress is-link" />}
                                <p className="has-text-grey">
                                    {!hasOpponent
                                        ? "En attente de l'autre joueur..."
                                        : game?.state === "lobby"
                                            ? isCreator ? "La salle est complète." : "En attente du démarrage par le créateur..."
                                            : "La partie est commencée."}
                                </p>
                                {isCreator && game?.state === "lobby" && (
                                    <button
                                        className="button is-primary mt-4"
                                        onClick={startGame}
                                        disabled={!hasOpponent || starting}
                                    >
                                        {starting ? "Démarrage..." : "Commencer la partie"}
                                    </button>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
