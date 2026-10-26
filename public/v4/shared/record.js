// RoboColosseum v4, shared live record. The three design directions import this and only differ in markup and skin.
// Everything here is read from the production API through ../../landing/live.js and the v3 modules.
import { API, ASSETS, ROBOTS, store, totals, summary, hasData, rankedOpen, fineRows, fmt, esc, appLink } from '../../landing/live.js'
import { boardFromUrl, boardToUrl, figureModel, renderFigure } from '../../landing/leaderboard.js'
import { heroPair } from '../../v3/pair.js'
import { load } from '../../v3/loader.js'
import { homeBoard, DESC } from '../../v3/board.js'
import { trialsSection } from '../../v3/trials.js'
import { globeSection } from '../../v3/globe-section.js'

export { API, ASSETS, ROBOTS, store, totals, summary, hasData, rankedOpen, fineRows, fmt, esc, appLink }

export const DATASET = { label: 'Get the 10,000-hour dataset', href: 'https://huggingface.co/datasets/frodobots/FrodoBots-10K' }
export const VIDEO = new URL('../video/', import.meta.url).href

// Bodies on the page: the API's robots plus the one joining. Earth Rover has no results yet and no API entry.
export const BODIES = [
  ...ROBOTS.map(r => ({ id: r.id, name: r.name, kind: r.kind, sub: r.sub, img: `${ASSETS}${r.img}.webp`, mirror: r.mirror, portrait: true })),
  { id: 'earth-rover', name: 'Earth Rover Mini+', kind: 'Sidewalk rover', sub: 'Outdoors · GPS goals', img: new URL('../../v3/bodies/earth-rover-mini-plus.webp', import.meta.url).href, portrait: true, joining: 'Navigation to GPS goals, outdoors' },
]
export const robotName = id => ROBOTS.find(r => r.id === id)?.name || id

export const SITE = v => { const t = String(v || '').trim().toLowerCase(); if (!t) return ''; if (t.startsWith('frodobots')) return 'FrodoBots'; if (t === 'nus') return 'NUS'; if (t.startsWith('droid')) return 'DROID rig'; return String(v).trim() }

const live = { summary: null }

// "Latest verdict 12 min ago"
export function latestAgo() {
  if (!store.evaluations?.length) return ''
  const latest = store.evaluations.reduce((m, e) => (e.date > m ? e.date : m), '')
  const mins = Math.max(0, Math.round((Date.now() - new Date(latest).getTime()) / 60000))
  return mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 48 * 60 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`
}

// One row per body with its live facts.
export function bodyFacts(b) {
  const api = ROBOTS.some(r => r.id === b.id), s = api ? summary(b.id) : null, on = api && store.ready && hasData(b.id)
  const facts = b.joining ? b.joining : !store.ready ? '' : !on ? 'evaluations coming soon'
    : [s.comparisons ? `${fmt(s.comparisons)} comparisons` : '', fineRows(b.id).length ? `${fmt(fineRows(b.id).reduce((n, x) => n + x.trials, 0))} trials` : ''].filter(Boolean).join(' · ')
  const tag = b.joining ? 'joining' : !store.ready ? '' : on ? 'live' : 'coming soon'
  const href = on ? appLink('/leaderboard', { robot: b.id, track: s?.comparisons ? 'open' : 'fine-tuning' }) : '#join'
  return { ...b, on, facts, tag, href, leader: s?.leader || '', comparisons: s?.comparisons || 0 }
}

// Scale on several axes. Values are null until the data they need has arrived.
export function axes() {
  const t = totals(), ev = store.evaluations
  const open = ROBOTS.flatMap(r => rankedOpen(r.id)), fine = ROBOTS.flatMap(r => fineRows(r.id))
  const rollouts = store.ready ? Math.round(open.reduce((n, r) => n + Number(r.evals || 0), 0) / 2) * 2 + fine.reduce((n, r) => n + Number(r.trials || 0), 0) : null
  const instructions = ev ? new Set(ev.map(e => String(e.instruction || e.task || '').trim().toLowerCase()).filter(x => x && !/^test(ing)?$/.test(x))).size + new Set(fine.map(r => r.taskId || r.task)).size : null
  const sites = ev ? new Set(ev.map(e => SITE(e.institution)).filter(Boolean)).size : null
  const first = ev?.length ? ev.reduce((m, e) => (e.date && e.date < m ? e.date : m), ev[0].date || '') : ''
  const days = first ? Math.max(1, Math.round((Date.now() - new Date(first).getTime()) / 86400000)) : null
  const joining = BODIES.filter(b => b.joining || (store.ready && ROBOTS.some(r => r.id === b.id) && !hasData(b.id))).length
  return [
    { key: 'bodies', value: t.embodiments, label: 'robot bodies', small: store.ready ? `${joining} more joining` : '' },
    { key: 'sites', value: sites, label: 'evaluation sites', small: 'so far' },
    { key: 'rooms', value: t.scenes, label: 'rooms', small: 'per body' },
    { key: 'tasks', value: instructions, label: 'distinct tasks', small: 'written by evaluators' },
    { key: 'rollouts', value: rollouts, label: 'recorded rollouts', small: 'blind pairs and scored trials' },
    { key: 'evaluators', value: live.summary?.evaluators ?? null, label: 'independent evaluators', small: '' },
    { key: 'days', value: days, label: 'days of evaluation', small: first ? `since ${new Date(first).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : '' },
  ]
}
export const num = v => v === null || v === undefined ? '<span class="skel">0,000</span>' : fmt(v)

