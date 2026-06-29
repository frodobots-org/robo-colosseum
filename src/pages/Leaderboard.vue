<template>
  <div class="page-stack">
    <section class="page-header">
      <p class="eyebrow">Leaderboard</p>
      <h1>Policy ranking</h1>
      <p>Rankings are computed within each robot embodiment. Scores are not mixed across robots.</p>
    </section>

    <RobotSelector v-model="selectedRobotId" :robots="leaderboardRobots" />

    <section class="toolbar">
      <label>
        Search
        <input v-model="query" type="search" placeholder="Policy name" />
      </label>
      <label>
        Minimum evals
        <select v-model.number="minEvals">
          <option :value="0">All</option>
          <option :value="100">100+</option>
          <option :value="200">200+</option>
        </select>
      </label>
    </section>

    <LeaderboardTable :rows="filteredRows" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import LeaderboardTable from '../components/LeaderboardTable.vue'
import RobotSelector from '../components/RobotSelector.vue'
import { getLeaderboard, getRobots } from '../api.js'

const rows = ref([])
const query = ref('')
const minEvals = ref(0)
const selectedRobotId = ref('yam')
const robots = ref([])
const leaderboardRobots = computed(() => robots.value.filter((robot) => robot.id !== 'all'))

const filteredRows = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const evalCount = row.num_evals ?? row.evals ?? 0
    return row.robotId === selectedRobotId.value
      && evalCount >= minEvals.value
      && row.policy.toLowerCase().includes(needle)
  })
})

onMounted(async () => {
  const [robotData, leaderboardData] = await Promise.all([getRobots(), getLeaderboard()])
  robots.value = robotData.robots || []
  rows.value = leaderboardData.board || []
})
</script>
