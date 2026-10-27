// Leaderboard figure: every model on a robot as a labeled logo marker, drawn from the live boards.
import { ASSETS, ROBOTS, rankedOpen, fineRows, labelRows, wilson, fmt, esc } from './live.js'

// Lab marks are the labs' own Hugging Face organization avatars.
const LABS = {
  ai2: { name: 'Ai2', fit: 'cover' },
  // The avatar stacks the eye above the wordmark; zoom onto the eye.
  nvidia: { name: 'NVIDIA', fit: 'zoom', bg: '#fff', scale: 1.6, dy: 0.3 },
  galaxea: { name: 'Galaxea', fit: 'cover' },
  robbyant: { name: 'Robbyant', fit: 'cover' },
  pi: { name: 'Physical Intelligence', fit: 'cover' },   // pi.webp is a round mark (white π on a black disc)
  openai: { name: 'OpenAI', fit: 'contain', bg: '#fff' },
  anthropic: { name: 'Anthropic', fit: 'cover' },
  xai: { name: 'xAI', fit: 'contain', bg: '#fff' },
}
const FAMILY_LAB = [['pi05', 'pi'], ['g05', 'galaxea'], ['groot', 'nvidia'], ['gr00t', 'nvidia'], ['molmoact2', 'ai2'], ['lingbot', 'robbyant'], ['gpt-', 'openai'], ['claude-', 'anthropic'], ['grok-', 'xai']]
export function labFor(policy) {
  const id = String(policy || '').split('@')[0]
  const hit = FAMILY_LAB.find(([prefix]) => id.startsWith(prefix))
  return hit ? { id: hit[1], ...LABS[hit[1]] } : null
}

const LOW_EVIDENCE = 20

// ?robot=so101&track=fine opens a specific chart; selections keep the URL shareable.
export function boardFromUrl() {
  const params = new URLSearchParams(location.search)
  return {
    robot: ROBOTS.some(r => r.id === params.get('robot')) ? params.get('robot') : 'franka',
    track: params.get('track') === 'fine' ? 'fine' : 'open',
  }
}
export function boardToUrl({ robot, track }) {
  const url = new URL(location.href)
  url.searchParams.set('robot', robot); url.searchParams.set('track', track)
  history.replaceState(null, '', url)
}

export function figureModel(robotId, track) {
  const robot = ROBOTS.find(r => r.id === robotId) || ROBOTS[0]
  return track === 'open' ? openModel(robot) : fineModel(robot)
}

