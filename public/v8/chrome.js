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
  <div><h3>Follow</h3><ul class="social"><li><a href="https://x.com/RoboColosseum"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>X</a></li><li><a href="https://github.com/RoboColosseum"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum"><img src="${ROOT}landing/assets/huggingface-logo.svg" alt="" width="95" height="88">Hugging Face</a></li></ul></div></nav>`
}
