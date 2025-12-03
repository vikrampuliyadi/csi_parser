import { useState } from 'react'
import { getToken } from '../utils/auth'

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

interface ParseScreenProps {
  onLogout: () => void
}

export default function ParseScreen({ onLogout }: ParseScreenProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const onParse = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const token = getToken()
      const form = new FormData()
      form.append('file', file)
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(`${API_BASE}/parse`, {
        method: 'POST',
        headers,
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status} ${text}`)
      }
      const json = await res.json()
      setResult(json)
    } catch (e: any) {
      setError(e?.message || 'Failed to parse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>CSI Parse</h1>
        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#b00020',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="file" accept="application/pdf" onChange={onChange} />
        <button disabled={!file || loading} onClick={onParse}>
          {loading ? 'Parsing…' : 'Parse'}
        </button>
        {file && <span>{file.name}</span>}
      </div>
      {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}
      {result && (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: '1px solid #ddd',
            padding: 12,
            borderRadius: 4,
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

