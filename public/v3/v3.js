// RoboColosseum v3 landing page. Every number, bar, dot and clip is read from the live API through ../landing/live.js.
import { API, APP, ASSETS, ROBOTS, store, startLoading, totals, summary, hasData, rankedOpen, fineRows, policyLabel, fmt, esc, appLink, sentence } from '../landing/live.js'
import { boardFromUrl, boardToUrl, labFor } from '../landing/leaderboard.js'
import { WALL } from './wall.js'
import { heroWall, heroRun, homeSearch, prettyScene } from './hero.js'
import { homeBoard, mark } from './board.js'
import { globeSection } from './globe-section.js'

const $ = (s, el = document) => el.querySelector(s)
const robotName = id => ROBOTS.find(r => r.id === id)?.name || id
const live = { summary: null }

// ---------- icons (24-unit line icons, stroke set by CSS) ----------
const I = {
  scale: '<svg viewBox="0 0 24 24"><path d="M12 4v16M5 8l7-2 7 2M3 14l2-6 2 6a2 2 0 0 1-4 0zM17 14l2-6 2 6a2 2 0 0 1-4 0zM8 20h8"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2"/></svg>',
  arm: '<svg viewBox="0 0 24 24"><path d="M5 20h8M9 20v-5l5-7 4 2"/><circle cx="18.5" cy="8.5" r="2"/><circle cx="9" cy="15" r="1.5"/></svg>',
  cloud: '<svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.6-7.95A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1-.5 7H7z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/></svg>',
  route: '<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h7a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5"/></svg>',
  cube: '<svg viewBox="0 0 24 24"><path d="M12 2.5 21 7v10l-9 4.5L3 17V7zM3 7l9 4.5L21 7M12 11.5V21.5"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.2 3.7M6.6 6.6A16 16 0 0 0 2 12s3.5 6 10 6a9.5 9.5 0 0 0 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 2.5 20 6v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  ruler: '<svg viewBox="0 0 24 24"><path d="M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
  spread: '<svg viewBox="0 0 24 24"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9 17h6"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  moon: '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
}
const MARK = '<svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor"/><path d="M8 22a8 8 0 0 1 16 0" stroke="var(--bg)" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="12" r="3" fill="var(--open)"/><path d="M7 24h18" stroke="var(--fine)" stroke-width="3" stroke-linecap="round"/></svg>'
const fx = (name, cls = '') => I[name].replace('<svg ', `<svg class="fx-ic ${cls}" `)

// ---------- chrome ----------
function chrome() {
  $('#nav').innerHTML = `<nav class="nav" aria-label="Sections">
    <a class="wordmark" href="#top">${MARK}RoboColosseum</a>
    <div class="nav-links" id="nav-links"><a href="#leaderboard">Leaderboard</a><a href="#diversity">Evaluations</a><a href="#embodiments">Bodies</a><a href="#how">How it works</a><a class="ext" href="${appLink('/evals')}">Viewer</a></div>
    <a class="icon-btn gh-btn" href="https://github.com/frodobots-org/robo-colosseum" aria-label="GitHub" title="GitHub">${I.github}</a>
    <a class="icon-btn gh-btn" href="https://huggingface.co/" aria-label="Hugging Face" title="Hugging Face"><img src="${ASSETS}huggingface-logo.svg" alt="" width="19" height="19"></a>
    <button class="icon-btn menu-btn" id="menu-toggle" aria-expanded="false" aria-label="Menu">${I.menu}</button>
    <button class="icon-btn" id="theme-toggle" aria-label="Switch between day and night">${I.moon}${I.sun}</button>
  </nav>`
  $('#theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('rc-theme', next) } catch {}
  })
  const nav = $('.nav'), menu = $('#menu-toggle')
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)) })
  $('#nav-links').addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false') })
  document.querySelectorAll('[data-app]').forEach(a => { a.href = appLink(a.dataset.app) })
}

