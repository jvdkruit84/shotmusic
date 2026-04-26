// ── Piano Roll ─────────────────────────────────────────────
// Canvas-based piano roll editor for melodic tracks (bass, melody, pad).
// Notes: { id, note (MIDI 0-127), start (beats), dur (beats), vel (0-127) }

(function() {

// ── Layout constants ─────────────────────────────────────────
const KEYS_W  = 48;   // piano keyboard width (px)
const RULER_H = 24;   // bar/beat ruler height (px)
const VEL_H   = 68;   // velocity lane height (px)
const NOTE_H  = 13;   // height of one pitch row (px)
const BEAT_W  = 80;   // pixels per beat at zoom=1
const NOTE_LO = 24;   // lowest MIDI note shown (C1)
const NOTE_HI = 108;  // highest MIDI note shown (C8)
const TOTAL_NOTES = NOTE_HI - NOTE_LO + 1; // 85 rows

// ── Piano roll state ──────────────────────────────────────────
const PR = {
    open: false,
    track: null,
    bars: 4,
    zoom: 1.0,
    scrollX: 0,
    scrollY: 0,
    snap: 0.25,
    selected: new Set(),
    nextId: 1,
    iMode: 'draw',
    drag: null,
    genVisible: false,
    velVisible: false,
    genPanel: null,
    velPanel: null,
    modal: null,
    canvas: null,
    velCanvas: null,
    ctx: null,
    velCtx: null,
    raf: null,
    dirty: true,
    // ── MIDI recording ──
    recording: false,
    recPending: new Map(), // midiNote → {startBeat, vel}
};

// ── Helpers ──────────────────────────────────────────────────
function beatW()    { return BEAT_W * PR.zoom; }
function totalW()   { return PR.bars * 4 * beatW(); }
function totalH()   { return TOTAL_NOTES * NOTE_H; }
function visW()     { return PR.canvas ? PR.canvas.width - KEYS_W : 400; }
function visH()     { return PR.canvas ? PR.canvas.height - RULER_H : 300; }

function beatToX(beat)  { return KEYS_W + (beat - PR.scrollX) * beatW(); }
function xToBeat(px)    { return PR.scrollX + (px - KEYS_W) / beatW(); }
function noteToY(midi)  { return RULER_H + (NOTE_HI - midi) * NOTE_H - PR.scrollY; }
function yToNote(py)    { return NOTE_HI - Math.floor((py - RULER_H + PR.scrollY) / NOTE_H); }
function snapBeat(b)    { const s = PR.snap; return Math.round(b / s) * s; }

function noteLabel(midi) {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    return names[midi % 12] + Math.floor(midi / 12 - 1);
}

function isBlack(midi) {
    return [1,3,6,8,10].includes(midi % 12);
}

// ── Build Tone.Part for playback ─────────────────────────────
function buildPianoRollPart(track) {
    try { track.part?.dispose(); } catch(e) {}
    track.part = null;
    if (!track.pianoRoll || !track.pianoRoll.length) return;
    if (!track.synth) return;

    const bpm     = Tone.getTransport().bpm.value;
    const beatSec = 60 / bpm;
    const loopEnd = track.pianoRollBars * 4 * beatSec;

    const events = track.pianoRoll.map(n => {
        const startSec = n.start * beatSec;
        // Cap duration so note + release doesn't bleed into next loop iteration,
        // which would cause fresh voice allocation (lazy FatOscillator) on every repeat.
        const maxDur = Math.max(0.01, loopEnd - startSec - 0.05);
        const dur = Math.min(Math.max(0.01, n.dur * beatSec), maxDur);
        return [startSec, { note: midiFreq(n.note), midi: n.note, dur, vel: Math.max(0.01, Math.min(1, n.vel / 127)) }];
    });

    track.part = new Tone.Part((time, v) => {
        if (track.mute) return;
        try { track.synth?.triggerAttackRelease(v.note, v.dur, time, v.vel); } catch(e) {}
        // MIDI out
        if (track.midiOut?.enabled && typeof sendMidiNote === 'function') {
            const ch = (track.midiOut.channel || 3) - 1;
            Tone.Draw.schedule(() => sendMidiNote(ch, v.midi, Math.round(v.vel * 127), v.dur * 1000), time);
        }
    }, events);
    track.part.loop    = true;
    track.part.loopEnd = loopEnd;
    track.part.start(0);
}
window.buildPianoRollPart = buildPianoRollPart;

// ── MIDI note handler (called from midi_learn.js) ────────────
function _midiNoteIn(note, vel, isOn) {
    if (!PR.recording || !PR.track) return;

    // Always play through the track synth for live monitoring
    try {
        if (isOn) {
            PR.track.synth?.triggerAttack?.(midiFreq(note), Tone.now(), vel / 127);
        } else {
            PR.track.synth?.triggerRelease?.(midiFreq(note), Tone.now());
        }
    } catch(e) {}

    // Only record timing when transport is playing
    if (!S?.isPlaying) {
        if (isOn) PR.recPending.set(note, { startBeat: 0, vel });
        else PR.recPending.delete(note);
        return;
    }

    const loopBeats = PR.bars * 4;
    const rawBeat   = Tone.getTransport().ticks / Tone.getTransport().PPQ;
    const curBeat   = rawBeat % loopBeats;

    if (isOn) {
        PR.recPending.set(note, { startBeat: curBeat, vel });
        PR.dirty = true;
    } else {
        const pending = PR.recPending.get(note);
        if (!pending) return;
        PR.recPending.delete(note);

        let dur = curBeat - pending.startBeat;
        if (dur <= 0) dur += loopBeats;          // wrapped around loop end
        dur = Math.max(PR.snap || 0.25, dur);

        // Snap start to grid
        const start = PR.snap > 0
            ? Math.round(pending.startBeat / PR.snap) * PR.snap
            : pending.startBeat;

        PR.track.pianoRoll = PR.track.pianoRoll || [];
        PR.track.pianoRoll.push({
            id:    PR.nextId++,
            note:  Math.max(NOTE_LO, Math.min(NOTE_HI, note)),
            start: Math.max(0, start % loopBeats),
            dur:   Math.min(dur, loopBeats),
            vel,
        });

        PR.dirty = true;
        if (S?.isPlaying) buildPianoRollPart(PR.track);
        if (typeof autoSave === 'function') autoSave();
    }
}

// ── Import from step grid ─────────────────────────────────────
function importFromSteps(track) {
    if (!track.steps) return;
    const notes = [];
    track.steps.forEach((val, i) => {
        if (val === null || val === 0) return;
        const midi = typeof val === 'number' && val > 0 ? val : 60;
        const vel  = track.vels[i] ?? 100;
        notes.push({ id: PR.nextId++, note: midi, start: i * 0.25, dur: 0.25, vel });
    });
    track.pianoRoll = notes;
}

// ── Toggle edit mode ──────────────────────────────────────────
function toggleEditMode(track) {
    if (track.editMode === 'steps') {
        track.editMode = 'pianoroll';
        if (!track.pianoRoll.length) importFromSteps(track);
        if (S?.isPlaying) buildPianoRollPart(track);
    } else {
        track.editMode = 'steps';
        try { track.part?.dispose(); } catch(e) {}
        track.part = null;
    }
    // Update PR button active state
    const btn = document.querySelector(`.seq-pr-btn[data-uid="${track.uid}"]`);
    if (btn) btn.classList.toggle('active', track.editMode === 'pianoroll');
    if (typeof autoSave === 'function') autoSave();
}

// ── Open / close modal ────────────────────────────────────────
function openPianoRoll(track) {
    PR.track = track;
    PR.bars  = track.pianoRollBars ?? 4;
    PR.selected.clear();
    PR.dirty = true;

    if (!PR.modal) buildModal();
    PR.modal.style.display = 'flex';
    PR.open = true;

    updateModalHeader();
    resizeCanvases();
    scrollToCenterPitch();
    requestRender();
}
window.openPianoRoll = openPianoRoll;

function closePianoRoll() {
    // Stop recording when closing
    if (PR.recording) {
        PR.recording = false;
        window.MIDI_NOTE_HANDLER = null;
        PR.recPending.clear();
    }
    if (PR.modal) PR.modal.style.display = 'none';
    PR.open  = false;
    PR.track = null;
    cancelAnimationFrame(PR.raf);
    if (typeof buildSeqGrid === 'function') buildSeqGrid();
}

function scrollToCenterPitch() {
    // Center around C4 (MIDI 60)
    const targetY = (NOTE_HI - 60) * NOTE_H - visH() / 2;
    PR.scrollY = Math.max(0, Math.min(totalH() - visH(), targetY));
}

// ── Modal DOM ─────────────────────────────────────────────────
function buildModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'pr-backdrop';
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closePianoRoll(); });

    const dialog = document.createElement('div');
    dialog.className = 'pr-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'pr-header';
    header.id = 'prHeader';

    const title = document.createElement('span');
    title.className = 'pr-title';
    title.id = 'prTitle';
    title.textContent = 'PIANO ROLL';

    // Mode toggle
    const modeBtn = document.createElement('button');
    modeBtn.className = 'pr-mode-btn';
    modeBtn.id = 'prModeBtn';
    modeBtn.title = 'Wissel tussen Steps en Piano Roll modus';
    modeBtn.addEventListener('click', () => {
        if (!PR.track) return;
        toggleEditMode(PR.track);
        updateModalHeader();
    });

    // Bars selector
    const barsLabel = document.createElement('span');
    barsLabel.className = 'pr-label';
    barsLabel.textContent = 'Bars:';
    const barsGroup = document.createElement('div');
    barsGroup.className = 'pr-btn-group';
    [1, 2, 4, 8].forEach(n => {
        const b = document.createElement('button');
        b.className = 'pr-bars-btn';
        b.dataset.bars = n;
        b.textContent = n;
        b.addEventListener('click', () => {
            if (!PR.track) return;
            PR.bars = n;
            PR.track.pianoRollBars = n;
            document.querySelectorAll('.pr-bars-btn').forEach(x => x.classList.toggle('active', +x.dataset.bars === n));
            PR.dirty = true;
            if (typeof autoSave === 'function') autoSave();
        });
        barsGroup.appendChild(b);
    });

    // Snap selector
    const snapLabel = document.createElement('span');
    snapLabel.className = 'pr-label';
    snapLabel.textContent = 'Snap:';
    const snapSel = document.createElement('select');
    snapSel.className = 'pr-snap-sel';
    [['1/16', 0.25], ['1/8', 0.5], ['1/4', 1.0], ['Free', 0]].forEach(([lbl, val]) => {
        const o = document.createElement('option');
        o.value = val; o.textContent = lbl;
        if (val === PR.snap) o.selected = true;
        snapSel.appendChild(o);
    });
    snapSel.addEventListener('change', () => { PR.snap = +snapSel.value; });

    // Zoom
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'pr-label';
    zoomLabel.textContent = 'Zoom:';
    const zoomOut = document.createElement('button');
    zoomOut.className = 'pr-zoom-btn'; zoomOut.textContent = '−';
    zoomOut.addEventListener('click', () => { PR.zoom = Math.max(0.25, PR.zoom / 1.5); PR.dirty = true; });
    const zoomIn = document.createElement('button');
    zoomIn.className = 'pr-zoom-btn'; zoomIn.textContent = '+';
    zoomIn.addEventListener('click', () => { PR.zoom = Math.min(8, PR.zoom * 1.5); PR.dirty = true; });

    // Generator toggle
    const genBtn = document.createElement('button');
    genBtn.className = 'pr-gen-btn';
    genBtn.id = 'prGenBtn';
    genBtn.textContent = '⚡ Gen';
    genBtn.title = 'Noten genereren op basis van toonladder & progressie';
    genBtn.addEventListener('click', toggleGenPanel);

    // ── Separator ──
    const sep1 = document.createElement('div');
    sep1.className = 'pr-sep';

    // Quantize button
    const quantBtn = document.createElement('button');
    quantBtn.className = 'pr-tool-btn';
    quantBtn.textContent = 'Q';
    quantBtn.title = 'Quantize: snap geselecteerde noten op het grid (sneltoets Q)';
    quantBtn.addEventListener('click', quantizeSelected);

    // Velocity curves panel toggle
    const velBtn = document.createElement('button');
    velBtn.className = 'pr-tool-btn';
    velBtn.id = 'prVelBtn';
    velBtn.textContent = 'Vel ▾';
    velBtn.title = 'Velocity curves: crescendo, flatten, humanize';
    velBtn.addEventListener('click', toggleVelPanel);

    // Chord tools
    const sep2 = document.createElement('div');
    sep2.className = 'pr-sep';

    const chordLabel = document.createElement('span');
    chordLabel.className = 'pr-label';
    chordLabel.textContent = '+';

    // Build chord buttons separately so we can append them in order
    const chord3  = makeChordBtn('3rd', 4,  '+terts (+4 st)');
    const chord5  = makeChordBtn('5th', 7,  '+kwint (+7 st)');
    const chord8  = makeChordBtn('8va', 12, '+octaaf (+12 st)');

    // ── Record button ─────────────────────────────────────────
    const recSep = document.createElement('div'); recSep.className = 'pr-sep';
    const recBtn = document.createElement('button');
    recBtn.className = 'pr-rec-btn';
    recBtn.title = 'MIDI opnemen — speel noten op een MIDI-keyboard. Start de sequencer om timing vast te leggen.';
    recBtn.textContent = '● REC';
    recBtn.addEventListener('click', () => {
        PR.recording = !PR.recording;
        recBtn.classList.toggle('active', PR.recording);
        if (PR.recording) {
            PR.recPending.clear();
            window.MIDI_NOTE_HANDLER = _midiNoteIn;
            if (typeof setStatus === 'function') setStatus('MIDI opname actief — speel noten, start Play voor timing', 'ok');
        } else {
            window.MIDI_NOTE_HANDLER = null;
            PR.recPending.forEach((_, note) => {
                PR.track?.synth?.triggerRelease?.(midiFreq(note), Tone.now());
            });
            PR.recPending.clear();
            if (typeof setStatus === 'function') setStatus('Opname gestopt', 'ok');
        }
        PR.dirty = true;
    });

    // Close
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pr-close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closePianoRoll);

    header.append(title, modeBtn, barsLabel, barsGroup, snapLabel, snapSel, zoomLabel, zoomOut, zoomIn, genBtn,
                  sep1, quantBtn, velBtn, sep2, chordLabel, chord3, chord5, chord8, recSep, recBtn, closeBtn);

    // Canvas area
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'pr-canvas-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'pr-canvas';
    canvas.id = 'prCanvas';
    PR.canvas = canvas;
    PR.ctx    = canvas.getContext('2d');

    // Velocity lane
    const velWrap = document.createElement('div');
    velWrap.className = 'pr-vel-wrap';

    const velCanvas = document.createElement('canvas');
    velCanvas.className = 'pr-vel-canvas';
    velCanvas.id = 'prVelCanvas';
    PR.velCanvas = velCanvas;
    PR.velCtx    = velCanvas.getContext('2d');

    // Scrollbars
    const hScroll = document.createElement('div');
    hScroll.className = 'pr-hscroll';
    const hBar = document.createElement('div');
    hBar.className = 'pr-hscroll-bar';
    hBar.id = 'prHScrollBar';
    hScroll.appendChild(hBar);

    canvasWrap.appendChild(canvas);
    velWrap.appendChild(velCanvas);

    // Generator panel (built immediately, hidden by default)
    PR.genPanel = buildGenPanel();
    PR.genPanel.style.display = 'none';

    // Velocity/tools panel
    PR.velPanel = buildVelPanel();
    PR.velPanel.style.display = 'none';

    dialog.append(header, PR.genPanel, PR.velPanel, canvasWrap, velWrap, hScroll);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    PR.modal = backdrop;

    // Events
    setupCanvasEvents(canvas, velCanvas, hBar);

    // Keyboard
    document.addEventListener('keydown', onKeyDown);
}

