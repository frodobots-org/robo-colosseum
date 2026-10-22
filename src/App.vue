<template>
  <div class="app-shell">
    <header class="top">
      <a class="brand" :href="home" aria-label="RoboColosseum home"><img :src="mark" alt="" width="40" height="33"><span>RoboColosseum</span></a>
      <nav class="top-links" aria-label="Primary navigation">
        <a :href="home">Overview</a>
        <RouterLink :to="link('/leaderboard')">Leaderboards</RouterLink>
        <RouterLink :to="link('/evals')">Evaluations</RouterLink>
        <RouterLink :to="link('/tasks')">Tasks</RouterLink>
        <RouterLink :to="link('/submit')">Submit a policy</RouterLink>
        <RouterLink :to="link('/join')">Join</RouterLink>
      </nav>
      <span class="live"><i></i>Live data</span>
    </header>
    <main><RouterView /></main>
    <footer class="foot">
      <div><a class="brand" :href="home"><img :src="lockup" alt="RoboColosseum" height="34"></a><p class="prov">Every figure on this site is read live from the RoboColosseum API. Co-organized by Hugging Face, BitRobot and the Embodied AI Centre, Singapore.</p></div>
      <div><h5>The benchmark</h5><ul><li><RouterLink :to="link('/leaderboard')">Leaderboards</RouterLink></li><li><RouterLink :to="link('/evals')">Evaluation viewer</RouterLink></li><li><RouterLink :to="link('/tasks')">Tasks and criteria</RouterLink></li></ul></div>
      <div><h5>Take part</h5><ul><li><RouterLink :to="link('/submit')">Submit a policy</RouterLink></li><li><RouterLink :to="link('/join')">Join as an evaluator</RouterLink></li><li><a :href="home + 'brand/'">Brand kit</a></li></ul></div>
      <div><h5>Partners</h5><ul><li><a href="https://huggingface.co/" target="_blank" rel="noreferrer">Hugging Face</a></li><li><a href="https://bitrobot.ai/" target="_blank" rel="noreferrer">BitRobot</a></li><li><a href="https://nrp.gov.sg/" target="_blank" rel="noreferrer">Embodied AI Centre</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum" target="_blank" rel="noreferrer">GitHub</a></li></ul></div>
    </footer>
  </div>
</template>
<script setup>
import { useArena } from './arena.js'
const { link } = useArena()
// On Netlify the site root serves the /v5/ landing; on GitHub Pages the base path keeps the in-app overview.
const home = import.meta.env.BASE_URL
const mark = `${home}brand/rc-mark-white.svg`
const lockup = `${home}brand/rc-lockup-white.svg`
</script>