function footer() {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  $('#footer').innerHTML = `<footer class="footer"><div class="footer-grid">
    <div><a class="wordmark" href="#top">${MARK}RoboColosseum</a><div class="prov">Results read live from the RoboColosseum API · page opened ${esc(today)}</div><div class="copy">© ${new Date().getFullYear()} RoboColosseum · Real-world robot policy evaluation</div></div>
    <div><h5>The benchmark</h5><ul><li><a href="#leaderboard">Leaderboard</a></li><li><a href="${appLink('/evals')}">Evaluation viewer</a></li><li><a href="${appLink('/tasks')}">Tasks and criteria</a></li><li><a href="${appLink('/submit')}">Submit a policy</a></li></ul></div>
    <div><h5>About</h5><ul><li><a href="#how">How a result is made</a></li><li><a href="#embodiments">Bodies and rooms</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li></ul></div>
    <div><h5>Community</h5><ul><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li><li><a href="https://huggingface.co/">Hugging Face</a></li><li><a href="https://bitrobot.ai/">BitRobot</a></li><li><a href="https://nrp.gov.sg/">Embodied AI Centre, Singapore</a></li></ul></div>
  </div></footer>`
}

function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -6% 0px' })
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el))
}

// ---------- numbers ----------
function numbers() {
  const t = totals()
  const big = (icon, value, label, small) => `<div>${I[icon]}<dt>${value === null || value === undefined ? '<span class="skel">0,000</span>' : fmt(value)}</dt><dd>${label}${small ? `<small>${small}</small>` : ''}</dd></div>`
  $('#bignums').innerHTML = big('scale', t.comparisons, 'blind A/B comparisons', 'open track, finalized') + big('repeat', t.fineTrials, 'scored fine-tuning trials', 'up to 25 per task and checkpoint')
    + big('home', t.scenes, 'body / scene combinations', 'rooms the policies never trained in') + big('users', live.summary?.evaluators ?? null, 'independent evaluators', 'blind to which policy is which')
  const policies = new Set(ROBOTS.flatMap(r => [...rankedOpen(r.id).map(x => policyLabel(x.policy)), ...fineRows(r.id).map(x => policyLabel(x.policyId || x.policy))]))
  const tasks = new Set(ROBOTS.flatMap(r => fineRows(r.id).map(x => x.taskId || x.task)))
  const bodies = t.embodiments
  $('#nums-line').innerHTML = store.ready
    ? `<span><b>${bodies}</b> robot bod${bodies === 1 ? 'y' : 'ies'} with results</span><i>·</i><span><b>${policies.size}</b> rated polic${policies.size === 1 ? 'y' : 'ies'}</span><i>·</i><span><b>${tasks.size}</b> fine-tuning task${tasks.size === 1 ? '' : 's'}</span>`
    : `<span class="skel">0 robot bodies · 0 rated policies</span>`
  $('#partners').innerHTML = `<span>Co-organized by</span>
    <a class="hf" href="https://huggingface.co/"><img src="${ASSETS}huggingface-logo.svg" alt=""><b>Hugging Face</b></a>
    <a href="https://bitrobot.ai/"><img class="bitrobot" src="${ASSETS}bitrobot-logo.webp" alt="BitRobot" style="height:34px"></a>
    <a class="eaic" href="https://nrp.gov.sg/"><b>EAIC</b><span>Embodied AI Centre<br>Singapore</span></a>`
}

