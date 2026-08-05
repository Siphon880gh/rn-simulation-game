/**
 * Homepage links for secret ?game-over=<preset> modes.
 * Shown only when config/test.json has `"testGameOver": true`.
 */
(function () {
    const CONFIG_URL = 'config/test.json';
    const HOST_ID = 'landing-game-over-tests';

    /** Keep ids in sync with game/assets/js/game-over-test.js */
    const PRESETS = [
        { id: 'perfection', label: 'Perfection', blurb: 'Sharp shift — all done, no late' },
        { id: 'near-perfection', label: 'Near perfection', blurb: 'Steady charge — clean windows' },
        { id: 'lots-of-cheats', label: 'Lots of cheats', blurb: 'High cheat count on the meter' },
        { id: 'lots-of-late', label: 'Lots of late', blurb: '≥3 late demotes one tier' },
        { id: 'few-late', label: 'Few late', blurb: '1–2 late — no demotion' },
        { id: 'no-late', label: 'No late', blurb: 'Zero late; some missed open' },
        { id: 'getting-by', label: 'Getting by', blurb: 'Mid score → lost' },
        { id: 'off-pace', label: 'Off pace', blurb: 'Low score → lost' }
    ];

    function hrefFor(presetId) {
        const url = new URL('game/index.html', window.location.href);
        url.searchParams.set('game-over', presetId);
        url.searchParams.set('speed-factor', '720');
        url.searchParams.set('scenario', 'events/scenarios/icu-2.json');
        return url.pathname + url.search;
    }

    function render(host) {
        const links = PRESETS.map((p) => `
            <a class="landing-gotest__link" href="${hrefFor(p.id)}">
                <span class="landing-gotest__name">${p.label}</span>
                <span class="landing-gotest__blurb">${p.blurb}</span>
            </a>`).join('');

        host.hidden = false;
        host.innerHTML = `
            <div class="landing-path__intro">
                <h2 id="landing-gotest-title" class="landing-path__title">Game-over test presets</h2>
                <p class="landing-path__lede">
                    Instant shift end with seeded score / late / cheat counts
                    (<code>config/test.json</code> → <code>testGameOver</code>).
                </p>
            </div>
            <div class="landing-gotest__grid" role="list">${links}</div>`;
    }

    async function boot() {
        const host = document.getElementById(HOST_ID);
        if (!host) return;

        try {
            const response = await fetch(CONFIG_URL, { cache: 'no-cache' });
            if (!response.ok) return;
            const data = await response.json();
            if (data?.testGameOver !== true) return;
            render(host);
        } catch {
            // Config missing or unreachable — keep section hidden
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
