<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getImportedDataset, getImportedEpisode } from '../api.js'
import { policyName } from '../display.js'
import { embodiments } from '../arena.js'
import Icon from './Icon.vue'
import { labFor } from '../labs.js'

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
const cameraLabels = computed(() => props.robotId === 'so101' ? { head_image: 'Front', left_image: 'Wrist', right_image: 'Right camera' } : { head_image: 'Head / overview', left_image: 'Left camera', right_image: 'Right camera', front_image: 'Front', rear_image: 'Rear' })
const clock = v => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`
const epLabel = e => `Episode ${e.source_result?.run ?? e.episode_index + 1}`
const modelLabel = computed(() => policyName(props.modelName || dataset.value?.model?.name))
const lab = computed(() => labFor(modelLabel.value) || { name: 'Independent', mono: modelLabel.value.slice(0, 2).toUpperCase() })
const outcomeClass = e => e.success == null ? '' : e.success ? 'success' : 'failure'
const scorePct = e => e.score == null || !e.score_max ? 0 : Math.round(e.score / e.score_max * 100)
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
    <p v-if="error" class="tc-error" role="alert">{{ error }} <button class="button secondary" type="button" @click="loadDataset">Try again</button></p>
    <p v-else-if="!dataset" class="state" role="status"><span class="skel" style="min-width:24ch">&nbsp;</span></p>
    <article v-else-if="selected" class="trial-card" aria-live="polite">
      <header class="tc-head">
        <span class="tc-meta"><b>{{ embodiments.find(e => e.id === robotId)?.name || robotId }}</b> · fine-tuning · imported dataset</span>
        <span class="tc-meta right"><time>{{ selected.source_result?.saved_at || 'Recording time unavailable' }}</time></span>
      </header>
      <div class="tc-who"><span class="lab-tile" :class="{ contain: lab.fit === 'contain' }" :style="{ background: lab.bg || '' }"><img v-if="lab.logo" :src="lab.logo" :alt="lab.name" @error="e => e.target.remove()"><template v-else>{{ lab.mono }}</template></span><div><h2>{{ modelLabel }}</h2><small>{{ lab.name }} · {{ episodes.length }} episodes</small></div></div>
      <blockquote class="tc-task">“{{ dataset.task.instruction.replaceAll('_', ' ') }}”</blockquote>
      <div class="tc-result">
        <div class="tc-outcome"><span :class="['verdict big', outcomeClass(selected)]">{{ outcome(selected) }}</span></div>
        <div class="tc-score"><span>Score</span><b>{{ selected.score ?? '—' }} / {{ selected.score_max }}</b><span class="prog"><i :class="outcomeClass(selected)" :style="{ width: scorePct(selected) + '%' }"></i></span></div>
        <label class="tc-episode"><span>Episode</span><select v-model="selectedIndex" aria-label="Select episode"><option v-for="ep in episodes" :key="ep.episode_index" :value="ep.episode_index">{{ epLabel(ep) }}</option></select></label>
      </div>
      <div v-if="selected.feedback" class="tc-note"><span>Evaluator's note</span><p>{{ selected.feedback }}</p></div>
      <section class="tc-videos" aria-label="Videos">
        <p v-if="replayError" class="tc-error" role="alert">{{ replayError }} <button class="button secondary" type="button" @click="loadReplay">Reload videos</button></p>
        <template v-if="replay">
          <div :class="['trial-videos', { 'is-loading': replayLoading }]" :aria-busy="replayLoading"><figure v-for="(segment, camera) in replay.videos" :key="`${datasetId}-${replay.episode_index}-${camera}`" class="review-camera"><video :ref="el => remember(camera, el)" :src="segment.url" muted playsinline preload="auto" :aria-label="cameraLabels[camera] || camera" @loadedmetadata="loaded(camera, $event, segment)" @timeupdate="tick(camera)" @ended="stop" @error="!replayLoading && replay?.videos[camera] === segment && videos.get(camera) === $event.currentTarget && failed()"></video><figcaption class="video-caption">{{ cameraLabels[camera] || camera }}</figcaption></figure></div>
          <div class="player-controls"><button class="play" type="button" :disabled="!playable" :aria-label="playing ? 'Pause playback' : 'Play playback'" @click="playing ? stop() : play()"><Icon :name="playing ? 'pause' : 'play'" /></button><span>{{ clock(position) }} <small>/ {{ clock(duration) }}</small></span><input type="range" min="0" :max="duration" step="0.01" :value="position" :disabled="!playable" aria-label="Playback time" @input="seek($event.target.value)"><select v-model="speed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
          <p class="playback-note">{{ replayLoading ? 'Loading episode…' : `${selected.length.toLocaleString()} frames · ${replay.fps} fps · ${Object.keys(replay.videos).map(c => cameraLabels[c] || c).join(' + ')}` }}</p>
        </template>
        <p v-else-if="replayLoading" class="playback-note">Loading episode…</p>
      </section>
    </article>
  </section>
</template>
<style scoped>
.imported-review { min-width: 0; }
.verdict.success { background: var(--good-tint); color: var(--good); }
.verdict.failure { background: var(--bad-tint); color: var(--bad); }
.verdict.big { font-size: 13px; padding: 8px 12px; }
.trial-card { display: grid; gap: 16px; padding: 18px 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel) var(--dots) 0 0 / 14px 14px; min-width: 0; }
.tc-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tc-meta { font: 500 12px/1.5 var(--mono); color: var(--muted); } .tc-meta b { color: var(--ink); font-weight: 600; }
.tc-who { display: flex; align-items: center; gap: 12px; }
.tc-who .lab-tile { width: 44px; height: 44px; border-radius: 10px; font-size: 15px; }
.tc-who h2 { margin: 0; font: 700 22px/1.15 var(--sans); letter-spacing: -.02em; overflow-wrap: anywhere; }
.tc-who small { display: block; margin-top: 2px; font: 500 11.5px/1.4 var(--mono); color: var(--muted); }
.tc-task { margin: 0; font: 500 clamp(17px, 1.6vw, 21px)/1.35 var(--sans); letter-spacing: -.01em; color: var(--ink); text-wrap: pretty; }
.tc-result { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(150px, auto); gap: 18px; align-items: center; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); }
.tc-score { display: grid; gap: 4px; min-width: 0; }
.tc-score > span, .tc-episode > span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.tc-score b { font: 500 24px/1.1 var(--mono); letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.tc-episode { display: grid; gap: 4px; }
.tc-episode select { font: 600 13.5px/1.3 var(--sans); padding: 8px 10px; border: 1px solid var(--line-2); border-radius: 7px; background: var(--field); color: var(--ink); }
.prog { display: block; height: 6px; border-radius: 3px; background: var(--field); overflow: hidden; }
.prog i { display: block; height: 100%; background: var(--fine); border-radius: 3px; }
.prog i.success { background: var(--good); } .prog i.failure { background: var(--ink-4); }
.tc-note { display: grid; gap: 4px; }
.tc-note span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.tc-note p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--ink); max-width: 80ch; }
.tc-videos { padding-top: 14px; border-top: 1px solid var(--line); }
.tc-error { margin: 0 0 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: var(--bad); font-size: 13px; }
.tc-error .button { min-height: 32px; padding: 4px 10px; font-size: 12.5px; }
.trial-videos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.trial-videos.is-loading { opacity: .45; pointer-events: none; }
.trial-videos figure { margin: 0; min-width: 0; }
.trial-videos video { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: #000; }
.review-camera { position: relative; border-radius: 10px; overflow: hidden; background: #000; }
.video-caption { position: absolute; left: 10px; bottom: 10px; padding: 4px 7px; border-radius: 4px; font: 500 10.5px/1.2 var(--mono); color: #fff; background: rgba(0, 0, 0, .62); pointer-events: none; }
.player-controls { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.player-controls .play { display: grid; place-items: center; width: 38px; height: 36px; border-radius: 8px; border: 0; background: var(--accent); color: var(--accent-ink); flex-shrink: 0; cursor: pointer; font-size: 18px; }
.player-controls .play:disabled { opacity: .4; cursor: default; }
.player-controls > span { font: 500 12px/1 var(--mono); white-space: nowrap; font-variant-numeric: tabular-nums; }
.player-controls small { color: var(--muted); }
.player-controls input { flex: 1 1 100px; width: auto; min-width: 20px; height: 4px; accent-color: var(--accent); }
.player-controls select { width: 68px; flex: 0 0 68px; font: 500 12px/1.3 var(--mono); padding: 7px 8px; border: 1px solid var(--line-2); border-radius: 7px; background: var(--field); color: var(--ink); }
.playback-note { margin: 10px 0 0; font: 500 11.5px/1.4 var(--mono); color: var(--muted); }
@media (max-width: 640px) { .tc-result { grid-template-columns: minmax(0, 1fr); } .trial-card { padding: 16px; } .player-controls { gap: 8px; } }
</style>
