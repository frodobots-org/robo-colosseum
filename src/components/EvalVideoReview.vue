<template>
  <div class="review-video-grid">
    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy A</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div class="review-camera review-camera-top">
          <EpisodeVideo v-if="videoSrc('a', 'top')" :key="JSON.stringify(videoSrc('a', 'top'))" :source="videoSrc('a', 'top')" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <EpisodeVideo v-if="videoSrc('a', 'left_wrist')" :key="JSON.stringify(videoSrc('a', 'left_wrist'))" :source="videoSrc('a', 'left_wrist')" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <EpisodeVideo v-if="videoSrc('a', 'right_wrist')" :key="JSON.stringify(videoSrc('a', 'right_wrist'))" :source="videoSrc('a', 'right_wrist')" />
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
          <EpisodeVideo v-if="videoSrc('b', 'top')" :key="JSON.stringify(videoSrc('b', 'top'))" :source="videoSrc('b', 'top')" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <EpisodeVideo v-if="videoSrc('b', 'left_wrist')" :key="JSON.stringify(videoSrc('b', 'left_wrist'))" :source="videoSrc('b', 'left_wrist')" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <EpisodeVideo v-if="videoSrc('b', 'right_wrist')" :key="JSON.stringify(videoSrc('b', 'right_wrist'))" :source="videoSrc('b', 'right_wrist')" />
          <div v-else class="review-video-placeholder">No video</div>
          <span class="video-caption">Right wrist</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import EpisodeVideo from './EpisodeVideo.vue'
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

function videoSrc(policySide, camera) {
  const aliases = { top: 'head_image', left_wrist: 'left_image', right_wrist: 'right_image' }
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
