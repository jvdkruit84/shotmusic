// ── Download helper ──────────────────────────────────────────
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Project Save / Load ─────────────────────────────────────
const PROJECT_KEY = 'shotmusic_project';

function collectProjectData() {
    return {
        version: 2,
        bpm:            +V('bpm'),
        steps:          SEQ.steps,
        swing:          +V('seqSwing'),
        rootNote:       V('rootNote'),
        keyMode:        V('keyMode'),
        genreSelect:    V('genre'),
        progressionSelect: V('progression'),
        chordBars:      +V('chordBars'),
        voiceLead:      document.getElementById('voiceLead')?.checked ?? false,
        pianoSound:     V('pianoSound'),
        chordPreset:    V('chordPreset'),
        attack:         +V('attack'),
        decay:          +V('decay'),
        sustain:        +V('sustain'),
        release:        +V('release'),
        detune:         +V('detune'),
        chorus:         +V('chorus'),
        reverb:         +V('reverb'),
        reverbDecay:    +V('reverbDecay'),
        delay:          +V('delay'),
        distortion:     +V('distortion'),
        filter:         +V('filter'),
        chordVolume:    +V('chordVolume'),
        chordMute:      S.chordMute,
        sidechain:      {...S.sidechain},
        arp:            {...ARP},
        master:         {...MASTER},
        patterns:       JSON.parse(JSON.stringify(SEQ.patterns)),
        currentPattern: SEQ.currentPattern,
        songArrangement:SEQ.songArrangement,
        songMode:       SEQ.songMode,
        arrangement:    JSON.parse(JSON.stringify(SEQ.arrangement||[])),
        arrangementBars:SEQ.arrangementBars||32,
        chordSteps:     [...(SEQ.chordSteps||Array(32).fill(0))],
        chordStepGate:  SEQ.chordStepGate??0.75,
        busState:       JSON.parse(JSON.stringify(window.BUS_STATE||{})),
        progression:    S.progression,
        chordNames:     S.chordNames,
        scale:          S.scale,
        nextUid:        SEQ.nextUid,
        tracks: SEQ.tracks.map(t=>({
            uid:      t.uid,
            type:     t.type,
            label:    t.label,
            mute:     t.mute,
            kickType:  t.kickType,
            snareType: t.snareType,
            hihatType: t.hihatType,
            bassType:  t.bassType,
            padPreset: t.padPreset,
            padMode:   t.padMode,
            samplePack: t.samplePack ?? null,
            sampleCat:  t.sampleCat  ?? null,
            sampleFile: t.sampleFile ?? null,
            volume:   t.volume,
            pan:      t.pan,
            fx:       {...t.fx},
            steps:    [...t.steps],
            vels:     [...t.vels],
            probs:    [...t.probs],
            gates:    [...(t.gates??Array(32).fill(80))],
            lfo:      {...t.lfo},
            sidechain: t.sidechain ?? false,
            filename: t.filename ?? null,
            editMode:   t.editMode ?? 'steps',
            pianoRoll:  t.pianoRoll ?? [],
            pianoRollBars: t.pianoRollBars ?? 4,
            activePattern: t.activePattern ?? 'A',
            midiOut:    t.midiOut ?? { enabled:false, channel:1, drumNote:null },
            automation: t.automation ?? null,
            eq:        t.eq ?? {low:0,mid:0,high:0},
            busRoute:  t.busRoute ?? null,
            trimStart: t.trimStart ?? null,
            trimEnd:   t.trimEnd   ?? null,
        })),
    };
}

function autoSave() {
    try { localStorage.setItem(PROJECT_KEY, JSON.stringify(collectProjectData())); } catch(e){}
}

function saveProjectFile() {
    const data = collectProjectData();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    downloadBlob(blob, 'shotmusic.json');
    autoSave();
    setStatus('Project opgeslagen','ok');
}

