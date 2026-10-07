import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import App from "./Pages/App.jsx";

// function isTokenExpired(token) {
// 	const payload = JSON.parse(atob(token.split(".")[1]));
// 	return payload.exp * 1000 < Date.now(); // exp is in seconds
// }

function Routeur() {
	// const [isLoggedIn, setIsLoggedIn] = useState(() => {
	// 	const token = localStorage.getItem("token");
	// 	if (!token) return false;
	// 	if (isTokenExpired(token)) {
	// 		localStorage.removeItem("token");
	// 		return false;
	// 	}
	// 	return true;
	// });

	// const objetsEtMethodesDuContexte = {
	// 	isLoggedIn,
	// 	setIsLoggedIn,
	// };

	// useEffect(() => {
	// 	const token = localStorage.getItem("token");
	// 	if (!token || isTokenExpired(token)) {
	// 		localStorage.removeItem("token");
	// 		setIsLoggedIn(false);
	// 	}
	// }, []);
	return (
		// <LoginContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
		<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<Routes>
				<Route path="/" element={<App />} />

				<Route
					path="*"
					element={<div className="section has-text-centered">Page non trouvée</div>}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default Routeur;
