import { Navigate, useParams } from "react-router-dom"
import { API_BASE_URL } from "../config"
import { useNavigate } from "react-router-dom"

export default function Lobby() {
    const { code } = useParams()
    const token = localStorage.getItem("token")
    const navigate = useNavigate()

    async function startGame(event) {
        event.preventDefault()
        const reponse = await fetch(`${API_BASE_URL}/game/changeState/${code}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ "newState": "en cours" })
        })
        if (reponse.ok) {
            /* 
            ********** TODO **********
            envoyer vers la page de jeu
            */
            navigate("/")
        }
    }
}
return (
    <>
        <main className="screen">
            <header className="header">
                <h1>Salon d'attente</h1>
                <p>Code de partie: <strong>{code}</strong></p>
            </header>
        </main>
    </>
)