async function loadProjectData(data, opts={}) {
    if(!data||data.version<2) { if(!opts.silent) setStatus('Ongeldig of oud projectbestand','err'); return; }
    // Stop playback first
    if(S.isPlaying) stopPlayback();

    // Restore UI fields
    const set=(id,v)=>{ const el=document.getElementById(id); if(el){ el.value=v; el.dispatchEvent(new Event('input')); } };
    set('bpm', data.bpm);
    set('seqSwing', data.swing);
    set('chordBars', data.chordBars);
    // Restore root note buttons
    if(data.rootNote) {
        document.getElementById('rootNote').value = data.rootNote;
        document.querySelectorAll('.root-btn').forEach(b=>{
            b.classList.toggle('active', b.dataset.note === data.rootNote);
        });
    }
    // Restore mode buttons
    if(data.keyMode) {
        document.getElementById('keyMode').value = data.keyMode;
        document.getElementById('modeBtnMinor')?.classList.toggle('active', data.keyMode==='minor');
        document.getElementById('modeBtnMajor')?.classList.toggle('active', data.keyMode==='major');
    }
    if(typeof updateKeyInfo === 'function') updateKeyInfo();
    set('genre', data.genreSelect);
    set('progression', data.progressionSelect);
    set('pianoSound', data.pianoSound);
    set('chordPreset', data.chordPreset);
    set('attack', data.attack);   set('decay', data.decay ?? 0.5);
    set('sustain', data.sustain ?? 0.7); set('release', data.release);
    set('detune', data.detune);
    set('chorus', data.chorus); set('reverb', data.reverb);
    set('reverbDecay', data.reverbDecay ?? 4);
    set('delay', data.delay);   set('distortion', data.distortion ?? 0);
    set('filter', data.filter);
    if(document.getElementById('voiceLead')) document.getElementById('voiceLead').checked=data.voiceLead;

    // Restore state
    if(data.chordVolume !== undefined) {
        const cv=document.getElementById('chordVolume'); if(cv){ cv.value=data.chordVolume; document.getElementById('chordVolumeVal').textContent=data.chordVolume+'dB'; }
    }
    S.chordMute   = data.chordMute ?? false;
    if(data.sidechain) Object.assign(S.sidechain, data.sidechain);
    if(data.master)   { Object.assign(MASTER, data.master); if(typeof restoreMasterUI==='function') restoreMasterUI(); if(S.audioReady){ applyCompSettings(); if(masterLimiter) masterLimiter.threshold.value=MASTER.limThreshold; } }
    if(data.arp) {
        Object.assign(ARP, data.arp);
        const t=document.getElementById('arpToggle'); if(t) t.classList.toggle('active',ARP.enabled);
        document.getElementById('arpControls')?.classList.toggle('hidden',!ARP.enabled);
        const mEl=document.getElementById('arpMode'); if(mEl) mEl.value=ARP.mode;
        const rEl=document.getElementById('arpRate'); if(rEl) rEl.value=ARP.rate;
        const oEl=document.getElementById('arpOctaves'); if(oEl) oEl.value=ARP.octaves;
        const gEl=document.getElementById('arpGate'); if(gEl){ gEl.value=ARP.gate; document.getElementById('arpGateVal').textContent=Math.round(ARP.gate*100)+'%'; }
    }
    if(data.patterns)  Object.assign(SEQ.patterns, data.patterns);
    SEQ.currentPattern  = data.currentPattern ?? 'A';
    SEQ.songArrangement = data.songArrangement ?? [];
    SEQ.songMode        = data.songMode ?? false;
    SEQ.songPos         = 0;
    SEQ.arrangement     = data.arrangement ?? [];
    SEQ.arrangementBars = data.arrangementBars ?? 32;
    SEQ.chordSteps      = data.chordSteps ?? Array(32).fill(0);
    SEQ.chordStepGate   = data.chordStepGate ?? 0.75;
    if(data.busState && window.BUS_STATE) Object.assign(window.BUS_STATE, data.busState);
    // Sync arrBarsSelect if open
    const absEl = document.getElementById('arrBarsSelect');
    if(absEl) absEl.value = SEQ.arrangementBars;
    if(window.ARR && data.arrangement?.length) {
        ARR.nextId = Math.max(...data.arrangement.map(c=>c.id), 0) + 1;
    }
    S.progression = data.progression ?? [];
    S.chordNames  = data.chordNames  ?? [];
    S.scale       = data.scale       ?? [];
    document.getElementById('chordMuteBtn')?.classList.toggle('muted', S.chordMute);
    // Restore sidechain UI
    const scEnableBtn=document.getElementById('scEnable');
    if(scEnableBtn){ scEnableBtn.textContent=S.sidechain.enabled?'● Aan':'● Uit'; scEnableBtn.classList.toggle('active',S.sidechain.enabled); }
    const scD=document.getElementById('scDepth'); if(scD){ scD.value=S.sidechain.depth; document.getElementById('scDepthVal').textContent=Math.round(S.sidechain.depth*100)+'%'; }
    const scR=document.getElementById('scRelease'); if(scR){ scR.value=S.sidechain.release; document.getElementById('scReleaseVal').textContent=S.sidechain.release+'s'; }
    // Restore song mode UI
    const smBtn=document.getElementById('btnSongMode'); if(smBtn) smBtn.classList.toggle('active',SEQ.songMode);
    document.getElementById('songBar')?.classList.toggle('open',SEQ.songMode);

    // Rebuild tracks
    SEQ.tracks.forEach(t=>{ try{t.synth?.dispose();}catch(e){} try{t.extra?.dispose();}catch(e){} try{t.howl?.unload();}catch(e){} if(t.fxNodes)['pan','vol','rev','dly','flt','dist'].forEach(k=>{try{t.fxNodes[k]?.dispose();}catch(e){}}) });
    SEQ.tracks = [];
    SEQ.nextUid = data.nextUid ?? 1;

    data.tracks.forEach(td=>{
        const def = TRACK_TYPES[td.type] ?? TRACK_TYPES.kick;
        const t = {
            uid:      td.uid,
            type:     td.type,
            label:    td.label,
            color:    def.color,
            melodic:  def.melodic,
            steps:    (td.steps??[]).concat(Array(32).fill(def.melodic?null:0)).slice(0,32),
            vels:     (td.vels??[]).concat(Array(32).fill(100)).slice(0,32),
            probs:    (td.probs??[]).concat(Array(32).fill(100)).slice(0,32),
            gates:    (td.gates??[]).concat(Array(32).fill(80)).slice(0,32),
            lfo:      Object.assign({enabled:false,target:'filter',rate:2,depth:0.3}, td.lfo??{}),
            lfoNode:  null,
            mute:     td.mute ?? false,
            sidechain: td.sidechain ?? false,
            kickType:  td.kickType  ?? 'classic',
            snareType: td.snareType ?? 'acoustic',
            hihatType: td.hihatType ?? 'closed',
            bassType:  td.bassType  ?? 'saw',
            padPreset: td.padPreset ?? 'warm',
            padMode:   td.padMode   ?? 'chord',
            volume:   td.volume ?? 0,
            pan:      td.pan ?? 0,
            fx:       Object.assign({rev:0,dly:0,flt:20000,dist:0}, td.fx??{}),
            fxNodes:  null,
            synth:    null, extra:null, howl:null, filename:td.filename??null,
            samplePack: td.samplePack ?? null,
            sampleCat:  td.sampleCat  ?? null,
            sampleFile: td.sampleFile ?? null,
            sampleUrl:  null, samplePlayer: null,
            editMode:   td.editMode ?? 'steps',
            pianoRoll:  td.pianoRoll ?? [],
            pianoRollBars: td.pianoRollBars ?? 4,
            part:       null,
            activePattern: td.activePattern ?? 'A',
            queuedPattern: null,
            midiOut: td.midiOut ?? { enabled:false, channel:1, drumNote:null },
            automation: td.automation ?? null,
            eq:        td.eq ?? {low:0,mid:0,high:0},
            busRoute:  td.busRoute ?? null,
            trimStart: td.trimStart ?? null,
            trimEnd:   td.trimEnd   ?? null,
        };
        SEQ.tracks.push(t);
    });

    // Rebuild steps count
    const stepsEl = document.getElementById('seqStepCount');
    if(stepsEl){ stepsEl.value=data.steps; SEQ.steps=data.steps; }

    // Rebuild audio and UI
    if(S.audioReady){
        await buildChordSynth(V('chordPreset'));
        SEQ.tracks.forEach(t=>buildTrackSynth(t));
    }
    buildSeqGrid();
    buildPatternBar();
    buildSongBar();
    buildChordGrid();
    highlightPiano();
    if(typeof updateAdsrDisplay === 'function') updateAdsrDisplay();
    if(!opts.silent) setStatus('Project geladen ✓','ok');
}


