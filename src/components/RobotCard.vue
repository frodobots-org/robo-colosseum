<template>
  <article class="robot-card">
    <div class="robot-card-head">
      <div>
        <span class="robot-type">{{ robot.className }}</span>
        <h3>{{ robot.name }}</h3>
      </div>
      <span class="status-badge">{{ robot.status }}</span>
    </div>
    <p>{{ robot.description }}</p>
    <dl class="schema-grid">
      <div>
        <dt>Control</dt>
        <dd>{{ robot.controlHz }}{{ typeof robot.controlHz === 'number' ? ' Hz' : '' }}</dd>
      </div>
      <div>
        <dt>State</dt>
        <dd>{{ robot.stateDim }}D</dd>
      </div>
      <div>
        <dt>Action</dt>
        <dd>{{ robot.actionSpace }}</dd>
      </div>
      <div>
        <dt>Cameras</dt>
        <dd>{{ robot.cameras.join(', ') }}</dd>
      </div>
    </dl>
  </article>
</template>

<script setup>
defineProps({
  robot: {
    type: Object,
    required: true,
  },
})
</script>
