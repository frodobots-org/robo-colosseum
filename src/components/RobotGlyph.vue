<template>
  <svg viewBox="0 0 180 120" fill="none" aria-hidden="true" :class="['robot-glyph', `robot-glyph-${kind}`]">
    <path d="M19 109H161M39 115H141" stroke="currentColor" stroke-width="1" opacity=".13" />

    <!-- Franka: rounded white links, dark joint cuffs, offset elbow and parallel fingers. -->
    <g v-if="kind === 'franka'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M50 102L54 80L77 60L65 31L106 27L125 48" stroke-width="16" />
      <path d="M50 99L54 80L77 60L65 31L106 27L125 48" stroke="var(--paper, #fafaf6)" stroke-width="10" />
      <path d="M48 85L59 88M72 54L81 50M96 23L98 32" stroke-width="7" />
      <circle cx="66" cy="31" r="8" fill="var(--paper, #fafaf6)" stroke-width="2.5" />
      <circle cx="66" cy="31" r="2.5" fill="currentColor" stroke="none" />
      <path d="M120 51L128 44" stroke-width="8" />
      <path d="M121 56L127 64L132 60M133 47L140 55L136 59" stroke-width="3" />
      <path d="M40 100H59L63 107H35Z" fill="currentColor" stroke-width="2" />
    </g>

    <!-- SO-ARM101: two light open-frame arms with exposed rectangular servo housings. -->
    <g v-else-if="kind === 'so101'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <g v-for="side in [0, 1]" :key="side" :transform="side ? 'translate(180 0) scale(-1 1)' : undefined">
        <path d="M29 102H54M39 98V83" stroke-width="5" />
        <path d="M33 80L45 78L35 46L23 49ZM29 43L66 36L67 45L32 53Z" fill="currentColor" fill-opacity=".09" stroke-width="2.5" />
        <path d="M38 74L31 54M39 45L59 41" stroke-width="2" opacity=".4" />
        <rect x="30" y="77" width="17" height="13" rx="2" fill="currentColor" />
        <rect x="22" y="40" width="17" height="15" rx="2" fill="currentColor" />
        <rect x="60" y="33" width="13" height="14" rx="2" fill="currentColor" />
        <g fill="var(--paper, #fafaf6)" stroke="none"><circle cx="38.5" cy="83.5" r="3" /><circle cx="30.5" cy="47.5" r="3" /><circle cx="66.5" cy="40" r="2.5" /></g>
        <path d="M69 47L77 59M72 60L79 68L84 64M80 55L87 62L84 65" stroke-width="2.5" />
        <path d="M28 95C18 75 14 61 19 42C23 33 48 28 61 31" stroke-width="1.2" opacity=".5" />
      </g>
    </g>

    <!-- YAM: two sturdy rectangular links, compact black actuator blocks, long jaw grippers. -->
    <g v-else-if="kind === 'yam'" stroke="currentColor" stroke-linejoin="round">
      <path d="M21 105H159" stroke-width="5" stroke-linecap="round" />
      <g v-for="side in [0, 1]" :key="side" :transform="side ? 'translate(180 0) scale(-1 1)' : undefined">
        <path d="M35 99V77L54 52L42 28L71 28" stroke-width="14" />
        <path d="M35 95V78L54 52L42 28L69 28" stroke="var(--paper, #fafaf6)" stroke-width="8" />
        <rect x="27" y="78" width="16" height="15" rx="3" fill="currentColor" />
        <rect x="46" y="45" width="16" height="14" rx="3" fill="currentColor" />
        <rect x="34" y="21" width="16" height="14" rx="3" fill="currentColor" />
        <circle cx="54" cy="52" r="3" fill="var(--paper, #fafaf6)" stroke="none" />
        <rect x="65" y="23" width="10" height="18" rx="2" fill="currentColor" />
        <path d="M65 43V58H70M77 43V58H72" stroke-width="3" stroke-linecap="round" />
        <path d="M25 102H45" stroke-width="7" stroke-linecap="round" />
      </g>
    </g>

    <!-- Flexiv: slender continuous links, tall shoulder and contrasting joint rings. -->
    <g v-else-if="kind === 'flexiv'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M131 101V77L112 29Q106 16 98 30L71 69L49 60" stroke-width="13" />
      <path d="M131 99V77L108 28Q106 25 103 30L71 69L49 60" stroke="var(--paper, #fafaf6)" stroke-width="8" />
      <path d="M125 87H137M117 57L126 53M88 44L98 51M63 61L59 70" stroke="#84aaa3" stroke-width="3" />
      <ellipse cx="106" cy="29" rx="7" ry="9" fill="var(--paper, #fafaf6)" stroke-width="2.5" />
      <circle cx="106" cy="29" r="2" fill="currentColor" stroke="none" />
      <path d="M47 54L43 64" stroke-width="7" />
      <path d="M39 52L34 64M33 55L29 65" stroke-width="2" />
      <path d="M121 101H141L145 107H117Z" fill="currentColor" stroke-width="2" />
    </g>

    <!-- G1: compact humanoid proportions, dark visor, chest shell and articulated limbs. -->
    <g v-else-if="kind === 'g1'" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <rect x="80" y="7" width="20" height="21" rx="8" fill="currentColor" stroke-width="2" />
      <path d="M83 13Q90 10 97 13L96 21Q90 25 84 21Z" stroke="#9ebdc1" stroke-width="1.5" />
      <path d="M90 29V34" stroke-width="6" />
      <path d="M76 36Q90 31 104 36L101 61Q90 66 79 61Z" fill="currentColor" fill-opacity=".12" stroke-width="2.5" />
      <path d="M86 40H94L90 44Z" fill="currentColor" stroke="none" />
      <path d="M74 40L65 57L61 72M106 40L115 57L119 72M83 70L78 87L78 103M97 70L102 87L104 103" stroke-width="8" />
      <path d="M74 43L66 56M106 43L114 56M82 74L78 85M98 74L102 85" stroke="var(--paper, #fafaf6)" stroke-width="4" />
      <path d="M80 67H100" stroke-width="7" />
      <path d="M60 76L58 81M64 75L63 81M117 76L118 81M121 75L123 80" stroke-width="2.5" />
      <path d="M78 105L70 107H81M104 105L111 107H101" stroke-width="5" />
      <circle cx="78" cy="87" r="3" fill="var(--paper, #fafaf6)" stroke-width="2" />
      <circle cx="102" cy="87" r="3" fill="var(--paper, #fafaf6)" stroke-width="2" />
    </g>
  </svg>
</template>
<script setup>
defineProps({ kind: { type: String, default: 'franka' } })
</script>
