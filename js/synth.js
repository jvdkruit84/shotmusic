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
    // Give Chrome's scheduler more headroom: schedule 200ms ahead (default 100ms).
    // updateInterval 50ms means Tone checks the queue every 50ms — less CPU churn.
    Tone.getContext().lookAhead      = 0.2;
    Tone.getContext().updateInterval = 0.05;
    await Tone.start();
    S.audioReady = true;
    buildMasterBus();
    if (typeof initBuses === 'function') initBuses();
    if (typeof startMasterAnimation === 'function') startMasterAnimation();
    buildChordSynth(getPreset());
    buildAllSynths();
    await restoreLocalSamples();
    if (typeof restoreAudioClips === 'function') restoreAudioClips();
    if (typeof initMidiLearn === 'function') initMidiLearn();
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
    // Future Bass / Trap
    hypersaw:   { osc:{type:'fatsawtooth',count:7,spread:60},  env:{attack:.02, decay:.4, sustain:.8, release:1.5}, vol:-18, detune:40  },
    future_lead:{ osc:{type:'fatsawtooth',count:4,spread:25},  env:{attack:.005,decay:.2, sustain:.7, release:.8},  vol:-15, detune:20, filter:3500 },
    trap_bell:  { osc:{type:'fmsine'},                         env:{attack:.001,decay:1.5,sustain:.05,release:1.8}, vol:-13, detune:0   },
    // Lo-fi / R&B
    lofi_keys:  { osc:{type:'triangle'},                       env:{attack:.01, decay:.6, sustain:.25,release:1.2}, vol:-11, detune:5   },
    rhodes:     { osc:{type:'fmsine'},                         env:{attack:.01, decay:.9, sustain:.2, release:1.4}, vol:-12, detune:0   },
    // Cinematic
    epic_brass: { osc:{type:'fatsquare',count:4,spread:22},    env:{attack:.12, decay:.3, sustain:.75,release:1.0}, vol:-14, detune:8   },
    cine_strings:{ osc:{type:'fatsawtooth',count:5,spread:20}, env:{attack:.4,  decay:.2, sustain:.9, release:2.5}, vol:-15, detune:12  },
    // Electronic / modern
    chiptune:   { osc:{type:'square'},                         env:{attack:.001,decay:.08,sustain:.5, release:.15}, vol:-14, detune:0   },
    wobble_lead:{ osc:{type:'fatsawtooth',count:3,spread:20},  env:{attack:.01, decay:.3, sustain:.6, release:.5},  vol:-14, detune:15, filter:1800 },
    // Nordic / Ambient
    nordic:     { osc:{type:'fmtriangle'},                     env:{attack:.6,  decay:.8, sustain:.7, release:4.0}, vol:-13, detune:0   },
};

function getPreset() { return V('chordPreset') ?? 'warm_pad'; }

// Pool of individual Tone.Synth voices backing the chord synth.
// Using individual synths instead of PolySynth avoids:
//   - "Max polyphony exceeded" (PolySynth counts releasing voices toward the limit)
//   - "Events scheduled inside callbacks" (PolySynth allocates voices lazily in ticks)
// Round-robin assignment means a busy voice just gets retriggered — no drop.
let _chordPool = [];
let _chordPoolIdx = 0;
let _chordFreqMap = new Map(); // freq → voice (for triggerAttack/triggerRelease pairs)

