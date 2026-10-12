import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import App from "./pages/App.jsx";
import Lobby from "./pages/Lobby.jsx";
import Game from "./pages/Game.jsx";
import Classement from "./pages/Classement.jsx";
import History from "./pages/History.jsx";

function Routeur() {
	return (
		<AuthProvider>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					{/* Route protégée: seuls les utilisateurs authentifiés accèdent aux pages protégées. */}
					<Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
					<Route path="/lobby/:code" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
					<Route path="/game/:code" element={<ProtectedRoute><Game /></ProtectedRoute>} />
					<Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
					<Route path="/classement" element={<ProtectedRoute><Classement /></ProtectedRoute>} />

					<Route
						path="*"
						element={<div className="section has-text-centered">Page non trouvée</div>}
					/>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default Routeur;
