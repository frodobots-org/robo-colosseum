// Keep the stored identity intact; omit pinned revision hashes in labels.
export function policyName(value) {
  return String(value || '').replace(/@[a-f0-9]{40}$/i, '')
}

// Display evaluation times in the viewer's local timezone, to whole seconds.
export function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
