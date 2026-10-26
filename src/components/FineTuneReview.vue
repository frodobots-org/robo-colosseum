<template>
  <div class="fine-review">
    <section v-if="stats" class="summary" aria-label="Summary">
      <article class="sum-card"><span class="sum-label"><Icon name="trials" />Scored trials</span><div class="sum-main"><b>{{ fmt(stats.total) }}</b></div><small>on {{ robotName }}{{ datasetTotal ? ` · ${fmt(datasetTotal)} imported datasets` : '' }}</small></article>
      <article class="sum-card"><span class="sum-label"><Icon name="trophy" />Full successes</span><div class="sum-main"><b>{{ pct(stats.rate) }}</b></div><span class="split" :title="`${stats.successes} successes · ${stats.failures} failures`"><i style="background:var(--good)" :style="{ flexGrow: stats.successes }"></i><i style="background:var(--bad)" :style="{ flexGrow: stats.failures }"></i></span><small>{{ fmt(stats.successes) }} of {{ fmt(stats.total) }} trials</small></article>
      <article class="sum-card"><span class="sum-label"><Icon name="trend-up" />Average progress</span><div class="sum-main"><b>{{ pct(stats.progress) }}</b></div><small>partial success, all trials</small></article>
      <article class="sum-card"><span class="sum-label"><Icon name="grid" />Checkpoints</span><div class="sum-main"><b>{{ fmt(stats.policies) }}</b></div><small>{{ fmt(stats.tasks) }} tasks</small></article>
    </section>

    <section class="board">
      <div class="board-toolbar">
        <label class="search"><Icon name="search" /><input v-model="query" type="search" placeholder="Filter by checkpoint or task" aria-label="Filter trials" /></label>
        <div class="chips" role="group" aria-label="Outcome">
          <button v-for="opt in outcomeOptions" :key="opt.id" type="button" :class="{ on: outcomeFilter === opt.id }" @click="outcomeFilter = opt.id">{{ opt.label }}</button>
        </div>
        <span class="count">{{ filtered.length }} of {{ entries.length }} shown</span>
        <button class="button secondary" type="button" @click="loadTrials"><Icon name="pulse" /> Refresh</button>
      </div>
      <p v-if="error" class="state"><b>{{ error }}</b></p>
      <p v-else-if="datasetError" class="board-foot" role="alert">{{ datasetError }}</p>
      <div v-if="loading" class="state"><span class="skel" style="min-width:30ch">&nbsp;</span></div>
      <div v-else-if="!error && !filtered.length" class="state"><h3>{{ query || outcomeFilter ? 'No trials match' : 'No scored trials on this body yet' }}</h3><p>Completed fine-tuning trials and published datasets appear here as they finish.</p><button v-if="query || outcomeFilter" class="button secondary" type="button" @click="query = ''; outcomeFilter = ''">Clear filters</button></div>
      <div v-else-if="!error" class="ev-layout">
        <ol class="feed" aria-label="Fine-tuning evaluations">
          <li v-for="trial in filtered" :key="trial.entryId">
            <button type="button" :class="['feed-item', { on: selectedId === trial.entryId }]" :aria-pressed="selectedId === trial.entryId" @click="selectEntry(trial)">
              <span class="feed-top"><time :datetime="trial.created" :title="trial.kind === 'dataset' ? 'Import date' : 'Evaluation date'">{{ ago(trial.created) }}</time><span v-if="trial.kind === 'dataset'" class="verdict">{{ trial.summary.episodes }} episode{{ trial.summary.episodes === 1 ? '' : 's' }}</span><span v-else :class="['verdict', outcome(trial)]">{{ outcomeLabel(trial) }}</span></span>
              <b>{{ trial.kind === 'dataset' ? registeredModelName(trial) : policyName(trial.policy_id) }}</b>
              <small>{{ taskLabel(trial.task.instruction) }}</small>
            </button>
          </li>
        </ol>
        <div class="review">
          <ImportedEvaluationFeed v-if="selectedEntry?.kind === 'dataset'" :key="selectedEntry.datasetId" :dataset-id="selectedEntry.datasetId" :model-name="registeredModelName(selectedEntry)" :robot-id="robotId" />
          <article v-else-if="selected" class="trial-card" aria-live="polite">
            <header class="tc-head">
              <span class="tc-meta"><b>{{ robotName }}</b> · fine-tuning{{ selected.inference_mode === 'imported' ? ' · imported' : '' }}</span>
              <span class="tc-meta right"><span v-if="selected.test" class="verdict test">Test</span><time :datetime="selected.created">{{ dateLabel(selected.created) }}</time></span>
            </header>
            <div class="tc-who"><span class="lab-tile" :class="{ contain: lab(selected).fit === 'contain' }" :style="{ background: lab(selected).bg || '' }"><img v-if="lab(selected).logo" :src="lab(selected).logo" :alt="lab(selected).name" @error="e => e.target.remove()"><template v-else>{{ lab(selected).mono }}</template></span><div><h2>{{ policyName(selected.policy_id) }}</h2><small>{{ lab(selected).name }}</small></div></div>
            <blockquote class="tc-task">“{{ taskLabel(selected.task.instruction) }}”</blockquote>
            <div class="tc-result">
              <div class="tc-outcome"><span :class="['verdict big', outcome(selected)]">{{ outcomeLabel(selected) }}</span><small v-if="selected.reason">{{ selected.reason }}</small></div>
              <div class="tc-score"><span>{{ hasSourceScore ? 'Score' : 'Partial success' }}</span><b>{{ hasSourceScore ? sourceScore + ' / 4' : percent(selected.partial_success) }}</b><span class="prog"><i :class="outcome(selected)" :style="{ width: Math.round((selected.partial_success || 0) * 100) + '%' }"></i></span></div>
              <div class="tc-episode"><span>Episode</span><b>1 of 1</b></div>
            </div>
            <div v-if="selected.inference_mode !== 'imported'" class="kv tc-kv">
              <div><span>Initial setup</span><b>{{ selected.task.setup || '—' }}</b></div>
              <div><span>Success criterion</span><b>{{ selected.task.success_criteria || '—' }}</b></div>
              <div><span>Progress criterion</span><b>{{ selected.task.partial_success_criteria || '—' }}</b></div>
            </div>
            <div v-if="selected.feedback" class="tc-note"><span>Evaluator's note</span><p>{{ selected.feedback }}</p></div>
            <section class="tc-videos" aria-label="Videos">
              <p v-if="videoError" class="tc-error" role="alert">{{ videoError }}</p>
              <div class="trial-videos">
                <figure v-for="camera in selected.task.cameras" :key="`${selected.run_id}-${camera}`" class="review-camera">
                  <video v-if="videos[camera]" :key="videos[camera]" :src="videos[camera]" controls playsinline preload="metadata" :style="{ aspectRatio: robotId === 'so101' ? '4 / 3' : '16 / 9' }" @error="videoError = 'Video could not be loaded. Refresh the page to try again.'"></video>
                  <div v-else class="review-video-placeholder" :style="{ aspectRatio: robotId === 'so101' ? '4 / 3' : '16 / 9' }">{{ videosLoading ? 'Loading…' : 'No video uploaded' }}</div>
                  <figcaption class="video-caption">{{ cameraLabel(camera) }}</figcaption>
                </figure>
              </div>
            </section>
          </article>
        </div>
      </div>
      <div v-if="!loading && datasets.length < datasetTotal" class="board-foot"><button class="button secondary" type="button" @click="loadMoreDatasets">Load more datasets ({{ datasets.length }} of {{ datasetTotal }})</button></div>
    </section>
  </div>
