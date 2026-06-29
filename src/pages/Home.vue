<template>
  <div class="page-stack overview-page">
    <section class="hero-copy overview-intro">
      <p class="eyebrow">BitRobot Arena</p>
      <h1>Evaluate policies with simple A/B robot trials.</h1>
      <p>
        Start with YAM evaluations now.
      </p>
      <div class="hero-actions">
        <RouterLink class="button primary" to="/evals">Open A/B Viewer</RouterLink>
        <RouterLink class="button secondary" to="/leaderboard">View Leaderboard</RouterLink>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <span class="eyebrow">Latest Eval</span>
        <RouterLink to="/evals">Review all</RouterLink>
      </div>
      <EvalCard
        v-if="latestEvaluation"
        :evaluation="latestEvaluation"
        :robot-name="robotName(latestEvaluation.robotId)"
      />
      <EvalVideoReview v-if="latestEvaluation" :evaluation="latestEvaluation" />
      <p v-else>No evaluations yet.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import EvalCard from '../components/EvalCard.vue'
import EvalVideoReview from '../components/EvalVideoReview.vue'
import { getEvaluations } from '../api.js'
import { evaluations as fallbackEvaluations, robots } from '../data/mockData.js'

const evaluations = ref(fallbackEvaluations)

const latestEvaluation = computed(() => evaluations.value[0] || null)

function robotName(robotId) {
  return robots.find((robot) => robot.id === robotId)?.name || robotId
}

onMounted(async () => {
  const data = await getEvaluations()
  evaluations.value = data.evaluations || fallbackEvaluations
})
</script>
