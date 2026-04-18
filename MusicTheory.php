<?php

class MusicTheory
{
    // Note to MIDI number mapping (C4 = 60)
    const NOTE_TO_MIDI = [
        'C' => 0, 'C#' => 1, 'Db' => 1, 'D' => 2, 'D#' => 3, 'Eb' => 3,
        'E' => 4, 'F' => 5, 'F#' => 6, 'Gb' => 6, 'G' => 7, 'G#' => 8,
        'Ab' => 8, 'A' => 9, 'A#' => 10, 'Bb' => 10, 'B' => 11
    ];

    // Comprehensive scale patterns for electronic music
    const SCALES = [
        // Major scales and modes
        'major' => [0, 2, 4, 5, 7, 9, 11],
        'ionian' => [0, 2, 4, 5, 7, 9, 11], // Same as major
        'dorian' => [0, 2, 3, 5, 7, 9, 10], // Very popular in electronic music
        'phrygian' => [0, 1, 3, 5, 7, 8, 10], // Dark, Spanish flavor
        'lydian' => [0, 2, 4, 6, 7, 9, 11], // Bright, dreamy
        'mixolydian' => [0, 2, 4, 5, 7, 9, 10], // Dominant sound
        'aeolian' => [0, 2, 3, 5, 7, 8, 10], // Natural minor
        'locrian' => [0, 1, 3, 5, 6, 8, 10], // Diminished, rarely used
        
        // Minor scales
        'minor' => [0, 2, 3, 5, 7, 8, 10], // Natural minor
        'harmonic_minor' => [0, 2, 3, 5, 7, 8, 11], // Classic minor with raised 7th
        'melodic_minor' => [0, 2, 3, 5, 7, 9, 11], // Jazz minor
        
        // Pentatonic scales (very important for electronic music)
        'pentatonic_major' => [0, 2, 4, 7, 9],
        'pentatonic_minor' => [0, 3, 5, 7, 10],
        
        // Blues scales
        'blues_major' => [0, 2, 3, 4, 7, 9],
        'blues_minor' => [0, 3, 5, 6, 7, 10],
        
        // Electronic/Synthetic scales
        'chromatic' => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        'whole_tone' => [0, 2, 4, 6, 8, 10],
        'diminished' => [0, 2, 3, 5, 6, 8, 9, 11],
        'augmented' => [0, 3, 4, 7, 8, 11],
        
        // Eastern and exotic scales popular in electronic music
        'phrygian_dominant' => [0, 1, 4, 5, 7, 8, 10], // Spanish Phrygian
        'hungarian_minor' => [0, 2, 3, 6, 7, 8, 11],
        'double_harmonic' => [0, 1, 4, 5, 7, 8, 11], // Byzantine
        
        // Modern electronic scales
        'super_locrian' => [0, 1, 3, 4, 6, 8, 10], // Altered scale
        'neapolitan_minor' => [0, 1, 3, 5, 7, 8, 11],
        'enigmatic' => [0, 1, 4, 6, 8, 10, 11],

        // Melodic minor descending (same as natural minor - descends differently than ascending)
        'melodic_minor_descending' => [0, 2, 3, 5, 7, 8, 10]
    ];

    // Circle of Fifths - key relationships for transitions and modulation
    const CIRCLE_OF_FIFTHS = [
        'major' => ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'],
        'minor' => ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']
    ];

    // Relative major/minor pairs from Circle of Fifths
    const RELATIVE_KEYS = [
        'C' => 'Am', 'G' => 'Em', 'D' => 'Bm', 'A' => 'F#m', 'E' => 'C#m', 'B' => 'G#m',
        'F#' => 'D#m', 'Db' => 'Bbm', 'Ab' => 'Fm', 'Eb' => 'Cm', 'Bb' => 'Gm', 'F' => 'Dm',
        'Am' => 'C', 'Em' => 'G', 'Bm' => 'D', 'F#m' => 'A', 'C#m' => 'E', 'G#m' => 'B',
        'D#m' => 'F#', 'Bbm' => 'Db', 'Fm' => 'Ab', 'Cm' => 'Eb', 'Gm' => 'Bb', 'Dm' => 'F'
    ];

    // Chord construction formulas (in half steps between notes)
    const CHORD_FORMULAS = [
        'major' => [4, 3],           // Major triad: 4+3
        'minor' => [3, 4],           // Minor triad: 3+4
        'diminished' => [3, 3],      // Diminished triad: 3+3
        'augmented' => [4, 4],       // Augmented triad: 4+4
        'sus2' => [2, 5],            // Sus2: 2+5
        'sus4' => [5, 2],            // Sus4: 5+2
        'major7' => [4, 3, 4],       // Major 7th: 4+3+4
        'minor7' => [3, 4, 3],       // Minor 7th: 3+4+3
        'dom7' => [4, 3, 3],         // Dominant 7th: 4+3+3
        'half_dim7' => [3, 3, 4],    // m7b5 (half-diminished): 3+3+4
        'dim7' => [3, 3, 3],         // Diminished 7th: 3+3+3
    ];

    // Scale formulas (W=2 semitones, H=1 semitone)
    const SCALE_FORMULAS = [
        'major' => [2, 2, 1, 2, 2, 2, 1],         // W W H W W W H
        'natural_minor' => [2, 1, 2, 2, 1, 2, 2],  // W H W W H W W
        'harmonic_minor' => [2, 1, 2, 2, 1, 3, 1],  // W H W W H WH H
        'melodic_minor_asc' => [2, 1, 2, 2, 2, 2, 1], // W H W W W W H
        'melodic_minor_desc' => [2, 1, 2, 2, 1, 2, 2], // Same as natural minor
    ];

    // Extended chord patterns for electronic music
    const CHORDS = [
        // Basic triads
        'major' => [0, 4, 7],
        'minor' => [0, 3, 7],
        'diminished' => [0, 3, 6],
        'augmented' => [0, 4, 8],
        
        // Seventh chords
        'major7' => [0, 4, 7, 11],
        'minor7' => [0, 3, 7, 10],
        'dom7' => [0, 4, 7, 10],
        'dim7' => [0, 3, 6, 9],
        'half_dim7' => [0, 3, 6, 10], // m7b5
        'maj7_sharp11' => [0, 4, 7, 11, 18], // Lydian chord
        
        // Suspended chords (very common in electronic music)
        'sus2' => [0, 2, 7],
        'sus4' => [0, 5, 7],
        'sus2_add9' => [0, 2, 7, 14],
        'sus4_add9' => [0, 5, 7, 14],
        
        // Extended chords popular in electronic music
        'add9' => [0, 4, 7, 14],
        'minor_add9' => [0, 3, 7, 14],
        'add11' => [0, 4, 7, 17],
        'minor_add11' => [0, 3, 7, 17],
        
        // Ninth chords
        'major9' => [0, 4, 7, 11, 14],
        'minor9' => [0, 3, 7, 10, 14],
        'dom9' => [0, 4, 7, 10, 14],
        
        // Eleventh chords
        'major11' => [0, 4, 7, 11, 14, 17],
        'minor11' => [0, 3, 7, 10, 14, 17],
        
        // Power chord and octaves
        'power' => [0, 7], // Perfect fifth
        'octave' => [0, 12],
        
        // Electronic music specific voicings
        'wide_minor' => [0, 3, 7, 15], // Minor with octave spread
        'wide_major' => [0, 4, 7, 16], // Major with octave spread
        'cluster' => [0, 1, 2], // Dissonant cluster
        'quartal' => [0, 5, 10], // Built on fourths
        'quintal' => [0, 7, 14], // Built on fifths
        
        // Rufus Du Sol inspired chord voicings (based on Innerbloom analysis)
        'no3' => [0, 7], // No third - open, ambiguous
        'sus2' => [0, 2, 7], // Suspended second
        'sus4' => [0, 5, 7], // Suspended fourth
        'add9_no3' => [0, 7, 14], // Add9 without third - very open
        'minor_no3' => [0, 7], // Minor without third (same as no3 but contextual)
        'major_no3' => [0, 7], // Major without third (same as no3 but contextual)
        'sus2_add9' => [0, 2, 7, 14], // Sus2 with added 9th
        'sus4_add9' => [0, 5, 7, 14] // Sus4 with added 9th
    ];

    // Electronic music chord progressions with proper harmonic function
    const PROGRESSIONS = [
        // Classic electronic progressions
        'vi_IV_I_V' => [
            ['chord' => 'vi', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
        ],
        
        // Progressive house favorites
        'i_VII_VI_VII' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major']
        ],
        
        // Deep house classic (Dorian mode)
        'i_ii_IV_i' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor']
        ],
        
