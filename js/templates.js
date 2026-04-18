// ── Built-in project templates (Startpacks) ─────────────────

// Helpers to pad 16-step arrays to 32
function d16(s) { return s.concat(Array(16).fill(0)); }
function m16(s) { return s.concat(Array(16).fill(null)); }
function tv() { return Array(32).fill(100); }
function tg() { return Array(32).fill(80); }

function emptyPats() {
    return Object.fromEntries(
        ['B','C','D','E','F','G','H'].map(n => [n, { name: n, data: {} }])
    );
}

function mkTrack(uid, type, label, steps, opts) {
    opts = opts || {};
    return {
        uid, type, label,
        steps,
        vels:  tv(), probs: tv(), gates: tg(),
        lfo:   { enabled: false, target: 'filter', rate: 2, depth: 0.3 },
        mute:  false,
        sidechain: opts.sidechain || false,
        kickType:  opts.kickType  || 'classic',
        hihatType: opts.hihatType || 'closed',
        bassType:  opts.bassType  || 'saw',
        padPreset: 'warm', padMode: 'chord',
        volume: opts.volume || 0,
        pan:    opts.pan    || 0,
        fx: opts.fx || { rev: 0, dly: 0, flt: 20000, dist: 0 },
        fxNodes: null, synth: null, extra: null, howl: null, filename: null,
    };
}

function mkPats(data1) {
    return Object.assign({ A: { name: 'A', data: data1 } }, emptyPats());
}