function updateModalHeader() {
    if (!PR.track) return;
    const title = document.getElementById('prTitle');
    if (title) title.textContent = 'PIANO ROLL — ' + PR.track.label;
    const modeBtn = document.getElementById('prModeBtn');
    if (modeBtn) {
        modeBtn.textContent = PR.track.editMode === 'pianoroll' ? '↔ Steps' : '↔ Roll';
        modeBtn.classList.toggle('active', PR.track.editMode === 'pianoroll');
    }
    const barsInPR = PR.track.pianoRollBars ?? 4;
    document.querySelectorAll('.pr-bars-btn').forEach(b =>
        b.classList.toggle('active', +b.dataset.bars === barsInPR)
    );
}

// ── Canvas resize ─────────────────────────────────────────────
function resizeCanvases() {
    if (!PR.canvas) return;
    const wrap = PR.canvas.parentElement;
    const rect  = wrap.getBoundingClientRect();
    const dpr   = window.devicePixelRatio || 1;
    const w     = Math.floor(rect.width);
    const h     = Math.floor(rect.height);

    PR.canvas.width  = w * dpr; PR.canvas.height = h * dpr;
    PR.canvas.style.width  = w + 'px'; PR.canvas.style.height = h + 'px';
    PR.ctx.scale(dpr, dpr);

    const velWrap = PR.velCanvas.parentElement;
    const vr = velWrap.getBoundingClientRect();
    const vw = Math.floor(vr.width);
    PR.velCanvas.width  = vw * dpr; PR.velCanvas.height = VEL_H * dpr;
    PR.velCanvas.style.width  = vw + 'px'; PR.velCanvas.style.height = VEL_H + 'px';
    PR.velCtx.scale(dpr, dpr);

    PR.dirty = true;
}

