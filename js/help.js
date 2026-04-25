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
  <li>Kies een <strong>Startpack</strong> via <em>File → Starters</em> om direct met een genre te beginnen.</li>
  <li>Druk op <strong>▶ Play</strong> om af te spelen. De browser vraagt één keer toestemming voor audio.</li>
  <li>Voeg tracks toe via <strong>+ Track toevoegen</strong> onderaan de sequencer.</li>
  <li>Sla op via <em>File → Opslaan</em> of gebruik <strong>Ctrl+S</strong>. Auto-save slaat ook op in localStorage.</li>
</ol>

<h4>Interface overzicht</h4>
<table>
  <tr><td><strong>Transport</strong></td><td>Play, Stop, BPM, Bars en Chord/Bar teller — altijd zichtbaar bovenaan</td></tr>
  <tr><td><strong>Menu bar</strong></td><td>File / View / MIDI / Edit — alle extra functies gegroepeerd</td></tr>
  <tr><td><strong>Linker sidebar</strong></td><td>Synthesizerparameters voor de akkoord-synth</td></tr>
  <tr><td><strong>Rechter sidebar</strong></td><td>Muziektheorie: toonsoort, toonladder, progressie</td></tr>
  <tr><td><strong>Akkoorden</strong></td><td>Lopende akkoordprogressie + arpeggiator</td></tr>
  <tr><td><strong>Sequencer</strong></td><td>Step-sequencer met patronen A–H en track controls</td></tr>
  <tr><td><strong>Keyboard</strong></td><td>Speelbaar klaviertje onderaan — inklapbaar</td></tr>
</table>

<h4>Ruimte besparen</h4>
<ul>
  <li>Klik de <strong>◀ / ▶</strong> knop bovenaan een sidebar om hem in te klappen</li>
  <li>Klik <strong>▾</strong> in de Keyboard header om het klaviertje te verbergen</li>
  <li>Klik een sectie-label (▾) in de sidebar om die sectie in te klappen</li>
</ul>

<h4>Ondersteunde browsers</h4>
<p>Chrome of Edge aanbevolen. Firefox ondersteunt geen Web MIDI. Safari heeft beperkte Web Audio mogelijkheden.</p>
`
    },
    {
        id: 'transport',
        title: 'Transport & Menu',
        icon: '▶',
        content: `
<h3>Transport & Menu bar</h3>
<p>De transport balk bovenaan bevat de kern-controls én een uitklapbare menu bar.</p>

<h4>Core transport (altijd zichtbaar)</h4>
<table>
  <tr><td><strong>▶ Play</strong></td><td>Start afspelen</td></tr>
  <tr><td><strong>■ Stop</strong></td><td>Stop en zet terug naar het begin</td></tr>
  <tr><td><strong>BPM</strong></td><td>Scroll of sleep de slider voor BPM (60–200). TAP tikt het tempo in.</td></tr>
  <tr><td><strong>Bars</strong></td><td>Aantal bars per akkoord</td></tr>
  <tr><td><strong>CHORD / BAR</strong></td><td>Huidig akkoord en baarnummer tijdens afspelen</td></tr>
  <tr><td><strong>↩ ↪</strong></td><td>Ongedaan maken / Opnieuw</td></tr>
</table>

<h4>Menu bar</h4>
<table>
  <tr><td><strong>File ▾</strong></td><td>Starters (startpacks), Opslaan (JSON), Laden</td></tr>
  <tr><td><strong>View ▾</strong></td><td>Mixer, Clip Launcher, Arrangement Timeline, Visualizer</td></tr>
  <tr><td><strong>MIDI ▾</strong></td><td>MIDI Import, MIDI Export, VST routing, Opnemen / Stop opname</td></tr>
  <tr><td><strong>Edit ▾</strong></td><td>Reset project, Help</td></tr>
</table>

