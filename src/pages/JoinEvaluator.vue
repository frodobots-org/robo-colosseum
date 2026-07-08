<template>
  <div class="page-stack narrow-page">
    <section class="page-header">
      <p class="eyebrow">Evaluator Network</p>
      <h1>Join as an evaluator</h1>
      <p>Coordinate stations, robot availability, and preferred task domains.</p>
    </section>

    <section class="form-panel">
      <iframe
        class="submit-form-frame"
        title="ArenaVerse evaluator signup form"
        :src="GOOGLE_FORM_EMBED_URL"
      ></iframe>
    </section>
  </div>
</template>

<script setup>
const GOOGLE_FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/REPLACE_WITH_EVALUATOR_FORM_ID/viewform?embedded=true'
</script>
