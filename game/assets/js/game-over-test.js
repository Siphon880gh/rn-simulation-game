/**
 * Secret URL game-over presets (?game-over=<id>).
 * Active only when game/test-mode.json has `"testGameOver": true`.
 * Seeds task/score state then ends the shift so debrief / performance logic can be inspected.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { resetScoring } from './scoring.js';

const STATUSES = GameConfig.tasks.statuses;

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
    const url = testCfg().configUrl || 'test-mode.json';
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

function resolvePatientId() {
    const patients = gameState.getStateSlice('patients');
    if (!patients || typeof patients.keys !== 'function') return 'unit';
    const first = [...patients.keys()][0];
    return first || 'unit';
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
    const patientId = resolvePatientId();
    const tasks = [];
    for (let i = 0; i < (preset.completed || 0); i += 1) {
        tasks.push(makeTask(`got-done-${i}`, `Completed task ${i + 1}`, STATUSES.COMPLETED, patientId));
    }
    for (let i = 0; i < (preset.late || 0); i += 1) {
        tasks.push(makeTask(`got-late-${i}`, `Late task ${i + 1}`, STATUSES.OVERDUE, patientId));
    }
    for (let i = 0; i < (preset.missed || 0); i += 1) {
        tasks.push(makeTask(`got-miss-${i}`, `Missed task ${i + 1}`, STATUSES.NOT_YET, patientId));
    }
    gameState.dispatch('REPLACE_TASKS', { tasks });
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

    gameState.dispatch('SET_SCORE', {
        total: preset.total,
        taskPoints: preset.total - (Number(GameConfig.scoring?.startingTotal) || 100),
        challengePoints: 0,
        satisfactionPoints: 0,
        cheatsUsed: preset.cheatsUsed || 0,
        challengeFails: preset.challengeFails || 0,
        challengePasses: preset.challengePasses || 0,
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
 * If URL has ?game-over=<id> and config allows it, seed + end shift.
 * @param {{ handleGameOver: Function }} app
 * @returns {Promise<{ applied: boolean, preset?: object, reason?: string }>}
 */
export async function maybeRunGameOverTest(app) {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(paramKey());
    if (!raw) return { applied: false, reason: 'no-param' };

    await loadTestGameOverConfig();
    if (!isTestGameOverEnabled()) {
        console.warn(`Game-over test ignored — set testGameOver: true in ${testCfg().configUrl || 'test-mode.json'}`);
        return { applied: false, reason: 'disabled' };
    }

    const preset = applyGameOverTestPreset(raw);
    if (!preset) {
        console.warn(`Game-over test: unknown preset "${raw}"`);
        return { applied: false, reason: 'unknown-preset' };
    }

    // Let the first paint settle, then end via the real game-over path
    await new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
    });

    if (typeof app?.handleGameOver === 'function') {
        app.handleGameOver();
    } else {
        gameState.dispatch('GAME_OVER');
    }

    return { applied: true, preset };
}

const GameOverTestModule = {
    init: async (app) => maybeRunGameOverTest(app),
    applyGameOverTestPreset,
    listGameOverTestPresets,
    getGameOverTestPreset,
    isTestGameOverEnabled,
    loadTestGameOverConfig,
    GAME_OVER_TEST_PRESETS
};

export default GameOverTestModule;
