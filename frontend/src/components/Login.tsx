import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, setToken } from '../utils/auth'
import '../styles/Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tokenResponse = await login({ email, password })
      setToken(tokenResponse.access_token)
      navigate('/parse')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div>
          <label htmlFor="email" className="login-form-group">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="login-form-group">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="login-switch-container">
        <button
          onClick={() => navigate('/register')}
          className="login-switch-button"
        >
          Don't have an account? Register
        </button>
      </div>
    </div>
  )
}

