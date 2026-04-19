// ── Track type registry ────────────────────────────────────
const TRACK_TYPES = {
    kick:   { label:'Kick',   color:'#e03131', melodic:false },
    snare:  { label:'Snare',  color:'#f76707', melodic:false },
    hihat:  { label:'Hi-Hat', color:'#f59f00', melodic:false },
    bass:   { label:'Bass',   color:'#7950f2', melodic:true  },
    melody: { label:'Melody', color:'#4c6ef5', melodic:true  },
    pad:    { label:'Pad',    color:'#20c997', melodic:true  },
    sample: { label:'Sample', color:'#0ea5e9', melodic:false },
};

// Kick presets
const KICK_PRESETS = {
    classic:  { pitchDecay:.05, octaves:6,  envelope:{attack:.001,decay:.35,sustain:0,release:.10}, volume:-4  },
    punchy:   { pitchDecay:.02, octaves:5,  envelope:{attack:.001,decay:.18,sustain:0,release:.05}, volume:-2  },
    '808':    { pitchDecay:.50, octaves:8,  envelope:{attack:.001,decay:.80,sustain:0,release:.30}, volume:-4  },
    sub:      { pitchDecay:.12, octaves:10, envelope:{attack:.001,decay:.60,sustain:0,release:.20}, volume:-2  },
    tight:    { pitchDecay:.01, octaves:4,  envelope:{attack:.001,decay:.12,sustain:0,release:.04}, volume:-3  },
    distorted:{ pitchDecay:.04, octaves:5,  envelope:{attack:.001,decay:.25,sustain:0,release:.08}, volume:-8  },
    acoustic: { pitchDecay:.03, octaves:3,  envelope:{attack:.002,decay:.22,sustain:0,release:.06}, volume:-4  },
};

// Bass synth presets
// osc: string (waveform) or object {type, count, spread} for fat oscillators
// fe: filter envelope {base, oct, atk, dec, sus, rel}
// filter: optional {Q} for resonance
// dist: add distortion node
// am: use AMSynth instead of MonoSynth
const BASS_PRESETS = {
    // ── Classic ───────────────────────────────────────────────
    saw:     { osc:'sawtooth',  env:{attack:.01, decay:.12, sustain:.5, release:.2},  fe:{base:200,oct:3,  atk:.01, dec:.1,  sus:.5, rel:.2},  vol:-6  },
    sub:     { osc:'sine',      env:{attack:.01, decay:.25, sustain:.8, release:.4},  fe:{base:60, oct:1.5,atk:.01, dec:.2,  sus:.6, rel:.3},  vol:-4  },
    punchy:  { osc:'square',    env:{attack:.005,decay:.08, sustain:.3, release:.1},  fe:{base:300,oct:4,  atk:.001,dec:.06, sus:.2, rel:.1},  vol:-5  },
    '808':   { osc:'sine',      env:{attack:.01, decay:.7,  sustain:.4, release:.6},  fe:{base:80, oct:2,  atk:.01, dec:.5,  sus:.3, rel:.4},  vol:-3  },
    pluck:   { osc:'triangle',  env:{attack:.005,decay:.18, sustain:0,  release:.2},  fe:{base:500,oct:3,  atk:.001,dec:.15, sus:0,  rel:.1},  vol:-7  },
    fm:      { osc:'fm' },      // FMSynth, handled separately
    growl:   { osc:'sawtooth',  env:{attack:.01, decay:.2,  sustain:.6, release:.2},  fe:{base:150,oct:5,  atk:.01, dec:.15, sus:.4, rel:.2},  vol:-12, dist:true },

    // ── New additions ─────────────────────────────────────────
    // Reese — classic jungle/DnB: drie gespreide zaagzagen, donker filter
    reese:   { osc:{type:'fatsawtooth',count:3,spread:30},
               env:{attack:.01, decay:.4,  sustain:.7, release:.4},
               fe:{base:120,oct:2,  atk:.01, dec:.4,  sus:.5, rel:.3},
               filter:{Q:3}, vol:-11 },

    // Moog — warme analoge bas met karakteristieke resonantie
    moog:    { osc:'sawtooth',  env:{attack:.008,decay:.25, sustain:.6, release:.35},
               fe:{base:350,oct:3.5,atk:.005,dec:.18, sus:.4, rel:.25},
               filter:{Q:5}, vol:-7  },

    // Acid — TB-303 stijl: snelle filter-sweep, hoge resonantie
    acid:    { osc:'sawtooth',  env:{attack:.002,decay:.12, sustain:.25,release:.15},
               fe:{base:600,oct:4.5,atk:.001,dec:.09, sus:.1, rel:.1},
               filter:{Q:10}, vol:-8  },

    // Electric — elektrische bas gitaar gevoel: driehoek, snelle transient
    electric:{ osc:'triangle',  env:{attack:.003,decay:.35, sustain:.5, release:.25},
               fe:{base:700,oct:2,  atk:.001,dec:.28, sus:.4, rel:.2},
               filter:{Q:2}, vol:-6  },

    // Stab — scherpe staccato bas, zoals in house/garage
    stab:    { osc:'square',    env:{attack:.001,decay:.07, sustain:.0, release:.08},
               fe:{base:500,oct:4,  atk:.001,dec:.05, sus:.0, rel:.05},
               vol:-5  },

    // Liquid — vloeiend, rond, goed voor deep house / lounge
    liquid:  { osc:'triangle',  env:{attack:.02, decay:.5,  sustain:.65,release:.5},
               fe:{base:280,oct:2.5,atk:.04, dec:.4,  sus:.5, rel:.4},
               filter:{Q:1.5}, vol:-7  },

    // Rubber — elastisch, 'bouncy' gevoel, pitch-decay via sine + dist
    rubber:  { osc:'sine',      env:{attack:.002,decay:.5,  sustain:.3, release:.4},
               fe:{base:100,oct:5,  atk:.001,dec:.35, sus:.2, rel:.3},
               dist:true, vol:-9  },

    // Wobble — brede fat-saw klaar voor LFO op filter (dubstep/bass music)
    wobble:  { osc:{type:'fatsawtooth',count:2,spread:15},
               env:{attack:.01, decay:.3,  sustain:.8, release:.3},
               fe:{base:200,oct:3,  atk:.01, dec:.2,  sus:.6, rel:.3},
               filter:{Q:6}, vol:-10,
               autoLfo:{ target:'filter', rate:4, depth:0.7 } },

    // Vintage — warme vintage synth bas, à la Minimoog / Juno
    vintage: { osc:{type:'fatsawtooth',count:2,spread:8},
               env:{attack:.012,decay:.2,  sustain:.7, release:.4},
               fe:{base:300,oct:2.5,atk:.01, dec:.15, sus:.5, rel:.3},
               filter:{Q:2.5}, vol:-8  },

    // Atari — retro 8-bit bas, harde blokgolf
    atari:   { osc:'square',    env:{attack:.001,decay:.18, sustain:.6, release:.2},
               fe:{base:800,oct:1.5,atk:.001,dec:.1,  sus:.5, rel:.15},
               vol:-6  },
};

