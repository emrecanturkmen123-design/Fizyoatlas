# Shoulder study integration · V22

## Delivered
- One four-muscle rotator cuff mapping drives shoulder study actions and the moving source regions.
- Each cuff muscle offers muscle card, tendon/footprint card, origin/insertion and appropriate movement. Side is preserved, playback pauses, and returning restores the movement position.
- Linked rotator cuff case opens/resumes its existing learning record only after the persistence gate permits it. The fictional case remains right-sided. Returning restores the user's original shoulder side and position.
- All four cuff muscles can be shown together during movement. Independent source-region visibility switch.
- Three source insertion footprints move rigidly with the humerus. Source-labelled infraspinatus tendon vertices follow nearest muscle-surface displacement after stabilisation. No invented tendon tube or new anatomical segmentation.
- Removed heuristic ivory colouring of shoulder muscle tips so ivory denotes the separate source regions only.
- Supraspinatus, subscapularis and teres minor insertion seeds now use the corresponding source footprint bounding-box centre before projection to bone, instead of independent envelope fractions.

## Verification
- TypeScript check passed.
- Shoulder roles, cards, motion and original muscle-rig regression tests passed.
- New shoulder-study test: 120 poses (six movements, two sides, five positions, scapular mode on/off), four regions per pose, finite positions/normals, unchanged source buffers, rigid bone footprint transforms, muscle-relative tendon displacement, visibility and disposal.
- CPU projections of production geometry exported by `validate-shoulder-study.mjs` and rendered by `render-shoulder-review.py`; see `shoulder-review-v22/poses.png`. These are source mesh projections, not generated anatomical illustrations or browser screenshots.
- Browser UI: left external rotation at 10% -> left infraspinatus tendon card -> return preserved 10%; left supraspinatus attachments -> active O1/I1; linked case opens after guest gate. Preview persistence endpoint unavailable; no account records modified.

## Remaining limits
- Only infraspinatus has a source-labelled tendon region. The other three regions are insertion footprints, not full-length tendons. This is explicit in panel and cards.
- Muscle deformation, scapular rhythm and regional attachment marks remain educational approximations. This is not an anatomically validated muscle-force, tendon-strain, collision or tear simulator.
- CPU projections expose existing mesh simplification/intersections; they do not certify anatomical fidelity. Original atlas geometries and licence attributions are unchanged.
- Test browser cannot create a WebGL context; UI was exercised, but hardware-rendered 3D interaction was not visually verified. Geometry QA runs independently on CPU.
