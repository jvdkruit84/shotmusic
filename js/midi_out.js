// ── MIDI Output (VST routing via Web MIDI API) ───────────────

var MIDIOUT = window.MIDIOUT = {
    enabled: false,
    access:  null,
    portId:  null,
};

// ── Core send helpers ─────────────────────────────────────────

function midiOutPort() {
    return MIDIOUT.access && MIDIOUT.portId
        ? MIDIOUT.access.outputs.get(MIDIOUT.portId) || null
        : null;
}

function sendMidiNoteOn(channel, note, velocity) {
    if (!MIDIOUT.enabled) return;
    var port = midiOutPort();
    if (!port) return;
    port.send([0x90 | (channel & 0xF), note & 0x7F, Math.max(1, velocity & 0x7F)]);
}

function sendMidiNoteOff(channel, note) {
    if (!MIDIOUT.enabled) return;
    var port = midiOutPort();
    if (!port) return;
    port.send([0x80 | (channel & 0xF), note & 0x7F, 0]);
}

function sendMidiNote(channel, note, velocity, durationMs) {
    sendMidiNoteOn(channel, note, velocity);
    setTimeout(function() { sendMidiNoteOff(channel, note); }, Math.max(10, durationMs));
}

// Expose globals so sequencer/pianoroll can call them without import
window.sendMidiNoteOn  = sendMidiNoteOn;
window.sendMidiNoteOff = sendMidiNoteOff;
window.sendMidiNote    = sendMidiNote;

// ── Init MIDI access ──────────────────────────────────────────

async function initMidiAccess() {
    if (!navigator.requestMIDIAccess) {
        setStatus('Web MIDI niet ondersteund in deze browser (gebruik Chrome/Edge)', 'err');
        return false;
    }
    try {
        MIDIOUT.access = await navigator.requestMIDIAccess({ sysex: false });
        MIDIOUT.access.onstatechange = function() { refreshMidiPortList(); };
        return true;
    } catch (e) {
        setStatus('MIDI toegang geweigerd: ' + (e.message || e), 'err');
        return false;
    }
}

// ── Panel UI ──────────────────────────────────────────────────

var midiOutPanelEl = null;

function toggleMidiOutPanel() {
    if (!midiOutPanelEl) return;
    var open = midiOutPanelEl.classList.toggle('open');
    if (open) {
        if (!MIDIOUT.access) {
            initMidiAccess().then(function(ok) {
                if (ok) buildMidiOutRows();
            });
        } else {
            buildMidiOutRows();
        }
    }
}

function refreshMidiPortList() {
    var sel = document.getElementById('midiOutPortSel');
    if (!sel || !MIDIOUT.access) return;
    var prev = sel.value;
    sel.innerHTML = '<option value="">— Geen poort geselecteerd —</option>';
    MIDIOUT.access.outputs.forEach(function(port) {
        var opt = document.createElement('option');
        opt.value = port.id;
        opt.textContent = port.name;
        if (port.id === prev) opt.selected = true;
        sel.appendChild(opt);
    });
    if (!MIDIOUT.access.outputs.size) {
        sel.innerHTML = '<option value="">Geen MIDI outputs gevonden</option>';
    }
}

function buildMidiOutRows() {
    var body = document.getElementById('midiOutBody');
    if (!body) return;
    body.innerHTML = '';

    refreshMidiPortList();

    SEQ.tracks.forEach(function(track) {
        var def = (typeof TRACK_TYPES !== 'undefined') ? TRACK_TYPES[track.type] : null;

        var row = document.createElement('div');
        row.className = 'midi-out-row';
        row.dataset.uid = track.uid;

        // Color dot
        var dot = document.createElement('span');
        dot.className = 'midi-out-dot';
        dot.style.background = track.color || '#888';

        // Track label
        var lbl = document.createElement('span');
        lbl.className = 'midi-out-label';
        lbl.textContent = track.label;

        // Enable toggle
        var tog = document.createElement('button');
        tog.className = 'midi-out-tog' + (track.midiOut?.enabled ? ' active' : '');
        tog.textContent = track.midiOut?.enabled ? 'MIDI AAN' : 'MIDI UIT';
        tog.addEventListener('click', function() {
            track.midiOut = track.midiOut || {};
            track.midiOut.enabled = !track.midiOut.enabled;
            tog.classList.toggle('active', track.midiOut.enabled);
            tog.textContent = track.midiOut.enabled ? 'MIDI AAN' : 'MIDI UIT';
            if (typeof autoSave === 'function') autoSave();
        });

        // Channel selector (1-16)
        var chLbl = document.createElement('span');
        chLbl.className = 'midi-out-ch-label';
        chLbl.textContent = 'Ch';

        var chSel = document.createElement('select');
        chSel.className = 'midi-out-ch-sel';
        for (var c = 1; c <= 16; c++) {
            var opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c === 10 ? '10 (Drums)' : c;
            if (c === (track.midiOut?.channel || 1)) opt.selected = true;
            chSel.appendChild(opt);
        }
        chSel.addEventListener('change', function() {
            track.midiOut = track.midiOut || {};
            track.midiOut.channel = +this.value;
            if (typeof autoSave === 'function') autoSave();
        });

        // Drum note selector (only for non-melodic tracks)
        var noteEl = null;
        if (!track.melodic) {
            var noteLbl = document.createElement('span');
            noteLbl.className = 'midi-out-ch-label';
            noteLbl.textContent = 'Noot';

            var noteInp = document.createElement('input');
            noteInp.type  = 'number';
            noteInp.min   = 1;
            noteInp.max   = 127;
            noteInp.value = track.midiOut?.drumNote || defaultDrumNote(track);
            noteInp.className = 'midi-out-note-inp';
            noteInp.title = 'GM drum noot (36=Kick, 38=Snare, 42=Hihat)';
            noteInp.addEventListener('change', function() {
                track.midiOut = track.midiOut || {};
                track.midiOut.drumNote = Math.max(1, Math.min(127, +this.value));
                if (typeof autoSave === 'function') autoSave();
            });

            row.append(dot, lbl, tog, chLbl, chSel, noteLbl, noteInp);
        } else {
            row.append(dot, lbl, tog, chLbl, chSel);
        }

        body.appendChild(row);
    });

    if (!SEQ.tracks.length) {
        body.innerHTML = '<p class="midi-out-empty">Geen tracks in project.</p>';
    }
}

