<template>
  <div class="page-stack sb-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Free evaluation</p>
        <h1>Get your policy evaluated on real robots.</h1>
        <p class="lede">You bring the model. We provide the robots, operators, scenes and scoring, and publish every run with its recordings. 10,000 hours of evaluation are free for new policies and models.</p>
      </div>
      <a class="cta" :href="APPLY">Apply for free evaluation</a>
    </section>

    <section class="summary" aria-label="What you get">
      <article class="sum-card text"><span class="sum-label"><Icon name="ab" />Head-to-head</span><div class="sum-main"><b>Blind comparisons</b></div><small>against every rated policy on the robot</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="trials" />Standard tasks</span><div class="sum-main"><b>Repeated trials</b></div><small>up to 25 per task, success and progress</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="grid" />Robots</span><div class="sum-main"><b>Franka, SO-ARM101, YAM, G1</b></div><small>Earth Rover Mini+ joining</small></article>
      <article class="sum-card text"><span class="sum-label"><Icon name="play" />Evidence</span><div class="sum-main"><b>Every run recorded</b></div><small>pick, note and video in the viewer</small></article>
    </section>

    <div class="two">
      <section class="panel-card">
        <h2>How it works</h2>
        <ol class="steps">
          <li><b>Apply</b>Tell us about your policy and the robots you want results on, in a short form.</li>
          <li><b>Connect your model</b>We help you link your inference server through our policy SDK, or serve your checkpoint on a machine next to the robot.</li>
          <li><b>We evaluate it in the wild</b>Operators set up each scene and run your model in blind comparisons and repeated task trials, recording every camera.</li>
          <li><b>Results go public</b>Scores land on the leaderboard with their uncertainty, linked to the videos and data behind them.</li>
        </ol>
      </section>
      <section class="panel-card">
        <h2>What we ask for</h2>
        <div class="kv"><div><span>Model</span><b>Hugging Face repo, revision, subfolder</b></div><div><span>Robot</span><b>Franka, SO-ARM101, Bimanual YAM or Unitree G1</b></div><div><span>Kind of score</span><b>Head-to-head, standard tasks, or both</b></div><div><span>Inference</span><b>On our machine next to the robot, or your server</b></div><div><span>Contact</span><b>A lab and a person to reach</b></div><div><span>Licence</span><b>Permission to publish the recordings</b></div></div>
        <div class="actions">
          <a class="button secondary" href="https://github.com/frodobots-org/colosseum-policy-server" target="_blank" rel="noreferrer">Policy SDK on GitHub <Icon name="external" /></a>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup>
import Icon from '../components/Icon.vue'
import { APPLY } from '../cta.js'
</script>
<style scoped>
.sb-page { gap: 28px; }
.page-head .cta { align-self: flex-end; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.panel-card h2 { margin-bottom: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
@media (max-width: 900px) { .two { grid-template-columns: minmax(0, 1fr); } .page-head .cta { align-self: flex-start; } }
</style>
