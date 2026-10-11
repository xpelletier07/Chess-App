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
    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <div className="columns is-centered">
                        <div className="column is-half">
                            <section className="box">
                                <h1 className="title is-2">Salon d'attente</h1>
                                <p className="subtitle is-5 mb-5">
                                    Partagez ce code avec l'autre joueur
                                </p>
                                <div className="notification is-link is-light">
                                    <p className="heading">Code de partie</p>
                                    <p className="title is-1">{code}</p>
                                </div>
                                <progress className="progress is-link" />
                                <p className="has-text-grey">
                                    En attente de l'autre joueur...
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