function buildChordSynth(presetKey) {
    // Dispose old pool voices first
    _chordPool.forEach(s => { try { s.dispose(); } catch(e) {} });
    _chordPool = [];
    _chordPoolIdx = 0;
    // Dispose effects chain (chordSynth is now the wrapper object, skip it)
    [chordChorus,chordDelay,chordReverb,chordFilter,chordVol,chordDist].forEach(n=>{try{n?.dispose();}catch(e){}});

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

    // Effects chain: synth pool → dist → chorus → delay → reverb → filter → vol → out
    chordVol    = new Tone.Volume(+V('chordVolume')).connect(getMasterInput());
    chordFilter = new Tone.Filter(p.filter ?? +V('filter'), 'lowpass').connect(chordVol);
    chordReverb = new Tone.Reverb({decay: Math.max(0.1, +V('reverbDecay')), wet:+V('reverb')}).connect(chordFilter);
    chordDelay  = new Tone.FeedbackDelay('8n.', +V('delay')).connect(chordReverb);
    chordChorus = new Tone.Chorus(3.5, 1.5, +V('chorus')).connect(chordDelay).start();
    chordDist   = new Tone.Distortion(+V('distortion')).connect(chordChorus);

    // 8 individual voices — one per note slot (enough for any chord + arp overlap).
    // Compensate for up to 4 concurrent notes: -20*log10(sqrt(4)) = -6dB per voice.
    const chordCompDb = -20 * Math.log10(Math.sqrt(4));
    const chordCfgComp = { ...synthCfg, volume: (synthCfg.volume ?? 0) + chordCompDb };
    for (let i = 0; i < 8; i++) {
        _chordPool.push(new Tone.Synth(chordCfgComp).connect(chordDist));
    }

    _chordFreqMap.clear();

    // Expose a PolySynth-compatible wrapper so all call sites stay unchanged
    chordSynth = {
        triggerAttackRelease(notesOrFreq, dur, time, vel=1) {
            const notes = Array.isArray(notesOrFreq) ? notesOrFreq : [notesOrFreq];
            notes.forEach(freq => {
                const v = _chordPool[_chordPoolIdx];
                _chordPoolIdx = (_chordPoolIdx + 1) % _chordPool.length;
                v.triggerAttackRelease(freq, dur, time, vel);
            });
        },
        triggerAttack(freq, time, vel=1) {
            // Reuse existing voice for this freq if held, otherwise grab next
            let v = _chordFreqMap.get(freq);
            if (!v) {
                v = _chordPool[_chordPoolIdx];
                _chordPoolIdx = (_chordPoolIdx + 1) % _chordPool.length;
                _chordFreqMap.set(freq, v);
            }
            v.triggerAttack(freq, time, vel);
        },
        triggerRelease(freq, time) {
            const v = _chordFreqMap.get(freq);
            if (v) { v.triggerRelease(time); _chordFreqMap.delete(freq); }
        },
        releaseAll(time) {
            const t = (time !== undefined) ? time : Tone.now();
            _chordPool.forEach(v => { try { v.triggerRelease(t); } catch(e) {} });
            _chordFreqMap.clear();
        },
        dispose() {
            _chordPool.forEach(s => { try { s.dispose(); } catch(e) {} });
            _chordPool = []; _chordFreqMap.clear();
        },
    };

    // Sync filter slider if preset has its own value
    if (p.filter) {
        document.getElementById('filter').value = p.filter;
        document.getElementById('filterVal').textContent = p.filter + 'Hz';
    }
}

// Build synths for all tracks — stagger by 80ms so Reverb IR generations
// don't all compete for CPU at the same moment.
function buildAllSynths() {
    SEQ.tracks.forEach((t, i) => {
        setTimeout(() => buildTrackSynth(t), i * 80);
    });
}

// Return correct audio destination for track (bus or master)
function getTrackDest(track) {
    const bus = track.busRoute && window.BUS_NODES?.[track.busRoute];
    return bus ? bus.vol : getMasterInput();
}

function buildTrackFxChain(track) {
    if (track.fxNodes) {
        ['pan','vol','rev','dly','flt','eq','dist'].forEach(k=>{try{track.fxNodes[k]?.dispose();}catch(e){}});
    }
    try { track.meterNode?.dispose(); } catch(e) {}
    const fx  = track.fx;
    const eq  = track.eq ?? {low:0, mid:0, high:0};
    const pan  = new Tone.Panner(track.pan ?? 0).connect(getTrackDest(track));
    const vol  = new Tone.Volume(track.volume ?? 0).connect(pan);
    const meter = new Tone.Meter({ smoothing: 0.85 });
    vol.connect(meter);
    track.meterNode = meter;
    const rev  = new Tone.Reverb({ decay: 1.5, wet: fx.rev }).connect(vol);
    const dly  = new Tone.FeedbackDelay('8n', 0.4).connect(rev);
    dly.wet.value = fx.dly;
    const flt  = new Tone.Filter(fx.flt, 'lowpass').connect(dly);
    const eqNode = new Tone.EQ3({ low: eq.low, mid: eq.mid, high: eq.high }).connect(flt);
    const dist = new Tone.Distortion(fx.dist).connect(eqNode);
    track.fxNodes = { dist, eq: eqNode, flt, dly, rev, vol, pan };
}

function updateTrackFx(track, param, val) {
    track.fx[param] = val;
    if (!track.fxNodes) return;
    if (param==='rev')  track.fxNodes.rev.wet.value = val;
    if (param==='dly')  track.fxNodes.dly.wet.value = val;
    if (param==='flt')  track.fxNodes.flt.frequency.value = val;
    if (param==='dist') track.fxNodes.dist.distortion = val;
}