        // Melodic techno (Aeolian with borrowed chords)
        'i_bVII_bVI_bVII' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'bVI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major']
        ],
        
        // Ben Böhmer style (Lydian influenced)
        'I_ii_vi_IV' => [
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ],
        
        // Artbat/Tale of Us style (Modal interchange)
        'i_iv_bVII_i' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'minor'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor']
        ],
        
        // Korolova style (Phrygian elements)
        'i_bII_bVII_i' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'bII', 'function' => 'neapolitan', 'type' => 'major'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor']
        ],
        
        // Sus chord progression (very electronic)
        'sus4_sus2_minor_sus4' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus4'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus2'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus4']
        ],
        
        // Tension and release
        'i_V_vi_IV_add9' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom7'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor_add9'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'add9']
        ],
        
        // Essential EDM progressions from hit tracks
        'levels_progression' => [ // Avicii - Levels (i—III—VII—VI)
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major']
        ],
        'how_deep_progression' => [ // Calvin Harris - How Deep Is Your Love (i—VI—iv)
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'minor'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'] // Return to tonic
        ],
        'only_way_up_progression' => [ // Martin Garrix/Tiesto - The Only Way Is Up (i—VI—VII)
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'] // Resolve to tonic
        ],
        'classic_pop_edm' => [ // I—V—vi—IV (Classic four-chord progression)
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ],
        'vi_IV_V_I_variant' => [ // VI—IV—V—I (Rearranged classic)
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major']
        ],
        
        // Rufus Du Sol inspired progressions (based on Innerbloom and production analysis)
        'innerbloom_original' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'no3'], // C(no3)
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'sus2'], // Eb(sus2)
            ['chord' => 'v', 'function' => 'dominant', 'type' => 'minor'], // Gm
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'] // Bb
        ],
        'rufus_emotional_open' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus2'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'no3'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'add9'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'sus4']
        ],
        'atmospheric_suspended' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'no3'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'sus2'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'add9_no3'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus2']
        ],
        'melancholic_beauty_rufus' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'add9'],
            ['chord' => 'bVI', 'function' => 'submediant', 'type' => 'no3'],
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'sus2'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'sus4']
        ],
        'ethereal_drift_rufus' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus2'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'no3'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'add9'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'sus2']
        ],
        'emotional_depth_rufus' => [
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'add9'],
            ['chord' => 'bIII', 'function' => 'mediant', 'type' => 'no3'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'sus2'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'sus4']
        ],

        // ── Synthwave / Retrowave ────────────────────────────────
        'synthwave_classic' => [ // i–VI–III–VII (most iconic synthwave)
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'minor'],
            ['chord' => 'VI',  'function' => 'submediant',  'type' => 'major'],
            ['chord' => 'III', 'function' => 'mediant',     'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic',    'type' => 'major']
        ],
        'synthwave_retrowave' => [ // i–VII–VI–V (descending retrowave)
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'minor'],
            ['chord' => 'VII', 'function' => 'subtonic',   'type' => 'major'],
            ['chord' => 'VI',  'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'V',   'function' => 'dominant',   'type' => 'major']
        ],
        'synthwave_dark' => [ // i–iv–VII–III (darker, more dramatic)
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'minor'],
            ['chord' => 'iv',  'function' => 'subdominant','type' => 'minor'],
            ['chord' => 'VII', 'function' => 'subtonic',   'type' => 'major'],
            ['chord' => 'III', 'function' => 'mediant',    'type' => 'major']
        ],
        'synthwave_uplifting' => [ // I–V–vi–IV major (dreamwave / uplifting)
            ['chord' => 'I',   'function' => 'tonic',      'type' => 'major'],
            ['chord' => 'V',   'function' => 'dominant',   'type' => 'major'],
            ['chord' => 'vi',  'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'IV',  'function' => 'subdominant','type' => 'major']
        ],
        'synthwave_dreamwave' => [ // i–VI–VII–i (driving, hypnotic loop)
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'minor'],
            ['chord' => 'VI',  'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic',   'type' => 'major'],
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'minor']
        ],
        'synthwave_power' => [ // power chords — raw, aggressive
            ['chord' => 'i',   'function' => 'tonic',      'type' => 'power'],
            ['chord' => 'VI',  'function' => 'submediant', 'type' => 'power'],
            ['chord' => 'III', 'function' => 'mediant',    'type' => 'power'],
            ['chord' => 'VII', 'function' => 'subtonic',   'type' => 'power']
        ],

        // ── Jazz & Funk ──────────────────────────────────────────
        'ii_V_I' => [ // Classic jazz turnaround
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor7'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom7'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major7']
        ],
        'I_vi_ii_V' => [ // Rhythm changes / jazz standard
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major7'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor7'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor7'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom7']
        ],
        'i_iim7b5_V7_i' => [ // Jazz minor turnaround
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor7'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'half_dim7'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom7'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor7']
        ],
        'I_IV_ii_V_jazz' => [ // Jazzy four-chord
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major9'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major7'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor9'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom9']
        ],

        // ── Modal ────────────────────────────────────────────────
        'dorian_groove' => [ // Dorian i-II vibe
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor7'],
            ['chord' => 'II', 'function' => 'supertonic', 'type' => 'major7'],
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor7'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'minor7']
        ],
        'phrygian_gate' => [ // Phrygian flamenco feel
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'bII', 'function' => 'neapolitan', 'type' => 'major'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'bVI', 'function' => 'submediant', 'type' => 'major']
        ],
        'lydian_float' => [ // Lydian brightness I-II
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major7'],
            ['chord' => 'II', 'function' => 'supertonic', 'type' => 'major'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'add9'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor7']
        ],
        'mixolydian_roll' => [ // Mixolydian rock/folk
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major']
        ],

        // ── Cinematic / Ambient ──────────────────────────────────
        'andalusian_cadence' => [ // Flamenco/trance descending
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
        ],
        'I_iii_vi_IV' => [ // Cinematic major
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'iii', 'function' => 'mediant', 'type' => 'minor'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ],
        'i_v_VI_III' => [ // Film score / video game feel
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'v', 'function' => 'dominant', 'type' => 'minor'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'major']
        ],
        'i_VI_v_IV' => [ // Cinematic minor descent
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'v', 'function' => 'dominant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ],

        // ── Pop / R&B ────────────────────────────────────────────
        'I_V_vi_iii_IV' => [ // Pachelbel pop 5-chord
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'iii', 'function' => 'mediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ],
        'I_iii_IV_V' => [ // Ascending major pop
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'iii', 'function' => 'mediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
        ],
        'i_III_VII_VI' => [ // Emotional minor (Adele / deep house)
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'major'],
            ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major']
        ],
        'I_IV_vi_V' => [ // Uplifting pop EDM
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
            ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
            ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
        ],

        // ── Extended harmonic ────────────────────────────────────
        'i_IV_bVII_III' => [ // Dark modal pivot
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'iv', 'function' => 'subdominant', 'type' => 'minor7'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major7'],
            ['chord' => 'III', 'function' => 'mediant', 'type' => 'major']
        ],
        'i_VI_bVII_bVI' => [ // Dreamy floating loop
            ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'bVI', 'function' => 'submediant', 'type' => 'add9']
        ],
        'I_ii_iii_IV' => [ // Ascending bassline
            ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
            ['chord' => 'ii', 'function' => 'supertonic', 'type' => 'minor'],
            ['chord' => 'iii', 'function' => 'mediant', 'type' => 'minor'],
            ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major']
        ]
    ];

    public static function getScale($root, $scaleType = 'minor', $octave = 4)
    {
        $rootMidi = self::NOTE_TO_MIDI[$root] + ($octave * 12);
        $pattern = self::SCALES[$scaleType] ?? self::SCALES['minor'];
        
        $scale = [];
        foreach ($pattern as $interval) {
            $scale[] = $rootMidi + $interval;
        }
        
        return $scale;
    }

    public static function getChord($root, $chordType = 'minor', $octave = 4, $inversion = 0)
    {
        $rootMidi = self::NOTE_TO_MIDI[$root] + ($octave * 12);
        $pattern = self::CHORDS[$chordType] ?? self::CHORDS['minor'];
        
        $chord = [];
        foreach ($pattern as $interval) {
            $chord[] = $rootMidi + $interval;
        }
        
        // Apply inversion
        for ($i = 0; $i < $inversion; $i++) {
            $note = array_shift($chord);
            $chord[] = $note + 12;
        }
        
        return $chord;
    }

    /**
     * Get the relative major or minor key
     */
    public static function getRelativeKey($key)
    {
        return self::RELATIVE_KEYS[$key] ?? null;
    }

    /**
     * Get related keys for transitions (adjacent keys on Circle of Fifths)
     * Returns keys that are harmonically close and good for modulation
     */
    public static function getRelatedKeys($key)
    {
        $isMinor = strpos($key, 'm') !== false && strlen($key) > 1 && substr($key, -1) === 'm';
        $circle = $isMinor ? self::CIRCLE_OF_FIFTHS['minor'] : self::CIRCLE_OF_FIFTHS['major'];

        $pos = array_search($key, $circle);
        if ($pos === false) return [$key];

        $count = count($circle);
        $related = [
            'relative' => self::getRelativeKey($key),
            'fifth_up' => $circle[($pos + 1) % $count],
            'fifth_down' => $circle[($pos - 1 + $count) % $count],
            'parallel' => $isMinor
                ? str_replace('m', '', $key)
                : $key . 'm',
        ];

        return $related;
    }

    /**
     * Find the optimal inversion of a chord to minimize voice movement from previous chord.
     * This creates smoother voice leading in progressions.
     */
    public static function getOptimalInversion($chord, $previousChord)
    {
        if (empty($previousChord)) return $chord;

        $chordSize = count($chord);
        $bestInversion = $chord;
        $bestDistance = PHP_INT_MAX;

        // Try all inversions
        for ($inv = 0; $inv < $chordSize; $inv++) {
            $candidate = $chord;
            for ($i = 0; $i < $inv; $i++) {
                $note = array_shift($candidate);
                $candidate[] = $note + 12;
            }

            // Calculate total voice movement distance
            $distance = 0;
            $prevCount = count($previousChord);
            for ($i = 0; $i < min($chordSize, $prevCount); $i++) {
                $distance += abs($candidate[$i] - $previousChord[$i]);
            }

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestInversion = $candidate;
            }
        }

        return $bestInversion;
    }

    /**
     * Apply voice leading to an entire chord progression.
     * Each chord is inverted to minimize movement from the previous one.
     */
    public static function voiceLeadProgression($chords)
    {
        if (count($chords) < 2) return $chords;

        $voiced = [$chords[0]]; // Keep first chord as-is

        for ($i = 1; $i < count($chords); $i++) {
            $voiced[] = self::getOptimalInversion($chords[$i], $voiced[$i - 1]);
        }

        return $voiced;
    }

    /**
     * Build a chord from root using interval formulas (from PDF chord construction)
     */
    public static function buildChordFromFormula($rootMidi, $formulaName)
    {
        $formula = self::CHORD_FORMULAS[$formulaName] ?? self::CHORD_FORMULAS['minor'];

        $chord = [$rootMidi];
        $current = $rootMidi;
        foreach ($formula as $interval) {
            $current += $interval;
            $chord[] = $current;
        }

        return $chord;
    }

    /**
     * Get a key suitable for a breakdown/transition based on circle of fifths relationships
     */
    public static function getTransitionKey($currentKey, $sectionType = 'breakdown')
    {
        $related = self::getRelatedKeys($currentKey);

        switch ($sectionType) {
            case 'breakdown':
                // Breakdowns often use relative major for lift
                return $related['relative'] ?? $currentKey;
            case 'buildup':
                // Buildups can use the dominant (fifth up) for tension
                return $related['fifth_up'] ?? $currentKey;
            case 'bridge':
                // Bridges can use parallel major/minor for contrast
                return $related['parallel'] ?? $currentKey;
            default:
                return $currentKey;
        }
    }

    public static function getProgression($key, $progressionName = 'vi_IV_I_V', $octave = 4)
    {
        $isMinor = strpos($key, 'm') !== false;
        $root = str_replace('m', '', $key);
        
        $progression = self::PROGRESSIONS[$progressionName] ?? self::MELODIC_HOUSE_PROGRESSIONS[$progressionName] ?? self::PROGRESSIONS['vi_IV_I_V'];
        
        $chords = [];
        foreach ($progression as $degreeInfo) {
            $chordRoot = self::getDegreeNote($root, $degreeInfo['chord'], $isMinor);
            $chordType = $degreeInfo['type'];
            $chords[] = self::getChord($chordRoot, $chordType, $octave);
        }
        
        return $chords;
    }

    private static function getDegreeNote($root, $degree, $isMinor)
    {
        $scale = $isMinor ? self::SCALES['minor'] : self::SCALES['major'];
        $rootMidi = self::NOTE_TO_MIDI[$root];
        
        // Extended degree mapping for electronic music progressions
        $degreeMap = [
            'i' => 0, 'I' => 0, 'ii' => 1, 'II' => 1, 'iii' => 2, 'III' => 2,
            'iv' => 3, 'IV' => 3, 'v' => 4, 'V' => 4, 'vi' => 5, 'VI' => 5,
            'vii' => 6, 'VII' => 6,
            'bII' => 1, 'bIII' => 2, 'bVI' => 5, 'bVII' => 6  // Flat degrees for modal interchange
        ];
        
        // Handle flat degrees specially
        $scaleIndex = $degreeMap[$degree] ?? 0;
        $noteValue = $rootMidi + $scale[$scaleIndex];
        
        // Apply flats for borrowed chords
        if (strpos($degree, 'b') === 0) {
            $noteValue -= 1; // Lower by semitone for flat degrees
        }
        
        $noteValue = $noteValue % 12;
        
        $noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return $noteNames[$noteValue];
    }

    private static function getDegreeChordType($degreeInfo, $isMinor)
    {
        // This method is now deprecated since chord type is specified in progression data
        // Keeping for backwards compatibility
        $degree = is_array($degreeInfo) ? $degreeInfo['chord'] : $degreeInfo;
        
        if ($isMinor) {
            $chordTypes = [
                'i' => 'minor', 'ii' => 'dim7', 'III' => 'major',
                'iv' => 'minor', 'v' => 'minor', 'VI' => 'major', 'VII' => 'major',
                'bII' => 'major', 'bIII' => 'major', 'bVI' => 'major', 'bVII' => 'major'
            ];
        } else {
            $chordTypes = [
                'I' => 'major', 'ii' => 'minor', 'iii' => 'minor',
                'IV' => 'major', 'V' => 'major', 'vi' => 'minor', 'vii' => 'dim7'
            ];
        }
        
        return $chordTypes[$degree] ?? 'minor';
    }

    public static function quantizeToScale($midiNote, $scale)
    {
        $octave = intval($midiNote / 12);
        $note = $midiNote % 12;
        
        // Find closest note in scale
        $minDistance = 12;
        $closestNote = $note;
        
        foreach ($scale as $scaleNote) {
            $scaleNoteClass = $scaleNote % 12;
            $distance = min(abs($scaleNoteClass - $note), 12 - abs($scaleNoteClass - $note));
            
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $closestNote = $scaleNoteClass;
            }
        }
        
        return $octave * 12 + $closestNote;
    }

    public static function addTension($chord, $tensionType = '9')
    {
        $rootNote = $chord[0];
        
        switch ($tensionType) {
            case '9':
                $chord[] = $rootNote + 14; // Add 9th
                break;
            case '11':
                $chord[] = $rootNote + 17; // Add 11th
                break;
            case '13':
                $chord[] = $rootNote + 21; // Add 13th
                break;
            case 'sus2':
                $chord[1] = $rootNote + 2; // Replace 3rd with 2nd
                break;
            case 'sus4':
                $chord[1] = $rootNote + 5; // Replace 3rd with 4th
                break;
        }
        
        return $chord;
    }
    
    /**
     * Get the appropriate scale for a genre and key
     */
    public static function getScaleForGenre($root, $key, $genre, $octave = 4)
    {
        $isMinor = strpos($key, 'm') !== false;
        
        $genreScales = [
            'progressive_house' => $isMinor ? 'dorian' : 'major',
            'melodic_techno' => $isMinor ? 'aeolian' : 'mixolydian',
            'deep_house' => $isMinor ? 'dorian' : 'lydian',
            'organic_house' => $isMinor ? 'harmonic_minor' : 'mixolydian',
            'downtempo' => $isMinor ? 'phrygian' : 'dorian',
            'trance' => $isMinor ? 'harmonic_minor' : 'major',
            'drum_and_bass' => $isMinor ? 'aeolian' : 'mixolydian',
            'minimal_dub_techno' => $isMinor ? 'dorian' : 'mixolydian'
        ];
        
        $scaleType = $genreScales[$genre] ?? ($isMinor ? 'dorian' : 'major');
        return self::getScale($root, $scaleType, $octave);
    }
    
    /**
     * Get chord progression optimized for specific electronic genres
     */
    public static function getProgressionForGenre($genre)
    {
        $genreProgressions = [
            'progressive_house' => ['vi_IV_I_V', 'classic_pop_edm', 'vi_IV_V_I_variant', 'rufus_emotional_open'],
            'melodic_techno' => ['levels_progression', 'how_deep_progression', 'i_bVII_bVI_bVII', 'innerbloom_original'],
            'peak_time_techno' => ['only_way_up_progression', 'levels_progression', 'classic_pop_edm'],
            'deep_house' => ['i_ii_IV_i', 'how_deep_progression', 'ethereal_drift_rufus', 'i_VII_VI_VII'],
            'organic_house' => ['i_iv_bVII_i', 'emotional_depth_rufus'],
            'downtempo' => ['i_bII_bVII_i', 'atmospheric_suspended'],
            'trance' => ['vi_IV_I_V', 'classic_pop_edm', 'vi_IV_V_I_variant', 'levels_progression'],
            'drum_and_bass' => ['levels_progression', 'vi_IV_I_V', 'i_bVII_bVI_bVII', 'classic_pop_edm'],
            'minimal_dub_techno' => ['atmospheric_suspended', 'i_iv_bVII_i', 'i_bII_bVII_i'],
            'synthwave'      => ['synthwave_classic', 'synthwave_retrowave', 'synthwave_dreamwave', 'synthwave_dark', 'andalusian_cadence'],
            'darksynth'      => ['synthwave_dark', 'i_bVII_bVI_bVII', 'andalusian_cadence', 'phrygian_gate'],
            'outrun'         => ['synthwave_classic', 'synthwave_uplifting', 'I_iii_vi_IV', 'classic_pop_edm'],
        ];
        
        // Return random progression from genre array, or default
        $progressions = $genreProgressions[$genre] ?? ['classic_pop_edm'];
        return $progressions[array_rand($progressions)];
    }
    
    /**
     * Get the root note (in MIDI) for a given key string
     * Essential for parallel chord stabs implementation
     */
    public function getKeyRoot($key)
    {
        // Remove 'm' for minor keys to get the root note
        $root = str_replace('m', '', $key);
        
        // Return MIDI note number (middle C = 60, so C4)
        // For chord stabs, we use octave 0 as base, then add octave in the generator
        return self::NOTE_TO_MIDI[$root] ?? 0;
    }
    
    /**
     * Melodic House & Techno Theory
     * Based on Beatportal guide: artists like Anyma, Miss Monique, ARTBAT, Stephan Bodzin
     */
    
    // Melodic House & Techno specific chord progressions
    const MELODIC_HOUSE_PROGRESSIONS = [
        // From Beatportal guide - recommended progressions
        'anyma_style' => [
            ['chord' => 'i', 'roman' => 'Am', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'bVI', 'roman' => 'F', 'function' => 'submediant', 'type' => 'major'],
            ['chord' => 'bVII', 'roman' => 'C', 'function' => 'subtonic', 'type' => 'major'],
            ['chord' => 'v', 'roman' => 'G', 'function' => 'dominant', 'type' => 'major']
        ],
        'melodic_techno_classic' => [
            ['chord' => 'i', 'roman' => 'Am', 'function' => 'tonic', 'type' => 'minor'],
            ['chord' => 'iv', 'roman' => 'Dm', 'function' => 'subdominant', 'type' => 'minor'],
            ['chord' => 'v', 'roman' => 'Em', 'function' => 'dominant', 'type' => 'minor'],
            ['chord' => 'bVII', 'roman' => 'C', 'function' => 'subtonic', 'type' => 'major']
        ]
    ];

    // Tempo and rhythm characteristics for melodic house/techno
    const MELODIC_HOUSE_TEMPO = [
        'bpm_range' => [122, 125],
        'optimal_bpm' => 123,
        'kick_pattern' => 'four_on_floor',
        'hihat_patterns' => [
            'closed_rolling' => 'Continuous closed hi-hat rolls',
            'open_every_two' => 'Open hats every two bars for energy variation',
            'shuffled_groove' => 'Shuffled percussion for groove enhancement'
        ]
    ];

    // Arrangement structure for melodic house/techno
    const MELODIC_HOUSE_ARRANGEMENT = [
        'intro' => [
            'duration_bars' => 16,
            'elements' => ['minimal_percussion', 'atmospheric_pad'],
            'characteristics' => 'Minimal elements to set mood'
        ],
        'buildup' => [
            'duration_bars' => 32,
            'elements' => ['bass_introduction', 'filter_sweeps', 'subtle_effects'],
            'characteristics' => 'Gradually add bass and effects'
        ],
        'drop' => [
            'duration_bars' => 64,
            'elements' => ['full_instrumental', 'layered_pads', 'arpeggios', 'evolved_bass'],
            'characteristics' => 'Full instrumental complexity with hypnotic grooves'
        ],
        'breakdown' => [
            'duration_bars' => 32,
            'elements' => ['stripped_atmosphere', 'reverb_tails', 'minimal_percussion'],
            'characteristics' => 'Stripped-down atmospheric section'
        ],
        'climax' => [
            'duration_bars' => 64,
            'elements' => ['reintroduced_elements', 'increased_automation', 'cinematic_progression'],
            'characteristics' => 'Reintroduce elements with increased automation and emotional storytelling'
        ]
    ];

    // Sound design philosophy for melodic house/techno
    const MELODIC_HOUSE_SOUND_DESIGN = [
        'pad_layering' => [
            'bright_pad' => 'High frequency content for sparkle',
            'mid_pad' => 'Harmonic foundation in mid frequencies', 
            'low_pad' => 'Deep atmospheric foundation'
        ],
        'automation_techniques' => [
            'filter_cutoff_evolution' => 'Slowly evolving filter cutoffs throughout arrangement',
            'subtle_automation' => 'Minimal but effective parameter changes',
            'reverb_tail_management' => 'Long reverb tails for atmospheric depth'
        ],
        'bassline_approach' => [
            'style' => 'minimal_pulsing',
            'rhythm' => 'Follows chord root notes',
            'characteristics' => 'Deep, evolving soundscapes with hypnotic rhythm'
        ],
        'arpeggio_design' => [
            'complexity' => 'simple_patterns',
            'processing' => 'Extensive delay and reverb',
            'function' => 'Melodic movement with atmospheric processing'
        ],
        'overall_philosophy' => [
            'hypnotic_grooves' => 'Repetitive patterns that entrance the listener',
            'cinematic_progressions' => 'Emotional storytelling through harmonic movement',
            'atmospheric_textures' => 'Deep, evolving soundscapes',
            'minimal_powerful_drums' => 'Four-on-the-floor with subtle percussion variations'
        ]
    ];

    /**
     * Drop Theory - Music theory principles for creating effective drops
     * Based on research about tension and release in electronic music
     */
    
    // Drop building techniques for different energy levels
    const DROP_TECHNIQUES = [
        'tension_builders' => [
            'dominant_hold' => [
                'description' => 'Hold dominant chord instead of resolving to tonic',
                'implementation' => 'Use V chord for 4-8 beats before drop',
                'psychological_effect' => 'Creates strong expectation for tonic resolution'
            ],
            'high_pass_sweep' => [
                'description' => 'Gradually filter out low frequencies before drop',
                'implementation' => 'HPF sweep from 20Hz to 200-400Hz over 8-16 beats',
                'psychological_effect' => 'Creates anticipation through frequency removal'
            ],
            'rhythmic_acceleration' => [
                'description' => 'Increase percussion density leading to drop',
                'implementation' => 'Double hi-hat speed, add snare rolls',
                'psychological_effect' => 'Builds momentum and expectation'
            ],
            'harmonic_suspension' => [
                'description' => 'Use suspended chords to delay resolution',
                'implementation' => 'Sus2/Sus4 chords resolving on drop',
                'psychological_effect' => 'Creates harmonic tension requiring resolution'
            ]
        ],
        
        'drop_resolutions' => [
            'tonic_slam' => [
                'description' => 'Powerful return to tonic chord with full arrangement',
                'implementation' => 'i or I chord with kick, bass, and lead melody',
                'energy_effect' => 'Maximum resolution and release'
            ],
            'relative_major_lift' => [
                'description' => 'Shift from minor buildup to relative major drop',
                'implementation' => 'Am buildup resolving to C major drop',
                'emotional_effect' => 'Creates uplifting, euphoric feeling'
            ],
            'modal_interchange' => [
                'description' => 'Borrow chords from parallel modes for color',
                'implementation' => 'Use bVII, bVI in minor keys for drops',
                'sonic_effect' => 'Adds harmonic richness and depth'
            ],
            'octave_displacement' => [
                'description' => 'Same harmony but different octave for impact',
                'implementation' => 'Drop melody 1-2 octaves lower than buildup',
                'physical_effect' => 'Creates visceral, powerful feeling'
            ]
        ],
        
        'energy_curves' => [
            'exponential_build' => [
                'description' => 'Slow start with accelerating tension buildup',
                'timeline' => '8 bars gentle -> 4 bars medium -> 2 bars intense',
                'genres' => ['progressive_house', 'trance']
            ],
            'linear_build' => [
                'description' => 'Steady, consistent buildup to drop',
                'timeline' => '16 bars of consistent escalation',
                'genres' => ['melodic_techno', 'deep_house']
            ],
            'stepped_build' => [
                'description' => 'Discrete energy levels with plateaus',
                'timeline' => '4 bars low -> 4 bars mid -> 4 bars high -> drop',
                'genres' => ['peak_time_techno', 'big_room']
            ]
        ]
    ];
    
    // Specific chord progressions optimized for drops
    const DROP_PROGRESSIONS = [
        'classic_drop' => [
            'buildup' => [
                ['chord' => 'V', 'function' => 'dominant', 'type' => 'sus4'],
                ['chord' => 'V', 'function' => 'dominant', 'type' => 'dom7']
            ],
            'drop' => [
                ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
                ['chord' => 'VII', 'function' => 'subtonic', 'type' => 'major'],
                ['chord' => 'VI', 'function' => 'submediant', 'type' => 'major'],
                ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
            ]
        ],
        
        'euphoric_drop' => [
            'buildup' => [
                ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
                ['chord' => 'V', 'function' => 'dominant', 'type' => 'sus4']
            ],
            'drop' => [
                ['chord' => 'I', 'function' => 'tonic', 'type' => 'major'],
                ['chord' => 'vi', 'function' => 'submediant', 'type' => 'minor'],
                ['chord' => 'IV', 'function' => 'subdominant', 'type' => 'major'],
                ['chord' => 'V', 'function' => 'dominant', 'type' => 'major']
            ]
        ],
        
        'dark_drop' => [
            'buildup' => [
                ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
                ['chord' => 'bII', 'function' => 'neapolitan', 'type' => 'major']
            ],
            'drop' => [
                ['chord' => 'i', 'function' => 'tonic', 'type' => 'minor'],
                ['chord' => 'bVII', 'function' => 'subtonic', 'type' => 'major'],
                ['chord' => 'bVI', 'function' => 'submediant', 'type' => 'major'],
                ['chord' => 'bII', 'function' => 'neapolitan', 'type' => 'major']
            ]
        ]
    ];
    
    /**
     * Get appropriate drop progression for genre and energy level
     */
    public static function getDropProgression($genre, $energy = 'medium')
    {
        $genreDropMap = [
            'progressive_house' => 'euphoric_drop',
            'melodic_techno' => 'dark_drop',
            'peak_time_techno' => 'classic_drop',
            'deep_house' => 'classic_drop',
            'trance' => 'euphoric_drop',
            'drum_and_bass' => 'euphoric_drop',
            'minimal_dub_techno' => 'dark_drop'
        ];
        
        $energyMap = [
            'low' => 'dark_drop',
            'medium' => 'classic_drop', 
            'high' => 'euphoric_drop'
        ];
        
        // Priority: energy level > genre preference > default
        $progressionName = $energyMap[$energy] ?? $genreDropMap[$genre] ?? 'classic_drop';
        
        return self::DROP_PROGRESSIONS[$progressionName] ?? self::DROP_PROGRESSIONS['classic_drop'];
    }
    
    /**
     * Calculate tension level of a chord in context
     */
    public static function calculateChordTension($chord, $key, $context = 'drop')
    {
        // Simplified tension calculation based on harmonic function
        $tensionLevels = [
            'tonic' => 0.1,      // Very stable
            'subdominant' => 0.3, // Mild tension
            'dominant' => 0.8,    // High tension
            'subtonic' => 0.4,    // Medium tension
            'submediant' => 0.5,  // Moderate tension
            'neapolitan' => 0.9   // Very high tension
        ];
        
        $function = $chord['function'] ?? 'tonic';
        $baseTension = $tensionLevels[$function] ?? 0.5;
        
        // Modify based on chord type
        $typeModifiers = [
            'sus2' => 0.2,    // Adds tension
            'sus4' => 0.3,    // More tension
            'dom7' => 0.2,    // Adds tension
            'dim7' => 0.4,    // High tension
            'no3' => -0.1     // Reduces tension (ambiguous)
        ];
        
        $type = $chord['type'] ?? 'major';
        $modifier = $typeModifiers[$type] ?? 0;
        
        return max(0, min(1, $baseTension + $modifier));
    }
    
    /**
     * Advanced Tension Techniques for Electronic Music Production
     * Based on EDMProd research and professional production analysis
     */
    
    // Macro-tension building techniques
    const TENSION_LAYERS = [
        'layer_1_subtle' => [
            'description' => 'Subtle, evolving background elements',
            'techniques' => [
                'ambient_texture_evolution',
                'gentle_filter_movement',
                'subtle_reverb_growth',
                'background_pad_swells'
            ],
            'duration' => '16-32 bars',
            'intensity' => 0.2
        ],
        'layer_2_obvious' => [
            'description' => 'More obvious, shorter tension elements',
            'techniques' => [
                'percussive_builds',
                'melodic_fragments',
                'riser_sweeps',
                'drum_fills'
            ],
            'duration' => '8-16 bars', 
            'intensity' => 0.5
        ],
        'layer_3_dramatic' => [
            'description' => 'Most dramatic, highest tension elements',
            'techniques' => [
                'white_noise_risers',
                'impact_hits',
                'dramatic_silence',
                'frequency_sweeps'
            ],
            'duration' => '2-8 bars',
            'intensity' => 0.9
        ]
    ];
    
    // Micro-tension techniques for arrangement variation
    const MICRO_TENSION = [
        'rhythmic_interruptions' => [
            'kick_removal' => [
                'description' => 'Remove kick drums strategically for 1-2 beats',
                'effect' => 'Creates rhythmic void that demands resolution',
                'timing' => 'End of phrases, before drops'
            ],
            'ghost_kicks' => [
                'description' => 'Very quiet kick hits that suggest rhythm',
                'effect' => 'Maintains pulse while reducing energy',
                'implementation' => 'Velocity 10-20% of normal kick'
            ],
            'polyrhythmic_layers' => [
                'description' => 'Layer different time signatures',
                'effect' => 'Creates complex rhythmic tension',
                'example' => '4/4 kick with 3/4 melodic element'
            ],
            'drum_fill_breaks' => [
                'description' => 'Short drum fills that break the groove',
                'effect' => 'Interrupts established pattern',
                'duration' => '0.5-2 beats'
            ]
        ],
        
        'harmonic_techniques' => [
            'deceptive_cadence' => [
                'description' => 'V chord resolves to vi instead of I',
                'effect' => 'Subverts harmonic expectation',
                'emotional_impact' => 'Surprise and continued tension'
            ],
            'pedal_tones' => [
                'description' => 'Sustained bass note under changing chords',
                'effect' => 'Creates harmonic dissonance and release',
                'implementation' => 'Hold root note through chord changes'
            ],
            'chromatic_movement' => [
                'description' => 'Stepwise motion outside the key',
                'effect' => 'Adds harmonic color and tension',
                'usage' => 'Transition between chord tones'
            ],
            'tritone_substitution' => [
                'description' => 'Replace V with bII7 (tritone away)',
                'effect' => 'Unexpected but smooth resolution',
                'jazz_influence' => 'Advanced harmonic sophistication'
            ]
        ],
        
        'melodic_tension' => [
            'melodic_fragmentation' => [
                'description' => 'Break up complete melodies into fragments',
                'effect' => 'Creates anticipation for full melody',
                'technique' => 'Play only first 2-3 notes of phrase'
            ],
            'octave_displacement' => [
                'description' => 'Same notes in different octaves',
                'effect' => 'Familiar but unexpected positioning',
                'implementation' => 'Move melody up/down 1-2 octaves'
            ],
            'rhythmic_displacement' => [
                'description' => 'Shift melody timing off the beat',
                'effect' => 'Creates groove tension',
                'timing' => 'Shift 1/8 or 1/16 note early/late'
            ]
        ]
    ];
    
    // Sound design techniques for tension
    const SOUND_DESIGN_TENSION = [
        'frequency_manipulation' => [
            'high_pass_automation' => [
                'start_frequency' => '20Hz',
                'end_frequency' => '200-800Hz',
                'curve' => 'exponential',
                'psychological_effect' => 'Removes low end warmth, creates anticipation'
            ],
            'low_pass_automation' => [
                'start_frequency' => '20kHz',
                'end_frequency' => '500-2kHz',
                'curve' => 'linear',
                'effect' => 'Muffles sound, builds pressure for clarity return'
            ],
            'resonance_sweeps' => [
                'filter_type' => 'bandpass',
                'resonance' => '0.7-0.9',
                'sweep_range' => '100Hz-8kHz',
                'effect' => 'Creates whistling tension that demands resolution'
            ]
        ],
        
        'temporal_effects' => [
            'reverse_reverb' => [
                'description' => 'Reversed reverb tail before impact',
                'timing' => '1-4 beats before drop',
                'effect' => 'Creates anticipation through backwards time flow'
            ],
            'glitch_stutter' => [
                'description' => 'Short rhythmic glitches and cuts',
                'timing' => '1/32 to 1/8 note cuts',
                'effect' => 'Breaks continuity, creates tension'
            ],
            'gate_effects' => [
                'description' => 'Rhythmic gating of sustained elements',
                'pattern' => '1/16 or 1/8 note gates',
                'effect' => 'Creates rhythmic tension in sustained sounds'
            ]
        ]
    ];
    
    /**
     * Get tension techniques for specific arrangement contexts
     */
    public static function getTensionTechniques($context, $intensity = 'medium')
    {
        $contextMap = [
            'buildup' => 'layer_2_obvious',
            'drop_prep' => 'layer_3_dramatic', 
            'breakdown' => 'layer_1_subtle',
            'bridge' => 'layer_2_obvious'
        ];
        
        $layerType = $contextMap[$context] ?? 'layer_2_obvious';
        return self::TENSION_LAYERS[$layerType] ?? self::TENSION_LAYERS['layer_2_obvious'];
    }
    
    /**
     * Get micro-tension techniques for arrangement variation
     */
    public static function getMicroTensionTechniques($category = 'rhythmic')
    {
        $categories = [
            'rhythmic' => 'rhythmic_interruptions',
            'harmonic' => 'harmonic_techniques',
            'melodic' => 'melodic_tension'
        ];
        
        $categoryKey = $categories[$category] ?? 'rhythmic_interruptions';
        return self::MICRO_TENSION[$categoryKey] ?? [];
    }
    
    /**
     * Calculate optimal tension curve for track sections
     */
    public static function calculateTensionCurve($sectionType, $duration, $energy = 'medium')
    {
        $curves = [
            'intro' => [
                'start' => 0.1,
                'peak' => 0.3,
                'end' => 0.4,
                'curve_type' => 'linear'
            ],
            'verse' => [
                'start' => 0.4,
                'peak' => 0.6,
                'end' => 0.5,
                'curve_type' => 'gentle_wave'
            ],
            'buildup' => [
                'start' => 0.5,
                'peak' => 0.95,
                'end' => 0.95,
                'curve_type' => 'exponential'
            ],
            'drop' => [
                'start' => 0.1, // Release after buildup
                'peak' => 0.8,
                'end' => 0.7,
                'curve_type' => 'impact_sustain'
            ],
            'breakdown' => [
                'start' => 0.7,
                'peak' => 0.3,
                'end' => 0.2,
                'curve_type' => 'decay'
            ],
            'outro' => [
                'start' => 0.3,
                'peak' => 0.2,
                'end' => 0.0,
                'curve_type' => 'linear_decay'
            ]
        ];
        
        $baseCurve = $curves[$sectionType] ?? $curves['verse'];
        
        // Adjust for energy level
        $energyMultipliers = [
            'low' => 0.7,
            'medium' => 1.0,
            'high' => 1.3
        ];
        
        $multiplier = $energyMultipliers[$energy] ?? 1.0;
        
        return [
            'start' => min(1.0, $baseCurve['start'] * $multiplier),
            'peak' => min(1.0, $baseCurve['peak'] * $multiplier),
            'end' => min(1.0, $baseCurve['end'] * $multiplier),
            'curve_type' => $baseCurve['curve_type']
        ];
    }
    
    /**
     * Electronic Music Specific Theory - Bass Patterns and Loop Structures
     * Based on modern EDM production techniques and hit track analysis
     */
    
    // Bass line construction patterns for electronic music
    const BASS_PATTERNS = [
        'root_emphasis' => [
            'description' => 'Emphasize root notes of chord progression',
            'pattern' => [1, 0, 0, 0], // Strong on beat 1
            'scale_degrees' => [1], // Root only
            'velocity_curve' => [100, 60, 60, 60],
            'genres' => ['house', 'techno', 'trance']
        ],
        'root_fifth_pattern' => [
            'description' => 'Alternate between root and fifth',
            'pattern' => [1, 0, 1, 0], // Root on 1, fifth on 3
            'scale_degrees' => [1, 5],
            'velocity_curve' => [100, 0, 80, 0],
            'genres' => ['progressive_house', 'melodic_techno']
        ],
        'walking_bass' => [
            'description' => 'Chromatic movement between chord tones',
            'pattern' => [1, 1, 1, 1], // Every beat
            'scale_degrees' => [1, 2, 3, 5], // Walk through chord tones
            'velocity_curve' => [100, 70, 80, 90],
            'genres' => ['future_bass', 'liquid_dnb']
        ],
        'syncopated_bass' => [
            'description' => 'Off-beat emphasis for groove',
            'pattern' => [1, 0, 0, 1], // On 1 and 4
            'scale_degrees' => [1, 3], // Root and third
            'velocity_curve' => [100, 0, 0, 85],
            'genres' => ['uk_garage', 'future_funk']
        ],
        'rolling_bass' => [
            'description' => 'Continuous 16th note rolling pattern',
            'pattern' => [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 16th notes
            'scale_degrees' => [1, 1, 5, 1, 1, 1, 3, 1, 1, 1, 5, 1, 1, 1, 7, 1],
            'velocity_curve' => 'sine_wave', // Dynamic velocity curve
            'genres' => ['rolling_dnb', 'liquid_dnb']
        ]
    ];
    
    // Loop structures optimized for electronic music
    const LOOP_STRUCTURES = [
        '8_beat_loop' => [
            'description' => 'Standard 2-bar loop for most EDM genres',
            'length_beats' => 8,
            'chord_changes' => [0, 4], // Change chord every 4 beats
            'typical_use' => 'verse, chorus sections',
            'genres' => ['house', 'techno', 'trance']
        ],
        '16_beat_loop' => [
            'description' => 'Extended 4-bar loop for complex progressions',
            'length_beats' => 16,
            'chord_changes' => [0, 4, 8, 12], // Change every bar
            'typical_use' => 'main sections, drops',
            'genres' => ['progressive_house', 'melodic_techno']
        ],
        '32_beat_loop' => [
            'description' => 'Long-form 8-bar loop for progressive builds',
            'length_beats' => 32,
            'chord_changes' => [0, 8, 16, 24], // Change every 2 bars
            'typical_use' => 'breakdowns, long builds',
            'genres' => ['progressive_trance', 'ambient_house']
        ]
    ];
    
    // Electronic music emotional mapping
    const EMOTIONAL_CHORD_MAPPING = [
        'uplifting' => [
            'chord_types' => ['major', 'major7', 'add9'],
            'progressions' => ['classic_pop_edm', 'vi_IV_V_I_variant'],
            'scale_preference' => 'major',
            'emotional_effect' => 'Joy, euphoria, celebration'
        ],
        'melancholic' => [
            'chord_types' => ['minor', 'minor7', 'minor_add9'],
            'progressions' => ['how_deep_progression', 'levels_progression'],
            'scale_preference' => 'aeolian',
            'emotional_effect' => 'Nostalgia, introspection, beauty'
        ],
        'tensive' => [
            'chord_types' => ['sus4', 'sus2', 'dim7', 'dom7'],
            'progressions' => ['sus4_sus2_minor_sus4'],
            'scale_preference' => 'phrygian',
            'emotional_effect' => 'Anticipation, unrest, drama'
        ],
        'nostalgic' => [
            'chord_types' => ['major7', 'minor7', 'add9'],
            'progressions' => ['rufus_emotional_open', 'innerbloom_original'],
            'scale_preference' => 'dorian',
            'emotional_effect' => 'Memory, warmth, longing'
        ]
    ];
    
    // Genre-specific rhythm patterns
    const RHYTHM_PATTERNS = [
        'four_on_floor' => [
            'description' => 'Kick on every beat - house music foundation',
            'pattern' => [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            'genres' => ['house', 'techno', 'trance'],
            'energy_level' => 'driving'
        ],
        'broken_beat' => [
            'description' => 'Syncopated kick pattern',
            'pattern' => [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            'genres' => ['uk_garage', 'future_garage', '2-step'],
            'energy_level' => 'groovy'
        ],
        'halftime' => [
            'description' => 'Kick and snare on alternating beats',
            'pattern' => [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
            'genres' => ['trap', 'future_bass', 'halftime_dnb'],
            'energy_level' => 'heavy'
        ]
    ];
    
    /**
     * Get optimal bass pattern for genre and energy
     */
    public static function getBassPattern($genre, $energy = 'medium')
    {
        $genreBassMap = [
            'progressive_house' => 'root_fifth_pattern',
            'melodic_techno' => 'root_emphasis',
            'peak_time_techno' => 'root_emphasis',
            'future_bass' => 'walking_bass',
            'liquid_dnb' => 'rolling_bass',
            'deep_house' => 'root_fifth_pattern',
            'trance' => 'root_emphasis',
            'drum_and_bass' => 'rolling_bass',
            'minimal_dub_techno' => 'root_emphasis'
        ];
        
        $energyBassMap = [
            'low' => 'root_emphasis',
            'medium' => 'root_fifth_pattern',
            'high' => 'syncopated_bass'
        ];
        
        $patternName = $genreBassMap[$genre] ?? $energyBassMap[$energy] ?? 'root_emphasis';
        return self::BASS_PATTERNS[$patternName] ?? self::BASS_PATTERNS['root_emphasis'];
    }
    
    /**
     * Get emotional chord progression based on desired mood
     */
    public static function getEmotionalProgression($emotion, $key)
    {
        $emotionMap = self::EMOTIONAL_CHORD_MAPPING[$emotion] ?? self::EMOTIONAL_CHORD_MAPPING['melancholic'];
        $progressions = $emotionMap['progressions'];
        
        // Return random progression from emotion category
        $progressionName = $progressions[array_rand($progressions)];
        return self::PROGRESSIONS[$progressionName] ?? self::PROGRESSIONS['how_deep_progression'];
    }
    
    /**
     * Generate bass line that follows chord progression
     */
    public static function generateBassLine($chordProgression, $pattern, $key, $bars = 4)
    {
        $bassNotes = [];
        $isMinor = strpos($key, 'm') !== false;
        $root = str_replace('m', '', $key);
        $rootMidi = self::NOTE_TO_MIDI[$root] + 24; // Bass octave (C2)
        
        $beatsPerChord = ($bars * 4) / count($chordProgression);
        
        foreach ($chordProgression as $chordIndex => $chordInfo) {
            $chordStart = $chordIndex * $beatsPerChord;
            $chordRoot = self::getDegreeNote($root, $chordInfo['chord'], $isMinor);
            $chordRootMidi = self::NOTE_TO_MIDI[$chordRoot] + 24;
            
            // Apply bass pattern within this chord
            foreach ($pattern['scale_degrees'] as $patternIndex => $degree) {
                if ($patternIndex < count($pattern['pattern']) && $pattern['pattern'][$patternIndex]) {
                    $beatOffset = $patternIndex * (4 / count($pattern['pattern']));
                    
                    // Calculate bass note based on scale degree
                    $bassNote = $chordRootMidi;
                    switch ($degree) {
                        case 3: $bassNote += 3; break; // Third
                        case 5: $bassNote += 7; break; // Fifth
                        case 7: $bassNote += 10; break; // Seventh
                        default: $bassNote += 0; break; // Root
                    }
                    
                    $bassNotes[] = [
                        'start' => $chordStart + $beatOffset,
                        'note' => $bassNote,
                        'velocity' => $pattern['velocity_curve'][$patternIndex] ?? 80,
                        'duration' => 0.25
                    ];
                }
            }
        }
        
        return $bassNotes;
    }
    
    /**
     * Get optimal loop structure for genre and section
     */
    public static function getLoopStructure($genre, $section = 'verse')
    {
        $genreLoopMap = [
            'progressive_house' => '16_beat_loop',
            'melodic_techno' => '16_beat_loop',
            'peak_time_techno' => '8_beat_loop',
            'trance' => '16_beat_loop',
            'future_bass' => '16_beat_loop',
            'deep_house' => '16_beat_loop',
            'drum_and_bass' => '8_beat_loop',
            'minimal_dub_techno' => '32_beat_loop'
        ];
        
        $sectionLoopMap = [
            'intro' => '8_beat_loop',
            'verse' => '8_beat_loop',
            'buildup' => '16_beat_loop',
            'drop' => '8_beat_loop',
            'breakdown' => '32_beat_loop',
            'outro' => '16_beat_loop'
        ];
        
        // Priority: section requirement > genre preference > default
        $loopType = $sectionLoopMap[$section] ?? $genreLoopMap[$genre] ?? '8_beat_loop';
        return self::LOOP_STRUCTURES[$loopType] ?? self::LOOP_STRUCTURES['8_beat_loop'];
    }
    
    /**
     * Musical Phrasing Patterns - Essential for creating balanced, musical arrangements
     * Based on classical music theory and modern electronic music production techniques
     */
    
    // Core phrasing structures for electronic music
    const PHRASE_STRUCTURES = [
        'call_response' => [
            'description' => 'Musical question followed by musical answer',
            'pattern' => [
                'call' => ['duration' => 4, 'energy' => 'rising', 'ending' => 'open'],
                'response' => ['duration' => 4, 'energy' => 'falling', 'ending' => 'closed']
            ],
            'usage' => 'Creates conversational feel between instruments',
            'genres' => ['progressive_house', 'melodic_techno', 'deep_house']
        ],
        'antecedent_consequent' => [
            'description' => 'Classical period structure - question and answer',
            'pattern' => [
                'antecedent' => ['duration' => 8, 'harmonic_goal' => 'dominant', 'melody_direction' => 'up'],
                'consequent' => ['duration' => 8, 'harmonic_goal' => 'tonic', 'melody_direction' => 'down']
            ],
            'usage' => 'Creates strong sense of completion and satisfaction',
            'genres' => ['progressive_house', 'trance', 'ambient_house']
        ],
        'statement_development' => [
            'description' => 'Present idea then develop/vary it',
            'pattern' => [
                'statement' => ['duration' => 4, 'complexity' => 'simple', 'register' => 'mid'],
                'development' => ['duration' => 4, 'complexity' => 'complex', 'register' => 'varied']
            ],
            'usage' => 'Creates sense of musical growth and evolution',
            'genres' => ['melodic_techno', 'organic_house', 'progressive_house']
        ],
        'tension_release' => [
            'description' => 'Build tension then release dramatically',
            'pattern' => [
                'tension' => ['duration' => 6, 'harmonic_tension' => 'increase', 'rhythmic_density' => 'increase'],
                'release' => ['duration' => 2, 'harmonic_tension' => 'resolve', 'rhythmic_density' => 'simplify']
            ],
            'usage' => 'Creates emotional peaks and valleys',
            'genres' => ['peak_time_techno', 'progressive_house']
        ],
        'breathing_phrases' => [
            'description' => 'Natural breathing with rests between phrases',
            'pattern' => [
                'phrase_1' => ['duration' => 3, 'energy' => 'active'],
                'breath' => ['duration' => 1, 'energy' => 'rest'],
                'phrase_2' => ['duration' => 3, 'energy' => 'active'],
                'breath' => ['duration' => 1, 'energy' => 'rest']
            ],
            'usage' => 'Prevents overwhelming density, adds musicality',
            'genres' => ['deep_house', 'organic_house', 'downtempo']
        ]
    ];
    
    // Riff patterns for repetitive but interesting musical content
    const RIFF_PATTERNS = [
        'techno_riff' => [
            'description' => 'Short repetitive melodic/rhythmic pattern',
            'length_bars' => 1,
            'repetitions' => 4,
            'variations' => [
                'original' => ['bars' => 1],
                'transposed' => ['bars' => 1, 'transpose' => 2],
                'rhythmic_shift' => ['bars' => 1, 'rhythm_offset' => 0.125],
                'octave_jump' => ['bars' => 1, 'octave_shift' => 12]
            ],
            'development_rules' => [
                'every_4_bars' => 'add_variation',
                'every_8_bars' => 'transpose_or_invert',
                'every_16_bars' => 'new_riff'
            ]
        ],
        'hypnotic_loop' => [
            'description' => 'Hypnotic 2-4 note pattern with subtle variations',
            'length_bars' => 0.5,
            'repetitions' => 8,
            'note_count' => [2, 3, 4],
            'interval_preferences' => [1, 2, 5, 7], // Seconds, thirds, fifths, sevenths
            'variation_probability' => 0.15, // 15% chance per repetition
            'variations' => [
                'note_addition' => 'add_passing_tone',
                'octave_displacement' => 'move_note_octave',
                'rhythmic_tie' => 'extend_duration',
                'ghost_note' => 'add_quiet_note'
            ]
        ],
        'acid_line' => [
            'description' => 'TB-303 style acid bassline riff',
            'length_bars' => 2,
            'note_density' => 'high',
            'characteristics' => [
                'slides' => 0.3, // 30% of notes have slides
                'accents' => 0.2, // 20% of notes accented
                'staccato' => 0.4, // 40% short notes
                'legato' => 0.1 // 10% connected notes
            ],
            'pitch_range' => [36, 60], // Bass range
            'pattern_evolution' => 'gradual_complexity_increase'
        ],
        'arpeggiated_riff' => [
            'description' => 'Arpeggiated chord pattern riff',
            'chord_pattern' => ['root', 'third', 'fifth', 'octave'],
            'rhythm_variations' => [
                'straight_8ths' => [1, 1, 1, 1, 1, 1, 1, 1],
                'dotted_8ths' => [1, 0, 1, 1, 0, 1, 1, 0],
                'triplet_feel' => [1, 0, 1, 1, 0, 1, 0, 1],
                'syncopated' => [1, 0, 1, 0, 1, 1, 0, 1]
            ],
            'octave_jumping' => true,
            'velocity_curve' => 'accent_on_chord_tones'
        ]
    ];
    
    // Silence and rest patterns for musical breathing
    const BREATHING_PATTERNS = [
        'natural_breath' => [
            'description' => 'Natural breathing between musical phrases',
            'rest_duration' => [0.5, 1.0, 1.5], // Beat lengths
            'placement' => 'phrase_endings',
            'frequency' => 'every_4_bars',
            'probability' => 0.7 // 70% chance to apply
        ],
        'dramatic_pause' => [
            'description' => 'Longer pause for dramatic effect',
            'rest_duration' => [2.0, 3.0, 4.0],
            'placement' => 'section_transitions',
            'frequency' => 'every_16_bars',
            'probability' => 0.4 // 40% chance to apply
        ],
        'micro_breath' => [
            'description' => 'Very short breaths for rhythm',
            'rest_duration' => [0.125, 0.25],
            'placement' => 'between_notes',
            'frequency' => 'random',
            'probability' => 0.3 // 30% chance to apply
        ],
        'breakdown_space' => [
            'description' => 'Extended space in breakdown sections',
            'rest_duration' => [4.0, 6.0, 8.0],
            'placement' => 'breakdown_sections',
            'frequency' => 'section_specific',
            'probability' => 0.8 // 80% chance in breakdowns
        ]
    ];
    
    // Balance rules for arrangement layers
    const ARRANGEMENT_BALANCE = [
        'frequency_allocation' => [
            'sub_bass' => ['range' => [20, 80], 'max_elements' => 1],
            'bass' => ['range' => [80, 250], 'max_elements' => 2],
            'low_mid' => ['range' => [250, 500], 'max_elements' => 3],
            'mid' => ['range' => [500, 2000], 'max_elements' => 4],
            'upper_mid' => ['range' => [2000, 5000], 'max_elements' => 3],
            'presence' => ['range' => [5000, 10000], 'max_elements' => 2],
            'brilliance' => ['range' => [10000, 20000], 'max_elements' => 1]
        ],
        'rhythmic_balance' => [
            'kick' => ['timing' => 'on_beat', 'density' => 'every_beat', 'priority' => 1],
            'snare' => ['timing' => 'beat_2_4', 'density' => 'every_2_beats', 'priority' => 2],
            'hihat' => ['timing' => 'off_beat', 'density' => 'every_half_beat', 'priority' => 3],
            'bass' => ['timing' => 'with_kick', 'density' => 'varies', 'priority' => 1],
            'melody' => ['timing' => 'counter_rhythm', 'density' => 'sparse', 'priority' => 4]
        ],
        'harmonic_balance' => [
            'bass_notes' => ['function' => 'foundation', 'movement' => 'minimal'],
            'chord_changes' => ['frequency' => 'every_2_4_bars', 'voice_leading' => 'smooth'],
            'melody_notes' => ['function' => 'decoration', 'movement' => 'active'],
            'tension_notes' => ['usage' => 'sparingly', 'resolution' => 'required']
        ],
        'dynamic_balance' => [
            'loud_elements' => ['kick', 'snare', 'lead'],
            'medium_elements' => ['bass', 'chord_stabs', 'arp'],
            'quiet_elements' => ['pad', 'strings', 'ambient'],
            'balance_rule' => 'one_loud_element_per_frequency_range'
        ]
    ];
    
    /**
     * Generate musical phrase with proper structure and breathing
     */
    public static function generateMusicalPhrase($type, $length_bars = 8, $genre = 'progressive_house')
    {
        $phraseStructure = self::PHRASE_STRUCTURES[$type] ?? self::PHRASE_STRUCTURES['call_response'];
        $phrase = [];
        
        switch ($type) {
            case 'call_response':
                $phrase = [
                    'call' => [
                        'bars' => $length_bars / 2,
                        'melody_contour' => 'ascending',
                        'harmonic_goal' => 'dominant',
                        'ending' => 'question',
                        'energy' => 'building'
                    ],
                    'response' => [
                        'bars' => $length_bars / 2,
                        'melody_contour' => 'descending',
                        'harmonic_goal' => 'tonic',
                        'ending' => 'answer',
                        'energy' => 'resolving'
                    ]
                ];
                break;
                
            case 'antecedent_consequent':
                $phrase = [
                    'antecedent' => [
                        'bars' => $length_bars / 2,
                        'harmonic_progression' => 'I-V',
                        'ending' => 'half_cadence',
                        'tension' => 'increase'
                    ],
                    'consequent' => [
                        'bars' => $length_bars / 2,
                        'harmonic_progression' => 'I-V-I',
                        'ending' => 'authentic_cadence',
                        'tension' => 'resolve'
                    ]
                ];
                break;
                
            case 'breathing_phrases':
                $active_bars = $length_bars * 0.75;
                $rest_bars = $length_bars * 0.25;
                $phrase = [
                    'phrase_1' => ['bars' => $active_bars / 2, 'type' => 'active'],
                    'breath_1' => ['bars' => $rest_bars / 2, 'type' => 'rest'],
                    'phrase_2' => ['bars' => $active_bars / 2, 'type' => 'active'],
                    'breath_2' => ['bars' => $rest_bars / 2, 'type' => 'rest']
                ];
                break;
        }
        
        return $phrase;
    }
    
    /**
     * Generate riff with proper motif development
     */
    public static function generateRiff($riff_type, $key, $genre, $complexity = 3)
    {
        $riffTemplate = self::RIFF_PATTERNS[$riff_type] ?? self::RIFF_PATTERNS['techno_riff'];
        $isMinor = strpos($key, 'm') !== false;
        $root = str_replace('m', '', $key);
        $scale = self::getScaleForGenre($root, $key, $genre);
        
        $riff = [
            'original' => self::createRiffMotif($scale, $riffTemplate, $complexity),
            'variations' => []
        ];
        
        // Generate variations based on riff template
        foreach ($riffTemplate['variations'] as $variationType => $variationData) {
            $riff['variations'][$variationType] = self::applyRiffVariation(
                $riff['original'], 
                $variationType, 
                $variationData, 
                $scale
            );
        }
        
        return $riff;
    }
    
    /**
     * Create the core motif for a riff
     */
    private static function createRiffMotif($scale, $riffTemplate, $complexity)
    {
        $motif = [];
        $length = $riffTemplate['length_bars'] * 16; // Convert bars to 16th notes
        
        // Generate notes based on riff type
        if ($riffTemplate === self::RIFF_PATTERNS['hypnotic_loop']) {
            $noteCount = $riffTemplate['note_count'][array_rand($riffTemplate['note_count'])];
            $intervals = array_slice($riffTemplate['interval_preferences'], 0, $noteCount);
            
            for ($i = 0; $i < $length; $i++) {
                $intervalIndex = $i % count($intervals);
                $scaleIndex = $intervals[$intervalIndex] % count($scale);
                
                $motif[] = [
                    'note' => $scale[$scaleIndex],
                    'step' => $i,
                    'active' => true,
                    'velocity' => 80 + rand(-10, 10),
                    'duration' => 0.25
                ];
            }
        } else {
            // Default riff generation
            for ($i = 0; $i < $length; $i++) {
                $active = ($i % 4 === 0) || ($complexity > 2 && $i % 2 === 0);
                
                if ($active) {
                    $scaleIndex = ($i % 4 === 0) ? 0 : (($complexity > 2 && $i % 2 === 0) ? ($i % count($scale)) : 0);
                    $motif[] = [
                        'note' => $scale[$scaleIndex],
                        'step' => $i,
                        'active' => true,
                        'velocity' => 75 + rand(-5, 15),
                        'duration' => rand(1, 3) * 0.125
                    ];
                }
            }
        }
        
        return $motif;
    }
    
    /**
     * Apply variation to a riff motif
     */
    private static function applyRiffVariation($originalMotif, $variationType, $variationData, $scale)
    {
        $variation = $originalMotif;
        
        switch ($variationType) {
            case 'transposed':
                $transpose = $variationData['transpose'] ?? 2;
                foreach ($variation as &$note) {
                    $newNote = $note['note'] + $transpose;
                    $note['note'] = max(0, min(127, $newNote));
                }
                break;
                
            case 'rhythmic_shift':
                $offset = $variationData['rhythm_offset'] ?? 0.125;
                foreach ($variation as &$note) {
                    $note['step'] = ($note['step'] + $offset) % 16;
                }
                break;
                
            case 'octave_jump':
                $octaveShift = $variationData['octave_shift'] ?? 12;
                $jumpProbability = 0.3;
                foreach ($variation as &$note) {
                    if (rand(0, 100) < $jumpProbability * 100) {
                        $note['note'] += $octaveShift;
                    }
                }
                break;
                
            case 'inversion':
                $centerIndex = intval(count($scale) / 2);
                $centerNote = $scale[$centerIndex];
                foreach ($variation as &$note) {
                    $distance = $note['note'] - $centerNote;
                    $note['note'] = $centerNote - $distance;
                    $note['note'] = max(0, min(127, $note['note']));
                }
                break;
        }
        
        return $variation;
    }
    
    /**
     * Add breathing spaces to a melody line
     */
    public static function addBreathingSpaces($notes, $breathingType = 'natural_breath', $genre = 'progressive_house')
    {
        $breathingPattern = self::BREATHING_PATTERNS[$breathingType] ?? self::BREATHING_PATTERNS['natural_breath'];
        $processedNotes = [];
        $currentBar = 0;
        
        foreach ($notes as $note) {
            $noteBar = intval($note['start'] / 4); // Assuming 4 beats per bar
            
            // Check if we should add breathing space
            if ($noteBar > $currentBar) {
                $shouldAddBreath = rand(0, 100) < ($breathingPattern['probability'] * 100);
                
                if ($shouldAddBreath && $breathingType === 'natural_breath') {
                    $breathDuration = $breathingPattern['rest_duration'][array_rand($breathingPattern['rest_duration'])];
                    
                    // Add rest by shifting subsequent notes
                    $lastNote = end($processedNotes);
                    if ($lastNote) {
                        $restStart = $lastNote['start'] + $lastNote['duration'];
                        
                        // Shift this note and all subsequent notes
                        $note['start'] = $restStart + $breathDuration;
                    }
                }
                
                $currentBar = $noteBar;
            }
            
            $processedNotes[] = $note;
        }
        
        return $processedNotes;
    }
    
    /**
     * Create balanced arrangement following frequency and dynamic rules
     */
    public static function balanceArrangement($layers, $section = 'verse', $energy = 0.5)
    {
        $balanceRules = self::ARRANGEMENT_BALANCE;
        $balancedLayers = [];
        
        // Group layers by frequency range
        $frequencyGroups = [];
        foreach ($layers as $layerName => $layerData) {
            $frequency = self::estimateLayerFrequency($layerName, $layerData);
            $frequencyGroup = self::getFrequencyGroup($frequency);
            
            if (!isset($frequencyGroups[$frequencyGroup])) {
                $frequencyGroups[$frequencyGroup] = [];
            }
            $frequencyGroups[$frequencyGroup][] = $layerName;
        }
        
        // Apply balance rules
        foreach ($frequencyGroups as $group => $layerNames) {
            $maxElements = $balanceRules['frequency_allocation'][$group]['max_elements'] ?? 2;
            
            // If too many elements in this frequency range, reduce some
            if (count($layerNames) > $maxElements) {
                $keepLayers = array_slice($layerNames, 0, $maxElements);
                $reduceLayers = array_slice($layerNames, $maxElements);
                
                foreach ($reduceLayers as $layerName) {
                    $layers[$layerName] = self::reduceLayerPresence($layers[$layerName], 0.3);
                }
            }
        }
        
        // Apply dynamic balance
        $layers = self::applyDynamicBalance($layers, $section, $energy);
        
        return $layers;
    }
    
    /**
     * Helper methods for arrangement balance
     */
    private static function estimateLayerFrequency($layerName, $layerData)
    {
        $frequencyMap = [
            'kick' => 60,
            'sub_bass' => 50,
            'bass' => 120,
            'snare' => 200,
            'hihat' => 8000,
            'pad' => 800,
            'arp' => 1500,
            'lead' => 3000,
            'strings' => 1000,
            'chord_stabs' => 500
        ];
        
        return $frequencyMap[$layerName] ?? 1000;
    }
    
    private static function getFrequencyGroup($frequency)
    {
        if ($frequency < 80) return 'sub_bass';
        if ($frequency < 250) return 'bass';
        if ($frequency < 500) return 'low_mid';
        if ($frequency < 2000) return 'mid';
        if ($frequency < 5000) return 'upper_mid';
        if ($frequency < 10000) return 'presence';
        return 'brilliance';
    }
    
    private static function reduceLayerPresence($layer, $reductionFactor)
    {
        if (isset($layer['notes'])) {
            foreach ($layer['notes'] as &$note) {
                $note['velocity'] = intval($note['velocity'] * $reductionFactor);
                
                // Randomly remove some notes
                if (rand(0, 100) < 30) {
                    $note = null;
                }
            }
            
            // Remove null notes
            $layer['notes'] = array_filter($layer['notes']);
        }
        
        return $layer;
    }
    
    private static function applyDynamicBalance($layers, $section, $energy)
    {
        $balanceRules = self::ARRANGEMENT_BALANCE['dynamic_balance'];
        
        foreach ($layers as $layerName => &$layer) {
            if (in_array($layerName, $balanceRules['loud_elements'])) {
                $targetVelocity = 90 + ($energy * 30);
            } elseif (in_array($layerName, $balanceRules['medium_elements'])) {
                $targetVelocity = 70 + ($energy * 20);
            } else {
                $targetVelocity = 50 + ($energy * 15);
            }
            
            // Apply velocity scaling
            if (isset($layer['notes'])) {
                foreach ($layer['notes'] as &$note) {
                    $note['velocity'] = min(127, max(10, intval($targetVelocity + rand(-10, 10))));
                }
            }
        }
        
        return $layers;
    }
    
    /**
     * Helper method for scale index selection
     */
    private static function getScaleIndexForStep($step, $complexity, $scaleLength)
    {
        if ($complexity <= 2) {
            // Simple patterns - emphasize chord tones
            $chordTonePattern = [0, 2, 4, 2]; // I, III, V, III
            return $chordTonePattern[$step % count($chordTonePattern)] % $scaleLength;
        } else {
            // More complex patterns with passing tones
            $complexPattern = [0, 1, 2, 4, 2, 1, 0, 3];
            return $complexPattern[$step % count($complexPattern)] % $scaleLength;
        }
    }
    
    /**
     * Phrase Structure Rules for Electronic Music
     * Ensures arrangements follow standard musical phrase lengths and structures
     */
    const PHRASE_LENGTHS = [
        '4_bar_phrase' => [
            'beats' => 16,
            'usage' => 'Basic building block for electronic music',
            'characteristics' => [
                'repetition_friendly' => true,
                'loop_compatible' => true,
                'dj_friendly' => true
            ],
            'genres' => ['house', 'techno', 'trance']
        ],
        '8_bar_phrase' => [
            'beats' => 32,
            'usage' => 'Standard phrase length for most electronic genres',
            'characteristics' => [
                'allows_development' => true,
                'question_answer_structure' => true,
                'tension_release_cycle' => true
            ],
            'genres' => ['progressive_house', 'melodic_techno', 'deep_house']
        ],
        '16_bar_phrase' => [
            'beats' => 64,
            'usage' => 'Extended phrase for complex harmonic progressions',
            'characteristics' => [
                'full_chord_progression' => true,
                'narrative_structure' => true,
                'emotional_arc' => true
            ],
            'genres' => ['progressive_trance', 'epic_house', 'cinematic_techno']
        ],
        '32_bar_phrase' => [
            'beats' => 128,
            'usage' => 'Long-form phrase for breakdowns and builds',
            'characteristics' => [
                'epic_development' => true,
                'multiple_emotional_peaks' => true,
                'journey_structure' => true
            ],
            'genres' => ['progressive_trance', 'ambient_house']
        ]
    ];
    
    /**
     * Get appropriate phrase length for genre and section
     */
    public static function getPhraseLengthForContext($genre, $section, $complexity = 3)
    {
        $genrePhraseLengths = [
            'progressive_house' => ['8_bar_phrase', '16_bar_phrase'],
            'melodic_techno' => ['8_bar_phrase', '16_bar_phrase'],
            'peak_time_techno' => ['4_bar_phrase', '8_bar_phrase'],
            'deep_house' => ['8_bar_phrase', '16_bar_phrase'],
            'organic_house' => ['8_bar_phrase', '16_bar_phrase'],
            'trance' => ['16_bar_phrase', '32_bar_phrase'],
            'drum_and_bass' => ['4_bar_phrase', '8_bar_phrase'],
            'minimal_dub_techno' => ['8_bar_phrase', '16_bar_phrase']
        ];
        
        $sectionPhraseLengths = [
            'intro' => ['4_bar_phrase', '8_bar_phrase'],
            'buildup' => ['8_bar_phrase', '16_bar_phrase'],
            'drop' => ['8_bar_phrase', '16_bar_phrase'],
            'breakdown' => ['16_bar_phrase', '32_bar_phrase'],
            'outro' => ['8_bar_phrase', '16_bar_phrase']
        ];
        
        // Choose based on section first, then genre
        $sectionOptions = $sectionPhraseLengths[$section] ?? ['8_bar_phrase'];
        $genreOptions = $genrePhraseLengths[$genre] ?? ['8_bar_phrase'];
        
        // Find intersection or use section preference
        $intersection = array_intersect($sectionOptions, $genreOptions);
        $options = !empty($intersection) ? $intersection : $sectionOptions;
        
        // Complexity influences choice
        if ($complexity > 3 && in_array('16_bar_phrase', $options)) {
            return '16_bar_phrase';
        } elseif ($complexity < 3 && in_array('4_bar_phrase', $options)) {
            return '4_bar_phrase';
        }
        
        return $options[array_rand($options)];
    }
    
    /**
     * Structure melody according to phrase rules
     */
    public static function structureMelodyInPhrases($notes, $phraseLength, $genre)
    {
        $phraseData = self::PHRASE_LENGTHS[$phraseLength] ?? self::PHRASE_LENGTHS['8_bar_phrase'];
        $phraseBeatLength = $phraseData['beats'];
        $structuredNotes = [];
        
        // Group notes by phrases
        $phrases = [];
        foreach ($notes as $note) {
            $phraseIndex = intval($note['start'] / $phraseBeatLength);
            if (!isset($phrases[$phraseIndex])) {
                $phrases[$phraseIndex] = [];
            }
            $phrases[$phraseIndex][] = $note;
        }
        
        // Process each phrase according to structure rules
        foreach ($phrases as $phraseIndex => $phraseNotes) {
            $processedPhrase = self::applyPhraseStructureRules($phraseNotes, $phraseData, $phraseIndex, $genre);
            $structuredNotes = array_merge($structuredNotes, $processedPhrase);
        }
        
        return $structuredNotes;
    }
    
    /**
     * Apply phrase structure rules to a single phrase
     */
    private static function applyPhraseStructureRules($phraseNotes, $phraseData, $phraseIndex, $genre)
    {
        $processedNotes = [];
        $phraseBeatLength = $phraseData['beats'];
        
        // Apply phrase-ending rules
        foreach ($phraseNotes as $note) {
            $beatInPhrase = $note['start'] % $phraseBeatLength;
            
            // Phrase ending resolution (last 2 beats of phrase)
            if ($beatInPhrase >= $phraseBeatLength - 2) {
                // Reduce velocity and add resolution tendency
                $note['velocity'] = max(40, $note['velocity'] * 0.8);
                
                // If it's an odd phrase (question), end with tension
                // If it's an even phrase (answer), end with resolution
                if ($phraseIndex % 2 === 0) {
                    // Even phrase - add resolution tendency (move toward tonic)
                    $note['note'] = self::tendTowardTonic($note['note'], $genre);
                } else {
                    // Odd phrase - maintain tension (avoid too strong resolution)
                    $note['note'] = self::maintainTension($note['note'], $genre);
                }
            }
            
            // Phrase beginning emphasis (first beat)
            if ($beatInPhrase < 1) {
                $note['velocity'] = min(127, $note['velocity'] * 1.1);
            }
            
            $processedNotes[] = $note;
        }
        
        return $processedNotes;
    }
    
    /**
     * Move note toward tonic for resolution
     */
    private static function tendTowardTonic($note, $genre)
    {
        // Simple approach - move chromatically toward C (assuming C-based keys)
        $tonic = 60; // C4
        $noteClass = $note % 12;
        $tonicClass = $tonic % 12;
        
        if ($noteClass > $tonicClass) {
            return $note - 1; // Move down toward tonic
        } elseif ($noteClass < $tonicClass) {
            return $note + 1; // Move up toward tonic
        }
        
        return $note; // Already on tonic
    }
    
    /**
     * Maintain tension by avoiding strong resolution
     */
    private static function maintainTension($note, $genre)
    {
        // Add slight tension by moving away from tonic
        $tonic = 60; // C4
        $noteClass = $note % 12;
        $tonicClass = $tonic % 12;
        
        if ($noteClass === $tonicClass) {
            // If on tonic, add tension by moving to nearby non-tonic note
            return $note + (rand(0, 1) ? 1 : 2); // Move to half-step or whole-step above
        }
        
        return $note; // Keep as is if not on tonic
    }
    
    /**
     * Music Terminology and Expression Markings for Electronic Music
     * Based on traditional music theory adapted for electronic music production
     */
    
    // Dynamic markings for velocity control
    const DYNAMICS = [
        'pianissimo' => ['symbol' => 'pp', 'velocity_range' => [10, 25], 'description' => 'Very soft'],
        'piano' => ['symbol' => 'p', 'velocity_range' => [26, 45], 'description' => 'Soft'],
        'mezzo_piano' => ['symbol' => 'mp', 'velocity_range' => [46, 65], 'description' => 'Moderately soft'],
        'mezzo_forte' => ['symbol' => 'mf', 'velocity_range' => [66, 85], 'description' => 'Moderately loud'],
        'forte' => ['symbol' => 'f', 'velocity_range' => [86, 105], 'description' => 'Loud'],
        'fortissimo' => ['symbol' => 'ff', 'velocity_range' => [106, 127], 'description' => 'Very loud']
    ];
    
    // Articulation patterns for note shaping
    const ARTICULATIONS = [
        'legato' => [
            'description' => 'Smoothly connected notes',
            'note_separation' => 0.0, // No gap between notes
            'duration_modifier' => 1.0, // Full duration
            'attack' => 'smooth',
            'genres' => ['ambient_house', 'deep_house', 'progressive_house']
        ],
        'staccato' => [
            'description' => 'Short, detached notes',
            'note_separation' => 0.125, // 1/8 beat gap
            'duration_modifier' => 0.5, // Half duration
            'attack' => 'sharp',
            'genres' => ['peak_time_techno', 'tech_house', 'minimal_techno']
        ],
        'tenuto' => [
            'description' => 'Notes held for full value',
            'note_separation' => 0.0,
            'duration_modifier' => 1.0,
            'attack' => 'sustained',
            'genres' => ['melodic_techno', 'progressive_trance']
        ],
        'marcato' => [
            'description' => 'Notes played with emphasis',
            'note_separation' => 0.0,
            'duration_modifier' => 0.9,
            'attack' => 'accented',
            'velocity_boost' => 15,
            'genres' => ['hard_techno', 'peak_time_techno']
        ],
        'pizzicato' => [
            'description' => 'Plucked string-like articulation',
            'note_separation' => 0.0625, // 1/16 beat gap
            'duration_modifier' => 0.3,
            'attack' => 'plucked',
            'decay' => 'quick',
            'genres' => ['organic_house', 'ethnic_electronica']
        ]
    ];
    
    // Tempo variations and changes
    const TEMPO_EXPRESSIONS = [
        'accelerando' => [
            'description' => 'Gradually increasing tempo',
            'tempo_change' => 'increase',
            'rate' => 'gradual',
            'typical_increase' => '5-20%',
            'usage' => 'buildups, risers'
        ],
        'ritardando' => [
            'description' => 'Gradually decreasing tempo',
            'tempo_change' => 'decrease',
            'rate' => 'gradual',
            'typical_decrease' => '10-30%',
            'usage' => 'breakdown endings, outros'
        ],
        'rubato' => [
            'description' => 'Flexible tempo for expression',
            'tempo_change' => 'flexible',
            'rate' => 'expressive',
            'variation' => '±5-15%',
            'usage' => 'emotional leads, organic sections'
        ],
        'a_tempo' => [
            'description' => 'Return to original tempo',
            'tempo_change' => 'return',
            'rate' => 'immediate',
            'usage' => 'after tempo changes, drop entries'
        ]
    ];
    
    // Expression markings for musical character
    const EXPRESSIONS = [
        'con_brio' => [
            'description' => 'With spirit and vigor',
            'velocity_modifier' => 1.2,
            'attack_modifier' => 'sharp',
            'usage' => 'energetic drops, peak sections',
            'genres' => ['peak_time_techno', 'hard_techno']
        ],
        'espressivo' => [
            'description' => 'Expressive, with feeling',
            'velocity_modifier' => 1.1,
            'rubato' => true,
            'usage' => 'emotional leads, breakdown melodies',
            'genres' => ['melodic_techno', 'progressive_house']
        ],
        'dolce' => [
            'description' => 'Sweet and soft',
            'velocity_modifier' => 0.7,
            'attack_modifier' => 'gentle',
            'usage' => 'ambient pads, gentle leads',
            'genres' => ['ambient_house', 'deep_house']
        ],
        'agitato' => [
            'description' => 'Agitated, restless',
            'velocity_modifier' => 1.1,
            'rhythmic_variation' => 'increased',
            'usage' => 'tension sections, aggressive builds',
            'genres' => ['hard_techno', 'industrial_techno']
        ],
        'cantabile' => [
            'description' => 'Singing style, lyrical',
            'velocity_modifier' => 0.9,
            'legato' => true,
            'usage' => 'melodic leads, vocal-like synths',
            'genres' => ['progressive_house', 'trance']
        ]
    ];
    
    // Musical form structures for arrangement
    const MUSICAL_FORMS = [
        'binary_form' => [
            'structure' => ['A', 'B'],
            'description' => 'Two contrasting sections',
            'usage' => 'Simple electronic tracks',
            'typical_length' => '4-8 minutes'
        ],
        'ternary_form' => [
            'structure' => ['A', 'B', 'A'],
            'description' => 'Return to opening after contrasting section',
            'usage' => 'Classic electronic track structure',
            'typical_length' => '6-10 minutes'
        ],
        'rondo_form' => [
            'structure' => ['A', 'B', 'A', 'C', 'A'],
            'description' => 'Recurring main theme with episodes',
            'usage' => 'Complex progressive tracks',
            'typical_length' => '8-12 minutes'
        ],
        'theme_variations' => [
            'structure' => ['Theme', 'Var1', 'Var2', 'Var3', 'Return'],
            'description' => 'Main theme with systematic variations',
            'usage' => 'Hypnotic techno, minimal techno',
            'typical_length' => '6-15 minutes'
        ]
    ];
    
    // Ostinato patterns for repetitive electronic elements
    const OSTINATO_PATTERNS = [
        'rhythmic_ostinato' => [
            'description' => 'Repeated rhythmic pattern',
            'typical_length' => [1, 2, 4], // bars
            'variation_frequency' => 'every_8_16_bars',
            'usage' => 'Bass patterns, percussion loops',
            'complexity_levels' => [
                'simple' => 'quarter_note_pattern',
                'medium' => 'eighth_note_pattern',
                'complex' => 'sixteenth_note_pattern'
            ]
        ],
        'melodic_ostinato' => [
            'description' => 'Repeated melodic pattern',
            'typical_length' => [2, 4, 8], // bars
            'variation_frequency' => 'every_4_8_bars',
            'usage' => 'Arpeggios, sequence patterns',
            'development' => [
                'transposition' => 'move_to_different_scale_degrees',
                'inversion' => 'flip_melodic_contour',
                'augmentation' => 'stretch_rhythm',
                'diminution' => 'compress_rhythm'
            ]
        ],
        'harmonic_ostinato' => [
            'description' => 'Repeated harmonic pattern',
            'typical_length' => [4, 8, 16], // bars
            'variation_frequency' => 'every_16_32_bars',
            'usage' => 'Chord progressions, harmonic cycles',
            'techniques' => [
                'voice_leading' => 'smooth_chord_transitions',
                'modal_interchange' => 'borrow_from_parallel_modes',
                'substitutions' => 'replace_with_related_chords'
            ]
        ]
    ];
    
    /**
     * Apply dynamic expression to notes
     */
    public static function applyDynamicExpression($notes, $expression = 'mezzo_forte')
    {
        $dynamicData = self::DYNAMICS[$expression] ?? self::DYNAMICS['mezzo_forte'];
        $velocityRange = $dynamicData['velocity_range'];
        
        foreach ($notes as &$note) {
            $originalVelocity = $note['velocity'];
            $normalizedVelocity = $originalVelocity / 127; // Normalize to 0-1
            
            // Map to new dynamic range
            $newVelocity = $velocityRange[0] + ($normalizedVelocity * ($velocityRange[1] - $velocityRange[0]));
            $note['velocity'] = max(1, min(127, intval($newVelocity)));
        }
        
        return $notes;
    }
    
    /**
     * Apply articulation to notes
     */
    public static function applyArticulation($notes, $articulation = 'legato')
    {
        $articulationData = self::ARTICULATIONS[$articulation] ?? self::ARTICULATIONS['legato'];
        
        foreach ($notes as $index => &$note) {
            // Apply duration modifier
            $note['duration'] *= $articulationData['duration_modifier'];
            
            // Apply note separation
            if ($articulationData['note_separation'] > 0 && $index < count($notes) - 1) {
                $nextNote = &$notes[$index + 1];
                $nextNote['start'] = max(
                    $nextNote['start'],
                    $note['start'] + $note['duration'] + $articulationData['note_separation']
                );
            }
            
            // Apply velocity boost for marcato
            if (isset($articulationData['velocity_boost'])) {
                $note['velocity'] = min(127, $note['velocity'] + $articulationData['velocity_boost']);
            }
        }
        
        return $notes;
    }
    
    /**
     * Create ostinato pattern
     */
    public static function createOstinato($type, $key, $genre, $bars = 4, $complexity = 3)
    {
        $ostinatoData = self::OSTINATO_PATTERNS[$type] ?? self::OSTINATO_PATTERNS['melodic_ostinato'];
        $isMinor = strpos($key, 'm') !== false;
        $root = str_replace('m', '', $key);
        $scale = self::getScaleForGenre($root, $key, $genre);
        
        $pattern = [];
        $patternLength = min($bars, $ostinatoData['typical_length'][array_rand($ostinatoData['typical_length'])]);
        
        switch ($type) {
            case 'melodic_ostinato':
                $pattern = self::createMelodicOstinato($scale, $patternLength, $complexity);
                break;
                
            case 'rhythmic_ostinato':
                $pattern = self::createRhythmicOstinato($scale, $patternLength, $complexity);
                break;
                
            case 'harmonic_ostinato':
                $progression = self::getProgression($key, self::getProgressionForGenre($genre));
                $pattern = self::createHarmonicOstinato($progression, $patternLength, $complexity);
                break;
        }
        
        return [
            'pattern' => $pattern,
            'length_bars' => $patternLength,
            'variations' => self::generateOstinatoVariations($pattern, $ostinatoData),
            'type' => $type
        ];
    }
    
    /**
     * Create melodic ostinato pattern
     */
    private static function createMelodicOstinato($scale, $bars, $complexity)
    {
        $notes = [];
        $notesPerBar = 4 * $complexity; // More notes with higher complexity
        $totalNotes = $bars * $notesPerBar;
        
        // Create a short melodic cell that will repeat
        $cellLength = min(8, $totalNotes / 2);
        $melodicCell = [];
        
        $currentIndex = 0;
        for ($i = 0; $i < $cellLength; $i++) {
            // Create stepwise motion with occasional leaps
            $movement = rand(0, 100) < 70 ? rand(-1, 1) : rand(-3, 3);
            $currentIndex += $movement;
            $currentIndex = max(0, min(count($scale) - 1, $currentIndex));
            
            $melodicCell[] = [
                'scale_index' => $currentIndex,
                'duration' => 1.0 / $complexity, // Shorter notes for higher complexity
                'velocity' => 80 + rand(-10, 10)
            ];
        }
        
        // Repeat the cell to fill the pattern
        $cellIndex = 0;
        for ($i = 0; $i < $totalNotes; $i++) {
            $cellNote = $melodicCell[$cellIndex % count($melodicCell)];
            
            $notes[] = [
                'note' => $scale[$cellNote['scale_index']],
                'velocity' => $cellNote['velocity'],
                'start' => $i * (4.0 / $notesPerBar), // Evenly distribute across bars
                'duration' => $cellNote['duration']
            ];
            
            $cellIndex++;
        }
        
        return $notes;
    }
    
    /**
     * Create rhythmic ostinato pattern
     */
    private static function createRhythmicOstinato($scale, $bars, $complexity)
    {
        $notes = [];
        $rootNote = $scale[0]; // Use root note for rhythm
        
        // Create rhythmic cell based on complexity
        $rhythmicCells = [
            1 => [1, 0, 1, 0], // Simple on-off
            2 => [1, 0, 1, 1, 0, 1, 0, 0], // More syncopated
            3 => [1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], // Complex 16th pattern
            4 => [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0], // Very complex
            5 => [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1] // Ultra complex
        ];
        
        $cell = $rhythmicCells[$complexity] ?? $rhythmicCells[3];
        $beatsPerBar = 16; // 16th note resolution
        
        for ($bar = 0; $bar < $bars; $bar++) {
            for ($beat = 0; $beat < $beatsPerBar; $beat++) {
                if ($cell[$beat % count($cell)]) {
                    $notes[] = [
                        'note' => $rootNote,
                        'velocity' => 90 + rand(-10, 10),
                        'start' => ($bar * 4) + ($beat * 0.25),
                        'duration' => 0.125
                    ];
                }
            }
        }
        
        return $notes;
    }
    
    /**
     * Create harmonic ostinato pattern
     */
    private static function createHarmonicOstinato($progression, $bars, $complexity)
    {
        $notes = [];
        $chordsPerBar = max(1, $complexity - 1); // More chord changes with complexity
        
        for ($bar = 0; $bar < $bars; $bar++) {
            for ($chordPos = 0; $chordPos < $chordsPerBar; $chordPos++) {
                $chordIndex = ($bar * $chordsPerBar + $chordPos) % count($progression);
                $chord = $progression[$chordIndex];
                
                $startTime = ($bar * 4) + ($chordPos * (4 / $chordsPerBar));
                $duration = 4 / $chordsPerBar;
                
                foreach ($chord as $chordNote) {
                    $notes[] = [
                        'note' => $chordNote,
                        'velocity' => 70 + rand(-5, 5),
                        'start' => $startTime,
                        'duration' => $duration
                    ];
                }
            }
        }
        
        return $notes;
    }
    
    /**
     * Generate variations for ostinato patterns
     */
    private static function generateOstinatoVariations($pattern, $ostinatoData)
    {
        $variations = [];
        
        if (isset($ostinatoData['development'])) {
            foreach ($ostinatoData['development'] as $variationType => $description) {
                $variations[$variationType] = self::applyOstinatoVariation($pattern, $variationType);
            }
        }
        
        return $variations;
    }
    
    /**
     * Apply specific variation to ostinato pattern
     */
    private static function applyOstinatoVariation($pattern, $variationType)
    {
        $variation = $pattern;
        
        switch ($variationType) {
            case 'transposition':
                foreach ($variation as &$note) {
                    $note['note'] += rand(1, 4); // Transpose up 1-4 semitones
                }
                break;
                
            case 'inversion':
                $centerNote = $pattern[0]['note']; // Use first note as center
                foreach ($variation as &$note) {
                    $distance = $note['note'] - $centerNote;
                    $note['note'] = $centerNote - $distance;
                }
                break;
                
            case 'augmentation':
                foreach ($variation as &$note) {
                    $note['duration'] *= 1.5; // Stretch rhythm
                    $note['start'] *= 1.5;
                }
                break;
                
            case 'diminution':
                foreach ($variation as &$note) {
                    $note['duration'] *= 0.75; // Compress rhythm
                    $note['start'] *= 0.75;
                }
                break;
        }
        
        return $variation;
    }
    
    /**
     * Get appropriate articulation for genre and element
     */
    public static function getArticulationForContext($genre, $element = 'melody', $energy = 0.5)
    {
        $genreArticulationMap = [
            'progressive_house' => ['legato', 'tenuto'],
            'melodic_techno' => ['tenuto', 'marcato'],
            'peak_time_techno' => ['staccato', 'marcato'],
            'deep_house' => ['legato', 'tenuto'],
            'organic_house' => ['legato', 'pizzicato'],
            'minimal_techno' => ['staccato', 'tenuto'],
            'trance' => ['legato', 'cantabile'],
            'drum_and_bass' => ['staccato', 'marcato'],
            'minimal_dub_techno' => ['tenuto', 'legato']
        ];
        
        $elementArticulationMap = [
            'lead' => ['legato', 'tenuto', 'espressivo'],
            'bass' => ['staccato', 'marcato'],
            'arp' => ['staccato', 'pizzicato'],
            'pad' => ['legato', 'tenuto'],
            'percussion' => ['staccato', 'marcato']
        ];
        
        $energyArticulationMap = [
            'low' => ['legato', 'dolce'],
            'medium' => ['tenuto', 'espressivo'],
            'high' => ['marcato', 'con_brio']
        ];
        
        // Get energy level category
        $energyLevel = $energy < 0.4 ? 'low' : ($energy > 0.7 ? 'high' : 'medium');
        
        // Combine preferences
        $genreOptions = $genreArticulationMap[$genre] ?? ['tenuto'];
        $elementOptions = $elementArticulationMap[$element] ?? ['tenuto'];
        $energyOptions = $energyArticulationMap[$energyLevel] ?? ['tenuto'];
        
        // Find best match
        $intersection = array_intersect($genreOptions, $elementOptions, $energyOptions);
        if (!empty($intersection)) {
            return $intersection[array_rand($intersection)];
        }
        
        // Fall back to genre preference
        return $genreOptions[array_rand($genreOptions)];
    }
    
    /**
     * Apply musical expression to arrangement section
     */
    public static function applyMusicalExpression($notes, $expression, $genre)
    {
        $expressionData = self::EXPRESSIONS[$expression] ?? self::EXPRESSIONS['espressivo'];
        
        foreach ($notes as &$note) {
            // Apply velocity modifier
            if (isset($expressionData['velocity_modifier'])) {
                $note['velocity'] = min(127, max(1, intval($note['velocity'] * $expressionData['velocity_modifier'])));
            }
            
            // Apply rubato if specified
            if (isset($expressionData['rubato']) && $expressionData['rubato']) {
                $rubato = (rand(-50, 50) / 1000); // ±5% timing variation
                $note['start'] += $rubato;
            }
        }
        
        return $notes;
    }

    /**
     * EDM Production Workflow - Based on "The 28 Steps to Electronic Dance Music Production"
     * by Melhem Maroun. Structured approach to track creation from loop to master.
     */

    // The 8-bar loop: element build order with production characteristics
    const EIGHT_BAR_LOOP_ELEMENTS = [
        'step_1_kick' => [
            'element' => 'kick',
            'priority' => 1,
            'description' => 'Four-on-the-floor kick pattern - the first impression of the track',
            'pattern' => [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            'frequency_range' => [40, 120],
            'production_notes' => [
                'Must be in key with the track',
                'Must be punchy and loud',
                'Use sidechain compression on sub-bass to prevent conflict',
                'Each genre has specific kick characteristics (length, sub content)'
            ]
        ],
        'step_2_melody' => [
            'element' => 'melody',
            'priority' => 2,
            'description' => 'The heart and emotion of the track - must be easily remembered',
            'frequency_range' => [300, 4000],
            'production_notes' => [
                'Music theory knowledge helps avoid key clashes',
                'Can be created with MIDI keyboard or mouse in piano roll',
                'Must be singable and memorable',
                'Melody defines the identity of the track'
            ]
        ],
        'step_3_clap_snare' => [
            'element' => 'clap_snare',
            'priority' => 3,
            'description' => 'Claps on beat 2 and 4 - gives balance to the rhythm',
            'pattern_16th' => [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            'frequency_range' => [200, 8000],
            'production_notes' => [
                'Layer 2-3 different clap/snare samples for uniqueness',
                'Use EQ to give each layer its own frequency space',
                'Use compression to glue layers together',
                'Reverb makes layers sound like they come from the same space'
            ],
            'layering_tips' => [
                'eq_separation' => 'Give each part its own spectrum space',
                'octave_displacement' => 'Use +12 octave when layering to avoid frequency masking',
                'compression_glue' => 'Bus compressor at 4:1 ratio to glue 2-3 layers',
                'shared_reverb' => 'Same reverb setting for all layers creates cohesion',
                'timing_attack_body' => 'Layer a sound with attack + a sound with body'
            ]
        ],
        'step_4_hihat' => [
            'element' => 'hihat',
            'priority' => 4,
            'description' => 'Hi-hats set the groove - essential in most electronic music',
            'frequency_range' => [6000, 16000],
            'production_notes' => [
                'Open hi-hat between consecutive kick drums is signature EDM sound',
                'Use delay (especially EchoBoy style) for movement',
                'Sidechain compression for pumping effect',
                'Off-beat placement is standard for house/techno'
            ]
        ],
        'step_5_percussion' => [
            'element' => 'percussion',
            'priority' => 5,
            'description' => 'Adds variation and uniqueness - can be creative and diverse',
            'frequency_range' => [200, 12000],
            'humanization' => [
                'Slightly off-beat timing (few ms) for natural feel',
                'Automated filter to change frequency over time',
                'Use different samples for same part (round-robin)',
                'Dynamically change pitch or volume per hit'
            ],
            'production_notes' => [
                'Must not sound robotic or monotone',
                'Use swing option in DAW for groove',
                'Can use humanize function to offset timing',
                'Digital or acoustic samples both work'
            ]
        ],
        'step_6_rides' => [
            'element' => 'rides',
            'priority' => 6,
            'description' => 'Lifts energy during different parts - essential for tension and release',
            'pattern_16th' => [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'frequency_range' => [4000, 14000],
            'production_notes' => [
                'Add power after most drum patterns are established',
                'Add something new every 8-16 bars in arrangement',
                'Can substitute with shakers for variety',
                'Used to add tension and energy in arrangement'
            ]
        ],
        'step_7_rhythm_lead' => [
            'element' => 'rhythm_lead',
            'priority' => 7,
            'description' => 'Main lead introduced after intro - defines the track timbre',
            'frequency_range' => [500, 6000],
            'layering_tips' => [
                'eq_per_layer' => 'EQ each layer to its own frequency range',
                'octave_separation' => 'Each lead in different octave (C2 and C3)',
                'compression_glue' => 'Compress the lead group to create one big layered lead',
                'shared_reverb' => 'Same reverb for all layers - sounds like same space',
                'attack_body_pairing' => 'Pair a sound with audible attack + one with body'
            ],
            'production_notes' => [
                'Processing: delays, reverbs, compressors, distortion',
                'Can be a duplicate of melody with different timbre',
                'Adds spice and originality to the record'
            ]
        ],
        'step_8_extras' => [
            'element' => 'extra_elements',
            'priority' => 8,
            'description' => 'Additional elements for variety - like having LEGO bricks for arrangement',
            'examples' => ['pluck', 'room_effect', 'extra_clap', 'one_shot', 'vocal_chop'],
            'production_notes' => [
                'Having abundance of elements prevents writers block in arrangement',
                'Not everything needs to be added now',
                'Inspiration can strike during arrangement or mixing',
                'More elements = more choice during arrangement'
            ]
        ]
    ];

    // Subtractive arrangement method - sculpt sections by removing elements
    const SUBTRACTIVE_ARRANGEMENT = [
        'method' => 'Copy 8-bar loop across full track length, then remove elements to create sections',
        'track_structure' => [
            'total_sections' => 5,
            'section_length_bars' => 32,
            'total_bars' => 160,
            'loop_copies' => 20
        ],
        'sections' => [
            'intro' => [
                'position' => 1,
                'duration_bars' => 32,
                'energy' => 'low_to_medium',
                'remove' => ['bass', 'main_melody', 'some_percussion'],
                'keep' => ['kick', 'hihat', 'rides', 'atmospheric_elements'],
                'technique' => 'Start minimal, gradually add elements',
                'intro_ideas' => [
                    'pad_with_sidechain' => 'Pad with sidechain compression keyed to kick',
                    'bass_with_hpf' => 'Bass with high-pass filter gradually opening',
                    'extra_percussion' => 'Additional percussion elements',
                    'one_shots' => 'Stabs, plucks from synthesizer or sample pack',
                    'vocal_sample' => 'Rhythmic vocal sample',
                    'pluck_with_lpf' => 'Pluck with low-pass filter gradually opening up',
                    'rhythmic_loop_hpf' => 'Rhythmic loop with HPF/LPF opening up',
                    'sawtooth_bass_lpf' => 'Sawtooth bassline with automated low pass filter',
                    'toms_congas' => 'Toms and congas for rhythm variation',
                    'melodic_percussion' => 'Melodic percussion element',
                    'white_noise_uplifter' => 'White noises and uplifters',
                    'lead_layer_rhythmic' => 'One layer of lead stack playing rhythmically'
                ],
                'production_notes' => [
                    'Intro must captivate the listener from the first beat',
                    'Nothing worse than a single kick drum for 32 bars without changes',
                    'Create variations every couple of seconds',
                    'Changes are rhythmic by nature, contain few melodic elements',
                    'Add reverb/delay to percussion for space',
                    'Add sidechain compression to elements with reverb for pumping effect'
                ]
            ],
            'intro_development' => [
                'position' => 2,
                'duration_bars' => 32,
                'energy' => 'medium',
                'remove' => ['some_percussion_when_sub_enters'],
                'add' => ['sub_bass', 'melody_hints', 'more_elements'],
                'technique' => 'Remove some percussion when sub-bass begins to give bass more power'
            ],
            'breakdown' => [
                'position' => 3,
                'duration_bars' => 32,
                'energy' => 'low',
                'remove' => ['almost_everything'],
                'keep' => ['pad', 'arpeggiator', 'sub_bass_layer', 'melody_variation'],
                'technique' => 'Break from high energy - room for creativity',
                'elements' => [
                    'breakdown_pad' => [
                        'description' => 'Orchestral, piano, guitar, or synth pad',
                        'characteristics' => 'Independent from rest of track instrumentation',
                        'processing' => 'Cutoff filter automation to build energy'
                    ],
                    'sub_bass_layer' => [
                        'description' => 'Sub-bass to give weight near end of breakdown',
                        'frequency_range' => [35, 80],
                        'notes' => 'Keep sub playing alone - no stacking low frequency layers',
                        'avoid_compression' => 'Minimal compression to preserve timbre'
                    ],
                    'arpeggiator' => [
                        'description' => 'Takes chord input and creates arpeggio pattern',
                        'parameters' => [
                            'note_length' => '0-100% duration control',
                            'random' => '0-100% randomize note length',
                            'velocity' => '0-100% with random option',
                            'swing' => 'Creates groovy feel, real musicians dont play exact time'
                        ]
                    ]
                ],
                'production_notes' => [
                    'Music theory essential for harmonious melodic breakdown',
                    'Pad + sub-bass layer + cutoff automation builds energy',
                    'Can be completely independent from rest of track',
                    'Room for orchestral sounds, pads, guitars, pianos'
                ]
            ],
            'drop' => [
                'position' => 4,
                'duration_bars' => 32,
                'energy' => 'high',
                'keep' => ['everything'],
                'add' => ['extra_lead_layers', 'energy_elements'],
                'technique' => 'Most energetic part - all instruments play together',
                'layer_tips' => [
                    'Add 2+ lead layers with note variations for fullness',
                    'Each new layer increases energy as track progresses',
                    'Choose complementary timbres for layered leads',
                    'Study intro leads of well-known tracks to deconstruct lead sounds'
                ],
                'production_notes' => [
                    'The drop is where kick and all instruments play together',
                    'Energy can be raised further by adding more elements during the drop',
                    'Lead might feel thin/repetitive - add corresponding layers',
                    'Dont spend hours tweaking sounds - create and move forward'
                ]
            ],
            'outro' => [
                'position' => 5,
                'duration_bars' => 32,
                'energy' => 'medium_to_low',
                'technique' => 'Lower energy, prepare for DJ to mix with another track',
                'remove' => ['melody', 'leads', 'bass_gradually'],
                'keep' => ['kick', 'percussion', 'atmospheric_elements'],
                'production_notes' => [
                    'Small breakdown of ~16 bars before outro',
                    'DJ will mix your track with another one here'
                ]
            ]
        ]
    ];

    // Transition types and techniques
    const TRANSITION_TYPES = [
        'short_transitions' => [
            'duration' => '1-16 beats',
            'placement' => 'Every 4-8 bars for small changes',
            'types' => ['white_noise_burst', 'fill', 'crash_cymbal', 'reverse_hit'],
            'purpose' => 'Small changes and variations within sections'
        ],
        'long_transitions' => [
            'duration' => '16-32 bars (4-8 bars)',
            'placement' => 'Before every major change (before drop, before breakdown)',
            'types' => ['noise_sweep', 'melodic_uplifter', 'filter_automation', 'buildup_fill'],
            'purpose' => 'Big section changes, creating anticipation'
        ],
        'transitions_loop_method' => [
            'description' => 'Create an 8-16 bar transitions loop with all effects, then copy-paste',
            'length_bars' => [8, 16],
            'contents' => ['sweep_down', 'noise_uplifter', 'white_noise_effects'],
            'copy_interval' => 'Every 32 bars',
            'advantage' => 'Ensures consistency, easy to apply across arrangement'
        ],
        'sweep_down' => [
            'description' => 'Downward frequency sweep for release moments',
            'automation' => 'Filter cutoff from high to low',
            'placement' => 'After drops, at section endings'
        ],
        'noise_uplifter' => [
            'description' => 'Rising white noise for energy building',
            'automation' => 'Volume and/or filter cutoff rising over time',
            'placement' => 'Before drops, before new sections'
        ]
    ];

    // Buildup methods - 4 core techniques for creating anticipation
    const BUILDUP_METHODS = [
        'snare_speedup' => [
            'description' => 'Speeding up snare/drum pattern to build anticipation',
            'technique' => 'Start with snare every beat, then every half beat, then every quarter beat',
            'velocity_variation' => 'Change velocity during speedup to avoid robotic sound',
            'two_parts' => [
                'part_1' => 'Snare plays every beat (normal)',
                'part_2' => 'Snare plays every half and quarter beat with velocity changes'
            ],
            'energy_curve' => 'exponential'
        ],
        'pitch_rise' => [
            'description' => 'Using progressively higher pitch over time',
            'technique' => 'Single note with pitch bend +12 or +24 semitones via MIDI CC',
            'implementation' => 'Create note, use pitch bend automation to raise pitch over buildup',
            'pitch_range' => [12, 24],
            'energy_curve' => 'linear_to_exponential'
        ],
        'filter_cutoff' => [
            'description' => 'Automating cutoff filter frequency to create tension',
            'technique' => 'Low-pass filter gradually opening, or high-pass filter closing',
            'automation_curve' => 'exponential',
            'start_frequency' => [200, 500],
            'end_frequency' => [8000, 20000],
            'energy_curve' => 'exponential'
        ],
        'volume_silence' => [
            'description' => 'Automating volume and using silence for surprises and tension',
            'technique' => 'Sudden volume drops or complete silence before drop',
            'silence_duration' => [0.25, 2.0],
            'impact' => 'Silence before the drop creates maximum contrast',
            'energy_curve' => 'stepped'
        ]
    ];

    // Humanization techniques for natural-sounding patterns
    const HUMANIZATION_TECHNIQUES = [
        'timing_offset' => [
            'description' => 'Slightly off-beat placement for natural feel',
            'offset_range_ms' => [-15, 15],
            'application' => 'Apply to percussion, hi-hats, non-kick elements',
            'never_apply_to' => ['kick'],
            'tip' => 'Use DAW swing option as alternative'
        ],
        'velocity_variation' => [
            'description' => 'Dynamic velocity changes per hit',
            'variation_range' => [-15, 15],
            'accent_pattern' => 'Emphasize beats 1 and 3 for kick, 2 and 4 for snare',
            'ghost_notes' => 'Very quiet notes (velocity 10-30) between main hits'
        ],
        'sample_rotation' => [
            'description' => 'Use different samples for same instrument (round-robin)',
            'min_samples' => 2,
            'max_samples' => 5,
            'method' => 'Round-robin or random selection per hit',
            'tip' => 'Use sampler like NI Kontakt for automatic round-robin'
        ],
        'pitch_variation' => [
            'description' => 'Dynamically change pitch per hit',
            'range_semitones' => [-2, 2],
            'application' => 'Percussion, hi-hats, toms',
            'tip' => 'Subtle pitch changes add life without changing the feel'
        ],
        'auto_filter' => [
            'description' => 'Automated filter to change frequency character over time',
            'filter_type' => 'low_pass',
            'automation_range' => [2000, 12000],
            'rate' => 'Over duration of percussion bar',
            'tip' => 'Changes the character of repetitive patterns'
        ]
    ];

    // Mixing priority order - the order to bring in elements during leveling
    const MIXING_LEVEL_ORDER = [
        1 => [
            'element' => 'kick_and_sub_bass',
            'description' => 'Foundation of the mix - start with kick at -12dB',
            'kick_level_db' => -12,
            'sub_bass_level' => 'Almost same power as kick, slightly lower',
            'frequency_range' => [20, 120],
            'tips' => [
                'Sub-bass frequency should be 35-80Hz',
                'Below 40Hz = low-end rumble, above 90Hz = more like mid-bass',
                'Kick must dominate over sub-bass',
                'Use sidechain or LFO tool on sub-bass for pumping effect',
                'Silence sub-bass notes that play same time as kick to prevent clash',
                'Never stack two sub-bass layers - causes phasing'
            ]
        ],
        2 => [
            'element' => 'snare_clap',
            'description' => 'Add compression to taste - glue layered samples',
            'tips' => [
                'Bus compressor glues layered claps/snares together',
                'Compressors are automatic volume faders working in milliseconds'
            ]
        ],
        3 => [
            'element' => 'hihats',
            'description' => 'Raise volume to taste - mute/unmute to find right level',
            'tips' => [
                'Raise until too loud, then lower until too soft - sweet spot is between',
                'Subtractive EQ preferred - dont boost unless hardware-emulated EQ'
            ]
        ],
        4 => [
            'element' => 'percussion_rides_shakers',
            'description' => 'Group all drums and percussion together',
            'tips' => [
                'Add channel EQ on top of group',
                'Add SSL-style bus compressor for glue',
                'Can sidechain whole drum group to kick for pumping'
            ]
        ],
        5 => [
            'element' => 'melody',
            'description' => 'Mix in melody - boost around 4kHz for presence',
            'eq_boost_hz' => 4000,
            'tips' => [
                'Only add processing if there is a reason',
                'Simplicity and scarcity are keys to mixing',
                'Surf different sections to check volume consistency',
                'Fix volume differences between sections with automation later'
            ]
        ],
        6 => [
            'element' => 'bass',
            'description' => 'Remaining bass parts (mid-bass, high-bass)',
            'tips' => [
                'EQ to lower frequencies that clash with melody',
                'Use frequency sweeping to find problematic frequencies',
                'EQ is a volume fader for specific frequencies'
            ]
        ],
        7 => [
            'element' => 'effects_remaining',
            'description' => 'Introduce effects, uplifters, and all remaining channels',
            'tips' => [
                'Bus compressor on effects group for consistent volume',
                'Make sure effects dont mask any main elements'
            ]
        ]
    ];

    // Detailed element frequency ranges for mixing and arrangement
    const ELEMENT_FREQUENCY_GUIDE = [
        'sub_bass' => [
            'fundamental' => [35, 80],
            'sweet_spot' => [40, 50],
            'rule' => 'Must play alone - never stack two sub-bass layers',
            'sidechain' => true,
            'compression' => 'Minimal - changes timbre',
            'tips' => [
                'Below 40Hz = rumble, not felt as note',
                'Above 90Hz = mid-bass, not sub',
                'Change octave if note goes out of 35-80Hz range',
                'Must complement melody harmonically'
            ]
        ],
        'kick' => [
            'fundamental' => [40, 80],
            'punch' => [100, 200],
            'click' => [2000, 5000],
            'rule' => 'Must talk to all elements and be in key',
            'sidechain_target' => true
        ],
        'bass' => [
            'fundamental' => [60, 250],
            'harmonics' => [250, 800],
            'rule' => 'Complements kick - let each have its own time to play',
            'sidechain' => true
        ],
        'clap_snare' => [
            'body' => [200, 500],
            'presence' => [2000, 5000],
            'air' => [8000, 12000],
            'rule' => 'Layer for uniqueness - EQ each layer separately'
        ],
        'hihat' => [
            'fundamental' => [6000, 10000],
            'shimmer' => [10000, 16000],
            'rule' => 'Off-beat placement standard, delay for movement'
        ],
        'melody_lead' => [
            'fundamental' => [300, 3000],
            'presence' => [3000, 6000],
            'air' => [8000, 12000],
            'boost_frequency' => 4000,
            'rule' => 'Boost around 4kHz for clarity in mix'
        ],
        'pad' => [
            'fundamental' => [200, 2000],
            'warmth' => [200, 500],
            'presence' => [2000, 5000],
            'rule' => 'Use as send effect with reverb for space'
        ],
        'percussion' => [
            'low_perc' => [100, 500],
            'mid_perc' => [500, 4000],
            'high_perc' => [4000, 12000],
            'rule' => 'Humanize timing and velocity for natural feel'
        ]
    ];

    // Hi-hat pattern variations
    const HIHAT_PATTERNS = [
        'offbeat_open' => [
            'description' => 'Open hi-hat between consecutive kicks - signature EDM sound',
            'pattern_16th' => [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'type' => 'open',
            'genres' => ['house', 'techno', 'trance']
        ],
        'closed_8th' => [
            'description' => 'Closed hi-hat on every 8th note',
            'pattern_16th' => [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'type' => 'closed',
            'genres' => ['house', 'deep_house']
        ],
        'rolling_16th' => [
            'description' => 'Continuous 16th note hi-hat pattern',
            'pattern_16th' => [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
            'velocity_pattern' => [100,60,80,60, 100,60,80,60, 100,60,80,60, 100,60,80,60],
            'type' => 'closed',
            'genres' => ['techno', 'trance', 'hard_dance']
        ],
        'shuffled_groove' => [
            'description' => 'Shuffled hi-hat for groove variation',
            'pattern_16th' => [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
            'type' => 'mixed',
            'swing' => 0.6,
            'genres' => ['deep_house', 'organic_house', 'tech_house']
        ]
    ];

    // Clap and snare pattern variations
    const CLAP_SNARE_PATTERNS = [
        'standard_2_4' => [
            'description' => 'Clap/snare on beats 2 and 4 - most common pattern',
            'pattern_16th' => [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            'genres' => ['house', 'techno', 'trance', 'edm']
        ],
        'four_on_floor_clap' => [
            'description' => 'Clap on every beat for intense sections',
            'pattern_16th' => [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'genres' => ['peak_time_techno', 'hard_techno']
        ],
        'offbeat_snare' => [
            'description' => 'Snare on off-beats for groove',
            'pattern_16th' => [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'genres' => ['garage', 'uk_bass']
        ],
        'buildup_fill' => [
            'description' => 'Accelerating snare fill for buildups',
            'phases' => [
                'phase_1' => [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                'phase_2' => [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                'phase_3' => [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                'phase_4' => [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
            ],
            'velocity_tip' => 'Change velocity during speedup to avoid robotic sound',
            'genres' => ['edm', 'progressive_house', 'big_room']
        ]
    ];

    // Ride patterns
    const RIDE_PATTERNS = [
        'every_beat' => [
            'description' => 'Ride on every beat - standard energy layer',
            'pattern_16th' => [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'purpose' => 'Adds energy after main drum patterns are established',
            'genres' => ['house', 'techno', 'trance']
        ],
        'offbeat_ride' => [
            'description' => 'Ride on off-beats for additional groove',
            'pattern_16th' => [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'purpose' => 'Groove variation, works well with kick',
            'genres' => ['deep_house', 'tech_house']
        ],
        'building_ride' => [
            'description' => 'Ride pattern that increases density for energy builds',
            'pattern_intro' => [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
            'pattern_build' => [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'pattern_peak' => [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
            'purpose' => 'Add every 8-16 bars to raise energy',
            'genres' => ['progressive_house', 'trance']
        ]
    ];

    // Reverb guidelines for electronic music
    const REVERB_GUIDELINES = [
        'creative_reverb' => [
            'description' => 'Changes tone and tail of individual instruments',
            'usage' => 'Insert or auxiliary per instrument',
            'tip' => 'Dont use on every instrument - use as send effect',
            'purpose' => 'Part of the instruments character'
        ],
        'glue_reverb' => [
            'description' => 'Makes instruments sound like they are in the same room',
            'decay_time' => [0.3, 0.7],
            'usage' => 'Auxiliary channel with send knobs from each drum channel',
            'send_level_db' => [-20, -12],
            'max_busses' => 3,
            'test_rule' => 'When you mute the reverb, you must feel something is missing',
            'purpose' => 'Glues parts of the track together (e.g. all drums)'
        ]
    ];

    // Sidechain patterns
    const SIDECHAIN_PATTERNS = [
        'pumping_bass' => [
            'description' => 'Bass volume ducks when kick plays - classic EDM pumping',
            'source' => 'kick',
            'target' => ['bass', 'sub_bass', 'pad'],
            'method' => 'Compressor sidechain or LFO tool',
            'lfo_shape' => 'sharp_attack_slow_release',
            'effect' => 'Creates rhythmic pumping synced to kick'
        ],
        'pad_ducking' => [
            'description' => 'Pad ducks to make room for kick',
            'source' => 'kick',
            'target' => ['pad', 'atmospheric_elements'],
            'depth' => 'moderate',
            'effect' => 'Creates breathing space in the mix'
        ],
        'intro_sidechain' => [
            'description' => 'Apply sidechain to intro elements from the start',
            'source' => 'kick',
            'target' => ['all_reverbed_elements'],
            'purpose' => 'Pumping effect from the very beginning of the track'
        ]
    ];

    // Automation guidelines for arrangement
    const AUTOMATION_GUIDELINES = [
        'filter_cutoff' => [
            'description' => 'Most common automation in electronic music',
            'usage' => 'Breakdown pads, intro elements, transitions',
            'effect' => 'Sound seems to come from far away then appears in your face',
            'example' => 'Trance leads controlled by cutoff filter through sections'
        ],
        'volume' => [
            'description' => 'Lower or raise volume of individual tracks momentarily',
            'usage' => 'Fix volume differences between sections, muting/unmuting',
            'tip' => 'Can be adjusted after mixing stage'
        ],
        'general_rule' => [
            'description' => 'Use automation to increase energy or change any parameter momentarily',
            'frequency' => 'Regular changes keep listener entertained',
            'common_targets' => ['filter_cutoff', 'volume', 'reverb_send', 'delay_send', 'panning']
        ]
    ];

    // Pre-mixing checklist
    const PRE_MIX_CHECKLIST = [
        'high_pass_filter' => [
            'description' => 'Add HPF at 100Hz to ALL tracks except kick and sub-bass',
            'frequency' => 100,
            'exempt' => ['kick', 'sub_bass'],
            'reason' => 'Removes sub-100Hz from all instruments, making room for kick and bass',
            'effect' => 'Prevents phasing issues in low-end'
        ],
        'clean_audio' => [
            'description' => 'Remove microphone pops, clicks, and artifacts',
            'check' => 'Solo each channel and listen for unwanted sounds'
        ],
        'add_compression' => [
            'description' => 'Add compression to instruments that need it',
            'reasons' => [
                'consistent_volume' => 'Maintain even volume across channel',
                'waveform_shaping' => 'Shape transients (e.g. clap with long attack 5-20ms, 4:1 ratio)',
                'creative_sidechain' => 'Pumping effect for rhythmic interest'
            ]
        ]
    ];

    // EQ techniques
    const EQ_TECHNIQUES = [
        'sweeping' => [
            'description' => 'Boost a frequency band and sweep to find problematic frequencies',
            'steps' => [
                '1' => 'Boost any frequency in EQ spectrum',
                '2' => 'Sweep across all frequencies',
                '3' => 'When you find the problematic frequency, cut or boost to taste'
            ],
            'tip' => 'Practice subtractive EQ - cut dont boost (unless hardware-emulated EQ)'
        ],
        'frequency_carving' => [
            'description' => 'Cut frequencies in one instrument to make room for another',
            'example' => 'Cut bass at 3-4kHz to let melody cut through',
            'rule' => 'EQ is a volume fader for specific frequencies'
        ]
    ];

    // Grouping recommendations
    const TRACK_GROUPING = [
        'drums' => [
            'elements' => ['kick', 'clap', 'clap2', 'hihat', 'hihat_loop', 'percussion'],
            'bus_processing' => ['channel_eq', 'bus_compressor'],
            'purpose' => 'Better control, shared EQ and compression'
        ],
        'leads' => [
            'elements' => ['main_lead', 'lead_layer_1', 'lead_layer_2', 'intro_lead'],
            'bus_processing' => ['shared_reverb', 'bus_compressor'],
            'purpose' => 'Glue lead layers together'
        ],
        'bass_group' => [
            'elements' => ['sub_bass', 'mid_bass'],
            'bus_processing' => ['sidechain_to_kick'],
            'purpose' => 'Control low-end as one unit'
        ],
        'effects' => [
            'elements' => ['uplifter', 'noise_sweep', 'riser', 'impact'],
            'bus_processing' => ['bus_compressor'],
            'purpose' => 'Consistent volume for all effects'
        ]
    ];

    // Panning guide for stereo placement
    const PANNING_GUIDE = [
        'center' => [
            'elements' => ['kick', 'sub_bass', 'bass', 'main_lead', 'vocal'],
            'reason' => 'Low frequencies and main elements must be centered for power'
        ],
        'slight_left_right' => [
            'elements' => ['clap', 'snare', 'melody'],
            'range' => [-15, 15],
            'reason' => 'Slight offset for width without losing impact'
        ],
        'wide_stereo' => [
            'elements' => ['hihat', 'percussion', 'pad', 'arp', 'rides', 'effects'],
            'range' => [-50, 50],
            'reason' => 'Creates wide stereo field, reduces frequency masking',
            'tip' => 'Panning gives each instrument its own place in the stereo field'
        ]
    ];

    /**
     * Get production step details
     */
    public static function getProductionStep($stepNumber)
    {
        $stepMap = [
            1 => 'step_1_kick',
            2 => 'step_2_melody',
            3 => 'step_3_clap_snare',
            4 => 'step_4_hihat',
            5 => 'step_5_percussion',
            6 => 'step_6_rides',
            7 => 'step_7_rhythm_lead',
            8 => 'step_8_extras'
        ];

        $key = $stepMap[$stepNumber] ?? null;
        return $key ? self::EIGHT_BAR_LOOP_ELEMENTS[$key] : null;
    }

    /**
     * Get subtractive arrangement rules for a specific section
     */
    public static function getArrangementRulesForSection($section)
    {
        return self::SUBTRACTIVE_ARRANGEMENT['sections'][$section] ?? null;
    }

    /**
     * Get layering advice for an element type
     */
    public static function getLayeringAdvice($elementType)
    {
        $layeringMap = [
            'clap' => self::EIGHT_BAR_LOOP_ELEMENTS['step_3_clap_snare']['layering_tips'],
            'snare' => self::EIGHT_BAR_LOOP_ELEMENTS['step_3_clap_snare']['layering_tips'],
            'lead' => self::EIGHT_BAR_LOOP_ELEMENTS['step_7_rhythm_lead']['layering_tips'],
        ];

        return $layeringMap[$elementType] ?? [
            'eq_separation' => 'Give each layer its own frequency range',
            'compression_glue' => 'Use bus compressor to glue layers',
            'shared_reverb' => 'Same reverb for cohesion'
        ];
    }

    /**
     * Get humanization parameters for an element
     */
    public static function getHumanizationParams($element, $intensity = 'medium')
    {
        $intensityMap = [
            'subtle' => ['timing_ms' => [-5, 5], 'velocity_range' => [-5, 5], 'pitch_cents' => [-5, 5]],
            'medium' => ['timing_ms' => [-10, 10], 'velocity_range' => [-12, 12], 'pitch_cents' => [-10, 10]],
            'heavy' => ['timing_ms' => [-15, 15], 'velocity_range' => [-20, 20], 'pitch_cents' => [-20, 20]]
        ];

        $params = $intensityMap[$intensity] ?? $intensityMap['medium'];

        // Never humanize kick timing
        if ($element === 'kick') {
            $params['timing_ms'] = [0, 0];
        }

        return $params;
    }

    /**
     * Get buildup method details
     */
    public static function getBuildupMethod($method = null)
    {
        if ($method) {
            return self::BUILDUP_METHODS[$method] ?? null;
        }

        // Return random method
        $methods = array_keys(self::BUILDUP_METHODS);
        return self::BUILDUP_METHODS[$methods[array_rand($methods)]];
    }

    /**
     * Get mixing level order for a specific priority
     */
    public static function getMixingLevelOrder($priority = null)
    {
        if ($priority) {
            return self::MIXING_LEVEL_ORDER[$priority] ?? null;
        }
        return self::MIXING_LEVEL_ORDER;
    }

    /**
     * Get frequency guide for an element
     */
    public static function getFrequencyGuide($element)
    {
        return self::ELEMENT_FREQUENCY_GUIDE[$element] ?? null;
    }

    /**
     * Get pattern for drum element
     */
    public static function getDrumPattern($element, $variation = null)
    {
        $patternMaps = [
            'hihat' => self::HIHAT_PATTERNS,
            'clap' => self::CLAP_SNARE_PATTERNS,
            'snare' => self::CLAP_SNARE_PATTERNS,
            'ride' => self::RIDE_PATTERNS,
        ];

        $patterns = $patternMaps[$element] ?? [];

        if ($variation && isset($patterns[$variation])) {
            return $patterns[$variation];
        }

        // Return first pattern as default
        return !empty($patterns) ? reset($patterns) : null;
    }
}