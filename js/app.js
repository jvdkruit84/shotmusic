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

// ── Key info badge ───────────────────────────────────────────
function updateKeyInfo() {
    const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const root = V('rootNote'), mode = V('keyMode');
    const idx = notes.indexOf(root);
    let rel, parallel;
    if (mode === 'minor') {
        rel = notes[(idx + 3) % 12]; // relative major
        parallel = root; // parallel major = same root
        document.getElementById('keyInfoBadge').textContent =
            `rel: ${rel} maj  ·  par: ${root} maj`;
    } else {
        rel = notes[(idx + 9) % 12] + 'm'; // relative minor
        parallel = root + 'm';
        document.getElementById('keyInfoBadge').textContent =
            `rel: ${rel}  ·  par: ${root}m`;
    }
}

// ── ADSR visualisation ───────────────────────────────────────
function updateAdsrDisplay() {
    const atk=+V('attack'), dec=+V('decay'), sus=+V('sustain'), rel=+V('release');
    const W=184, H=36, pad=2;
    const hold = Math.max(atk * 0.5, 0.3); // virtual sustain hold duration
    const total = atk + dec + hold + rel;
    const px = t => pad + (t/total)*(W-pad*2);
    const py = v => pad + (1-v)*(H-pad*2-6); // 6px reserved for labels
    const x0=pad, y0=py(0);
    const x1=px(atk), y1=py(1);
    const x2=px(atk+dec), y2=py(sus);
    const x3=px(atk+dec+hold), y3=py(sus);
    const x4=px(total), y4=py(0);
    const d=`M${x0},${y0} L${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4}`;
    document.getElementById('adsrPath').setAttribute('d', d);
    // Update segment labels
    document.querySelector('#adsrSvg text:first-of-type').setAttribute('x', x0);
    document.getElementById('adsrLblD').setAttribute('x', (x1+x2)/2-3);
    document.getElementById('adsrLblS').setAttribute('x', (x2+x3)/2-3);
    document.getElementById('adsrLblR').setAttribute('x', (x3+x4)/2-3);
}

// ── Change track type ───────────────────────────────────────
function changeTrackType(track, newType) {
    pushHistory();
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
    pushHistory();
    const track=makeTrack(type);
    SEQ.tracks.push(track);
    if(S.audioReady) buildTrackSynth(track);
    buildSeqGrid();
    if(S.isPlaying) buildSeqLoop();
    refreshMixerIfOpen();
    setStatus(`Track toegevoegd: ${track.label}`,'ok'); autoSave();
}

function removeTrack(uid) {
    pushHistory();
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
    refreshMixerIfOpen();
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

// Root note grid
document.getElementById('rootGrid').addEventListener('click',function(e){
    const btn=e.target.closest('.root-btn'); if(!btn) return;
    this.querySelectorAll('.root-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rootNote').value=btn.dataset.note;
    updateKeyInfo(); loadProgression(); loadScale();
});

// Mode buttons
document.getElementById('modeBtnMinor').addEventListener('click',function(){
    document.getElementById('modeBtnMinor').classList.add('active');
    document.getElementById('modeBtnMajor').classList.remove('active');
    document.getElementById('keyMode').value='minor';
    updateKeyInfo(); loadProgression(); loadScale();
});
document.getElementById('modeBtnMajor').addEventListener('click',function(){
    document.getElementById('modeBtnMajor').classList.add('active');
    document.getElementById('modeBtnMinor').classList.remove('active');
    document.getElementById('keyMode').value='major';
    updateKeyInfo(); loadProgression(); loadScale();
});

document.getElementById('chordVolume').addEventListener('input',function(){
    document.getElementById('chordVolumeVal').textContent=this.value+'dB';
    if(chordVol) chordVol.volume.value=+this.value;
    autoSave();
});
document.getElementById('chordMuteBtn').addEventListener('click',function(){
    S.chordMute=!S.chordMute;
    this.classList.toggle('muted',S.chordMute);
    if(S.chordMute) chordSynth?.releaseAll();
    autoSave();
});
// Sidechain listeners
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
    if(SEQ.songMode){ SEQ.songPos=0; buildSongBar(); }
    autoSave();
});
document.getElementById('btnSongAdd').addEventListener('click',()=>{
    SEQ.songArrangement.push(SEQ.currentPattern); buildSongBar(); autoSave();
});
document.getElementById('btnSongClear').addEventListener('click',()=>{
    SEQ.songArrangement=[]; SEQ.songPos=0; buildSongBar(); autoSave();
});

