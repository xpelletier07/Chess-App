import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import App from "./pages/App.jsx";
import Lobby from "./pages/Lobby.jsx";
import Classement from "./pages/Classement.jsx";
import { useState, useEffect } from "react";
import ForfeitTest from "./pages/forfeit_test.jsx";
import History from "./pages/History.jsx";

// function isTokenExpired(token) {
// 	const payload = JSON.parse(atob(token.split(".")[1]));
// 	return payload.exp * 1000 < Date.now(); // exp is in seconds
// }

function Routeur() {
	return (
		<AuthProvider>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
					<Route path="/lobby/:code" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
					<Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
					{/*
						/forfeit est une page de test pour l'abandon de partie. A supprimer plus tard.
					*/}
					<Route path="/forfeit" element={<ForfeitTest />} />

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
