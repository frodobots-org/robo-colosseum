// v7: the launch page. Named sections in full-width bands, in the order of importance set in the 21 Oct 2026 huddle:
// in the wild, robots (cross-embodiment), scale; then the benchmark detail (leaderboard, how it works, one comparison,
// open data, academic access, FAQ). One call to action, "Submit your policy", with one destination everywhere.
// Fleet sizes and locations are fixed facts from the team; every other number is read from /api.
import { API, ASSETS, ROBOTS, store, totals, rankedOpen, fineRows, hasData, fmt, esc, appLink } from '../landing/live.js'
import { openRows, fineRowsModel, mark } from '../v3/board.js'
import { matchup } from './matchup.js'
import { ROOT, chrome } from './chrome.js'
import { SETUPS, setupDialog } from './setups.js'

const $ = (s, el = document) => el.querySelector(s)
const VIDEO = `${ROOT}v4/video/`
const PICS = `${ROOT}v7/robots/`

// The robot types we run. Fleet sizes are never shown: the page says "hundreds of robots" (user, 26 Oct 2026). The live
// line under each robot comes from the API. Robots with a documented setup open it on click.
const FLEET = [
  { id: 'g1', name: 'Unitree G1', kind: 'Humanoid with two grippers', img: `${PICS}g1.webp` },
  { id: 'yam', name: 'Bimanual YAM', kind: 'Two-arm station', img: `${PICS}yam.webp` },
  { id: 'franka', name: 'Franka', kind: 'Single arm, DROID setup', img: `${PICS}franka.webp` },
  { id: 'so101', name: 'SO-ARM101', kind: 'Low-cost single arm', img: `${PICS}so101.webp` },
  { id: 'earth-rover', name: 'Earth Rover Mini+', kind: 'Outdoor wheeled robot', img: `${ROOT}v3/bodies/earth-rover-mini-plus.webp`, joining: true },
]

// Where evaluation happens, as the team confirmed it on 26 Oct 2026. The two tracks are kept apart: open-track runs happen
// in these places, while the fine-tuning datasets were recorded in those.
const PLACES = {
  open: ['Singapore', 'China', 'Seattle, United States', 'Oxford, United Kingdom'],
  fine: ['Singapore', 'Kuala Lumpur, Malaysia', 'China'],
}
const COUNTRIES = new Set([...PLACES.open, ...PLACES.fine].map(p => p.split(', ').at(-1))).size

const PARTNERS = [
  { name: 'NUS MAGIC Lab', href: 'https://magiclab-nus.github.io/', logo: `<img src="${ASSETS}magic-lab-logo.webp" alt="MAGIC Lab, NUS" class="magic">` },
  { name: 'BitRobot', href: 'https://bitrobot.ai/', logo: `<img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" class="br">` },
  { name: 'EAIC Singapore', href: 'https://nrp.gov.sg/', logo: `<span class="eaic"><img src="${ASSETS}eaic-mark.webp" alt="EAIC"><span>Embodied AI Centre<br>Singapore</span></span>` },
  { name: 'Hugging Face', href: 'https://huggingface.co/', logo: `<span class="hf"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></span>` },
]

// Static wiring: the shared chrome, partners, places, the setup dialog.
chrome()
$('#evaluations .band-link').href = appLink('/evals')
$('#partners').innerHTML = PARTNERS.map(p => `<li><a href="${p.href}" aria-label="${esc(p.name)}">${p.logo}</a></li>`).join('')
$('#sites').innerHTML = [['Open track', 'Evaluations run in', PLACES.open], ['Fine-tuning track', 'Datasets recorded in', PLACES.fine]]
  .map(([track, verb, places]) => `<div><dt>${track}</dt><dd><span>${verb}</span><ul>${places.map(p => `<li>${esc(p)}</li>`).join('')}</ul></dd></div>`).join('')
const openSetup = setupDialog($('#setup'))
$('#fleet').addEventListener('click', e => { const b = e.target.closest('[data-setup]'); if (b) openSetup(b.dataset.setup) })

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
  caption.innerHTML = `<b>${esc(c.body)}</b> ${esc(c.place.replace('Four bodies', 'Four robot types'))}${c.date ? `<span>${esc(c.date)}</span>` : ''}`
})
playWhenVisible(film)

// The wall of real scenes: twelve evaluations at once, labelled in reading order.
const wall = $('#wall')
wall.poster = `${VIDEO}wall.jpg`; wall.src = `${VIDEO}wall.mp4`
fetch(`${VIDEO}wall.json`).then(r => r.ok ? r.json() : []).then(tiles => {
  $('#wall-labels').innerHTML = tiles.map(t => `<li>${esc(t.body)}<span>${esc(t.place)}</span></li>`).join('')
}).catch(() => {})
playWhenVisible(wall)

