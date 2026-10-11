# Tendon review, 2026-10-01

This review preserves the published v38 geometry and adds two source-labelled proximal ECRB components. It does not declare all human tendons or all layers of the selected tendons complete.

## Source coverage

Both the official Z-Anatomy and Z-Biomechanics `Startup.blend` archives were inspected at the object and evaluated material/triangle level. Source URLs and archive hashes are in the accompanying inventories; added part hashes are in `public/models/extensor-region-source.json`.

| Area | Available in these sources | Remaining limit |
| --- | --- | --- |
| Supraspinatus, subscapularis, teres minor | Insertion footprints and muscle context | No separate complete tendon body in either inspected source |
| Common extensor | Original origin footprint plus newly separated proximal ECRB component on each side | ECRB is one contributor; no complete shared body or all contributing fibres |
| Quadriceps | Existing distal tendon material from rectus femoris, vastus lateralis and vastus intermedius; all four muscles shown | Vastus medialis has 656 proximal-origin triangles and only two tiny distal triangles below the selected quadriceps region; these do not constitute the missing complete layer |
| Long and distal biceps | Existing separately selected source tendon regions | No full labrum, pulley, sheath or bicipital aponeurosis |
| Achilles, infraspinatus, patellar connection and four ligament cards | Existing source geometry and explicit scope labels | Reference surfaces and approximate educational motion, not tissue mechanics or patient anatomy |

The two new ECRB parts each contain 249 vertices and 453 triangles. Their original arrays are retained after the existing regional registration. The static proximal patch is approximately 1.45/1.47 mm from the reference humerus at the median. These BVH distances describe registration proximity, not medical accuracy or a seamlessly welded insertion.

## Fixes

- Common-extensor selection shows the same-side ECRB region and related muscles. The auxiliary region is excluded from unnamed model-finding candidates.
- Infraspinatus continuation now handles the source's `infraspinatus muscle` name; the muscle was previously absent from its tendon context.
- Pronation/supination can display the actual distal biceps tendon. Its radial endpoint follows the radius and its proximal transition follows the established bent-elbow pose. No procedural tendon band is substituted.
- Demand loading and rig rebuilds honour the tendon switch.
- Small-screen Atlas lists are visible; reading cards can expand/collapse without losing the route. Main controls have larger touch areas, comparison tables stack into labelled values, input fonts avoid iOS focus zoom, safe-area offsets are used, and short landscape screens separate model and reading space.

## Verification

- TypeScript and source-preservation checks: 2,323 historical parts byte-for-byte, ten source-separated imports with matching hashes, 28 finding questions and 2,300 triangle picks.
- Knee: 204 bilateral poses, 52,632 endpoint checks. Forearm: 204 pronation/supination poses, 6,732 radial endpoint checks, finite normals, switch-off and source preservation. Achilles: 28 poses. Existing demand-loaded/full rig comparison: 18 bilateral conditions.
- Static source geometries were rendered in Blender Cycles on CPU. Production-rig position exports were inspected at 0/50/100% for elbow, shoulder, knee and ankle. `reference-surfaces.png` uses exact shipped triangles with translucent bone context.
- Browser interaction and layout checks used the actual application inside CSS viewports of 320×640, 390×844, 430×932 and 844×390. Card expansion, comparison links, the model-finding fallback and the distal tendon switch were exercised. Comparison/card widths have no horizontal overflow at tested sizes. Landscape and toolbar-aware camera framing are checked separately.

## Unverified

The available cloud browser cannot create a WebGL context. No physical phone is accessible. Live GPU rendering, pinch/rotate behaviour, thermal or memory limits, physical-device performance and Safari safe-area behaviour have not been certified. CPU renders and numerical endpoint checks do not replace those checks. The supervised frontend preview does not provide the production learning API; no learning-record persistence claim is based on that preview.

Existing educational deformation can still differ from soft-tissue collision and true tendon mechanics. No claim of collision-free or patient-specific motion is made.
