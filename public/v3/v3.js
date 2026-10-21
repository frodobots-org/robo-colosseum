// RoboColosseum v3. Every number, row, square, dot and clip is read from the live API through ../landing/live.js.
import { API, ASSETS, ROBOTS, store, totals, summary, hasData, rankedOpen, fineRows, policyLabel, fmt, esc, appLink } from '../landing/live.js'
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

// ---------- chrome ----------
function chrome() {
  document.querySelectorAll('[data-app]').forEach(a => { a.href = appLink(a.dataset.app) })
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
    <div><h5>The benchmark</h5><ul><li><a href="#leaderboards">Leaderboards</a></li><li><a href="${appLink('/evals')}">Evaluation viewer</a></li><li><a href="${appLink('/tasks')}">Tasks and criteria</a></li></ul></div>
    <div><h5>Take part</h5><ul><li><a href="${appLink('/submit')}">Submit a policy</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li><li><a href="#bodies">Bring a robot</a></li></ul></div>
    <div><h5>Partners</h5><ul><li><a href="https://huggingface.co/">Hugging Face</a></li><li><a href="https://bitrobot.ai/">BitRobot</a></li><li><a href="https://nrp.gov.sg/">Embodied AI Centre</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li></ul></div>`
}

// ---------- the ledger ----------
function ledger() {
  const t = totals()
  const cell = (value, label, plus) => `<div><dt>${value === null || value === undefined ? '<span class="skel">0,000</span>' : fmt(value)}${plus ? '<sup>+</sup>' : ''}</dt><dd>${label}</dd></div>`
  $('#ledger').innerHTML = cell(t.comparisons, 'blind A/B comparisons') + cell(t.fineTrials, 'scored fine-tuning trials') + cell(t.scenes, 'robot / scene combinations')
    + cell(live.summary?.evaluators ?? null, 'independent evaluators') + cell(t.embodiments, 'robot bodies, more joining', true)
  $('#partners').innerHTML = `<span>Co-organized by</span>
    <a class="hf" href="https://huggingface.co/"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></a>
    <a href="https://bitrobot.ai/"><img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" style="height:32px"></a>
    <a class="eaic" href="https://nrp.gov.sg/"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></a>`
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

// ---------- bodies and rooms ----------
function gallery() {
  const bodies = ROBOTS.map(r => {
    const s = summary(r.id), on = store.ready && hasData(r.id)
    const facts = !store.ready ? '<span class="skel">0,000 comparisons</span>' : !on ? `${r.kind} · evaluations coming soon`
      : [s.comparisons ? `${fmt(s.comparisons)} comparisons` : '', fineRows(r.id).length ? `${fmt(fineRows(r.id).reduce((n, x) => n + x.trials, 0))} trials` : '', r.kind].filter(Boolean).join(' · ')
    const href = on ? appLink('/leaderboard', { robot: r.id, track: s.comparisons ? 'open' : 'fine-tuning' }) : '#join'
    return `<a class="card" href="${href}"><div class="img"><img class="portrait" src="${ASSETS}${r.img}.webp" alt="${esc(r.name)}" loading="lazy"${r.mirror ? ' style="transform:scaleX(-1)"' : ''}>${store.ready ? `<span class="tag${on ? '' : ' soon'}"><i></i>${on ? 'live' : 'coming soon'}</span>` : ''}</div><div class="body"><b>${esc(r.name)}</b><span>${facts}</span></div></a>`
  }).join('') + `<a class="card more" href="#join"><span class="plus">+</span><b>Your robot</b><span>New embodiments join with the same protocol and the same evaluators.</span></a>`
  let rooms = '', count = ''
  if (store.evaluations) {
    const scenes = new Map()
    for (const e of store.evaluations) { const name = prettyScene(e.scene); if (!name) continue; const key = `${e.robotId}|${name.toLowerCase()}`; const s = scenes.get(key) || { robot: e.robotId, name, n: 0, instructions: new Set() }; s.n += 1; s.instructions.add(String(e.instruction || e.task || '').trim().toLowerCase()); scenes.set(key, s) }
    const top = [...scenes.values()].sort((a, b) => b.n - a.n).slice(0, 8)
    count = `${scenes.size} rooms so far · the ${top.length} busiest`
    rooms = top.map(s => {
      const frame = FRAMES.find(f => f.robot === s.robot && prettyScene(f.scene).toLowerCase() === s.name.toLowerCase())
      const cover = frame ? `<img src="./frames/${frame.id}.webp" alt="" loading="lazy">` : `<span class="initial">${esc(s.name[0])}</span>`
      return `<a class="card" href="${appLink('/evals', { robot: s.robot, track: 'open' })}"><div class="img">${cover}<span class="code">${esc(robotName(s.robot).split(' ').pop().slice(0, 7))}</span></div><div class="body"><b>${esc(s.name)}</b><span>${fmt(s.n)} comparisons · ${s.instructions.size} instruction${s.instructions.size === 1 ? '' : 's'}</span></div></a>`
    }).join('')
  } else {
    count = 'loading every evaluation…'
    rooms = Array.from({ length: 4 }, () => `<div class="card"><div class="img"></div><div class="body"><b class="skel">Room name</b><span class="skel">000 comparisons</span></div></div>`).join('')
  }
  $('#gallery').innerHTML = `<div class="group-title"><h3>Robot bodies</h3><small>${ROBOTS.length} bodies</small></div><div class="cards">${bodies}</div>
    <div class="group-title"><h3>Rooms</h3><small>${count}</small></div><div class="cards">${rooms}</div>`
}

// ---------- boot ----------
let pair, trials, globe
function renderAll() { liveMark(); ledger(); leaderboards(); gallery(); pair?.refresh(); trials?.render(); globe?.refresh() }
chrome(); footer(); ledger(); leaderboards(); gallery()
pair = heroPair($('#pair'))
trials = trialsSection($('#trials-content'), $('#trials-legend'))
globe = globeSection($('#sphere'))
load(renderAll)
fetch(`${API}/summary`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : null).then(d => { live.summary = d?.summary || null; ledger() }).catch(() => {})
