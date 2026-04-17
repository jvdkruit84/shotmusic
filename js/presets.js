// ── Track type registry ────────────────────────────────────
const TRACK_TYPES = {
    kick:   { label:'Kick',   color:'#e03131', melodic:false },
    snare:  { label:'Snare',  color:'#f76707', melodic:false },
    hihat:  { label:'Hi-Hat', color:'#f59f00', melodic:false },
    bass:   { label:'Bass',   color:'#7950f2', melodic:true  },
    melody: { label:'Melody', color:'#4c6ef5', melodic:true  },
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
const BASS_PRESETS = {
    saw:    { osc:'sawtooth', env:{attack:.01, decay:.12,sustain:.5, release:.2},  fe:{base:200,oct:3,  atk:.01, dec:.1,  sus:.5, rel:.2},  vol:-6  },
    sub:    { osc:'sine',     env:{attack:.01, decay:.25,sustain:.8, release:.4},  fe:{base:60, oct:1.5,atk:.01, dec:.2,  sus:.6, rel:.3},  vol:-4  },
    punchy: { osc:'square',   env:{attack:.005,decay:.08, sustain:.3, release:.1}, fe:{base:300,oct:4,  atk:.001,dec:.06, sus:.2, rel:.1},  vol:-5  },
    '808':  { osc:'sine',     env:{attack:.01, decay:.7,  sustain:.4, release:.6}, fe:{base:80, oct:2,  atk:.01, dec:.5,  sus:.3, rel:.4},  vol:-3  },
    pluck:  { osc:'triangle', env:{attack:.005,decay:.18, sustain:0,  release:.2}, fe:{base:500,oct:3,  atk:.001,dec:.15, sus:0,  rel:.1},  vol:-7  },
    fm:     { osc:'fm' },  // FMSynth, handled separately
    growl:  { osc:'sawtooth', env:{attack:.01, decay:.2,  sustain:.6, release:.2}, fe:{base:150,oct:5,  atk:.01, dec:.15, sus:.4, rel:.2},  vol:-12, dist:true },
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
        vels: Array(32).fill(100),
        probs: Array(32).fill(100),
        mute:false, sidechain:false, kickType:'classic', bassType:'saw',
        volume:0, pan:0,
        synth:null, extra:null, howl:null, filename:null,
        fx:{ rev: type==='melody'?.3:0, dly:0, flt:20000, dist:0 }, fxNodes:null,
        lfo:{ enabled:false, target:'filter', rate:2, depth:0.3 }, lfoNode:null,
    }, overrides);
}
