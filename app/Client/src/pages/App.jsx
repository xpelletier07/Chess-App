import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title is-1">
              Échec et app{user ? ` — Bienvenue, ${user.nom_utilisateur}` : ""}
            </h1>
          </div>
          <div className="level-right">
            <Link className="button is-link is-light mr-2" to="/history">
              <span className="icon"><i className="fas fa-history" /></span>
              <span>Historique</span>
            </Link>
            <button className="button is-danger is-light" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
