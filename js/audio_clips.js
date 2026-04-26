;(function(){
'use strict';

// ── Audio Clips ───────────────────────────────────────────────
// Record audio from the microphone and place it as waveform clips
// in the arrangement timeline.
//
// SEQ.audioClips: [{id, label, startBar, lenBars, buffer, color}]
// buffer = Web Audio AudioBuffer (not serialisable → IndexedDB)

window.AC = {
    recording:   false,
    mediaRec:    null,
    chunks:      [],
    recStartBar: 0,
    nextId:      1,
    selectedId:  null,
    drag:        null,  // {id, startX, origStart}
};

const AC_COLOR = '#ff6b6b';
const DB_NAME  = 'shotmusic_audioclips';

// ── IndexedDB helpers ─────────────────────────────────────────
function _openDb() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('clips', { keyPath: 'id' });
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}

async function _dbSave(id, label, startBar, lenBars, arrayBuf) {
    try {
        const db = await _openDb();
        await new Promise((res, rej) => {
            const tx = db.transaction('clips', 'readwrite');
            tx.objectStore('clips').put({ id, label, startBar, lenBars, buf: arrayBuf });
            tx.oncomplete = res;
            tx.onerror    = e => rej(e.target.error);
        });
        db.close();
    } catch(e) { console.warn('AC db save error:', e); }
}

async function _dbDeleteById(id) {
    try {
        const db = await _openDb();
        await new Promise((res, rej) => {
            const tx = db.transaction('clips', 'readwrite');
            tx.objectStore('clips').delete(id);
            tx.oncomplete = res;
            tx.onerror    = e => rej(e.target.error);
        });
        db.close();
    } catch(e) {}
}

async function _dbLoadAll() {
    try {
        const db = await _openDb();
        const all = await new Promise((res, rej) => {
            const tx  = db.transaction('clips', 'readonly');
            const req = tx.objectStore('clips').getAll();
            req.onsuccess = e => res(e.target.result);
            req.onerror   = e => rej(e.target.error);
        });
        db.close();
        return all;
    } catch(e) { return []; }
}

// ── Restore clips from IndexedDB after audio starts ───────────
window.restoreAudioClips = async function() {
    const saved = await _dbLoadAll();
    if (!saved.length) return;
    SEQ.audioClips = SEQ.audioClips || [];
    const rawCtx = Tone.getContext().rawContext;
    for (const row of saved) {
        if (SEQ.audioClips.find(c => c.id === row.id)) continue;
        try {
            const buf = await rawCtx.decodeAudioData(row.buf.slice(0));
            SEQ.audioClips.push({
                id: row.id, label: row.label,
                startBar: row.startBar, lenBars: row.lenBars,
                buffer: buf, color: AC_COLOR,
            });
            if (AC.nextId <= row.id) AC.nextId = row.id + 1;
        } catch(e) { console.warn('AC restore error', e); }
    }
    if (typeof renderArrangement === 'function') renderArrangement();
};

// ── Toggle recording ──────────────────────────────────────────
window.toggleAudioRecord = async function(btn) {
    if (AC.recording) {
        AC.mediaRec?.stop();
        return;
    }

    // Ensure audio context is running
    if (typeof startAudio === 'function') await startAudio();

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch(e) {
        if (typeof setStatus === 'function') setStatus('Geen microfoon toegang', 'err');
        return;
    }

    AC.chunks      = [];
    AC.recStartBar = Math.max(0, Math.floor(SEQ.songPos || 0));
    AC.recording   = true;
    btn.classList.add('active');
    if (typeof setStatus === 'function') setStatus('● Audio opname…');

    // Pick best mime type
    const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    AC.mediaRec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});

    AC.mediaRec.ondataavailable = e => { if (e.data?.size > 0) AC.chunks.push(e.data); };
    AC.mediaRec.onstop = async () => {
        AC.recording = false;
        btn.classList.remove('active');
        stream.getTracks().forEach(t => t.stop());

        const blob    = new Blob(AC.chunks, { type: AC.mediaRec.mimeType || 'audio/webm' });
        const rawBuf  = await blob.arrayBuffer();
        const rawCtx  = Tone.getContext().rawContext;
        let decoded;
        try {
            decoded = await rawCtx.decodeAudioData(rawBuf.slice(0));
        } catch(e) {
            if (typeof setStatus === 'function') setStatus('Decoderen mislukt', 'err');
            return;
        }

        const bpm       = Tone.getTransport().bpm.value || 120;
        const secPerBar = (4 * 60) / bpm;
        const lenBars   = Math.max(1, Math.round(decoded.duration / secPerBar));
        const id        = AC.nextId++;
        const label     = `Clip ${id}`;

        SEQ.audioClips = SEQ.audioClips || [];
        SEQ.audioClips.push({ id, label, startBar: AC.recStartBar, lenBars, buffer: decoded, color: AC_COLOR });

        await _dbSave(id, label, AC.recStartBar, lenBars, rawBuf);
        if (typeof setStatus === 'function') setStatus(`Audio clip "${label}" opgeslagen`);
        if (typeof renderArrangement === 'function') renderArrangement();
    };

    AC.mediaRec.start(100); // collect every 100 ms
};

