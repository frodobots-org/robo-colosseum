// Hero: the drifting wall of real recordings, the live request line, and the instruction search.
import { API, ROBOTS, store, rankedOpen, fineRows, labelRows, fmt, esc, appLink, sentence } from '../landing/live.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
export const prettyScene = s => { const t = String(s || '').replace(/\s+/g, ' ').trim().replace(/\.+$/, ''); return t ? t[0].toUpperCase() + t.slice(1) : '' }

// ---------- wall ----------
const videoUrls = new Map()
function clipFor(id) {
  if (!videoUrls.has(id)) videoUrls.set(id, fetch(`${API}/evaluations/${id}/videos`, { headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
    .then(d => { const cams = d.videos?.a || d.videos?.b || {}; return cams.left_image || cams.right_image || cams.top_image || cams.head_image || Object.values(cams)[0] || '' })
    .catch(() => ''))
  return videoUrls.get(id)
}

export function heroWall(wall, tiles) {
  if (!tiles.length) return
  const phone = innerWidth < 761
  const gap = phone ? 10 : 12
  const W = wall.offsetWidth || innerWidth * 1.16, H = wall.offsetHeight || innerHeight * 1.48
  let tw = Math.round(Math.min(320, Math.max(130, innerWidth * (phone ? 0.3 : 0.13))))
  let cols, rows
  const calc = () => { cols = Math.max(3, Math.ceil(W / (tw + gap)) + 1); rows = Math.ceil(H / (tw * 0.75 + gap)) + 1 }
  calc()
  while (cols * rows > 1.5 * tiles.length && tw < 320) { tw = Math.round(tw * 1.08); calc() }
  wall.style.setProperty('--tw', tw + 'px'); wall.style.setProperty('--wg', gap + 'px')

  // Deal tiles: never the same tile twice in a column, spread scenes, use every tile before repeating.
  const used = new Map(tiles.map(t => [t.id, 0]))
  const grid = []
  for (let c = 0; c < cols; c++) {
    const col = []
    for (let r = 0; r < rows; r++) {
      let best = null, bestCost = Infinity
      for (const t of tiles) {
        let cost = used.get(t.id) * 120 + Math.random() * 30
        if (col.some(x => x.id === t.id)) cost += 1000
        if (col.some(x => x.scene === t.scene)) cost += 60
        const left = grid[c - 1]
        if (left && [r - 1, r, r + 1].some(i => left[i]?.id === t.id)) cost += 80
        if (left && left[r]?.scene === t.scene) cost += 30
        if (cost < bestCost) { bestCost = cost; best = t }
      }
      col.push(best); used.set(best.id, used.get(best.id) + 1)
    }
    grid.push(col)
  }
  const base = [92, 76, 100, 84, 108, 72, 96, 80]
  wall.innerHTML = grid.map((col, c) => {
    const html = col.map(t => `<a class="wt" href="${appLink('/evals', { robot: t.robot, track: 'open' })}" tabindex="-1" data-id="${t.id}" data-robot="${t.robot}"><img src="./wall/${t.id}.webp" alt="" width="${t.w}" height="${t.h}" loading="${c < 4 ? 'eager' : 'lazy'}" decoding="async"><span class="tag">${esc(robotName(t.robot).toUpperCase())} · ${esc(prettyScene(t.scene).toUpperCase())}</span><span class="ttl">${esc(sentence(t.instruction))}</span></a>`).join('')
    return `<div class="wall-col${c % 2 ? ' down' : ''}" style="--dur:${base[c % base.length]}s;--delay:-${Math.round(Math.random() * 60)}s">${html}${html}</div>`
  }).join('')

  // Every column drifts at about 9 px/s regardless of its height.
  requestAnimationFrame(() => {
    wall.querySelectorAll('.wall-col').forEach((col, c) => {
      const half = col.scrollHeight / 2
      if (half > 0) col.style.setProperty('--dur', Math.round((half / 9) * base[c % base.length] / 84) + 's')
    })
  })

  const hero = wall.closest('.hero-wall')
  new IntersectionObserver(es => es.forEach(e => wall.classList.toggle('paused', !e.isIntersecting)), { threshold: 0 }).observe(hero)

  // Clips: only on precise-pointer desktops without reduced motion; only tiles in the open right side of the viewport.
  if (phone || reduced || !fine || navigator.connection?.saveData) return
  const MAX = 6, inZone = new Set()
  let playing = new Set()
  const tileEls = [...wall.querySelectorAll('.wt')]
  const ensureVideo = el => {
    let v = el.querySelector('video')
    if (!v) { v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; el.insertBefore(v, el.querySelector('.tag')); v.addEventListener('playing', () => el.classList.add('playing')) }
    return v
  }
  function schedule() {
    const wanted = tileEls.filter(el => inZone.has(el)).slice(0, MAX)
    for (const el of playing) if (!wanted.includes(el)) { const v = el.querySelector('video'); if (v) v.pause(); el.classList.remove('playing'); playing.delete(el) }
    for (const el of wanted) {
      if (playing.has(el)) continue
      playing.add(el)
      const v = ensureVideo(el)
      if (v.src) { v.play().catch(() => {}); continue }
      clipFor(el.dataset.id).then(url => { if (!url || !playing.has(el)) return; v.src = url; v.play().catch(() => {}) })
    }
  }
  const zone = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target)); schedule() }, { rootMargin: '0px 0px 0px -46%', threshold: 0.35 })
  setTimeout(() => tileEls.forEach(el => zone.observe(el)), 1200)
  document.addEventListener('visibilitychange', () => { if (document.hidden) for (const el of playing) el.querySelector('video')?.pause(); else schedule() })
}

