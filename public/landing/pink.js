import { APP, ASSETS, ROBOTS, store, startLoading, loadReviews, explorer, hero, totals, summary, hasData, fmt, esc, appLink } from './live.js'

const state = { robot: 'so101', track: 'fine', task: 'all', focus: null }
const $ = selector => document.querySelector(selector)
const skeleton = width => `<span class="skeleton" style="min-width:${width}">&nbsp;</span>`
const light = 'oklch(0.97 0.006 80)', dim = 'oklch(0.65 0.01 80)'

document.querySelectorAll('[data-app-link]').forEach(a => { a.href = APP + a.dataset.appLink })

function portrait(robot, extra = '') {
  const base = `src="${ASSETS}${robot.img}.webp" alt="" style="width:${robot.w};height:100%;object-fit:contain;object-position:bottom;${extra}`
  return `<img ${base}">` + (robot.mirror ? `<img ${base};transform:scaleX(-1);margin-left:-8%">` : '')
}
const robotSub = robot => store.ready && !hasData(robot.id) ? `${robot.sub} · coming soon` : robot.sub

function renderStrip() {
  $('#robot-strip').innerHTML = `<p style="font-size:14px;line-height:1.5;color:var(--muted);padding-bottom:4px;flex:1 1 180px">One benchmark.<br>Every body.</p>` +
    ROBOTS.map(r => `<a href="#embodiments" style="display:flex;align-items:flex-end;gap:14px;flex:1 1 200px"><span style="width:64px;height:84px;display:flex;align-items:flex-end;justify-content:center;flex:none">${portrait(r)}</span><span style="font-size:14px;line-height:1.4;padding-bottom:4px"><strong style="display:block;font-weight:600">${r.name}</strong><span class="mono" style="font-size:10px;color:oklch(0.5 0.01 80)">${robotSub(r)}</span></span></a>`).join('')
}

function renderCards() {
  $('#robot-cards').innerHTML = ROBOTS.map(r => {
    const s = summary(r.id), live = store.ready && hasData(r.id)
    const facts = !store.ready ? skeleton('16ch') : !live ? 'Evaluations coming soon'
      : [s.comparisons ? `${fmt(s.comparisons)} A/B comparisons` : '', s.best ? `fine-tuning: ${s.best.policy} ${s.best.successes}/${s.best.trials}` : ''].filter(Boolean).join(' · ')
    const href = live ? appLink('/leaderboard', { robot: r.id, track: s.comparisons ? 'open' : 'fine-tuning' }) : '#join'
    return `<a href="${href}" style="display:block;min-width:0"><div style="height:340px;background:oklch(0.93 0.008 80);position:relative;overflow:hidden"><span class="mono" style="position:absolute;left:18px;top:16px;font-size:10px;color:oklch(0.5 0.01 80)">${r.num} · ${r.kind}</span><div style="position:absolute;inset:50px 24px 24px;display:flex;align-items:flex-end;justify-content:center">${portrait(r, 'filter:drop-shadow(0 14px 14px #0002)')}</div></div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:16px 4px 0"><div><strong style="font-size:22px;font-weight:600;letter-spacing:-.02em;display:block">${r.name}</strong><span class="mono" style="font-size:11px;color:oklch(0.5 0.01 80)">${robotSub(r)}</span><span class="mono" style="display:block;font-size:10px;color:var(--accent);margin-top:6px">${facts}</span></div><span style="color:var(--accent);font-size:20px">→</span></div></a>`
  }).join('') + `<a href="#join" style="display:flex;flex-direction:column;justify-content:flex-end;gap:10px;min-height:340px;border:1px dashed oklch(0.7 0.01 80);padding:24px;min-width:0"><span style="font-size:64px;font-weight:300;line-height:1;color:var(--accent)">+</span><strong style="font-size:22px;font-weight:600;letter-spacing:-.02em">Your robot</strong><span class="mono" style="font-size:11px;line-height:1.6;color:oklch(0.5 0.01 80)">New embodiments join with the same protocol.</span></a>`
}

function showPortrait(media) {
  media.dataset.src = 'portrait'
  media.innerHTML = `<div style="position:absolute;inset:40px 0 90px;display:flex;justify-content:center">${portrait(ROBOTS[0])}</div>`
}