document.getElementById('seqDefault').addEventListener('click',()=>{ pushHistory(); setDefaultPattern(); autoSave(); });
document.getElementById('seqClear').addEventListener('click',()=>{ pushHistory(); clearPattern(); autoSave(); });
document.getElementById('seqRandom').addEventListener('click',()=>{ pushHistory(); randomPattern(); autoSave(); });

document.getElementById('btnMuteAll').addEventListener('click', () => {
    const btn = document.getElementById('btnMuteAll');
    const allMuted = SEQ.tracks.every(t => t.mute);
    SEQ.tracks.forEach(t => {
        t.mute = !allMuted;
        document.querySelector(`.seq-mute-btn[data-uid="${t.uid}"]`)?.classList.toggle('muted', t.mute);
    });
    btn.classList.toggle('active', !allMuted);
    btn.textContent = allMuted ? 'Mute All' : 'Unmute All';
    autoSave();
});
document.getElementById('btnMelGen').addEventListener('click',function(){
    const panel=document.getElementById('melGenPanel');
    const open=panel.classList.toggle('open');
    this.classList.toggle('active',open);
    if(open) updateMgTrackList();
});
document.getElementById('btnMelGenRun').addEventListener('click',()=>{ pushHistory(); generateMelody(); });
document.getElementById('seqStepCount').addEventListener('change',function(){ SEQ.steps=+this.value; buildSeqGrid(); if(S.isPlaying)buildSeqLoop(); });
document.getElementById('seqSwing').addEventListener('input',function(){ document.getElementById('seqSwingVal').textContent=Math.round(this.value*100)+'%'; Tone.getTransport().swing=+this.value; });
document.getElementById('bpm').addEventListener('input',function(){
    document.getElementById('bpmVal').textContent=this.value;
    Tone.getTransport().bpm.value=+this.value;
    if(S.isPlaying){ buildChordPart(); buildSeqLoop(); }
});

// ── Tap Tempo ───────────────────────────────────────────────
(function(){
    const taps = [];
    const MAX_GAP = 2000; // reset after 2s silence
    const MAX_TAPS = 8;
    let flashTimer = null;

    document.getElementById('btnTap').addEventListener('click', function() {
        const now = performance.now();
        // Reset if too long since last tap
        if (taps.length && now - taps[taps.length-1] > MAX_GAP) taps.length = 0;
        taps.push(now);
        if (taps.length > MAX_TAPS) taps.shift();

        if (taps.length >= 2) {
            // Average interval between consecutive taps
            let sum = 0;
            for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i-1];
            const avgMs = sum / (taps.length - 1);
            const bpm = Math.round(60000 / avgMs);
            const clamped = Math.max(60, Math.min(200, bpm));
            const slider = document.getElementById('bpm');
            slider.value = clamped;
            document.getElementById('bpmVal').textContent = clamped;
            Tone.getTransport().bpm.value = clamped;
            if (S.isPlaying) { buildChordPart(); buildSeqLoop(); }
        }

        // Flash animation
        this.classList.add('tapping');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => this.classList.remove('tapping'), 120);

        // Show tap count hint
        const hint = taps.length < 2 ? 'Tik nog eens…' : `BPM: ${document.getElementById('bpmVal').textContent} (${taps.length} taps)`;
        setStatus(hint);
    });
})();
document.getElementById('chordBars').addEventListener('input',function(){ document.getElementById('barVal').textContent=this.value; if(S.isPlaying)buildChordPart(); });

