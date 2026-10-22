<template>
  <div class="page-stack lb-page">
    <section class="lb-head">
      <div>
        <p class="eyebrow">Leaderboards</p>
        <h1>{{ robot.name }}<span class="h1-track"> · {{ track === 'open' ? 'Open track' : 'Fine-tuning' }}</span></h1>
        <p class="lb-lede">{{ track === 'open' ? 'Policies rated from blind A/B comparisons on this body, in rooms the policy has never seen. One rating per body; never pooled across bodies.' : 'Checkpoints adapted to a fixed task and scored over repeated trials. Full success and partial progress are reported separately.' }}</p>
      </div>
      <span class="lb-live"><i></i>Live from the API</span>
    </section>

    <nav class="body-tabs" aria-label="Robot body">
      <button v-for="item in embodiments" :key="item.id" type="button" :class="['body-tab', { on: robot.id === item.id }]" :aria-pressed="robot.id === item.id" @click="select({ robot: item.id })">
        <RobotGlyph :kind="item.glyph" /><span><b>{{ item.name }}</b><small>{{ item.type }}</small></span>
      </button>
    </nav>

    <div class="track-row">
      <div class="track-switch" role="group" aria-label="Track">
        <button type="button" :class="['track-btn open', { on: track === 'open' }]" :aria-pressed="track === 'open'" @click="select({ track: 'open' })"><Icon name="ab" /><span><b>Open track</b><small>Blind A/B rating</small></span></button>
        <button type="button" :class="['track-btn fine', { on: track === 'fine-tuning' }]" :aria-pressed="track === 'fine-tuning'" @click="select({ track: 'fine-tuning' })"><Icon name="trials" /><span><b>Fine-tuning</b><small>Scored trials, 0–4</small></span></button>
      </div>
      <RouterLink class="text-link" :to="link('/evals')">Review the evaluations <Icon name="external" /></RouterLink>
    </div>

    <section v-if="summary" class="summary" aria-label="Summary">
      <article v-for="card in summary" :key="card.label" :class="['sum-card', card.kind]">
        <span class="sum-label"><Icon :name="card.icon" />{{ card.label }}</span>
        <div class="sum-main">
          <span v-if="card.logo" :class="['lab-tile', card.logoFit]" :style="card.logoBg ? { background: card.logoBg } : null"><img :src="card.logo" :alt="card.logoAlt" /></span>
          <span v-else-if="card.initial" class="lab-tile mono">{{ card.initial }}</span>
          <b>{{ card.value }}</b>
        </div>
        <small>{{ card.sub }}</small>
      </article>
    </section>

    <section class="board" aria-labelledby="board-title">
      <div class="board-toolbar">
        <h2 id="board-title" class="sr-only">Ranking</h2>
        <label class="search"><Icon name="search" /><input v-model="query" type="search" placeholder="Filter policies or labs" aria-label="Filter policies or labs" /></label>
        <div v-if="track === 'open'" class="chips" role="group" aria-label="Minimum comparisons">
          <button v-for="n in [0, 20, 100, 500]" :key="n" type="button" :class="{ on: minEvals === n }" @click="minEvals = n">{{ n ? `${n}+` : 'All' }}<small v-if="n === 0"> comparisons</small></button>
          <label class="toggle"><input v-model="showPending" type="checkbox" /> Show pending</label>
        </div>
        <div v-else class="chips" role="group" aria-label="Task">
          <button type="button" :class="{ on: taskId === '' }" @click="taskId = ''">All tasks</button>
          <button v-for="task in tasks" :key="task.id" type="button" :class="{ on: taskId === task.id }" @click="taskId = task.id">{{ task.name }}</button>
        </div>
        <span class="count">{{ countLabel }}</span>
      </div>

      <div v-if="loading" class="state"><span class="skel" style="min-width:28ch">&nbsp;</span></div>
      <div v-else-if="apiUnavailable" class="state"><h3>Results are temporarily unavailable</h3><p>The API did not answer. Try again in a moment.</p><button class="button secondary" type="button" @click="fetchResults">Try again</button></div>
      <div v-else-if="!visibleRows.length" class="state"><h3>{{ hasFilters ? 'No policies match' : 'No results for this selection yet' }}</h3><p>Policies appear here as soon as their evaluations are finalized.</p><button v-if="hasFilters" class="button secondary" type="button" @click="clearFilters">Clear filters</button></div>

      <div v-else class="rows" role="table" :aria-label="`${robot.name} ${track} ranking`">
        <div class="row head" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Policy</span>
          <template v-if="track === 'open'">
            <button role="columnheader" type="button" :class="['sortable', { on: sortKey === 'score' }]" @click="sortBy('score')">Rating <small>±1 SE</small><Icon :name="sortIcon('score')" /></button>
            <button role="columnheader" type="button" :class="['sortable', { on: sortKey === 'winrate' }]" @click="sortBy('winrate')">Record <small>W · T · L</small><Icon :name="sortIcon('winrate')" /></button>
            <button role="columnheader" type="button" :class="['sortable num', { on: sortKey === 'evals' }]" @click="sortBy('evals')">Comparisons<Icon :name="sortIcon('evals')" /></button>
          </template>
          <template v-else>
            <button role="columnheader" type="button" :class="['sortable', { on: sortKey === 'rate' }]" @click="sortBy('rate')">Full success <small>95% CI</small><Icon :name="sortIcon('rate')" /></button>
            <button role="columnheader" type="button" :class="['sortable', { on: sortKey === 'progress' }]" @click="sortBy('progress')">Progress<Icon :name="sortIcon('progress')" /></button>
            <button role="columnheader" type="button" :class="['sortable num', { on: sortKey === 'trials' }]" @click="sortBy('trials')">Trials<Icon :name="sortIcon('trials')" /></button>
          </template>
          <span role="columnheader" class="actions-head"></span>
        </div>

        <div v-for="row in visibleRows" :key="row.id" :class="['row', { lead: row.rank === 1, faint: row.faint, pending: row.pending }]" role="row">
          <span role="cell" :class="['rank', `r${row.rank}`]">{{ row.rank ?? '—' }}</span>
          <span role="cell" class="who">
            <span v-if="row.lab" :class="['lab-tile', row.lab.fit]" :style="row.lab.bg ? { background: row.lab.bg } : null" :title="row.lab.name"><img :src="row.lab.logo" :alt="row.lab.name" loading="lazy" /></span>
            <span v-else class="lab-tile mono" title="Independent">{{ row.initial }}</span>
            <span class="who-text">
              <b>{{ row.label }}<a v-if="row.modelUrl" :href="row.modelUrl" target="_blank" rel="noreferrer" class="hf" :title="`${row.label} on Hugging Face`"><Icon name="external" /></a></b>
              <small>{{ row.sub }}</small>
            </span>
          </span>
          <template v-if="track === 'open'">
            <span role="cell" class="metric">
              <span v-if="!row.pending" class="bar" :style="{ '--lo': row.lo + '%', '--span': row.span + '%', '--at': row.at + '%' }"><i class="ci"></i><i class="pt"></i></span>
              <span class="val"><b>{{ row.pending ? '—' : fmt(row.score) }}</b><em v-if="!row.pending">±{{ fmt(row.se) }}</em></span>
            </span>
            <span role="cell" class="record">
              <span v-if="row.evals" class="wtl" :title="`${fmt(row.wins)} wins · ${fmt(row.ties)} ties · ${fmt(row.losses)} losses`"><i class="w" :style="{ flexGrow: row.wins }"></i><i class="t" :style="{ flexGrow: row.ties }"></i><i class="l" :style="{ flexGrow: row.losses }"></i></span>
              <span class="val"><b>{{ row.evals ? pct(row.winrate) : '—' }}</b><em v-if="row.evals">{{ fmt(row.wins) }} · {{ fmt(row.ties) }} · {{ fmt(row.losses) }}</em></span>
            </span>
            <span role="cell" class="num"><b>{{ row.evals ? fmt(row.evals) : '—' }}</b><em v-if="row.faint">low evidence</em><em v-else-if="row.pending">pending</em></span>
          </template>
          <template v-else>
            <span role="cell" class="metric">
              <span class="bar pctbar" :style="{ '--lo': row.ciLo + '%', '--span': (row.ciHi - row.ciLo) + '%', '--at': row.rate + '%' }"><i class="fill"></i><i class="ci"></i><i class="pt"></i></span>
              <span class="val"><b>{{ pct(row.rate) }}</b><em>{{ fmt(row.successes) }}/{{ fmt(row.trials) }}</em></span>
            </span>
            <span role="cell" class="metric">
              <span class="bar pctbar progress" :style="{ '--at': row.progress + '%' }"><i class="fill"></i></span>
              <span class="val"><b>{{ pct(row.progress) }}</b><em v-if="row.tasks">{{ row.tasks.length }} task{{ row.tasks.length === 1 ? '' : 's' }}</em></span>
            </span>
            <span role="cell" class="num"><b>{{ fmt(row.trials) }}</b>
              <span v-if="row.tasks && row.tasks.length > 1" class="minis" aria-hidden="true"><i v-for="t in row.tasks" :key="t.name" :title="`${t.name}: ${t.s}/${t.t}`" :style="{ '--h': Math.max(8, t.rate) + '%' }"></i></span>
            </span>
          </template>
          <span role="cell" class="actions"><RouterLink :to="link('/evals', { policy: row.policyId })" :title="`Evaluations of ${row.label}`"><Icon name="play" /></RouterLink></span>
        </div>
      </div>

      <div class="board-foot">
        <span v-if="track === 'open'">Rating is fitted from blind pairwise preferences on this body; ±1 standard error. Fewer than 20 comparisons is marked low evidence. Pending policies are registered but not yet compared.</span>
        <span v-else>Full success is the share of trials scored 4 of 4, with a Wilson 95% interval. Progress is the mean partial score. "All tasks" pools a checkpoint's trials across its tasks; a task tab ranks within that task.</span>
      </div>
    </section>

    <section v-if="!loading && !apiUnavailable && apiRows.length" class="figure-panel">
      <div class="panel-head"><h2>{{ track === 'open' ? 'Rating against evidence' : 'Success against progress' }}</h2><p>{{ track === 'open' ? 'Every rated policy as a lab mark: rating on the vertical, comparisons on the horizontal (log). Whiskers are ±1 SE.' : 'Each checkpoint as a lab mark: full success against mean progress, with Wilson 95% intervals. The diagonal is success = progress.' }}</p></div>
      <div ref="figureEl" class="figure"></div>
    </section>

    <section class="definitions">
      <h2>Key definitions</h2>
      <details><summary>Rating and standard error<Icon name="down" /></summary><p>Ratings are fitted per robot body from blind A/B preferences, so a rating only compares policies on the same body. The ±1 standard error shows how much the fit could move with more comparisons; two policies whose intervals overlap are not reliably ordered.</p></details>
      <details><summary>Record and comparisons<Icon name="down" /></summary><p>Each comparison is one evaluator-written instruction run by two policies in the same room, judged blind. The record counts wins, ties and losses; comparisons is their total. Below 20 comparisons a rating is shown faded and marked low evidence.</p></details>
      <details><summary>Full success, progress and the 95% interval<Icon name="down" /></summary><p>In the fine-tuning track a checkpoint is adapted to one task and run up to 25 times per task. Full success is the share of trials scored 4 of 4; progress is the mean of the 0–4 partial score, as a percentage. The interval on full success is a Wilson 95% interval for the number of trials.</p></details>
      <details><summary>Pending and hidden entries<Icon name="down" /></summary><p>A registered policy without finalized comparisons is pending and unranked. Rows the organizers hide for a body or track are not counted here; their evaluations remain in the viewer.</p></details>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { policyName } from '../display.js'
