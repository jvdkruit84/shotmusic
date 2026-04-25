// ── Mixer ───────────────────────────────────────────────────

let mixerOpen = false;
let mixerRaf  = null;
const soloSet = new Set();

function toggleMixer() {
    mixerOpen = !mixerOpen;
    document.getElementById('mixerPanel').classList.toggle('open', mixerOpen);
    document.getElementById('btnMixer').classList.toggle('active', mixerOpen);
    if (mixerOpen) {
        // Ensure audio + synths are ready so fxNodes exist
        startAudio().then(() => { buildMixerUI(); startMixerAnimation(); });
    } else {
        stopMixerAnimation();
    }
}

function buildMixerUI() {
    const container = document.getElementById('mixerStrips');
    container.innerHTML = '';
    SEQ.tracks.forEach(t => container.appendChild(buildChannelStrip(t)));
    // Bus strips
    (window.BUS_DEFS || []).forEach(def => container.appendChild(buildBusStrip(def)));
    container.appendChild(buildMasterStrip());
}

window.refreshBusMixer = function() {
    if (mixerOpen) buildMixerUI();
};

function buildBusStrip(def) {
    const st = window.BUS_STATE?.[def.id] || { vol:0, mute:false };
    const strip = document.createElement('div');
    strip.className = 'mix-strip mix-bus-strip';
    strip.dataset.busId = def.id;
    strip.style.setProperty('--track-color', def.color);

    strip.innerHTML = `
        <div class="mix-strip-hdr" style="--track-color:${def.color}">
            <span class="mix-label">${def.label}</span>
            <span class="mix-bus-badge">BUS</span>
        </div>`;

    // Volume fader
    const faderWrap = document.createElement('div'); faderWrap.className = 'mix-fader-wrap';
    const fader = document.createElement('input');
    fader.type='range'; fader.className='mix-fader'; fader.min=-40; fader.max=6; fader.step=0.5;
    fader.value = st.vol;
    const volVal = document.createElement('span'); volVal.className = 'mix-vol-val';
    volVal.textContent = (st.vol>0?'+':'')+Number(st.vol).toFixed(1)+'dB';
    fader.addEventListener('input', function() {
        const v = +this.value;
        volVal.textContent = (v>0?'+':'')+v.toFixed(1)+'dB';
        if(typeof updateBus==='function') updateBus(def.id, 'vol', v);
    });
    faderWrap.append(fader, volVal);
    strip.appendChild(faderWrap);

    const btnRow = document.createElement('div'); btnRow.className = 'mix-btn-row';
    const muteBtn = document.createElement('button');
    muteBtn.className = 'mix-btn mix-mute-btn' + (st.mute ? ' active' : '');
    muteBtn.textContent = 'M';
    muteBtn.addEventListener('click', () => {
        st.mute = !st.mute;
        muteBtn.classList.toggle('active', st.mute);
        if(typeof updateBus==='function') updateBus(def.id, 'mute', st.mute);
    });
    btnRow.appendChild(muteBtn);
    strip.appendChild(btnRow);

    // Track count badge
    const badge = document.createElement('div');
    badge.className = 'mix-bus-tracks';
    const routed = SEQ.tracks.filter(t => t.busRoute === def.id);
    badge.textContent = routed.length ? routed.map(t=>t.label).join(', ') : 'geen tracks';
    strip.appendChild(badge);

    return strip;
}

