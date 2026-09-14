---
name: dream-loop-production
description: Build and refine visually ambitious interactive scenes through art direction, asset quality, motion, sound, and reproducible capture. Use for immersive worlds or taking a Dream Loop prototype to a working, shareable experience; use ordinary development workflows for routine UI changes.
---

# Dream Loop Production

Produce a place that holds up while someone explores it, not just a frame that resembles an image. Use generated targets when helpful, but keep the user's intent, the running product, and actual acceptance evidence authoritative.

This is a companion workflow, not a replacement installation of the original Dream Loop skill. It is self-contained. If another explicitly requested workflow conflicts, identify the conflict and follow the user's instructions; do not silently combine incompatible stopping rules.

## Enter at the right stage

On an existing project, read its instructions and recent work, inspect the running experience, and identify the current request. Do not restart image generation or redesign an accepted scene merely because this skill loaded. On a new project, establish one representative view and a small working scene before multiplying assets or effects.

Record only the decisions needed to resume accurately:

- Intended experience, style, user actions, and explicit exclusions.
- Current deliverable and latest user correction.
- Reference image and whether it was actually inspected.
- Target device/viewport, live performance expectation, and any explicit time/cost budget.
- Which scene, camera, mix, and release are implemented, verified, or accepted.

Use a short `.dream-loop/state.md` or the project's existing equivalent. Keep generated intermediates ignored. Durable build instructions, asset provenance, and verified delivery records belong in the repository.

Choose methods from available capabilities, asset requirements, and budget. Do not infer API access, permission to spend, or asset quality from a subscription tier. An unavailable image generator does not block work that can use a supplied reference or the current scene.

## Work in three loops

### 1. Direction and composition

Establish the main subject, camera, spatial layout, palette, and scale relationships. For an existing scene, use its live screenshot as the input to any generated refinement. Reject generated targets that silently change geometry, camera, medium, or attainable rendering quality.

Separate stable targets from dynamic details: composition and material character may be fixed; rain positions, people, flicker, and traffic need behavioral checks rather than pixel identity.

If a supplied reference is inaccessible, say so promptly. Do not substitute a convenient live view and later describe it as matched. Continue independent work; resolve the reference or camera uncertainty before an expensive final capture.

### 2. World and experience

Read [world-building.md](references/world-building.md) when making assets, animation, environmental detail, or sound.

Get one hero asset and one representative behavior working at the closest allowed camera distance. Fix proportion, contact, articulation, readability, and lighting before adding population or decorative detail. Use fewer convincing elements when quality cannot support density.

Evaluate human-scale and moving elements in motion. A still image does not verify gait, grasping, sound, collision, or temporal stability. Integrate sound in small auditionable groups; successful decoding is not artistic approval.

Prioritize a small batch of changes by perceptual impact and user feedback. After repeated failure on the same defect, change the representation or asset strategy instead of adding more polish around it. User-rejected defects outrank a judge's aggregate score.

### 3. Verification and delivery

Read [verification-and-delivery.md](references/verification-and-delivery.md) for performance, acceptance, publication, and resuming after interruptions. Read [camera-and-capture.md](references/camera-and-capture.md) when a specific viewpoint, screenshot, or film is requested.

Check performance early enough to expose a structural problem; respect the user's requested order for optimization work. Benchmark comparable camera, scene phase, resolution, and machine conditions. Inspect the visual tradeoff after optimization.

When independent review is authorized and useful, give a reviewer the actual brief and evidence, with a bounded question. Ask for the most consequential defects and how to verify them. Do not require a new reviewer for every small change or allow review to replace the user's direction.

## Decisions that prevent expensive mistakes

| Situation | Action |
|---|---|
| “From A toward B” | Record camera-side landmark A and subject B separately; show the actual preview before a long export if the direction is still uncertain. |
| “Farther back” | Dolly away along the chosen viewing direction; retain the intended subject and inspect occlusion/foreground. Do not merely widen the lens or orbit. |
| A generated human looks wrong | Inspect silhouette and deformation first; replace or remove before increasing clothing detail or crowd size. |
| A sign looks compressed | Match texture and mesh aspect ratios; fit typography uniformly and inspect the sign at runtime scale. |
| “That whisper sounds strange” | Mute plausible voice stems, compare before/after, and record listening limits. Do not disguise the source with extra ambience. |
| “60 fps video” | Distinguish 600 rendered frames over ten seconds from a live 60 fps guarantee. Choose an honest capture method. |
| Feedback arrives mid-export | Invalidate the affected shot/mix revision and stop its export. Preserve completed files; do not mix old and new frames. |
| Publication or source upload stalls | Observe the process and remote state, use a bounded retry, and avoid unbounded waits or duplicate releases. |

## Finish with evidence

Report the requested result and its usable links. Name material limits directly. A build passing, a file existing, a render completing, and a user accepting the angle are different facts.

If work is interrupted or redirected, save the exact remaining task and verification status. Do not promote planned or locally edited changes to “delivered.”
