// The Fine-tune track datasets in the RoboColosseum organisation on Hugging Face: [repository, episodes, frames, task],
// with the counts from each repository's meta/info.json (read on 28 Oct 2026; every set is LeRobot v3.0 at 30 fps). The
// task is the router's eval_tasks id the dataset trains for. Pages list a dataset only while its task is on the published
// Fine-tune track leaderboard (liveSets), so a task removed from the router leaves the page at the next hourly refresh.
// When a task is retired, move its dataset to RETIRED with the date and the reason, and note it in DESIGN.md.
// The organisation is private until launch. The Earth Rover drives are left out until their release is decided.
export const HUB = 'https://huggingface.co/datasets/RoboColosseum/'
export const TRAINING = [
  { robot: 'Unitree G1', cameras: 3, sets: [
    ['g1-carry-box', 100, 82033, 'g1-carry-box-v1'], ['g1-fold-towel', 100, 191870, 'g1-fold-towel-v1'],
    ['g1-hang-keys', 100, 86270, 'g1-hang-keys-v1'], ['g1-load-clothes-washing-machine', 100, 100643, 'g1-load-clothes-v1'],
    ['g1-plate-into-rack', 100, 75815, 'g1-plate-into-rack-v1']] },
  { robot: 'Bimanual YAM', cameras: 3, sets: [
    ['bimanual-yam-cups', 100, 39184, 'yam-cups-v1'], ['bimanual-yam-drawer', 101, 82305, 'yam-drawer-v1'],
    ['bimanual-yam-dustpan', 101, 55046, 'yam-dustpan-v1'], ['bimanual-yam-microwave', 100, 108487, 'yam-microwave-v1'],
    ['bimanual-yam-tray', 102, 50254, 'yam-tray-v1']] },
  { robot: 'Franka (DROID)', cameras: 3, sets: [
    ['droid-close-laptop', 100, 27649, 'franka-closelaptop-v1'], ['droid-mug-on-coaster', 100, 41227, 'franka-mugoncoaster-v1'],
    ['droid-open-drawer', 100, 38884, 'franka-drawer-v1'], ['droid-put-marker-pen', 100, 51699, 'franka-put-marker-pen-v1'],
    ['droid-towel-in-basket', 100, 27395, 'franka-towelinbasket-v1']] },
  { robot: 'SO-ARM101', cameras: 2, sets: [
    ['so101-cube-drawer', 100, 38687, 'so101-cube_drawer-v1'], ['so101-stack-bowls', 100, 25092, 'so101-stack_bowls-v1'],
    ['so101-stack-cubes', 100, 41359, 'so101-stack_cubes-v1'], ['so101-upright-bottle', 100, 35934, 'so101-upright_bottle-v1'],
    ['robocolosseum-so101-black-screwdriver-box-to-table-100episodes', 100, 23746, 'so101-remove_screwdriver-v1']] },
]
// Datasets whose task no longer exists. They stay on Hugging Face but are not listed or counted.
export const RETIRED = [
  { set: 'droid-pour-water', robot: 'Franka (DROID)', retired: '2026-10-26', reason: 'Not one of the five Franka tasks since the 26 Oct 2026 Franka correction (close laptop, open drawer, mug on coaster, put marker pen, towel in basket); the router has no task for it.' },
]

// The datasets to show: those whose task is on the published Fine-tune track leaderboard. Without a loaded board (it
// failed, or has not arrived yet), every dataset in TRAINING.
export function liveSets(tasks) {
  const on = tasks?.size ? ([, , , task]) => tasks.has(task) : () => true
  return TRAINING.map(g => ({ ...g, sets: g.sets.filter(on) })).filter(g => g.sets.length)
}
export const hours = groups => Math.round(groups.flatMap(g => g.sets).reduce((s, [, , frames]) => s + frames, 0) / 30 / 3600)
export const HOURS = hours(TRAINING)
// Evaluation runs published so far, one repository per task and model (read on 28 Oct 2026): bimanual-yam-<task>-<model>-evals
// (5 tasks × 5 models) and g1-<task>-<model>-evals (5 × 5, plus a second GR00T camera setting on carry box).
export const EVAL_SETS = 51
export const EVAL_EXAMPLE = 'bimanual-yam-cups-pi05-evals'
