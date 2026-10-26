// The parts every v7 page shares: the one call to action, the brand mark and the footer.
import { appLink } from '../landing/live.js'

export const ROOT = window.RC_ROOT || '/'
export const SUBMIT = appLink('/submit')

export function chrome() {
  document.querySelectorAll('[data-cta]').forEach(a => { a.href = SUBMIT })
  document.querySelectorAll('[data-blog]').forEach(a => { a.href = `${ROOT}v7/blog/` })
  document.querySelector('#brand-mark').src = `${ROOT}brand/rc-mark-white.svg`
  document.querySelector('#footer').innerHTML = `<div class="foot-brand"><img src="${ROOT}brand/rc-lockup-white.svg" alt="RoboColosseum" height="40"><p>Founded by NUS MAGIC Lab, BitRobot, EAIC Singapore and Hugging Face.</p></div>
  <nav aria-label="Footer"><div><h3>The benchmark</h3><ul><li><a href="${appLink('/leaderboard')}">Leaderboard</a></li><li><a href="${appLink('/evals')}">Evaluations</a></li><li><a href="${appLink('/tasks')}">Tasks and protocol</a></li><li><a href="https://huggingface.co/RoboColosseum">Open data</a></li><li><a href="${ROOT}v7/blog/">Blog</a></li></ul></div>
  <div><h3>Take part</h3><ul><li><a href="${SUBMIT}">Submit your policy</a></li><li><a href="${appLink('/join')}">Join as an evaluator</a></li></ul></div>
  <div><h3>Follow</h3><ul><li><a href="https://x.com/RoboColosseum">X</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum">Hugging Face</a></li></ul></div></nav>`
}
