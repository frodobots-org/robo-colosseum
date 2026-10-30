// The blog: the site's shared chrome, the contents list that follows the reader, and the site's films in a post.
import { ROOT, chrome } from '../landing/chrome.js'

chrome()

// Contents: the section being read is the last one whose title has passed the top bar.
const links = [...document.querySelectorAll('.toc a')]
const heads = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean)
if (heads.length === links.length && links.length) {
  let queued = false
  const mark = () => {
    queued = false
    let i = 0
    heads.forEach((h, k) => { if (h.getBoundingClientRect().top < 140) i = k })
    links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current') })
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(mark) } }, { passive: true })
  mark()
}

// Films (data-film names one in landing/video/): phones get the smaller cut; they play only while visible, and readers
// who asked for reduced motion get the controls instead.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
document.querySelectorAll('video[data-film]').forEach(video => {
  const base = `${ROOT}landing/video/${video.dataset.film}`
  video.poster = `${base}.jpg`
  video.src = `${base}${matchMedia('(max-width: 760px)').matches ? '-960' : ''}.mp4`
  if (still) { video.removeAttribute('autoplay'); video.controls = true; return }
  new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? video.play().catch(() => {}) : video.pause() })).observe(video)
})
