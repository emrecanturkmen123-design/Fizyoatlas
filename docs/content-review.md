# Anatomy content review

## Sources and scope

The original 32 muscle cards were checked individually against the University of Washington Muscle Atlas on 2026-09-14. Eight additional cards bring coverage to 40: gluteus minimus, tibialis posterior, fibularis longus/brevis, flexor carpi radialis/ulnaris, and extensor carpi radialis longus/brevis. Each card links to its own source page; both biceps femoris heads have distinct links. Existing UAMS/TTUHSC links are retained as complementary sources, including rectus femoris hip flexion, gastrocnemius knee flexion, and the soleal line. All 40 cards have a reverse motor nerve relationship; branch qualifications distinguish the deep radial branch and anterior interosseous nerve.

`app/muscle-review.ts` contains the source mapping and separately attributed root ranges. Missing UW root details use NCBI Bookshelf NBK531508 (iliacus), NBK482445 (L2–L4 femoral/obturator territory), and PMC4223289 (hamstring innervation). Root contributions are not equivalent to the dominant clinical myotome. Source discrepancies for supraspinatus, subscapularis, teres major, latissimus dorsi, tibialis anterior and iliacus are disclosed on cards.

Nerve relationships were rechecked against UAMS upper/lower limb nerve tables on 2026-09-22. Eight nerve cards and the missing shoulder/hamstring links were added. Common fibular downstream targets are explicitly indirect; reverse muscle links do not mislabel it as a direct terminal branch. Motor target lists remain selected examples, not exhaustive territories. The sciatic card differentiates the long and short heads of biceps femoris.

## Coverage and movement

Coverage is calculated from actual loaded atlas metadata: model, information card, and movement lessons are independent. Inferior gluteal and pectoral nerves can have cards without nerve geometry. No invented nerve mesh is substituted. Ulnar coverage does not imply a supported movement lesson.

Shared playback controls clamp steps, pause manual scrubbing, reset completed playback, and offer reset. Gait animates a bilateral skeleton through eight phases with optional muscle layers. Each lesson announces its supported views and limitations. Coverage includes the actual Achilles and patellar tendon movement links; the patellar card opens a separate patellar tendinopathy case; the existing patellofemoral pain case remains distinct.

## Geometric stability

Shoulder surfaces use normalized dual-quaternion blending. Upper-limb muscle meshes use edge-stretch relaxation and conservative capsules fitted inside the humerus, radius and ulna. Origins and insertions remain fixed at their intended attachment transforms. Exact neutral geometry is preserved. These are geometric teaching aids, not full collision detection, finite-element tissue simulation, measured activation, or a patient-specific model. Fold elimination and whole-body collision freedom are not claimed.

Validation scripts cover source/card completeness, direct/indirect links, bilateral geometry, playback boundaries, attachment invariants, exact neutral poses, 120 limb poses, high-angle upper-limb core overlap, and excessive shoulder edge stretch. Browser visual inspection is separate from these numerical/SSR tests.

## Tendon extension source review · 2026-10-01

Biceps long head origin and the distinction from coracoid short-head origin are based on the University of Washington Biceps Brachii atlas and AAOS Biceps Tendinitis. Common extensor/ECRB lateral epicondyle origin and ECRB third metacarpal insertion are based on the UW ECRB atlas, AAOS Tennis Elbow and the 2022 JOSPT lateral elbow CPG (10.2519/jospt.2022.0302). These structures have context cards, not newly invented tendon meshes.

Patellar clinical teaching uses Ophey et al. (2025, 10.1002/ksa.12367), Breda et al. (2021, BJSM 55:501) and Rosen et al. (2022, PMID 34623447): local load-related pain, differential assessment, individually progressed resistance and later energy-storage tasks. A decline squat is supporting evidence, not a standalone tear diagnosis.

Biceps teaching uses AAOS, UW, PMID 36114842 and the primary Speed/Yergason accuracy study PMID 15007311. Anterior shoulder pain can have multiple sources; a provocative test does not establish isolated tendon or labral disease. New bruising/deformity changes the plan to medical reassessment.

Hamstring teaching uses the 2022 JOSPT CPG (10.2519/jospt.2022.0301), Hickey et al. (2022, PMID 35201301) and AAOS: staged strength/running, possible serious proximal injury and task-based return. The short biceps femoris head does not cross the hip. New elbow-flexion and hamstring-curl demonstrations follow AAOS shoulder/knee conditioning descriptions; dosage remains individualized. Patient stories, follow-up outcomes and questions are fictional teaching examples.
