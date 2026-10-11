import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { useAuth } from '../auth/AuthContext'
import './Classement.css'

export default function Classement() {
  // Le compte connecté sert à reconnaître et mettre en évidence sa propre ligne.
  const { user } = useAuth()
  // Les joueurs sont fournis déjà triés par le serveur selon leur cote Elo.
  const [joueurs, setJoueurs] = useState([])
  // En cas d'échec, on garde un message visible et un bouton de nouvel essai.
  const [erreur, setErreur] = useState('')
  // Démarre en chargement pour éviter d'afficher brièvement un faux état vide.
  const [chargement, setChargement] = useState(true)

  // Cette fonction est partagée par le chargement initial et le bouton Actualiser.
  const chargerClassement = useCallback(async () => {
    // Réinitialise l'affichage avant chaque requête, y compris après une erreur passée.
    setChargement(true)
    setErreur('')

    try {
      // Le classement est public pour tout utilisateur connecté à cette page.
      const response = await fetch(`${API_BASE_URL}/ranking`)
      const data = await response.json()

      // Convertit une réponse HTTP en erreur affichable plutôt que de masquer le problème.
      if (!response.ok) {
        throw new Error(data.error || 'Impossible de charger le classement')
      }

      // Le serveur renvoie les éléments avec rang, cote et nombre de parties.
      setJoueurs(data.players)
    } catch (error) {
      // Les erreurs réseau et les erreurs API sont affichées à l'utilisateur.
      setErreur(error.message || 'Impossible de contacter le serveur')
    } finally {
      // Cette étape se produit autant en cas de succès qu'en cas d'échec.
      setChargement(false)
    }
  }, [])

  // Charge les données à l'ouverture; la dépendance stable évite de répéter la requête à chaque rendu React.
  useEffect(() => {
    chargerClassement()
  }, [chargerClassement])

  // Structure générale de la page: navigation, titre, contenu puis rappel des règles Elo.
  return (
    <main className="classement-page">
      <section className="classement-card">
        <header className="classement-header">
          {/* Permet de revenir à l'accueil sans perdre la session. */}
          <Link className="button is-light classement-home-button" to="/">
            <span className="icon"><i className="fas fa-arrow-left" /></span>
            <span>Accueil</span>
          </Link>
          <div className="has-text-centered">
            <p className="classement-eyebrow">Échec et app</p>
            <h1 className="title is-2">Classement</h1>
            <p className="subtitle is-6">La force des joueurs, mesurée en Elo</p>
          </div>
          {/* Relance la même requête sans recharger toute l'application. */}
          <button
            className="button is-light"
            onClick={chargerClassement}
            disabled={chargement}
            aria-label="Actualiser le classement"
          >
            <span className="icon"><i className="fas fa-rotate" /></span>
          </button>
        </header>

        {/* L'erreur reste dans le contexte du tableau et propose une action de récupération. */}
        {erreur && (
          <div className="notification is-danger is-light" role="alert">
            <p>{erreur}</p>
            <button className="button is-danger is-light mt-3" onClick={chargerClassement}>
              Réessayer
            </button>
          </div>
        )}

        {/* Les états de chargement, de classement vide et de résultats sont exclusifs. */}
        {chargement ? (
          <div className="classement-state" role="status">
            <span className="icon is-large"><i className="fas fa-spinner fa-pulse fa-2x" /></span>
            <p>Chargement du classement...</p>
          </div>
        ) : !erreur && joueurs.length === 0 ? (
          <div className="classement-state">
            <span className="icon is-large"><i className="fas fa-chess-knight fa-2x" /></span>
            <p>Aucun joueur à classer pour le moment.</p>
          </div>
        ) : !erreur && (
          <div className="table-container">
            {/* Bulma permet au tableau de défiler horizontalement sur les écrans étroits. */}
            <table className="table is-fullwidth classement-table">
              {/* Les intitulés de colonnes restent lisibles par les lecteurs d'écran. */}
              <thead>
                <tr>
                  <th scope="col">Rang</th>
                  <th scope="col">Joueur</th>
                  <th scope="col" className="has-text-right">Elo</th>
                  <th scope="col" className="has-text-right">Parties</th>
                </tr>
              </thead>
              {/* Le serveur a déjà trié les joueurs; index + 1 correspond au rang affiché. */}
              <tbody>
                {/* Chaque ligne représente un joueur et utilise son identifiant comme clé React. */}
                {joueurs.map((joueur, index) => (
                  <tr
                    key={joueur.id}
                    className={joueur.id === user?.id ? 'classement-current-player' : ''}
                  >
                    <td>
                      {/* Une classe dédiée distingue visuellement les trois premières places. */}
                      <span className={`classement-rank ${
                        index === 0 ? 'is-first' : index === 1 ? 'is-second' : index === 2 ? 'is-third' : ''
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="has-text-weight-semibold">
                      {joueur.username}
                      {/* Cette indication accompagne la surbrillance pour rester explicite. */}
                      {joueur.id === user?.id && <span className="classement-you">Vous</span>}
                    </td>
                    <td className="has-text-right classement-elo">{joueur.elo}</td>
                    <td className="has-text-right">{joueur.gamesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rappelle les paramètres afin d'expliquer la cote affichée. */}
        <footer className="classement-footer">
          Elo initial : 1000 · K = 20 · Limites : 100 à 3000
        </footer>
      </section>
    </main>
  )
}
