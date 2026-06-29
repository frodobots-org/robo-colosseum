<template>
  <div class="table-wrap">
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Policy</th>
          <th>Status</th>
          <th>Score</th>
          <th>SD</th>
          <th># A/B Evals</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.policy">
          <td>
            <span class="rank-pill">#{{ row.rank }}</span>
          </td>
          <td class="policy-cell">{{ row.policy }}</td>
          <td>
            <span :class="['status-chip', statusClass(row)]">
              <span class="status-dot" aria-hidden="true"></span>
              {{ statusLabel(row) }}
            </span>
          </td>
          <td>
            <strong>{{ formatNumber(row.score) }}</strong>
          </td>
          <td>{{ formatNumber(row.sd ?? row.std ?? row.ci) }}</td>
          <td>{{ formatCount(row.num_evals ?? row.evals) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

function statusLabel(row) {
  return row.status?.label || row.status || 'Active'
}

function statusClass(row) {
  const label = String(statusLabel(row)).toLowerCase()
  if (label.includes('inactive') || label.includes('down')) return 'inactive'
  if (label.includes('pending') || label.includes('onboarding')) return 'pending'
  return 'active'
}

function formatNumber(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return number.toFixed(1)
}

function formatCount(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return number.toLocaleString()
}
</script>
