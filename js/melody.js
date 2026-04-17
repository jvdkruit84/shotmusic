// ── Melody Generator ────────────────────────────────────────
function updateMgTrackList() {
    const sel=document.getElementById('mgTrack'); sel.innerHTML='';
    const mel=SEQ.tracks.filter(t=>t.melodic);
    if(!mel.length){ sel.innerHTML='<option value="">Geen melodie-track</option>'; return; }
    mel.forEach(t=>{ const o=document.createElement('option'); o.value=t.uid; o.textContent=t.label; sel.appendChild(o); });
}

function generateMelody() {
    const uid=+document.getElementById('mgTrack').value;
    const track=SEQ.tracks.find(t=>t.uid===uid);
    if(!track||!track.melodic){ setStatus('Kies eerst een melodie-track','err'); return; }
    if(!S.scale.length){ setStatus('Laad eerst een toonladder','err'); return; }

    const style         = document.getElementById('mgStyle').value;
    const rhythmStyle   = document.getElementById('mgRhythm').value;
    const density       = document.getElementById('mgDensity').value;
    const contour       = document.getElementById('mgContour').value;
    const octave        = document.getElementById('mgOctave').value;
    const chordAffinity = document.getElementById('mgChordAffinity').value;
    const arpDir        = document.getElementById('mgArpDir').value;
    const motifLen      = +document.getElementById('mgMotifLen').value;
    const variation     = document.getElementById('mgVariation').value;
    const steps         = SEQ.steps;

    // Build note pool for this range
    let lo, hi;
    if     (octave==='low')  { lo=36; hi=55; }
    else if(octave==='high') { lo=60; hi=79; }
    else if(octave==='wide') { lo=36; hi=79; }
    else                     { lo=48; hi=67; }

    let pool = S.scale.filter(n=>n>=lo&&n<=hi).sort((a,b)=>a-b);
    if(pool.length<3) pool = S.scale.slice().sort((a,b)=>a-b);

    // Pentatonic subset (degrees 0,2,4,7,9 of scale)
    let pentatonicPool = pool;
    if(pool.length>=5){
        const indices=[0,2,4,7,9].map(d=>d%pool.length);
        pentatonicPool = [...new Set(indices.map(i=>pool[i]))].sort((a,b)=>a-b);
    }

    // Blues notes (add b3, b5 to pentatonic)
    let bluesPool = [...pentatonicPool];
    if(pool.length>0){
        const root=pool[0]%12;
        pool.forEach(n=>{
            const deg=(n-root+12)%12;
            if(deg===3||deg===6) bluesPool.push(n); // b3 and b5
        });
        bluesPool.sort((a,b)=>a-b);
    }

    // Triad notes from current chord
    function getTriadPool(i) {
        if(!S.progression.length) return pool;
        const ci=Math.floor(i/(steps/Math.max(1,S.progression.length)))%S.progression.length;
        const chord=S.progression[ci]??[];
        const ct=[];
        chord.forEach(m=>{
            let n=m; while(n<lo)n+=12; while(n>hi)n-=12;
            if(n>=lo&&n<=hi)ct.push(n);
        });
        return ct.length>=2?ct:pool;
    }

    function chordTonesAtStep(i) {
        if(!S.progression.length) return pool;
        const ci=Math.floor(i/(steps/Math.max(1,S.progression.length)))%S.progression.length;
        const chord=S.progression[ci]??[];
        const ct=[];
        chord.forEach(m=>{
            let n=m; while(n<lo)n+=12; while(n>hi)n-=12;
            if(n>=lo&&n<=hi)ct.push(n);
        });
        return ct.length?ct:pool;
    }

    // Chord affinity: probability of snapping to chord tone
    const affinityBeat  = {free:0, low:.25, mid:.55, high:.85, only:1}[chordAffinity]??0.5;
    const affinityOff   = {free:0, low:.1,  mid:.25, high:.5,  only:.9}[chordAffinity]??0.2;

    function snapToChord(note, ct, onBeat) {
        if(!ct.length) return note;
        const prob = onBeat?affinityBeat:affinityOff;
        if(Math.random()>prob) return note;
        return ct.reduce((a,b)=>Math.abs(a-note)<=Math.abs(b-note)?a:b);
    }

    // Rhythm pattern
    const rhythm = buildRhythm(steps, density, rhythmStyle, style);

    // Contour map
    const contourMap = buildContour(steps, pool.length-1, contour);

    // Pitch sequence
    const notes = Array(steps).fill(null);
    let lastIdx = Math.floor(pool.length*.4);
    let arpPos  = 0;
    let arpInc  = 1; // for bounce

    // Hook/Sequence: build motif then tile
    if(style==='hook'||style==='sequence'){
        const tiled = buildMotif(pool, rhythm, contourMap, steps, chordTonesAtStep, motifLen, variation);
        track.steps = tiled.concat(Array(32-steps).fill(null)).slice(0,32);
        buildSeqGrid(); if(S.isPlaying) buildSeqLoop();
        setStatus(`Melodie gegenereerd (${style}, motief ${motifLen})`, 'ok'); return;
    }

    for(let i=0;i<steps;i++){
        if(!rhythm[i]) continue;
        const ct       = chordTonesAtStep(i);
        const triad    = getTriadPool(i);
        const target   = Math.round(contourMap[i]);
        const clamped  = Math.max(0, Math.min(pool.length-1, target));
        const onBeat   = i%4===0;
        let note;

        if(style==='arpeggio'){
            const src = chordAffinity==='free'?pool:ct.length?ct:pool;
            if(arpDir==='up'){
                note = src[arpPos%src.length]; arpPos++;
            } else if(arpDir==='down'){
                arpPos = arpPos||src.length-1;
                note = src[arpPos%src.length]; arpPos--;
                if(arpPos<0) arpPos=src.length-1;
            } else if(arpDir==='bounce'){
                note = src[Math.abs(arpPos)%src.length];
                arpPos+=arpInc;
                if(arpPos>=src.length||arpPos<0){arpInc*=-1;arpPos+=arpInc*2;}
            } else {
                note = src[Math.floor(Math.random()*src.length)];
            }

        } else if(style==='pentatonic'){
            const src = pentatonicPool;
            const dir = clamped>lastIdx?1:clamped<lastIdx?-1:(Math.random()<.5?1:-1);
            lastIdx=Math.max(0,Math.min(src.length-1,lastIdx+dir));
            note=snapToChord(src[lastIdx],ct,onBeat);

        } else if(style==='blues'){
            const src = bluesPool;
            // blues: prefer b3 and root on beats, passing tones off-beats
            if(onBeat&&ct.length){
                note = ct[Math.floor(Math.random()*ct.length)];
            } else {
                lastIdx=Math.max(0,Math.min(src.length-1,lastIdx+(Math.random()<.6?1:-1)));
                note=src[lastIdx];
            }

        } else if(style==='triad_run'){
            // fast moves through triad tones, direction follows contour
            const src = triad.length>=2?triad:pool;
            const dir = clamped>lastIdx?1:-1;
            lastIdx=Math.max(0,Math.min(src.length-1,lastIdx+dir));
            note=src[lastIdx];

        } else if(style==='stepwise'){
            const dir=clamped>lastIdx?1:clamped<lastIdx?-1:(Math.random()<.5?1:-1);
            const step=Math.random()<.7?1:2;
            lastIdx=Math.max(0,Math.min(pool.length-1,lastIdx+dir*step));
            note=onBeat?snapToChord(pool[lastIdx],ct,true):pool[lastIdx];

        } else if(style==='call_response'){
            const half=steps/2;
            if(i<half){
                lastIdx=Math.round((i/half)*(pool.length-1));
            } else {
                // silence gap in middle, descending answer
                if(i<half*1.5){notes[i]=null;continue;}
                lastIdx=Math.round(((i-half*1.5)/(half*.5))*(pool.length-1)*.7);
            }
            note=snapToChord(pool[Math.max(0,Math.min(pool.length-1,lastIdx))],ct,onBeat);

        } else {
            const spread=2;
            const l2=Math.max(0,clamped-spread), h2=Math.min(pool.length-1,clamped+spread);
            lastIdx=l2+Math.floor(Math.random()*(h2-l2+1));
            note=snapToChord(pool[lastIdx],ct,onBeat);
        }

        notes[i]=note;
    }

    track.steps = notes.concat(Array(32-steps).fill(null)).slice(0,32);
    buildSeqGrid();
    if(S.isPlaying) buildSeqLoop();
    setStatus(`Melodie gegenereerd (${style}, ${rhythmStyle})`, 'ok');
}

