// Direction: the poster. The phrase is the page; the footage plays inside the letters.
import { boot, BODIES, bodyFacts, axes, num, partners, footerLinks, appLinks, latestAgo, DATASET, esc } from '../shared/record.js'

const $ = (s, el = document) => el.querySelector(s)
const THEME = {
  card: 'background:var(--surface);border:1px solid var(--line);border-radius:4px', surface: '#f3f9dd',
  ink: '#1c231b', secondary: '#44503f', muted: '#6f7d66', grid: '#dcebad', axis: '#9fb470', ring: '#9fb470',
  sans: "'Archivo', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace", titleWeight: 600, tipBg: '#1c231b', tipInk: '#e9f5c4',
  brand: 'RoboColosseum',
}

appLinks()
$('#hero-actions').innerHTML = `<a class="button primary" href="${DATASET.href}">${DATASET.label}</a><a class="button" href="#leaderboards">See the leaderboards</a>`
$('#partner-logos').innerHTML = partners()
$('#footer').innerHTML = `<div><a class="brand" href="#top">RoboColosseum</a><p class="prov">Every figure on this page is read live from the RoboColosseum API when you open it. Co-organized by Hugging Face, BitRobot and the Embodied AI Centre, Singapore.</p></div>${footerLinks()}`

// What is playing inside the letters right now (../video/cues.json: [{t, body, place, site, date}]).
const film = $('#film'), now = $('#now')
let cues = [], current = -1
fetch('../video/cues.json').then(r => r.ok ? r.json() : []).then(list => { cues = list }).catch(() => {})
film.addEventListener('timeupdate', () => {
  if (!cues.length) return
  const t = film.currentTime
  const i = cues.findIndex((c, k) => t >= c.t && (k === cues.length - 1 || t < cues[k + 1].t))
  if (i < 0 || i === current) return
  current = i
  const c = cues[i]
  now.innerHTML = `<i></i>Playing: <b>${esc(c.body)}</b>, ${esc([c.place, c.site].filter(Boolean).join(', '))}${c.date ? `, ${esc(c.date)}` : ''}`
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