// ---------- bodies and rooms ----------
function galleries() {
  const bodies = ROBOTS.map(r => {
    const s = summary(r.id), on = store.ready && hasData(r.id)
    const facts = !store.ready ? '<span class="skel">0,000 comparisons</span>' : !on ? `${r.kind} · evaluations coming soon`
      : [s.comparisons ? `${fmt(s.comparisons)} comparisons` : '', fineRows(r.id).length ? `${fmt(fineRows(r.id).reduce((n, x) => n + x.trials, 0))} trials` : '', r.kind].filter(Boolean).join(' · ')
    const href = on ? appLink('/leaderboard', { robot: r.id, track: s.comparisons ? 'open' : 'fine-tuning' }) : '#how'
    return `<a class="g-item" href="${href}"><div class="img"><img class="portrait" src="${ASSETS}${r.img}.webp" alt="${esc(r.name)}" loading="lazy"${r.mirror ? ' style="transform:scaleX(-1)"' : ''}>${store.ready ? `<span class="rel-tag${on ? '' : ' soon'}"><i></i>${on ? 'Live' : 'Coming soon'}</span>` : ''}</div><b>${esc(r.name)}</b><span>${facts}</span></a>`
  }).join('')
  let rooms = '', roomsCount = ''
  if (store.evaluations) {
    const scenes = new Map()
    for (const e of store.evaluations) { const key = `${e.robotId}|${prettyScene(e.scene).toLowerCase()}`; if (!prettyScene(e.scene)) continue; const s = scenes.get(key) || { robot: e.robotId, name: prettyScene(e.scene), n: 0, instructions: new Set() }; s.n += 1; s.instructions.add(String(e.instruction || e.task || '').trim().toLowerCase()); scenes.set(key, s) }
    const top = [...scenes.values()].sort((a, b) => b.n - a.n).slice(0, 8)
    roomsCount = `<small>${scenes.size} scenes · showing the ${top.length} busiest</small>`
    rooms = top.map(s => {
      const tile = WALL.find(t => t.robot === s.robot && prettyScene(t.scene).toLowerCase() === s.name.toLowerCase())
      const cover = tile ? `<img src="./wall/${tile.id}.webp" alt="" loading="lazy">` : `<img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='#dfe5ec'/><text x='2' y='1.75' font-family='sans-serif' font-size='.9' text-anchor='middle' fill='#69727f'>${s.name[0]}</text></svg>`)}" alt="">`
      return `<a class="g-item" href="${appLink('/evals', { robot: s.robot, track: 'open' })}"><div class="img">${cover}<span class="code-mark">${esc(robotName(s.robot).split(' ').pop().slice(0, 6).toUpperCase())}</span></div><b>${esc(s.name)}</b><span>${fmt(s.n)} comparisons · ${s.instructions.size} instruction${s.instructions.size === 1 ? '' : 's'} · ${esc(robotName(s.robot))}</span></a>`
    }).join('')
  } else {
    roomsCount = `<small>loading the evaluation list</small>`
    rooms = Array.from({ length: 4 }, () => `<div class="g-item"><div class="img"></div><b class="skel">Scene name</b><span class="skel">000 comparisons</span></div>`).join('')
  }
  $('#gallery').innerHTML = `<div class="suite-group"><h3>Robot bodies<small>${ROBOTS.length} bodies</small></h3><div class="gallery">${bodies}</div></div>
    <div class="suite-group"><h3>Rooms<small>${roomsCount}</small></h3><div class="gallery">${rooms}</div></div>`
  const t = totals()
  $('#budgets').innerHTML = `<b>Protocol.</b> Two policies run the same instruction on the same robot, in the same room, one after the other; an evaluator who does not know which is which records a preference and each rollout's progress. Fine-tuned checkpoints run up to 25 scored trials per task against written success criteria. ${t.scenes ? `So far that is ${fmt(t.scenes)} body-and-scene combinations` : 'Every scene is one'} the policies never trained in, with every rollout recorded from the robot's cameras and published next to its score.`
}

