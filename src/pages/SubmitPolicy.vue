<template>
  <div class="page-stack submit-page">
    <section class="page-header">
      <p class="eyebrow">Submit</p>
      <h1>Evaluate your policy</h1>
      <p>Register your policy through the submission form.</p>
    </section>

    <iframe
      class="submit-form-frame"
      title="BitRobot Arena policy submission form"
      :src="GOOGLE_FORM_EMBED_URL"
      loading="lazy"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup>
const GOOGLE_FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/REPLACE_WITH_FORM_ID/viewform?embedded=true'
</script>
