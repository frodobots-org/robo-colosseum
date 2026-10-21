// Loads the live data into the shared store a few requests at a time, boards first, the large evaluation list last.
// Firing everything at once stalled behind the browser's per-host connection limit; this keeps first paint quick.
import { API, ROBOTS, store } from '../landing/live.js'

const get = path => fetch(API + path, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
const isCounted = e => e.finalized === true && !e.test && (e.track || 'open') === 'open'

export function load(onChange) {
  const tasks = ROBOTS.flatMap(robot => ['open', 'fine-tuning'].map(track => () =>
    get(`/leaderboard?robot=${robot.id}&track=${track}`)
      .then(data => { store.boards[`${robot.id}/${track}`] = (data.board || []).filter(row => row.robotId === robot.id && row.track === track) })
      .catch(() => store.failed.add(`${robot.id}/${track}`))))
  let i = 0
  const next = () => i < tasks.length ? tasks[i++]().then(next) : Promise.resolve()
  Promise.all([next(), next(), next()])
    .then(() => { store.ready = true; onChange() })
    .then(() => get('/list_ab_evaluations'))
    .then(data => { store.evaluations = (data.evaluations || []).filter(isCounted) })
    .catch(() => { store.failed.add('evaluations'); store.evaluations = [] })
    .finally(onChange)
}
