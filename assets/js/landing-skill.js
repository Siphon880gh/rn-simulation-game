/**
 * Landing skill library — parallel start path (not after department).
 * Prefers library.pack / unitHint when set; else random unit + ?skill=<id>.
 * Catalog: game/events/skills/library.json
 */
(function () {
    const LIBRARY_URL = 'game/events/skills/library.json';
    const UNIT_SCENARIO = {
        tele: 'events/scenarios/tele-4.json',
        medsurg: 'events/scenarios/medsurg-5.json',
        icu: 'events/scenarios/icu-2.json'
    };
    const RANDOM_UNIT_HREFS = [
        `game/index.html?speed-factor=48&scenario=${UNIT_SCENARIO.tele}`,
        `game/index.html?speed-factor=48&scenario=${UNIT_SCENARIO.medsurg}`,
        `game/index.html?speed-factor=48&scenario=${UNIT_SCENARIO.icu}`
    ];

    const dialog = document.getElementById('skill-choice-dialog');
    const openBtn = document.getElementById('landing-skill-open');
    const searchEl = document.getElementById('skill-choice-search');
    const listEl = document.getElementById('skill-choice-list');
    const emptyEl = document.getElementById('skill-choice-empty');
    const pickedEl = document.getElementById('skill-choice-picked');
    const btnStart = document.getElementById('skill-choice-start');
    const btnCancel = document.getElementById('skill-choice-cancel');

    if (!dialog || !listEl) return;

    /** @type {{ id: string, label: string, aliases?: string[], tags?: string[], blurb?: string, games?: string[], status?: string }[]} */
    let skills = [];
    /** @type {string|null} */
    let selectedId = null;
    let libraryLoaded = false;

    function openDialog() {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        if (searchEl) {
            searchEl.value = '';
            searchEl.focus();
        }
        renderList();
    }

    function closeDialog() {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    }

    function normalize(s) {
        return String(s || '').toLowerCase().trim();
    }

    function matchesQuery(skill, q) {
        if (!q) return true;
        const hay = [
            skill.id,
            skill.label,
            skill.blurb,
            ...(skill.aliases || []),
            ...(skill.tags || [])
        ].map(normalize).join(' ');
        return hay.includes(q);
    }

    function renderList() {
        const q = normalize(searchEl?.value);
        const filtered = skills.filter((s) => matchesQuery(s, q));
        listEl.innerHTML = '';

        if (emptyEl) {
            emptyEl.hidden = filtered.length > 0;
        }

        filtered.forEach((skill) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'skill-choice-item';
            btn.setAttribute('role', 'option');
            btn.setAttribute('aria-selected', skill.id === selectedId ? 'true' : 'false');
            if (skill.id === selectedId) btn.classList.add('is-selected');
            btn.dataset.skillId = skill.id;
            btn.innerHTML = `
                <span class="skill-choice-item__label">${escapeHtml(skill.label || skill.id)}</span>
                <span class="skill-choice-item__meta">${escapeHtml(skill.blurb || skill.tags?.join(', ') || '')}</span>
            `;
            btn.addEventListener('click', () => selectSkill(skill.id));
            listEl.appendChild(btn);
        });

        syncPicked();
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function selectSkill(id) {
        selectedId = id;
        listEl.querySelectorAll('.skill-choice-item').forEach((el) => {
            const on = el.dataset.skillId === id;
            el.classList.toggle('is-selected', on);
            el.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        syncPicked();
    }

    function syncPicked() {
        const skill = skills.find((s) => s.id === selectedId);
        if (pickedEl) {
            if (!skill) {
                pickedEl.textContent = 'Select one skill to continue.';
            } else if (skill.pack || skill.patients?.length) {
                pickedEl.textContent = `Selected: ${skill.label} — opens the skill’s patient pack + practice game.`;
            } else {
                pickedEl.textContent = `Selected: ${skill.label} — unit + practice game (no dedicated patient pack yet).`;
            }
        }
        if (btnStart) {
            btnStart.disabled = !selectedId;
        }
    }

    function pickRandomUnitHref() {
        const idx = Math.floor(Math.random() * RANDOM_UNIT_HREFS.length);
        return RANDOM_UNIT_HREFS[idx] || RANDOM_UNIT_HREFS[0];
    }

    function hrefForSkill(skill) {
        if (skill?.pack) {
            return `game/index.html?speed-factor=48&scenario=${encodeURIComponent(skill.pack)}`;
        }
        const hint = String(skill?.unitHint || '').toLowerCase();
        if (UNIT_SCENARIO[hint]) {
            return `game/index.html?speed-factor=48&scenario=${UNIT_SCENARIO[hint]}`;
        }
        return pickRandomUnitHref();
    }

    function navigate(skillId) {
        if (!skillId) return;
        const skill = skills.find((s) => s.id === skillId);
        const baseHref = hrefForSkill(skill);
        try {
            const url = new URL(baseHref, window.location.href);
            url.searchParams.set('skill', skillId);
            window.location.href = url.pathname + url.search + url.hash;
        } catch {
            const join = baseHref.includes('?') ? '&' : '?';
            window.location.href = `${baseHref}${join}skill=${encodeURIComponent(skillId)}`;
        }
    }

    async function ensureLibrary() {
        if (libraryLoaded) return;
        try {
            const res = await fetch(LIBRARY_URL, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            skills = Array.isArray(data?.skills)
                ? data.skills.filter((s) => s && s.id && s.status !== 'hidden')
                : [];
        } catch (err) {
            console.warn('Skill library load failed', err);
            skills = [];
        }
        libraryLoaded = true;
    }

    async function openSkillChoice() {
        selectedId = null;
        await ensureLibrary();
        openDialog();
    }

    openBtn?.addEventListener('click', () => {
        openSkillChoice();
    });

    searchEl?.addEventListener('input', () => renderList());

    btnStart?.addEventListener('click', () => {
        if (!selectedId) return;
        navigate(selectedId);
    });

    btnCancel?.addEventListener('click', () => {
        selectedId = null;
        closeDialog();
    });

    dialog.addEventListener('cancel', () => {
        selectedId = null;
    });
})();
