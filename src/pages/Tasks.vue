<template>
  <div class="page-stack tk-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Tasks</p>
        <h1>{{ robot.name }}<span class="h1-sub"> · {{ track === 'open' ? 'Open track' : 'Fine-tune track' }}</span></h1>
        <p class="lede">{{ track === 'open' ? 'In the Open track the evaluator writes the instruction on the spot, in a scene the policy has never seen. A reviewer approves the task card before both policies run on the same setup.' : 'In the Fine-tune track every checkpoint is fine-tuned on a fixed task from about 100 demonstrations, then scored over repeated trials against a written criterion.' }}</p>
      </div>
      <span v-if="track !== 'open'" class="live-tag"><i></i>Tasks on the leaderboard</span>
    </section>

    <BoardControls open-label="Evaluator-written" fine-label="Fixed tasks"><RouterLink class="text-link" :to="link('/evals')">See the evaluations <Icon name="external" /></RouterLink></BoardControls>

    <section class="summary" aria-label="How a task is defined">
      <article v-for="card in cards" :key="card.label" class="sum-card text"><span class="sum-label"><Icon :name="card.icon" />{{ card.label }}</span><div class="sum-main"><b>{{ card.value }}</b></div><small>{{ card.sub }}</small></article>
    </section>

    <section v-if="track === 'open'" class="board"><div class="state"><h3>The Open track has no fixed tasks</h3><p>Every comparison starts from an instruction the evaluator writes for that scene. Each one is in the evaluations, with both runs.</p><RouterLink class="button secondary" :to="link('/evals')">See the evaluations</RouterLink></div></section>
    <section v-else-if="loading" class="board"><div class="state"><h3>Loading the tasks…</h3></div></section>
    <section v-else-if="!tasks.length" class="board"><div class="state"><h3>No Fine-tune track tasks on {{ robot.name }} yet</h3><p>A task appears here once its first trials are on the leaderboard.</p></div></section>
    <template v-else>
      <section class="board">
        <div class="board-toolbar"><span class="count" style="margin-left:0">{{ tasks.length }} {{ tasks.length === 1 ? 'task' : 'tasks' }} · {{ robot.name }}</span></div>
        <div class="task-grid">
          <button v-for="item in tasks" :key="item.id" type="button" :class="['task-card', { on: selected?.id === item.id }]" :aria-pressed="selected?.id === item.id" @click="selectedId = item.id">
            <span class="task-top"><span class="task-id">{{ item.id }}</span></span>
            <b>{{ item.name }}</b>
            <small>{{ item.models.length }} models · {{ fmt(item.trials) }} trials · {{ pct(item.rate) }} full success</small>
          </button>
        </div>
      </section>

      <section v-if="selected" class="panel-card task-detail" aria-live="polite">
        <div class="td-main">
          <p class="eyebrow">{{ selected.id }} · Fine-tune track task</p>
          <h2>{{ selected.name }}</h2>
          <div class="kv"><div><span>Robot</span><b>{{ robot.name }}</b></div><div><span>Models</span><b>{{ selected.models.length }}</b></div><div><span>Trials</span><b>{{ fmt(selected.trials) }}</b></div><div><span>Full successes</span><b>{{ fmt(selected.successes) }} · {{ pct(selected.rate) }}</b></div></div>
          <div v-if="selected.instruction" class="predicate"><span>Instruction</span><p>{{ selected.instruction }}</p></div>
          <p v-if="selected.dataset" class="panel-note">Fine-tune track dataset: <a class="text-link" :href="selected.dataset.href">{{ selected.dataset.name }} <Icon name="external" /></a> · {{ fmt(selected.dataset.episodes) }} demonstrations</p>
        </div>
        <div class="td-side">
          <h3>Results by model</h3>
          <ol class="steps"><li v-for="m in selected.models" :key="m.id"><b>{{ m.label }}</b><span>{{ m.successes }} / {{ m.trials }} full successes · {{ pct(m.progress) }} progress</span></li></ol>
          <p class="panel-note"><RouterLink class="text-link" :to="link('/leaderboard')">The full leaderboard <Icon name="external" /></RouterLink></p>
        </div>
      </section>
    </template>

    <section class="definitions">
      <h2>What a task fixes</h2>
      <details><summary>Semantic goal and initial state<Icon name="down" /></summary><p>The instruction in plain language, and the scene as the policy finds it: objects, placements, what may vary between runs.</p></details>
      <details><summary>Ordered milestones<Icon name="down" /></summary><p>The observable steps that count as partial progress, in order. They are what evaluators score when a run does not finish.</p></details>
      <details><summary>Success predicate, timeout and reset<Icon name="down" /></summary><p>What must be true at the end for a full success, how long a run may take, and how the scene is reset between policies so both see the same setup.</p></details>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BoardControls from '../components/BoardControls.vue'
import Icon from '../components/Icon.vue'
import { useArena } from '../arena.js'
import { getLeaderboard } from '../api.js'
import { policyName } from '../display.js'
import { fmt, pct, taskName } from '../labs.js'
const { robot, track, link } = useArena()

