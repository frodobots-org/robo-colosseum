<template>
  <div class="page-stack">
    <section class="page-header">
      <h1>Evaluation</h1>
    </section>

    <ArenaControls />
    <FineTuneReview v-if="track === 'fine-tuning'" :robot-id="robot.id" :robot-name="robot.name" />
    <template v-else>
    <div class="review-actions">
      <button class="button secondary" @click="loadEvaluations">Refresh</button>
    </div>
    <div v-if="loading" class="empty-state" role="status">Loading evaluations…</div>
    <div v-else-if="!filteredEvaluations.length" class="empty-state"><h3>{{ unavailable ? 'Evaluations are temporarily unavailable' : 'No published evaluations for this selection' }}</h3><p>{{ track === 'fine-tuning' ? 'A/B comparisons belong to Open Track. Switch to Open Track to review paired rollouts.' : 'Completed A/B comparisons for this embodiment will appear here.' }}</p><button v-if="unavailable" class="button secondary" @click="loadEvaluations">Try again</button></div>

    <section v-if="filteredEvaluations.length" class="eval-layout">
      <aside class="eval-list">
        <button
          v-for="item in filteredEvaluations"
          :key="item.id"
          :class="['eval-list-item', selected?.id === item.id && 'active']"
          type="button"
          @click="selected = item"
        >
          <span class="eval-list-meta">
            <strong v-if="item.test" class="test-badge">Test</strong>
            <time>{{ dateLabel(item.evalTime || item.date) }}</time>
          </span>
          <strong>{{ item.instruction || item.task }}</strong>
        </button>
      </aside>

      <section v-if="selected" class="review-panel">
        <EvalCard :evaluation="selected" :robot-name="robotName(selected.robotId)" />
        <EvalVideoReview :evaluation="selected" />
      </section>
    </section>
    </template>
  </div>
</template>

<script setup>
import { dateLabel } from '../display.js'
import { computed, onMounted, ref, watch } from 'vue'
import FineTuneReview from '../components/FineTuneReview.vue'
import EvalCard from '../components/EvalCard.vue'
import EvalVideoReview from '../components/EvalVideoReview.vue'
import ArenaControls from '../components/ArenaControls.vue'
import { useArena } from '../arena.js'
import { getEvaluations } from '../api.js'

const evaluations = ref([])
const selected = ref(null)
const { robot, track } = useArena()
const loading = ref(false), unavailable = ref(false)

const filteredEvaluations = computed(() => {
  return evaluations.value.filter((evaluation) => {
    return track.value === 'open' && evaluation.finalized && evaluation.robotId === robot.value.id && (evaluation.track || 'open') === track.value
  })
})

function robotName(robotId) {
  return robot.value.id === robotId ? robot.value.name : robotId
}

watch(filteredEvaluations, (items) => {
  if (!items.some((item) => item.id === selected.value?.id)) {
    selected.value = items[0] || null
  }
})

async function loadEvaluations() {
  loading.value = true
  try {
    const data = await getEvaluations()
    unavailable.value = data.source === 'empty'
    evaluations.value = Array.isArray(data.evaluations) ? data.evaluations : []
  } finally { loading.value = false }
}
onMounted(loadEvaluations)
</script>