// ── Rendering ─────────────────────────────────────────────────
function requestRender() {
    if (!PR.open) return;
    if (PR.dirty) {
        render();
        renderVelocity();
        PR.dirty = false;
    }
    PR.raf = requestAnimationFrame(requestRender);
}

function render() {
    const ctx = PR.ctx;
    if (!ctx || !PR.canvas) return;
    const W = PR.canvas.width  / (window.devicePixelRatio || 1);
    const H = PR.canvas.height / (window.devicePixelRatio || 1);
    const bw = beatW();

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#161820';
    ctx.fillRect(0, 0, W, H);

    // ── Pitch rows ────────────────────────────────────────────
    for (let midi = NOTE_LO; midi <= NOTE_HI; midi++) {
        const y   = noteToY(midi);
        const h   = NOTE_H;
        if (y + h < RULER_H || y > H) continue;

        ctx.fillStyle = isBlack(midi) ? '#1a1c26' : '#1e2130';
        ctx.fillRect(KEYS_W, y, W - KEYS_W, h);

        // C marks
        if (midi % 12 === 0) {
            ctx.strokeStyle = '#3a3f5c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(KEYS_W, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    // ── Beat / bar grid lines ─────────────────────────────────
    const firstBeat = Math.floor(PR.scrollX);
    const lastBeat  = Math.ceil(PR.scrollX + visW() / bw) + 1;
    const totalBeats = PR.bars * 4;

    for (let b = firstBeat; b <= Math.min(lastBeat, totalBeats); b++) {
        const x = beatToX(b);
        if (x < KEYS_W || x > W) continue;
        const isBar = b % 4 === 0;
        ctx.strokeStyle = isBar ? '#3a3f5c' : '#252838';
        ctx.lineWidth = isBar ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, RULER_H);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    // End of roll line
    const endX = beatToX(totalBeats);
    if (endX >= KEYS_W && endX <= W) {
        ctx.strokeStyle = '#5b7df5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(endX, RULER_H);
        ctx.lineTo(endX, H);
        ctx.stroke();
    }

    // ── Notes ─────────────────────────────────────────────────
    const notes = PR.track?.pianoRoll ?? [];
    notes.forEach(n => {
        const x  = beatToX(n.start);
        const y  = noteToY(n.note);
        const nw = Math.max(4, n.dur * bw - 1);
        if (x + nw < KEYS_W || x > W || y + NOTE_H < RULER_H || y > H) return;

        const sel    = PR.selected.has(n.id);
        const alpha  = n.vel / 127;
        const baseColor = PR.track.color ?? '#5b7df5';

        ctx.globalAlpha = 0.35 + alpha * 0.65;
        ctx.fillStyle   = sel ? '#ffffff' : baseColor;
        ctx.fillRect(x, y + 1, nw, NOTE_H - 2);
        ctx.globalAlpha = 1;

        // Resize handle
        ctx.fillStyle = sel ? '#cccccc' : '#ffffff44';
        ctx.fillRect(x + nw - 4, y + 2, 4, NOTE_H - 4);

        // Label if wide enough
        if (nw > 24) {
            ctx.fillStyle = sel ? '#000' : '#ffffffcc';
            ctx.font = '9px monospace';
            ctx.fillText(noteLabel(n.note), x + 3, y + NOTE_H - 3);
        }
    });

    // ── Ruler ─────────────────────────────────────────────────
    ctx.fillStyle = '#111318';
    ctx.fillRect(KEYS_W, 0, W - KEYS_W, RULER_H);
    ctx.strokeStyle = '#2a2d3e';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(KEYS_W, RULER_H); ctx.lineTo(W, RULER_H); ctx.stroke();

    for (let b = firstBeat; b <= Math.min(lastBeat, totalBeats); b++) {
        const x = beatToX(b);
        if (x < KEYS_W || x > W) continue;
        const isBar = b % 4 === 0;
        if (isBar) {
            ctx.fillStyle = '#8890bb';
            ctx.font = '10px monospace';
            ctx.fillText('Bar ' + (b / 4 + 1), x + 3, RULER_H - 5);
        } else if (bw > 40) {
            ctx.fillStyle = '#50556a';
            ctx.font = '9px monospace';
            ctx.fillText(b % 4 + 1, x + 2, RULER_H - 5);
        }
    }

    // Playhead
    if (S?.isPlaying) {
        try {
            const pos   = Tone.getTransport().position;
            const [bar, beat] = pos.split(':').map(Number);
            const totalBarsInLoop = PR.track?.pianoRollBars ?? 4;
            const playBeat = ((bar % totalBarsInLoop) * 4) + (beat ?? 0);
            const px = beatToX(playBeat);
            if (px >= KEYS_W && px <= W) {
                ctx.strokeStyle = PR.recording ? '#ef4444' : '#f59f00';
                ctx.lineWidth   = PR.recording ? 3 : 2;
                ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
            }
        } catch(e) {}
    }

    // ── Recording overlay ──────────────────────────────────────
    if (PR.recording) {
        // Red tint over note area
        ctx.fillStyle = 'rgba(239,68,68,0.05)';
        ctx.fillRect(KEYS_W, RULER_H, W - KEYS_W, H - RULER_H);

        // Draw currently-held (pending) notes in red
        const loopBeats = PR.bars * 4;
        const rawBeat   = S?.isPlaying ? Tone.getTransport().ticks / Tone.getTransport().PPQ : 0;
        const curBeat   = rawBeat % loopBeats;
        PR.recPending.forEach((info, midiNote) => {
            if (midiNote < NOTE_LO || midiNote > NOTE_HI) return;
            let dur = S?.isPlaying ? (curBeat - info.startBeat) : 0.25;
            if (dur < 0) dur += loopBeats;
            dur = Math.max(0.125, dur);
            const x  = beatToX(info.startBeat);
            const y  = noteToY(midiNote);
            const nw = Math.max(6, dur * bw);
            ctx.globalAlpha = 0.75;
            ctx.fillStyle   = '#ef4444';
            ctx.fillRect(x, y + 1, nw, NOTE_H - 2);
            ctx.globalAlpha = 1;
        });

        // REC badge in ruler
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        if (blink) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('● REC', KEYS_W + 6, RULER_H - 6);
        }
        PR.dirty = true; // keep animating while recording
    }

    // ── Piano keyboard ────────────────────────────────────────
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, KEYS_W, H);

    for (let midi = NOTE_LO; midi <= NOTE_HI; midi++) {
        const y = noteToY(midi);
        if (y + NOTE_H < RULER_H || y > H) continue;

        if (!isBlack(midi)) {
            ctx.fillStyle = '#2a2d3e';
            ctx.fillRect(1, y + 1, KEYS_W - 3, NOTE_H - 2);
            if (midi % 12 === 0) { // C
                ctx.fillStyle = '#8890bb';
                ctx.font = '8px monospace';
                ctx.fillText(noteLabel(midi), 2, y + NOTE_H - 2);
            }
        } else {
            ctx.fillStyle = '#161820';
            ctx.fillRect(1, y + 1, KEYS_W - 10, NOTE_H - 2);
        }
    }
    // Keyboard border
    ctx.strokeStyle = '#2a2d3e';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(KEYS_W, 0); ctx.lineTo(KEYS_W, H); ctx.stroke();
}

