// ── Sample Pack Browser ─────────────────────────────────────────

const TRACK_TYPE_KEYWORDS = {
    kick:   ['kick','kik','bass drum','bassdrum','bd'],
    snare:  ['snare','snr'],
    hihat:  ['hi-hat','hihat','hat','hh','closed','open'],
    sample: [],
};

function _catMatchesTrack(catPath, trackType) {
    if (trackType === 'sample') return true;
    const lower = catPath.toLowerCase();
    return (TRACK_TYPE_KEYWORDS[trackType] ?? []).some(kw => lower.includes(kw));
}

function _catLabel(catPath) {
    if (catPath === '.') return 'Root';
    const parts = catPath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
}

function _sampleUrl(pack, catPath, file) {
    const path = (catPath === '.' || catPath === '') ? '' : catPath;
    return API
        + '?action=getSampleFile'
        + '&pack='  + encodeURIComponent(pack)
        + '&path='  + encodeURIComponent(path)
        + '&file='  + encodeURIComponent(file);
}

// Build fetch URL from raw (unencoded) pack/cat/file stored on track
function _trackSampleUrl(track) {
    if (!track.samplePack || !track.sampleFile) return null;
    return _sampleUrl(track.samplePack, track.sampleCat ?? '', track.sampleFile);
}

// ── State ────────────────────────────────────────────────────
let _sbPacks         = null;
let _sbTrack         = null;
let _sbPreviewPlayer = null;
let _sbActiveCat     = null;

// ── API ──────────────────────────────────────────────────────
async function fetchSamplePacks() {
    if (_sbPacks !== null) return _sbPacks;
    try {
        const r  = await fetch(API + '?action=getSamplePacks');
        _sbPacks = await r.json();
    } catch(e) { _sbPacks = {}; }
    return _sbPacks;
}
function invalidateSamplePackCache() { _sbPacks = null; }

// ── Preview ──────────────────────────────────────────────────
async function previewSample(pack, cat, file) {
    try { _sbPreviewPlayer?.stop(); _sbPreviewPlayer?.dispose(); } catch(e) {}
    _sbPreviewPlayer = null;
    await Tone.start();
    const url = _sampleUrl(pack, cat, file);
    fetch(url)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(buf => Tone.getContext().rawContext.decodeAudioData(buf))
        .then(audioBuf => {
            const player = new Tone.Player(audioBuf).toDestination();
            player.retrigger = true;
            _sbPreviewPlayer = player;
            player.start();
            // Show waveform for this file
            showWaveform(audioBuf, file);
        })
        .catch(err => { console.error('Preview mislukt:', url, err); setStatus('Preview mislukt', 'err'); });
}

// ── Waveform viewer / trimmer ─────────────────────────────────
let _wfBuffer     = null;
let _wfTrimS      = 0;       // 0-1 normalised
let _wfTrimE      = 1;
let _wfDrag       = null;    // 'start' | 'end'
let _wfPreviewSrc = null;
let _wfPlayRAF    = null;
let _wfEventsOk   = false;

function showWaveform(audioBuf, filename) {
    _wfBuffer = audioBuf;
    _wfTrimS  = 0;
    _wfTrimE  = 1;

    const panel = document.getElementById('sbWfPanel');
    if (!panel) return;
    document.getElementById('sbWfFilename').textContent = filename;
    document.getElementById('sbWfDuration').textContent = audioBuf.duration.toFixed(2) + 's';
    panel.classList.remove('hidden');
    _wfUpdateLabels();
    _wfResize();
    _wfDraw();
    _wfInitEvents();
}

function _wfResize() {
    const canvas = document.getElementById('sbWfCanvas');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    canvas.width = wrap.clientWidth || 660;
}

function _wfUpdateLabels() {
    if (!_wfBuffer) return;
    const dur = _wfBuffer.duration;
    document.getElementById('sbWfStartVal').textContent = (dur * _wfTrimS).toFixed(2) + 's';
    document.getElementById('sbWfEndVal').textContent   = (dur * _wfTrimE).toFixed(2) + 's';
    const selDur = (dur * (_wfTrimE - _wfTrimS)).toFixed(2);
    document.getElementById('sbWfSelDur').textContent   = `Selectie: ${selDur}s`;
}