import RobotGlyph from '../components/RobotGlyph.vue'
import Icon from '../components/Icon.vue'
import { embodiments, useArena } from '../arena.js'
import { getLeaderboard } from '../api.js'
import { labFor, wilson, fmt, pct, taskName } from '../labs.js'

const { robot, track, select, link } = useArena()
const query = ref(''), minEvals = ref(0), showPending = ref(false), taskId = ref('')
const sortKey = ref('rank'), sortDir = ref(1)
const apiRows = ref([]), loading = ref(false), apiUnavailable = ref(false)
const figureEl = ref(null)
let requestController

const LOW = 20
const initialOf = name => String(name || '').replace(/^[^a-z0-9]*/i, '').charAt(0).toUpperCase() || '?'

// Policy labels: the name without its revision, made unique when two revisions of one policy are rated.
function labelled(items, key) {
  const seen = new Map()
  for (const it of items) { const n = policyName(it[key]); seen.set(n, (seen.get(n) || 0) + 1) }
  return items.map(it => { const n = policyName(it[key]); const rev = String(it.policy || '').split('@')[1]; return { ...it, label: seen.get(n) > 1 && rev ? `${n} @${rev.slice(0, 7)}` : n } })
}

const scoped = computed(() => apiRows.value.filter(r => r.robotId === robot.value.id && r.track === track.value))

