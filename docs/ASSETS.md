# Original assets

No external stock art, textures or models were used. Runtime requests are local project resources and installed software dependencies. The supplied Vesper GIF was viewed only as a composition reference and is not included in the runtime.

## Models

Original Blender 5.1.1 models, each reproducible from its Python source:

| Asset | Source |
|---|---|
| `public/assets/courier.glb` | `scripts/build-courier.py`; tailored cloth silhouette, named body/arm/elbow/leg/knee/coat pivots |
| `public/assets/sedan.glb` | `scripts/build-vehicles.py`; shaped body with Boolean wheel arches, glass, cabin, rims, lights, and separate cargo lid |
| `public/assets/service-van.glb` | `scripts/build-vehicles.py`; tall cargo shell, sliding panels, roof refrigeration and commercial fittings |
| `public/assets/delivery-scooter.glb` | `scripts/build-scooter.py`; uses the vehicle modeling helpers |
| `public/assets/service-android.glb` | `scripts/build-android.py`; exposed joints, actuators, armor, hands and optical sensors |

City architecture, metro cars, shop interiors, screens, furniture, foliage, and utilities are original geometry in `src/city.js` and `src/street-life.js`. `src/people.js` poses and batches instances of the original courier for the background inhabitants.

Vehicle wear is applied as a low-amplitude height map in Three.js. It is deliberately not exported as a tangent-space normal map; interpreting the grayscale texture as normal vectors distorted the bodywork and was corrected during close-up review.

## Textures

The following were created using the built-in image-generation tool, then copied into the project. These are original generated materials, not downloaded stock assets.

### `public/assets/asphalt.png`

Prompt: “Generate a seamless tileable PBR base-color texture of dark weathered urban asphalt for a rainy cyberpunk game. Orthographic straight down, uniformly lit, no perspective, no objects, no road markings, no lights or colored reflections. Fine rough aggregate, hairline cracks, irregular darker smooth puddle patches covering 35 percent, subtle gray gritty variation. Neutral charcoal gray, not pure black. Square texture, detailed realistic material suitable for repeating over a large 3D road.”

### `public/assets/concrete.png`

Prompt: “Square seamless tileable base color game texture of old brutalist concrete facade. Straight-on orthographic texture only, no perspective, no windows, no architecture, no objects, no letters. Medium cool gray cement slabs with subtle horizontal and vertical panel seams spaced widely, dark rain streaks and water staining below seams, exposed fine aggregate, small chips, mottled grime and darker bottom weathering. Photorealistic PBR material, neutral flat diffuse illumination without shadows or highlights. Good balanced contrast, detailed and worn but not destroyed.”

### `public/assets/windows.png`

Prompt: “Create a square 4 by 4 texture atlas of sixteen different apartment windows at night, each cell exactly same size and each rectangular window occupying its entire cell, no gaps between cells. Straight-on orthographic game texture. Windows show dim lived-in interiors behind glass: varied warm amber desk lamps, curtains half drawn, venetian blinds, houseplant silhouettes, shelves, occasional cool blue television light. Half the rooms are very dark, others softly illuminated warm amber. Thin dark metal frame around each cell. Old dense Asian cyberpunk city apartment mood, realistic worn glass, restrained exposure, no glaring white panels, no words or signage, no perspective, no exterior building wall. Suitable to randomly map individual atlas cells onto low-poly 3D windows.”

### `public/assets/noodle-shop.png` — rear-wall detail behind the modeled noodle bar

Prompt: “Create a wide seamless-looking game texture for the front window of an original late-night noodle restaurant, straight-on orthographic view. Wide horizontal 3:1 composition. View through glass into a tiny warmly illuminated ramen bar: long wood counter, red round stools, warm amber pendant lamps, stacked ceramic bowls, handwritten small menu strips, steam rising from kitchen pots, two dark anonymous seated patron silhouettes and one cook silhouette. No building exterior, no awning, no perspective on the window plane, no big text, no logo. Interior fills entire image. Strong warm amber and gold illumination with dark silhouettes and plenty of small detail; middle brightness, not blown out. This will be mapped onto a long low-poly cyberpunk storefront window at night. Entirely original game art.”

