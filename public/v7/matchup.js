// One real head-to-head from the record: both runs side by side, the instruction, the evaluator's judgement and note.
// Same data path as ../v3/pair.js, with the v7 wording and poster frames resolved from that module's folder.
import { API, ROBOTS, store, esc, sentence } from '../landing/live.js'
import { FRAMES } from '../v3/frames.js'
import { HERO_ID } from '../v3/pair.js'
import { prettyScene } from '../v3/board.js'

const FRAME_DIR = new URL('../v3/frames/', import.meta.url).href
const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
const CAM = ['left_image', 'right_image', 'top_image', 'front_image', 'head_image']
const camLabel = key => ({ left_image: 'Left camera', right_image: 'Right camera', top_image: 'Top camera', front_image: 'Front camera', head_image: 'Wrist camera' })[key] || key.replace(/_image$/, '').replace(/_/g, ' ') + ' camera'
const when = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

export function matchup(root) {
  const seed = FRAMES.find(f => f.id === HERO_ID) || FRAMES[0]
  let current = { id: seed.id, robotId: seed.robot, scene: seed.scene, instruction: seed.instruction, winner: seed.winner }
  let token = 0
  // A finalized comparison with both recordings, a real instruction and a written note.
  const pick = () => {
    const pool = (store.evaluations || []).filter(e => e.videos?.a && e.videos?.b && String(e.instruction || e.task || '').trim() && !/^test(ing)?$/i.test(String(e.instruction || e.task).trim()) && String(e.feedback || '').length > 60)
      .sort((a, b) => (b.institution ? 1 : 0) - (a.institution ? 1 : 0) || String(b.date).localeCompare(String(a.date))).slice(0, 160).filter(e => e.id !== current.id)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
  }
  function details() {
    const e = current, winner = e.winner === 'A' || e.winner === 'B' ? e.winner : null
    const raw = String(e.feedback || '').replace(/\s+/g, ' ').trim(), note = raw.length < 40 || /^test/i.test(raw) ? '' : raw
    const short = note.length > 320 ? note.slice(0, note.lastIndexOf(' ', 300)) + '…' : note
    const pa = Number.isFinite(e.partialSuccessA) ? Math.round(e.partialSuccessA * 100) : null, pb = Number.isFinite(e.partialSuccessB) ? Math.round(e.partialSuccessB * 100) : null
    const where = [robotName(e.robotId), prettyScene(e.scene), e.institution].filter(Boolean).map(esc).join(', ')
    return `<p class="instruction">“${esc(sentence(e.instruction || e.task))}”</p>
      <p class="where">${where}${e.date ? `<span>${esc(when(e.date))}</span>` : ''}</p>
      <p class="judgement">${winner ? `Evaluator's pick: <b>run ${winner}</b>.` : "Evaluator's call: <b>a tie</b>."}${pa !== null && pb !== null ? ` Progress: A <span class="n">${pa}%</span>, B <span class="n">${pb}%</span>.` : ''}</p>
      ${short ? `<blockquote class="note">${esc(short)}</blockquote>` : ''}
      <button type="button" class="another"${store.evaluations ? '' : ' disabled'}>Show another comparison</button>`
  }
  function bind() { root.querySelector('.another')?.addEventListener('click', () => { const next = pick(); if (next) { current = next; render() } }) }
  function render() {
    const winner = current.winner === 'A' || current.winner === 'B' ? current.winner : null
    root.innerHTML = `<div class="runs">${['A', 'B'].map(s => `<div class="run${winner === s ? ' won' : ''}"><video muted loop playsinline preload="auto"></video><span class="side">Run ${s}${winner === s ? ', picked' : ''}</span><span class="cam"></span></div>`).join('')}</div>
      <div class="details">${details()}</div>`
    bind()
    loadClips()
  }
  async function loadClips() {
    const mine = ++token, runs = root.querySelectorAll('.run')
    let videos = {}
    try { const r = await fetch(`${API}/evaluations/${current.id}/videos`, { headers: { Accept: 'application/json' } }); if (r.ok) videos = (await r.json()).videos || {} } catch {}
    if (mine !== token) return
    const players = []
    runs.forEach((run, i) => {
      const cams = videos[i ? 'b' : 'a'] || {}, key = CAM.find(k => cams[k]) || Object.keys(cams)[0]
      const v = run.querySelector('video')
      if (!key) {
        if (FRAMES.some(f => f.id === current.id)) { v.remove(); const img = document.createElement('img'); img.src = `${FRAME_DIR}${current.id}.webp`; img.alt = ''; run.prepend(img); run.classList.add('ready') }
        return
      }
      run.querySelector('.cam').textContent = camLabel(key)
      v.src = cams[key]
      players.push(new Promise(res => { v.addEventListener('canplay', () => res(v), { once: true }); v.addEventListener('error', () => res(null), { once: true }) }))
    })
    const ready = (await Promise.all(players)).filter(Boolean)
    if (mine !== token) return
    ready.forEach(v => { v.closest('.run').classList.add('ready'); v.play().catch(() => {}) })
  }
  render()
  return {
    refresh() {
      const e = store.evaluations?.find(x => x.id === current.id); if (e) current = e
      const d = root.querySelector('.details'); if (d) { d.innerHTML = details(); bind() }
    },
  }
}
