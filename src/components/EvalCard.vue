<template>
  <article class="eval-summary-card">
    <div class="eval-summary-header">
      <div>
        <span>{{ evaluation.id }} · {{ robotName || evaluation.robotId }}</span>
        <h2>{{ evaluation.instruction || evaluation.task }}</h2>
      </div>
      <time>{{ evaluation.evalTime || evaluation.date }}</time>
    </div>

    <div class="eval-summary-list">
      <div class="eval-summary-row">
        <span>Pref</span>
        <strong>{{ prefLabel(evaluation) }}</strong>
      </div>
      <div class="eval-summary-row">
        <span>Evaluator</span>
        <strong>{{ evaluation.evaluator || 'eval-west-03' }}</strong>
      </div>
      <div class="eval-summary-row policy-review-row">
        <span>Policy A</span>
        <div>
          <strong>{{ evaluation.policyA }}</strong>
        </div>
      </div>
      <div class="eval-summary-row policy-review-row">
        <span>Policy B</span>
        <div>
          <strong>{{ evaluation.policyB }}</strong>
        </div>
      </div>
      <div class="eval-summary-row feedback-row">
        <span>Feedback</span>
        <p>{{ evaluation.feedback || evaluation.notes || mockFeedback }}</p>
      </div>
    </div>
  </article>
</template>

<script setup>
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

const mockFeedback = 'Policy A reached the target region, while Policy B made contact but did not complete the final placement.'

function prefLabel(evaluation) {
  const pref = evaluation.preference || evaluation.pref || evaluation.winner
  if (pref === 'tie') return 'Tie'
  return pref === 'A' || pref === 'B' ? pref : ''
}
</script>