function openModel(robot) {
  const rows = labelRows(rankedOpen(robot.id), 'policy')
  if (!rows.length) return { empty: `No open-track comparisons for ${robot.name} yet.` }
  const comparisons = Math.round(rows.reduce((n, r) => n + r.evals, 0) / 2)
  const points = rows.map((r, i) => ({
    key: r.policy, label: r.evals < LOW_EVIDENCE ? `${r.label} · n=${r.evals}` : r.label, name: r.label, lab: labFor(r.policy),
    x: r.evals, y: r.score, lo: r.score - (r.std || 0), hi: r.score + (r.std || 0), lead: i === 0, faint: r.evals < LOW_EVIDENCE,
    tip: [`${fmt(Math.round(r.score))} ± ${Math.round(r.std || 0)}`, 'rating', `${fmt(r.wins)} W · ${fmt(r.ties)} T · ${fmt(r.losses)} L · ${fmt(r.evals)} comparisons`],
    cells: [String(i + 1), r.label, labFor(r.policy)?.name || '—', fmt(Math.round(r.score)), `± ${Math.round(r.std || 0)}`, `${fmt(r.wins)} / ${fmt(r.ties)} / ${fmt(r.losses)}`, fmt(r.evals)],
  }))
  const [first, second] = rows, last = rows[rows.length - 1]
  const gap = second ? Math.round(first.score - second.score) : 0
  const title = !second ? `${first.label} is the only rated model on ${robot.name}`
    : first.evals < LOW_EVIDENCE ? `${first.label} tops ${robot.name} on just ${first.evals} comparisons`
    : gap > (first.std || 0) + (second.std || 0) ? `${first.label} leads ${robot.name} by ${fmt(gap)} rating points`
    : `${first.label} edges ${second.label} on ${robot.name}, within the error bars`
  const scores = rows.map(r => r.score), lo = Math.min(...scores), hi = Math.max(...scores)
  const pad = Math.max(60, (hi - lo) * 0.14)
  const counts = rows.map(r => r.evals)
  return {
    title, subtitle: second ? `Rating: ${fmt(Math.round(first.score))} (${first.label}) → ${fmt(Math.round(last.score))} (${last.label})` : `Rating: ${fmt(Math.round(first.score))}`,
    yLabel: 'Rating (higher is better)', xLabel: 'Blind A/B comparisons (log)',
    note: `RoboColosseum open track · ${robot.name} · ${fmt(comparisons)} blind comparisons. Whiskers: ±1 standard error. Bold: current leader${rows.some(r => r.evals < LOW_EVIDENCE) ? `; n = comparisons where fewer than ${LOW_EVIDENCE}` : ''}.`,
    x: { log: true, d0: Math.max(1, Math.min(...counts) / 1.6), d1: Math.max(...counts) * 1.6 },
    y: { d0: lo - pad, d1: hi + pad },
    points, head: ['#', 'Model', 'Lab', 'Rating', '±1 SE', 'W / T / L', 'Comparisons'],
  }
}

function fineModel(robot) {
  const rows = fineRows(robot.id)
  if (!rows.length) return { empty: `No published fine-tuning results for ${robot.name} yet.` }
  const byPolicy = new Map()
  for (const row of rows) {
    const key = row.policyId || row.policy
    const p = byPolicy.get(key) || { policyId: key, trials: 0, successes: 0, progress: 0, tasks: 0 }
    p.trials += row.trials; p.successes += row.successes; p.progress += Number(row.progress || 0) * row.trials; p.tasks += 1
    byPolicy.set(key, p)
  }
  const tasks = new Set(rows.map(r => r.taskId || r.task)).size
  const policies = labelRows([...byPolicy.values()], 'policyId').map(p => {
    const rate = p.successes / p.trials * 100, [lo, hi] = wilson(p.successes, p.trials)
    return { ...p, rate, lo, hi, avgProgress: p.progress / p.trials }
  }).sort((a, b) => b.rate - a.rate || b.avgProgress - a.avgProgress)
  const total = policies.reduce((n, p) => n + p.trials, 0)
  const points = policies.map((p, i) => ({
    key: p.policyId, label: p.label, name: p.label, lab: labFor(p.policyId),
    x: p.avgProgress, y: p.rate, lo: p.lo, hi: p.hi, lead: i === 0, faint: p.trials < 25,
    tip: [`${Math.round(p.rate)}%`, 'full success', `95% CI ${Math.round(p.lo)}–${Math.round(p.hi)}% · progress ${Math.round(p.avgProgress)}% · ${p.successes}/${p.trials} trials`],
    cells: [String(i + 1), p.label, labFor(p.policyId)?.name || '—', `${Math.round(p.rate)}%`, `${Math.round(p.lo)}–${Math.round(p.hi)}%`, `${Math.round(p.avgProgress)}%`, fmt(p.trials)],
  }))
  const first = policies[0], last = policies[policies.length - 1]
  const title = total < 25 ? `Only ${total} fine-tuning trial${total === 1 ? '' : 's'} scored on ${robot.name} so far`
    : `${first.label} fully completes ${Math.round(first.rate)}% of its ${robot.name} trials`
  return {
    title, subtitle: policies.length > 1 ? `Full success: ${Math.round(first.rate)}% (${first.label}) → ${Math.round(last.rate)}% (${last.label}), ${fmt(total)} trials` : `Full success: ${Math.round(first.rate)}% over ${fmt(total)} trial${total === 1 ? '' : 's'}`,
    yLabel: 'Full success rate', xLabel: 'Average task progress',
    note: `RoboColosseum fine-tuning track · ${robot.name} · ${tasks} task${tasks === 1 ? '' : 's'}, up to 25 trials per model each. Whiskers: Wilson 95% interval. Dashed line: success equals progress.`,
    x: { d0: 0, d1: 100, percent: true }, y: { d0: 0, d1: 100, percent: true }, diagonal: true,
    points, head: ['#', 'Model', 'Lab', 'Full success', '95% CI', 'Progress', 'Trials'],
  }
}