function _wfDraw(playPos = null) {
    const canvas = document.getElementById('sbWfCanvas');
    if (!canvas || !_wfBuffer) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0e16';
    ctx.fillRect(0, 0, W, H);

    // Mix stereo to mono and draw per-pixel min/max bars
    const ch0   = _wfBuffer.getChannelData(0);
    const ch1   = _wfBuffer.numberOfChannels > 1 ? _wfBuffer.getChannelData(1) : ch0;
    const total = ch0.length;
    const midY  = H / 2;

    for (let px = 0; px < W; px++) {
        const i0 = Math.floor((px / W) * total);
        const i1 = Math.max(i0 + 1, Math.floor(((px + 1) / W) * total));
        let hi = 0, lo = 0;
        for (let i = i0; i < i1; i++) {
            const s = (ch0[i] + ch1[i]) * 0.5;
            if (s > hi) hi = s;
            if (s < lo) lo = s;
        }
        const frac = px / W;
        const inTrim = frac >= _wfTrimS && frac <= _wfTrimE;
        ctx.fillStyle = inTrim ? '#4a9eff' : '#1e2240';
        const barTop = midY - hi * midY;
        const barH   = Math.max(1, (hi - lo) * midY);
        ctx.fillRect(px, barTop, 1, barH);
    }

    // Darken outside trim region
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, _wfTrimS * W, H);
    ctx.fillRect(_wfTrimE * W, 0, W - _wfTrimE * W, H);

    // Trim handles
    _wfDrawHandle(ctx, _wfTrimS * W, H, '#ffd93d', 'right');  // start — yellow
    _wfDrawHandle(ctx, _wfTrimE * W, H, '#ff6b6b', 'left');   // end   — red

    // Playhead
    if (playPos !== null) {
        const px = Math.round(playPos * W);
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
        ctx.restore();
    }
}

function _wfDrawHandle(ctx, x, H, color, arrowDir) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    // Triangle flag at top
    ctx.fillStyle = color;
    ctx.beginPath();
    if (arrowDir === 'right') {
        ctx.moveTo(x, 0); ctx.lineTo(x + 9, 0); ctx.lineTo(x, 14);
    } else {
        ctx.moveTo(x, 0); ctx.lineTo(x - 9, 0); ctx.lineTo(x, 14);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
}

function _wfHit(x, W) {
    if (Math.abs(x - _wfTrimS * W) < 12) return 'start';
    if (Math.abs(x - _wfTrimE * W) < 12) return 'end';
    return null;
}

function _wfInitEvents() {
    if (_wfEventsOk) return;
    _wfEventsOk = true;

    const canvas = document.getElementById('sbWfCanvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const x    = (e.clientX - rect.left) * (canvas.width / rect.width);
        _wfDrag = _wfHit(x, canvas.width);
        if (!_wfDrag) {
            const frac = x / canvas.width;
            _wfDrag = Math.abs(frac - _wfTrimS) < Math.abs(frac - _wfTrimE) ? 'start' : 'end';
        }
        e.preventDefault();
    });

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const x    = (e.clientX - rect.left) * (canvas.width / rect.width);
        const hit  = _wfHit(x, canvas.width);
        canvas.style.cursor = hit ? 'ew-resize' : 'default';
    });

    window.addEventListener('mousemove', e => {
        if (!_wfDrag || !_wfBuffer) return;
        const rect = canvas.getBoundingClientRect();
        const x    = (e.clientX - rect.left) * (canvas.width / rect.width);
        const frac = Math.max(0, Math.min(1, x / canvas.width));
        if (_wfDrag === 'start') _wfTrimS = Math.min(frac, _wfTrimE - 0.005);
        else                     _wfTrimE = Math.max(frac, _wfTrimS + 0.005);
        _wfUpdateLabels();
        _wfDraw();
    });

    window.addEventListener('mouseup', () => { _wfDrag = null; });

    document.getElementById('sbWfClose')?.addEventListener('click', () => {
        _wfStopPreview();
        document.getElementById('sbWfPanel').classList.add('hidden');
        _wfBuffer = null;
    });

    document.getElementById('sbWfPreviewBtn')?.addEventListener('click', _wfPreviewTrim);
    document.getElementById('sbWfApplyBtn')?.addEventListener('click',   _wfApply);
    document.getElementById('sbWfResetBtn')?.addEventListener('click', () => {
        _wfTrimS = 0; _wfTrimE = 1;
        _wfUpdateLabels(); _wfDraw();
        // Also clear trim on track
        if (_sbTrack) { _sbTrack.trimStart = null; _sbTrack.trimEnd = null; }
        setStatus('Trim gereset', 'ok');
    });
}

