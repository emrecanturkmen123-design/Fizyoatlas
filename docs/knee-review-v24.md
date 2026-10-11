# Knee deformation fix · V24

## Reproduced defects
The old origin-to-insertion weights blended the entire thigh and calf during knee flexion. At 120° this dragged thigh muscle bellies away from the femur and collapsed calf surfaces. CPU lateral projections reproduce the reported distortion.

Both iliotibial tract surfaces were also incorrectly classified as skeletal. The motion renderer therefore retained these stationary fascia meshes across a flexed knee.

## Changes
- Knee-only skin weights localised to the joint neighbourhood. Thigh bellies remain with the proximal segment; calf bellies move rigidly with the lower leg.
- Dual-quaternion blend in the knee transition avoids the shrinking of linear matrix interpolation. Other limb deformation paths unchanged.
- Iliotibial tracts classified as connective tissue; no longer rendered as stationary bones during motion. Source coordinates/topology untouched.

## Validation
- TypeScript, existing 120-pose limb regression and bilateral knee motion tests passed.
- New regression: 32 bilateral flexion/extension poses, 111104 muscle-belly checks; source buffers unchanged, finite positions/normals, fascia classification.
- Before/after CPU lateral projections at 120° saved alongside this note. `scripts/export-limb-qa.mjs` exports production geometry.
- WebGL unavailable in test browser; no claim of GPU/browser 3D visual verification. Approximate hinge/skin model still does not simulate tissue collision, patellar tracking or physiological force.
