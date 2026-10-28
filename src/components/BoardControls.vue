<template>
  <nav class="body-tabs" aria-label="Robot">
    <button v-for="item in embodiments" :key="item.id" type="button" :class="['body-tab', { on: robot.id === item.id }]" :aria-pressed="robot.id === item.id" @click="select({ robot: item.id })">
      <span class="pic" aria-hidden="true"><img :src="photo(item.id)" alt="" loading="lazy" /></span><span><b>{{ item.name }}</b><small>{{ item.type }}</small></span>
    </button>
  </nav>
  <div class="track-row">
    <div class="track-switch" role="group" aria-label="Track">
      <button type="button" :class="['track-btn open', { on: track === 'open' }]" :aria-pressed="track === 'open'" @click="select({ track: 'open' })"><Icon name="ab" /><span><b>Open track</b><small>{{ openLabel }}</small></span></button>
      <button type="button" :class="['track-btn fine', { on: track === 'fine-tuning' }]" :aria-pressed="track === 'fine-tuning'" @click="select({ track: 'fine-tuning' })"><Icon name="trials" /><span><b>Fine-tune track</b><small>{{ fineLabel }}</small></span></button>
    </div>
    <slot />
  </div>
</template>
<script setup>
import Icon from './Icon.vue'
import { embodiments, useArena } from '../arena.js'
defineProps({ openLabel: { type: String, default: 'Blind comparisons' }, fineLabel: { type: String, default: 'Repeated trials' } })
const { robot, track, select } = useArena()
// The same cut-out photos as the landing page's robot cards, so white robots stay white on the light grey stage.
const base = import.meta.env.BASE_URL
const photo = id => id === 'earth_rover_mini_plus' ? `${base}v3/bodies/earth-rover-mini-plus.webp` : `${base}v9/robots/${id}.webp`
</script>
