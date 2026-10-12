import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Lit la date d'expiration du JWT sans considérer son contenu comme authentifié.
function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(base64))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

// Charge une session encore valide; un jeton expiré ou mal formé ne doit pas protéger les routes.
function readSession() {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (!token) return { token: null, user: null, sessionExpired: false }

  const expiresAt = getTokenExpiration(token)
  if (!expiresAt || expiresAt <= Date.now()) {
    return { token: null, user: null, sessionExpired: true }
  }

  try {
    return {
      token,
      user: userData ? JSON.parse(userData) : null,
      sessionExpired: false,
    }
  } catch {
    return { token: null, user: null, sessionExpired: true }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const { token, user, sessionExpired } = session

  useEffect(() => {
    // Supprime aussi de l'espace de stockage toute session déjà expirée au chargement.
    if (!token) {
      if (sessionExpired) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      return undefined
    }

    // Met fin à la session et efface les données locales du navigateur.
    const expireSession = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setSession({ token: null, user: null, sessionExpired: true })
    }

    const expiresAt = getTokenExpiration(token)
    if (!expiresAt || expiresAt <= Date.now()) {
      // Le jeton a pu expirer entre la lecture initiale et l'exécution de cet effet.
      const timeoutId = window.setTimeout(expireSession, 0)
      return () => window.clearTimeout(timeoutId)
    }

    // Met fin à la session à son expiration, même si aucune requête n'est envoyée.
    const timeoutId = window.setTimeout(expireSession, expiresAt - Date.now())

    // Si le navigateur suspend le minuteur en arrière-plan, revérifie au retour dans l'onglet.
    function checkExpiration() {
      if (document.visibilityState === 'visible' && expiresAt <= Date.now()) {
        expireSession()
      }
    }
    document.addEventListener('visibilitychange', checkExpiration)
    window.addEventListener('focus', checkExpiration)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', checkExpiration)
      window.removeEventListener('focus', checkExpiration)
    }
  }, [token, sessionExpired])

  function login(user, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setSession({ token, user, sessionExpired: false })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSession({ token: null, user: null, sessionExpired: false })
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  }
  return context
}
