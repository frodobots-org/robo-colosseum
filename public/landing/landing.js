// The landing page (the site root). Order: hero (evaluation and benchmarking, in the wild), the founders, the
// leaderboard, real-world evaluations, robots, scale, then how it works, a preview of the evaluation viewer, open data,
// FAQ and the 10,000-hour offer. One call to action, "Apply for free evaluation",
// and every copy of it leads to the form. Numbers come from the hourly snapshot (/api/stats and the published boards),
// never from a live count, and carry the date they were counted.
import { API, ASSETS, ROBOTS, store, rankedOpen, fineRows, hasData, fmt, esc, appLink, sentence } from './live.js'
import { openRows, fineRowsModel, mark } from './board.js'
import { labFor } from './leaderboard.js'
import { SETUPS, setupDialog } from './setups.js'
import { ROOT, chrome } from './chrome.js'
import { viewer } from './viewer.js'
import { HUB, liveSets, hours, EVAL_SETS, EVAL_EXAMPLE } from './datasets.js'

const $ = (s, el = document) => el.querySelector(s)
// The films: the hero film and the real-world evaluations trailer.
const VIDEO = `${ROOT}landing/video/`
// The robots cut out of their white backdrops, so white arms stay visible on the peach stage.
const PICS = `${ROOT}landing/robots/`

// The robot types we run. Fleet sizes are never shown: the page says "hundreds of robots" (user, 26 Oct 2026).
const FLEET = [
  { id: 'g1', api: 'g1', name: 'Unitree G1', kind: 'Humanoid with two grippers', img: `${PICS}g1.webp` },
  { id: 'yam', api: 'yam', name: 'Bimanual YAM', kind: 'Two-arm station', img: `${PICS}yam.webp` },
  { id: 'franka', api: 'franka', name: 'Franka', kind: 'Single arm, DROID setup', img: `${PICS}franka.webp` },
  { id: 'so101', api: 'so101', name: 'SO-ARM101', kind: 'Low-cost single arm', img: `${PICS}so101.webp` },
  { id: 'earth-rover', api: 'earth_rover_mini_plus', name: 'Earth Rover Mini+', kind: 'Outdoor wheeled robot', img: `${PICS}earth-rover-mini-plus.webp`, joining: true },
]
const NAMES = Object.fromEntries(FLEET.map(f => [f.api, f.name]))

// Where evaluation happens, as the team confirmed it on 26 Oct 2026, kept apart by track.
const PLACES = {
  open: ['Singapore', 'China', 'Seattle, United States', 'Oxford, United Kingdom'],
  fine: ['Singapore', 'Kuala Lumpur, Malaysia', 'China'],
}

const PARTNERS = [
  { name: 'NUS MAGIC Lab', href: 'https://magiclab-nus.github.io/', logo: `<img src="${ASSETS}magic-lab-logo.webp" alt="MAGIC Lab, NUS" class="magic">` },
  { name: 'BitRobot', href: 'https://bitrobot.ai/', logo: `<img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" class="br">` },
  { name: 'EAIC Singapore', href: 'https://nrp.gov.sg/', logo: `<img src="${ASSETS}eaic-mark.webp" alt="EAIC" class="eaic">` },
  { name: 'Hugging Face', href: 'https://huggingface.co/', logo: `<span class="hf"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></span>` },
]

// Static wiring: chrome, partners, places, the setup dialog.
chrome()
$('#viewer-link').href = appLink('/evals')
$('#partners').innerHTML = PARTNERS.map(p => `<li><a href="${p.href}" aria-label="${esc(p.name)}">${p.logo}</a></li>`).join('')
$('#sites').innerHTML = [['Open track', 'Evaluations run in', PLACES.open], ['Fine-tune track', 'Datasets recorded in', PLACES.fine]]
  .map(([track, verb, places]) => `<div><dt>${track}</dt><dd><span>${verb}</span><ul>${places.map(p => `<li>${esc(p)}</li>`).join('')}</ul></dd></div>`).join('')
