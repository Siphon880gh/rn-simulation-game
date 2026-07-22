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
        events: []
    };
}

export function getScore() {
    return gameState.getStateSlice('score') || emptyScore();
}

function showLiveScoreCue(delta, reason) {
    const status = document.querySelector?.(GameConfig.selectors.statusMessage);
    const scoreEl = document.querySelector?.('#shell-score');
    const sign = delta > 0 ? `+${delta}` : String(delta);
    const short = (reason || '').replace(/^task\s+/i, '').slice(0, 48);
    if (status) {
        status.textContent = `Score ${sign}${short ? ` · ${short}` : ''}`;
    }
    if (scoreEl?.classList) {
        scoreEl.classList.remove('score-cue-up', 'score-cue-down');
        void scoreEl.offsetWidth;
        scoreEl.classList.add(delta >= 0 ? 'score-cue-up' : 'score-cue-down');
    }
}

/**
 * Practice outcome band from final score (+ thin miss/late pressure).
 * Labels are training language — not clinical competency claims.
 */
export function resolvePracticeOutcome(score, counts = {}) {
    const total = Number(score?.total ?? cfg().startingTotal ?? 100);
    const bands = cfg().outcomes || {};
    const missed = Number(counts.missed) || 0;
    const late = Number(counts.late) || 0;

    let band = bands.overtimeRisk || {
        id: 'overtime-risk',
        label: 'Overtime / miss risk framing',
        min: 0
    };
    if (total >= (bands.strong?.min ?? 110)) band = bands.strong;
    else if (total >= (bands.pass?.min ?? 90)) band = bands.pass;
    else if (total >= (bands.needsPractice?.min ?? 70)) band = bands.needsPractice;

    // Heavy open/late work nudges framing even if points are mid-band
    if ((missed >= 3 || late >= 3) && total < (bands.strong?.min ?? 110)) {
        band = bands.overtimeRisk || band;
    }

    return {
        id: band.id || 'on-track',
        label: band.label || 'On track — keep practicing',
        total,
        framing: 'Practice outcome for training — not a clinical competency assessment.',
        guidance: missed || late
            ? 'Review late/missed items and whether slot pressure blocked higher-acuity work.'
            : 'Solid completion pattern — try a denser hour or tighter windows next run.'
    };
}

export function adjustScore({ delta, reason, dimension = 'task', silent = false } = {}) {
    const amount = Number(delta) || 0;
    if (!amount && reason !== 'init') return getScore();
    gameState.dispatch('ADJUST_SCORE', {
        delta: amount,
        reason: reason || 'adjust',
        dimension
    });
    if (!silent && amount) {
        showLiveScoreCue(amount, reason);
    }
    return getScore();
}

export function recordChallengeOutcome({ passed, reason, expected } = {}) {
    const weights = cfg().challenge || {};
    if (passed) {
        adjustScore({
            delta: Number(weights.pass) || 5,
            reason: `challenge pass (${reason || 'ok'})`,
            dimension: 'challenge'
        });
        return;
    }
    const cite = expected ? ` — expected “${expected}”` : '';
    adjustScore({
        delta: Number(weights.fail) || -8,
        reason: `challenge fail (${reason || 'incorrect'})${cite}`,
        dimension: 'challenge'
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

function paintScoreChrome() {
    const el = document.querySelector('#shell-score');
    if (!el) return;
    const score = getScore();
    el.textContent = `Score ${score.total}`;
    el.title = [
        `Tasks ${score.taskPoints >= 0 ? '+' : ''}${score.taskPoints}`,
        `Challenges ${score.challengePoints >= 0 ? '+' : ''}${score.challengePoints}`,
        `Satisfaction ${score.satisfactionPoints >= 0 ? '+' : ''}${score.satisfactionPoints}`
    ].join(' · ');
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
    paintScoreChrome();
}

export function finalizeShiftScore() {
    scoreMissedOpenTasks();
    scoreSatisfactionFromPatients();
    paintScoreChrome();
    return getScore();
}

export function resetScoring() {
    scoredTaskEvents.clear();
    scoredSatisfaction.clear();
    prevTaskSnap = new Map();
    gameState.dispatch('RESET_SCORE');
    paintScoreChrome();
}

const ScoringModule = {
    getScore,
    adjustScore,
    recordChallengeOutcome,
    finalizeShiftScore,
    resolvePracticeOutcome,
    resetScoring,
    init() {
        resetScoring();
        gameState.subscribe('tasks', (tasks) => onTasksChanged(tasks));
        gameState.subscribe('patients', () => {
            scoreSatisfactionFromPatients();
            paintScoreChrome();
        });
        gameState.subscribe('score', () => paintScoreChrome());
        gameState.subscribe('gameStatus', (status) => {
            if (status === GameConfig.gameStates.GAME_OVER) {
                finalizeShiftScore();
            }
        });
        paintScoreChrome();
    }
};

export default ScoringModule;
