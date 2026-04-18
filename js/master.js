// ── Master Bus UI ───────────────────────────────────────────

let masterRaf = null;

function applyCompSettings() {
    if (!masterComp) return;
    if (MASTER.compEnabled) {
        masterComp.threshold.value = MASTER.threshold;
        masterComp.ratio.value     = MASTER.ratio;
        masterComp.attack.value    = MASTER.attack;
        masterComp.release.value   = MASTER.release;
    } else {
        masterComp.threshold.value = 0;
        masterComp.ratio.value     = 1;
    }
}

function initMasterUI() {
    // Compressor toggle
    document.getElementById('compToggle').addEventListener('click', function () {
        MASTER.compEnabled = !MASTER.compEnabled;
        this.classList.toggle('active', MASTER.compEnabled);
        document.getElementById('compControls').classList.toggle('disabled', !MASTER.compEnabled);
        applyCompSettings();
        autoSave();
    });

    // Compressor sliders
    document.getElementById('compThreshold').addEventListener('input', function () {
        MASTER.threshold = +this.value;
        document.getElementById('compThresholdVal').textContent = this.value + 'dB';
        if (MASTER.compEnabled && masterComp) masterComp.threshold.value = MASTER.threshold;
        autoSave();
    });
    document.getElementById('compRatio').addEventListener('input', function () {
        MASTER.ratio = +this.value;
        document.getElementById('compRatioVal').textContent = this.value + ':1';
        if (MASTER.compEnabled && masterComp) masterComp.ratio.value = MASTER.ratio;
        autoSave();
    });
    document.getElementById('compAttack').addEventListener('input', function () {
        MASTER.attack = +this.value;
        document.getElementById('compAttackVal').textContent = Math.round(this.value * 1000) + 'ms';
        if (MASTER.compEnabled && masterComp) masterComp.attack.value = MASTER.attack;
        autoSave();
    });
    document.getElementById('compRelease').addEventListener('input', function () {
        MASTER.release = +this.value;
        document.getElementById('compReleaseVal').textContent = Math.round(this.value * 1000) + 'ms';
        if (MASTER.compEnabled && masterComp) masterComp.release.value = MASTER.release;
        autoSave();
    });

    // Limiter
    document.getElementById('limThreshold').addEventListener('input', function () {
        MASTER.limThreshold = +this.value;
        document.getElementById('limThresholdVal').textContent = this.value + 'dB';
        if (masterLimiter) masterLimiter.threshold.value = MASTER.limThreshold;
        autoSave();
    });
}

// ── GR + output meter animation ─────────────────────────────
function startMasterAnimation() {
    if (masterRaf) return;
    function frame() {
        // Gain reduction meter
        if (masterComp && MASTER.compEnabled) {
            const gr = Math.abs(masterComp.reduction ?? 0);
            const grPct = Math.min(100, gr / 20 * 100);
            const fill = document.getElementById('grFill');
            if (fill) {
                fill.style.width = grPct + '%';
                fill.className = 'master-gr-fill' + (gr > 12 ? ' heavy' : gr > 6 ? ' medium' : '');
            }
            const grVal = document.getElementById('grVal');
            if (grVal) grVal.textContent = '-' + gr.toFixed(1) + 'dB';
        }

        // Output stereo meter
        if (masterMeter) {
            const val = masterMeter.getValue();
            const db = typeof val === 'number' ? val : (Array.isArray(val) ? val[0] : -Infinity);
            const pct = Math.max(0, Math.min(100, (db + 60) / 66 * 100));
            const cls = 'master-out-bar' + (db > -3 ? ' clip' : db > -9 ? ' hot' : '');
            const l = document.getElementById('masterOutL');
            const r = document.getElementById('masterOutR');
            if (l) { l.style.width = pct + '%'; l.className = cls; }
            if (r) { r.style.width = (pct * (0.85 + Math.random() * 0.15)) + '%'; r.className = cls; }
        }

        masterRaf = requestAnimationFrame(frame);
    }
    masterRaf = requestAnimationFrame(frame);
}

function stopMasterAnimation() {
    if (masterRaf) { cancelAnimationFrame(masterRaf); masterRaf = null; }
}

// Restore MASTER state into UI (called after project load)
function restoreMasterUI() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('compThreshold', MASTER.threshold);
    set('compRatio',     MASTER.ratio);
    set('compAttack',    MASTER.attack);
    set('compRelease',   MASTER.release);
    set('limThreshold',  MASTER.limThreshold);
    document.getElementById('compThresholdVal').textContent = MASTER.threshold + 'dB';
    document.getElementById('compRatioVal').textContent     = MASTER.ratio + ':1';
    document.getElementById('compAttackVal').textContent    = Math.round(MASTER.attack * 1000) + 'ms';
    document.getElementById('compReleaseVal').textContent   = Math.round(MASTER.release * 1000) + 'ms';
    document.getElementById('limThresholdVal').textContent  = MASTER.limThreshold + 'dB';
    document.getElementById('compToggle')?.classList.toggle('active', MASTER.compEnabled);
    document.getElementById('compControls')?.classList.toggle('disabled', !MASTER.compEnabled);
}
