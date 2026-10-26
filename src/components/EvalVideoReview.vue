<template>
  <div class="review-video-grid rv">
    <div class="policy-video-package">
      <div class="video-heading">
        <span class="side-chip">A</span>
        <strong>{{ policyName(evaluation.policyA) }}</strong>
        <em>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} progress</em>
      </div>
      <div class="video-package-grid">
        <div v-for="(camera, index) in cameras" :key="camera" :class="['review-camera', { 'review-camera-top': index === 0 }]">
          <EpisodeVideo v-if="videoSrc('a', camera)" :key="JSON.stringify(videoSrc('a', camera))" :source="videoSrc('a', camera)" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">{{ cameraLabel(camera) }}</span>
        </div>
      </div>
    </div>

    <div class="policy-video-package">
      <div class="video-heading">
        <span class="side-chip">B</span>
        <strong>{{ policyName(evaluation.policyB) }}</strong>
        <em>{{ partialSuccessLabel(evaluation.partialSuccessB ?? evaluation.partialSuccess) }} progress</em>
      </div>
      <div class="video-package-grid">
        <div v-for="(camera, index) in cameras" :key="camera" :class="['review-camera', { 'review-camera-top': index === 0 }]">
          <EpisodeVideo v-if="videoSrc('b', camera)" :key="JSON.stringify(videoSrc('b', camera))" :source="videoSrc('b', camera)" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">{{ cameraLabel(camera) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import EpisodeVideo from './EpisodeVideo.vue'
import { policyName } from '../display.js'
import { getEvaluationVideos } from '../api.js'

const props = defineProps({
  evaluation: {
    type: Object,
    required: true,
  },
})

const videos = ref({})

let requestVersion = 0
async function loadVideos() {
  const version = ++requestVersion
  videos.value = {}
  if (!props.evaluation?.id) {
    videos.value = {}
    return
  }
  const data = await getEvaluationVideos(props.evaluation.id)
  if (version === requestVersion) videos.value = data.videos || {}
}

const aliases = { top: 'head_image', left_wrist: 'left_image', right_wrist: 'right_image' }
const labels = { top: 'Top', left_wrist: 'Left wrist', right_wrist: 'Right wrist', front_image: 'Front', rear_image: 'Rear' }
const armCameras = ['top', 'left_wrist', 'right_wrist']
const roverCameras = ['front_image', 'rear_image']

// Arms always show the three fixed slots; mobile rovers show the cameras they recorded.
const cameras = computed(() => {
  const available = new Set([...Object.keys(videos.value.a || {}), ...Object.keys(videos.value.b || {})])
  const rover = roverCameras.filter(camera => available.has(camera))
  return rover.length ? rover : armCameras
})

function cameraLabel(camera) {
  return labels[camera] || camera
}

function videoSrc(policySide, camera) {
  return videos.value[policySide]?.[camera] || videos.value[policySide]?.[aliases[camera]] || ''
}

function partialSuccessLabel(value) {
  if (value === null || value === undefined || value === '') return 'Unknown'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'Unknown'
  const percent = numeric <= 1 ? numeric * 100 : numeric
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%`
}

watch(() => props.evaluation.id, loadVideos, { immediate: true })
onBeforeUnmount(() => { requestVersion++ })
</script>

<style scoped>
.rv { gap: 12px; }
.video-heading { display: flex; align-items: center; gap: 10px; padding: 0 2px 8px; }
.video-heading .side-chip { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 6px; background: var(--field); font: 600 12px/1 var(--mono); color: var(--ink); }
.video-heading strong { font: 600 13.5px/1.3 var(--sans); color: var(--ink); margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-heading em { font: 500 11.5px/1.4 var(--mono); font-style: normal; color: var(--muted); white-space: nowrap; }
.review-camera { border-radius: 10px; overflow: hidden; }
.video-caption { font: 500 10.5px/1.2 var(--mono); background: rgba(0, 0, 0, .62); }
.review-video-placeholder { font: 500 12px/1.4 var(--mono); color: var(--ink-4); background: #000; }
</style>
