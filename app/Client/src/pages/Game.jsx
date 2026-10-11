import { useEffect, useState, useRef, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import Forfeit from "../components/forfeit.jsx"
import { API_BASE_URL } from "../config"
import { useAuth } from "../auth/AuthContext"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"

export default function Game() {
    const { code } = useParams()
    const { token, user } = useAuth()
    const [gameResult, setGameResult] = useState(null)
    const [gameStatus, setGameStatus] = useState(null)
    const [savingResult, setSavingResult] = useState(false)
    const [error, setError] = useState("")
	const [state, setState] = useState(null);
	const versionRef = useRef(null); // dernière version reçue du serveur
	const pendingRef = useRef(false); // true pendant qu'un coup est envoyé

	const apply = useCallback((data) => {
		if (data.changed === false) return;
		versionRef.current = data.version;
		setState(data);
	}, []);

	const api = useCallback(async (path, method = "GET", body) => {
    const res = await fetch(API_BASE_URL + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Request failed")
    return data
}, [token])

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

	const poll = useCallback(async () => {
		// pendant l'envoi d'un coup on ne poll pas, sinon l'ancien état écraserait le coup affiché
		if (pendingRef.current) return;
		try {
			const since = versionRef.current;
			const data = await api(
				`/games/details/${code}${since !== null ? `?since=${since}` : ""}`,
			);
			console.log(data);
			if (!pendingRef.current) apply(data);
			setError("");
		} catch (e) {
			setError(e.message);
		}
	}, [code, apply]);

	useEffect(() => {
		if (gameStatus?.state === "finished") return;
		poll();
		const timer = setInterval(poll, 2000);
		return () => clearInterval(timer);
	}, [poll, gameStatus?.state]);

	function onPieceDrop({ sourceSquare, targetSquare }) {
		// targetSquare est null si la pièce est lâchée hors du plateau
		if (!targetSquare || !state) return false;
		if (gameStatus?.state !== "en cours") return false;
		if (state.turn !== state.color) return false; // pas ton tour (ou spectateur)

		// on vérifie la légalité en local pour que la pièce revienne tout de suite si illégal
		const local = new Chess(state.fen);
		try {
			local.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
		} catch {
			return false;
		}

		pendingRef.current = true;
		setState({ ...state, fen: local.fen(), turn: local.turn() });

		api(`/games/${code}/move`, "POST", {
			from: sourceSquare,
			to: targetSquare,
			promotion: "q",
		})
			.then(apply)
			.catch((e) => {
				setError(e.message);
				versionRef.current = null; 
			})
			.finally(() => {
				pendingRef.current = false;
				poll();
			});

		return true;
	}

	if (!state) return <p>{error || "Chargement..."}</p>

	const highlight = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
	const squareStyles = state.lastMove
		? { [state.lastMove.from]: highlight, [state.lastMove.to]: highlight }
		: {};

	const chessboardOptions = {
		position: state.fen,
		onPieceDrop,
		boardOrientation: state.color === "b" ? "black" : "white",
		squareStyles,
		id: "main-board",
	};
	
	let message = state.turn === state.color ? "À toi de jouer" : "Tour de l'adversaire";

    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <section className="box">
                        <h1 className="title is-2">Partie en cours</h1>
                        <p className="subtitle is-5">La partie {code} est prête.</p>
                        <div className="notification is-info is-light">
                            {state.color
								? `Tu joues les ${state.color === "w" ? "blancs" : "noirs"}. `
								: "Spectateur. "}
							{message}
                        </div>

						<div className="mb-4" style={{ maxWidth: "800px", margin: "0 auto" }}>
							<Chessboard options={chessboardOptions} />
						</div>

						<ol style={{ marginTop: "10px" }}>
							{Array.from({ length: Math.ceil(state.history.length / 2) }, (_, i) => (
								<li key={i}>
									{state.history[2 * i]} {state.history[2 * i + 1] ?? ""}
								</li>
							))}
						</ol>

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