<h4>Sneltoetsen</h4>
<table>
  <tr><td><kbd>Spatie</kbd></td><td>Play / Stop</td></tr>
  <tr><td><kbd>Ctrl+Z</kbd></td><td>Ongedaan maken</td></tr>
  <tr><td><kbd>Ctrl+Y</kbd></td><td>Opnieuw</td></tr>
  <tr><td><kbd>Ctrl+S</kbd></td><td>Opslaan</td></tr>
  <tr><td><kbd>F1</kbd></td><td>Help openen</td></tr>
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

<h4>Patroon & sequencer toolbar</h4>
<p>De toolbar combineert patroonkeuze en sequencer-bediening in één balk:</p>
<table>
  <tr><td><strong>A–H knoppen</strong></td><td>Kies het actieve patroon. Elk patroon heeft onafhankelijke steps per track.</td></tr>
  <tr><td><strong>→ / select</strong></td><td>Kopieer het huidige patroon naar een ander patroon</td></tr>
  <tr><td><strong>Default</strong></td><td>Laadt het standaardpatroon voor dit track-type</td></tr>
  <tr><td><strong>Clear</strong></td><td>Wist alle stappen in het huidige patroon</td></tr>
  <tr><td><strong>Random</strong></td><td>Genereert een muziektheorie-gestuurd willekeurig patroon</td></tr>
  <tr><td><strong>Mute All</strong></td><td>Dempt of ontdempt alle tracks tegelijk</td></tr>
  <tr><td><strong>16 / 32 st</strong></td><td>Patroonlengte</td></tr>
  <tr><td><strong>Swing</strong></td><td>Swing-gevoel op 16th-note grid (0–50%)</td></tr>
  <tr><td><strong>✦ Melodie</strong></td><td>Open de melodiegenerator</td></tr>
</table>

<h4>Stap eigenschappen (rechts-klik stap)</h4>
<ul>
  <li><strong>Velocity</strong> — hoe hard de noot klinkt (1–127)</li>
  <li><strong>Probabiliteit</strong> — kans dat de stap afspeelt (0–100%)</li>
  <li><strong>Gate</strong> — hoe lang de noot klinkt als percentage van de stap</li>
</ul>

<h4>Track-knoppen</h4>
<table>
  <tr><td><strong>M</strong></td><td>Mute — stil deze track</td></tr>
  <tr><td><strong>FX</strong></td><td>Effecten — reverb, delay, filter, distortion, EQ, bus routing, LFO</td></tr>
  <tr><td><strong>E</strong></td><td>Euclidisch ritme — genereer ritmische patronen wiskundig</td></tr>
  <tr><td><strong>SC</strong></td><td>Sidechain — koppelt volume aan de kick voor pump-effect</td></tr>
  <tr><td><strong>PR</strong></td><td>Piano Roll — open de piano roll editor (melodische tracks)</td></tr>
  <tr><td><strong>AUTO</strong></td><td>Automation lane — teken parameterautomatie per stap</td></tr>
  <tr><td><strong>◈ Sample</strong></td><td>Sample browser — vervang de synth met een sample uit je packs</td></tr>
</table>

<h4>Chord Step Row</h4>
<p>De paarse <strong>CHORDS</strong> rij bovenaan de sequencer triggert akkoordaanslagen op specifieke stappen. Stel de duur in via het dropdown (Stab / Half / Bar / Full).</p>

<h4>Tracks herschikken</h4>
<p>Sleep de <strong>⠿</strong> greep links van een track om hem te verplaatsen.</p>
`
    },
    {
        id: 'samples',
        title: 'Sample Packs',
        icon: '◈',
        content: `
<h3>Sample Packs & Sample Browser</h3>
<p>Vervang de ingebouwde synth van een percussion-track (Kick, Snare, Hi-Hat, Sample) met een audiobestand uit je eigen collectie.</p>

<h4>Sample packs toevoegen</h4>
<ol>
  <li>Maak een map aan op de server: <code>samples/MijnPack/</code></li>
  <li>Voeg subfolders toe voor categorieën: <code>samples/MijnPack/Kicks/</code>, <code>samples/MijnPack/Snares/</code>, etc.</li>
  <li>Elke subfolder-structuur wordt automatisch opgepikt — onbeperkte diepte</li>
  <li>Ondersteunde formaten: WAV, MP3, OGG, AIFF, FLAC</li>
