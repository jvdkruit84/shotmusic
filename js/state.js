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

const MASTER = { compEnabled:true, threshold:-18, ratio:4, attack:0.001, release:0.20, knee:4, limThreshold:-3 };

// ── Arpeggiator state ──────────────────────────────────────
const ARP = { enabled:false, mode:'up', rate:'16n', octaves:1, gate:0.5 };
let toneRecorder = null;
let draggedUid = null;

// ── Patterns ───────────────────────────────────────────────
const PATTERN_NAMES = ['A','B','C','D','E','F','G','H'];
const SEQ = window.SEQ || { tracks:[], steps:16, nextUid:1,
    patterns: Object.fromEntries(PATTERN_NAMES.map(n=>[n,{name:n,data:{}}])),
    currentPattern:'A', songMode:false, songArrangement:[], songPos:0,
    arrangement: [], arrangementBars: 32, audioClips: [],
    chordSteps: Array(32).fill(0), chordStepGate: 0.75,
    pianoRollBars: 4,
    performanceMode: false,
};
