import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Chess } from 'chess.js'
import { Chessboard } from "react-chessboard";
import { API_BASE_URL } from "../config.js";

async function api(path, method = "GET", body) {
	const res = await fetch(API_BASE_URL + path, {
		method,
		credentials: "include", // si ton auth est en JWT dans un header, remplace par Authorization
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error || "Request failed");
	return data;
}

export default function Game() {
	const { code } = useParams();
	const [state, setState] = useState(null);
	const [error, setError] = useState("");
	const versionRef = useRef(null); // dernière version reçue du serveur
	const pendingRef = useRef(false); // true pendant qu'un coup est envoyé

	// applique la réponse du serveur (ignore les réponses { changed: false })
	const apply = useCallback((data) => {
		if (data.changed === false) return;
		versionRef.current = data.version;
		setState(data);
	}, []);

	const poll = useCallback(async () => {
		// pendant l'envoi d'un coup on ne poll pas, sinon l'ancien état écraserait le coup affiché
		if (pendingRef.current) return;
		try {
			const since = versionRef.current;
			const data = await api(
				`/games/${code}${since !== null ? `?since=${since}` : ""}`,
			);
			if (!pendingRef.current) apply(data);
			setError("");
		} catch (e) {
			setError(e.message);
		}
	}, [code, apply]);

	// poll toutes les secondes, on s'arrête quand la partie est finie
	useEffect(() => {
		if (state?.state === "finished") return;
		poll();
		const timer = setInterval(poll, 1000);
		return () => clearInterval(timer);
	}, [poll, state?.state]);

	function onPieceDrop({ sourceSquare, targetSquare }) {
		// targetSquare est null si la pièce est lâchée hors du plateau
		if (!targetSquare || !state) return false;
		if (state.state !== "en_cours") return false;
		if (state.turn !== state.color) return false; // pas ton tour (ou spectateur)

		// on vérifie la légalité en local pour que la pièce revienne tout de suite si illégal
		const local = new Chess(state.fen);
		try {
			local.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
		} catch {
			return false;
		}

		// mise à jour optimiste, puis confirmation du serveur
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
				versionRef.current = null; // force une resynchronisation complète
			})
			.finally(() => {
				pendingRef.current = false;
				poll();
			});

		return true;
	}

	if (!state) return <p>{error || "Chargement..."}</p>;

	let message;
	if (state.state === "lobby") {
		message = `En attente d'un adversaire... code : ${state.code}`;
	} else if (state.state === "finished") {
		message =
			state.result === "draw"
				? "Partie nulle."
				: `Partie terminée : les ${state.result === "white" ? "blancs" : "noirs"} gagnent.`;
	} else {
		message = state.turn === state.color ? "À toi de jouer" : "Tour de l'adversaire";
	}

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

	return (
		<div style={{ maxWidth: "600px", margin: "0 auto" }}>
			<h2>Partie {state.code}</h2>
			<p>
				{state.color
					? `Tu joues les ${state.color === "w" ? "blancs" : "noirs"}. `
					: "Spectateur. "}
				{message}
			</p>
			{error && <p style={{ color: "red" }}>{error}</p>}

			<Chessboard options={chessboardOptions} />

			<ol style={{ marginTop: "10px" }}>
				{Array.from({ length: Math.ceil(state.history.length / 2) }, (_, i) => (
					<li key={i}>
						{state.history[2 * i]} {state.history[2 * i + 1] ?? ""}
					</li>
				))}
			</ol>
		</div>
	);
}