const openRows = computed(() => {
  const rated = labelled(scoped.value.filter(r => r.status !== 'pending' && Number(r.evals) > 0 && Number.isFinite(r.score)), 'policy')
    .sort((a, b) => b.score - a.score)
  const pending = labelled(scoped.value.filter(r => r.status === 'pending' || !(Number(r.evals) > 0)), 'policy')
  if (!rated.length && !pending.length) return []
  const lo = Math.min(...rated.map(r => r.score - (r.std || 0))), hi = Math.max(...rated.map(r => r.score + (r.std || 0)))
  const pad = Math.max(30, (hi - lo) * 0.12), d0 = lo - pad, d1 = hi + pad
  const pos = v => Math.min(100, Math.max(0, (v - d0) / (d1 - d0) * 100))
  let rank = 0, last = null
  const rows = rated.map((r, i) => {
    const v = Math.round(r.score); if (v !== last) rank = i + 1; last = v
    const lab = labFor(r.policy)
    return { id: r.id || r.policy, rank, label: r.label, policyId: r.policyId || policyName(r.policy), lab, initial: initialOf(r.label), modelUrl: r.modelUrl,
      sub: `${lab ? lab.name : 'Independent'}${r.trend ? (r.trend > 0 ? ` · up ${r.trend}` : ` · down ${-r.trend}`) : ''}`,
      score: v, se: Math.round(r.std || 0), at: pos(r.score), lo: pos(r.score - (r.std || 0)), span: pos(r.score + (r.std || 0)) - pos(r.score - (r.std || 0)),
      wins: r.wins, ties: r.ties, losses: r.losses, evals: r.evals, winrate: r.evals ? (r.wins + r.ties / 2) / r.evals * 100 : 0, faint: r.evals < LOW, pending: false }
  })
  const rest = pending.map(r => { const lab = labFor(r.policy); return { id: r.id || r.policy, rank: null, label: r.label, policyId: r.policyId || policyName(r.policy), lab, initial: initialOf(r.label), modelUrl: r.modelUrl, sub: `${lab ? lab.name : 'Independent'} · registered`, score: null, se: 0, wins: 0, ties: 0, losses: 0, evals: 0, winrate: 0, faint: false, pending: true } })
  return [...rows, ...rest]
})

