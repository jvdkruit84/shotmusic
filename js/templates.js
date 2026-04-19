// ── Built-in project templates (Startpacks) ─────────────────

// Helpers to pad 16-step arrays to 32
function d16(s) { return s.concat(Array(16).fill(0)); }
function m16(s) { return s.concat(Array(16).fill(null)); }
function tv() { return Array(32).fill(100); }
function tg() { return Array(32).fill(80); }

function emptyPats() {
    return Object.fromEntries(
        ['B','C','D','E','F','G','H'].map(n => [n, { name: n, data: {} }])
    );
}

function mkTrack(uid, type, label, steps, opts) {
    opts = opts || {};
    var def = (typeof TRACK_TYPES !== 'undefined') ? TRACK_TYPES[type] : null;
    var isMelodic = def ? def.melodic : false;
    var color = def ? def.color : '#888888';
    var editMode = opts.editMode !== undefined ? opts.editMode
                 : (isMelodic ? 'pianoroll' : 'steps');
    return {
        uid, type, label,
        color, melodic: isMelodic,
        steps: steps,
        vels: tv(), probs: tv(), gates: tg(),
        lfo: { enabled: false, target: 'filter', rate: 2, depth: 0.3 },
        mute: false,
        sidechain:  opts.sidechain  || false,
        kickType:   opts.kickType   || 'classic',
        hihatType:  opts.hihatType  || 'closed',
        bassType:   opts.bassType   || 'saw',
        padPreset:  opts.padPreset  || 'warm',
        padMode:    opts.padMode    || 'chord',
        volume: opts.volume || 0,
        pan:    opts.pan    || 0,
        fx: opts.fx || { rev: 0, dly: 0, flt: 20000, dist: 0 },
        fxNodes: null, synth: null, extra: null, howl: null, filename: null,
        pianoRoll:     opts.pianoRoll     || [],
        editMode:      editMode,
        pianoRollBars: opts.pianoRollBars || 4,
        part: null,
        activePattern: 'A',
        queuedPattern: null,
    };
}

function mkPats(data1) {
    return Object.assign({ A: { name: 'A', data: data1 } }, emptyPats());
}

