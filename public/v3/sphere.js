// A rotating globe of dots on a 2D canvas: every evaluation is one dot, clustered by scene.
// No dependencies. Orthographic projection, drag to rotate, +/- or pinch to zoom, hover for details.

const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const TAU = Math.PI * 2

function hash(text) { let h = 2166136261; for (const c of String(text)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

function basis(c) {
  // Two unit vectors tangent to the sphere at c.
  const up = Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = normalize(cross(up, c)), v = cross(c, u)
  return [u, v]
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const normalize = a => { const n = Math.hypot(...a) || 1; return [a[0] / n, a[1] / n, a[2] / n] }
const offset = (c, r, theta) => {
  const [u, v] = basis(c), cr = Math.cos(r), sr = Math.sin(r), ct = Math.cos(theta), st = Math.sin(theta)
  return [cr * c[0] + sr * (ct * u[0] + st * v[0]), cr * c[1] + sr * (ct * u[1] + st * v[1]), cr * c[2] + sr * (ct * u[2] + st * v[2])]
}

// groups: [{ id, family, label, items: [...] }]. Families (robot bodies) get their own region of the globe;
// clusters inside a family spiral out from its centre, bigger clusters first; dots scatter around each cluster centre.
export function layout(groups) {
  const families = [...new Set(groups.map(g => g.family))]
  const centres = new Map(families.map((f, i) => {
    const az = (i / families.length) * TAU + 0.6, lat = (i % 2 ? -1 : 1) * 0.22
    return [f, normalize([Math.cos(lat) * Math.cos(az), Math.sin(lat), Math.cos(lat) * Math.sin(az)])]
  }))
  const cap = families.length > 1 ? Math.min(1.05, Math.PI / families.length * 0.9) : 1.4
  const points = [], clusters = []
  for (const family of families) {
    const own = groups.filter(g => g.family === family).sort((a, b) => b.items.length - a.items.length)
    const c = centres.get(family)
    own.forEach((g, i) => {
      const r = own.length === 1 ? 0 : cap * Math.sqrt((i + 0.5) / own.length), theta = i * GOLDEN
      const centre = offset(c, r, theta)
      const random = rng(hash(g.id))
      const spread = Math.min(0.1, 0.028 + 0.0035 * Math.sqrt(g.items.length))
      const cluster = { id: g.id, family, label: g.label, count: g.items.length, centre, points: [] }
      for (const item of g.items) {
        const rr = Math.min(spread * 2.2, spread * Math.sqrt(-2 * Math.log(Math.max(1e-6, random()))) * 0.7)
        const p = { v: offset(centre, rr, random() * TAU), item, cluster }
        points.push(p); cluster.points.push(p)
      }
      clusters.push(cluster)
    })
  }
  return { points, clusters, families: [...centres].map(([family, centre]) => ({ family, centre, count: points.filter(p => p.cluster.family === family).length })) }
}

export function createGlobe(canvas, options = {}) {
  const ctx = canvas.getContext('2d')
  const state = {
    yaw: 0.4, pitch: -0.25, zoom: 1, vx: 0, vy: 0, dragging: false, last: null, pointers: new Map(), pinch: 0,
    points: [], clusters: [], labels: [], hover: null, frame: 0, needs: true, idle: 0,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
  const opt = { color: () => '#888', faint: '#999', line: 'rgba(0,0,0,.08)', ink: '#111', halo: '#fff', labelCount: 7, onHover: null, onClick: null, ...options }

  function size() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1)
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height))
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { w, h }
  }

  function rotate(v) {
    const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch)
    const x = v[0] * cy + v[2] * sy, z0 = -v[0] * sy + v[2] * cy
    const y = v[1] * cp - z0 * sp, z = v[1] * sp + z0 * cp
    return [x, y, z]
  }

  function draw() {
    state.needs = false
    const { w, h } = size()
    const R = Math.min(w, h) * 0.47 * state.zoom, cx = w / 2, cy = h / 2
    ctx.clearRect(0, 0, w, h)
    // Limb and graticule.
    ctx.lineWidth = 1
    ctx.strokeStyle = opt.line
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke()
    const arc = pts => {
      ctx.beginPath(); let pen = false
      for (const p of pts) { const q = rotate(p); if (q[2] < -0.02) { pen = false; continue } const sx = cx + q[0] * R, sy = cy - q[1] * R; pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true }
      ctx.stroke()
    }
    for (let lat = -60; lat <= 60; lat += 30) { const pts = []; const cl = Math.cos(lat * Math.PI / 180), sl = Math.sin(lat * Math.PI / 180); for (let a = 0; a <= 72; a++) { const t = a / 72 * TAU; pts.push([cl * Math.cos(t), sl, cl * Math.sin(t)]) } arc(pts) }
    for (let lon = 0; lon < 180; lon += 30) { const pts = []; const t = lon * Math.PI / 180; for (let a = 0; a <= 72; a++) { const b = a / 72 * TAU; pts.push([Math.cos(b) * Math.cos(t), Math.sin(b), Math.cos(b) * Math.sin(t)]) } arc(pts) }
    // Dots: back side first, faint; then front.
    const projected = state.points.map(p => { const q = rotate(p.v); return { p, x: cx + q[0] * R, y: cy - q[1] * R, z: q[2] } })
    projected.sort((a, b) => a.z - b.z)
    const r = Math.max(1.6, Math.min(3.2, R / 190))
    for (const d of projected) {
      if (d.z < 0) { ctx.globalAlpha = 0.14 + 0.1 * (1 + d.z); ctx.fillStyle = opt.faint; ctx.beginPath(); ctx.arc(d.x, d.y, r * 0.8, 0, TAU); ctx.fill(); continue }
      ctx.globalAlpha = 0.55 + 0.45 * d.z
      ctx.fillStyle = opt.color(d.p.item, d.p.cluster)
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, TAU); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (state.hover) {
      const d = projected.find(x => x.p === state.hover)
      if (d && d.z >= 0) { ctx.strokeStyle = opt.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x, d.y, r + 3, 0, TAU); ctx.stroke() }
    }
    // Labels for the largest clusters that face the viewer.
    ctx.font = `500 ${Math.round(Math.max(11, Math.min(14, R / 32)))}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'
    const placed = []
    for (const c of state.labels) {
      const q = rotate(c.centre); if (q[2] < 0.25) continue
      const x = cx + q[0] * R, y = cy - q[1] * R, wdt = ctx.measureText(c.label).width
      if (placed.some(b => Math.abs(b.x - x) < (b.w + wdt) / 2 + 10 && Math.abs(b.y - y) < 18)) continue
      placed.push({ x, y, w: wdt })
      ctx.globalAlpha = Math.min(1, (q[2] - 0.25) * 2.5)
      ctx.lineWidth = 4; ctx.strokeStyle = opt.halo; ctx.strokeText(c.label, x, y)
      ctx.fillStyle = opt.ink; ctx.fillText(c.label, x, y)
    }
    ctx.globalAlpha = 1
    state.projected = projected
  }

  function tick() {
    state.frame = 0
    if (state.dragging) { draw(); schedule(); return }
    let moving = false
    if (Math.abs(state.vx) > 1e-4 || Math.abs(state.vy) > 1e-4) {
      state.yaw += state.vx; state.pitch = clampPitch(state.pitch + state.vy); state.vx *= 0.92; state.vy *= 0.92; moving = true
    } else if (!state.reduced && !state.hover && document.visibilityState === 'visible' && isVisible()) {
      state.yaw += 0.0012; moving = true
    }
    if (moving || state.needs) draw()
    if (moving) schedule()
  }
  const schedule = () => { if (!state.frame) state.frame = requestAnimationFrame(tick) }
  const clampPitch = v => Math.max(-1.2, Math.min(1.2, v))
  let visible = true
  const isVisible = () => visible
  const io = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); if (visible) schedule() }, { threshold: 0.05 })
  io.observe(canvas)

  function nearest(x, y) {
    let best = null, bd = 10 * 10
    for (const d of state.projected || []) { if (d.z < 0) continue; const dd = (d.x - x) ** 2 + (d.y - y) ** 2; if (dd < bd) { bd = dd; best = d } }
    return best
  }
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); state.pointers.set(e.pointerId, local(e))
    if (state.pointers.size === 1) { state.dragging = true; state.last = local(e); state.moved = 0; state.vx = state.vy = 0 }
    else if (state.pointers.size === 2) { const [a, b] = [...state.pointers.values()]; state.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) }
    schedule()
  })
  canvas.addEventListener('pointermove', e => {
    const pt = local(e)
    if (state.pointers.has(e.pointerId)) state.pointers.set(e.pointerId, pt)
    if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1])
      if (state.pinch) setZoom(state.zoom * d / state.pinch); state.pinch = d; return
    }
    if (state.dragging && state.last) {
      const { w, h } = size(), R = Math.min(w, h) * 0.47 * state.zoom
      const dx = (pt[0] - state.last[0]) / R, dy = (pt[1] - state.last[1]) / R
      state.moved += Math.abs(dx) + Math.abs(dy)
      state.yaw += dx; state.pitch = clampPitch(state.pitch - dy); state.vx = dx * 0.6; state.vy = -dy * 0.6; state.last = pt
      schedule(); return
    }
    const hit = nearest(pt[0], pt[1])
    const p = hit ? hit.p : null
    if (p !== state.hover) { state.hover = p; canvas.style.cursor = p ? 'pointer' : 'grab'; opt.onHover?.(p ? p.item : null, p ? p.cluster : null, hit ? [hit.x, hit.y] : null); state.needs = true; schedule() }
  })
  const end = e => {
    state.pointers.delete(e.pointerId)
    if (state.pointers.size < 2) state.pinch = 0
    if (state.pointers.size === 0) {
      state.dragging = false
      if (state.moved < 0.02 && e.type === 'pointerup') { const pt = local(e); const hit = nearest(pt[0], pt[1]); if (hit) opt.onClick?.(hit.p.item, hit.p.cluster) }
      state.last = null; schedule()
    }
  }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end)
  canvas.addEventListener('pointerleave', () => { if (state.hover) { state.hover = null; opt.onHover?.(null); state.needs = true; schedule() } })
  canvas.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 0.9)) }, { passive: false })
  new ResizeObserver(() => { state.needs = true; schedule() }).observe(canvas)
  document.addEventListener('visibilitychange', schedule)

  function lookAt(v) {
    state.yaw = -Math.atan2(v[0], v[2]); state.pitch = clampPitch(Math.atan2(v[1], Math.hypot(v[0], v[2]))); state.vx = state.vy = 0; state.needs = true; schedule()
  }
  function setZoom(z) { state.zoom = Math.max(1, Math.min(3.2, z)); state.needs = true; schedule() }
  function setData({ points, clusters }) {
    state.points = points; state.clusters = clusters
    state.labels = [...clusters].sort((a, b) => b.count - a.count).slice(0, opt.labelCount)
    state.needs = true; schedule()
  }
  canvas.style.cursor = 'grab'; canvas.style.touchAction = 'none'
  return { setData, setZoom, lookAt, zoomIn: () => setZoom(state.zoom * 1.25), zoomOut: () => setZoom(state.zoom / 1.25), redraw: () => { state.needs = true; schedule() }, setOptions: o => { Object.assign(opt, o); state.needs = true; schedule() } }
}