const BUILTIN_TEMPLATES = [

    // ── 1. Melodic Techno ─────────────────────────────────────
    {
        id: 'melodic_techno',
        name: 'Melodic Techno',
        icon: '◈',
        bpm: 130,
        key: 'A Minor',
        description: 'Dark, driving 4-on-the-floor met melodische accenten en sidechain pump',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 130, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'melodic_techno', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 2, voiceLead: true,
            pianoSound: 'dark_pad', chordPreset: 'dark_pad',
            attack: 1.5, decay: 0.3, sustain: 0.9, release: 4.0,
            detune: 0, chorus: 0.1, reverb: 0.65, reverbDecay: 5,
            delay: 0.2, distortion: 0, filter: 2500,
            chordVolume: -4, chordMute: false,
            sidechain: { enabled: true, depth: 0.75, release: 0.22 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, null,null,45,null, 45,null,null,null, null,45,null,null]), vels: tv(), probs: tv(), gates: tg() },
                5: { steps: m16([null,null,60,null, null,64,null,null, null,62,null,null, 60,null,57,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), { sidechain: true }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), { fx: { rev: 0.12, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1]), { volume: -3 }),
                mkTrack(4, 'bass',   'BASS',   m16([45,null,null,null, null,null,45,null, 45,null,null,null, null,45,null,null])),
                mkTrack(5, 'melody', 'MELODY', m16([null,null,60,null, null,64,null,null, null,62,null,null, 60,null,57,null]), { fx: { rev: 0.3, dly: 0.15, flt: 5000, dist: 0 } }),
            ],
        }
    },

    // ── 2. Synthwave ──────────────────────────────────────────
    {
        id: 'synthwave',
        name: 'Synthwave',
        icon: '▶',
        bpm: 100,
        key: 'A Minor',
        description: 'Retro 80s vibes met neon pads, arpeggiator en retro lead melodie',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 100, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'synthwave', progressionSelect: 'synthwave_classic',
            chordBars: 4, voiceLead: true,
            pianoSound: 'neon_pad', chordPreset: 'neon_pad',
            attack: 0.8, decay: 0.4, sustain: 0.8, release: 3.0,
            detune: 30, chorus: 0.3, reverb: 0.7, reverbDecay: 4,
            delay: 0.35, distortion: 0, filter: 4000,
            chordVolume: -3, chordMute: false,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: true, mode: 'up', rate: '16n', octaves: 2, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, null,null,null,null, 45,null,null,null, 52,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
                5: { steps: m16([null,60,null,null, 64,null,62,null, null,null,60,null, 57,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0])),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), { fx: { rev: 0.2, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0])),
                mkTrack(4, 'bass',   'BASS',   m16([45,null,null,null, null,null,null,null, 45,null,null,null, 52,null,null,null])),
                mkTrack(5, 'melody', 'MELODY', m16([null,60,null,null, 64,null,62,null, null,null,60,null, 57,null,null,null]), { fx: { rev: 0.25, dly: 0.3, flt: 8000, dist: 0.1 } }),
            ],
        }
    },

    // ── 3. Deep House ─────────────────────────────────────────
    {
        id: 'deep_house',
        name: 'Deep House',
        icon: '◉',
        bpm: 122,
        key: 'A Minor',
        description: 'Warm groove met swing, off-beat hihat en dorian bassloop',
        scaleType: 'dorian',
        project: {
            version: 2,
            bpm: 122, steps: 16, swing: 0.12,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'deep_house', progressionSelect: 'i_ii_IV_i',
            chordBars: 4, voiceLead: true,
            pianoSound: 'warm_pad', chordPreset: 'warm_pad',
            attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.5,
            detune: 0, chorus: 0.15, reverb: 0.55, reverbDecay: 4,
            delay: 0.25, distortion: 0, filter: 3500,
            chordVolume: -5, chordMute: false,
            sidechain: { enabled: true, depth: 0.6, release: 0.3 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 6, limThreshold: -1 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,null,null, 47,null,null,null, 48,null,null,null, 45,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
                5: { steps: m16([57,null,null,null, null,null,null,null, 60,null,null,null, null,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]), { sidechain: true }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]), { fx: { rev: 0.15, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1])),
                mkTrack(4, 'bass',   'BASS',   m16([45,null,null,null, 47,null,null,null, 48,null,null,null, 45,null,null,null]), { bassType: 'sub' }),
                mkTrack(5, 'melody', 'MELODY', m16([57,null,null,null, null,null,null,null, 60,null,null,null, null,null,null,null]), { fx: { rev: 0.4, dly: 0.2, flt: 4000, dist: 0 } }),
            ],
        }
    },

    // ── 4. Downtempo ──────────────────────────────────────────
    {
        id: 'downtempo',
        name: 'Downtempo',
        icon: '◌',
        bpm: 85,
        key: 'F Minor',
        description: 'Langzame, dromerige sfeer met veel ruimte, aether pads en melodische klanken',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 85, steps: 16, swing: 0,
            rootNote: 'F', keyMode: 'minor',
            genreSelect: 'downtempo', progressionSelect: 'i_VI_bVII_bVI',
            chordBars: 4, voiceLead: true,
            pianoSound: 'aether', chordPreset: 'aether',
            attack: 2.0, decay: 0.5, sustain: 0.7, release: 5.0,
            detune: 0, chorus: 0.2, reverb: 0.8, reverbDecay: 8,
            delay: 0.4, distortion: 0, filter: 3000,
            chordVolume: -3, chordMute: false,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: false, mode: 'up', rate: '8n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -28, ratio: 3, attack: 0.003, release: 0.3, knee: 8, limThreshold: -1.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([53,null,null,null, null,null,null,null, 48,null,null,null, null,null,null,null]), vels: tv(), probs: tv(), gates: tg() },
                5: { steps: m16([null,null,null,65, null,null,63,null, null,null,null,60, null,null,53,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]), { kickType: 'sub' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0]), { fx: { rev: 0.3, dly: 0, flt: 20000, dist: 0 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]), { hihatType: 'brushed' }),
                mkTrack(4, 'bass',   'BASS',   m16([53,null,null,null, null,null,null,null, 48,null,null,null, null,null,null,null])),
                mkTrack(5, 'melody', 'MELODY', m16([null,null,null,65, null,null,63,null, null,null,null,60, null,null,53,null]), { fx: { rev: 0.6, dly: 0.35, flt: 6000, dist: 0 } }),
            ],
        }
    },

    // ── 5. Drum & Bass ────────────────────────────────────────
    {
        id: 'drum_and_bass',
        name: 'Drum & Bass',
        icon: '▲',
        bpm: 174,
        key: 'A Minor',
        description: 'Snel, energiek breakbeat met rollende bas en scherpe saw lead',
        scaleType: 'minor',
        project: {
            version: 2,
            bpm: 174, steps: 16, swing: 0,
            rootNote: 'A', keyMode: 'minor',
            genreSelect: 'drum_and_bass', progressionSelect: 'i_bVII_bVI_bVII',
            chordBars: 2, voiceLead: true,
            pianoSound: 'saw_lead', chordPreset: 'saw_lead',
            attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.8,
            detune: 0, chorus: 0.1, reverb: 0.3, reverbDecay: 2.5,
            delay: 0.15, distortion: 0.1, filter: 5000,
            chordVolume: -6, chordMute: true,
            sidechain: { enabled: false, depth: 0.7, release: 0.25 },
            arp: { enabled: false, mode: 'up', rate: '16n', octaves: 1, gate: 0.5 },
            master: { compEnabled: true, threshold: -20, ratio: 5, attack: 0.001, release: 0.2, knee: 4, limThreshold: -0.5 },
            currentPattern: 'A',
            patterns: mkPats({
                1: { steps: d16([1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]), vels: tv(), probs: tv(), gates: tg() },
                2: { steps: d16([0,0,0,0, 1,0,0,0, 0,0,0,1, 0,0,1,0]), vels: tv(), probs: tv(), gates: tg() },
                3: { steps: d16([1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1]), vels: tv(), probs: tv(), gates: tg() },
                4: { steps: m16([45,null,45,null, null,45,null,null, 48,null,null,45, null,null,45,null]), vels: tv(), probs: tv(), gates: tg() },
                5: { steps: m16([null,null,64,null, 67,null,null,65, null,64,null,null, 62,null,60,null]), vels: tv(), probs: tv(), gates: tg() },
            }),
            songArrangement: [], songMode: false, progression: [], chordNames: [], scale: [],
            nextUid: 6,
            tracks: [
                mkTrack(1, 'kick',   'KICK',   d16([1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]), { kickType: 'punchy' }),
                mkTrack(2, 'snare',  'SNARE',  d16([0,0,0,0, 1,0,0,0, 0,0,0,1, 0,0,1,0]), { fx: { rev: 0.08, dly: 0, flt: 20000, dist: 0.1 } }),
                mkTrack(3, 'hihat',  'HI-HAT', d16([1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1]), { hihatType: 'crispy' }),
                mkTrack(4, 'bass',   'BASS',   m16([45,null,45,null, null,45,null,null, 48,null,null,45, null,null,45,null]), { bassType: 'growl', fx: { rev: 0, dly: 0, flt: 1800, dist: 0.15 } }),
                mkTrack(5, 'melody', 'MELODY', m16([null,null,64,null, 67,null,null,65, null,64,null,null, 62,null,60,null]), { fx: { rev: 0.15, dly: 0.1, flt: 7000, dist: 0.05 } }),
            ],
        }
    },
];