// ── Update clip position in DB after drag ─────────────────────
window.saveAudioClipPos = async function(clip) {
    // We don't have the original arrayBuffer anymore after decode, so we just
    // update startBar in the DB record by reading + rewriting it.
    try {
        const db = await _openDb();
        const row = await new Promise((res, rej) => {
            const req = db.transaction('clips','readonly').objectStore('clips').get(clip.id);
            req.onsuccess = e => res(e.target.result);
            req.onerror   = e => rej(e.target.error);
        });
        if (row) {
            row.startBar = clip.startBar;
            await new Promise((res, rej) => {
                const tx = db.transaction('clips','readwrite');
                tx.objectStore('clips').put(row);
                tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
            });
        }
        db.close();
    } catch(e) {}
};

// ── Delete a clip ─────────────────────────────────────────────
window.removeAudioClip = async function(id) {
    SEQ.audioClips = (SEQ.audioClips || []).filter(c => c.id !== id);
    if (AC.selectedId === id) AC.selectedId = null;
    await _dbDeleteById(id);
    if (typeof renderArrangement === 'function') renderArrangement();
};

// ── Playback scheduling ───────────────────────────────────────
// Called from sequencer when bar advances in song mode.
// time = AudioContext time of the bar start.
window.scheduleAudioClips = function(bar, audioTime) {
    if (!SEQ.audioClips?.length) return;
    const bpm       = Tone.getTransport().bpm.value || 120;
    const secPerBar = (4 * 60) / bpm;

    SEQ.audioClips.forEach(clip => {
        if (bar < clip.startBar || bar >= clip.startBar + clip.lenBars) return;
        if (clip._playing) return; // already scheduled this play

        const offsetInClip = (bar - clip.startBar) * secPerBar;
        const node = Tone.getContext().rawContext.createBufferSource();
        node.buffer = clip.buffer;
        node.connect(Tone.getContext().rawContext.destination);
        node.start(audioTime, offsetInClip);
        node.onended = () => {
            clip._playing = false;
            clip._node    = null;
        };
        clip._playing = true;
        clip._node    = node;
    });
};

// Stop all playing audio clips (called on sequencer stop)
window.stopAllAudioClips = function() {
    (SEQ.audioClips || []).forEach(clip => {
        if (clip._node) {
            try { clip._node.stop(); } catch(e) {}
            clip._node    = null;
            clip._playing = false;
        }
    });
};

// ── Waveform rendering (called from arrangement.js) ───────────
window.renderAudioClipsRow = function(ctx2d, W, yOffset, rowH, scrollX, zoom) {
    // Row label background
    // (label is drawn in the sidebar — here we just draw clips on the canvas)
    (SEQ.audioClips || []).forEach(clip => {
        const x = clip.startBar * zoom - scrollX;
        const w = clip.lenBars  * zoom;
        if (x + w < 0 || x > W) return;

        const cy  = yOffset + 3;
        const ch2 = rowH - 6;
        const col = clip.color || AC_COLOR;
        const sel = clip.id === AC.selectedId;

        ctx2d.shadowColor = col + '55';
        ctx2d.shadowBlur  = sel ? 8 : 0;
        ctx2d.fillStyle   = sel ? col + 'dd' : col + '88';
        _roundRect(ctx2d, x + 1, cy, Math.max(4, w - 2), ch2, 5);
        ctx2d.fill();
        ctx2d.shadowBlur = 0;

        ctx2d.strokeStyle = sel ? '#fff' : col + 'cc';
        ctx2d.lineWidth   = sel ? 1.5 : 1;
        _roundRect(ctx2d, x + 1, cy, Math.max(4, w - 2), ch2, 5);
        ctx2d.stroke();

        // Waveform thumbnail
        if (clip.buffer && w > 14) {
            const data = clip.buffer.getChannelData(0);
            const mid  = cy + ch2 / 2;
            const iW   = Math.floor(w - 4);
            const spp   = data.length / iW;
            ctx2d.beginPath();
            for (let px = 0; px < iW; px++) {
                let peak = 0;
                const base = Math.floor(px * spp);
                const end  = Math.floor((px + 1) * spp);
                for (let s = base; s < end && s < data.length; s++) {
                    const a = Math.abs(data[s]);
                    if (a > peak) peak = a;
                }
                const amp = peak * (ch2 / 2 - 3);
                if (px === 0) ctx2d.moveTo(x + 2 + px, mid - amp);
                else          ctx2d.lineTo(x + 2 + px, mid - amp);
            }
            for (let px = iW - 1; px >= 0; px--) {
                let peak = 0;
                const base = Math.floor(px * spp);
                const end  = Math.floor((px + 1) * spp);
                for (let s = base; s < end && s < data.length; s++) {
                    const a = Math.abs(data[s]);
                    if (a > peak) peak = a;
                }
                const amp = peak * (ch2 / 2 - 3);
                ctx2d.lineTo(x + 2 + px, mid + amp);
            }
            ctx2d.closePath();
            ctx2d.fillStyle = 'rgba(255,255,255,0.18)';
            ctx2d.fill();
        }

        // Label
        if (w > 30) {
            ctx2d.font      = '8px monospace';
            ctx2d.textAlign = 'left';
            ctx2d.fillStyle = 'rgba(255,255,255,0.75)';
            ctx2d.fillText(clip.label, x + 5, cy + 11);
        }
    });
};

function _roundRect(ctx2d, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.lineTo(x + w - r, y); ctx2d.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx2d.lineTo(x + w, y + h - r); ctx2d.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx2d.lineTo(x + r, y + h); ctx2d.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx2d.lineTo(x, y + r); ctx2d.quadraticCurveTo(x, y, x + r, y);
    ctx2d.closePath();
}

})();
