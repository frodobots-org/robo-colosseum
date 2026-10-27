// v8: the launch page in the new brand, after the 26 Oct 2026 launch meeting. Order: hero (evaluation and benchmarking,
// in the wild), the 10,000-hour offer, the current benchmark, in the wild, robots, scale, then how it works, a preview of
// the evaluation viewer, open data, FAQ and the application form. One call to action, "Apply for free evaluation",
// and every copy of it leads to the form. Numbers come from the daily snapshot (/api/stats and the published boards),
// never from a live count, and carry the date they were counted.
import { API, ASSETS, ROBOTS, store, rankedOpen, fineRows, hasData, fmt, esc, appLink } from '../landing/live.js'
import { openRows, fineRowsModel, mark } from '../v3/board.js'
import { SETUPS, setupDialog } from '../v7/setups.js'
import { ROOT, chrome } from './chrome.js'
import { viewer } from './viewer.js'
import { HUB, TRAINING, HOURS, EVAL_SETS, EVAL_EXAMPLE } from './datasets.js'

const $ = (s, el = document) => el.querySelector(s)
const VIDEO = `${ROOT}v8/video/`
const PICS = `${ROOT}v7/robots/`

// The robot types we run. Fleet sizes are never shown: the page says "hundreds of robots" (user, 26 Oct 2026).
const FLEET = [
  { id: 'g1', api: 'g1', name: 'Unitree G1', kind: 'Humanoid with two grippers', img: `${PICS}g1.webp` },
  { id: 'yam', api: 'yam', name: 'Bimanual YAM', kind: 'Two-arm station', img: `${PICS}yam.webp` },
  { id: 'franka', api: 'franka', name: 'Franka', kind: 'Single arm, DROID setup', img: `${PICS}franka.webp` },
  { id: 'so101', api: 'so101', name: 'SO-ARM101', kind: 'Low-cost single arm', img: `${PICS}so101.webp` },
  { id: 'earth-rover', api: 'earth_rover_mini_plus', name: 'Earth Rover Mini+', kind: 'Outdoor wheeled robot', img: `${ROOT}v3/bodies/earth-rover-mini-plus.webp`, joining: true },
]
const NAMES = Object.fromEntries(FLEET.map(f => [f.api, f.name]))

// Where evaluation happens, as the team confirmed it on 26 Oct 2026, kept apart by track.
const PLACES = {
  open: ['Singapore', 'China', 'Seattle, United States', 'Oxford, United Kingdom'],
  fine: ['Singapore', 'Kuala Lumpur, Malaysia', 'China'],
}
const COUNTRIES = new Set([...PLACES.open, ...PLACES.fine].map(p => p.split(', ').at(-1))).size

const PARTNERS = [
  { name: 'NUS MAGIC Lab', href: 'https://magiclab-nus.github.io/', logo: `<img src="${ASSETS}magic-lab-logo.webp" alt="MAGIC Lab, NUS" class="magic">` },
  { name: 'BitRobot', href: 'https://bitrobot.ai/', logo: `<img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" class="br">` },
  { name: 'EAIC Singapore', href: 'https://nrp.gov.sg/', logo: '<span class="eaic"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></span>' },
  { name: 'Hugging Face', href: 'https://huggingface.co/', logo: `<span class="hf"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></span>` },
]

// Static wiring: chrome, partners, places, the setup dialog, the open-data repositories.
chrome()
$('#viewer-link').href = appLink('/evals')
$('#partners').innerHTML = PARTNERS.map(p => `<li><a href="${p.href}" aria-label="${esc(p.name)}">${p.logo}</a></li>`).join('')
$('#sites').innerHTML = [['Open track', 'Evaluations run in', PLACES.open], ['Fine-tuning track', 'Datasets recorded in', PLACES.fine]]
  .map(([track, verb, places]) => `<div><dt>${track}</dt><dd><span>${verb}</span><ul>${places.map(p => `<li>${esc(p)}</li>`).join('')}</ul></dd></div>`).join('')
