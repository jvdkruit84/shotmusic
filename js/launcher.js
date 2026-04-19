// ── Clip Launcher (MC-505 Performance Mode) ─────────────────
// Each row = track, each column = pattern (A-H).
// In performance mode every track plays its own activePattern independently.

let launcherOpen = false;

function toggleLauncher() {
    launcherOpen = !launcherOpen;
    document.getElementById('launcherPanel').classList.toggle('open', launcherOpen);
    document.getElementById('btnLauncher').classList.toggle('active', launcherOpen);
    if (launcherOpen) buildLauncherUI();
}

// ── Main UI builder ──────────────────────────────────────────
function buildLauncherUI() {
    const panel = document.getElementById('launcherPanel');
    panel.innerHTML = '';

    // Header bar
    const hdr = document.createElement('div');
    hdr.className = 'lnch-header';

    const title = document.createElement('span');
    title.className = 'lnch-title';
    title.textContent = 'PERFORMANCE';

    const modeBtn = document.createElement('button');
    modeBtn.className = 'lnch-mode-btn' + (SEQ.performanceMode ? ' active' : '');
    modeBtn.id = 'lnchModeBtn';
    modeBtn.textContent = SEQ.performanceMode ? '⚡ Performance AAN' : '⚡ Performance UIT';
    modeBtn.addEventListener('click', togglePerformanceMode);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lnch-close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', toggleLauncher);

    hdr.append(title, modeBtn, closeBtn);
    panel.appendChild(hdr);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'lnch-grid';
    grid.id = 'lnchGrid';

    // Column headers (pattern names)
    const cornerCell = document.createElement('div');
    cornerCell.className = 'lnch-corner';
    grid.appendChild(cornerCell);

    PATTERN_NAMES.forEach(name => {
        const ph = document.createElement('div');
        ph.className = 'lnch-pat-hdr';
        ph.textContent = name;
        grid.appendChild(ph);
    });

    // Track rows
    SEQ.tracks.forEach(track => {
        const trackLbl = document.createElement('div');
        trackLbl.className = 'lnch-track-lbl';
        trackLbl.style.setProperty('--track-color', track.color);
        trackLbl.innerHTML = `<span class="lnch-track-dot"></span><span>${track.label}</span>`;
        grid.appendChild(trackLbl);

        PATTERN_NAMES.forEach(patName => {
            const cell = document.createElement('div');
            cell.className = 'lnch-cell';
            cell.dataset.uid = track.uid;
            cell.dataset.pat = patName;
            refreshCellState(cell, track, patName);
            cell.addEventListener('click', e => onCellClick(e, track, patName));
            grid.appendChild(cell);
        });
    });

    panel.appendChild(grid);

    // Global pattern buttons
    const globalRow = document.createElement('div');
    globalRow.className = 'lnch-global-row';
    const globalLbl = document.createElement('span');
    globalLbl.className = 'lnch-global-lbl';
    globalLbl.textContent = 'Alle tracks →';
    globalRow.appendChild(globalLbl);

    PATTERN_NAMES.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'lnch-global-btn';
        btn.textContent = name;
        btn.addEventListener('click', () => switchAllToPattern(name));
        globalRow.appendChild(btn);
    });

    panel.appendChild(globalRow);
}

// ── Cell state ────────────────────────────────────────────────
function refreshCellState(cell, track, patName) {
    const hasData = !!(SEQ.patterns[patName]?.data[track.uid]);
    const isActive  = track.activePattern === patName;
    const isQueued  = track.queuedPattern === patName;

    cell.className = 'lnch-cell';
    if (hasData)   cell.classList.add('has-data');
    if (isActive && SEQ.performanceMode) cell.classList.add('active');
    if (isQueued)  cell.classList.add('queued');

    cell.style.setProperty('--track-color', track.color);
    cell.innerHTML = isActive && SEQ.performanceMode
        ? '<span class="lnch-playing-dot"></span>'
        : '';
}

function refreshLauncherRow(track) {
    if (!launcherOpen) return;
    PATTERN_NAMES.forEach(patName => {
        const cell = document.querySelector(`.lnch-cell[data-uid="${track.uid}"][data-pat="${patName}"]`);
        if (cell) refreshCellState(cell, track, patName);
    });
}
window.refreshLauncherRow = refreshLauncherRow;

function refreshLauncherAll() {
    if (!launcherOpen) return;
    SEQ.tracks.forEach(t => refreshLauncherRow(t));
}

// ── Cell click ────────────────────────────────────────────────
function onCellClick(e, track, patName) {
    if (!SEQ.performanceMode) {
        // Not in performance mode: just switch the global pattern
        switchPattern(patName);
        return;
    }

    if (e.shiftKey) {
        // Shift+click: switch immediately (no bar boundary wait)
        activatePatternForTrack(track, patName, true);
    } else if (track.activePattern === patName) {
        // Click active cell: mute/unmute track
        track.mute = !track.mute;
        refreshLauncherRow(track);
        // Sync mute button in sequencer
        document.querySelector(`.seq-mute-btn[data-uid="${track.uid}"]`)
            ?.classList.toggle('muted', track.mute);
    } else {
        // Queue for next bar
        track.queuedPattern = patName;
        refreshLauncherRow(track);
    }
}

function activatePatternForTrack(track, patName, immediate=false) {
    const pd = SEQ.patterns[patName]?.data[track.uid];
    if (pd) {
        track.steps = [...pd.steps];
        track.vels  = [...pd.vels];
        track.probs = [...pd.probs];
        track.gates = [...(pd.gates ?? Array(32).fill(80))];
    } else {
        const def = TRACK_TYPES[track.type];
        track.steps = Array(32).fill(def.melodic ? null : 0);
        track.vels  = Array(32).fill(100);
        track.probs = Array(32).fill(100);
        track.gates = Array(32).fill(80);
    }
    track.activePattern = patName;
    track.queuedPattern = null;
    refreshLauncherRow(track);
    if (immediate && S.isPlaying) buildSeqLoop();
}

// ── Performance mode toggle ───────────────────────────────────
function togglePerformanceMode() {
    SEQ.performanceMode = !SEQ.performanceMode;

    // On enable: save current pattern data, set all tracks' activePattern
    if (SEQ.performanceMode) {
        saveCurrentPattern();
        SEQ.tracks.forEach(t => {
            t.activePattern = SEQ.currentPattern;
            t.queuedPattern = null;
        });
    } else {
        // On disable: clear all queued patterns
        SEQ.tracks.forEach(t => { t.queuedPattern = null; });
    }

    const btn = document.getElementById('lnchModeBtn');
    if (btn) {
        btn.classList.toggle('active', SEQ.performanceMode);
        btn.textContent = SEQ.performanceMode ? '⚡ Performance AAN' : '⚡ Performance UIT';
    }

    refreshLauncherAll();
    autoSave();
}

// ── Switch all tracks to one pattern ─────────────────────────
function switchAllToPattern(patName) {
    if (!SEQ.performanceMode) {
        // Normal mode: standard global switch
        switchPattern(patName);
        return;
    }
    // Performance mode: queue all tracks to this pattern
    SEQ.tracks.forEach(t => {
        if (t.activePattern !== patName) {
            t.queuedPattern = patName;
        }
    });
    refreshLauncherAll();
}