function _wfPreviewTrim() {
    if (!_wfBuffer) return;
    _wfStopPreview();
    const rawCtx = Tone.getContext().rawContext;
    const src    = rawCtx.createBufferSource();
    src.buffer   = _wfBuffer;
    src.connect(rawCtx.destination);
    const dur    = _wfBuffer.duration;
    const offset = _wfTrimS * dur;
    const length = (_wfTrimE - _wfTrimS) * dur;
    const t0     = rawCtx.currentTime;
    src.start(0, offset, length);
    _wfPreviewSrc = src;

    function animPlayhead() {
        if (!_wfPreviewSrc) return;
        const elapsed = rawCtx.currentTime - t0;
        const pos = _wfTrimS + (elapsed / dur);
        if (pos <= _wfTrimE + 0.01) {
            _wfDraw(Math.min(pos, _wfTrimE));
            _wfPlayRAF = requestAnimationFrame(animPlayhead);
        } else {
            _wfPreviewSrc = null;
            _wfDraw();
        }
    }
    _wfPlayRAF = requestAnimationFrame(animPlayhead);
    src.onended = () => { _wfPreviewSrc = null; cancelAnimationFrame(_wfPlayRAF); _wfDraw(); };
}

function _wfStopPreview() {
    if (_wfPlayRAF)    { cancelAnimationFrame(_wfPlayRAF); _wfPlayRAF = null; }
    if (_wfPreviewSrc) { try { _wfPreviewSrc.stop(); } catch(e){} _wfPreviewSrc = null; }
    _wfDraw();
}

function _wfApply() {
    if (!_wfBuffer) return;
    const dur = _wfBuffer.duration;
    const ts  = _wfTrimS * dur;
    const te  = _wfTrimE * dur;
    if (_sbTrack) {
        _sbTrack.trimStart = ts;
        _sbTrack.trimEnd   = te;
        const sel = (te - ts).toFixed(2);
        setStatus(`Trim: ${ts.toFixed(2)}s – ${te.toFixed(2)}s (${sel}s) ✓`, 'ok');
        _refreshSampleBtn(_sbTrack);
    } else {
        // No track open (standalone preview) — trim stored for next assign
        setStatus(`Trim: ${ts.toFixed(2)}s – ${te.toFixed(2)}s — wijs sample toe om toe te passen`, 'ok');
    }
}

// ── Assign / remove ──────────────────────────────────────────
function assignSampleToTrack(track, pack, cat, file) {
    // Store raw (unencoded) fields — URL is built fresh at fetch time
    track.samplePack = pack;
    track.sampleCat  = cat;
    track.sampleFile = file;
    track.sampleUrl  = null; // legacy field cleared
    _refreshSampleBtn(track);
    const label = file.replace(/\.[^.]+$/, '');
    setStatus('Sample: ' + label, 'ok');
    // + click is a user gesture — start audio if needed, then build player
    if (S.audioReady) {
        buildTrackSynth(track);
    } else {
        startAudio().then(() => buildTrackSynth(track));
    }
}

function removeSampleFromTrack(track) {
    if (track.filename) _dbDelete(track.filename); // remove from IndexedDB cache
    track.samplePack    = null;
    track.sampleCat     = null;
    track.sampleFile    = null;
    track.sampleUrl     = null;
    track.filename      = null;
    track._localBuffer  = null;
    track.trimStart     = null;
    track.trimEnd       = null;
    try { track.samplePlayer?.dispose(); } catch(e) {}
    track.samplePlayer = null;
    _refreshSampleBtn(track);
    if (S.audioReady) buildTrackSynth(track);
    setStatus('Synth hersteld', 'ok');
}

function _refreshSampleBtn(track) {
    const row = document.querySelector(`.seq-sample-row[data-uid="${track.uid}"]`);
    if (!row) return;
    row.innerHTML = '';          // rebuild the row in-place
    _buildSampleRow(row, track);
}

function _buildSampleRow(row, track) {
    row.dataset.uid = track.uid;
    const shortName = track.sampleFile
        ? track.sampleFile.replace(/\.[^.]+$/, '')
        : null;

    const btn = document.createElement('button');
    btn.className = 'btn-sample-open sb-open-btn' + (shortName ? ' has-sample' : '');
    btn.dataset.uid = track.uid;
    btn.title = shortName ? 'Sample: ' + shortName + ' (wijzigen)' : 'Sample browser';
    btn.innerHTML = '<span class="sb-icon">◈</span> ' + (shortName ? shortName.slice(0, 14) : 'Sample');
    btn.addEventListener('click', () => openSampleBrowser(track));
    row.appendChild(btn);

    if (shortName) {
        const clr = document.createElement('button');
        clr.className = 'btn-sample-clear';
        clr.title = 'Synth herstellen';
        clr.textContent = '×';
        clr.addEventListener('click', e => { e.stopPropagation(); removeSampleFromTrack(track); });
        row.appendChild(clr);
    }
}