const openSetup = setupDialog($('#setup'))
$('#fleet').addEventListener('click', e => { const b = e.target.closest('[data-setup]'); if (b) openSetup(b.dataset.setup) })

// Videos play only while visible, never for readers who asked for reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
function playWhenVisible(video) {
  if (still) { video.removeAttribute('autoplay'); video.pause(); return }
  new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? video.play().catch(() => {}) : video.pause() })).observe(video)
}

// The hero film (cut from the team's footage on 27 Oct 2026); its caption follows the cut list that ships with it.
const film = $('#film'), caption = $('#caption')
// Phones get the 720p cut (3.2 MB instead of 6.4).
film.poster = `${VIDEO}hero.jpg`; film.src = `${VIDEO}${matchMedia('(max-width: 760px)').matches ? 'hero-720' : 'hero'}.mp4`
let cues = [], current = -1
fetch(`${VIDEO}hero.json`).then(r => r.ok ? r.json() : []).then(list => { cues = list }).catch(() => {})
film.addEventListener('timeupdate', () => {
  const t = film.currentTime
  const i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  caption.innerHTML = `${esc(c.body)}<span>${esc(c.place)}${c.date ? `, ${esc(c.date)}` : ''}</span>`
})
playWhenVisible(film)

// One run to thousands: the camera pulls back four times, each view becoming the centre of nine. The counter follows the
// film's own timeline (zooms start at 2.5, 5.5, 8.5 and 11.5 s and last 1.6 s; the loop fades back from 16.3 s).
const mosaic = $('#mosaic'), count = $('#mosaic-count')
mosaic.poster = `${VIDEO}mosaic.jpg`; mosaic.src = `${VIDEO}mosaic.mp4`
const STAGES = [[0, 1], [3.3, 9], [6.3, 81], [9.3, 729], [12.3, 6561]]
mosaic.addEventListener('timeupdate', () => {
  const t = mosaic.currentTime, n = t > 16.3 ? 1 : STAGES.filter(([at]) => t >= at).at(-1)[1]
  const text = n === 6561 && stats ? `${fmt(n)} recordings on screen, of ${fmt(stats.runs)} recorded runs` : `${fmt(n)} ${n === 1 ? 'recording' : 'recordings'}`
  if (count.textContent !== text) count.textContent = text
})
playWhenVisible(mosaic)
const rover = $('#rover')
rover.poster = `${VIDEO}rover.jpg`; rover.src = `${VIDEO}rover.mp4`
playWhenVisible(rover)

// The 10,000-hour offer follows the reader like a cookie notice: it appears once they scroll past the top of the hero,
// steps aside while the form itself is on screen, and stays closed for the rest of the visit once dismissed.
const callout = $('#offer')
let dismissed = false, formInView = false
try { dismissed = sessionStorage.getItem('rc-offer') === 'closed' } catch {}
const offer = () => { callout.hidden = dismissed || formInView || scrollY < 120 }
callout.querySelector('.callout-close').addEventListener('click', () => { dismissed = true; offer(); try { sessionStorage.setItem('rc-offer', 'closed') } catch {} })
new IntersectionObserver(es => es.forEach(e => { formInView = e.isIntersecting; offer() })).observe($('#apply'))
addEventListener('scroll', offer, { passive: true })
offer()

// Data: the published figures (one small request) and the two published boards. A failed request is retried once.
const get = (path, retry = true) => fetch(API + path, { headers: { Accept: 'application/json' } })
  .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
  .catch(err => retry ? get(path, false) : Promise.reject(err))
const KEY = (id, track) => `${id}/${track === 'fine' ? 'fine-tuning' : track}`
let stats = null, statsFailed = false
function load(onChange) {
  const boards = {}
  const ready = Promise.all(['open', 'fine-tuning'].map(track => get(`/leaderboard?track=${track}`)
    .then(data => { boards[track] = data.board || []; ROBOTS.forEach(r => { store.boards[KEY(r.id, track)] = boards[track].filter(row => row.robotId === r.id && row.track === track) }) })
    .catch(() => ROBOTS.forEach(r => store.failed.add(KEY(r.id, track))))))
    .then(() => { store.ready = true; onChange() })
  get('/stats').then(data => data.stats)
    .catch(() => ready.then(() => countHere(boards)))
    .then(s => { stats = s }).catch(() => { statsFailed = true }).finally(onChange)
}

