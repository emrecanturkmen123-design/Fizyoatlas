# V21 — Tendon continuity audit and presentation fixes

Inspected the actual shipped float32/index buffers in Blender 4.3.2 using CPU
Cycles renders and BVH point-to-triangle distance queries, independent of WebGL.
The reusable script is `scripts/audit-tendon-geometry.py`; invoke Blender with
`--background --factory-startup --disable-autoexec --python scripts/audit-tendon-geometry.py -- --output <directory> --render`.
Measurements and four renders are in `docs/tendon-review-v21/`.

## Findings

- Achilles distal 12 mm surface to calcaneus: median 0.519 mm right, 0.351 mm left.
  Minimum separation 0.154/0.009 mm. This does not show a large displaced tendon.
- Achilles proximal 30 mm surface to gastrocnemius/soleus: median 0.456/0.468 mm.
  Its proximal end continues into muscle, not a second bone attachment.
- Clinical selection hid the muscle layer, making the proximal end appear detached.
- Selection retained the exploded-view amount, separating connective tissue and bone.
- Three shoulder insertion footprints remain near the humerus (all queried vertex
  distances below 2.56 mm). They are volumetric reference surface meshes, not exact
  patient landmarks. Infraspinatus includes a proximal tendon region, so its farthest
  point being 15–16 mm from humerus is not in itself evidence of an attachment gap.
- The source muscle model already includes its distal contour; imported shoulder
  regions partly overlap that contour. Transparent muscle context preserves the
  selected region's visibility without claiming a seamless reconstructed cuff.
- The coverage badge ignored connective cards and falsely reported “Henüz yok”.

## Changes

Select a tendon to show its corresponding same-side muscles even when the general
muscle layer is off. Preserve explicit hiding and isolate behavior. Clinical structure
selection resets explosion. Focus waits for reassembly and includes visible muscle
context. Achilles/posterior cuff entries open a posterior view. Coverage badges now
recognize existing clinical cards. All five source-linked tendon cards remain, with
an explanation of muscle continuity and the partial-model limits.

No source mesh was stretched, joined to an unrelated bone or otherwise reshaped.
No evidence warranted changing Achilles geometry. Complete supraspinatus,
subscapularis and teres minor tendons are still absent; their footprints remain
explicitly labelled. Animated tendon deformation remains outside the current model.

## Verification

TypeScript and existing clinical anatomy checks passed. New tests verify both Achilles
sides, all five card/context mappings, no opposite-side leakage and no unwanted
context for unrelated selections. Browser UI confirmed explosion 100 → tendon
selection → 0, the Achilles card and “Bilgi kartı: Var”. CPU renders were inspected
from posterior and lateral views. Distances measure proximity, not anatomical accuracy
or a continuous mesh weld. WebGL rendering/picking remains unverified in this browser.