// Auto-load on start
(function autoLoad(){
    try {
        const raw=localStorage.getItem(PROJECT_KEY);
        if(raw){ const data=JSON.parse(raw); if(data.version>=2) loadProjectData(data); }
    } catch(e){}
})();

// ── MIDI Export ─────────────────────────────────────────────
function exportMidi() {
    if(!S.progression.length){setStatus('Geen progressie laden…','err');return;}
    const bpm=+V('bpm'),bpc=+V('chordBars'),ppq=480,tpb=ppq*4;
    function varLen(n){const b=[];b.unshift(n&0x7f);n>>=7;while(n){b.unshift((n&0x7f)|0x80);n>>=7;}return b;}
    function u16(n){return[(n>>8)&0xff,n&0xff];}
    function u32(n){return[(n>>24)&0xff,(n>>16)&0xff,(n>>8)&0xff,n&0xff];}
    function trackNameEvent(name){
        const bytes=[...name].map(c=>c.charCodeAt(0)&0x7f);
        return[0x00,0xff,0x03,...varLen(bytes.length),...bytes];
    }
    function buildTrackData(evs,endTick,name=''){
        evs.sort((a,b)=>a.t!==b.t?a.t-b.t:(a.on?1:-1));
        const header=name?trackNameEvent(name):[];
        const d=[...header];let last=0;
        evs.forEach(ev=>{d.push(...varLen(ev.t-last));d.push(ev.ch,ev.note&0x7f,ev.on?(ev.vel??80):0);last=ev.t;});
        d.push(...varLen(endTick-last),0xff,0x2f,0x00);
        return[0x4d,0x54,0x72,0x6b,...u32(d.length),...d];
    }
    const totalBars=S.progression.length*bpc, endTick=totalBars*tpb;
    const midiTracks=[];
    const uspb=Math.round(60000000/bpm);
    const tpData=[0x00,0xff,0x51,0x03,(uspb>>16)&0xff,(uspb>>8)&0xff,uspb&0xff,0x00,0xff,0x2f,0x00];
    midiTracks.push([0x4d,0x54,0x72,0x6b,...u32(tpData.length),...tpData]);
    // Chord track
    const chordPresetName = document.getElementById('chordPreset')?.selectedOptions[0]?.text ?? 'Chords';
    const cEvs=[];
    S.progression.forEach((ns,ci)=>{const st=ci*bpc*tpb,dur=Math.round(bpc*tpb*.85);ns.forEach(m=>{cEvs.push({t:st,on:true,note:m,vel:75,ch:0x90});cEvs.push({t:st+dur,on:false,note:m,ch:0x90});});});
    midiTracks.push(buildTrackData(cEvs,endTick,'Chords - '+chordPresetName));
    // Sequencer tracks — each step is a 16th note
    const tpStep=Math.round(tpb/16);              // 120 ticks per 16th note
    const seqLoopTicks=SEQ.steps*tpStep;           // total ticks per sequencer loop
    const drumNoteCounters={kick:0,snare:0,hihat:0};
    SEQ.tracks.forEach(track=>{
        const evs=[];
        let loopStart=0;
        while(loopStart<endTick){
            track.steps.slice(0,SEQ.steps).forEach((val,i)=>{
                if(track.melodic?val===null:!val) return;
                const t=loopStart+i*tpStep;
                if(t>=endTick) return;
                const dur=Math.round(tpStep*.8);
                if(track.melodic){
                    const ch=track.type==='bass'?0x91:0x92;
                    evs.push({t,on:true,note:val,vel:75,ch});evs.push({t:t+dur,on:false,note:val,ch});
                } else if(track.type==='sample'){
                    evs.push({t,on:true,note:38,vel:100,ch:0x99});evs.push({t:t+dur,on:false,note:38,ch:0x99});
                } else {
                    const pool=DRUM_NOTES[track.type]??[36];
                    const noteIdx=drumNoteCounters[track.type]??0;
                    const note=pool[Math.min(noteIdx,pool.length-1)];
                    evs.push({t,on:true,note,vel:90,ch:0x99});evs.push({t:t+dur,on:false,note,ch:0x99});
                }
            });
            loopStart+=seqLoopTicks;
        }
        if(!track.melodic) drumNoteCounters[track.type]=(drumNoteCounters[track.type]??0)+1;
        if(evs.length) midiTracks.push(buildTrackData(evs,endTick,track.label));
    });
    const header=[0x4d,0x54,0x68,0x64,0,0,0,6,...u16(1),...u16(midiTracks.length),...u16(ppq)];
    const midi=new Uint8Array([...header,...midiTracks.flat()]);
    downloadBlob(new Blob([midi],{type:'audio/midi'}),'shotmusic.mid');
    setStatus(`MIDI geëxporteerd (${midiTracks.length-1} tracks)!`,'ok');
}

