<template>
  <div class="review-video-grid">
    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy A</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div class="review-camera review-camera-top">
          <video v-if="videoSrc('a', 'top')" class="review-video" :src="videoSrc('a', 'top')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <video v-if="videoSrc('a', 'left_wrist')" class="review-video" :src="videoSrc('a', 'left_wrist')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <video v-if="videoSrc('a', 'right_wrist')" class="review-video" :src="videoSrc('a', 'right_wrist')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Right wrist</span>
        </div>
      </div>
    </div>

    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy B</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessB ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div class="review-camera review-camera-top">
          <video v-if="videoSrc('b', 'top')" class="review-video" :src="videoSrc('b', 'top')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <video v-if="videoSrc('b', 'left_wrist')" class="review-video" :src="videoSrc('b', 'left_wrist')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <video v-if="videoSrc('b', 'right_wrist')" class="review-video" :src="videoSrc('b', 'right_wrist')" controls autoplay muted loop playsinline></video>
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Right wrist</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
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

function videoSrc(policySide, camera) {
  return videos.value[policySide]?.[camera] || ''
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
