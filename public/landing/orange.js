import { APP, ASSETS, ROBOTS, store, startLoading, loadReviews, explorer, hero, totals, summary, hasData, fmt, esc, appLink } from './live.js'

const state = { robot: 'so101', track: 'fine', task: 'all', focus: null }
const $ = selector => document.querySelector(selector)
const skeleton = width => `<span class="skeleton" style="min-width:${width}">&nbsp;</span>`
const ink = 'oklch(0.15 0 0)', muted = 'oklch(0.45 0 0)'

document.querySelectorAll('[data-app-link]').forEach(a => { a.href = APP + a.dataset.appLink })

function portrait(robot, extra = '') {
  const base = `src="${ASSETS}${robot.img}.webp" alt="" style="width:${robot.w};height:100%;object-fit:contain;object-position:bottom;${extra}`
  return `<img ${base}">` + (robot.mirror ? `<img ${base};transform:scaleX(-1);margin-left:-8%">` : '')
}

// Panels are built once so the footage keeps playing while data arrives.
function buildPanels() {
  $('#hero-panels').innerHTML = ROBOTS.map(r => `<div class="panel" style="position:relative;min-width:0;height:560px;background:${ink};overflow:hidden">
    <div id="media-${r.id}" style="position:absolute;inset:0"></div>
    <span id="tag-${r.id}" style="position:absolute;left:0;top:0;color:${ink};font-weight:900;font-size:30px;letter-spacing:-.05em;padding:10px 14px 8px;line-height:1;pointer-events:none"></span>
    <span class="mono" style="position:absolute;right:14px;top:14px;font-size:11px;color:#fff;pointer-events:none">${r.num} / ${r.name.toUpperCase()}</span>
    <div style="position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(to top,${ink} 30%,transparent);pointer-events:none"></div>
    <div style="position:absolute;inset:auto 18px 118px;height:230px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none">${portrait(r, 'filter:drop-shadow(0 18px 24px #000c)')}</div>
    <div style="position:absolute;left:18px;right:18px;bottom:18px;color:#fff;pointer-events:none"><strong style="display:block;font-size:28px;font-weight:800;letter-spacing:-.04em;line-height:1">${r.name}</strong><span id="eval-${r.id}" class="mono" style="display:block;font-size:11px;color:var(--orange);margin-top:10px;line-height:1.6"></span><span id="task-${r.id}" style="display:block;font-size:14px;line-height:1.4;margin-top:6px;color:oklch(0.85 0 0)"></span></div>
  </div>`).join('')
}

function panelText(robot) {
  const h = hero(), s = summary(robot.id)
  if (robot.id === 'franka') return { track: 'A/B', eval: `OPEN TRACK${h.scene ? ' · ' + h.scene.toUpperCase() : ''} · BLIND PREFERENCE`, task: h.instruction ? `“${esc(h.instruction)}”` : h.loading ? skeleton('16ch') : 'A blind A/B comparison, recorded.' }
  if (!store.ready) return { track: '', eval: skeleton('20ch'), task: skeleton('14ch') }
  if (!hasData(robot.id)) return { track: 'SOON', eval: `${robot.kind.toUpperCase()} · COMING SOON`, task: 'Same protocol. The roster keeps growing.' }
  if (s.best && (robot.id === 'so101' || !s.comparisons)) return { track: '✓/4', eval: `FINE-TUNING · ${esc(s.best.task.toUpperCase())} · ${s.best.successes} / ${s.best.trials} SUCCESS`, task: `${esc(s.best.policy)} checkpoint, ${s.best.trials} scored trials.` }
  return { track: 'A/B', eval: `OPEN TRACK · ${robot.id === 'yam' ? 'TWO ARMS · ' : ''}${fmt(s.comparisons)} COMPARISONS`, task: `${esc(s.leader)} currently leads ${s.policies} rated policies.` }
}

function renderPanels() {
  const h = hero()
  for (const robot of ROBOTS) {
    const text = panelText(robot), tag = $(`#tag-${robot.id}`)
    tag.textContent = text.track
    tag.style.background = text.track === 'A/B' ? 'var(--orange)' : '#fff'
    tag.style.display = text.track ? '' : 'none'
    $(`#eval-${robot.id}`).innerHTML = text.eval
    $(`#task-${robot.id}`).innerHTML = text.task
  }
  const media = $('#media-franka')
  if (h.video && media.dataset.src !== h.video && media.dataset.failed !== h.video) {
    media.dataset.src = h.video
    media.innerHTML = `<video src="${esc(h.video)}" muted autoplay loop playsinline preload="auto" style="opacity:.75"></video>`
    media.querySelector('video').addEventListener('error', () => { media.dataset.failed = h.video; media.innerHTML = '' }, { once: true })
  }
}

function renderStats() {
  const t = totals()
  document.querySelectorAll('[data-stat]').forEach(el => {
    const key = el.dataset.stat, value = t[key]
    const pending = key === 'scenes' ? store.evaluations === null : !store.ready
    el.innerHTML = value !== null && value !== undefined ? fmt(value) : pending ? skeleton('3ch') : '—'
  })
}