const openSetup = setupDialog($('#setup'))
$('#fleet').addEventListener('click', e => { const b = e.target.closest('[data-setup]'); if (b) openSetup(b.dataset.setup) })

// Videos play only while visible, never for readers who asked for reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
function playWhenVisible(video) {
  if (still) { video.removeAttribute('autoplay'); video.pause(); return }
  new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? video.play().catch(() => {}) : video.pause() })).observe(video)
}

// The hero film (BITROBOT-39.2, 28 Oct 2026); its caption names the robot and the place of each shot, from the cue list
// that ships with it (no dates, user request). Replaced films are archived outside git, in RoboColosseum/media/.
const HERO = VIDEO
const film = $('#film'), caption = $('#caption')
// Phones get the 720p cut (3.9 MB instead of 5.8).
film.poster = `${HERO}hero.jpg`; film.src = `${HERO}${matchMedia('(max-width: 760px)').matches ? 'hero-720' : 'hero'}.mp4`
let cues = [], current = -1
fetch(`${HERO}hero.json`).then(r => r.ok ? r.json() : []).then(list => { cues = list }).catch(() => {})
film.addEventListener('timeupdate', () => {
  const t = film.currentTime
  const i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  caption.innerHTML = `${esc(c.body)}<span>${esc(c.place)}</span>`
})
playWhenVisible(film)

// The in-the-wild film: real places, one run, then the pull-back to thousands, its words and counter drawn into the film.
const mosaic = $('#mosaic')
mosaic.poster = `${VIDEO}wild.jpg`; mosaic.src = `${VIDEO}${matchMedia('(max-width: 760px)').matches ? 'wild-960' : 'wild'}.mp4`
playWhenVisible(mosaic)

