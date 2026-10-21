// Direction: the film. One full-width cut of real evaluations with a caption that names each place as it plays.
import { boot, BODIES, bodyFacts, axes, num, partners, footerLinks, appLinks, latestAgo, DATASET, esc } from '../shared/record.js'

const $ = (s, el = document) => el.querySelector(s)
const THEME = {
  card: 'background:var(--surface);border:1px solid var(--line);border-radius:10px', surface: '#ffffff',
  ink: '#000000', secondary: '#444444', muted: '#777777', grid: '#eeefea', axis: '#c9ccc2', ring: '#c9ccc2',
  sans: "'Bricolage Grotesque', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace", titleWeight: 600, tipBg: '#000', tipInk: '#fff',
  brand: 'RoboColosseum',
}

appLinks()
$('#hero-actions').innerHTML = `<a class="button primary" href="${DATASET.href}">${DATASET.label}</a><a class="button" href="#leaderboards">See the leaderboards</a>`
$('#partner-logos').innerHTML = partners()
$('#footer').innerHTML = `<div><a class="brand" href="#top">RoboColosseum</a><p class="prov">Every figure on this page is read live from the RoboColosseum API when you open it. Co-organized by Hugging Face, BitRobot and the Embodied AI Centre, Singapore.</p></div>${footerLinks()}`

// The caption follows the cut list that ships with the film (../video/cues.json: [{t, body, place, site, date}]).
const film = $('#film'), caption = $('#caption'), progress = $('#progress')
let cues = [], current = -1
fetch('../video/cues.json').then(r => r.ok ? r.json() : []).then(list => {
  cues = list
  progress.innerHTML = cues.map(() => '<i></i>').join('')
}).catch(() => {})
film.addEventListener('timeupdate', () => {
  if (!cues.length) return
  const t = film.currentTime
  let i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  caption.innerHTML = `<b>${esc(c.body)}</b><span>${esc([c.place, c.site].filter(Boolean).join(', '))}${c.date ? ` · ${esc(c.date)}` : ''}</span>`
  progress.querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k <= i))
})
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { film.removeAttribute('autoplay'); film.pause() }
new IntersectionObserver(es => es.forEach(e => { if (film.hasAttribute('autoplay')) e.isIntersecting ? film.play().catch(() => {}) : film.pause() })).observe(film)

function bodies() {
  $('#bodies-row').innerHTML = BODIES.map(bodyFacts).map(b => `<a class="body" data-tag="${b.tag}" href="${b.href}">
    <span class="portrait"><img class="${b.portrait ? 'portrait' : 'photo'}" src="${b.img}" alt="${esc(b.name)}" loading="lazy"${b.mirror ? ' style="transform:scaleX(-1)"' : ''}></span>
    <b>${esc(b.name)}</b><span class="kind">${esc(b.sub || b.kind)}</span>
    <span class="facts">${b.tag ? `<i class="tag">${b.tag}</i>` : ''}${b.facts ? esc(b.facts) : '<span class="skel">0,000 comparisons</span>'}</span></a>`).join('')
}
function scale() {
  $('#axes').innerHTML = axes().map(a => `<div><dt>${num(a.value)}</dt><dd>${a.label}${a.small ? `<small>${a.small}</small>` : ''}</dd></div>`).join('')
}
function liveMark() { const ago = latestAgo(); $('#live').innerHTML = `<i></i>${ago ? `Latest verdict ${ago}` : 'Live data'}` }

bodies(); scale()
boot({
  leaderboards: { switches: $('#lb-switches'), desc: $('#lb-desc'), note: $('#lb-note'), figure: $('#lb-figure'), rows: $('#lb-rows') },
  pair: $('#pair'), trialsContent: $('#trials-content'), trialsLegend: $('#trials-legend'), globe: $('#sphere'),
}, THEME, () => { bodies(); scale(); liveMark() })