function renderRoster() {
  $('#roster-cards').innerHTML = ROBOTS.map(r => {
    const s = summary(r.id), live = store.ready && hasData(r.id)
    const facts = !store.ready ? skeleton('16ch') : !live ? 'Evaluations coming soon'
      : [s.comparisons ? `${fmt(s.comparisons)} A/B comparisons` : '', s.best ? `fine-tuning ${s.best.successes}/${s.best.trials} best` : ''].filter(Boolean).join(' · ')
    const href = live ? appLink('/leaderboard', { robot: r.id, track: s.comparisons ? 'open' : 'fine-tuning' }) : '#join'
    return `<a href="${href}" style="display:block;background:#fff;position:relative;height:420px;overflow:hidden;min-width:0"><span style="position:absolute;left:18px;top:12px;font-weight:900;font-size:64px;letter-spacing:-.05em;line-height:1">${r.num}</span><span class="mono" style="position:absolute;right:18px;top:20px;font-size:11px;color:${muted}">${r.kind}</span><div style="position:absolute;inset:90px 28px 118px;display:flex;align-items:flex-end;justify-content:center">${portrait(r)}</div><div style="position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;gap:10px;border-top:2px solid ${ink};padding-top:12px"><div><strong style="display:block;font-size:24px;font-weight:800;letter-spacing:-.03em">${r.name}</strong><span class="mono" style="font-size:11px;color:${muted}">${store.ready && !live ? `${r.sub} · coming soon` : r.sub}</span><span class="mono" style="display:block;font-size:10px;color:var(--orange-deep);margin-top:4px">${facts}</span></div><span style="font-size:22px">→</span></div></a>`
  }).join('') + `<a href="#join" style="display:flex;flex-direction:column;justify-content:flex-end;gap:12px;border:2px dashed ${ink};padding:24px 18px;box-sizing:border-box;min-height:420px;min-width:0"><span style="font-weight:900;font-size:64px;letter-spacing:-.05em;line-height:1">+</span><strong style="font-size:24px;font-weight:800;letter-spacing:-.03em">Your robot</strong><span class="mono" style="font-size:11px;line-height:1.6;color:oklch(0.3 0 0)">New embodiments join with the same protocol. Bring one.</span></a>`
}

const square = (active, attrs, inner) => `<button class="chip" ${attrs} style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;padding:10px 16px;border:2px solid ${ink};background:${active ? ink : 'transparent'};color:${active ? '#fff' : ink}">${inner}</button>`

