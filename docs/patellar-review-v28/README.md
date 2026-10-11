# Patellar tendon model — V28

Both sides now have separate selectable patellar tendon/ligament geometry, a working card, side selection, local bone context, transparency and search aliases. Reference-only labels and forced absent-model coverage were removed.

## Source and extraction

Z-Anatomy's evaluated `Rectus femoris muscle.l/r` contains tendon-labelled faces extending below the patella to the tibial tuberosity. The previously inspected `Patellar ligament.o*/e*` objects alone are attachment footprints. This update extracts the distal tendon-material geometry, clipping its proximal boundary at the upper extent of the source patellar origin footprint. It does not invent a replacement tube/band or label the footprints as a complete tendon.

The existing knee registration is followed by a small endpoint translation blend (each end under 2.5 mm). Geometry, source attribution, binary hash, transforms and cut heights are recorded in `public/models/patellar-source.json`. Blender embedded scripts are disabled during export. Adapted geometry remains CC BY-SA 4.0.

## Verification

- 478 vertices / 852 triangles per side; each surface is one connected component.
- Actual triangle-surface distance audit verifies contact within 0.5 mm at both attachment ends on both sides. This tests attachment contact, not exact conformity of every outer tendon surface point; full distributions are retained in `attachment-audit.json`.
- Inspected the exact shipped meshes from front and side for both legs in `patellar-model.png`.
- All atlas binary buffers and concept references validated; same-side selection, model coverage, searchable aliases and all connective cards validated; TypeScript check passes.
- Static atlas model only. Patellar tracking, strain and dynamic knee tendon deformation are not implemented. The available browser cannot initialize WebGL; the image is an exact-geometry CPU projection, not a browser screenshot.

To regenerate: run `export-patellar-source.py` with bpy 4.3 / NumPy 1.26 and the licensed source blend, then `import-patellar-tendon.py` with its export directory. The latter replaces only its own last atlas chunk on rerun.
