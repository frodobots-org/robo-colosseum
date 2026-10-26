// v5: Index in night mode. The Index layout (claim + film, index cards, a feed of verdicts) on a dark page with a live ticker.
import { boot, BODIES, bodyFacts, axes, num, partners, footerLinks, appLinks, latestAgo, DATASET, esc, fmt, store, ROBOTS, rankedOpen, fineRows, hasData, appLink, robotName } from '../v4/shared/record.js'
import { policyLabel } from '../landing/live.js'

const $ = (s, el = document) => el.querySelector(s)
const ROOT = window.RC_ROOT || '/'
const THEME = {
  card: 'background:transparent;border:0;border-radius:0', surface: '#13161a',
  ink: '#e8eaed', secondary: '#b3b9c2', muted: '#8b929c', grid: '#23272d', axis: '#3a4149', ring: '#3a4149',
  sans: "'Archivo', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace", titleWeight: 700, tipBg: '#e8eaed', tipInk: '#0b0d10',
  brand: 'RoboColosseum',
}

appLinks()
$('#hero-actions').innerHTML = `<a class="button primary" href="${DATASET.href}">${DATASET.label}</a><a class="button" href="#leaderboards">See the leaderboards</a>`
$('#partner-logos').innerHTML = partners()
$('#brand-mark').src = `${ROOT}brand/rc-mark-white.svg`
$('#footer').innerHTML = `<div><a class="brand" href="#top"><img src="${ROOT}brand/rc-lockup-white.svg" alt="RoboColosseum" height="40"></a><p class="prov">Every figure on this page is read live from the RoboColosseum API when you open it. Co-organized by Hugging Face, BitRobot, the Embodied AI Centre (Singapore) and MAGIC Lab (NUS).</p></div>${footerLinks()}`

// The film: the caption follows the cut list that ships with it.
const film = $('#film'), caption = $('#caption'), progress = $('#progress')
film.poster = `${ROOT}v4/video/mashup.jpg`; film.src = `${ROOT}v4/video/mashup.mp4`
let cues = [], current = -1
fetch(`${ROOT}v4/video/cues.json`).then(r => r.ok ? r.json() : []).then(list => { cues = list; progress.innerHTML = cues.map(() => '<i></i>').join('') }).catch(() => {})
film.addEventListener('timeupdate', () => {
  if (!cues.length) return
  const t = film.currentTime
  const i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  caption.innerHTML = `<b>${esc(c.body)}</b><span>${esc([c.place, c.site].filter(Boolean).join(', '))}${c.date ? ` · ${esc(c.date)}` : ''}</span>`
  progress.querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k <= i))
})
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { film.removeAttribute('autoplay'); film.pause() }
new IntersectionObserver(es => es.forEach(e => { if (film.hasAttribute('autoplay')) e.isIntersecting ? film.play().catch(() => {}) : film.pause() })).observe(film)

