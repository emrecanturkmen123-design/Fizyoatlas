# Current Fizyo Atlas release

The source includes the V59 panel layout and transparency fixes, integrated muscle cards, guided comparisons, hand/finger motions, motion explanations, adjustable panel widths and persistent guest drafts.

Cloudflare live deployment: https://atlas.fizyoatlas.workers.dev. Build and deployment instructions, plus the current account-sign-in setup status, are documented in [CLOUDFLARE.md](CLOUDFLARE.md). The Sites build remains available separately.

# Learning modules update

- Optional illustrative scapular upward/downward rotation during shoulder flexion/abduction/adduction. 30-degree teaching excursion at 90 degrees GH display; not a normal rhythm ratio. Clavicle stationary; no full scapulothoracic kinematics.
- Three sourced fictional clinical cases, reveal and bilateral motor-target highlighting.
- Ten-question quizzes: muscle recognition, innervation, origin and insertion. Unique choices, single-attempt scoring, explanation/source and review. Only geometry-backed muscles enter the quiz.
- Four bilateral elbow/forearm motions with playback/scrubbing, 29 distal bones, muscle-target view. Approximate radius-head/ulna-distal axis; stationary ulna in pronation/supination. Display ranges are not clinical normal ROM.
- Curated Turkish/Latin/English search aliases, accent normalization and side terms. Original model names preserved; not every structure has a translated alias.
- All module checks and prior shoulder/attachment/navigation tests pass. Browser/device visual validation is unavailable in this session.

# Shoulder learning update

- Fourteen sourced muscle cards, covering all nine muscles in the shoulder lessons. Missing latissimus geometry still has an accessible text card.
- Six shoulder motions with play/pause, 10% steps, scrubbing and end-stop; bilateral 30-bone rigid arm animation. Shoulder and elbow pivots are estimated from the humerus bounds, not clinically measured centres. No scapular rhythm or muscle deformation. Display ranges are teaching ranges, not normal ROM reference values.
- Blue agonist/synergist and orange antagonist examples by anatomical action, separately labelled. No activation/EMG or loading inference; muscles are hidden during skeletal playback. A card can return to its lesson.
- Validated with TypeScript, production build, shoulder-card coverage, bilateral motion/pivot/rigidity/end-stop checks and opposing muscle-role checks. Browser/device visual testing has not been performed.

# Fizyo Atlas — study workspace

Turkish physiotherapy adaptation of Ashe’s Human Atlas. Upstream documentation and attribution are retained below.

## Version 2

- Cursor-anchored zoom, right-drag pan, double-click/tap focus, explicit focus and whole-body camera reset.
- Selected structures remain opaque while context can be made transparent; individual selections can be hidden and restored.
- Ten sourced nerve cards connect motor targets in both directions, with left/right preservation.
- Seven limb nerve records have no nerve mesh in the packaged BodyParts3D source. Their cards explicitly report that limitation and highlight verified target muscles instead. Three orbital branch/nerve records have source meshes.
- Tibial card selection covers leg targets; distal plantar targets and proximal sciatic-tibial divisions are explicitly outside that card’s selection. Extensor digitorum brevis has no source geometry and is shown as unavailable.
- Eight detailed origin/insertion/action cards remain the current muscle-content scope.

Validation: `npm run check`, `node scripts/validate-study.mjs`, `node scripts/validate-navigation.mjs`, and `npm run build`. Navigation tests exercise real OrbitControls against synthetic input surfaces, including focused camera offsets; they do not substitute for visual or physical-device testing.

---

# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
