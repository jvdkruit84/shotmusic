// ── MIDI File Import ─────────────────────────────────────────
// Parses .mid files and creates piano roll tracks in the project.
// No external dependencies — pure binary SMF parser.

(function() {

// ── SMF Binary Parser ─────────────────────────────────────────

function readVarLen(view, pos) {
    var val = 0, b, count = 0;
    do {
        b = view.getUint8(pos.i++);
        val = (val << 7) | (b & 0x7F);
        if (++count > 4) break;
    } while (b & 0x80);
    return val;
}

function parseMidi(buffer) {
    var view = new DataView(buffer);
    var pos  = { i: 0 };

    function r8()  { return view.getUint8(pos.i++); }
    function r16() { var v = view.getUint16(pos.i); pos.i += 2; return v; }
    function r32() { var v = view.getUint32(pos.i); pos.i += 4; return v; }

    // Header chunk: MThd
    r32(); // chunk type 'MThd'
    r32(); // chunk length = 6
    var format     = r16();
    var numTracks  = r16();
    var ppq        = r16() & 0x7FFF; // mask off SMPTE bit

    var tempoEvents = []; // {tick, usPerBeat}
    var parsedTracks = [];

    for (var t = 0; t < numTracks; t++) {
        r32(); // 'MTrk'
        var trackLen = r32();
        var trackEnd = pos.i + trackLen;

        var notes    = [];
        var active   = {}; // key: note*16+channel → {startTick, vel}
        var tick     = 0;
        var lastSt   = 0;
        var trkName  = '';

        while (pos.i < trackEnd) {
            tick += readVarLen(view, pos);

            var st = r8();
            if (st < 0x80) { pos.i--; st = lastSt; } else { lastSt = st; }

            var type = st & 0xF0;
            var ch   = st & 0x0F;

            if (type === 0x90) {                 // Note On
                var note = r8(), vel = r8();
                var key  = note * 16 + ch;
                if (vel > 0) {
                    active[key] = { startTick: tick, vel: vel };
                } else if (active[key]) {        // vel=0 → Note Off
                    notes.push({ midi: note, ch: ch,
                        startTick: active[key].startTick,
                        durTicks:  tick - active[key].startTick,
                        velocity:  active[key].vel / 127 });
                    delete active[key];
                }
            } else if (type === 0x80) {          // Note Off
                var note2 = r8(); r8();
                var key2  = note2 * 16 + ch;
                if (active[key2]) {
                    notes.push({ midi: note2, ch: ch,
                        startTick: active[key2].startTick,
                        durTicks:  tick - active[key2].startTick,
                        velocity:  active[key2].vel / 127 });
                    delete active[key2];
                }
            } else if (type === 0xA0) { r8(); r8(); }  // Poly aftertouch
            else if (type === 0xB0) { r8(); r8(); }    // CC
            else if (type === 0xC0) { r8(); }          // Program change
            else if (type === 0xD0) { r8(); }          // Channel pressure
            else if (type === 0xE0) { r8(); r8(); }    // Pitch bend

            else if (st === 0xFF) {              // Meta event
                var meta = r8();
                var mLen = readVarLen(view, pos);
                var mEnd = pos.i + mLen;

                if (meta === 0x03) {             // Track name
                    var chars = [];
                    for (var c = 0; c < mLen; c++) chars.push(r8());
                    trkName = chars.map(function(x){return String.fromCharCode(x);}).join('');
                    pos.i = mEnd;
                } else if (meta === 0x51) {      // Set Tempo
                    var usb = (r8() << 16) | (r8() << 8) | r8();
                    tempoEvents.push({ tick: tick, usPerBeat: usb });
                    pos.i = mEnd;
                } else {
                    pos.i = mEnd;               // Skip other meta
                }
            } else if (st === 0xF0 || st === 0xF7) {  // SysEx
                var sLen = readVarLen(view, pos);
                pos.i += sLen;
            }
        }
        pos.i = trackEnd;

        // Resolve any still-active notes (file truncated or missing Note Off)
        Object.keys(active).forEach(function(k) {
            var a = active[k];
            var n = parseInt(k) >> 4, chn = parseInt(k) & 0xF;
            notes.push({ midi: n, ch: chn, startTick: a.startTick,
                durTicks: Math.round(ppq * 0.5), velocity: a.vel / 127 });
        });

        if (notes.length > 0 || trkName) {
            parsedTracks.push({ name: trkName, notes: notes });
        }
    }

    // Collapse tempo; use first found or default 120 BPM
    var firstTempo = tempoEvents[0] ? tempoEvents[0].usPerBeat : 500000;
    var bpm = Math.round(60000000 / firstTempo);

    // For Format 0: split by channel
    if (format === 0 && parsedTracks.length === 1) {
        parsedTracks = splitByChannel(parsedTracks[0].notes, ppq);
    }

    return { ppq: ppq, bpm: bpm, tracks: parsedTracks };
}

// Split format-0 notes by MIDI channel into separate logical tracks
function splitByChannel(notes, ppq) {
    var byChannel = {};
    notes.forEach(function(n) {
        if (!byChannel[n.ch]) byChannel[n.ch] = [];
        byChannel[n.ch].push(n);
    });
    return Object.keys(byChannel).map(function(ch) {
        return { name: ch == 9 ? 'Drums' : 'Ch ' + (+ch + 1), notes: byChannel[ch] };
    });
}

// ── Track analysis helpers ────────────────────────────────────

function isDrumTrack(mTrack) {
    // Channel 9 (0-indexed) = MIDI drums
    var drumCount = mTrack.notes.filter(function(n){ return n.ch === 9; }).length;
    return drumCount > mTrack.notes.length * 0.5;
}

function detectType(mTrack) {
    if (isDrumTrack(mTrack)) return 'drum';
    var avg = mTrack.notes.reduce(function(s,n){return s+n.midi;},0) / mTrack.notes.length;
    return avg < 52 ? 'bass' : 'melody';
}

function beatCount(mTrack, ppq) {
    var max = 0;
    mTrack.notes.forEach(function(n) {
        var end = (n.startTick + n.durTicks) / ppq;
        if (end > max) max = end;
    });
    return max;
}

// ── Import Dialog ─────────────────────────────────────────────

var importModal = null;

function openImportDialog(filename, parsed) {
    closeImportDialog();

    var modal = document.createElement('div');
    modal.className = 'midi-import-modal';
    importModal = modal;

    var dialog = document.createElement('div');
    dialog.className = 'midi-import-dialog';

    // Header
    var h = document.createElement('div');
    h.className = 'midi-import-header';
    h.innerHTML = '<span class="midi-import-title">MIDI Import</span>' +
        '<span class="midi-import-file">' + escHtml(filename) + '</span>' +
        '<button class="midi-import-close" id="midiImportClose">×</button>';
    dialog.appendChild(h);

    // BPM row
    var bpmRow = document.createElement('div');
    bpmRow.className = 'midi-import-row';
    bpmRow.innerHTML =
        '<label class="midi-import-bpm-label">BPM in bestand: <strong>' + parsed.bpm + '</strong></label>' +
        '<label class="midi-import-check"><input type="checkbox" id="miUseBpm" checked> Overnemen als project BPM</label>';
    dialog.appendChild(bpmRow);

    // Mode row
    var modeRow = document.createElement('div');
    modeRow.className = 'midi-import-row';
    modeRow.innerHTML =
        '<label class="midi-import-check"><input type="radio" name="miMode" value="add" checked> Toevoegen aan project</label>' +
        '<label class="midi-import-check" style="margin-left:14px"><input type="radio" name="miMode" value="replace"> Huidige tracks vervangen</label>';
    dialog.appendChild(modeRow);

    // Track list
    var listWrap = document.createElement('div');
    listWrap.className = 'midi-import-list';

    var trackItems = [];
    parsed.tracks.forEach(function(mTrack, i) {
        if (!mTrack.notes.length) return;
        var type = detectType(mTrack);
        var beats = beatCount(mTrack, parsed.ppq);
        var bars  = Math.max(4, Math.ceil(beats / 4));

        var item = document.createElement('label');
        item.className = 'midi-import-track' + (type === 'drum' ? ' midi-import-drum' : '');
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = type !== 'drum';
        chk.dataset.idx = i;

        var info = document.createElement('span');
        info.className = 'midi-import-track-info';

        var nameEl = document.createElement('span');
        nameEl.className = 'midi-import-track-name';
        nameEl.textContent = mTrack.name || ('Track ' + (i + 1));

        var meta = document.createElement('span');
        meta.className = 'midi-import-track-meta';
        meta.textContent = mTrack.notes.length + ' noten · ' + bars + ' maten · ' +
            (type === 'drum' ? 'Drums (overgeslagen)' : type === 'bass' ? 'Bass' : 'Melody');

        info.appendChild(nameEl);
        info.appendChild(meta);
        item.appendChild(chk);
        item.appendChild(info);
        listWrap.appendChild(item);
        trackItems.push({ chk: chk, mTrack: mTrack, type: type, beats: beats });
    });

    if (!trackItems.length) {
        listWrap.innerHTML = '<p class="midi-import-empty">Geen tracks met noten gevonden.</p>';
    }
    dialog.appendChild(listWrap);

    // Footer
    var foot = document.createElement('div');
    foot.className = 'midi-import-footer';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sec';
    cancelBtn.textContent = 'Annuleren';
    cancelBtn.addEventListener('click', closeImportDialog);

    var importBtn = document.createElement('button');
    importBtn.className = 'btn btn-save';
    importBtn.textContent = 'Importeren';
    importBtn.addEventListener('click', function() {
        var selected = trackItems.filter(function(it){ return it.chk.checked; });
        if (!selected.length) { setStatus('Geen tracks geselecteerd','err'); return; }
        var useBpm  = document.getElementById('miUseBpm').checked;
        var mode    = document.querySelector('input[name="miMode"]:checked').value;
        doImport(parsed, selected, { useBpm: useBpm, replace: mode === 'replace' });
        closeImportDialog();
    });

    foot.appendChild(cancelBtn);
    foot.appendChild(importBtn);
    dialog.appendChild(foot);

    modal.appendChild(dialog);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeImportDialog(); });
    document.body.appendChild(modal);

    document.getElementById('midiImportClose').addEventListener('click', closeImportDialog);
}

