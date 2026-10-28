// The v7 blog: the shared chrome, plus links back to the landing page resolved from the site root.
import { ROOT, SUBMIT, chrome } from '../chrome.js'
import { FORM_URL } from '../../v9/chrome.js'

chrome()
document.querySelectorAll('[data-robots]').forEach(a => { a.href = `${ROOT}v7/#robots` })
// The live site links here, so the blog's buttons and footer link follow the root page's one call to action: "Apply for
// free evaluation", opening the Youform in a new tab. /v7/ itself keeps its own.
const foot = document.querySelector(`#footer a[href="${SUBMIT}"]`)
if (foot) { foot.textContent = 'Apply for free evaluation'; foot.dataset.cta = '' }
document.querySelectorAll('[data-cta]').forEach(a => { a.href = FORM_URL; a.target = '_blank'; a.rel = 'noopener' })