// Pad synth presets (long attack, slow release)
const PAD_PRESETS = {
    warm:    { osc:{type:'amsine2'},                         env:{attack:.8,  decay:.5, sustain:.8, release:2.5}, vol:-12 },
    lush:    { osc:{type:'fatsawtooth',count:3,spread:25},   env:{attack:1.2, decay:.4, sustain:.8, release:3.0}, vol:-15 },
    dark:    { osc:{type:'fattriangle',count:2,spread:10},   env:{attack:1.5, decay:.3, sustain:.9, release:4.0}, vol:-11 },
    aether:  { osc:{type:'fmsine'},                          env:{attack:2.0, decay:.5, sustain:.7, release:5.0}, vol:-13 },
    strings: { osc:{type:'fatsawtooth',count:4,spread:18},   env:{attack:.6,  decay:.2, sustain:.9, release:2.0}, vol:-15 },
    glass:   { osc:{type:'fmsine'},                          env:{attack:.01, decay:2.5,sustain:0,  release:3.0}, vol:-14 },
    choir:   { osc:{type:'amsine3'},                         env:{attack:1.0, decay:.4, sustain:.85,release:3.5}, vol:-14 },
};

// Hi-hat presets (NoiseSynth + internal highpass filter)
const HIHAT_PRESETS = {
    closed:  { noise:'white', hpFreq:8000,  env:{attack:.001,decay:.08, sustain:0,   release:.02},  vol:-12 },
    open:    { noise:'white', hpFreq:6000,  env:{attack:.001,decay:.38, sustain:.08, release:.22},  vol:-14 },
    pedal:   { noise:'pink',  hpFreq:10000, env:{attack:.001,decay:.04, sustain:0,   release:.01},  vol:-10 },
    crispy:  { noise:'white', hpFreq:12000, env:{attack:.001,decay:.05, sustain:0,   release:.01},  vol:-11 },
    vinyl:   { noise:'pink',  hpFreq:5000,  env:{attack:.001,decay:.14, sustain:0,   release:.05},  vol:-13 },
    brushed: { noise:'pink',  hpFreq:3000,  env:{attack:.005,decay:.22, sustain:.05, release:.14},  vol:-13 },
};

// MIDI drum note pools per type
const DRUM_NOTES = { kick:[36,35,41,45], snare:[38,40,37,39], hihat:[42,44,46,51] };

// ── Dynamic track list ─────────────────────────────────────

function makeTrack(type, overrides={}) {
    const def  = TRACK_TYPES[type];
    const uid  = SEQ.nextUid++;
    const same = SEQ.tracks.filter(t=>t.type===type).length;
    const label = same===0 ? def.label.toUpperCase() : def.label.toUpperCase()+' '+(same+1);
    return Object.assign({
        uid, type, label, color:def.color, melodic:def.melodic,
        steps: Array(32).fill(def.melodic ? null : 0),
        vels:  Array(32).fill(100),
        probs: Array(32).fill(100),
        gates: Array(32).fill(80),
        mute:false, sidechain:false, kickType:'classic', bassType:'saw', hihatType:'closed',
        padPreset:'warm', padMode:'chord',
        volume:0, pan:0,
        synth:null, extra:null, howl:null, filename:null,
        fx:{ rev: (type==='melody'||type==='pad')?.3:0, dly:0, flt:20000, dist:0 }, fxNodes:null,
        lfo:{ enabled:false, target:'filter', rate:2, depth:0.3 }, lfoNode:null,
        // Piano roll — melodic tracks default to pianoroll mode
        pianoRoll: [], editMode: def.melodic ? 'pianoroll' : 'steps', pianoRollBars: 4, part: null,
        // Clip launcher
        activePattern: 'A', queuedPattern: null,
        // MIDI output
        midiOut: { enabled: false,
            channel: {kick:10,snare:10,hihat:10,bass:2,melody:3,pad:4,sample:10}[type] || 1,
            drumNote: {kick:36,snare:38,hihat:42,sample:38}[type] || null },
    }, overrides);
}
