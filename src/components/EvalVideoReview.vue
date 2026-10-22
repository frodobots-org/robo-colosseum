<template>
  <div class="review-video-grid rv">
    <div class="policy-video-package">
      <div class="video-heading">
        <span class="side-chip">A</span>
        <strong>{{ policyName(evaluation.policyA) }}</strong>
        <em>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} progress</em>
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
        <span class="side-chip">B</span>
        <strong>{{ policyName(evaluation.policyB) }}</strong>
        <em>{{ partialSuccessLabel(evaluation.partialSuccessB ?? evaluation.partialSuccess) }} progress</em>
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
