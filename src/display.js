// Keep the stored identity intact; omit pinned revision hashes in labels.
export function policyName(value) {
  return String(value || '').replace(/@[a-f0-9]{40}$/i, '')
}
