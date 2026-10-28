import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const embodiments = [
  { id: 'franka', name: 'Franka', detail: 'Panda / FR3', type: 'Single arm', glyph: 'franka' },
  { id: 'so101', name: 'SO-ARM101', detail: 'Single-arm manipulation', type: 'Single arm', glyph: 'so101' },
  { id: 'yam', name: 'Bimanual YAM', detail: 'Dual-arm manipulation', type: 'Bimanual', glyph: 'yam' },
  { id: 'g1', name: 'Unitree G1', detail: 'Humanoid manipulation', type: 'Humanoid', glyph: 'g1' },
  { id: 'earth_rover_mini_plus', name: 'Earth Rover Mini+', detail: 'GPS and photo-goal navigation', type: 'Rover', glyph: 'rover' },
]
export function useArena() {
  const route = useRoute(), router = useRouter()
  const robot = computed(() => embodiments.find(r => r.id === route.query.robot) || embodiments.find(r => r.id === 'franka'))
  const track = computed(() => route.query.track === 'fine-tuning' ? 'fine-tuning' : 'open')
  function select(values) { return router.replace({ query: { ...route.query, ...values } }) }
  function link(path, values = {}) { return { path, query: { robot: robot.value.id, track: track.value, ...values } } }
  return { robot, track, select, link }
}