const BUILTIN_TEMPLATES = [

    // ── 1. Melodic Techno ─────────────────────────────────────
    // A natural minor · 130 BPM · sidechain pump · dark melody
    {
        id: 'melodic_techno',
        name: 'Melodic Techno',
        icon: '◈',
        bpm: 130,
        key: 'A Minor',
        description: 'Dark, driving 4-on-the-floor met melodische accenten en sidechain pump',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 130, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'melodic_techno', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 2, voiceLead: true,
            pianoSound: 'dark_pad', chordPreset: 'dark_pad',
            attack: 1.5, decay: 0.3, sustain: 0.9, release: 4.0,
            detune: 0, chorus: 0.1, reverb: 0.65, reverbDecay: 5,
            delay: 0.2, distortion: 0, filter: 2500,
            chordVolume: -4, chordMute: false,
            sidechain: { enabled: true, depth: 0.75, release: 0.22 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, null,null,45,null, 45,null,null,null, null,45,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]),
                    { sidechain: true, kickType: 'classic' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]),
                    { fx: { rev: 0.12, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1]),
                    { hihatType: 'closed', volume: -3 }),
                // Bass — step sequencer, saw with hard filter
                mkTrack(4, 'bass',   'BASS',
                    m16([45,null,null,null, null,null,45,null, 45,null,null,null, null,45,null,null]),
                    { editMode: 'steps', bassType: 'saw', fx: { rev: 0, dly: 0, flt: 800, dist: 0 } }),
                // Melody — piano roll, dark A minor
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.3, dly: 0.15, flt: 5000, dist: 0 },
                    pianoRoll: [
                        { id:1,  note:57, start:0,     dur:1.5,  vel:100 }, // A3
                        { id:2,  note:60, start:2,     dur:0.5,  vel:90  }, // C4
                        { id:3,  note:62, start:2.75,  dur:0.75, vel:95  }, // D4
                        { id:4,  note:64, start:4.5,   dur:0.5,  vel:85  }, // E4
                        { id:5,  note:62, start:5.25,  dur:0.25, vel:80  }, // D4
                        { id:6,  note:60, start:6,     dur:1,    vel:90  }, // C4
                        { id:7,  note:57, start:7.5,   dur:0.5,  vel:85  }, // A3
                        { id:8,  note:57, start:8,     dur:0.5,  vel:100 }, // A3
                        { id:9,  note:67, start:8.75,  dur:0.5,  vel:80  }, // G4
                        { id:10, note:64, start:9.5,   dur:0.5,  vel:90  }, // E4
                        { id:11, note:62, start:10.5,  dur:1,    vel:85  }, // D4
                        { id:12, note:60, start:12,    dur:0.5,  vel:90  }, // C4
                        { id:13, note:62, start:12.75, dur:0.25, vel:80  }, // D4
                        { id:14, note:64, start:13.25, dur:0.25, vel:85  }, // E4
                        { id:15, note:57, start:14,    dur:2,    vel:100 }, // A3 long
                    ],
                }),
                // Pad — lush dark chords Am-G-F-Em
                mkTrack(6, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'dark', fx: { rev: 0.5, dly: 0.1, flt: 3000, dist: 0 },
                    volume: -4,
                    pianoRoll: [
                        // Am bar 1
                        { id:1, note:57, start:0,  dur:3.75, vel:80 },
                        { id:2, note:60, start:0,  dur:3.75, vel:75 },
                        { id:3, note:64, start:0,  dur:3.75, vel:70 },
                        // G bar 2
                        { id:4, note:55, start:4,  dur:3.75, vel:80 },
                        { id:5, note:59, start:4,  dur:3.75, vel:75 },
                        { id:6, note:62, start:4,  dur:3.75, vel:70 },
                        // F bar 3
                        { id:7, note:53, start:8,  dur:3.75, vel:80 },
                        { id:8, note:57, start:8,  dur:3.75, vel:75 },
                        { id:9, note:60, start:8,  dur:3.75, vel:70 },
                        // Em bar 4
                        { id:10, note:52, start:12, dur:3.75, vel:80 },
                        { id:11, note:55, start:12, dur:3.75, vel:75 },
                        { id:12, note:59, start:12, dur:3.75, vel:70 },
                    ],
                }),
            ],
        }
    },

    // ── 2. Synthwave ──────────────────────────────────────────
    // A minor · 100 BPM · neon pads · arpeggiator · retro lead
    {
        id: 'synthwave',
        name: 'Synthwave',
        icon: '▶',
        bpm: 100,
        key: 'A Minor',
        description: 'Retro 80s vibes met neon pads, arpeggiator en retro lead melodie',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 100, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'synthwave', progressionSelect: 'i_VI_bVII_bVI',
            chordBars: 4, voiceLead: true,
            pianoSound: 'neon_pad', chordPreset: 'neon_pad',
            attack: 0.8, decay: 0.4, sustain: 0.8, release: 3.0,
            detune: 30, chorus: 0.3, reverb: 0.7, reverbDecay: 4,
            delay: 0.35, distortion: 0, filter: 4000,
            chordVolume: -3, chordMute: false,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: true, mode: 'up', rate: '16n', octaves: 2, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, null,null,null,null, 45,null,null,null, 52,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]),
                    { kickType: 'punchy' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]),
                    { fx: { rev: 0.2, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]),
                    { hihatType: 'crispy' }),
                // Bass — step sequencer, saw with slight detune feel
                mkTrack(4, 'bass',   'BASS',
                    m16([45,null,null,null, null,null,null,null, 45,null,null,null, 52,null,null,null]),
                    { editMode: 'steps', bassType: 'saw', fx: { rev: 0, dly: 0, flt: 1200, dist: 0 } }),
                // Melody — sweeping lead, wide range
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.25, dly: 0.3, flt: 8000, dist: 0.1 },
                    pianoRoll: [
                        { id:1,  note:69, start:0,     dur:0.75, vel:100 }, // A4
                        { id:2,  note:67, start:1,     dur:0.5,  vel:90  }, // G4
                        { id:3,  note:64, start:2,     dur:0.5,  vel:85  }, // E4
                        { id:4,  note:62, start:3,     dur:1,    vel:95  }, // D4
                        { id:5,  note:60, start:4,     dur:1.5,  vel:100 }, // C4
                        { id:6,  note:64, start:6,     dur:0.5,  vel:85  }, // E4
                        { id:7,  note:67, start:7,     dur:1,    vel:90  }, // G4
                        { id:8,  note:69, start:8,     dur:2,    vel:100 }, // A4 long
                        { id:9,  note:67, start:11,    dur:1,    vel:90  }, // G4
                        { id:10, note:64, start:12,    dur:0.75, vel:85  }, // E4
                        { id:11, note:62, start:13,    dur:0.5,  vel:80  }, // D4
                        { id:12, note:60, start:13.75, dur:0.5,  vel:85  }, // C4
                        { id:13, note:57, start:14.5,  dur:1.5,  vel:100 }, // A3
                    ],
                }),
                // Pad — neon lush chords Am-C-G-F
                mkTrack(6, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'lush', fx: { rev: 0.6, dly: 0.2, flt: 5000, dist: 0 },
                    volume: -5,
                    pianoRoll: [
                        // Am
                        { id:1, note:57, start:0,  dur:3.75, vel:85 },
                        { id:2, note:60, start:0,  dur:3.75, vel:80 },
                        { id:3, note:64, start:0,  dur:3.75, vel:75 },
                        { id:4, note:69, start:0,  dur:3.75, vel:70 },
                        // C major
                        { id:5, note:60, start:4,  dur:3.75, vel:85 },
                        { id:6, note:64, start:4,  dur:3.75, vel:80 },
                        { id:7, note:67, start:4,  dur:3.75, vel:75 },
                        // G major
                        { id:8,  note:55, start:8,  dur:3.75, vel:85 },
                        { id:9,  note:59, start:8,  dur:3.75, vel:80 },
                        { id:10, note:62, start:8,  dur:3.75, vel:75 },
                        // F major
                        { id:11, note:53, start:12, dur:3.75, vel:85 },
                        { id:12, note:57, start:12, dur:3.75, vel:80 },
                        { id:13, note:60, start:12, dur:3.75, vel:75 },
                    ],
                }),
            ],
        }
    },

    // ── 3. Deep House ─────────────────────────────────────────
    // A dorian · 122 BPM · swing · jazzy chords · warm sub bass
    {
        id: 'deep_house',
        name: 'Deep House',
        icon: '◉',
        bpm: 122,
        key: 'A Minor',
        description: 'Warm groove met swing, jazzy pads en dorian bassloop',
        scaleType: 'dorian',
        project: {
            version: 2,
            bpm: 122, steps: 16, swing: 0.12,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'deep_house', progressionSelect: 'i_ii_IV_i',
            chordBars: 4, voiceLead: true,
            pianoSound: 'warm_pad', chordPreset: 'warm_pad',
            attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.5,
            detune: 0, chorus: 0.15, reverb: 0.55, reverbDecay: 4,
            delay: 0.25, distortion: 0, filter: 3500,
            chordVolume: -5, chordMute: false,
            sidechain: { enabled: true, depth: 0.6, release: 0.3 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, 47,null,null,null, 48,null,null,null, 45,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]),
                    { sidechain: true }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]),
                    { fx: { rev: 0.15, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1]),
                    { hihatType: 'open', volume: -3 }),
                // Bass — sub, walking dorian line
                mkTrack(4, 'bass',   'BASS',
                    m16([45,null,null,null, 47,null,null,null, 48,null,null,null, 45,null,null,null]),
                    { editMode: 'steps', bassType: 'sub', fx: { rev: 0, dly: 0, flt: 600, dist: 0 } }),
                // Melody — smooth dorian vocal feel (A dorian: A B C D E F# G)
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.4, dly: 0.2, flt: 4000, dist: 0 },
                    pianoRoll: [
                        { id:1,  note:57, start:0,     dur:1.5,  vel:90  }, // A3
                        { id:2,  note:60, start:2,     dur:0.5,  vel:85  }, // C4
                        { id:3,  note:62, start:3,     dur:1,    vel:90  }, // D4
                        { id:4,  note:64, start:4,     dur:0.75, vel:85  }, // E4
                        { id:5,  note:66, start:5,     dur:0.5,  vel:80  }, // F#4
                        { id:6,  note:64, start:6,     dur:0.5,  vel:85  }, // E4
                        { id:7,  note:62, start:7.5,   dur:0.5,  vel:80  }, // D4
                        { id:8,  note:62, start:8,     dur:1,    vel:85  }, // D4
                        { id:9,  note:60, start:9.5,   dur:0.5,  vel:80  }, // C4
                        { id:10, note:59, start:10,    dur:0.75, vel:75  }, // B3
                        { id:11, note:57, start:11,    dur:1,    vel:90  }, // A3
                        { id:12, note:60, start:12,    dur:0.5,  vel:85  }, // C4
                        { id:13, note:62, start:12.75, dur:0.5,  vel:80  }, // D4
                        { id:14, note:64, start:13.5,  dur:0.5,  vel:85  }, // E4
                        { id:15, note:57, start:14.5,  dur:1.5,  vel:95  }, // A3
                    ],
                }),
                // Pad — jazzy Am7-D9-Gmaj7-Cmaj7
                mkTrack(6, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'warm', fx: { rev: 0.45, dly: 0.15, flt: 4000, dist: 0 },
                    volume: -6,
                    pianoRoll: [
                        // Am7
                        { id:1,  note:57, start:0,  dur:3.75, vel:75 },
                        { id:2,  note:60, start:0,  dur:3.75, vel:70 },
                        { id:3,  note:64, start:0,  dur:3.75, vel:70 },
                        { id:4,  note:67, start:0,  dur:3.75, vel:65 },
                        // D9 (D F# A C#)
                        { id:5,  note:62, start:4,  dur:3.75, vel:75 },
                        { id:6,  note:66, start:4,  dur:3.75, vel:70 },
                        { id:7,  note:69, start:4,  dur:3.75, vel:70 },
                        // Gmaj7
                        { id:8,  note:55, start:8,  dur:3.75, vel:75 },
                        { id:9,  note:59, start:8,  dur:3.75, vel:70 },
                        { id:10, note:62, start:8,  dur:3.75, vel:70 },
                        { id:11, note:66, start:8,  dur:3.75, vel:65 },
                        // Cmaj7
                        { id:12, note:60, start:12, dur:3.75, vel:75 },
                        { id:13, note:64, start:12, dur:3.75, vel:70 },
                        { id:14, note:67, start:12, dur:3.75, vel:70 },
                        { id:15, note:71, start:12, dur:3.75, vel:65 },
                    ],
                }),
            ],
        }
    },

    // ── 4. Downtempo ──────────────────────────────────────────
    // F minor · 85 BPM · cinematic · aether pad · spacious melody
    {
        id: 'downtempo',
        name: 'Downtempo',
        icon: '◌',
        bpm: 85,
        key: 'F Minor',
        description: 'Langzame, dromerige sfeer met veel ruimte, aether pads en melodische klanken',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 85, steps: 16, swing: 0,
            rootNote: 'F', keyMode: 'minor',
            genreSelect: 'downtempo', progressionSelect: 'i_VI_bVII_bVI',
            chordBars: 4, voiceLead: true,
            pianoSound: 'aether', chordPreset: 'aether',
            attack: 2.0, decay: 0.5, sustain: 0.7, release: 5.0,
            detune: 0, chorus: 0.2, reverb: 0.8, reverbDecay: 8,
            delay: 0.4, distortion: 0, filter: 3000,
            chordVolume: -3, chordMute: false,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: false, mode: 'up', rate: '8n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -28, ratio: 3, attack: 0.003, release: 0.3, knee: 8, limThreshold: -1.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([53,null,null,null, null,null,null,null, 48,null,null,null, null,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]),
                    { kickType: 'sub' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0]),
                    { fx: { rev: 0.3, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]),
                    { hihatType: 'brushed' }),
                // Bass — 808-style, slow and deep
                mkTrack(4, 'bass',   'BASS',
                    m16([53,null,null,null, null,null,null,null, 48,null,null,null, null,null,null,null]),
                    { editMode: 'steps', bassType: '808', fx: { rev: 0, dly: 0, flt: 500, dist: 0 } }),
                // Melody — cinematic, sparse (F natural minor: F G Ab Bb C Db Eb)
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.6, dly: 0.35, flt: 6000, dist: 0 },
                    pianoRoll: [
                        { id:1,  note:65, start:0,    dur:2,   vel:85  }, // F4 long
                        { id:2,  note:63, start:5,    dur:1,   vel:80  }, // Eb4
                        { id:3,  note:61, start:7,    dur:1,   vel:75  }, // Db4
                        { id:4,  note:60, start:9,    dur:1.5, vel:80  }, // C4
                        { id:5,  note:58, start:11,   dur:0.75,vel:75  }, // Bb3
                        { id:6,  note:53, start:12,   dur:2,   vel:90  }, // F3 low
                        { id:7,  note:60, start:15,   dur:1,   vel:80  }, // C4
                    ],
                    pianoRollBars: 4,
                }),
                // Pad — aether lush Fm-Dbmaj-Abmaj-Ebmaj
                mkTrack(6, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'aether', fx: { rev: 0.7, dly: 0.3, flt: 3000, dist: 0 },
                    volume: -4,
                    pianoRoll: [
                        // Fm
                        { id:1,  note:53, start:0,  dur:3.9, vel:70 },
                        { id:2,  note:56, start:0,  dur:3.9, vel:65 },
                        { id:3,  note:60, start:0,  dur:3.9, vel:65 },
                        // Dbmaj
                        { id:4,  note:49, start:4,  dur:3.9, vel:70 },
                        { id:5,  note:53, start:4,  dur:3.9, vel:65 },
                        { id:6,  note:56, start:4,  dur:3.9, vel:65 },
                        // Abmaj
                        { id:7,  note:56, start:8,  dur:3.9, vel:70 },
                        { id:8,  note:60, start:8,  dur:3.9, vel:65 },
                        { id:9,  note:63, start:8,  dur:3.9, vel:65 },
                        // Ebmaj
                        { id:10, note:51, start:12, dur:3.9, vel:70 },
                        { id:11, note:55, start:12, dur:3.9, vel:65 },
                        { id:12, note:58, start:12, dur:3.9, vel:65 },
                    ],
                }),
            ],
        }
    },

    // ── 5. Drum & Bass ────────────────────────────────────────
    // A minor · 174 BPM · breakbeat · growl bass · saw lead
    {
        id: 'drum_and_bass',
        name: 'Drum & Bass',
        icon: '▲',
        bpm: 174,
        key: 'A Minor',
        description: 'Snel, energiek breakbeat met rollende bas en scherpe saw lead',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 174, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'drum_and_bass', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 2, voiceLead: true,
            pianoSound: 'saw_lead', chordPreset: 'saw_lead',
            attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.8,
            detune: 0, chorus: 0.1, reverb: 0.3, reverbDecay: 2.5,
            delay: 0.15, distortion: 0.1, filter: 5000,
            chordVolume: -6, chordMute: true,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -20, ratio: 5, attack: 0.001, release: 0.2, knee: 4, limThreshold: -0.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,1, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,45,null, null,45,null,null, 48,null,null,45, null,null,45,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]),
                    { kickType: 'punchy' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,1, 0,0,1,0]),
                    { fx: { rev: 0.08, dly: 0, flt: 20000, dist: 0.1 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1]),
                    { hihatType: 'crispy' }),
                // Bass — growl, dist
                mkTrack(4, 'bass',   'BASS',
                    m16([45,null,45,null, null,45,null,null, 48,null,null,45, null,null,45,null]),
                    { editMode: 'steps', bassType: 'growl', fx: { rev: 0, dly: 0, flt: 1800, dist: 0.15 } }),
                // Melody — aggressive punchy lead
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.15, dly: 0.1, flt: 7000, dist: 0.05 },
                    pianoRoll: [
                        { id:1,  note:64, start:0,     dur:0.25, vel:100 }, // E4
                        { id:2,  note:67, start:0.5,   dur:0.25, vel:95  }, // G4
                        { id:3,  note:69, start:1,     dur:0.5,  vel:100 }, // A4
                        { id:4,  note:67, start:1.75,  dur:0.25, vel:90  }, // G4
                        { id:5,  note:65, start:2.5,   dur:0.25, vel:85  }, // F4
                        { id:6,  note:64, start:3,     dur:0.5,  vel:95  }, // E4
                        { id:7,  note:69, start:4,     dur:0.5,  vel:100 }, // A4
                        { id:8,  note:72, start:4.75,  dur:0.25, vel:95  }, // C5
                        { id:9,  note:74, start:5,     dur:0.5,  vel:100 }, // D5
                        { id:10, note:72, start:5.75,  dur:0.25, vel:85  }, // C5
                        { id:11, note:69, start:6.5,   dur:1.5,  vel:100 }, // A4 held
                        { id:12, note:67, start:8,     dur:0.5,  vel:95  }, // G4
                        { id:13, note:69, start:8.75,  dur:0.25, vel:90  }, // A4
                        { id:14, note:72, start:9,     dur:0.5,  vel:100 }, // C5
                        { id:15, note:69, start:10,    dur:0.25, vel:85  }, // A4
                        { id:16, note:67, start:10.5,  dur:0.5,  vel:90  }, // G4
                        { id:17, note:64, start:11,    dur:1,    vel:95  }, // E4
                        { id:18, note:62, start:12,    dur:0.25, vel:80  }, // D4
                        { id:19, note:64, start:12.5,  dur:0.25, vel:85  }, // E4
                        { id:20, note:67, start:13,    dur:0.25, vel:90  }, // G4
                        { id:21, note:69, start:13.5,  dur:0.75, vel:95  }, // A4
                        { id:22, note:64, start:14.5,  dur:1.5,  vel:100 }, // E4 held
                    ],
                }),
            ],
        }
    },

    // ── 6. Acid House ────────────────────────────────────────
    // C minor · 130 BPM · 303 saw bass · pumping kick · acid lead
    {
        id: 'acid_house',
        name: 'Acid House',
        icon: '◎',
        bpm: 130,
        key: 'C Minor',
        description: '303 zuur baslijnen, stampende kick en hypnotische acid lead',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 130, steps: 16, swing: 0,
            rootNote: 'C', keyMode: 'minor',
            genreSelect: 'acid_house', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 2, voiceLead: false,
            pianoSound: 'dark_pad', chordPreset: 'dark_pad',
            attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5,
            detune: 0, chorus: 0.05, reverb: 0.25, reverbDecay: 2,
            delay: 0.1, distortion: 0.2, filter: 2000,
            chordVolume: -8, chordMute: true,
            sidechain: { enabled: true, depth: 0.8, release: 0.18 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -22, ratio: 4, attack: 0.002, release: 0.2, knee: 5, limThreshold: -0.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([60,null,60,null, 63,null,60,null, null,60,null,null, 58,null,60,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]),
                    { sidechain: true, kickType: 'classic' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]),
                    { fx: { rev: 0.1, dly: 0, flt: 20000, dist: 0.05 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]),
                    { hihatType: 'closed', volume: -6 }),
                // Bass — 303 acid saw, tight gate, heavy filter+dist
                mkTrack(4, 'bass',   'BASS',
                    m16([60,null,60,null, 63,null,60,null, null,60,null,null, 58,null,60,null]),
                    { editMode: 'steps', bassType: 'saw', fx: { rev: 0, dly: 0, flt: 600, dist: 0.25 }, volume: -3 }),
                // Melody — acid lead, repetitive riff
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.2, dly: 0.2, flt: 4000, dist: 0.15 },
                    pianoRoll: [
                        { id:1,  note:60, start:0,     dur:0.5,  vel:100 }, // C4
                        { id:2,  note:63, start:1,     dur:0.5,  vel:95  }, // Eb4
                        { id:3,  note:67, start:2,     dur:0.25, vel:90  }, // G4
                        { id:4,  note:65, start:2.5,   dur:0.25, vel:85  }, // F4
                        { id:5,  note:63, start:3,     dur:0.75, vel:90  }, // Eb4
                        { id:6,  note:62, start:4.25,  dur:0.25, vel:80  }, // D4
                        { id:7,  note:60, start:4.75,  dur:0.25, vel:85  }, // C4
                        { id:8,  note:58, start:5,     dur:1,    vel:90  }, // Bb3
                        { id:9,  note:60, start:6,     dur:0.5,  vel:85  }, // C4
                        { id:10, note:62, start:7,     dur:0.75, vel:80  }, // D4
                        { id:11, note:63, start:8,     dur:0.5,  vel:95  }, // Eb4
                        { id:12, note:67, start:9,     dur:0.25, vel:90  }, // G4
                        { id:13, note:68, start:9.5,   dur:0.5,  vel:85  }, // Ab4
                        { id:14, note:67, start:10,    dur:0.5,  vel:90  }, // G4
                        { id:15, note:63, start:11,    dur:1,    vel:95  }, // Eb4
                        { id:16, note:60, start:12,    dur:0.5,  vel:100 }, // C4
                        { id:17, note:62, start:13,    dur:0.5,  vel:90  }, // D4
                        { id:18, note:63, start:14,    dur:0.5,  vel:95  }, // Eb4
                        { id:19, note:60, start:14.75, dur:1.25, vel:100 }, // C4 long
                    ],
                }),
            ],
        }
    },

    // ── 7. Minimal Techno ────────────────────────────────────
    // D minor · 132 BPM · very sparse · hypnotic · slow chord changes
    {
        id: 'minimal_techno',
        name: 'Minimal Techno',
        icon: '▪',
        bpm: 132,
        key: 'D Minor',
        description: 'Hypnotische minimalisme met ruimte, subtiele pads en strakke kick',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 132, steps: 16, swing: 0,
            rootNote: 'D', keyMode: 'minor',
            genreSelect: 'minimal_techno', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 4, voiceLead: true,
            pianoSound: 'dark_pad', chordPreset: 'dark_pad',
            attack: 2.0, decay: 0.3, sustain: 1.0, release: 6.0,
            detune: 5, chorus: 0.05, reverb: 0.7, reverbDecay: 7,
            delay: 0.15, distortion: 0, filter: 2000,
            chordVolume: -8, chordMute: false,
            sidechain: { enabled: true, depth: 0.5, release: 0.3 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -26, ratio: 4, attack: 0.003, release: 0.3, knee: 8, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([50,null,null,null, null,null,50,null, null,null,null,null, 55,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]),
                    { kickType: 'tight' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0]),
                    { fx: { rev: 0.2, dly: 0, flt: 20000, dist: 0 }, volume: -4 }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,1]),
                    { hihatType: 'pedal', volume: -5 }),
                // Bass — minimal sub, slow movement (D minor: D E F G A Bb C)
                mkTrack(4, 'bass',   'BASS',
                    m16([50,null,null,null, null,null,50,null, null,null,null,null, 55,null,null,null]),
                    { editMode: 'steps', bassType: 'sub', fx: { rev: 0, dly: 0, flt: 400, dist: 0 } }),
                // Pad — very sparse, nearly a drone. Dm-C-Bb-Am
                mkTrack(5, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'dark', fx: { rev: 0.65, dly: 0.1, flt: 2500, dist: 0 },
                    volume: -5,
                    pianoRoll: [
                        // Dm
                        { id:1,  note:62, start:0,  dur:3.9, vel:65 },
                        { id:2,  note:65, start:0,  dur:3.9, vel:60 },
                        { id:3,  note:69, start:0,  dur:3.9, vel:55 },
                        // C major
                        { id:4,  note:60, start:4,  dur:3.9, vel:65 },
                        { id:5,  note:64, start:4,  dur:3.9, vel:60 },
                        { id:6,  note:67, start:4,  dur:3.9, vel:55 },
                        // Bb major
                        { id:7,  note:58, start:8,  dur:3.9, vel:65 },
                        { id:8,  note:62, start:8,  dur:3.9, vel:60 },
                        { id:9,  note:65, start:8,  dur:3.9, vel:55 },
                        // Am
                        { id:10, note:57, start:12, dur:3.9, vel:65 },
                        { id:11, note:60, start:12, dur:3.9, vel:60 },
                        { id:12, note:64, start:12, dur:3.9, vel:55 },
                    ],
                }),
                // Melody — very sparse, just a few notes
                mkTrack(6, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.5, dly: 0.25, flt: 3500, dist: 0 },
                    volume: -4,
                    pianoRoll: [
                        { id:1, note:62, start:0.5,  dur:0.5,  vel:80  }, // D4
                        { id:2, note:65, start:2,    dur:1,    vel:75  }, // F4
                        { id:3, note:67, start:5,    dur:1.5,  vel:80  }, // G4
                        { id:4, note:64, start:8,    dur:0.5,  vel:75  }, // E4
                        { id:5, note:62, start:9.5,  dur:2,    vel:80  }, // D4
                        { id:6, note:60, start:12.5, dur:0.5,  vel:70  }, // C4
                        { id:7, note:62, start:14,   dur:2,    vel:85  }, // D4
                    ],
                }),
            ],
        }
    },

    // ── 8. Trance ─────────────────────────────────────────────
    // A minor · 138 BPM · uplifting lead · lush pads · driving bass
    {
        id: 'trance',
        name: 'Trance',
        icon: '◆',
        bpm: 138,
        key: 'A Minor',
        description: 'Opzwepende melodie, volle pads en een stampende trance kick',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 138, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'trance', progressionSelect: 'i_VI_bVII_IV',
            chordBars: 4, voiceLead: true,
            pianoSound: 'lush', chordPreset: 'lush',
            attack: 1.0, decay: 0.4, sustain: 0.9, release: 3.5,
            detune: 15, chorus: 0.2, reverb: 0.6, reverbDecay: 4,
            delay: 0.25, distortion: 0, filter: 6000,
            chordVolume: -4, chordMute: false,
            sidechain: { enabled: true, depth: 0.65, release: 0.2 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -22, ratio: 4, attack: 0.002, release: 0.22, knee: 5, limThreshold: -0.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([57,null,57,null, 57,null,57,null, 55,null,55,null, 55,null,55,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 7,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]),
                    { sidechain: true, kickType: 'punchy' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]),
                    { fx: { rev: 0.25, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]),
                    { hihatType: 'open', volume: -4 }),
                // Bass — trance pumping saw 8ths (A3=57, G3=55)
                mkTrack(4, 'bass',   'BASS',
                    m16([57,null,57,null, 57,null,57,null, 55,null,55,null, 55,null,55,null]),
                    { editMode: 'steps', bassType: 'saw', fx: { rev: 0, dly: 0, flt: 1000, dist: 0 } }),
                // Melody — uplifting trance lead
                mkTrack(5, 'melody', 'MELODY', Array(32).fill(null), {
                    fx: { rev: 0.2, dly: 0.25, flt: 8000, dist: 0 },
                    pianoRoll: [
                        { id:1,  note:69, start:0,     dur:0.5,  vel:100 }, // A4
                        { id:2,  note:71, start:0.75,  dur:0.25, vel:90  }, // B4
                        { id:3,  note:72, start:1,     dur:0.5,  vel:100 }, // C5
                        { id:4,  note:76, start:1.75,  dur:0.25, vel:95  }, // E5
                        { id:5,  note:74, start:2,     dur:0.5,  vel:95  }, // D5
                        { id:6,  note:72, start:3,     dur:1,    vel:100 }, // C5
                        { id:7,  note:71, start:4,     dur:0.5,  vel:90  }, // B4
                        { id:8,  note:69, start:4.75,  dur:0.25, vel:85  }, // A4
                        { id:9,  note:67, start:5,     dur:0.75, vel:90  }, // G4
                        { id:10, note:69, start:6,     dur:0.5,  vel:90  }, // A4
                        { id:11, note:71, start:6.75,  dur:0.25, vel:85  }, // B4
                        { id:12, note:72, start:7,     dur:1,    vel:95  }, // C5
                        { id:13, note:76, start:8,     dur:1,    vel:100 }, // E5
                        { id:14, note:74, start:9,     dur:0.5,  vel:95  }, // D5
                        { id:15, note:72, start:10,    dur:0.5,  vel:90  }, // C5
                        { id:16, note:71, start:10.75, dur:0.25, vel:85  }, // B4
                        { id:17, note:69, start:11,    dur:0.5,  vel:90  }, // A4
                        { id:18, note:67, start:11.75, dur:0.25, vel:80  }, // G4
                        { id:19, note:69, start:12,    dur:2,    vel:100 }, // A4 held
                        { id:20, note:72, start:14.5,  dur:0.5,  vel:95  }, // C5
                        { id:21, note:69, start:15.25, dur:0.75, vel:90  }, // A4
                    ],
                }),
                // Pad — lush chords Am-F-C-G
                mkTrack(6, 'pad', 'PAD', Array(32).fill(null), {
                    padPreset: 'lush', fx: { rev: 0.55, dly: 0.15, flt: 6000, dist: 0 },
                    volume: -5,
                    pianoRoll: [
                        // Am
                        { id:1,  note:57, start:0,  dur:3.75, vel:80 },
                        { id:2,  note:64, start:0,  dur:3.75, vel:75 },
                        { id:3,  note:69, start:0,  dur:3.75, vel:70 },
                        // F major
                        { id:4,  note:53, start:4,  dur:3.75, vel:80 },
                        { id:5,  note:60, start:4,  dur:3.75, vel:75 },
                        { id:6,  note:65, start:4,  dur:3.75, vel:70 },
                        // C major
                        { id:7,  note:60, start:8,  dur:3.75, vel:80 },
                        { id:8,  note:67, start:8,  dur:3.75, vel:75 },
                        { id:9,  note:72, start:8,  dur:3.75, vel:70 },
                        // G major
                        { id:10, note:55, start:12, dur:3.75, vel:80 },
                        { id:11, note:62, start:12, dur:3.75, vel:75 },
                        { id:12, note:67, start:12, dur:3.75, vel:70 },
                    ],
                }),
            ],
        }
    },

];