// ---------- the live request line ----------
export function heroRun(el, state, onChange) {
  const sel = { robot: state.robot || 'franka', track: state.track === 'fine' ? 'fine-tuning' : 'open' }
  el.innerHTML = `<div class="hr-bar"><span class="pr">$</span><span class="hr-cmd" id="hr-cmd"></span><span class="caret"></span><button class="hr-copy" id="hr-copy" aria-label="Copy the request">${ICON_COPY}</button></div>
    <div class="hr-out" id="hr-out"></div>
    <div class="hr-foot"><button class="ol-open" id="ol-open" aria-expanded="false">${ICON_SLIDERS} Change one argument</button><span class="hr-note" id="hr-note"></span></div>
    <div class="ol-args" id="ol-args"></div>`
  const cmd = el.querySelector('#hr-cmd'), out = el.querySelector('#hr-out'), args = el.querySelector('#ol-args'), note = el.querySelector('#hr-note')
  const path = () => `/api/leaderboard?robot=${sel.robot}&track=${sel.track}`
  const text = () => `curl ${location.host}${path()}`
  const html = () => `curl ${esc(location.host)}/api/leaderboard<span class="f">?robot=</span>${sel.robot}<span class="f">&amp;track=</span>${sel.track}`
  let typing = 0
  function type(full) {
    clearTimeout(typing)
    if (reduced) { cmd.innerHTML = html(); return }
    const plain = text(); let i = 0
    const step = () => { cmd.textContent = plain.slice(0, ++i); if (i < plain.length) typing = setTimeout(step, 18 + Math.random() * 26); else cmd.innerHTML = html() }
    typing = setTimeout(step, full ? 700 : 80)
  }
  function output() {
    const robot = ROBOTS.find(r => r.id === sel.robot)
    if (!store.ready) { out.innerHTML = `<span class="skel" style="grid-column:1/-1;min-width:24ch">&nbsp;</span>`; note.textContent = ''; return }
    const rows = sel.track === 'open'
      ? labelRows(rankedOpen(sel.robot), 'policy').slice(0, 3).map((r, i) => `<span class="rk">#${i + 1}</span><b>${esc(r.policy.split('@')[0])}</b><span>rating ${fmt(Math.round(r.score))} <i>±${Math.round(r.std || 0)}</i> · ${fmt(r.evals)} comparisons</span>`)
      : (() => { const byPolicy = new Map(); for (const r of fineRows(sel.robot)) { const p = byPolicy.get(r.policyId || r.policy) || { id: r.policyId || r.policy, t: 0, s: 0 }; p.t += r.trials; p.s += r.successes; byPolicy.set(p.id, p) }
          return [...byPolicy.values()].sort((a, b) => b.s / b.t - a.s / a.t).slice(0, 3).map((p, i) => `<span class="rk">#${i + 1}</span><b>${esc(p.id)}</b><span>${Math.round(p.s / p.t * 100)}% full success <i>${p.s}/${p.t} trials</i></span>`) })()
    out.innerHTML = rows.length ? rows.join('') : `<span style="grid-column:1/-1;color:var(--ink-3)">{ "board": [] } · no ${sel.track === 'open' ? 'open-track' : 'fine-tuning'} results on ${esc(robot.name)} yet</span>`
    note.textContent = rows.length ? `Live from the API, the same request this page makes.` : ''
  }
  function renderArgs() {
    const trackOk = t => store.ready ? (t === 'open' ? rankedOpen(sel.robot).length : fineRows(sel.robot).length) > 0 : true
    args.innerHTML = `<div class="grp"><span>robot</span>${ROBOTS.map(r => `<button class="chip${r.id === sel.robot ? ' on' : ''}" data-robot="${r.id}"${store.ready && !rankedOpen(r.id).length && !fineRows(r.id).length ? ' disabled title="No results yet"' : ''}>${esc(r.name)}</button>`).join('')}</div>
      <div class="grp"><span>track</span>${[['open', 'open'], ['fine-tuning', 'fine-tuning']].map(([t, l]) => `<button class="chip${t === sel.track ? ' on' : ''}" data-track="${t}"${trackOk(t) ? '' : ' disabled title="No results on this body yet"'}>${l}</button>`).join('')}</div>`
  }
  el.querySelector('#ol-open').addEventListener('click', e => { const open = args.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(open)) })
  args.addEventListener('click', e => {
    const b = e.target.closest('button[data-robot],button[data-track]'); if (!b || b.disabled) return
    if (b.dataset.robot) sel.robot = b.dataset.robot; else sel.track = b.dataset.track
    if (store.ready && sel.track === 'open' && !rankedOpen(sel.robot).length && fineRows(sel.robot).length) sel.track = 'fine-tuning'
    if (store.ready && sel.track === 'fine-tuning' && !fineRows(sel.robot).length && rankedOpen(sel.robot).length) sel.track = 'open'
    renderArgs(); type(false); output(); onChange?.({ robot: sel.robot, track: sel.track === 'open' ? 'open' : 'fine' })
  })
  el.querySelector('#hr-copy').addEventListener('click', e => {
    navigator.clipboard?.writeText(`curl ${location.origin}${path()}`).then(() => { e.currentTarget.classList.add('ok'); setTimeout(() => e.currentTarget.classList.remove('ok'), 1600) }).catch(() => {})
  })
  type(true); output(); renderArgs()
  return { refresh: output, args: renderArgs }
}