function renderVelocity() {
    const ctx = PR.velCtx;
    if (!ctx || !PR.velCanvas) return;
    const W  = PR.velCanvas.width  / (window.devicePixelRatio || 1);
    const H  = VEL_H;
    const bw = beatW();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, W, H);

    // Label
    ctx.fillStyle = '#50556a';
    ctx.font = '9px monospace';
    ctx.fillText('VEL', 2, 10);

    const notes = PR.track?.pianoRoll ?? [];
    notes.forEach(n => {
        const x  = beatToX(n.start);
        const bw2 = Math.max(3, n.dur * bw - 2);
        if (x < KEYS_W || x + bw2 > W) return;
        const barH = Math.max(2, Math.round((n.vel / 127) * (H - 16)));
        const sel  = PR.selected.has(n.id);
        ctx.fillStyle = sel ? '#ffffff' : (PR.track?.color ?? '#5b7df5');
        ctx.globalAlpha = 0.7 + (sel ? 0.3 : 0);
        ctx.fillRect(x, H - barH, Math.max(3, bw2 - 2), barH);
        ctx.globalAlpha = 1;
    });
}

// ── Mouse interaction ─────────────────────────────────────────
function setupCanvasEvents(canvas, velCanvas, hBar) {
    canvas.addEventListener('mousedown',  onCanvasMouseDown);
    canvas.addEventListener('mousemove',  onCanvasMouseMove);
    canvas.addEventListener('mouseup',    onCanvasMouseUp);
    canvas.addEventListener('contextmenu',onCanvasRightClick);
    canvas.addEventListener('wheel',      onCanvasWheel, { passive: false });

    velCanvas.addEventListener('mousedown', onVelMouseDown);
    velCanvas.addEventListener('mousemove',  onVelMouseMove);
    velCanvas.addEventListener('mouseup',    onVelMouseUp);

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup',   onWindowMouseUp);
    window.addEventListener('resize',    () => { resizeCanvases(); PR.dirty = true; });
}

function canvasPos(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function noteAtPos(x, y) {
    const notes = PR.track?.pianoRoll ?? [];
    const midi  = yToNote(y);
    const beat  = xToBeat(x);
    const bw    = beatW();
    // Check resize handle first (right 6px)
    for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        const nx  = beatToX(n.start);
        const nw  = Math.max(4, n.dur * bw);
        const ny  = noteToY(n.note);
        if (y >= ny && y < ny + NOTE_H && x >= nx && x <= nx + nw) {
            const isResize = x >= nx + nw - 6;
            return { note: n, isResize };
        }
    }
    return null;
}