function renderHero() {
  const h = hero(), media = $('#hero-media')
  if (h.video && media.dataset.src !== h.video && media.dataset.failed !== h.video) {
    media.dataset.src = h.video
    media.innerHTML = `<video src="${esc(h.video)}" muted autoplay loop playsinline preload="auto" style="width:100%;height:100%;object-fit:cover"></video>`
    media.querySelector('video').addEventListener('error', () => { media.dataset.failed = h.video; showPortrait(media) }, { once: true })
  } else if (!h.video && store.heroVideos && !media.dataset.src) showPortrait(media)
  $('#hero-tag').textContent = h.tag
  $('#hero-quote').innerHTML = h.instruction ? `“${esc(h.instruction)}”` : h.loading ? skeleton('14ch') : ''
  $('#hero-verdict').innerHTML = h.verdict
    ? `<span style="display:block">${h.verdict === 'Tie' ? 'Evaluator verdict' : 'Evaluator preferred'}</span><strong style="display:inline-block;background:var(--accent);padding:4px 10px;font-size:14px">${h.verdict}</strong>${h.video ? `<span style="display:block;opacity:.75;margin-top:6px;font-size:10px">Rollout shown · Policy ${h.side}</span>` : ''}`
    : h.loading ? `<span style="display:block">Evaluator verdict</span>${skeleton('9ch')}` : ''
}

function renderStats() {
  const t = totals()
  document.querySelectorAll('[data-stat]').forEach(el => {
    const key = el.dataset.stat, value = t[key]
    const pending = key === 'scenes' ? store.evaluations === null : !store.ready
    el.innerHTML = value !== null && value !== undefined ? fmt(value) : pending ? skeleton('3ch') : '—'
  })
}

const pill = (active, attrs, inner, round = true) => `<button class="chip" ${attrs} style="font-weight:500;font-size:14px;padding:9px 16px;border:1px solid oklch(1 0 0/.35);${round ? 'border-radius:999px;' : ''}background:${active ? light : 'transparent'};color:${active ? 'var(--ink)' : light}">${inner}</button>`