// Live data: the eight boards, each shown as soon as it arrives (one slow board must not hold up the rest; a failed one is
// retried once), then the evaluation list (large, ~10 MB) for the matchup, freshness and scene count.
const get = path => fetch(API + path, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
const counted = e => e.finalized === true && !e.test && (e.track || 'open') === 'open'
const KEY = (id, track) => `${id}/${track === 'fine' ? 'fine-tuning' : track}`
const loaded = (id, track) => store.boards[KEY(id, track)] !== undefined || store.failed.has(KEY(id, track))
const robotLoaded = id => loaded(id, 'open') && loaded(id, 'fine')
function load(onChange) {
  const fetchBoard = (robot, track, retry) => get(`/leaderboard?robot=${robot}&track=${track}`)
    .then(data => { store.boards[`${robot}/${track}`] = (data.board || []).filter(row => row.robotId === robot && row.track === track) })
    .catch(() => retry ? fetchBoard(robot, track, false) : store.failed.add(`${robot}/${track}`))
    .finally(onChange)
  Promise.all(ROBOTS.flatMap(robot => ['open', 'fine-tuning'].map(track => fetchBoard(robot.id, track, true))))
    .then(() => { store.ready = true; onChange() })
  get('/list_ab_evaluations')
    .then(data => { store.evaluations = (data.evaluations || []).filter(counted) })
    .catch(() => { store.failed.add('evaluations'); store.evaluations = [] })
    .finally(onChange)
}

const policiesOn = id => new Set([...rankedOpen(id), ...fineRows(id)].map(r => r.policyId || r.policy)).size
const ago = iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago` }
const n = v => `<span class="n">${fmt(v)}</span>`

// True once every board has answered and none failed: only then are counts across all robots complete.
const allBoards = () => store.ready && ![...store.failed].some(key => key.includes('/'))
const policyCount = () => new Set(ROBOTS.flatMap(r => [...rankedOpen(r.id), ...fineRows(r.id)].map(x => x.policyId || x.policy))).size
const evaluations = () => store.evaluations && !store.failed.has('evaluations') ? store.evaluations : null
const list = parts => parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join('')
const day = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// The leaderboard's lede says how fresh the rankings are.
function proof() {
  const ev = evaluations()
  if (!ev?.length) return
  const latest = ev.reduce((m, e) => (e.date > m ? e.date : m), '')
  $('#proof').innerHTML = `Who leads on each robot right now. Top five per robot, updated as each evaluation finishes; the last one came in ${esc(ago(latest))}.`
}

// Scale on several axes at once. A figure that cannot be counted yet stays a placeholder rather than showing a partial total.
function scale() {
  const t = totals(), ev = evaluations()
  const instructions = ev ? new Set(ev.map(e => String(e.instruction || e.task || '').trim().toLowerCase()).filter(Boolean)).size : null
  const runs = t.comparisons !== null && t.fineTrials !== null ? 2 * t.comparisons + t.fineTrials : null
  const live = allBoards() ? t.embodiments : null, joining = FLEET.filter(f => f.joining).length
  const figures = [
    [runs, 'recorded runs', 'Both sides of every comparison, plus every task attempt.'],
    [t.scenes, 'scenes', 'Homes, offices, labs, canteens and corridors.'],
    [instructions, 'different instructions', 'Written on the spot by the evaluators.'],
    [allBoards() ? policyCount() : null, 'policies evaluated', 'Ranked on public leaderboards.'],
    [COUNTRIES, 'countries', 'Where open-track runs happen and fine-tuning data was recorded.'],
    [live, 'robot types', joining ? `${joining} more joining.` : 'Each with its own leaderboard.'],
  ]
  const settled = store.ready && store.evaluations !== null
  $('#figures').innerHTML = figures.map(([v, label, note]) => `<div><dt>${v !== null ? `<span class="n">${fmt(v)}</span>` : settled ? '<span class="n" title="Could not be counted right now">—</span>' : '<span class="skel">0,000</span>'}</dt><dd><b>${esc(label)}</b>${esc(note)}</dd></div>`).join('')
  if (ev?.length) {
    const first = ev.reduce((m, e) => (e.date && e.date < m ? e.date : m), '9999')
    $('#scale-lede').textContent = `Counted live from every evaluation since the first comparison on ${day(first)}.`
  }
}

// The leaderboard preview: one robot and one measurement at a time, the top five.
const board = { robot: 'franka', track: 'open', chosen: false }
const MIN = { open: 20, fine: 10 }
function rankings() {
  const has = { open: id => rankedOpen(id).length > 0, fine: id => fineRows(id).length > 0 }
  const empty = (id, track) => loaded(id, track) && !store.failed.has(KEY(id, track)) && !has[track](id)
  const failedRobot = id => store.failed.has(KEY(id, 'open')) && (store.failed.has(KEY(id, 'fine')) || !has.fine(id))
  if (!board.chosen && robotLoaded(board.robot) && failedRobot(board.robot)) board.robot = ROBOTS.find(r => hasData(r.id))?.id || board.robot
  if (robotLoaded(board.robot)) {
    if (empty(board.robot, 'open') && empty(board.robot, 'fine') && store.ready) board.robot = ROBOTS.find(r => hasData(r.id))?.id || board.robot
    if (empty(board.robot, board.track) && has[board.track === 'open' ? 'fine' : 'open'](board.robot)) board.track = board.track === 'open' ? 'fine' : 'open'
  }
  const tab = (key, value, label, on, disabled) => `<button type="button" role="tab" data-${key}="${value}" aria-selected="${on}"${disabled ? ' disabled' : ''}>${esc(label)}</button>`
  $('#robot-tabs').innerHTML = ROBOTS.map(r => tab('robot', r.id, r.name, r.id === board.robot, empty(r.id, 'open') && empty(r.id, 'fine'))).join('')
  $('#track-tabs').innerHTML = tab('track', 'open', 'Head-to-head', board.track === 'open', empty(board.robot, 'open'))
    + tab('track', 'fine', 'Standard tasks', board.track === 'fine', empty(board.robot, 'fine'))
  const rows = $('#rows'), note = $('#board-note')
  const robot = ROBOTS.find(r => r.id === board.robot)
  $('#board-link').href = appLink('/leaderboard', { robot: board.robot, track: board.track === 'open' ? 'open' : 'fine-tuning' })
  if (!loaded(board.robot, board.track)) { rows.innerHTML = Array.from({ length: 5 }, () => '<li class="row loading"><span class="skel" style="min-width:60%">&nbsp;</span></li>').join(''); note.textContent = ''; return }
  if (store.failed.has(KEY(board.robot, board.track))) { rows.innerHTML = `<li class="row empty">The ${esc(robot.name)} rankings did not load. Reload the page, or open the full leaderboard.</li>`; note.textContent = ''; return }
  const model = board.track === 'open' ? openRows(board.robot) : fineRowsModel(board.robot)
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
  const more = model.rows.length > 5 ? ` Top 5 of ${model.rows.length} shown.` : ''
  note.textContent = board.track === 'open'
    ? `Ratings on ${robot.name} from blind comparisons; ± is one standard error. Faded rows have fewer than 20 comparisons so far.${more}`
    : `Full successes on ${robot.name}'s standard tasks; the band is a 95% interval. Faded rows have fewer than 10 trials so far.${more}`
}
document.querySelector('.board-controls').addEventListener('click', e => {
  const b = e.target.closest('button[role="tab"]'); if (!b || b.disabled) return
  if (b.dataset.robot) { board.robot = b.dataset.robot; board.chosen = true } else board.track = b.dataset.track
  rankings()
})

