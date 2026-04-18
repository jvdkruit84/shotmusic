// ── Undo / Redo ──────────────────────────────────────────────

const MAX_HISTORY = 50;
let _stack = [];   // array of JSON strings
let _pos   = -1;   // current position in stack
let _busy  = false; // true while applying a history state (prevent re-push)

function pushHistory() {
    if (_busy) return;
    // Discard any forward history
    if (_pos < _stack.length - 1) _stack.splice(_pos + 1);
    // Snapshot current state
    _stack.push(JSON.stringify(collectProjectData()));
    if (_stack.length > MAX_HISTORY) _stack.shift();
    _pos = _stack.length - 1;
    _updateUndoRedoBtns();
}

async function undo() {
    if (_pos <= 0) return;
    _pos--;
    await _apply(_stack[_pos]);
}

async function redo() {
    if (_pos >= _stack.length - 1) return;
    _pos++;
    await _apply(_stack[_pos]);
}

async function _apply(snapshot) {
    _busy = true;
    try {
        const data = JSON.parse(snapshot);
        await loadProjectData(data, { silent: true });
        autoSave();
    } finally {
        _busy = false;
    }
    _updateUndoRedoBtns();
}

function _updateUndoRedoBtns() {
    const u = document.getElementById('btnUndo');
    const r = document.getElementById('btnRedo');
    if (u) u.disabled = _pos <= 0;
    if (r) r.disabled = _pos >= _stack.length - 1;
}

function initHistory() {
    document.getElementById('btnUndo')?.addEventListener('click', undo);
    document.getElementById('btnRedo')?.addEventListener('click', redo);
    // Push initial snapshot after everything is loaded
    setTimeout(pushHistory, 200);
    _updateUndoRedoBtns();
}
