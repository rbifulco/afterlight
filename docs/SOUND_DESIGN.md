# Afterlight soundscape

Eighteen original ElevenLabs generations form a spatial environmental mix. Audio assets are served locally from `public/audio/`; the browser never contacts ElevenLabs and never receives an API key.

Click or tap the street, or select **Enable sound**, to start. **M** and the sound button toggle mute. The choice persists between visits. Audio suspends when the page is hidden and fades back on return. Existing view controls still fade after inactivity; no interaction panels were added.

## Layers

| Layer | Placement / behavior |
|---|---|
| Rain and distant city air | Stereo environmental bed with slow independent level variation |
| Metal-awning rain and gutter water | Fixed emitters at the shops and downspouts |
| Cooking, soft conversation, quiet radio jazz | Positioned inside the noodle bar, filtered with distance |
| Precision servos and projector machinery | Workshop and hologram hardware; repair intensity follows its working phase |
| Metro rolling / bridge resonance | Two emitters follow the visible carriages and fade as the train leaves |
| Wet tires | Follows the actual passing sedan, becoming muffled in the service alley |
| Parked taxi ventilation and wipers | Fixed at the taxi; wiper sound follows its seven-second cycle |
| Two wet-boot contacts | Alternated with variations, triggered by courier gait and pedestrian travel |
| Cup, station PA, alley door | Sparse contextual events with long gaps |

Spatial emitters use HRTF panning. A listening point between the camera and the courier retains street detail at the wide view, while camera orientation determines the left/right field. Distance attenuation, low-pass filtering and a restrained generated impulse response place sounds within the concrete street. The impulse response is a local DSP effect; all audible source recordings are ElevenLabs assets.

Loops use scheduled overlapping playback with gain ramps, in addition to prepared loop seams. Foley pre-roll is removed where detected. Generated files are loudness-normalized and peak-limited during preparation; the runtime master has a high-pass filter, dynamics compressor and a gradual start/mute fade. The radio stays a low-level sound inside the shop rather than a global soundtrack.

## Provenance and reproduction

- `docs/soundscape-plan.json`: every original generation prompt, duration and loop setting.
- `docs/audio-generation.json`: per-generation model, response credit header, size and source hash.
- `docs/audio-assets.json`: shipping-file hashes, durations, channels, measured peak/RMS levels and loop-boundary measurements.
- `.dream-loop/audio-raw/`: original API responses retained for reproducible preparation.
- `scripts/generate-soundscape.py`: reads `ELEVENLABS_API_KEY` / `ELEVEN_LABS_API_KEY`, or an explicitly supplied `--key-file`, only into process memory. Existing raw files are skipped on reruns.
- `scripts/prepare-audio.py`: local ffmpeg-based normalization, seam preparation and verification.
- `src/soundscape.js`: runtime spatial mixer and scene synchronization.

Generation used `eleven_text_to_sound_v2` and MP3 44.1 kHz output. There are no cloned voices or supplied third-party recordings. The conversation/PA effects were prompted to be indistinct; no specific person or performer was imitated.

The 18 returned `character-cost` headers sum to 2,284. The subscription counter moved from 39,433 to 41,160 during the batch, a delta of 1,727. Those provider measurements differ, so this report does not treat either as a definitive invoice. No credit-limit or billing settings were changed.

API and browser references: [ElevenLabs sound-effects endpoint](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert), [Web Audio spatial panning](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode), [AudioContext resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume).

## Verification limits

Shipping audio is approximately 3.3 MB. All files decode in the live browser; the output analyser shows nonzero signal with measured headroom, and the mixer keeps a bounded source count across loop boundaries. Runtime checks cover activation, mute, resumed playback and walking-triggered Foley. Browser output and waveform measurements verify implementation, not a subjective listening review; this environment cannot directly audition audio. The sound should be assessed on the user's speakers or headphones.