// ── Mixdown & Export ─────────────────────────────────────────

// Selected bar count for mixdown (default 8)
let _mixdownBars = 8;
let _mixdownAborted = false;

function openMixdownModal() {
    document.getElementById('mixdownModal').classList.add('open');
}
function closeMixdownModal() {
    document.getElementById('mixdownModal').classList.remove('open');
}

function initMixdownUI() {
    document.getElementById('btnMixdown').addEventListener('click', openMixdownModal);
    document.getElementById('mixdownClose').addEventListener('click', closeMixdownModal);
    document.getElementById('mixdownModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeMixdownModal();
    });

    // Bar selector buttons
    document.querySelectorAll('.mxd-bar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mxd-bar-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('mixdownBarsCustom').value = '';
            _mixdownBars = +btn.dataset.bars;
        });
    });
    document.getElementById('mixdownBarsCustom').addEventListener('input', function() {
        const v = parseInt(this.value);
        if (v >= 1 && v <= 128) {
            document.querySelectorAll('.mxd-bar-btn').forEach(b => b.classList.remove('active'));
            _mixdownBars = v;
        }
    });

    document.getElementById('btnMixdownStart').addEventListener('click', startMixdown);
    document.getElementById('btnMixdownAbort').addEventListener('click', abortMixdown);
    document.getElementById('btnStemExport').addEventListener('click', startStemExport);
    document.getElementById('btnRecStart').addEventListener('click', startRecording);
    document.getElementById('btnRecStop').addEventListener('click', stopRecording);

    // Audio Input
    document.getElementById('btnAudioInputPerm').addEventListener('click', initAudioInputDevices);
    document.getElementById('btnAudioInputStart').addEventListener('click', startAudioInput);
    document.getElementById('btnAudioInputStop').addEventListener('click', stopAudioInput);
    document.getElementById('btnAudioInputMonitor').addEventListener('click', toggleAudioInputMonitor);
    document.getElementById('audioInputMonGain').addEventListener('input', function () {
        document.getElementById('audioInputMonGainVal').textContent = Math.round(this.value * 100) + '%';
        if (_audioInputGain) _audioInputGain.gain.value = +this.value;
    });
}