function updateTrackEq(track, band, val) {
    if (!track.eq) track.eq = {low:0, mid:0, high:0};
    track.eq[band] = val;
    if (!track.fxNodes?.eq) return;
    track.fxNodes.eq[band].value = val;
}

function updateTrackMixer(track, param, val) {
    track[param] = val;
    if (!track.fxNodes) return;
    if (param==='volume') track.fxNodes.vol.volume.value = val;
    if (param==='pan')    track.fxNodes.pan.pan.value = val;
}

// Re-route track to its bus/master (call after busRoute changes)
function rerouteTrack(track) {
    if (!track.fxNodes) return;
    try { track.fxNodes.pan.disconnect(); } catch(e) {}
    track.fxNodes.pan.connect(getTrackDest(track));
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


// Creates a fixed-size voice pool as a drop-in replacement for PolySynth.
// Pre-allocated voices mean Chrome never has to spin up new AudioWorkletNodes mid-playback.
// maxConcurrent: expected simultaneous notes — used to compensate for gain summing.
// Without compensation, 5 voices at -15dB sum to -1dB (≈ clipping).
function _makeVoicePool(size, synthCfg, dest, maxConcurrent = 1) {
    // Reduce each voice by 20*log10(sqrt(maxConcurrent)) so N voices summed stay near the
    // same RMS as one voice. sqrt avoids over-attenuating since voices aren't perfectly in phase.
    const compensationDb = maxConcurrent > 1 ? -20 * Math.log10(Math.sqrt(maxConcurrent)) : 0;
    const adjustedVol = (synthCfg.volume ?? 0) + compensationDb;
    const cfg = { ...synthCfg, volume: adjustedVol };
    const pool = [];
    let idx = 0;
    for (let i = 0; i < size; i++) pool.push(new Tone.Synth(cfg).connect(dest));
    return {
        triggerAttackRelease(notesOrFreq, dur, time, vel = 1) {
            const notes = Array.isArray(notesOrFreq) ? notesOrFreq : [notesOrFreq];
            notes.forEach(freq => {
                const v = pool[idx]; idx = (idx + 1) % pool.length;
                try { v.triggerAttackRelease(freq, dur, time, vel); } catch(e) {}
            });
        },
        triggerAttack(freq, time, vel = 1) {
            const v = pool[idx]; idx = (idx + 1) % pool.length;
            try { v.triggerAttack(freq, time, vel); } catch(e) {}
        },
        triggerRelease(freq, time) {
            // best-effort: release the most-recently-used voice
            const prev = pool[(idx - 1 + pool.length) % pool.length];
            try { prev.triggerRelease(time ?? Tone.now()); } catch(e) {}
        },
        releaseAll(time) {
            const t = time ?? Tone.now();
            pool.forEach(v => { try { v.triggerRelease(t); } catch(e) {} });
        },
        dispose() {
            pool.forEach(v => { try { v.dispose(); } catch(e) {} });
            pool.length = 0;
        },
        // Allow LFO to reach the first voice's oscillator frequency param
        get frequency() { return pool[0]?.frequency; },
    };
}

function buildTrackSynth(track) {
    stopTrackLFO(track);
    try{track.synth?.dispose();}catch(e){}
    [].concat(track.extra ?? []).forEach(n=>{try{n?.dispose();}catch(e){}});
    track.extra = null;
    try{track.samplePlayer?.dispose();}catch(e){}
    track.samplePlayer = null;
    buildTrackFxChain(track);
    const inp = track.fxNodes.dist;

    // Sample player mode: replaces synth for percussion tracks
    const _hasSample = track.samplePack && track.sampleFile;
    if (_hasSample && ['kick','snare','hihat','sample'].includes(track.type)) {
        // Build URL fresh from raw (unencoded) fields — prevents %2520 double-encoding
        const path = (track.sampleCat && track.sampleCat !== '.') ? track.sampleCat : '';
        const url  = API
            + '?action=getSampleFile'
            + '&pack=' + encodeURIComponent(track.samplePack)
            + '&path=' + encodeURIComponent(path)
            + '&file=' + encodeURIComponent(track.sampleFile);
        const snapPack = track.samplePack, snapFile = track.sampleFile;
        // Use fetch() directly — bypasses any Tone.js URL re-encoding
        fetch(url)
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
            .then(buf => Tone.getContext().rawContext.decodeAudioData(buf))
            .then(audioBuf => {
                if (track.samplePack !== snapPack || track.sampleFile !== snapFile) return; // reassigned, discard
                const player = new Tone.Player(audioBuf).connect(inp);
                player.retrigger = true;
                track.samplePlayer = player;
                setStatus('Sample klaar: ' + track.sampleFile.replace(/\.[^.]+$/, ''), 'ok');
            })
            .catch(err => {
                console.error('Sample laden mislukt:', url, err);
                setStatus('Sample laden mislukt — zie console', 'err');
                track.samplePlayer = null;
                track.samplePack   = null;
                track.sampleCat    = null;
                track.sampleFile   = null;
                buildTrackSynth(track);
            });
        buildTrackLFO(track);
        return;
    }

    // Local-file sample (loaded via drag/drop or loadSampleFile):
    // AudioBuffer is kept on track._localBuffer so it survives buildTrackSynth rebuilds
    if (track._localBuffer) {
        const player = new Tone.Player(track._localBuffer).connect(inp);
        player.retrigger = true;
        track.samplePlayer = player;
        buildTrackLFO(track);
        return;
    }

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
        const sp = SNARE_PRESETS[track.snareType ?? 'acoustic'] ?? SNARE_PRESETS.acoustic;
        const hpFilter = new Tone.Filter(sp.hpFreq ?? 200, 'highpass').connect(inp);
        track.extra = hpFilter;
        track.synth = new Tone.NoiseSynth({noise:{type:sp.noise},envelope:sp.env,volume:sp.vol}).connect(hpFilter);
        if (sp.tone) {
            // Voeg subtiele MembraneSynth toe voor body/tone component
            const toneSynth = new Tone.MembraneSynth({
                pitchDecay:.02, octaves:3,
                envelope:{attack:.001,decay:.08,sustain:0,release:.04},
                volume:-20,
            }).connect(hpFilter);
            // Sla op als array extra zodat we beide kunnen disposen
            track.extra = [hpFilter, toneSynth];
        }
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
        const melEnv = { ...p.env, attack: Math.min(p.env.attack, 0.05) };
        track.synth = _makeVoicePool(8,  { oscillator: p.osc, envelope: melEnv, volume: p.vol }, inp, 2);
    } else if (track.type === 'pad') {
        const p = PAD_PRESETS[track.padPreset ?? 'warm'] ?? PAD_PRESETS.warm;
        track.synth = _makeVoicePool(12, { oscillator: p.osc, envelope: p.env,  volume: p.vol }, inp, 5);
    }
    // sample type: no Tone synth — Howler.js handles playback
    buildTrackLFO(track);
}

