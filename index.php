<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SHOT Music Studio</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
<link rel="stylesheet" href="css/app.css">
<script>
// Resume the Tone.js AudioContext on the very first user gesture.
// Chrome suspends AudioContexts created before a user interaction;
// this handler resumes it as soon as the user clicks/taps/keys anything,
// so it is ready before the Play button is pressed.
(function () {
    var _done = false;
    function _resume() {
        if (_done) return;
        _done = true;
        if (typeof Tone !== 'undefined') Tone.start();
        document.removeEventListener('click',      _resume, true);
        document.removeEventListener('keydown',    _resume, true);
        document.removeEventListener('touchstart', _resume, true);
    }
    document.addEventListener('click',      _resume, true);
    document.addEventListener('keydown',    _resume, true);
    document.addEventListener('touchstart', _resume, true);
})();
</script>
</head>
<body>

<header>
    <img src="shot_logo.png" alt="Shot">
    <div class="hdr-sep"></div>
    <h1>ShotMusic</h1>
    <span class="subtitle">Studio</span>
    <div id="status">Gereed — klik Play</div>
</header>

<div class="workspace">

<!-- ── Sidebar ── -->
<div class="sidebar" id="leftSidebar">
<button class="sidebar-fold-btn sidebar-fold-btn-left" id="leftSidebarToggle" title="Sidebar in-/uitklappen">◀</button>
<div class="sidebar-section">
    <div class="section-label">Synthesizer <button class="section-toggle" title="Inklappen">▾</button></div>
    <div class="section-content">
    <div class="field"><label>Geluid</label>
        <select id="chordPreset">
            <optgroup label="── Pads">
                <option value="warm_pad" selected>Warm Pad</option>
                <option value="lush_pad">Lush Pad</option>
                <option value="dark_pad">Dark Pad</option>
                <option value="strings">Strings</option>
                <option value="aether">Aether</option>
                <option value="choir">Choir</option>
                <option value="glass_pad">Glass Pad</option>
                <option value="ambient">Ambient</option>
            </optgroup>
            <optgroup label="── Leads">
                <option value="saw_lead">Saw Lead</option>
                <option value="square_lead">Square Lead</option>
                <option value="fm_lead">FM Lead</option>
                <option value="pulse_lead">Pulse Lead</option>
                <option value="moog_lead">Moog Lead</option>
                <option value="dist_lead">Dist Lead</option>
                <option value="whistle">Whistle</option>
            </optgroup>
            <optgroup label="── Keys">
                <option value="piano">Piano</option>
                <option value="e_piano">Electric Piano</option>
                <option value="organ">Organ</option>
                <option value="wurli">Wurlitzer</option>
                <option value="clavinet">Clavinet</option>
                <option value="bell">Bell</option>
                <option value="vibraphone">Vibraphone</option>
                <option value="marimba">Marimba</option>
                <option value="harp">Harp</option>
            </optgroup>
            <optgroup label="── Synths">
                <option value="supersaw">Supersaw</option>
                <option value="pluck">Pluck</option>
                <option value="stab">Stab</option>
                <option value="reese">Reese</option>
                <option value="synth_bass">Synth Bass</option>
            </optgroup>
            <optgroup label="── Synthwave">
                <option value="retro_lead">Retro Lead</option>
                <option value="neon_pad">Neon Pad</option>
                <option value="power_stab">Power Stab</option>
                <option value="arp_pluck">Arp Pluck</option>
                <option value="retro_bass">Retro Bass</option>
                <option value="synth_brass">Synth Brass</option>
                <option value="vhs_pad">VHS Pad</option>
                <option value="outrun_lead">Outrun Lead</option>
            </optgroup>
            <optgroup label="── Wereld">
                <option value="flute">Flute</option>
                <option value="brass">Brass</option>
                <option value="theremin">Theremin</option>
                <option value="sitar">Sitar</option>
                <option value="kalimba">Kalimba</option>
            </optgroup>
        </select>
    </div>
    <div class="adsr-display">
        <svg id="adsrSvg" width="100%" height="40" viewBox="0 0 184 40" preserveAspectRatio="none">
            <path id="adsrPath" d="" stroke-width="1.5" fill="none"/>
            <text x="0" y="38" class="adsr-lbl">A</text>
            <text id="adsrLblD" x="0" y="38" class="adsr-lbl">D</text>
            <text id="adsrLblS" x="0" y="38" class="adsr-lbl">S</text>
            <text id="adsrLblR" x="0" y="38" class="adsr-lbl">R</text>
        </svg>
    </div>
    <div class="adsr-grid">
        <div class="field">
            <div class="value-row"><label>Attack</label><span id="attackVal">0.8s</span></div>
            <input type="range" id="attack" min="0.01" max="4" step="0.01" value="0.8">
        </div>
        <div class="field">
            <div class="value-row"><label>Decay</label><span id="decayVal">0.5s</span></div>
            <input type="range" id="decay" min="0.01" max="4" step="0.01" value="0.5">
        </div>
        <div class="field">
            <div class="value-row"><label>Sustain</label><span id="sustainVal">70%</span></div>
            <input type="range" id="sustain" min="0" max="1" step="0.01" value="0.7">
        </div>
        <div class="field">
            <div class="value-row"><label>Release</label><span id="releaseVal">2.5s</span></div>
            <input type="range" id="release" min="0.1" max="8" step="0.1" value="2.5">
        </div>
    </div>
    <div class="field">
        <div class="value-row"><label>Detune</label><span id="detuneVal">0ct</span></div>
        <input type="range" id="detune" min="0" max="60" step="1" value="0">
    </div>
    </div>
