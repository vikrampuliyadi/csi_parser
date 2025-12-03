import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, login, setToken } from '../utils/auth'
import '../styles/Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register({ email, password })
      // Automatically log in after registration
      const tokenResponse = await login({ email, password })
      setToken(tokenResponse.access_token)
      navigate('/parse')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div>
          <label htmlFor="email" className="register-form-group">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="register-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="register-form-group">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="register-form-group">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="register-input"
          />
        </div>
        {error && <div className="register-error">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="register-button"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="register-switch-container">
        <button
          onClick={() => navigate('/login')}
          className="register-switch-button"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  )
}