// ---------- rendering ----------
const measureCtx = document.createElement('canvas').getContext('2d')
const textWidth = (text, font) => { measureCtx.font = font; return measureCtx.measureText(text).width }

function niceStep(range, count) {
  const raw = range / count, power = 10 ** Math.floor(Math.log10(raw)), n = raw / power
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * power
}
function linearTicks(d0, d1, step) {
  const ticks = []
  for (let v = Math.ceil(d0 / step) * step; v <= d1 + 1e-9; v += step) ticks.push(v)
  return ticks
}
function logTicks(d0, d1) {
  const ticks = []
  for (let k = Math.floor(Math.log10(d0)); k <= Math.ceil(Math.log10(d1)); k++) for (const m of [1, 2, 5]) { const v = m * 10 ** k; if (v >= d0 && v <= d1) ticks.push(v) }
  return ticks
}
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

let uid = 0
export function renderFigure(root, model, theme) {
  root._figure = { model, theme }
  if (!root._observed) {
    root._observed = true
    let last = root.clientWidth
    new ResizeObserver(() => { if (Math.abs(root.clientWidth - last) > 4) { last = root.clientWidth; draw(root) } }).observe(root)
    document.fonts?.ready.then(() => draw(root))
  }
  draw(root)
}

function draw(root) {
  const { model, theme } = root._figure
  if (model.empty) {
    root.innerHTML = `<div style="${theme.card};padding:clamp(22px,3vw,36px);font-size:15px;color:${theme.secondary}">${esc(model.empty)}</div>`
    return
  }
  // Below 600px the scatter becomes a ranked dot plot: one row per model, value on a shared axis.
  const compact = root.clientWidth < 600
  const axisStyle = `font-family:${theme.sans};font-weight:600;font-size:clamp(14px,1.3vw,17px);color:${theme.secondary}`
  const id = `lb${++uid}`
  root.innerHTML = `<figure style="margin:0;${theme.card};padding:clamp(20px,3.2vw,44px) clamp(16px,3.2vw,48px) clamp(16px,2.4vw,28px)">
      <h3 style="font-family:${theme.sans};font-weight:${theme.titleWeight};font-size:clamp(26px,3.2vw,44px);line-height:1.08;letter-spacing:-.03em;color:${theme.ink};max-width:900px;margin:0">${esc(model.title)}</h3>
      <p style="font-family:${theme.sans};font-size:clamp(16px,1.6vw,21px);color:${theme.ink};margin:14px 0 0">${esc(model.subtitle)}</p>
      <p style="${axisStyle};margin:clamp(20px,2.6vw,34px) 0 6px">${esc(compact ? 'Ranked' : model.yLabel)}</p>
      <div class="lb-plot" style="position:relative"></div>
      <p style="${axisStyle};text-align:center;margin:4px 0 0">${esc(compact ? model.yLabel : model.xLabel)}</p>
      <figcaption style="font-family:${theme.sans};font-size:14px;line-height:1.55;color:${theme.muted};margin-top:18px;max-width:860px">${esc(model.note)}</figcaption>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px 20px;flex-wrap:wrap;margin-top:18px;padding-top:14px;border-top:1px solid ${theme.grid};font-family:${theme.mono};font-size:11px;color:${theme.muted}"><strong style="font-family:${theme.sans};font-size:17px;font-weight:${theme.titleWeight};letter-spacing:-.02em;color:${theme.ink}">${theme.brand}</strong><span>Live data · ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })} · robocolosseum.ai</span></div>
    </figure>
    <details style="margin-top:12px;font-family:${theme.mono};font-size:12px;color:${theme.secondary}"><summary style="cursor:pointer;padding:6px 0">Show the numbers</summary>
      <div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;margin-top:8px;font-variant-numeric:tabular-nums">
        <thead><tr>${model.head.map((h, i) => `<th style="text-align:${i < 3 ? 'left' : 'right'};font-weight:600;padding:8px 10px;border-bottom:1px solid ${theme.ink}">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${model.points.map(p => `<tr>${p.cells.map((c, i) => `<td style="text-align:${i < 3 ? 'left' : 'right'};padding:8px 10px;border-bottom:1px solid ${theme.grid};${i === 1 ? `color:${theme.ink};font-weight:${p.lead ? 700 : 500};font-family:${theme.sans};font-size:14px` : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </details>`
  const plot = root.querySelector('.lb-plot')
  const { svg, pts, R } = (compact ? rows : scatter)(model, theme, plot.clientWidth, id)
  plot.innerHTML = svg + `<div class="lb-tip" role="status" style="position:absolute;pointer-events:none;display:none;min-width:150px;max-width:260px;padding:10px 12px;background:${theme.tipBg};color:${theme.tipInk};font-family:${theme.mono};font-size:11px;line-height:1.5;box-shadow:0 6px 24px #0003;z-index:2"></div>`
  bindTips(plot, pts, R, theme)
}

// A model's lab logo in a ringed disc; the hit area is wider than the mark.
function marker(p, i, R, id, theme) {
  const lab = p.lab
  const logo = (size, dy = 0) => `<image href="${ASSETS}labs/${lab.id}.webp" x="${-size / 2}" y="${-size / 2 + dy}" width="${size}" height="${size}" clip-path="url(#${id}-c)" preserveAspectRatio="xMidYMid slice"/>`
  const inner = lab
    ? lab.fit === 'cover' ? logo(2 * R)
      : lab.fit === 'zoom' ? `<circle r="${R - 1}" fill="${lab.bg}"/>${logo(2 * R * lab.scale, lab.dy * R)}`
      : `<circle r="${R - 1}" fill="${lab.bg}"/>${logo(R * 1.36)}`
    : `<circle r="${R - 1}" fill="${theme.surface}"/><text y="${R * 0.36}" text-anchor="middle" style="font:700 ${R}px ${theme.sans}" fill="${theme.ink}">${esc(p.name.charAt(0))}</text>`
  return `<g class="lb-pt" data-i="${i}" tabindex="0" role="img" aria-label="${esc(`${p.name}: ${p.tip[0]} ${p.tip[1]}. ${p.tip[2]}`)}" transform="translate(${p.px},${p.py})" style="cursor:default;outline:none" opacity="${p.faint ? 0.6 : 1}">
    <circle r="${R + 9}" fill="transparent"/>
    <circle r="${R + 2}" fill="${theme.surface}"/>
    ${inner}
    <circle class="lb-ring" r="${R - 0.5}" fill="none" stroke="${p.lead ? theme.ink : theme.ring}" stroke-width="${p.lead ? 2 : 1.5}"/>
  </g>`
}

// Whisker along one axis, clipped to the domain with an arrowhead where it continues.
function whisker(p, from, to, cutFrom, cutTo, horizontal, theme) {
  const seg = (a, b) => horizontal ? `x1="${a}" x2="${b}" y1="${p.py}" y2="${p.py}"` : `x1="${p.px}" x2="${p.px}" y1="${a}" y2="${b}"`
  const end = (v, cut, dir) => horizontal
    ? cut ? `<path d="M${v - 6 * dir} ${p.py - 5}L${v} ${p.py}L${v - 6 * dir} ${p.py + 5}" fill="none"/>` : `<line x1="${v}" x2="${v}" y1="${p.py - 5}" y2="${p.py + 5}"/>`
    : cut ? `<path d="M${p.px - 5} ${v + 6 * dir}L${p.px} ${v}L${p.px + 5} ${v + 6 * dir}" fill="none"/>` : `<line x1="${p.px - 5}" x2="${p.px + 5}" y1="${v}" y2="${v}"/>`
  return `<g opacity="${p.faint ? 0.45 : 0.7}" stroke="${theme.secondary}" stroke-width="2" stroke-linecap="round"><line ${seg(from, to)}/>${end(from, cutFrom, -1)}${end(to, cutTo, 1)}</g>`
}

function scatter(model, theme, W, id) {
  const H = Math.min(520, Math.max(400, W * 0.46))
  const m = { t: 22, r: 20, b: 34, l: 64 }
  const pw = W - m.l - m.r, ph = H - m.t - m.b, R = 16
  const sx = model.x.log
    ? v => m.l + (Math.log(v) - Math.log(model.x.d0)) / (Math.log(model.x.d1) - Math.log(model.x.d0)) * pw
    : v => m.l + (v - model.x.d0) / (model.x.d1 - model.x.d0) * pw
  const sy = v => m.t + (1 - (v - model.y.d0) / (model.y.d1 - model.y.d0)) * ph
  const clampY = v => Math.min(model.y.d1, Math.max(model.y.d0, v))
  const yTicks = linearTicks(model.y.d0, model.y.d1, model.y.percent ? 25 : niceStep(model.y.d1 - model.y.d0, 5))
  const xTicks = model.x.log ? logTicks(model.x.d0, model.x.d1) : [0, 25, 50, 75, 100]
  const tickFont = `400 13px ${theme.mono}`
  const yFmt = v => model.y.percent ? `${v}%` : fmt(v)
  const xFmt = v => model.x.percent ? `${v}%` : fmt(v)

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(model.title)}" style="display:block;overflow:visible;font-family:${theme.sans}">
    <defs><clipPath id="${id}-c" clipPathUnits="userSpaceOnUse"><circle r="${R - 1}"/></clipPath></defs>`
  for (const v of yTicks) svg += `<line x1="${m.l}" x2="${m.l + pw}" y1="${sy(v)}" y2="${sy(v)}" stroke="${theme.grid}" stroke-width="1"/><text x="${m.l - 10}" y="${sy(v) + 4}" text-anchor="end" style="font:${tickFont};font-variant-numeric:tabular-nums" fill="${theme.muted}">${yFmt(v)}</text>`
  for (const v of xTicks) svg += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${m.t + ph}" stroke="${theme.grid}" stroke-width="1"/><text x="${sx(v)}" y="${m.t + ph + 22}" text-anchor="middle" style="font:${tickFont};font-variant-numeric:tabular-nums" fill="${theme.muted}">${xFmt(v)}</text>`
  svg += `<line x1="${m.l}" x2="${m.l + pw}" y1="${m.t + ph}" y2="${m.t + ph}" stroke="${theme.axis}" stroke-width="1"/>`
  if (model.diagonal) svg += `<line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(100)}" y2="${sy(100)}" stroke="${theme.secondary}" stroke-width="2" stroke-dasharray="5 6" opacity=".55"/>`

  const pts = model.points.map(p => ({ ...p, px: sx(p.x), py: sy(p.y) }))
  for (const p of pts) svg += whisker(p, sy(clampY(p.lo)), sy(clampY(p.hi)), p.lo < model.y.d0, p.hi > model.y.d1, false, theme)

  // Labels: try nearby slots first, then farther ones with a leader line; never collide.
  const size = 17
  const bounds = { x: 4, y: 0, w: W - 8, h: m.t + ph }
  const markers = pts.map(p => ({ x: p.px - R - 3, y: p.py - R - 3, w: 2 * R + 6, h: 2 * R + 6 }))
  const taken = []
  const near = R + 8, far = R + 40
  const slots = [[near, 0, 'start'], [-near, 0, 'end'], [R + 2, -(R + 8), 'start'], [R + 2, R + 8, 'start'], [-(R + 2), -(R + 8), 'end'], [-(R + 2), R + 8, 'end'],
    [far, -size * 1.6, 'start'], [far, size * 1.6, 'start'], [-far, -size * 1.6, 'end'], [-far, size * 1.6, 'end'], [far + 20, 0, 'start'], [-(far + 20), 0, 'end'],
    [far, -size * 3, 'start'], [far, size * 3, 'start'], [-far, -size * 3, 'end'], [-far, size * 3, 'end']]
  const order = [...pts.keys()].sort((a, b) => (pts[b].lead - pts[a].lead) || (pts[a].faint - pts[b].faint))
  const labels = []
  for (const i of order) {
    const p = pts[i], font = `${p.lead ? 700 : 500} ${size}px ${theme.sans}`, w = textWidth(p.label, font), h = size * 1.15
    let best = null
    for (const [dx, dy, anchor] of slots) {
      const box = { x: anchor === 'start' ? p.px + dx : p.px + dx - w, y: p.py + dy - h / 2, w, h }
      let cost = taken.reduce((n, b) => n + overlap(box, b), 0) + markers.reduce((n, b, j) => n + (j === i ? 0 : overlap(box, b)), 0)
      const inside = box.x >= bounds.x && box.x + w <= bounds.x + bounds.w && box.y >= bounds.y && box.y + h <= bounds.y + bounds.h
      if (!inside) cost += 1e6
      if (!best || cost < best.cost) best = { box, dx, dy, anchor, cost }
      if (cost === 0) break
    }
    taken.push(best.box)
    labels.push({ p, font, ...best })
  }
  for (const l of labels) {
    if (Math.abs(l.dx) > near + 1 || Math.abs(l.dy) > R + 9) {
      const tx = Math.min(Math.max(l.p.px, l.box.x), l.box.x + l.box.w), ty = Math.min(Math.max(l.p.py, l.box.y), l.box.y + l.box.h)
      const ang = Math.atan2(ty - l.p.py, tx - l.p.px)
      svg += `<line x1="${l.p.px + Math.cos(ang) * (R + 2)}" y1="${l.p.py + Math.sin(ang) * (R + 2)}" x2="${tx - Math.cos(ang) * 3}" y2="${ty - Math.sin(ang) * 3}" stroke="${theme.muted}" stroke-width="1"/>`
    }
  }
  // Markers after whiskers and leader lines, labels on top.
  pts.forEach((p, i) => { svg += marker(p, i, R, id, theme) })
  for (const l of labels) {
    const x = l.anchor === 'start' ? l.box.x : l.box.x + l.box.w
    svg += `<text x="${x}" y="${l.box.y + l.box.h * 0.8}" text-anchor="${l.anchor}" style="font:${l.font};letter-spacing:-.01em" fill="${l.p.lead ? theme.ink : theme.secondary}" opacity="${l.p.faint ? 0.75 : 1}" pointer-events="none">${esc(l.p.label)}</text>`
  }
  return { svg: svg + '</svg>', pts, R }
}

function rows(model, theme, W, id) {
  const R = 12, rowH = 48, labelW = Math.min(150, W * 0.42)
  const m = { t: 6, r: 14, b: 30, l: labelW + R + 8 }
  const n = model.points.length, pw = W - m.l - m.r, H = m.t + n * rowH + m.b
  const d0 = model.y.d0, d1 = model.y.d1
  const sx = v => m.l + (Math.min(d1, Math.max(d0, v)) - d0) / (d1 - d0) * pw
  const ticks = linearTicks(d0, d1, model.y.percent ? 25 : niceStep(d1 - d0, 3))
  const tickFont = `400 11px ${theme.mono}`
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(model.title)}" style="display:block;overflow:visible;font-family:${theme.sans}">
    <defs><clipPath id="${id}-c" clipPathUnits="userSpaceOnUse"><circle r="${R - 1}"/></clipPath></defs>`
  for (const v of ticks) svg += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}" stroke="${theme.grid}" stroke-width="1"/><text x="${sx(v)}" y="${H - m.b + 18}" text-anchor="middle" style="font:${tickFont};font-variant-numeric:tabular-nums" fill="${theme.muted}">${model.y.percent ? `${v}%` : fmt(v)}</text>`
  const pts = model.points.map((p, i) => ({ ...p, px: sx(p.y), py: m.t + rowH * (i + 0.5) }))
  pts.forEach((p, i) => {
    if (i) svg += `<line x1="0" x2="${W}" y1="${p.py - rowH / 2}" y2="${p.py - rowH / 2}" stroke="${theme.grid}" stroke-width="1"/>`
    const sub = model.x.log ? `n = ${fmt(p.x)}` : `progress ${Math.round(p.x)}%`
    svg += `<text x="0" y="${p.py - 2}" style="font:${p.lead ? 700 : 500} 14px ${theme.sans};letter-spacing:-.01em" fill="${p.lead ? theme.ink : theme.secondary}">${esc(p.name)}</text>
      <text x="0" y="${p.py + 13}" style="font:400 10px ${theme.mono}" fill="${theme.muted}">${esc(sub)}</text>`
    svg += whisker(p, sx(p.lo), sx(p.hi), p.lo < d0, p.hi > d1, true, theme)
  })
  pts.forEach((p, i) => { svg += marker(p, i, R, id, theme) })
  return { svg: svg + '</svg>', pts, R }
}

