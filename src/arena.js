import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const embodiments = [
  { id: 'franka', name: 'Franka', detail: 'Panda / FR3', type: 'Single arm', glyph: 'franka' },
  { id: 'so101', name: 'SO-ARM101', detail: 'Dual-arm manipulation', type: 'Bimanual', glyph: 'so101' },
  { id: 'yam', name: 'Bimanual YAM', detail: 'Dual-arm manipulation', type: 'Bimanual', glyph: 'yam' },
  { id: 'g1', name: 'Unitree G1', detail: 'Humanoid manipulation', type: 'Humanoid', glyph: 'g1' },
]
export function useArena() {
  const route = useRoute(), router = useRouter()
  const robot = computed(() => embodiments.find(r => r.id === route.query.robot) || embodiments.find(r => r.id === 'franka'))
  const track = computed(() => route.query.track === 'fine-tuning' ? 'fine-tuning' : 'open')
  const source = computed(() => route.query.source === 'api' ? 'api' : 'preview')
  function select(values) { return router.replace({ query: { ...route.query, ...values } }) }
  function link(path, values = {}) { return { path, query: { robot: robot.value.id, track: track.value, source: source.value, ...values } } }
  return { robot, track, source, select, link }
}
// Illustrative UI fixtures only. These are not measured policy results or approved task cards.
export const previewPolicies = [
  { policy: 'MolmoAct2-DROID', org: 'Allen Institute for AI', score: 1628, std: 24.1, num_evals: 96, successes: [22, 19, 17, 20, 16], progress: 86 },
  { policy: 'pi05_droid', org: 'Physical Intelligence', score: 1594, std: 27.8, num_evals: 88, successes: [21, 18, 18, 18, 15], progress: 83 },
  { policy: 'GR00T-N1.7-DROID', org: 'NVIDIA', score: 1512, std: 31.2, num_evals: 76, successes: [20, 17, 15, 17, 14], progress: 78 },
  { policy: 'LAP-3B', org: 'LiHzha', score: 1446, std: 35.6, num_evals: 64, successes: [18, 15, 16, 15, 12], progress: 73 },
  { policy: 'G05', org: 'OpenGalaxea', score: 1320, std: 40.3, num_evals: 56, successes: [17, 14, 13, 15, 11], progress: 69 },
]
export const taskDrafts = [
  { id: 'T01', name: 'Put carrot in bowl', category: 'Pick & place', site: 'Office tabletop', demos: 100, milestones: ['Carrot grasped', 'Carrot moved over bowl', 'Carrot released inside bowl'], success: 'The entire carrot rests inside the bowl at the end of the rollout.' },
  { id: 'T02', name: 'Pour corn into pot', category: 'Grasp & pouring', site: 'Office tabletop', demos: 100, milestones: ['Red bowl grasped', 'Bowl positioned above pot', 'Corn poured into pot'], success: 'The required amount of corn is inside the steel pot. Acceptance threshold must be defined before approval.' },
  { id: 'T03', name: 'Flip pot upright', category: 'Object reorientation', site: 'Office tabletop', demos: 100, milestones: ['Pot contacted securely', 'Pot rotated', 'Pot released upright'], success: 'The pot remains upright on its base after release.' },
  { id: 'T04', name: 'Open microwave door', category: 'Articulated manipulation', site: 'Kitchen', demos: 100, milestones: ['Handle reached', 'Handle grasped', 'Door opened'], success: 'The door reaches the opening threshold specified in the approved task card.' },
  { id: 'T05', name: 'Cup in drawer, then close', category: 'Long-horizon manipulation', site: 'Kitchen', demos: 100, milestones: ['Cup grasped', 'Drawer opened', 'Cup inside drawer', 'Drawer closed'], success: 'The complete cup is inside the drawer and its opening is within the predefined tolerance.' },
]
