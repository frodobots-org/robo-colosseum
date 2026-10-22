// Lab marks for policies: the labs' Hugging Face organization avatars (public/landing/assets/labs), matched by policy family.
const BASE = import.meta.env.BASE_URL
const LABS = {
  ai2: { name: 'Ai2', fit: 'cover' },
  nvidia: { name: 'NVIDIA', fit: 'contain', bg: '#fff' },
  galaxea: { name: 'Galaxea', fit: 'cover' },
  robbyant: { name: 'Robbyant', fit: 'cover' },
  pi: { name: 'Physical Intelligence', fit: 'contain', bg: '#111' },
  openai: { name: 'OpenAI', fit: 'contain', bg: '#fff' },
  anthropic: { name: 'Anthropic', fit: 'cover' },
  xai: { name: 'xAI', fit: 'contain', bg: '#fff' },
}
const FAMILY = [['pi05', 'pi'], ['g05', 'galaxea'], ['groot', 'nvidia'], ['gr00t', 'nvidia'], ['molmoact2', 'ai2'], ['lingbot', 'robbyant'], ['gpt-', 'openai'], ['claude-', 'anthropic'], ['grok-', 'xai']]

export function labFor(policy) {
  const id = String(policy || '').split('@')[0].toLowerCase()
  const hit = FAMILY.find(([prefix]) => id.startsWith(prefix))
  return hit ? { id: hit[1], logo: `${BASE}landing/assets/labs/${hit[1]}.webp`, ...LABS[hit[1]] } : null
}

// Wilson 95% interval for k successes out of n, in percent.
export function wilson(k, n) {
  if (!n) return [0, 0]
  const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
  return [Math.max(0, (c - h) * 100), Math.min(100, (c + h) * 100)]
}

export const fmt = v => v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
export const pct = v => v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : `${Math.round(Number(v))}%`

// Human task name from a fine-tuning row: "Stack the cups." or the task id stem.
export function taskName(row) {
  const stem = String(row.taskId || '').replace(new RegExp(`^${row.robotId}-`), '').replace(/-v\d+$/, '')
  const t = String(row.task || '').trim()
  const s = (/\s/.test(t) ? t : stem || t).replace(/[_-]+/g, ' ').replace(/\.$/, '').trim()
  return s ? s[0].toUpperCase() + s.slice(1) : row.taskId
}
