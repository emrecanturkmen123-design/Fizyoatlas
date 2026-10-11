# Continuation release validation

## Result

- Regional/system model demand loading preserves all 2,323 source mesh arrays byte-for-byte against source version 30 (`b169bd42c46dbe5a31d4f7e2ea27098f0976d9fb`). Unreferenced legacy binary chunks are removed.
- Compressed requested model payload is 16.16 MB for the initial Atlas and 4.40 MB for skeletal gait, versus 35.53 MB for all geometry. These are calculated payload sizes, not measured opening times.
- Optional, labelled schematic patella/patellar tendon movement keeps both attachment ends on their intended transforms. Endpoint displacement blending avoids an artificial bend around the distant knee hinge. Patella translation limits excessive tendon span change in deep flexion.
- Guest learning/case progress persists locally; signed-in history persists in the database. Immutable attempt IDs make retries idempotent, with atomic timestamps preserving concurrent answer order. Spaced review uses 1, 3, 7, 14 and 30-day steps, resetting after an incorrect answer.
- Coverage: 40 muscle cards, 24 nerve cards, 13 connective cards, 16 clinical journeys and 403 questions. Build emits 54 source-linked education pages, plus sitemap and robots files.

## Verification

TypeScript and the complete production build pass. Geometry validation covers source atlas identity, 18 full-versus-demand-loaded rigs, 204 bilateral patellar tendon poses and 52,632 attachment checks, neutral geometry, protected knee/limb muscles, shoulder and Achilles studies, and gait continuity/clearance. Content, question filters, routes, clinical journeys, account isolation, database migrations, concurrent answers, retries, guest persistence and review scheduling pass their validation scripts.

The actual transformed triangles were rendered through the CPU at 0, 60 and 120 degrees on both sides in `continuation-qa/knee-tendon-motion.png`. The cloud browser lacks usable WebGL, so this review does not claim a live GPU visual check.

Live version 31 confirms: an incorrect guest answer enters today's review, survives reload, and leaves the wrong-answer list after a correct repeat; both attempts remain in history and a next review date appears. A guest Achilles journey restores step 2 after reload. The new flexor carpi radialis card exposes its median nerve link, favoriting and a working education page; that page opens a five-question study. The optional knee tendon control starts off and exposes its schematic limitations when enabled. Account persistence is covered by API/database tests, not a live sign-in test.

The review screen title is generalized to “Tekrar çalışması” because scheduled correct answers and incorrect answers share it. Package the deployment from the repository root with `.openai` at the archive root and `dist/client` / `dist/server` intact; flattening `dist` loses the entrypoint expected by Sites.

## Teaching limits

The optional patella track is a geometric teaching approximation. It is not a measured patellofemoral contact solver, physiological tendon strain model, activation estimate or patient-specific model. The source study on tendon length/orientation during flexion (DeFrate et al., 2007, https://pubmed.ncbi.nlm.nih.gov/17070815/) informed the decision to avoid uncontrolled geometric stretch; it does not validate this implementation's tracking law. Mobile redesign remains deferred.

## Tendon and sports case extension

Biceps long head and common extensor tendon cards show source muscles and same-side bones without claiming separate tendon meshes. The long-head selector excludes the short biceps and triceps heads; the forearm context excludes toe extensors. The elbow region filter includes the common extensor card.

The patellar card now opens a dedicated ten-stage patellar tendinopathy journey. New biceps-related anterior shoulder pain and hamstring strain journeys each include four distinct explained choices per stage, a real model task, a staged exercise illustration and published sources. All 16 cases have learning-mode examination planning, resumable independent learning/exam progress and exercise demonstrations. Existing saved question IDs remain readable.

Four additional bilateral attachment configurations cover the patellar tendon, long-head biceps proximal origin, common extensor proximal origin and ECRB. All 222 configured markers resolve to source bone vertices; single-end tendons do not offer an invented second bone attachment. Approximate markers do not delineate tendon footprints or serve as clinical landmarks. Source triangle arrays are unchanged.

Deep links preserve attachment side/mode and the optional knee tendon schematic, including valid bounded motion position. Context cards and published information pages connect directly to their specified clinical journey. Version 33 validations: TypeScript, production build (53 pages), 12 cards on both sides, 16 ten-stage cases, 160 clinical questions/640 option explanations, all 360 quiz questions, 112 test filter/count combinations, 16 exercise demonstrations, marker projection, deep links, case/database resume and learning history.


## Tendon comparison and decision follow-up package

Three source-linked comparison tables distinguish quadriceps/patellar connections, Achilles midportion/insertion locations, and proximal long-head/distal biceps anatomy. Each links to its actual Atlas coverage and a five-question tendon study. A contextual quadriceps tendon card selects the four source muscles and same-side patella/femur/tibia without inventing a separate tendon surface. Its one approximate patellar insertion marker brings the bilateral marker count to 224. Source mesh arrays are unchanged.

Twenty-five authored questions (five each for quadriceps, patellar, Achilles, long-head biceps and common extensor tendons) have four distinct explained options, published sources, a dedicated topic filter and working learning/review identifiers. Existing muscle and journey IDs are retained. Tendon questions show no model highlight that could disclose the answer. Comparison and tendon-study URLs restore the selected pair/structure. The build emits 54 information pages with study/comparison links.

Learning mode in the patellar, biceps and hamstring journeys offers three loading plans after the exercise decision. Choosing a plan replaces the control-visit and return-to-activity findings/questions with that plan's explicitly fictional scenario. These nine plans add 18 separately identified clinical questions; total question coverage is 403. Plan choices are unscored and required before continuing in these new learning flows; the ten clinical decisions remain scored. Exam mode retains the original fixed sequence. Saved version-1 records without a plan remain readable and keep their previous findings.

TypeScript and source validation pass for comparison routes/tables, all questions and rationale mappings, bilateral quadriceps selection, marker projection, learning schedules, actual SQLite learning and case persistence, retry idempotency, independent modes, invalid plans and legacy records. Clinical outcomes are authored teaching branches, not computed recovery predictions or tendon-load calculations. Mobile redesign remains deferred.


Live version 34 verification confirms comparison selection survives reload and launches the correct five-question quadriceps study. A catalogue-loading navigation race was found: choosing a workspace before catalogue resolution only changed UI state, then initial route restoration reset it. The follow-up fix writes the requested workspace hash during that loading window so restoration honours the user's choice. Tendon comparison reading does not display an unrelated WebGL failure overlay; model/card views keep the recovery message.

Live guest checks also confirm an incorrect quadriceps answer enters today's review, survives reload, shows the tendon name in history, and can be corrected in a one-question repeat. A resumed biceps journey requires the unscored plan choice before step 9; selecting the overload plan opens its specific control findings, survives reload at step 9, and supplies its own step-10 swimming-return question. Review sessions no longer inherit a stale targeted-tendon URL.

Preparing a new general test clears prior muscle/tendon/review targets so its URL reloads the general test setup rather than an earlier five-question structure study.