// ---------- how a result is made ----------
function flowDiagram() {
  const heroTile = WALL.find(t => t.id === 'ev_dbf6bd8f187f5e60d0ee70e78535a3e4') || WALL[0]
  const heroEval = store.evaluations?.find(e => e.id === heroTile.id)
  const goal = sentence(heroEval?.instruction || heroEval?.task || heroTile.instruction)
  const labs = ['pi', 'nvidia', 'galaxea', 'ai2', 'robbyant', 'openai', 'anthropic', 'xai']
  const robots = ROBOTS.map(r => `<span class="fx-sim${store.ready && !hasData(r.id) ? ' soon' : ''}">${esc(r.name)}</span>`).join('')
  const t = totals()
  $('#flowfig').innerHTML = `<div class="fx"><span class="fx-tag">One protocol · every body</span><div class="fx-grid">
    <div class="fx-qcard" style="grid-row:1 / 6"></div>
    <div class="fx-qh" style="grid-row:1"><b>${fx('doc')} Task</b></div>
    <div class="fx-in fx-goal" style="grid-row:2 / 4"><span class="fx-ih">${fx('terminal')} instruction in words</span><q>${esc(goal)}</q></div>
    <i class="fx-arrow" style="grid-row:2"></i>
    <div class="fx-in fx-scene" style="grid-row:4 / 6"><span class="fx-ih">${fx('home')} a real room</span><img src="./wall/${heroTile.id}.webp" alt="" loading="lazy"><ul class="fx-checks"><li>same room for both policies</li><li>same instruction, same objects</li><li>never a training scene</li></ul></div>
    <i class="fx-arrow" style="grid-row:5"></i>
    <div class="fx-layer" style="grid-row:1"><span class="fx-ln">${fx('cloud')} Policy</span><div class="fx-lb"><span class="fx-marks">${labs.map(id => `<span class="mk${['pi', 'openai', 'xai'].includes(id) ? ' contain' : ''}"><img src="${ASSETS}labs/${id}.webp" alt="" loading="lazy"></span>`).join('')}</span><span class="fx-more">any lab, any model</span></div></div>
    <div class="fx-layer" style="grid-row:2"><span class="fx-ln">${fx('terminal')} Policy server</span><div class="fx-lb"><span class="fx-pick"><span class="mk">${fx('route')}</span>Remote, over the router</span><span class="fx-pick"><span class="mk">${fx('cube')}</span>Local, on the robot host</span><span class="fx-more">any framework</span></div></div>
    <div class="fx-layer" style="grid-row:3"><span class="fx-ln">${fx('route')} Router <small>one protocol</small></span><div class="fx-lb"><span class="fx-way">cameras + joint state →</span><span class="fx-way">← action chunks</span><span class="fx-way">blind pairing</span><span class="fx-more">per body, per track</span></div></div>
    <div class="fx-iface" style="grid-row:4"><span class="fx-ln">${fx('layers')} Track <small>what the policy is asked to prove</small></span>
      <div class="fx-mode o"><div class="fx-mh"><span class="fx-lock">A/B</span><b>Open track</b></div><dl><div><dt>asks</dt><dd>Does the policy generalize? An unfamiliar instruction in an unfamiliar room.</dd></div><div><dt>pair</dt><dd>Two policies, same task, same room, run back to back.</dd></div><div><dt>judged</dt><dd>A blind preference, <code>A</code> / <code>B</code> / <code>tie</code>, plus each rollout's progress.</dd></div></dl></div>
      <div class="fx-mode f"><div class="fx-mh"><span class="fx-lock f">✓/4</span><b>Fine-tuning</b></div><dl><div><dt>asks</dt><dd>Does the policy learn a task? One checkpoint adapted to one defined task.</dd></div><div><dt>trials</dt><dd>Up to 25 repeated trials from varied starts.</dd></div><div><dt>judged</dt><dd>Written success criteria; full success and partial progress reported separately.</dd></div></dl></div>
    </div>
    <div class="fx-layer" style="grid-row:5"><span class="fx-ln">${fx('arm')} Robot <small>${store.ready ? `${t.embodiments} bodies live` : 'bodies'}</small></span><div class="fx-lb">${robots}<span class="fx-more">more joining</span></div></div>
    <i class="fx-arrow out" style="grid-row:4"><em>recorded</em></i>
    <div class="fx-ver"><span class="fx-vh">${fx('shield')} Evaluator</span><div class="fx-vi">${fx('eyeOff', 'o')} blind to which policy is which</div><div class="fx-vi">${fx('pin', 'o')} in the room, live</div><div class="fx-vi">${fx('ruler', 'f')} progress scored 0–4</div><div class="fx-res"><b>A</b><b>B</b><span>tie</span></div><div class="fx-rec">${fx('cam')} video · feedback · timing</div></div>
    <div class="fx-out"><span class="fx-vh">${fx('trophy')} Board</span><div class="fx-vi">${fx('spread', 'o')} <span>open track: rating <b>± SE</b> per body</span></div><div class="fx-vi">${fx('repeat', 'f')} <span>fine-tuning: full success <b>%</b>, 95% CI</span></div></div>
    <a class="fx-traj" href="${appLink('/evals', { robot: heroTile.robot, track: 'open' })}">${fx('video')}<span>Episode recording · <span class="mono">${esc(heroTile.id.slice(0, 11))}</span> · ${esc(robotName(heroTile.robot))} · ${esc(prettyScene(heroTile.scene))}${heroEval ? ` · verdict <b>${heroEval.winner === 'tie' ? 'tie' : 'Policy ' + heroEval.winner}</b>` : ''} · Watch it in the viewer →</span></a>
  </div></div>`
}