// Fallback for when the published figures are unavailable (before router PR #8 is deployed, or if the request fails):
// the same counts as the router's page_stats(), from the full evaluation list (~10 MB, so only as a fallback).
async function countHere(boards) {
  if (!boards.open || !boards['fine-tuning']) throw new Error('boards missing')
  const key = t => String(t || '').trim().toLowerCase(), policy = r => r.policyId || r.policy
  const ranked = boards.open.filter(r => r.status !== 'pending' && Number(r.evals) > 0 && Number.isFinite(r.score))
  const tried = boards['fine-tuning'].filter(r => Number(r.trials) > 0)
  const evs = ((await get('/list_ab_evaluations')).evaluations || []).filter(e => e.finalized === true && !e.test && e.robotId !== 'test')
  const robots = {}
  for (const id of new Set([...evs.map(e => e.robotId), ...ranked.map(r => r.robotId), ...tried.map(r => r.robotId)])) {
    const rows = evs.filter(e => e.robotId === id)
    robots[id] = { comparisons: rows.length, trials: tried.filter(r => r.robotId === id).reduce((n, r) => n + Number(r.trials), 0),
      scenes: new Set(rows.map(e => key(e.scene)).filter(Boolean)).size, policies: new Set([...ranked, ...tried].filter(r => r.robotId === id).map(policy)).size }
  }
  const dates = evs.map(e => e.date).filter(Boolean).sort(), comparisons = evs.length
  const trials = Object.values(robots).reduce((n, r) => n + r.trials, 0)
  const real = e => key(e.instruction) && !/^test(ing)?$/.test(key(e.instruction)) && String(e.feedback || '').trim().length > 60 && e.videos?.a && e.videos?.b
  const matchups = evs.filter(real).sort((a, b) => Number(!!b.institution) - Number(!!a.institution) || String(b.evalTime || '').localeCompare(String(a.evalTime || ''))).slice(0, 60)
  return { computedAt: new Date().toISOString(), runs: 2 * comparisons + trials, comparisons, trials,
    scenes: Object.values(robots).reduce((n, r) => n + r.scenes, 0), instructions: new Set(evs.map(e => key(e.instruction)).filter(Boolean)).size,
    policies: new Set([...ranked, ...tried].map(policy)).size, robotTypes: new Set([...ranked, ...tried].map(r => r.robotId)).size,
    firstComparison: dates[0] || null, latestComparison: dates.at(-1) || null, robots, matchups }
}

const loaded = (id, track) => store.boards[KEY(id, track)] !== undefined || store.failed.has(KEY(id, track))
const day = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const list = parts => parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join('')
const n = v => `<span class="n">${fmt(v)}</span>`

// "Updated" stamps: the date the daily snapshot was counted.
function freshness() {
  const updated = stats ? `Updated ${day(stats.computedAt)}` : statsFailed ? '' : null
  document.querySelectorAll('[data-updated]').forEach(el => { if (updated !== null) el.textContent = updated })
}

// Scale on several axes. A figure that is not counted yet stays a placeholder, never a partial total.
function scale() {
  const s = stats
  const figures = [
    [s?.runs, 'recorded runs', 'Both sides of every comparison, plus every task attempt.'],
    [s?.scenes, 'scenes', 'Homes, offices, labs, canteens and corridors.'],
    [s?.instructions, 'different instructions', 'Written on the spot by the evaluators.'],
    [s?.policies, 'policies evaluated', 'Ranked on public leaderboards.'],
    [COUNTRIES, 'countries', 'Where open-track runs happen and fine-tuning data was recorded.'],
    [s?.robotTypes, 'robot types', 'Humanoids, arms and rovers, each with its own leaderboard.'],
  ]
  $('#figures').innerHTML = figures.map(([v, label, note]) => `<div><dt>${v != null ? n(v) : statsFailed ? '<span title="Could not be loaded right now">—</span>' : '<span class="skel">0,000</span>'}</dt><dd><b>${esc(label)}</b>${esc(note)}</dd></div>`).join('')
  if (s?.firstComparison) $('#scale-lede').textContent = `Counted once a day from every evaluation since the first comparison on ${day(s.firstComparison)}.`
}

