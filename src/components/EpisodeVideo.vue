<template>
  <video v-if="!segment" class="review-video" :src="source" autoplay muted loop playsinline />
  <div v-else>
    <video ref="video" class="review-video" :src="segment.url" muted playsinline preload="metadata"
      @loadedmetadata="initialize" @timeupdate="update" @play="tick" @pause="onPause"
      @waiting="status = 'Buffering…'" @playing="status = ''" @error="fail" />
    <div class="episode-controls">
      <span>EP {{ segment.episode_index }}</span>
      <button :disabled="!ready" @click="toggle">{{ playing ? 'Pause' : 'Play' }}</button>
      <button :disabled="!ready" @click="replay">Replay</button>
      <span>{{ elapsed.toFixed(1) }} / {{ duration.toFixed(1) }}s</span>
      <input aria-label="Episode playback position" type="range" min="0" :max="duration" step="0.01"
        :value="elapsed" :disabled="!ready" @input="seek" />
      <span role="status">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
const props = defineProps({ source: { type: [String, Object], required: true } })
const segment = computed(() => typeof props.source === 'object' ? props.source : null)
const video = ref(null), ready = ref(false), playing = ref(false), elapsed = ref(0)
const status = ref('Loading…')
const duration = computed(() => segment.value ? segment.value.end - segment.value.start : 0)
let frame = 0, disposed = false
function initialize() {
  const s = segment.value, v = video.value
  if (!s || !Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start || s.end > v.duration + .1) {
    status.value = 'Invalid episode time range'; return
  }
  v.currentTime = s.start; ready.value = true; status.value = ''
}
function update() {
  if (!ready.value || disposed) return
  const v = video.value, s = segment.value
  elapsed.value = Math.max(0, Math.min(duration.value, v.currentTime - s.start))
  if (v.currentTime >= s.end - .04) {
    v.pause()
    if (v.currentTime > s.end) v.currentTime = Math.max(s.start, s.end - .04)
    status.value = 'Episode complete'
  }
}
function tick() {
  cancelAnimationFrame(frame)
  if (disposed) return
  playing.value = !video.value.paused; update()
  if (!video.value.paused) frame = requestAnimationFrame(tick)
}
function onPause() { playing.value = false; cancelAnimationFrame(frame); update() }
async function play() {
  const v = video.value
  if (!ready.value) return
  if (v.currentTime >= segment.value.end - .08) v.currentTime = segment.value.start
  status.value = ''
  try { await v.play() } catch { if (!disposed) status.value = 'Unable to start playback' }
}
function toggle() { if (video.value.paused) play(); else video.value.pause() }
function replay() { video.value.currentTime = segment.value.start; play() }
function seek(event) {
  video.value.currentTime = Math.max(segment.value.start, Math.min(segment.value.start + Number(event.target.value), segment.value.end - .04))
  status.value = ''; update()
}
function fail() { ready.value = false; status.value = 'Video unavailable. Check the source connection or browser codec support.' }
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); if (video.value) { video.value.pause(); video.value.removeAttribute('src'); video.value.load() } })
</script>

<style scoped>
.episode-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px;font-size:12px}
.episode-controls input{width:100%}
.episode-controls button{cursor:pointer}
</style>