</ol>

<h4>Sample browser gebruiken</h4>
<ol>
  <li>Klik de <strong>◈ Sample</strong> knop in een track-header</li>
  <li>Kies een pack en categorie in de linker kolom — de browser filtert automatisch op track-type</li>
  <li>Druk <strong>▶</strong> om een sample voor te beluisteren</li>
  <li>Druk <strong>+</strong> om de sample toe te wijzen aan de track</li>
  <li>Klik <strong>×</strong> naast de sample-knop om terug te keren naar de synth</li>
</ol>

<h4>Eigen bestand laden</h4>
<p>Onderin de browser staat een dropzone: sleep een audiobestand daar naartoe of klik om een bestand te kiezen. Het bestand wordt direct in de browser als buffer geladen (niet geüpload).</p>

<h4>Tips</h4>
<ul>
  <li>Map-namen met 'kick', 'snare', 'hat' etc. worden automatisch gemarkeerd als aanbevolen categorie</li>
  <li>Klik <strong>↺</strong> in de browser om de pack-lijst te vernieuwen na het toevoegen van bestanden</li>
  <li>Samples worden opgeslagen in het projectbestand via pack/categorie/bestandsnaam — geen absolute paden</li>
</ul>
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

<h4>Generator (✦ GEN)</h4>
<p>Klik <strong>✦ GEN</strong> in de piano roll voor automatische melodiegeneratie op basis van de huidige toonladder en akkoordprogressie. Kies stijl, ritme, dichtheid, contour en motief — daarna <strong>Genereer</strong>.</p>

<h4>Bars en loop</h4>
<p>Stel het aantal bars in (1, 2, 4 of 8) met de knoppen bovenaan. De piano roll loopt in een lus over dit aantal bars.</p>

<h4>Steps ↔ Piano Roll wisselen</h4>
<p>Dubbelklik op de <strong>PR</strong> knop om te wisselen tussen step-modus en piano roll modus. In step-modus gebruikt de track de 16/32-step grid; in piano roll modus speelt de Tone.Part.</p>
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
  <tr><td><strong>Snare</strong></td><td>Noise synth met optioneel tooncomponent. Presets: Acoustic, Electronic, Clap, Rimshot, Brushed, Big Room, Trap, Vinyl</td></tr>
  <tr><td><strong>Hi-Hat</strong></td><td>Gefilterd ruis. Presets: Closed, Open, Pedal, Crispy, Vinyl, Brushed</td></tr>
  <tr><td><strong>Bass</strong></td><td>Oscillator met filter-envelope. 22+ presets van Sub tot Acid</td></tr>
  <tr><td><strong>Melody</strong></td><td>Polyfone synth — kies golfvorm via FX-paneel</td></tr>
  <tr><td><strong>Pad</strong></td><td>Langzame attack, brede sound. 15+ presets</td></tr>
  <tr><td><strong>Sample</strong></td><td>Sleep een audiobestand of gebruik de sample browser (◈)</td></tr>
</table>

<h4>Effecten per track (FX knop)</h4>
<table>
  <tr><td><strong>Reverb</strong></td><td>Ruimtelijkheid (0–1)</td></tr>
  <tr><td><strong>Delay</strong></td><td>Echo (0–1)</td></tr>
  <tr><td><strong>Filter</strong></td><td>Low-pass filter frequentie (200 Hz – 20 kHz)</td></tr>
  <tr><td><strong>Distortion</strong></td><td>Overdrive (0–1)</td></tr>
  <tr><td><strong>LFO</strong></td><td>Moduleer filter, volume of pan met een oscillator</td></tr>
</table>

<h4>3-band EQ (in FX paneel)</h4>
<p>Elke track heeft een 3-band parametrische EQ: <strong>Low</strong>, <strong>Mid</strong> en <strong>Hi</strong>, elk −12 dB tot +12 dB.</p>

