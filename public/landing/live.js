// Live data for the Pink and Orange landing pages.
// Reads the same production API as the main app; nothing here is a snapshot.
const onPages = location.hostname.endsWith('github.io')
export const API = onPages ? 'https://191.222.219.43/api' : '/api'
export const APP = onPages ? '/robo-colosseum' : ''
export const ASSETS = new URL('./assets/', import.meta.url).href

// Curated hero: a real Franka open-track evaluation with recorded footage (pear into bowl).
export const HERO_EVALUATION = 'ev_dbf6bd8f187f5e60d0ee70e78535a3e4'

export const ROBOTS = [
  { id: 'franka', num: '01', name: 'Franka', sub: 'Panda / FR3 · single arm', kind: 'Single arm', img: 'franka', w: '100%', mirror: false },
  { id: 'so101', num: '02', name: 'SO-ARM101', sub: 'Open-source · single arm', kind: 'Single arm', img: 'so101', w: '100%', mirror: false },
  { id: 'yam', num: '03', name: 'Bimanual YAM', sub: 'Coordinated dual arms', kind: 'Bimanual', img: 'yam', w: '56%', mirror: true },
  { id: 'g1', num: '04', name: 'Unitree G1', sub: 'Humanoid', kind: 'Humanoid', img: 'g1', w: '78%', mirror: false },
]
const TRACKS = ['open', 'fine-tuning']

export const store = { ready: false, failed: new Set(), boards: {}, reviews: {}, evaluations: null, heroVideos: null }

