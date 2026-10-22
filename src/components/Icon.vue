<template>
  <svg class="icon" :class="`icon-${name}`" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'search'"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></template>
    <template v-else-if="name === 'external'"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></template>
    <template v-else-if="name === 'ab'"><rect x="3" y="5" width="8" height="14" rx="1.5" /><rect x="13" y="5" width="8" height="14" rx="1.5" /><path d="M7 15v-4l0 0M17 11v4" /></template>
    <template v-else-if="name === 'trials'"><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><path d="m15 17.5 2 2 4-4.5" /></template>
    <template v-else-if="name === 'sort'"><path d="M8 5v14M8 19l-3-3M8 19l3-3M16 19V5M16 5l-3 3M16 5l3 3" /></template>
    <template v-else-if="name === 'down'"><path d="m6 9 6 6 6-6" /></template>
    <template v-else-if="name === 'up'"><path d="m6 15 6-6 6 6" /></template>
    <template v-else-if="name === 'info'"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></template>
    <template v-else-if="name === 'trophy'"><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4" /></template>
    <template v-else-if="name === 'pulse'"><path d="M3 12h4l2-6 4 12 2-6h6" /></template>
    <template v-else-if="name === 'trend-up'"><path d="m4 16 6-6 4 4 6-6M14 8h6v6" /></template>
    <template v-else-if="name === 'trend-down'"><path d="m4 8 6 6 4-4 6 6M14 16h6v-6" /></template>
    <template v-else-if="name === 'filter'"><path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z" /></template>
    <template v-else-if="name === 'play'"><path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none" /></template>
    <template v-else-if="name === 'grid'"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></template>
    <template v-else><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></template>
  </svg>
</template>
<script setup>
defineProps({ name: { type: String, default: 'dot' } })
</script>