// ── IndexedDB sample cache ─────────────────────────────────
// Persists decoded ArrayBuffers by filename so samples survive page reload.
let _sampleDb = null;
function _openSampleDb() {
    return new Promise((res, rej) => {
        if (_sampleDb) { res(_sampleDb); return; }
        const req = indexedDB.open('shotmusic_samples', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('samples', { keyPath: 'name' });
        req.onsuccess = e => { _sampleDb = e.target.result; res(_sampleDb); };
        req.onerror   = e => rej(e.target.error);
    });
}
function _dbStore(name, buf) {
    _openSampleDb().then(db => {
        const tx = db.transaction('samples', 'readwrite');
        tx.objectStore('samples').put({ name, buf });
    }).catch(e => console.warn('sample cache write failed', e));
}
function _dbLoad(name) {
    return _openSampleDb().then(db => new Promise((res, rej) => {
        const req = db.transaction('samples').objectStore('samples').get(name);
        req.onsuccess = e => res(e.target.result?.buf ?? null);
        req.onerror   = e => rej(e.target.error);
    }));
}
function _dbDelete(name) {
    _openSampleDb().then(db =>
        db.transaction('samples','readwrite').objectStore('samples').delete(name)
    ).catch(() => {});
}

// After project load + buildAllSynths: rebuild players for tracks that have a
// cached sample in IndexedDB but lost their _localBuffer (e.g. after page reload).
async function restoreLocalSamples() {
    const tracks = SEQ.tracks.filter(t => t.filename && !t._localBuffer);
    for (const t of tracks) {
        try {
            const buf = await _dbLoad(t.filename);
            if (!buf) continue;
            const audioBuf = await Tone.getContext().rawContext.decodeAudioData(buf.slice(0));
            if (!t.fxNodes) buildTrackFxChain(t);
            const player = new Tone.Player(audioBuf).connect(t.fxNodes.dist);
            player.retrigger = true;
            t.samplePlayer = player;
            t._localBuffer = audioBuf;
            if (typeof _refreshSampleBtn === 'function') _refreshSampleBtn(t);
            setStatus('Sample hersteld: ' + t.filename.replace(/\.[^.]+$/, ''), 'ok');
        } catch(e) {
            console.warn('sample restore failed for', t.filename, e);
        }
    }
}

// ── Sample loading (local file → decodeAudioData + Tone.Player) ──
const AUDIO_EXTENSIONS = new Set(['wav','mp3','ogg','flac','aiff','aif','webm','opus','m4a','aac','weba']);

function loadSampleFile(track, file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const mimeOk = file.type.match(/audio/) || file.type.match(/video\/webm/);
    if (!mimeOk && !AUDIO_EXTENSIONS.has(ext)) {
        setStatus('Ongeldig bestandstype: ' + (file.type || ext), 'err');
        return;
    }

    setStatus('Sample laden…');
    const reader = new FileReader();
    reader.onload = e => {
        // Slice a copy BEFORE decodeAudioData — Chrome detaches the original ArrayBuffer after decode.
        const rawBuf  = e.target.result;
        const bufCopy = rawBuf.slice(0);
        Tone.getContext().rawContext.decodeAudioData(rawBuf)
            .then(audioBuf => {
                // Dispose old players
                try { track.samplePlayer?.dispose(); } catch(_) {}
                track.howl?.unload();
                track.howl = null;

                // Ensure fx chain exists (track might not be audio-ready yet)
                if (!track.fxNodes) buildTrackFxChain(track);
                const inp = track.fxNodes.dist;

                const player = new Tone.Player(audioBuf).connect(inp);
                player.retrigger = true;
                track.samplePlayer  = player;
                track.filename      = file.name;
                track._localBuffer  = audioBuf; // persist across buildTrackSynth rebuilds

                // Keep pack/cat null so project.js knows it's a local blob (no server URL)
                track.samplePack = null;
                track.sampleCat  = null;
                track.sampleFile = file.name;

                // Cache in IndexedDB so sample survives page reload
                _dbStore(file.name, bufCopy);

                if (typeof _refreshSampleBtn === 'function') _refreshSampleBtn(track);
                if (typeof showWaveform     === 'function') showWaveform(audioBuf, file.name);
                setStatus('Sample geladen: ' + file.name.replace(/\.[^.]+$/, ''), 'ok');
            })
            .catch(err => {
                console.error('decodeAudioData mislukt:', err);
                setStatus('Sample decoderen mislukt (beschadigd of onbekend formaat)', 'err');
            });
    };
    reader.readAsArrayBuffer(file);
}

// ── Helpers ────────────────────────────────────────────────
function V(id)        { return document.getElementById(id)?.value; }
function midiFreq(m)  { return 440*Math.pow(2,(m-69)/12); }
function midiName(m)  { return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][m%12]+(Math.floor(m/12)-1); }
function chordRoot(n) { return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][n[0]%12]; }
function setStatus(msg,cls='') { const e=document.getElementById('status'); e.textContent=msg; e.className=cls; }