</template>

<script setup>
import { policyName, dateLabel } from '../display.js'
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImportedEvaluationFeed from './ImportedEvaluationFeed.vue'
import Icon from './Icon.vue'
import { labFor, fmt, pct } from '../labs.js'
import { getFineTuningReviews, getFineTuningVideoUrls, getImportedDatasets, getImportedDataset } from '../api.js'
const props = defineProps({ robotId: { type: String, required: true }, robotName: String })
const loading = ref(false), error = ref(''), trials = ref([])
const importedEpisodes = ref([])
const datasets = ref([]), datasetError = ref(''), datasetTotal = ref(0)
const route = useRoute(), router = useRouter()
const taskFilter = ref(''), outcomeFilter = ref(''), query = ref(''), selectedId = ref('')
const outcomeOptions = [{ id: '', label: 'All' }, { id: 'success', label: 'Success' }, { id: 'failure', label: 'Failure' }, { id: 'aborted', label: 'Interrupted' }]
const lab = trial => { const name = policyName(trial.policy_id); return labFor(name) || { name: 'Independent', mono: name.slice(0, 2).toUpperCase() } }
const ago = iso => { if (!iso) return '—'; const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : m < 60 * 24 * 30 ? `${Math.round(m / 1440)} d ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
const videos = ref({}), videosLoading = ref(false), videoError = ref('')
let trialRequest, videoRequest, moreRequest
const outcome = trial => trial.state === 'aborted' ? 'aborted' : trial.success == null ? 'unscored' : trial.success ? 'success' : 'failure'
const outcomeLabel = trial => ({ success: 'Success', failure: 'Failure', aborted: 'Interrupted', unscored: 'Not scored' })[outcome(trial)]
const percent = value => value === null || value === undefined ? 'Not scored' : `${Math.round(value * 100)}%`
const taskLabel = value => String(value || '').replaceAll('_', ' ')
const cameraLabel = camera => (props.robotId === 'so101' ? { head_image: 'Front', left_image: 'Wrist' } : { head_image: 'Head / overview', left_image: 'Left camera', right_image: 'Right camera' })[camera] || camera
function registeredModelName(dataset) {
  return policyName(importedEpisodes.value.find(e => e.datasetId === dataset.id && e.evaluation_link)?.evaluation_link.policy_id || dataset.model.name)
}
const entries = computed(() => {
  const linkedRuns = new Set(importedEpisodes.value.map(e => e.evaluation_link?.run_id).filter(Boolean))
  const originals = trials.value.filter(t => !linkedRuns.has(t.run_id))
  return [...datasets.value.map(d => ({ ...d, kind: 'dataset', datasetId: d.id, entryId: d.id })), ...originals.map(t => ({ ...t, kind: 'trial', entryId: t.run_id }))]
    .sort((a, b) => b.created.localeCompare(a.created))
})
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return entries.value.filter(e => (!outcomeFilter.value || (e.kind === 'trial' && outcome(e) === outcomeFilter.value))
    && (!q || `${e.kind === 'dataset' ? registeredModelName(e) : policyName(e.policy_id)} ${taskLabel(e.task?.instruction)}`.toLowerCase().includes(q))).slice(0, 60)
})
const stats = computed(() => {
  const rows = trials.value.filter(t => !t.test)
  if (!rows.length) return null
  const scored = rows.filter(t => t.success != null), successes = scored.filter(t => t.success).length
  const progress = rows.filter(t => t.partial_success != null)
  return { total: rows.length, successes, failures: scored.length - successes, rate: scored.length ? successes / scored.length * 100 : 0,
    progress: progress.length ? progress.reduce((a, t) => a + t.partial_success, 0) / progress.length * 100 : 0,
    policies: new Set(rows.map(t => policyName(t.policy_id))).size, tasks: new Set(rows.map(t => t.task?.instruction)).size }
})
async function expandDatasets(items, signal) {
  const details = await Promise.all(items.map(d => getImportedDataset(d.id, signal)))
  return details.flatMap(d => d.episodes.map(e => ({ ...e, kind: 'episode', entryId: `${d.id}:${e.episode_index}`,
    datasetId: d.id, task_id: d.task_id, task: d.task, model: d.model, source: d.source,
    created: d.created, recordedAt: e.source_result?.saved_at || '', state: 'completed' })))
}
const selectedEntry = computed(() => filtered.value.find(t => t.entryId === selectedId.value))
const selected = computed(() => selectedEntry.value?.kind === 'trial' ? selectedEntry.value : null)
const hasSourceScore = computed(() => props.robotId === 'so101' && selected.value?.inference_mode === 'imported')
const sourceScore = computed(() => selected.value?.partial_success == null ? '—' : Math.round(selected.value.partial_success * 400) / 100)
watch(filtered, rows => { if (!rows.some(t => t.entryId === selectedId.value)) selectedId.value = rows.find(t => route.query.dataset && t.datasetId === route.query.dataset)?.entryId || rows[0]?.entryId || '' })
function selectEntry(entry) {
  selectedId.value = entry.entryId
  if (entry.kind === 'trial') { const query = { ...route.query }; delete query.dataset; delete query.episode; router.replace({ query }) }
}
watch(selected, loadVideos)
watch(() => props.robotId, () => { trialRequest?.abort(); moreRequest?.abort(); loading.value = false; taskFilter.value = ''; outcomeFilter.value = ''; trials.value = []; datasets.value = []; importedEpisodes.value = []; datasetTotal.value = 0; loadTrials() })
async function loadTrials() {
  const previousSelection = selectedId.value
  trialRequest?.abort(); const request = trialRequest = new AbortController()
  loading.value = true; error.value = ''; datasetError.value = ''; moreRequest?.abort()
  try {
    const [reviews, imports] = await Promise.allSettled([getFineTuningReviews(props.robotId, request.signal), getImportedDatasets(props.robotId, request.signal)])
    if (request.signal.aborted) return false
    if (reviews.status === 'fulfilled') { trials.value = (reviews.value.trials || []).filter(trial => trial.state === 'completed') }
    else { trials.value = []; datasetError.value = reviews.reason.message }
    if (imports.status === 'fulfilled') {
      const episodes = await expandDatasets(imports.value.datasets, request.signal)
      if (request.signal.aborted) return false
      datasets.value = imports.value.datasets; datasetTotal.value = imports.value.total; importedEpisodes.value = episodes
    }
    else { datasets.value = []; importedEpisodes.value = []; datasetTotal.value = 0; if (imports.reason.status !== 404) datasetError.value = imports.reason.message }
    if (!previousSelection) selectedId.value = entries.value.find(t => route.query.dataset && t.datasetId === route.query.dataset)?.entryId || entries.value[0]?.entryId || ''
    return true
  } catch (err) {
    if (request.signal.aborted) return false
    error.value = err.message; return false
  } finally { if (trialRequest === request) loading.value = false }
}
async function loadMoreDatasets() {
  moreRequest?.abort(); const request = moreRequest = new AbortController()
  try {
    const data = await getImportedDatasets(props.robotId, request.signal, datasets.value.length)
    const episodes = await expandDatasets(data.datasets, request.signal)
    if (!request.signal.aborted) { datasets.value.push(...data.datasets); importedEpisodes.value.push(...episodes); datasetTotal.value = data.total }
  } catch (err) { if (!request.signal.aborted) datasetError.value = err.message }
}
async function loadVideos() {
  videoRequest?.abort(); videos.value = {}; videoError.value = ''; videosLoading.value = false
  if (!selected.value) return
  const request = videoRequest = new AbortController(); videosLoading.value = true
  try {
    const data = await getFineTuningVideoUrls(selected.value.run_id, request.signal)
    if (!request.signal.aborted) videos.value = data.videos || {}
  } catch (err) {
    if (!request.signal.aborted) videoError.value = err.message
  } finally { if (videoRequest === request) videosLoading.value = false }
}
onMounted(loadTrials)
onBeforeUnmount(() => { trialRequest?.abort(); videoRequest?.abort(); moreRequest?.abort() })
</script>

<style scoped>
.fine-review { display: grid; gap: 22px; }
.board-toolbar .button { margin-left: 0; gap: 6px; min-height: 36px; padding: 6px 12px; font-size: 13px; }
.verdict.success { background: var(--good-tint); color: var(--good); }
.verdict.failure { background: var(--bad-tint); color: var(--bad); }
.verdict.aborted { background: var(--warn-tint); color: var(--warn); }
.verdict.big { font-size: 13px; padding: 8px 12px; }
.ev-layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); align-items: start; }
.feed { list-style: none; margin: 0; padding: 8px; display: grid; gap: 4px; max-height: calc(100vh - 140px); overflow-y: auto; border-right: 1px solid var(--line); position: sticky; top: 64px; }
.feed-item { display: grid; gap: 6px; width: 100%; padding: 11px 12px; border: 1px solid transparent; border-radius: 9px; background: transparent; text-align: left; color: var(--ink); }
.feed-item:hover { background: var(--raised); }
.feed-item.on { background: var(--raised); border-color: var(--accent-line); box-shadow: inset 3px 0 0 var(--accent); }
.feed-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.feed-top time { font: 500 11.5px/1.4 var(--mono); color: var(--muted); }
.feed-item b { font: 600 14px/1.35 var(--sans); overflow-wrap: anywhere; }
.feed-item small { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font: 400 12px/1.45 var(--sans); color: var(--muted); }
.review { padding: 18px; min-width: 0; }
.trial-card { display: grid; gap: 16px; padding: 18px 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel) var(--dots) 0 0 / 14px 14px; }
.tc-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tc-meta { font: 500 12px/1.5 var(--mono); color: var(--muted); } .tc-meta b { color: var(--ink); font-weight: 600; }
.tc-meta.right { display: inline-flex; align-items: center; gap: 8px; }
.tc-who { display: flex; align-items: center; gap: 12px; }
.tc-who .lab-tile { width: 44px; height: 44px; border-radius: 10px; font-size: 15px; }
.tc-who h2 { margin: 0; font: 700 22px/1.15 var(--sans); letter-spacing: -.02em; overflow-wrap: anywhere; }
.tc-who small { display: block; margin-top: 2px; font: 500 11.5px/1.4 var(--mono); color: var(--muted); }
.tc-task { margin: 0; font: 500 clamp(17px, 1.6vw, 21px)/1.35 var(--sans); letter-spacing: -.01em; color: var(--ink); text-wrap: pretty; }
.tc-result { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); }
.tc-outcome { display: grid; gap: 4px; } .tc-outcome small { font: 400 12px/1.4 var(--sans); color: var(--muted); max-width: 26ch; }
.tc-score { display: grid; gap: 4px; min-width: 0; }
.tc-score > span, .tc-episode > span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.tc-score b { font: 500 24px/1.1 var(--mono); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.tc-episode b { display: block; font: 600 14px/1.3 var(--sans); }
.prog { display: block; height: 6px; border-radius: 3px; background: var(--field); overflow: hidden; }
.prog i { display: block; height: 100%; background: var(--fine); border-radius: 3px; }
.prog i.success { background: var(--good); } .prog i.failure { background: var(--ink-4); } .prog i.aborted { background: var(--warn); }
.tc-kv b { font-weight: 500; line-height: 1.45; }
.tc-note { display: grid; gap: 4px; }
.tc-note span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.tc-note p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--ink); max-width: 80ch; }
.tc-videos { padding-top: 14px; border-top: 1px solid var(--line); }
.tc-error { margin: 0 0 10px; color: var(--bad); font-size: 13px; }
.trial-videos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.trial-videos figure { margin: 0; min-width: 0; }
.trial-videos video, .review-video-placeholder { display: block; width: 100%; object-fit: contain; background: #000; }
.review-camera { position: relative; border-radius: 10px; overflow: hidden; background: #000; }
.review-video-placeholder { display: grid; place-items: center; font: 500 12px/1.4 var(--mono); color: var(--ink-4); }
.video-caption { position: absolute; left: 10px; bottom: 10px; padding: 4px 7px; border-radius: 4px; font: 500 10.5px/1.2 var(--mono); color: #fff; background: rgba(0, 0, 0, .62); pointer-events: none; }
@media (max-width: 980px) { .ev-layout { grid-template-columns: minmax(0, 1fr); } .feed { position: static; max-height: 300px; border-right: 0; border-bottom: 1px solid var(--line); } }
@media (max-width: 640px) { .tc-result { grid-template-columns: minmax(0, 1fr); } .review { padding: 12px; } .trial-card { padding: 16px; } }
</style>
