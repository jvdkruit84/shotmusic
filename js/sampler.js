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
    // Build URL fresh from raw parts — prevents any double-encoding
    const url = _sampleUrl(pack, cat, file);
    fetch(url)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(buf => Tone.getContext().rawContext.decodeAudioData(buf))
        .then(audioBuf => {
            const player = new Tone.Player(audioBuf).toDestination();
            player.retrigger = true;
            _sbPreviewPlayer = player;
            player.start();
        })
        .catch(err => { console.error('Preview mislukt:', url, err); setStatus('Preview mislukt', 'err'); });
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
    track.samplePack = null;
    track.sampleCat  = null;
    track.sampleFile = null;
    track.sampleUrl  = null;
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
        lbl.textContent = pack;
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
