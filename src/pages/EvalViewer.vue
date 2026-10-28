<template>
  <div class="page-stack ev-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Evaluations</p>
        <h1>{{ robot.name }}<span class="h1-sub"> · {{ track === 'open' ? 'Open track' : 'Fine-tune track' }}</span></h1>
        <p class="lede">{{ track === 'open' ? 'Every finalized blind comparison on this robot: both runs, the instruction the evaluator wrote, their pick and their note.' : 'Every scored trial on this robot\'s Fine-tune track tasks, with the recording of each attempt.' }}</p>
      </div>
      <span class="live-tag"><i></i>Live from the API</span>
    </section>

    <BoardControls open-label="Judged blind" fine-label="Scored trials"><RouterLink class="text-link" :to="link('/leaderboard')">See the leaderboard <Icon name="external" /></RouterLink></BoardControls>

    <FineTuneReview v-if="track === 'fine-tuning'" :robot-id="robot.id" :robot-name="robot.name" />
    <template v-else>
      <section v-if="summary" class="summary" aria-label="Summary">
        <article class="sum-card"><span class="sum-label"><Icon name="ab" />Comparisons</span><div class="sum-main"><b>{{ fmt(summary.total) }}</b></div><small>on {{ robot.name }}, judged blind by people</small></article>
        <article class="sum-card"><span class="sum-label"><Icon name="pulse" />Latest comparison</span><div class="sum-main"><b>{{ summary.latestAgo }}</b></div><small>{{ summary.latestScene }}</small></article>
        <article class="sum-card"><span class="sum-label"><Icon name="trend-up" />Picked a side</span><div class="sum-main"><b>{{ pct(summary.decided) }}</b></div><span class="split" :title="`${summary.a} preferred A · ${summary.tie} ties · ${summary.b} preferred B`"><i style="background:var(--ink)" :style="{ flexGrow: summary.a }"></i><i style="background:var(--line-2)" :style="{ flexGrow: summary.tie }"></i><i style="background:var(--ink-4)" :style="{ flexGrow: summary.b }"></i></span><small>{{ fmt(summary.a) }} A · {{ fmt(summary.tie) }} ties · {{ fmt(summary.b) }} B</small></article>
        <article class="sum-card"><span class="sum-label"><Icon name="grid" />Scenes</span><div class="sum-main"><b>{{ fmt(summary.rooms) }}</b></div><small>{{ fmt(summary.evaluators) }} evaluators · {{ fmt(summary.policies) }} policies</small></article>
      </section>

      <section class="board">
        <div class="board-toolbar">
          <label class="search"><Icon name="search" /><input v-model="query" type="search" placeholder="Filter by instruction, scene, policy or evaluator" aria-label="Filter evaluations" /></label>
          <div class="chips" role="group" aria-label="Verdict">
            <button v-for="opt in verdictOptions" :key="opt.id" type="button" :class="{ on: verdictFilter === opt.id }" @click="verdictFilter = opt.id">{{ opt.label }}</button>
            <button v-if="policyFilter" type="button" class="on" @click="clearPolicy">{{ policyFilter }} ×</button>
          </div>
          <span class="count">{{ filtered.length }} of {{ scoped.length }} comparisons</span>
          <button class="button secondary" type="button" @click="loadEvaluations"><Icon name="pulse" /> Refresh</button>
        </div>

        <div v-if="loading" class="state"><span class="skel" style="min-width:30ch">&nbsp;</span></div>
        <div v-else-if="unavailable" class="state"><h3>Evaluations are temporarily unavailable</h3><p>The API did not answer. Try again in a moment.</p><button class="button secondary" type="button" @click="loadEvaluations">Try again</button></div>
        <div v-else-if="!filtered.length" class="state"><h3>{{ hasFilters ? 'No comparisons match' : 'No finalized comparisons on this robot yet' }}</h3><p>Comparisons appear here as soon as an evaluator finalizes a pick.</p><button v-if="hasFilters" class="button secondary" type="button" @click="clearFilters">Clear filters</button></div>

        <div v-else class="ev-layout">
          <ol class="feed" aria-label="Evaluations">
            <li v-for="item in filtered" :key="item.id">
              <button type="button" :class="['feed-item', { on: selected?.id === item.id }]" :aria-pressed="selected?.id === item.id" @click="selected = item">
                <span class="feed-top"><time :datetime="item.evalTime || item.date">{{ ago(item.evalTime || item.date) }}</time><span :class="['verdict', verdictClass(item)]">{{ verdictLabel(item) }}</span></span>
                <b>{{ item.instruction || item.task }}</b>
                <small>{{ policyName(item.policyA) }} <i>vs</i> {{ policyName(item.policyB) }}{{ item.scene ? ` · ${item.scene}` : '' }}</small>
              </button>
            </li>
          </ol>
          <section v-if="selected" class="review" aria-live="polite">
            <EvalCard :evaluation="selected" :robot-name="robot.name" />
            <EvalVideoReview :evaluation="selected" />
          </section>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FineTuneReview from '../components/FineTuneReview.vue'