// Helper: tap the master limiter output (reliable signal point)
function _connectRecorder(rec) {
    if (masterLimiter) masterLimiter.connect(rec);
    else Tone.getDestination().connect(rec);
}
function _disconnectRecorder(rec) {
    try { if (masterLimiter) masterLimiter.disconnect(rec); else Tone.getDestination().disconnect(rec); } catch(e) {}
}

// Animated progress bar over recMs milliseconds
function _animateProgress(fillId, labelId, totalMs, getLabelFn) {
    const fill  = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    const start = Date.now();
    let raf;
    function tick() {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, (elapsed / totalMs) * 100);
        fill.style.width = pct + '%';
        label.textContent = getLabelFn(elapsed, totalMs);
        if (pct < 100) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
}

// ── Auto Mixdown ─────────────────────────────────────────────
async function startMixdown() {
    await startAudio();
    _mixdownAborted = false;

    const bars = _mixdownBars;
    const bpm  = +document.getElementById('bpm').value || Tone.getTransport().bpm.value;
    const barMs = (60000 / bpm) * 4;
    const recMs = bars * barMs + 400; // 400ms tail buffer

    // UI: running state
    const btnStart = document.getElementById('btnMixdownStart');
    const btnAbort = document.getElementById('btnMixdownAbort');
    const progress = document.getElementById('mixdownProgress');
    btnStart.disabled = true;
    btnAbort.classList.remove('hidden');
    progress.classList.remove('hidden');

    const stopAnim = _animateProgress('mixdownFill', 'mixdownProgressLabel', recMs,
        (elapsed) => {
            const secLeft = Math.max(0, Math.ceil((recMs - elapsed) / 1000));
            return `Opnemen — ${secLeft}s resterend…`;
        }
    );

    const wasPlaying = S.isPlaying;
    if (wasPlaying) stopPlayback();
    Tone.getTransport().position = 0;

    const rec = new Tone.Recorder();
    _connectRecorder(rec);
    startPlayback();
    await new Promise(r => setTimeout(r, 200)); // warm-up
    await rec.start();
    setLed('recording');

    await new Promise(r => setTimeout(r, recMs));

    stopAnim();

    if (_mixdownAborted) {
        await rec.stop();
        rec.dispose(); _disconnectRecorder(rec);
        stopPlayback();
        _resetMixdownUI();
        setStatus('Mixdown afgebroken', 'err');
        return;
    }

    const blob = await rec.stop();
    rec.dispose(); _disconnectRecorder(rec);
    stopPlayback();

    // Show 100% briefly before resetting
    document.getElementById('mixdownFill').style.width = '100%';
    document.getElementById('mixdownProgressLabel').textContent = 'Klaar! Download wordt gestart…';
    setLed(S.isPlaying ? 'playing' : 'off');
    setStatus(`Mixdown klaar — ${bars} bars opgenomen ✓`, 'ok');

    const timestamp = new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
    downloadBlob(blob, `shotmusic_mixdown_${bars}bars_${timestamp}.webm`);

    await new Promise(r => setTimeout(r, 1200));
    _resetMixdownUI();
}

