// The training sets in the RoboColosseum organisation on Hugging Face, with the episode counts from each repository's
// meta/info.json (read on 27 Oct 2026; every set is LeRobot v3.0 at 30 fps, 1,315,470 frames in all). The organisation
// is private until launch. The Earth Rover drives are left out until their release is decided.
export const HUB = 'https://huggingface.co/datasets/RoboColosseum/'
export const TRAINING = [
  { robot: 'Unitree G1', cameras: 3, sets: [['g1-carry-box', 100], ['g1-fold-towel', 100], ['g1-hang-keys', 100], ['g1-load-clothes-washing-machine', 100], ['g1-plate-into-rack', 100]] },
  { robot: 'Bimanual YAM', cameras: 3, sets: [['bimanual-yam-cups', 100], ['bimanual-yam-drawer', 101], ['bimanual-yam-dustpan', 101], ['bimanual-yam-microwave', 100], ['bimanual-yam-tray', 102]] },
  { robot: 'Franka (DROID)', cameras: 3, sets: [['droid-close-laptop', 100], ['droid-mug-on-coaster', 100], ['droid-open-drawer', 100], ['droid-pour-water', 100], ['droid-put-marker-pen', 100], ['droid-towel-in-basket', 100]] },
  { robot: 'SO-ARM101', cameras: 2, sets: [['so101-cube-drawer', 100], ['so101-stack-bowls', 100], ['so101-stack-cubes', 100], ['so101-upright-bottle', 100], ['robocolosseum-so101-black-screwdriver-box-to-table-100episodes', 100]] },
]
export const HOURS = Math.round(1315470 / 30 / 3600)
// Evaluation runs published so far: bimanual-yam-<task>-<model>-evals, five models on each of the five YAM tasks.
export const EVAL_SETS = 25
export const EVAL_EXAMPLE = 'bimanual-yam-cups-pi05-evals'
