import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function join(event) {
    event.preventDefault();
    try {
      await joinGame(code.trim(), nickname.trim());
      saveSession(code.trim(), { role: 'player', nickname: nickname.trim() });
      navigate(`/salon/${code.trim()}`);
    } catch (e) {
      setError(e.message);
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
          <p>Choisissez un questionnaire, obtenez un code et invitez des joueurs.</p>
          <Link className="button" to="/catalogue">
            Ouvrir le catalogue
          </Link>
        </section>
      </div>

      {error && <p className="error">{error}</p>}
    </main >
  );
}

export default App;
