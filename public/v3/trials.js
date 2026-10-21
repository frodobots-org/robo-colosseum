// Every fine-tuning trial on every body: one square per scored trial, 25 per task per checkpoint.
import { ROBOTS, store, loadReviews, explorer, fineRows, esc, fmt } from '../landing/live.js'

export function trialsSection(content, legend) {
  legend.innerHTML = [['success', 'full success'], ['partial', 'partial progress'], ['fail', 'no progress'], ['unknown', 'outcome not in the public review window'], ['empty', 'not run']].map(([c, l]) => `<span><i class="cell ${c}"></i>${l}</span>`).join('')
  let asked = false
  function render() {
    if (!store.ready) { content.innerHTML = `<p class="lbh-empty"><span class="skel" style="min-width:24ch">&nbsp;</span></p>`; return }
    const bodies = ROBOTS.filter(r => fineRows(r.id).length).sort((a, b) => fineRows(b.id).reduce((n, x) => n + x.trials, 0) - fineRows(a.id).reduce((n, x) => n + x.trials, 0))
    if (!asked) { asked = true; bodies.forEach(r => loadReviews(r.id, render)) }
    if (!bodies.length) { content.innerHTML = `<p class="lbh-empty">No published fine-tuning trials yet.</p>`; return }
    content.innerHTML = bodies.map(r => {
      const ex = explorer({ robot: r.id, track: 'fine', task: 'all', focus: null })
      if (ex.mode !== 'fine') return ''
      const tasks = ex.taskChips.filter(c => c.id !== 'all')
      return `<section class="trial-body"><div class="trial-head"><h3>${esc(r.name)}</h3><small>${esc(ex.sub)}${ex.reviewsLoading ? ' · loading outcomes…' : ''}</small></div>
        <div class="trial-tasks">${tasks.map((t, i) => `<span>${i + 1} · ${esc(t.name)}</span>`).join('')}</div>
        ${ex.rows.map(row => `<div class="trial-row"><div class="who"><b>${esc(row.name)}</b><small>${row.successes}/${row.trials} full success · progress ${row.progress}%</small></div>
          <div class="blocks">${row.blocks.map(b => `<span class="block" title="${esc(b.task)}">${b.cells.map(c => `<i class="${c}"></i>`).join('')}</span>`).join('')}</div>
          <div class="score"><b>${row.rate}%</b><small>95% CI ${row.lo}–${row.hi}%</small></div></div>`).join('')}
      </section>`
    }).join('')
  }
  render()
  return { render }
}
