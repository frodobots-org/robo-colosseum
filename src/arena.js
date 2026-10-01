import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const embodiments = [
  { id: 'franka', name: 'Franka', detail: 'Panda / FR3', type: 'Single arm', glyph: 'franka' },
  { id: 'so101', name: 'SO-ARM101', detail: 'Single-arm manipulation', type: 'Single arm', glyph: 'so101' },
  { id: 'yam', name: 'Bimanual YAM', detail: 'Dual-arm manipulation', type: 'Bimanual', glyph: 'yam' },
  { id: 'g1', name: 'Unitree G1', detail: 'Humanoid manipulation', type: 'Humanoid', glyph: 'g1' },
]
export function useArena() {
  const route = useRoute(), router = useRouter()
  const robot = computed(() => embodiments.find(r => r.id === route.query.robot) || embodiments.find(r => r.id === 'franka'))
  const track = computed(() => route.query.track === 'fine-tuning' ? 'fine-tuning' : 'open')
  function select(values) { return router.replace({ query: { ...route.query, ...values } }) }
  function link(path, values = {}) { return { path, query: { robot: robot.value.id, track: track.value, ...values } } }
  return { robot, track, select, link }
}
// Draft task cards are examples, not measured policy results.
export const taskDrafts = [
  { id: 'T01', name: 'Put carrot in bowl', category: 'Pick & place', site: 'Office tabletop', demos: 100, milestones: ['Carrot grasped', 'Carrot moved over bowl', 'Carrot released inside bowl'], success: 'The entire carrot rests inside the bowl at the end of the rollout.' },
  { id: 'T02', name: 'Pour corn into pot', category: 'Grasp & pouring', site: 'Office tabletop', demos: 100, milestones: ['Red bowl grasped', 'Bowl positioned above pot', 'Corn poured into pot'], success: 'The required amount of corn is inside the steel pot. Acceptance threshold must be defined before approval.' },
  { id: 'T03', name: 'Flip pot upright', category: 'Object reorientation', site: 'Office tabletop', demos: 100, milestones: ['Pot contacted securely', 'Pot rotated', 'Pot released upright'], success: 'The pot remains upright on its base after release.' },
  { id: 'T04', name: 'Open microwave door', category: 'Articulated manipulation', site: 'Kitchen', demos: 100, milestones: ['Handle reached', 'Handle grasped', 'Door opened'], success: 'The door reaches the opening threshold specified in the approved task card.' },
  { id: 'T05', name: 'Cup in drawer, then close', category: 'Long-horizon manipulation', site: 'Kitchen', demos: 100, milestones: ['Cup grasped', 'Drawer opened', 'Cup inside drawer', 'Drawer closed'], success: 'The complete cup is inside the drawer and its opening is within the predefined tolerance.' },
]
