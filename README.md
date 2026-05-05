# ShotMusic Studio

Een volledige browser-based DAW — geen installatie, geen plugins, geen account vereist. Draait direct in Chrome of Edge.

![ShotMusic Studio](shot_logo.png)

## Wat is ShotMusic?

ShotMusic is een online muziekproductie-omgeving gebouwd op [Tone.js](https://tonejs.github.io/) en de Web Audio API. Je maakt beats, basslijnen, melodieën en arrangementen volledig in de browser — exporteerbaar als WAV of MIDI.

## Features

### Sequencer & Patterns
- **Step sequencer** met 16 of 32 stappen per track
- 8 onafhankelijke patronen (A–H) per project
- Per stap: velocity, probabiliteit en gate
- Chord Step Row: trigger akkoorden op specifieke steps

### Track types
| Type | Beschrijving |
|------|-------------|
| Kick | Sinusgolf met pitch-decay, 7 presets |
| Snare | Noise synth + tooncomponent, 8 presets |
| Hi-Hat | Gefilterd ruis, 6 presets |
| Bass | Oscillator + filter-envelope, 22+ presets |
| Melody | Polyfone synth, instelbare golfvorm |
| Pad | Langzame attack, breed stereogeluid, 15+ presets |
| Sample | Eigen audiobestand of sample browser |

### Piano Roll
- Noten plaatsen, slepen en vergroten
- Genereer automatisch melodieën op basis van toonladder en akkoordprogressie
- Bars instelbaar: 1, 2, 4 of 8 bars per loop

### Plugins
- **TD-3 Bass Generator** — TB-303/TD-3-stijl basslijn-sequencer met draaiknoppen, piano-key stappen, accenten, slides en ties. 7 genre presets. Exporteerbaar naar de sequencer als piano roll track met eigen synth.
- **Drum Machine** — patroongebaseerde drumcomputer los van de hoofdsequencer
- **Euclidean Sequencer** — wiskundig ritme-generator per track
- **Beat Slicer** — laad een audiobestand, detecteer transients automatisch, edit slices op de waveform en exporteer als sample-tracks
- **Melodica** — microfoon pitch-detectie: zing of speel een melodie en transcribeer naar de piano roll
- **Chord Pad** — aanraakbare akkoord-pads voor live performance

### Akkoorden & Muziektheorie
- Toonsoort en modus (majeur/mineur)
- Akkoordprogressies genereren
- Arpeggiator met mode, rate, octaven en gate
- Voice leading

### Arrangement
- **Clip Launcher** (Session View) — onafhankelijk per track patronen switchen, ideaal voor live performance
- **Arrangement Timeline** — lineaire song-editor met clips, Song Mode voor volledig geautomatiseerd afspelen
- **Song Sections** — markeer intro, build, drop, outro op de tijdlijn

### Mixer & Effecten
- Volledig kanaal-mixer met volume faders, pan, mute en solo
- Per track: reverb, delay, low-pass filter, distortion
- 3-band parametrische EQ per track
- 4 submix-buses: Drums, Bass, Synths, FX
- LFO — moduleer filter, volume of pan
- Master compressor + limiter
- Sidechain-pump effect

### MIDI
- **MIDI Import** — importeer .mid bestanden als piano roll tracks (Format 0 & 1)
- **MIDI Export** — exporteer het volledige project als .mid
- **MIDI Learn** — koppel hardware knoppen aan parameters
- **VST Routing** — stuur MIDI live naar externe plugins via loopMIDI / IAC Driver

### Visualizer
- Spectrum analyzer
- Oscilloscoop
- Stereo-vectorscoop

### Overig
- **Auto-save** naar IndexedDB en localStorage
- **Cloud save** (optioneel, met account)
- **Undo/Redo** tot 50 stappen
- **Sample Packs** — eigen WAV/MP3 samples in `samples/PackNaam/Categorie/`
- **Startpacks** — complete genre-presets: Melodic Techno, Synthwave, Deep House, Downtempo, Drum & Bass, Acid House, Minimal Techno, Trance
- **Interactieve tour** voor nieuwe gebruikers
- **Performance Monitor** — real-time FPS, audio latency, drift, heap en RAF-count
- **PWA** — installeerbaar als app voor betere audio scheduling

## Sneltoetsen

| Toets | Functie |
|-------|---------|
| `Spatie` | Play / Stop |
| `Ctrl+Z` | Ongedaan maken |
| `Ctrl+Y` | Opnieuw |
| `Ctrl+S` | Opslaan |
| `F1` | Help openen |
| `Z` / `X` | Octaaf omlaag / omhoog (keyboard MIDI) |

**Computer keyboard als piano:**
Witte toetsen: `A S D F G H J K` — zwarte toetsen: `W E` `T Y U`

## Technologie

- [Tone.js](https://tonejs.github.io/) v14 — audio scheduling & synthesizers
- [Howler.js](https://howlerjs.com/) — sample playback
- [lamejs](https://github.com/zhuker/lamejs) — MP3 encoding
- [JSZip](https://stuk.github.io/jszip/) — project archivering
- Web Audio API, Web MIDI API, IndexedDB, Service Worker (PWA)

## Installatie (zelf hosten)

```bash
git clone https://github.com/jvdkwebdesign/shotmusic.git
cd shotmusic
# Serveer via een webserver (bijv. Apache, Nginx of php -S localhost:8000)
php -S localhost:8000
```

Voeg eigen samples toe in `samples/PackNaam/Categorie/bestand.wav`.

## Licentie

© jvdkwebdesign — alle rechten voorbehouden.
