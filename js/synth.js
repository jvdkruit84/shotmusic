// ── Audio init ─────────────────────────────────────────────
function buildMasterBus() {
    try { masterComp?.dispose(); masterLimiter?.dispose(); masterMeter?.dispose(); } catch(e) {}
    masterMeter   = new Tone.Meter({ smoothing:0.85 });
    vizFft        = new Tone.Analyser('fft', 1024);
    vizWave       = new Tone.Analyser('waveform', 1024);
    masterLimiter = new Tone.Limiter(MASTER.limThreshold).toDestination();
    masterLimiter.connect(masterMeter);
    masterLimiter.connect(vizFft);
    masterLimiter.connect(vizWave);
    masterComp    = new Tone.Compressor({
        threshold: MASTER.threshold, ratio: MASTER.ratio,
        attack: MASTER.attack, release: MASTER.release, knee: MASTER.knee,
    }).connect(masterLimiter);
    if (!MASTER.compEnabled) { masterComp.ratio.value = 1; masterComp.threshold.value = 0; }
}

function getMasterInput() { return masterComp ?? Tone.getDestination(); }

async function startAudio() {
    if (S.audioReady) return;
    await Tone.start();
    S.audioReady = true;
    buildMasterBus();
    if (typeof startMasterAnimation === 'function') startMasterAnimation();
    buildChordSynth(getPreset());
    buildAllSynths();
    setStatus('Audio klaar','ok');
}