const ago = iso => { if (!iso) return ''; const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago` }
const counted = () => (store.evaluations || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))

function ticker() {
  const a = Object.fromEntries(axes().map(x => [x.key, x]))
  const latest = counted()[0]
  const cell = (label, value, small) => `<div><dt>${value}</dt><dd>${label}${small ? `<small>${small}</small>` : ''}</dd></div>`
  $('#ticker').innerHTML = cell('latest verdict', latest ? esc(ago(latest.date)) : '<span class="skel">just now</span>', latest ? `${esc(robotName(latest.robotId))} · ${esc(latest.scene || 'room not recorded')}` : '')
    + cell('recorded rollouts', num(a.rollouts.value), 'blind pairs and scored trials')
    + cell('rooms', num(a.rooms.value), `${a.sites.value ?? '…'} evaluation sites`)
    + cell('robot bodies', num(a.bodies.value), a.bodies.small)
}
function bodies() {
  $('#bodies-row').innerHTML = BODIES.map(bodyFacts).map(b => `<a class="body" data-tag="${b.tag}" href="${b.href}">
    <span class="portrait"><img class="${b.portrait ? 'portrait' : 'photo'}" src="${b.img}" alt="${esc(b.name)}" loading="lazy"${b.mirror ? ' style="transform:scaleX(-1)"' : ''}></span>
    <b>${esc(b.name)}</b><span class="kind">${esc(b.sub || b.kind)}</span>
    <span class="facts">${b.tag ? `<i class="tag">${b.tag}</i>` : ''}${b.facts ? esc(b.facts) : '<span class="skel">0,000 comparisons</span>'}</span></a>`).join('')
}
function scale() {
  $('#axes').innerHTML = axes().map(a => `<div><dt>${num(a.value)}</dt><dd>${a.label}${a.small ? `<small>${a.small}</small>` : ''}</dd></div>`).join('')
}
function index() {
  const open = ROBOTS.flatMap(r => rankedOpen(r.id)), fine = ROBOTS.flatMap(r => fineRows(r.id))
  const comparisons = store.ready ? Math.round(open.reduce((n, r) => n + Number(r.evals || 0), 0) / 2) : null
  const trials = store.ready ? fine.reduce((n, r) => n + Number(r.trials || 0), 0) : null
  const leaders = ROBOTS.map(r => ({ r, top: rankedOpen(r.id)[0] })).filter(x => x.top)
  const bestBlock = fine.filter(r => r.trials >= 25).sort((a, b) => b.successRate - a.successRate)[0]
  const liveBodies = store.ready ? ROBOTS.filter(r => hasData(r.id)).length : null
  const card = (track, title, big, label, lines, href) => `<a class="card ${track}" href="${href}"><span class="ct">${title}</span><b>${big}</b><span class="cl">${label}</span><ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul></a>`
  $('#index-cards').innerHTML =
    card('k-open', 'Open track', num(comparisons), 'blind A/B comparisons', leaders.length ? leaders.map(x => `<i>${esc(x.r.name)}</i> ${esc(policyLabel(x.top.policyId || x.top.policy))} <em>${fmt(Math.round(x.top.score))}</em>`) : ['<span class="skel">leader per body</span>'], appLink('/leaderboard', { track: 'open' }))
    + card('k-fine', 'Fine-tuning', num(trials), 'scored trials', bestBlock ? [`<i>best block</i> ${esc(policyLabel(bestBlock.policyId || bestBlock.policy))} <em>${Math.round(bestBlock.successRate)}%</em>`, `<i>policies</i> ${new Set(fine.map(r => r.policyId || r.policy)).size} <i>tasks</i> ${new Set(fine.map(r => r.taskId || r.task)).size}`] : ['<span class="skel">best block</span>'], appLink('/leaderboard', { track: 'fine-tuning' }))
    + card('k-bodies', 'Bodies', num(liveBodies), 'with live results', [`<i>joining</i> ${BODIES.filter(b => b.joining).map(b => esc(b.name)).join(', ') || 'none'}`, `<i>protocol</i> one, shared by every body`], '#bodies')
}
function feed() {
  const list = counted().slice(0, 10)
  $('#feed-note').textContent = store.evaluations ? `${fmt(store.evaluations.length)} finalized open-track verdicts` : 'loading the record…'
  $('#feed').innerHTML = list.length ? list.map(e => {
    const verdict = e.winner === 'A' ? 'Preferred A' : e.winner === 'B' ? 'Preferred B' : 'Tie'
    const who = [e.policyA, e.policyB].filter(Boolean).map(policyLabel).join(' vs ')
    return `<li><a href="${appLink('/evals', { robot: e.robotId, track: 'open' })}"><span class="when">${esc(ago(e.date))}</span><span class="what"><b>${esc(robotName(e.robotId))}</b> · ${esc(e.scene || 'room not recorded')}${e.institution ? ` · ${esc(e.institution)}` : ''}${who ? `<small>${esc(who)}</small>` : ''}</span><span class="verdict ${e.winner === 'A' || e.winner === 'B' ? 'pref' : 'tie'}">${verdict}</span></a></li>`
  }).join('') : '<li class="empty"><span class="skel" style="min-width:30ch">&nbsp;</span></li>'
}
function liveMark() { const a = latestAgo(); $('#live').innerHTML = `<i></i>${a ? `Latest verdict ${a}` : 'Live data'}` }

ticker(); bodies(); scale(); index(); feed()
boot({
  leaderboards: { switches: $('#lb-switches'), desc: $('#lb-desc'), note: $('#lb-note'), figure: $('#lb-figure'), rows: $('#lb-rows') },
  pair: $('#pair'), trialsContent: $('#trials-content'), trialsLegend: $('#trials-legend'), globe: $('#sphere'),
}, THEME, () => { ticker(); bodies(); scale(); index(); feed(); liveMark() })