function abortMixdown() {
    _mixdownAborted = true;
}

function _resetMixdownUI() {
    document.getElementById('btnMixdownStart').disabled = false;
    document.getElementById('btnMixdownAbort').classList.add('hidden');
    document.getElementById('mixdownProgress').classList.add('hidden');
    document.getElementById('mixdownFill').style.width = '0%';
}

// ── Stem Export ──────────────────────────────────────────────
async function startStemExport() {
    await startAudio();
    const bars = parseInt(document.getElementById('stemBars').value) || 8;
    const bpm  = +document.getElementById('bpm').value || Tone.getTransport().bpm.value;
    const barMs = (60000 / bpm) * 4;
    const recMs = bars * barMs + 400;
    const origMutes = SEQ.tracks.map(t => t.mute);

    const btn      = document.getElementById('btnStemExport');
    const progress = document.getElementById('stemProgress');
    btn.disabled = true;
    progress.classList.remove('hidden');

    const tracks = SEQ.tracks.filter(t => !t.mute);
    if (!tracks.length) {
        btn.disabled = false;
        progress.classList.add('hidden');
        setStatus('Geen tracks om te exporteren', 'err');
        return;
    }

    setStatus(`Stems exporteren: 0 / ${tracks.length}…`);

    for (let i = 0; i < tracks.length; i++) {
        if (S.isPlaying) stopPlayback();
        Tone.getTransport().position = 0;

        // Mute all except this track
        SEQ.tracks.forEach((t, j) => { t.mute = SEQ.tracks[j].uid !== tracks[i].uid; });

        // Update progress UI
        document.getElementById('stemFill').style.width = ((i / tracks.length) * 100) + '%';
        document.getElementById('stemProgressLabel').textContent =
            `Track ${i + 1} / ${tracks.length}: ${tracks[i].label}`;

        const rec = new Tone.Recorder();
        _connectRecorder(rec);
        startPlayback();
        await new Promise(r => setTimeout(r, 250));
        await rec.start();
        setLed('recording');
        await new Promise(r => setTimeout(r, recMs));
        const blob = await rec.stop();
        rec.dispose(); _disconnectRecorder(rec);
        stopPlayback();

        const safeName = tracks[i].label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        downloadBlob(blob, `stem_${String(i+1).padStart(2,'0')}_${safeName}.webm`);
        await new Promise(r => setTimeout(r, 300));
    }

    // Restore mutes
    SEQ.tracks.forEach((t, i) => { t.mute = origMutes[i]; });
    setLed('off');

    document.getElementById('stemFill').style.width = '100%';
    document.getElementById('stemProgressLabel').textContent = `${tracks.length} stems klaar ✓`;
    setStatus(`${tracks.length} stems geëxporteerd ✓`, 'ok');

    await new Promise(r => setTimeout(r, 1500));
    btn.disabled = false;
    progress.classList.add('hidden');
    document.getElementById('stemFill').style.width = '0%';
}

