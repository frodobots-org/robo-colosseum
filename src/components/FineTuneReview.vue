<template>
  <section class="fine-review">
    <p v-if="error" class="review-error" role="alert">{{ error }}</p>
    <p v-if="datasetError" class="review-error" role="alert">{{ datasetError }}</p>
    <div v-if="loading" class="empty-state" role="status">Loading trials…</div>
    <template v-else-if="!error">
      <div v-if="!filtered.length" class="empty-state"><h3>No matching evaluations yet</h3><p>Completed Fine-tuning trials and published datasets for this robot will appear here.</p></div>
      <div v-if="filtered.length" class="eval-layout">
        <aside class="eval-list" aria-label="Fine-tuning evaluations">
          <button v-for="trial in filtered" :key="trial.entryId" :class="['eval-list-item', selectedId === trial.entryId && 'active']" :aria-pressed="selectedId === trial.entryId" @click="selectEntry(trial)">
            <span class="eval-list-meta"><time :title="trial.kind === 'dataset' ? 'Import date' : 'Evaluation date'">{{ dateLabel(trial.created) }}</time><span class="micro">{{ trial.kind === 'dataset' ? trial.summary.episodes : 1 }} {{ trial.kind === 'dataset' && trial.summary.episodes !== 1 ? 'evals' : 'eval' }}</span></span>
            <strong>{{ trial.kind === 'dataset' ? registeredModelName(trial) : policyName(trial.policy_id) }}</strong>
            <span class="micro">{{ taskLabel(trial.task.instruction) }}</span>
          </button>
        </aside>
        <ImportedEvaluationFeed v-if="selectedEntry?.kind === 'dataset'" :key="selectedEntry.datasetId" :dataset-id="selectedEntry.datasetId" :model-name="registeredModelName(selectedEntry)" :robot-id="robotId" />
        <section v-else-if="selected" class="review-panel">
          <article class="trial-card">
            <div class="trial-title"><span class="eyebrow">{{ robotName }} · Fine-tuning</span></div>
            <div class="trial-overview">
              <div class="trial-info">
                <h2 class="model-name">{{ policyName(selected.policy_id) }}</h2><p v-if="selected.test" class="test-badge">Test</p>
              </div>
            </div>
            <p class="task-label">{{ taskLabel(selected.task.instruction) }}</p>
            <div class="episode-controls">
              <label class="episode-select">Episode<select aria-label="Select episode"><option>Episode 1</option></select></label>
            </div>
            <div class="episode-summary" aria-label="Episode result">
              <div class="episode-details"><span :class="['outcome-tag', outcome(selected)]">{{ outcomeLabel(selected) }}</span><time class="micro">{{ dateLabel(selected.created) }}</time></div>
              <div class="episode-score"><span>{{ hasSourceScore ? 'Score' : 'Partial success' }}</span><strong>{{ hasSourceScore ? sourceScore + ' / 4' : percent(selected.partial_success) }}</strong></div>
            </div>
            <template v-if="selected.inference_mode !== 'imported'">
              <dl><dt>Initial setup</dt><dd>{{ selected.task.setup }}</dd><dt>Success criteria</dt><dd>{{ selected.task.success_criteria }}</dd><dt>Progress criteria</dt><dd>{{ selected.task.partial_success_criteria }}</dd></dl>
              <p v-if="selected.feedback"><strong>Feedback:</strong> {{ selected.feedback }}</p>
            </template>
            <p v-if="selected.reason"><strong>Interruption:</strong> {{ selected.reason }}</p>
            <section class="video-section" aria-label="Videos">
              <h3>Review</h3>
              <p v-if="videosLoading" role="status">Loading videos…</p>
              <p v-if="videoError" class="review-error" role="alert">{{ videoError }}</p>
              <div class="trial-videos">
                <figure v-for="camera in selected.task.cameras" :key="`${selected.run_id}-${camera}`">
                  <video v-if="videos[camera]" :key="videos[camera]" :src="videos[camera]" controls playsinline preload="metadata" :style="{ aspectRatio: robotId === 'so101' ? '4 / 3' : '16 / 9' }" @error="videoError = 'Video could not be loaded. Refresh the page to try again.'"></video>
                  <div v-else class="review-video-placeholder">{{ videosLoading ? 'Loading…' : 'No uploaded video' }}</div>
                  <figcaption>{{ cameraLabel(camera) }}</figcaption>
                </figure>
              </div>
            </section>
          </article>
        </section>
      </div>
    </template>

  </section>
</template>

