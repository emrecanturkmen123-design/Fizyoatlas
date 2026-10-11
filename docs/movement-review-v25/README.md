# V25 movement audit

Request: test every movement, repair deformation defects, and keep muscle/antagonist/plane teaching layers opt-in.

## Changes

- All 20 movement entries and links start in skeleton mode, with plane, antagonists, attachment helpers, cuff/tendon and Achilles context off. Changing the movement resets these extras and playback; explicit choices persist through stepping/playback. Saved card/case return state is retained. Disclosure panels close on a new movement.
- Gait muscle highlighting is off until its switch is enabled; muscle cards are in a closed disclosure.
- Hip: long thigh muscle bellies follow the limb, with deformation concentrated near the proximal attachment rather than bowing across their entire length. Rigid blending avoids rotational collapse.
- Ankle: calf bellies remain with the shank; distal muscle regions follow attachment displacement instead of rotating far above the ankle. The source Achilles surface follows nearby calf tissue proximally and the calcaneal transform at its distal 12 mm.
- Forearm: source muscles first take the fixed 90-degree elbow pose, then follow radial rotation. Biceps belly stays in that pose; the distal region follows radial-attachment displacement. This removes the large short-head flap produced by rotating the distal surface about a remote axis.

## Verification

- Initial full regression run: shoulder motion/roles/muscles/study, scapula, elbow, anatomical biceps/triceps, contractions, muscle demo, lower limb, limb muscle rig, knee, knee deformation, Achilles and stability scripts passed.
- Shipped production geometries exported at 0, 50 and 100% for 20 movements on both sides: **120 poses**. Finite surfaces and rigid bone transforms asserted. CPU projections visually inspected; before/after images included for modified families. Shoulder/knee plots are unchanged from the initial audit.
- After edits: 120 limb poses; 28 Achilles poses; 32 knee poses with 111,104 protected belly vertex checks; 48,030 protected hip/calf checks; 71,540 bent-forearm checks. Added radial-tip displacement bound for biceps. Source arrays remain unchanged; attachment rules and disposal pass.
- 20 movement default/reset tests cover opt-in, stepping, and saved card return. SSR UI test and TypeScript check pass.
- Cloud preview UI: every movement on both sides (**40 combinations**), muscle mode, next step and angle output; shoulder plane/antagonist on-off, persistence during stepping and reset on movement selection; eight gait phases; three contraction modes (39, 111, 90 degrees after first step), playback stopping at 100 and reset to 0. Gait opt-in switch checked separately.

## Reproduction

`node --import ./scripts/register-typescript.mjs scripts/review-all-motions.mjs /tmp/motion-review`

`python scripts/render-all-motions.py hip /tmp/motion-review` (also shoulder, elbow, knee, ankle)

Run `scripts/validate-movement-options.mjs` and `scripts/validate-local-deformation.mjs` with the same TypeScript loader; existing movement regression scripts remain available.

## Limits

Preview browser cannot create a WebGL context in this environment. These images are CPU projections of the actual shipped meshes, not GPU/browser screenshots. Browser checks establish UI behavior, not GPU rendering, picking or frame rate. Native bone geometry, approximate pivots and source overlaps remain; soft-tissue collision, force, patellar tracking and clinical accuracy are not fully simulated. Gait is phase education in a static reference pose, not walking animation.