</div>
<div class="sidebar-section">
    <div class="section-label">Effecten <button class="section-toggle" title="Inklappen">▾</button></div>
    <div class="section-content">
    <div class="fx-chain-display">
        <span class="fx-node">DIST</span><span class="fx-arrow">→</span>
        <span class="fx-node">CHO</span><span class="fx-arrow">→</span>
        <span class="fx-node">DLY</span><span class="fx-arrow">→</span>
        <span class="fx-node">REV</span><span class="fx-arrow">→</span>
        <span class="fx-node">FLT</span>
    </div>
    <div class="field">
        <div class="value-row"><label>Distortion</label><span id="distortionVal">0%</span></div>
        <input type="range" id="distortion" min="0" max="1" step="0.01" value="0">
    </div>
    <div class="field">
        <div class="value-row"><label>Chorus</label><span id="chorusVal">0%</span></div>
        <input type="range" id="chorus" min="0" max="1" step="0.01" value="0">
    </div>
    <div class="field">
        <div class="value-row"><label>Delay</label><span id="delayVal">30%</span></div>
        <input type="range" id="delay" min="0" max="0.9" step="0.01" value="0.3">
    </div>
    <div class="field">
        <div class="value-row"><label>Reverb Mix</label><span id="reverbVal">60%</span></div>
        <input type="range" id="reverb" min="0" max="1" step="0.01" value="0.6">
    </div>
    <div class="field">
        <div class="value-row"><label>Reverb Decay</label><span id="reverbDecayVal">4.0s</span></div>
        <input type="range" id="reverbDecay" min="0.5" max="12" step="0.1" value="4">
    </div>
    <div class="field">
        <div class="value-row"><label>Filter</label><span id="filterVal">3000Hz</span></div>
        <input type="range" id="filter" min="200" max="8000" step="50" value="3000">
    </div>
    </div>
</div>
</div>

