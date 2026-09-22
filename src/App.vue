<template>
  <div class="app-shell">
    <aside class="arena-sidebar">
      <RouterLink class="brand" :to="link('/')" aria-label="RoboColosseum home"><span class="brand-mark">R<span>c</span></span><strong>RoboColosseum<small>THE REAL-WORLD ARENA</small></strong></RouterLink>
      <p class="nav-label">WORKSPACE</p>
      <nav class="side-links" aria-label="Primary navigation">
        <RouterLink :to="link('/')"><span>◫</span>Overview</RouterLink>
        <RouterLink :to="link('/leaderboard')"><span>▤</span>Leaderboards</RouterLink>
        <RouterLink :to="link('/evals')"><span>▷</span>Evaluation</RouterLink>
      </nav>
      <div class="sidebar-bottom"><div class="contribute-card"><span class="eyebrow">BUILD THE BENCHMARK</span><h3>Bring your policy.<br />Meet the real world.</h3><RouterLink :to="link('/submit')">Submit a policy <span>↗</span></RouterLink></div><RouterLink class="join-link" :to="link('/join')">Become an evaluator ↗</RouterLink></div>
    </aside>
    <div class="arena-workspace">
      <header class="workspace-header"><span>Workspace <span class="crumb-divider">/</span> <strong>{{ titles[route.path] || 'Overview' }}</strong></span><div><span class="edition-tag">RESEARCH PREVIEW</span><a href="https://github.com/frodobots-org" target="_blank" rel="noreferrer">GitHub ↗</a></div></header>
      <main><RouterView /></main>
      <footer class="workspace-footer"><span>Real robots. Shared tasks. Measurable progress.</span><span>RoboColosseum</span></footer>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { useArena } from './arena.js'
const route = useRoute()
const { link } = useArena()
const titles = { '/': 'Overview', '/leaderboard': 'Leaderboards', '/tasks': 'Task library', '/evals': 'Evaluation', '/submit': 'Submit a policy', '/join': 'Join the arena' }
</script>