function renderExplorer() {
  const ex = explorer(state)
  if (state.track === 'fine') loadReviews(ex.robot.id, render)
  let html = `<div style="display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;border-top:2px solid ${ink};border-bottom:2px solid ${ink};padding:14px 0">
    <div style="display:flex;gap:4px;flex-wrap:wrap">${ex.robots.map(r => square(r.active, `data-robot="${r.id}"`, r.name)).join('')}</div>
    <div style="display:flex;gap:4px;margin-left:auto;flex-wrap:wrap">${ex.tracks.map(t => square(t.active, `data-track="${t.id}"`, `<span style="font-weight:900;letter-spacing:-.05em">${t.label}</span>${t.name}`)).join('')}</div>
  </div>`
  if (ex.mode === 'fine') html += `<div class="mono" style="display:flex;gap:6px;flex-wrap:wrap;padding:18px 0 0;font-size:12px">${ex.taskChips.map(c => `<button class="chip" data-task="${esc(c.id)}" style="padding:7px 12px;border:1px solid ${ink};background:${c.active ? ink : 'transparent'};color:${c.active ? '#fff' : ink}">${esc(c.name)}</button>`).join('')}</div>`
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px 30px;flex-wrap:wrap;padding:34px 0 26px"><h3 style="font-weight:800;font-size:clamp(26px,2.6vw,38px);line-height:1.05;letter-spacing:-.04em;max-width:820px">${esc(ex.headline)}</h3><span class="mono" style="font-size:12px;color:${muted};line-height:1.7;text-align:right">${esc(ex.sub)}</span></div>`

  if (ex.mode === 'fine') {
    html += `<div style="display:flex;flex-direction:column">${ex.rows.map(r => `<button class="ft-row" data-focus="${esc(r.policyId)}" style="opacity:${r.dim ? 0.35 : 1}">
      <span class="mono" style="font-size:12px;color:${muted}">${r.rank}</span>
      <span class="ft-name" style="font-weight:800;font-size:20px;letter-spacing:-.03em;line-height:1.1">${esc(r.name)}<small class="mono" style="display:block;font-size:10px;font-weight:400;color:${muted};margin-top:6px">${r.successes} / ${r.trials} trials · progress ${r.progress}%</small></span>
      <span class="ft-blocks">${r.blocks.map(b => `<span class="ft-block" title="${esc(b.task)}">${b.cells.map(c => `<i class="c-${c}"></i>`).join('')}</span>`).join('')}</span>
      <span style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><strong style="font-weight:900;font-size:34px;letter-spacing:-.05em;line-height:1">${r.rate}%</strong><span style="position:relative;width:140px;max-width:100%;height:4px;background:oklch(0.15 0 0/.12)"><i style="position:absolute;top:0;bottom:0;left:${r.loPct};width:${r.spanPct};background:${ink}"></i><i style="position:absolute;top:-3px;width:2px;height:10px;background:var(--orange);left:${r.ratePct}"></i></span><small class="mono" style="font-size:10px;color:${muted}">95% CI ${r.lo}–${r.hi}%</small></span>
    </button>`).join('')}</div>
    <div class="mono" style="display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;padding:16px 0;border-top:1px solid oklch(0.15 0 0/.2);font-size:11px;color:${muted}">
      <span style="display:flex;align-items:center;gap:6px"><i class="c-success" style="width:9px;height:9px"></i>full success</span>
      <span style="display:flex;align-items:center;gap:6px"><i class="c-partial" style="width:9px;height:9px"></i>partial progress</span>
      <span style="display:flex;align-items:center;gap:6px"><i class="c-fail" style="width:9px;height:9px"></i>not successful</span>
      ${ex.hasUnknown ? `<span style="display:flex;align-items:center;gap:6px"><i class="c-unknown" style="width:9px;height:9px"></i>${ex.reviewsLoading ? 'loading trial detail…' : 'not full success · trial detail not public yet'}</span>` : ''}
      <span style="margin-left:auto">One block per task, up to 25 trials each · Wilson 95% interval on full success</span>
    </div>`
  } else if (ex.mode === 'open') {
    html += `<div style="display:flex;flex-direction:column">${ex.openRows.map(r => `<div class="op-row">
      <span class="mono" style="font-size:12px;color:${muted}">${r.rank}</span>
      <span style="font-weight:800;font-size:20px;letter-spacing:-.03em;line-height:1.1">${esc(r.name)}<small class="mono" style="display:block;font-size:10px;font-weight:400;color:${muted};margin-top:6px">${fmt(r.wins)} W · ${fmt(r.ties)} T · ${fmt(r.losses)} L</small></span>
      <span class="op-axis" title="Rating ${r.score} ± ${r.std} (1 SE)"><i style="position:absolute;top:6px;height:2px;left:${r.from};width:${r.span};background:${ink}"></i><i style="position:absolute;top:1px;width:12px;height:12px;margin-left:-6px;left:${r.at};background:var(--orange)"></i></span>
      <span style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><strong style="font-weight:900;font-size:34px;letter-spacing:-.05em;line-height:1">${fmt(r.score)}</strong><small class="mono" style="font-size:10px;color:${muted};text-align:right">± ${r.std} · ${fmt(r.evals)} comparisons</small></span>
    </div>`).join('')}</div>
    <div style="margin-top:20px;border:2px solid ${ink};padding:18px 20px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:center"><span style="font-size:15px;font-weight:500">${fmt(totals().comparisons)} blind A/B comparisons so far, across every body. Ratings and ±1 SE whiskers stream from <code class="mono">/api/leaderboard</code>.</span><a href="${appLink('/leaderboard', { robot: ex.robot.id, track: 'open' })}" style="background:${ink};color:#fff;font-weight:700;font-size:14px;padding:12px 16px">Open live leaderboard →</a></div>`
  } else if (ex.mode === 'soon') {
    html += `<div style="display:flex;gap:40px;align-items:center;flex-wrap:wrap;border:2px dashed ${ink};padding:30px"><img src="${ex.portrait}" alt="" style="height:220px;max-width:100%;object-fit:contain"><div><strong style="display:block;font-size:28px;font-weight:800;letter-spacing:-.04em">Coming soon</strong><p style="font-size:15px;line-height:1.6;max-width:480px;margin-top:10px;color:oklch(0.35 0 0)">${ex.robot.kind === 'Humanoid' ? 'The humanoid joins' : `${esc(ex.robot.name)} joins`} with the same two tracks. Results appear here the moment the first trials are scored.</p></div></div>`
  } else if (ex.mode === 'nofine' || ex.mode === 'noopen') {
    html += `<div style="border:2px dashed ${ink};padding:30px;font-size:15px">${ex.mode === 'nofine' ? 'Fine-tuning tasks for this body are being registered. Switch to the Open track for A/B results.' : 'Switch to Fine-tuning for this body’s scored trials.'}</div>`
  } else if (ex.mode === 'error') {
    html += `<div style="border:2px dashed ${ink};padding:30px;font-size:15px">${esc(ex.sub)}</div>`
  }
  $('#explorer').innerHTML = html
}

$('#explorer').addEventListener('click', event => {
  const target = event.target.closest('button')
  if (!target) return
  const { robot, track, task, focus } = target.dataset
  if (robot) Object.assign(state, { robot, task: 'all', focus: null })
  else if (track) Object.assign(state, { track, focus: null })
  else if (task) Object.assign(state, { task, focus: null })
  else if (focus) state.focus = state.focus === focus ? null : focus
  renderExplorer()
})

function render() {
  renderPanels(); renderStats(); renderExplorer(); renderRoster()
  if (store.ready) $('#data-note').textContent = `LIVE DATA FROM THE ROBOCOLOSSEUM API · ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}`
}

buildPanels()
render()
startLoading(render)
