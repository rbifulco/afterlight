# Camera and capture

Use this when viewpoint or exported media is part of the deliverable. A camera is a saved project artifact, not a phrase remembered across turns.

## Establish the shot

Translate direction into separate properties:

- **Camera side:** where the viewer is standing relative to a named landmark.
- **Subject:** where the camera looks, independently of player/follow target.
- **Framing:** what occupies foreground, center, and background; what must fit.
- **Distance:** a physical camera move along the viewing ray.
- **Lens/aspect:** perspective and crop, not substitutes for distance.

“From NOVA across toward KAEN” means the NOVA side is the camera's location and KAEN is the subject. It does not mean centering the NOVA advertisement. “Farther out” does not authorize changing the side. An orbit, dolly, focal-length change, and wider output crop are different operations.

Judge the preview composition, not just its coordinates: is the intended subject prominent and readable, is the foreground useful, and has moving back exposed an unfinished edge of the world? A numerically correct side can still produce an edge-on subject or an empty frame. Adjust the camera within the user's direction; if the requested view requires extending the world, identify that concrete limitation instead of quietly substituting another shot.

If the live view is the reference, serialize its actual camera and save a preview before moving anything. If only an image is available, reconstruct provisionally, mark that status, and compare visible relationships. After a user rejects the angle, resolve the specific ambiguity with a single concrete question or inspectable preview rather than starting another long guessed export. Once the intended shot is clear, do not add routine approval steps.

## Minimal shot record

Save actual values rather than copying these placeholders. Resolve unknowns before final capture.

```json
{
  "schemaVersion": 1,
  "shotId": "cross-street",
  "revision": 1,
  "intent": {
    "cameraSide": "landmark A",
    "subject": "landmark B",
    "framing": "foreground street, subject facade, roofline retained"
  },
  "reference": {
    "path": null,
    "status": "unresolved",
    "previewPath": null,
    "userAcceptedRevision": null
  },
  "camera": {
    "position": null,
    "quaternion": null,
    "verticalFovDegrees": null,
    "near": null,
    "far": null
  },
  "render": {
    "width": 1920,
    "height": 1080,
    "fps": 60,
    "durationSeconds": 10,
    "qualityPreset": null
  },
  "scene": {
    "sourceRevision": null,
    "assetRevision": null,
    "stateSnapshot": null,
    "randomSeed": null,
    "startTimeSeconds": 0
  },
  "audio": {
    "mixRevision": null,
    "method": null
  }
}
```

When using quaternion as the orientation authority, a look-at point can be retained as intent metadata rather than a competing camera control. Do not confuse a player's navigation target with the camera look-at point.

The accepted/selected shot is tied to its preview and revision. Changes to camera, aspect, crop, or lens invalidate that preview. Changes to scene assets or mix invalidate the corresponding export evidence without erasing the camera decision. A browser resize, hot reload, or reconnect must not silently change output dimensions or reset the saved shot.

## Choose the capture method honestly

| Method | Use when | Main constraint |
|---|---|---|
| Real-time screen/canvas recording | Actual interaction or real-time performance is the subject | Measure delivered frame cadence; encoding can reduce frame rate |
| Fixed-step engine frame export | A smooth scene film is required despite slow recording | Reproduce simulation state and audio timing; label as rendered export when the distinction matters |
| Editing a captured take | Trimming, delivery format, sound balancing, or a shorter version | Keep source provenance and avoid implying changed camera or new animation |

Ten seconds at 60 fps means 600 output frames. Setting a container to 60 fps can duplicate frames; it does not create 60 distinct rendered states per second. Offline export quality is not evidence of live 60 fps performance.

For reproducibility, restore the complete relevant simulation state: actor routes/progress, pauses, gait phases, event counters, random seeds, clocks, camera and audio schedule. Resetting only `elapsed` does not reset an NPC's accumulated route distance. Advance a fixed simulation step or a documented stable substep and render at defined sample times. Save start/end state or event evidence when it matters.

Prefer a small development capture adapter with explicit operations to repeated string replacements in a copied entrypoint. Typical operations are `saveState`, `restoreState`, `step`, `render`, and `captureFrame`; adapt them to the engine. Keep capture controls and file-writing endpoints out of the production build. If a copied scene is temporarily necessary, record exactly what differs and verify parity before use.

## Audio belongs to the shot

Use the camera orientation and intended listener policy consistently. For deterministic export, the strongest path is an audio render from the same event timeline and trajectories, for example with an offline audio graph where the platform supports it. Test that implementation before relying on it.

A separate real-time audio take is acceptable for an ambience-led film if its relationship to the picture is understood. It is not exact synchronization merely because both takes begin at the same numeric time. Check train/traffic/footstep timing and do not reuse a take after the user rejects one of its layers. A soundtrack changed locally must be rerecorded or remixed into the actual final file.

## Resource and interruption handling

Estimate frame storage from representative output, not raw guesses:

`required space ≈ frame count × measured frame bytes + encoded output + working margin`

At 0.75 MiB/frame, 600 frames require about 450 MiB before encoding. Check available disk space and monitor it during long jobs. Other work on the machine can consume the remaining space.

Prefer streaming frames into an encoder or a bounded producer/consumer queue when supported and tested. Streaming was a proposed improvement after Afterlight's disk exhaustion; it was not established by that project's original capture helper. Do not treat a proposed adapter as an existing tool.

Before a full run with a new capture path, export a short pilot and check frame delivery, output playback, resource use, and error handling. Reserve headroom for the encoded output and concurrent disk use even when streaming; avoiding intermediate images does not eliminate storage needs.

Use one job/revision per frame set; never combine partially overwritten files from two cameras or frame rates. A failed write is a failed export. Stop that job, retain its diagnostic receipt, and retry only after correcting the cause. Remove only attributable, obsolete project intermediates; preserve completed deliverables and user reference files. Do not clean unrelated disk contents.

On user steering, stop the affected export and update the shot/mix record before restarting. Validate and restore the camera after browser reconnection. Do not let a capture timer continue silently against a hidden or throttled page and call it a ten-second real-time take.

## Finish the file, then call it finished

Check duration, frame count/cadence, dimensions, codec, pixel format, color/range metadata, audio presence and clipping, and playback compatibility for the requested destination. Use current destination requirements when needed rather than embedding stale platform limits in this skill.

Inspect opening, middle, and ending frames and the transitions/events between them. Check motion cadence in playback where possible; extracted stills do not prove smooth motion. Check that interface overlays and capture controls are absent. Record any unavailable listening or playback check.

Return clearly named final files in a small delivery folder; keep obsolete takes in an archive or working directory. Open the containing folder when requested. Do not post to social media merely because the user asked for a social-ready file.