// ── Chord synth presets ─────────────────────────────────────
const CHORD_PRESETS = {
    // Pads
    warm_pad:   { osc:{type:'amsine2'},                        env:{attack:.8, decay:.5, sustain:.8, release:2.5}, vol:-12, detune:0   },
    lush_pad:   { osc:{type:'fatsawtooth', count:3, spread:25},env:{attack:1.2,decay:.4, sustain:.8, release:3.0}, vol:-15, detune:20  },
    dark_pad:   { osc:{type:'fattriangle',count:2, spread:10}, env:{attack:1.5,decay:.3, sustain:.9, release:4.0}, vol:-11, detune:0, filter:900  },
    strings:    { osc:{type:'fatsawtooth', count:4, spread:18},env:{attack:.6, decay:.2, sustain:.9, release:2.0}, vol:-15, detune:15  },
    aether:     { osc:{type:'fmsine'},                         env:{attack:2.0,decay:.5, sustain:.7, release:5.0}, vol:-13, detune:0   },
    choir:      { osc:{type:'amsine3'},                        env:{attack:1.0,decay:.4, sustain:.85,release:3.5}, vol:-14, detune:18  },
    glass_pad:  { osc:{type:'fmsine'},                         env:{attack:.01,decay:2.5,sustain:0,  release:3.0}, vol:-14, detune:0   },
    ambient:    { osc:{type:'amsine2'},                        env:{attack:3.0,decay:1.0,sustain:.6, release:6.0}, vol:-13, detune:35  },
    // Leads
    saw_lead:   { osc:{type:'sawtooth'},                       env:{attack:.02,decay:.3, sustain:.6, release:.8},  vol:-14, detune:0   },
    square_lead:{ osc:{type:'square'},                         env:{attack:.01,decay:.2, sustain:.7, release:.5},  vol:-17, detune:0   },
    fm_lead:    { osc:{type:'fmsawtooth'},                     env:{attack:.01,decay:.15,sustain:.5, release:.4},  vol:-14, detune:0   },
    pulse_lead: { osc:{type:'pulse',  width:.3},               env:{attack:.02,decay:.2, sustain:.6, release:.6},  vol:-14, detune:0   },
    moog_lead:  { osc:{type:'fatsquare', count:2, spread:5},   env:{attack:.03,decay:.3, sustain:.65,release:.6},  vol:-15, detune:0, filter:2200 },
    dist_lead:  { osc:{type:'fatsawtooth',count:2,spread:8},   env:{attack:.005,decay:.1,sustain:.85,release:.3},  vol:-18, detune:5   },
    whistle:    { osc:{type:'sine'},                           env:{attack:.08,decay:.1, sustain:.9, release:.4},  vol:-11, detune:0   },
    // Keys
    e_piano:    { osc:{type:'sine'},                           env:{attack:.01,decay:.8, sustain:.3, release:1.5}, vol:-12, detune:0   },
    organ:      { osc:{type:'square'},                         env:{attack:.01,decay:.0, sustain:1.0,release:.1},  vol:-17, detune:0   },
    wurli:      { osc:{type:'triangle'},                       env:{attack:.005,decay:.4,sustain:.2, release:.8},  vol:-11, detune:0   },
    bell:       { osc:{type:'fmsine'},                         env:{attack:.001,decay:1.2,sustain:0, release:1.5}, vol:-14, detune:0   },
    piano:      { osc:{type:'triangle'},                       env:{attack:.001,decay:1.0,sustain:.1, release:1.2},vol:-10, detune:0   },
    vibraphone: { osc:{type:'sine'},                           env:{attack:.001,decay:1.8,sustain:.05,release:1.5},vol:-12, detune:0   },
    marimba:    { osc:{type:'sine'},                           env:{attack:.001,decay:.25,sustain:0,  release:.3}, vol:-10, detune:0   },
    clavinet:   { osc:{type:'square'},                         env:{attack:.005,decay:.18,sustain:0,  release:.25},vol:-13, detune:0   },
    harp:       { osc:{type:'triangle'},                       env:{attack:.001,decay:.6, sustain:0,  release:.7}, vol:-12, detune:0   },
    // Synths
    supersaw:   { osc:{type:'fatsawtooth', count:5, spread:40},env:{attack:.05,decay:.3, sustain:.7, release:1.5}, vol:-17, detune:30  },
    pluck:      { osc:{type:'triangle'},                       env:{attack:.005,decay:.3,sustain:0,  release:.4},  vol:-12, detune:0   },
    synth_bass: { osc:{type:'sawtooth'},                       env:{attack:.02,decay:.3, sustain:.5, release:.4},  vol:-10, detune:0, filter:1200 },
    stab:       { osc:{type:'fatsawtooth', count:3, spread:20},env:{attack:.005,decay:.1,sustain:0,  release:.15}, vol:-16, detune:10  },
    reese:      { osc:{type:'fatsawtooth', count:3, spread:30},env:{attack:.01,decay:.4, sustain:.75,release:.5},  vol:-15, detune:25, filter:800 },
    // Synthwave / Retrowave
    retro_lead:   { osc:{type:'fatsawtooth',count:3,spread:15},  env:{attack:.01, decay:.2, sustain:.7, release:.6},  vol:-14, detune:12  },
    neon_pad:     { osc:{type:'fatsawtooth',count:4,spread:35},  env:{attack:.8,  decay:.4, sustain:.8, release:3.0}, vol:-16, detune:30  },
    power_stab:   { osc:{type:'fatsquare', count:3, spread:20},  env:{attack:.005,decay:.15,sustain:.4, release:.2},  vol:-15, detune:8   },
    arp_pluck:    { osc:{type:'triangle'},                        env:{attack:.005,decay:.18,sustain:.1, release:.25}, vol:-11, detune:0   },
    retro_bass:   { osc:{type:'sawtooth'},                        env:{attack:.01, decay:.25,sustain:.6, release:.4},  vol:-8,  detune:0, filter:1400 },
    synth_brass:  { osc:{type:'fatsquare',count:3,spread:18},    env:{attack:.04, decay:.15,sustain:.65,release:.5},  vol:-13, detune:5   },
    vhs_pad:      { osc:{type:'amsine2'},                         env:{attack:1.2, decay:.6, sustain:.75,release:4.0}, vol:-14, detune:22  },
    outrun_lead:  { osc:{type:'fmsawtooth'},                      env:{attack:.01, decay:.3, sustain:.55,release:.7},  vol:-13, detune:0   },
    // World / Special
    flute:      { osc:{type:'fmtriangle'},                     env:{attack:.1, decay:.2, sustain:.8, release:.5},  vol:-13, detune:0   },
    brass:      { osc:{type:'fatsquare', count:2, spread:12},  env:{attack:.08,decay:.2, sustain:.7, release:.4},  vol:-14, detune:0   },
    theremin:   { osc:{type:'sine'},                           env:{attack:.3, decay:.1, sustain:.9, release:.8},  vol:-12, detune:0   },
    sitar:      { osc:{type:'fmsawtooth'},                     env:{attack:.001,decay:.6,sustain:.1, release:.8},  vol:-13, detune:8   },
    kalimba:    { osc:{type:'fmsine'},                         env:{attack:.001,decay:.5,sustain:0,  release:.6},  vol:-12, detune:0   },
};

