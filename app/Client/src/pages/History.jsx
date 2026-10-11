import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './History.css'

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function getResultClass(result) {
  if (result === 'Victoire') return 'is-success'
  if (result === 'Défaite') return 'is-danger'
  return 'is-warning'
}

function getPlayerName(name, id) {
  return name || (id ? `Joueur #${id}` : 'Joueur non identifié')
}

function isWinner(game, playerId) {
  return game.winner_id != null && String(game.winner_id) === String(playerId)
}

export default function History() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/games/history`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Impossible de charger l’historique')
        }

        setGames(data.games || [])
      } catch (requestError) {
        setError(requestError.message || 'Impossible de contacter le serveur')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <main className="history-page section">
      <div className="container">
        <div className="history-header">
          <div>
            <p className="history-eyebrow">Échec et app</p>
            <h1 className="title is-2">Historique des parties</h1>
            <p className="subtitle is-6">Retrouvez toutes les parties terminées.</p>
          </div>
          <Link className="button is-light" to="/">
            <span className="icon"><i className="fas fa-arrow-left" /></span>
            <span>Accueil</span>
          </Link>
        </div>

        {loading && <p className="has-text-centered">Chargement de l’historique...</p>}
        {error && <div className="notification is-danger is-light">{error}</div>}

        {!loading && !error && games.length === 0 && (
          <div className="history-empty box has-text-centered">
            <span className="icon is-large"><i className="fas fa-chess-board fa-2x" /></span>
            <h2 className="title is-4">Aucune partie terminée</h2>
            <p>Vos prochaines parties apparaîtront ici.</p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="history-grid">
            {games.map((game) => (
              <article className="history-card box" key={game.id}>
                <div className="history-card-top">
                  <span className="history-game-number">Partie #{game.id}</span>
                  <span className={`tag ${getResultClass(game.result)}`}>{game.result}</span>
                </div>
                <p className="history-date">{formatDate(game.created_at)}</p>
                <div className="history-players" aria-label="Joueurs de la partie">
                  <div className="history-player">
                    <span className="history-player-color history-player-color-light" aria-hidden="true" />
                    <span className="history-player-name">{getPlayerName(game.player1_name, game.player1_id)}</span>
                    {isWinner(game, game.player1_id) && (
                      <span className="history-winner"><i className="fas fa-trophy" aria-hidden="true" /> Gagnant</span>
                    )}
                  </div>
                  <span className="history-versus" aria-hidden="true">VS</span>
                  <div className="history-player history-player-right">
                    <span className="history-player-name">{getPlayerName(game.player2_name, game.player2_id)}</span>
                    {isWinner(game, game.player2_id) && (
                      <span className="history-winner"><i className="fas fa-trophy" aria-hidden="true" /> Gagnant</span>
                    )}
                    <span className="history-player-color history-player-color-dark" aria-hidden="true" />
                  </div>
                </div>
                <div className="history-detail">
                  <span>Fin de partie</span>
                  <strong>{game.ended_by}</strong>
                </div>
                <span className="history-link">Partie terminée</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}