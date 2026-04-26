// ── Arpeggiator ────────────────────────────────────────────

function getArpNotes() {
    const base = (S.progression[S.currentChord] ?? []).slice().sort((a,b)=>a-b);
    if (!base.length) return [];
    let notes = [...base];
    for (let o = 1; o < ARP.octaves; o++) {
        notes = notes.concat(base.map(n => n + 12 * o));
    }
    return notes;
}

function buildArpLoop() {
    arpLoop?.dispose(); arpLoop = null;
    if (!ARP.enabled) return;

    let idx = 0;
    let dir = 1; // for updown mode

    // Pre-compute outside the callback — Tone.Time() inside a scheduled
    // callback triggers Tone.js's "accurate timing" warning (Debug.ts:95).
    const rateSec = Tone.Time(ARP.rate).toSeconds();

    arpLoop = new Tone.Sequence((time) => {
        if (S.chordMute) return;
        const notes = getArpNotes();
        if (!notes.length) return;

        let note;
        const len = notes.length;

        if (ARP.mode === 'up') {
            note = notes[idx % len];
            idx = (idx + 1) % len;
        } else if (ARP.mode === 'down') {
            note = notes[len - 1 - (idx % len)];
            idx = (idx + 1) % len;
        } else if (ARP.mode === 'updown') {
            note = notes[idx];
            idx += dir;
            if (idx >= len)      { idx = len - 2; dir = -1; }
            else if (idx < 0)    { idx = 1;       dir =  1; }
        } else { // random
            note = notes[Math.floor(Math.random() * len)];
        }

        const dur = Math.max(0.02, rateSec * ARP.gate);
        chordSynth?.triggerAttackRelease(midiFreq(note), dur, time);

        // Highlight piano key
        Tone.Draw.schedule(() => {
            document.querySelectorAll('.piano .key.arp-lit').forEach(k => k.classList.remove('arp-lit'));
            document.querySelector(`.piano .key[data-midi="${note}"]`)?.classList.add('arp-lit');
        }, time);
    }, [0], ARP.rate);

    arpLoop.start(0);
}

function stopArpLoop() {
    arpLoop?.dispose(); arpLoop = null;
    document.querySelectorAll('.piano .key.arp-lit').forEach(k => k.classList.remove('arp-lit'));
}

// ── Arp UI wiring ──────────────────────────────────────────
function initArpUI() {
    const toggle = document.getElementById('arpToggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        ARP.enabled = !ARP.enabled;
        toggle.classList.toggle('active', ARP.enabled);
        document.getElementById('arpControls').classList.toggle('hidden', !ARP.enabled);
        if (S.isPlaying) {
            if (ARP.enabled) buildArpLoop();
            else stopArpLoop();
        }
        autoSave();
    });

    document.getElementById('arpMode').addEventListener('change', function () {
        ARP.mode = this.value;
        if (S.isPlaying && ARP.enabled) buildArpLoop();
        autoSave();
    });

    document.getElementById('arpRate').addEventListener('change', function () {
        ARP.rate = this.value;
        if (S.isPlaying && ARP.enabled) buildArpLoop();
        autoSave();
    });

    document.getElementById('arpOctaves').addEventListener('change', function () {
        ARP.octaves = +this.value;
        autoSave();
    });

    document.getElementById('arpGate').addEventListener('input', function () {
        ARP.gate = +this.value;
        document.getElementById('arpGateVal').textContent = Math.round(this.value * 100) + '%';
        autoSave();
    });
}
