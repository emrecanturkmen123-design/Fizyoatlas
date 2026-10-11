# Fizyo Atlas V41 review

- 19 new study selections / 38 bilateral source surfaces. Source tissues: Open3DModel upper and lower limb GLBs, CC BY-SA 4.0. Distal tendon source-colour regions are clipped with GLTF image UVs; named sheaths and retinacula keep their triangles. Exact source hashes, transforms and limitations: `public/models/distal-tendon-source.json`.
- 33 source-linked connective study cards; new sheaths and retinacula are explicitly labelled as supporting tissues. Distal modules are static anatomy; finger/foot tendon sliding and individual pulley segmentation are not claimed.
- Tracing colours distinguish related muscle, selected tendon and related bones. Existing attachment markers remain approximate educational points.
- Anatomy inspection projects source meshes with a shared orthographic camera. Comparison controls and section choices survive deep links. Shoulder/elbow/knee section contours are exact triangle/plane intersections clipped to the local study volume; they are not radiology images or a complete internal-tissue atlas.
- Notebook entries use per-user D1 records. Notes, collections, structure/side/motion/position links, updates and recoverable archiving are supported. Anonymous visitors need sign-in to save. An unsaved editing draft is kept temporarily in the current browser session, not used as the authoritative notebook.
- Touch/keyboard hints and keyboard camera controls added; compatibility mode keeps pixel ratio 1 after resize. Inspection chunk cache bounded to 24 MiB.

Verification: exact byte preservation for all 2343 V40 source parts; 38 new source hashes and bilateral context; computed sections and common camera transforms; real SQLite migrations, notebook create/update/archive/restore, identity isolation, invalid payload and CSRF rejection. Existing production tendon rigs and study routes remain covered by their audits.

Browser QA: preview UI at desktop, simulated 390×844 and 844×390 iframe screens. Comparison, section and notebook UI exercised. No physical phone is available. This test browser has WebGL disabled; main WebGL rendering and touch/GPU performance on physical hardware are not verified.
