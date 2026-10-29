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
        <div><h3>Follow</h3><ul class="social"><li><a href="https://x.com/RoboColosseum"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>X</a></li><li><a href="https://github.com/RoboColosseum"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>GitHub</a></li><li><a href="https://huggingface.co/RoboColosseum"><img :src="`${home}landing/assets/huggingface-logo.svg`" alt="" width="95" height="88">Hugging Face</a></li></ul></div>
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
