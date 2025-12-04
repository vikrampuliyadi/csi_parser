import { getToken } from './auth'
import type { ParseResponse, ParseResultSummary, ParseResultDetail } from '../types'

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'
const RESULT_STORAGE_PREFIX = 'parse_result_'

/**
 * Save parse response to localStorage if it has a result_id
 * This caches the result after it's been saved to the backend
 */
export function saveResult(parseResponse: ParseResponse): void {
  if (parseResponse.result_id) {
    saveToLocalStorage(parseResponse.result_id, parseResponse)
  }
}

/**
 * Fetch a specific parse result from the backend
 */
export async function getResult(resultId: number): Promise<ParseResultDetail> {
  const token = getToken()
  if (!token) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`${API_BASE}/results/${resultId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch result' }))
    throw new Error(error.detail || 'Failed to fetch result')
  }

  const result = await response.json()

  // Cache the result in localStorage
  saveToLocalStorage(resultId, result)

  return result
}

/**
 * Get all saved parse results for the current user
 */
export async function listResults(): Promise<ParseResultSummary[]> {
  const token = getToken()
  if (!token) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`${API_BASE}/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch results' }))
    throw new Error(error.detail || 'Failed to fetch results')
  }

  return response.json()
}

/**
 * Delete a parse result from the backend
 */
export async function deleteResult(resultId: number): Promise<void> {
  const token = getToken()
  if (!token) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`${API_BASE}/results/${resultId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete result' }))
    throw new Error(error.detail || 'Failed to delete result')
  }

  // Also remove from localStorage if it exists
  deleteFromLocalStorage(resultId)
}

/**
 * Save result data to localStorage with a key based on result_id
 */
export function saveToLocalStorage(resultId: number, data: ParseResponse | ParseResultDetail): void {
  try {
    const key = `${RESULT_STORAGE_PREFIX}${resultId}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save result to localStorage:', error)
  }
}

/**
 * Retrieve result data from localStorage by result_id
 */
export function getFromLocalStorage(resultId: number): ParseResponse | ParseResultDetail | null {
  try {
    const key = `${RESULT_STORAGE_PREFIX}${resultId}`
    const item = localStorage.getItem(key)
    if (!item) {
      return null
    }
    return JSON.parse(item)
  } catch (error) {
    console.warn('Failed to retrieve result from localStorage:', error)
    return null
  }
}

/**
 * Delete a result from localStorage
 */
export function deleteFromLocalStorage(resultId: number): void {
  try {
    const key = `${RESULT_STORAGE_PREFIX}${resultId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to delete result from localStorage:', error)
  }
}

