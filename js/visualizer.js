// ── Visualizer ──────────────────────────────────────────────

let vizOpen   = false;
let vizMode   = 'spectrum'; // 'spectrum' | 'scope'
let vizRaf    = null;
const NUM_BARS = 80;
const LOG_MIN  = Math.log10(20);
const LOG_MAX  = Math.log10(20000);
const peaks    = new Float32Array(NUM_BARS).fill(0);
const PEAK_DECAY = 0.97;

function toggleViz() {
    vizOpen = !vizOpen;
    document.getElementById('vizPanel').classList.toggle('hidden', !vizOpen);
    document.getElementById('btnViz').classList.toggle('active', vizOpen);
    if (vizOpen) { resizeVizCanvas(); startVizLoop(); }
    else stopVizLoop();
}

function resizeVizCanvas() {
    const canvas = document.getElementById('vizCanvas');
    const panel  = document.getElementById('vizPanel');
    canvas.width  = panel.clientWidth;
    canvas.height = 80;
}

// ── Drawing ──────────────────────────────────────────────────
function drawSpectrum(ctx, w, h) {
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, w, h);

    if (!vizFft) { drawIdle(ctx, w, h); return; }
    const data = vizFft.getValue();
    const sr   = Tone.context.sampleRate;
    const fftN = data.length * 2;
    const bw   = (w - NUM_BARS * 0.5) / NUM_BARS;

    for (let i = 0; i < NUM_BARS; i++) {
        const lLow  = LOG_MIN + (i / NUM_BARS) * (LOG_MAX - LOG_MIN);
        const lHigh = LOG_MIN + ((i+1) / NUM_BARS) * (LOG_MAX - LOG_MIN);
        const binLo = Math.max(0, Math.floor(Math.pow(10, lLow)  / sr * fftN));
        const binHi = Math.min(data.length-1, Math.ceil(Math.pow(10, lHigh) / sr * fftN));
        let maxDb = -Infinity;
        for (let j = binLo; j <= binHi; j++) if (data[j] > maxDb) maxDb = data[j];
        const val = Math.max(0, Math.min(1, (maxDb + 90) / 90));

        if (val > peaks[i]) peaks[i] = val;
        else peaks[i] = Math.max(0, peaks[i] * PEAK_DECAY - 0.002);

        const x  = i * (bw + 0.5);
        const bh = val * (h - 2);

        // Bar gradient
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0,    '#16a34a');
        grad.addColorStop(0.55, '#22c55e');
        grad.addColorStop(0.75, '#eab308');
        grad.addColorStop(1,    '#ef4444');
        ctx.fillStyle = grad;
        ctx.fillRect(x, h - bh, bw, bh);

        // Peak hold dot
        if (peaks[i] > 0.015) {
            ctx.fillStyle = peaks[i] > 0.85 ? '#ef4444' : 'rgba(255,255,255,0.55)';
            ctx.fillRect(x, h - peaks[i] * (h - 2) - 1, bw, 1.5);
        }
    }

    // Subtle frequency grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    [100, 1000, 10000].forEach(freq => {
        const logF = Math.log10(freq);
        const pct  = (logF - LOG_MIN) / (LOG_MAX - LOG_MIN);
        const x    = Math.round(pct * w);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    });
}

function drawScope(ctx, w, h) {
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [h*0.25, h*0.5, h*0.75].forEach(y => {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

    if (!vizWave) { drawIdle(ctx, w, h); return; }
    const data = vizWave.getValue();

    // Glow pass
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length-1)) * w;
        const y = (0.5 - data[i] * 0.45) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(91,125,245,0.18)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Main line
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length-1)) * w;
        const y = (0.5 - data[i] * 0.45) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#5b7df5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawIdle(ctx, w, h) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Speel iets om de visualizer te activeren', w/2, h/2 + 4);
}

// ── Animation loop ───────────────────────────────────────────
function startVizLoop() {
    if (vizRaf) return;
    const canvas = document.getElementById('vizCanvas');
    const ctx    = canvas.getContext('2d');
    function frame() {
        if (canvas.width !== canvas.parentElement?.clientWidth) resizeVizCanvas();
        if (vizMode === 'spectrum') drawSpectrum(ctx, canvas.width, canvas.height);
        else                        drawScope   (ctx, canvas.width, canvas.height);
        vizRaf = requestAnimationFrame(frame);
    }
    vizRaf = requestAnimationFrame(frame);
}

function stopVizLoop() {
    if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null; }
}

// ── Init ─────────────────────────────────────────────────────
function initVizUI() {
    document.getElementById('btnViz').addEventListener('click', toggleViz);
    document.getElementById('vizClose').addEventListener('click', toggleViz);

    document.getElementById('vizModeSpectrum').addEventListener('click', function() {
        vizMode = 'spectrum';
        this.classList.add('active');
        document.getElementById('vizModeScope').classList.remove('active');
    });
    document.getElementById('vizModeScope').addEventListener('click', function() {
        vizMode = 'scope';
        this.classList.add('active');
        document.getElementById('vizModeSpectrum').classList.remove('active');
    });

    window.addEventListener('resize', () => { if (vizOpen) resizeVizCanvas(); });
}
