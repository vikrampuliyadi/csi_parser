import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResult, getFromLocalStorage } from '../utils/results'
import type { ParseResultDetail } from '../types'
import ResultsTable from './ResultsTable'
import '../styles/ResultsPage.css'

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<ParseResultDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) {
        setError('Invalid result ID')
        setLoading(false)
        return
      }

      const resultId = parseInt(id, 10)
      if (isNaN(resultId)) {
        setError('Invalid result ID format')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Try to get from localStorage first
      const cachedResult = getFromLocalStorage(resultId)
      if (cachedResult && 'results' in cachedResult) {
        setResult(cachedResult as ParseResultDetail)
        setLoading(false)
      }

      // Always fetch from backend to ensure we have the latest data
      try {
        const backendResult = await getResult(resultId)
        setResult(backendResult)
        setError(null)
      } catch (err: any) {
        // Only show error if we don't have cached data
        if (!cachedResult) {
          setError(err?.message || 'Failed to load result')
        } else {
          // We have cached data, so just log the error
          console.warn('Failed to fetch from backend, using cached data:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [id])

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (loading) {
    return (
      <div className="results-page-container">
        <div className="results-page-loading">
          <div className="loading-spinner"></div>
          <p>Loading result...</p>
        </div>
      </div>
    )
  }

  if (error && !result) {
    return (
      <div className="results-page-container">
        <div className="results-page-error">
          <h2>Error Loading Result</h2>
          <p>{error}</p>
          <div className="results-page-actions">
            <button
              onClick={() => navigate('/parse')}
              className="results-page-button results-page-button-primary"
            >
              Back to Parse
            </button>
            <button
              onClick={() => window.location.reload()}
              className="results-page-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="results-page-container">
        <div className="results-page-error">
          <h2>Result Not Found</h2>
          <p>The requested result could not be found.</p>
          <button
            onClick={() => navigate('/parse')}
            className="results-page-button results-page-button-primary"
          >
            Back to Parse
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="results-page-container">
      <div className="results-page-header">
        <h1>Parse Results</h1>
        <button
          onClick={() => navigate('/parse')}
          className="results-page-button results-page-button-primary"
        >
          Back to Parse
        </button>
      </div>

      {/* Document Metadata */}
      <div className="results-page-metadata">
        <h2>Document Information</h2>
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">Filename:</span>
            <span className="metadata-value">{result.filename}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Pages:</span>
            <span className="metadata-value">{result.num_pages}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Total Matches:</span>
            <span className="metadata-value">{result.total_matches}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Matched Pages:</span>
            <span className="metadata-value">{result.matched_pages}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Parse Time:</span>
            <span className="metadata-value">{formatTime(result.parse_time_ms)}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{formatDate(result.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="results-page-content">
        <h2>Matches ({result.results.length})</h2>
        {result.results.length > 0 ? (
          <ResultsTable results={result.results} />
        ) : (
          <div className="results-page-empty">
            <p>No matches found in this document.</p>
          </div>
        )}
      </div>
    </div>
  )
}

