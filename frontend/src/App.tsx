import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import ParseScreen from './components/ParseScreen'
import { getCurrentUser, removeToken } from './utils/auth'

type AuthView = 'landing' | 'login' | 'register'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authView, setAuthView] = useState<AuthView>('landing')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      setIsAuthenticated(!!user)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setAuthView('landing')
  }

  const handleLogout = () => {
    removeToken()
    setIsAuthenticated(false)
    setAuthView('landing')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <ParseScreen onLogout={handleLogout} />
  }

  if (authView === 'login') {
    return <Login onSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthView('register')} />
  }

  if (authView === 'register') {
    return <Register onSuccess={handleLoginSuccess} onSwitchToLogin={() => setAuthView('login')} />
  }

  // Landing page with buttons
  return (
    <div className="landing-container">
      <h1>CSI Parse</h1>
      <p className="landing-subtitle">Please sign in to continue</p>
      <div className="landing-buttons">
        <button
          onClick={() => setAuthView('login')}
          className="landing-button-primary"
        >
          Login
        </button>
        <button
          onClick={() => setAuthView('register')}
          className="landing-button-secondary"
        >
          Register
        </button>
      </div>
    </div>
  )
}
