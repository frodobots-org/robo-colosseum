<template>
  <div class="review-video-grid">
    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy A</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div v-for="(camera, index) in cameras" :key="camera" :class="['review-camera', { 'review-camera-top': index === 0 }]">
          <video v-if="videoSrc('a', camera)" class="review-video" :src="videoSrc('a', camera)" autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">{{ cameraLabel(camera) }}</span>
        </div>
      </div>
    </div>

    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy B</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessB ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div v-for="(camera, index) in cameras" :key="camera" :class="['review-camera', { 'review-camera-top': index === 0 }]">
          <video v-if="videoSrc('b', camera)" class="review-video" :src="videoSrc('b', camera)" autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">{{ cameraLabel(camera) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getEvaluationVideos } from '../api.js'

const props = defineProps({
  evaluation: {
    type: Object,
    required: true,
  },
})

const videos = ref({})

async function loadVideos() {
  if (!props.evaluation?.id) {
    videos.value = {}
    return
  }
  const data = await getEvaluationVideos(props.evaluation.id)
  videos.value = data.videos || {}
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

onMounted(loadVideos)
watch(() => props.evaluation.id, loadVideos)
</script>
