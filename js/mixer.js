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

    // ── FX button → opens floating panel ───────────────────
    const fxBtn = document.createElement('button');
    fxBtn.className = 'mix-btn mix-fx-open-btn';
    fxBtn.textContent = 'FX';
    fxBtn.title = 'FX & EQ openen';
    fxBtn.addEventListener('click', e => {
        e.stopPropagation();
        openFxPanel(track, fxBtn);
    });
    strip.appendChild(fxBtn);

    return strip;
}

// ── Floating FX / EQ panel ─────────────────────────────────
let _fxPanelEl   = null;
let _fxPanelUid  = null;

function openFxPanel(track, anchorEl) {
    // Toggle: close if already open for this track
    if (_fxPanelEl && _fxPanelUid === track.uid) { closeFxPanel(); return; }
    closeFxPanel();

    _fxPanelUid = track.uid;
    const panel = document.createElement('div');
    panel.className = 'mix-fx-panel';
    _fxPanelEl = panel;

    // Header
    const hdr = document.createElement('div'); hdr.className = 'mix-fx-panel-hdr';
    const title = document.createElement('span'); title.textContent = track.label + ' — FX & EQ';
    const closeBtn = document.createElement('button'); closeBtn.textContent = '×'; closeBtn.className = 'mix-fx-panel-close';
    closeBtn.addEventListener('click', closeFxPanel);
    hdr.append(title, closeBtn);
    panel.appendChild(hdr);

    // FX rows
    const fxSec = document.createElement('div'); fxSec.className = 'mix-fx-panel-sec';
    fxSec.innerHTML = '<div class="mix-fx-panel-sec-lbl">FX</div>';
    const fx = track.fx || {};
    [
        { key:'rev',  label:'Reverb',    min:0,   max:1,     step:0.01, fmt: v => Math.round(v*100)+'%',  def: fx.rev  ?? 0 },
        { key:'dly',  label:'Delay',     min:0,   max:0.9,   step:0.01, fmt: v => Math.round(v*100)+'%',  def: fx.dly  ?? 0 },
        { key:'flt',  label:'Filter',    min:200, max:20000, step:100,  fmt: v => v>=1000?(v/1000).toFixed(1)+'k':v+'Hz', def: fx.flt ?? 20000 },
        { key:'dist', label:'Distortion',min:0,   max:1,     step:0.01, fmt: v => Math.round(v*100)+'%',  def: fx.dist ?? 0 },
    ].forEach(d => {
        const row = _makeFxRow(d.label, d.min, d.max, d.step, d.def, d.fmt, v => {
            updateTrackFx(track, d.key, v); autoSave();
        });
        fxSec.appendChild(row);
    });
    panel.appendChild(fxSec);

    // EQ rows
    const eqSec = document.createElement('div'); eqSec.className = 'mix-fx-panel-sec';
    eqSec.innerHTML = '<div class="mix-fx-panel-sec-lbl">EQ</div>';
    const eq = track.eq || {};
    const fmtDb = v => (v>0?'+':'')+Number(v).toFixed(1)+'dB';
    [
        { key:'low',  label:'Low',  def: eq.low  ?? 0 },
        { key:'mid',  label:'Mid',  def: eq.mid  ?? 0 },
        { key:'high', label:'High', def: eq.high ?? 0 },
    ].forEach(d => {
        const row = _makeFxRow(d.label, -12, 12, 0.5, d.def, fmtDb, v => {
            updateTrackEq(track, d.key, v); autoSave();
        });
        eqSec.appendChild(row);
    });
    panel.appendChild(eqSec);

    // Position near the FX button
    document.body.appendChild(panel);
    const rect = anchorEl.getBoundingClientRect();
    const pw = 260;
    let left = rect.left - pw - 6;
    if (left < 6) left = rect.right + 6;
    const top  = Math.min(rect.top, window.innerHeight - panel.offsetHeight - 12);
    panel.style.left = left + 'px';
    panel.style.top  = Math.max(8, top) + 'px';

    // Close on outside click
    setTimeout(() => document.addEventListener('click', _fxOutsideClick), 10);
}

function _makeFxRow(label, min, max, step, defVal, fmt, onChange) {
    const row = document.createElement('div'); row.className = 'mix-fx-panel-row';
    const lbl = document.createElement('span'); lbl.className = 'mix-fx-panel-lbl'; lbl.textContent = label;
    const sl  = document.createElement('input');
    sl.type='range'; sl.className='mix-fx-panel-slider'; sl.min=min; sl.max=max; sl.step=step; sl.value=defVal;
    const val = document.createElement('span'); val.className = 'mix-fx-panel-val'; val.textContent = fmt(defVal);
    sl.addEventListener('input', function() {
        const v = +this.value; val.textContent = fmt(v); onChange(v);
    });
    row.append(lbl, sl, val);
    return row;
}

function _fxOutsideClick(e) {
    if (_fxPanelEl && !_fxPanelEl.contains(e.target)) closeFxPanel();
}

function closeFxPanel() {
    _fxPanelEl?.remove(); _fxPanelEl = null; _fxPanelUid = null;
    document.removeEventListener('click', _fxOutsideClick);
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
