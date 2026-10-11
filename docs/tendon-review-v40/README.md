# Tendon source body completion · V40

This update completes the selected ten-tendon educational study set with the five previously missing reference model groups on both sides: supraspinatus, subscapularis, teres minor, the four-contributor proximal extensor complex, and the common quadriceps envelope. It does not claim to model every human tendon, histological architecture, pathological tissue or measured biomechanics.

## Source and extraction

Open3DModel / AnatomyTOOL provides the July 2025 upper/lower limb GLB and Blender packages under CC BY-SA 4.0. Source authors and credits, exact downloaded GLB hashes, registration, source object selections and final array hashes are recorded in `public/models/open3d-tendon-source.json` and `public/ATTRIBUTION.md`. The extraction script is `scripts/import-open3d-tendons.py` (numpy/scipy/DracoPy).

The three new cuff regions and four proximal extensor contributors follow the source's pale tendon texture region. Source triangles are clipped at UV v=0.12/0.88, and the appropriate humeral or proximal connected region is retained. This is an approximate educational musculotendinous boundary, not histological segmentation. No invented bridging tube or fictitious fibre fusion is made. The four extensor components retain distinct source shapes within one selectable complex.

Quadriceps uses the actual source common tendon envelope proximal to the superior patellar pole. Unlike the previous three-muscle material selection, this source envelope represents the common ending, including the medial contribution. Vastus medialis is not called an independent fourth layer. The model depicts the shared outer envelope; the layered architecture is explained in the card with Grob et al. 2016 (https://link.springer.com/article/10.1186/s40634-016-0068-y). Internal layers are not separately segmented.

Meshes undergo uniform regional bone-envelope registration. Shoulder insertion alignment is a uniform translation below 5 mm. Left source geometry is mirrored and independently registered; winding is reversed. These are composite reference models, not patient-specific anatomy. All 2,333 pre-existing source arrays remain byte-for-byte unchanged.

## Integration

Source bodies replace historical footprints in the active study selection while preserving saved clinical route keys. Search, direct picking of retained historical pieces, information cards, comparison scopes, model-finding answers and motion views resolve to the preferred source body. Previous footprint and ECRB source arrays remain intact.

The shoulder rig follows the source cut boundary on the muscle side and a normalized relative attachment score at the humeral insertion. This matters for short, broad tendons: a fixed 12-mm bone-distance threshold left the muscle boundary partly tied to bone. Proximal boundary vertices now follow the stabilized muscle, insertion patches follow the humerus, and neutral geometry is restored. The common quadriceps follows the muscle side and the schematic patellar transform.

## Verification

- `validate-open3d-tendons.mjs`: all 2,333 previous source meshes preserved; ten new array hashes; four distinct extensor contributors; 192 bilateral shoulder poses; 31,968 rigid humeral and 28,320 muscle-boundary checks; 88 bilateral quadriceps poses with four muscle heads and 39,424 patellar attachment checks; demanded buffers and neutral restoration.
- `validate-shoulder-study.mjs`: 120 cuff poses and shared study/rig mapping, finite geometry, disposal and toggles.
- `validate-demand-rigs.mjs`: all 18 bilateral production rigs retain identical coverage with demand loading.
- `validate-tendon-completion.mjs`: existing source meshes and historical imports, all 28 model-finding questions and triangle picking, biceps and quadriceps attachment checks.
- `validate-connective-study.mjs` and `validate-tendon-learning.mjs`: all 14 bilateral tendon/ligament cards, 50 explained tendon questions, five comparisons, route compatibility, learning and case resume through real SQLite.
- TypeScript and production build pass before publication.

`reference-surfaces.png` and `attachment-distances.json` inspect exact shipped neutral triangles. The distances are nearest-reference-vertex diagnostics, not clinical measurements or exact bone-surface contact. `shoulder-motion.png` and its gzipped scene export inspect production moving geometry at 0/50/100% in abduction and external rotation. These are CPU projections, not WebGL screenshots. No physical-device rendering or measured tissue dynamics is claimed.
