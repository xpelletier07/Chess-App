import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from '../config'
import { useState, useEffect} from "react";

function App() {
  // token vient du contexte : il est déjà null si la session a expiré
  const { user, token, logout } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null);
  const [games, setGames] = useState([]);
  const navigate = useNavigate()
  
  useEffect(() => {
    async function fetchGames() {
      try {
        const reponse = await fetch(`${API_BASE_URL}/games/allGames`, {
          method: 'GET',
        })
        const data = await reponse.json()
        if (reponse.ok) {
          setGames(data.games)
          console.log(data.games)
        }
      } catch (e) {
        setError(e.message)
      }
    }
    fetchGames();
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function join(event) {
    event.preventDefault();
    setError(null);

    const gameCode = code.trim();
    if (!gameCode) {
      setError('Veuillez entrer un code de partie.');
      return;
    }

    try {
      const reponse = await fetch(`${API_BASE_URL}/games/join/${gameCode}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await reponse.json();
      if (!reponse.ok) {
        setError(data.error || 'Impossible de rejoindre la partie.');
        return;
      }

      navigate(`/lobby/${data.game.code}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function create(event) {
    event.preventDefault()
    try {
      const reponse = await fetch(`${API_BASE_URL}/games/newGame`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await reponse.json()
      if (reponse.ok) {
        navigate(`/lobby/${data.game.code}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <main className="section">
      <div className="container">
        <nav className="level mb-6">
          <div className="level-left">
            <h1 className="title is-3 mb-0">
              Échec et App {token ? `| ${user?.nom_utilisateur}` : ''}
            </h1>
          </div>
          <div className="level-right">
            <div className="buttons">
              {token ? (
                <>
                  <Link className="button is-link is-light mr-2" to="/history">
                    <span className="icon"><i className="fas fa-history" /></span>
                    <span>Historique</span>
                  </Link>
                  {/* Point d'entrée vers le classement Elo depuis la page d'accueil. */}
                  <Link className="button is-link is-light mr-3" to="/classement">
                    Classement
                  </Link>
                  <button className="button is-danger is-light" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link className="button is-primary is-light" to="/login">
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </nav>

        {error && (
          <div className="notification is-danger is-light">{error}</div>
        )}

        {/* Deux choix exclusifs, côte à côte : on join OU on crée une partie. */}
        {token && (
          <div className="columns is-vcentered is-centered">
            <div className="column is-5">
              <section className="box">
                <h2 className="title is-4">Rejoindre une partie</h2>
                <p className="subtitle is-6">Vous avez reçu un code de partie ?</p>
                <form onSubmit={join}>
                  <div className="field">
                    <div className="control">
                      <input
                        className="input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Code de partie"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="control">
                    <button type="submit" className="button is-light is-primary">Rejoindre la partie</button>
                  </div>
                </form>
              </section>
            </div>

            <div className="column is-narrow has-text-centered">
              <span className="tag is-medium">ou</span>
            </div>

            <div className="column is-5">
              <section className="box">
                <h2 className="title is-4">Créer une nouvelle partie</h2>
                <p className="subtitle is-6">
                  Obtenir un code pour inviter un autre joueur de votre choix
                </p>
                <div className="control">
                  <button onClick={create} className="button is-light is-primary">
                    Obtenir son code
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        <section className="box mt-6">
          <h2 className="title is-4 mb-4">
            <span className="icon-text">
              <span className="icon has-text-danger"><i className="fas fa-circle fa-xs" /></span>
              <span>Parties en direct</span>
            </span>
          </h2>

          {games.length === 0 ? (
            <p className="has-text-grey has-text-centered py-5">
              Aucune partie en cours pour le moment.
            </p>
          ) : (
            <div className="columns is-multiline">
              {games.map((game) => {
                const isPlayer = user?.id === game.creator_id || user?.id === game.joiner_id
                return (
                  // le code est unique (la requête ne renvoie pas game.id)
                  <div key={game.code} className="column is-one-third-desktop is-half-tablet">
                    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <div className="card-content" style={{ flexGrow: 1 }}>
                        <div className="level is-mobile mb-3">
                          <div className="level-left">
                            <span className="tag is-light">#{game.code}</span>
                          </div>
                          <div className="level-right">
                            <span className="tag is-success is-light">{game.state}</span>
                          </div>
                        </div>

                        <p className="is-size-5 has-text-centered">
                          <span className="icon-text">
                            {/* far (regular) n'est pas gratuit pour les pièces : roi blanc = solid en gris clair */}
                            <span className="icon has-text-grey-lighter"><i className="fas fa-chess-king" /></span>
                            <strong>{game.creator_name}</strong>
                          </span>
                        </p>
                        <p className="has-text-grey is-size-7 has-text-centered my-1">VS</p>
                        <p className="is-size-5 has-text-centered">
                          <span className="icon-text">
                            <span className="icon"><i className="fas fa-chess-king" /></span>
                            <strong>{game.joiner_name || 'En attente'}</strong>
                          </span>
                        </p>
                      </div>

                      <footer className="card-footer">
                        <Link
                          to={`/game/${game.code}`}
                          className={`card-footer-item has-text-weight-semibold ${isPlayer ? 'has-text-success' : 'has-text-link'}`}
                        >
                          <span className="icon-text">
                            <span className="icon"><i className={`fas ${isPlayer ? 'fa-chess-board' : 'fa-eye'}`} /></span>
                            <span>{isPlayer ? 'Revenir à la partie' : 'Regarder'}</span>
                          </span>
                        </Link>
                      </footer>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
