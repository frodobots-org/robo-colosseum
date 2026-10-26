// v6: the launch page. The film's order (problem, reveal, fleet, how it works, open data, invitation) on the night palette.
// One call to action, "Submit your policy", in four places with one destination. Everything numeric is read from /api.
import { API, ASSETS, ROBOTS, store, totals, rankedOpen, fineRows, hasData, fmt, esc, appLink } from '../landing/live.js'
import { openRows, fineRowsModel, mark } from '../v3/board.js'
import { matchup } from './matchup.js'

const $ = (s, el = document) => el.querySelector(s)
const ROOT = window.RC_ROOT || '/'
const VIDEO = `${ROOT}v4/video/`
const SUBMIT = appLink('/submit')

// The fleet as the launch film states it; the live line under each robot comes from the API.
const FLEET = [
  { id: 'g1', name: 'Unitree G1', count: 30, unit: 'humanoids', img: `${ASSETS}g1.webp` },
  { id: 'yam', name: 'Bimanual YAM', count: 25, unit: 'pairs of arms', img: `${ASSETS}yam.webp`, mirror: true },
  { id: 'franka', name: 'Franka', unit: 'Arms in the DROID setup', img: `${ASSETS}franka.webp` },
  { id: 'so101', name: 'SO-ARM101', unit: 'Low-cost single arms', img: `${ASSETS}so101.webp` },
  { id: 'earth-rover', name: 'Earth Rover Mini+', unit: 'Wheeled rovers, outdoors', img: `${ROOT}v3/bodies/earth-rover-mini-plus.webp`, joining: true },
]

const PARTNERS = [
  { name: 'NUS MAGIC Lab', role: 'Scientific protocol', href: 'https://magiclab-nus.github.io/', logo: `<img src="${ASSETS}magic-lab-logo.webp" alt="MAGIC Lab, NUS" class="magic">` },
  { name: 'BitRobot', role: 'Robot fleet and operations', href: 'https://bitrobot.ai/', logo: `<img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" class="br">` },
  { name: 'EAIC Singapore', role: 'Evaluation sites in Singapore', href: 'https://nrp.gov.sg/', logo: '<span class="eaic"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></span>' },
  { name: 'Hugging Face', role: 'Open data and LeRobot', href: 'https://huggingface.co/', logo: `<span class="hf"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></span>` },
]

// Static wiring: the one call to action, the brand, partners, footer.
document.querySelectorAll('[data-cta]').forEach(a => { a.href = SUBMIT })
$('#brand-mark').src = `${ROOT}brand/rc-mark-white.svg`
$('#partners').innerHTML = PARTNERS.map(p => `<li><a href="${p.href}" aria-label="${esc(p.name)}">${p.logo}</a><span>${esc(p.role)}</span></li>`).join('')
$('#footer').innerHTML = `<div class="foot-brand"><img src="${ROOT}brand/rc-lockup-white.svg" alt="RoboColosseum" height="40"><p>Founded by NUS MAGIC Lab, BitRobot, EAIC Singapore and Hugging Face.</p></div>
  <nav aria-label="Footer"><div><h3>The benchmark</h3><ul><li><a href="${appLink('/leaderboard')}">Leaderboard</a></li><li><a href="${appLink('/evals')}">Evaluations</a></li><li><a href="${appLink('/tasks')}">Tasks and protocol</a></li><li><a href="https://huggingface.co/RoboColosseum">Open data</a></li></ul></div>
  <div><h3>Take part</h3><ul><li><a href="${SUBMIT}">Submit your policy</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li></ul></div>
  <div><h3>Follow</h3><ul><li><a href="https://x.com/RoboColosseum">X</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum">Hugging Face</a></li></ul></div></nav>`

// Videos: play only while visible, never for people who asked for reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
function playWhenVisible(video) {
  if (still) { video.removeAttribute('autoplay'); video.pause(); return }
  new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? video.play().catch(() => {}) : video.pause() })).observe(video)
}

