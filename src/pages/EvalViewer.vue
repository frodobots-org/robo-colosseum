<template>
  <div class="page-stack">
    <section class="page-header">
      <p class="eyebrow">A/B Evaluation Viewer</p>
      <h1>Pairwise rollout review</h1>
      <p>Inspect instructions, robot embodiment, policy matchups, evaluator feedback, and rollout metadata.</p>
    </section>

    <RobotSelector v-model="selectedRobotId" :robots="concreteRobots" />

    <section class="eval-layout">
      <aside class="eval-list">
        <button
          v-for="item in filteredEvaluations"
          :key="item.id"
          :class="['eval-list-item', selected?.id === item.id && 'active']"
          type="button"
          @click="selected = item"
        >
          <span>{{ item.id }}</span>
          <strong>{{ item.instruction || item.task }}</strong>
          <small>{{ robotName(item.robotId) }} · {{ item.policyA }} vs {{ item.policyB }}</small>
        </button>
      </aside>

      <section v-if="selected" class="review-panel">
        <EvalCard :evaluation="selected" :robot-name="robotName(selected.robotId)" />
        <EvalVideoReview :evaluation="selected" />
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import EvalCard from '../components/EvalCard.vue'
import EvalVideoReview from '../components/EvalVideoReview.vue'
import RobotSelector from '../components/RobotSelector.vue'
import { getEvaluations, getRobots } from '../api.js'

const evaluations = ref([])
const selected = ref(null)
const selectedRobotId = ref('yam')
const robots = ref([])
const concreteRobots = computed(() => robots.value.filter((robot) => robot.id !== 'all'))

const filteredEvaluations = computed(() => {
  return evaluations.value.filter((evaluation) => evaluation.robotId === selectedRobotId.value)
})

function robotName(robotId) {
  return robots.value.find((robot) => robot.id === robotId)?.name || robotId
}

watch(filteredEvaluations, (items) => {
  if (!items.some((item) => item.id === selected.value?.id)) {
    selected.value = items[0] || null
  }
})

onMounted(async () => {
  const [robotData, evaluationData] = await Promise.all([getRobots(), getEvaluations()])
  robots.value = robotData.robots || []
  evaluations.value = evaluationData.evaluations || []
  selected.value = filteredEvaluations.value[0]
})
</script>
