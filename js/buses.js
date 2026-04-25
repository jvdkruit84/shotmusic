;(function(){
'use strict';

// ── Bus / Group Routing ───────────────────────────────────────
// 4 mix busses, each connecting to the master compressor.
// Tracks route to a bus via track.busRoute ('drums'|'bass'|'synth'|'fx'|null).

window.BUS_DEFS = [
    { id:'drums', label:'Drums', color:'#e03131' },
    { id:'bass',  label:'Bass',  color:'#7950f2' },
    { id:'synth', label:'Synths',color:'#4c6ef5' },
    { id:'fx',    label:'FX',    color:'#20c997' },
];

// BUS_STATE persisted in project
window.BUS_STATE = Object.fromEntries(BUS_DEFS.map(b => [b.id, { vol:0, mute:false }]));

// BUS_NODES: live Tone.js nodes (rebuilt after audio init)
window.BUS_NODES = {};

window.initBuses = function() {
    Object.values(window.BUS_NODES).forEach(n => { try{n.vol.dispose();}catch(e){} });
    window.BUS_NODES = {};
    BUS_DEFS.forEach(def => {
        const st  = window.BUS_STATE[def.id] || { vol:0, mute:false };
        const vol = new Tone.Volume(st.mute ? -Infinity : st.vol).connect(getMasterInput());
        window.BUS_NODES[def.id] = { vol, def };
    });
    if (typeof refreshBusMixer === 'function') refreshBusMixer();
};

window.updateBus = function(busId, param, val) {
    if (!window.BUS_STATE[busId]) return;
    window.BUS_STATE[busId][param] = val;
    const node = window.BUS_NODES[busId];
    if (!node) return;
    if (param === 'vol')  node.vol.volume.value = window.BUS_STATE[busId].mute ? -Infinity : val;
    if (param === 'mute') node.vol.volume.value = val ? -Infinity : window.BUS_STATE[busId].vol;
    autoSave();
};

})();
