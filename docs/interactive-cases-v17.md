# Interactive clinical cases and categorized quizzes — V17

13 familiar fictional cases: lateral ankle sprain, rotator cuff-related pain, frozen shoulder, lateral epicondylalgia, carpal tunnel syndrome, nonspecific low back pain, lumbar radiculopathy, knee osteoarthritis, patellofemoral pain, rehabilitation after ACL reconstruction, midportion Achilles tendinopathy, stroke, Parkinson disease.

Each has ten progressive steps: history, symptoms, examination, clinical test, working assessment/differential, anatomy, treatment approach, exercise progression, follow-up and return to activity. Learning mode gives feedback and hints; assessment mode defers explanations to completion. The patient file contains only already disclosed findings. Incorrect decisions are explained; subsequent fictional findings follow the reference care pathway, not a physiologic simulation of the chosen incorrect action. Patients, measurements and trajectories are fictional. No universal exercise dosage or return date is prescribed.

Anatomical practice uses real model IDs and routes model picks back into the case without opening a detail sheet. At the anatomy step the relevant entire system is exposed without revealing the target. The optional model exercise is unscored; ten decision questions determine the case score. Missing ligaments, capsules, tendon pathology and central circuitry are explicitly distinguished from displayed neighboring bones or functional muscles. Cases do not claim these proxies are the diseased structure.

The current quiz pool has 160 anatomy questions and 130 case-step questions. Former niche case questions remain resolvable only for existing saved records. Topic and region filters, 10/20 questions, immediate/deferred feedback, topic breakdown and session wrong-answer review are supported. Small pools shorten the session; empty pools disable start. Anonymous users can review their current session; authenticated answers continue through the existing server-validated D1 flow. Case decisions are session-only, not account progress.

Sources linked per case: JOSPT/AOPT CPGs (ankle 2021, rotator cuff 2025, elbow 2022, patellofemoral 2019, Achilles 2024), BJSM PAASS 2021, Aspetar ACLR guideline 2023, NICE NG59/NG226/NG236/NG71, AAOS patient/clinical guideline resources, APTA Parkinson CPG. Sources checked on 2026-09-22 via available guideline pages and indexed primary-source text; several publishers blocked direct full-text fetching. This is educational authoring, not an independent clinical peer review.

Validation:
- TypeScript check.
- 13 × 10 step data integrity, four distinct options, score/answer locking, and actual anatomical target IDs.
- 112 topic × region × count combinations, reproducible unique sampling, small/empty pools, no clinical model-answer highlight, result breakdown.
- Existing and new question IDs through SQLite migrations and Worker API: authentication isolation, answer verification, correction/review, CSRF and error handling.
- Workspace and learning UI render tests.
- Browser: complete pilot case and result, categorized quiz setup, empty pool, deferred-feedback test and wrong-answer review; final QA recorded below.

Limitations: cloud browser cannot create the WebGL renderer, so new visual 3D interactions cannot be visually certified here. Source assets were not changed. Local preview does not expose production D1; persisted-answer behavior is covered by the Worker/SQLite integration test.

Final browser checks: ten-question deferred-feedback quiz completed with five topic rows; 3/10 result yielded exactly seven wrong-answer retry questions. Carpal-tunnel assessment completed all ten stages with no hints, answer explanations or source-title leaks before the result. Learning-mode hint checked. Found and fixed immediate closing of the question-count dropdown by placing dropdowns below the trigger. Case-region values now display Turkish labels.
