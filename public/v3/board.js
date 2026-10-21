// Home leaderboard card: one row per policy on the chosen body, a segmented switch per body and per track,
// and a click-to-expand breakdown (scenes for the open track, tasks for fine-tuning).
import { ASSETS, ROBOTS, store, rankedOpen, fineRows, labelRows, wilson, fmt, esc, appLink } from '../landing/live.js'
import { labFor } from '../landing/leaderboard.js'
import { prettyScene } from './hero.js'

const robotOf = id => ROBOTS.find(r => r.id === id) || ROBOTS[0]
const taskName = row => { const stem = String(row.taskId || '').replace(new RegExp(`^${row.robotId}-`), '').replace(/-v\d+$/, ''); const t = String(row.task || '').trim(); const s = (/\s/.test(t) ? t : stem || t).replace(/[_-]+/g, ' ').trim(); return s ? s[0].toUpperCase() + s.slice(1) : row.taskId }

export function mark(policy, size = 26) {
  const lab = labFor(policy)
  if (!lab) return `<span class="mk" title="Independent" style="width:${size}px;height:${size}px">${esc(String(policy).replace(/^.*?([a-z])/i, '$1').slice(0, 1).toUpperCase())}</span>`
  return `<span class="mk${lab.fit === 'contain' ? ' contain' : ''}" title="${esc(lab.name)}" style="width:${size}px;height:${size}px"><img src="${ASSETS}labs/${lab.id}.webp" alt="${esc(lab.name)}" loading="lazy"></span>`
}

function niceTicks(d0, d1, n = 5) {
  const raw = (d1 - d0) / n, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p, step = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p
  const out = []; for (let v = Math.ceil(d0 / step) * step; v <= d1 + 1e-9; v += step) out.push(Math.round(v))
  return out
}

export function openRows(robotId) {
  const rows = labelRows(rankedOpen(robotId), 'policy')
  if (!rows.length) return null
  const lo = Math.min(...rows.map(r => r.score - (r.std || 0))), hi = Math.max(...rows.map(r => r.score + (r.std || 0)))
  const pad = Math.max(30, (hi - lo) * 0.1), d0 = lo - pad, d1 = hi + pad
  const pos = v => Math.min(100, Math.max(0, (v - d0) / (d1 - d0) * 100))
  const best = rows[0].score, worst = rows[rows.length - 1].score
  let rank = 0, last = null
  return {
    ticks: niceTicks(d0, d1).map(v => ({ at: pos(v), label: fmt(v) })), n: `${fmt(Math.round(rows.reduce((s, r) => s + r.evals, 0) / 2))} comparisons`,
    rows: rows.map((r, i) => {
      const v = Math.round(r.score); if (v !== last) rank = i + 1; last = v
      const lab = labFor(r.policy)
      return { id: r.policy, rank, label: r.label, sub: `${lab ? lab.name : 'Independent'} · ${fmt(r.evals)} comparisons`, policy: r.policy,
        at: pos(r.score), lo: pos(r.score - (r.std || 0)), span: pos(r.score + (r.std || 0)) - pos(r.score - (r.std || 0)),
        k: Math.round(38 + 62 * (best === worst ? 1 : (r.score - worst) / (best - worst))),
        value: fmt(v), unit: '', em: `±${Math.round(r.std || 0)}`, aria: `${r.label}, place ${rank}: rating ${v} plus or minus ${Math.round(r.std || 0)} from ${r.evals} comparisons`,
        facts: [`rating <b>${fmt(v)} ± ${Math.round(r.std || 0)}</b>`, `<b>${fmt(r.wins)}</b> W <i>/</i> <b>${fmt(r.ties)}</b> T <i>/</i> <b>${fmt(r.losses)}</b> L`, `<b>${fmt(r.evals)}</b> comparisons`] }
    }),
  }
}

