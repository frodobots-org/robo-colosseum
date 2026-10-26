// Loads the live data into the shared store: the eight boards, the evaluation list and the fine-tuning reviews, all at once.
// Production is HTTP/2 behind Netlify, so parallel requests are cheap; the Vite dev proxy serializes them, so dev goes three at a time.
import { API, ROBOTS, store } from '../landing/live.js'

const get = path => fetch(API + path, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
const isCounted = e => e.finalized === true && !e.test && (e.track || 'open') === 'open'
const dev = location.port === '5173' // the Vite dev server; anything else gets the parallel path

export function load(onChange) {
  const tasks = ROBOTS.flatMap(robot => ['open', 'fine-tuning'].map(track => () =>
    get(`/leaderboard?robot=${robot.id}&track=${track}`)
      .then(data => { store.boards[`${robot.id}/${track}`] = (data.board || []).filter(row => row.robotId === robot.id && row.track === track) })
      .catch(() => store.failed.add(`${robot.id}/${track}`))))
  const evaluations = () => get('/list_ab_evaluations')
    .then(data => { store.evaluations = (data.evaluations || []).filter(isCounted) })
    .catch(() => { store.failed.add('evaluations'); store.evaluations = [] })
    .finally(onChange)
  const reviews = () => ROBOTS.map(robot => {
    store.reviews[robot.id] = 'loading'
    return get(`/eval/review/fine-tuning?robot_id=${encodeURIComponent(robot.id)}`)
      .then(data => { store.reviews[robot.id] = (data.trials || []).filter(t => t.state === 'completed' && !t.test) })
      .catch(() => { store.reviews[robot.id] = [] })
  })
  if (dev) {
    let i = 0
    const next = () => i < tasks.length ? tasks[i++]().then(next) : Promise.resolve()
    Promise.all([next(), next(), next()]).then(() => { store.ready = true; onChange() }).then(evaluations).then(() => Promise.all(reviews())).finally(onChange)
    return
  }
  Promise.all(tasks.map(task => task())).then(() => { store.ready = true; onChange() })
  evaluations()
  Promise.all(reviews()).finally(onChange)
}