// ---------- search over task instructions ----------
let index = null
function buildIndex() {
  if (index || !store.evaluations) return index
  const byText = new Map()
  for (const e of store.evaluations) {
    const text = String(e.instruction || e.task || '').replace(/\s+/g, ' ').trim()
    if (!text || /^test(ing)?$/i.test(text)) continue
    const key = text.toLowerCase()
    const row = byText.get(key) || { key, text, n: 0, robots: new Set(), scenes: new Set() }
    row.n += 1; row.robots.add(e.robotId); if (e.scene) row.scenes.add(e.scene.trim().toLowerCase())
    byText.set(key, row)
  }
  index = [...byText.values()].sort((a, b) => b.n - a.n)
  return index
}
export function homeSearch(el) {
  el.innerHTML = `<label class="hs">${ICON_SEARCH}<input type="search" placeholder="Search task instructions" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="hs-drop" aria-autocomplete="list"></label>`
  // The dropdown lives on <body>, so the hero's overflow clipping cannot cut it off.
  const input = el.querySelector('input'), drop = document.createElement('div')
  drop.className = 'hs-drop'; drop.id = 'hs-drop'; drop.hidden = true; document.body.appendChild(drop)
  const place = () => { const r = el.querySelector('.hs').getBoundingClientRect(); drop.style.left = r.left + 'px'; drop.style.top = r.bottom + 8 + 'px'; drop.style.width = Math.max(r.width, Math.min(420, innerWidth - r.left - 16)) + 'px' }
  addEventListener('scroll', () => { if (!drop.hidden) place() }, { passive: true }); addEventListener('resize', () => { if (!drop.hidden) place() })
  let sel = -1, rows = []
  const placeholder = () => { if (store.evaluations) input.placeholder = `Search ${fmt(buildIndex().length)} task instructions` }
  function render() {
    const q = input.value.trim().toLowerCase()
    if (!q) { drop.hidden = true; input.setAttribute('aria-expanded', 'false'); return }
    if (!store.evaluations) { drop.hidden = false; place(); drop.innerHTML = `<div class="hs-empty">Loading the evaluation list…</div>`; return }
    const terms = q.split(/\s+/)
    rows = buildIndex().filter(r => terms.every(t => r.key.includes(t))).slice(0, 6)
    const total = rows.reduce((n, r) => n + r.n, 0)
    drop.hidden = false; input.setAttribute('aria-expanded', 'true'); sel = -1; place()
    drop.innerHTML = (rows.length ? rows.map(r => { const robots = [...r.robots]; return `<a class="hs-row" href="${appLink('/evals', { robot: robots[0], track: 'open' })}"><b>${esc(sentence(r.text))}</b><small>${fmt(r.n)} comparison${r.n === 1 ? '' : 's'} · ${robots.map(robotName).map(esc).join(', ')}${r.scenes.size ? ` · ${r.scenes.size} scene${r.scenes.size === 1 ? '' : 's'}` : ''}</small></a>` }).join('') : `<div class="hs-empty">No instruction matches “${esc(input.value.trim())}”.</div>`)
      + `<a class="hs-all" href="${appLink('/evals')}">${rows.length ? `Open the viewer for these ${fmt(total)} comparisons →` : 'Browse every comparison in the viewer →'}</a>`
  }
  input.addEventListener('input', render)
  input.addEventListener('focus', () => { placeholder(); render() })
  input.addEventListener('keydown', e => {
    const items = [...drop.querySelectorAll('.hs-row')]
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((it, i) => it.classList.toggle('sel', i === sel)) }
    else if (e.key === 'Enter') { const target = items[sel] || drop.querySelector('.hs-all'); if (target) location.href = target.href }
    else if (e.key === 'Escape') { input.value = ''; render(); input.blur() }
  })
  document.addEventListener('pointerdown', e => { if (!el.contains(e.target) && !drop.contains(e.target)) { drop.hidden = true; input.setAttribute('aria-expanded', 'false') } })
  return { refresh: () => { placeholder(); if (!drop.hidden) render() } }
}

const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
const ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.3" fill="var(--surface)"/><circle cx="15" cy="17" r="2.3" fill="var(--surface)"/></svg>'
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>'
