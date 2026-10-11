import { Link, useParams } from "react-router-dom"

export default function Game() {
    const { code } = useParams()

    return (
        <main className="hero is-fullheight">
            <div className="hero-body">
                <div className="container has-text-centered">
                    <section className="box">
                        <h1 className="title is-2">Partie en cours</h1>
                        <p className="subtitle is-5">La partie {code} est prête.</p>
                        <div className="notification is-info is-light">
                            L'échiquier sera disponible ici.
                        </div>
                        <Link className="button is-light" to="/">
                            Retour à l'accueil
                        </Link>
                    </section>
                </div>
            </div>
        </main>
    )
}