Neon typography and simple particle falloff are generated in code. The Dream Loop target is preserved in `.dream-loop/target.png` for local visual review and is not used as a scene background.


## Second-pass artwork

Created with the built-in image-generation tool and copied into `public/assets/`. The large advertisements are now animated, translucent holographic geometry driven by the original artwork. Their projector beams, scan bands, distortion and depth echo are authored in `src/hologram.js`; no new raster image was needed for the holographic effect.

### `public/assets/kaen-ad.png`

Prompt: “Create an original fictional cyberpunk luxury advertisement screen texture. Tall portrait 2:3 composition, straight-on flat graphic suitable for mapping onto a billboard, edge-to-edge image no frame no physical scene. A beautifully rendered androgynous synthetic adult face in profile in top two thirds, wet swept-back black hair, delicate chrome jaw and neck mechanisms, violet silver translucent skin, fine etched manufacturing marks, elegant fashion editorial photograph with deep black background, lavender side lighting and faint rose rim light. One hand delicately holds a small clear purple perfume vial near lips. Lower third elegant white widely spaced typography: 'K Æ N' then smaller 'SYNTHETIC DESIRE' then tiny 'FEEL SOMETHING NEW'. Original design, no existing brand, no watermark. Restrained expensive design, nuanced material rendering, fine film grain.”

### `public/assets/nova-ad.png`

Prompt: “Create an original fictional cyberpunk optical augmentation advertisement, tall portrait 2:3, flat edge-to-edge billboard texture no frame no scene. Striking macro photograph of a sophisticated mechanical human eye with a luminous amber iris suspended in a black carbon and brushed titanium socket, photoreal micro mechanisms and subtle rain droplets. Eye fills middle third. Top typography huge elegant compact industrial cream letters: 'NOVA' then small 'OPTICAL SYSTEMS'. Bottom large condensed cream text: 'SEE PAST' and next line 'MIDNIGHT.' Small technical orange annotations and fine ruler marks around eye, serial 'N-09', tiny 'A CLEARER TOMORROW'. Restrained orange, black and warm ivory palette, real material detail, high-end near-future industrial advertising with intelligent typography and negative space. Original fictional brand, no existing logos, no watermark.”

### `public/assets/coat-fabric.png`

Prompt: “A seamless tileable physically based material base-color texture for a weathered dark petrol charcoal waxed cotton raincoat. Entire image is uniform flat textile surface photographed straight-on under diffuse even neutral lighting. Extremely fine dense woven fibers, subtle worn coating, tiny dark water droplets and soft irregular abrasion, restrained variations. No garment shape, no folds, no seams, no text, no lighting gradients, no specular glare, no objects. Dark desaturated blue-gray charcoal fabric suitable for an original realtime 3D cyberpunk courier coat. Square texture.”

The revised visual target is `.dream-loop/target-v2.png`, generated from the first live screenshot using the built-in image tool. It guides review and is not shipped as a rendered scene or used to simulate 3D output.


### `public/assets/workshop-wall.png`

Prompt: “Generate an original detailed texture for the BACK WALL INSIDE a cyberpunk cybernetics repair shop. Wide horizontal 3:1 flat straight-on view, no perspective distortion, orthographic elevation. A dense well-used dark metal workshop pegboard and shelves: organized and disorganized steel tools, small machined prosthetic parts, looped cables, circuit boards, electronic testing instruments, two small glowing cyan diagnostic monitors, amber illuminated parts bins, handwritten tape labels. Rich realistic surfaces, worn titanium and dark steel with localized warm task lights and cyan electronic light, deep dark recesses, subtle grime, believable tiny detail. Lower third a cluttered rear worktop with tools and disassembled mechanisms. No full people, no large human body, no outer storefront, no doors, no big logos, no watermark. This is a surface/detail texture behind actual modeled furniture and androids in a realtime 3D scene, not a completed scene screenshot. Edge-to-edge shop wall texture.”

