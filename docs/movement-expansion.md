# Movement expansion

- View controls at the top of shoulder, elbow, knee, hip and ankle panels.
- Elbow schematic scenarios: loaded raising (30–120°), controlled lowering (120–30°), isometric hold (90°). Progress represents a teaching sequence, not physiological force. Original muscle geometry remains unchanged.
- Approximate joint plane and axis overlays for elbow, knee, hip and ankle; existing shoulder overlay preserved.
- Nerve → muscle → motion links; Latin-name matching and card-only targets supported. Six additional nerve cards, with selected-target scope notes where needed.
- Hip flexion/extension, abduction/adduction, internal/external rotation; ankle dorsiflexion/plantarflexion. Bilateral controls, stepping, playback, static muscle comparisons. Four new muscle cards: 32 total.
- Eight gait learning steps with related muscle highlights. This is a phase lesson, not a walking animation or EMG simulation. Initial contact is labeled as an event; playback duration is not real gait timing.

## Model limits
Joint centres and fixed axes are approximations. Hip demo keeps the pelvis and knee fixed. Ankle moves all foot bones rigidly; subtalar motion, arch mechanics and ground contact are not modeled. Ground platform hidden during lower limb motion so plantar flexion is visible. No realistic tendon routing, muscle deformation, force computation or clinical ROM measurement added.

## Validation
TypeScript check; sixteen model/data/backend suites including contraction directions, isometric pose, bilateral 32-bone hip and 28-bone ankle membership, motion signs and fixed pivots. Existing SQLite-backed learning API tests pass. Server-rendering tests cover current panels and new views/deep links. Supplemental checks cover overlays, nerve-to-motion paths, Latin muscle names and card-only geometry targets.
Browser interaction and visual layout were not verified in this release; the earlier preview browser was blocked by the environment. Source references are linked in cards and lesson panels. D1 schema and existing migrations unchanged.
