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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, textAlign: 'center' }}>
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
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <h1>CSI Parse</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Please sign in to continue</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          onClick={() => setAuthView('login')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setAuthView('register')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: 'transparent',
            color: '#646cff',
            border: '1px solid #646cff',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Register
        </button>
      </div>
    </div>
  )
}
