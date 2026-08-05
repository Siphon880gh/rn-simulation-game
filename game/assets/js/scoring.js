/**
 * Scoring hooks (E6.M1) — task / challenge / thin satisfaction signals in game-state.
 * Practice framing only — not a competency assessment.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

const scoredTaskEvents = new Set();
const scoredSatisfaction = new Set();
let prevTaskSnap = new Map();

function cfg() {
    return GameConfig.scoring || {};
}

function emptyScore() {
    return {
        total: Number(cfg().startingTotal) || 100,
        taskPoints: 0,
        challengePoints: 0,
        satisfactionPoints: 0,
        cheatsUsed: 0,
        challengeFails: 0,
        challengePasses: 0,
        testSeeded: false,
        events: []
    };
}

export function getScore() {
    return gameState.getStateSlice('score') || emptyScore();
}

export function recordCheatUsed() {
    gameState.dispatch('RECORD_CHEAT');
    return getScore();
}

/**
 * Performance meter band from final score (+ thin late demotion).
 * Labels are training language — not clinical competency claims.
 */
export function resolvePerformanceBand(score, counts = {}) {
    const total = Number(score?.total ?? cfg().startingTotal ?? 100);
    const bands = cfg().outcomes || {};
    const missed = Number(counts.missed) || 0;
    const late = Number(counts.late) || 0;

    const ordered = [
        bands.offPace || { min: 0, id: 'off-pace', label: 'Off pace', result: 'lost' },
        bands.gettingBy || { min: 70, id: 'getting-by', label: 'Getting by', result: 'lost' },
        bands.steadyCharge || { min: 90, id: 'steady-charge', label: 'Steady charge', result: 'won' },
        bands.sharpShift || { min: 110, id: 'sharp-shift', label: 'Sharp shift', result: 'won' }
    ];

    let band = ordered[0];
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
        if (total >= (ordered[i].min ?? 0)) {
            band = ordered[i];
            break;
        }
    }

    // ≥3 too-lates demote one tier when not already off-pace
    if (late >= 3 && band.id !== 'off-pace') {
        const idx = ordered.findIndex((b) => b.id === band.id);
        if (idx > 0) band = ordered[idx - 1];
    }

    const result = band.result === 'won' ? 'won' : 'lost';

    return {
        id: band.id || 'off-pace',
        label: band.label || 'Off pace',
        result,
        total,
        framing: 'Practice outcome for training — not a clinical competency assessment.',
        guidance: missed || late
            ? 'Review late/missed items and whether slot pressure blocked higher-acuity work.'
            : 'Solid completion pattern — try a denser hour or tighter windows next run.',
        meter: ordered.map((b) => ({
            id: b.id,
            label: b.label,
            result: b.result === 'won' ? 'won' : 'lost',
            min: b.min,
            active: b.id === (band.id || 'off-pace')
        }))
    };
}

/** @deprecated use resolvePerformanceBand */
export function resolvePracticeOutcome(score, counts = {}) {
    return resolvePerformanceBand(score, counts);
}

export function adjustScore({ delta, reason, dimension = 'task', silent = false, challengePass, challengeFail } = {}) {
    const amount = Number(delta) || 0;
    if (!amount && reason !== 'init' && !challengePass && !challengeFail) return getScore();
    gameState.dispatch('ADJUST_SCORE', {
        delta: amount,
        reason: reason || 'adjust',
        dimension,
        challengePass: !!challengePass,
        challengeFail: !!challengeFail
    });
    return getScore();
}

export function recordChallengeOutcome({ passed, reason, expected } = {}) {
    const weights = cfg().challenge || {};
    if (passed) {
        adjustScore({
            delta: Number(weights.pass) || 5,
            reason: `challenge pass (${reason || 'ok'})`,
            dimension: 'challenge',
            challengePass: true
        });
        return;
    }
    const cite = expected ? ` — expected “${expected}”` : '';
    adjustScore({
        delta: Number(weights.fail) || -8,
        reason: `challenge fail (${reason || 'incorrect'})${cite}`,
        dimension: 'challenge',
        challengeFail: true
    });
}

