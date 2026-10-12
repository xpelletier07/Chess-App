import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { useAuth } from '../../auth/AuthContext'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Traduit les erreurs OAuth renvoyées par le serveur en messages compréhensibles.
  const oauthErrorMessages = {
    github_not_configured: "La connexion GitHub n'est pas configurée sur le serveur.",
    access_denied: "La connexion GitHub a été annulée.",
    invalid_state: "La vérification de sécurité GitHub a échoué. Réessayez.",
    invalid_code: "GitHub n'a pas retourné de code de connexion valide.",
    oauth_failed: "Impossible de terminer la connexion avec GitHub.",
    invalid_token: "La réponse de connexion GitHub est invalide.",
  }
  const oauthError = oauthErrorMessages[searchParams.get('oauth_error')]
  const sessionError = searchParams.get('session') === 'expired'
    ? 'Votre session a expiré. Veuillez vous reconnecter.'
    : ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      login(data.user, data.token)
      navigate('/')
    } catch {
      setError('Impossible de contacter le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Connexion</h1>
        <p className="auth-subtitle">Restez connecté à votre compte</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <i className="fi fi-rs-envelope"></i>
            <input
              type="email"
              placeholder="e-mail"
              aria-label="e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <i className="fi fi-rs-lock"></i>
            <input
              type="password"
              placeholder="mot de passe"
              aria-label="mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {(error || oauthError || sessionError) && (
            <p className="auth-error">{error || oauthError || sessionError}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Le lien natif provoque une navigation complète vers la route OAuth du serveur. */}
        <div className="auth-divider"><span>ou</span></div>
        <a className="auth-oauth-button" href={`${API_BASE_URL}/auth/github`}>
          <i className="fa-brands fa-github" aria-hidden="true"></i>
          Continuer avec GitHub
        </a>

        <p className="auth-footer">
          Pas encore de compte ? <Link to="/signup">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