// The hero film; its caption follows the cut list that ships with it.
const film = $('#film'), caption = $('#caption')
film.poster = `${VIDEO}mashup.jpg`; film.src = `${VIDEO}mashup.mp4`
let cues = [], current = -1
fetch(`${VIDEO}cues.json`).then(r => r.ok ? r.json() : []).then(list => { cues = list }).catch(() => {})
film.addEventListener('timeupdate', () => {
  const t = film.currentTime
  const i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  caption.innerHTML = `<b>${esc(c.body)}</b> ${esc(c.place)}${c.date ? `<span>${esc(c.date)}</span>` : ''}`
})
playWhenVisible(film)

// The wall of real scenes: twelve evaluations at once, labelled in reading order.
const wall = $('#wall')
wall.poster = `${VIDEO}wall.jpg`; wall.src = `${VIDEO}wall.mp4`
fetch(`${VIDEO}wall.json`).then(r => r.ok ? r.json() : []).then(tiles => {
  $('#wall-labels').innerHTML = tiles.map(t => `<li>${esc(t.body)}<span>${esc(t.place)}</span></li>`).join('')
}).catch(() => {})
playWhenVisible(wall)

// Live data: the eight boards first, then the evaluation list (large, ~10 MB) for the matchup, freshness and scene count.
const get = path => fetch(API + path, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
const counted = e => e.finalized === true && !e.test && (e.track || 'open') === 'open'
function load(onChange) {
  Promise.all(ROBOTS.flatMap(robot => ['open', 'fine-tuning'].map(track => get(`/leaderboard?robot=${robot.id}&track=${track}`)
    .then(data => { store.boards[`${robot.id}/${track}`] = (data.board || []).filter(row => row.robotId === robot.id && row.track === track) })
    .catch(() => store.failed.add(`${robot.id}/${track}`)))))
    .then(() => { store.ready = true; onChange() })
  get('/list_ab_evaluations')
    .then(data => { store.evaluations = (data.evaluations || []).filter(counted) })
    .catch(() => { store.failed.add('evaluations'); store.evaluations = [] })
    .finally(onChange)
}

const policiesOn = id => new Set([...rankedOpen(id), ...fineRows(id)].map(r => r.policyId || r.policy)).size
const ago = iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago` }
const n = v => `<span class="n">${fmt(v)}</span>`

// One sentence of proof under the hero.
function proof() {
  if (!store.ready) return
  const t = totals()
  const policies = new Set(ROBOTS.flatMap(r => [...rankedOpen(r.id), ...fineRows(r.id)].map(x => x.policyId || x.policy))).size
  const latest = store.evaluations?.length ? store.evaluations.reduce((m, e) => (e.date > m ? e.date : m), '') : ''
  const parts = []
  if (t.comparisons) parts.push(`${n(t.comparisons)} blind head-to-head comparisons`)
  if (t.fineTrials) parts.push(`${n(t.fineTrials)} scored trials`)
  $('#proof').innerHTML = `${parts.join(' and ')} so far, from ${n(policies)} policies on ${n(t.embodiments)} robot types.${latest ? ` Latest result ${esc(ago(latest))}.` : ''}`
}

// The leaderboard preview: one robot and one measurement at a time, the top five.
const board = { robot: 'franka', track: 'open' }
const MIN = { open: 20, fine: 10 }
function rankings() {
  const has = { open: id => rankedOpen(id).length > 0, fine: id => fineRows(id).length > 0 }
  if (store.ready) {
    if (!hasData(board.robot)) board.robot = ROBOTS.find(r => hasData(r.id))?.id || board.robot
    if (!has[board.track](board.robot)) board.track = board.track === 'open' ? 'fine' : 'open'
  }
  const tab = (key, value, label, on, disabled) => `<button type="button" role="tab" data-${key}="${value}" aria-selected="${on}"${disabled ? ' disabled' : ''}>${esc(label)}</button>`
  $('#robot-tabs').innerHTML = ROBOTS.map(r => tab('robot', r.id, r.name, r.id === board.robot, store.ready && !hasData(r.id))).join('')
  $('#track-tabs').innerHTML = tab('track', 'open', 'Head-to-head', board.track === 'open', store.ready && !has.open(board.robot))
    + tab('track', 'fine', 'Standard tasks', board.track === 'fine', store.ready && !has.fine(board.robot))
  const rows = $('#rows'), note = $('#board-note')
  $('#board-link').href = appLink('/leaderboard', { robot: board.robot, track: board.track === 'open' ? 'open' : 'fine-tuning' })
  if (!store.ready) { rows.innerHTML = Array.from({ length: 5 }, () => '<li class="row loading"><span class="skel" style="min-width:60%">&nbsp;</span></li>').join(''); note.textContent = ''; return }
  const model = board.track === 'open' ? openRows(board.robot) : fineRowsModel(board.robot)
  const robot = ROBOTS.find(r => r.id === board.robot)
  if (!model) { rows.innerHTML = `<li class="row empty">No results for ${esc(robot.name)} yet.</li>`; note.textContent = ''; return }
  const evidence = board.track === 'open'
    ? Object.fromEntries(rankedOpen(board.robot).map(r => [r.policy, Number(r.evals) || 0]))
    : Object.fromEntries(model.rows.map(r => [r.policy, Number(r.em.split('/')[1]) || 0]))
  rows.innerHTML = model.rows.slice(0, 5).map(r => {
    const low = (evidence[r.policy] ?? 0) < MIN[board.track]
    const bar = board.track === 'open'
      ? `<i class="ci" style="left:${r.lo}%;width:${r.span}%"></i><i class="pt" style="left:${r.at}%"></i>`
      : `<i class="fill" style="width:${r.w}%"></i><i class="ci" style="left:${r.lo}%;width:${r.span}%"></i>`
    const value = board.track === 'open' ? `${r.value}<small>${r.em}</small>` : `${r.value}%<small>${r.em}</small>`
    return `<li class="row${low ? ' low' : ''}" aria-label="${esc(r.aria)}${low ? ', few evaluations so far' : ''}">
      <span class="rk">${r.rank}</span>${mark(r.policy, 30)}
      <span class="who"><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></span>
      <span class="bar" aria-hidden="true">${bar}</span>
      <span class="val">${value}</span></li>`
  }).join('')
  const more = model.rows.length > 5 ? ` Showing the top 5 of ${model.rows.length}.` : ''
  note.textContent = board.track === 'open'
    ? `Rating from blind head-to-head comparisons on ${robot.name}; ± is one standard error. Faded rows have fewer than 20 comparisons.${more}`
    : `Share of trials with full success across the standard tasks on ${robot.name}; the band is a 95% interval.${more}`
}
document.querySelector('.board-controls').addEventListener('click', e => {
  const b = e.target.closest('button[role="tab"]'); if (!b || b.disabled) return
  if (b.dataset.robot) board.robot = b.dataset.robot; else board.track = b.dataset.track
  rankings()
})

function fleet() {
  $('#fleet').innerHTML = FLEET.map(f => {
    const live = f.joining ? 'Joining' : !store.ready ? '<span class="skel">00 policies ranked</span>' : hasData(f.id) ? `${fmt(policiesOn(f.id))} policies ranked` : 'Results coming soon'
    return `<li><span class="stage"><img src="${f.img}" alt="" loading="lazy"${f.mirror ? ' class="mirror"' : ''}></span>
      <h3>${esc(f.name)}</h3><p class="count">${f.count ? `${n(f.count)} ${esc(f.unit)}` : esc(f.unit)}</p><p class="live${f.joining ? ' joining' : ''}">${live}</p></li>`
  }).join('')
}

function places() {
  const scenes = totals().scenes
  $('#places').innerHTML = `Evaluations run in homes, offices, pantries and campus spaces${scenes ? `: ${n(scenes)} distinct scenes recorded so far` : ''}.`
}

const pair = matchup($('#pair'))
function render() { proof(); rankings(); fleet(); places(); pair.refresh() }
render()
load(render)
