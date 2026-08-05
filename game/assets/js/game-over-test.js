/**
 * Secret URL game-over presets (?game-over=<id>).
 * Active only when config/test.json has `"testGameOver": true`.
 * Seeds task/score state then ends the shift so debrief / performance logic can be inspected.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { resetScoring } from './scoring.js';

const STATUSES = GameConfig.tasks.statuses;

/** Sample incorrect perform answers for presets with challengeFails > 0. */
export const SAMPLE_CHALLENGE_MISSES = [
    {
        challenge: 'Med identity',
        prompt: 'What is the brand name for metoprolol?',
        given: 'Metformin',
        expected: 'Lopressor / Toprol-XL',
        reason: 'med-identity-incorrect'
    },
    {
        challenge: 'Accu-Chek',
        prompt: 'Patient glucose is 52 mg/dL — best next action?',
        given: 'Document and recheck in 4 hours',
        expected: 'Treat hypoglycemia per protocol / give fast carbs or D50 as ordered',
        reason: 'accucheck-incorrect'
    },
    {
        challenge: 'Skill MCQ',
        prompt: 'First priority when sepsis is suspected?',
        given: 'Wait for culture results before any antibiotics',
        expected: 'Obtain cultures and start broad-spectrum antibiotics promptly',
        reason: 'skill-mcq-incorrect'
    },
    {
        challenge: 'IV rate',
        prompt: '1 L NS over 8 hours — mL/hr?',
        given: '250 mL/hr',
        expected: '125 mL/hr',
        reason: 'iv-incorrect'
    },
    {
        challenge: 'Code Blue',
        prompt: 'First pulse check after starting CPR?',
        given: 'After 5 minutes of uninterrupted compressions',
        expected: 'After 2 minutes / ~5 cycles of CPR',
        reason: 'code-blue-incorrect'
    }
];

/** Fake census for QA game-over seeds (immediate boot skips patient pack load). */
const SAMPLE_PATIENTS = [
    { id: 'maria', name: 'Maria Santos', clinicalStatus: 'stable' },
    { id: 'james', name: 'James Okonkwo', clinicalStatus: 'watch' },
    { id: 'elena', name: 'Elena Vargas', clinicalStatus: 'stable' }
];

/** Clinical-looking task labels (cycled) so debrief lists are not “Completed task 1”. */
const SAMPLE_TASK_NAMES = {
    completed: [
        'Metoprolol 25 mg PO',
        'Q2H turn / reposition',
        'Accu-Chek + sliding-scale insulin',
        'IV site assessment',
        'Lisinopril 10 mg PO',
        'Incentive spirometry coaching',
        'Wound dressing change',
        'Morning labs draw'
    ],
    late: [
        'Vancomycin trough draw',
        'Heparin SQ 5000 U',
        'Neuro checks q1h',
        'IVPB ceftriaxone hang',
        'Call MD — critical K+',
        'Pain reassessment'
    ],
    missed: [
        'Bedside swallow screen',
        'Insulin glargine 20 U SQ',
        'Fall-risk toileting assist',
        'Sepsis screen / SIRS review',
        'Consent for CT with contrast',
        'Skin check — pressure areas'
    ]
};

