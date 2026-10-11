# Movement and learning update

Implemented in order with a test gate after each slice:
- Movement menu, eight lesson links, prominent cases/test/learning entries.
- Approximate biceps/triceps spindle diagrams for elbow flexion/extension. These are separate teaching geometry, not deformed BodyParts3D muscles. Colors identify muscles, not activation. Concentric, eccentric and isometric explanations link to OpenStax.
- Eight sourced elbow/forearm muscle cards, six knee muscle cards (28 total), card return links. Word-boundary matching prevents brachialis selecting coracobrachialis.
- Bilateral knee flexion/extension with 30 moving bones, role comparison and a 0–120 degree teaching range. Patella is deliberately omitted in motion because patellar tracking is not implemented. No validated joint roll/glide or screw-home mechanism.
- Fibularis longus/brevis corrected from skeletal to muscular in the catalogue (four bilateral entries). Geometry and offsets unchanged. Laryngeal cuneiform cartilage excluded from knee segment selection.
- Account-backed favorites and latest question outcomes in D1; re-answering correctly removes a question from the wrong-answer queue. Public study remains available without sign-in. Shared accounts share records.

## Persistence and hosting
The existing React/Vite interface is preserved. `npm run build` now emits the client in `dist/client` and an ESM Worker in `dist/server/index.js`. The source manifest declares logical D1 binding `DB`; Sites owns resource provisioning and deployment. Generated Drizzle migrations are checked in. Do not edit migrations after deployment.

The Worker trusts only platform-supplied authenticated user headers. Each SQL query scopes data by that user; client user IDs and correctness flags are ignored. Mutations validate same-origin JSON, known muscles/questions and allowed answers. Personal API responses are never publicly cached. Sign-in uses the dispatch-owned `/signin-with-chatgpt` route, with a top-level same-origin relative return path. No app-owned auth credentials are stored.

## Validation
- All existing shoulder/scapula/attachment/case/navigation tests passed.
- Added tests: muscle diagram continuity and reversible length changes; bilateral elbow cards; bilateral knee hinge/roles/30-bone coverage; SQL migration, account isolation, idempotence, CSRF/input rejection, correction/review, storage error handling; render checks for all new panels and eight lesson routes.
- TypeScript checking and the client + Worker production builds passed.
- Browser visual QA was attempted using the supervised preview. The preview was healthy, but the cloud browser returned `net::ERR_BLOCKED_BY_CLIENT`. No screenshot, pointer interaction, responsive visual approval, or production sign-in/D1 end-to-end verification was completed. Automatic tests do not establish clinical anatomical validity. Joint centres and attachment marker seeds remain approximate.

Run functional tests with `node --import ./scripts/register-typescript.mjs scripts/validate-learning.mjs`, `validate-knee.mjs`, `validate-elbow-cards.mjs`, and `validate-muscle-demo.mjs`. Render check: `node --import ./scripts/register-ui.mjs scripts/validate-learning-ui.mjs`.
