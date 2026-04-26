;(function(){
'use strict';

// ── Automation Lanes ──────────────────────────────────────────
// Per-track, per-parameter step automation.
// Each parameter stores an array of 32 values (null = no automation).
// During playback, values are applied per step and linearly interpolated.

const AUTO_PARAMS = {
    volume: { label:'Volume',      min:-40, max:6,     unit:'dB',  default:0,     color:'#4a9eff' },
    filter: { label:'Filter',      min:200, max:20000, unit:'Hz',  default:20000, color:'#ffd93d' },
    reverb: { label:'Reverb',      min:0,   max:1,     unit:'%',   default:0,     color:'#6bcb77' },
    delay:  { label:'Delay',       min:0,   max:0.9,   unit:'%',   default:0,     color:'#ff9a3c' },
    pan:    { label:'Pan',         min:-1,  max:1,     unit:'',    default:0,     color:'#c77dff' },
    dist:   { label:'Distortion',  min:0,   max:1,     unit:'%',   default:0,     color:'#ff6b6b' },
};

// ── Ensure track has automation object ────────────────────────
function ensureAuto(track) {
    if (!track.automation) track.automation = {};
    Object.keys(AUTO_PARAMS).forEach(k => {
        if (!track.automation[k]) track.automation[k] = Array(32).fill(null);
    });
}

// ── Live playhead RAF ─────────────────────────────────────────
// Redraws all open auto canvases ~20fps so the playhead moves.
let _autoRaf = null;
const _openLanes = new Map(); // uid+param → {canvas, track, getParam}

function _startAutoRaf() {
    if (_autoRaf) return;
    function tick() {
        _openLanes.forEach(({ canvas, track, getParam }) => {
            renderAutoCanvas(canvas, track, getParam());
        });
        _autoRaf = requestAnimationFrame(tick);
    }
    _autoRaf = requestAnimationFrame(tick);
}
function _stopAutoRaf() {
    if (_autoRaf) { cancelAnimationFrame(_autoRaf); _autoRaf = null; }
    if (_openLanes.size > 0) _startAutoRaf(); // keep going if lanes still open
}

// ── Toggle AUTO lane for a track ─────────────────────────────
window.toggleAutoLane = function(track, btn) {
    ensureAuto(track);
    const laneId = `auto-lane-${track.uid}`;
    const existing = document.getElementById(laneId);
    if (existing) {
        existing.remove();
        btn.classList.remove('active');
        _openLanes.delete(track.uid);
        if (_openLanes.size === 0) _stopAutoRaf();
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

    // Draw mode selector
    const modeSel = document.createElement('select');
    modeSel.className = 'auto-mode-sel';
    [['free','✏ Vrij'], ['line','↗ Ramp'], ['hold','⊓ Hold'], ['sine','∿ Sine']].forEach(([v,l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l;
        modeSel.appendChild(o);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'auto-clear-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
        const param = paramSel.value;
        track.automation[param] = Array(32).fill(null);
        renderAutoCanvas(canvas, track, param);
        autoSave();
    });

    // Value tooltip
    const valTip = document.createElement('span');
    valTip.className = 'auto-val-tip';

    const hint = document.createElement('span');
    hint.className = 'auto-hint';
    hint.textContent = 'Sleep = tekenen · Rechts-klik = wissen';

    header.append(paramSel, modeSel, clearBtn, valTip, hint);
    lane.appendChild(header);

    // ── Canvas ───────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.className = 'auto-canvas';
    canvas.height = 64;
    lane.appendChild(canvas);

    row.after(lane);

    // Register for live RAF
    _openLanes.set(track.uid, { canvas, track, getParam: () => paramSel.value });
    _startAutoRaf();

    // Initial render
    renderAutoCanvas(canvas, track, paramSel.value);

    paramSel.addEventListener('change', () => renderAutoCanvas(canvas, track, paramSel.value));

    // ── Mouse interaction ─────────────────────────────────────
    let painting = false;
    let lineStart = null; // for 'line' mode: {stepIdx, value}

    function getPosInfo(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX ?? 0) - rect.left;
        const y = (e.clientY ?? 0) - rect.top;
        const param   = paramSel.value;
        const cfg     = AUTO_PARAMS[param];
        const steps   = SEQ.steps;
        const stepW   = canvas.width / steps;
        const stepIdx = Math.max(0, Math.min(steps - 1, Math.floor(x / stepW)));
        const ratio   = 1 - Math.max(0, Math.min(1, y / canvas.height));
        const value   = cfg.min + ratio * (cfg.max - cfg.min);
        return { stepIdx, value, param, cfg, steps, stepW };
    }

    function fmtVal(cfg, v) {
        if (cfg.unit === 'dB') return v.toFixed(1) + 'dB';
        if (cfg.unit === 'Hz') return v >= 1000 ? (v/1000).toFixed(1)+'k' : Math.round(v)+'Hz';
        if (cfg.unit === '%')  return Math.round(v * 100) + '%';
        return v.toFixed(2);
    }

    function applySine(param, cfg, centerStep, halfPeriod) {
        ensureAuto(track);
        const steps = SEQ.steps;
        const center = (cfg.min + cfg.max) / 2;
        const amp    = (cfg.max - cfg.min) / 2;
        for (let s = 0; s < steps; s++) {
            const phase = ((s - centerStep) / Math.max(1, halfPeriod)) * Math.PI;
            track.automation[param][s] = center + amp * Math.sin(phase);
        }
        renderAutoCanvas(canvas, track, param);
    }

    canvas.addEventListener('mousedown', e => {
        if (e.button === 2) return;
        painting = true;
        const info = getPosInfo(e);
        const mode = modeSel.value;

        if (mode === 'sine') {
            applySine(info.param, info.cfg, info.stepIdx, SEQ.steps / 4);
            painting = false;
            autoSave();
            return;
        }
        if (mode === 'line') {
            lineStart = { stepIdx: info.stepIdx, value: info.value };
            return;
        }
        // free / hold
        ensureAuto(track);
        track.automation[info.param][info.stepIdx] = info.value;
        valTip.textContent = fmtVal(info.cfg, info.value);
        renderAutoCanvas(canvas, track, info.param);
    });

    canvas.addEventListener('mousemove', e => {
        if (!painting) return;
        const info = getPosInfo(e);
        const mode = modeSel.value;
        ensureAuto(track);

        if (mode === 'line' && lineStart) {
            // Preview ramp
            const steps = SEQ.steps;
            const s0 = lineStart.stepIdx, s1 = info.stepIdx;
            const v0 = lineStart.value,   v1 = info.value;
            const lo = Math.min(s0, s1), hi = Math.max(s0, s1);
            for (let s = lo; s <= hi; s++) {
                const t = lo === hi ? 1 : (s - lo) / (hi - lo);
                track.automation[info.param][s] = s0 <= s1
                    ? v0 + t * (v1 - v0)
                    : v1 + t * (v0 - v1);
            }
        } else if (mode === 'hold' && lineStart) {
            const lo = Math.min(lineStart.stepIdx, info.stepIdx);
            const hi = Math.max(lineStart.stepIdx, info.stepIdx);
            for (let s = lo; s <= hi; s++) track.automation[info.param][s] = lineStart.value;
        } else {
            track.automation[info.param][info.stepIdx] = info.value;
        }

        valTip.textContent = fmtVal(info.cfg, info.value);
        renderAutoCanvas(canvas, track, info.param);
    });

    canvas.addEventListener('mouseup', e => {
        if (!painting) return;
        painting = false;
        lineStart = null;
        autoSave();
    });
    canvas.addEventListener('mouseleave', () => {
        if (painting) { painting = false; lineStart = null; autoSave(); }
        valTip.textContent = '';
    });
    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        const { stepIdx, param } = getPosInfo(e);
        track.automation[param][stepIdx] = null;
        renderAutoCanvas(canvas, track, param);
        autoSave();
    });

    // Resize canvas
    requestAnimationFrame(() => {
        const stepsEl = row.querySelector('.seq-steps');
        canvas.width = stepsEl ? stepsEl.offsetWidth : (row.offsetWidth - 160 || 600);
        renderAutoCanvas(canvas, track, paramSel.value);
    });
};

// ── Canvas rendering ──────────────────────────────────────────
function renderAutoCanvas(canvas, track, param) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cfg = AUTO_PARAMS[param];
    if (!cfg) return;
    const steps = SEQ.steps;
    const stepW = W / steps;
    ensureAuto(track);
    const data = track.automation[param];

    // Background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Default/zero line
    const defRatio = (cfg.default - cfg.min) / (cfg.max - cfg.min);
    const defY = H * (1 - defRatio);
    ctx.strokeStyle = '#252540';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(0, defY); ctx.lineTo(W, defY); ctx.stroke();
    ctx.setLineDash([]);

    // Beat grid lines
    for (let s = 0; s < steps; s += 4) {
        ctx.fillStyle = '#13132a';
        ctx.fillRect(s * stepW, 0, 1, H);
    }

    // Interpolated curve fill + line
    const setPts = data.filter(v => v !== null);
    if (setPts.length > 0) {
        const col = cfg.color;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let s = 0; s < steps; s++) {
            const val = interpolateAuto(data, s, cfg, steps);
            const x = s * stepW + stepW * 0.5;
            const y = H * (1 - (val - cfg.min) / (cfg.max - cfg.min));
            s === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = col + '1a';
        ctx.fill();

        ctx.beginPath();
        for (let s = 0; s < steps; s++) {
            const val = interpolateAuto(data, s, cfg, steps);
            const x = s * stepW + stepW * 0.5;
            const y = H * (1 - (val - cfg.min) / (cfg.max - cfg.min));
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col + 'cc';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Step bars + dots
    for (let s = 0; s < steps; s++) {
        const x  = s * stepW;
        const val = data[s];
        ctx.fillStyle = s % 4 === 0 ? '#181830' : '#111124';
        ctx.fillRect(x, 0, stepW - 1, H);

        if (val !== null) {
            const ratio = (val - cfg.min) / (cfg.max - cfg.min);
            const barH  = H * ratio;
            const y     = H - barH;
            ctx.fillStyle = cfg.color + '99';
            ctx.fillRect(x + 1, y, stepW - 3, barH);
            ctx.beginPath();
            ctx.arc(x + stepW / 2, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = cfg.color;
            ctx.fill();
        }
    }

    // Live playhead
    if (S?.isPlaying && S.currentSeqStep >= 0) {
        const px = (S.currentSeqStep + 0.5) * stepW;
        ctx.fillStyle = 'rgba(255,153,0,0.5)';
        ctx.fillRect(px - 1, 0, 2, H);
    }
}

function interpolateAuto(data, step, cfg, steps) {
    if (data[step] !== null) return data[step];
    let prevI = -1, nextI = -1;
    for (let i = step - 1; i >= 0; i--)    { if (data[i] !== null) { prevI = i; break; } }
    for (let i = step + 1; i < steps; i++) { if (data[i] !== null) { nextI = i; break; } }
    if (prevI < 0 && nextI < 0) return cfg.default;
    if (prevI < 0) return data[nextI];
    if (nextI < 0) return data[prevI];
    const t = (step - prevI) / (nextI - prevI);
    return data[prevI] + t * (data[nextI] - data[prevI]);
}

// ── Apply automation during playback (called from sequencer) ──
window.applyStepAutomation = function(track, step, time, steps, stepSec) {
    if (!track.automation || !track.fxNodes) return;
    Object.entries(AUTO_PARAMS).forEach(([param, cfg]) => {
        const data = track.automation[param];
        if (!data || !data.some(v => v !== null)) return;
        const val = interpolateAuto(data, step, cfg, steps);
        const sig = getAutoSignal(track, param);
        if (!sig) return;
        try { sig.linearRampTo(val, stepSec, time); } catch(e) {}
    });
};

function getAutoSignal(track, param) {
    if (!track.fxNodes) return null;
    switch (param) {
        case 'volume': return track.fxNodes.vol?.volume;
        case 'filter': return track.fxNodes.flt?.frequency;
        case 'reverb': return track.fxNodes.rev?.wet;
        case 'delay':  return track.fxNodes.dly?.wet;
        case 'pan':    return track.fxNodes.pan?.pan;
        case 'dist':   return null; // distortion.distortion is not a signal, apply directly
    }
    return null;
}

})();