/** Landing + verify scripts can import the catalog without applying. */
export const GAME_OVER_TEST_PRESETS = {
    perfection: {
        id: 'perfection',
        label: 'Perfection',
        blurb: 'Sharp shift — all done, no late, no cheats',
        total: 120,
        cheatsUsed: 0,
        challengePasses: 4,
        challengeFails: 0,
        completed: 8,
        late: 0,
        missed: 0
    },
    'near-perfection': {
        id: 'near-perfection',
        label: 'Near perfection',
        blurb: 'Steady charge — solid score, clean windows',
        total: 100,
        cheatsUsed: 0,
        challengePasses: 2,
        challengeFails: 0,
        completed: 6,
        late: 0,
        missed: 0
    },
    'lots-of-cheats': {
        id: 'lots-of-cheats',
        label: 'Lots of cheats',
        blurb: 'Steady charge with a high cheat count',
        total: 100,
        cheatsUsed: 9,
        challengePasses: 1,
        challengeFails: 0,
        completed: 5,
        late: 0,
        missed: 0
    },
    'lots-of-late': {
        id: 'lots-of-late',
        label: 'Lots of late',
        blurb: '≥3 too-late demotes Steady → Getting by (lost)',
        total: 100,
        cheatsUsed: 0,
        challengePasses: 0,
        challengeFails: 1,
        completed: 2,
        late: 4,
        missed: 0
    },
    'few-late': {
        id: 'few-late',
        label: 'Few late',
        blurb: '1–2 late — no demotion tier drop',
        total: 100,
        cheatsUsed: 0,
        challengePasses: 1,
        challengeFails: 0,
        completed: 4,
        late: 2,
        missed: 0
    },
    'no-late': {
        id: 'no-late',
        label: 'No late',
        blurb: 'Zero late; some still open at end',
        total: 95,
        cheatsUsed: 0,
        challengePasses: 1,
        challengeFails: 0,
        completed: 5,
        late: 0,
        missed: 2
    },
    'getting-by': {
        id: 'getting-by',
        label: 'Getting by',
        blurb: 'Mid score → lost band',
        total: 75,
        cheatsUsed: 1,
        challengePasses: 0,
        challengeFails: 2,
        completed: 3,
        late: 1,
        missed: 2
    },
    'off-pace': {
        id: 'off-pace',
        label: 'Off pace',
        blurb: 'Low score → lost',
        total: 45,
        cheatsUsed: 0,
        challengePasses: 0,
        challengeFails: 3,
        completed: 1,
        late: 2,
        missed: 5
    }
};

let configLoaded = false;
let testGameOverEnabled = false;

function testCfg() {
    return GameConfig.testMode || {};
}

function paramKey() {
    return GameConfig.urlParams?.gameOver || 'game-over';
}

export function listGameOverTestPresets() {
    return Object.values(GAME_OVER_TEST_PRESETS);
}

export function getGameOverTestPreset(id) {
    if (!id) return null;
    return GAME_OVER_TEST_PRESETS[String(id).trim()] || null;
}

export function isTestGameOverEnabled() {
    return configLoaded && testGameOverEnabled === true;
}

export async function loadTestGameOverConfig() {
    const url = testCfg().configUrl || '../config/test.json';
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            configLoaded = true;
            testGameOverEnabled = false;
            return { testGameOver: false };
        }
        const data = await response.json();
        configLoaded = true;
        testGameOverEnabled = data?.testGameOver === true;
        return { testGameOver: testGameOverEnabled };
    } catch (err) {
        console.warn('Game-over test: failed to load config JSON', err);
        configLoaded = true;
        testGameOverEnabled = false;
        return { testGameOver: false };
    }
}

function resolvePatientId(index = 0) {
    const patients = gameState.getStateSlice('patients');
    if (patients && typeof patients.keys === 'function') {
        const ids = [...patients.keys()];
        if (ids.length) return ids[index % ids.length];
    }
    return SAMPLE_PATIENTS[index % SAMPLE_PATIENTS.length]?.id || 'unit';
}

function ensureSamplePatients() {
    const patients = gameState.getStateSlice('patients');
    const hasAny = patients && typeof patients.keys === 'function' && [...patients.keys()].length > 0;
    if (hasAny) return;
    SAMPLE_PATIENTS.forEach((patient) => {
        gameState.dispatch('REGISTER_PATIENT', { patient: { ...patient } });
    });
}

function pickTaskName(bucket, index) {
    const list = SAMPLE_TASK_NAMES[bucket] || [];
    if (!list.length) return `${bucket} task ${index + 1}`;
    return list[index % list.length];
}

function makeTask(id, name, status, patientId) {
    return {
        id,
        type: 'med',
        name,
        scheduled: 1900,
        expire: 1930,
        duration: 5,
        durationMins: 5,
        patientId,
        status,
        metadata: { gameOverTest: true },
        schemaVersion: GameConfig.tasks.schemaVersion
    };
}

function seedTasksFromPreset(preset) {
    ensureSamplePatients();
    const tasks = [];
    for (let i = 0; i < (preset.completed || 0); i += 1) {
        tasks.push(makeTask(
            `got-done-${i}`,
            pickTaskName('completed', i),
            STATUSES.COMPLETED,
            resolvePatientId(i)
        ));
    }
    for (let i = 0; i < (preset.late || 0); i += 1) {
        tasks.push(makeTask(
            `got-late-${i}`,
            pickTaskName('late', i),
            STATUSES.OVERDUE,
            resolvePatientId(i + 1)
        ));
    }
    for (let i = 0; i < (preset.missed || 0); i += 1) {
        tasks.push(makeTask(
            `got-miss-${i}`,
            pickTaskName('missed', i),
            STATUSES.NOT_YET,
            resolvePatientId(i + 2)
        ));
    }
    gameState.dispatch('REPLACE_TASKS', { tasks });
}

