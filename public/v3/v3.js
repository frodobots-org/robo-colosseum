// RoboColosseum v3. Order follows what matters: in the wild, every body, at scale, partners; the benchmark detail below.
// Every number, row, square, dot and clip is read from the live API through ../landing/live.js.
import { API, ASSETS, ROBOTS, store, totals, summary, hasData, rankedOpen, fineRows, fmt, esc, appLink } from '../landing/live.js'
import { boardFromUrl, boardToUrl, figureModel, renderFigure } from '../landing/leaderboard.js'
import { FRAMES } from './frames.js'
import { heroPair } from './pair.js'
import { load } from './loader.js'
import { homeBoard, prettyScene, DESC } from './board.js'
import { trialsSection } from './trials.js'
import { globeSection } from './globe-section.js'

const $ = (s, el = document) => el.querySelector(s)
const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
const live = { summary: null }

// Day-one call to action: the 10,000-hour dataset (private on Hugging Face until launch; swap the href when it goes public).
const DATASET = { label: 'Get the 10,000-hour dataset', href: 'https://huggingface.co/datasets/frodobots/FrodoBots-10K' }

// Bodies shown on the page: the API's robots plus the ones joining. Earth Rover has no results yet and no API entry.
const BODIES = [
  ...ROBOTS.map(r => ({ id: r.id, name: r.name, kind: r.kind, img: `${ASSETS}${r.img}.webp`, mirror: r.mirror, portrait: true })),
  { id: 'earth-rover', name: 'Earth Rover Mini+', kind: 'Sidewalk rover · outdoors', img: './bodies/earth-rover-mini-plus.webp', portrait: true, joining: 'Navigation to GPS goals, outdoors' },
]

// The reel: real evaluations in different rooms and on different bodies. Replace entries with static footage (src/poster) when it is ready.
const REEL = [
  { id: 'ev_16083007f23fee02f6305efa4fa974c4', robot: 'yam', room: 'NUS, ground floor' },
  { id: 'ev_26370a36d9c68d118e521c6763822e03', robot: 'franka', room: 'Office' },
  { id: 'ev_7b371507cfeda3e93e7051d2545239e1', robot: 'so101', room: 'Pantry' },
  { id: 'ev_4ece40c922f6747611a53b93e534eb9c', robot: 'franka', room: 'By the window' },
  { id: 'ev_2352ed6caf8393ed71a6307d9770b923', robot: 'so101', room: 'Outside the lab' },
]