function applyPreset(key) {
    const p = CHORD_PRESETS[key];
    if (p) {
        document.getElementById('attack').value  = p.env.attack;
        document.getElementById('attackVal').textContent  = p.env.attack + 's';
        document.getElementById('decay').value   = p.env.decay;
        document.getElementById('decayVal').textContent   = p.env.decay + 's';
        document.getElementById('sustain').value = p.env.sustain;
        document.getElementById('sustainVal').textContent = Math.round(p.env.sustain*100) + '%';
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
    updateAdsrDisplay();
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

// ADSR + standard synth sliders
['attack','decay','sustain','release','detune','chorus','reverb','delay','filter'].forEach(id=>{
    document.getElementById(id).addEventListener('input',function(){
        const pct=['reverb','delay','chorus','sustain'].includes(id);
        const sfx = pct ? '%' : id==='filter' ? 'Hz' : id==='detune' ? 'ct' : 's';
        document.getElementById(id+'Val').textContent = pct ? Math.round(this.value*100)+sfx : this.value+sfx;
        if(S.audioReady) buildChordSynth(getPreset());
        if(['attack','decay','sustain','release'].includes(id)) updateAdsrDisplay();
        autoSave();
    });
});

// Extra FX sliders
document.getElementById('distortion').addEventListener('input',function(){
    document.getElementById('distortionVal').textContent=Math.round(this.value*100)+'%';
    if(S.audioReady) buildChordSynth(getPreset());
    autoSave();
});
document.getElementById('reverbDecay').addEventListener('input',function(){
    document.getElementById('reverbDecayVal').textContent=parseFloat(this.value).toFixed(1)+'s';
    if(S.audioReady) buildChordSynth(getPreset());
    autoSave();
});

['scaleType','progression','octave','voiceLead'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',()=>{loadProgression();loadScale();});
});
document.getElementById('genre').addEventListener('change',async function(){
    const root=V('rootNote'),mode=V('keyMode'),key=root+(mode==='minor'?'m':''),oct=V('octave');
    setStatus('Genre laden…');
    // Genre-specific defaults
    const genreBpm = { synthwave:100, darksynth:110, outrun:95,
        progressive_house:123, melodic_techno:130, deep_house:120,
        trance:138, drum_and_bass:174, downtempo:90 };
    const bpmVal = genreBpm[this.value];
    if(bpmVal) {
        const bpmEl=document.getElementById('bpm');
        bpmEl.value=bpmVal; document.getElementById('bpmVal').textContent=bpmVal;
        Tone.getTransport().bpm.value=bpmVal;
    }
    try {
        const r=await fetch(`${API}?action=getProgressionForGenre&genre=${this.value}&key=${encodeURIComponent(key)}&octave=${oct}`);
        const data=await r.json();
        document.getElementById('progression').value=data.progression;
        S.progression=data.chords; S.chordNames=data.chords.map(chordRoot); S.currentChord=0;
        buildChordGrid(); setStatus(`Genre: ${this.value} — ${data.progression}`,'ok');
    } catch(e){setStatus('Fout: '+e.message,'err');}
    await loadScale();
});

// ── QWERTY Keyboard Piano ───────────────────────────────────
function refreshKbdRecTrack() {
    const sel=document.getElementById('kbdRecTrack'); if(!sel) return;
    const cur=sel.value;
    while(sel.options.length>1) sel.remove(1);
    SEQ.tracks.filter(t=>t.melodic).forEach(t=>{
        const o=document.createElement('option'); o.value=t.uid; o.textContent=t.label;
        sel.appendChild(o);
    });
    if(cur) sel.value=cur;
}

const kbdHeld = new Set();

document.getElementById('kbdToggle').addEventListener('click',function(){
    kbdActive=!kbdActive;
    this.classList.toggle('active',kbdActive);
    document.querySelector('.piano-area').classList.toggle('kbd-active',kbdActive);
    if(kbdActive){
        scrollPianoToKbd();
        refreshKbdRecTrack();
        setStatus('Toetsenbord actief — speel A–L + W/E/T/Y/U/O/P · Z/X = octaaf','ok');
    } else {
        // Release any held notes
        kbdHeld.forEach(key=>{
            const midi=kbdBaseC()+KB_OFFSETS[key];
            chordSynth?.triggerRelease(midiFreq(midi));
            document.querySelector(`.piano .key[data-midi="${midi}"]`)?.classList.remove('lit-playing');
        });
        kbdHeld.clear();
    }
});
document.getElementById('kbdOctDn').addEventListener('click',()=>{ kbdOctave=Math.max(3,kbdOctave-1); updateKbdLabels(); scrollPianoToKbd(); });
document.getElementById('kbdOctUp').addEventListener('click',()=>{ kbdOctave=Math.min(6,kbdOctave+1); updateKbdLabels(); scrollPianoToKbd(); });

function isTypingTarget(el) {
    const tag=el?.tagName;
    return tag==='INPUT'||tag==='TEXTAREA'||(tag==='SELECT'&&el.id!=='kbdRecTrack');
}

document.addEventListener('keydown',async function(e){
    if(isTypingTarget(document.activeElement)) return;
    // Undo / Redo
    if(e.ctrlKey||e.metaKey) {
        if(e.key==='z'||e.key==='Z') { e.preventDefault(); if(e.shiftKey) redo(); else undo(); return; }
        if(e.key==='y'||e.key==='Y') { e.preventDefault(); redo(); return; }
    }
    // Z/X octave shift (works even without kbd mode)
    if(e.key==='z'||e.key==='Z'){ kbdOctave=Math.max(3,kbdOctave-1); updateKbdLabels(); scrollPianoToKbd(); return; }
    if(e.key==='x'||e.key==='X'){ kbdOctave=Math.min(6,kbdOctave+1); updateKbdLabels(); scrollPianoToKbd(); return; }
    if(!kbdActive||e.repeat) return;
    const key=e.key.toLowerCase();
    if(!(key in KB_OFFSETS)) return;
    e.preventDefault();
    if(kbdHeld.has(key)) return;
    kbdHeld.add(key);
    const midi=kbdBaseC()+KB_OFFSETS[key];
    await startAudio();
    if(!S.chordMute) chordSynth?.triggerAttack(midiFreq(midi),Tone.now());
    document.querySelector(`.piano .key[data-midi="${midi}"]`)?.classList.add('lit-playing');
    // Live record into selected melodic track
    const recUid=+(document.getElementById('kbdRecTrack')?.value??0);
    if(recUid&&S.isPlaying){
        const track=SEQ.tracks.find(t=>t.uid===recUid);
        if(track?.melodic){
            const step=S.currentSeqStep??0;
            track.steps[step]=midi;
            const stepEl=document.querySelector(`.seq-step[data-uid="${recUid}"][data-step="${step}"]`);
            if(stepEl){
                stepEl.classList.add('on');
                const sn=stepEl.querySelector('.step-note'); if(sn) sn.textContent=midiName(midi);
            }
        }
    }
});

document.addEventListener('keyup',function(e){
    if(!kbdActive) return;
    const key=e.key.toLowerCase();
    if(!(key in KB_OFFSETS)) return;
    kbdHeld.delete(key);
    const midi=kbdBaseC()+KB_OFFSETS[key];
    chordSynth?.triggerRelease(midiFreq(midi));
    document.querySelector(`.piano .key[data-midi="${midi}"]`)?.classList.remove('lit-playing');
});

// ── Init ────────────────────────────────────────────────────
buildPiano(36,96);
updateKeyInfo();
updateAdsrDisplay();
// Default tracks (only if not loaded from localStorage)
if(!SEQ.tracks.length){
    ['kick','snare','hihat','bass','melody'].forEach(type=>SEQ.tracks.push(makeTrack(type)));
    setDefaultPattern();
}
buildSeqGrid();
buildPatternBar();
buildSongBar();
initArpUI();
initMasterUI();
initVizUI();
document.getElementById('btnMixer').addEventListener('click', toggleMixer);
document.getElementById('mixerClose').addEventListener('click', toggleMixer);
document.getElementById('btnLauncher').addEventListener('click', () => toggleLauncher());
loadProgression();
loadScale();

// Collapsible sidebar sections
document.querySelectorAll('.section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.sidebar-section').classList.toggle('collapsed');
    });
});

initHistory();
