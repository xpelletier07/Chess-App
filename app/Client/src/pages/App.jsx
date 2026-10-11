import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from '../../config'
import { useState } from "react";

function App() {
  const { user, logout } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null);
  const navigate = useNavigate()
  // récupérer le token du local storage
  const token = localStorage.getItem("token")

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function join(event) {
    event.preventDefault();
    try {
      const reponse = await fetch(`${API_BASE_URL}/game/join/${code}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      setError(e.message);
    }
  }

  async function create(event) {
    event.preventDefault()
    try {
      const reponse = await fetch(`${API_BASE_URL}/game/newGame`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (reponse.ok) {
        navigate(`/lobby/:${reponse}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <main className="screen">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1>Échec et App | {user}</h1>
          </div>
          <div className="level-right">
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
          </div>
        </div>
      </div>

      {/* Deux choix exclusifs, côte à côte : on join OU on crée une partie. */}
      <div className="home-choices">
        <section className="card">
          <h2>Rejoindre une partie</h2>
          <p>Vous avez reçu un code de partie ?</p>
          <form onSubmit={join}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code de partie"
              inputMode="numeric"
            />
            <button type="submit">Rejoindre la partie</button>
          </form>
        </section>

        <p className="or">ou</p>

        <section className="card">
          <h2>Créer une nouvelle partie</h2>
          <p>Obtenir un code pour inviter un autre joueur de votre choix</p>
          <button onClick={create}>
            Obtenir son code
          </button>
        </section>
      </div>

      {error && <p className="error">{error}</p>}
    </main >
  );
}

export default App;
