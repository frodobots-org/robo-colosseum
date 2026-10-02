<template>
  <section class="fine-review">
    <div class="review-access">
      <div><span class="eyebrow">Trial review</span><p>Review recorded outcomes and footage for each predefined task.</p></div>
      <div class="review-actions">
        <button class="button secondary" @click="loadTrials">Refresh</button>
      </div>
    </div>
    <p v-if="error" class="review-error" role="alert">{{ error }}</p>
    <div v-if="loading" class="empty-state" role="status">Loading trials…</div>
    <template v-else-if="!error">
      <div class="trial-filters">
        <label>Task<select v-model="taskFilter"><option value="">All tasks</option><option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.label }}</option></select></label>
        <label>Outcome<select v-model="outcomeFilter"><option value="">All outcomes</option><option value="success">Success</option><option value="failure">Failure</option></select></label>
        <span>{{ filtered.length }} trials · {{ robotName }}</span>
      </div>
      <div v-if="!filtered.length" class="empty-state"><h3>No matching trials yet</h3><p>Completed Fine-tuning trials for this robot will appear here.</p></div>
      <p v-if="trials.length >= limit" class="micro">Showing the {{ limit }} most recent trials for this robot.</p>
      <div v-if="filtered.length" class="eval-layout">
        <aside class="eval-list" aria-label="Fine-tuning trials">
          <button v-for="trial in filtered" :key="trial.run_id" :class="['eval-list-item', selectedId === trial.run_id && 'active']" @click="selectedId = trial.run_id">
            <span class="eval-list-meta"><span :class="['outcome-tag', outcome(trial)]">{{ outcomeLabel(trial) }}</span><time>{{ dateLabel(trial.created) }}</time></span>
            <strong>{{ taskLabel(trial.task.instruction) }} <span v-if="trial.test" class="test-badge">Test</span></strong><span class="micro">{{ percent(trial.partial_success) }} progress</span>
          </button>
        </aside>
        <section v-if="selected" class="review-panel">
          <article class="trial-card">
            <div class="trial-title"><span class="eyebrow">Fine-tuning</span><span :class="['outcome-tag', outcome(selected)]">{{ outcomeLabel(selected) }}</span></div>
            <h2>{{ taskLabel(selected.task.instruction) }}</h2><p v-if="selected.test" class="test-badge">Test</p>
            <p class="micro">{{ policyName(selected.policy_id) }} · {{ dateLabel(selected.created) }}</p>
            <div class="trial-metrics"><div><span>Success</span><strong>{{ selected.success === null ? 'Not scored' : selected.success ? 'Yes' : 'No' }}</strong></div><div><span>Partial success</span><strong>{{ percent(selected.partial_success) }}</strong></div></div>
            <template v-if="selected.inference_mode !== 'imported'">
              <dl><dt>Initial setup</dt><dd>{{ selected.task.setup }}</dd><dt>Success criteria</dt><dd>{{ selected.task.success_criteria }}</dd><dt>Progress criteria</dt><dd>{{ selected.task.partial_success_criteria }}</dd></dl>
              <p v-if="selected.feedback"><strong>Feedback:</strong> {{ selected.feedback }}</p>
            </template>
            <p v-if="selected.reason"><strong>Interruption:</strong> {{ selected.reason }}</p>
          </article>
          <section class="trial-card">
            <div class="trial-title"><h3>Trial footage</h3><button class="button secondary" :disabled="videosLoading" @click="loadVideos">Reload videos</button></div>
            <p v-if="videosLoading" role="status">Loading videos…</p>
            <p v-if="videoError" class="review-error" role="alert">{{ videoError }}</p>
            <div class="trial-videos">
              <figure v-for="camera in selected.task.cameras" :key="`${selected.run_id}-${camera}`">
                <video v-if="videos[camera]" :key="videos[camera]" :src="videos[camera]" controls playsinline preload="metadata" @error="videoError = 'Video could not be loaded. Reload videos to refresh the playback links.'"></video>
                <div v-else class="review-video-placeholder">{{ videosLoading ? 'Loading…' : 'No uploaded video' }}</div>
                <figcaption>{{ cameraLabel(camera) }}</figcaption>
              </figure>
            </div>
          </section>
        </section>
      </div>
    </template>

  </section>
</template>

