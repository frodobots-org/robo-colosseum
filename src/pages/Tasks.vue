<template>
  <div class="page-stack tk-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Tasks</p>
        <h1>{{ robot.name }}<span class="h1-sub"> · {{ track === 'open' ? 'Head-to-head' : 'Standard tasks' }}</span></h1>
        <p class="lede">{{ track === 'open' ? 'In head-to-head comparisons the evaluator writes the instruction on the spot, in a scene the policy has never seen. A reviewer approves the task card before both policies run on the same setup.' : 'In the fine-tuning track every checkpoint is adapted to a fixed task with about 100 demonstrations, then scored over repeated trials against a written criterion.' }}</p>
      </div>
      <span class="live-tag"><i></i>Draft task cards</span>
    </section>

    <BoardControls open-label="Evaluator-written" fine-label="Fixed task suite"><RouterLink class="text-link" :to="link('/evals')">See the evaluations <Icon name="external" /></RouterLink></BoardControls>

    <section class="summary" aria-label="How a task is defined">
      <article v-for="card in cards" :key="card.label" class="sum-card text"><span class="sum-label"><Icon :name="card.icon" />{{ card.label }}</span><div class="sum-main"><b>{{ card.value }}</b></div><small>{{ card.sub }}</small></article>
    </section>

    <section v-if="robot.id !== 'franka'" class="board"><div class="state"><h3>{{ robot.name }} task cards are not published yet</h3><p>The first cards were drafted for Franka. Tasks for this robot will appear here once they are approved.</p><button class="button secondary" type="button" @click="select({ robot: 'franka' })">See the Franka drafts</button></div></section>
    <template v-else>
      <section class="board">
        <div class="board-toolbar"><span class="count" style="margin-left:0">{{ taskDrafts.length }} draft cards · Franka</span><span class="verdict test">Draft</span></div>
        <div class="task-grid">
          <button v-for="item in taskDrafts" :key="item.id" type="button" :class="['task-card', { on: selected.id === item.id }]" :aria-pressed="selected.id === item.id" @click="selected = item">
            <span class="task-top"><span class="task-id">{{ item.id }}</span><span class="task-cat"><Icon :name="iconFor(item.category)" />{{ item.category }}</span></span>
            <b>{{ item.name }}</b>
            <small>{{ item.site }} · {{ item.milestones.length }} milestones · ~{{ item.demos }} demos</small>
          </button>
        </div>
      </section>

      <section class="panel-card task-detail" aria-live="polite">
        <div class="td-main">
          <p class="eyebrow">{{ selected.id }} · task card · draft</p>
          <h2>{{ selected.name }}</h2>
          <div class="kv"><div><span>Category</span><b>{{ selected.category }}</b></div><div><span>Site</span><b>{{ selected.site }}</b></div><div><span>Robot</span><b>Franka</b></div><div><span>Demonstrations</span><b>~{{ selected.demos }}</b></div></div>
          <div class="predicate"><span>Final-success predicate</span><p>{{ selected.success }}</p></div>
        </div>
        <div class="td-side">
          <h3>Ordered milestones</h3>
          <ol class="steps"><li v-for="m in selected.milestones" :key="m"><b>{{ m }}</b></li></ol>
          <p class="panel-note">Setup, time limit and acceptance thresholds are fixed in the approved card before any evaluation runs.</p>
        </div>
      </section>
    </template>

    <section class="definitions">
      <h2>What a task card fixes</h2>
      <details><summary>Semantic goal and initial state<Icon name="down" /></summary><p>The instruction in plain language, and the scene as the policy finds it: objects, placements, what may vary between runs.</p></details>
      <details><summary>Ordered milestones<Icon name="down" /></summary><p>The observable steps that count as partial progress, in order. They are what evaluators score when a run does not finish.</p></details>
      <details><summary>Success predicate, timeout and reset<Icon name="down" /></summary><p>What must be true at the end for a full success, how long a run may take, and how the scene is reset between policies so both see the same setup.</p></details>
    </section>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import BoardControls from '../components/BoardControls.vue'
import Icon from '../components/Icon.vue'
import { useArena, taskDrafts } from '../arena.js'
const { robot, track, select, link } = useArena()
const selected = ref(taskDrafts[0])
const iconFor = category => /pour|grasp/i.test(category) ? 'trials' : /long/i.test(category) ? 'sort' : /articulated|door/i.test(category) ? 'grid' : /reorient|flip/i.test(category) ? 'trend-up' : 'ab'
const cards = computed(() => track.value === 'open'
  ? [{ icon: 'ab', label: 'Instruction', value: 'Written on the spot', sub: 'by the evaluator, unseen by the policy' }, { icon: 'grid', label: 'Setup', value: 'Same scene, same objects', sub: 'both policies, back to back' }, { icon: 'trials', label: 'Verdict', value: 'Blind preference', sub: 'plus progress for each rollout' }, { icon: 'info', label: 'Approval', value: 'Reviewed card', sub: 'before the pair runs' }]
  : [{ icon: 'grid', label: 'Suite', value: `${taskDrafts.length} tasks`, sub: 'drafted for Franka' }, { icon: 'trials', label: 'Demonstrations', value: '~100 per task', sub: 'for adapting a checkpoint' }, { icon: 'sort', label: 'Trials', value: 'up to 25', sub: 'per checkpoint per task' }, { icon: 'info', label: 'Score', value: 'Success and progress', sub: 'milestones reached, out of the task\'s total' }])
</script>
<style scoped>
.tk-page { gap: 22px; }
.task-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 12px; }
.task-card { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid var(--line-2); background: var(--paper); text-align: left; color: var(--ink); transition: border-color .15s, background .15s; min-width: 0; }
.task-card:hover { background: var(--raised); }
.task-card.on { border-color: var(--ink); background: var(--raised); box-shadow: inset 3px 0 0 var(--accent); }
.task-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.task-id { font: 700 11px/1.4 var(--mono); text-transform: uppercase; color: var(--muted); }
.task-cat { display: inline-flex; align-items: center; gap: 5px; font: 700 10.5px/1.4 var(--mono); text-transform: uppercase; color: var(--ink-2); }
.task-cat .icon { font-size: 13px; color: var(--accent); }
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