// Under the mosaic: how the scenes spread across robot types.
function places() {
  if (!stats?.scenes) return
  const per = Object.entries(stats.robots || {}).map(([id, r]) => ({ name: NAMES[id] || id, count: r.scenes })).filter(r => r.count).sort((a, b) => b.count - a.count)
  $('#places').innerHTML = `From one robot at work to thousands of recorded runs. ${n(stats.scenes)} scenes on record so far: ${list(per.map(r => `${n(r.count)} for ${esc(r.name)}`))}.`
}

function fleet() {
  $('#fleet').innerHTML = FLEET.map(f => {
    const policies = stats?.robots?.[f.api]?.policies
    const live = f.joining ? 'Joining' : policies ? `${fmt(policies)} policies ranked` : stats ? 'Results coming soon' : statsFailed ? '' : '<span class="skel">00 policies ranked</span>'
    const body = `<span class="stage"><img src="${f.img}" alt="" loading="lazy"></span>
      <h3>${esc(f.name)}</h3><p class="kind">${esc(f.kind)}</p>${live ? `<p class="live${f.joining ? ' joining' : ''}">${live}</p>` : ''}`
    return SETUPS[f.id]
      ? `<li><button type="button" class="robot" data-setup="${f.id}" aria-haspopup="dialog">${body}<span class="see">See the setup and parts</span></button></li>`
      : `<li class="robot">${body}</li>`
  }).join('')
}

// The leaderboard preview: one robot and one kind of score at a time, the top five.
const board = { robot: 'franka', track: 'open', chosen: false }
const MIN = { open: 20, fine: 10 }
function rankings() {
  const has = { open: id => rankedOpen(id).length > 0, fine: id => fineRows(id).length > 0 }
  const empty = (id, track) => loaded(id, track) && !store.failed.has(KEY(id, track)) && !has[track](id)
  if (store.ready && !board.chosen) {
    if (!hasData(board.robot)) board.robot = ROBOTS.find(r => hasData(r.id))?.id || board.robot
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

// Open data: the repositories themselves, grouped by robot.
function openData() {
  const sets = TRAINING.flatMap(g => g.sets), demos = sets.reduce((s, [, eps]) => s + eps, 0)
  $('#data-figures').innerHTML = [[sets.length, 'training sets'], [demos, 'demonstrations'], [HOURS, 'hours of demonstrations'], [EVAL_SETS, 'evaluation sets so far']]
    .map(([v, label]) => `<div><dt>${n(v)}</dt><dd>${esc(label)}</dd></div>`).join('')
  $('#repos').innerHTML = TRAINING.map(g => `<section class="repo-group"><h3>${esc(g.robot)}</h3><p>${g.sets.length} sets, ${g.cameras} cameras each</p>
    <ul>${g.sets.map(([name, eps]) => `<li><a href="${HUB}${name}"><span class="repo-name">${esc(name)}</span><span class="repo-eps">${fmt(eps)} ep.</span></a></li>`).join('')}</ul></section>`).join('')
  $('#repos').insertAdjacentHTML('afterend', `<p class="repos-note">Each training set is the 100 or so teleoperated demonstrations every model learns a standard task from. Evaluation runs are published per model and task, for example <a href="${HUB}${EVAL_EXAMPLE}"><code>${EVAL_EXAMPLE}</code></a>. All load with the LeRobot library.</p>`)
}

openData()
const preview = viewer($('#viewer'))
preview.loading()
function render() {
  freshness(); scale(); places(); fleet(); rankings()
  if (stats) preview.show(stats.matchups)
  else if (statsFailed) preview.show([])
}
render()
load(render)
