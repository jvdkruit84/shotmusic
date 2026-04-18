// ── Sidechain ──────────────────────────────────────────────
function triggerSidechain(time) {
    if (!S.sidechain.enabled) return;
    const { depth, release } = S.sidechain;
    SEQ.tracks.forEach(track => {
        if (!track.sidechain || !track.fxNodes?.vol) return;
        const orig = track.volume ?? 0;
        const ducked = orig - depth * 36;
        const vol = track.fxNodes.vol.volume;
        vol.cancelScheduledValues(time);
        vol.setValueAtTime(ducked, time);
        vol.linearRampToValueAtTime(orig, time + release);
    });
    // Also duck chord synth if sidechain chords enabled
    if (S.sidechain.chordDuck && chordFilter) {
        const now = time;
        chordFilter.frequency.cancelScheduledValues(now);
        chordFilter.frequency.setValueAtTime(400, now);
        chordFilter.frequency.linearRampToValueAtTime(+document.getElementById('filter').value, now + release);
    }
}

// ── Patterns ───────────────────────────────────────────────
function saveCurrentPattern() {
    const p = SEQ.patterns[SEQ.currentPattern];
    p.data = {};
    SEQ.tracks.forEach(t => {
        p.data[t.uid] = { steps:[...t.steps], vels:[...t.vels], probs:[...t.probs], gates:[...(t.gates??Array(32).fill(80))] };
    });
}

function loadPatternData(name) {
    const p = SEQ.patterns[name];
    if (!p) return;
    SEQ.tracks.forEach(t => {
        const d = p.data[t.uid];
        if (d) {
            t.steps = [...d.steps];
            t.vels  = [...d.vels];
            t.probs = [...d.probs];
            t.gates = [...(d.gates??Array(32).fill(80))];
        } else {
            const def = TRACK_TYPES[t.type];
            t.steps = Array(32).fill(def.melodic?null:0);
            t.vels  = Array(32).fill(100);
            t.probs = Array(32).fill(100);
            t.gates = Array(32).fill(80);
        }
    });
}

function switchPattern(name, rebuild=true) {
    saveCurrentPattern();
    SEQ.currentPattern = name;
    loadPatternData(name);
    if (rebuild) { buildSeqGrid(); if(S.isPlaying) buildSeqLoop(); }
    buildPatternBar();
    autoSave();
}

function buildPatternBar() {
    const btns = document.getElementById('patBtns'); if(!btns) return;
    btns.innerHTML = '';
    const copyTarget = document.getElementById('patCopyTarget');
    if(copyTarget) { copyTarget.innerHTML=''; PATTERN_NAMES.forEach(n=>{ if(n!==SEQ.currentPattern){ const o=document.createElement('option'); o.value=n; o.textContent=n; copyTarget.appendChild(o); } }); }
    PATTERN_NAMES.forEach(n=>{
        const b=document.createElement('button'); b.className='pat-btn'+(n===SEQ.currentPattern?' current':'');
        const p=SEQ.patterns[n]; const hasData=p&&Object.keys(p.data).length>0;
        if(hasData) b.classList.add('has-data');
        b.textContent=n;
        b.addEventListener('click',()=>switchPattern(n));
        btns.appendChild(b);
    });
}

function buildSongBar() {
    const slots=document.getElementById('songSlots'); if(!slots) return;
    slots.innerHTML='';
    SEQ.songArrangement.forEach((name,i)=>{
        const s=document.createElement('div'); s.className='song-slot'+(i===SEQ.songPos&&SEQ.songMode&&S.isPlaying?' playing':'');
        s.textContent=name;
        const del=document.createElement('span'); del.className='del-slot'; del.textContent='×';
        del.addEventListener('click',e=>{ e.stopPropagation(); SEQ.songArrangement.splice(i,1); buildSongBar(); autoSave(); });
        s.appendChild(del);
        slots.appendChild(s);
    });
}