// The tasks that exist are the ones on the published Fine-tune track leaderboard; their datasets come from the landing's
// list (public/landing/datasets.js), matched by the router's task id.
const rows = ref([]), loading = ref(true), datasets = ref({}), selectedId = ref('')
onMounted(async () => {
  const base = import.meta.env.BASE_URL
  const [board, data] = await Promise.all([getLeaderboard({ track: 'fine-tuning' }), import(/* @vite-ignore */ `${base}landing/datasets.js`).catch(() => null)])
  rows.value = (board.board || []).filter(r => r.track === 'fine-tuning')
  if (data) datasets.value = Object.fromEntries(data.TRAINING.flatMap(g => g.sets.map(([name, episodes, , task]) => [task, { name, episodes, href: `${data.HUB}${name}` }])))
  loading.value = false
})
const tasks = computed(() => {
  const byTask = new Map()
  for (const r of rows.value.filter(r => r.robotId === robot.value.id)) {
    const t = byTask.get(r.taskId) || { id: r.taskId, name: taskName(r), instruction: /\s/.test(String(r.task || '')) ? String(r.task).trim() : '', models: [], trials: 0, successes: 0 }
    const trials = Number(r.trials) || 0, successes = Number(r.successes) || 0
    t.models.push({ id: r.policyId || r.policy, label: policyName(r.policy), trials, successes, progress: r.progress })
    t.trials += trials; t.successes += successes
    byTask.set(r.taskId, t)
  }
  // The instruction only when it says more than the name; two tasks with the same name (YAM's dustpan and tray are both
  // "Clean the table.") carry their id stem.
  const plain = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const named = [...byTask.values()].map(t => t.name), stem = id => id.replace(new RegExp(`^${robot.value.id}-`), '').replace(/-v\d+$/, '').replace(/[_-]+/g, ' ')
  return [...byTask.values()].map(t => ({ ...t, name: named.filter(n => n === t.name).length > 1 ? `${t.name} (${stem(t.id)})` : t.name,
    instruction: plain(t.instruction) === plain(t.name) ? '' : t.instruction, rate: t.trials ? 100 * t.successes / t.trials : null, dataset: datasets.value[t.id],
    models: t.models.sort((a, b) => b.successes / (b.trials || 1) - a.successes / (a.trials || 1) || b.progress - a.progress) })).sort((a, b) => a.name.localeCompare(b.name))
})
const selected = computed(() => tasks.value.find(t => t.id === selectedId.value) || tasks.value[0])
watch(robot, () => { selectedId.value = '' })
const cards = computed(() => track.value === 'open'
  ? [{ icon: 'ab', label: 'Instruction', value: 'Written on the spot', sub: 'by the evaluator, unseen by the policy' }, { icon: 'grid', label: 'Setup', value: 'Same scene, same objects', sub: 'both policies, back to back' }, { icon: 'trials', label: 'Pick', value: 'Blind preference', sub: 'plus progress for each run' }, { icon: 'info', label: 'Approval', value: 'Reviewed card', sub: 'before the pair runs' }]
  : [{ icon: 'grid', label: 'Tasks', value: loading.value ? '—' : `${tasks.value.length} ${tasks.value.length === 1 ? 'task' : 'tasks'}`, sub: `on ${robot.value.name}` }, { icon: 'trials', label: 'Demonstrations', value: '~100 per task', sub: 'the same for every model' }, { icon: 'sort', label: 'Trials', value: 'up to 25', sub: 'per model per task' }, { icon: 'info', label: 'Score', value: 'Success and progress', sub: 'milestones reached, out of the task\'s total' }])
</script>
<style scoped>
.tk-page { gap: 22px; }
.task-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 12px; }
.task-card { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid var(--line-2); background: var(--paper); text-align: left; color: var(--ink); transition: border-color .15s, background .15s; min-width: 0; }
.task-card:hover { background: var(--raised); }
.task-card.on { border-color: var(--ink); background: var(--raised); box-shadow: inset 3px 0 0 var(--accent); }
.task-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.task-id { font: 700 11px/1.4 var(--mono); text-transform: uppercase; color: var(--muted); }
.task-card b { font: 600 15.5px/1.3 var(--sans); letter-spacing: -.01em; }
.task-card small { font: 400 11.5px/1.5 var(--mono); color: var(--muted); }
.task-detail { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(260px, 1fr); gap: 28px; }
.td-main h2 { margin: 6px 0 14px; font: 600 clamp(26px, 2.8vw, 36px)/1.1 var(--sans); letter-spacing: -.035em; }
.predicate { margin-top: 16px; padding: 12px 14px; border-left: 2px solid var(--accent); background: var(--raised); border-radius: 0 8px 8px 0; }
.predicate span { display: block; font: 700 11px/1.4 var(--mono); text-transform: uppercase; color: var(--muted); }
.predicate p { margin: 4px 0 0; font-size: 15px; color: var(--ink); }
.td-side h3 { margin: 0 0 12px; font: 600 15px/1.3 var(--sans); }
.td-side .panel-note { margin-top: 16px; font-size: 13px; }
@media (max-width: 1000px) { .task-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .task-detail { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .task-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
