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
        keySelect:      V('keySelect'),
        genreSelect:    V('genreSelect'),
        progressionSelect: V('progressionSelect'),
        chordBars:      +V('chordBars'),
        voiceLead:      document.getElementById('voiceLead')?.checked ?? false,
        pianoSound:     V('pianoSound'),
        chordPreset:    V('chordPreset'),
        attack:         +V('attack'),
        release:        +V('release'),
        detune:         +V('detune'),
        chorus:         +V('chorus'),
        reverb:         +V('reverb'),
        delay:          +V('delay'),
        filter:         +V('filter'),
        chordMute:      S.chordMute,
        sidechain:      {...S.sidechain},
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
            kickType: t.kickType,
            bassType: t.bassType,
            volume:   t.volume,
            pan:      t.pan,
            fx:       {...t.fx},
            steps:    [...t.steps],
            vels:     [...t.vels],
            probs:    [...t.probs],
            lfo:      {...t.lfo},
            filename: t.filename ?? null,
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

async function loadProjectData(data) {
    if(!data||data.version<2) { setStatus('Ongeldig of oud projectbestand','err'); return; }
    // Stop playback first
    if(S.isPlaying) stopPlayback();

    // Restore UI fields
    const set=(id,v)=>{ const el=document.getElementById(id); if(el){ el.value=v; el.dispatchEvent(new Event('input')); } };
    set('bpm', data.bpm);
    set('seqSwing', data.swing);
    set('chordBars', data.chordBars);
    set('keySelect', data.keySelect);
    set('genreSelect', data.genreSelect);
    set('progressionSelect', data.progressionSelect);
    set('pianoSound', data.pianoSound);
    set('chordPreset', data.chordPreset);
    set('attack', data.attack); set('release', data.release); set('detune', data.detune);
    set('chorus', data.chorus); set('reverb', data.reverb);
    set('delay', data.delay);   set('filter', data.filter);
    if(document.getElementById('voiceLead')) document.getElementById('voiceLead').checked=data.voiceLead;

    // Restore state
    S.chordMute   = data.chordMute ?? false;
    if(data.sidechain) Object.assign(S.sidechain, data.sidechain);
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
            lfo:      Object.assign({enabled:false,target:'filter',rate:2,depth:0.3}, td.lfo??{}),
            lfoNode:  null,
            mute:     td.mute ?? false,
            kickType: td.kickType ?? 'classic',
            bassType: td.bassType ?? 'saw',
            volume:   td.volume ?? 0,
            pan:      td.pan ?? 0,
            fx:       Object.assign({rev:0,dly:0,flt:20000,dist:0}, td.fx??{}),
            fxNodes:  null,
            synth:    null, extra:null, howl:null, filename:td.filename??null,
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
    setStatus('Project geladen ✓','ok');
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
