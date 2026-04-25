// ── Chord grid ──────────────────────────────────────────────
function buildChordGrid() {
    const grid=document.getElementById('chordGrid'); grid.innerHTML='';
    S.progression.forEach((notes,i) => {
        const c=document.createElement('div'); c.className='chord-card'+(i===0?' active':''); c.dataset.index=i;
        c.innerHTML=`<div class="chord-name">${S.chordNames[i]}</div><div class="chord-type">Akkoord ${i+1}</div><div class="chord-notes">${notes.map(midiName).join(' · ')}</div>`;
        c.addEventListener('click',async()=>{ await startAudio(); playChordImmediate(notes); setActiveChord(i); });
        grid.appendChild(c);
    });
    setActiveChord(0);
}
function setActiveChord(idx) {
    S.currentChord=idx;
    document.querySelectorAll('.chord-card').forEach((c,i)=>c.classList.toggle('active',i===idx));
    document.getElementById('currentChordName').textContent=S.chordNames[idx]??'—';
    highlightPianoChord(S.progression[idx]??[]);
}

// ── Piano keyboard ──────────────────────────────────────────
// Keyboard → semitone offset from C (standard DAW layout, no ; to avoid Dutch keyboard issues)
const KB_OFFSETS = {'a':0,'w':1,'s':2,'e':3,'d':4,'f':5,'t':6,'g':7,'y':8,'h':9,'u':10,'j':11,'k':12,'o':13,'l':14,'p':15};
const KB_DISPLAY = {'a':'A','w':'W','s':'S','e':'E','d':'D','f':'F','t':'T','g':'G','y':'Y','h':'H','u':'U','j':'J','k':'K','o':'O','l':'L','p':'P'};

let kbdOctave = 4;   // adjustable with Z/X
let kbdActive  = false;

// Piano uses MIDI where C4=48 in this app's convention (octave*12)
// buildPiano(36,96): 36=C3, 48=C4, 60=C5, etc. (octave offset = octave*12)
function kbdBaseC() { return kbdOctave * 12; }

function buildPiano(lo=36,hi=96) {
    const piano=document.getElementById('piano'); piano.innerHTML=''; const wW=28;
    const keys=[]; let whites=0;
    for(let m=lo;m<=hi;m++){const isB=[1,3,6,8,10].includes(m%12);keys.push({m,isB});if(!isB)whites++;}
    piano.style.width=(whites*wW)+'px';
    keys.forEach(({m,isB})=>{
        const k=document.createElement('div'); k.className='key '+(isB?'black':'white'); k.dataset.midi=m;
        if(isB){const wb=Array.from({length:m-lo},(_,i)=>i+lo).filter(x=>![1,3,6,8,10].includes(x%12)).length;k.style.left=(wb*wW+wW*.62)+'px';}
        // Keyboard label span
        const lbl=document.createElement('span'); lbl.className='key-kb-label'; k.appendChild(lbl);
        let holdTimer=null;
        k.addEventListener('mousedown',async e=>{
            e.preventDefault(); await startAudio();
            k.classList.add('lit-playing');
            if(!S.chordMute) chordSynth?.triggerAttack(midiFreq(m),Tone.now());
            holdTimer=setTimeout(()=>{ if(!S.chordMute)chordSynth?.triggerRelease(midiFreq(m)); k.classList.remove('lit-playing'); },4000);
        });
        const release=()=>{ clearTimeout(holdTimer); if(!S.chordMute)chordSynth?.triggerRelease(midiFreq(m)); k.classList.remove('lit-playing'); };
        k.addEventListener('mouseup',release); k.addEventListener('mouseleave',release);
        piano.appendChild(k);
    });
    updateKbdLabels();
}

function updateKbdLabels() {
    const base=kbdBaseC();
    // Clear all labels first
    document.querySelectorAll('.key-kb-label').forEach(l=>l.textContent='');
    // Set label for each mapped key
    Object.entries(KB_OFFSETS).forEach(([key,offset])=>{
        const midi=base+offset;
        const el=document.querySelector(`.piano .key[data-midi="${midi}"] .key-kb-label`);
        if(el) el.textContent=KB_DISPLAY[key];
    });
    // Update octave indicator
    const ind=document.getElementById('kbdOctaveInd');
    if(ind) ind.textContent='C'+kbdOctave;
}

function scrollPianoToKbd() {
    const base=kbdBaseC();
    const el=document.querySelector(`.piano .key[data-midi="${base}"]`);
    const wrap=document.querySelector('.piano-wrap');
    if(el&&wrap) wrap.scrollLeft=Math.max(0, el.offsetLeft - wrap.clientWidth/3);
}
function highlightPiano() {
    document.querySelectorAll('.piano .key').forEach(k=>{k.classList.remove('lit-scale','lit-chord');if(S.scale.includes(+k.dataset.midi))k.classList.add('lit-scale');});
    highlightPianoChord(S.progression[S.currentChord]??[]);
}
function highlightPianoChord(ns) {
    document.querySelectorAll('.piano .key').forEach(k=>k.classList.toggle('lit-chord',ns.includes(+k.dataset.midi)));
}
function flashPianoKeys(ns,ms=500) {
    document.querySelectorAll('.piano .key').forEach(k=>{if(ns.includes(+k.dataset.midi)){k.classList.add('lit-playing');setTimeout(()=>k.classList.remove('lit-playing'),ms);}});
}