async function get(path) {
  const response = await fetch(API + path, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export function startLoading(onChange) {
  const boards = ROBOTS.flatMap(robot => TRACKS.map(track =>
    get(`/leaderboard?robot=${robot.id}&track=${track}`)
      .then(data => { store.boards[`${robot.id}/${track}`] = (data.board || []).filter(row => row.robotId === robot.id && row.track === track
        // Retired checkpoint remains in historical evaluations, not public standings.
        && !(row.robotId === 'yam' && row.track === 'open'
          && row.policy === 'pi05-yam@ee17bb361e95eeba57853a2840480f5a1fc81a84')) })
      .catch(() => store.failed.add(`${robot.id}/${track}`))))
  Promise.all(boards).then(() => { store.ready = true; onChange() })

  get(`/evaluations/${HERO_EVALUATION}/videos`)
    .then(data => { store.heroVideos = data.videos || {} })
    .catch(() => { store.heroVideos = {} })
    .finally(onChange)

  // The evaluation list is large (~7 MB), so it loads after first paint.
  // It supplies the hero's verdict and scene coverage; everything else renders without it.
  const later = window.requestIdleCallback || (fn => setTimeout(fn, 600))
  later(() => get('/list_ab_evaluations')
    .then(data => { store.evaluations = (data.evaluations || []).filter(isCountedEvaluation) })
    .catch(() => { store.failed.add('evaluations'); store.evaluations = [] })
    .finally(onChange))
}

// Matches the leaderboard: finalized, non-test, open-track comparisons.
const isCountedEvaluation = e => e.finalized === true && !e.test && (e.track || 'open') === 'open'

export function loadReviews(robotId, onChange) {
  if (store.reviews[robotId]) return
  store.reviews[robotId] = 'loading'
  get(`/eval/review/fine-tuning?robot_id=${encodeURIComponent(robotId)}`)
    .then(data => { store.reviews[robotId] = (data.trials || []).filter(t => t.state === 'completed' && !t.test) })
    .catch(() => { store.reviews[robotId] = [] })
    .finally(onChange)
}

export const board = (robotId, track) => store.boards[`${robotId}/${track}`] || []
export const rankedOpen = robotId => board(robotId, 'open')
  .filter(row => row.status !== 'pending' && Number(row.evals) > 0 && Number.isFinite(row.score))
  .sort((a, b) => a.rank - b.rank)
export const fineRows = robotId => board(robotId, 'fine-tuning').filter(row => Number(row.trials) > 0)
export const hasData = robotId => rankedOpen(robotId).length > 0 || fineRows(robotId).length > 0

export function totals() {
  const boardsOk = store.ready && ![...store.failed].some(key => key.includes('/'))
  const open = ROBOTS.flatMap(r => board(r.id, 'open'))
  const fine = ROBOTS.flatMap(r => board(r.id, 'fine-tuning'))
  const scenes = store.evaluations && !store.failed.has('evaluations')
    ? new Set(store.evaluations.filter(e => e.scene && e.scene.trim()).map(e => `${e.robotId}/${e.scene.trim().toLowerCase()}`)).size
    : null
  return {
    // Each comparison counts once for each of its two policies.
    comparisons: boardsOk ? Math.round(open.reduce((n, row) => n + Number(row.evals || 0), 0) / 2) : null,
    fineTrials: boardsOk ? fine.reduce((n, row) => n + Number(row.trials || 0), 0) : null,
    scenes,
    embodiments: store.ready ? ROBOTS.filter(r => hasData(r.id)).length : null,
  }
}

export const fmt = value => value === null || value === undefined ? '—' : Number(value).toLocaleString('en-US')
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const FAMILIES = [
  ['groot-n17', 'GR00T N1.7'], ['gr00t-n17', 'GR00T N1.7'], ['pi05', 'π0.5'], ['g05', 'G0.5'],
  ['molmoact2', 'MolmoAct2'], ['lingbot-vla', 'LingBot VLA'], ['lingbot-molmoact2', 'LingBot-MolmoAct2'], ['lap-3b', 'LAP 3B'],
  ['claude-opus-5-5', 'Claude Opus 5.5'], ['gpt-6-astra', 'GPT-6 Astra'], ['grok-4.7', 'Grok 4.7'],
]
export function policyLabel(policy) {
  const id = String(policy || '').split('@')[0]
  const family = FAMILIES.find(([prefix]) => id === prefix || id.startsWith(prefix + '-'))
  return family ? family[1] : id.replace(/-(so101|yam|droid|franka|g1)$/, '')
}
// Two revisions of one family on the same board get a short revision tag.
export function labelRows(rows, key) {
  const counts = {}
  rows.forEach(row => { const label = policyLabel(row[key]); counts[label] = (counts[label] || 0) + 1 })
  return rows.map(row => {
    const label = policyLabel(row[key])
    const revision = String(row[key] || '').split('@')[1]
    return { ...row, label: counts[label] > 1 && revision ? `${label} · ${revision.slice(0, 7)}` : label }
  })
}

const humanize = value => String(value || '').replace(/[_-]+/g, ' ').trim().replace(/^./, c => c.toUpperCase())
export function sentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.replace(/^./, c => c.toUpperCase()).replace(/[^.!?]$/, c => c + '.')
}
function taskInfo(row, robotId) {
  const stem = String(row.taskId || '').replace(new RegExp(`^${robotId}-`), '').replace(/-v\d+$/, '')
  const text = String(row.task || '').trim()
  const isSentence = /\s/.test(text) && /[.!?]$/.test(text)
  return { id: row.taskId || text, name: isSentence || !text ? humanize(stem) : humanize(text), instruction: isSentence ? sentence(text) : '' }
}

export function wilson(k, n) {
  if (!n) return [0, 0]
  const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
  return [Math.max(0, (c - m) / d) * 100, Math.min(1, (c + m) / d) * 100]
}

// Per-trial outcomes: 1 full success, 0.5 partial progress, 0 no progress.
function episodes(trials, policyId, taskId) {
  return trials.filter(t => t.policy_id === policyId && t.task_id === taskId)
    .map(t => ({ n: Number((String(t.feedback).match(/(?:episode|trial)\s+(\d+)/i) || [])[1]) || 0, created: t.created || '', v: t.success ? 1 : Number(t.partial_success) > 0 ? 0.5 : 0 }))
    .sort((a, b) => a.n - b.n || a.created.localeCompare(b.created))
    .map(e => e.v)
}

export function explorer(state) {
  const robot = ROBOTS.find(r => r.id === state.robot) || ROBOTS[0]
  const robots = ROBOTS.map(r => ({ id: r.id, name: r.name, active: r.id === robot.id }))
  const tracks = [
    { id: 'open', label: 'A/B', name: 'Open track', active: state.track === 'open' },
    { id: 'fine', label: '✓/4', name: 'Fine-tuning', active: state.track === 'fine' },
  ]
  const open = labelRows(rankedOpen(robot.id), 'policy')
  const fine = fineRows(robot.id)
  const base = { robot, robots, tracks, taskChips: [], rows: [], openRows: [], headline: '', sub: '', hasUnknown: false, portrait: ASSETS + robot.img + '.webp' }
  const boardsFailed = TRACKS.some(track => store.failed.has(`${robot.id}/${track}`))
  if (!store.ready) return { ...base, mode: 'loading', headline: 'Loading the benchmark…' }
  if (boardsFailed && !open.length && !fine.length) return { ...base, mode: 'error', headline: `${robot.name} results are temporarily unavailable.`, sub: 'The production API did not respond. Reload to try again.' }
  if (!open.length && !fine.length) return { ...base, mode: 'soon', headline: `${robot.name} evaluations are coming soon.`, sub: 'Same protocol, two tracks. The roster keeps growing.' }

  if (state.track === 'open') {
    if (!open.length) return { ...base, mode: 'noopen', headline: `No open-track comparisons for ${robot.name} yet.` }
    const scores = open.map(r => r.score)
    const lo = Math.min(...scores), hi = Math.max(...scores), pad = Math.max(40, (hi - lo) * 0.12)
    const d0 = lo - pad, d1 = hi + pad, pos = v => Math.min(100, Math.max(0, (v - d0) / (d1 - d0) * 100))
    const comparisons = Math.round(open.reduce((n, r) => n + r.evals, 0) / 2)
    const openRows = open.map((r, i) => ({
      rank: String(i + 1).padStart(2, '0'), name: r.label, score: Math.round(r.score), std: Math.round(r.std || 0),
      evals: r.evals, wins: r.wins, ties: r.ties, losses: r.losses,
      at: pos(r.score) + '%', from: pos(r.score - (r.std || 0)) + '%', span: (pos(r.score + (r.std || 0)) - pos(r.score - (r.std || 0))) + '%',
    }))
    const top = openRows[0]
    return {
      ...base, mode: 'open', openRows, comparisons,
      headline: `${top.name} ranks first on ${robot.name}: rating ${fmt(top.score)} ± ${top.std} from ${fmt(top.evals)} comparisons.`,
      sub: `${fmt(comparisons)} blind comparisons on ${robot.name} · fitted ratings with ±1 standard error, within this body only.`,
    }
  }

  if (!fine.length) return { ...base, mode: 'nofine', headline: `No published fine-tuning tasks for ${robot.name} yet.` }
  const taskMap = new Map()
  for (const row of fine) {
    const info = taskInfo(row, robot.id)
    if (!taskMap.has(info.id)) taskMap.set(info.id, { ...info, rows: new Map() })
    taskMap.get(info.id).rows.set(row.policyId || row.policy, row)
  }
  const tasks = [...taskMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const taskChips = [{ id: 'all', name: 'All tasks', active: state.task === 'all' }]
    .concat(tasks.map(t => ({ id: t.id, name: t.name, active: state.task === t.id })))
  const selected = state.task === 'all' ? tasks : tasks.filter(t => t.id === state.task)
  const shown = selected.length ? selected : tasks
  const reviews = Array.isArray(store.reviews[robot.id]) ? store.reviews[robot.id] : []
  const policies = [...new Set(fine.map(r => r.policyId || r.policy))]
  let hasUnknown = false
  const rows = labelRows(policies.map(policyId => ({ policyId })), 'policyId').map(({ policyId, label }) => {
    let trials = 0, successes = 0, progressSum = 0
    const blocks = shown.map(task => {
      const row = task.rows.get(policyId)
      if (!row) return { task: `${task.name} · not run`, cells: Array.from({ length: 25 }, () => 'empty') }
      trials += row.trials; successes += row.successes; progressSum += Number(row.progress || 0) * row.trials
      const known = episodes(reviews, policyId, row.taskId)
      let cells
      if (known.length === row.trials) cells = known.map(v => v === 1 ? 'success' : v === 0.5 ? 'partial' : 'fail')
      else {
        // Outside the review endpoint's window: keep the exact leaderboard totals.
        cells = Array.from({ length: row.trials }, (_, i) => i < row.successes ? 'success' : 'unknown')
        if (row.trials > row.successes) hasUnknown = true
      }
      while (cells.length < 25) cells.push('empty')
      return { task: `${task.name} · ${row.successes} / ${row.trials} full success`, cells }
    })
    const rate = trials ? Math.round(successes / trials * 100) : 0
    const progress = trials ? Math.round(progressSum / trials) : 0
    const [lo, hi] = wilson(successes, trials)
    return { policyId, name: label, rate, progress, trials, successes, blocks, lo: Math.round(lo), hi: Math.round(hi), loPct: lo + '%', spanPct: (hi - lo) + '%', ratePct: Math.min(rate, 99) + '%', dim: Boolean(state.focus && state.focus !== policyId) }
  }).filter(r => r.trials > 0)
    .sort((a, b) => b.rate - a.rate || b.progress - a.progress)
    .map((r, i) => ({ ...r, rank: String(i + 1).padStart(2, '0') }))
  const single = selected.length === 1 ? selected[0] : null
  const total = rows.reduce((n, r) => n + r.trials, 0)
  const top = rows[0]
  return {
    ...base, mode: 'fine', taskChips, rows, hasUnknown,
    reviewsLoading: store.reviews[robot.id] === 'loading',
    headline: single ? (single.instruction ? `“${single.instruction}”` : `${single.name}: ${top.name} leads with ${top.rate}% full success${top.trials < 25 ? ` (${top.successes} of ${top.trials} trial${top.trials === 1 ? '' : 's'} so far)` : ''}.`)
      : `${top.name} leads ${robot.name} with ${top.rate}% full success across ${tasks.length} task${tasks.length === 1 ? '' : 's'}.`,
    sub: single ? `${single.name} · ${fmt(total)} trials · ${top.name} ${top.rate}%`
      : `${fmt(total)} scored trials · ${rows.length} policies · up to 25 per task per policy`,
  }
}

// Hero: the curated evaluation's verdict and footage, read from the API.
export function hero() {
  const evaluation = store.evaluations?.find(e => e.id === HERO_EVALUATION) || null
  const side = evaluation?.winner === 'B' ? 'b' : 'a'
  const cams = store.heroVideos?.[side] || {}
  // The exterior camera shows the whole task (bowl, pear, arm); the head camera is a wrist close-up.
  const video = cams.left_image || cams.right_image || cams.head_image || Object.values(cams)[0] || ''
  const verdict = !evaluation ? null : evaluation.winner === 'A' ? 'Policy A' : evaluation.winner === 'B' ? 'Policy B' : 'Tie'
  return {
    loading: !store.evaluations,
    evaluation, video, side: side.toUpperCase(), verdict,
    tag: evaluation ? `${evaluation.id.slice(0, 11).toUpperCase()} · FRANKA · OPEN TRACK${evaluation.scene ? ' · ' + evaluation.scene.trim().toUpperCase() : ''}` : HERO_EVALUATION.slice(0, 11).toUpperCase() + ' · FRANKA · OPEN TRACK',
    instruction: evaluation ? sentence(evaluation.instruction || evaluation.task) : '',
    scene: evaluation?.scene?.trim() || '',
  }
}

// Short live summaries for the robot showcase panels.
export function summary(robotId) {
  const open = labelRows(rankedOpen(robotId), 'policy')
  const fine = fineRows(robotId)
  // Only a complete 25-trial block is quoted as a headline result.
  const best = fine.filter(r => r.trials >= 25).sort((a, b) => b.successRate - a.successRate || b.progress - a.progress)[0]
  return {
    comparisons: Math.round(open.reduce((n, r) => n + r.evals, 0) / 2),
    policies: open.length,
    leader: open[0]?.label || '',
    best: best ? { policy: policyLabel(best.policyId || best.policy), task: taskInfo(best, robotId).name, successes: best.successes, trials: best.trials } : null,
  }
}

export const appLink = (path, params) => `${APP}${path}${params ? '?' + new URLSearchParams(params) : ''}`
