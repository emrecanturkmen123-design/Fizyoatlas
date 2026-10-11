# Interface consolidation

- Three primary destinations: Atlas, Hareketler, Kendini sına.
- Atlas owns muscle/nerve browsing and spine exploration. Movement navigation contains only six movement regions. Practice owns quiz, cases and saved/review work.
- Camera, layer, separation and selection controls share a single persistent toolbar. Separation/layer changes intentionally return to free Atlas mode. Escape closes the foremost tool before the information card.
- Muscle cards lead with anatomy. Bibliography, clinical links, related movements, attachment controls, nerve links and model identifiers are progressively disclosed. Selection details remain on the right on desktop and in a single bottom panel on narrow screens.
- Shoulder, elbow, knee and lower-limb players keep playback visible and disclose detailed options separately. All prior lessons, data, quiz/case content and persistent learning APIs remain intact.
- Camera framing uses visible panel bounds; pure tests cover desktop, tablet and portrait phone bounds. Numerical navigation tests preserve cursor-anchored zoom and pan.

Validation: TypeScript, source-card coverage, workspace/lesson SSR, movement controls and navigation checks passed. Browser interactions confirmed the three primary navigation buttons, practice destinations, shoulder step advancement, expanded shoulder options, attachment disclosure, and toolbar Escape behavior with a card open. `ui-card-v16.jpg` is a cropped screenshot of the actual information card.

Preview limitation: the cloud browser could not create a WebGL renderer, so 3D visual rendering was not verified there. Its local learning API was also unavailable; production D1 logic and bindings were not changed. Narrow-screen framing was checked programmatically, not with browser device emulation.
