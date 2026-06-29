<template>
  <div class="robot-selector" aria-label="Robot filter">
    <button
      v-for="robot in robots"
      :key="robot.id"
      :class="['robot-tab', modelValue === robot.id && 'active']"
      type="button"
      :disabled="isDisabled(robot)"
      :aria-disabled="isDisabled(robot)"
      @click="$emit('update:modelValue', robot.id)"
    >
      <span>{{ robot.shortName }}</span>
      <small>{{ robot.status }}</small>
    </button>
  </div>
</template>

<script setup>
defineProps({
  robots: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
})

defineEmits(['update:modelValue'])

function isDisabled(robot) {
  return robot.status === 'Onboarding'
}
</script>
