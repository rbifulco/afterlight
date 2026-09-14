# Verification — ambient neighborhood pass

Validated September 14, 2026 in Chrome on the local Mac, using the production build at **http://192.168.1.214:4173**.

## Build and local delivery

- `npm run build` passed; Vite retains its bundle-size advisory.
- `npm test` passed all three navigation checks: taxi avoidance, connected clear destinations, and rejection of blocked/out-of-bounds destinations.
- All 17 production files returned HTTP 200 through the LAN address and matched local SHA-256 hashes. Evidence: `lan-files-v3.json`.
- The existing detached server continues serving `dist/` on `0.0.0.0:4173`. Restart instructions are in the README.

## Browser behavior

The action panels, markers, proximity hints, pickup/stock counters, advertising takeover, scan effect, and title/status overlay were removed. Only a small view-control strip remains, fading after inactivity. The page's accessible DOM contains the canvas and view controls, with no street-action buttons or panels.

Walking was tested through a visible street click: the courier reached `(1.259, -4.028)` and stopped, with observed peak speed 2.9 scene units/second. Wheel zoom changed camera distance from 30 to 16.138; dragging changed camera orbit. Reset restored the starting position and camera. High/light rendering mode switching was exercised.

Successive live diagnostics show six pedestrians advancing on independent routes and pausing, while the cook's stirring joint, patrons' drinking gestures, workshop arm, holograms, train and traffic continue changing without user action. The scene contains thirteen civilian residents, eighteen moving fabric panels, four window silhouettes, and six runoff outlets. Close views and wide views were visually inspected.

Observed desktop high-quality samples were approximately 70–80 FPS during the main checks. These are measurements on this Mac, not a performance guarantee. A 390 × 844 browser viewport was checked separately; a physical phone and touch gestures were not tested. The viewport was restored after testing.

No browser errors appeared in the checked builds. Final raw observations are in `validation-results-v3.json`; previous v1/v2 result files are historical.

## Visual review

Independent review compared the live screenshots with `.dream-loop/target-v3.png`, an edit of the actual starting scene. The first pass scored 8.2/10. Following civilian-model, gesture, kitchen-visibility, and lighting refinements, the next pass scored 8.6/10 with no material regression. This is a subjective comparison, not pixel equivalence.

Remaining artistic limits include the stylized, somewhat bulky character silhouettes and a more concentrated amber reflection field than the target. The review confirmed that the dark workshop shape is consistent with its physical table and shadow, without evidence of a rendering defect.

The current production screenshot is `afterlight.png`. Development screenshots and the target remain in `.dream-loop/`.


## Sound and model follow-up

The September 14 follow-up generated and integrated eighteen original ElevenLabs audio files (about 3.3 MB), while refining the original cars and character models. All audio decoded in Chrome; the mixer reported sixteen persistent spatial/ambient layers plus bounded transient/crossfade voices. Measured runtime output was nonzero with headroom, and walking produced gait-triggered Foley. Mute suspended the audio context. Generation/source/mix details and listening limitations are documented in `SOUND_DESIGN.md`.

After model changes, navigation tests passed with the updated measured taxi footprint. Close and wide screenshots were reviewed. Independent target-fidelity review improved from 7.8/10 to 8.5/10 after rounding the front fascia and correcting glass highlights. The review found no material regressions or obvious detached geometry. Stylized joint shapes and simplified car surfacing remain artistic limits.

Desktop samples during this follow-up varied with workload, from 43 FPS during one wide sample to 82–83 FPS in subsequent close views with audio enabled. This variation is retained rather than presented as a guaranteed frame rate. Final browser observations are in `validation-results-v4.json`, The follow-up LAN recheck could not complete because the prior network address was no longer reachable; earlier LAN receipts are historical.
