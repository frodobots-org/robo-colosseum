# RoboColosseum design language

The decisions behind the landing pages, as the user stated them. Read this before touching any page under `public/`. When a decision changes, change it here first.

## What we are and how we say it

- **What we build:** the independent, real-world benchmark for physical AI. Policies from every lab run on real robots in real rooms, judged blind by people, ranked per robot body.
- **Main message:** *Evaluations made in the wild.* It is the headline and the first section. "Tested in the wild" was rejected: it names the method, not the thing.
- **Second message:** cross-embodiment. One protocol, every body: Franka, SO-ARM101, Bimanual YAM, Unitree G1, Earth Rover Mini+ (joining).
- **Order of the page** (huddle with Michael Cho, 21 Oct 2026): in the wild → every body → scale on several axes (bodies, sites, rooms, tasks, rollouts, evaluators, days) → then the benchmark detail (leaderboards, a real pair, every trial, the two tracks) → join. The co-organizer logos (Hugging Face, BitRobot, EAIC) sit as one line directly under the hero, as a credibility strip, not a section (user decision, 22 Oct 2026); they appear once on the page plus the footer mention. **Always the official logos in their own colours**: never recolour, grey out or monochrome a partner logo (user correction, 22 Oct 2026).
- **Less text, more footage.** The hero carries real recordings (the in-the-wild mashup), not copy. Benchmark examples and evaluations sit below the fold.
- **Day-one call to action:** the 10,000-hour dataset. Second: see the leaderboards.
- **Voice:** plain, specific, in sentence case. Every number on the page is live from the API; never a static figure.

## Logo

- The RC monogram under the colosseum arcade, from x.com/RoboColosseum. Kit in `public/brand/` (live at `/brand/`): `rc-mark.svg` (currentColor), black/white marks, dark/light/amber badges, `rc-letters.svg` and `favicon.svg` for 16–32 px, lockups and the wordmark (Archivo 800 outlines).
- One colour at a time; minimum 40 px for the full mark; the letters-only mark below that; clear space of one arch on each side; the arcade may be used as a pattern, the letters may not be redrawn.

## Direction

- References: Artificial Analysis (the benchmark publisher: white, serif one-liner, charts in cards, a changelog of evaluations) and XDOF (the instrument: dark panels on a dotted grid, mono labels, almost no copy).
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
