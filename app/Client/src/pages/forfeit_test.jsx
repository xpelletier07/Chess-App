import { useState } from "react";
import Forfeit from "../components/forfeit.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [gameResult, setGameResult] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [saveError, setSaveError] = useState("");

  const finishGame = async ({ result, endedBy, winnerId = null }) => {
    if (gameResult || savingResult) return;

    setSavingResult(true);
    setSaveError("");

    try {
      const response = await fetch(`${API_URL}/api/games/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, endedBy, winnerId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Impossible d'enregistrer la partie.");
      setGameResult(data.game);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSavingResult(false);
    }
  };

  return (
    <main className="section">
      <div className="container">
        <h1 className="title has-text-centered">Échec et app</h1>
        <div className="has-text-centered">
          <Forfeit
            onForfeit={() => finishGame({ result: "Abandon", endedBy: "forfeit" })}
            disabled={Boolean(gameResult) || savingResult}
          />
          <button
            className="button is-link ml-2"
            type="button"
            onClick={() => finishGame({ result: "Victoire", endedBy: "checkmate" })}
            disabled={Boolean(gameResult) || savingResult}
          >
            Simuler la fin de partie
          </button>
        </div>
        {savingResult && <p className="has-text-centered mt-4">Enregistrement du résultat...</p>}
        {saveError && <p className="notification is-danger mt-4">{saveError}</p>}
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
              <p className="is-size-7 mt-3">Résultat enregistré dans la base de données.</p>
            </section>
            <footer className="modal-card-foot">
              <button className="button" type="button" onClick={() => setGameResult(null)}>Fermer</button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
