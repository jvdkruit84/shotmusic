// ── Splash Screen (eerste bezoek) ────────────────────────────

(function () {

var VISITED_KEY = 'shotmusic_visited';

function hasVisited() {
    try { return !!localStorage.getItem(VISITED_KEY); } catch(e) { return false; }
}
function markVisited() {
    try { localStorage.setItem(VISITED_KEY, '1'); } catch(e) {}
}

function dismissSplash(el, callback) {
    el.classList.add('splash-out');
    setTimeout(function() {
        el.remove();
        if (typeof callback === 'function') callback();
    }, 500);
}

function buildSplash() {
    var overlay = document.createElement('div');
    overlay.id = 'splashOverlay';
    overlay.className = 'splash-overlay';

    // ── Background grid decoration ──
    var grid = document.createElement('div');
    grid.className = 'splash-grid';
    overlay.appendChild(grid);

    // ── Glow blobs ──
    var g1 = document.createElement('div'); g1.className = 'splash-blob splash-blob-1'; overlay.appendChild(g1);
    var g2 = document.createElement('div'); g2.className = 'splash-blob splash-blob-2'; overlay.appendChild(g2);

    // ── Card ──
    var card = document.createElement('div');
    card.className = 'splash-card';

    // Logo
    var logoWrap = document.createElement('div');
    logoWrap.className = 'splash-logo-wrap';
    var logo = document.createElement('img');
    logo.src = 'https://creator.shotrecords.nl/shot_logo.png';
    logo.className = 'splash-logo';
    logo.alt = 'Shot Records';
    logo.onerror = function() { this.style.display = 'none'; };
    logoWrap.appendChild(logo);
    card.appendChild(logoWrap);

    // Title
    var title = document.createElement('h1');
    title.className = 'splash-title';
    title.innerHTML = 'Shot<span class="splash-title-accent">Music</span> Studio';
    card.appendChild(title);

    // Tagline
    var tag = document.createElement('p');
    tag.className = 'splash-tagline';
    tag.textContent = 'Browser-based DAW · Step Sequencer · Piano Roll · Synthesizer';
    card.appendChild(tag);

    // Divider
    var div = document.createElement('div');
    div.className = 'splash-divider';
    card.appendChild(div);

    // Feature pills
    var pills = document.createElement('div');
    pills.className = 'splash-pills';
    ['8 genres', 'Piano Roll', 'MIDI in/out', 'VST routing', 'Mixer', 'Clip Launcher'].forEach(function(f) {
        var p = document.createElement('span');
        p.className = 'splash-pill';
        p.textContent = f;
        pills.appendChild(p);
    });
    card.appendChild(pills);

    // Buttons
    var btns = document.createElement('div');
    btns.className = 'splash-btns';

    var btnTemplate = document.createElement('button');
    btnTemplate.className = 'splash-btn splash-btn-primary';
    btnTemplate.innerHTML = '✦ Kies een Startpack';
    btnTemplate.addEventListener('click', function() {
        markVisited();
        dismissSplash(overlay, function() {
            if (typeof openTemplateModal === 'function') openTemplateModal();
        });
    });

    var btnEmpty = document.createElement('button');
    btnEmpty.className = 'splash-btn splash-btn-sec';
    btnEmpty.textContent = 'Leeg project starten';
    btnEmpty.addEventListener('click', function() {
        markVisited();
        dismissSplash(overlay);
    });

    btns.appendChild(btnTemplate);
    btns.appendChild(btnEmpty);
    card.appendChild(btns);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'splash-footer';
    footer.innerHTML =
        '<a href="https://shotrecords.nl" target="_blank" class="splash-link">shotrecords.nl</a>' +
        '<span class="splash-sep">·</span>' +
        '<button class="splash-skip" id="splashSkipBtn">Niet meer tonen</button>' +
        '<span class="splash-sep">·</span>' +
        '<span class="splash-help">Druk <kbd>F1</kbd> voor de handleiding</span>';
    card.appendChild(footer);

    overlay.appendChild(card);

    // "Niet meer tonen" knop
    overlay.querySelector('#splashSkipBtn').addEventListener('click', function() {
        markVisited();
        dismissSplash(overlay);
    });

    // Klik buiten card sluit ook
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            markVisited();
            dismissSplash(overlay);
        }
    });

    document.body.appendChild(overlay);

    // Trigger entrance animation next frame
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            overlay.classList.add('splash-in');
        });
    });
}

// ── Init ──────────────────────────────────────────────────────

function init() {
    if (!hasVisited()) {
        buildSplash();
    }

    // Expose so it can be triggered manually (bijv. via Help → "Splash tonen")
    window.showSplash = function() { buildSplash(); };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