function getPreset() { return V('chordPreset') ?? 'warm_pad'; }

function buildChordSynth(presetKey) {
    [chordSynth,chordChorus,chordDelay,chordReverb,chordFilter,chordVol,chordDist].forEach(n=>{try{n?.dispose();}catch(e){}});

    const p   = CHORD_PRESETS[presetKey] ?? CHORD_PRESETS.warm_pad;
    const atk = +V('attack'), rel = +V('release');
    const dec = +V('decay'),  sus = +V('sustain');
    const det = +V('detune');

    // Build oscillator config — apply user detune on top of preset spread
    const oscCfg = {...p.osc};
    if (oscCfg.spread !== undefined) oscCfg.spread = Math.max(p.osc.spread ?? 10, det);
    else if (det > 0) oscCfg.detune = det;

    const synthCfg = {
        oscillator: oscCfg,
        envelope:   { attack:atk, decay:dec, sustain:sus, release:rel },
        volume:     p.vol,
    };

    // Effects chain: synth → dist → chorus → delay → reverb → filter → vol → out
    chordVol    = new Tone.Volume(+V('chordVolume')).connect(getMasterInput());
    chordFilter = new Tone.Filter(p.filter ?? +V('filter'), 'lowpass').connect(chordVol);
    chordReverb = new Tone.Reverb({decay:+V('reverbDecay'), wet:+V('reverb')}).connect(chordFilter);
    chordDelay  = new Tone.FeedbackDelay('8n.', +V('delay')).connect(chordReverb);
    chordChorus = new Tone.Chorus(3.5, 1.5, +V('chorus')).connect(chordDelay).start();
    chordDist   = new Tone.Distortion(+V('distortion')).connect(chordChorus);
    chordSynth  = new Tone.PolySynth(Tone.Synth, synthCfg).connect(chordDist);

    // Sync filter slider if preset has its own value
    if (p.filter) {
        document.getElementById('filter').value = p.filter;
        document.getElementById('filterVal').textContent = p.filter + 'Hz';
    }
}

// Build synths for all tracks
function buildAllSynths() {
    SEQ.tracks.forEach(t => buildTrackSynth(t));
}

function buildTrackFxChain(track) {
    if (track.fxNodes) {
        ['pan','vol','rev','dly','flt','dist'].forEach(k=>{try{track.fxNodes[k]?.dispose();}catch(e){}});
    }
    try { track.meterNode?.dispose(); } catch(e) {}
    const fx = track.fx;
    const pan  = new Tone.Panner(track.pan ?? 0).connect(getMasterInput());
    const vol  = new Tone.Volume(track.volume ?? 0).connect(pan);
    const meter = new Tone.Meter({ smoothing: 0.85 });
    vol.connect(meter);
    track.meterNode = meter;
    const rev  = new Tone.Reverb({ decay:3, wet: fx.rev }).connect(vol);
    const dly  = new Tone.FeedbackDelay('8n', 0.4).connect(rev);
    dly.wet.value = fx.dly;
    const flt  = new Tone.Filter(fx.flt, 'lowpass').connect(dly);
    const dist = new Tone.Distortion(fx.dist).connect(flt);
    track.fxNodes = { dist, flt, dly, rev, vol, pan };
}