// ---------- chrome ----------
function chrome() {
  document.querySelectorAll('[data-app]').forEach(a => { a.href = appLink(a.dataset.app) })
  $('#hero-actions').innerHTML = `<a class="button primary" href="${DATASET.href}">${DATASET.label}</a><a class="button" href="#leaderboards">See the leaderboards</a>`
}
function liveMark() {
  const el = $('#live')
  if (!store.evaluations?.length) { el.innerHTML = `<i></i>Live data`; return }
  const latest = store.evaluations.reduce((m, e) => (e.date > m ? e.date : m), '')
  const mins = Math.max(0, Math.round((Date.now() - new Date(latest).getTime()) / 60000))
  const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 48 * 60 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`
  el.innerHTML = `<i></i>Latest verdict ${ago}`
}
function footer() {
  $('#footer').innerHTML = `<div><a class="brand" href="#top"><span class="brand-mark">R<i></i></span><span><strong>RoboColosseum</strong><small>Real-world robot policy evaluation</small></span></a><p class="prov">Every figure on this page is read live from the RoboColosseum API when you open it. Co-organized by Hugging Face, BitRobot and the Embodied AI Centre, Singapore.</p></div>
    <div><h5>The benchmark</h5><ul><li><a href="#leaderboards">Leaderboards</a></li><li><a href="${appLink('/evals')}">Evaluation viewer</a></li><li><a href="${appLink('/tasks')}">Tasks and criteria</a></li><li><a href="${DATASET.href}">The dataset</a></li></ul></div>
    <div><h5>Take part</h5><ul><li><a href="${appLink('/submit')}">Submit a policy</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li><li><a href="#bodies">Bring a robot</a></li></ul></div>
    <div><h5>Partners</h5><ul><li><a href="https://huggingface.co/">Hugging Face</a></li><li><a href="https://bitrobot.ai/">BitRobot</a></li><li><a href="https://nrp.gov.sg/">Embodied AI Centre</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li></ul></div>`
  $('#partners').innerHTML = `<span>Co-organized by</span>
    <a class="hf" href="https://huggingface.co/"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></a>
    <a href="https://bitrobot.ai/"><img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" style="height:32px"></a>
    <a class="eaic" href="https://nrp.gov.sg/"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></a>`
}

// ---------- in the wild: the reel ----------
const CAM = ['left_image', 'right_image', 'top_image', 'front_image', 'head_image']
function reel() {
  const root = $('#reel')
  root.innerHTML = REEL.map(c => `<a class="clip" data-id="${c.id}" href="${appLink('/evals', { robot: c.robot, track: 'open' })}"><img src="./frames/${c.id}.webp" alt="" ${REEL.indexOf(c) ? 'loading="lazy"' : ''}><video muted loop playsinline preload="none"></video><span class="lbl"><b>${esc(robotName(c.robot))}</b> · ${esc(c.room)}</span></a>`).join('')
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return
  root.querySelectorAll('.clip').forEach(async (clip, i) => {
    await new Promise(r => setTimeout(r, 400 + i * 350))
    try {
      const r = await fetch(`${API}/evaluations/${clip.dataset.id}/videos`, { headers: { Accept: 'application/json' } })
      const cams = (await r.json()).videos?.a || {}, key = CAM.find(k => cams[k]) || Object.keys(cams)[0]
      if (!key) return
      const v = clip.querySelector('video'); v.src = cams[key]
      v.addEventListener('canplay', () => { clip.classList.add('ready'); v.play().catch(() => {}) }, { once: true })
      v.load()
    } catch {}
  })
  new IntersectionObserver(es => es.forEach(e => root.querySelectorAll('video').forEach(v => { if (!v.src) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause() })), { threshold: 0 }).observe(root)
}

// ---------- every body ----------
function bodies() {
  $('#bodies-row').innerHTML = BODIES.map(b => {
    const api = ROBOTS.some(r => r.id === b.id), s = api ? summary(b.id) : null, on = api && store.ready && hasData(b.id)
    const facts = b.joining ? b.joining : !store.ready ? '<span class="skel">0,000 comparisons</span>' : !on ? 'evaluations coming soon'
      : [s.comparisons ? `${fmt(s.comparisons)} comparisons` : '', fineRows(b.id).length ? `${fmt(fineRows(b.id).reduce((n, x) => n + x.trials, 0))} trials` : ''].filter(Boolean).join(' · ')
    const tag = b.joining ? 'joining' : !store.ready ? '' : on ? 'live' : 'coming soon'
    const href = on ? appLink('/leaderboard', { robot: b.id, track: s.comparisons ? 'open' : 'fine-tuning' }) : '#join'
    const glyph = `<span class="glyph-fallback"><svg viewBox="0 0 48 48"><rect x="8" y="18" width="32" height="14" rx="4"/><circle cx="15" cy="36" r="4"/><circle cx="33" cy="36" r="4"/><path d="M22 18v-6h8M30 9v3"/></svg></span>`
    return `<a class="card" href="${href}"><div class="img">${glyph}<img class="${b.portrait ? 'portrait' : 'photo'}" src="${b.img}" alt="${esc(b.name)}" loading="lazy"${b.mirror ? ' style="transform:scaleX(-1)"' : ''} onerror="this.parentNode.classList.add('missing')">${tag ? `<span class="tag${on ? '' : ' soon'}"><i></i>${tag}</span>` : ''}</div><div class="body"><b>${esc(b.name)}</b><span>${esc(b.kind)}</span><span>${facts}</span></div></a>`
  }).join('')
}

// ---------- scale ----------
const SITE = v => { const t = String(v || '').trim().toLowerCase(); if (!t) return ''; if (t.startsWith('frodobots')) return 'FrodoBots'; if (t === 'nus') return 'NUS'; if (t.startsWith('droid')) return 'DROID rig'; return String(v).trim() }
function axes() {
  const t = totals(), ev = store.evaluations
  const open = ROBOTS.flatMap(r => rankedOpen(r.id)), fine = ROBOTS.flatMap(r => fineRows(r.id))
  const rollouts = store.ready ? Math.round(open.reduce((n, r) => n + Number(r.evals || 0), 0) / 2) * 2 + fine.reduce((n, r) => n + Number(r.trials || 0), 0) : null
  const instructions = ev ? new Set(ev.map(e => String(e.instruction || e.task || '').trim().toLowerCase()).filter(x => x && !/^test(ing)?$/.test(x))).size + new Set(fine.map(r => r.taskId || r.task)).size : null
  const sites = ev ? new Set(ev.map(e => SITE(e.institution)).filter(Boolean)).size : null
  const first = ev?.length ? ev.reduce((m, e) => (e.date && e.date < m ? e.date : m), ev[0].date || '') : ''
  const days = first ? Math.max(1, Math.round((Date.now() - new Date(first).getTime()) / 86400000)) : null
  const joining = BODIES.filter(b => b.joining || (store.ready && ROBOTS.some(r => r.id === b.id) && !hasData(b.id))).length
  const cell = (value, label, small) => `<div><dt>${value === null || value === undefined ? '<span class="skel">0,000</span>' : fmt(value)}</dt><dd>${label}${small ? `<small>${small}</small>` : ''}</dd></div>`
  $('#axes').innerHTML = cell(t.embodiments, 'robot bodies', store.ready ? `${joining} more joining` : '') + cell(sites, 'evaluation sites', 'so far') + cell(t.scenes, 'rooms', 'per body') + cell(instructions, 'distinct tasks', 'written by evaluators')
    + cell(rollouts, 'recorded rollouts', 'blind pairs and scored trials') + cell(live.summary?.evaluators ?? null, 'independent evaluators') + cell(days, 'days of evaluation', first ? `since ${new Date(first).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : '')
}