function fleet() {
  $('#fleet').innerHTML = FLEET.map(f => {
    const failed = store.failed.has(KEY(f.id, 'open')) || store.failed.has(KEY(f.id, 'fine'))
    const live = f.joining ? 'Joining' : !robotLoaded(f.id) ? '<span class="skel">00 policies ranked</span>' : failed ? 'Rankings did not load' : hasData(f.id) ? `${fmt(policiesOn(f.id))} policies ranked` : 'Results coming soon'
    const body = `<span class="stage"><img src="${f.img}" alt="" loading="lazy"></span>
      <h3>${esc(f.name)}</h3><p class="kind">${esc(f.kind)}</p><p class="live${f.joining ? ' joining' : ''}">${live}</p>`
    return SETUPS[f.id]
      ? `<li><button type="button" class="robot" data-setup="${f.id}" aria-haspopup="dialog">${body}<span class="see">See the setup and parts</span></button></li>`
      : `<li class="robot">${body}</li>`
  }).join('')
}

// Under the wall: how the scenes spread across robot types.
function places() {
  const ev = evaluations(), scenes = totals().scenes
  if (!ev || !scenes) return
  const per = ROBOTS.map(r => ({ name: r.name, count: new Set(ev.filter(e => e.robotId === r.id && e.scene?.trim()).map(e => e.scene.trim().toLowerCase())).size }))
    .filter(r => r.count).sort((a, b) => b.count - a.count)
  $('#places').innerHTML = `Twelve recorded evaluations, played together. ${n(scenes)} scenes on record so far: ${list(per.map(r => `${n(r.count)} for ${esc(r.name)}`))}.`
}

const pair = matchup($('#pair'))
function render() { proof(); scale(); rankings(); fleet(); places(); pair.refresh() }
render()
load(render)
