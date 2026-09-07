<template>
  <section class="arena-controls">
    <div class="section-line"><span class="eyebrow">01 / Embodiment</span><span class="micro">Independent rankings for every robot</span></div>
    <div class="embodiment-grid" aria-label="Choose robot embodiment">
      <button v-for="item in embodiments" :key="item.id" :class="['embodiment', { chosen: robot.id === item.id }]" :aria-pressed="robot.id === item.id" @click="select({ robot: item.id })">
        <span class="embodiment-top"><span>{{ item.type }}</span><span class="selection-dot"></span></span>
        <RobotGlyph :kind="item.glyph" />
        <strong>{{ item.name }}</strong><small>{{ item.detail }}</small>
      </button>
    </div>
    <div class="section-line track-label"><span class="eyebrow">02 / Evaluation track</span></div>
    <div class="track-grid" aria-label="Choose evaluation track">
      <button :class="['track-option', { chosen: track === 'open' }]" :aria-pressed="track === 'open'" @click="select({ track: 'open' })">
        <span class="track-icon">↗</span><span><strong>Open Track</strong><small>Pretrained policies · Unseen instructions · Pairwise A/B</small></span><span class="track-check">{{ track === 'open' ? '●' : '○' }}</span>
      </button>
      <button :class="['track-option', 'fine', { chosen: track === 'fine-tuning' }]" :aria-pressed="track === 'fine-tuning'" @click="select({ track: 'fine-tuning' })">
        <span class="track-icon">◎</span><span><strong>Fine-tuning Track</strong><small>Task adaptation · Fixed task suite · Success & progress</small></span><span class="track-check">{{ track === 'fine-tuning' ? '●' : '○' }}</span>
      </button>
    </div>
  </section>
</template>
<script setup>
import { embodiments, useArena } from '../arena.js'
import RobotGlyph from './RobotGlyph.vue'
const { robot, track, select } = useArena()
</script>