function onCanvasMouseDown(e) {
    if (!PR.track) return;
    const { x, y } = canvasPos(PR.canvas, e);
    if (y < RULER_H || x < KEYS_W) return;

    const hit = noteAtPos(x, y);
    const beat = xToBeat(x);
    const midi  = yToNote(y);

    if (hit) {
        const n = hit.note;
        if (!PR.selected.has(n.id)) {
            if (!e.shiftKey) PR.selected.clear();
            PR.selected.add(n.id);
        }
        PR.drag = {
            type: hit.isResize ? 'resize' : 'move',
            id: n.id,
            startBeat: beat,
            startNote: midi,
            origStart: n.start,
            origNote:  n.note,
            origDur:   n.dur,
        };
        // If moving, store originals for all selected
        if (!hit.isResize && PR.selected.size > 1) {
            PR.drag.multiOrig = {};
            PR.track.pianoRoll.forEach(nn => {
                if (PR.selected.has(nn.id)) {
                    PR.drag.multiOrig[nn.id] = { start: nn.start, note: nn.note };
                }
            });
        }
    } else {
        // Draw new note
        PR.selected.clear();
        const snapped = PR.snap > 0 ? snapBeat(beat) : beat;
        const newNote = {
            id: PR.nextId++,
            note: Math.max(NOTE_LO, Math.min(NOTE_HI, midi)),
            start: Math.max(0, snapped),
            dur: PR.snap > 0 ? PR.snap : 0.25,
            vel: 100,
        };
        PR.track.pianoRoll.push(newNote);
        PR.selected.add(newNote.id);
        PR.drag = {
            type: 'resize',
            id: newNote.id,
            startBeat: snapped + (PR.snap > 0 ? PR.snap : 0.25),
            origStart: newNote.start,
            origDur:   newNote.dur,
        };
        if (S?.isPlaying && PR.track.editMode === 'pianoroll') buildPianoRollPart(PR.track);
        if (typeof autoSave === 'function') autoSave();
    }
    PR.dirty = true;
}

function onCanvasMouseMove(e) {
    if (!PR.drag || !PR.track) return;
    const { x, y } = canvasPos(PR.canvas, e);
    const beat  = xToBeat(x);
    const midi  = yToNote(y);
    const notes = PR.track.pianoRoll;
    const n     = notes.find(nn => nn.id === PR.drag.id);
    if (!n) return;

    if (PR.drag.type === 'resize') {
        const rawDur  = beat - n.start;
        const minDur  = PR.snap > 0 ? PR.snap : 0.0625;
        n.dur = Math.max(minDur, PR.snap > 0 ? Math.round(rawDur / PR.snap) * PR.snap : rawDur);
    } else {
        // move
        const db = beat - PR.drag.startBeat;
        const dn = midi - PR.drag.startNote;
        if (PR.drag.multiOrig) {
            notes.forEach(nn => {
                if (!PR.selected.has(nn.id)) return;
                const orig = PR.drag.multiOrig[nn.id];
                if (!orig) return;
                nn.start = Math.max(0, PR.snap > 0 ? snapBeat(orig.start + db) : orig.start + db);
                nn.note  = Math.max(NOTE_LO, Math.min(NOTE_HI, orig.note + dn));
            });
        } else {
            n.start = Math.max(0, PR.snap > 0 ? snapBeat(PR.drag.origStart + db) : PR.drag.origStart + db);
            n.note  = Math.max(NOTE_LO, Math.min(NOTE_HI, PR.drag.origNote + dn));
        }
    }
    PR.dirty = true;
}

function onCanvasMouseUp() {
    if (PR.drag && PR.track) {
        if (S?.isPlaying && PR.track.editMode === 'pianoroll') buildPianoRollPart(PR.track);
        if (typeof autoSave === 'function') autoSave();
    }
    PR.drag = null;
    PR.dirty = true;
}

function onCanvasRightClick(e) {
    e.preventDefault();
    if (!PR.track) return;
    const { x, y } = canvasPos(PR.canvas, e);
    const hit = noteAtPos(x, y);
    if (hit) {
        PR.track.pianoRoll = PR.track.pianoRoll.filter(n => n.id !== hit.note.id);
        PR.selected.delete(hit.note.id);
        if (S?.isPlaying && PR.track.editMode === 'pianoroll') buildPianoRollPart(PR.track);
        if (typeof autoSave === 'function') autoSave();
        PR.dirty = true;
    }
}

function onCanvasWheel(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        // Horizontal zoom
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
        PR.zoom = Math.max(0.25, Math.min(8, PR.zoom * factor));
    } else if (e.shiftKey) {
        // Horizontal scroll
        PR.scrollX = Math.max(0, PR.scrollX - e.deltaY / (beatW() * 2));
    } else {
        // Vertical scroll
        PR.scrollY = Math.max(0, Math.min(totalH() - visH(), PR.scrollY + e.deltaY * 0.5));
    }
    PR.dirty = true;
}

// ── Velocity lane interaction ─────────────────────────────────
let velDragNote = null;

function onVelMouseDown(e) {
    if (!PR.track) return;
    const { x, y } = canvasPos(PR.velCanvas, e);
    const beat  = xToBeat(x);
    const bw    = beatW();
    // Find note whose bar overlaps x
    let closest = null;
    let minDist = Infinity;
    PR.track.pianoRoll.forEach(n => {
        const nx = beatToX(n.start);
        const d  = Math.abs(nx - x);
        if (d < minDist && d < bw) { minDist = d; closest = n; }
    });
    velDragNote = closest;
    if (velDragNote) { updateVelFromY(y); PR.dirty = true; }
}

function onVelMouseMove(e) {
    if (!velDragNote) return;
    const { y } = canvasPos(PR.velCanvas, e);
    updateVelFromY(y);
    PR.dirty = true;
}

function onVelMouseUp() {
    if (velDragNote) {
        if (typeof autoSave === 'function') autoSave();
        velDragNote = null;
    }
}

function updateVelFromY(y) {
    if (!velDragNote) return;
    const ratio = 1 - (y / VEL_H);
    velDragNote.vel = Math.max(1, Math.min(127, Math.round(ratio * 127)));
}

// ── Global mouse up (for drag outside canvas) ─────────────────
function onWindowMouseMove(e) { /* mousemove on canvas handles it */ }
function onWindowMouseUp()    { onCanvasMouseUp(); onVelMouseUp(); }