const tasks = computed(() => Array.from(new Map(scoped.value.filter(r => r.taskId).map(r => [r.taskId, { id: r.taskId, name: taskName(r) }])).values()).sort((a, b) => a.name.localeCompare(b.name)))
watch(tasks, items => { if (taskId.value && !items.some(t => t.id === taskId.value)) taskId.value = '' })

const fineRows = computed(() => {
  const rows = scoped.value.filter(r => Number(r.trials) > 0)
  if (!rows.length) return []
  if (taskId.value) {
    const inTask = labelled(rows.filter(r => r.taskId === taskId.value), 'policy').sort((a, b) => b.successRate - a.successRate || b.progress - a.progress)
    return inTask.map((r, i) => shape(r, i + 1, [{ name: taskName(r), rate: r.successRate, s: r.successes, t: r.trials }]))
  }
  const byPolicy = new Map()
  for (const r of rows) {
    const key = r.policyId || policyName(r.policy)
    const p = byPolicy.get(key) || { id: key, policy: r.policy, policyId: key, modelUrl: r.modelUrl, trials: 0, successes: 0, progressSum: 0, tasks: [] }
    p.trials += r.trials; p.successes += r.successes; p.progressSum += Number(r.progress || 0) * r.trials
    p.tasks.push({ name: taskName(r), rate: r.trials ? r.successes / r.trials * 100 : 0, s: r.successes, t: r.trials })
    byPolicy.set(key, p)
  }
  const pooled = labelled([...byPolicy.values()].map(p => ({ ...p, successRate: p.successes / p.trials * 100, progress: p.progressSum / p.trials })), 'policy')
    .sort((a, b) => b.successRate - a.successRate || b.progress - a.progress)
  return pooled.map((p, i) => shape(p, i + 1, p.tasks.sort((a, b) => a.name.localeCompare(b.name))))
})
function shape(r, rank, tasksList) {
  const lab = labFor(r.policy), [ciLo, ciHi] = wilson(r.successes, r.trials)
  return { id: r.id || r.policy, rank, label: r.label, policyId: r.policyId || policyName(r.policy), lab, initial: initialOf(r.label), modelUrl: r.modelUrl,
    sub: `${lab ? lab.name : 'Independent'} · ${fmt(r.trials)} trials`, rate: r.successRate, ciLo, ciHi, progress: r.progress, trials: r.trials, successes: r.successes, tasks: tasksList, faint: r.trials < 10, pending: false }
}