// ── Template Modal UI ────────────────────────────────────────

function openTemplateModal() {
    document.getElementById('templateModal').classList.add('open');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('open');
}

async function loadTemplate(tpl) {
    closeTemplateModal();
    // Set scale type before loading (loadProjectData doesn't handle it)
    const scaleEl = document.getElementById('scaleType');
    if (scaleEl && tpl.scaleType) scaleEl.value = tpl.scaleType;
    await loadProjectData(tpl.project);
    await loadProgression();
    await loadScale();
    setStatus('Template geladen: ' + tpl.name, 'ok');
}

function buildTemplateModal() {
    if (document.getElementById('templateModal')) return;

    const modal = document.createElement('div');
    modal.id = 'templateModal';
    modal.className = 'tmpl-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'tmpl-backdrop';
    backdrop.addEventListener('click', closeTemplateModal);

    const dialog = document.createElement('div');
    dialog.className = 'tmpl-dialog';

    const header = document.createElement('div');
    header.className = 'tmpl-header';
    header.innerHTML =
        '<span class="tmpl-title">Startpacks</span>' +
        '<span class="tmpl-subtitle">Kies een genre om direct mee aan de slag te gaan</span>' +
        '<button class="tmpl-close" id="tmplClose">×</button>';

    const grid = document.createElement('div');
    grid.className = 'tmpl-grid';

    BUILTIN_TEMPLATES.forEach(function(tpl) {
        const card = document.createElement('div');
        card.className = 'tmpl-card';
        card.innerHTML =
            '<div class="tmpl-icon">' + tpl.icon + '</div>' +
            '<div class="tmpl-name">' + tpl.name + '</div>' +
            '<div class="tmpl-tags">' +
                '<span class="tmpl-tag">' + tpl.bpm + ' BPM</span>' +
                '<span class="tmpl-tag">' + tpl.key + '</span>' +
            '</div>' +
            '<div class="tmpl-desc">' + tpl.description + '</div>' +
            '<button class="tmpl-load-btn">Laden</button>';
        card.querySelector('.tmpl-load-btn').addEventListener('click', function() {
            loadTemplate(tpl);
        });
        grid.appendChild(card);
    });

    dialog.appendChild(header);
    dialog.appendChild(grid);
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    document.getElementById('tmplClose').addEventListener('click', closeTemplateModal);
}

// Init
(function() {
    function init() {
        buildTemplateModal();
        var btn = document.getElementById('btnTemplates');
        if (btn) btn.addEventListener('click', openTemplateModal);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