function buildRhythm(steps, density, rhythmStyle, style) {
    const r = Array(steps).fill(false);
    r[0] = true;
    const prob = density==='sparse'?.25 : density==='dense'?.68 : .44;

    for(let i=1;i<steps;i++){
        const beat    = i%4===0;
        const half    = i%2===0;
        const quarter = i%8===0;
        let p;
        if(rhythmStyle==='sparse_beat'){
            p = beat ? prob*1.8 : .04;
        } else if(rhythmStyle==='syncopated'){
            // emphasize off-beats: 2,6,10... (between beats)
            const synco = (i%4===2);
            p = synco?prob*1.7 : beat?prob*.5 : prob*.4;
        } else if(rhythmStyle==='offbeat'){
            // every other 8th
            p = half&&!beat ? prob*1.6 : beat ? prob*.4 : prob*.2;
        } else if(rhythmStyle==='dotted'){
            // hits on 0,3,6,9,12... (every 3 steps = dotted 8th feel)
            p = i%3===0 ? prob*1.8 : prob*.2;
        } else {
            // straight
            p = beat?prob*1.8 : half?prob*1.2 : prob*.7;
        }
        r[i] = Math.random()<Math.min(p,1);
    }

    if(style==='call_response'){
        for(let i=Math.floor(steps*.5);i<Math.floor(steps*.75);i++) r[i]=false;
    }
    return r;
}

