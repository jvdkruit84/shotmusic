// ── API ─────────────────────────────────────────────────────
async function loadProgression() {
    const root=V('rootNote'),mode=V('keyMode'),key=root+(mode==='minor'?'m':'');
    const prog=V('progression'),oct=V('octave'),vl=document.getElementById('voiceLead').checked;
    setStatus('Laden…');
    try {
        const r=await fetch(`${API}?action=getProgression&key=${encodeURIComponent(key)}&progression=${encodeURIComponent(prog)}&octave=${oct}&voiceLead=${vl}`);
        S.progression=await r.json(); S.chordNames=S.progression.map(chordRoot); S.currentChord=0;
        buildChordGrid(); setStatus(`Progressie: ${prog}`,'ok');
    } catch(e) { setStatus('Fout: '+e.message,'err'); }
}
async function loadScale() {
    const root=V('rootNote'),scale=V('scaleType'),oct=+V('octave');
    try {
        const [r1,r2,r3]=await Promise.all([
            fetch(`${API}?action=getScale&root=${encodeURIComponent(root)}&scale=${encodeURIComponent(scale)}&octave=${oct-1}`),
            fetch(`${API}?action=getScale&root=${encodeURIComponent(root)}&scale=${encodeURIComponent(scale)}&octave=${oct}`),
            fetch(`${API}?action=getScale&root=${encodeURIComponent(root)}&scale=${encodeURIComponent(scale)}&octave=${oct+1}`),
        ]);
        S.scale=[...await r1.json(),...await r2.json(),...await r3.json()];
        highlightPiano(); refreshMelodicSteps();
    } catch(e){}
}

// ── Change track type ───────────────────────────────────────
function changeTrackType(track, newType) {
    if (track.type === 'sample') { try{track.howl?.unload();}catch(e){} track.howl=null; track.filename=null; }
    const def = TRACK_TYPES[newType];
    const wasMelodic = track.melodic;
    track.type    = newType;
    track.color   = def.color;
    track.melodic = def.melodic;
    // Reset steps when switching between rhythmic ↔ melodic
    if (wasMelodic !== def.melodic) {
        track.steps = Array(32).fill(def.melodic ? null : 0);
    }
    renumberTracks();
    if (S.audioReady) buildTrackSynth(track);
    buildSeqGrid();
    if (S.isPlaying) buildSeqLoop();
    setStatus('Track: ' + def.label, 'ok');
}

function renumberTracks() {
    const counters = {};
    SEQ.tracks.forEach(t => {
        counters[t.type] = (counters[t.type] ?? 0) + 1;
    });
    const seen = {};
    SEQ.tracks.forEach(t => {
        seen[t.type] = (seen[t.type] ?? 0) + 1;
        const total = counters[t.type];
        t.label = TRACK_TYPES[t.type].label.toUpperCase() + (total > 1 ? ' ' + seen[t.type] : '');
    });
}

// ── Add / Remove tracks ─────────────────────────────────────
function addTrack(type) {
    const track=makeTrack(type);
    SEQ.tracks.push(track);
    if(S.audioReady) buildTrackSynth(track);
    buildSeqGrid();
    if(S.isPlaying) buildSeqLoop();
    setStatus(`Track toegevoegd: ${track.label}`,'ok'); autoSave();
}

function removeTrack(uid) {
    const idx=SEQ.tracks.findIndex(t=>t.uid===uid);
    if(idx<0) return;
    const track=SEQ.tracks[idx];
    stopTrackLFO(track);
    try{track.synth?.dispose();}catch(e){}
    try{track.extra?.dispose();}catch(e){}
    try{track.howl?.unload();}catch(e){}
    if(track.fxNodes) { ['pan','vol','rev','dly','flt','dist'].forEach(k=>{try{track.fxNodes[k]?.dispose();}catch(e){}}) }
    SEQ.tracks.splice(idx,1);
    renumberTracks();
    buildSeqGrid();
    if(S.isPlaying) buildSeqLoop();
    setStatus(`Track verwijderd`,'ok'); autoSave();
}

