;(function(){
'use strict';

// ── Arrangement Timeline ──────────────────────────────────────
// SEQ.arrangement: [{id, pattern, startBar, lenBars}]
// SEQ.arrangementBars: total timeline length in bars

const ARR = window.ARR = {
    zoom:       60,    // px per bar
    scrollX:    0,
    activePat:  'A',   // pattern to place on click/draw
    selectedId: null,
    drag:       null,  // {type:'move'|'resize'|'draw', id, startX, origStart, origLen}
    nextId:     1,
};

const PAT_COLORS = {
    A:'#4a9eff', B:'#ff6b6b', C:'#ffd93d', D:'#6bcb77',
    E:'#c77dff', F:'#ff9f1c', G:'#00b4d8', H:'#f72585',
};

const RULER_H  = 22;
const CLIP_H   = 48;
const AUDIO_H  = 44;
const RESIZE_W = 10;

// ── Open / close ──────────────────────────────────────────────
function openArrangement() {
    const panel = document.getElementById('arrangementPanel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    document.getElementById('btnArrangement')?.classList.toggle('active', open);
    if (open) { initCanvas(); renderArrangement(); }
}
window.openArrangement = openArrangement;

// ── Canvas ────────────────────────────────────────────────────
let canvas, ctx, wrap;
let eventsAttached = false;

function initCanvas() {
    canvas = document.getElementById('arrCanvas');
    ctx    = canvas?.getContext('2d');
    wrap   = document.getElementById('arrCanvasWrap');
    if (!canvas || !ctx) return;
    resizeCanvas();
    buildPatLabels();
    if (!eventsAttached) { attachEvents(); eventsAttached = true; }
}

function resizeCanvas() {
    if (!canvas || !wrap) return;
    const bars = SEQ.arrangementBars || 32;
    const minW  = wrap.clientWidth || 600;
    canvas.width  = Math.max(minW, bars * ARR.zoom + 60);
    canvas.height = RULER_H + CLIP_H + AUDIO_H + 4;
}

// ── Pattern label buttons ─────────────────────────────────────
function buildPatLabels() {
    const el = document.getElementById('arrPatLabels');
    if (!el) return;
    el.innerHTML = '';
    ['A','B','C','D','E','F','G','H'].forEach(n => {
        const b = document.createElement('button');
        b.className = 'arr-pat-btn' + (n === ARR.activePat ? ' active' : '');
        b.textContent = n;
        b.style.setProperty('--c', PAT_COLORS[n]);
        b.dataset.pat = n;
        b.title = `Patroon ${n} — klik om te activeren, daarna op tijdlijn klikken`;
        b.addEventListener('click', () => {
            ARR.activePat = n;
            el.querySelectorAll('.arr-pat-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        });
        el.appendChild(b);
    });
    const clr = document.createElement('button');
    clr.className = 'arr-pat-btn arr-clear-btn';
    clr.textContent = '✕';
    clr.title = 'Verwijder alle clips';
    clr.addEventListener('click', () => {
        if (!confirm('Alle arrangement-clips verwijderen?')) return;
        SEQ.arrangement = [];
        ARR.selectedId = null;
        renderArrangement(); autoSave();
    });
    el.appendChild(clr);
}

// ── Render ────────────────────────────────────────────────────
function renderArrangement() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    const W = canvas.width, H = canvas.height;
    const bars = SEQ.arrangementBars || 32;

    // Background
    ctx.fillStyle = '#131320';
    ctx.fillRect(0, 0, W, H);

    // Vertical grid lines
    for (let b = 0; b <= bars; b++) {
        const x = b * ARR.zoom - ARR.scrollX;
        if (x < -2 || x > W + 2) continue;
        const major = b % 4 === 0;
        ctx.strokeStyle = major ? '#2a2a4a' : '#1c1c30';
        ctx.lineWidth = major ? 1.5 : 0.5;
        ctx.beginPath(); ctx.moveTo(x, RULER_H); ctx.lineTo(x, H); ctx.stroke();
    }

    // Ruler background
    ctx.fillStyle = '#0c0c1a';
    ctx.fillRect(0, 0, W, RULER_H);

    // Ruler lines + bar numbers
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4455aa';
    for (let b = 0; b <= bars; b++) {
        const x = b * ARR.zoom - ARR.scrollX;
        if (x < -30 || x > W + 30) continue;
        // tick
        const major = b % 4 === 0;
        ctx.strokeStyle = major ? '#334466' : '#223';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, RULER_H - (major ? 8 : 4)); ctx.lineTo(x, RULER_H); ctx.stroke();
        // label — show every bar if zoom > 40, else every 2, else every 4
        const step = ARR.zoom > 40 ? 1 : ARR.zoom > 20 ? 2 : 4;
        if (b % step === 0 && b > 0) {
            ctx.font = major ? 'bold 9px monospace' : '8px monospace';
            ctx.fillStyle = major ? '#6677cc' : '#445';
            ctx.fillText(b + 1, x, RULER_H - 10);
        }
    }

    // Clips
    (SEQ.arrangement || []).forEach(clip => {
        const x = clip.startBar * ARR.zoom - ARR.scrollX;
        const w = clip.lenBars * ARR.zoom;
        const y = RULER_H + 3;
        const h = CLIP_H - 6;
        if (x + w < 0 || x > W) return; // off-screen
        const col = PAT_COLORS[clip.pattern] || '#4a9eff';
        const sel = clip.id === ARR.selectedId;

        // Shadow
        ctx.shadowColor = col + '55';
        ctx.shadowBlur = sel ? 8 : 0;

        // Body
        ctx.fillStyle = sel ? col + 'ee' : col + '99';
        roundRect(ctx, x + 1, y, w - 2, h, 5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = sel ? '#fff' : col + 'cc';
        ctx.lineWidth = sel ? 1.5 : 1;
        roundRect(ctx, x + 1, y, w - 2, h, 5);
        ctx.stroke();

        // Pattern letter
        ctx.font = w > 30 ? 'bold 20px monospace' : 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = sel ? '#000' : '#000c';
        ctx.fillText(clip.pattern, Math.max(x + w / 2, x + 12), y + h / 2 + 7);

        // Resize grip (right edge)
        if (w > 20) {
            ctx.fillStyle = '#ffffff22';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + w - RESIZE_W + 1 + i * 2, y + 4, 1, h - 8);
            }
        }
    });

    // Row separator between pattern clips and audio clips
    const sepY = RULER_H + CLIP_H;
    ctx.strokeStyle = '#1e1e36';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, sepY); ctx.lineTo(W, sepY); ctx.stroke();

    // Audio row label strip
    ctx.fillStyle = '#0c0c18';
    ctx.fillRect(0, sepY, W, AUDIO_H);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#ff6b6b88';
    ctx.textAlign = 'left';
    ctx.fillText('AUDIO', 4, sepY + 14);

    // Audio clips
    if (typeof renderAudioClipsRow === 'function') {
        renderAudioClipsRow(ctx, W, sepY, AUDIO_H, ARR.scrollX, ARR.zoom);
    }

    // Playhead
    const barPos = S.isPlaying && SEQ.songMode ? (SEQ.songPos || 0) : -1;
    if (barPos >= 0) {
        const px = barPos * ARR.zoom - ARR.scrollX;
        if (px >= 0 && px <= W) {
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(px - 6, 0); ctx.lineTo(px + 6, 0); ctx.lineTo(px, 9);
            ctx.closePath(); ctx.fill();
        }
    }
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Hit testing ───────────────────────────────────────────────
function hitTest(ex, ey) {
    if (ey < RULER_H) return null;
    // Audio row
    if (ey >= RULER_H + CLIP_H) {
        for (let i = (SEQ.audioClips || []).length - 1; i >= 0; i--) {
            const clip = SEQ.audioClips[i];
            const x = clip.startBar * ARR.zoom - ARR.scrollX;
            const w = clip.lenBars  * ARR.zoom;
            if (ex >= x && ex <= x + w) return { clip, isAudio: true, isResize: false };
        }
        return null;
    }
    if (!SEQ.arrangement) return null;
    for (let i = SEQ.arrangement.length - 1; i >= 0; i--) {
        const clip = SEQ.arrangement[i];
        const x = clip.startBar * ARR.zoom - ARR.scrollX;
        const w = clip.lenBars * ARR.zoom;
        if (ex >= x && ex <= x + w) {
            return { clip, isResize: w > 20 && ex >= x + w - RESIZE_W };
        }
    }
    return null;
}

function canvasBar(ex) {
    return Math.max(0, Math.floor((ex + ARR.scrollX) / ARR.zoom));
}

// ── Mouse events ──────────────────────────────────────────────
function attachEvents() {
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    canvas.addEventListener('contextmenu', onRightClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
}

function onDown(e) {
    const hit = hitTest(e.offsetX, e.offsetY);
    if (e.offsetY < RULER_H) return; // click on ruler — ignore

    if (hit?.isAudio) {
        // Audio clip: select + drag to move
        AC.selectedId = hit.clip.id;
        ARR.drag = {
            type: 'audio-move', id: hit.clip.id,
            startX: e.offsetX, origStart: hit.clip.startBar,
        };
        renderArrangement();
        return;
    }

    if (hit) {
        ARR.selectedId = hit.clip.id;
        ARR.drag = {
            type:      hit.isResize ? 'resize' : 'move',
            id:        hit.clip.id,
            startX:    e.offsetX,
            origStart: hit.clip.startBar,
            origLen:   hit.clip.lenBars,
        };
    } else if (e.offsetY < RULER_H + CLIP_H) {
        // Create new pattern clip only in the pattern row
        const bar = canvasBar(e.offsetX);
        const maxBars = SEQ.arrangementBars || 32;
        if (bar < maxBars) {
            const clip = { id: ARR.nextId++, pattern: ARR.activePat, startBar: bar, lenBars: 1 };
            SEQ.arrangement = SEQ.arrangement || [];
            SEQ.arrangement.push(clip);
            ARR.selectedId = clip.id;
            ARR.drag = { type: 'resize', id: clip.id, startX: e.offsetX, origStart: bar, origLen: 1 };
        }
    }
    renderArrangement();
}

function onMove(e) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;

    if (!ARR.drag) {
        const hit = hitTest(ex, ey);
        canvas.style.cursor = ey < RULER_H ? 'default'
            : hit ? (hit.isResize ? 'ew-resize' : 'grab')
            : ey >= RULER_H + CLIP_H ? 'default' : 'crosshair';
        return;
    }

    const dxPx  = e.clientX - canvas.getBoundingClientRect().left - ARR.drag.startX;
    const dBars = Math.round(dxPx / ARR.zoom);

    if (ARR.drag.type === 'audio-move') {
        const clip = (SEQ.audioClips || []).find(c => c.id === ARR.drag.id);
        if (clip) clip.startBar = Math.max(0, ARR.drag.origStart + dBars);
        renderArrangement();
        return;
    }

    const clip  = SEQ.arrangement?.find(c => c.id === ARR.drag.id);
    if (!clip) return;

    if (ARR.drag.type === 'move') {
        clip.startBar = Math.max(0, Math.min((SEQ.arrangementBars || 32) - clip.lenBars, ARR.drag.origStart + dBars));
    } else {
        clip.lenBars = Math.max(1, ARR.drag.origLen + dBars);
    }
    renderArrangement();
}

function onUp() {
    if (ARR.drag) {
        if (ARR.drag.type === 'audio-move') {
            // Update DB with new position
            const clip = (SEQ.audioClips || []).find(c => c.id === ARR.drag.id);
            if (clip && typeof saveAudioClipPos === 'function') saveAudioClipPos(clip);
        } else {
            SEQ.arrangement?.sort((a, b) => a.startBar - b.startBar);
        }
        autoSave();
    }
    ARR.drag = null;
    if (canvas) canvas.style.cursor = 'crosshair';
    renderArrangement();
}

function onRightClick(e) {
    e.preventDefault();
    const hit = hitTest(e.offsetX, e.offsetY);
    if (!hit) return;
    if (hit.isAudio) {
        if (typeof removeAudioClip === 'function') removeAudioClip(hit.clip.id);
    } else {
        SEQ.arrangement = SEQ.arrangement.filter(c => c.id !== hit.clip.id);
        if (ARR.selectedId === hit.clip.id) ARR.selectedId = null;
        renderArrangement(); autoSave();
    }
}

function onWheel(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 0.8 : 1.25;
        ARR.zoom = Math.max(15, Math.min(200, ARR.zoom * factor));
    } else {
        ARR.scrollX = Math.max(0, ARR.scrollX + e.deltaY * 0.5 + e.deltaX * 0.5);
    }
    renderArrangement();
}

// ── Playhead refresh (called from sequencer) ──────────────────
window.refreshArrangementPlayhead = function() {
    if (document.getElementById('arrangementPanel')?.classList.contains('open')) {
        renderArrangement();
        // Auto-scroll to follow playhead
        const px = (SEQ.songPos || 0) * ARR.zoom;
        const visW = wrap?.clientWidth || 600;
        if (px - ARR.scrollX > visW * 0.75) ARR.scrollX = px - visW * 0.4;
        if (px - ARR.scrollX < 0)           ARR.scrollX = Math.max(0, px - 40);
    }
};

// ── Init listeners after DOM ready ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnArrangement')?.addEventListener('click', openArrangement);
    document.getElementById('btnArrRec')?.addEventListener('click', function() {
        if (typeof toggleAudioRecord === 'function') toggleAudioRecord(this);
    });

    document.getElementById('arrBarsSelect')?.addEventListener('change', function() {
        SEQ.arrangementBars = +this.value;
        renderArrangement(); autoSave();
    });
    document.getElementById('btnArrZoomOut')?.addEventListener('click', () => {
        ARR.zoom = Math.max(15, Math.round(ARR.zoom * 0.75));
        renderArrangement();
    });
    document.getElementById('btnArrZoomIn')?.addEventListener('click', () => {
        ARR.zoom = Math.min(200, Math.round(ARR.zoom * 1.33));
        renderArrangement();
    });
});

})();
