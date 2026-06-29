import { evaluations, leaderboardRows, summaryStats } from './data/mockData.js'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, init)
}

export async function getLeaderboard() {
  try {
    const response = await apiGet('/leaderboard')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { board: leaderboardRows, source: 'mock' }
  }
}

export async function getEvaluations() {
  try {
    const response = await apiGet('/list_ab_evaluations')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { evaluations, source: 'mock' }
  }
}

export async function getSummaryStats() {
  try {
    const response = await apiGet('/summary')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { summary: summaryStats, source: 'mock' }
  }
}
