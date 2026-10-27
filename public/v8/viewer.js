// A preview of the evaluation viewer: one blind comparison from the daily record, both runs on one timeline (play, pause
// and seek move them together), a choice of camera, the instruction, the evaluator's pick and note. The comparisons come
// from /api/stats; the recordings from /evaluations/{id}/videos when a comparison is shown.
import { API, ROBOTS, esc, sentence } from '../landing/live.js'
import { prettyScene } from '../v3/board.js'

const NAMES = Object.fromEntries([...ROBOTS.map(r => [r.id, r.name]), ['earth_rover_mini_plus', 'Earth Rover Mini+']])
// The overview camera first. Labels are the recording's own camera names, which differ in meaning between robots.
const ORDER = ['head_image', 'top_image', 'front_image', 'left_image', 'right_image']
const camLabel = key => key.replace(/_image$/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) + ' camera'
const when = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const still = matchMedia('(prefers-reduced-motion: reduce)').matches

export function viewer(root) {
  let list = [], current = null, videos = {}, cam = null, token = 0, playing = !still, visible = false, sync = null
  const missing = new Set()

  const details = e => {
    const winner = e.winner === 'A' || e.winner === 'B' ? e.winner : null
    const raw = String(e.feedback || '').replace(/\s+/g, ' ').trim()
    const note = raw.length > 320 ? raw.slice(0, raw.lastIndexOf(' ', 300)) + '…' : raw
    const pa = Number.isFinite(e.partialSuccessA) ? Math.round(e.partialSuccessA * 100) : null, pb = Number.isFinite(e.partialSuccessB) ? Math.round(e.partialSuccessB * 100) : null
    const where = [NAMES[e.robotId] || e.robotId, prettyScene(e.scene), e.institution].filter((x, i, all) => x && all.findIndex(y => String(y).toLowerCase() === String(x).toLowerCase()) === i).map(esc).join(', ')
    return `<p class="instruction">“${esc(sentence(e.instruction))}”</p>
      <p class="where">${where}${e.date ? `<span>${esc(when(e.date))}</span>` : ''}</p>
      <p class="judgement">${winner ? `Evaluator's pick: <b>run ${winner}</b>.` : "Evaluator's call: <b>a tie</b>."}${pa !== null && pb !== null ? ` Progress: A <span class="n">${pa}%</span>, B <span class="n">${pb}%</span>.` : ''}</p>
      ${note ? `<blockquote class="note">${esc(note)}</blockquote>` : ''}
      <button type="button" class="another"${list.length > 1 ? '' : ' disabled'}>Show another comparison</button>`
  }

  function render() {
    const e = current, winner = e.winner === 'A' || e.winner === 'B' ? e.winner : null
    root.innerHTML = `<div class="runs">${['A', 'B'].map(s => `<div class="run${winner === s ? ' won' : ''}"><video muted playsinline preload="auto"></video><span class="side">Run ${s}${winner === s ? ', picked' : ''}</span></div>`).join('')}</div>
      <div class="transport"><button type="button" class="play" disabled aria-label="Play both runs"><span class="ico" aria-hidden="true"></span></button>
        <input type="range" min="0" max="1000" value="0" step="1" aria-label="Position in both runs" disabled><time>0:00 / 0:00</time></div>
      <div class="cams" role="group" aria-label="Camera"></div>
      <div class="details">${details(e)}</div>`
    root.querySelector('.another').addEventListener('click', next)
    load()
  }

  function next() {
    const pool = list.filter(e => e.id !== current?.id && !missing.has(e.id))
    if (pool.length) { current = pool[Math.floor(Math.random() * pool.length)]; render() }
  }

  async function load() {
    const mine = ++token
    videos = {}; sync = null
    try { const r = await fetch(`${API}/evaluations/${current.id}/videos`, { headers: { Accept: 'application/json' } }); if (r.ok) videos = (await r.json()).videos || {} } catch {}
    if (mine !== token) return
    const both = ORDER.filter(k => videos.a?.[k] && videos.b?.[k])
    const keys = both.length ? both : [...new Set([...Object.keys(videos.a || {}), ...Object.keys(videos.b || {})])]
    // Some comparisons have no recording to play yet: show another one instead, a few times at most.
    if (!keys.length) {
      missing.add(current.id)
      if (missing.size < 6 && list.some(e => !missing.has(e.id))) return next()
      root.querySelectorAll('.run').forEach(run => run.insertAdjacentHTML('beforeend', '<span class="note-off">Recording not available</span>')); return
    }
    cam = keys.includes(cam) ? cam : keys[0]
    const cams = root.querySelector('.cams')
    cams.innerHTML = keys.length > 1 ? keys.map(k => `<button type="button" data-cam="${esc(k)}" aria-pressed="${k === cam}">${esc(camLabel(k))}</button>`).join('') : ''
    cams.onclick = ev => { const b = ev.target.closest('[data-cam]'); if (b && b.dataset.cam !== cam) { cam = b.dataset.cam; cams.querySelectorAll('[data-cam]').forEach(x => x.setAttribute('aria-pressed', x === b)); attach(mine, players().a.currentTime) } }
    attach(mine, 0)
  }

  const players = () => { const [a, b] = root.querySelectorAll('.run video'); return { a, b } }

  // Both runs on one clock: the longer run sets the timeline, the shorter one holds its last frame.
  function attach(mine, at) {
    const { a, b } = players(), play = root.querySelector('.play'), seek = root.querySelector('input[type="range"]'), time = root.querySelector('time')
    const pairs = [[a, videos.a?.[cam]], [b, videos.b?.[cam]]]
    const ready = pairs.map(([v, src]) => new Promise(res => {
      if (!src) { v.closest('.run').classList.remove('ready'); return res(null) }
      v.addEventListener('loadedmetadata', () => { v.currentTime = Math.min(at, Math.max(0, v.duration - .05)); res(v) }, { once: true })
      v.addEventListener('error', () => res(null), { once: true })
      v.src = src
    }))
    Promise.all(ready).then(list => {
      if (mine !== token) return
      const live = list.filter(Boolean); if (!live.length) return
      live.forEach(v => v.closest('.run').classList.add('ready'))
      const length = () => Math.max(...live.map(v => v.duration || 0))
      const lead = live.reduce((m, v) => (v.duration > m.duration ? v : m))
      const show = () => { const t = lead.currentTime; seek.value = Math.round(t / (length() || 1) * 1000); time.textContent = `${clock(t)} / ${clock(length())}` }
      const go = () => { live.forEach(v => { v.play().catch(() => {}) }); play.classList.add('playing'); play.setAttribute('aria-label', 'Pause both runs') }
      const stop = () => { live.forEach(v => v.pause()); play.classList.remove('playing'); play.setAttribute('aria-label', 'Play both runs') }
      play.disabled = false; seek.disabled = false
      play.onclick = () => { playing = !play.classList.contains('playing'); playing ? go() : stop() }
      seek.oninput = () => { const t = seek.value / 1000 * length(); live.forEach(v => { v.currentTime = Math.min(t, Math.max(0, v.duration - .05)) }); show() }
      lead.ontimeupdate = show
      // When the longer run ends, both start again together.
      lead.onended = () => { live.forEach(v => { v.currentTime = 0 }); if (playing) go() }
      show()
      sync = { go, stop }
      if (playing && visible) go()
    })
  }

  // Play only while the viewer is on screen, never for readers who asked for reduced motion.
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting
    if (visible && playing) sync?.go()
    else if (!visible) sync?.stop()
  })).observe(root)

  return {
    show(matchups) {
      list = matchups || []
      if (!list.length) { root.innerHTML = '<p class="board-note">The comparison did not load. Open the evaluation viewer to browse every comparison.</p>'; return }
      if (!current) { current = list[0]; render() }
    },
    loading() { root.innerHTML = '<div class="runs"><div class="run"></div><div class="run"></div></div><div class="details"><p class="instruction"><span class="skel">Loading a comparison from the record</span></p></div>' },
  }
}