// ── Patterns ────────────────────────────────────────────────
function setDefaultPattern() {
    SEQ.tracks.forEach(track=>{
        if(track.type==='kick')   track.steps=Array(32).fill(0).map((_,i)=>i%4===0?1:0);
        else if(track.type==='snare') track.steps=Array(32).fill(0).map((_,i)=>i%8===4?1:0);
        else if(track.type==='hihat') track.steps=Array(32).fill(0).map((_,i)=>i%4===2?1:0);
        else if(track.type==='bass'){
            const bn=getScaleNotes('bass'); track.steps=Array(32).fill(null).map((_,i)=>i%8===0?bn[0]??33:null);
        } else if(track.type==='melody'){
            const mn=getScaleNotes('melody'); track.steps=Array(32).fill(null).map((_,i)=>[0,2,4,6].indexOf(i%8)>=0?mn[[0,2,4,6].indexOf(i%8)]??null:null);
        }
    });
    buildSeqGrid();
}
function clearPattern()  { SEQ.tracks.forEach(t=>t.steps=Array(32).fill(t.melodic?null:0)); buildSeqGrid(); }
function randomPattern() {
    SEQ.tracks.forEach(track=>{
        if(!track.melodic) { track.steps=Array(32).fill(0).map(()=>Math.random()<(track.type==='kick'?.25:track.type==='snare'?.15:.35)?1:0); }
        else { const ns=getScaleNotes(track.type); track.steps=Array(32).fill(null).map(()=>Math.random()<.2?ns[Math.floor(Math.random()*ns.length)]??null:null); }
    });
    buildSeqGrid();
}

