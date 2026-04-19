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
            hihatType: t.hihatType,
            bassType:  t.bassType,
            padPreset: t.padPreset,
            padMode:   t.padMode,
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
            hihatType: td.hihatType ?? 'closed',
            bassType:  td.bassType  ?? 'saw',
            padPreset: td.padPreset ?? 'warm',
            padMode:   td.padMode   ?? 'chord',
            volume:   td.volume ?? 0,
            pan:      td.pan ?? 0,
            fx:       Object.assign({rev:0,dly:0,flt:20000,dist:0}, td.fx??{}),
            fxNodes:  null,
            synth:    null, extra:null, howl:null, filename:td.filename??null,
            editMode:   td.editMode ?? 'steps',
            pianoRoll:  td.pianoRoll ?? [],
            pianoRollBars: td.pianoRollBars ?? 4,
            part:       null,
            activePattern: td.activePattern ?? 'A',
            queuedPattern: null,
            midiOut: td.midiOut ?? { enabled:false, channel:1, drumNote:null },
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

// ── Recording ───────────────────────────────────────────────
async function startRecording() {
    await startAudio();
    toneRecorder = new Tone.Recorder();
    Tone.getDestination().connect(toneRecorder);
    await toneRecorder.start();
    document.getElementById('btnRecStop').disabled=false;
    document.getElementById('btnRecStart').disabled=true;
    setLed('recording');
    setStatus('Opname loopt…');
}
async function stopRecording() {
    if(!toneRecorder) return;
    const blob = await toneRecorder.stop();
    toneRecorder.dispose(); toneRecorder=null;
    downloadBlob(blob,'shotmusic.webm');
    document.getElementById('btnRecStop').disabled=true;
    document.getElementById('btnRecStart').disabled=false;
    setLed(S.isPlaying?'playing':'off');
    setStatus('Opname opgeslagen!','ok');
}

// ── Reset project ───────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click',function(){
    if(!confirm('Project resetten naar standaard?\nAlle tracks, patronen en instellingen worden gewist.')) return;
    try { localStorage.removeItem(PROJECT_KEY); } catch(e){}
    location.reload();
});
