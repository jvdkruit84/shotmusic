/* ══════════════════════════════════════════════════════════
   ShotMusic — Synthesizer + Dynamic Step Sequencer
   ══════════════════════════════════════════════════════════ */

const API = 'api.php';

// ── Global synth state ─────────────────────────────────────
const S = { progression:[], chordNames:[], scale:[], currentChord:0, isPlaying:false, bar:0, audioReady:false, chordMute:false,
    sidechain:{ enabled:false, depth:0.7, release:0.25 } };
let chordSynth, chordReverb, chordDelay, chordFilter, chordChorus, chordVol, chordDist;
let chordPart=null, seqLoop=null, arpLoop=null;
let masterComp=null, masterLimiter=null, masterMeter=null;
let vizFft=null, vizWave=null;

const MASTER = { compEnabled:true, threshold:-24, ratio:4, attack:0.003, release:0.25, knee:6, limThreshold:-1 };

// ── Arpeggiator state ──────────────────────────────────────
const ARP = { enabled:false, mode:'up', rate:'16n', octaves:1, gate:0.5 };
let toneRecorder = null;
let draggedUid = null;

// ── Patterns ───────────────────────────────────────────────
const PATTERN_NAMES = ['A','B','C','D','E','F','G','H'];
const SEQ = window.SEQ || { tracks:[], steps:16, nextUid:1,
    patterns: Object.fromEntries(PATTERN_NAMES.map(n=>[n,{name:n,data:{}}])),
    currentPattern:'A', songMode:false, songArrangement:[], songPos:0,
    pianoRollBars: 4,
};
