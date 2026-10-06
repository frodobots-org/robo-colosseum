<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getImportedDataset, getImportedEpisode } from '../api.js'

const props = defineProps({ robotId: { type: String, required: true }, datasetId: { type: String, required: true }, episodeIndex: { type: Number, default: null }, modelName: { type: String, default: '' } })
const route = useRoute(), router = useRouter()
const datasetId = computed(() => props.datasetId), dataset = ref(null), selectedIndex = ref(null)
const error = ref('')
const replay = ref(null), replayLoading = ref(false), replayError = ref('')
const videos = new Map(), ready = ref({}), playing = ref(false), position = ref(0), speed = ref('1')
let datasetRequest, replayRequest, playbackGeneration = 0
let animationFrame
const outcome = e => e.success == null ? 'Not scored' : e.success ? 'Success' : 'Failure'
const episodes = computed(() => [...(dataset.value?.episodes || [])].sort((a, b) =>
  a.episode_index - b.episode_index))
const selected = computed(() => episodes.value.find(e => e.episode_index === selectedIndex.value))
const duration = computed(() => selected.value ? selected.value.length / dataset.value.summary.fps : 0)
const playable = computed(() => !replayLoading.value && replay.value && Object.keys(replay.value.videos).length > 0 && Object.keys(replay.value.videos).every(c => ready.value[c]) && !replayError.value)
const cameraLabels = computed(() => props.robotId === 'so101' ? { head_image: 'Front', left_image: 'Wrist', right_image: 'Right camera' } : { head_image: 'Head / overview', left_image: 'Left camera', right_image: 'Right camera' })
const clock = v => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`
const epLabel = e => `Episode ${e.source_result?.run ?? e.episode_index + 1}`
function stop() { cancelAnimationFrame(animationFrame); for (const video of videos.values()) video.pause(); playing.value = false }
function remember(camera, element) { if (element) videos.set(camera, element); else videos.delete(camera) }
function seek(value) {
  position.value = Math.max(0, Math.min(Number(value), duration.value))
  for (const [camera, video] of videos) if (video.readyState >= 1) {
    const segment = replay.value.videos[camera]
    video.currentTime = Math.min(segment.start + position.value, segment.end - .5 / replay.value.fps)
  }
}
function loaded(camera, event, segment) {
  const video = event.currentTarget
  if (replayLoading.value || videos.get(camera) !== video || replay.value?.videos[camera] !== segment) return
  if (!Number.isFinite(video.duration) || video.duration + 1 / replay.value.fps < segment.end) {
    failed('Video duration does not match the episode range.'); return
  }
  video.currentTime = segment.start; video.playbackRate = Number(speed.value)
  ready.value[camera] = true
}
async function play() {
  if (!playable.value) return
  const generation = playbackGeneration
  if (position.value >= duration.value - .05) seek(0)
  try {
    await Promise.all([...videos.values()].map(v => v.play()))
    if (generation === playbackGeneration) { playing.value = true; animate() }
  } catch { if (generation === playbackGeneration) failed('Playback could not start. Reload the videos to try again.') }
}
function animate() {
  if (!playing.value || !replay.value) return
  tick(Object.keys(replay.value.videos)[0])
  if (playing.value) animationFrame = requestAnimationFrame(animate)
}
function tick(camera) {
  if (replayLoading.value || !replay.value || camera !== Object.keys(replay.value.videos)[0]) return
  const master = videos.get(camera)
  if (!master) return
  const relative = master.currentTime - replay.value.videos[camera].start
  position.value = Math.max(0, Math.min(relative, duration.value))
  if (relative >= duration.value - .5 / replay.value.fps) { stop(); seek(duration.value); return }
  if (playing.value) for (const [other, video] of videos) {
    const target = replay.value.videos[other].start + position.value
    if (other !== camera && video.readyState >= 2 && Math.abs(video.currentTime - target) > .15) video.currentTime = target
  }
}
function failed(message = 'Video could not be loaded. The evaluation result is still available.') { stop(); replayError.value = message }
async function loadDataset() {
  datasetRequest?.abort(); replayRequest?.abort(); playbackGeneration++; stop()
  dataset.value = null; replay.value = null; error.value = '';
  if (!datasetId.value) return
  const request = datasetRequest = new AbortController()
  try {
    const result = await getImportedDataset(datasetId.value, request.signal)
    if (request.signal.aborted) return
    const fromUrl = props.episodeIndex ?? Number(route.query.episode)
    selectedIndex.value = (props.episodeIndex !== null || route.query.dataset === datasetId.value) && result.episodes.some(e => e.episode_index === fromUrl) ? fromUrl : null
    dataset.value = result
  } catch (e) { if (!request.signal.aborted) error.value = e.message }
}
async function loadReplay() {
  replayRequest?.abort(); playbackGeneration++; stop();
  replayError.value = ''; ready.value = {}; position.value = 0;
  if (!selected.value) { replayLoading.value = false; return }
  const request = replayRequest = new AbortController(); replayLoading.value = true
  router.replace({ query: { ...route.query, dataset: datasetId.value, episode: String(selected.value.episode_index) } })
  try {
    const result = await getImportedEpisode(datasetId.value, selected.value.episode_index, request.signal)
    if (request.signal.aborted) return
    replay.value = result
  } catch (e) { if (!request.signal.aborted) { replay.value = null; replayError.value = e.message } }
  finally { if (replayRequest === request) replayLoading.value = false }
}
watch(datasetId, loadDataset, { immediate: true })
watch(() => props.episodeIndex, index => { if (index !== null) selectedIndex.value = index })
watch(episodes, list => { if (!list.some(e => e.episode_index === selectedIndex.value)) selectedIndex.value = list[0]?.episode_index ?? null })
watch(selected, loadReplay)
watch(speed, () => { for (const v of videos.values()) v.playbackRate = Number(speed.value) })
onBeforeUnmount(() => { datasetRequest?.abort(); replayRequest?.abort(); playbackGeneration++; stop() })
</script>

<template>
  <section class="imported-review">
    <p v-if="error" class="review-error" role="alert">{{ error }} <button @click="loadDataset">Try again</button></p>
    <p v-else-if="!dataset" role="status">Loading evaluations…</p>
    <template v-else>
      <div class="review-detail">
        <article v-if="selected" class="trial-card">
          <div class="trial-title"><span class="eyebrow">SO101 · Fine-tuning</span></div>
          <div class="trial-overview">
            <div class="trial-info"><h2 class="model-name">{{ modelName || dataset.model.name }}</h2></div>
          </div>
          <p class="task-label">{{ dataset.task.instruction.replaceAll('_', ' ') }}</p>
          <div class="episode-controls">
            <label class="episode-select">Episode<select v-model="selectedIndex" aria-label="Select episode"><option v-for="ep in episodes" :key="ep.episode_index" :value="ep.episode_index">{{ epLabel(ep) }}</option></select></label>
          </div>
          <div class="episode-summary" aria-label="Episode result">
            <div class="episode-details"><span :class="['outcome-tag', selected.success == null ? 'unscored' : selected.success ? 'success' : 'failure']">{{ outcome(selected) }}</span><time class="micro">{{ selected.source_result?.saved_at || 'Recording time unavailable' }}</time></div>
            <div class="episode-score"><span>Score</span><strong>{{ selected.score ?? '—' }} / {{ selected.score_max }}</strong></div>
          </div>
          <p v-if="selected.feedback" class="micro">{{ selected.feedback }}</p>
          <section class="video-section" aria-label="Videos">
            <h3>Review</h3><p class="video-status" role="status">{{ replayLoading ? 'Loading episode…' : ' ' }}</p>
            <p v-if="replayError" class="review-error" role="alert">{{ replayError }} <button @click="loadReplay">Reload videos</button></p>
            <template v-if="replay">
              <div :class="['trial-videos', { 'is-loading': replayLoading }]" :aria-busy="replayLoading"><figure v-for="(segment, camera) in replay.videos" :key="`${datasetId}-${replay.episode_index}-${camera}`"><video :ref="el => remember(camera, el)" :src="segment.url" muted playsinline preload="auto" :aria-label="cameraLabels[camera] || camera" @loadedmetadata="loaded(camera, $event, segment)" @timeupdate="tick(camera)" @ended="stop" @error="!replayLoading && replay?.videos[camera] === segment && videos.get(camera) === $event.currentTarget && failed()"></video><figcaption>{{ cameraLabels[camera] || camera }}</figcaption></figure></div>
              <div class="player-controls"><button class="play" :disabled="!playable" :aria-label="playing ? 'Pause playback' : 'Play playback'" @click="playing ? stop() : play()">{{ playing ? 'Ⅱ' : '▶' }}</button><span>{{ clock(position) }} <small>/ {{ clock(duration) }}</small></span><input type="range" min="0" :max="duration" step="0.01" :value="position" :disabled="!playable" aria-label="Playback time" @input="seek($event.target.value)"><select v-model="speed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
              <p class="micro playback-note">{{ selected.length.toLocaleString() }} frames · {{ replay.fps }} fps · Front + Wrist</p>
            </template>
          </section>
        </article>
      </div>
    </template>
  </section>
</template>
<style scoped>
.video-status{min-height:20px;margin:8px 0 0;font-size:13px;color:var(--muted)}.trial-videos.is-loading{opacity:.45;pointer-events:none}
.episode-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 0 18px}.episode-details{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.episode-score{display:grid;gap:4px;flex-shrink:0}.episode-score>span{font-size:13px;color:var(--muted)}.episode-score strong{font-size:24px;font-weight:500}.trial-overview{margin-bottom:8px!important}.episode-controls{border-bottom:0!important;padding-bottom:0!important;margin-bottom:18px!important}@media(max-width:600px){.episode-details{align-items:flex-start;flex-direction:column;gap:8px}}

.episode-select select:disabled{opacity:1;cursor:default;color:var(--ink);-webkit-text-fill-color:var(--ink)}.imported-review{min-width:0}.model-name{text-align:left;overflow-wrap:anywhere}.task-label{margin:0 0 10px;color:var(--muted);font-size:14px}.episode-controls{margin-top:0!important;padding-bottom:18px;border-bottom:1px solid var(--line)}
.review-panel{padding:0;border:0;background:transparent;min-width:0}.trial-card{padding:22px;border:1px solid var(--line);border-radius:10px;background:#fff;min-width:0}.trial-title,.episode-heading{display:flex;align-items:center;justify-content:space-between;gap:14px}.trial-overview{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin:16px 0 20px}.trial-info{min-width:0}.trial-info p{margin:6px 0}.trial-info .micro{overflow-wrap:anywhere}.trial-card h2{font-size:23px;font-weight:500;margin:0 0 10px;overflow-wrap:anywhere}.trial-card h3{margin:0;font-size:16px;font-weight:550}.trial-metrics{display:flex;gap:24px;flex-shrink:0}.trial-metrics div{display:grid;gap:6px}.trial-metrics span,dt{color:var(--muted);font-size:13px}.trial-metrics strong{font-size:25px;font-weight:500}.outcome-tag{padding:4px 9px;border-radius:5px;font-size:13px;background:#eef0e9;color:#4c5841}.outcome-tag.success{background:#e7efd7;color:#365020}.outcome-tag.failure{background:#f8e9e4;color:#933b31}.outcome-tag.unscored{background:#f1f2ec;color:#737d67}.episode-section{border-top:1px solid var(--line);padding-top:18px}.episode-heading{flex-wrap:wrap}.episode-controls{display:flex;align-items:end;gap:12px;margin:16px 0}.episode-controls label{display:grid;gap:7px;font-size:13px;color:var(--muted);min-width:0}.episode-select{flex:1}.episode-controls select{width:100%}select{font:inherit;padding:9px 10px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink)}button:disabled,select:disabled{opacity:.4;cursor:default}.step-buttons{display:flex;gap:5px}.step-buttons button{width:36px;height:38px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink);cursor:pointer}.episode-result{display:flex;align-items:center;flex-wrap:wrap;gap:12px 18px;font-size:13px;padding:12px 0 16px}.episode-result>span:not(.outcome-tag){color:var(--muted)}.episode-result strong{font-weight:550}.video-section{border-top:1px solid var(--line);padding-top:16px}.trial-videos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px;max-width:734px}.trial-videos figure{margin:0;min-width:0}.trial-videos video{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#182018;border-radius:7px}.trial-videos figcaption{margin-top:7px;font-size:13px;color:var(--muted)}.player-controls{display:flex;align-items:center;gap:12px;margin-top:16px;max-width:734px}.player-controls .play{width:36px;height:34px;border-radius:5px;border:0;background:#36492a;color:white;flex-shrink:0;cursor:pointer}.player-controls>span{font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums}.player-controls small{color:var(--muted)}.player-controls input{flex:1 1 100px;width:auto;min-width:20px;height:4px;accent-color:#819e5d}.player-controls select{width:64px;flex:0 0 64px;font-size:12px;padding:6px}.playback-note{margin:10px 0 0;font-size:12px}.review-error{color:#a53832;font-size:14px}
@media(max-width:1100px){.trial-overview{align-items:flex-start;flex-direction:column;gap:16px}.trial-metrics{gap:32px}}
@media(max-width:600px){.trial-card{padding:16px}.trial-title{flex-wrap:wrap}.trial-metrics strong{font-size:23px}.episode-controls{flex-wrap:wrap}.episode-controls label{flex:1;min-width:110px}.episode-select{flex-basis:55%!important}.trial-videos{grid-template-columns:1fr;max-width:360px}.episode-heading .micro{font-size:12px}.player-controls{gap:7px}}

.feed{display:grid;grid-template-columns:260px minmax(0,1fr);gap:22px;align-items:start}.feed-list{display:grid;gap:8px;max-height:690px;overflow:auto;padding:2px}.feed-item{display:grid;gap:7px;text-align:left;border:1px solid var(--line);border-radius:8px;padding:14px;background:white;color:var(--ink);cursor:pointer}.feed-item.active{border-color:#617b43;background:#f0f4e9;box-shadow:inset 3px 0 #617b43}.feed-item>span:first-child{display:flex;justify-content:space-between}.feed-item time,.feed-item small{font-size:12px;color:var(--muted)}.review-count{margin:0 0 14px;color:var(--muted);font-size:13px}.trial-metrics{gap:20px}.feed-item:focus-visible{outline:2px solid #617b43;outline-offset:1px}
@media(max-width:950px){.feed{grid-template-columns:1fr}.feed-list{display:flex;max-height:none;overflow-x:auto;padding-bottom:10px}.feed-item{min-width:220px}.trial-videos{max-width:none}}
</style>
