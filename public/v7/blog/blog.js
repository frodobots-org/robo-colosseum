// The v7 blog: the shared chrome, plus links back to the landing page resolved from the site root.
import { ROOT, chrome } from '../chrome.js'

chrome()
document.querySelectorAll('[data-robots]').forEach(a => { a.href = `${ROOT}v7/#robots` })
