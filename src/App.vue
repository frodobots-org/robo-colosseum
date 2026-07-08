<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="ArenaVerse home">
        <span class="brand-mark">AV</span>
        <span>
          <strong>ArenaVerse</strong>
          <small>Real-world policy evaluation</small>
        </span>
      </RouterLink>

      <nav class="nav-links" aria-label="Primary navigation">
        <RouterLink to="/">Overview</RouterLink>
        <RouterLink to="/leaderboard">Leaderboard</RouterLink>
        <RouterLink to="/evals">A/B Viewer</RouterLink>
        <RouterLink to="/submit">Submit</RouterLink>
        <RouterLink to="/join">Join</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
