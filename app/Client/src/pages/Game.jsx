import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Forfeit from "../components/forfeit.jsx"
import { API_BASE_URL } from "../config"
import { useAuth } from "../auth/AuthContext"

export default function Game() {
    const { code } = useParams()
    const { token, user } = useAuth()
    const [gameResult, setGameResult] = useState(null)
    const [gameStatus, setGameStatus] = useState(null)
    const [savingResult, setSavingResult] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true

        async function loadGameStatus() {
            try {
                const response = await fetch(`${API_BASE_URL}/games/${code}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || "Impossible de récupérer la partie")
                if (active) setGameStatus(data.game)
            } catch (requestError) {
                if (active) setError(requestError.message)
            }
        }

        loadGameStatus()
        if (gameStatus?.state === "finished") return () => { active = false }

        const interval = setInterval(loadGameStatus, 2000)
        return () => {
            active = false
            clearInterval(interval)
        }
    }, [code, token, gameStatus?.state])

    useEffect(() => {
        if (!gameStatus || gameStatus.state !== "finished" || gameResult) return

        const isWinner = Number(gameStatus.last_winner_id) === Number(user?.id)
        setGameResult({
            message: isWinner
                ? "Victoire ! Votre adversaire a abandonné la partie."
                : "La partie a été enregistrée comme un abandon.",
            isWinner
        })
    }, [gameStatus, gameResult, user])

    async function forfeit() {
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
            setGameResult(data)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setSavingResult(false)
        }
    }

    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <section className="box">
                        <h1 className="title is-2">Partie en cours</h1>
                        <p className="subtitle is-5">La partie {code} est prête.</p>
                        <div className="notification is-info is-light">
                            L'échiquier sera disponible ici.
                        </div>
                        {error && <div className="notification is-danger is-light">{error}</div>}
                        <Forfeit onForfeit={forfeit} disabled={savingResult || Boolean(gameResult)} />
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
                            <p className="is-size-7 mt-3">L'abandon a été enregistré dans l'historique.</p>
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
