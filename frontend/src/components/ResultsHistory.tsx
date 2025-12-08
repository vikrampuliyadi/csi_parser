import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listResults, deleteResult } from '../utils/results'
import type { ParseResultSummary } from '../types'
import '../styles/ResultsHistory.css'

export default function ResultsHistory() {
  const navigate = useNavigate()
  const [results, setResults] = useState<ParseResultSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listResults()
        setResults(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

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

  const handleDelete = async (e: React.MouseEvent, resultId: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this result?')) {
      return
    }

    try {
      await deleteResult(resultId)
      // Remove the deleted result from the list
      setResults(results.filter(r => r.id !== resultId))
    } catch (err: any) {
      alert(err?.message || 'Failed to delete result')
    }
  }

  if (loading) {
    return (
      <div className="results-history-container">
        <div className="results-history-loading">
          <div className="loading-spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="results-history-container">
        <div className="results-history-error">
          <h2>Error Loading Results</h2>
          <p>{error}</p>
          <div className="results-history-actions">
            <button
              onClick={() => window.location.reload()}
              className="results-history-button results-history-button-primary"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/parse')}
              className="results-history-button"
            >
              Back to Parse
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="results-history-container">
      <div className="results-history-header">
        <h1>Parse Results History</h1>
        <button
          onClick={() => navigate('/parse')}
          className="results-history-button results-history-button-primary"
        >
          New Parse
        </button>
      </div>

      {results.length === 0 ? (
        <div className="results-history-empty">
          <h2>No Results Yet</h2>
          <p>You haven't parsed any documents yet. Start by parsing a PDF file.</p>
          <button
            onClick={() => navigate('/parse')}
            className="results-history-button results-history-button-primary"
          >
            Parse a Document
          </button>
        </div>
      ) : (
        <div className="results-history-content">
          <div className="results-history-list">
            {results.map((result) => (
              <Link
                key={result.id}
                to={`/results/${result.id}`}
                className="results-history-item"
              >
                <button
                  className="results-history-item-delete"
                  onClick={(e) => handleDelete(e, result.id)}
                  aria-label="Delete result"
                  title="Delete result"
                >
                  ×
                </button>
                <div className="results-history-item-header">
                  <h3 className="results-history-item-filename">
                    {result.filename}
                  </h3>
                  <span className="results-history-item-date">
                    {formatDate(result.created_at)}
                  </span>
                </div>
                <div className="results-history-item-stats">
                  <div className="results-history-stat">
                    <span className="results-history-stat-label">Total Matches:</span>
                    <span className="results-history-stat-value">
                      {result.total_matches}
                    </span>
                  </div>
                  <div className="results-history-stat">
                    <span className="results-history-stat-label">Matched Pages:</span>
                    <span className="results-history-stat-value">
                      {result.matched_pages} / {result.num_pages}
                    </span>
                  </div>
                  <div className="results-history-stat">
                    <span className="results-history-stat-label">Parse Time:</span>
                    <span className="results-history-stat-value">
                      {result.parse_time_ms < 1000
                        ? `${result.parse_time_ms}ms`
                        : `${(result.parse_time_ms / 1000).toFixed(2)}s`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

