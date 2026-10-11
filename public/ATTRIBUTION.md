# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.

## Fizyo Atlas adaptation
Based on Human Atlas by Ashe (https://github.com/ashemag/human-atlas), MIT license. Added Turkish interface labels, eight concise sourced muscle study cards, and four educational clinical associations. Geometry is unchanged from upstream. Anatomy sources are linked within each card.
Corrected the display-system labels of bilateral tibialis anterior and fibularis tertius from skeletal to muscular; source identifiers and geometry are preserved.
Also corrected bilateral subscapularis display labels from skeletal to muscular.

Fizyo Atlas v2 adds cursor zoom, focus, panning, context transparency and source-linked motor-target relationships. Bilateral tibialis posterior and tensor fasciae latae display labels corrected to muscular. No peripheral nerve geometry was fabricated.

Educational update: fibularis longus and brevis were reassigned from skeletal to muscular in the catalogue. Source geometry is unchanged. Elbow muscle spindles and knee hinge animation are approximate teaching diagrams, not validated anatomical models.


## Z-Anatomy supplementary geometry (2026-09-13)

**Z-Anatomy — The libre 3D atlas of anatomy — Gauthier Kervyn — CC BY-SA 4.0.**
Underlying BodyParts3D attribution: **The Database Center for Life Science**. The Z-Anatomy source also credits the original BodyParts3D distribution under CC BY-SA 2.1 Japan. The supplementary selection is distributed under the Z-Anatomy CC BY-SA 4.0 terms; it does not alter the license of the pre-existing BodyParts3D release or MIT application code.

- Project and source: https://github.com/Z-Anatomy/Models-of-human-anatomy
- Source license: https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt
- Supplement and adapted geometry license: https://creativecommons.org/licenses/by-sa/4.0/
- Original BodyParts3D credit: https://lifesciencedb.jp/bp3d/
- Downloaded archive: https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip
- Archive SHA-256: `8c64759030ba82fead9b41f0ddea476ea81d7652526960d3d9bd8dc1ba91bb66`

The selection contains the left and right latissimus dorsi surfaces and 68 peripheral/spinal nerve and plexus structures. No separately credited ear, kidney or noncommercial assets are included. Source object names, selection and transform are recorded in `/models/supplement-source.json`; imported identifiers use the `ZA-` prefix and do not claim FMA identity.

Adaptations: evaluated mesh/curve modifiers, reduced curve/bevel sampling, triangulation, coordinate conversion, uniform registration to bilateral humerus/femur/scapula envelopes, mirrored winding correction, regenerated normals and binary packing. The registration envelope RMS is approximately 4.8 mm; it is an alignment diagnostic, not a statement of anatomical accuracy. The combined atlas is a composite of reference anatomies, not one person's scan. These adapted supplementary models, including runtime deformation of the latissimus surface, remain available under CC BY-SA 4.0.

The elbow and shoulder teaching modes deform source muscle surfaces using estimated attachment regions, path guides and skinning weights. Pale tendon regions and optional attachment markers are teaching annotations rather than segmented tendon tissue. They do not model measured muscle force, full volume preservation, soft tissue collisions or clinically validated biomechanics. The original source surfaces are restored in the neutral pose and preserved separately in the data files.

## Coccyx and movement update (2026-09-14)

The separately imported `Coccyx` surface is from Z-Anatomy, Gauthier Kervyn / BodyParts3D, The Database Center for Life Science, under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/. The source archive URL above was retrieved again; this archive SHA-256 is `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`. It does not replace the earlier supplement provenance. See `/models/coccyx-source.json` for the object, binary checksum and transform. Adaptations: coordinate conversion, local uniform registration to the sacrum envelope, triangulation, normalized normals and binary packing. The sacral envelope RMS is approximately 7.8 mm, a registration diagnostic only. The original sacrum and other atlas surfaces are unchanged. The derived coccyx remains CC BY-SA 4.0.

Additional hip, knee, ankle and forearm muscle views deform existing surfaces using approximate attachment weights. No soft tissue collision, force prediction or patellar tracking is simulated. The fixed 90-degree elbow biceps path uses the established curve rig, with distal rotation following the radius. Extended attachment markers denote estimated regions, not measured footprints. Quadriceps tibial transmission is explicitly indirect via the patellar ligament.
## Upper-limb deformation update · September 2026

The application implements normalized dual-quaternion blending following Kavan et al., *Geometric Skinning with Approximate Dual Quaternion Blending* (2008): https://users.cs.utah.edu/~ladislav/kavan08geometric/ . No external implementation code was copied. Existing model attribution and licenses below remain unchanged.

Conservative bone-interior capsules and edge-stretch relaxation reduce selected upper-limb artifacts while preserving attachment anchors. They are not exact bone-surface or tissue collision simulations. Source muscle and bone files are unchanged. Muscle card source and coverage notes are described in each card.

## Clinical structures supplement (V18)
`models/clinical.bin` and its gzip contain 16 bilateral source-derived surfaces from
[Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), by Gauthier Kervyn
and BodyParts3D / The Database Center for Life Science, under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
These adapted meshes remain CC BY-SA 4.0. No third-party ear or kidney assets are used.
Adaptations: evaluated source modifiers; local uniform registration using corresponding
bone regions; triangulation and normal quantization. Infraspinatus uses the source's
Tendon-labelled faces. Supraspinatus, subscapularis and teres minor use actual insertion
footprint objects and are explicitly **not complete tendon models**.
The ACL is native reference anatomy, not a surgical graft. Ankle ligaments are simplified
source surfaces, not fibre-level injury models. Full provenance, source hash, transforms,
geometry selection and registration residuals: `models/clinical-source.json`.

The existing calcaneal tendon meshes FJ1405 and FJ1405M are reused from the original
BodyParts3D atlas under its existing attribution; no duplicate Achilles mesh is added.

## Patellar tendon extraction (V28)

Bilateral patellar ligament/tendon surfaces are derived from the **Tendon** material faces in Z-Anatomy's **Rectus femoris muscle.l/r**, below the upper boundary of its **Patellar ligament.ol/or** origin footprints. The boundary is clipped and welded; normals are recomputed. The original distal tendon silhouette is retained, with the established knee registration and a small endpoint translation blend (under 2.5 mm per end) onto the corresponding BodyParts3D patella and tibia. No procedural replacement band is used.

Source and attribution: Z-Anatomy / Gauthier Kervyn; BodyParts3D / The Database Center for Life Science. Adapted surfaces distributed under **CC BY-SA 4.0**. Source archive identity and registration are recorded in `models/patellar-source.json`; extraction scripts accompany the source repository. This is an educational reference extraction, not patient-specific segmentation. Only the static atlas model is provided; patellar tracking and tendon strain are not simulated.

## Source tendon regions and learning update (2026-10-01)

Eight bilateral adapted source selections are added: proximal long-head biceps tendon, distal biceps tendon, distal quadriceps tendon regions, and the common extensor origin footprint. They derive from Z-Anatomy / Gauthier Kervyn and BodyParts3D / The Database Center for Life Science, and remain **CC BY-SA 4.0**. The source archive SHA-256 is `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`; provenance, selections, transforms and exact array hashes are in `models/tendon-completion-source.json`.

Adaptations: evaluated and triangulated source objects; connected-component selection of Tendon-labelled biceps faces; clipping distal Rectus femoris, Vastus intermedius and Vastus lateralis tendon regions above the previous patellar extraction boundary; uniform regional scale/translation; a sub-millimetre uniform translation of the common extensor footprint; regenerated signed-16-bit normals; packing into existing connective system/side/region chunks. The previous 2,323 parts retain their exact source arrays. Quadriceps is the available three-head material selection, not a reconstruction of all tendon layers. Common extensor, supraspinatus, subscapularis and teres minor footprints are **not full tendon bodies**.

The optional knee overlay now provides a schematic patellar trajectory and source quadriceps/patellar tendon connections. The optional biceps tendon regions approximately follow the existing elbow muscle rig and reference radius. These are educational deformations, not measured patellofemoral kinematics, tissue collisions, force, strain, injury or healing simulations. Neutral source geometry is preserved. Earlier version-specific static-only descriptions above are historical. Actual source triangles are also used in the name-hidden Canvas2D model-finding exercise, which is an orthographic projection rather than reconstructed 3D anatomy.

## Proximal ECRB tendon region

The right/left proximal connected components of source Tendon-material faces in Extensor carpi radialis brevis are included as context for the common extensor origin. This is one contributor, not a reconstruction of the full common tendon. Source: Z-Anatomy / Gauthier Kervyn and BodyParts3D / The Database Center for Life Science; CC-BY-SA-4.0. Exact selection, source archive hash, regional registration and array hashes: `/models/extensor-region-source.json`. Existing reference meshes are unchanged.


## Open3DModel tendon bodies and proximal extensor complex (V40)

Source: [Open3DModel / AnatomyTOOL](https://anatomytool.org/open3dmodel-create), created by university anatomists and medical artists. Credit: Open3DModel project / Leiden University Medical Center (LUMC); Eungyeol Lee (medical artist), Jan Kooloos (upper/lower limb), Denise Arnold and Marco DeRuiter (upper limb), and the contributing universities and authors listed at https://anatomytool.org/open3dmodel-credit. Predecessor geometry: Z-Anatomy / Gauthier Kervyn and BodyParts3D / The Database Center for Life Science. Source and adapted geometry remain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Application code retains its existing license.

Ten bilateral adapted parts are added. Supraspinatus, subscapularis and teres minor use the humeral connected component of the source muscle texture's pale tendon region. The proximal extensor complex combines four distinct source regions (ECRB, EDC, EDM and the ECU humeral head) as one selectable group; no fictitious shared-fibre bridge is added. Quadriceps uses the source common tendon envelope proximal to the source superior patellar pole. Its medial contribution is present in the common envelope; this is not a separated microscopic layer model.

Adaptations: Draco decoding, triangulated source surface clipping at texture UV v=0.12/0.88 (an approximate educational tissue-colour division, not histological segmentation); source connected-component selection; uniform local bone-envelope registration; sub-5-mm uniform shoulder insertion alignment; independently registered mirrored left side with winding correction; regenerated quantized normals; system/side/region packing. The 2,333 previously shipped surfaces remain byte-for-byte unchanged. The new source bodies are preferred over historical insertion footprints by study, search, picking, model finding and motion views, preserving saved route keys.

Source URLs, SHA-256 hashes, registration residuals, source object selections, approximate muscle boundary vertex indices and final array hashes: `/models/open3d-tendon-source.json`. Extraction implementation: `scripts/import-open3d-tendons.py`. The optional shoulder deformation follows the source tissue boundary at the muscle end and the humerus at the insertion; knee deformation follows the common body and patella. These are teaching deformations, not measured strain, soft-tissue contact, rupture or healing simulations.

## Distal hand and foot study additions (V41)

Open3DModel / AnatomyTOOL, LUMC and partners, Eungyeol Lee, Jan Kooloos, Denise Arnold and Marco DeRuiter. CC BY-SA 4.0. Sources: https://anatomytool.org/open3dmodel-create and https://anatomytool.org/open3dmodel-credit.

19 bilateral study selections: finger/thumb flexor and extensor tendon regions, wrist retinacula, digital fibrous/synovial and common flexor sheaths; tibialis anterior/posterior and fibularis longus/brevis tendon regions; ankle retinacula and tibialis/fibular sheaths. Named supporting tissues keep their source triangles. Distal tendon regions are extracted from source tissue colours using GLTF UV coordinates, with triangles clipped at the approximate colour boundary. Uniform bone-envelope registration and left-side mirroring are logged in /models/distal-tendon-source.json. No new connecting tubes, microscopic pulleys, patient injuries, tendon gliding or strain simulation are generated.

The anatomy inspection area projects the original atlas surfaces with a shared orthographic camera. Section lines are calculated from triangle/plane intersections; they are not MR/CT images, complete tissue volumes or verified internal layers. Rendering colours have been changed for teaching.

## Knee course source additions (V44)

Ten bilateral whole source surfaces: posterior cruciate ligament, medial collateral ligament (combined superficial/deep source components), lateral collateral ligament, medial meniscus and lateral meniscus. Source: [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), Gauthier Kervyn and BodyParts3D / The Database Center for Life Science. These adapted surfaces remain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Adaptations: requested-object library loading with embedded scripts disabled, evaluated whole source modifiers, triangulation, mirrored winding correction, coordinate conversion, the established knee bone-envelope registration and regenerated quantized normals. No new bridging geometry is generated. Existing atlas surfaces and chunks are unchanged. Menisci are labelled as fibrocartilage, not ligaments or tendons. These additions are healthy static reference anatomy; they are not attached to the schematic motion rig. Archive identity, source objects, transforms and final checksum: `/models/knee-course-source.json`. Reproducible import: `scripts/import-knee-course-anatomy.py`.


## Pectoral nerve addition (V52)

Four named source objects, `Lateral pectoral nerve.l/.r` and `Medial pectoral nerve.l/.r`, were evaluated from the Z-Anatomy archive with embedded script execution disabled. Attribution: Gauthier Kervyn / Z-Anatomy and BodyParts3D / The Database Center for Life Science, **CC BY-SA 4.0**. Source: https://github.com/Z-Anatomy/Models-of-human-anatomy .

Archive SHA256: `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`. Existing uniform registration is unchanged and checked against six bone envelopes (RMS 4.7805 mm). Mesh array hashes and adaptations are in `public/models/pectoral-nerves-source.json`; the importer is `scripts/import-pectoral-nerves.py`. No existing geometry was replaced. Inferior gluteal nerve objects are absent from this source; its card highlights real target muscle geometry and explicitly states that the nerve itself is unavailable.
