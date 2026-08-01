/**
 * Landing skill library — parallel start path (not after department).
 * - Start a shift: library.pack / unitHint / random unit (no auto challenge).
 * - Test skill: blank census + ?skill=&skillMode=test → practice modal → return here.
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
        `game/index.html?speed-factor=24&scenario=${UNIT_SCENARIO.tele}`,
        `game/index.html?speed-factor=24&scenario=${UNIT_SCENARIO.medsurg}`,
        `game/index.html?speed-factor=24&scenario=${UNIT_SCENARIO.icu}`
    ];

    /** Fixed unit filters (unitHint and/or matching tag). Sorted alphabetically by label. */
    const UNIT_FILTERS = [
        { value: 'unit:icu', label: 'ICU', unit: 'icu' },
        { value: 'unit:medsurg', label: 'Med-Surg', unit: 'medsurg' },
        { value: 'unit:tele', label: 'Telemetry', unit: 'tele' }
    ].sort((a, b) => a.label.localeCompare(b.label));

    /**
     * Topic tags split into groups. Options within each group are sorted A–Z by label.
     * Unknown library tags fall into “Other”.
     */
    const TOPIC_GROUPS = [
        {
            label: 'Care practices',
            tags: ['admission', 'assessment', 'emergency', 'infection', 'iv', 'meds', 'procedure', 'safety']
        },
        {
            label: 'Communication',
            tags: ['communication']
        },
        {
            label: 'Systems',
            tags: ['cardiac', 'diabetes', 'GI', 'neuro', 'pain', 'psych', 'renal', 'respiratory', 'skin', 'wound']
        }
    ];

    const TOPIC_LABELS = {
        neuro: 'Neuro',
        respiratory: 'Respiratory',
        cardiac: 'Cardiac',
        meds: 'Meds',
        iv: 'IV / drips',
        assessment: 'Assessment',
        procedure: 'Procedures',
        safety: 'Safety',
        admission: 'Admission',
        infection: 'Infection',
        wound: 'Wound',
        skin: 'Skin',
        pain: 'Pain',
        diabetes: 'Diabetes',
        renal: 'Renal',
        GI: 'GI',
        psych: 'Psych',
        emergency: 'Emergency',
        communication: 'Communication'
    };

    const dialog = document.getElementById('skill-choice-dialog');
    const openBtn = document.getElementById('landing-skill-open');
    const searchEl = document.getElementById('skill-choice-search');
    const filterEl = document.getElementById('skill-choice-filter');
    const listEl = document.getElementById('skill-choice-list');
    const emptyEl = document.getElementById('skill-choice-empty');
    const pickedEl = document.getElementById('skill-choice-picked');
    const btnStartShift = document.getElementById('skill-choice-start-shift');
    const btnShiftRecommended = document.getElementById('skill-choice-shift-recommended');
    const btnTest = document.getElementById('skill-choice-test');
    const btnCancel = document.getElementById('skill-choice-cancel');

    /** Skills where Start a shift is the preferred path (vs Test skill only). */
    const SHIFT_RECOMMENDED_SKILL_IDS = new Set(['sepsis-recognition']);

    if (!dialog || !listEl) return;

    /** @type {{ id: string, label: string, aliases?: string[], tags?: string[], blurb?: string, games?: string[], status?: string, pack?: string, unitHint?: string, patients?: string[] }[]} */
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
        if (filterEl) filterEl.value = '';
        renderList();
    }

    function closeDialog() {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    }

    function normalize(s) {
        return String(s || '').toLowerCase().trim();
    }

    function skillTags(skill) {
        return Array.isArray(skill?.tags) ? skill.tags.map(normalize) : [];
    }

    function skillUnit(skill) {
        return normalize(skill?.unitHint);
    }

    function matchesQuery(skill, q) {
        if (!q) return true;
        const hay = [
            skill.id,
            skill.label,
            skill.blurb,
            skill.unitHint,
            ...(skill.aliases || []),
            ...(skill.tags || [])
        ].map(normalize).join(' ');
        return hay.includes(q);
    }

    function matchesFilter(skill, filterValue) {
        if (!filterValue) return true;
        if (filterValue.startsWith('unit:')) {
            const unit = filterValue.slice(5);
            return skillUnit(skill) === unit || skillTags(skill).includes(unit);
        }
        if (filterValue.startsWith('tag:')) {
            const tag = filterValue.slice(4);
            return skillTags(skill).includes(tag);
        }
        return true;
    }

    function skillHasGames(skill) {
        return Array.isArray(skill?.games) && skill.games.some((g) => typeof g === 'string' && g.trim());
    }

    function topicLabel(tag) {
        const key = String(tag || '');
        if (TOPIC_LABELS[key]) return TOPIC_LABELS[key];
        const lower = normalize(key);
        const alias = Object.keys(TOPIC_LABELS).find((k) => normalize(k) === lower);
        if (alias) return TOPIC_LABELS[alias];
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function appendOptGroup(label, options) {
        if (!options.length) return;
        const group = document.createElement('optgroup');
        group.label = label;
        options
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .forEach((entry) => {
                const opt = document.createElement('option');
                opt.value = entry.value;
                opt.textContent = entry.label;
                group.appendChild(opt);
            });
        filterEl.appendChild(group);
    }

    function buildFilterOptions() {
        if (!filterEl) return;

        const presentUnits = new Set();
        const presentTags = new Set();
        skills.forEach((skill) => {
            const unit = skillUnit(skill);
            if (unit) presentUnits.add(unit);
            skillTags(skill).forEach((t) => {
                if (UNIT_FILTERS.some((u) => u.unit === t)) presentUnits.add(t);
                else presentTags.add(t);
            });
        });

        const prev = filterEl.value;
        filterEl.innerHTML = '';

        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = 'All skills';
        filterEl.appendChild(allOpt);

        appendOptGroup(
            'Unit',
            UNIT_FILTERS
                .filter((entry) => presentUnits.has(entry.unit))
                .map((entry) => ({ value: entry.value, label: entry.label }))
        );

        const claimed = new Set();
        const groupSpecs = TOPIC_GROUPS
            .map((group) => {
                const options = group.tags
                    .map((tag) => normalize(tag))
                    .filter((tag) => presentTags.has(tag))
                    .map((tag) => {
                        claimed.add(tag);
                        return { value: `tag:${tag}`, label: topicLabel(tag) };
                    });
                return { label: group.label, options };
            })
            .filter((g) => g.options.length)
            .sort((a, b) => a.label.localeCompare(b.label));

        groupSpecs.forEach((g) => appendOptGroup(g.label, g.options));

        const otherTags = [...presentTags]
            .filter((tag) => !claimed.has(tag))
            .map((tag) => ({ value: `tag:${tag}`, label: topicLabel(tag) }));
        appendOptGroup('Other', otherTags);

        if ([...filterEl.options].some((o) => o.value === prev)) {
            filterEl.value = prev;
        } else {
            filterEl.value = '';
        }
    }

    function renderList() {
        const q = normalize(searchEl?.value);
        const filterValue = filterEl?.value || '';
        const filtered = skills.filter((s) => matchesQuery(s, q) && matchesFilter(s, filterValue));
        listEl.innerHTML = '';

        if (emptyEl) {
            emptyEl.hidden = filtered.length > 0;
            emptyEl.textContent = filterValue || q
                ? 'No skills match that search or filter.'
                : 'No skills match that search.';
        }

        if (selectedId && !filtered.some((s) => s.id === selectedId)) {
            selectedId = null;
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
                pickedEl.textContent = `Selected: ${skill.label} — shift opens its patient pack; Test skill drills the practice game.`;
            } else {
                pickedEl.textContent = `Selected: ${skill.label} — shift uses a unit assignment; Test skill drills the practice game.`;
            }
        }
        if (btnStartShift) {
            btnStartShift.disabled = !selectedId;
        }
        if (btnShiftRecommended) {
            const showRecommended = Boolean(skill && SHIFT_RECOMMENDED_SKILL_IDS.has(skill.id));
            btnShiftRecommended.hidden = !showRecommended;
        }
        if (btnTest) {
            btnTest.disabled = !selectedId || !skillHasGames(skill);
        }
    }

    function pickRandomUnitHref() {
        const idx = Math.floor(Math.random() * RANDOM_UNIT_HREFS.length);
        return RANDOM_UNIT_HREFS[idx] || RANDOM_UNIT_HREFS[0];
    }

    function hrefForSkillShift(skill) {
        if (skill?.pack) {
            return `game/index.html?speed-factor=24&scenario=${encodeURIComponent(skill.pack)}`;
        }
        const hint = String(skill?.unitHint || '').toLowerCase();
        if (UNIT_SCENARIO[hint]) {
            return `game/index.html?speed-factor=24&scenario=${UNIT_SCENARIO[hint]}`;
        }
        return pickRandomUnitHref();
    }

    function navigateShift(skillId) {
        if (!skillId) return;
        const skill = skills.find((s) => s.id === skillId);
        window.location.href = hrefForSkillShift(skill);
    }

    function navigateTest(skillId) {
        if (!skillId) return;
        const url = new URL('game/index.html', window.location.href);
        url.searchParams.set('speed-factor', '48');
        // Include scenario so game/index.html’s no-scenario redirect never fires
        // (cached HTML or otherwise). skillMode=test still forces blank census.
        url.searchParams.set('scenario', 'events/scenarios/skill-test-blank.json');
        url.searchParams.set('skill', skillId);
        url.searchParams.set('skillMode', 'test');
        window.location.href = url.pathname + url.search + url.hash;
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
        buildFilterOptions();
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
    filterEl?.addEventListener('change', () => renderList());

    btnStartShift?.addEventListener('click', () => {
        if (!selectedId) return;
        navigateShift(selectedId);
    });

    btnTest?.addEventListener('click', () => {
        if (!selectedId) return;
        navigateTest(selectedId);
    });

    btnCancel?.addEventListener('click', () => {
        selectedId = null;
        closeDialog();
    });

    dialog.addEventListener('cancel', () => {
        selectedId = null;
    });
})();
