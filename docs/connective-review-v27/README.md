# Connective study — V27

## Delivered

- Atlas connective index: ankle/knee/shoulder filters and persistent connective tab when returning from a card.
- Same-side selection with only related bones and tendon muscle context; optional full context and background opacity control. No opposite-side geometry included in local selection.
- Sourced attachment/function/clinical cards for ACL, ATFL, CFL and PTFL; five existing tendon cards retained.
- Patellar ligament/tendon educational card and patella/tibia references. No full verified patellar mesh is present; index, card and coverage explicitly report this. Search opens its reference card. Source inspection found attachment objects, not an available complete evaluated tendon mesh.
- Direct tendon-card entry to Achilles/shoulder muscle-and-tendon motion. General movement selection retains its opt-in defaults.
- Existing Achilles, ACL rehabilitation, ankle sprain and cuff case links, with return to the original structure/side. Cases retain their own authored patient side and persistence gate.

## Checks

- Type check and production build.
- All ten educational cards render; twenty bilateral context/selection configurations pass; case IDs resolve to authored model targets; patellar model coverage remains absent.
- Existing source tendon context and clinical anatomy tests pass.
- Achilles: 28 bilateral movement poses pass endpoint/source/visibility checks. Inspected six right-side production-geometry CPU projections at start/mid/end for plantarflexion and dorsiflexion.
- Shoulder: 120 cuff poses pass existing tendon-following, rigid footprint, neutral/source and visibility checks. No deformation code or model binary changed in this version.
- Browser: region filtering, left selection, opacity keyboard adjustment, local context switch, Achilles movement/calf switch, Achilles card return, Achilles/ACL/ankle cases and return, patellar card, and infraspinatus external-rotation entry tested.
- Preview storage was unavailable; case QA used the existing explicit guest fallback. Production account storage was not changed.

The test browser still cannot initialize WebGL. UI interactions were tested in the browser; geometry checks and projections ran on the CPU. No claim of GPU visual verification or fully physical tendon/ligament mechanics.

See `card-ui.jpg` for the actual inspector UI (cropped browser screenshot).