<script setup>
import { policyName, dateLabel } from '../display.js'
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { getFineTuningReviews, getFineTuningVideoUrls } from '../api.js'
const props = defineProps({ robotId: { type: String, required: true }, robotName: String })
const loading = ref(false), error = ref(''), trials = ref([]), limit = ref(500)
const taskFilter = ref(''), outcomeFilter = ref(''), selectedId = ref('')
const videos = ref({}), videosLoading = ref(false), videoError = ref('')
let trialRequest, videoRequest
const outcome = trial => trial.state === 'aborted' ? 'aborted' : trial.success ? 'success' : 'failure'
const outcomeLabel = trial => ({ success: 'Success', failure: 'Failure', aborted: 'Interrupted' })[outcome(trial)]
const percent = value => value === null || value === undefined ? 'Not scored' : `${Math.round(value * 100)}%`
const taskLabel = value => String(value || '').replaceAll('_', ' ')
const cameraLabel = camera => ({ head_image: 'Head / overview', left_image: 'Left camera', right_image: 'Right camera' })[camera] || camera
const tasks = computed(() => [...new Map(trials.value.map(t => [t.task_id, { id: t.task_id, label: taskLabel(t.task.instruction) }])).values()])
const filtered = computed(() => trials.value.filter(t => (!taskFilter.value || t.task_id === taskFilter.value) && (!outcomeFilter.value || outcome(t) === outcomeFilter.value)))
const selected = computed(() => filtered.value.find(t => t.run_id === selectedId.value))
watch(filtered, rows => { if (!rows.some(t => t.run_id === selectedId.value)) selectedId.value = rows[0]?.run_id || '' })
watch(selected, loadVideos)
watch(() => props.robotId, () => { trialRequest?.abort(); loading.value = false; taskFilter.value = ''; trials.value = []; loadTrials() })
async function loadTrials() {
  trialRequest?.abort(); const request = trialRequest = new AbortController()
  loading.value = true; error.value = ''
  try {
    const data = await getFineTuningReviews(props.robotId, request.signal)
    if (request.signal.aborted) return false
    trials.value = (data.trials || []).filter(trial => trial.state === 'completed'); limit.value = data.limit || 500
    return true
  } catch (err) {
    if (request.signal.aborted) return false
    error.value = err.message; return false
  } finally { if (trialRequest === request) loading.value = false }
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
onBeforeUnmount(() => { trialRequest?.abort(); videoRequest?.abort() })
</script>

<style scoped>
.fine-review{display:grid;gap:24px}.review-access,.review-actions,.trial-title{display:flex;align-items:center;justify-content:space-between;gap:14px}.review-access p{margin:6px 0 0;color:var(--muted)}.review-actions{justify-content:flex-end}.review-error{color:#a53832}.trial-filters{display:flex;align-items:end;gap:18px;flex-wrap:wrap}.trial-filters label{display:grid;gap:7px;font-size:14px;color:var(--muted)}select,input{font:inherit;padding:11px 13px;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--ink)}.trial-filters span{padding-bottom:10px;color:var(--muted);font-size:14px}.trial-card{padding:26px;border:1px solid var(--line);border-radius:10px;background:#fff}.trial-card h2{font-size:26px;font-weight:500;margin:18px 0 8px}.trial-card h3{margin:0;font-size:19px}.trial-metrics{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px 0;border-bottom:1px solid var(--line)}.trial-metrics div{display:grid;gap:6px}.trial-metrics span,dt{color:var(--muted);font-size:14px}.trial-metrics strong{font-size:28px;font-weight:500}dt{margin:18px 0 6px;font-weight:600}dd{margin:0;font-size:16px;line-height:1.6}.outcome-tag{padding:4px 9px;border-radius:5px;font-size:13px;background:#eef0e9;color:#4c5841}.outcome-tag.success{background:#e7efd7;color:#365020}.outcome-tag.failure{background:#f8e9e4;color:#933b31}.outcome-tag.aborted{background:#f4ecd9;color:#705c28}.trial-videos{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.trial-videos figure{margin:0;min-width:0}.trial-videos figure:first-child{grid-column:1/-1}.trial-videos video{width:100%;aspect-ratio:16/9;background:#182018;border-radius:8px}.trial-videos figcaption{margin-top:7px;font-size:14px;color:var(--muted)}details{margin-top:20px}details p{overflow-wrap:anywhere}@media(max-width:700px){.review-access{align-items:flex-start;flex-direction:column}.trial-card{padding:18px}.trial-title{flex-wrap:wrap}.trial-filters select{max-width:100%}.trial-videos{grid-template-columns:1fr}.trial-filters label{width:100%}.trial-metrics strong{font-size:24px}}
</style>
