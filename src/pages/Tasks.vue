<template>
  <div class="page-stack"><section class="page-header"><p class="eyebrow">THE EVALUATION PLAYBOOK</p><h1>Task library</h1><p>Clear goals. Reproducible setups. Observable success.</p></section><ArenaControls />
    <div class="data-notice">Draft task examples. Final task suites and training data are not yet available.</div>
    <section v-if="track === 'open'" class="track-summary open-task-explainer"><span class="eyebrow">OPEN TRACK / {{ robot.name }}</span><h2>Instructions are open. Evaluation rules are explicit.</h2><p>Evaluators propose reasonable tasks at varied deployment locations. A reviewer approves the task card before both policies run on the same configuration. No task-specific training demonstrations are provided.</p><div class="method-chips"><span>Semantic goal</span><span>Initial state</span><span>Ordered milestones</span><span>Success predicate</span><span>Timeout & reset evidence</span></div></section>
    <div v-else class="suite-banner"><div><span class="eyebrow">FINE-TUNING TRACK / {{ robot.name }}</span><h2>A fixed suite for task adaptation</h2></div><div><strong>5</strong><small>tasks planned</small></div><div><strong>~100</strong><small>demos / task</small></div><div><strong>~25</strong><small>trials / model / task</small></div></div>
    <div v-if="robot.id !== 'franka'" class="empty-state"><h3>{{ robot.name }} task cards are not published yet</h3><p>Tasks for this robot will appear here once published.</p><button class="button secondary" @click="select({ robot: 'franka' })">Explore Franka draft examples →</button></div>
    <template v-else><div class="section-line"><h2>{{ track === 'open' ? 'Task-card examples' : 'Candidate task cards' }}</h2><span class="micro">Franka · {{ taskDrafts.length }} draft examples</span></div><div class="task-library-grid"><button v-for="item in taskDrafts" :key="item.id" :class="['task-library-card', { selected: selected.id === item.id }]" :aria-pressed="selected.id === item.id" @click="selected = item"><div class="section-line"><span class="task-id">{{ item.id }}</span><span class="draft-tag">Draft</span></div><h3>{{ item.name }}</h3><p>{{ item.category }}</p><div class="task-card-bottom"><span>{{ item.site }}</span><span>View card ↗</span></div></button></div>
    <section class="task-detail" aria-live="polite"><div><p class="eyebrow">{{ selected.id }} / TASK CARD / DRAFT</p><h2>{{ selected.name }}</h2><p>{{ selected.site }} · Franka</p><div class="success-predicate"><span class="eyebrow">FINAL-SUCCESS PREDICATE</span><p>{{ selected.success }}</p></div></div><div><h3>Ordered milestones</h3><ol class="milestone-list"><li v-for="milestone in selected.milestones" :key="milestone">{{ milestone }}</li></ol></div><p class="task-approval-note">Setup, time limits, and acceptance criteria will be finalized before evaluation.</p></section></template>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import ArenaControls from '../components/ArenaControls.vue'
import { useArena, taskDrafts } from '../arena.js'
const { robot, track, select } = useArena()
const selected = ref(taskDrafts[0])
</script>
