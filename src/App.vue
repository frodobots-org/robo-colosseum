<template>
  <div class="app-shell">
    <header class="top">
      <a class="brand" :href="home" aria-label="RoboColosseum home"><img class="for-light" :src="`${home}v9/brand/lockup-light.svg`" alt="RoboColosseum" width="905" height="252"><img class="for-dark" :src="`${home}v9/brand/lockup-dark.svg`" alt="RoboColosseum" width="905" height="252"></a>
      <nav id="nav-sheet" :class="['nav', { open: menuOpen }]" aria-label="Primary" @click="onNav">
        <RouterLink :to="link('/leaderboard')">Leaderboard</RouterLink>
        <RouterLink :to="link('/evals')">Evaluations</RouterLink>
        <a :href="`${home}#robots`">Embodiments</a>
        <a :href="`${home}#how`">How it works</a>
        <a :href="`${home}#data`">Open data</a>
        <a :href="`${home}#faq`">FAQ</a>
      </nav>
      <button type="button" class="menu" :aria-expanded="menuOpen" aria-controls="nav-sheet" @click="menuOpen = !menuOpen"><span aria-hidden="true"></span>Menu</button>
      <button type="button" class="theme" :aria-label="`Switch to the ${dark ? 'light' : 'dark'} theme`" @click="toggleTheme"><span aria-hidden="true"></span></button>
      <a class="cta" :href="apply" target="_blank" rel="noopener">Apply<span class="long">&nbsp;for free evaluation</span></a>
    </header>
    <main><RouterView /></main>
    <footer class="foot">
      <div class="foot-brand"><img class="for-light" :src="`${home}v9/brand/lockup-full-light.svg`" alt="RoboColosseum" width="905" height="257"><img class="for-dark" :src="`${home}v9/brand/lockup-full-dark.svg`" alt="RoboColosseum" width="905" height="257"><p>Founded by NUS MAGIC Lab, BitRobot, EAIC Singapore and Hugging Face.</p></div>
      <nav aria-label="Footer">
        <div><h3>The benchmark</h3><ul><li><RouterLink :to="link('/leaderboard')">Leaderboard</RouterLink></li><li><RouterLink :to="link('/evals')">Evaluations</RouterLink></li><li><RouterLink :to="link('/tasks')">Tasks and protocol</RouterLink></li><li><a href="https://huggingface.co/RoboColosseum">Open data</a></li><li><a :href="`${home}v7/blog/`">Blog</a></li></ul></div>
        <div><h3>Take part</h3><ul><li><a :href="apply" target="_blank" rel="noopener">Apply for free evaluation</a></li><li><RouterLink :to="link('/join')">Join as an evaluator</RouterLink></li></ul></div>
        <div><h3>Follow</h3><ul><li><a href="https://x.com/RoboColosseum">X</a></li><li><a href="https://github.com/frodobots-org/robo-colosseum">GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum">Hugging Face</a></li></ul></div>
      </nav>
    </footer>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArena } from './arena.js'
import { APPLY } from './cta.js'
const { link } = useArena()
// The landing page is the site root; the one call to action leads to its application form.
const home = import.meta.env.BASE_URL
const apply = APPLY
const menuOpen = ref(false)
const dark = ref(document.documentElement.dataset.theme === 'dark')
function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  try { localStorage.setItem('rc-theme', dark.value ? 'dark' : 'light') } catch {}
  window.dispatchEvent(new Event('rc-theme'))
}
function onNav(event) { if (event.target.closest('a')) menuOpen.value = false }
const route = useRoute()
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>
