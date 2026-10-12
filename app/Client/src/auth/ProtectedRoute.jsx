import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, sessionExpired } = useAuth()

  if (!token) {
    return <Navigate to={sessionExpired ? '/login?session=expired' : '/login'} replace />
  }

  return children
}