<!-- ── Right pane ── -->
<div class="right-pane">

    <!-- Transport -->
    <div class="transport">
        <!-- Core: play / stop -->
        <div class="t-group">
            <span class="led" id="playLed"></span>
            <button class="btn btn-play" id="btnPlay">▶ Play</button>
            <button class="btn btn-stop" id="btnStop">■ Stop</button>
        </div>
        <div class="t-divider"></div>
        <!-- BPM -->
        <div class="t-group">
            <div class="t-stat">
                <div class="t-display" id="bpmVal">123</div>
                <div class="lbl" style="font-size:7.5px;color:var(--muted);letter-spacing:1.2px;text-transform:uppercase;text-align:center">BPM</div>
            </div>
            <input type="range" id="bpm" min="60" max="200" step="1" value="123" style="width:80px">
            <button class="tap-btn" id="btnTap" title="Tik op de maat om BPM in te stellen">TAP</button>
        </div>
        <div class="t-divider"></div>
        <!-- Bars -->
        <div class="inline-ctrl">
            Bars <span id="barVal" style="color:var(--digit);font-weight:700;font-family:monospace;min-width:14px">2</span>
            <input type="range" id="chordBars" min="1" max="8" step="1" value="2" style="width:60px">
        </div>
        <div class="t-divider"></div>
        <!-- Chord / bar counter -->
        <div class="t-group" style="gap:10px">
            <div class="t-stat">
                <div class="val" id="currentChordName">—</div>
                <div class="lbl">CHORD</div>
            </div>
            <div class="t-stat">
                <div class="val" id="barCounter">0</div>
                <div class="lbl">BAR</div>
            </div>
        </div>

        <!-- ── Menu bar ── -->
        <nav class="menubar" id="menubar">
            <!-- Undo / Redo (always visible, frequently used) -->
            <button class="btn btn-icon" id="btnUndo" title="Ongedaan maken (Ctrl+Z)" disabled>↩</button>
            <button class="btn btn-icon" id="btnRedo" title="Opnieuw (Ctrl+Y)" disabled>↪</button>
            <div class="t-divider"></div>
            <!-- Launch — always visible -->
            <button class="btn btn-launch" id="btnLauncher" title="Clip Launcher / Performance Mode">⊟ Launch</button>
            <div class="t-divider"></div>

            <!-- File -->
            <div class="menu-item">
                <div class="menu-hdr">File <span class="menu-arrow">▾</span></div>
                <div class="menu-drop">
                    <button class="menu-btn" id="btnTemplates">✦ Starters</button>
                    <button class="menu-btn menu-btn-save" id="btnSave">💾 Opslaan</button>
                    <button class="menu-btn" id="btnLoad">📂 Laden</button>
                    <input type="file" id="loadFileInput" accept=".json" style="display:none">
                </div>
            </div>

            <!-- View -->
            <div class="menu-item">
                <div class="menu-hdr">View <span class="menu-arrow">▾</span></div>
                <div class="menu-drop">
                    <button class="menu-btn" id="btnMixer">⊞ Mixer</button>
                    <button class="menu-btn" id="btnArrangement">☰ Arrangement</button>
                    <button class="menu-btn" id="btnViz">◈ Visualizer</button>
                </div>
            </div>

            <!-- MIDI / Record -->
            <div class="menu-item">
                <div class="menu-hdr">MIDI <span class="menu-arrow">▾</span></div>
                <div class="menu-drop">
                    <button class="menu-btn" id="btnMidiImport">↑ MIDI Import</button>
                    <input type="file" id="midiImportInput" accept=".mid,.midi" style="display:none">
                    <button class="menu-btn" id="btnMidi">↓ MIDI Export</button>
                    <button class="menu-btn" id="btnMidiOut">⊙ VST / MIDI Out</button>
                    <div class="menu-sep"></div>
                    <button class="menu-btn menu-btn-rec" id="btnRecStart">● Opnemen</button>
                    <button class="menu-btn" id="btnRecStop" disabled>■ Stop opname</button>
                </div>
            </div>

            <!-- Edit / Reset -->
            <div class="menu-item">
                <div class="menu-hdr">Edit <span class="menu-arrow">▾</span></div>
                <div class="menu-drop">
                    <button class="menu-btn" id="btnReset" title="Reset project naar standaard">↺ Reset project</button>
                    <div class="menu-sep"></div>
                    <button class="menu-btn btn-help" id="btnHelp" title="Help (F1)">? Help</button>
                </div>
            </div>
        </nav>
    </div>

    <!-- Visualizer -->
    <div class="viz-panel hidden" id="vizPanel">
        <div class="viz-header">
            <button class="viz-mode-btn active" id="vizModeSpectrum" title="Spectrum analyzer">SPECTRUM</button>
            <button class="viz-mode-btn" id="vizModeScope" title="Oscilloscoop">SCOPE</button>
            <button class="viz-close" id="vizClose">×</button>
        </div>
        <canvas id="vizCanvas" class="viz-canvas"></canvas>
    </div>

    <!-- Chord progression -->
    <div class="progression-area">
        <!-- Single header row: title · mute · vol · divider · arp -->
        <div class="prog-header">
            <span class="prog-title">Akkoorden</span>
            <button class="seq-mute-btn" id="chordMuteBtn" title="Mute akkoorden">M</button>
            <div class="t-divider" style="height:16px"></div>
            <label class="prog-vol">
                Vol <input type="range" id="chordVolume" min="-40" max="6" step="1" value="0">
                <span id="chordVolumeVal">0dB</span>
            </label>
            <div class="t-divider" style="height:16px"></div>
            <button class="arp-toggle" id="arpToggle" title="Arpeggiator aan/uit">ARP</button>
            <div class="arp-controls hidden" id="arpControls">
                <label class="arp-lbl">Mode
                    <select id="arpMode" class="arp-sel">
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                        <option value="updown">Up-Down</option>
                        <option value="random">Random</option>
                    </select>
                </label>
                <label class="arp-lbl">Rate
                    <select id="arpRate" class="arp-sel">
                        <option value="32n">1/32</option>
                        <option value="16n" selected>1/16</option>
                        <option value="8n">1/8</option>
                        <option value="4n">1/4</option>
                        <option value="16t">1/16T</option>
                        <option value="8t">1/8T</option>
                    </select>
                </label>
                <label class="arp-lbl">Oct
                    <select id="arpOctaves" class="arp-sel">
                        <option value="1" selected>1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </label>
                <label class="arp-lbl">Gate
                    <input type="range" id="arpGate" min="0.05" max="1" step="0.05" value="0.5" style="width:60px">
                    <span id="arpGateVal">50%</span>
                </label>
            </div>
        </div>
        <div class="chord-grid" id="chordGrid"><span style="color:var(--muted);font-size:12px">Laden…</span></div>
    </div>

    <!-- Step Sequencer -->
    <div class="seq-area">
        <!-- Single combined toolbar: patterns + sequencer controls -->
        <div class="seq-toolbar" id="patternBar">
            <!-- Pattern buttons -->
            <div id="patBtns" style="display:flex;gap:2px;flex-shrink:0"></div>
            <button class="pat-copy" id="btnPatCopy" title="Kopieer huidig patroon naar…">→</button>
            <select id="patCopyTarget" style="height:22px;font-size:9px;background:var(--card);border:1px solid var(--border2);color:var(--text);border-radius:3px;padding:0 4px;max-width:44px"></select>
            <div class="t-divider"></div>
            <!-- Sequencer actions -->
            <button class="seq-ctrl-btn" id="seqDefault">Default</button>
            <button class="seq-ctrl-btn" id="seqClear">Clear</button>
            <button class="seq-ctrl-btn" id="seqRandom">Random</button>
            <button class="seq-ctrl-btn seq-ctrl-mute" id="btnMuteAll" title="Mute / unmute alle tracks">Mute All</button>
            <div class="t-divider"></div>
            <!-- Settings -->
            <div class="inline-ctrl">
                <select id="seqStepCount" style="width:52px">
                    <option value="16" selected>16 st</option>
                    <option value="32">32 st</option>
                </select>
            </div>
            <div class="inline-ctrl">
                <span style="color:var(--muted)">Swing</span>
                <input type="range" id="seqSwing" min="0" max="0.5" step="0.01" value="0" style="width:55px">
                <span id="seqSwingVal" style="color:var(--accent);font-weight:700;min-width:22px">0%</span>
            </div>
            <div class="t-divider"></div>
            <button class="seq-ctrl-btn" id="btnMelGen">✦ Melodie</button>
        </div>

        <!-- Melody generator panel -->
        <div class="mel-gen-panel" id="melGenPanel">
            <div>
                <label>Track</label>
                <select id="mgTrack"><option value="">— kies —</option></select>
            </div>
            <div class="gen-sep"></div>
            <div>
                <label>Stijl</label>
                <select id="mgStyle">
                    <option value="stepwise">Stapsgewijs</option>
                    <option value="arpeggio">Arpeggio</option>
                    <option value="hook">Hook</option>
                    <option value="sequence">Sequentie</option>
                    <option value="call_response">Call &amp; Response</option>
                    <option value="pentatonic">Pentatonisch</option>
                    <option value="blues">Blues Lick</option>
                    <option value="triad_run">Triad Run</option>
                </select>
            </div>
            <div>
                <label>Ritme</label>
                <select id="mgRhythm">
                    <option value="straight">Straight</option>
                    <option value="syncopated">Syncoop</option>
                    <option value="offbeat">Off-beat</option>
                    <option value="dotted">Gepunt</option>
                    <option value="sparse_beat">Beats only</option>
                </select>
            </div>
            <div>
                <label>Dichtheid</label>
                <select id="mgDensity">
                    <option value="sparse">Dun</option>
                    <option value="medium" selected>Gemiddeld</option>
                    <option value="dense">Vol</option>
                </select>
            </div>
            <div>
                <label>Contour</label>
                <select id="mgContour">
                    <option value="arch">Boog</option>
                    <option value="wave">Golf</option>
                    <option value="ascending">Stijgend</option>
                    <option value="descending">Dalend</option>
                    <option value="flat">Vlak</option>
                    <option value="valley">Dal</option>
                    <option value="random">Vrij</option>
                </select>
            </div>
            <div>
                <label>Octaaf</label>
                <select id="mgOctave">
                    <option value="low">Laag</option>
                    <option value="mid" selected>Midden</option>
                    <option value="high">Hoog</option>
                    <option value="wide">Breed</option>
                </select>
            </div>
            <div class="gen-sep"></div>
            <div>
                <label>Akkoord</label>
                <select id="mgChordAffinity">
                    <option value="free">Vrij</option>
                    <option value="low">Licht</option>
                    <option value="mid" selected>Midden</option>
                    <option value="high">Sterk</option>
                    <option value="only">Alleen</option>
                </select>
            </div>
            <div>
                <label>Arp richting</label>
                <select id="mgArpDir">
                    <option value="up">Omhoog</option>
                    <option value="down">Omlaag</option>
                    <option value="bounce">Bounce</option>
                    <option value="random">Willekeurig</option>
                </select>
            </div>
            <div>
                <label>Motief</label>
                <select id="mgMotifLen">
                    <option value="2">2 stappen</option>
                    <option value="4" selected>4 stappen</option>
                    <option value="8">8 stappen</option>
                    <option value="16">16 stappen</option>
                </select>
            </div>
            <div>
                <label>Variatie</label>
                <select id="mgVariation">
                    <option value="none">Geen</option>
                    <option value="low" selected>Licht</option>
                    <option value="mid">Matig</option>
                    <option value="high">Veel</option>
                </select>
            </div>
            <div class="gen-sep"></div>
            <button class="mel-btn-gen" id="btnMelGenRun">✦ Genereer</button>
        </div>

        <div class="seq-grid" id="seqGrid"></div>
        <!-- Add-track row appended by JS -->
    </div>

    <!-- Piano -->
    <div class="piano-area collapsed" id="pianoArea">
        <div class="piano-header">
            <button class="piano-fold-btn" id="pianoFoldBtn" title="Keyboard in-/uitklappen">▾</button>
            <span class="piano-lbl">Keyboard</span>
            <select id="kbdRecTrack" class="kbd-rec-sel" title="Live opnemen in track">
                <option value="">Geen opname</option>
            </select>
            <select class="piano-sound-sel" id="pianoSound">
                <optgroup label="── Pads">
                    <option value="warm_pad">Warm Pad</option>
                    <option value="lush_pad">Lush Pad</option>
                    <option value="dark_pad">Dark Pad</option>
                    <option value="strings">Strings</option>
                    <option value="aether">Aether</option>
                    <option value="choir">Choir</option>
                    <option value="glass_pad">Glass Pad</option>
                    <option value="ambient">Ambient</option>
                </optgroup>
                <optgroup label="── Leads">
                    <option value="saw_lead">Saw Lead</option>
                    <option value="square_lead">Square Lead</option>
                    <option value="fm_lead">FM Lead</option>
                    <option value="pulse_lead">Pulse Lead</option>
                    <option value="moog_lead">Moog Lead</option>
                    <option value="dist_lead">Dist Lead</option>
                    <option value="whistle">Whistle</option>
                </optgroup>
                <optgroup label="── Keys">
                    <option value="piano">Piano</option>
                    <option value="e_piano">Electric Piano</option>
                    <option value="organ">Organ</option>
                    <option value="wurli">Wurlitzer</option>
                    <option value="clavinet">Clavinet</option>
                    <option value="bell">Bell</option>
                    <option value="vibraphone">Vibraphone</option>
                    <option value="marimba">Marimba</option>
                    <option value="harp">Harp</option>
                </optgroup>
                <optgroup label="── Synths">
                    <option value="supersaw">Supersaw</option>
                    <option value="pluck" selected>Pluck</option>
                    <option value="stab">Stab</option>
                    <option value="reese">Reese</option>
                    <option value="synth_bass">Synth Bass</option>
                </optgroup>
                <optgroup label="── Synthwave">
                    <option value="retro_lead">Retro Lead</option>
                    <option value="neon_pad">Neon Pad</option>
                    <option value="power_stab">Power Stab</option>
                    <option value="arp_pluck">Arp Pluck</option>
                    <option value="retro_bass">Retro Bass</option>
                    <option value="synth_brass">Synth Brass</option>
                    <option value="vhs_pad">VHS Pad</option>
                    <option value="outrun_lead">Outrun Lead</option>
                </optgroup>
                <optgroup label="── Wereld">
                    <option value="flute">Flute</option>
                    <option value="brass">Brass</option>
                    <option value="theremin">Theremin</option>
                    <option value="sitar">Sitar</option>
                    <option value="kalimba">Kalimba</option>
                </optgroup>
            </select>
            <div style="display:flex;align-items:center;gap:5px;margin-left:auto">
                <button id="kbdToggle" class="kbd-toggle-btn" title="Toetsenbord als piano (A–; en W/E/T/Y/U/O/P · Z/X = octaaf)">⌨ Toetsenbord</button>
                <span class="kbd-oct-display">
                    <button id="kbdOctDn" class="kbd-oct-btn" title="Octaaf omlaag (Z)">−</button>
                    <span id="kbdOctaveInd" style="font-size:9px;font-weight:800;color:var(--digit);font-family:monospace;min-width:22px;text-align:center">C4</span>
                    <button id="kbdOctUp" class="kbd-oct-btn" title="Octaaf omhoog (X)">+</button>
                </span>
                <div class="piano-legend">
                    <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:rgba(91,125,245,.5);margin-right:3px"></span>toonladder</span>
                    <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--accent2);margin-right:3px"></span>akkoord</span>
                    <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--green);margin-right:3px"></span>speelt</span>
                </div>
            </div>
        </div>
        <div class="piano-wrap"><div class="piano" id="piano"></div></div>
    </div>

    <!-- Launcher / Performance panel -->
    <div class="launcher-panel" id="launcherPanel"></div>

    <!-- Arrangement Timeline panel -->
    <div class="arr-panel" id="arrangementPanel">
        <div class="arr-toolbar">
            <span class="arr-title">ARRANGEMENT TIMELINE</span>
            <label class="arr-ctrl-label">Bars
                <select id="arrBarsSelect" class="arr-select">
                    <option value="16">16</option>
                    <option value="32" selected>32</option>
                    <option value="64">64</option>
                    <option value="128">128</option>
                </select>
            </label>
            <button class="arr-zoom-btn" id="btnArrZoomOut" title="Zoom uit">−</button>
            <button class="arr-zoom-btn" id="btnArrZoomIn" title="Zoom in">+</button>
            <span class="arr-hint">Klik = nieuw clip &nbsp;·&nbsp; Drag = verplaats &nbsp;·&nbsp; Drag rechts = resize &nbsp;·&nbsp; Rechts-klik = verwijder &nbsp;·&nbsp; Ctrl+Scroll = zoom</span>
            <button class="arr-zoom-btn" style="margin-left:auto" onclick="openArrangement()">×</button>
        </div>
        <div class="arr-body">
            <div class="arr-pat-labels" id="arrPatLabels"></div>
            <div class="arr-canvas-wrap" id="arrCanvasWrap">
                <canvas id="arrCanvas"></canvas>
            </div>
        </div>
    </div>

    <!-- Mixer panel -->
    <div class="mixer-panel" id="mixerPanel">
        <div class="mixer-header">
            <span class="mixer-title">MIXER</span>
            <button class="mixer-close" id="mixerClose" title="Sluiten">×</button>
        </div>
        <div class="mixer-strips" id="mixerStrips"></div>
    </div>

