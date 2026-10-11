# Tendon review and cards — 2026-09-22

Reviewed the shipped binary geometry, source selection metadata, import registration,
existing offline geometry rendering, scene motion filters and card routing.

- Achilles reuses BodyParts3D FJ1405/FJ1405M; it is not a newly fabricated tendon.
- Infraspinatus comprises source-labelled tendon faces, not a validated full tendon volume.
- Supraspinatus, subscapularis and teres minor comprise insertion footprints only.
- Shoulder registration uses bone envelopes (RMS 3.54–3.84 mm), not surface landmark
  validation. This residual is not a measurement of tendon attachment accuracy.
- Connective surfaces are excluded from the animated muscle/bone rigs; these are
  static atlas structures, not tendon strain simulations.
- No geometry was changed in this review. A complete cuff reconstruction and
  attachment/deformation validation remain outstanding.

Added five tendon information cards with muscle connection, insertion, transmitted
action, clinical context, model scope and AAOS/UW references. Corrected the Achilles
card's model attribution to BodyParts3D. Existing ligament cards are preserved.

Validation: TypeScript passed; existing clinical anatomy validation passed; clinical
binary hash matches provenance; all 12 source-atlas tendon/footprint surfaces have
finite coordinates and valid triangle indices. Browser confirmed all five cards open
with matching anatomy, and Achilles clinical/source disclosures expand. WebGL remains
disabled in the remote browser, so live 3D appearance and picking are not verified.