export function fineRowsModel(robotId) {
  const rows = fineRows(robotId)
  if (!rows.length) return null
  const byPolicy = new Map()
  for (const row of rows) {
    const key = row.policyId || row.policy
    const p = byPolicy.get(key) || { policyId: key, trials: 0, successes: 0, progress: 0, tasks: [] }
    p.trials += row.trials; p.successes += row.successes; p.progress += Number(row.progress || 0) * row.trials
    p.tasks.push({ name: taskName(row), rate: row.trials ? row.successes / row.trials * 100 : 0, s: row.successes, t: row.trials })
    byPolicy.set(key, p)
  }
  const policies = labelRows([...byPolicy.values()], 'policyId').map(p => { const rate = p.successes / p.trials * 100, [lo, hi] = wilson(p.successes, p.trials); return { ...p, rate, lo, hi } })
    .sort((a, b) => b.rate - a.rate || b.progress / b.trials - a.progress / a.trials)
  const best = policies[0].rate || 1
  let rank = 0, last = null
  return {
    ticks: [0, 25, 50, 75, 100].map(v => ({ at: v, label: v + '%' })), n: `${fmt(policies.reduce((s, p) => s + p.trials, 0))} trials`,
    rows: policies.map((p, i) => {
      const v = Math.round(p.rate); if (v !== last) rank = i + 1; last = v
      const lab = labFor(p.policyId)
      return { id: p.policyId, rank, label: p.label, sub: `${lab ? lab.name : 'Independent'} · ${p.tasks.length} task${p.tasks.length === 1 ? '' : 's'}`, policy: p.policyId,
        w: p.rate, lo: p.lo, span: p.hi - p.lo, k: Math.round(38 + 62 * p.rate / best),
        value: String(v), unit: '%', em: `${p.successes}/${p.trials}`, aria: `${p.label}, place ${rank}: ${p.successes} of ${p.trials} trials fully successful, ${v} percent`,
        facts: [`<b>${v}%</b> full success`, `95% CI <b>${Math.round(p.lo)}–${Math.round(p.hi)}%</b>`, `<b>${p.successes}/${p.trials}</b> trials`, `progress <b>${Math.round(p.progress / p.trials)}%</b>`],
        minis: p.tasks.sort((a, b) => b.rate - a.rate).map(t => ({ name: t.name, w: t.rate, value: `${t.s}/${t.t} · ${Math.round(t.rate)}%` })) }
    }),
  }
}

// Open-track breakdown by scene for one policy, from the lazily loaded evaluation list.
function sceneMinis(robotId, policy) {
  if (!store.evaluations) return null
  const scenes = new Map()
  for (const e of store.evaluations) {
    if (e.robotId !== robotId) continue
    const side = e.policyA === policy ? 'A' : e.policyB === policy ? 'B' : null
    if (!side) continue
    const key = prettyScene(e.scene) || 'Unlabelled scene'
    const s = scenes.get(key) || { name: key, w: 0, t: 0, l: 0 }
    if (e.winner === 'tie') s.t += 1; else if (e.winner === side) s.w += 1; else s.l += 1
    scenes.set(key, s)
  }
  return [...scenes.values()].map(s => { const n = s.w + s.t + s.l; return { name: s.name, n, w: (s.w + s.t / 2) / n * 100, value: `${s.w} W · ${s.t} T · ${s.l} L` } })
    .sort((a, b) => b.n - a.n).slice(0, 12)
}

const DESC = {
  open: robot => `Two policies run the same instruction on ${robot.name}, in the same room, one after the other. The evaluator records a preference without knowing which policy is which. Ratings are fitted from those blind pairs and shown with ±1 standard error; they only compare policies on this body.`,
  fine: robot => `Each checkpoint is adapted to one ${robot.name} task and runs up to 25 scored trials against written success criteria. Bars show the share of trials with full success; the lighter band is a Wilson 95% interval.`,
}