const baseRows = computed(() => track.value === 'open' ? openRows.value : fineRows.value)
const visibleRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const dir = sortDir.value
  const keyed = baseRows.value.filter(r => (!q || `${r.label} ${r.lab?.name || 'independent'}`.toLowerCase().includes(q))
    && (track.value !== 'open' || r.pending ? showPending.value || !r.pending : r.evals >= minEvals.value))
  if (sortKey.value === 'rank') return keyed
  return [...keyed].sort((a, b) => (Number(b[sortKey.value] ?? -Infinity) - Number(a[sortKey.value] ?? -Infinity)) * dir || (a.rank ?? 1e9) - (b.rank ?? 1e9))
})
const countLabel = computed(() => {
  const rated = baseRows.value.filter(r => !r.pending)
  if (track.value === 'open') return `${visibleRows.value.length} of ${rated.length} policies · ${fmt(Math.round(rated.reduce((n, r) => n + r.evals, 0) / 2))} comparisons`
  return `${visibleRows.value.length} ${taskId.value ? 'checkpoints' : 'policies'} · ${fmt(rated.reduce((n, r) => n + r.trials, 0))} trials`
})
const hasFilters = computed(() => Boolean(query.value || minEvals.value || taskId.value))
function clearFilters() { query.value = ''; minEvals.value = 0; taskId.value = '' }
function sortBy(key) { if (sortKey.value === key) { if (sortDir.value === 1) sortDir.value = -1; else { sortKey.value = 'rank'; sortDir.value = 1 } } else { sortKey.value = key; sortDir.value = 1 } }
function sortIcon(key) { return sortKey.value !== key ? 'sort' : sortDir.value === 1 ? 'down' : 'up' }

const summary = computed(() => {
  const rows = baseRows.value.filter(r => !r.pending)
  if (!rows.length) return null
  const lead = rows[0]
  const tile = r => r.lab ? { logo: r.lab.logo, logoFit: r.lab.fit, logoBg: r.lab.bg, logoAlt: r.lab.name } : { initial: r.initial }
  if (track.value === 'open') {
    const comparisons = Math.round(rows.reduce((n, r) => n + r.evals, 0) / 2)
    const second = rows[1]
    const gap = second ? lead.score - second.score : 0
    return [
      { icon: 'trophy', label: 'Leader', value: lead.label, sub: `${fmt(lead.score)} ±${fmt(lead.se)} · ${lead.lab?.name || 'Independent'}`, kind: 'lead', ...tile(lead) },
      { icon: 'ab', label: 'Blind comparisons', value: fmt(comparisons), sub: `on ${robot.value.name}, judged by people`, kind: 'n' },
      { icon: 'grid', label: 'Policies rated', value: String(rows.length), sub: `${baseRows.value.length - rows.length} pending`, kind: 'k' },
      { icon: second ? (gap > lead.se + second.se ? 'trend-up' : 'info') : 'info', label: 'Lead over #2', value: second ? `${gap > 0 ? '+' : ''}${fmt(gap)}` : '—', sub: second ? (gap > lead.se + second.se ? `clear of the error bars (${second.label})` : `inside the error bars (${second.label})`) : 'only one rated policy', kind: 'gap' },
    ]
  }
  const trials = rows.reduce((n, r) => n + r.trials, 0)
  return [
    { icon: 'trophy', label: taskId.value ? 'Best on this task' : 'Best overall', value: lead.label, sub: `${pct(lead.rate)} full success · ${lead.lab?.name || 'Independent'}`, kind: 'lead', ...tile(lead) },
    { icon: 'trials', label: 'Scored trials', value: fmt(trials), sub: `up to 25 per task per checkpoint`, kind: 'n' },
    { icon: 'grid', label: taskId.value ? 'Checkpoints on task' : 'Checkpoints', value: String(rows.length), sub: `${tasks.value.length} task${tasks.value.length === 1 ? '' : 's'} on ${robot.value.name}`, kind: 'k' },
    { icon: 'info', label: 'Median progress', value: pct(median(rows.map(r => r.progress))), sub: 'mean partial score, across checkpoints', kind: 'gap' },
  ]
})
function median(xs) { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null }

