import React, { useState, useMemo } from 'react'
import type { ParseResultItem } from '../types'
import '../styles/ResultsTable.css'

type SortField = 'page' | 'spec_section'
type SortDirection = 'asc' | 'desc'

interface ResultsTableProps {
  results: ParseResultItem[]
}

/**
 * Splits text into sentences and highlights the sentence containing the keyword
 * @param contextWindow - The full context text
 * @param keyword - The keyword to search for
 * @returns JSX element with sentences, where the matching sentence is highlighted
 */
function highlightSentenceWithKeyword(contextWindow: string, keyword: string): React.JSX.Element {
  // Split text into sentences using regex that matches sentence endings followed by whitespace
  // This handles: period, exclamation, question mark, and multiple spaces/newlines
  // Split on sentence boundaries while keeping the punctuation
  const sentenceRegex = /([.!?]+)\s+/g
  const sentences: string[] = []

  // Use matchAll to find all sentence boundaries
  const matches = Array.from(contextWindow.matchAll(sentenceRegex))

  if (matches.length === 0) {
    // No sentence boundaries found, treat entire text as one sentence
    sentences.push(contextWindow.trim())
  } else {
    // Extract sentences between boundaries
    let lastIndex = 0
    for (const match of matches) {
      const sentenceEnd = match.index! + match[0].length
      const sentence = contextWindow.substring(lastIndex, sentenceEnd).trim()
      if (sentence) {
        sentences.push(sentence)
      }
      lastIndex = sentenceEnd
    }

    // Add the remaining text as the last sentence
    if (lastIndex < contextWindow.length) {
      const remaining = contextWindow.substring(lastIndex).trim()
      if (remaining) {
        sentences.push(remaining)
      }
    }
  }

  // Find the sentence containing the keyword (case-insensitive)
  const keywordLower = keyword.toLowerCase()
  const matchingSentenceIndex = sentences.findIndex(sentence =>
    sentence.toLowerCase().includes(keywordLower)
  )

  // Render sentences with highlighting
  return (
    <div className="paragraph-display">
      {sentences.map((sentence, index) => {
        const isHighlighted = index === matchingSentenceIndex
        return (
          <span
            key={index}
            className={isHighlighted ? 'highlighted-sentence' : 'sentence'}
          >
            {sentence}
            {index < sentences.length - 1 && ' '}
          </span>
        )
      })}
    </div>
  )
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    page: '',
  })

  // Deduplicate results - entries with same page, section, and section_hint are considered duplicates
  const uniqueResults = useMemo(() => {
    const seen = new Set<string>()
    const unique: ParseResultItem[] = []

    for (const result of results) {
      const key = `${result.page}|${result.spec_section || ''}|${result.section_hint || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(result)
      }
    }

    return unique
  }, [results])

  // Filter results
  const filteredResults = useMemo(() => {
    return uniqueResults.filter((result) => {
      const matchesPage = !filters.page ||
        result.page.toString() === filters.page

      return matchesPage
    })
  }, [uniqueResults, filters])

  // Sort results
  const sortedResults = useMemo(() => {
    if (!sortField) return filteredResults

    return [...filteredResults].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'page':
          aValue = a.page
          bValue = b.page
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="results-table-container">
      {/* Filters */}
      <div className="results-table-filters">
        <input
          type="number"
          placeholder="Filter by page..."
          value={filters.page}
          onChange={(e) => setFilters({ ...filters, page: e.target.value })}
          className="results-filter-input"
          min="1"
        />
        <button
          onClick={() => setFilters({ page: '' })}
          className="results-filter-clear"
        >
          Clear Filters
        </button>
      </div>

      {/* Results count */}
      <div className="results-table-info">
        Showing {sortedResults.length} of {uniqueResults.length} unique results
      </div>

      {/* Table */}
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('page')}
              >
                Page {getSortIcon('page')}
              </th>
              <th
                className="results-table-header sortable"
                onClick={() => handleSort('spec_section')}
              >
                Section {getSortIcon('spec_section')}
              </th>
              <th className="results-table-header">Section Hint</th>
              <th className="results-table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.length === 0 ? (
              <tr>
                <td colSpan={4} className="results-table-empty">
                  No results found
                </td>
              </tr>
            ) : (
              sortedResults.map((result, index) => {
                const isExpanded = expandedRows.has(index)

                return (
                  <React.Fragment key={index}>
                    <tr className={isExpanded ? 'expanded' : ''}>
                      <td className="results-table-cell page-cell">
                        {result.page}
                      </td>
                      <td className="results-table-cell section-cell">
                        {result.spec_section || '-'}
                      </td>
                      <td className="results-table-cell section-hint-cell">
                        {result.section_hint || '-'}
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
                        <td colSpan={4} className="results-table-expanded-content">
                          <div className="expanded-content-section">
                            {/* Section Header */}
                            <div className="section-header">
                              <h3 className="section-title">
                                {result.spec_section || result.section_hint || 'No Section'}
                              </h3>
                            </div>

                            {/* Full Paragraph with Highlighted Sentence */}
                            <div className="paragraph-container">
                              {highlightSentenceWithKeyword(result.context_window, result.keyword)}
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="expanded-content-section">
                            <h4>Additional Info</h4>
                            <div className="info-grid">
                              <div>
                                <strong>Keyword:</strong> {result.keyword}
                              </div>
                              <div>
                                <strong>Page:</strong> {result.page}
                              </div>
                              <div>
                                <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                              </div>
                              <div>
                                <strong>Match Type:</strong> {result.match_type}
                              </div>
                              {result.section_hint && result.spec_section && (
                                <div>
                                  <strong>Section Hint:</strong> {result.section_hint}
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