function bindTips(plot, pts, R, theme) {
  const tip = plot.querySelector('.lb-tip'), W = plot.clientWidth
  const show = el => {
    const p = pts[Number(el.dataset.i)]
    tip.replaceChildren()
    const value = document.createElement('strong'); value.textContent = p.tip[0]; value.style.cssText = `display:block;font-family:${theme.sans};font-size:20px;letter-spacing:-.02em`
    const unit = document.createElement('span'); unit.textContent = ` ${p.tip[1]}`; unit.style.cssText = 'font-size:11px;font-weight:400;opacity:.75'
    value.append(unit)
    const name = document.createElement('span'); name.textContent = p.lab ? `${p.name} · ${p.lab.name}` : p.name; name.style.cssText = 'display:block;font-weight:600;margin-top:2px'
    const detail = document.createElement('span'); detail.textContent = p.tip[2]; detail.style.cssText = 'display:block;opacity:.8;margin-top:4px'
    tip.append(value, name, detail)
    tip.style.display = 'block'
    const right = p.px + R + 10, left = p.px - R - 10 - tip.offsetWidth
    tip.style.left = `${right + tip.offsetWidth <= W ? right : Math.max(0, left)}px`
    tip.style.top = `${Math.max(0, p.py - tip.offsetHeight - R - 6)}px`
    el.querySelector('.lb-ring').setAttribute('stroke-width', '3')
  }
  const hide = el => { tip.style.display = 'none'; el.querySelector('.lb-ring').setAttribute('stroke-width', pts[Number(el.dataset.i)].lead ? '2' : '1.5') }
  plot.querySelectorAll('.lb-pt').forEach(el => {
    el.addEventListener('pointerenter', () => show(el)); el.addEventListener('pointerleave', () => hide(el))
    el.addEventListener('focus', () => show(el)); el.addEventListener('blur', () => hide(el))
  })
}