/**
 * Build N sample miss rows for QA presets (cycles the sample pool if needed).
 * @param {number} count
 * @returns {object[]}
 */
export function buildSeededChallengeMisses(count) {
    const n = Math.max(0, Number(count) || 0);
    if (!n || !SAMPLE_CHALLENGE_MISSES.length) return [];
    const out = [];
    for (let i = 0; i < n; i += 1) {
        const sample = SAMPLE_CHALLENGE_MISSES[i % SAMPLE_CHALLENGE_MISSES.length];
        out.push({
            ...sample,
            at: 'test',
            ts: Date.now() + i
        });
    }
    return out;
}

/**
 * Seed score + tasks for a preset. Does not open the modal.
 * @returns {object|null} preset applied, or null
 */
export function applyGameOverTestPreset(presetId) {
    const preset = getGameOverTestPreset(presetId);
    if (!preset) return null;

    resetScoring();
    seedTasksFromPreset(preset);

    const challengeMisses = Array.isArray(preset.challengeMisses)
        ? preset.challengeMisses
        : buildSeededChallengeMisses(preset.challengeFails || 0);

    gameState.dispatch('SET_SCORE', {
        total: preset.total,
        taskPoints: preset.total - (Number(GameConfig.scoring?.startingTotal) || 100),
        challengePoints: 0,
        satisfactionPoints: 0,
        cheatsUsed: preset.cheatsUsed || 0,
        challengeFails: preset.challengeFails || 0,
        challengePasses: preset.challengePasses || 0,
        challengeMisses,
        testSeeded: true,
        events: [{
            delta: 0,
            dimension: 'task',
            reason: `test game-over preset: ${preset.id}`,
            at: gameState.getStateSlice('currentTime'),
            ts: Date.now()
        }]
    });

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST game-over preset: ${preset.label} (${preset.id})`,
        timeLabel: 'test'
    });

    return preset;
}

/**
 * If URL has ?game-over=<id> and config allows it, seed + end shift immediately.
 * @param {{ handleGameOver: Function }} app
 * @param {string} [presetId] — when omitted, read from the URL
 * @returns {Promise<{ applied: boolean, preset?: object, reason?: string }>}
 */
export async function runImmediateGameOverTest(app, presetId) {
    const raw = presetId || peekGameOverTestParam();
    if (!raw) return { applied: false, reason: 'no-param' };

    await loadTestGameOverConfig();
    if (!isTestGameOverEnabled()) {
        console.warn(`Game-over test ignored — set testGameOver: true in ${testCfg().configUrl || '../config/test.json'}`);
        return { applied: false, reason: 'disabled' };
    }

    const preset = applyGameOverTestPreset(raw);
    if (!preset) {
        console.warn(`Game-over test: unknown preset "${raw}"`);
        return { applied: false, reason: 'unknown-preset' };
    }

    if (typeof app?.handleGameOver === 'function') {
        app.handleGameOver();
    } else {
        gameState.dispatch('GAME_OVER');
    }

    return { applied: true, preset };
}

/** @deprecated prefer runImmediateGameOverTest — kept for callers that expect maybe* naming */
export async function maybeRunGameOverTest(app) {
    return runImmediateGameOverTest(app);
}

export function peekGameOverTestParam() {
    if (typeof window === 'undefined' || !window.location?.search) return null;
    return new URLSearchParams(window.location.search).get(paramKey());
}

const GameOverTestModule = {
    init: async (app) => runImmediateGameOverTest(app),
    runImmediate: runImmediateGameOverTest,
    applyGameOverTestPreset,
    listGameOverTestPresets,
    getGameOverTestPreset,
    peekGameOverTestParam,
    isTestGameOverEnabled,
    loadTestGameOverConfig,
    buildSeededChallengeMisses,
    SAMPLE_CHALLENGE_MISSES,
    GAME_OVER_TEST_PRESETS
};

export default GameOverTestModule;
