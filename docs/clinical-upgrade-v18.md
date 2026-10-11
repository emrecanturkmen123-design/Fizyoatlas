# V18 — Clinical learning upgrade

## Shipped scope
1. All 130 case decisions now have three authored, clinically relevant distractors and
   four choice-specific explanations (520 explanations). The 290-question quiz uses
   the same explanation mapping; legacy question IDs remain supported.
2. Cases use a 760 px reading panel, a 420 px model split view and a full-height mobile
   reading view. Progress resumes by case and learn/exam mode. D1 migration 0001 adds
   `case_progress`; previous migrations are unchanged. Scores derive from stored choices.
3. The ankle case contains a real examination branch: Ottawa screening, optional
   syndesmosis/posterior-tendon findings, and reassessment before unsafe/early tests.
   The selected path is saved and reviewed. Branch exploration is explicitly unscored;
   the score remains ten clinical decisions. This is the pilot branching case, not all 13.
4. Every case has a three-stage exercise illustration, one-cycle playback, quality cues,
   regression/progression and source links. Available anatomical movement links open the
   existing muscle rigs. A closed-chain heel raise is shown in the original schematic;
   its 3D link is clearly only the open-chain plantar-flexion component.

## Anatomy
16 new bilateral Z-Anatomy-derived surfaces: ACL, ATFL, CFL, PTFL, infraspinatus tendon,
supraspinatus insertion, subscapularis insertion, teres minor insertion. The last three
are explicitly insertion footprints, **not complete tendons**; the source does not
separately segment those complete tendons. The original BodyParts3D Achilles meshes
FJ1405/FJ1405M are reused without duplication. Atlas has 2,321 surfaces, 3,520 concepts,
2,441,046 triangles. The new chunk is small and retains CC BY-SA 4.0 provenance.
The Atlas “Bağ / tendon” tab exposes nine structures. Turkish search aliases and
structure descriptions distinguish ligament, tendon and footprint. Case anatomy tasks
now target the relevant structure, rather than substitute muscle bellies.

Source scripts are disabled during Blender import. Source modifiers are evaluated;
no ligament path or tendon is fabricated. Local corresponding bone-region envelope
fits have residuals of 3.54–5.67 mm. These are approximate reference registrations,
not clinical accuracy claims. Source/licence/hash/transforms/face selection are in
`public/models/clinical-source.json` and `public/ATTRIBUTION.md`.

## Persistence behavior
- Trusted Sites identity headers authorize reads/writes; user IDs are never accepted
  from the browser. Data is scoped to account; shared accounts share progress.
- Learn/exam modes are independent. Contiguous answers, branch transitions, hints,
  version, choice bounds and progression are validated on the server.
- Writes are serialized and coalesced; failed writes remain queued with retry and
  unsaved-navigation protection. A failed initial load cannot silently overwrite a
  saved record. Users may explicitly continue without saving during an outage.
- Guests keep progress in page memory only. No localStorage durability is claimed.
- Concurrent independent tabs/accounts using the same identity are last-write-wins.

## Verification
Passed: TypeScript; 130 case/feedback checks; 290-question pool and 112 configuration
combinations; SQLite-generated migrations and Worker identity/CSRF/input/save/load tests;
five branch paths; all 13 exercise renders and valid movement links; UI SSR;
workspace framing checks; all binary buffers and concept mappings; 16 new surfaces,
existing Achilles reuse, Turkish aliases and explicit footprint distinctions.
Browser preview: wrong-choice feedback, branch recovery after premature hop choice,
screening and syndesmosis findings, resumed branch, journey through exercise stage,
manual exercise phases, playback stopping, model split width and no horizontal overflow.
The preview browser cannot initialize WebGL. UI tests do not certify live WebGL rendering.
New meshes were separately rendered from actual binary geometry for a spatial review;
full GPU/interaction verification on a WebGL-capable device remains a limitation.
The local preview lacks the authenticated production API; durable save/load and account
isolation were exercised against the actual Worker with real SQLite migrations.

## Clinical references
Case-specific guideline links are retained. Exercise material uses AAOS conditioning
resources, NICE NG59/NG226/NG236, the Aspetar ACL rehabilitation guideline, the JOSPT
patellofemoral guideline and the APTA Parkinson guideline. All patients, measurements
and follow-up findings are fictional teaching scenarios. Exercise graphics are original
schematics, not copied source illustrations or personalized prescriptions.