// ── Handmatige opname ────────────────────────────────────────
async function startRecording() {
    await startAudio();
    toneRecorder = new Tone.Recorder();
    _connectRecorder(toneRecorder);
    await toneRecorder.start();
    document.getElementById('btnRecStop').disabled = false;
    document.getElementById('btnRecStart').disabled = true;
    setLed('recording');
    setStatus('Opname loopt — klik Stop om te downloaden…');
}
async function stopRecording() {
    if (!toneRecorder) return;
    const blob = await toneRecorder.stop();
    _disconnectRecorder(toneRecorder);
    toneRecorder.dispose(); toneRecorder = null;
    document.getElementById('btnRecStop').disabled = true;
    document.getElementById('btnRecStart').disabled = false;
    setLed(S.isPlaying ? 'playing' : 'off');
    const timestamp = new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
    downloadBlob(blob, `shotmusic_opname_${timestamp}.webm`);
    setStatus('Opname opgeslagen ✓', 'ok');
}

// ── Audio Input Recording ────────────────────────────────────
let _audioInputStream   = null;
let _audioInputRecorder = null;
let _audioInputSource   = null;
let _audioInputGain     = null;
let _audioInputAnalyser = null;
let _audioInputMonitoring = false;
let _audioInputLevelRAF = null;
let _audioInputChunks   = [];

async function initAudioInputDevices() {
    const sel = document.getElementById('audioInputDevice');
    const btn = document.getElementById('btnAudioInputPerm');
    btn.disabled = true;
    btn.textContent = 'Bezig…';
    try {
        // Temp stream to trigger permission dialog, then stop it immediately
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
        tmp.getTracks().forEach(t => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs  = devices.filter(d => d.kind === 'audioinput');
        sel.innerHTML = '';
        inputs.forEach((d, i) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || `Microfoon ${i + 1}`;
            sel.appendChild(opt);
        });
        btn.textContent = '↺ Verversen';
        setStatus(`${inputs.length} audio-apparaat(en) gevonden`, 'ok');
    } catch (e) {
        sel.innerHTML = '<option value="">Geen toegang verleend</option>';
        btn.textContent = 'Toestemming';
        setStatus('Microfoon toegang geweigerd', 'err');
    } finally {
        btn.disabled = false;
    }
}

async function startAudioInput() {
    if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('getUserMedia niet beschikbaar in deze browser', 'err');
        return;
    }

    const deviceId = document.getElementById('audioInputDevice').value;
    const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true,
    };

    try {
        _audioInputStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
        setStatus('Microfoon openen mislukt: ' + e.message, 'err');
        return;
    }

    // WebAudio nodes for metering + optional monitoring
    const rawCtx = Tone.getContext().rawContext;
    _audioInputSource   = rawCtx.createMediaStreamSource(_audioInputStream);
    _audioInputAnalyser = rawCtx.createAnalyser();
    _audioInputAnalyser.fftSize = 256;
    _audioInputGain = rawCtx.createGain();
    _audioInputGain.gain.value = +document.getElementById('audioInputMonGain').value || 0.7;

    _audioInputSource.connect(_audioInputAnalyser);

    if (_audioInputMonitoring) {
        _audioInputSource.connect(_audioInputGain);
        _audioInputGain.connect(rawCtx.destination);
    }

    _startInputLevelMeter();

    // Record directly from the stream via MediaRecorder
    _audioInputChunks = [];
    _audioInputRecorder = new MediaRecorder(_audioInputStream);
    _audioInputRecorder.ondataavailable = e => { if (e.data.size > 0) _audioInputChunks.push(e.data); };
    _audioInputRecorder.onstop = () => {
        const blob = new Blob(_audioInputChunks, { type: 'audio/webm' });
        const ts = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        downloadBlob(blob, `shotmusic_input_${ts}.webm`);
        setStatus('Audio input opgeslagen ✓', 'ok');
        _audioInputChunks = [];
    };
    _audioInputRecorder.start();

    document.getElementById('btnAudioInputStart').disabled = true;
    document.getElementById('btnAudioInputStop').disabled  = false;
    document.getElementById('btnAudioInputPerm').disabled  = true;
    const statusEl = document.getElementById('audioInputStatus');
    statusEl.textContent = '● REC';
    statusEl.style.color = 'var(--red)';
    setLed('recording');
    setStatus('Audio input opname loopt…');
}

