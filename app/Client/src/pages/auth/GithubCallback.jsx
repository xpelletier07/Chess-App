import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

// Le serveur renvoie le JWT dans le fragment de l'URL pour qu'il ne soit pas envoyé
// dans une requête HTTP ni ajouté aux journaux habituels de l'URL.
function getUserFromToken(token) {
  // Un JWT est composé de trois parties séparées par des points; la deuxième contient
  // les informations minimales sur le compte, encodées en Base64URL.
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Jeton de connexion invalide')

  // Convertit Base64URL en Base64 avant le décodage natif du navigateur.
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = JSON.parse(atob(base64))

  // Le client vérifie la forme des données avant de les enregistrer dans son contexte.
  if (!decoded.id || typeof decoded.nom_utilisateur !== 'string') {
    throw new Error('Profil de connexion invalide')
  }

  // AuthContext conserve un objet utilisateur cohérent avec celui du login classique.
  return {
    id: decoded.id,
    nom_utilisateur: decoded.nom_utilisateur,
    email: decoded.email ?? null,
  }
}

export default function GithubCallback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    // React StrictMode peut exécuter l'effet deux fois en développement; ce verrou évite
    // de traiter deux fois le même jeton ou de lancer deux redirections.
    if (handled.current) return
    handled.current = true

    // Lit le jeton après le # puis efface immédiatement le fragment de la barre d'adresse.
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')
    window.history.replaceState({}, document.title, window.location.pathname)

    try {
      // Reconstitue la session locale comme après une connexion par courriel.
      if (!token) throw new Error('Jeton de connexion manquant')
      login(getUserFromToken(token), token)
      navigate('/', { replace: true })
    } catch {
      // Une réponse absente ou mal formée renvoie vers le formulaire avec un message explicite.
      navigate('/login?oauth_error=invalid_token', { replace: true })
    }
  }, [login, navigate])

  // Écran transitoire affiché pendant l'enregistrement de la session puis la redirection.
  return (
    <main className="hero is-fullheight">
      <div className="hero-body">
        <div className="container has-text-centered">
          <p className="title is-4">Connexion avec GitHub...</p>
        </div>
      </div>
    </main>
  )
}
