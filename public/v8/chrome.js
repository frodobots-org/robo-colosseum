// The parts every v8 page shares: the brand lockups, the one call to action, the theme switch and the footer.
// Every copy of the button leads to the application form at the foot of the landing page.
import { appLink } from '../landing/live.js'

export const ROOT = window.RC_ROOT || '/'
// The landing page is the site root, so the form is at /#form-embed from every other page.
export const APPLY = `${ROOT}#form-embed`
// The application form (Youform, set up by Karen). Every call to action leads to it: on the landing page it is embedded
// in the closing section, so the buttons scroll straight to it; other pages link to /#form-embed.
export const FORM_URL = 'https://app.youform.com/forms/riubycrq'

function themeSwitch(button) {
  const label = () => { button.setAttribute('aria-label', `Switch to the ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`) }
  label()
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('rc-theme', next) } catch {}
    label()
  })
}

export function chrome() {
  document.querySelectorAll('img[data-src]').forEach(img => { img.src = ROOT + img.dataset.src })
  // On the landing page itself the button scrolls to the form; elsewhere it opens the landing page there.
  const here = document.querySelector('#apply')
  document.querySelectorAll('[data-cta]').forEach(a => { a.href = here ? '#apply' : APPLY })
  const theme = document.querySelector('#theme'); if (theme) themeSwitch(theme)
  // Narrow screens: the section links open from a menu button and close when one is chosen.
  const menu = document.querySelector('#menu'), sheet = document.querySelector('#nav-sheet')
  if (menu && sheet) {
    const set = open => { menu.setAttribute('aria-expanded', open); sheet.classList.toggle('open', open) }
    menu.addEventListener('click', () => set(menu.getAttribute('aria-expanded') !== 'true'))
    sheet.addEventListener('click', e => { if (e.target.closest('a')) set(false) })
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false) })
  }
  const embed = document.querySelector('#form-embed')
  if (FORM_URL && embed) {
    embed.innerHTML = `<iframe src="${FORM_URL}" title="Apply for free evaluation" loading="lazy"></iframe>`
    embed.hidden = false
    document.querySelectorAll('[data-cta], [data-form]').forEach(a => { a.href = '#form-embed' })
    // Arriving from another page (/#form-embed, or an older /#apply link): once the page has loaded and the content above
    // has settled, bring the form itself into view.
    const toForm = () => setTimeout(() => embed.scrollIntoView(), 0)
    if (['#apply', '#form-embed'].includes(location.hash)) document.readyState === 'complete' ? toForm() : addEventListener('load', toForm, { once: true })
  } else if (FORM_URL) {
    document.querySelectorAll('[data-cta]').forEach(a => { a.href = FORM_URL })
  }
  document.querySelector('#footer').innerHTML = `<div class="foot-brand"><img class="for-light" src="${ROOT}brand/robocolosseum-lockup-full-light.svg" alt="RoboColosseum" width="883" height="257"><img class="for-dark" src="${ROOT}brand/robocolosseum-lockup-full-dark.svg" alt="RoboColosseum" width="883" height="257"><p>Founded by NUS MAGIC Lab, BitRobot, EAIC Singapore and Hugging Face.</p></div>
  <nav aria-label="Footer"><div><h3>The benchmark</h3><ul><li><a href="${appLink('/leaderboard')}">Leaderboard</a></li><li><a href="${appLink('/evals')}">Evaluations</a></li><li><a href="${appLink('/tasks')}">Tasks and protocol</a></li><li><a href="https://huggingface.co/RoboColosseum">Open data</a></li><li><a href="${ROOT}v7/blog/">Blog</a></li></ul></div>
  <div><h3>Take part</h3><ul><li><a href="${here ? (FORM_URL ? '#form-embed' : '#apply') : APPLY}">Apply for free evaluation</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li></ul></div>
  <div><h3>Follow</h3><ul><li><a href="https://x.com/RoboColosseum">X</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum">Hugging Face</a></li></ul></div></nav>`
}
