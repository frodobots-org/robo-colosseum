// The hero: one real blind pair from the arena, both rollouts side by side, the evaluator's verdict and note.
import { API, ROBOTS, store, esc, appLink, sentence } from '../landing/live.js'
import { FRAMES } from './frames.js'
import { prettyScene } from './board.js'

export const HERO_ID = 'ev_16083007f23fee02f6305efa4fa974c4'
const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
const CAM = ['left_image', 'right_image', 'top_image', 'front_image', 'head_image']
const camLabel = key => ({ left_image: 'left camera', right_image: 'right camera', top_image: 'top camera', front_image: 'front camera', head_image: 'wrist camera' })[key] || key.replace(/_image$/, '').replace(/_/g, ' ') + ' camera'
const when = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

export function heroPair(root) {
  const seed = FRAMES.find(f => f.id === HERO_ID) || FRAMES[0]
  let current = { id: seed.id, robotId: seed.robot, scene: seed.scene, instruction: seed.instruction, winner: seed.winner }
  let token = 0
  const pick = () => {
    const pool = (store.evaluations || []).filter(e => e.videos?.a && e.videos?.b && String(e.instruction || e.task || '').trim() && !/^test(ing)?$/i.test(String(e.instruction || e.task).trim()) && String(e.feedback || '').length > 60)
      .sort((a, b) => (b.institution ? 1 : 0) - (a.institution ? 1 : 0) || String(b.date).localeCompare(String(a.date))).slice(0, 160).filter(e => e.id !== current.id)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
  }
  function sheet() {
    const e = current, winner = e.winner === 'tie' || !e.winner ? 'tie' : e.winner
    const stamp = winner === 'tie' ? 'Tie' : `Preferred ${winner}`
    const raw = String(e.feedback || '').replace(/\s+/g, ' ').trim(), note = raw.length < 40 || /^test/i.test(raw) ? '' : raw
    const short = note.length > 320 ? note.slice(0, note.lastIndexOf(' ', 300)) + '…' : note
    const pa = Number.isFinite(e.partialSuccessA) ? Math.round(e.partialSuccessA * 100) : null, pb = Number.isFinite(e.partialSuccessB) ? Math.round(e.partialSuccessB * 100) : null
    const meta = [`<b>${esc(robotName(e.robotId))}</b>`, esc(prettyScene(e.scene)), e.institution ? `judged at ${esc(e.institution)}` : 'independent evaluator', e.difficultyLabel ? `${esc(e.difficultyLabel.toLowerCase())} task` : '', when(e.date)].filter(Boolean).join(' · ')
    return `<div><p class="task">“${esc(sentence(e.instruction || e.task))}”</p><p class="meta">${meta}</p></div>
      <div class="verdict"><span class="label">Evaluator's verdict</span><br><span class="stamp${winner === 'tie' ? ' tie' : ''}">${stamp}</span>${pa !== null ? `<span class="scores">progress A ${pa}% · B ${pb}%</span>` : ''}</div>
      ${short ? `<p class="feedback"><b>Evaluator's note.</b> ${esc(short)}</p>` : store.evaluations ? '' : `<p class="feedback"><span class="skel" style="min-width:60%">&nbsp;</span></p>`}
      <div class="foot"><button class="another" id="another"${store.evaluations ? '' : ' disabled title="Loading every evaluation…"'}>Another pair ↻</button><a href="${appLink('/evals', { robot: e.robotId, track: 'open' })}">Open this evaluation in the viewer ↗</a></div>`
  }
  function render() {
    const e = current, winner = e.winner === 'tie' ? null : e.winner
    root.innerHTML = `<div class="pair-head"><p class="eyebrow">A real pair, judged blind</p><small>${esc(e.id.slice(0, 11))} · open track</small></div>
      <div class="screens">${['A', 'B'].map(s => `<div class="screen ${s.toLowerCase()}${winner === s ? ' won' : ''}"><span class="side">${s}</span><video muted loop playsinline preload="auto"></video><span class="cam"></span>${winner === s ? '<span class="won-tag">preferred</span>' : ''}</div>`).join('')}</div>
      <div class="sheet" id="sheet">${sheet()}</div>`
    root.querySelector('#another')?.addEventListener('click', () => { const next = pick(); if (next) { current = next; render() } })
    loadClips()
  }
  async function loadClips() {
    const mine = ++token, screens = root.querySelectorAll('.screen')
    let videos = {}
    try { const r = await fetch(`${API}/evaluations/${current.id}/videos`, { headers: { Accept: 'application/json' } }); if (r.ok) videos = (await r.json()).videos || {} } catch {}
    if (mine !== token) return
    const players = []
    screens.forEach((screen, i) => {
      const cams = videos[i ? 'b' : 'a'] || {}, key = CAM.find(k => cams[k]) || Object.keys(cams)[0]
      const v = screen.querySelector('video')
      if (!key) { if (FRAMES.some(f => f.id === current.id)) { v.remove(); const img = document.createElement('img'); img.src = `./frames/${current.id}.webp`; img.alt = ''; screen.prepend(img); screen.classList.add('ready') } return }
      screen.querySelector('.cam').textContent = camLabel(key)
      v.src = cams[key]
      players.push(new Promise(res => { v.addEventListener('canplay', () => res(v), { once: true }); v.addEventListener('error', () => res(null), { once: true }) }))
    })
    const ready = (await Promise.all(players)).filter(Boolean)
    if (mine !== token) return
    ready.forEach(v => { v.closest('.screen').classList.add('ready'); v.play().catch(() => {}) })
  }
  render()
  return { refresh() { const e = store.evaluations?.find(x => x.id === current.id); if (e) current = e; const s = root.querySelector('#sheet'); if (s) { s.innerHTML = sheet(); root.querySelector('#another')?.addEventListener('click', () => { const next = pick(); if (next) { current = next; render() } }) } } }
}