function ways() {
  $('#ways').innerHTML = `<p class="cw-lead">A policy can be entered as it is, to see whether it generalizes, or adapted to one task, to see whether it learns. The exam does not prescribe which, and most labs run both.</p>
    <div class="cw-head"><span></span><span>What is compared</span><span></span></div>
    <details class="cw-row"><summary><span class="cw-n">Open track</span><span class="cw-f">Policy A <i>⇄</i> Policy B</span><span class="cw-x"></span></summary><p>Two policies get the same instruction on the same robot in the same room. The evaluator watches both rollouts without knowing which policy is which, records a preference, and scores each rollout's progress. Ratings are fitted per body from every finalized pair and shown with their standard error, so a policy with few comparisons has visibly wide error bars. <a href="${appLink('/evals')}">Watch the recorded pairs →</a></p></details>
    <details class="cw-row"><summary><span class="cw-n">Fine-tuning</span><span class="cw-f">Checkpoint <i>→</i> 25 trials</span><span class="cw-x"></span></summary><p>A checkpoint adapted to one defined task runs up to 25 scored trials from varied start states. Each trial is marked against written success criteria on a 0–4 scale; the board reports full success and partial progress separately, with a Wilson interval on the success rate. <a href="${appLink('/tasks')}">Read the task criteria →</a></p></details>
    <details class="cw-row"><summary><span class="cw-n">Bring your robot</span><span class="cw-f">Any body <i>→</i> same protocol</span><span class="cw-x"></span></summary><p>A new embodiment joins with the open client: it streams its cameras and joint state to the router and executes the action chunks that come back. The same evaluators, the same tracks and the same scoring apply from the first trial, so results on a new body are comparable from day one. <a href="${appLink('/join')}">Join as an evaluator or host →</a></p></details>`
}

function trustRow() {
  const items = [
    ['eyeOff', 'Blind pairs', 'In the open track the evaluator never knows which policy is A and which is B. Preferences cannot favour a name.'],
    ['users', 'Independent evaluators', 'Evaluations are run by people outside the labs that trained the policies, at partner sites.'],
    ['home', 'Unfamiliar rooms', 'Scenes, objects and lighting are the evaluator\'s, not the lab\'s. No policy is scored where it trained.'],
    ['cam', 'Every rollout recorded', 'Each trial keeps its camera recordings and the evaluator\'s written feedback, published next to the score.'],
    ['spread', 'Error bars, always', 'Ratings carry a standard error and success rates a Wilson interval; a policy with little evidence looks like it.'],
    ['scale', 'Same body, same scale', 'Policies are only compared with others on the same robot body. No cross-body rating is ever shown.'],
  ]
  $('#trust').innerHTML = items.map(([icon, name, tip]) => `<li tabindex="0"><span class="tr-ic">${I[icon]}</span><b>${name}</b><span class="tip">${tip}</span></li>`).join('')
}

// ---------- boot ----------
const state = boardFromUrl()
let board, run, search, globe
function renderAll() {
  numbers(); galleries(); flowDiagram()
  board?.render(); run?.refresh(); run?.args(); search?.refresh(); globe?.refresh()
}
chrome(); footer(); ways(); trustRow(); numbers(); galleries(); flowDiagram()
heroWall($('#wall'), WALL.slice().sort(() => Math.random() - 0.5))
run = heroRun($('#hero-run'), state, next => { board?.setState(next); boardToUrl(next) })
search = homeSearch($('#home-search'))
board = homeBoard($('#lbh'), $('#bars-note'), state, next => boardToUrl(next))
globe = globeSection($('#sphere'))
reveal()
startLoading(renderAll)
fetch(`${API}/summary`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : null).then(d => { live.summary = d?.summary || null; numbers() }).catch(() => {})
