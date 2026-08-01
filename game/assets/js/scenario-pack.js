/**
 * Thin scenario pack loader (E4.M1) — JSON metadata + patient id list.
 * Shell / ABOUT.md remain the default player-facing disclaimer.
 */
import gameState from './game-state.js';
import { GameConfig } from './game-config.js';

const DEFAULT_PACK_URL = GameConfig.scenario?.defaultPackUrl
    || 'events/scenarios/night-shift-default.json';

export function normalizePack(raw, sourceUrl) {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Scenario pack must be a JSON object');
    }
    const patients = Array.isArray(raw.patients)
        ? raw.patients.map(String).filter(Boolean)
        : [];
    const allowEmptyCensus = raw.allowEmptyCensus === true || raw.id === 'skill-test-blank';
    if (!patients.length && !allowEmptyCensus) {
        throw new Error('Scenario pack requires a non-empty patients array');
    }
    const patientOverrides = raw.patientOverrides && typeof raw.patientOverrides === 'object'
        ? raw.patientOverrides
        : {};
    return {
        id: String(raw.id || 'unnamed-pack'),
        title: String(raw.title || 'Scenario pack'),
        version: Number(raw.version) || 1,
        department: typeof raw.department === 'string' ? raw.department : null,
        fictionalOnly: raw.fictionalOnly !== false,
        disclaimer: typeof raw.disclaimer === 'string' ? raw.disclaimer : '',
        learningObjectives: Array.isArray(raw.learningObjectives)
            ? raw.learningObjectives.map(String).filter(Boolean)
            : [],
        patients,
        patientOverrides,
        events: Array.isArray(raw.events) ? raw.events : [],
        orderInjections: raw.orderInjections && typeof raw.orderInjections === 'object'
            ? raw.orderInjections
            : {},
        dynamicTemplates: Array.isArray(raw.dynamicTemplates) ? raw.dynamicTemplates : [],
        spawnPlan: raw.spawnPlan && typeof raw.spawnPlan === 'object' ? raw.spawnPlan : null,
        scene: raw.scene && typeof raw.scene === 'object' ? raw.scene : null,
        incidentPackUrl: typeof raw.incidentPackUrl === 'string' ? raw.incidentPackUrl : null,
        shiftStart: Number.isFinite(Number(raw.shiftStart)) ? Number(raw.shiftStart) : null,
        shiftDurationHours: Number.isFinite(Number(raw.shiftDurationHours))
            ? Number(raw.shiftDurationHours)
            : null,
        sourceUrl
    };
}

/** Merge E7.M2 chaos/incident pack events + templates into a scenario pack. */
export function mergeIncidentPack(pack, incidentRaw) {
    if (!pack || !incidentRaw || typeof incidentRaw !== 'object') return pack;
    const extraEvents = Array.isArray(incidentRaw.events) ? incidentRaw.events : [];
    const extraTemplates = Array.isArray(incidentRaw.dynamicTemplates)
        ? incidentRaw.dynamicTemplates
        : [];
    const seenEventIds = new Set((pack.events || []).map((e) => e?.id).filter(Boolean));
    const mergedEvents = [
        ...(pack.events || []),
        ...extraEvents.filter((e) => e?.id && !seenEventIds.has(e.id))
    ];
    const seenTpl = new Set((pack.dynamicTemplates || []).map((t) => t?.id).filter(Boolean));
    const mergedTemplates = [
        ...(pack.dynamicTemplates || []),
        ...extraTemplates.filter((t) => t?.id && !seenTpl.has(t.id))
    ];
    const spawnPlan = (incidentRaw.spawnPlan && typeof incidentRaw.spawnPlan === 'object')
        ? incidentRaw.spawnPlan
        : (pack.spawnPlan || null);
    return {
        ...pack,
        events: mergedEvents,
        dynamicTemplates: mergedTemplates,
        spawnPlan,
        incidentPackId: String(incidentRaw.id || 'incident-pack'),
        incidentPackTitle: String(incidentRaw.title || 'Incident pack')
    };
}

export async function loadIncidentPack(url) {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load incident pack: ${url} (${response.status})`);
    }
    return response.json();
}

export async function loadScenarioPack(url = DEFAULT_PACK_URL) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load scenario pack: ${url} (${response.status})`);
    }
    let pack = normalizePack(await response.json(), url);

    const incidentUrl = pack.incidentPackUrl
        || GameConfig.scenario?.defaultIncidentPackUrl
        || null;
    if (incidentUrl) {
        try {
            const incident = await loadIncidentPack(incidentUrl);
            pack = mergeIncidentPack(pack, incident);
        } catch (err) {
            console.warn('Incident pack load skipped:', err?.message || err);
        }
    }

    gameState.dispatch('SET_SCENARIO_PACK', { pack });
    return pack;
}