<h4>Bus Routing (in FX paneel)</h4>
<p>Stuur een track naar een submix-bus: <strong>Drums</strong>, <strong>Bass</strong>, <strong>Synths</strong> of <strong>FX</strong>. Stel volume en pan van elke bus in via de Mixer.</p>

<h4>MIDI Learn (ML knoppen)</h4>
<p>Naast Filter, Reverb en EQ knoppen staat een <strong>ML</strong> knopje. Klik ML (rood = wacht), beweeg daarna een MIDI CC — de parameter is nu gekoppeld. Groen = gebonden.</p>
`
    },
    {
        id: 'mixer',
        title: 'Mixer',
        icon: '⊟',
        content: `
<h3>Mixer</h3>
<p>Open via <strong>View → Mixer</strong>. De mixer toont alle tracks en bus-kanalen naast elkaar.</p>

<h4>Per kanaal</h4>
<ul>
  <li><strong>Volume fader</strong> — sleep verticaal (−40 dB tot +6 dB)</li>
  <li><strong>Pan knop</strong> — links/rechts in het stereobeeld</li>
  <li><strong>M</strong> — mute dit kanaal</li>
  <li><strong>S</strong> — solo: demp alle andere kanalen</li>
</ul>

<h4>VU meter</h4>
<p>Elke kanaalmeter toont het huidige niveau in real-time. Rood = clipping.</p>

<h4>Master sectie</h4>
<p>De master compressor en limiter zijn instelbaar via het Master-paneel (tandwiel icoon in de mixer).</p>
`
    },
    {
        id: 'launcher',
        title: 'Clip Launcher',
        icon: '⊟',
        content: `
<h3>Clip Launcher (Performance Mode)</h3>
<p>Geïnspireerd op de Roland MC-505 en Ableton Session View. Open via <strong>View → Launch</strong>.</p>

<h4>Hoe het werkt</h4>
<p>Elke kolom is een patroon (A–H), elke rij is een track. Tracks kunnen onafhankelijk van elkaar naar een ander patroon switchen — perfect voor live performance.</p>

<h4>Cel-states</h4>
<table>
  <tr><td>Donker</td><td>Patroon heeft geen data</td></tr>
  <tr><td>Gedimd gekleurd</td><td>Patroon heeft data maar speelt niet</td></tr>
  <tr><td>Vol gekleurd</td><td>Dit patroon speelt nu</td></tr>
  <tr><td>Oranje glow</td><td>In wachtrij — wacht op volgende bar boundary</td></tr>
</table>

<h4>Bediening</h4>
<table>
  <tr><td>Klik cel</td><td>Zet dit patroon in de wachtrij (switcht op volgende bar)</td></tr>
  <tr><td>Shift+klik</td><td>Wissel direct (zonder te wachten)</td></tr>
  <tr><td>Klik actieve cel</td><td>Mute/unmute die track</td></tr>
  <tr><td>Alle → X knoppen</td><td>Wissel alle tracks tegelijk naar patroon X</td></tr>
</table>
`
    },
    {
        id: 'arrangement',
        title: 'Arrangement Timeline',
        icon: '☰',
        content: `
<h3>Arrangement Timeline</h3>
<p>Een lineaire song-editor. Open via <strong>View → Arrangement</strong>.</p>

<h4>Clips toevoegen</h4>
<ul>
  <li>Klik op een lege cel in een patroon-rij, of sleep een patroon-knop (A–H) naar de tijdlijn</li>
  <li>Elke clip vertegenwoordigt één patroon op een specifieke positie</li>
</ul>

<h4>Clips bewerken</h4>
<table>
  <tr><td>Klik clip</td><td>Selecteer de clip</td></tr>
  <tr><td>Sleep clip</td><td>Verplaats (snaps to bars)</td></tr>
  <tr><td>Sleep rechterrand</td><td>Lengte aanpassen</td></tr>
  <tr><td><kbd>Delete</kbd></td><td>Geselecteerde clip verwijderen</td></tr>