// Euclidean rhythm
function euclidean(hits, steps, rotate=0) {
    hits = Math.max(0, Math.min(hits, steps));
    if (!hits) return Array(steps).fill(0);
    if (hits === steps) return Array(steps).fill(1);
    const pat = Array(steps).fill(0);
    for (let i=0; i<hits; i++) pat[Math.floor(i*steps/hits)] = 1;
    // rotate
    if (rotate) {
        const r = ((rotate % steps) + steps) % steps;
        return [...pat.slice(r), ...pat.slice(0, r)];
    }
    return pat;
}

function buildSeqLoop() {
    seqLoop?.dispose(); seqLoop=null;
    const steps=SEQ.steps;
    seqLoop=new Tone.Sequence((time,step)=>{
        // Song mode: switch pattern at loop start
        if(step===0 && SEQ.songMode && SEQ.songArrangement.length>0){
            const nextName=SEQ.songArrangement[SEQ.songPos%SEQ.songArrangement.length];
            if(nextName!==SEQ.currentPattern){
                saveCurrentPattern();
                SEQ.currentPattern=nextName;
                loadPatternData(nextName);
                Tone.Draw.schedule(()=>{ buildSeqGrid(); buildPatternBar(); buildSongBar(); },time);
            }
            SEQ.songPos++;
        }
        SEQ.tracks.forEach(track=>{
            if(track.mute) return;
            // Piano roll tracks play via their own Tone.Part — skip in sequence
            if(track.editMode === 'pianoroll') return;
            const prob=track.probs[step]??100;
            if(prob<100 && Math.random()*100>prob) return;
            const val=track.steps[step];
            const vel=track.vels[step]??100;
            const v=Math.max(0.01,Math.min(1,vel/127));
            const gate=track.gates?.[step]??80;
            const stepSec=Tone.Time('16n').toSeconds();
            const gateDur=Math.max(0.01, stepSec * gate / 100);
            if(!track.melodic){ if(val) triggerTrack(track,time,vel); }
            else if(track.type==='pad') {
                if(val!==null) {
                    const dur = track.padMode==='chord'
                        ? Tone.Time('1n').toSeconds() * (+document.getElementById('chordBars').value||2)
                        : gateDur;
                    const notes = track.padMode==='chord' && S.progression[S.currentChord]?.length
                        ? S.progression[S.currentChord].map(midiFreq)
                        : [midiFreq(val)];
                    track.synth?.triggerAttackRelease(notes, dur, time, v);
                }
            }
            else { if(val!==null) track.synth?.triggerAttackRelease(midiFreq(val),gateDur,time,v); }
        });
        Tone.Draw.schedule(()=>{ S.currentSeqStep=step; updateSeqHighlight(step); },time);
    },Array.from({length:steps},(_,i)=>i),'16n');
    seqLoop.start(0);
}

function setLed(state) { // 'off' | 'playing' | 'recording'
    const led=document.getElementById('playLed');
    if(!led) return;
    led.className='led'+(state==='off'?'':' '+state);
    document.getElementById('btnPlay')?.classList.toggle('active', state==='playing');
}
function startPlayback() {
    startAudio().then(()=>{
        S.isPlaying=true;
        setLed('playing');
        Tone.getTransport().bpm.value=+V('bpm');
        Tone.getTransport().swing=+V('seqSwing');
        Tone.getTransport().swingSubdivision='16n';
        buildChordPart(); buildSeqLoop();
        // Start piano roll parts for tracks in pianoroll mode
        SEQ.tracks.forEach(t => { if(t.editMode==='pianoroll') buildPianoRollPart(t); });
        if (ARP.enabled) buildArpLoop();
        Tone.getTransport().start();
        setStatus('Speelt…','ok');
    });
}
function stopPlayback() {
    Tone.getTransport().stop(); Tone.getTransport().cancel();
    chordPart?.dispose(); chordPart=null;
    seqLoop?.dispose(); seqLoop=null;
    // Stop piano roll parts
    SEQ.tracks.forEach(t => { try{ t.part?.dispose(); }catch(e){} t.part=null; });
    stopArpLoop();
    S.isPlaying=false; setLed('off'); chordSynth?.releaseAll();
    document.querySelectorAll('.chord-card').forEach(c=>c.classList.remove('playing'));
    updateSeqHighlight(-1); setStatus('Gestopt');
}