// ── Chord playback ──────────────────────────────────────────
function playChordImmediate(ns) {
    const dur=Tone.Time('1m').toSeconds()*+V('chordBars');
    if(!S.chordMute) chordSynth?.triggerAttackRelease(ns.map(midiFreq),Math.min(dur*.85,dur-.05));
    flashPianoKeys(ns,Math.min(dur*850,3000));
}
function buildChordPart() {
    chordPart?.dispose(); chordPart=null;
    if(!S.progression.length) return;
    const bpc=+V('chordBars');
    const dur=Tone.Time(`${bpc}m`).toSeconds()*.85;
    const events=S.progression.map((notes,i)=>({time:`${i*bpc}:0:0`,notes,idx:i}));
    chordPart=new Tone.Part((time,val)=>{
        // Only auto-play if no chord steps are programmed
        const hasChordSteps=SEQ.chordSteps?.some(s=>s);
        if(!S.chordMute && !hasChordSteps) chordSynth?.triggerAttackRelease(val.notes.map(midiFreq),dur,time);
        Tone.Draw.schedule(()=>{
            setActiveChord(val.idx);
            document.querySelectorAll('.chord-card').forEach((c,i)=>c.classList.toggle('playing',i===val.idx));
            document.getElementById('barCounter').textContent=val.idx+1;
            flashPianoKeys(val.notes,dur*900);
        },time);
    },events);
    chordPart.loop=true; chordPart.loopEnd=`${S.progression.length*bpc}:0:0`; chordPart.start(0);
}


// ── Sequencer UI ────────────────────────────────────────────
function updateChordStepHighlight(step) {
    document.querySelectorAll('.chord-step-btn').forEach((b,i)=>{
        b.classList.toggle('playing', i===step);
    });
}

function buildChordStepRow(grid) {
    const row=document.createElement('div'); row.className='seq-track chord-step-row';
    const hdr=document.createElement('div'); hdr.className='seq-track-header';
    hdr.style.borderLeftColor='#c77dff';
    const lbl=document.createElement('span'); lbl.className='chord-step-label'; lbl.textContent='CHORDS';
    // Gate select
    const gSel=document.createElement('select'); gSel.className='chord-step-gate-sel'; gSel.title='Chord duur';
    [['stab','Stab'],['half','Half bar'],['bar','1 Bar'],['full','Full']].forEach(([v,t])=>{
        const o=document.createElement('option'); o.value=v; o.textContent=t;
        if(v==='bar') o.selected=true;
        gSel.appendChild(o);
    });
    gSel.addEventListener('change',function(){
        const map={stab:0.25,half:0.5,bar:0.75,full:0.98};
        SEQ.chordStepGate=map[this.value]??0.75; autoSave();
    });
    // Clear btn
    const clr=document.createElement('button'); clr.className='seq-ctrl-btn'; clr.textContent='Clear'; clr.style.fontSize='7.5px';
    clr.addEventListener('click',()=>{ SEQ.chordSteps=Array(32).fill(0); buildChordStepRow.refresh?.(); autoSave(); buildSeqGrid(); });
    hdr.append(lbl,gSel,clr);
    row.appendChild(hdr);
    // Step buttons
    const steps=document.createElement('div'); steps.className='seq-steps chord-step-steps';
    for(let i=0;i<SEQ.steps;i++){
        const b=document.createElement('button');
        b.className='seq-step chord-step-btn'+(SEQ.chordSteps[i]?' on':'');
        b.dataset.idx=i;
        b.addEventListener('click',()=>{
            SEQ.chordSteps[i]=SEQ.chordSteps[i]?0:1;
            b.classList.toggle('on',!!SEQ.chordSteps[i]);
            // Rebuild chord part to update has-steps flag
            if(S.isPlaying) buildChordPart();
            autoSave();
        });
        steps.appendChild(b);
    }
    row.appendChild(steps);
    grid.appendChild(row);
}