The noodle and workshop rear-wall textures supply small surface details behind the actual modeled counters, seats, inhabitants, frames, equipment, and display androids. They are not substituted for the interactive foreground geometry.

## Ambient neighborhood pass — September 14, 2026

`public/assets/resident.glb` is an original civilian variation built by `scripts/build-resident.py` from the project's original courier tailoring/animation rig. It replaces the hood, courier equipment, mask, and glowing hardware with an uncovered face, ears, hands, and knit cap. It uses the existing original generated coat texture. `src/people.js` instances the civilian meshes and animates individual residents; cups and umbrella canopies/ribs are authored geometry.

`src/atmosphere.js` adds deforming fabric using the existing coat texture, kitchen vapor, awning runoff, curb splashes, small litter, curtains, and window silhouettes. These are animated code-native surfaces and effects. The taxi's static wipers were removed from the Blender source so its runtime blades can sweep the actual windshield plane.

The v3 development target (`.dream-loop/target-v3.png`) was generated by editing a live screenshot, using the built-in image-generation tool. Prompt: “Edit the attached actual browser Three.js city screenshot into the target for a focused next iteration. Preserve the EXACT camera, same buildings, same original low-poly real-time graphics, same street dimensions, taxi, holographic cyan eye and violet woman, lighting and level of model fidelity. Remove ALL header/footer UI, floating diamonds, text prompts, counters, panels. Bring this existing neighborhood to life with subtle believable additions: 5 or 6 appropriately human-sized raincoat pedestrians with umbrellas walking along the pavements, two people sheltering at the repair awning, animated-looking cook stirring at the noodle counter and seated patrons talking. Add dark wet fabric noren curtains under the noodle awning, a little hanging laundry from one upper balcony, thin streams of water running from the awnings into curb puddles, restrained kitchen steam, a few window curtains lit from inside. Keep a mostly empty central road, late-night quiet, original architecture unchanged, avoid crowd density, more billboards, neon oversaturation, particles everywhere, futuristic gimmicks or any UI. This must be an achievable in-engine real-time screenshot derived directly from this scene, not a painting or photorealistic reinterpretation. Match existing image pixel layout and visual style closely.”

Generated reference source: `exec-9f1d68a3-5830-4547-bcce-7973c4eb4276.png`. The reference is not used as a flat backdrop in the application. Earlier descriptions of the advertising takeover are historical; the ambient pass removes that interface and its runtime state.

## Car/character surfacing and sound pass — September 14, 2026

The original Blender vehicle source now builds a rounded sedan nose, curved integrated light surround, continuous body/roof surfacing, swept panoramic glazing, deep wheel liners and five-slot aero wheels. The existing van receives the improved body surfacing and wheel design. Runtime paint uses restrained clearcoat; glazing highlights were adjusted after close-view review. Model footprints remain part of the navigation obstacle calculation.

The courier and civilian source now use narrower shoulders/sleeves, slimmer trouser legs, smaller boots, and two meeting coat panels that form a continuous fabric silhouette. The courier hood and equipment were reduced in bulk. Existing gait, gestures, umbrella attachments and material instancing remain active.

A screenshot-derived style target is retained as `.dream-loop/target-style-v4.png`. It was generated with the built-in image tool from `.dream-loop/before-style-v4.png`; source filename `exec-31e634aa-d7f3-470b-96b2-e8c282233b48.png`. The prompt asked to refine only cars/people, preserving the exact city and camera: cleaner original neo-retro electric sedan surfacing, inset arches, aero wheels, dark curved glazing, integrated thin lighting, and natural human proportions with continuous raincoat fabric instead of segmented shapes. This reference is not an application background.

All eighteen original audio-generation prompts, API receipts and shipping-asset hashes are recorded separately in [SOUND_DESIGN.md](SOUND_DESIGN.md) and its linked JSON files. These sounds were generated using ElevenLabs, not downloaded as stock recordings.

## Sites social preview

`public/og.png` is an original generated sharing card derived from `.dream-loop/style-v4-round2.png`, preserving the actual city composition with AFTERLIGHT / DISTRICT 09 typography. It is link-preview artwork, not a validation screenshot.