// ── Event wiring ────────────────────────────────────────────
document.getElementById('btnPlay').addEventListener('click',startPlayback);
document.getElementById('btnStop').addEventListener('click',()=>{ stopPlayback(); autoSave(); });
document.getElementById('btnMidi').addEventListener('click',exportMidi);
document.getElementById('btnRecStart').addEventListener('click',startRecording);
document.getElementById('btnRecStop').addEventListener('click',stopRecording);
document.getElementById('btnSave').addEventListener('click',saveProjectFile);
document.getElementById('btnLoad').addEventListener('click',()=>document.getElementById('loadFileInput').click());
document.getElementById('loadFileInput').addEventListener('change',function(){
    const f=this.files[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=e=>{ try{ loadProjectData(JSON.parse(e.target.result)); }catch(err){ setStatus('Fout bij laden: '+err.message,'err'); } };
    reader.readAsText(f); this.value='';
});
document.getElementById('chordMuteBtn').addEventListener('click',function(){
    S.chordMute=!S.chordMute;
    this.classList.toggle('muted',S.chordMute);
    if(S.chordMute) chordSynth?.releaseAll();
    autoSave();
});
// Sidechain listeners
document.getElementById('btnScPanel').addEventListener('click',function(){
    const p=document.getElementById('scPanel'); p.classList.toggle('open'); this.classList.toggle('active',p.classList.contains('open'));
});
document.getElementById('scEnable').addEventListener('click',function(){
    S.sidechain.enabled=!S.sidechain.enabled;
    this.textContent=S.sidechain.enabled?'● Aan':'● Uit';
    this.classList.toggle('active',S.sidechain.enabled);
    autoSave();
});
document.getElementById('scDepth').addEventListener('input',function(){
    S.sidechain.depth=+this.value; document.getElementById('scDepthVal').textContent=Math.round(this.value*100)+'%'; autoSave();
});
document.getElementById('scRelease').addEventListener('input',function(){
    S.sidechain.release=+this.value; document.getElementById('scReleaseVal').textContent=this.value+'s'; autoSave();
});

// Pattern listeners
document.getElementById('btnPatCopy').addEventListener('click',()=>{
    const target=document.getElementById('patCopyTarget').value; if(!target) return;
    saveCurrentPattern();
    SEQ.patterns[target].data=JSON.parse(JSON.stringify(SEQ.patterns[SEQ.currentPattern].data));
    buildPatternBar(); setStatus(`Patroon ${SEQ.currentPattern} → ${target} gekopieerd`,'ok'); autoSave();
});
document.getElementById('btnSongMode').addEventListener('click',function(){
    SEQ.songMode=!SEQ.songMode; this.classList.toggle('active',SEQ.songMode);
    document.getElementById('songBar').classList.toggle('open',SEQ.songMode);
    if(SEQ.songMode){ SEQ.songPos=0; buildSongBar(); }
    autoSave();
});
document.getElementById('btnSongAdd').addEventListener('click',()=>{
    SEQ.songArrangement.push(SEQ.currentPattern); buildSongBar(); autoSave();
});
document.getElementById('btnSongClear').addEventListener('click',()=>{
    SEQ.songArrangement=[]; SEQ.songPos=0; buildSongBar(); autoSave();
});

document.getElementById('seqDefault').addEventListener('click',setDefaultPattern);
document.getElementById('seqClear').addEventListener('click',clearPattern);
document.getElementById('seqRandom').addEventListener('click',randomPattern);
document.getElementById('btnMelGen').addEventListener('click',function(){
    const panel=document.getElementById('melGenPanel');
    const open=panel.classList.toggle('open');
    this.classList.toggle('active',open);
    if(open) updateMgTrackList();
});
document.getElementById('btnMelGenRun').addEventListener('click',generateMelody);
document.getElementById('seqStepCount').addEventListener('change',function(){ SEQ.steps=+this.value; buildSeqGrid(); if(S.isPlaying)buildSeqLoop(); });
document.getElementById('seqSwing').addEventListener('input',function(){ document.getElementById('seqSwingVal').textContent=Math.round(this.value*100)+'%'; Tone.getTransport().swing=+this.value; });
document.getElementById('bpm').addEventListener('input',function(){
    document.getElementById('bpmVal').textContent=this.value;
    Tone.getTransport().bpm.value=+this.value;
    if(S.isPlaying){ buildChordPart(); buildSeqLoop(); }
});
document.getElementById('chordBars').addEventListener('input',function(){ document.getElementById('barVal').textContent=this.value; if(S.isPlaying)buildChordPart(); });
function applyPreset(key) {
    const p = CHORD_PRESETS[key];
    if (p) {
        document.getElementById('attack').value = p.env.attack;
        document.getElementById('attackVal').textContent = p.env.attack + 's';
        document.getElementById('release').value = p.env.release;
        document.getElementById('releaseVal').textContent = p.env.release + 's';
        if (p.detune !== undefined) {
            document.getElementById('detune').value = p.detune;
            document.getElementById('detuneVal').textContent = p.detune + 'ct';
        }
    }
    // Sync both selectors
    document.getElementById('chordPreset').value = key;
    document.getElementById('pianoSound').value = key;
    if (S.audioReady) buildChordSynth(key);
    SEQ.tracks.filter(t => t.type === 'melody').forEach(t => buildTrackSynth(t));
}
document.getElementById('pianoSound').addEventListener('change', function() {
    applyPreset(this.value);
    setStatus('Geluid: ' + this.options[this.selectedIndex].text, 'ok');
});
document.getElementById('chordPreset').addEventListener('change', function() {
    applyPreset(this.value);
    setStatus('Geluid: ' + this.options[this.selectedIndex].text, 'ok');
});
['attack','release','detune','chorus','reverb','delay','filter'].forEach(id=>{
    document.getElementById(id).addEventListener('input',function(){
        const pct=['reverb','delay','chorus'].includes(id);
        const sfx = pct ? '%' : id==='filter' ? 'Hz' : id==='detune' ? 'ct' : 's';
        document.getElementById(id+'Val').textContent = pct ? Math.round(this.value*100)+sfx : this.value+sfx;
        if(S.audioReady) buildChordSynth(getPreset());
    });
});
['rootNote','keyMode','scaleType','progression','octave','voiceLead'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',()=>{loadProgression();loadScale();});
});
document.getElementById('genre').addEventListener('change',async function(){
    const root=V('rootNote'),mode=V('keyMode'),key=root+(mode==='minor'?'m':''),oct=V('octave');
    setStatus('Genre laden…');
    try {
        const r=await fetch(`${API}?action=getProgressionForGenre&genre=${this.value}&key=${encodeURIComponent(key)}&octave=${oct}`);
        const data=await r.json();
        document.getElementById('progression').value=data.progression;
        S.progression=data.chords; S.chordNames=data.chords.map(chordRoot); S.currentChord=0;
        buildChordGrid(); setStatus(`Genre: ${this.value} — ${data.progression}`,'ok');
    } catch(e){setStatus('Fout: '+e.message,'err');}
    await loadScale();
});

// ── Init ────────────────────────────────────────────────────
buildPiano(36,96);
// Default tracks (only if not loaded from localStorage)
if(!SEQ.tracks.length){
    ['kick','snare','hihat','bass','melody'].forEach(type=>SEQ.tracks.push(makeTrack(type)));
    setDefaultPattern();
}
buildSeqGrid();
buildPatternBar();
buildSongBar();
loadProgression();
loadScale();
</script>