// ── Template Modal UI ────────────────────────────────────────

function openTemplateModal() {
    document.getElementById('templateModal').classList.add('open');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('open');
}

async function loadTemplate(tpl) {
    closeTemplateModal();
    const scaleEl = document.getElementById('scaleType');
    if (scaleEl && tpl.scaleType) scaleEl.value = tpl.scaleType;
    await loadProjectData(tpl.project);
    await loadProgression();
    await loadScale();
    setStatus('Template geladen: ' + tpl.name, 'ok');
}

function buildTemplateModal() {
    if (document.getElementById('templateModal')) return;

    const modal = document.createElement('div');
    modal.id = 'templateModal';
    modal.className = 'tmpl-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'tmpl-backdrop';
    backdrop.addEventListener('click', closeTemplateModal);

    const dialog = document.createElement('div');
    dialog.className = 'tmpl-dialog';

    const header = document.createElement('div');
    header.className = 'tmpl-header';
    header.innerHTML =
        '<span class="tmpl-title">Startpacks</span>' +
        '<span class="tmpl-subtitle">Kies een genre om direct mee aan de slag te gaan</span>' +
        '<button class="tmpl-close" id="tmplClose">×</button>';

    const grid = document.createElement('div');
    grid.className = 'tmpl-grid';

    BUILTIN_TEMPLATES.forEach(function(tpl) {
        const card = document.createElement('div');
        card.className = 'tmpl-card';
        card.innerHTML =
            '<div class="tmpl-icon">' + tpl.icon + '</div>' +
            '<div class="tmpl-name">' + tpl.name + '</div>' +
            '<div class="tmpl-tags">' +
                '<span class="tmpl-tag">' + tpl.bpm + ' BPM</span>' +
                '<span class="tmpl-tag">' + tpl.key + '</span>' +
            '</div>' +
            '<div class="tmpl-desc">' + tpl.description + '</div>' +
            '<button class="tmpl-load-btn">Laden</button>';
        card.querySelector('.tmpl-load-btn').addEventListener('click', function() {
            loadTemplate(tpl);
        });
        grid.appendChild(card);
    });

    dialog.appendChild(header);
    dialog.appendChild(grid);
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    document.getElementById('tmplClose').addEventListener('click', closeTemplateModal);
}

// Init
(function() {
    function init() {
        buildTemplateModal();
        var btn = document.getElementById('btnTemplates');
        if (btn) btn.addEventListener('click', openTemplateModal);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
