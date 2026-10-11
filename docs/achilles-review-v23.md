# Achilles study · V23

- Reuses unmodified source calcaneal tendon meshes FJ1405/FJ1405M; no generated anatomy.
- Adds the tendon and same-side gastrocnemius/soleus to anatomical ankle movement, with an independent visibility switch. Distal 12 mm shares calcaneal rotation; proximal blend follows nearby calf weights. The interpolation is educational, not a physical tendon simulation.
- Uniform ankle muscle colour distinguishes source tendon from approximate colour-based regions.
- Source tendon card, same-side calf cards, calcaneal insertion marker and existing Achilles case linked from ankle panel; return pauses and preserves side/movement/progress. Static tendon card also opens movement.
- Tendon insertion control deliberately has no bone-origin marker. A tendon continues into muscle proximally.
- Card explains midportion versus insertional symptoms and rupture/Thompson assessment. Primary references: AAOS Achilles Tendinitis and Achilles Tendon Rupture, already linked in its source disclosure. No treatment dose prescription or tear geometry added.

## Checks
- 28 bilateral ankle/tendon poses: finite positions/normals, exact rest/source preservation, distal calcaneal transform, same-side calf context, selection IDs, toggles and disposal.
- Existing 120-pose limb regression and lower movement tests passed; TypeScript passed.
- Production geometry CPU projections inspected (poses.png); no gross distal separation. Existing coarse source surfaces and intersections remain; images are projections, not hardware-rendered browser proof.
- Browser exercised left plantar flexion at 10%, tendon/insertio card and return at 10%; case entry respects persistence error gate and guest fallback.
- Test browser WebGL unavailable, so real 3D GPU interaction is unverified. Preview account persistence service is unavailable; no account records changed.
