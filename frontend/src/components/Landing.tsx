import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <h1>CSI Parse</h1>
      <p className="landing-subtitle">Please sign in to continue</p>
      <div className="landing-buttons">
        <button
          onClick={() => navigate('/login')}
          className="landing-button-primary"
        >
          Login
        </button>
        <button
          onClick={() => navigate('/register')}
          className="landing-button-secondary"
        >
          Register
        </button>
      </div>
    </div>
  )
}