function updateTrackFx(track, param, val) {
    track.fx[param] = val;
    if (!track.fxNodes) return;
    if (param==='rev')  track.fxNodes.rev.wet.value = val;
    if (param==='dly')  track.fxNodes.dly.wet.value = val;
    if (param==='flt')  track.fxNodes.flt.frequency.value = val;
    if (param==='dist') track.fxNodes.dist.distortion = val;
}

function updateTrackMixer(track, param, val) {
    track[param] = val;
    if (!track.fxNodes) return;
    if (param==='volume') track.fxNodes.vol.volume.value = val;
    if (param==='pan')    track.fxNodes.pan.pan.value = val;
}

function buildTrackLFO(track) {
    try { track.lfoNode?.stop(); track.lfoNode?.dispose(); } catch(e){}
    track.lfoNode = null;
    if (!track.lfo.enabled || !track.fxNodes) return;
    const { target, rate, depth } = track.lfo;
    let min, max, signal;
    if (target === 'filter') {
        const base = track.fx.flt;
        min = Math.max(200, base * (1 - depth));
        max = Math.min(20000, base * (1 + depth*2));
        signal = track.fxNodes.flt.frequency;
    } else if (target === 'volume') {
        min = (track.volume ?? 0) - depth * 24;
        max = track.volume ?? 0;
        signal = track.fxNodes.vol.volume;
    } else { // pan
        signal = track.fxNodes.pan.pan;
        min = -depth; max = depth;
    }
    track.lfoNode = new Tone.LFO(rate, min, max).connect(signal);
    track.lfoNode.start();
}

function stopTrackLFO(track) {
    try { track.lfoNode?.stop(); track.lfoNode?.dispose(); } catch(e){}
    track.lfoNode = null;
}


function buildTrackSynth(track) {
    stopTrackLFO(track);
    try{track.synth?.dispose();}catch(e){}
    try{track.extra?.dispose();}catch(e){}
    track.extra = null;
    buildTrackFxChain(track);
    const inp = track.fxNodes.dist;

    if (track.type === 'kick') {
        const cfg = {...KICK_PRESETS[track.kickType] ?? KICK_PRESETS.classic};
        if (track.kickType === 'distorted') {
            track.extra = new Tone.Distortion(0.75).connect(inp);
            track.synth = new Tone.MembraneSynth(cfg).connect(track.extra);
        } else if (track.kickType === 'acoustic') {
            track.extra = new Tone.NoiseSynth({noise:{type:'brown'},envelope:{attack:.001,decay:.04,sustain:0,release:.01},volume:-14}).connect(inp);
            track.synth = new Tone.MembraneSynth(cfg).connect(inp);
        } else {
            track.synth = new Tone.MembraneSynth(cfg).connect(inp);
        }
    } else if (track.type === 'snare') {
        track.synth = new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.14,sustain:0,release:.06},volume:-8}).connect(inp);
    } else if (track.type === 'hihat') {
        const hp = HIHAT_PRESETS[track.hihatType ?? 'closed'] ?? HIHAT_PRESETS.closed;
        track.extra = new Tone.Filter(hp.hpFreq, 'highpass').connect(inp);
        track.synth = new Tone.NoiseSynth({noise:{type:hp.noise},envelope:hp.env,volume:hp.vol}).connect(track.extra);
    } else if (track.type === 'bass') {
        const bp = BASS_PRESETS[track.bassType ?? 'saw'] ?? BASS_PRESETS.saw;
        if (bp.osc === 'fm') {
            track.synth = new Tone.FMSynth({harmonicity:2,modulationIndex:6,envelope:{attack:.01,decay:.2,sustain:.5,release:.3},volume:-10}).connect(inp);
        } else {
            // osc can be a string or an object {type, count, spread}
            const oscCfg = typeof bp.osc === 'object' ? bp.osc : { type: bp.osc };
            const feCfg  = bp.fe ? {
                attack: bp.fe.atk, decay: bp.fe.dec, sustain: bp.fe.sus, release: bp.fe.rel,
                baseFrequency: bp.fe.base, octaves: bp.fe.oct
            } : { baseFrequency: 200, octaves: 2, attack:.01, decay:.2, sustain:.5, release:.2 };
            const filterCfg = { frequency: 20000, Q: bp.filter?.Q ?? 0, type: 'lowpass' };
            const dest = bp.dist ? (track.extra = new Tone.Distortion(.45).connect(inp)) : inp;
            track.synth = new Tone.MonoSynth({
                oscillator: oscCfg, envelope: bp.env,
                filterEnvelope: feCfg, filter: filterCfg,
                volume: bp.vol ?? -6,
            }).connect(dest);
            // Auto-configure LFO for presets that request it (e.g. wobble)
            if (bp.autoLfo) {
                track.lfo = { enabled: true,
                    target: bp.autoLfo.target ?? 'filter',
                    rate:   bp.autoLfo.rate   ?? 4,
                    depth:  bp.autoLfo.depth  ?? 0.5 };
            }
        }
    } else if (track.type === 'melody') {
        const key = V('pianoSound') ?? 'pluck';
        const p = CHORD_PRESETS[key] ?? CHORD_PRESETS.pluck;
        track.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: p.osc,
            envelope:   { ...p.env, attack: Math.min(p.env.attack, 0.05) },
            volume:     p.vol,
        }).connect(inp);
    } else if (track.type === 'pad') {
        const p = PAD_PRESETS[track.padPreset ?? 'warm'] ?? PAD_PRESETS.warm;
        track.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: p.osc,
            envelope:   p.env,
            volume:     p.vol,
        }).connect(inp);
    }
    // sample type: no Tone synth — Howler.js handles playback
    buildTrackLFO(track);
}

