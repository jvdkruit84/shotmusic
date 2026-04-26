;(function(){
'use strict';

// ── MIDI Learn ────────────────────────────────────────────────
// Binds incoming MIDI CC messages to DAW parameters.
// Usage: click a "ML" button next to a parameter to enter learn mode,
// then move a knob/fader on your hardware controller.

window.ML = {
    active:   false,
    btn:      null,   // the button currently in learn mode
    applyFn:  null,   // function(value 0-1) to call on CC
    label:    '',
};

// Bindings: [{cc, channel, label, applyFn}]
// Note: applyFn can't survive JSON serialisation, so we rebuild from
// MIDI_BIND_DEFS (string refs) on load.
window.MIDI_BINDINGS = [];

// Init MIDI input — called after audio is ready
let midiAccess = null;

window.initMidiLearn = async function() {
    if (!navigator.requestMIDIAccess) return;
    try {
        midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        attachInputListeners();
        midiAccess.onstatechange = attachInputListeners;
        setStatus('MIDI input klaar', 'ok');
    } catch(e) {
        console.warn('MIDI input niet beschikbaar:', e.message);
    }
};

function attachInputListeners() {
    if (!midiAccess) return;
    midiAccess.inputs.forEach(inp => { inp.onmidimessage = onMidiIn; });
}

function onMidiIn(event) {
    const [status, data1, data2] = event.data;
    const type    = status & 0xf0;
    const channel = status & 0x0f;

    // Note On / Off → forward to piano roll recorder (if active)
    if (type === 0x90 || type === 0x80) {
        const isOn = type === 0x90 && data2 > 0;
        if (typeof window.MIDI_NOTE_HANDLER === 'function') window.MIDI_NOTE_HANDLER(data1, data2, isOn);
        return;
    }

    if (type !== 0xb0) return; // CC only
    const cc  = data1;
    const val = data2 / 127; // 0-1

    if (ML.active && ML.applyFn) {
        // Bind this CC
        // Remove existing binding for same target
        window.MIDI_BINDINGS = window.MIDI_BINDINGS.filter(b => b.applyFn !== ML.applyFn);
        window.MIDI_BINDINGS.push({ cc, channel, label: ML.label, applyFn: ML.applyFn });
        // Exit learn mode
        ML.btn?.classList.remove('ml-learning');
        ML.btn = null; ML.applyFn = null; ML.active = false;
        setStatus(`MIDI CC${cc} gebonden aan ${ML.label || 'param'}`, 'ok');
        autoSave();
        updateMidiLearnPanel();
        return;
    }

    // Apply to bound params
    window.MIDI_BINDINGS.filter(b => b.cc === cc && b.channel === channel).forEach(b => {
        try { b.applyFn?.(val); } catch(e) {}
    });
}

// Enter learn mode for a parameter
window.midiLearnParam = function(btn, applyFn, label) {
    // Cancel previous learn
    if (ML.active && ML.btn) {
        ML.btn.classList.remove('ml-learning');
        if (ML.btn === btn) { ML.active = false; ML.btn = null; ML.applyFn = null; return; }
    }
    ML.active  = true;
    ML.btn     = btn;
    ML.applyFn = applyFn;
    ML.label   = label;
    btn.classList.add('ml-learning');
    setStatus(`MIDI Learn: beweeg een knop op je controller…`);
};

// Remove a binding
window.removeMidiBinding = function(idx) {
    window.MIDI_BINDINGS.splice(idx, 1);
    updateMidiLearnPanel();
    autoSave();
};

// ── MIDI Learn panel in MIDI Out modal ───────────────────────
window.updateMidiLearnPanel = function() {
    const el = document.getElementById('midiLearnList');
    if (!el) return;
    el.innerHTML = '';
    if (!window.MIDI_BINDINGS.length) {
        el.innerHTML = '<span style="color:var(--muted);font-size:8px">Geen bindingen</span>';
        return;
    }
    window.MIDI_BINDINGS.forEach((b, i) => {
        const row = document.createElement('div');
        row.className = 'ml-binding-row';
        row.innerHTML = `<span>CC${b.cc} ch${b.channel+1}</span>
            <span class="ml-bind-label">${b.label}</span>
            <button class="ml-del-btn" title="Verwijder">×</button>`;
        row.querySelector('.ml-del-btn').addEventListener('click', () => removeMidiBinding(i));
        el.appendChild(row);
    });
};

// ── Create a ML button helper ─────────────────────────────────
window.makeMlBtn = function(applyFn, label) {
    const btn = document.createElement('button');
    btn.className = 'ml-btn';
    btn.title = `MIDI Learn: koppel een hardware controller aan ${label}`;
    btn.textContent = 'ML';
    // Highlight if already bound
    const bound = window.MIDI_BINDINGS.find(b => b.applyFn === applyFn);
    if (bound) btn.classList.add('ml-bound');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!midiAccess) {
            initMidiLearn().then(() => midiLearnParam(btn, applyFn, label));
        } else {
            midiLearnParam(btn, applyFn, label);
        }
    });
    return btn;
};

})();
