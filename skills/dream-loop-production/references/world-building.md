# Building a world that survives inspection

Use the parts relevant to the request. These are decision criteria, not a requirement to add people, audio, or complex physics to every project.

## Choose a representation before adding detail

Ask what will be visible, how close the camera gets, and how the asset moves. The appropriate representation follows from those requirements.

| Requirement | Useful approach | Acceptance evidence |
|---|---|---|
| Repeated architecture, road markings, utilities | Parametric/code-authored geometry or modular authored pieces | Correct scale, joins, silhouettes, and affordable repeated rendering |
| Hero vehicle or rigid prop | Authored or suitably sourced mesh; Blender is one option | Multiple views, believable proportions, wheels/contact, glazing, material boundaries |
| Nearby animated human | Intentionally designed mesh, rig, and skin weights | Idle, walk, turn, sit/reach as needed; no joint separation, obvious sliding, or floating props |
| Distant human presence | Simpler silhouettes, impostors, or lower-detail meshes | Holds up at the supported distance; coherent movement and scale |
| Organic or irregular static object | Generated, authored, or licensed asset according to fit | Usable topology, normals, scale, provenance, and silhouette in the actual renderer |
| Surface detail | Authored/generated texture, decal, or geometry according to scale | Correct map interpretation, repeat scale, edge behavior, and response to light |

The order is not “stock, then generated 3D, then Blender, then procedural.” A generated mesh can be poor for articulation; a scripted Blender model can encode the wrong anatomy precisely. More polygons do not resolve either problem. Do not change an established engine just to follow these examples.

For third-party assets, track license and source. For generated assets, track inputs, provider/model where available, and modifications. A credential's presence is capability evidence, not blanket authorization for paid generation.

## Build a small representative slice

Choose one camera composition, one major asset, one nearby surface, and one important behavior. Include representative lighting and rendering effects, since flat-lit asset approval may not survive neon, wet reflections, or a different tone mapper.

Inspect before duplication:

- **Silhouette:** recognizable at the intended viewing size; no feature depends on a texture hiding incorrect volume.
- **Contact:** wheels meet the road, shoes meet paving, chairs support people, props meet hands.
- **Movement:** cadence, weight shifts, stopping, turns, and attachment transforms remain coherent.
- **Material response:** glass, skin, cloth, rubber, paint, and concrete read differently under the same light.
- **Cost:** mesh/material count, texture sizes, transparency, skinning, light count, reflection/shadow passes.

A human face, hand, gait, or wheel can dominate perceived quality despite occupying few pixels. Prioritize by semantic salience as well as screen area. If the representation cannot support close views, improve it, simplify its role, constrain proximity when appropriate to the product, or remove it. Do not conceal a rejected asset with extra fog or darkness and call it fixed.

## Make detail causally connected

Ambient activity should follow places and things: a cook stirs where food is prepared; water falls from an awning into a puddle; a train changes the light and sound as it passes. Vary timing and leave pauses. Distinct slower and faster rhythms are more useful than animating everything continuously.

For an ambient exploration brief, test what happens while the visitor does nothing. Prefer environmental behavior to new counters, prompts, modes, hotspots, or mini-games unless the user wants those mechanics. This is a scope decision, not a universal ban on UI.

## Typography is part of the setting

Maintain one intentional language and naming system appropriate to the world. Give signs a purpose: business name, route, hours, menu, wayfinding, or service. Do not substitute arbitrary foreign-language text for arbitrary English.

Compute canvas dimensions from the displayed surface aspect ratio. Keep glyph scaling uniform; do not rely on `fillText(..., maxWidth)` to squeeze a long label onto a narrow plate. Fit the housing to the content, check vertical lettering individually, and inspect actual view distance, glow, contrast, and occlusion. A sign can be technically rendered yet hidden behind its casing.

Treat generated raster lettering as artwork needing inspection. For precise or changeable text, prefer runtime typography or authored vector/text layers. A holographic screen needs a coherent material and projection behavior, not just bloom on an opaque billboard. Clamp fractional-power inputs and inspect transparency/reflection/postprocessing combinations when artifacts appear.

## Sound: compose, then add density

Build and compare small groups:

1. Environmental bed: enough to locate the scene, with room for details.
2. Local activity: a few recognizable emitters tied to visible places.
3. Moving sources: trajectory, attenuation, spectral change, and event timing.
4. Sparse foreground details: contacts, footsteps, doors, utensils.
5. Music or voices only where they serve the brief.

Defaulting every stem to “quiet” can still produce a crowded mix. Judge masking, tonal buildup, repetitive loops, spatial plausibility, and whether attention follows the intended subject. Use mute/solo controls in development, not extra product UI. Keep stem identity through export so a rejected sound can be removed without regenerating everything.

For voice-like artifacts, isolate likely speech layers first. Indistinct speech plus filtering/reverb may read as whispering rather than distant social presence. Muting an unwanted layer is a valid improvement. Check other stems if the artifact remains. Do not assert the culprit solely from filenames or generation prompts.

Audio checks have distinct meanings:

| Check | Establishes | Does not establish |
|---|---|---|
| Fetch/decode | Assets are technically usable | They sound good |
| Signal/peak/loudness analysis | Signal presence, clipping/headroom, level consistency | Pleasant timbre, intelligibility, or emotional fit |
| Event and position logging | Intended triggering and spatial trajectory | Convincing subjective perception |
| Listening in the actual scene | Mix quality on that playback setup | All-device quality |

If listening is unavailable, disclose it and get targeted user feedback when artistic acceptance depends on it. Continue technical work; do not claim audition. Validate activation, mute/resume, background behavior, loop joins, and bounded voice scheduling. Keep provider credentials in generation tooling; runtime clients receive only the prepared assets.