// ---------- leaderboards ----------
const state = boardFromUrl()
const FIG_THEME = {
  card: 'background:var(--surface);border:1px solid var(--line);border-radius:8px', surface: '#fffefa',
  ink: '#1c231b', secondary: '#4b5547', muted: '#7b8475', grid: '#eef0e6', axis: '#b7bfab', ring: '#b7bfab',
  sans: "'Instrument Sans', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace", titleWeight: 600, tipBg: '#1c231b', tipInk: '#f5f9ec',
  brand: 'RoboColosseum',
}
let board
function switches() {
  const has = r => rankedOpen(r.id).length || fineRows(r.id).length
  $('#lb-switches').innerHTML = `<div class="switch" role="group" aria-label="Robot body">${ROBOTS.map(r => `<button data-robot="${r.id}" class="${r.id === state.robot ? 'on' : ''}" aria-pressed="${r.id === state.robot}"${store.ready && !has(r) ? ' disabled' : ''}>${esc(r.name)}${store.ready && !has(r) ? '<small>soon</small>' : ''}</button>`).join('')}</div>
    <div class="switch track" role="group" aria-label="Track">${[['open', 'Open track · A/B', rankedOpen(state.robot).length], ['fine', 'Fine-tuning · ✓/4', fineRows(state.robot).length]].map(([id, name, n]) => `<button data-track="${id}" class="${id === state.track ? 'on' : ''}" aria-pressed="${id === state.track}"${store.ready && !n ? ' disabled' : ''}>${name}</button>`).join('')}</div>`
}
function leaderboards() {
  if (store.ready) {
    if (state.track === 'open' && !rankedOpen(state.robot).length && fineRows(state.robot).length) state.track = 'fine'
    if (state.track === 'fine' && !fineRows(state.robot).length && rankedOpen(state.robot).length) state.track = 'open'
  }
  switches()
  $('#lb-desc').textContent = DESC[state.track](ROBOTS.find(r => r.id === state.robot) || ROBOTS[0])
  const fig = $('#lb-figure')
  if (!store.ready) fig.innerHTML = `<p class="lbh-empty"><span class="skel" style="min-width:24ch">&nbsp;</span></p>`
  else renderFigure(fig, figureModel(state.robot, state.track), FIG_THEME)
  if (!board) { const rows = $('#lb-rows'); rows.classList.add('lbh'); board = homeBoard(rows, $('#lb-note'), state, next => boardToUrl(next)) }
  else board.render()
}
$('#lb-switches').addEventListener('click', e => {
  const b = e.target.closest('button[data-robot],button[data-track]'); if (!b || b.disabled) return
  if (b.dataset.robot) state.robot = b.dataset.robot; else state.track = b.dataset.track
  boardToUrl(state); board?.setState(state); leaderboards()
})

// ---------- boot ----------
let pair, trials, globe
function renderAll() { liveMark(); bodies(); axes(); leaderboards(); pair?.refresh(); trials?.render(); globe?.refresh() }
chrome(); footer(); reel(); bodies(); axes(); leaderboards()
pair = heroPair($('#pair'))
trials = trialsSection($('#trials-content'), $('#trials-legend'))
globe = globeSection($('#sphere'))
load(renderAll)
fetch(`${API}/summary`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : null).then(d => { live.summary = d?.summary || null; axes() }).catch(() => {})
