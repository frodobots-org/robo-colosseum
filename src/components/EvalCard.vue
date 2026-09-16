<template>
  <article class="eval-summary-card">
    <div class="eval-summary-header">
      <div>
        <span>{{ robotName || evaluation.robotId }}</span>
      </div>
      <strong v-if="evaluation.test" class="test-badge">Test</strong>
      <time>{{ evaluation.evalTime || evaluation.date }}</time>
    </div>

    <div class="eval-instruction">
      <span>Prompt</span>
      <h2>{{ evaluation.instruction || evaluation.task }}</h2>
    </div>

    <div class="eval-summary-list">
      <div class="eval-summary-row"><span>A partial success</span><strong>{{ Math.round((evaluation.partialSuccessA || 0) * 100) }}%</strong></div>
      <div class="eval-summary-row"><span>B partial success</span><strong>{{ Math.round((evaluation.partialSuccessB || 0) * 100) }}%</strong></div>
      <div class="eval-summary-row">
        <span>Pref</span>
        <strong>{{ prefLabel(evaluation) }}</strong>
      </div>
      <div class="eval-summary-row">
        <span>Difficulty</span>
        <strong>{{ evaluation.test ? "Not scored (test)" : difficultyScore10(evaluation) }}</strong>
      </div>
      <div class="eval-summary-row">
        <span>Evaluator</span>
        <strong>{{ evaluation.evaluator || 'eval-west-03' }}</strong>
      </div>
      <div class="eval-summary-row">
        <span>Scene</span>
        <strong>{{ evaluation.scene || 'Unspecified' }}</strong>
      </div>
      <div class="eval-summary-row policy-review-row">
        <span>Policy A</span>
        <div>
          <strong>{{ policyName(evaluation.policyA) }}</strong>
        </div>
      </div>
      <div class="eval-summary-row policy-review-row">
        <span>Policy B</span>
        <div>
          <strong>{{ policyName(evaluation.policyB) }}</strong>
        </div>
      </div>
      <div class="eval-summary-row feedback-row">
        <span>Feedback</span>
        <p>{{ evaluation.feedback || evaluation.notes || 'No feedback yet.' }}</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { policyName } from '../display.js'
defineProps({
  evaluation: {
    type: Object,
    required: true,
  },
  robotName: {
    type: String,
    default: '',
  },
})

function prefLabel(evaluation) {
  const pref = evaluation.preference || evaluation.pref || evaluation.winner
  if (pref === 'tie') return 'Tie'
  return pref === 'A' || pref === 'B' ? pref : ''
}

function difficultyScore10(evaluation) {
  const score = Number(evaluation.difficultyScore)
  if (Number.isFinite(score)) {
    const bucket = Math.min(10, Math.max(1, Math.ceil(score * 10)))
    return `${bucket}/10`
  }
  return evaluation.difficulty || 'Unscored'
}
</script>