import EvalCard from '../components/EvalCard.vue'
import EvalVideoReview from '../components/EvalVideoReview.vue'
import BoardControls from '../components/BoardControls.vue'
import Icon from '../components/Icon.vue'
import { policyName } from '../display.js'
import { useArena } from '../arena.js'
import { getEvaluations } from '../api.js'
import { fmt, pct } from '../labs.js'

const route = useRoute()
const { robot, track, link } = useArena()
const evaluations = ref([]), selected = ref(null), loading = ref(false), unavailable = ref(false)
const query = ref(''), verdictFilter = ref('all')
const policyFilter = computed(() => String(route.query.policy || ''))
const verdictOptions = [{ id: 'all', label: 'All' }, { id: 'A', label: 'Picked A' }, { id: 'B', label: 'Picked B' }, { id: 'tie', label: 'Ties' }]

const verdictOf = e => { const p = e.preference || e.pref || e.winner; return p === 'A' || p === 'B' ? p : 'tie' }
const verdictLabel = e => ({ A: 'Picked A', B: 'Picked B', tie: 'Tie' })[verdictOf(e)]
const verdictClass = e => (e.test ? 'test' : verdictOf(e) === 'tie' ? '' : 'pref')
const ago = iso => { if (!iso) return '—'; const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : m < 60 * 24 * 30 ? `${Math.round(m / 1440)} d ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }

const scoped = computed(() => evaluations.value.filter(e => e.finalized && !e.test && e.robotId === robot.value.id && (e.track || 'open') === 'open')
  .sort((a, b) => String(b.evalTime || b.date || '').localeCompare(String(a.evalTime || a.date || ''))))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase(), pf = policyFilter.value.toLowerCase()
  return scoped.value.filter(e => (verdictFilter.value === 'all' || verdictOf(e) === verdictFilter.value)
    && (!pf || policyName(e.policyA).toLowerCase() === pf || policyName(e.policyB).toLowerCase() === pf)
    && (!q || `${e.instruction || ''} ${e.task || ''} ${e.scene || ''} ${e.evaluator || ''} ${e.policyA || ''} ${e.policyB || ''} ${e.institution || ''}`.toLowerCase().includes(q)))
})
const hasFilters = computed(() => Boolean(query.value || verdictFilter.value !== 'all' || policyFilter.value))
function clearFilters() { query.value = ''; verdictFilter.value = 'all'; clearPolicy() }
function clearPolicy() { if (policyFilter.value) history.replaceState(null, '', location.pathname + location.search.replace(/([?&])policy=[^&]*&?/, '$1').replace(/[?&]$/, '')); }

const summary = computed(() => {
  const rows = scoped.value
  if (!rows.length) return null
  const a = rows.filter(e => verdictOf(e) === 'A').length, b = rows.filter(e => verdictOf(e) === 'B').length, tie = rows.length - a - b
  const latest = rows[0]
  return { total: rows.length, a, b, tie, decided: (a + b) / rows.length * 100, latestAgo: ago(latest.evalTime || latest.date), latestScene: latest.scene || 'scene not recorded',
    rooms: new Set(rows.map(e => (e.scene || '').trim().toLowerCase()).filter(Boolean)).size, evaluators: new Set(rows.map(e => e.evaluator).filter(Boolean)).size,
    policies: new Set(rows.flatMap(e => [policyName(e.policyA), policyName(e.policyB)]).filter(Boolean)).size }
})

watch(filtered, items => { if (!items.some(i => i.id === selected.value?.id)) selected.value = items[0] || null })
async function loadEvaluations() {
  loading.value = true
  try {
    const data = await getEvaluations()
    unavailable.value = data.source === 'empty'
    evaluations.value = Array.isArray(data.evaluations) ? data.evaluations : []
  } catch (error) { unavailable.value = true } finally { loading.value = false }
}
onMounted(loadEvaluations)
</script>

<style scoped>
.ev-page { gap: 22px; }
.board-toolbar .button { margin-left: 0; gap: 6px; min-height: 36px; padding: 6px 12px; font-size: 13px; }
.ev-layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 0; align-items: start; }
.feed { list-style: none; margin: 0; padding: 8px; display: grid; gap: 2px; max-height: calc(100vh - 140px); overflow-y: auto; border-right: 1px solid var(--line-2); position: sticky; top: 64px; }
.feed-item { display: grid; gap: 6px; width: 100%; padding: 12px 12px 12px 14px; border: 1px solid transparent; background: transparent; text-align: left; color: var(--ink); }
.feed-item:hover { background: var(--raised); }
.feed-item.on { background: var(--raised); border-color: var(--ink); box-shadow: inset 3px 0 0 var(--accent); }
.feed-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.feed-top time { font: 700 11px/1.4 var(--mono); text-transform: uppercase; color: var(--muted); }
.feed-item b { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font: 600 15px/1.35 var(--sans); }
.feed-item small { font: 400 11.5px/1.4 var(--mono); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-item small i { font-style: normal; color: var(--ink-4); }
.review { display: grid; gap: 16px; padding: 18px; min-width: 0; }
@media (max-width: 980px) { .ev-layout { grid-template-columns: minmax(0, 1fr); } .feed { position: static; max-height: 300px; border-right: 0; border-bottom: 1px solid var(--line); } }
</style>