async function fetchResults() {
  requestController?.abort()
  const controller = new AbortController(); requestController = controller
  loading.value = true; apiUnavailable.value = false; apiRows.value = []
  try {
    const data = await getLeaderboard({ robot: robot.value.id, track: track.value, signal: controller.signal })
    if (controller.signal.aborted) return
    apiRows.value = Array.isArray(data.board) ? data.board : []
    apiUnavailable.value = data.source === 'empty'
  } catch (error) {
    if (!controller.signal.aborted) apiUnavailable.value = true
  } finally {
    if (requestController === controller) loading.value = false
  }
}

// The Robocurve figure from the landing pages, fed with the rows this page already has.
const THEME = { card: 'background:transparent;border:0;border-radius:0', surface: '#13161a', ink: '#e8eaed', secondary: '#b3b9c2', muted: '#8b929c', grid: '#23272d', axis: '#3a4149', ring: '#3a4149', sans: "'Archivo', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace", titleWeight: 700, tipBg: '#e8eaed', tipInk: '#0b0d10', brand: 'RoboColosseum' }
let figureLib = null
async function drawFigure() {
  await nextTick()
  if (!figureEl.value || !apiRows.value.length) return
  try {
    const base = import.meta.env.BASE_URL
    figureLib ||= await Promise.all([import(/* @vite-ignore */ `${base}landing/live.js`), import(/* @vite-ignore */ `${base}landing/leaderboard.js`)])
    const [live, lb] = figureLib
    live.store.boards[`${robot.value.id}/${track.value}`] = apiRows.value
    live.store.ready = true
    lb.renderFigure(figureEl.value, lb.figureModel(robot.value.id, track.value === 'open' ? 'open' : 'fine'), THEME)
  } catch (error) { figureEl.value.innerHTML = '' }
}
watch([() => robot.value.id, track], () => { clearFilters(); sortKey.value = 'rank'; sortDir.value = 1; fetchResults() }, { immediate: true })
watch([apiRows, loading], () => { if (!loading.value) drawFigure() })
onBeforeUnmount(() => requestController?.abort())
</script>

<style scoped>
.lb-page { gap: 22px; }
.lb-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.lb-head h1 { font: 800 clamp(34px, 4vw, 54px)/1 var(--sans); font-variation-settings: "wdth" 112; letter-spacing: -.035em; }
.h1-track { color: var(--muted); font-weight: 600; }
.lb-lede { margin: 12px 0 0; max-width: 64ch; color: var(--ink-2); font-size: 15.5px; }
.lb-live { display: inline-flex; align-items: center; gap: 7px; font: 500 12px/1 var(--mono); color: var(--ink-2); white-space: nowrap; }
.lb-live i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(255, 178, 36, .18); }

.body-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.body-tab { display: flex; align-items: center; gap: 12px; padding: 10px 14px 10px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); text-align: left; color: var(--ink-2); transition: border-color .15s, background .15s; }
.body-tab:hover { background: var(--raised); }
.body-tab.on { border-color: var(--accent-line); background: var(--raised); box-shadow: inset 0 0 0 1px var(--accent-line); color: var(--ink); }
.body-tab :deep(.robot-glyph) { width: 64px; height: 44px; flex: none; color: var(--ink-4); }
.body-tab.on :deep(.robot-glyph) { color: var(--accent); }
.body-tab b { display: block; font: 600 15px/1.2 var(--sans); letter-spacing: -.01em; }
.body-tab small { display: block; margin-top: 3px; font: 500 11px/1.4 var(--mono); color: var(--muted); }

.track-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.track-switch { display: inline-flex; gap: 4px; padding: 4px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); }
.track-btn { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px 8px 10px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--ink-2); text-align: left; }
.track-btn .icon { font-size: 20px; color: var(--muted); }
.track-btn b { display: block; font: 600 14px/1.2 var(--sans); }
.track-btn small { display: block; font: 500 11px/1.4 var(--mono); color: var(--muted); }
.track-btn.on { background: var(--field); color: var(--ink); border-color: var(--line-2); }
.track-btn.open.on .icon { color: var(--open); } .track-btn.fine.on .icon { color: var(--fine); }
.text-link { display: inline-flex; align-items: center; gap: 6px; }

.summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.sum-card { display: grid; gap: 8px; align-content: start; padding: 16px 18px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel) var(--dots) 0 0 / 14px 14px; min-width: 0; }
.sum-label { display: inline-flex; align-items: center; gap: 7px; font: 500 12px/1.4 var(--mono); color: var(--muted); }
.sum-label .icon { font-size: 15px; }
.sum-card.lead .sum-label .icon { color: var(--accent); }
.sum-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sum-main b { font: 500 clamp(22px, 2.2vw, 30px)/1.1 var(--mono); letter-spacing: -.02em; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sum-card.lead .sum-main b { font-family: var(--sans); font-weight: 700; letter-spacing: -.02em; }
.sum-card small { font-size: 12.5px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.lab-tile { display: grid; place-items: center; width: 34px; height: 34px; flex: none; border-radius: 8px; overflow: hidden; background: var(--field); font: 600 13px/1 var(--mono); color: var(--ink-2); }
.lab-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lab-tile.contain img { object-fit: contain; padding: 4px; }

.board { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); overflow: hidden; }
.board-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.search { display: inline-flex; align-items: center; gap: 8px; flex: 1 1 240px; max-width: 360px; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 8px; background: var(--paper); color: var(--muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; padding: 9px 0; color: var(--ink); font: 400 14px/1.3 var(--sans); outline: none; }
.chips { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.chips button { padding: 7px 11px; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--ink-2); font: 500 12.5px/1 var(--sans); }
.chips button small { color: var(--muted); font-size: 11px; }
.chips button:hover { background: var(--raised); color: var(--ink); }
.chips button.on { background: var(--field); border-color: var(--line-2); color: var(--ink); }
.toggle { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; font: 500 12.5px/1 var(--sans); color: var(--ink-2); }
.toggle input { accent-color: var(--accent); margin: 0; }
.count { margin-left: auto; font: 500 12px/1.4 var(--mono); color: var(--muted); white-space: nowrap; }

.rows { display: grid; }
.row { display: grid; grid-template-columns: 44px minmax(220px, 1.4fr) minmax(200px, 1.6fr) minmax(150px, 1fr) minmax(120px, .7fr) 40px; gap: 14px; align-items: center; padding: 11px 18px; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.row:not(.head):hover { background: var(--raised); }
.row.head { padding: 8px 18px; background: var(--raised); font: 500 11.5px/1.4 var(--mono); color: var(--muted); position: sticky; top: 54px; z-index: 2; }
.row.head > * { text-align: left; }
.row.head .num { text-align: right; }
.sortable { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; padding: 0; color: inherit; font: inherit; }
.sortable small { color: var(--ink-4); }
.sortable .icon { font-size: 13px; opacity: .55; }
.sortable.on { color: var(--ink); } .sortable.on .icon { opacity: 1; color: var(--accent); }
.rank { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--line-2); font: 600 13px/1 var(--mono); color: var(--ink-2); font-variant-numeric: tabular-nums; }
.rank.r1 { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.rank.r2, .rank.r3 { background: var(--field); color: var(--ink); }
.who { display: flex; align-items: center; gap: 12px; min-width: 0; }
.who-text { display: grid; gap: 2px; min-width: 0; }
.who b { display: flex; align-items: center; gap: 6px; font: 600 14.5px/1.25 var(--sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.who small { font: 400 12px/1.4 var(--mono); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hf { color: var(--muted); display: inline-flex; font-size: 13px; } .hf:hover { color: var(--accent); }
.metric { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; min-width: 0; }
.bar { position: relative; height: 10px; border-radius: 3px; background: var(--field); overflow: visible; }
.bar .ci { position: absolute; top: 2px; bottom: 2px; left: var(--lo); width: var(--span); border-radius: 2px; background: var(--open); opacity: .5; }
.bar .pt { position: absolute; top: -3px; width: 3px; height: 16px; left: var(--at); margin-left: -1.5px; border-radius: 1px; background: var(--open); }
.pctbar .fill { position: absolute; left: 0; top: 0; bottom: 0; width: var(--at); border-radius: 3px; background: var(--fine); }
.pctbar .ci { background: #fff; opacity: .35; } .pctbar .pt { background: #fff; }
.pctbar.progress .fill { background: var(--fine-line); }
.val { display: grid; justify-items: end; min-width: 76px; }
.val b { font: 500 15px/1.1 var(--mono); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.val em { font: 400 11px/1.4 var(--mono); font-style: normal; color: var(--muted); white-space: nowrap; }
.record { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.wtl { display: flex; height: 8px; gap: 1px; border-radius: 3px; overflow: hidden; }
.wtl i { display: block; min-width: 1px; } .wtl .w { background: var(--good); } .wtl .t { background: var(--line-2); } .wtl .l { background: var(--bad); opacity: .8; }
.num { display: grid; justify-items: end; text-align: right; }
.num b { font: 500 15px/1.1 var(--mono); font-variant-numeric: tabular-nums; }
.num em { font: 400 11px/1.4 var(--mono); font-style: normal; color: var(--muted); }
.minis { display: flex; align-items: flex-end; gap: 2px; height: 16px; margin-top: 4px; }
.minis i { display: block; width: 6px; height: var(--h); border-radius: 1px; background: var(--fine); opacity: .7; }
.actions a { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--line); color: var(--muted); }
.actions a:hover { color: var(--accent); border-color: var(--accent-line); }
.row.faint .who, .row.faint .metric, .row.faint .record { opacity: .55; }
.row.pending .who-text b { color: var(--ink-2); }
.row.lead .who b { color: var(--ink); }
.board-foot { padding: 12px 18px; border-top: 1px solid var(--line); font: 400 12.5px/1.6 var(--sans); color: var(--muted); }
.state { padding: 40px 20px; text-align: center; color: var(--muted); }
.state h3 { margin: 0 0 8px; font: 600 16px/1.3 var(--sans); color: var(--ink); }
.state p { margin: 0 0 16px; font-size: 14px; }
.skel { display: inline-block; min-width: 3ch; color: transparent !important; background: var(--field); border-radius: 3px; animation: skel 1.4s ease-in-out infinite; }
@keyframes skel { 50% { opacity: .5; } }

.figure-panel { border: 1px solid var(--line); border-radius: 12px; background: var(--panel) var(--dots) 0 0 / 14px 14px; padding: 18px 20px 8px; }
.panel-head h2 { font: 700 20px/1.2 var(--sans); letter-spacing: -.02em; }
.panel-head p { margin: 6px 0 0; font-size: 13.5px; color: var(--ink-2); max-width: 70ch; }
.figure { margin-top: 6px; min-height: 240px; }
.definitions { display: grid; gap: 4px; }
.definitions h2 { font: 700 18px/1.3 var(--sans); margin-bottom: 6px; }
.definitions details { border-top: 1px solid var(--line); }
.definitions summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; cursor: pointer; list-style: none; font: 600 14.5px/1.3 var(--sans); color: var(--ink); }
.definitions summary::-webkit-details-marker { display: none; }
.definitions summary .icon { color: var(--muted); transition: transform .15s; }
.definitions details[open] summary .icon { transform: rotate(180deg); }
.definitions p { margin: 0 0 14px; font-size: 14px; color: var(--ink-2); max-width: 78ch; }

@media (max-width: 1100px) { .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .row { grid-template-columns: 40px minmax(180px, 1.4fr) minmax(160px, 1.6fr) minmax(130px, 1fr) minmax(90px, .7fr) 36px; gap: 10px; } }
@media (max-width: 900px) { .body-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); } .row.head { position: static; } .row { grid-template-columns: 36px minmax(0, 1fr) 36px; grid-template-areas: "rank who actions" ". metric metric" ". record record" ". num num"; row-gap: 8px; } .row > .rank { grid-area: rank; } .row > .who { grid-area: who; } .row > .actions { grid-area: actions; } .row > .metric:nth-of-type(1) { grid-area: metric; } .row > .record, .row > .metric:nth-of-type(2) { grid-area: record; } .row > .num { grid-area: num; justify-items: start; text-align: left; } .row.head { display: none; } .lb-head { flex-direction: column; align-items: flex-start; } }
@media (max-width: 600px) { .summary { grid-template-columns: minmax(0, 1fr); } .body-tabs { grid-template-columns: minmax(0, 1fr); } .track-switch { width: 100%; } .track-btn { flex: 1; } }
</style>