</div>

<!-- ── Right sidebar ── -->
<div class="sidebar right-sidebar" id="rightSidebar">
<button class="sidebar-fold-btn sidebar-fold-btn-right" id="rightSidebarToggle" title="Sidebar in-/uitklappen">▶</button>

    <!-- Muziek Theorie -->
    <div class="sidebar-section">
        <div class="section-label">Muziek Theorie <button class="section-toggle" title="Inklappen">▾</button></div>
        <div class="section-content">
        <div class="field">
            <label>Root noot</label>
            <div class="root-grid" id="rootGrid">
                <?php foreach (['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as $n): ?><button class="root-btn<?=$n==='A'?' active':''?>" data-note="<?=$n?>"><?=$n?></button><?php endforeach; ?>
            </div>
            <input type="hidden" id="rootNote" value="A">
        </div>
        <div class="field"><label>Modus</label>
            <div style="display:flex;gap:4px">
                <button class="mode-btn active" id="modeBtnMinor" data-mode="minor" style="flex:1">Minor</button>
                <button class="mode-btn" id="modeBtnMajor" data-mode="major" style="flex:1">Major</button>
            </div>
            <input type="hidden" id="keyMode" value="minor">
            <div class="key-info-badge" id="keyInfoBadge">relatief: C</div>
        </div>
        <div class="field"><label>Toonladder</label>
            <select id="scaleType">
                <option value="minor" selected>Natural Minor</option>
                <option value="dorian">Dorian</option>
                <option value="phrygian">Phrygian</option>
                <option value="lydian">Lydian</option>
                <option value="mixolydian">Mixolydian</option>
                <option value="major">Major</option>
                <option value="harmonic_minor">Harmonic Minor</option>
                <option value="melodic_minor">Melodic Minor</option>
                <option value="pentatonic_minor">Pentatonic Minor</option>
                <option value="pentatonic_major">Pentatonic Major</option>
                <option value="blues_minor">Blues Minor</option>
            </select>
        </div>
        <div class="field"><label>Genre</label>
            <select id="genre">
                <option value="progressive_house">Progressive House</option>
                <option value="melodic_techno" selected>Melodic Techno</option>
                <option value="deep_house">Deep House</option>
                <option value="organic_house">Organic House</option>
                <option value="downtempo">Downtempo</option>
                <option value="trance">Trance</option>
                <option value="drum_and_bass">Drum &amp; Bass</option>
                <option value="minimal_dub_techno">Minimal / Dub Techno</option>
                <option value="synthwave">Synthwave</option>
                <option value="darksynth">Darksynth</option>
                <option value="outrun">Outrun</option>
            </select>
        </div>
        <div class="field"><label>Akkoord progressie</label>
            <select id="progression">
                <?php require_once 'MusicTheory.php'; ?>
                <optgroup label="── Synthwave / Retrowave ──">
                    <?php $group = ['synthwave_classic'=>'i–VI–III–VII (Classic Synthwave)','synthwave_retrowave'=>'i–VII–VI–V (Retrowave)','synthwave_dark'=>'i–iv–VII–III (Dark Synth)','synthwave_uplifting'=>'I–V–vi–IV (Dreamwave)','synthwave_dreamwave'=>'i–VI–VII–i (Driving Loop)','synthwave_power'=>'i–VI–III–VII Power Chords','andalusian_cadence'=>'Andalusian Cadence (Trance/Synth)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Electronic / Dance ──">
                    <?php $group = ['vi_IV_I_V'=>'vi–IV–I–V (Pop EDM)','i_VII_VI_VII'=>'i–VII–VI–VII (Prog House)','i_bVII_bVI_bVII'=>'i–♭VII–♭VI–♭VII (Melodic Techno)','i_iv_bVII_i'=>'i–iv–♭VII–i (Artbat)','sus4_sus2_minor_sus4'=>'sus4–sus2–minor (Electronic)','i_V_vi_IV_add9'=>'i–V–vi–IV add9 (Tension)'];
                    foreach($group as $k=>$label): $sel=$k==='i_bVII_bVI_bVII'?' selected':''; ?><option value="<?=$k?>"<?=$sel?>><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Deep / Melodic House ──">
                    <?php $group = ['i_ii_IV_i'=>'i–ii–IV–i (Deep Dorian)','i_bII_bVII_i'=>'i–♭II–♭VII–i (Korolova)','anyma_style'=>'i–♭VI–♭VII–V (Anyma)','melodic_techno_classic'=>'i–iv–v–♭VII (Melodic Techno)','i_III_VII_VI'=>'i–III–VII–VI (Emotional Minor)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Rufus Du Sol / Atmospheric ──">
                    <?php $group = ['innerbloom_original'=>'Innerbloom (no3–sus2)','rufus_emotional_open'=>'Rufus Emotional Open','atmospheric_suspended'=>'Atmospheric Suspended','melancholic_beauty_rufus'=>'Melancholic Beauty','ethereal_drift_rufus'=>'Ethereal Drift','emotional_depth_rufus'=>'Emotional Depth'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Jazz &amp; Funk ──">
                    <?php $group = ['ii_V_I'=>'ii–V–I (Jazz Classic)','I_vi_ii_V'=>'I–vi–ii–V (Rhythm Changes)','i_iim7b5_V7_i'=>'i–ii°7–V7–i (Jazz Minor)','I_IV_ii_V_jazz'=>'I–IV–ii–V (Jazzy 9ths)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Modal ──">
                    <?php $group = ['dorian_groove'=>'Dorian Groove (i–II)','phrygian_gate'=>'Phrygian Gate (i–♭II)','lydian_float'=>'Lydian Float (I–II)','mixolydian_roll'=>'Mixolydian Roll (I–♭VII–IV)','I_ii_vi_IV'=>'I–ii–vi–IV (Lydian / Ben Böhmer)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Cinematic / Ambient ──">
                    <?php $group = ['andalusian_cadence'=>'Andalusian Cadence (i–VII–VI–V)','I_iii_vi_IV'=>'I–iii–vi–IV (Cinematic Major)','i_v_VI_III'=>'i–v–VI–III (Film Score)','i_VI_v_IV'=>'i–VI–v–IV (Cinematic Descent)','i_VI_bVII_bVI'=>'i–VI–♭VII–♭VI (Dreamy Loop)','i_IV_bVII_III'=>'i–IV–♭VII–III (Dark Modal)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
                <optgroup label="── Pop / R&amp;B ──">
                    <?php $group = ['classic_pop_edm'=>'I–V–vi–IV (Classic Four)','I_V_vi_iii_IV'=>'I–V–vi–iii–IV (Pachelbel)','I_iii_IV_V'=>'I–iii–IV–V (Ascending Pop)','I_IV_vi_V'=>'I–IV–vi–V (Uplifting)','vi_IV_V_I_variant'=>'vi–IV–V–I (Rearranged)','levels_progression'=>'i–III–VII–VI (Levels)','how_deep_progression'=>'i–VI–iv–i (How Deep)','only_way_up_progression'=>'i–VI–VII–i (Only Way Up)','I_ii_iii_IV'=>'I–ii–iii–IV (Ascending Bass)'];
                    foreach($group as $k=>$label): ?><option value="<?=$k?>"><?=$label?></option><?php endforeach; ?>
                </optgroup>
            </select>
        </div>
        <div class="field"><label>Octaaf</label>
            <select id="octave">
                <?php for($o=2;$o<=6;$o++): ?><option value="<?=$o?>" <?=$o===4?'selected':''?>>Octaaf <?=$o?></option><?php endfor; ?>
            </select>
        </div>
        <div class="field" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="voiceLead" checked style="width:auto;accent-color:var(--accent)">
            <label for="voiceLead" style="margin:0;cursor:pointer;color:var(--muted)">Voice leading</label>
        </div>
        </div>
    </div>

    <!-- Master Bus -->
    <div class="sidebar-section">
        <div class="section-label">Master Bus <button class="section-toggle" title="Inklappen">▾</button></div>
        <div class="section-content">
            <div class="master-sec-hdr" style="margin-bottom:5px">
                <button class="master-toggle active" id="compToggle" title="Compressor aan/uit">COMP</button>
                <div class="master-gr-wrap"><div class="master-gr-fill" id="grFill"></div><span class="master-gr-lbl" id="grVal">0dB</span></div>
            </div>
            <div class="master-ctrl-grid" id="compControls">
                <label class="master-lbl">THR<input type="range" id="compThreshold" min="-60" max="0" step="1" value="-24"><span class="master-val" id="compThresholdVal">-24dB</span></label>
                <label class="master-lbl">RATIO<input type="range" id="compRatio" min="1" max="20" step="0.5" value="4"><span class="master-val" id="compRatioVal">4:1</span></label>
                <label class="master-lbl">ATK<input type="range" id="compAttack" min="0.001" max="0.1" step="0.001" value="0.003"><span class="master-val" id="compAttackVal">3ms</span></label>
                <label class="master-lbl">REL<input type="range" id="compRelease" min="0.05" max="1" step="0.01" value="0.25"><span class="master-val" id="compReleaseVal">250ms</span></label>
            </div>
            <div style="border-top:1px solid var(--border);margin:6px 0 5px"></div>
            <div class="master-sec-hdr" style="margin-bottom:4px">
                <span style="font-size:8px;font-weight:800;letter-spacing:.8px;color:var(--muted);text-transform:uppercase">LIMITER</span>
            </div>
            <label class="master-lbl">CEIL<input type="range" id="limThreshold" min="-12" max="0" step="0.5" value="-1"><span class="master-val" id="limThresholdVal">-1dB</span></label>
            <div style="border-top:1px solid var(--border);margin:6px 0 5px"></div>
            <div class="master-out-meter">
                <div class="master-out-bar" id="masterOutL"></div>
                <div class="master-out-bar" id="masterOutR"></div>
            </div>
        </div>
    </div>

    <!-- Sidechain -->
    <div class="sidebar-section">
        <div class="section-label">Sidechain <button class="section-toggle" title="Inklappen">▾</button></div>
        <div class="section-content">
            <div class="field">
                <button class="sc-toggle" id="scEnable" style="width:100%;margin-bottom:6px">● Uit</button>
            </div>
            <div class="field">
                <div class="value-row"><label>Depth</label><span class="sc-v" id="scDepthVal">70%</span></div>
                <input type="range" id="scDepth" min="0.1" max="1" step="0.05" value="0.7">
            </div>
            <div class="field">
                <div class="value-row"><label>Release</label><span class="sc-v" id="scReleaseVal">0.25s</span></div>
                <input type="range" id="scRelease" min="0.05" max="1" step="0.05" value="0.25">
            </div>
            <p style="font-size:8px;color:var(--muted);margin:4px 0 0;line-height:1.4">Zet SC aan op tracks die je wilt ducken</p>
        </div>
    </div>

    <!-- Song Arrangement -->
    <div class="sidebar-section">
        <div class="section-label">Arrangement <button class="section-toggle" title="Inklappen">▾</button></div>
        <div class="section-content">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
                <button class="song-mode-btn" id="btnSongMode">Song Mode</button>
                <button class="song-add" id="btnSongAdd" title="Voeg huidig patroon toe">+</button>
                <button class="song-add" id="btnSongClear" title="Leeg arrangement" style="font-size:9px;padding:0 6px">✕</button>
            </div>
            <div id="songSlots" style="display:flex;gap:3px;flex-wrap:wrap;min-height:22px"></div>
        </div>
    </div>

</div>
</div>

<!-- Sample Browser Modal -->
<div id="sampleBrowserModal" class="modal-overlay">
  <div class="modal-box sb-modal">
    <div class="modal-header">
      <span>Sample Browser — <strong id="sbTrackLabel"></strong></span>
      <div class="sb-toolbar">
        <input type="text" id="sbSearch" class="sb-search" placeholder="Zoeken…">
        <button class="btn btn-sec" id="sbRefresh" title="Packs herladen">↺</button>
        <button class="btn btn-sec" id="sbClearSample" title="Synth herstellen">Synth</button>
      </div>
      <button class="modal-close" id="sbClose">×</button>
    </div>
    <div class="sb-body">
      <div class="sb-sidebar" id="sbSidebar"></div>
      <div class="sb-files-pane" id="sbFiles"></div>
    </div>
  </div>
</div>

<script src="js/state.js"></script>
<script src="js/presets.js"></script>
<script src="js/synth.js?v=5"></script>
<script src="js/sequencer.js"></script>
<script src="js/arp.js"></script>
<script src="js/mixer.js"></script>
<script src="js/master.js"></script>
<script src="js/visualizer.js"></script>
<script src="js/ui.js"></script>
<script src="js/melody.js"></script>
<script src="js/project.js"></script>
<script src="js/history.js"></script>
<script src="js/app.js"></script>
<script src="js/templates.js"></script>
<script src="js/pianoroll.js"></script>
<script src="js/launcher.js"></script>
<script src="js/buses.js"></script>
<script src="js/arrangement.js"></script>
<script src="js/automation.js"></script>
<script src="js/midi_learn.js"></script>
<script src="js/midi_import.js"></script>
<script src="js/midi_out.js"></script>
<script src="js/sampler.js?v=5"></script>
<script src="js/help.js"></script>
<script src="js/splash.js"></script>
</body>
</html>
