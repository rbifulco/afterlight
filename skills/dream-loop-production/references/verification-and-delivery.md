# Verification, release, and continuity

## Keep criteria separate

A high average score must not cancel a critical failure. Choose a few criteria appropriate to the brief and use explicit evidence.

| Dimension | Evidence example | Blocking example |
|---|---|---|
| Direction | Live preview against reference or stated intent | Wrong side of the street or rejected framing |
| Visual construction | Representative close and wide views | Broken human joints, compressed signs, opaque hologram artifact |
| Motion and interaction | Short loop plus the relevant action | Foot sliding, floating held props, walking through a vehicle |
| Sound | Audition plus technical checks where available | Rejected whisper still present in final mix |
| Performance | Comparable frame-time samples on the intended device | Unacceptable responsiveness in the supported view |
| Capture | Exact file inspected, metadata and cadence checked | Old camera/mix, wrong duration, duplicated-frame claim |
| Delivery | Successful release plus usable URL/files | Local build described as the live public version |

Track each as `not checked`, `observed`, `failed`, or `accepted` as appropriate. Reserve user acceptance for an actual user decision; tool success is not acceptance. An artistic reviewer offers evidence and prioritization, not authority over the user's taste.

## Review with a question

Give a reviewer the brief, relevant reference, actual current view, and a specific task. For animation or sound, supply those media or acknowledge their absence. Ask for a short ranked list: location, visible/audible defect, likely cause, corrective action, and how to verify it. Avoid an exhaustive list of every different pixel in a stochastic scene.

Use a numerical score only for a reasonably stable comparison with understood limits. Do not treat an 8/10 threshold as a release guarantee. If the same human, camera, or material defect survives two focused attempts, inspect the asset or representation itself. A deadline changes scope and reporting, not the truth of completion claims.

## Performance without misleading comparisons

Before significant optimization, record viewport and drawing-buffer dimensions, device pixel ratio, quality/effects, camera, scene phase, audio state, device/browser, and relevant concurrent workload. Warm the scene before sampling. Compare a consistent period and frame-time distribution, not one FPS counter at an arbitrary moment.

Measure CPU update, render submission, and GPU time when instrumentation is available. Draw calls and triangle counts are useful workload indicators; they do not by themselves identify the bottleneck or establish a speedup.

Prefer changes with an understood visual cost: static material/mesh reuse, batching rigid surfaces, reducing repeated texture uploads, sane reflection resolution, visibility work, and eliminating unnecessary updates. Then consider adaptive resolution, LOD, population limits, or effect changes according to the brief. Inspect an actual before/after view. A cheaper resolution or reflection target is a fidelity tradeoff even when it is a good one.

When batching, preserve transforms, transparent sorting, skinning, attachment points, and animation semantics. Validate representative geometry in world space. A larger batch can hurt culling; fewer draws is not always faster. Do not invent an optimization for behavior already handled by the library.

Record observations conservatively when system load varies. Live gameplay, active capture, and offline rendered export are separate performance contexts.

## Source, build, deployment, and media are separate versions

Keep source in one understandable repository with local run/build instructions and asset provenance. Preserve existing history and user work. Prepare public sharing concretely: inspect what is tracked, exclude secrets and temporary media, and verify the destination/audience under the user's existing authorization. Do not choose a license on the user's behalf merely to make the repository look complete.

For a first public source release, include reachable Git history in the credential review and check redistribution rights for bundled third-party assets; ignoring a file now does not remove it from history. Source can include clearly disclosed work in progress when the user authorizes sharing it. Lack of artistic approval need not block that source publication, but it must not be described as a validated production release.

For a hosted release, follow the current provider skill/tool contract. Preserve a supported separation between development and production tooling. Link the release to the exact built source revision and artifact. A source repository becoming public does not itself update the hosted site; deploying a website does not itself publish source.

On an uncertain or stalled network operation, observe the process and remote state before retrying. Use timeouts or a bounded low-throughput condition, retain returned IDs, and avoid duplicate site/version creation. After success, verify the operation at its destination. A push can succeed remotely and fail while writing local branch tracking if the disk fills; reconcile the two states rather than assuming a total failure.

Runtime URLs, media files, and README claims should agree about what is available. A local IP can change. A successful localhost response is not proof of access from a different device. A successful public response is not proof that the intended asset revision is serving; check the relevant version when needed.

## Resume without losing the brief

A compact record is sufficient:

```text
Current deliverable:
Latest user correction:
Accepted/selected reference and shot revision:
Current source, asset, and audio revisions:
Local changes not yet verified or published:
Completed deliverables and evidence:
Running jobs/servers, identifiers, and their purpose:
Known blockers and last attempt/result:
Next concrete action:
```

Do not store credentials in this record. Put a rejected approach in the record only if it prevents repeating a consequential mistake. Keep any preservation/authorization constraints that still apply.

After an interruption, inspect actual files, jobs, browser tabs, and remote state before announcing progress. Renew browser handoff state when required by that environment. Never infer a user's approval from elapsed time or from an unanswered optional prompt.

An iteration note should be short: observed defect → hypothesis → change → evidence → result/next decision. A resumption should not require reconstructing the project from a long chat or a pile of unlabeled screenshots.
