# RoboColosseum design language

The decisions behind the landing pages, as the user stated them. Read this before touching any page under `public/`. When a decision changes, change it here first.

## What we are and how we say it (26 Oct 2026, BIT-3373)

The v5 copy got bad feedback ("copy is bad or misleading... messy... doesn't give strong flow or CTA"). The **launch film script** (with its interview guide) is the source of **facts and positioning**, not of copy: a first v6 draft that followed the film scene by scene and reused its lines was rejected the same day ("u took literally the interview and made it a website... dont COPY exactly what is mentioned in the interview"). Write the page in our own words, organised as a website, not as a film. The previous rules ("Evaluations made in the wild" as headline, the 10,000-hour *dataset* as call to action, "every number is live") are superseded.

- **Never lift film or interview lines verbatim** onto a page: not the tagline ("The proving ground for Physical AI"), the scene titles or the speakers' sentences. Use the ideas (no robot needed on your side, one protocol for everyone, every run published, free academic hours) in fresh wording.
- **Hierarchy (21 Oct 2026 huddle with Michael Cho, re-confirmed by the user on 26 Oct):** in the wild first, cross-embodiment second, scale third, partners as logos. The words **"in the wild" appear above the fold** (not only "real world"). Less text, more footage, especially in the hero. Benchmark detail (rankings, the method, a sample comparison) goes **below the fold**. Scale is shown on **several axes** (runs, scenes, instructions, policies, tasks, robot types; hours and locations once the API records them), never one metric. Earth Rover is always included.
- **Headline:** *Physical AI, in the wild.* (user pick, 26 Oct 2026, after "Benchmarking robot policies in the wild." was too long). Under it, one short line: humanoids, arms and rovers, running real models in homes, offices and campuses.
- **Blog (`/v7/blog/`):** Jiafei's draft post in his words (only the product-name typo in the title fixed), with the doc's two figures on white panels, the DCR equation in MathML and marked slots for the teaser and third-person videos still to come. It is linked from the top bar and the footer.
- **Plain section titles (user, 26 Oct 2026: "I hate that").** A section's title is its plain name: In the wild, Our robots, Our scale, The leaderboard, How it works, Evaluations, Open data, Academic access, FAQ. Never a clever line as the title ("Who leads on each robot.", "The record so far."); a descriptive line goes underneath as a short subtitle. Only the hero headline is a sentence.
- **Clear sections.** Every section after the hero is a full-width band with its own background (alternating `--paper` / `--band`, one light band for the academic offer). Its header is the plain title, the section link on the right of the same row (Full leaderboard, Browse all evaluations, Browse on Hugging Face), and the subtitle below.
- **Order:** hero (film) → founding partners strip (logos directly under the hero, user request of 22 Oct) → **In the wild** (the wall of twelve real evaluations, scenes per robot type) → **Robots** (the five robot types) → **Scale** (six live figures) → below the fold: Leaderboard → How it works (three steps, two kinds of score, one line each) → Evaluations (one real comparison) → Open data → Academic access → FAQ (includes fairness and "why real robots instead of simulation").
- **One call to action: "Submit your policy".** It appears in the top bar (the app pages get the same button when v7 becomes the site root; see commits 04f29e5 and d898f79 for that change), the hero, the end of How it works and the Academic access band. Every copy has the same label and the same destination. **No secondary buttons** (user rule, 26 Oct 2026): the leaderboard, evaluations, data and "Join as an evaluator" are plain links or footer items. Amber is used only for this button.
- **The offer (open question):** the launch film and the CoRL whitepaper describe *10,000 hours of free evaluation for academic researchers*; the 21 Oct huddle named *the 10,000-hour dataset* as the day-one call to action. The page currently says "Academic labs evaluate free, from a pool of 10,000 hours" under "Submit your policy". Until the user and Michael settle which it is, don't write either as the other.
- **Founding partners** (not "co-organizers"): NUS MAGIC Lab (evaluation protocol), BitRobot (robots and operations), EAIC Singapore (test sites in Singapore), Hugging Face (open data and LeRobot), each with its role under the logo. **Always the official logos in their own colours**: never recolour, grey out or monochrome a partner logo (user correction, 22 Oct 2026).
- **Fleet facts** are confirmed fixed figures (user, 26 Oct 2026): 30 Unitree G1 humanoids, 25 bimanual YAM stations, Franka arms (DROID setup), Earth Rovers (joining); SO-ARM101 is also live. Every other number is read from the API.
- **Robot cards and setups (v7, Jiafei's request):** the card photos are the team-supplied product shots (`public/v7/robots/`, shot on white, so the stages are light `#eceef1` with `mix-blend-mode: multiply`). A robot with a documented setup opens a dialog with its labelled setup photo (`public/v7/setups/`) and its parts list from the team's purchase sheet (`public/v7/setups.js`; shop links without tracking parameters; prices as listed, currency per supplier). Franka has no list in the sheet and links to the DROID hardware guide instead.
- **Locations (Jiafei, 26 Oct 2026), kept apart by track:** open-track evaluations run in Singapore, China, Seattle (United States) and Oxford (United Kingdom); fine-tuning datasets were recorded in Singapore, Kuala Lumpur (Malaysia) and China. No city in China, coordinates or per-site counts were given, so none are shown. Scale counts 5 countries.
- **Open data:** every evaluation run, failed attempts included, is released on Hugging Face in LeRobot format. The RoboColosseum org goes public at launch (user decision).
- **Words:** robot or robot type (not "body"), scene (not "room"), comparison and the evaluator's pick (not "verdict"), head-to-head (open track) and standard tasks (fine-tuning track) on public pages. Never "0–4 scale" (task maxima are 3–7), never "real rooms, not labs" (our partners are labs), no "independent" (BitRobot runs the fleet and is a partner), no "first" or "only" (RoboChallenge, PhAIL, RoboArena, XDOF and Artificial Analysis also evaluate on real robots).
- **No globe or map.** None of the competitors uses one and ours implied reach we don't have. Diversity is shown with real footage (the wall of twelve evaluations) and a live count of scenes.
- **Less text, more footage** still holds: the hero is the film, full bleed, with the claim over it.
- **Voice:** plain, specific, sentence case, from the researcher's side ("you", "your policy").

## Logo

- The RC monogram under the colosseum arcade, from x.com/RoboColosseum. Kit in `public/brand/` (live at `/brand/`): `rc-mark.svg` (currentColor), black/white marks, dark/light/amber badges, `rc-letters.svg` and `favicon.svg` for 16–32 px, lockups and the wordmark (Archivo 800 outlines).
- One colour at a time; minimum 40 px for the full mark; the letters-only mark below that; clear space of one arch on each side; the arcade may be used as a pattern, the letters may not be redrawn.

## Direction

- References: Artificial Analysis (the benchmark publisher: white, serif one-liner, charts in cards, a changelog of evaluations) and XDOF (the instrument: dark panels on a dotted grid, mono labels, almost no copy).
- **Launch page (26 Oct 2026, BIT-3373): `/v7/`** (`public/v7/`: `index.html`, `v7.css`, `v7.js`, `matchup.js`, `setups.js`, `chrome.js`, and the blog at `/v7/blog/`). Deployed as its own namespace; the site root still serves `/v5/` until the user decides to switch it. Same night tokens and type as v5; layout rebuilt for flow: named full-width bands (one job each, alternating backgrounds, a header bar per section), a full-bleed film hero, one amber button, mono only for numbers, no dotted panels. It reuses `public/landing/live.js` and `public/v3/board.js` (`openRows`, `fineRowsModel`, `mark`); it does not load the globe, the trial squares or the Robocurve figure.
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
