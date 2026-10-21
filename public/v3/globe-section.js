// "Every evaluation": one dot per scored evaluation on a rotating globe, clustered by scene, coloured four ways.
import { ROBOTS, store, loadReviews, hasData, fmt, esc, appLink, sentence } from '../landing/live.js'
import { createGlobe, layout } from './sphere.js'
import { prettyScene } from './board.js'

const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
const taskName = t => { const s = String(t?.task?.instruction || t?.task_id || '').replace(/^\w+-/, '').replace(/-v\d+$/, '').replace(/[_-]+/g, ' ').trim(); return s ? s[0].toUpperCase() + s.slice(1) : 'Task' }
const SITE = v => { const t = String(v || '').trim().toLowerCase(); if (!t) return 'Site not recorded'; if (t.startsWith('frodobots')) return 'FrodoBots'; if (t === 'nus') return 'NUS'; if (t.startsWith('droid')) return 'DROID rig'; return String(v).trim() }
const OUTCOME = { A: 'Policy A preferred', B: 'Policy B preferred', tie: 'Tie', success: 'Full success', partial: 'Partial progress', fail: 'No progress' }
const SLOT = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8']

export function globeSection(root) {
  let items = [], set = 'all', mode = 'bodies', highlight = null, globe = null, built = false, faced = false
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

  root.innerHTML = `<div class="sph">
    <div class="switch sph-set" role="group" aria-label="Which evaluations"></div>
    <div class="sph-total"><b class="skel">0,000</b><span>evaluations so far, each one a dot. Near dots share a room.</span></div>
    <div class="sph-modes-label"><div class="sph-modes" id="sph-modes"><p class="label">Colour by</p></div></div>
    <div class="sph-leg" id="sph-leg"></div>
    <div class="sph-stage"><canvas class="sph-canvas" role="img" aria-label="Globe of evaluations" tabindex="0"></canvas><div class="sph-load" id="sph-load">Loading every evaluation…</div>
      <div class="sph-hint">${matchMedia('(pointer: coarse)').matches ? 'Drag to turn it, tap a dot' : 'Drag to turn it, click a dot to open the viewer'}</div>
      <div class="sph-zoom"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div>
      <div class="sph-tip" id="sph-tip" hidden></div></div>
  </div>`
  const canvas = root.querySelector('canvas'), tip = root.querySelector('#sph-tip'), legend = root.querySelector('#sph-leg'), modes = root.querySelector('#sph-modes'), setEl = root.querySelector('.sph-set'), total = root.querySelector('.sph-total b')
  const [zin, zout] = root.querySelectorAll('.sph-zoom button')
  zin.addEventListener('click', () => globe?.zoomIn()); zout.addEventListener('click', () => globe?.zoomOut())

  // Categories per colour mode.
  function categories() {
    const count = fn => { const m = new Map(); for (const it of visible()) { const k = fn(it); m.set(k, (m.get(k) || 0) + 1) } return m }
    if (mode === 'bodies') return ROBOTS.filter(r => count(it => it.robot).has(r.id)).map((r, i) => ({ id: r.id, name: r.name, color: SLOT[i], test: it => it.robot === r.id }))
    if (mode === 'sites') { const sites = [...count(it => it.site).entries()].sort((a, b) => b[1] - a[1]); return sites.map(([name], i) => ({ id: name, name, color: i < 7 ? SLOT[i] : '--none', test: it => it.site === name })) }
    if (mode === 'tracks') return [{ id: 'open', name: 'Open track · blind A/B', color: '--open', test: it => it.kind === 'open' }, { id: 'fine', name: 'Fine-tuning · scored trials', color: '--fine', test: it => it.kind === 'fine' }].filter(c => visible().some(c.test))
    if (mode === 'outcomes') return [['A', SLOT[0]], ['B', SLOT[1]], ['tie', '--none'], ['success', SLOT[2]], ['partial', SLOT[3]], ['fail', SLOT[7]]].map(([id, color]) => ({ id, name: OUTCOME[id], color, test: it => it.outcome === id })).filter(c => visible().some(c.test))
    const scenes = [...count(it => it.scene).entries()].sort((a, b) => b[1] - a[1])
    const top = scenes.slice(0, 7).map(([s], i) => ({ id: s, name: s, color: SLOT[i], test: it => it.scene === s }))
    if (scenes.length > 7) top.push({ id: '__other', name: `${scenes.length - 7} more rooms`, color: '--none', test: it => !scenes.slice(0, 7).some(([s]) => s === it.scene) })
    return top
  }
  const visible = () => set === 'all' ? items : items.filter(it => it.kind === set)
  const counts = { bodies: () => new Set(items.map(i => i.robot)).size, scenes: () => new Set(items.map(i => i.scene)).size, sites: () => new Set(items.map(i => i.site)).size, tracks: () => new Set(items.map(i => i.kind)).size, outcomes: () => new Set(items.map(i => i.outcome)).size }

  function renderControls() {
    const n = { all: items.length, open: items.filter(i => i.kind === 'open').length, fine: items.filter(i => i.kind === 'fine').length }
    setEl.innerHTML = [['all', 'All'], ['open', 'Open track'], ['fine', 'Fine-tuning']].map(([id, name]) => `<button class="${id === set ? 'on' : ''}" data-set="${id}" aria-pressed="${id === set}">${name}<small>${fmt(n[id])}</small></button>`).join('')
    total.classList.remove('skel'); total.textContent = fmt(visible().length)
    const cats = categories(), vis = visible()
    modes.innerHTML = `<p class="label">Colour by</p>` + [['bodies', 'bodies'], ['scenes', 'rooms'], ['sites', 'sites'], ['outcomes', 'outcomes']].map(([id, name]) => {
      const save = mode; mode = id; const cs = categories(); mode = save
      return `<button class="sph-mode" data-mode="${id}" aria-pressed="${id === mode}"><b>${counts[id]()}</b><span>${name}</span><i>${cs.map(c => `<em style="width:${vis.filter(c.test).length / Math.max(1, vis.length) * 100}%;background:var(${c.color})"></em>`).join('')}</i></button>`
    }).join('')
    legend.innerHTML = cats.map(c => { const k = vis.filter(c.test).length; return `<button type="button" data-cat="${esc(c.id)}" class="${highlight === c.id ? 'on' : ''}"><span class="sw" style="background:var(${c.color})"></span><span class="nm">${esc(c.name)}</span><span class="ct">${fmt(k)}</span><span class="bar"><i style="--w:${k / Math.max(1, vis.length) * 100}%;--c:var(${c.color})"></i></span></button>` }).join('')
  }
  function colorFn() {
    const cats = categories().map(c => ({ ...c, hex: css(c.color) || '#888' })), none = css('--none')
    return it => { const c = cats.find(c => c.test(it)); if (!c) return none; if (highlight && c.id !== highlight) return css('--none'); return c.hex }
  }
  function rebuild() {
    const vis = visible(), groups = new Map()
    for (const it of vis) { const key = `${it.robot}|${it.kind}|${it.scene}`; if (!groups.has(key)) groups.set(key, { id: key, family: it.robot, label: it.scene, items: [] }); groups.get(key).items.push(it) }
    const data = layout([...groups.values()])
    globe.setData(data)
    globe.setOptions({ color: colorFn() })
    if (!faced && data.families.length) {
      // Face the two busiest bodies, tilted a little toward the viewer.
      const top = [...data.families].sort((a, b) => b.count - a.count).slice(0, 2)
      const v = top.reduce((acc, f) => acc.map((x, i) => x + f.centre[i] * f.count), [0, 0, 0])
      const n = Math.hypot(...v) || 1
      globe.lookAt(n > 1e-6 ? [v[0] / n, v[1] / n - 0.25, v[2] / n] : top[0].centre); faced = true
    }
  }
  function ensureGlobe() {
    if (globe) return
    globe = createGlobe(canvas, {
      color: () => '#888', faint: css('--none'), line: css('--line'), ink: css('--ink-2'), halo: css('--surface'),
      onHover(it, cluster, xy) {
        if (!it) { tip.hidden = true; return }
        tip.hidden = false
        tip.innerHTML = `<b>${esc(sentence(it.instruction) || cluster.label)}</b><small>${esc(robotName(it.robot))} · ${esc(it.scene)} · ${esc(it.site)} · ${esc(OUTCOME[it.outcome] || it.outcome)}${it.kind === 'fine' ? ' · fine-tuning' : ''}</small>`
        const stage = canvas.parentElement.getBoundingClientRect(), w = 260
        tip.style.left = Math.min(stage.width - w - 4, Math.max(4, xy[0] + 14)) + 'px'; tip.style.top = Math.max(4, xy[1] - 10 - tip.offsetHeight) + 'px'
      },
      onClick(it) { location.href = appLink('/evals', { robot: it.robot, track: it.kind === 'fine' ? 'fine-tuning' : 'open' }) },
    })
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('button[data-set],button[data-mode],button[data-cat]'); if (!b) return
    if (b.dataset.set) { set = b.dataset.set; highlight = null; renderControls(); rebuild() }
    else if (b.dataset.mode) { mode = b.dataset.mode; highlight = null; renderControls(); globe.setOptions({ color: colorFn() }) }
    else { highlight = highlight === b.dataset.cat ? null : b.dataset.cat; renderControls(); globe.setOptions({ color: colorFn() }) }
  })

  // Data: the open-track list (lazy, large) plus the fine-tuning trials of every body with results.
  function build() {
    if (!store.evaluations) return false
    const robots = ROBOTS.filter(r => hasData(r.id))
    if (robots.some(r => !Array.isArray(store.reviews[r.id]))) return false
    const seen = new Set()
    items = store.evaluations.map(e => ({ kind: 'open', id: e.id, robot: e.robotId, scene: prettyScene(e.scene) || 'Unlabelled scene', site: SITE(e.institution), instruction: e.instruction || e.task || '', outcome: e.winner === 'tie' ? 'tie' : e.winner }))
    for (const r of robots) for (const t of store.reviews[r.id]) {
      if (seen.has(t.id)) continue; seen.add(t.id)
      items.push({ kind: 'fine', id: t.id, robot: t.robot_id, scene: taskName(t), site: SITE(t.institution), instruction: t.task?.instruction && /\s/.test(t.task.instruction) ? t.task.instruction : taskName(t), outcome: t.success ? 'success' : Number(t.partial_success) > 0 ? 'partial' : 'fail' })
    }
    root.querySelector('#sph-load').remove()
    ensureGlobe(); renderControls(); rebuild(); built = true
    return true
  }
  const tryBuild = () => { if (!built) build() }
  const near = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting)) return; near.disconnect(); ROBOTS.forEach(r => { if (hasData(r.id)) loadReviews(r.id, tryBuild) }); tryBuild() }, { rootMargin: '900px 0px' })
  const start = () => { if (store.ready) near.observe(root); else setTimeout(start, 200) }
  start()
  return { refresh: tryBuild }
}

const ICON_HAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-7.5a1.5 1.5 0 0 1 3 0V12m0-6a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3L3.6 14a1.5 1.5 0 0 1 2.5-1.6L8 14"/></svg>'