// ── Open / close ─────────────────────────────────────────────
function openSampleBrowser(track) {
    _sbTrack = track;
    _sbActiveCat = null;
    document.getElementById('sampleBrowserModal').classList.add('open');
    document.getElementById('sbTrackLabel').textContent = track.label;
    _renderLoading();
    invalidateSamplePackCache();
    fetchSamplePacks().then(() => _renderPacks());

    // If track already has a local buffer loaded, show its waveform immediately
    // and restore the existing trim handles
    if (track._localBuffer) {
        showWaveform(track._localBuffer, track.sampleFile ?? track.filename ?? 'Lokaal bestand');
        if (track.trimStart != null && track.trimEnd != null) {
            const dur  = track._localBuffer.duration;
            _wfTrimS   = track.trimStart / dur;
            _wfTrimE   = track.trimEnd   / dur;
            _wfUpdateLabels();
            _wfDraw();
        }
    } else {
        // Hide waveform panel when opening for a track without local buffer
        document.getElementById('sbWfPanel')?.classList.add('hidden');
        _wfBuffer = null;
    }
}

function closeSampleBrowser() {
    try { _sbPreviewPlayer?.stop(); _sbPreviewPlayer?.dispose(); } catch(e) {}
    _sbPreviewPlayer = null;
    document.getElementById('sampleBrowserModal').classList.remove('open');
    _sbTrack = null;
}

// ── Sidebar rendering ────────────────────────────────────────
function _renderLoading() {
    document.getElementById('sbSidebar').innerHTML = '<div class="sb-loading">Laden…</div>';
    document.getElementById('sbFiles').innerHTML = '';
}

function _renderPacks() {
    const packs = _sbPacks ?? {};
    const names = Object.keys(packs).sort();
    const track = _sbTrack;
    const sidebar = document.getElementById('sbSidebar');

    sidebar.innerHTML = '';

    if (!names.length) {
        document.getElementById('sbFiles').innerHTML = `
            <div class="sb-empty">
                <div class="sb-empty-icon">📁</div>
                <p>Geen sample packs gevonden.</p>
                <p class="sb-empty-hint">Voeg packs toe in de <code>samples/</code> map.<br>
                Elke submap wordt automatisch opgepikt.</p>
            </div>`;
        return;
    }

    let firstPack = null, firstCat = null;
    let hintPack  = null, hintCat  = null;

    names.forEach(pack => {
        const cats = Object.keys(packs[pack]);
        if (!cats.length) return;

        const packEl = document.createElement('div');
        packEl.className = 'sb-pack-node';
        const lbl = document.createElement('div');
        lbl.className = 'sb-pack-label';
        lbl.innerHTML = `<span class="sb-pack-arrow">▾</span>${pack}`;
        lbl.title = 'Klik om in/uitklappen';
        lbl.addEventListener('click', () => {
            const collapsed = packEl.classList.toggle('collapsed');
            lbl.querySelector('.sb-pack-arrow').textContent = collapsed ? '▸' : '▾';
        });
        packEl.appendChild(lbl);

        cats.forEach(cat => {
            const isHint = _catMatchesTrack(cat, track?.type);
            const node = document.createElement('div');
            node.className = 'sb-cat-node' + (isHint ? ' sb-cat-hint' : '');
            node.innerHTML = `<span title="${cat}">${_catLabel(cat)}</span>`
                           + `<span class="sb-count">${packs[pack][cat].length}</span>`;
            node.addEventListener('click', () => {
                sidebar.querySelectorAll('.sb-cat-node').forEach(n => n.classList.remove('active'));
                node.classList.add('active');
                _selectCat(pack, cat);
            });
            packEl.appendChild(node);

            if (!firstPack)          { firstPack = pack; firstCat = cat; }
            if (isHint && !hintPack) { hintPack  = pack; hintCat  = cat; }
        });

        sidebar.appendChild(packEl);
    });

    // Auto-select best matching category
    const selPack = hintPack ?? firstPack;
    const selCat  = hintCat  ?? firstCat;
    if (selPack) {
        // Find and highlight the node
        sidebar.querySelectorAll('.sb-cat-node').forEach(n => {
            if (n.querySelector('span[title="' + selCat + '"]')) n.classList.add('active');
        });
        _selectCat(selPack, selCat);
    }
}