<script setup>
import { policyName, dateLabel } from '../display.js'
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImportedEvaluationFeed from './ImportedEvaluationFeed.vue'
import { getFineTuningReviews, getFineTuningVideoUrls, getImportedDatasets, getImportedDataset } from '../api.js'
const props = defineProps({ robotId: { type: String, required: true }, robotName: String })
const loading = ref(false), error = ref(''), trials = ref([]), limit = ref(500)
const importedEpisodes = ref([])
const datasets = ref([]), datasetError = ref(''), datasetTotal = ref(0)
const route = useRoute(), router = useRouter()
const taskFilter = ref(''), outcomeFilter = ref(''), selectedId = ref('')
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
const filtered = computed(() => entries.value.slice(0, 20))
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
    if (reviews.status === 'fulfilled') { trials.value = (reviews.value.trials || []).filter(trial => trial.state === 'completed'); limit.value = reviews.value.limit || 500 }
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
.episode-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 0 18px}.episode-details{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.episode-score{display:grid;gap:4px;flex-shrink:0}.episode-score>span{font-size:13px;color:var(--muted)}.episode-score strong{font-size:24px;font-weight:500}.trial-overview{margin-bottom:8px!important}.episode-controls{border-bottom:0!important;padding-bottom:0!important;margin-bottom:18px!important}@media(max-width:600px){.episode-details{align-items:flex-start;flex-direction:column;gap:8px}}

.model-name{text-align:left;overflow-wrap:anywhere}.task-label{margin:0 0 10px;color:var(--muted);font-size:14px}
.episode-controls{display:flex;align-items:end;gap:12px;margin:0 0 16px;padding-bottom:18px;border-bottom:1px solid var(--line)}.episode-select{display:grid;gap:7px;flex:1;min-width:0;font-size:13px;color:var(--muted)}.episode-select select{width:100%;padding:9px 10px;border-radius:6px}.episode-select select:disabled{opacity:1;cursor:default;color:var(--ink);-webkit-text-fill-color:var(--ink)}

.fine-review{display:grid;gap:20px}
.review-access,.review-actions,.trial-title{display:flex;align-items:center;justify-content:space-between;gap:14px}
.review-access p{margin:6px 0 0;color:var(--muted)}
.review-actions{justify-content:flex-end}
.review-error{color:#a53832}
.trial-filters{display:flex;align-items:end;gap:18px;flex-wrap:wrap}
.trial-filters label{display:grid;gap:7px;font-size:14px;color:var(--muted)}
select,input{font:inherit;padding:11px 13px;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--ink)}
.trial-filters span{padding-bottom:10px;color:var(--muted);font-size:14px}
.eval-layout{grid-template-columns:290px minmax(0,1fr);gap:20px}
.eval-list-item{gap:7px}.eval-list-item strong{overflow-wrap:anywhere}
.review-panel{padding:0;border:0;background:transparent;min-width:0}
.trial-card{padding:22px;border:1px solid var(--line);border-radius:10px;background:#fff;min-width:0}
.trial-overview{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin:16px 0 20px}
.trial-info{min-width:0}
.trial-info p{margin:6px 0}
.trial-info .micro{overflow-wrap:anywhere}
.trial-card h2{font-size:23px;font-weight:500;margin:0 0 10px;overflow-wrap:anywhere}
.trial-card h3{margin:0;font-size:16px;font-weight:550}
.trial-metrics{display:flex;gap:24px;flex-shrink:0}
.trial-metrics div{display:grid;gap:6px}
.trial-metrics span,dt{color:var(--muted);font-size:13px}
.trial-metrics strong{font-size:25px;font-weight:500}
dt{margin:18px 0 6px;font-weight:600}
dd{margin:0;font-size:16px;line-height:1.6}
.outcome-tag{padding:4px 9px;border-radius:5px;font-size:13px;background:#eef0e9;color:#4c5841}
.outcome-tag.success{background:#e7efd7;color:#365020}
.outcome-tag.failure{background:#f8e9e4;color:#933b31}
.outcome-tag.aborted{background:#f4ecd9;color:#705c28}
.video-section{border-top:1px solid var(--line);padding-top:16px}
.trial-videos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px;max-width:734px}
.trial-videos figure{margin:0;min-width:0}
.trial-videos video,.review-video-placeholder{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#182018;border-radius:7px}
.trial-videos figcaption{margin-top:7px;font-size:13px;color:var(--muted)}
@media(max-width:1100px){.trial-overview{align-items:flex-start;flex-direction:column;gap:16px}.trial-metrics{gap:32px}}
@media(max-width:980px){.eval-layout{grid-template-columns:1fr}.eval-list{position:static;max-height:280px}}
@media(max-width:600px){.review-access{align-items:flex-start;flex-direction:column}.trial-card{padding:16px}.trial-title{flex-wrap:wrap}.trial-filters select{max-width:100%}.trial-videos{grid-template-columns:1fr;max-width:360px}.trial-filters label{flex:1;min-width:120px}.trial-metrics strong{font-size:23px}}
</style>
