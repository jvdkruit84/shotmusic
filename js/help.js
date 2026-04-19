// ── Help Modal ────────────────────────────────────────────────

(function () {

var HELP_SECTIONS = [
    {
        id: 'start',
        title: 'Aan de slag',
        icon: '◈',
        content: `
<h3>Welkom bij ShotMusic Studio</h3>
<p>ShotMusic is een complete browser-based DAW. Geen installatie nodig — alles draait in Chrome of Edge.</p>

<h4>Eerste stappen</h4>
<ol>
  <li>Kies een <strong>Startpack</strong> (✦ Starters) om direct met een genre te beginnen, of bouw je eigen project op.</li>
  <li>Druk op <strong>▶ Play</strong> om af te spelen. De browser vraagt één keer toestemming voor audio.</li>
  <li>Voeg tracks toe via <strong>+ Track toevoegen</strong> onderaan de sequencer.</li>
  <li>Sla op met <strong>💾 Opslaan</strong> (JSON-bestand) of gebruik <em>auto-save</em> in localStorage.</li>
</ol>

<h4>Ondersteunde browsers</h4>
<p>Chrome of Edge aanbevolen. Firefox ondersteunt geen Web MIDI. Safari heeft beperkte Web Audio mogelijkheden.</p>
`
    },
    {
        id: 'transport',
        title: 'Transport & BPM',
        icon: '▶',
        content: `
<h3>Transport & BPM</h3>
<table>
  <tr><td>▶ Play</td><td>Start afspelen</td></tr>
  <tr><td>■ Stop</td><td>Stop en zet terug naar het begin</td></tr>
  <tr><td>● REC</td><td>Opname via MIDI keyboard of computerkeyboard</td></tr>
  <tr><td>BPM veld</td><td>Typ een waarde of scroll om BPM aan te passen (40–300)</td></tr>
  <tr><td>Swing</td><td>Voegt swing toe aan de 16th-note grid (0–1)</td></tr>
  <tr><td>Steps</td><td>Patroonlengte: 16 of 32 stappen</td></tr>
</table>

<h4>Sneltoetsen</h4>
<table>
  <tr><td><kbd>Spatie</kbd></td><td>Play / Stop</td></tr>
  <tr><td><kbd>Ctrl+Z</kbd></td><td>Ongedaan maken</td></tr>
  <tr><td><kbd>Ctrl+Y</kbd></td><td>Opnieuw</td></tr>
</table>
`
    },
    {
        id: 'sequencer',
        title: 'Step Sequencer',
        icon: '⊞',
        content: `
<h3>Step Sequencer</h3>
<p>Elke track heeft 16 of 32 stappen. Klik een stap aan om hem in te schakelen.</p>

<h4>Stap eigenschappen</h4>
<p>Rechtsklik een stap voor een context-menu met:</p>
<ul>
  <li><strong>Velocity</strong> — hoe hard de noot klinkt (1–127)</li>
  <li><strong>Probabiliteit</strong> — kans dat de stap afspeelt (0–100%)</li>
  <li><strong>Gate</strong> — hoe lang de noot klinkt als percentage van de stap</li>
</ul>

<h4>Patroon bewerkingen (DEFAULT / CLEAR / RANDOM)</h4>
<ul>
  <li><strong>DEFAULT</strong> — laadt het standaardpatroon voor dit track-type</li>
  <li><strong>CLEAR</strong> — wist alle stappen</li>
  <li><strong>RANDOM</strong> — genereert een willekeurig patroon</li>
</ul>

<h4>Track-knoppen</h4>
<table>
  <tr><td><strong>M</strong></td><td>Mute — stil deze track</td></tr>
  <tr><td><strong>FX</strong></td><td>Effecten — reverb, delay, filter, distortion, LFO</td></tr>
  <tr><td><strong>E</strong></td><td>Euclidisch ritme — genereer ritmische patronen wiskundig</td></tr>
  <tr><td><strong>SC</strong></td><td>Sidechain — koppelt volume aan de kick voor pump-effect</td></tr>
  <tr><td><strong>PR</strong></td><td>Piano Roll — open de piano roll editor (alleen melodische tracks)</td></tr>
</table>

<h4>Tracks herschikken</h4>
<p>Sleep de <strong>⠿</strong> greep aan de linkerkant om tracks van volgorde te wisselen.</p>
`
    },
    {
        id: 'pianoroll',
        title: 'Piano Roll',
        icon: '♩',
        content: `
<h3>Piano Roll</h3>
<p>De piano roll is beschikbaar voor melodische tracks (Bass, Melody, Pad). Klik op <strong>PR</strong> om hem te openen.</p>

<h4>Noten plaatsen en bewerken</h4>
<table>
  <tr><td>Klik op leeg canvas</td><td>Nieuwe noot plaatsen</td></tr>
  <tr><td>Sleep noot</td><td>Noot verplaatsen</td></tr>
  <tr><td>Sleep rechterrand</td><td>Nootlengte aanpassen</td></tr>
  <tr><td>Rechts-klik noot</td><td>Noot verwijderen</td></tr>
  <tr><td>Scroll</td><td>Omhoog/omlaag door toonhoogtes</td></tr>
  <tr><td>Ctrl+Scroll</td><td>Horizontaal zoomen</td></tr>
  <tr><td><kbd>Delete</kbd></td><td>Geselecteerde noten verwijderen</td></tr>
  <tr><td><kbd>Ctrl+A</kbd></td><td>Alle noten selecteren</td></tr>
</table>

<h4>Generator</h4>
<p>Klik op <strong>✦ GEN</strong> in de piano roll voor automatische melodiegeneratie op basis van de huidige toonladder en akkoordprogressie. Kies het ritme-, contour- en motief-patroon en druk op <strong>Genereer</strong>.</p>

<h4>Bars en zoom</h4>
<p>Stel het aantal bars in (1, 2, 4 of 8) met de knoppen bovenaan. De piano roll loopt in een lus over dit aantal bars.</p>

<h4>Steps ↔ Piano Roll</h4>
<p>Dubbelklik op de <strong>PR</strong> knop om te wisselen tussen stap-modus en piano roll modus. In stap-modus gebruikt de track de 16/32-step grid; in piano roll modus speelt de Tone.Part.</p>
`
    },
    {
        id: 'synth',
        title: 'Synthesizer & FX',
        icon: '◎',
        content: `
<h3>Synthesizer & Effecten</h3>

<h4>Track types en synths</h4>
<table>
  <tr><td><strong>Kick</strong></td><td>Sinusgolf met pitch-decay. Presets: Classic, Punchy, 808, Sub, Tight, Distorted, Acoustic</td></tr>
  <tr><td><strong>Snare</strong></td><td>Noise synth met toonhoogte-component</td></tr>
  <tr><td><strong>Hi-Hat</strong></td><td>Gefilterd ruis. Presets: Closed, Open, Pedal, Crispy, Vinyl, Brushed</td></tr>
  <tr><td><strong>Bass</strong></td><td>Oscillator met filter-envelope. Presets: Saw, Sub, Punchy, 808, Pluck, FM, Growl, Reese, Moog, Acid, Electric, Stab, Liquid, Rubber, Wobble, Vintage, Atari</td></tr>
  <tr><td><strong>Melody</strong></td><td>Polyfone synth. Kies golfvorm via FX-paneel</td></tr>
  <tr><td><strong>Pad</strong></td><td>Langzame attack, brede sound. Presets: Warm, Lush, Dark, Aether, Strings, Glass, Choir</td></tr>
  <tr><td><strong>Sample</strong></td><td>Sleep een audiobestand op de track of klik de dropzone</td></tr>
</table>

<h4>Effecten per track (FX knop)</h4>
<table>
  <tr><td><strong>Reverb</strong></td><td>Ruimtelijkheid (0–1)</td></tr>
  <tr><td><strong>Delay</strong></td><td>Echo (0–1)</td></tr>
  <tr><td><strong>Filter</strong></td><td>Low-pass filter frequentie (200 Hz – 20 kHz)</td></tr>
  <tr><td><strong>Distortion</strong></td><td>Overdrive (0–1)</td></tr>
  <tr><td><strong>LFO</strong></td><td>Moduleer filter, volume of pan met een oscillator</td></tr>
</table>
`
    },
    {
        id: 'mixer',
        title: 'Mixer',
        icon: '⊟',
        content: `
<h3>Mixer</h3>
<p>Klik op <strong>⊞ Mixer</strong> in de transport balk om de mixer te openen.</p>

<h4>Per kanaal</h4>
<ul>
  <li><strong>Volume fader</strong> — sleep verticaal om het volume aan te passen</li>
  <li><strong>Pan knop</strong> — links/rechts in het stereobeeld</li>
  <li><strong>M</strong> — mute dit kanaal</li>
  <li><strong>S</strong> — solo: demp alle andere kanalen</li>
</ul>

<h4>VU meter</h4>
<p>Elke kanaalmeter toont het huidige niveau in real-time. Rood = clipping (te hard).</p>

<h4>Master sectie</h4>
<p>De master compressor en limiter zijn instelbaar via het Master-paneel (tandwiel icoon).</p>
`
    },
    {
        id: 'launcher',
        title: 'Clip Launcher',
        icon: '⊟',
        content: `
<h3>Clip Launcher (Performance Mode)</h3>
<p>Geïnspireerd op de Roland MC-505 en Ableton Session View. Open met <strong>⊟ Launch</strong>.</p>

<h4>Hoe het werkt</h4>
<p>Elke kolom is een patroon (A–H), elke rij is een track. Je kunt tracks onafhankelijk van elkaar naar een ander patroon switchen — perfect voor live performance.</p>

<h4>Cel-states</h4>
<table>
  <tr><td>Donker</td><td>Patroon heeft geen data</td></tr>
  <tr><td>Gedimd gekleurd</td><td>Patroon heeft data maar speelt niet</td></tr>
  <tr><td>Vol gekleurd</td><td>Dit patroon speelt nu</td></tr>
  <tr><td>Oranje glow</td><td>In wachtrij — wacht op volgende bar boundary</td></tr>
</table>

<h4>Bediening</h4>
<table>
  <tr><td>Klik cel</td><td>Zet dit patroon in de wachtrij voor die track (switcht op volgende bar)</td></tr>
  <tr><td>Shift+klik</td><td>Wissel direct (zonder te wachten op bar boundary)</td></tr>
  <tr><td>Klik actieve cel</td><td>Mute/unmute die track</td></tr>
  <tr><td>Alle → X knoppen</td><td>Wissel alle tracks tegelijk naar patroon X</td></tr>
</table>

<h4>Performance Mode aan/uit</h4>
<p>Zet <strong>Performance Mode</strong> aan in het launcher-paneel. Als het uit staat, gedraagt alles zich als normaal en is de Clip Launcher alleen een visueel overzicht.</p>
`
    },
    {
        id: 'midi_import',
        title: 'MIDI Import',
        icon: '↑',
        content: `
<h3>MIDI Import</h3>
<p>Importeer een standaard MIDI-bestand (.mid) als piano roll tracks. Klik op <strong>↑ MIDI</strong> in de transport balk.</p>

<h4>Import opties</h4>
<ul>
  <li><strong>BPM overnemen</strong> — past het project-BPM aan naar het MIDI-bestand</li>
  <li><strong>Toevoegen / Vervangen</strong> — voeg tracks toe aan het bestaande project of wis alles en begin opnieuw</li>
  <li><strong>Track selectie</strong> — vink aan welke MIDI-tracks je wil importeren. Drumtracks (kanaal 10) worden automatisch uitgevinkt</li>
</ul>

<h4>Gedetecteerde track types</h4>
<p>Tracks met een gemiddelde noot onder MIDI 52 worden als <strong>Bass</strong> geïmporteerd, anders als <strong>Melody</strong>. Na het importeren kun je het track-type handmatig aanpassen.</p>

<h4>Formaten</h4>
<p>Ondersteunt MIDI Format 0 (alle kanalen in één track) en Format 1 (één track per instrument). Format 2 wordt niet ondersteund.</p>
`
    },
    {
        id: 'midi_export',
        title: 'MIDI Export',
        icon: '↓',
        content: `
<h3>MIDI Export</h3>
<p>Exporteer het huidige project als standaard MIDI-bestand. Klik op <strong>↓ MIDI</strong>.</p>

<h4>Wat wordt geëxporteerd</h4>
<ul>
  <li>Alle tracks in stap-modus: stappen worden omgezet naar MIDI-noten</li>
  <li>Piano roll tracks: noten worden 1-op-1 geëxporteerd</li>
  <li>Drumtracks: noten op MIDI kanaal 10 met GM drum mapping</li>
  <li>BPM als tempo-event in de MIDI header</li>
</ul>
`
    },
    {
        id: 'vst',
        title: 'VST Routing',
        icon: '⊙',
        content: `
<h3>VST Routing via Web MIDI</h3>
<p>ShotMusic kan MIDI sturen naar externe VST plugins via een virtuele MIDI poort. Klik op <strong>⊙ VST</strong> in de transport balk.</p>

<h4>Stap 1 — Virtuele MIDI poort instellen</h4>
<ul>
  <li><strong>Windows:</strong> installeer <a href="https://www.tobias-erichsen.de/software/loopmidi.html" target="_blank">loopMIDI</a> (gratis) en maak een poort aan</li>
  <li><strong>Mac:</strong> open <em>Audio MIDI Setup</em> → venster MIDI Studio → dubbelklik IAC Driver → vink "Apparaat is online" aan</li>
  <li><strong>Linux:</strong> gebruik JACK of <code>a2jmidid</code> voor ALSA-naar-JACK MIDI routing</li>
</ul>

<h4>Stap 2 — DAW/VST host instellen</h4>
<ol>
  <li>Open je DAW (Ableton, FL Studio, Reaper, …)</li>
  <li>Maak een MIDI track aan en stel de input in op de virtuele MIDI poort</li>
  <li>Laad een VST plugin op die track</li>
  <li>Stel per track een ander MIDI kanaal in zodat ze naar verschillende VSTs gaan</li>
</ol>

<h4>Stap 3 — ShotMusic instellen</h4>
<ol>
  <li>Klik <strong>⊙ VST</strong> → selecteer de virtuele poort in de dropdown</li>
  <li>Klik <strong>ACTIEF</strong> om MIDI output in te schakelen</li>
  <li>Zet per track <strong>MIDI AAN</strong> en stel het gewenste kanaal in (1–16)</li>
  <li>Voor drumtracks: stel de <strong>Noot</strong> in (36 = GM Kick, 38 = Snare, 42 = Hihat)</li>
</ol>

<h4>Tijdens afspelen</h4>
<p>ShotMusic stuurt MIDI noten synchroon mee met het interne audio. De ingebouwde synths spelen gewoon door — je kunt ze muteen als je alleen het VST-geluid wil horen.</p>

<h4>Aanbevolen kanaalindeling</h4>
<table>
  <tr><td>Kanaal 1</td><td>Kick</td></tr>
  <tr><td>Kanaal 2</td><td>Bass</td></tr>
  <tr><td>Kanaal 3</td><td>Melody</td></tr>
  <tr><td>Kanaal 4</td><td>Pad</td></tr>
  <tr><td>Kanaal 10</td><td>Drums (GM standaard)</td></tr>
</table>
`
    },
    {
        id: 'templates',
        title: 'Startpacks',
        icon: '✦',
        content: `
<h3>Startpacks (Templates)</h3>
<p>Startpacks zijn voorgebouwde projecten per genre. Open ze via <strong>✦ Starters</strong>.</p>

<h4>Beschikbare genres</h4>
<table>
  <tr><td><strong>Melodic Techno</strong></td><td>130 BPM · A minor · sidechain pump · donkere melodie</td></tr>
  <tr><td><strong>Synthwave</strong></td><td>100 BPM · A minor · retro pads · arpeggiator</td></tr>
  <tr><td><strong>Deep House</strong></td><td>122 BPM · A dorian · swing · jazzy akkoorden</td></tr>
  <tr><td><strong>Downtempo</strong></td><td>85 BPM · F minor · cinematisch · aether pads</td></tr>
  <tr><td><strong>Drum & Bass</strong></td><td>174 BPM · A minor · breakbeat · growl bas</td></tr>
  <tr><td><strong>Acid House</strong></td><td>130 BPM · C minor · 303 zuurbaslijn</td></tr>
  <tr><td><strong>Minimal Techno</strong></td><td>132 BPM · D minor · hypnotisch · spaarzaam</td></tr>
  <tr><td><strong>Trance</strong></td><td>138 BPM · A minor · opzwepende lead · lush pads</td></tr>
</table>

<h4>Elk startpack bevat</h4>
<ul>
  <li>Drumpatronen per track (kick, snare, hi-hat)</li>
  <li>Basslijn in stap-modus met de juiste synth preset</li>
  <li>Melodiepiano roll — klaar om af te spelen of aan te passen</li>
  <li>Pad-akkoorden — passende progressie per genre</li>
  <li>BPM, toonsoort en effecten al ingesteld</li>
</ul>
`
    },
    {
        id: 'chords',
        title: 'Akkoorden & Theorie',
        icon: '♬',
        content: `
<h3>Akkoorden & Muziektheorie</h3>

<h4>Toonsoort en toonladder</h4>
<p>Stel de toonsoort in via het <strong>Root</strong> en <strong>Mode</strong> veld. Dit bepaalt welke noten in de piano roll keyboard gemarkeerd worden en welke noten de generator gebruikt.</p>

<h4>Akkoordprogressie</h4>
<p>Kies een progressie (bijv. i–VI–III–VII) en klik <strong>Genereer</strong>. De akkoorden worden automatisch op het piano klaviertje gespeeld en als sidechain-bron gebruikt.</p>

<h4>Arpeggiator</h4>
<p>De arpeggiator speelt de noten van het huidige akkoord na elkaar. Instelbaar:</p>
<ul>
  <li><strong>Mode:</strong> up, down, up-down, random</li>
  <li><strong>Rate:</strong> 4n, 8n, 16n, 32n</li>
  <li><strong>Octaves:</strong> 1–4</li>
  <li><strong>Gate:</strong> nootlengte als percentage van de rate</li>
</ul>

<h4>Voice leading</h4>
<p>Als <em>Voice Lead</em> aanstaat, worden akkoordovergangen zo soepel mogelijk gemaakt door noten zo min mogelijk te verplaatsen.</p>
`
    },
    {
        id: 'shortcuts',
        title: 'Sneltoetsen',
        icon: '⌨',
        content: `
<h3>Sneltoetsen</h3>

<h4>Transport</h4>
<table>
  <tr><td><kbd>Spatie</kbd></td><td>Play / Stop</td></tr>
  <tr><td><kbd>Ctrl+Z</kbd></td><td>Ongedaan maken</td></tr>
  <tr><td><kbd>Ctrl+Y</kbd></td><td>Opnieuw</td></tr>
  <tr><td><kbd>Ctrl+S</kbd></td><td>Opslaan</td></tr>
</table>

<h4>Piano Roll</h4>
<table>
  <tr><td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td><td>Geselecteerde noten verwijderen</td></tr>
  <tr><td><kbd>Ctrl+A</kbd></td><td>Alle noten selecteren</td></tr>
  <tr><td><kbd>Escape</kbd></td><td>Selectie opheffen / piano roll sluiten</td></tr>
  <tr><td><kbd>Ctrl+Scroll</kbd></td><td>Horizontaal zoomen</td></tr>
</table>

<h4>Computer keyboard als MIDI</h4>
<p>Gebruik je toetsenbord als een piano. De rij <kbd>A S D F G H J K</kbd> zijn de witte toetsen, <kbd>W E</kbd> <kbd>T Y U</kbd> zijn de zwarte. Verschuif het octaaf met <kbd>Z</kbd> (lager) en <kbd>X</kbd> (hoger).</p>
`
    },
];

// ── Modal bouwen ──────────────────────────────────────────────

var helpModal = null;
var activeSection = 'start';

function openHelp(sectionId) {
    if (!helpModal) buildHelpModal();
    activeSection = sectionId || activeSection;
    showSection(activeSection);
    helpModal.classList.add('open');
}

function closeHelp() {
    if (helpModal) helpModal.classList.remove('open');
}

function showSection(id) {
    activeSection = id;
    var sec = HELP_SECTIONS.find(function(s){ return s.id === id; });
    if (!sec) return;

    var content = document.getElementById('helpContent');
    if (content) content.innerHTML = sec.content;

    document.querySelectorAll('.help-nav-item').forEach(function(el) {
        el.classList.toggle('active', el.dataset.id === id);
    });
}

function buildHelpModal() {
    var modal = document.createElement('div');
    modal.id = 'helpModal';
    modal.className = 'help-modal';
    helpModal = modal;

    // Backdrop
    var bd = document.createElement('div');
    bd.className = 'help-backdrop';
    bd.addEventListener('click', closeHelp);
    modal.appendChild(bd);

    // Dialog
    var dialog = document.createElement('div');
    dialog.className = 'help-dialog';

    // ── Left nav ──
    var nav = document.createElement('nav');
    nav.className = 'help-nav';

    var navHeader = document.createElement('div');
    navHeader.className = 'help-nav-header';
    navHeader.textContent = 'Handleiding';
    nav.appendChild(navHeader);

    HELP_SECTIONS.forEach(function(sec) {
        var item = document.createElement('button');
        item.className = 'help-nav-item';
        item.dataset.id = sec.id;
        item.innerHTML = '<span class="help-nav-icon">' + sec.icon + '</span>' + sec.title;
        item.addEventListener('click', function() { showSection(sec.id); });
        nav.appendChild(item);
    });

    // Spacer
    var spacer = document.createElement('div');
    spacer.style.flex = '1';
    nav.appendChild(spacer);

    // Reset localStorage button
    var resetBtn = document.createElement('button');
    resetBtn.className = 'help-nav-reset';
    resetBtn.title = 'Wist alle lokale instellingen en toont het welkomstscherm opnieuw';
    resetBtn.innerHTML = '<span class="help-nav-icon">↺</span> Reset & welkomstscherm';
    resetBtn.addEventListener('click', function() {
        if (confirm('Lokale opslag wissen? Het project gaat verloren en het welkomstscherm verschijnt opnieuw.')) {
            try { localStorage.clear(); } catch(e) {}
            location.reload();
        }
    });
    nav.appendChild(resetBtn);

    // ── Right content ──
    var main = document.createElement('div');
    main.className = 'help-main';

    var hdr = document.createElement('div');
    hdr.className = 'help-header';
    hdr.innerHTML = '<span class="help-title">ShotMusic Help</span>';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'help-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeHelp);
    hdr.appendChild(closeBtn);
    main.appendChild(hdr);

    var content = document.createElement('div');
    content.id = 'helpContent';
    content.className = 'help-content';
    main.appendChild(content);

    dialog.appendChild(nav);
    dialog.appendChild(main);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    showSection(activeSection);
}

// ── Init ──────────────────────────────────────────────────────

window.openHelp = openHelp;

(function() {
    function init() {
        var btn = document.getElementById('btnHelp');
        if (btn) btn.addEventListener('click', function() { openHelp(); });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'F1') { e.preventDefault(); openHelp(); }
            if (e.key === 'Escape' && helpModal?.classList.contains('open')) closeHelp();
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

})();
