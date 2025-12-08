import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, removeToken } from '../utils/auth'
import { saveToLocalStorage } from '../utils/results'
import type { ParseResponse } from '../types'
import '../styles/ParseScreen.css'

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

export default function ParseScreen() {
  const navigate = useNavigate()

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const onParse = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const form = new FormData()
      form.append('file', file)
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      // Add save=true query parameter to automatically save the result
      const res = await fetch(`${API_BASE}/parse?save=true`, {
        method: 'POST',
        headers,
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status} ${text}`)
      }
      const json: ParseResponse = await res.json()

      // If result was saved, save to localStorage and navigate to results page
      if (json.result_id) {
        saveToLocalStorage(json.result_id, json)
        navigate(`/results/${json.result_id}`)
      } else {
        // Fallback: if somehow result_id is missing, show error
        setError('Failed to save result. Please try again.')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to parse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="parse-container">
      <div className="parse-header">
        <h1>CSI Parse</h1>
        <div className="parse-header-actions">
          <button
            onClick={() => navigate('/results')}
            className="parse-results-button"
          >
            View Results
          </button>
          <button
            onClick={handleLogout}
            className="parse-logout-button"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="parse-controls">
        <input type="file" accept="application/pdf" onChange={onChange} />
        <button disabled={!file || loading} onClick={onParse}>
          {loading ? 'Parsing…' : 'Parse'}
        </button>
        {file && <span>{file.name}</span>}
      </div>
      {error && <div className="parse-error">{error}</div>}
    </div>
  )
}

