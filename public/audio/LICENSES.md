# Audio licensing — Workstation 98

**This directory ships no audio files, by design.**

Every sound in the experience is synthesized at runtime in WebAudio by
`src/lib/audio.ts`. There are no `.mp3`/`.ogg`/`.wav` assets to license,
attribute, or mis-source.

That is the deliberate posture for plan-0009 §6.1 and ADR-012 §10 (zero
Microsoft IP). The slice permitted CC0/CC-BY sourcing with attribution
recorded here, and permitted synthesis "where sourcing stalls". We chose
synthesis for the whole Tier-1 palette instead, because it makes the IP
question unanswerable rather than merely answered: no clip exists that
could turn out to be a rip of a shipped operating-system sound.

## The palette

All generated in `src/lib/audio.ts`; none is a recording or a
transcription of any Microsoft sound.

| Sound | Bus | Synthesis |
|---|---|---|
| Degauss thunk | machine | Triangle 92→38 Hz pitch drop + low-passed noise |
| BIOS beep | machine | Square 1046 Hz, ~100 ms |
| Startup chime | machine | **Original composition** — F4–A4–C5–G5 on FM bells |
| UI click | ui | Band-passed noise burst, ~14 ms |
| Window open / close | ui | Triangle glide up / down |
| Error ding | ui | Two FM bells, 880 → 659 Hz |
| Shutdown | machine | Three FM bells descending, C5–G4–C4 |
| CRT hum bed | room | 60 Hz + 120 Hz sines + low-passed noise, looped |

The startup chime is an original four-note figure (a rising major ninth)
written for this project. It is intended to evoke the era's optimism, not
to resemble any particular product's chime.

Noise sources are seeded (`mulberry32`), so the texture is identical on
every run — deterministic for QA and consistent with the repo's
no-`Math.random` convention.

## If a sample is ever added

Add the file, then add a row here recording: filename, source URL, author,
licence (CC0 or CC-BY with the required attribution string), and the date
retrieved. A file in this directory without a row here is a bug.

## Payload

0 bytes, against the §6.1 budget of 1.5 MB.