// ── Keyboard shortcuts ────────────────────────────────────────
function onKeyDown(e) {
    if (!PR.open) return;
    if (e.key === 'Escape') { closePianoRoll(); return; }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!PR.track || !PR.selected.size) return;
        PR.track.pianoRoll = PR.track.pianoRoll.filter(n => !PR.selected.has(n.id));
        PR.selected.clear();
        rebuildAndSave();
        e.preventDefault();
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        PR.selected.clear();
        PR.track?.pianoRoll.forEach(n => PR.selected.add(n.id));
        PR.dirty = true;
        e.preventDefault();
        return;
    }

    // Transpose: ↑↓ = ±1 semitone, Ctrl+↑↓ = ±12 (octave)
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && PR.selected.size) {
        e.preventDefault();
        const delta = (e.ctrlKey || e.metaKey)
            ? (e.key === 'ArrowUp' ? 12 : -12)
            : (e.key === 'ArrowUp' ? 1  : -1);
        PR.track?.pianoRoll.forEach(n => {
            if (PR.selected.has(n.id))
                n.note = Math.max(NOTE_LO, Math.min(NOTE_HI, n.note + delta));
        });
        rebuildAndSave();
        return;
    }

    // Q = quantize
    if (e.key === 'q' || e.key === 'Q') {
        if (!e.ctrlKey && !e.metaKey) { quantizeSelected(); e.preventDefault(); }
        return;
    }

    // Ctrl+D = duplicate selected
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
    }
}

// ── Shared helper ─────────────────────────────────────────────
function rebuildAndSave() {
    if (S?.isPlaying && PR.track?.editMode === 'pianoroll') buildPianoRollPart(PR.track);
    if (typeof autoSave === 'function') autoSave();
    PR.dirty = true;
}

function selectedNotes() {
    const notes = PR.track?.pianoRoll ?? [];
    return PR.selected.size > 0 ? notes.filter(n => PR.selected.has(n.id)) : [...notes];
}

// ── Chord button factory ──────────────────────────────────────
function makeChordBtn(label, semitones, title) {
    const b = document.createElement('button');
    b.className = 'pr-tool-btn';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', () => addInterval(semitones));
    return b;
}

// ── Quantize ──────────────────────────────────────────────────
function quantizeSelected() {
    if (!PR.track) return;
    const s = PR.snap > 0 ? PR.snap : 0.25;
    selectedNotes().forEach(n => {
        n.start = Math.round(n.start / s) * s;
    });
    rebuildAndSave();
    if (typeof setStatus === 'function') setStatus('Quantize toegepast ✓', 'ok');
}

// ── Duplicate selected ────────────────────────────────────────
function duplicateSelected() {
    if (!PR.track || !PR.selected.size) return;
    const sel = PR.track.pianoRoll.filter(n => PR.selected.has(n.id));
    if (!sel.length) return;
    // Shift copies by the span of the selection
    const maxEnd = Math.max(...sel.map(n => n.start + n.dur));
    const minStart = Math.min(...sel.map(n => n.start));
    const shift = maxEnd - minStart;
    PR.selected.clear();
    const copies = sel.map(n => {
        const copy = { ...n, id: PR.nextId++, start: n.start + shift };
        PR.selected.add(copy.id);
        return copy;
    });
    PR.track.pianoRoll.push(...copies);
    rebuildAndSave();
}

// ── Add interval (chord tools) ────────────────────────────────
function addInterval(semitones) {
    if (!PR.track) return;
    const targets = selectedNotes();
    if (!targets.length) { if (typeof setStatus === 'function') setStatus('Selecteer eerst noten', 'err'); return; }
    PR.selected.clear();
    const copies = targets.map(n => {
        const copy = { ...n, id: PR.nextId++, note: Math.max(NOTE_LO, Math.min(NOTE_HI, n.note + semitones)) };
        PR.selected.add(copy.id);
        return copy;
    });
    PR.track.pianoRoll.push(...copies);
    rebuildAndSave();
}

// ── Velocity panel ────────────────────────────────────────────
function toggleVelPanel() {
    if (!PR.velPanel) return;
    PR.velVisible = !PR.velVisible;
    PR.velPanel.style.display = PR.velVisible ? 'flex' : 'none';
    document.getElementById('prVelBtn')?.classList.toggle('active', PR.velVisible);
    // Close gen panel if open
    if (PR.velVisible && PR.genVisible) {
        PR.genVisible = false;
        if (PR.genPanel) PR.genPanel.style.display = 'none';
        document.getElementById('prGenBtn')?.classList.remove('active');
    }
}

function buildVelPanel() {
    const panel = document.createElement('div');
    panel.className = 'pr-gen-panel pr-vel-panel';
    panel.id = 'prVelPanel';

    function btn(label, title, fn) {
        const b = document.createElement('button');
        b.className = 'pr-vel-btn';
        b.textContent = label;
        b.title = title;
        b.addEventListener('click', fn);
        return b;
    }

    // ── Flatten row ──
    const flatRow = document.createElement('div');
    flatRow.className = 'pr-vel-row';
    const flatLabel = document.createElement('span');
    flatLabel.className = 'pr-gen-label';
    flatLabel.textContent = 'Flatten';
    const flatInput = document.createElement('input');
    flatInput.type = 'number'; flatInput.min = 1; flatInput.max = 127; flatInput.value = 90;
    flatInput.className = 'pr-vel-num';
    flatInput.title = 'Doelvelocity (1–127)';
    const flatBtn = btn('Set', 'Zet alle (geselecteerde) noten op deze velocity', () => {
        const v = Math.max(1, Math.min(127, +flatInput.value || 90));
        selectedNotes().forEach(n => { n.vel = v; });
        rebuildAndSave();
    });
    flatRow.append(flatLabel, flatInput, flatBtn);

    // ── Curve row ──
    const curveRow = document.createElement('div');
    curveRow.className = 'pr-vel-row';
    const curveLabel = document.createElement('span');
    curveLabel.className = 'pr-gen-label';
    curveLabel.textContent = 'Curve';

    const fromInput = document.createElement('input');
    fromInput.type = 'number'; fromInput.min = 1; fromInput.max = 127; fromInput.value = 40;
    fromInput.className = 'pr-vel-num'; fromInput.title = 'Start velocity';
    const arrow = document.createElement('span');
    arrow.textContent = '→'; arrow.style.color = 'var(--text2)';
    const toInput = document.createElement('input');
    toInput.type = 'number'; toInput.min = 1; toInput.max = 127; toInput.value = 110;
    toInput.className = 'pr-vel-num'; toInput.title = 'Eind velocity';

    const crescBtn  = btn('↗ Cresc',  'Lineaire crescendo over geselecteerde noten',     () => applyVelRamp(+fromInput.value, +toInput.value));
    const decrescBtn = btn('↘ Decresc','Lineaire decrescendo over geselecteerde noten',    () => applyVelRamp(+toInput.value, +fromInput.value));
    curveRow.append(curveLabel, fromInput, arrow, toInput, crescBtn, decrescBtn);

    // ── Humanize row ──
    const humRow = document.createElement('div');
    humRow.className = 'pr-vel-row';
    const humLabel = document.createElement('span');
    humLabel.className = 'pr-gen-label';
    humLabel.textContent = 'Humanize';
    const humInput = document.createElement('input');
    humInput.type = 'number'; humInput.min = 1; humInput.max = 40; humInput.value = 15;
    humInput.className = 'pr-vel-num'; humInput.title = 'Max afwijking (±)';
    const humBtn = btn('~ Toepassen', 'Willekeurige velocity variatie toevoegen', () => {
        const range = Math.max(1, Math.min(40, +humInput.value || 15));
        selectedNotes().forEach(n => {
            n.vel = Math.max(1, Math.min(127, n.vel + Math.round((Math.random() * 2 - 1) * range)));
        });
        rebuildAndSave();
    });
    humRow.append(humLabel, humInput, humBtn);

    // ── Timing humanize ──
    const timeRow = document.createElement('div');
    timeRow.className = 'pr-vel-row';
    const timeLabel = document.createElement('span');
    timeLabel.className = 'pr-gen-label';
    timeLabel.textContent = 'Timing ±';
    const timeInput = document.createElement('input');
    timeInput.type = 'number'; timeInput.min = 0; timeInput.max = 0.1; timeInput.step = 0.005; timeInput.value = 0.02;
    timeInput.className = 'pr-vel-num'; timeInput.title = 'Max timing afwijking in beats';
    const timeBtn = btn('Humanize', 'Kleine willekeurige timing variatie (maakt het menselijker)', () => {
        const range = Math.max(0, Math.min(0.2, +timeInput.value || 0.02));
        selectedNotes().forEach(n => {
            n.start = Math.max(0, n.start + (Math.random() * 2 - 1) * range);
        });
        rebuildAndSave();
    });
    timeRow.append(timeLabel, timeInput, timeBtn);

    panel.append(flatRow, curveRow, humRow, timeRow);
    return panel;
}

