<template>
  <div class="page-stack sb-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Submit a policy</p>
        <h1>Bring your policy to the arena.</h1>
        <p class="lede">Register a checkpoint and we run it on real robots, in real rooms, against the field. Results land on the leaderboard with the recordings behind every verdict.</p>
      </div>
      <span class="live-tag"><i></i>Rolling intake</span>
    </section>

    <section class="summary" aria-label="What you get">
      <article class="sum-card text"><span class="sum-label"><Icon name="ab" />Open track</span><div class="sum-main"><b>Blind A/B pairs</b></div><small>against every rated policy on the body</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="trials" />Fine-tuning</span><div class="sum-main"><b>Scored trials</b></div><small>up to 25 per task, 0 to 4</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="grid" />Bodies</span><div class="sum-main"><b>Franka · SO-ARM101 · YAM · G1</b></div><small>Earth Rover Mini+ joining</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="play" />Evidence</span><div class="sum-main"><b>Every rollout recorded</b></div><small>verdict, note and video in the viewer</small></article>
    </section>

    <div class="two">
      <section class="panel-card">
        <h2>How a submission runs</h2>
        <ol class="steps">
          <li><b>Register the checkpoint</b>A Hugging Face repository (or an endpoint) plus the body it targets and the track.</li>
          <li><b>We deploy it on the robot</b>Through the RoboColosseum client, with the same observation and action contract as every other policy.</li>
          <li><b>Evaluators run it blind</b>Open track: paired against another policy on an instruction written on the spot. Fine-tuning: adapted to the task suite and scored over repeated trials.</li>
          <li><b>Results publish live</b>Rating or success rate on the leaderboard, and each rollout in the evaluation viewer.</li>
        </ol>
      </section>
      <section class="panel-card">
        <h2>What we need from you</h2>
        <div class="kv"><div><span>Model</span><b>Hugging Face repo, revision, subfolder</b></div><div><span>Body</span><b>Franka, SO-ARM101, Bimanual YAM or Unitree G1</b></div><div><span>Track</span><b>Open, fine-tuning, or both</b></div><div><span>Inference</span><b>Local on our rig or your endpoint</b></div><div><span>Contact</span><b>A lab and a person to reach</b></div><div><span>License</span><b>Permission to publish the recordings</b></div></div>
        <div class="actions">
          <a v-if="formReady" class="button primary" :href="FORM_URL" target="_blank" rel="noreferrer">Open the submission form <Icon name="external" /></a>
          <a class="button secondary" href="https://github.com/frodobots-org/robo-colosseum" target="_blank" rel="noreferrer">Client and protocol on GitHub <Icon name="external" /></a>
        </div>
        <p v-if="!formReady" class="panel-note">The submission form is being set up. Until then, open an issue on GitHub with the details above and we will register the policy.</p>
      </section>
    </div>

    <section v-if="formReady" class="board"><iframe class="form-frame" title="Policy submission form" :src="FORM_EMBED" loading="lazy"></iframe></section>
  </div>
</template>
<script setup>
import Icon from '../components/Icon.vue'
const FORM_ID = 'REPLACE_WITH_FORM_ID'
const formReady = !FORM_ID.startsWith('REPLACE_WITH')
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`
const FORM_EMBED = `${FORM_URL}?embedded=true`
</script>
<style scoped>
.sb-page { gap: 22px; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
.panel-card h2 { margin-bottom: 14px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.form-frame { display: block; width: 100%; min-height: min(78vh, 920px); border: 0; background: var(--panel); }
@media (max-width: 900px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
