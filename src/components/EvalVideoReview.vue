<template>
  <div class="review-video-grid">
    <div class="policy-video-package">
      <div class="video-heading">
        <span>Policy A</span>
        <strong>{{ partialSuccessLabel(evaluation.partialSuccessA ?? evaluation.partialSuccess) }} partial success</strong>
      </div>
      <div class="video-package-grid">
        <div class="review-camera review-camera-top">
          <video class="review-video" :src="videoSrc('a', 'top')" controls autoplay muted loop playsinline></video>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <video class="review-video" :src="videoSrc('a', 'left-wrist')" controls autoplay muted loop playsinline></video>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <video class="review-video" :src="videoSrc('a', 'right-wrist')" controls autoplay muted loop playsinline></video>
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
          <video class="review-video" :src="videoSrc('b', 'top')" controls autoplay muted loop playsinline></video>
          <span class="video-caption">Top</span>
        </div>
        <div class="review-camera">
          <video class="review-video" :src="videoSrc('b', 'left-wrist')" controls autoplay muted loop playsinline></video>
          <span class="video-caption">Left wrist</span>
        </div>
        <div class="review-camera">
          <video class="review-video" :src="videoSrc('b', 'right-wrist')" controls autoplay muted loop playsinline></video>
          <span class="video-caption">Right wrist</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  evaluation: {
    type: Object,
    required: true,
  },
})

function videoSrc(policySide, view) {
  return `/mock-videos/policy-${policySide}-${view}.mp4`
}

function partialSuccessLabel(value) {
  if (value === null || value === undefined || value === '') return 'Unknown'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'Unknown'
  const percent = numeric <= 1 ? numeric * 100 : numeric
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%`
}
</script>