function buildSeqGrid() {
    if(document.getElementById('melGenPanel')?.classList.contains('open')) updateMgTrackList();
    const grid=document.getElementById('seqGrid'); grid.innerHTML='';
    buildChordStepRow(grid);

    SEQ.tracks.forEach(track=>{
        const row=document.createElement('div'); row.className='seq-track'; row.dataset.uid=track.uid;

        // Drag events
        row.addEventListener('dragstart', e=>{
            draggedUid=track.uid;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed='move';
        });
        row.addEventListener('dragend', ()=>{
            draggedUid=null; row.draggable=false; row.classList.remove('dragging');
            document.querySelectorAll('.seq-track.drag-over').forEach(r=>r.classList.remove('drag-over'));
        });
        row.addEventListener('dragover', e=>{
            if(draggedUid===null||draggedUid===track.uid) return;
            e.preventDefault(); e.dataTransfer.dropEffect='move';
            document.querySelectorAll('.seq-track.drag-over').forEach(r=>r.classList.remove('drag-over'));
            row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', ()=>row.classList.remove('drag-over'));
        row.addEventListener('drop', e=>{
            e.preventDefault(); row.classList.remove('drag-over');
            if(draggedUid===null||draggedUid===track.uid) return;
            const fromIdx=SEQ.tracks.findIndex(t=>t.uid===draggedUid);
            const toIdx  =SEQ.tracks.findIndex(t=>t.uid===track.uid);
            if(fromIdx<0||toIdx<0) return;
            const [moved]=SEQ.tracks.splice(fromIdx,1);
            SEQ.tracks.splice(toIdx,0,moved);
            buildSeqGrid();
            if(S.isPlaying) buildSeqLoop();
            autoSave();
        });

        // Header
        const hdr=document.createElement('div'); hdr.className='seq-track-header';
        hdr.style.borderLeftColor=track.color;

        // VU-meter (leeft buiten flex-flow, absolute gepositioneerd)
        const vuBar=document.createElement('div'); vuBar.className='seq-vu-bar';
        const vuFill=document.createElement('div'); vuFill.className='seq-vu-fill'; vuFill.dataset.uid=track.uid;
        vuBar.appendChild(vuFill); hdr.appendChild(vuBar);

        const row1=document.createElement('div'); row1.className='seq-track-row1';

        // Drag handle — only the handle initiates drags
        const handle=document.createElement('span'); handle.className='seq-drag-handle'; handle.textContent='⠿';
        // Prevent accidental drags from controls; only the handle enables it
        row.draggable=false;
        handle.addEventListener('mousedown', ()=>{ row.draggable=true; });
        hdr.addEventListener('mousedown', e=>{ if(e.target!==handle) row.draggable=false; });

        // Track name — klik om te hernoemen
        const nameLbl=document.createElement('div'); nameLbl.className='seq-track-name';
        nameLbl.textContent=track.label; nameLbl.style.color=track.color;
        nameLbl.title='Klik om naam te wijzigen';
        nameLbl.addEventListener('click',()=>{
            const inp=document.createElement('input'); inp.type='text'; inp.className='seq-track-name-input';
            inp.value=track.label; inp.style.color=track.color;
            nameLbl.replaceWith(inp); inp.focus(); inp.select();
            const commit=()=>{
                const v=inp.value.trim()||track.label;
                track.label=v; nameLbl.textContent=v;
                inp.replaceWith(nameLbl); autoSave();
            };
            inp.addEventListener('blur', commit);
            inp.addEventListener('keydown', e=>{ if(e.key==='Enter') inp.blur(); if(e.key==='Escape'){ inp.value=track.label; inp.blur(); } });
        });
        hdr.appendChild(nameLbl);

        // Type selector (klein, in knoppen-rij)
        const typeSel=document.createElement('select'); typeSel.className='seq-type-select';
        Object.entries(TRACK_TYPES).forEach(([k,v])=>{
            const o=document.createElement('option'); o.value=k; o.textContent=v.label;
            if(k===track.type) o.selected=true;
            typeSel.appendChild(o);
        });
        typeSel.addEventListener('change',function(){ changeTrackType(track, this.value); });

        const mute=document.createElement('button'); mute.className='seq-mute-btn'+(track.mute?' muted':''); mute.textContent='M'; mute.dataset.uid=track.uid;
        mute.addEventListener('click',()=>{
            track.mute=!track.mute; mute.classList.toggle('muted',track.mute);
            if(track.mute){ try{track.synth?.releaseAll?.();}catch(e){} try{track.synth?.triggerRelease?.();}catch(e){} }
            autoSave();
        });
        const fxBtn=document.createElement('button'); fxBtn.className='seq-fx-btn'; fxBtn.textContent='FX';
        const eucBtn=document.createElement('button'); eucBtn.className='seq-euclid-btn'; eucBtn.textContent='E'; eucBtn.title='Euclidisch ritme';
        const scBtn=document.createElement('button'); scBtn.className='seq-sc-btn'+(track.sidechain?' active':''); scBtn.textContent='SC';
        scBtn.title='Sidechain aan/uit voor deze track';
        scBtn.addEventListener('click',()=>{ track.sidechain=!track.sidechain; scBtn.classList.toggle('active',track.sidechain); autoSave(); });
        const rem=document.createElement('button'); rem.className='seq-remove-btn'; rem.title='Verwijder'; rem.textContent='×';
        rem.addEventListener('click',()=>removeTrack(track.uid));
        const autoBtn=document.createElement('button'); autoBtn.className='seq-auto-btn'; autoBtn.textContent='AUTO';
        autoBtn.title='Automation lane — klik om te openen';
        autoBtn.addEventListener('click',()=>{ if(typeof toggleAutoLane==='function') toggleAutoLane(track, autoBtn); });
        if(track.melodic){
            const prBtn=document.createElement('button');
            prBtn.className='seq-pr-btn'+(track.editMode==='pianoroll'?' active':'');
            prBtn.textContent='PR'; prBtn.title='Piano Roll — klik om te bewerken, dubbelklik om stap-modus terug te zetten';
            prBtn.dataset.uid=track.uid;
            prBtn.addEventListener('click',()=>{ if(typeof openPianoRoll==='function') openPianoRoll(track); });
            prBtn.addEventListener('dblclick',e=>{ e.stopPropagation(); if(typeof toggleEditMode==='function') toggleEditMode(track); buildSeqGrid(); });
            row1.append(handle,typeSel,mute,fxBtn,eucBtn,scBtn,prBtn,autoBtn);
        } else {
            row1.append(handle,typeSel,mute,fxBtn,eucBtn,scBtn,autoBtn);
        }
        hdr.appendChild(row1);
        hdr.appendChild(rem);

        // Kick type selector
        if(track.type==='kick'){
            const kt=document.createElement('select'); kt.className='seq-kick-type';
            ['classic','punchy','808','sub','tight','distorted','acoustic'].forEach(t=>{
                const o=document.createElement('option'); o.value=t; o.textContent=t.charAt(0).toUpperCase()+t.slice(1);
                if(t===track.kickType)o.selected=true; kt.appendChild(o);
            });
            kt.addEventListener('change',function(){
                track.kickType=this.value;
                if(S.audioReady) buildTrackSynth(track);
                setStatus('Kick: '+this.value,'ok');
            });
            hdr.appendChild(kt);
        }

        // Snare type selector
        if(track.type==='snare'){
            const st=document.createElement('select'); st.className='seq-kick-type';
            ['acoustic','electronic','clap','rimshot','brushed','big_room','trap','vinyl'].forEach(t=>{
                const o=document.createElement('option'); o.value=t;
                o.textContent={acoustic:'Acoustic',electronic:'Electronic',clap:'Clap',rimshot:'Rimshot',brushed:'Brushed',big_room:'Big Room',trap:'Trap',vinyl:'Vinyl'}[t]||t;
                if(t===track.snareType)o.selected=true; st.appendChild(o);
            });
            st.addEventListener('change',function(){
                track.snareType=this.value;
                if(S.audioReady) buildTrackSynth(track);
                setStatus('Snare: '+this.value,'ok');
            });
            hdr.appendChild(st);
        }

        // Hi-hat type selector
        if(track.type==='hihat'){
            const ht=document.createElement('select'); ht.className='seq-kick-type';
            ['closed','open','pedal','crispy','vinyl','brushed'].forEach(t=>{
                const o=document.createElement('option'); o.value=t; o.textContent=t.charAt(0).toUpperCase()+t.slice(1);
                if(t===track.hihatType)o.selected=true; ht.appendChild(o);
            });
            ht.addEventListener('change',function(){
                track.hihatType=this.value;
                if(S.audioReady) buildTrackSynth(track);
                setStatus('Hi-hat: '+this.value,'ok');
            });
            hdr.appendChild(ht);
        }

        // Sample drop zone
        if(track.type==='sample'){
            const dz=document.createElement('div'); dz.className='sample-drop'+(track.filename?' loaded':''); dz.dataset.uid=track.uid;
            dz.textContent=track.filename?track.filename.replace(/\.[^.]+$/,''):'↓ Sleep of klik audio';
            dz.title='Sleep een WAV/MP3/OGG bestand hierheen, of klik om te bladeren';
            // Hidden file input
            const fi=document.createElement('input'); fi.type='file'; fi.accept='audio/*'; fi.style.display='none';
            fi.addEventListener('change',()=>{ if(fi.files[0]) loadSampleFile(track,fi.files[0]); });
            dz.addEventListener('click',()=>fi.click());
            dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
            dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
            dz.addEventListener('drop',e=>{
                e.preventDefault(); dz.classList.remove('drag-over');
                const f=e.dataTransfer.files[0]; if(f) loadSampleFile(track,f);
            });
            hdr.appendChild(dz); hdr.appendChild(fi);
        }

        // Pad preset + mode selector
        if(track.type==='pad'){
            const pp=document.createElement('select'); pp.className='seq-bass-type';
            [{v:'warm',l:'Warm'},{v:'lush',l:'Lush'},{v:'dark',l:'Dark'},{v:'aether',l:'Aether'},
             {v:'strings',l:'Strings'},{v:'glass',l:'Glass'},{v:'choir',l:'Choir'},
             {v:'arctic',l:'Arctic'},{v:'shimmer',l:'Shimmer'},{v:'drone',l:'Drone'},
             {v:'haunted',l:'Haunted'},{v:'cosmic',l:'Cosmic'},{v:'vintage',l:'Vintage'},
             {v:'breath',l:'Breath'},{v:'angel',l:'Angel'}].forEach(({v,l})=>{
                const o=document.createElement('option'); o.value=v; o.textContent=l;
                if(v===track.padPreset)o.selected=true; pp.appendChild(o);
            });
            pp.addEventListener('change',function(){
                track.padPreset=this.value;
                if(S.audioReady) buildTrackSynth(track);
                setStatus('Pad: '+this.value,'ok'); autoSave();
            });
            hdr.appendChild(pp);

            const pm=document.createElement('select'); pm.className='seq-bass-type';
            [{v:'chord',l:'Akkoord'},{v:'note',l:'Noot'}].forEach(({v,l})=>{
                const o=document.createElement('option'); o.value=v; o.textContent=l;
                if(v===track.padMode)o.selected=true; pm.appendChild(o);
            });
            pm.addEventListener('change',function(){
                track.padMode=this.value; setStatus('Pad mode: '+this.value,'ok'); autoSave();
            });
            hdr.appendChild(pm);
        }

        // Bass type selector
        if(track.type==='bass'){
            const bt=document.createElement('select'); bt.className='seq-bass-type';
            [{v:'saw',l:'Saw'},{v:'sub',l:'Sub'},{v:'punchy',l:'Punchy'},{v:'808',l:'808'},
             {v:'pluck',l:'Pluck'},{v:'fm',l:'FM'},{v:'growl',l:'Growl'},
             {v:'reese',l:'Reese'},{v:'moog',l:'Moog'},{v:'acid',l:'Acid'},
             {v:'electric',l:'Electric'},{v:'stab',l:'Stab'},{v:'liquid',l:'Liquid'},
             {v:'rubber',l:'Rubber'},{v:'wobble',l:'Wobble'},
             {v:'vintage',l:'Vintage'},{v:'atari',l:'Atari'},
             {v:'tape',l:'Tape'},{v:'funk',l:'Funk'},{v:'dub',l:'Dub'},
             {v:'zap',l:'Zap'},{v:'dirt',l:'Dirt'}].forEach(({v,l})=>{
                const o=document.createElement('option'); o.value=v; o.textContent=l;
                if(v===track.bassType)o.selected=true; bt.appendChild(o);
            });
            bt.addEventListener('change',function(){
                track.bassType=this.value;
                if(S.audioReady) buildTrackSynth(track);
                setStatus('Bass: '+this.value,'ok');
            });
            hdr.appendChild(bt);
        }

        // Sample browser button for all percussion tracks
        if(['kick','snare','hihat','sample'].includes(track.type)){
            const sbRow=document.createElement('div');
            sbRow.className='seq-sample-row';
            sbRow.dataset.uid=track.uid;
            if(typeof _buildSampleRow==='function') _buildSampleRow(sbRow, track);
            hdr.appendChild(sbRow);
        }

        row.appendChild(hdr);

        // FX panel
        const fxPanel=document.createElement('div'); fxPanel.className='seq-fx-panel';
        const fxDefs=[
            {k:'rev', label:'Reverb', min:0, max:1,   step:.01, fmt:v=>Math.round(v*100)+'%'},
            {k:'dly', label:'Delay',  min:0, max:1,   step:.01, fmt:v=>Math.round(v*100)+'%'},
            {k:'flt', label:'Filter', min:200, max:20000, step:100, fmt:v=>v>=1000?(v/1000).toFixed(1)+'k':v+'Hz'},
            {k:'dist',label:'Drive',  min:0, max:1,   step:.01, fmt:v=>Math.round(v*100)+'%'},
        ];
        fxDefs.forEach(({k,label,min,max,step,fmt})=>{
            const wrap=document.createElement('div'); wrap.className='fx-knob';
            const lbl=document.createElement('label'); lbl.textContent=label;
            const sl=document.createElement('input'); sl.type='range'; sl.min=min; sl.max=max; sl.step=step; sl.value=track.fx[k];
            const val=document.createElement('span'); val.className='fx-val'; val.textContent=fmt(track.fx[k]);
            sl.addEventListener('input',()=>{ val.textContent=fmt(+sl.value); updateTrackFx(track,k,+sl.value); autoSave(); });
            // MIDI Learn button for Rev and Filter
            if((k==='flt'||k==='rev')&&typeof makeMlBtn==='function'){
                const norm=k==='flt'?v=>(v*(max-min)+min):v=>v;
                const mlBtn=makeMlBtn(v=>{ sl.value=norm(v); sl.dispatchEvent(new Event('input')); },`${track.label} ${label}`);
                wrap.append(lbl,sl,val,mlBtn);
            } else {
                wrap.append(lbl,sl,val);
            }
            fxPanel.appendChild(wrap);
        });
        // ── EQ section ───────────────────────────────────────────
        const eqSection=document.createElement('div'); eqSection.className='eq-section';
        const eqTitle=document.createElement('span'); eqTitle.className='eq-section-title'; eqTitle.textContent='EQ';
        eqSection.appendChild(eqTitle);
        [{b:'low',lbl:'Low'},{b:'mid',lbl:'Mid'},{b:'high',lbl:'Hi'}].forEach(({b,lbl})=>{
            const wrap=document.createElement('div'); wrap.className='fx-knob eq-knob';
            const label=document.createElement('label'); label.textContent=lbl;
            const sl=document.createElement('input'); sl.type='range'; sl.min=-12; sl.max=12; sl.step=0.5; sl.value=track.eq?.[b]??0;
            const fmtEq=v=>(v>=0?'+':'')+parseFloat(v).toFixed(1)+'dB';
            const val=document.createElement('span'); val.className='fx-val'; val.textContent=fmtEq(sl.value);
            sl.addEventListener('input',()=>{ val.textContent=fmtEq(+sl.value); updateTrackEq(track,b,+sl.value); autoSave(); });
            const mlBtn=typeof makeMlBtn==='function'
                ? makeMlBtn(v=>{ sl.value=(v*24-12).toFixed(1); sl.dispatchEvent(new Event('input')); }, `${track.label} EQ ${lbl}`) : null;
            wrap.append(label,sl,val); if(mlBtn) wrap.appendChild(mlBtn);
            eqSection.appendChild(wrap);
        });
        fxPanel.appendChild(eqSection);

        // ── Bus routing ──────────────────────────────────────────
        const busRow=document.createElement('div'); busRow.className='fx-bus-row';
        const busLbl=document.createElement('label'); busLbl.textContent='Bus'; busLbl.style.cssText='font-size:8px;color:var(--muted);font-weight:700';
        const busSel=document.createElement('select'); busSel.className='fx-bus-sel';
        const noneOpt=document.createElement('option'); noneOpt.value=''; noneOpt.textContent='Master (direct)'; busSel.appendChild(noneOpt);
        (window.BUS_DEFS||[]).forEach(def=>{
            const o=document.createElement('option'); o.value=def.id; o.textContent=def.label;
            if(track.busRoute===def.id) o.selected=true; busSel.appendChild(o);
        });
        busSel.addEventListener('change',()=>{
            track.busRoute=busSel.value||null;
            if(typeof rerouteTrack==='function') rerouteTrack(track);
            autoSave();
        });
        busRow.append(busLbl,busSel); fxPanel.appendChild(busRow);

        // LFO section inside FX panel
        const lfoSection=document.createElement('div'); lfoSection.className='lfo-section';
        const lfoToggle=document.createElement('button'); lfoToggle.className='lfo-toggle'+(track.lfo.enabled?' active':''); lfoToggle.textContent='LFO';
        const lfoTargetCtrl=document.createElement('div'); lfoTargetCtrl.className='lfo-ctrl';
        const lfoTargetLbl=document.createElement('label'); lfoTargetLbl.textContent='Doel';
        const lfoTargetSel=document.createElement('select');
        [{v:'filter',l:'Filter'},{v:'volume',l:'Volume'},{v:'pan',l:'Pan'}].forEach(({v,l})=>{
            const o=document.createElement('option'); o.value=v; o.textContent=l; if(v===track.lfo.target)o.selected=true; lfoTargetSel.appendChild(o);
        });
        lfoTargetCtrl.append(lfoTargetLbl,lfoTargetSel);
        const lfoRateCtrl=document.createElement('div'); lfoRateCtrl.className='lfo-ctrl';
        const lfoRateLbl=document.createElement('label'); lfoRateLbl.textContent='Rate';
        const lfoRateSl=document.createElement('input'); lfoRateSl.type='range'; lfoRateSl.min=0.1; lfoRateSl.max=10; lfoRateSl.step=0.1; lfoRateSl.value=track.lfo.rate;
        const lfoRateVal=document.createElement('span'); lfoRateVal.className='lfo-v'; lfoRateVal.textContent=track.lfo.rate+'Hz';
        lfoRateCtrl.append(lfoRateLbl,lfoRateSl,lfoRateVal);
        const lfoDepthCtrl=document.createElement('div'); lfoDepthCtrl.className='lfo-ctrl';
        const lfoDepthLbl=document.createElement('label'); lfoDepthLbl.textContent='Depth';
        const lfoDepthSl=document.createElement('input'); lfoDepthSl.type='range'; lfoDepthSl.min=0; lfoDepthSl.max=1; lfoDepthSl.step=0.01; lfoDepthSl.value=track.lfo.depth;
        const lfoDepthVal=document.createElement('span'); lfoDepthVal.className='lfo-v'; lfoDepthVal.textContent=Math.round(track.lfo.depth*100)+'%';
        lfoDepthCtrl.append(lfoDepthLbl,lfoDepthSl,lfoDepthVal);
        lfoRateSl.addEventListener('input',()=>{ const v=+lfoRateSl.value; lfoRateVal.textContent=v+'Hz'; track.lfo.rate=v; if(track.lfo.enabled) buildTrackLFO(track); });
        lfoDepthSl.addEventListener('input',()=>{ const v=+lfoDepthSl.value; lfoDepthVal.textContent=Math.round(v*100)+'%'; track.lfo.depth=v; if(track.lfo.enabled) buildTrackLFO(track); });
        lfoTargetSel.addEventListener('change',()=>{ track.lfo.target=lfoTargetSel.value; if(track.lfo.enabled) buildTrackLFO(track); });
        lfoToggle.addEventListener('click',()=>{
            track.lfo.enabled=!track.lfo.enabled; lfoToggle.classList.toggle('active',track.lfo.enabled);
            buildTrackLFO(track); autoSave();
        });
        lfoSection.append(lfoToggle,lfoTargetCtrl,lfoRateCtrl,lfoDepthCtrl);
        fxPanel.appendChild(lfoSection);

        fxBtn.addEventListener('click',()=>{ fxPanel.classList.toggle('open'); fxBtn.classList.toggle('active',fxPanel.classList.contains('open')); });
        row.appendChild(fxPanel);

        // Euclidean panel
        const eucPanel=document.createElement('div'); eucPanel.className='euclid-panel';
        const eucHitsCtrl=document.createElement('div'); eucHitsCtrl.style.display='flex'; eucHitsCtrl.style.alignItems='center'; eucHitsCtrl.style.gap='4px';
        const eucHitsLbl=document.createElement('label'); eucHitsLbl.textContent='Hits';
        const eucHitsSl=document.createElement('input'); eucHitsSl.type='range'; eucHitsSl.min=1; eucHitsSl.max=SEQ.steps; eucHitsSl.step=1; eucHitsSl.value=4;
        const eucHitsVal=document.createElement('span'); eucHitsVal.className='e-val'; eucHitsVal.textContent='4';
        eucHitsSl.addEventListener('input',()=>eucHitsVal.textContent=eucHitsSl.value);
        eucHitsCtrl.append(eucHitsLbl,eucHitsSl,eucHitsVal);
        const eucRotCtrl=document.createElement('div'); eucRotCtrl.style.display='flex'; eucRotCtrl.style.alignItems='center'; eucRotCtrl.style.gap='4px';
        const eucRotLbl=document.createElement('label'); eucRotLbl.textContent='Rotatie';
        const eucRotSl=document.createElement('input'); eucRotSl.type='range'; eucRotSl.min=0; eucRotSl.max=SEQ.steps-1; eucRotSl.step=1; eucRotSl.value=0;
        const eucRotVal=document.createElement('span'); eucRotVal.className='e-val'; eucRotVal.textContent='0';
        eucRotSl.addEventListener('input',()=>eucRotVal.textContent=eucRotSl.value);
        eucRotCtrl.append(eucRotLbl,eucRotSl,eucRotVal);
        const eucApply=document.createElement('button'); eucApply.className='euclid-apply'; eucApply.textContent='↻ Toepassen';
        eucApply.addEventListener('click',()=>{
            const pat=euclidean(+eucHitsSl.value, SEQ.steps, +eucRotSl.value);
            pat.forEach((v,i)=>{ track.steps[i]=v?1:0; track.probs[i]=100; });
            buildSeqGrid(); if(S.isPlaying) buildSeqLoop(); autoSave();
            setStatus(`Euclidisch: ${eucHitsSl.value} hits / ${SEQ.steps} stappen`,'ok');
        });
        eucPanel.append(eucHitsCtrl,eucRotCtrl,eucApply);
        eucBtn.addEventListener('click',()=>{ eucPanel.classList.toggle('open'); eucBtn.classList.toggle('active',eucPanel.classList.contains('open')); });
        row.appendChild(eucPanel);

        // Mixer row (always visible)
        const mixRow=document.createElement('div'); mixRow.className='seq-mixer-row';
        // Volume
        const volCtrl=document.createElement('div'); volCtrl.className='mixer-ctrl';
        const volLbl=document.createElement('span'); volLbl.className='mixer-lbl'; volLbl.textContent='VOL';
        const volSl=document.createElement('input'); volSl.type='range'; volSl.className='mixer-vol';
        volSl.min=-40; volSl.max=6; volSl.step=0.5; volSl.value=track.volume;
        const volVal=document.createElement('span'); volVal.className='mixer-val';
        volVal.textContent=(track.volume>=0?'+':'')+track.volume+'dB';
        volSl.addEventListener('input',()=>{
            const v=+volSl.value; volVal.textContent=(v>=0?'+':'')+v+'dB';
            updateTrackMixer(track,'volume',v); autoSave();
        });
        volCtrl.append(volLbl,volSl,volVal);
        // Sep
        const sep=document.createElement('div'); sep.className='mixer-sep';
        // Pan
        const panCtrl=document.createElement('div'); panCtrl.className='mixer-ctrl';
        const panLbl=document.createElement('span'); panLbl.className='mixer-lbl'; panLbl.textContent='PAN';
        const panSl=document.createElement('input'); panSl.type='range'; panSl.className='mixer-pan';
        panSl.min=-1; panSl.max=1; panSl.step=0.05; panSl.value=track.pan;
        const panVal=document.createElement('span'); panVal.className='mixer-val';
        panVal.textContent=track.pan===0?'C':track.pan>0?'R'+Math.round(track.pan*100):'L'+Math.round(-track.pan*100);
        panSl.addEventListener('input',()=>{
            const v=+panSl.value;
            panVal.textContent=Math.abs(v)<0.03?'C':v>0?'R'+Math.round(v*100):'L'+Math.round(-v*100);
            updateTrackMixer(track,'pan',v); autoSave();
        });
        panCtrl.append(panLbl,panSl,panVal);
        mixRow.append(volCtrl,panCtrl);
        hdr.appendChild(mixRow);

        // Steps or mini piano roll preview
        if(track.melodic && track.editMode==='pianoroll'){
            const preview=document.createElement('div'); preview.className='seq-pr-preview';
            preview.dataset.uid=track.uid;
            drawMiniPianoRoll(preview, track);
            preview.addEventListener('click',()=>{ if(typeof openPianoRoll==='function') openPianoRoll(track); });
            row.appendChild(preview);
        } else {
            const stepsWrap=document.createElement('div'); stepsWrap.className='seq-steps';
            for(let g=0;g<SEQ.steps/4;g++){
                const grp=document.createElement('div'); grp.className='seq-step-group';
                for(let s=0;s<4;s++) grp.appendChild(makeStepBtn(track,g*4+s));
                stepsWrap.appendChild(grp);
            }
            row.appendChild(stepsWrap);
        }
        grid.appendChild(row);
    });

    // Add-track row
    const addRow=document.createElement('div'); addRow.className='seq-add-row';
    const addSel=document.createElement('select'); addSel.id='addTrackType';
    Object.entries(TRACK_TYPES).forEach(([k,v])=>{ const o=document.createElement('option'); o.value=k; o.textContent=v.label; addSel.appendChild(o); });
    const addBtn=document.createElement('button'); addBtn.className='seq-add-btn'; addBtn.textContent='+ Track toevoegen';
    addBtn.addEventListener('click',()=>addTrack(addSel.value));
    addRow.append(addSel,addBtn);
    grid.appendChild(addRow);
    if(typeof refreshKbdRecTrack==='function') refreshKbdRecTrack();
    if(typeof refreshMixerIfOpen==='function') refreshMixerIfOpen();
}

function drawMiniPianoRoll(container, track) {
    const notes = track.pianoRoll ?? [];
    const bars  = track.pianoRollBars ?? 4;
    const totalBeats = bars * 4;
    container.innerHTML = '';

    if (!notes.length) {
        container.innerHTML = '<span class="seq-pr-empty">Klik MIDI om noten te tekenen</span>';
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'seq-pr-canvas';
    container.appendChild(canvas);

    // Size canvas to container after paint
    requestAnimationFrame(() => {
        const w = container.clientWidth || 480;
        const h = container.clientHeight || 36;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // MIDI range from notes
        const midiVals = notes.map(n => n.note);
        let lo = Math.min(...midiVals) - 1;
        let hi = Math.max(...midiVals) + 1;
        if (hi - lo < 4) { lo -= 2; hi += 2; }
        const range = hi - lo;

        // Background
        ctx.fillStyle = '#0e1018';
        ctx.fillRect(0, 0, w, h);

        // Beat grid
        for (let b = 0; b <= totalBeats; b++) {
            const x = (b / totalBeats) * w;
            ctx.strokeStyle = b % 4 === 0 ? '#2a2d3e' : '#1a1c26';
            ctx.lineWidth = b % 4 === 0 ? 1.5 : 0.5;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        // Notes
        notes.forEach(n => {
            const x  = (n.start / totalBeats) * w;
            const nw = Math.max(2, (n.dur / totalBeats) * w - 1);
            const y  = h - ((n.note - lo) / range) * h - 3;
            const nh = Math.max(2, h / range - 1);
            ctx.globalAlpha = 0.4 + (n.vel / 127) * 0.6;
            ctx.fillStyle = track.color ?? '#5b7df5';
            ctx.fillRect(x, y, nw, nh);
        });
        ctx.globalAlpha = 1;
    });
}

function makeStepBtn(track, idx) {
    const btn=document.createElement('button'); btn.className='seq-step'; btn.dataset.uid=track.uid; btn.dataset.step=idx;
    const val=track.steps[idx]; const isOn=track.melodic?val!==null:!!val;
    btn.style.setProperty('--c',track.color);
    if(isOn){
        btn.classList.add('on');
        const vel=track.vels[idx]??100;
        btn.style.background=hexAlpha(track.color, 0.3 + (vel/127)*0.65);
        if(track.melodic&&val!==null) btn.innerHTML=`<span class="step-note">${midiName(val)}</span>`;
    }
    const prob=track.probs[idx]??100;
    if(isOn && prob<100){
        const ind=document.createElement('div'); ind.className='step-prob-indicator';
        ind.style.width=prob+'%'; btn.appendChild(ind);
    }
    btn.addEventListener('click',()=>toggleStep(track,idx));
    btn.addEventListener('contextmenu',e=>{
        e.preventDefault();
        if(track.melodic && !e.shiftKey){ cycleNote(track,idx); return; }
        const isActive = track.melodic ? track.steps[idx]!==null : !!track.steps[idx];
        if(isActive) showStepOptsPopup(track, idx, btn);
    });
    btn.addEventListener('mouseenter',()=>{ if(!btn.classList.contains('on')) btn.style.borderColor=track.color+'80'; });
    btn.addEventListener('mouseleave',()=>{ if(!btn.classList.contains('on')) btn.style.borderColor=''; });
    return btn;
}

let stepOptsPopupEl = null;
function showStepOptsPopup(track, idx, anchor) {
    closeStepOptsPopup();
    const popup = document.createElement('div'); popup.className='step-opts-popup'; stepOptsPopupEl=popup;
    const rect = anchor.getBoundingClientRect();
    popup.style.left = Math.min(rect.left, window.innerWidth-160)+'px';
    popup.style.top  = Math.max(4, rect.top - 138)+'px';

    const title = document.createElement('div'); title.className='pop-title'; title.textContent=`Stap ${idx+1}`;
    popup.appendChild(title);

    // Velocity row
    const velRow=document.createElement('div'); velRow.className='step-opts-row';
    const velLbl=document.createElement('label'); velLbl.textContent='VEL';
    const velSl=document.createElement('input'); velSl.type='range'; velSl.min=1; velSl.max=127; velSl.step=1; velSl.value=track.vels[idx]??100;
    velSl.style.accentColor='var(--accent)';
    const velVal=document.createElement('span'); velVal.className='pop-val'; velVal.textContent=track.vels[idx]??100;
    velSl.addEventListener('input',()=>{ const v=+velSl.value; velVal.textContent=v; track.vels[idx]=v; refreshStepBtn(track,idx); });
    velSl.addEventListener('change',()=>{ pushHistory(); autoSave(); });
    velRow.append(velLbl,velSl,velVal);

    // Probability row
    const probRow=document.createElement('div'); probRow.className='step-opts-row';
    const probLbl=document.createElement('label'); probLbl.textContent='PROB';
    const probSl=document.createElement('input'); probSl.type='range'; probSl.min=5; probSl.max=100; probSl.step=5; probSl.value=track.probs[idx]??100;
    probSl.style.accentColor='var(--green)';
    const probVal=document.createElement('span'); probVal.className='pop-val'; probVal.textContent=(track.probs[idx]??100)+'%';
    probSl.addEventListener('input',()=>{ const v=+probSl.value; probVal.textContent=v+'%'; track.probs[idx]=v; refreshStepBtn(track,idx); });
    probSl.addEventListener('change',()=>{ pushHistory(); autoSave(); });
    probRow.append(probLbl,probSl,probVal);

    // Gate row (melodic tracks only)
    if(track.melodic) {
        const gateRow=document.createElement('div'); gateRow.className='step-opts-row';
        const gateLbl=document.createElement('label'); gateLbl.textContent='GATE';
        const gateSl=document.createElement('input'); gateSl.type='range'; gateSl.min=5; gateSl.max=100; gateSl.step=5; gateSl.value=track.gates?.[idx]??80;
        gateSl.style.accentColor='var(--accent2)';
        const gateVal=document.createElement('span'); gateVal.className='pop-val'; gateVal.textContent=(track.gates?.[idx]??80)+'%';
        gateSl.addEventListener('input',()=>{ const v=+gateSl.value; gateVal.textContent=v+'%'; if(!track.gates) track.gates=Array(32).fill(80); track.gates[idx]=v; });
        gateSl.addEventListener('change',()=>{ pushHistory(); autoSave(); });
        gateRow.append(gateLbl,gateSl,gateVal);
        popup.append(velRow, probRow, gateRow);
    } else {
        popup.append(velRow, probRow);
    }
    document.body.appendChild(popup);
    setTimeout(()=>document.addEventListener('click',closeStepOptsPopup,{once:true}),10);
}
function closeStepOptsPopup(){ if(stepOptsPopupEl){ stepOptsPopupEl.remove(); stepOptsPopupEl=null; } }

function hexAlpha(hex,a){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }

function refreshStepBtn(track, idx) {
    const btn=document.querySelector(`.seq-step[data-uid="${track.uid}"][data-step="${idx}"]`);
    if(!btn) return;
    const val=track.steps[idx]; const isOn=track.melodic?val!==null:!!val;
    btn.classList.toggle('on',isOn);
    const vel=track.vels[idx]??100;
    const prob=track.probs[idx]??100;
    btn.style.background=isOn?hexAlpha(track.color, 0.3+(vel/127)*0.65):'';
    btn.innerHTML=isOn&&track.melodic&&val!==null?`<span class="step-note">${midiName(val)}</span>`:'';
    const oldInd=btn.querySelector('.step-prob-indicator'); if(oldInd) oldInd.remove();
    if(isOn&&prob<100){ const ind=document.createElement('div'); ind.className='step-prob-indicator'; ind.style.width=prob+'%'; btn.appendChild(ind); }
}

function toggleStep(track,idx) {
    pushHistory();
    if(track.melodic) track.steps[idx]=track.steps[idx]===null?getMelNote(track.type):null;
    else              track.steps[idx]=track.steps[idx]?0:1;
    refreshStepBtn(track,idx);
    autoSave();
}
function cycleNote(track,idx) {
    const notes=getScaleNotes(track.type); if(!notes.length) return;
    pushHistory();
    const cur=track.steps[idx]; const ci=cur===null?-1:notes.indexOf(cur);
    track.steps[idx]=notes[(ci+1)%notes.length];
    refreshStepBtn(track,idx);
    autoSave();
}
function getMelNote(type)   { const n=getScaleNotes(type); return n[0]??(type==='bass'?33:57); }
function getScaleNotes(type){ const [lo,hi]=type==='bass'?[24,47]:[48,71]; return S.scale.filter(n=>n>=lo&&n<=hi).sort((a,b)=>a-b); }