function applyVelRamp(fromVel, toVel) {
    const notes = selectedNotes().slice().sort((a, b) => a.start - b.start);
    if (!notes.length) return;
    const n = notes.length;
    notes.forEach((note, i) => {
        const t = n === 1 ? 0 : i / (n - 1);
        note.vel = Math.max(1, Math.min(127, Math.round(fromVel + t * (toVel - fromVel))));
    });
    rebuildAndSave();
}

// ── Generator panel ──────────────────────────────────────────
function buildGenPanel() {
    const panel = document.createElement('div');
    panel.className = 'pr-gen-panel';
    panel.id = 'prGenPanel';

    function row(label, el) {
        const d = document.createElement('div');
        d.className = 'pr-gen-row';
        const l = document.createElement('span');
        l.className = 'pr-gen-label';
        l.textContent = label;
        d.append(l, el);
        return d;
    }
    function sel(id, opts) {
        const s = document.createElement('select');
        s.id = id; s.className = 'pr-gen-sel';
        opts.forEach(([v, t]) => {
            const o = document.createElement('option');
            o.value = v; o.textContent = t; s.appendChild(o);
        });
        return s;
    }

    const styleEl = sel('prGenStyle', [
        ['stepwise','Stepwise'],['arpeggio','Arpeggio'],['pentatonic','Pentatonic'],
        ['blues','Blues'],['triad_run','Triad Run'],['hook','Hook/Motif'],
        ['sequence','Sequence'],['call_response','Call & Response'],
    ]);
    const rhythmEl = sel('prGenRhythm', [
        ['straight','Straight'],['syncopated','Syncopated'],
        ['sparse_beat','Sparse Beat'],['offbeat','Offbeat'],['dotted','Dotted'],
    ]);
    const densityEl = sel('prGenDensity', [
        ['medium','Medium'],['sparse','Sparse'],['dense','Dense'],
    ]);
    const contourEl = sel('prGenContour', [
        ['arch','Arch'],['ascending','Ascending'],['descending','Descending'],
        ['wave','Wave'],['valley','Valley'],['flat','Flat'],['random','Random'],
    ]);
    const octaveEl = sel('prGenOctave', [
        ['mid','Mid (C3-G5)'],['low','Low (C2-G4)'],['high','High (C4-G6)'],['wide','Wide'],
    ]);
    const durEl = sel('prGenDur', [
        ['16n','16th note'],['8n','8th note'],['4n','Quarter'],['legato','Legato'],
    ]);
    const arpDirEl = sel('prGenArpDir', [
        ['up','Up'],['down','Down'],['bounce','Bounce'],['random','Random'],
    ]);
    const modeEl = sel('prGenMode', [
        ['replace','Replace'],['append','Add'],
    ]);

    panel.append(
        row('Style',   styleEl),
        row('Rhythm',  rhythmEl),
        row('Density', densityEl),
        row('Contour', contourEl),
        row('Octave',  octaveEl),
        row('Dur',     durEl),
        row('Arp dir', arpDirEl),
        row('Mode',    modeEl),
    );

    // Show/hide arp dir based on style
    const arpRow = arpDirEl.parentElement;
    styleEl.addEventListener('change', () => {
        arpRow.style.display = styleEl.value === 'arpeggio' ? '' : 'none';
    });
    arpRow.style.display = 'none';

    const genBtn = document.createElement('button');
    genBtn.className = 'pr-gen-go-btn';
    genBtn.textContent = '⚡ Genereer';
    genBtn.addEventListener('click', runGenerator);
    panel.appendChild(genBtn);

    return panel;
}

function toggleGenPanel() {
    if (!PR.genPanel) return;
    PR.genVisible = !PR.genVisible;
    PR.genPanel.style.display = PR.genVisible ? 'flex' : 'none';
    document.getElementById('prGenBtn')?.classList.toggle('active', PR.genVisible);
    // Close vel panel if open
    if (PR.genVisible && PR.velVisible) {
        PR.velVisible = false;
        if (PR.velPanel) PR.velPanel.style.display = 'none';
        document.getElementById('prVelBtn')?.classList.remove('active');
    }
}

