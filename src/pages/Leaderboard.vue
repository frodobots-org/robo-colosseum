<template>
  <div class="page-stack">
    <section class="page-header"><h1>Leaderboards</h1></section>
    <ArenaControls />
    <section class="results-panel">
      <div class="results-heading">
        <div><p class="eyebrow">{{ robot.name }} / {{ track === 'open' ? 'OPEN TRACK' : 'FINE-TUNING TRACK' }}</p><h2>{{ track === 'open' ? 'Policy standings' : 'Task adaptation results' }}</h2></div>
      </div>
      <div class="results-toolbar">
        <label class="search-field"><span class="sr-only">Search policy</span><input v-model="query" type="search" placeholder="Search policies…" /></label>
        <label v-if="track === 'open'">Comparisons<select v-model.number="minEvals" aria-label="Comparisons"><option :value="0">All counts</option><option :value="50">50+</option><option :value="100">100+</option></select></label>
        <label v-else>Task<select v-model="taskId" aria-label="Task"><option value="">All tasks</option><option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.name }}</option></select></label>
        <span class="micro result-count">{{ filteredRows.length }} {{ track === 'open' ? 'policies' : 'task / policy entries' }}</span>
      </div>
      <div v-if="loading" class="empty-state" role="status">Loading results…</div>
      <div v-else-if="apiUnavailable" class="empty-state"><h3>Results are temporarily unavailable</h3><p>Please try again later.</p><button class="button secondary" @click="fetchResults">Try again</button></div>
      <div v-else-if="!filteredRows.length" class="empty-state">
        <span class="empty-icon">▤</span><h3>{{ hasFilters ? 'No matching policies' : 'No policies for this selection yet' }}</h3>
        <p>Policies appear when registered or when completed evaluations are published.</p>
        <button v-if="hasFilters" class="button secondary" @click="clearFilters">Clear filters</button>
      </div>
      <div v-else class="table-wrap arena-table-wrap">
        <table class="leaderboard-table">
          <caption class="sr-only">{{ robot.name }} {{ track }} leaderboard</caption>
          <thead><tr>
            <th scope="col">Rank</th><th v-if="track === 'fine-tuning'" scope="col">Task</th><th scope="col">Policy</th>
            <template v-if="track === 'open'"><th scope="col">Rating ↓</th><th scope="col">Std. error</th><th scope="col">A/B comparisons</th></template>
            <template v-else><th scope="col">Success rate ↓</th><th scope="col">Milestone progress</th><th scope="col">Trials</th></template>
          </tr></thead>
          <tbody><tr v-for="row in filteredRows" :key="row.id">
            <td><span :class="['standing-rank', { first: row.rank === 1 }]">{{ row.rank == null ? '—' : String(row.rank).padStart(2, '0') }}</span></td>
            <td v-if="track === 'fine-tuning'" class="task-name">{{ taskName(row) }}</td>
            <td>
              <strong class="policy-name">{{ policyName(row.policyId || row.policy) }}</strong>
              <small class="policy-org" :data-status="row.status">{{ row.status === 'pending' ? 'Pending evaluation' : 'Evaluated' }}</small>
            </td>
            <template v-if="track === 'open'">
              <td><strong class="score-number">{{ number(row.score) }}</strong></td><td class="muted">{{ number(row.std ?? row.sd) }}</td><td>{{ row.num_evals ?? row.evals ?? '—' }}</td>
            </template>
            <template v-else>
              <td><div class="success-cell"><strong>{{ percent(row.successRate) }}</strong><span v-if="row.successRate != null" class="success-meter" aria-hidden="true"><span :style="{ width: `${Math.min(100, Math.max(0, row.successRate))}%` }"></span></span></div></td>
              <td>{{ percent(row.progress) }}</td><td>{{ row.trials ?? '—' }}</td>
            </template>
          </tr></tbody>
        </table>
      </div>
      <div class="table-footnote">
        <span>{{ track === 'open' ? 'Higher rating indicates stronger pairwise performance. Pending policies are unranked.' : 'Rankings are calculated within each task. Pending checkpoints are unranked.' }}</span>
        <RouterLink :to="link('/evals')">{{ track === 'open' ? 'Review A/B evaluations ↗' : 'Review trials ↗' }}</RouterLink>
      </div>
    </section>
    <details class="method-details">
      <summary>How to read this leaderboard <span>+</span></summary>
      <p v-if="track === 'open'">Policies are ranked by head-to-head performance on the same robot. Higher ratings indicate stronger performance. Standard error shows rating uncertainty; a higher rank alone does not prove a meaningful difference. Registered policies without completed comparisons appear as pending, with no rating or rank.</p>
      <p v-else>Each task and model checkpoint is scored separately using completed, non-test trials. Success rate is the percentage of successful trials. Milestone progress is the average partial completion. Registered checkpoints without completed trials appear as pending, with no score or rank.</p>
    </details>
  </div>
</template>
<script setup>
import { policyName } from '../display.js'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ArenaControls from '../components/ArenaControls.vue'
import { useArena } from '../arena.js'
import { getLeaderboard } from '../api.js'

const { robot, track, link } = useArena()
const query = ref(''), minEvals = ref(0), taskId = ref('')
const apiRows = ref([]), loading = ref(false), apiUnavailable = ref(false)
let requestController

function number(value) { return value != null && Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—' }
function percent(value) { return value == null ? '—' : `${number(value)}%` }
function taskName(row) { return String(row.task || row.taskId || '').replaceAll('_', ' ') }
function clearFilters() { query.value = ''; minEvals.value = 0; taskId.value = '' }
const hasFilters = computed(() => Boolean(query.value || minEvals.value || taskId.value))
const tasks = computed(() => Array.from(new Map(apiRows.value.map(row => [row.taskId, { id: row.taskId, name: taskName(row) }])).values()).sort((a, b) => a.name.localeCompare(b.name)))
const filteredRows = computed(() => {
  const search = query.value.trim().toLowerCase()
  return apiRows.value.filter(row => row.robotId === robot.value.id && row.track === track.value
    && `${row.policy} ${row.modelUrl || ''}`.toLowerCase().includes(search)
    && (track.value === 'open' ? Number(row.num_evals ?? row.evals ?? 0) >= minEvals.value : !taskId.value || row.taskId === taskId.value))
    .sort((a, b) => (track.value === 'fine-tuning' ? taskName(a).localeCompare(taskName(b)) || a.taskId.localeCompare(b.taskId) : 0)
      || (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.policy.localeCompare(b.policy))
})
async function fetchResults() {
  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  loading.value = true
  apiUnavailable.value = false
  apiRows.value = []
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
watch([() => robot.value.id, track], () => { clearFilters(); fetchResults() }, { immediate: true })
onBeforeUnmount(() => requestController?.abort())
</script>
<style scoped>
.task-name { min-width: 110px; }
</style>
