<template>
  <div class="page-stack jn-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Join as an evaluator</p>
        <h1>Be the judge, in your own room.</h1>
        <p class="lede">Evaluators run the robots, write the instructions and give the blind verdicts that make the benchmark. Bring a robot, a room and an hour a week.</p>
      </div>
      <span class="live-tag"><i></i>Open call</span>
    </section>

    <section class="summary" aria-label="What evaluators do">
      <article class="sum-card text"><span class="sum-label"><Icon name="grid" />Set the scene</span><div class="sum-main"><b>Your room, your objects</b></div><small>unfamiliar to every policy by design</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="ab" />Run the pair</span><div class="sum-main"><b>Two policies, one instruction</b></div><small>same setup, back to back</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="trophy" />Judge blind</span><div class="sum-main"><b>Preference and progress</b></div><small>plus a written note</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="play" />Publish</span><div class="sum-main"><b>Every rollout recorded</b></div><small>your verdict goes live</small></article>
    </section>

    <div class="two">
      <section class="panel-card">
        <h2>What you need</h2>
        <div class="kv"><div><span>A body</span><b>Franka, SO-ARM101, Bimanual YAM, Unitree G1, or an Earth Rover Mini+</b></div><div><span>A room</span><b>Home, office, lab bench or sidewalk</b></div><div><span>Cameras</span><b>The body's own, through the client</b></div><div><span>Time</span><b>About an hour a week</b></div></div>
        <div class="actions">
          <a v-if="formReady" class="button primary" :href="FORM_URL" target="_blank" rel="noreferrer">Open the sign-up form <Icon name="external" /></a>
          <a class="button secondary" href="https://github.com/frodobots-org/colosseum-client" target="_blank" rel="noreferrer">Evaluator client on GitHub <Icon name="external" /></a>
        </div>
        <p v-if="!formReady" class="panel-note">The sign-up form is being set up. Until then, open an issue on GitHub with your body, room and availability.</p>
      </section>
      <section class="panel-card">
        <h2>How an evaluation goes</h2>
        <ol class="steps">
          <li><b>Pick a task card</b>Or write a new instruction for the room you are in; a reviewer approves it.</li>
          <li><b>Run policy A, then B</b>The client assigns the pair blind and records every camera.</li>
          <li><b>Score both</b>Which one you preferred, how far each got, and why, in a sentence.</li>
          <li><b>Finalize</b>The verdict enters the rating and the recordings go to the viewer.</li>
        </ol>
      </section>
    </div>

    <section v-if="formReady" class="board"><iframe class="form-frame" title="Evaluator sign-up form" :src="FORM_EMBED" loading="lazy"></iframe></section>
  </div>
</template>
<script setup>
import Icon from '../components/Icon.vue'
const FORM_ID = 'REPLACE_WITH_EVALUATOR_FORM_ID'
const formReady = !FORM_ID.startsWith('REPLACE_WITH')
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`
const FORM_EMBED = `${FORM_URL}?embedded=true`
</script>
<style scoped>
.jn-page { gap: 22px; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
.panel-card h2 { margin-bottom: 14px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.form-frame { display: block; width: 100%; min-height: min(78vh, 920px); border: 0; background: var(--panel); }
@media (max-width: 900px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