/** Map pack department / scene theme → top-left brand unit label. */
const DEPARTMENT_BRAND_LABELS = {
    icu: 'ICU',
    medsurg: 'Med-Surge',
    tele: 'Tele',
    ed: 'ED'
};

function resolveDepartmentLabel(pack) {
    const key = String(pack?.department || pack?.scene?.theme || '').toLowerCase();
    return DEPARTMENT_BRAND_LABELS[key] || null;
}

function applyShellBrand(pack) {
    const unit = resolveDepartmentLabel(pack);
    const brand = unit ? `RN Shift Simulator: ${unit}` : 'RN Shift Simulator';
    const brandEl = document.querySelector('#shell-brand-title');
    if (brandEl) {
        brandEl.textContent = brand;
        if (unit) brandEl.dataset.department = String(pack.department || pack.scene?.theme || '');
        else delete brandEl.dataset.department;
    }
    document.title = brand;
}

/** Gray subtitle under brand — pack title plus census/admission mode. */
function resolveCensusModeSubtitle() {
    const key = GameConfig.urlParams?.census || 'census';
    const raw = new URLSearchParams(window.location.search).get(key);
    switch (raw) {
        case 'minus1':
            return 'one less, no admission';
        case 'admitStart':
            return 'one less, starting admission';
        case 'admitMiddle':
            return 'one less, middle admission';
        case 'openAdmit':
            return 'one less, open to admit';
        default:
            return null;
    }
}

function applyPackChrome(pack) {
    applyShellBrand(pack);
    const titleEl = document.querySelector('#scenario-pack-title');
    if (titleEl) {
        const modeNote = resolveCensusModeSubtitle();
        titleEl.textContent = modeNote
            ? `${pack.title} · ${modeNote}`
            : pack.title;
    }
    // Pack disclaimer is optional pack metadata — do not replace #fiction-disclaimer
    const packNote = document.querySelector('#scenario-pack-note');
    if (packNote && pack.disclaimer) {
        packNote.textContent = pack.disclaimer;
        packNote.hidden = false;
    }
    const objEl = document.querySelector('#scenario-pack-objectives');
    if (objEl && pack.learningObjectives.length) {
        objEl.innerHTML = pack.learningObjectives
            .map((o) => `<li>${o}</li>`)
            .join('');
        objEl.closest('[data-scenario-objectives]')?.removeAttribute('hidden');
    }
}

/** Landing “Test skill”: ?skill=…&skillMode=test (or bare ?skill=). */
function isSkillTestMode() {
    const params = new URLSearchParams(window.location.search);
    const skillKey = GameConfig.urlParams?.skill || 'skill';
    const modeKey = GameConfig.urlParams?.skillMode || 'skillMode';
    if (!params.get(skillKey)) return false;
    const mode = params.get(modeKey);
    return mode === 'test' || mode == null;
}

/** In-memory empty pack for landing “Test skill” (no census patients). */
function buildSkillTestBlankPack() {
    return {
        id: 'skill-test-blank',
        title: 'Skill test',
        version: 1,
        department: null,
        fictionalOnly: true,
        disclaimer: '',
        learningObjectives: [],
        patients: [],
        patientOverrides: {},
        events: [],
        orderInjections: {},
        dynamicTemplates: [],
        scene: null,
        incidentPackUrl: null,
        shiftStart: null,
        shiftDurationHours: null,
        sourceUrl: null
    };
}

const ScenarioPackModule = {
    DEFAULT_PACK_URL,
    loadScenarioPack,
    loadIncidentPack,
    mergeIncidentPack,
    normalizePack,
    applyPackChrome,
    isSkillTestMode,
    async init(url) {
        // Test skill always uses a blank census, even if ?scenario= is present
        // (landing passes skill-test-blank so the no-scenario HTML guard never fires).
        if (isSkillTestMode()) {
            const pack = buildSkillTestBlankPack();
            gameState.dispatch('SET_SCENARIO_PACK', { pack });
            applyPackChrome(pack);
            return pack;
        }
        const packUrl = url
            || new URLSearchParams(window.location.search).get(GameConfig.urlParams?.scenarioPack || 'scenario')
            || DEFAULT_PACK_URL;
        const pack = await loadScenarioPack(packUrl);
        applyPackChrome(pack);
        return pack;
    },
    getActivePack() {
        return gameState.getStateSlice('scenarioPack');
    }
};

export default ScenarioPackModule;
