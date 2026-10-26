<template>
  <nav class="body-tabs" aria-label="Robot body">
    <button v-for="item in embodiments" :key="item.id" type="button" :class="['body-tab', { on: robot.id === item.id }]" :aria-pressed="robot.id === item.id" @click="select({ robot: item.id })">
      <RobotGlyph :kind="item.glyph" /><span><b>{{ item.name }}</b><small>{{ item.type }}</small></span>
    </button>
  </nav>
  <div class="track-row">
    <div class="track-switch" role="group" aria-label="Track">
      <button type="button" :class="['track-btn open', { on: track === 'open' }]" :aria-pressed="track === 'open'" @click="select({ track: 'open' })"><Icon name="ab" /><span><b>Open track</b><small>{{ openLabel }}</small></span></button>
      <button type="button" :class="['track-btn fine', { on: track === 'fine-tuning' }]" :aria-pressed="track === 'fine-tuning'" @click="select({ track: 'fine-tuning' })"><Icon name="trials" /><span><b>Fine-tuning</b><small>{{ fineLabel }}</small></span></button>
    </div>
    <slot />
  </div>
</template>
<script setup>
import RobotGlyph from './RobotGlyph.vue'
import Icon from './Icon.vue'
import { embodiments, useArena } from '../arena.js'
defineProps({ openLabel: { type: String, default: 'Blind A/B rating' }, fineLabel: { type: String, default: 'Scored trials, 0–4' } })
const { robot, track, select } = useArena()
</script>
