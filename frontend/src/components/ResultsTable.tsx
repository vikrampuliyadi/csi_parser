import React, { useState, useMemo } from 'react'
import type { ParseResultItem } from '../types'
import '../styles/ResultsTable.css'

type SortField = 'keyword' | 'page' | 'confidence' | 'match_type' | 'spec_section'
type SortDirection = 'asc' | 'desc'

interface ResultsTableProps {
  results: ParseResultItem[]
}

const SNIPPET_MAX_LENGTH = 100

export default function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    keyword: '',
    page: '',
    matchType: '',
  })

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesKeyword = !filters.keyword || 
        result.keyword.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        result.snippet.toLowerCase().includes(filters.keyword.toLowerCase())
      
      const matchesPage = !filters.page || 
        result.page.toString() === filters.page
      
      const matchesMatchType = !filters.matchType || 
        result.match_type === filters.matchType
      
      return matchesKeyword && matchesPage && matchesMatchType
    })
  }, [results, filters])

  // Sort results
  const sortedResults = useMemo(() => {
    if (!sortField) return filteredResults

    return [...filteredResults].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'keyword':
          aValue = a.keyword.toLowerCase()
          bValue = b.keyword.toLowerCase()
          break
        case 'page':
          aValue = a.page
          bValue = b.page
          break
        case 'confidence':
          aValue = a.confidence
          bValue = b.confidence
          break
        case 'match_type':
          aValue = a.match_type
          bValue = b.match_type
          break
        case 'spec_section':
          aValue = a.spec_section || ''
          bValue = b.spec_section || ''
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })
  }, [filteredResults, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const truncateSnippet = (text: string): string => {
    if (text.length <= SNIPPET_MAX_LENGTH) return text
    return text.substring(0, SNIPPET_MAX_LENGTH) + '...'
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="results-table-container">
      {/* Filters */}
      <div className="results-table-filters">
        <input
          type="text"
          placeholder="Filter by keyword..."
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          className="results-filter-input"
        />
        <input
          type="number"
          placeholder="Filter by page..."
          value={filters.page}
          onChange={(e) => setFilters({ ...filters, page: e.target.value })}
          className="results-filter-input"
          min="1"
        />
        <select
          value={filters.matchType}
          onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
          className="results-filter-select"
        >
          <option value="">All match types</option>
          <option value="exact">Exact</option>
          <option value="regex">Regex</option>
          <option value="fuzzy">Fuzzy</option>
        </select>
        <button
          onClick={() => setFilters({ keyword: '', page: '', matchType: '' })}
          className="results-filter-clear"
        >
          Clear Filters
        </button>
      </div>

      {/* Results count */}
      <div className="results-table-info">
        Showing {sortedResults.length} of {results.length} results
      </div>

      {/* Table */}
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('keyword')}
              >
                Keyword {getSortIcon('keyword')}
              </th>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('page')}
              >
                Page {getSortIcon('page')}
              </th>
              <th className="results-table-header">Snippet</th>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('spec_section')}
              >
                Section {getSortIcon('spec_section')}
              </th>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('confidence')}
              >
                Confidence {getSortIcon('confidence')}
              </th>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('match_type')}
              >
                Match Type {getSortIcon('match_type')}
              </th>
              <th className="results-table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.length === 0 ? (
              <tr>
                <td colSpan={7} className="results-table-empty">
                  No results found
                </td>
              </tr>
            ) : (
              sortedResults.map((result, index) => {
                const isExpanded = expandedRows.has(index)
                const snippet = isExpanded 
                  ? result.snippet 
                  : truncateSnippet(result.snippet)

                return (
                  <React.Fragment key={index}>
                    <tr className={isExpanded ? 'expanded' : ''}>
                      <td className="results-table-cell keyword-cell">
                        {result.keyword}
                      </td>
                      <td className="results-table-cell page-cell">
                        {result.page}
                      </td>
                      <td className="results-table-cell snippet-cell">
                        {snippet}
                        {result.snippet.length > SNIPPET_MAX_LENGTH && (
                          <button
                            onClick={() => toggleRow(index)}
                            className="results-expand-button"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </td>
                      <td className="results-table-cell section-cell">
                        {result.spec_section || result.section_hint || '-'}
                      </td>
                      <td className="results-table-cell confidence-cell">
                        {(result.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="results-table-cell match-type-cell">
                        <span className={`match-type-badge match-type-${result.match_type}`}>
                          {result.match_type}
                        </span>
                      </td>
                      <td className="results-table-cell actions-cell">
                        <button
                          onClick={() => toggleRow(index)}
                          className="results-expand-button"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="results-table-expanded-row">
                        <td colSpan={7} className="results-table-expanded-content">
                          <div className="expanded-content-section">
                            <h4>Full Context</h4>
                            <div className="context-block">
                              <strong>Before:</strong>
                              <div className="context-text">{result.context_before}</div>
                            </div>
                            <div className="context-block">
                              <strong>Snippet:</strong>
                              <div className="context-text snippet-highlight">{result.snippet}</div>
                            </div>
                            <div className="context-block">
                              <strong>After:</strong>
                              <div className="context-text">{result.context_after}</div>
                            </div>
                          </div>
                          <div className="expanded-content-section">
                            <h4>Additional Info</h4>
                            <div className="info-grid">
                              <div>
                                <strong>Section Hint:</strong> {result.section_hint || '-'}
                              </div>
                              <div>
                                <strong>Spec Section:</strong> {result.spec_section || '-'}
                              </div>
                              <div>
                                <strong>Positions:</strong> {result.positions.length} match(es)
                              </div>
                              {result.proximity_window && (
                                <div>
                                  <strong>Proximity Window:</strong> {result.proximity_window}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