</table>

<h4>Song Mode</h4>
<p>Zet <strong>Song Mode</strong> aan in het arrangement-paneel. Tijdens afspelen loopt de afspeelkop over de tijdlijn en worden de bijbehorende patronen gespeeld.</p>
`
    },
    {
        id: 'chords',
        title: 'Akkoorden & Theorie',
        icon: '♬',
        content: `
<h3>Akkoorden & Muziektheorie</h3>

<h4>Toonsoort instellen (rechter sidebar)</h4>
<p>Kies de <strong>Root noot</strong> en <strong>Mode</strong> (majeur/mineur). Dit bepaalt de toonladder voor de piano roll, melodiegenerator en willekeurige patronen.</p>

<h4>Akkoordprogressie</h4>
<p>Kies een progressie en klik <strong>Genereer</strong>. De akkoordkaarten bovenaan de sequencer tonen de lopende akkoorden.</p>

<h4>Akkoorden-header</h4>
<p>In de compacte header boven de akkoordkaarten:</p>
<ul>
  <li><strong>M</strong> — mute de akkoordsynth</li>
  <li><strong>Vol</strong> — volume van de akkoordsynth</li>
  <li><strong>ARP</strong> — arpeggiator aan/uit + instellingen (Mode, Rate, Oct, Gate)</li>
</ul>

<h4>Arpeggiator</h4>
<p>Speelt de noten van het huidige akkoord na elkaar. Instelbaar: <strong>Mode</strong> (up/down/up-down/random), <strong>Rate</strong>, <strong>Octaves</strong>, <strong>Gate</strong>.</p>

<h4>Chord Step Sequencer</h4>
<p>De paarse <strong>CHORDS</strong> rij bovenaan de sequencer laat je akkoordaanslagen op specifieke stappen zetten:</p>
<table>
  <tr><td><strong>Stab</strong></td><td>Korte staccato stoot</td></tr>
  <tr><td><strong>Half</strong></td><td>Halve bar</td></tr>
  <tr><td><strong>Bar</strong></td><td>Één hele bar (standaard)</td></tr>
  <tr><td><strong>Full</strong></td><td>Tot de volgende actieve stap</td></tr>
</table>
`
    },
    {
        id: 'templates',
        title: 'Startpacks',
        icon: '✦',
        content: `
<h3>Startpacks</h3>
<p>Voorgebouwde projecten per genre. Open via <strong>File → Starters</strong>.</p>

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
  <li>Drumpatronen (kick, snare, hi-hat)</li>
  <li>Basslijn met de juiste synth preset</li>
  <li>Melodie in de piano roll</li>
  <li>Pad-akkoorden met passende progressie</li>
  <li>BPM, toonsoort en effecten al ingesteld</li>
</ul>
`
    },
    {
        id: 'midi_import',
        title: 'MIDI Import / Export',
        icon: '↑',
        content: `
<h3>MIDI Import & Export</h3>

<h4>MIDI Import (File → MIDI Import)</h4>
<p>Importeer een .mid bestand als piano roll tracks.</p>
<ul>
  <li><strong>BPM overnemen</strong> — past het project-BPM aan naar het MIDI-bestand</li>
  <li><strong>Toevoegen / Vervangen</strong> — voeg tracks toe of wis bestaande tracks</li>
  <li><strong>Track selectie</strong> — vink aan welke MIDI-tracks je wil importeren</li>
</ul>
<p>Tracks met gemiddelde noot onder MIDI 52 worden als <strong>Bass</strong> geïmporteerd, anders als <strong>Melody</strong>. Drumtracks (kanaal 10) worden automatisch uitgevinkt.</p>
<p>Ondersteunt MIDI Format 0 en Format 1.</p>