// ── Sample loading (Howler.js) ──────────────────────────────
function loadSampleFile(track, file) {
    if (!file || !file.type.match(/audio/)) { setStatus('Ongeldig bestandstype','err'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        track.howl?.unload();
        track.howl = new Howl({
            src: [e.target.result],
            format: [file.name.split('.').pop().toLowerCase()],
            volume: 0.85,
            pool: 8,   // up to 8 simultaneous instances (rapid fire steps)
            onload: () => {
                track.filename = file.name;
                const el = document.querySelector(`.sample-drop[data-uid="${track.uid}"]`);
                if (el) { el.textContent = file.name.replace(/\.[^.]+$/,''); el.classList.add('loaded'); }
                setStatus('Sample geladen: ' + file.name, 'ok');
            },
            onloaderror: () => setStatus('Fout bij laden sample','err'),
        });
    };
    reader.readAsDataURL(file);
}

// ── Helpers ────────────────────────────────────────────────
function V(id)        { return document.getElementById(id)?.value; }
function midiFreq(m)  { return 440*Math.pow(2,(m-69)/12); }
function midiName(m)  { return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][m%12]+(Math.floor(m/12)-1); }
function chordRoot(n) { return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][n[0]%12]; }
function setStatus(msg,cls='') { const e=document.getElementById('status'); e.textContent=msg; e.className=cls; }

function triggerTrack(track, time, vel=100) {
    const v = Math.max(0.01, Math.min(1, vel/127));
    if (track.type==='kick')  {
        track.synth?.triggerAttackRelease('C1','8n',time,v);
        if(track.extra instanceof Tone.NoiseSynth) track.extra.triggerAttackRelease('16n',time,v);
        triggerSidechain(time);
    }
    else if (track.type==='snare') track.synth?.triggerAttackRelease('8n',time,v);
    else if (track.type==='hihat') track.synth?.triggerAttackRelease('16n',time,v);
    else if (track.type==='sample' && track.howl) { track.howl.volume(20*Math.log10(v)); track.howl.play(); }
    // pad trigger is handled inline in buildSeqLoop (needs note value)
}