// Leaderboards: switches + the Robocurve figure + ranked rows. `roots` = { switches, desc, note, figure, rows }.
export function leaderboards(roots, theme) {
  const state = boardFromUrl()
  let board
  const has = r => rankedOpen(r.id).length || fineRows(r.id).length
  function switches() {
    roots.switches.innerHTML = `<div class="switch" role="group" aria-label="Robot body">${ROBOTS.map(r => `<button data-robot="${r.id}" class="${r.id === state.robot ? 'on' : ''}" aria-pressed="${r.id === state.robot}"${store.ready && !has(r) ? ' disabled' : ''}>${esc(r.name)}${store.ready && !has(r) ? '<small>soon</small>' : ''}</button>`).join('')}</div>
      <div class="switch track" role="group" aria-label="Track">${[['open', 'Open track · A/B', rankedOpen(state.robot).length], ['fine', 'Fine-tuning · ✓/4', fineRows(state.robot).length]].map(([id, name, n]) => `<button data-track="${id}" class="${id === state.track ? 'on' : ''}" aria-pressed="${id === state.track}"${store.ready && !n ? ' disabled' : ''}>${name}</button>`).join('')}</div>`
  }
  function render() {
    if (store.ready) {
      if (state.track === 'open' && !rankedOpen(state.robot).length && fineRows(state.robot).length) state.track = 'fine'
      if (state.track === 'fine' && !fineRows(state.robot).length && rankedOpen(state.robot).length) state.track = 'open'
    }
    switches()
    if (roots.desc) roots.desc.textContent = DESC[state.track](ROBOTS.find(r => r.id === state.robot) || ROBOTS[0])
    if (roots.figure) {
      if (!store.ready) roots.figure.innerHTML = `<p class="lbh-empty"><span class="skel" style="min-width:24ch">&nbsp;</span></p>`
      else renderFigure(roots.figure, figureModel(state.robot, state.track), theme)
    }
    if (!board) { roots.rows.classList.add('lbh'); board = homeBoard(roots.rows, roots.note, state, next => boardToUrl(next)) }
    else board.render()
  }
  roots.switches.addEventListener('click', e => {
    const b = e.target.closest('button[data-robot],button[data-track]'); if (!b || b.disabled) return
    if (b.dataset.robot) state.robot = b.dataset.robot; else state.track = b.dataset.track
    boardToUrl(state); board?.setState(state); render()
  })
  return { render, state }
}

// Boot the live record. `roots` may include: pair, trialsContent, trialsLegend, globe, leaderboards:{...}. `onChange` runs after every data step.
export function boot(roots, theme, onChange) {
  const parts = {}
  if (roots.leaderboards) parts.lb = leaderboards(roots.leaderboards, theme)
  if (roots.pair) parts.pair = heroPair(roots.pair)
  if (roots.trialsContent) parts.trials = trialsSection(roots.trialsContent, roots.trialsLegend)
  if (roots.globe) parts.globe = globeSection(roots.globe)
  const all = () => { parts.lb?.render(); parts.pair?.refresh(); parts.trials?.render(); parts.globe?.refresh(); onChange?.() }
  all()
  load(all)
  fetch(`${API}/summary`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : null).then(d => { live.summary = d?.summary || null; onChange?.() }).catch(() => {})
  return parts
}

// Partner logos, the same four everywhere.
export const partners = () => `<a class="hf" href="https://huggingface.co/"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></a>
  <a class="br" href="https://bitrobot.ai/"><img src="${ASSETS}bitrobot-logo.webp" alt="BitRobot"></a>
  <a class="eaic" href="https://nrp.gov.sg/"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></a>
  <a class="magic" href="https://magiclab-nus.github.io/"><img src="${ASSETS}magic-lab-logo.webp" alt="MAGIC Lab, NUS"></a>`

export const footerLinks = () => `<div><h5>The benchmark</h5><ul><li><a href="#leaderboards">Leaderboards</a></li><li><a href="${appLink('/evals')}">Evaluation viewer</a></li><li><a href="${appLink('/tasks')}">Tasks and criteria</a></li><li><a href="${DATASET.href}">The dataset</a></li></ul></div>
  <div><h5>Take part</h5><ul><li><a href="${appLink('/submit')}">Submit a policy</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li><li><a href="#bodies">Bring a robot</a></li></ul></div>
  <div><h5>Partners</h5><ul><li><a href="https://huggingface.co/">Hugging Face</a></li><li><a href="https://bitrobot.ai/">BitRobot</a></li><li><a href="https://nrp.gov.sg/">Embodied AI Centre</a></li><li><a href="https://magiclab-nus.github.io/">MAGIC Lab, NUS</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li></ul></div>`

export function appLinks() { document.querySelectorAll('[data-app]').forEach(a => { a.href = appLink(a.dataset.app) }) }