function renderExplorer() {
  const ex = explorer(state)
  if (state.track === 'fine') loadReviews(ex.robot.id, render)
  let html = `<div style="display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;border-top:1px solid oklch(1 0 0/.2);border-bottom:1px solid oklch(1 0 0/.2);padding:14px 0">
    <div style="display:flex;gap:6px;flex-wrap:wrap">${ex.robots.map(r => pill(r.active, `data-robot="${r.id}"`, r.name)).join('')}</div>
    <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap">${ex.tracks.map(t => pill(t.active, `data-track="${t.id}"`, `<span class="mono" style="font-size:12px;margin-right:10px">${t.label}</span>${t.name}`)).join('')}</div>
  </div>`
  if (ex.mode === 'fine') html += `<div class="mono" style="display:flex;gap:6px;flex-wrap:wrap;padding:18px 0 0;font-size:11px">${ex.taskChips.map(c => `<button class="chip" data-task="${esc(c.id)}" style="padding:7px 12px;border:1px solid oklch(1 0 0/.25);background:${c.active ? light : 'transparent'};color:${c.active ? 'var(--ink)' : light}">${esc(c.name)}</button>`).join('')}</div>`
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px 30px;flex-wrap:wrap;padding:34px 0 26px"><h3 style="font-size:clamp(26px,2.8vw,40px);font-weight:500;line-height:1.1;letter-spacing:-.035em;max-width:820px">${esc(ex.headline)}</h3><span class="mono" style="font-size:11px;color:${dim};line-height:1.8;text-align:right">${esc(ex.sub)}</span></div>`

  if (ex.mode === 'fine') {
    html += `<div style="display:flex;flex-direction:column">${ex.rows.map(r => `<button class="ft-row" data-focus="${esc(r.policyId)}" style="opacity:${r.dim ? 0.35 : 1}">
      <span class="mono" style="font-size:11px;color:${dim}">${r.rank}</span>
      <span class="ft-name" style="font-weight:600;font-size:19px;letter-spacing:-.02em;line-height:1.1">${esc(r.name)}<small class="mono" style="display:block;font-size:10px;font-weight:400;color:${dim};margin-top:6px">${r.successes} / ${r.trials} · progress ${r.progress}%</small></span>
      <span class="ft-blocks">${r.blocks.map(b => `<span class="ft-block" title="${esc(b.task)}">${b.cells.map(c => `<i class="c-${c}"></i>`).join('')}</span>`).join('')}</span>
      <span style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><strong style="font-weight:500;font-size:34px;letter-spacing:-.04em;line-height:1">${r.rate}%</strong><span style="position:relative;width:140px;max-width:100%;height:4px;background:oklch(1 0 0/.15)"><i style="position:absolute;top:0;bottom:0;left:${r.loPct};width:${r.spanPct};background:${light}"></i><i style="position:absolute;top:-3px;width:2px;height:10px;background:var(--accent-soft);left:${r.ratePct}"></i></span><small class="mono" style="font-size:10px;color:${dim}">95% CI ${r.lo}–${r.hi}%</small></span>
    </button>`).join('')}</div>
    <div class="mono" style="display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;padding:16px 0;border-top:1px solid oklch(1 0 0/.15);font-size:10px;color:${dim}">
      <span style="display:flex;align-items:center;gap:6px"><i class="c-success" style="width:9px;height:9px;border-radius:2px"></i>full success</span>
      <span style="display:flex;align-items:center;gap:6px"><i class="c-partial" style="width:9px;height:9px;border-radius:2px"></i>partial progress</span>
      <span style="display:flex;align-items:center;gap:6px"><i class="c-fail" style="width:9px;height:9px;border-radius:2px"></i>not successful</span>
      ${ex.hasUnknown ? `<span style="display:flex;align-items:center;gap:6px"><i class="c-unknown" style="width:9px;height:9px;border-radius:2px"></i>${ex.reviewsLoading ? 'loading trial detail…' : 'not full success · trial detail not public yet'}</span>` : ''}
      <span style="margin-left:auto">One block per task, up to 25 trials each · Wilson 95% interval on full success</span>
    </div>`
  } else if (ex.mode === 'open') {
    html += `<div style="display:flex;flex-direction:column">${ex.openRows.map(r => `<div class="op-row">
      <span class="mono" style="font-size:11px;color:${dim}">${r.rank}</span>
      <span style="font-weight:600;font-size:19px;letter-spacing:-.02em;line-height:1.1">${esc(r.name)}<small class="mono" style="display:block;font-size:10px;font-weight:400;color:${dim};margin-top:6px">${fmt(r.wins)} W · ${fmt(r.ties)} T · ${fmt(r.losses)} L</small></span>
      <span class="op-axis" title="Rating ${r.score} ± ${r.std} (1 SE)"><i style="position:absolute;top:6px;height:2px;left:${r.from};width:${r.span};background:${light}"></i><i style="position:absolute;top:1px;width:12px;height:12px;border-radius:50%;margin-left:-6px;left:${r.at};background:var(--accent-soft)"></i></span>
      <span style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><strong style="font-weight:500;font-size:34px;letter-spacing:-.04em;line-height:1">${fmt(r.score)}</strong><small class="mono" style="font-size:10px;color:${dim};text-align:right">± ${r.std} · ${fmt(r.evals)} comparisons</small></span>
    </div>`).join('')}</div>
    <div style="margin-top:20px;border:1px solid oklch(1 0 0/.3);padding:18px 20px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:center"><span style="font-size:15px;color:oklch(0.85 0.01 80)">${fmt(totals().comparisons)} blind A/B comparisons so far, across every body. Ratings and ±1 SE whiskers stream from <code class="mono">/api/leaderboard</code>.</span><a href="${appLink('/leaderboard', { robot: ex.robot.id, track: 'open' })}" style="background:var(--accent);color:#fff;font-weight:600;font-size:14px;padding:12px 16px">Open live leaderboard →</a></div>`
  } else if (ex.mode === 'soon') {
    html += `<div style="display:flex;gap:40px;align-items:center;flex-wrap:wrap;border:1px dashed oklch(1 0 0/.35);padding:30px"><img src="${ex.portrait}" alt="" style="height:220px;max-width:100%;object-fit:contain"><div><strong style="display:block;font-size:28px;font-weight:600;letter-spacing:-.03em">Coming soon</strong><p style="font-size:15px;line-height:1.6;max-width:480px;margin-top:10px;color:oklch(0.75 0.01 80)">${ex.robot.kind === 'Humanoid' ? 'The humanoid joins' : `${esc(ex.robot.name)} joins`} with the same two tracks. Results appear here the moment the first trials are scored.</p></div></div>`
  } else if (ex.mode === 'nofine' || ex.mode === 'noopen') {
    html += `<div style="border:1px dashed oklch(1 0 0/.35);padding:30px;font-size:15px;color:oklch(0.85 0.01 80)">${ex.mode === 'nofine' ? 'Fine-tuning tasks for this body are being registered. Switch to the Open track for A/B results.' : 'Switch to Fine-tuning for this body’s scored trials.'}</div>`
  } else if (ex.mode === 'error') {
    html += `<div style="border:1px dashed oklch(1 0 0/.35);padding:30px;font-size:15px;color:oklch(0.85 0.01 80)">${esc(ex.sub)}</div>`
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
  renderStrip(); renderHero(); renderStats(); renderExplorer(); renderCards()
  if (store.ready) $('#data-note').textContent = `Live data from the RoboColosseum API · ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
}

render()
startLoading(render)