// The 10,000-hour offer follows the reader like a cookie notice: it appears once they scroll past the top of the hero,
// steps aside while the closing section is on screen, and stays closed for the rest of the visit once dismissed.
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
// The tasks on the published Fine-tune track board: only their datasets are listed under Open data.
let liveTasks = null
function load(onChange) {
  const boards = {}
  const ready = Promise.all(['open', 'fine-tuning'].map(track => get(`/leaderboard?track=${track}`)
    .then(data => { boards[track] = data.board || []; if (track === 'fine-tuning') liveTasks = new Set(boards[track].map(r => r.taskId)); ROBOTS.forEach(r => { store.boards[KEY(r.id, track)] = boards[track].filter(row => row.robotId === r.id && row.track === track) }) })
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
  // As the hourly snapshot does: comparisons from the last 12 hours last (their recordings are still uploading), then named
  // sites, then the newest.
  const settled = e => Date.now() - Date.parse(e.evalTime) > 12 * 3600e3
  const matchups = evs.filter(real).sort((a, b) => Number(settled(b)) - Number(settled(a)) || Number(!!b.institution) - Number(!!a.institution) || String(b.evalTime || '').localeCompare(String(a.evalTime || ''))).slice(0, 60)
  return { computedAt: new Date().toISOString(), runs: 2 * comparisons + trials, comparisons, trials,
    scenes: Object.values(robots).reduce((n, r) => n + r.scenes, 0), instructions: new Set(evs.map(e => key(e.instruction)).filter(Boolean)).size,
    policies: new Set([...ranked, ...tried].map(policy)).size, robotTypes: new Set([...ranked, ...tried].map(r => r.robotId)).size,
    firstComparison: dates[0] || null, latestComparison: dates.at(-1) || null, robots, matchups }
}

const loaded = (id, track) => store.boards[KEY(id, track)] !== undefined || store.failed.has(KEY(id, track))
const day = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const list = parts => parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join('')
const n = v => `<span class="n">${fmt(v)}</span>`

// "Updated" stamps: the date the hourly snapshot was counted.
function freshness() {
  const updated = stats ? `Updated ${day(stats.computedAt)}` : statsFailed ? '' : null
  document.querySelectorAll('[data-updated]').forEach(el => { if (updated !== null) el.textContent = updated })
}

// Scale: one total and how it splits, then four views of breadth (scenes per robot, the instructions themselves, who made
// the policies, where and on what). Placeholders until the hourly figures arrive; never a partial total.
const ROBOT_ORDER = ['so101', 'yam', 'franka', 'g1', 'earth_rover_mini_plus']
function scale() {
  const s = stats
  if (!s) {
    const wait = statsFailed ? '<p class="b-wait">These figures could not be loaded right now.</p>' : '<span class="skel">00,000</span>'
    $('#total').innerHTML = `<p class="total-n">${wait}</p>`
    return
  }
  const h2h = 2 * s.comparisons
  $('#total').innerHTML = `<p class="total-n">${fmt(s.runs)}</p><p class="total-label">Recorded runs</p>
    <div class="split" role="img" aria-label="${fmt(h2h)} runs from ${fmt(s.comparisons)} Open track comparisons and ${fmt(s.trials)} Fine-tune track trials">
      <span class="seg a" style="flex:${h2h}"></span><span class="seg b" style="flex:${s.trials}"></span></div>
    <dl class="split-key"><div><dt><i class="sw a"></i>${fmt(h2h)}</dt><dd>runs in ${fmt(s.comparisons)} Open track comparisons, two models on the same instruction</dd></div>
      <div><dt><i class="sw b"></i>${fmt(s.trials)}</dt><dd>Fine-tune track trials, 25 attempts per model and task</dd></div></dl>`
  // Scenes as a unit chart: one square per scene, grouped by robot type.
  const per = ROBOT_ORDER.map(id => ({ id, name: NAMES[id] || id, n: s.robots?.[id]?.scenes || 0 })).filter(r => r.n)
  $('#b-scenes').innerHTML = `<figcaption><b>${fmt(s.scenes)}</b><span>Scenes</span></figcaption>
    <div class="units" role="img" aria-label="${esc(per.map(r => `${r.n} for ${r.name}`).join(', '))}">${per.map((r, k) => `<i class="u u${k}"></i>`.repeat(r.n)).join('')}</div>
    <ul class="units-key">${per.map((r, k) => `<li><i class="u u${k}"></i>${esc(r.name)} <span>${fmt(r.n)}</span></li>`).join('')}</ul>`
  // Instructions: the evaluators' own words, scrolling.
  const said = [...new Set((s.matchups || []).map(m => sentence(m.instruction)).filter(t => t.length > 12 && t.length < 110))].slice(0, 24)
  $('#b-instructions').innerHTML = `<figcaption><b>${fmt(s.instructions)}</b><span>Different instructions, written on the spot</span></figcaption>
    <div class="ticker" aria-hidden="true"><ul>${[...said, ...said].map(t => `<li>“${esc(t)}”</li>`).join('')}</ul></div>`
  // Policies: who made them, one mark per lab.
  const policies = [...new Set(ROBOTS.flatMap(r => [...rankedOpen(r.id), ...fineRows(r.id)]).map(x => x.policy))]
  const labs = new Map()
  for (const policy of policies) { const lab = labFor(policy); if (!lab) continue; const e = labs.get(lab.id) || { lab, policy, n: 0 }; e.n++; labs.set(lab.id, e) }
  $('#b-policies').innerHTML = `<figcaption><b>${fmt(s.policies)}</b><span>Policies evaluated, from these labs and more</span></figcaption>
    <ul class="labs">${[...labs.values()].sort((a, b) => b.n - a.n).map(e => `<li title="${esc(e.lab.name)}">${mark(e.policy, 40)}<span>${esc(e.lab.name)}</span></li>`).join('')}</ul>`
  // Reach: the countries and the embodiments (robot types).
  const countries = [...new Set([...PLACES.open, ...PLACES.fine].map(p => p.split(', ').at(-1)))]
  $('#b-reach').innerHTML = `<figcaption><b>${fmt(countries.length)}</b><span>Countries</span></figcaption>
    <ul class="places">${countries.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <figcaption class="second"><b>${fmt(s.robotTypes)}</b><span>Embodiments</span></figcaption>
    <ul class="bodies">${FLEET.map(f => `<li title="${esc(f.name)}"><img src="${f.img}" alt="${esc(f.name)}" loading="lazy"></li>`).join('')}</ul>`
  if (s.firstComparison) $('#scale-lede').textContent = `Counted hourly from every evaluation since the first comparison on ${day(s.firstComparison)}.`
}

// Under the mosaic: how the scenes spread across robot types.
function places() {
  if (!stats?.scenes) return
  const per = Object.entries(stats.robots || {}).map(([id, r]) => ({ name: NAMES[id] || id, count: r.scenes })).filter(r => r.count).sort((a, b) => b.count - a.count)
  $('#places').innerHTML = `From one robot at work to thousands of recorded runs. ${n(stats.scenes)} scenes on record so far: ${list(per.map(r => `${n(r.count)} for ${esc(r.name)}`))}.`
}

// The count a reader can check: the policies on the robot's largest leaderboard. Adding up both tracks counts a lab twice
// when it entered a different model on each (LingBot on SO-ARM101: LingBot-MolmoAct2 on the Open track, LingBot VLA v2 6B
// on the Fine-tune track), which is what the published per-robot figure does, so that figure is only the fallback.
// undefined while the boards load, null if one failed.
function rankedHere(id) {
  if (!loaded(id, 'open') || !loaded(id, 'fine-tuning')) return undefined
  if (store.failed.has(KEY(id, 'open')) || store.failed.has(KEY(id, 'fine-tuning'))) return null
  const n = rows => new Set(rows.map(r => r.policyId || r.policy)).size
  return Math.max(n(rankedOpen(id)), n(fineRows(id)))
}

function fleet() {
  $('#fleet').innerHTML = FLEET.map(f => {
    const here = rankedHere(f.api), policies = here === null ? stats?.robots?.[f.api]?.policies : here
    const skel = '<span class="skel">00 policies ranked</span>'
    const live = f.joining ? 'Joining' : policies ? `${fmt(policies)} policies ranked` : here === undefined ? skel : stats ? 'Results coming soon' : statsFailed ? '' : skel
    const body = `<span class="stage"><img src="${f.img}" alt="" loading="lazy"></span>
      <h3>${esc(f.name)}</h3><p class="kind">${esc(f.kind)}</p>${live ? `<p class="live${f.joining ? ' joining' : ''}">${live}</p>` : ''}`
    return SETUPS[f.id]
      ? `<li><button type="button" class="robot" data-setup="${f.id}" aria-haspopup="dialog">${body}<span class="see">See the setup and parts</span></button></li>`
      : `<li class="robot">${body}</li>`
  }).join('')
}

// The leaderboard preview: one robot and one kind of score at a time, the top five; a button under the list reveals
// every policy (and the choice holds while the reader switches robots).
const board = { robot: 'franka', track: 'open', chosen: false, all: false }
const CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
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
  $('#track-tabs').innerHTML = tab('track', 'open', 'Open track', board.track === 'open', empty(board.robot, 'open'))
    + tab('track', 'fine', 'Fine-tune track', board.track === 'fine', empty(board.robot, 'fine'))
  const rows = $('#rows'), note = $('#board-note'), more = $('#rows-more')
  more.hidden = true
  const robot = ROBOTS.find(r => r.id === board.robot)
  $('#board-link').href = appLink('/leaderboard', { robot: board.robot, track: board.track === 'open' ? 'open' : 'fine-tuning' })
  if (!loaded(board.robot, board.track)) { rows.innerHTML = Array.from({ length: 5 }, () => '<li class="row loading"><span class="skel" style="min-width:60%">&nbsp;</span></li>').join(''); note.textContent = ''; return }
  if (store.failed.has(KEY(board.robot, board.track))) { rows.innerHTML = `<li class="row empty">The ${esc(robot.name)} rankings did not load. Reload the page, or open the full leaderboard.</li>`; note.textContent = ''; return }
  const model = board.track === 'open' ? openRows(board.robot) : fineRowsModel(board.robot)
  if (!model) { rows.innerHTML = `<li class="row empty">No results for ${esc(robot.name)} yet.</li>`; note.textContent = ''; return }
  const evidence = board.track === 'open'
    ? Object.fromEntries(rankedOpen(board.robot).map(r => [r.policy, Number(r.evals) || 0]))
    : Object.fromEntries(model.rows.map(r => [r.policy, Number(r.em.split('/')[1]) || 0]))
  rows.innerHTML = (board.all ? model.rows : model.rows.slice(0, 5)).map(r => {
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
  const total = model.rows.length, extra = total > 5
  if (extra) {
    more.hidden = false
    more.setAttribute('aria-expanded', String(board.all))
    more.innerHTML = `<span>${board.all ? 'Show top 5' : `Show all ${total} policies`}</span>${CHEVRON}`
  }
  const shown = !extra ? '' : board.all ? ` All ${total} shown.` : ` Top 5 of ${total} shown.`
  note.textContent = board.track === 'open'
    ? (rankedOpen(board.robot).some(r => r.ratingMethod === 'dcr')
      ? `DCR ratings on ${robot.name} account for task difficulty; ± is one standard deviation (SD).${shown}`
      : `Ratings on ${robot.name} from blind comparisons; ± is one standard error. Faded rows have fewer than 20 comparisons so far.${shown}`)
    : `Full successes on ${robot.name}'s Fine-tune track tasks; the band is a 95% interval. Faded rows have fewer than 10 trials so far.${shown}`
}
document.querySelector('.board-controls').addEventListener('click', e => {
  const b = e.target.closest('button[role="tab"]'); if (!b || b.disabled) return
  if (b.dataset.robot) { board.robot = b.dataset.robot; board.chosen = true } else board.track = b.dataset.track
  rankings()
})
$('#rows-more').addEventListener('click', () => { board.all = !board.all; rankings() })

// Open data: the Fine-tune track datasets of the tasks on the leaderboard, grouped by robot (redrawn once the board arrives).
let shownData = ''
function openData() {
  const groups = liveSets(liveTasks), sets = groups.flatMap(g => g.sets), demos = sets.reduce((s, [, eps]) => s + eps, 0)
  const key = sets.map(([name]) => name).join()
  if (key === shownData) return
  shownData = key
  $('#data-figures').innerHTML = [[sets.length, 'Fine-tune track datasets'], [demos, 'demonstrations'], [hours(groups), 'hours of demonstrations'], [EVAL_SETS, 'evaluation sets so far']]
    .map(([v, label]) => `<div><dt>${n(v)}</dt><dd>${esc(label)}</dd></div>`).join('')
  $('#repos').innerHTML = groups.flatMap(g => g.sets.map(([name, eps]) => `<li><a class="repo" href="${HUB}${name}">
    <img src="${ROOT}landing/datasets/${name}.jpg" alt="" loading="lazy" width="480" height="270">
    <span class="repo-name">${esc(name)}</span><span class="repo-meta">${esc(g.robot)} · ${fmt(eps)} episodes · ${g.cameras} cameras</span></a></li>`)).join('')
}
$('#repos').insertAdjacentHTML('afterend', `<p class="repos-note">Each Fine-tune track dataset holds the 100 or so teleoperated demonstrations every model is fine-tuned on for one task. Evaluation runs are published per model and task, for example <a href="${HUB}${EVAL_EXAMPLE}"><code>${EVAL_EXAMPLE}</code></a>. All load with the LeRobot library.</p>`)

openData()
const preview = viewer($('#viewer'))
preview.loading()
function render() {
  freshness(); scale(); places(); fleet(); rankings(); openData()
  if (stats) preview.show(stats.matchups)
  else if (statsFailed) preview.show([])
}
render()
load(render)