<h4>MIDI Export (MIDI → MIDI Export)</h4>
<p>Exporteert alle tracks als .mid bestand:</p>
<ul>
  <li>Step-modus tracks → MIDI noten op het grid</li>
  <li>Piano roll tracks → noten 1-op-1</li>
  <li>Drumtracks → kanaal 10 met GM drum mapping</li>
  <li>BPM als tempo-event in de MIDI header</li>
</ul>

<h4>VST Routing (MIDI → VST / MIDI Out)</h4>
<p>Stuur MIDI live naar externe VST plugins via een virtuele MIDI poort (loopMIDI op Windows, IAC Driver op Mac).</p>
<ol>
  <li>Selecteer de virtuele MIDI poort in de dropdown</li>
  <li>Klik <strong>ACTIEF</strong></li>
  <li>Zet per track <strong>MIDI AAN</strong> en kies een kanaal (1–16)</li>
</ol>
`
    },
    {
        id: 'automation',
        title: 'Automation',
        icon: '◌',
        content: `
<h3>Automation</h3>
<p>Teken automatische waardeveranderingen per stap. Klik <strong>AUTO</strong> in een track-header.</p>

<h4>Waarden tekenen</h4>
<table>
  <tr><td>Klik canvas</td><td>Waarde instellen op die stap</td></tr>
  <tr><td>Rechts-klik</td><td>Waarde verwijderen (terug naar standaard)</td></tr>
  <tr><td>Klik + sleep</td><td>Meerdere stappen snel instellen</td></tr>
</table>

<h4>Parameters</h4>
<table>
  <tr><td><strong>Vol</strong></td><td>Volume (−40 dB tot +6 dB)</td></tr>
  <tr><td><strong>Flt</strong></td><td>Filter frequentie (200 Hz – 20 kHz)</td></tr>
  <tr><td><strong>Rev</strong></td><td>Reverb wetness (0–1)</td></tr>
  <tr><td><strong>Pan</strong></td><td>Panorama (L–midden–R)</td></tr>
</table>

<h4>Interpolatie</h4>
<p>Stappen zonder waarde worden lineair geïnterpoleerd tussen de omliggende ingestelde stappen — dit geeft vloeiende overgangen.</p>
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
  <tr><td><kbd>F1</kbd></td><td>Help openen / sluiten</td></tr>
</table>

<h4>Piano Roll</h4>
<table>
  <tr><td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td><td>Geselecteerde noten verwijderen</td></tr>
  <tr><td><kbd>Ctrl+A</kbd></td><td>Alle noten selecteren</td></tr>
  <tr><td><kbd>Escape</kbd></td><td>Selectie opheffen / sluiten</td></tr>
  <tr><td><kbd>Ctrl+Scroll</kbd></td><td>Horizontaal zoomen</td></tr>
</table>

<h4>Computer keyboard als MIDI</h4>
<p>Gebruik je toetsenbord als een piano. Witte toetsen: <kbd>A S D F G H J K</kbd> — zwarte toetsen: <kbd>W E</kbd> <kbd>T Y U</kbd>. Octaaf: <kbd>Z</kbd> (lager) en <kbd>X</kbd> (hoger).</p>
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

    // Logo header
    var logoHdr = document.createElement('div');
    logoHdr.className = 'help-nav-logo';
    logoHdr.innerHTML =
        '<img src="shot_logo.png" alt="Shot" class="help-logo-img">' +
        '<div class="help-logo-text">' +
            '<span class="help-logo-name">ShotMusic</span>' +
            '<span class="help-logo-sub">Studio</span>' +
        '</div>';
    nav.appendChild(logoHdr);

    var navLabel = document.createElement('div');
    navLabel.className = 'help-nav-header';
    navLabel.textContent = 'Handleiding';
    nav.appendChild(navLabel);

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
    resetBtn.title = 'Wist alle lokale instellingen';
    resetBtn.innerHTML = '<span class="help-nav-icon">↺</span> Reset & herstart';
    resetBtn.addEventListener('click', function() {
        if (confirm('Lokale opslag wissen? Project gaat verloren.')) {
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
    hdr.innerHTML = '<span class="help-title">Help</span>';

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