function closeImportDialog() {
    if (importModal) { importModal.remove(); importModal = null; }
}

function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Do the actual import ──────────────────────────────────────

function doImport(parsed, selected, opts) {
    // Optionally remove existing tracks
    if (opts.replace) {
        SEQ.tracks.forEach(function(t) {
            try { t.synth?.dispose(); } catch(e) {}
            try { t.part?.dispose();  } catch(e) {}
        });
        SEQ.tracks = [];
    }

    // Optionally update BPM
    if (opts.useBpm && parsed.bpm >= 40 && parsed.bpm <= 300) {
        var bpmInput = document.getElementById('bpmInput') || document.getElementById('seqBpm');
        if (bpmInput) {
            bpmInput.value = parsed.bpm;
            bpmInput.dispatchEvent(new Event('input'));
        }
        Tone.getTransport().bpm.value = parsed.bpm;
    }

    var importedCount = 0;

    selected.forEach(function(it) {
        var mTrack = it.mTrack;
        var type   = it.type === 'drum' ? 'melody' : it.type; // fallback

        var track  = makeTrack(type);
        var rawName = (mTrack.name || '').trim().toUpperCase().slice(0, 14);
        if (rawName) track.label = rawName;

        var noteId = 1;
        var maxBeat = 0;

        track.pianoRoll = mTrack.notes.map(function(n) {
            var start = n.startTick / parsed.ppq;
            var dur   = Math.max(0.125, n.durTicks / parsed.ppq);
            var end   = start + dur;
            if (end > maxBeat) maxBeat = end;
            return { id: noteId++, note: n.midi, start: start, dur: dur,
                     vel: Math.max(1, Math.round(n.velocity * 127)) };
        });

        track.editMode      = 'pianoroll';
        track.pianoRollBars = Math.max(4, Math.ceil(maxBeat / 4));

        SEQ.tracks.push(track);
        importedCount++;
    });

    // Rebuild audio for new tracks if audio is ready
    if (S.audioReady) {
        SEQ.tracks.forEach(function(t) {
            if (!t.synth) buildTrackSynth(t);
        });
    }

    buildSeqGrid();
    if (typeof refreshLauncherAll === 'function') refreshLauncherAll();
    if (typeof autoSave === 'function') autoSave();
    setStatus(importedCount + ' MIDI track(s) geïmporteerd ✓', 'ok');
}

// ── File input handler ────────────────────────────────────────

function handleMidiFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var parsed = parseMidi(e.target.result);
            openImportDialog(file.name, parsed);
        } catch (err) {
            console.error('MIDI parse error:', err);
            setStatus('MIDI import mislukt: ' + (err.message || err), 'err');
        }
    };
    reader.onerror = function() { setStatus('Kon bestand niet lezen', 'err'); };
    reader.readAsArrayBuffer(file);
}

// ── Init ──────────────────────────────────────────────────────

function init() {
    var btn   = document.getElementById('btnMidiImport');
    var input = document.getElementById('midiImportInput');
    if (!btn || !input) return;

    btn.addEventListener('click', function() { input.click(); });

    input.addEventListener('change', function(e) {
        var f = e.target.files[0];
        if (f) handleMidiFile(f);
        input.value = '';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