function buildChannelStrip(track) {
    const strip = document.createElement('div');
    strip.className = 'mix-strip'; strip.dataset.uid = track.uid;

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'mix-strip-hdr';
    hdr.style.setProperty('--track-color', track.color);
    hdr.innerHTML = `<span class="mix-label">${track.label}</span>`;
    strip.appendChild(hdr);

    // VU meter
    const meterWrap = document.createElement('div'); meterWrap.className = 'mix-meter';
    const meterFill = document.createElement('div');
    meterFill.className = 'mix-meter-fill'; meterFill.dataset.uid = track.uid;
    // dBFS markers
    [-6,-12,-24].forEach(db => {
        const tick = document.createElement('div');
        tick.className = 'mix-meter-tick';
        tick.style.bottom = Math.max(0, (db + 60) / 66 * 100) + '%';
        meterWrap.appendChild(tick);
    });
    meterWrap.appendChild(meterFill);
    strip.appendChild(meterWrap);

    // Pan
    const panRow = document.createElement('div'); panRow.className = 'mix-pan-row';
    const panLbl = document.createElement('span'); panLbl.className = 'mix-ctrl-lbl'; panLbl.textContent = 'PAN';
    const panInp = document.createElement('input');
    panInp.type='range'; panInp.className='mix-pan'; panInp.min=-1; panInp.max=1; panInp.step=0.01;
    panInp.value = track.pan ?? 0;
    const panVal = document.createElement('span'); panVal.className = 'mix-pan-val';
    const fmtPan = v => v===0?'C': (v>0?'R':'L')+Math.abs(Math.round(v*100));
    panVal.textContent = fmtPan(track.pan ?? 0);
    panInp.addEventListener('input', function() {
        updateTrackMixer(track,'pan',+this.value);
        panVal.textContent = fmtPan(+this.value);
        autoSave();
    });
    panRow.append(panLbl, panInp, panVal);
    strip.appendChild(panRow);

    // Volume fader
    const faderWrap = document.createElement('div'); faderWrap.className = 'mix-fader-wrap';
    const fader = document.createElement('input');
    fader.type='range'; fader.className='mix-fader'; fader.min=-40; fader.max=6; fader.step=0.5;
    fader.value = track.volume ?? 0;
    const volVal = document.createElement('span'); volVal.className = 'mix-vol-val';
    const fmtVol = v => (v>0?'+':'')+Number(v).toFixed(1)+'dB';
    volVal.textContent = fmtVol(track.volume ?? 0);
    fader.addEventListener('input', function() {
        updateTrackMixer(track,'volume',+this.value);
        volVal.textContent = fmtVol(+this.value);
        autoSave();
    });
    faderWrap.append(fader, volVal);
    strip.appendChild(faderWrap);

    // Mute + Solo
    const btnRow = document.createElement('div'); btnRow.className = 'mix-btn-row';
    const muteBtn = document.createElement('button');
    muteBtn.className = 'mix-btn mix-mute-btn' + (track.mute ? ' active' : '');
    muteBtn.textContent = 'M';
    muteBtn.title = 'Mute';
    muteBtn.addEventListener('click', () => {
        track.mute = !track.mute;
        muteBtn.classList.toggle('active', track.mute);
        applySolo();
        autoSave();
    });
    const soloBtn = document.createElement('button');
    soloBtn.className = 'mix-btn mix-solo-btn' + (soloSet.has(track.uid) ? ' active' : '');
    soloBtn.textContent = 'S';
    soloBtn.title = 'Solo';
    soloBtn.addEventListener('click', () => {
        if (soloSet.has(track.uid)) soloSet.delete(track.uid);
        else soloSet.add(track.uid);
        soloBtn.classList.toggle('active', soloSet.has(track.uid));
        applySolo();
    });
    btnRow.append(muteBtn, soloBtn);
    strip.appendChild(btnRow);
    return strip;
}

function buildMasterStrip() {
    const strip = document.createElement('div');
    strip.className = 'mix-strip mix-master-strip';
    strip.innerHTML = `
        <div class="mix-strip-hdr" style="--track-color:#ffffff">
            <span class="mix-label">MASTER</span>
        </div>
        <div class="mix-meter" id="masterMeterWrap">
            <div class="mix-meter-fill" id="masterMeterFill"></div>
        </div>
        <div class="mix-fader-wrap">
            <input type="range" class="mix-fader" id="masterFader" min="-40" max="6" step="0.5" value="0">
            <span class="mix-vol-val" id="masterVolVal">0.0dB</span>
        </div>
        <div class="mix-btn-row">
            <button class="mix-btn" id="masterLimBtn" title="Limiter aan/uit">LIM</button>
        </div>`;
    strip.querySelector('#masterFader').addEventListener('input', function() {
        Tone.getDestination().volume.value = +this.value;
        strip.querySelector('#masterVolVal').textContent = (this.value>0?'+':'')+Number(this.value).toFixed(1)+'dB';
    });
    strip.querySelector('#masterLimBtn').addEventListener('click', function() {
        this.classList.toggle('active');
        // Basic soft-limit via destination volume ceiling
        // Full limiter could be added via Tone.Limiter in future
    });
    return strip;
}

function applySolo() {
    SEQ.tracks.forEach(t => {
        if (!t.fxNodes?.vol) return;
        t.fxNodes.vol.mute = t.mute || (soloSet.size > 0 && !soloSet.has(t.uid));
    });
    // Sync mute buttons in mixer UI
    document.querySelectorAll('.mix-strip[data-uid]').forEach(el => {
        const t = SEQ.tracks.find(x => x.uid === +el.dataset.uid);
        if (!t) return;
        el.querySelector('.mix-mute-btn')?.classList.toggle('active', t.mute);
        const isMuted = soloSet.size > 0 && !soloSet.has(t.uid);
        el.classList.toggle('mix-solo-muted', isMuted && !t.mute);
    });
}

// ── Meter animation ────────────────────────────────────────
function startMixerAnimation() {
    if (mixerRaf) return;
    function frame() {
        SEQ.tracks.forEach(t => {
            if (!t.meterNode) return;
            const fill = document.querySelector(`.mix-meter-fill[data-uid="${t.uid}"]`);
            if (!fill) return;
            const db = t.meterNode.getValue();
            const val = typeof db === 'number' ? db : (Array.isArray(db) ? Math.max(...db) : -Infinity);
            const pct = Math.max(0, Math.min(100, (val + 60) / 66 * 100));
            fill.style.height = pct + '%';
            fill.className = 'mix-meter-fill' + (val > -3 ? ' clip' : val > -9 ? ' hot' : '');
            fill.dataset.uid = t.uid;
        });
        mixerRaf = requestAnimationFrame(frame);
    }
    mixerRaf = requestAnimationFrame(frame);
}

function stopMixerAnimation() {
    if (mixerRaf) { cancelAnimationFrame(mixerRaf); mixerRaf = null; }
}

// Rebuild mixer UI after track changes
function refreshMixerIfOpen() {
    if (mixerOpen) buildMixerUI();
}