function scoreTaskTransition(taskId, prevStatus, nextStatus, task) {
    const key = `${taskId}:${prevStatus}->${nextStatus}`;
    if (scoredTaskEvents.has(key)) return;
    scoredTaskEvents.add(key);

    const w = cfg().tasks || {};
    if (nextStatus === GameConfig.tasks.statuses.COMPLETED) {
        // Completed after overdue still counts as complete but smaller (late complete)
        const delta = prevStatus === GameConfig.tasks.statuses.OVERDUE
            ? (Number(w.lateComplete) || 2)
            : (Number(w.complete) || 10);
        adjustScore({
            delta,
            reason: `task ${nextStatus}: ${task?.name || taskId}`,
            dimension: 'task'
        });
        return;
    }
    if (nextStatus === GameConfig.tasks.statuses.OVERDUE) {
        adjustScore({
            delta: Number(w.overdue) || -6,
            reason: `task overdue: ${task?.name || taskId}`,
            dimension: 'task'
        });
    }
}

function scoreMissedOpenTasks() {
    const w = cfg().tasks || {};
    const miss = Number(w.miss) || -4;
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks) return;
    tasks.forEach((task) => {
        if (
            task.status === GameConfig.tasks.statuses.NOT_YET
            || task.status === GameConfig.tasks.statuses.ACTIVE
        ) {
            const key = `${task.id}:miss`;
            if (scoredTaskEvents.has(key)) return;
            scoredTaskEvents.add(key);
            adjustScore({
                delta: miss,
                reason: `task missed/open at end: ${task.name || task.id}`,
                dimension: 'task'
            });
        }
    });
}

function scoreSatisfactionFromPatients() {
    const w = cfg().satisfaction || {};
    const patients = gameState.getStateSlice('patients');
    if (!patients) return;
    patients.forEach((patient) => {
        const status = patient.clinicalStatus || 'stable';
        const key = `${patient.id}:${status}`;
        if (scoredSatisfaction.has(key)) return;
        if (status === 'stable') return;
        scoredSatisfaction.add(key);
        if (status === 'watch') {
            adjustScore({
                delta: Number(w.watch) || -3,
                reason: `satisfaction: ${patient.name || patient.id} → watch`,
                dimension: 'satisfaction'
            });
        } else if (status === 'worsening') {
            adjustScore({
                delta: Number(w.worsening) || -8,
                reason: `satisfaction: ${patient.name || patient.id} → worsening`,
                dimension: 'satisfaction'
            });
        }
    });
}

function onTasksChanged(tasks) {
    if (!tasks) return;
    const nextSnap = new Map();
    tasks.forEach((task, id) => {
        nextSnap.set(id, task.status);
        const prev = prevTaskSnap.get(id);
        if (prev && prev !== task.status) {
            scoreTaskTransition(id, prev, task.status, task);
        }
    });
    prevTaskSnap = nextSnap;
}

export function finalizeShiftScore() {
    // Preset seeds lock the snapshot so miss/satisfaction hooks do not rewrite QA totals
    if (getScore()?.testSeeded) return getScore();
    scoreMissedOpenTasks();
    scoreSatisfactionFromPatients();
    return getScore();
}

export function resetScoring() {
    scoredTaskEvents.clear();
    scoredSatisfaction.clear();
    prevTaskSnap = new Map();
    gameState.dispatch('RESET_SCORE');
}

const ScoringModule = {
    getScore,
    adjustScore,
    recordCheatUsed,
    recordChallengeOutcome,
    finalizeShiftScore,
    resolvePerformanceBand,
    resolvePracticeOutcome,
    resetScoring,
    init() {
        resetScoring();
        gameState.subscribe('tasks', (tasks) => onTasksChanged(tasks));
        gameState.subscribe('patients', () => {
            scoreSatisfactionFromPatients();
        });
        gameState.subscribe('gameStatus', (status) => {
            if (status === GameConfig.gameStates.GAME_OVER) {
                finalizeShiftScore();
            }
        });
    }
};

export default ScoringModule;