function stopAudioInput() {
    if (_audioInputRecorder && _audioInputRecorder.state !== 'inactive') {
        _audioInputRecorder.stop();
    }
    _stopInputLevelMeter();

    if (_audioInputSource)   { try { _audioInputSource.disconnect();  } catch(e){} _audioInputSource = null; }
    if (_audioInputGain)     { try { _audioInputGain.disconnect();    } catch(e){} _audioInputGain   = null; }
    if (_audioInputAnalyser) { try { _audioInputAnalyser.disconnect();} catch(e){} _audioInputAnalyser = null; }
    if (_audioInputStream)   { _audioInputStream.getTracks().forEach(t => t.stop()); _audioInputStream = null; }
    _audioInputRecorder = null;

    document.getElementById('btnAudioInputStart').disabled = false;
    document.getElementById('btnAudioInputStop').disabled  = true;
    document.getElementById('btnAudioInputPerm').disabled  = false;
    const statusEl = document.getElementById('audioInputStatus');
    statusEl.textContent = 'Gestopt';
    statusEl.style.color = 'var(--muted)';
    setLed(S.isPlaying ? 'playing' : 'off');
}

function toggleAudioInputMonitor() {
    _audioInputMonitoring = !_audioInputMonitoring;
    const btn = document.getElementById('btnAudioInputMonitor');
    btn.textContent = _audioInputMonitoring ? 'Aan' : 'Uit';
    btn.classList.toggle('active', _audioInputMonitoring);

    if (_audioInputSource && _audioInputGain) {
        const rawCtx = Tone.getContext().rawContext;
        if (_audioInputMonitoring) {
            _audioInputSource.connect(_audioInputGain);
            _audioInputGain.connect(rawCtx.destination);
        } else {
            try { _audioInputGain.disconnect(); } catch(e) {}
        }
    }
}

function _startInputLevelMeter() {
    const canvas = document.getElementById('audioInputMeter');
    if (!canvas || !_audioInputAnalyser) return;
    const ctx = canvas.getContext('2d');
    const data = new Uint8Array(_audioInputAnalyser.frequencyBinCount);
    const W = canvas.width, H = canvas.height;

    function draw() {
        _audioInputLevelRAF = requestAnimationFrame(draw);
        _audioInputAnalyser.getByteFrequencyData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length) / 255;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0b0f';
        ctx.fillRect(0, 0, W, H);

        const barW = Math.min(W, rms * W * 3.5);
        if (barW > 0) {
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0,   '#3af0a0');
            grad.addColorStop(0.7, '#f0c030');
            grad.addColorStop(1,   '#f03060');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, barW, H);
        }
    }
    draw();
}

function _stopInputLevelMeter() {
    if (_audioInputLevelRAF) { cancelAnimationFrame(_audioInputLevelRAF); _audioInputLevelRAF = null; }
    const canvas = document.getElementById('audioInputMeter');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a0b0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ── Reset project ───────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click',function(){
    if(!confirm('Project resetten naar standaard?\nAlle tracks, patronen en instellingen worden gewist.')) return;
    try { localStorage.removeItem(PROJECT_KEY); } catch(e){}
    location.reload();
});
