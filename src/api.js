const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.DEV ? '/api' : 'http://ec2-13-212-252-110.ap-southeast-1.compute.amazonaws.com:5051/api')

export async function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, init)
}

export async function getRobots() {
  try {
    const response = await apiGet('/robots')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { robots: [], source: 'empty' }
  }
}

export async function getLeaderboard() {
  try {
    const response = await apiGet('/leaderboard')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { board: [], source: 'empty' }
  }
}

export async function getEvaluations() {
  try {
    const response = await apiGet('/list_ab_evaluations')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { evaluations: [], source: 'empty' }
  }
}

export async function getEvaluationVideos(evaluationId) {
  try {
    const response = await apiGet(`/evaluations/${evaluationId}/videos`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { videos: {}, source: 'empty' }
  }
}

export async function getSummaryStats() {
  try {
    const response = await apiGet('/summary')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch {
    return { summary: { policies: 0, evaluations: 0, evaluators: 0, tasks: 0 }, source: 'empty' }
  }
}