function triggerTrack(track, time, vel=100) {
    const v = Math.max(0.01, Math.min(1, vel/127));

    // Sample player overrides synth when buffer is loaded
    if (track.samplePlayer?.loaded) {
        try {
            track.samplePlayer.volume.value = 20 * Math.log10(Math.max(v, 0.01));
            const offset  = track.trimStart ?? 0;
            const trimEnd = track.trimEnd;
            if (offset > 0 || trimEnd != null) {
                const dur = trimEnd != null ? trimEnd - offset : undefined;
                track.samplePlayer.start(time, offset, dur);
            } else {
                track.samplePlayer.start(time);
            }
        } catch(e) { console.warn('sample start error', e); }
        if (track.type === 'kick') triggerSidechain(time);
        return;
    }
    // samplePlayer exists but still loading — skip trigger (buffer not ready)
    if (track.samplePlayer) return;

    if (track.type==='kick')  {
        track.synth?.triggerAttackRelease('C1','8n',time,v);
        if(track.extra instanceof Tone.NoiseSynth) track.extra.triggerAttackRelease('16n',time,v);
        triggerSidechain(time);
    }
    else if (track.type==='snare') {
        track.synth?.triggerAttackRelease('8n',time,v);
        const extras = [].concat(track.extra ?? []);
        const toneSynth = extras.find(n => n instanceof Tone.MembraneSynth);
        toneSynth?.triggerAttackRelease('D2','16n',time,v);
    }
    else if (track.type==='hihat') track.synth?.triggerAttackRelease('16n',time,v);
    else if (track.type==='sample' && track.howl) { track.howl.volume(20*Math.log10(v)); track.howl.play(); }
    // pad trigger is handled inline in buildSeqLoop (needs note value)
}