function buildContour(steps, maxIdx, contour) {
    return Array.from({length:steps},(_,i)=>{
        const t=i/Math.max(1,steps-1);
        if(contour==='ascending')  return t*maxIdx;
        if(contour==='descending') return (1-t)*maxIdx;
        if(contour==='arch')       return Math.sin(t*Math.PI)*maxIdx;
        if(contour==='wave')       return (.5+.5*Math.sin(t*Math.PI*4))*maxIdx;
        if(contour==='valley')     return (1-Math.sin(t*Math.PI))*maxIdx;
        if(contour==='random')     return Math.random()*maxIdx;
        return maxIdx*.5; // flat
    });
}

function buildMotif(pool, rhythm, contourMap, steps, chordTonesAtStep, motifLen, variation) {
    const core = Array(motifLen).fill(null);
    let idx = Math.floor(pool.length*.4);
    for(let i=0;i<motifLen;i++){
        if(!rhythm[i%motifLen]){core[i]=null;continue;}
        const ct  = chordTonesAtStep(i);
        const dir = i%2===0?1:-1;
        idx = Math.max(0,Math.min(pool.length-1, idx+dir*(1+Math.floor(Math.random()*2))));
        // Snap to chord tone on first beat
        if(i===0&&ct.length) idx = pool.indexOf(ct[0])<0?idx:pool.indexOf(ct[0]);
        core[i] = pool[idx];
    }

    const varShift = {none:0, low:1, mid:2, high:3}[variation]??1;
    const notes = Array(steps).fill(null);
    const reps = Math.ceil(steps/motifLen);
    for(let rep=0;rep<reps;rep++){
        // Variation: last rep goes up, mid reps slight random shift
        let shift=0;
        if(varShift>0){
            if(rep===reps-1) shift=varShift;
            else if(rep>0&&variation!=='none') shift=Math.random()<.4?1:0;
        }
        for(let j=0;j<motifLen;j++){
            const si=rep*motifLen+j;
            if(si>=steps) break;
            if(core[j]===null){notes[si]=null;continue;}
            // apply rhythm pattern (allow variation in rhythm for mid/high)
            const useRhythm = variation==='high' ? (Math.random()>.2) : rhythm[j%steps];
            if(!useRhythm){notes[si]=null;continue;}
            const pi=Math.min(pool.length-1, Math.max(0, pool.indexOf(core[j])+shift));
            notes[si]=pool[pi<0?pool.indexOf(core[j]):pi];
        }
    }
    return notes;
}
function refreshMelodicSteps() {
    SEQ.tracks.filter(t=>t.melodic).forEach(t=>{ for(let i=0;i<SEQ.steps;i++) refreshStepBtn(t,i); });
}
function updateSeqHighlight(step) {
    document.querySelectorAll('.seq-step').forEach(b=>b.classList.toggle('current',+b.dataset.step===step));
}