function runGenerator() {
    const track = PR.track;
    if (!track) return;
    if (!S?.scale?.length) { if(typeof setStatus==='function') setStatus('Laad eerst een toonladder','err'); return; }

    const style    = document.getElementById('prGenStyle')?.value   ?? 'stepwise';
    const rhythm   = document.getElementById('prGenRhythm')?.value  ?? 'straight';
    const density  = document.getElementById('prGenDensity')?.value ?? 'medium';
    const contour  = document.getElementById('prGenContour')?.value ?? 'arch';
    const octave   = document.getElementById('prGenOctave')?.value  ?? 'mid';
    const durMode  = document.getElementById('prGenDur')?.value     ?? '16n';
    const arpDir   = document.getElementById('prGenArpDir')?.value  ?? 'up';
    const mode     = document.getElementById('prGenMode')?.value    ?? 'replace';

    // Octave range
    let lo, hi;
    if      (octave === 'low')  { lo = 36; hi = 55; }
    else if (octave === 'high') { lo = 60; hi = 79; }
    else if (octave === 'wide') { lo = 24; hi = 83; }
    else                        { lo = 48; hi = 67; }

    // Bias range based on track type
    if (track.type === 'bass') { lo = Math.max(24, lo - 12); hi = Math.min(55, hi - 12); }
    if (track.type === 'pad')  { lo = Math.max(36, lo);      hi = Math.min(83, hi + 6);  }

    const scale = S.scale;
    const prog  = S.progression ?? [];
    let pool = scale.filter(n => n >= lo && n <= hi).sort((a, b) => a - b);
    if (pool.length < 3) pool = scale.slice().sort((a, b) => a - b);

    // Pentatonic subset
    let pentatonicPool = pool;
    if (pool.length >= 5) {
        const idx = [0, 2, 4, 7, 9].map(d => d % pool.length);
        pentatonicPool = [...new Set(idx.map(i => pool[i]))].sort((a, b) => a - b);
    }
    // Blues
    let bluesPool = [...pentatonicPool];
    if (pool.length > 0) {
        const root = pool[0] % 12;
        pool.forEach(n => { const d = (n - root + 12) % 12; if (d === 3 || d === 6) bluesPool.push(n); });
        bluesPool.sort((a, b) => a - b);
    }

    const totalSteps = PR.bars * 16; // 16th-note steps
    const beatsTotal = PR.bars * 4;

    function chordPoolAtStep(si) {
        if (!prog.length) return pool;
        const chordIdx = Math.floor(si / (totalSteps / Math.max(1, prog.length))) % prog.length;
        const chord = prog[chordIdx] ?? [];
        const ct = [];
        chord.forEach(m => { let n = m; while (n < lo) n += 12; while (n > hi) n -= 12; if (n >= lo && n <= hi) ct.push(n); });
        return ct.length >= 2 ? ct : pool;
    }

    // Reuse buildRhythm/buildContour/buildMotif from melody.js (globally available)
    let rhythmArr, contourArr;
    if (typeof buildRhythm === 'function') {
        rhythmArr  = buildRhythm(totalSteps, density, rhythm, style);
        contourArr = buildContour(totalSteps, pool.length - 1, contour);
    } else {
        // Fallback if melody.js not loaded
        rhythmArr  = Array.from({length: totalSteps}, (_, i) => i % 4 === 0 || Math.random() < 0.3);
        contourArr = Array.from({length: totalSteps}, (_, i) => (i / totalSteps) * (pool.length - 1));
    }

    const rawNotes = Array(totalSteps).fill(null);
    let lastIdx = Math.floor(pool.length * 0.4);
    let arpPos = 0, arpInc = 1;

    if ((style === 'hook' || style === 'sequence') && typeof buildMotif === 'function') {
        const motifLen = style === 'hook' ? 4 : 8;
        const tiled = buildMotif(pool, rhythmArr, contourArr, totalSteps, chordPoolAtStep, motifLen, 'low');
        tiled.forEach((n, i) => { rawNotes[i] = n; });
    } else {
        for (let i = 0; i < totalSteps; i++) {
            if (!rhythmArr[i]) continue;
            const ct     = chordPoolAtStep(i);
            const target = Math.round(contourArr[i]);
            const clamped = Math.max(0, Math.min(pool.length - 1, target));
            const onBeat  = i % 4 === 0;
            let note;

            if (style === 'arpeggio') {
                const src = ct.length ? ct : pool;
                if (arpDir === 'up')        { note = src[arpPos % src.length]; arpPos++; }
                else if (arpDir === 'down') { arpPos = arpPos || src.length - 1; note = src[arpPos % src.length]; arpPos--; if (arpPos < 0) arpPos = src.length - 1; }
                else if (arpDir === 'bounce') { note = src[Math.abs(arpPos) % src.length]; arpPos += arpInc; if (arpPos >= src.length || arpPos < 0) { arpInc *= -1; arpPos += arpInc * 2; } }
                else note = src[Math.floor(Math.random() * src.length)];
            } else if (style === 'pentatonic') {
                const src = pentatonicPool;
                const dir = clamped > lastIdx ? 1 : clamped < lastIdx ? -1 : (Math.random() < 0.5 ? 1 : -1);
                lastIdx = Math.max(0, Math.min(src.length - 1, lastIdx + dir));
                note = src[lastIdx];
            } else if (style === 'blues') {
                if (onBeat && ct.length) { note = ct[Math.floor(Math.random() * ct.length)]; }
                else { lastIdx = Math.max(0, Math.min(bluesPool.length - 1, lastIdx + (Math.random() < 0.6 ? 1 : -1))); note = bluesPool[lastIdx]; }
            } else if (style === 'triad_run') {
                const src = ct.length >= 2 ? ct : pool;
                const dir = clamped > lastIdx ? 1 : -1;
                lastIdx = Math.max(0, Math.min(src.length - 1, lastIdx + dir));
                note = src[lastIdx];
            } else if (style === 'call_response') {
                const half = totalSteps / 2;
                if (i < half) {
                    lastIdx = Math.round((i / half) * (pool.length - 1));
                } else {
                    if (i < half * 1.5) { rawNotes[i] = null; continue; }
                    lastIdx = Math.round(((i - half * 1.5) / (half * 0.5)) * (pool.length - 1) * 0.7);
                }
                note = pool[Math.max(0, Math.min(pool.length - 1, lastIdx))];
            } else {
                // stepwise (default)
                const dir  = clamped > lastIdx ? 1 : clamped < lastIdx ? -1 : (Math.random() < 0.5 ? 1 : -1);
                const step = Math.random() < 0.7 ? 1 : 2;
                lastIdx = Math.max(0, Math.min(pool.length - 1, lastIdx + dir * step));
                note = pool[lastIdx];
                if (onBeat && ct.length) note = ct.reduce((a, b) => Math.abs(a - note) <= Math.abs(b - note) ? a : b);
            }
            rawNotes[i] = note;
        }
    }

    // Calculate note duration
    function getDur(si) {
        if (durMode === '8n')   return 0.5;
        if (durMode === '4n')   return 1.0;
        if (durMode === 'legato') {
            // Extend to next active note
            for (let j = si + 1; j < totalSteps; j++) {
                if (rhythmArr[j]) return (j - si) * 0.25;
            }
            return (totalSteps - si) * 0.25;
        }
        return 0.25; // 16n
    }

    // Convert to pianoRoll note objects
    const generated = [];
    rawNotes.forEach((note, si) => {
        if (note === null) return;
        const vel = 80 + Math.floor(Math.random() * 30) + (si % 4 === 0 ? 10 : 0);
        generated.push({
            id:    PR.nextId++,
            note:  Math.max(NOTE_LO, Math.min(NOTE_HI, note)),
            start: si * 0.25,
            dur:   Math.min(getDur(si), beatsTotal - si * 0.25),
            vel:   Math.max(40, Math.min(127, vel)),
        });
    });

    if (mode === 'replace') {
        track.pianoRoll = generated;
    } else {
        track.pianoRoll = [...track.pianoRoll, ...generated];
    }

    PR.selected.clear();
    if (S?.isPlaying && track.editMode === 'pianoroll') buildPianoRollPart(track);
    if (typeof autoSave === 'function') autoSave();
    PR.dirty = true;
    if (typeof setStatus === 'function') setStatus(`Gegenereerd: ${generated.length} noten (${style})`, 'ok');
}

})(); // end IIFE
