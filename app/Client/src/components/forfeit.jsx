import React from "react";

function Forfeit({ onForfeit, disabled = false }) {
	const handleForfeit = () => {
		if (disabled || typeof onForfeit !== "function") return;

		if (window.confirm("Voulez-vous vraiment abandonner cette partie ?")) {
			onForfeit();
		}
	};

	return (
		<button type="button" onClick={handleForfeit} disabled={disabled}>
			Abandonner la partie
		</button>
	);
}



export default Forfeit;
