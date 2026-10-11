import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import App from "./pages/App.jsx";
import Classement from "./pages/Classement.jsx";

function Routeur() {
	return (
		<AuthProvider>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<App />
							</ProtectedRoute>
						}
					/>
					{/* Route protégée: seuls les utilisateurs authentifiés accèdent au classement. */}
					<Route
						path="/classement"
						element={
							<ProtectedRoute>
								<Classement />
							</ProtectedRoute>
						}
					/>

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