// ── Files pane ───────────────────────────────────────────────
function _selectCat(pack, cat) {
    _sbActiveCat = { pack, cat };
    const search = (document.getElementById('sbSearch')?.value ?? '').toLowerCase();
    const files  = (_sbPacks?.[pack]?.[cat] ?? [])
        .filter(f => !search || f.toLowerCase().includes(search));
    const track  = _sbTrack;
    const pane   = document.getElementById('sbFiles');

    pane.innerHTML = '';

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'sb-cat-header';
    hdr.textContent = pack + (cat && cat !== '.' ? ' / ' + cat : '');
    pane.appendChild(hdr);

    if (files.length) {
        const grid = document.createElement('div');
        grid.className = 'sb-file-grid';

        files.forEach(file => {
            const name   = file.replace(/\.[^.]+$/, '');
            const active = track?.samplePack === pack
                        && track?.sampleCat  === cat
                        && track?.sampleFile === file;

            const item = document.createElement('div');
            item.className = 'sb-file-item' + (active ? ' active' : '');

            const nameSp = document.createElement('span');
            nameSp.className = 'sb-file-name';
            nameSp.title = file;
            nameSp.textContent = name;

            const actions = document.createElement('div');
            actions.className = 'sb-file-actions';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'sb-btn-preview';
            prevBtn.title = 'Preview';
            prevBtn.textContent = '▶';
            prevBtn.addEventListener('click', e => { e.stopPropagation(); previewSample(pack, cat, file); });

            const assignBtn = document.createElement('button');
            assignBtn.className = 'sb-btn-assign';
            assignBtn.title = 'Gebruiken';
            assignBtn.textContent = '+';
            assignBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (track) assignSampleToTrack(track, pack, cat, file);
                closeSampleBrowser();
            });

            actions.append(prevBtn, assignBtn);
            item.append(nameSp, actions);
            grid.appendChild(item);
        });

        pane.appendChild(grid);
    } else {
        const empty = document.createElement('div');
        empty.className = 'sb-empty';
        empty.innerHTML = '<p>Geen resultaten.</p>';
        pane.appendChild(empty);
    }

    // Custom drop zone
    const customWrap = document.createElement('div');
    customWrap.className = 'sb-custom-drop';
    customWrap.innerHTML = '<div class="sb-custom-label">Of laad een eigen bestand</div>';
    const dz = document.createElement('div');
    dz.className = 'sample-drop';
    dz.textContent = '↓ Sleep of klik';
    dz.addEventListener('click', () => {
        const fi = document.createElement('input');
        fi.type = 'file'; fi.accept = 'audio/*';
        fi.onchange = () => {
            if (fi.files[0] && _sbTrack) { loadSampleFile(_sbTrack, fi.files[0]); closeSampleBrowser(); }
        };
        fi.click();
    });
    dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => {
        e.preventDefault(); dz.classList.remove('drag-over');
        const f = e.dataTransfer.files[0];
        if (f && _sbTrack) { loadSampleFile(_sbTrack, f); closeSampleBrowser(); }
    });
    customWrap.appendChild(dz);
    pane.appendChild(customWrap);
}

// ── Search ───────────────────────────────────────────────────
function _sbOnSearch() {
    if (_sbActiveCat) _selectCat(_sbActiveCat.pack, _sbActiveCat.cat);
}

// ── Init modal events (once) ─────────────────────────────────
function initSampleBrowser() {
    const modal = document.getElementById('sampleBrowserModal');
    if (!modal) return;

    document.getElementById('sbClose')?.addEventListener('click', closeSampleBrowser);
    modal.addEventListener('click', e => { if (e.target === modal) closeSampleBrowser(); });
    document.getElementById('sbSearch')?.addEventListener('input', _sbOnSearch);
    document.getElementById('sbRefresh')?.addEventListener('click', () => {
        invalidateSamplePackCache();
        _renderLoading();
        fetchSamplePacks().then(() => _renderPacks());
    });
    document.getElementById('sbClearSample')?.addEventListener('click', () => {
        if (_sbTrack) removeSampleFromTrack(_sbTrack);
        closeSampleBrowser();
    });
}

document.addEventListener('DOMContentLoaded', initSampleBrowser);
