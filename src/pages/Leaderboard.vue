<template>
  <div class="page-stack">
    <section class="page-header"><h1>Leaderboards</h1></section>
    <ArenaControls />
    <section class="results-panel">
      <div class="results-heading"><div><p class="eyebrow">{{ robot.name }} / {{ track === 'open' ? 'OPEN TRACK' : 'FINE-TUNING TRACK' }}</p><h2>{{ track === 'open' ? 'Policy standings' : 'Task adaptation results' }}</h2></div></div>
      <div class="results-toolbar"><label class="search-field"><span class="sr-only">Search policy</span><input v-model="query" type="search" placeholder="Search policies…" /></label><label v-if="track === 'open'">Comparisons<select v-model.number="minEvals"><option :value="0">All counts</option><option :value="50">50+</option><option :value="100">100+</option></select></label><span class="micro result-count">{{ filteredRows.length }} policies</span></div>
      <div v-if="loading" class="empty-state" role="status">Loading results…</div>
      <div v-else-if="apiUnavailable" class="empty-state"><h3>Results are temporarily unavailable</h3><p>Please try again later.</p><button class="button secondary" @click="fetchResults">Try again</button></div>
      <div v-else-if="!filteredRows.length" class="empty-state"><span class="empty-icon">▤</span><h3>{{ query || minEvals ? 'No matching policies' : 'No results for this selection yet' }}</h3><p>Results will appear here when evaluations for this robot and track are published.</p><button v-if="query || minEvals" class="button secondary" @click="query = ''; minEvals = 0">Clear filters</button></div>
      <div v-else class="table-wrap arena-table-wrap"><table class="leaderboard-table"><caption class="sr-only">{{ robot.name }} {{ track }} leaderboard</caption><thead><tr><th scope="col">Rank</th><th scope="col">Policy</th><template v-if="track === 'open'"><th scope="col">Rating ↓</th><th scope="col">Std. error</th><th scope="col">A/B comparisons</th></template><template v-else><th scope="col">Success rate ↓</th><th scope="col">Milestone progress</th><th scope="col">Trials</th></template></tr></thead><tbody><tr v-for="(row, i) in filteredRows" :key="row.policy"><td><span :class="['standing-rank', { first: i === 0 }]">{{ i + 1 < 10 ? '0' : '' }}{{ i + 1 }}</span></td><td><strong class="policy-name">{{ policyName(row.policy) }}</strong><small class="policy-org">{{ row.org || 'Submitted policy' }}</small></td><template v-if="track === 'open'"><td><strong class="score-number">{{ number(row.score) }}</strong></td><td class="muted">{{ number(row.std ?? row.sd) }}</td><td>{{ row.num_evals ?? row.evals ?? '—' }}</td></template><template v-else><td><div class="success-cell"><strong>{{ number(row.successRate) }}%</strong><span class="success-meter"><span :style="{ width: `${Math.min(100, Math.max(0, row.successRate))}%` }"></span></span></div></td><td>{{ row.progress == null ? '—' : `${number(row.progress)}%` }}</td><td>{{ row.trials ?? '—' }}</td></template></tr></tbody></table></div>
      <div class="table-footnote"><span>{{ track === 'open' ? 'Higher rating indicates stronger pairwise performance.' : 'Success and progress are reported separately.' }}</span><RouterLink v-if="track === 'open'" :to="link('/evals')">Review A/B evaluations ↗</RouterLink></div>
    </section>
    <details class="method-details"><summary>How to read this leaderboard <span>+</span></summary><p v-if="track === 'open'">Policies are ranked by head-to-head performance on the same robot. Higher ratings indicate stronger performance. Standard error shows rating uncertainty; a higher rank alone does not prove a meaningful difference.</p><p v-else>Success rate measures completed tasks. Milestone progress shows partial completion. Results appear when evaluations for this track are published.</p></details>
  </div>
</template>
<script setup>
import { policyName } from '../display.js'
import { computed, onMounted, ref, watch } from 'vue'
import ArenaControls from '../components/ArenaControls.vue'
import { useArena } from '../arena.js'
import { getLeaderboard } from '../api.js'
const { robot, track, link } = useArena()
const query = ref(''), minEvals = ref(0), apiRows = ref([]), loading = ref(false), apiUnavailable = ref(false)
function number(value) { return value != null && Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—' }
const filteredRows = computed(() => {
  const rows = apiRows.value.filter(r => r.robotId === robot.value.id && (r.track || 'open') === track.value)
  return rows.filter(r => r.policy?.toLowerCase().includes(query.value.trim().toLowerCase()) && (track.value !== 'open' || Number(r.num_evals ?? r.evals ?? 0) >= minEvals.value)).slice().sort((a, b) => Number(track.value === 'open' ? b.score : b.successRate) - Number(track.value === 'open' ? a.score : a.successRate))
})
async function fetchResults() { loading.value = true; apiUnavailable.value = false; try { const data = await getLeaderboard(); apiRows.value = Array.isArray(data.board) ? data.board : []; apiUnavailable.value = data.source === 'empty' } finally { loading.value = false } }
watch(track, () => { minEvals.value = 0 })
onMounted(fetchResults)
</script>
