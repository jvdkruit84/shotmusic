;(function(){
'use strict';

// ── Automation Lanes ──────────────────────────────────────────
// Per-track, per-parameter step automation.
// Each parameter stores an array of 32 values (null = no automation).
// During playback, values are applied per step and linearly interpolated.

const AUTO_PARAMS = {
    volume: { label:'Vol',  min:-40, max:6,     unit:'dB',  default:0,     color:'#4a9eff' },
    filter: { label:'Flt',  min:200, max:20000, unit:'Hz',  default:20000, color:'#ffd93d' },
    reverb: { label:'Rev',  min:0,   max:1,     unit:'',    default:0,     color:'#6bcb77' },
    pan:    { label:'Pan',  min:-1,  max:1,     unit:'',    default:0,     color:'#c77dff' },
};

// ── Ensure track has automation object ────────────────────────
function ensureAuto(track) {
    if (!track.automation) {
        track.automation = {
            volume: Array(32).fill(null),
            filter: Array(32).fill(null),
            reverb: Array(32).fill(null),
            pan:    Array(32).fill(null),
        };
    }
}

// ── Toggle AUTO lane for a track ─────────────────────────────
window.toggleAutoLane = function(track, btn) {
    ensureAuto(track);
    const laneId = `auto-lane-${track.uid}`;
    const existing = document.getElementById(laneId);
    if (existing) {
        existing.remove();
        btn.classList.remove('active');
        return;
    }
    btn.classList.add('active');

    const row = document.querySelector(`.seq-track[data-uid="${track.uid}"]`);
    if (!row) return;

    const lane = document.createElement('div');
    lane.className = 'auto-lane';
    lane.id = laneId;

    // ── Lane header ───────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'auto-lane-header';

    const paramSel = document.createElement('select');
    paramSel.className = 'auto-param-sel';
    Object.entries(AUTO_PARAMS).forEach(([k, p]) => {
        const o = document.createElement('option');
        o.value = k; o.textContent = p.label;
        paramSel.appendChild(o);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'auto-clear-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
        const param = paramSel.value;
        track.automation[param] = Array(32).fill(null);
        renderAutoCanvas(canvas, track, paramSel.value);
        autoSave();
    });

    const hint = document.createElement('span');
    hint.className = 'auto-hint';
    hint.textContent = 'Klik/sleep = waarde · Rechts-klik = wis stap';

    header.append(paramSel, clearBtn, hint);
    lane.appendChild(header);

    // ── Canvas ───────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.className = 'auto-canvas';
    canvas.height = 48;
    lane.appendChild(canvas);

    row.after(lane);

    // Initial render
    renderAutoCanvas(canvas, track, paramSel.value);

    // Param switch
    paramSel.addEventListener('change', () => {
        renderAutoCanvas(canvas, track, paramSel.value);
    });

    // ── Mouse interaction ─────────────────────────────────────
    let painting = false;

    function getStepValue(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left;
        const y = (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - rect.top;
        const param  = paramSel.value;
        const cfg    = AUTO_PARAMS[param];
        const steps  = SEQ.steps;
        const stepW  = canvas.width / steps;
        const stepIdx = Math.max(0, Math.min(steps - 1, Math.floor(x / stepW)));
        // Y: top = max, bottom = min
        const ratio  = 1 - Math.max(0, Math.min(1, y / canvas.height));
        const value  = cfg.min + ratio * (cfg.max - cfg.min);
        return { stepIdx, value, param };
    }

    canvas.addEventListener('mousedown', e => {
        if (e.button === 2) return; // handled by contextmenu
        painting = true;
        const { stepIdx, value, param } = getStepValue(e);
        ensureAuto(track);
        track.automation[param][stepIdx] = value;
        renderAutoCanvas(canvas, track, param);
    });
    canvas.addEventListener('mousemove', e => {
        if (!painting) return;
        const { stepIdx, value, param } = getStepValue(e);
        ensureAuto(track);
        track.automation[param][stepIdx] = value;
        renderAutoCanvas(canvas, track, param);
    });
    canvas.addEventListener('mouseup', () => { painting = false; autoSave(); });
    canvas.addEventListener('mouseleave', () => { if (painting) { painting = false; autoSave(); } });
    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        const { stepIdx, param } = getStepValue(e);
        track.automation[param][stepIdx] = null;
        renderAutoCanvas(canvas, track, param);
        autoSave();
    });

    // Resize canvas to match track width
    requestAnimationFrame(() => {
        const stepsEl = row.querySelector('.seq-steps');
        if (stepsEl) canvas.width = stepsEl.offsetWidth || 600;
        else canvas.width = row.offsetWidth - 160 || 600;
        renderAutoCanvas(canvas, track, paramSel.value);
    });
};

// ── Canvas rendering ──────────────────────────────────────────
function renderAutoCanvas(canvas, track, param) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cfg = AUTO_PARAMS[param];
    const steps = SEQ.steps;
    const stepW = W / steps;
    ensureAuto(track);
    const data = track.automation[param];

    // Background
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, W, H);

    // Zero line (or default value line)
    const defRatio = (cfg.default - cfg.min) / (cfg.max - cfg.min);
    const defY = H * (1 - defRatio);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, defY); ctx.lineTo(W, defY); ctx.stroke();
    ctx.setLineDash([]);

    // Build interpolated line across all steps
    const col = cfg.color;

    // Collect all set points for interpolation
    const setPts = data.map((v, i) => v !== null ? { i, v } : null).filter(Boolean);

    if (setPts.length > 0) {
        // Draw filled area under the interpolated curve
        ctx.beginPath();
        ctx.moveTo(0, H);
        let prevPt = null;
        for (let s = 0; s < steps; s++) {
            const val = interpolateAuto(data, s, cfg, steps);
            const x = s * stepW + stepW * 0.5;
            const ratio = (val - cfg.min) / (cfg.max - cfg.min);
            const y = H * (1 - ratio);
            if (s === 0) ctx.lineTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = col + '22';
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let s = 0; s < steps; s++) {
            const val = interpolateAuto(data, s, cfg, steps);
            const x = s * stepW + stepW * 0.5;
            const ratio = (val - cfg.min) / (cfg.max - cfg.min);
            const y = H * (1 - ratio);
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col + 'bb';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Step bars + dots
    for (let s = 0; s < steps; s++) {
        const x = s * stepW;
        const val = data[s];

        // Grid line
        ctx.fillStyle = s % 4 === 0 ? '#1e1e36' : '#161626';
        ctx.fillRect(x, 0, stepW - 1, H);

        if (val !== null) {
            const ratio = (val - cfg.min) / (cfg.max - cfg.min);
            const barH = H * ratio;
            const y = H - barH;

            // Bar
            ctx.fillStyle = col + 'aa';
            ctx.fillRect(x + 1, y, stepW - 3, barH);

            // Dot on top
            ctx.beginPath();
            ctx.arc(x + stepW / 2, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
        }
    }

    // Playhead if playing
    if (S.isPlaying && typeof S.currentSeqStep !== 'undefined' && S.currentSeqStep >= 0) {
        const px = (S.currentSeqStep + 0.5) * stepW;
        ctx.fillStyle = '#ff990066';
        ctx.fillRect(px - 1, 0, 2, H);
    }
}

function interpolateAuto(data, step, cfg, steps) {
    if (data[step] !== null) return data[step];
    // Find prev and next set points
    let prevI = -1, nextI = -1;
    for (let i = step - 1; i >= 0; i--) { if (data[i] !== null) { prevI = i; break; } }
    for (let i = step + 1; i < steps; i++) { if (data[i] !== null) { nextI = i; break; } }
    if (prevI < 0 && nextI < 0) return cfg.default;
    if (prevI < 0) return data[nextI];
    if (nextI < 0) return data[prevI];
    const t = (step - prevI) / (nextI - prevI);
    return data[prevI] + t * (data[nextI] - data[prevI]);
}

// ── Apply automation during playback (called from sequencer) ──
window.applyStepAutomation = function(track, step, time, steps) {
    if (!track.automation || !track.fxNodes) return;
    const stepSec = Tone.Time('16n').toSeconds();

    Object.entries(AUTO_PARAMS).forEach(([param, cfg]) => {
        const data = track.automation[param];
        if (!data || !data.some(v => v !== null)) return;

        const val = interpolateAuto(data, step, cfg, steps);
        const sig = getAutoSignal(track, param);
        if (!sig) return;

        // Ramp to value over the next step
        try { sig.linearRampTo(val, stepSec, time); } catch(e) {}
    });
};

function getAutoSignal(track, param) {
    if (!track.fxNodes) return null;
    switch (param) {
        case 'volume': return track.fxNodes.vol?.volume;
        case 'filter': return track.fxNodes.flt?.frequency;
        case 'reverb': return track.fxNodes.rev?.wet;
        case 'pan':    return track.fxNodes.pan?.pan;
    }
    return null;
}

// ── Refresh all open auto lanes (for step highlight) ─────────
window.refreshAutoLanes = function() {
    document.querySelectorAll('.auto-canvas').forEach(canvas => {
        const laneEl = canvas.closest('.auto-lane');
        if (!laneEl) return;
        const uid = +laneEl.id.replace('auto-lane-', '');
        const track = SEQ.tracks.find(t => t.uid === uid);
        const param = laneEl.querySelector('.auto-param-sel')?.value;
        if (track && param) renderAutoCanvas(canvas, track, param);
    });
};

})();