export function homeBoard(root, note, state, onState) {
  let picked = null
  function model() { return state.track === 'open' ? openRows(state.robot) : fineRowsModel(state.robot) }
  function render() {
    const robot = robotOf(state.robot)
    root.dataset.track = state.track
    const available = r => rankedOpen(r.id).length || fineRows(r.id).length
    if (store.ready) {
      if (state.track === 'open' && !rankedOpen(state.robot).length && fineRows(state.robot).length) state.track = 'fine'
      if (state.track === 'fine' && !fineRows(state.robot).length && rankedOpen(state.robot).length) state.track = 'open'
    }
    const m = store.ready ? model() : null
    const trackName = state.track === 'open' ? 'Open track' : 'Fine-tuning'
    let html = `<div class="lbh-top">
      <div class="seg lb-set" role="group" aria-label="Robot body">${ROBOTS.map(r => `<button class="${r.id === state.robot ? 'on' : ''}" data-robot="${r.id}" aria-pressed="${r.id === state.robot}"${store.ready && !available(r) ? ' disabled' : ''}>${esc(r.name)}${store.ready && !available(r) ? '<small>soon</small>' : ''}</button>`).join('')}</div>
      <div class="seg tracks" role="group" aria-label="Track">${[['open', 'A/B', 'Open track', rankedOpen(state.robot).length], ['fine', '✓/4', 'Fine-tuning', fineRows(state.robot).length]].map(([id, code, name, n]) => `<button class="${id === state.track ? 'on' : ''}" data-track="${id}" aria-pressed="${id === state.track}"${store.ready && !n ? ' disabled' : ''}><span class="mono" style="margin-right:8px;font-size:11px">${code}</span>${name}</button>`).join('')}</div>
    </div>
    <p class="lb-desc">${DESC[state.track](robot)}</p>`
    if (!store.ready) html += `<div class="lbh-empty"><span class="skel" style="min-width:22ch">&nbsp;</span></div>`
    else if (!m) html += `<div class="lbh-empty">${store.failed.has(`${state.robot}/${state.track === 'open' ? 'open' : 'fine-tuning'}`) ? `${robot.name} results are temporarily unavailable. Reload to try again.` : `No ${trackName.toLowerCase()} results for ${robot.name} yet.`}</div>`
    else {
      html += `<div class="lbh-chart"><div class="lbh-ax"><div class="lbh-axis"><span></span><span class="lbh-ticks">${m.ticks.map(t => `<i style="left:${t.at}%">${t.label}</i>`).join('')}</span><span class="lbh-n">${m.n}</span></div></div><div class="lbh-rows">`
      html += m.rows.map((r, i) => `<button class="lbh-row${picked === r.id ? ' on' : ''}" data-id="${esc(r.id)}" style="--i:${Math.min(r.rank, 12)};--k:${r.k}%" aria-expanded="${picked === r.id}" aria-label="${esc(r.aria)}">
        <span class="rk${r.rank <= 3 ? ' r' + r.rank : ''}">${r.rank}</span>${mark(r.policy)}
        <span class="lbh-name"><span class="lbh-nl"><b>${esc(r.label)}</b><span class="lbh-set">${esc(r.sub)}</span></span></span>
        <span class="lbh-track">${state.track === 'open' ? `<span class="lbh-ci" style="--lo:${r.lo}%;--span:${r.span}%"></span><span class="lbh-pt" style="--at:${r.at}%"></span>` : `<span class="lbh-s" style="--w:${r.w}%"></span><span class="lbh-ci" style="--lo:${r.lo}%;--span:${r.span}%"></span>`}</span>
        <span class="lbh-val"><b>${r.value}${r.unit ? `<small>${r.unit}</small>` : ''}</b><em>${r.em}</em></span>
      </button>`).join('')
      html += `</div></div><p class="lbh-hint">Click a policy to see its ${state.track === 'open' ? 'scenes' : 'tasks'} one by one.</p><div class="lbh-detail" hidden></div>`
    }
    root.innerHTML = html
    root.classList.toggle('picked', Boolean(picked && m?.rows.some(r => r.id === picked)))
    if (picked && m) { const row = root.querySelector(`.lbh-row[data-id="${CSS.escape(picked)}"]`); if (row) openDetail(row, m.rows.find(r => r.id === picked)) }
    note.innerHTML = `<a href="${appLink('/leaderboard', { robot: state.robot, track: state.track === 'open' ? 'open' : 'fine-tuning' })}">Full leaderboard table, per policy →</a>`
  }
  function openDetail(row, r) {
    const detail = root.querySelector('.lbh-detail')
    row.after(detail); detail.hidden = false; detail.classList.remove('in'); void detail.offsetWidth; detail.classList.add('in')
    const minis = state.track === 'open' ? sceneMinis(state.robot, r.policy) : r.minis
    detail.innerHTML = `<div class="lbh-dh">${mark(r.policy, 30)}<b>${esc(r.label)}</b><span class="facts">${r.facts.map(f => `<span>${f}</span>`).join('')}</span><a class="btn small" href="${appLink('/leaderboard', { robot: state.robot, track: state.track === 'open' ? 'open' : 'fine-tuning' })}">On the full board <span class="arr">→</span></a></div>`
      + (minis === null ? `<p class="lbh-empty" style="padding:8px 0">Loading the evaluation list for the scene breakdown…</p>`
        : minis.length ? `<div class="lbh-minis">${minis.map(mn => `<div class="lbh-mini"><span class="nm" title="${esc(mn.name)}">${esc(mn.name)}${mn.n ? ` <span class="mono" style="color:var(--ink-3);font-size:11px">n=${mn.n}</span>` : ''}</span><span class="tr"><i style="--w:${mn.w}%"></i></span><span class="vl">${esc(mn.value)}</span></div>`).join('')}</div><p class="lbh-hint" style="margin-top:12px;text-align:left">${state.track === 'open' ? 'Bar: share of comparisons won, ties counted as half.' : 'Bar: share of trials with full success, per task.'}</p>`
        : `<p class="lbh-empty" style="padding:8px 0">No breakdown available.</p>`)
  }
  root.addEventListener('click', e => {
    const seg = e.target.closest('button[data-robot],button[data-track]')
    if (seg) { if (seg.disabled) return; if (seg.dataset.robot) state.robot = seg.dataset.robot; else state.track = seg.dataset.track; picked = null; render(); onState?.(state); return }
    const row = e.target.closest('.lbh-row'); if (!row) return
    picked = picked === row.dataset.id ? null : row.dataset.id
    render()
  })
  render()
  return { render, setState(next) { Object.assign(state, next); picked = null; render() } }
}
