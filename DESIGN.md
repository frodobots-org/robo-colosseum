# RoboColosseum design language

The decisions behind the landing pages, as the user stated them. Read this before touching any page under `public/`. When a decision changes, change it here first.

## What we are and how we say it (26 Oct 2026, BIT-3373)

The v5 copy got bad feedback ("copy is bad or misleading... messy... doesn't give strong flow or CTA"). The **launch film script** is now the source of the message; the page follows its six scenes. The previous messaging rules ("Evaluations made in the wild" as headline, the 10,000-hour *dataset* as call to action, "every number is live") are superseded.

- **Tagline and headline:** *The proving ground for Physical AI.* Under it: *Submit your policy. We run it on real robots, in real environments, and measure it against a shared standard. No robot required.*
- **What we build:** real robots, real environments, a shared standard. Researchers submit a policy; trained operators run it on our fleet; every run is published. "In the wild" stays a supporting idea (real environments), not the headline.
- **Order of the page** (the film's scenes, with the leaderboard pulled up as proof): hero → founding partners → live leaderboard → why (ten labs, ten answers) → how it works (no robot needed; head-to-head and standard tasks; what keeps the scores honest) → robots and environments → a real matchup → open data → "Enter the arena" with the 10,000-hour offer → questions.
- **One call to action: "Submit your policy".** It appears in the top bar (site-wide, app pages included), the hero, after "How it works" and in the closing section. Every copy has the same label and the same destination. **No secondary buttons** (user rule, 26 Oct 2026): the leaderboard, evaluations, data and "Join as an evaluator" are plain links or footer items. Amber is used only for this button.
- **The offer:** *Free for academic labs: 10,000 hours of real-robot evaluation.* It is evaluation time, **never a dataset**.
- **Founding partners** (not "co-organizers"): NUS MAGIC Lab (scientific protocol), BitRobot (robot fleet and operations), EAIC Singapore (evaluation sites in Singapore), Hugging Face (open data and LeRobot), each with its role under the logo. **Always the official logos in their own colours**: never recolour, grey out or monochrome a partner logo (user correction, 22 Oct 2026).
- **Fleet facts** from the launch film are confirmed fixed figures (user, 26 Oct 2026): 30 Unitree G1 humanoids, 25 pairs of YAM arms, Franka arms (DROID setup), Earth Rovers (joining); SO-ARM101 is also live. Every other number is read from the API.
- **Open data:** "Every rollout, including the failures, is published on Hugging Face in LeRobot format." The RoboColosseum org goes public at launch (user decision).
- **Words:** robot or robot type (not "body"), environment or scene (not "room"), judgement (not "verdict"), head-to-head (open track) and standard tasks (fine-tuning track) on public pages. Never "0–4 scale" (task maxima are 3–7), never "real rooms, not labs" (our partners are labs), no "independent" (BitRobot runs the fleet and is a partner), no "first" or "only" (RoboChallenge, PhAIL, RoboArena, XDOF and Artificial Analysis also evaluate on real robots).
- **No globe or map.** None of the competitors uses one and ours implied reach we don't have. Diversity is shown with real footage (the wall of twelve evaluations) and a live count of scenes.
- **Less text, more footage** still holds: the hero is the film, full bleed, with the claim over it.
- **Voice:** plain, specific, sentence case, from the researcher's side ("you", "your policy").

## Logo

- The RC monogram under the colosseum arcade, from x.com/RoboColosseum. Kit in `public/brand/` (live at `/brand/`): `rc-mark.svg` (currentColor), black/white marks, dark/light/amber badges, `rc-letters.svg` and `favicon.svg` for 16–32 px, lockups and the wordmark (Archivo 800 outlines).
- One colour at a time; minimum 40 px for the full mark; the letters-only mark below that; clear space of one arch on each side; the arcade may be used as a pattern, the letters may not be redrawn.

## Direction

- References: Artificial Analysis (the benchmark publisher: white, serif one-liner, charts in cards, a changelog of evaluations) and XDOF (the instrument: dark panels on a dotted grid, mono labels, almost no copy).
- **Launch page (26 Oct 2026, BIT-3373): `/v6/`** (`public/v6/`: `index.html`, `v6.css`, `v6.js`, `matchup.js`), served at the site root once merged. Same night tokens and type as v5; layout rebuilt for flow: nine sections, one idea each, a full-bleed film hero, one amber button, mono only for numbers, no dotted panels. It reuses `public/landing/live.js` and `public/v3/board.js` (`openRows`, `fineRowsModel`, `mark`); it does not load the globe, the trial squares or the Robocurve figure.
- Chosen (22 Oct 2026): **Index in night mode**, `/v5/`. **It is the default for the whole platform** (user decision, 22 Oct 2026): the site root serves `/v5/` on Netlify, and the app pages (leaderboards, evaluations, tasks, submit, join) use the same night tokens, the v5 top bar with the RC mark, Archivo + IBM Plex Mono and the amber accent. Tokens live in `src/styles/arena.css`; `src/styles/base.css` reads them. The Index layout (claim + film window, index cards, a live feed of verdicts) on a dark page, with the control room's live ticker. Earlier explorations stay for comparison: `/v3/` (sage), `/v4/wall/`, `/v4/cinema/`, `/v4/poster/`.

## Colour

- Night mode: page `#0b0d10`, panel `#13161a`, raised `#181c21`, line `#23272d`, text `#e8eaed`, muted `#8b929c`, dim `#5e6670`.
- Accent: amber `#ffb224` (the badge colour). Used for the live dot, the primary button, the selected state. Nothing else is amber.
- Track pair, validated with the dataviz checker on the panel colour: open track `#c98500`, fine-tuning `#3987e5`.
- Categorical (bodies, rooms, sites, outcomes on the globe): the validated dark set `#3987e5 #d95926 #199e70 #c98500 #d55181 #008300 #9085e9 #e66767`.
- Do not default to the brand green/lime when exploring; the user flagged every early direction as "stuck to green/olive".

## Type

- Archivo (the wordmark's face) for claims and headings, wide (`wdth` 108–118) and heavy for claims; Archivo 400 for text; IBM Plex Mono for every measurement and label.
- No uppercase labels except the mono eyebrow style; no number markers unless the content is a sequence.

## Data and loading

- Everything is read from `/api` at load through `public/landing/live.js` and the v3 modules; `public/v3/loader.js` starts boards, the evaluation list and reviews in parallel. The router's public response cache (colosseum-router PR #4) adds edge caching when deployed.
- The in-the-wild mashup (`public/v4/video/mashup.mp4` + `cues.json`) and the wall (`wall.mp4` + `wall.json`) are cut from the humanoid team's footage; captions say "Humanoid" and the room, never a model name that was not confirmed.

## Leaderboards (22 Oct 2026)

- Modelled on Artificial Analysis (summary cards naming the leaders with lab logos, dense table with logo cells, filters, key definitions) and Arena (dark rows with numbered rank chips, logo tiles, score bars inside the rows, category tabs with icons).
- Page order: header (body · track) → body tabs with the robot glyphs → track switch with icons → four summary cards (leader with lab tile, comparisons or trials, policies, lead over #2 or median progress) → the ranking → the Robocurve figure → key definitions.
- Ranking rows: rank chip (#1 amber, #2–3 raised), lab tile + policy + lab + Hugging Face link, a bar per metric (open: rating with ±1 SE whisker on a shared axis; fine-tuning: full success fill with the Wilson 95% band, progress fill), W·T·L stacked record, counts in mono, a play icon to the evaluations. Fewer than 20 comparisons (or 10 trials) is faded and marked low evidence; pending policies are hidden behind a toggle.
- Sorting on the metric columns, text filter by policy or lab, minimum-comparisons chips (open) or task chips (fine-tuning: "All tasks" pools a checkpoint across tasks).
- Lab logos come from `src/labs.js` (same mapping as `public/landing/leaderboard.js`); icons are the inline set in `src/components/Icon.vue`.

## App pages (22 Oct 2026)

- Every app page (Leaderboards, Evaluations, Tasks, Submit a policy, Join) opens the same way: mono eyebrow → h1 "Body · Track" (the track in muted) → one-sentence lede → a live tag on the right; then the body tabs with the robot glyphs and the track switch with icons (`src/components/BoardControls.vue`); then four summary cards; then one `.board` panel with a toolbar (search, chips, count, refresh) and the content; then definitions as `<details>`. Shared rules live in `src/styles/boards.css`; page-specific rules stay scoped.
- Evaluations, open track: the board is a two-column feed + review. Feed items carry time-ago, a verdict chip (amber when a side was preferred, plain for ties), the instruction and "A vs B · room". The review card quotes the instruction, shows both sides with progress bars (the preferred side outlined amber, verdict stamp between), the evaluator / site / difficulty (label · n/10) / confidence row, and the evaluator's note; below it the two camera packages with mono captions on the video.
- Evaluations, fine-tuning: same feed and card for scored trials (outcome chips green / red / amber, score with a bar, episode, criteria, note, cameras) and for imported datasets (episode select in the result row, the synchronized player with play/pause icon, scrubber and speed).
- Tasks: the open track explains how an instruction is written on the spot; the fine-tuning suite lists the draft Franka cards in a grid (id, category icon, site, milestones, demos) with a detail panel (predicate quoted on an amber rule, ordered milestones as numbered steps). Other bodies show an empty state until their cards exist.
- Submit and Join: header, four "what you get / what you do" cards, two panels (numbered steps, key/value requirements, buttons) and the embedded form once a real Google Form id replaces the `REPLACE_WITH_…` placeholder; until then a note points to GitHub.
- Numbers: `fmt` and `pct` from `src/labs.js`; time-ago in mono; never a bare percentage in a sentence.