function defaultDrumNote(track) {
    var map = { kick: 36, snare: 38, hihat: 42, sample: 38 };
    return map[track.type] || 38;
}

// ── Build the panel element ───────────────────────────────────

function buildMidiOutPanel() {
    var panel = document.createElement('div');
    panel.id = 'midiOutPanel';
    panel.className = 'midi-out-panel';

    // Header row
    var hdr = document.createElement('div');
    hdr.className = 'midi-out-hdr';

    var title = document.createElement('span');
    title.className = 'midi-out-title';
    title.textContent = 'MIDI OUT';

    var portLbl = document.createElement('span');
    portLbl.className = 'midi-out-port-lbl';
    portLbl.textContent = 'Poort:';

    var portSel = document.createElement('select');
    portSel.id = 'midiOutPortSel';
    portSel.className = 'midi-out-port-sel';
    portSel.innerHTML = '<option value="">— Initialiseren… —</option>';
    portSel.addEventListener('change', function() {
        MIDIOUT.portId = this.value || null;
    });

    var enBtn = document.createElement('button');
    enBtn.id = 'midiOutEnBtn';
    enBtn.className = 'midi-out-en-btn' + (MIDIOUT.enabled ? ' active' : '');
    enBtn.textContent = MIDIOUT.enabled ? '● ACTIEF' : '○ INACTIEF';
    enBtn.addEventListener('click', function() {
        if (!MIDIOUT.portId && !MIDIOUT.enabled) {
            setStatus('Selecteer eerst een MIDI poort', 'err');
            return;
        }
        MIDIOUT.enabled = !MIDIOUT.enabled;
        enBtn.classList.toggle('active', MIDIOUT.enabled);
        enBtn.textContent = MIDIOUT.enabled ? '● ACTIEF' : '○ INACTIEF';
        setStatus(MIDIOUT.enabled ? 'MIDI output actief' : 'MIDI output uitgeschakeld', 'ok');
    });

    var closeBtn = document.createElement('button');
    closeBtn.className = 'midi-out-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function() {
        panel.classList.remove('open');
    });

    hdr.append(title, portLbl, portSel, enBtn, closeBtn);
    panel.appendChild(hdr);

    // Track rows body
    var body = document.createElement('div');
    body.id = 'midiOutBody';
    body.className = 'midi-out-body';
    panel.appendChild(body);

    midiOutPanelEl = panel;
    return panel;
}

// ── Save / load ───────────────────────────────────────────────
// midiOut per track is handled in project.js via track.midiOut field.
// Nothing extra needed here — just ensure the field exists on the track object.

// ── Init ──────────────────────────────────────────────────────

(function() {
    function init() {
        // Build and insert panel (between launcher and mixer)
        var panel = buildMidiOutPanel();
        var launcherPanel = document.getElementById('launcherPanel');
        if (launcherPanel && launcherPanel.nextSibling) {
            launcherPanel.parentNode.insertBefore(panel, launcherPanel.nextSibling);
        } else {
            var mixerPanel = document.getElementById('mixerPanel');
            if (mixerPanel) mixerPanel.parentNode.insertBefore(panel, mixerPanel);
            else document.body.appendChild(panel);
        }

        var btn = document.getElementById('btnMidiOut');
        if (btn) {
            btn.addEventListener('click', toggleMidiOutPanel);
        }

        // Rebuild rows when sequencer grid changes (track add/remove)
        var origBuild = window.buildSeqGrid;
        if (typeof origBuild === 'function') {
            window.buildSeqGrid = function() {
                origBuild.apply(this, arguments);
                if (midiOutPanelEl && midiOutPanelEl.classList.contains('open')) {
                    buildMidiOutRows();
                }
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
