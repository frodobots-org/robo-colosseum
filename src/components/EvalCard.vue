<template>
  <article class="ev-card">
    <header class="ev-card-head">
      <span class="ev-meta"><b>{{ robotName || evaluation.robotId }}</b>{{ evaluation.scene ? ` · ${evaluation.scene}` : '' }}{{ evaluation.institution ? ` · ${evaluation.institution}` : '' }}</span>
      <span class="ev-meta right"><span v-if="evaluation.test" class="verdict test">Test</span><time :datetime="evaluation.evalTime || evaluation.date">{{ dateLabel(evaluation.evalTime || evaluation.date) }}</time></span>
    </header>
    <blockquote class="ev-instruction">“{{ evaluation.instruction || evaluation.task }}”</blockquote>
    <div class="ev-sides">
      <div :class="['side', { won: verdict === 'A' }]">
        <span class="side-tag">A<i v-if="verdict === 'A'">preferred</i></span>
        <b>{{ policyName(evaluation.policyA) }}</b>
        <span class="prog"><i :style="{ width: pctA + '%' }"></i></span><small>{{ pctA }}% progress</small>
      </div>
      <div class="stamp"><span>Verdict</span><b :class="{ tie: verdict === 'tie' }">{{ verdict === 'tie' ? 'Tie' : verdict === 'A' ? 'A' : 'B' }}</b><small>{{ verdict === 'tie' ? 'no preference' : 'preferred' }}</small></div>
      <div :class="['side', { won: verdict === 'B' }]">
        <span class="side-tag">B<i v-if="verdict === 'B'">preferred</i></span>
        <b>{{ policyName(evaluation.policyB) }}</b>
        <span class="prog"><i :style="{ width: pctB + '%' }"></i></span><small>{{ pctB }}% progress</small>
      </div>
    </div>
    <div class="kv">
      <div><span>Evaluator</span><b>{{ evaluation.evaluator || '—' }}</b></div>
      <div><span>Site</span><b>{{ evaluation.institution || '—' }}</b></div>
      <div><span>Difficulty</span><b>{{ evaluation.test ? 'Not scored (test)' : difficulty }}</b></div>
      <div><span>Evaluator's confidence</span><b class="cap">{{ evaluation.confidence || '—' }}</b></div>
    </div>
    <div class="ev-note"><span>Evaluator's note</span><p>{{ evaluation.feedback || evaluation.notes || 'No note recorded.' }}</p></div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { policyName, dateLabel } from '../display.js'
const props = defineProps({ evaluation: { type: Object, required: true }, robotName: { type: String, default: '' } })
const verdict = computed(() => { const p = props.evaluation.preference || props.evaluation.pref || props.evaluation.winner; return p === 'A' || p === 'B' ? p : 'tie' })
const toPct = v => { const n = Number(v); if (!Number.isFinite(n)) return 0; return Math.round(n <= 1 ? n * 100 : n) }
const pctA = computed(() => toPct(props.evaluation.partialSuccessA ?? props.evaluation.partialSuccess))
const pctB = computed(() => toPct(props.evaluation.partialSuccessB ?? props.evaluation.partialSuccess))
const difficulty = computed(() => { const s = Number(props.evaluation.difficultyScore); const label = props.evaluation.difficultyLabel || props.evaluation.difficulty; if (Number.isFinite(s)) return `${label ? label + ' · ' : ''}${Math.min(10, Math.max(1, Math.ceil(s * 10)))}/10`; return label || 'Unscored' })
</script>

<style scoped>
.ev-card { display: grid; gap: 16px; padding: 18px 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel) var(--dots) 0 0 / 14px 14px; }
.ev-card-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.ev-meta { font: 500 12px/1.5 var(--mono); color: var(--muted); } .ev-meta b { color: var(--ink); font-weight: 600; }
.ev-meta.right { display: inline-flex; align-items: center; gap: 8px; }
.ev-instruction { margin: 0; font: 500 clamp(19px, 1.9vw, 25px)/1.3 var(--sans); letter-spacing: -.015em; color: var(--ink); text-wrap: pretty; }
.ev-sides { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 12px; align-items: stretch; }
.side { display: grid; gap: 6px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); min-width: 0; }
.side.won { border-color: var(--accent-line); box-shadow: inset 0 0 0 1px var(--accent-line); }
.side-tag { display: inline-flex; align-items: center; gap: 8px; font: 600 12px/1 var(--mono); color: var(--muted); }
.side-tag i { font-style: normal; color: var(--accent); }
.side b { font: 600 14.5px/1.3 var(--sans); overflow-wrap: anywhere; }
.prog { display: block; height: 6px; border-radius: 3px; background: var(--field); overflow: hidden; }
.prog i { display: block; height: 100%; background: var(--ink-2); border-radius: 3px; }
.side.won .prog i { background: var(--accent); }
.side small { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.stamp { display: grid; place-items: center; align-content: center; gap: 2px; min-width: 96px; padding: 10px 12px; text-align: center; }
.stamp span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.stamp b { font: 800 34px/1 var(--sans); letter-spacing: -.04em; color: var(--accent); }
.stamp b.tie { color: var(--ink-2); font-size: 22px; }
.stamp small { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.kv b.cap { text-transform: capitalize; }
.ev-note { display: grid; gap: 4px; padding-top: 12px; border-top: 1px solid var(--line); }
.ev-note span { font: 500 11px/1.4 var(--mono); color: var(--muted); }
.ev-note p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--ink); max-width: 80ch; }
@media (max-width: 640px) { .ev-sides { grid-template-columns: minmax(0, 1fr); } .stamp { padding: 4px; } }
</style>
