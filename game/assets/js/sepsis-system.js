/**
 * Sepsis screen (Q4H) — on complete, spawn hour-1 bundle when criteria met.
 * Challenge: challenges/skills/sepsis-recognition/
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { presentSpawnedTask, mountTaskDom } from './dynamic-tasks.js';
import { showShellToast } from './critical-labs.js';
import {
    decorateSepsisScreenDice,
    initSepsisScreenDiceUi,
    isSepsisScreenTask,
    rollSepsisScreenOutcome,
    storeSepsisScreenOnTask
} from './challenges/skills/sepsis-recognition/challenge.js';

const handledComplete = new Set();

function cfg() {
    return GameConfig.sepsisScreen || {};
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function statusMessage(msg) {
    const el = document.querySelector(GameConfig.selectors?.shellStatusMessage || '#shell-status-message');
    if (el) el.textContent = msg;
}

/**
 * Ensure a screen task has a rolled outcome (dice) before/at complete.
 */
export function ensureSepsisScreenOutcome(task, opts = {}) {
    if (!task) return null;
    if (task.metadata?.sepsisScreen?.id) {
        return task.metadata.sepsisScreen;
    }
    const outcome = rollSepsisScreenOutcome(opts);
    storeSepsisScreenOnTask(task, outcome);
    return {
        id: outcome.id,
        label: outcome.label,
        bundle: Boolean(outcome.bundle),
        bundleTier: outcome.bundleTier || null,
        classifyLabel: outcome.classifyLabel || outcome.label
    };
}

/**
 * Spawn hour-1 bundle tasks for a positive screen.
 * @returns {object[]} live tasks
 */
export function spawnSepsisBundle(patientId, screenTask, opts = {}) {
    const tier = opts.bundleTier
        || screenTask?.metadata?.sepsisScreen?.bundleTier
        || screenTask?.metadata?.sepsisScreen?.id
        || 'sepsis';
    const catalog = Array.isArray(cfg().bundleTasks) ? cfg().bundleTasks : [];
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? screenTask?.scheduled;
    const screenId = screenTask?.id || 'screen';
    const spawned = [];

    catalog.forEach((spec) => {
        const tiers = Array.isArray(spec.tiers) ? spec.tiers : ['sepsis', 'septic-shock', 'mods'];
        if (!tiers.includes(tier)) return;
        const id = `${patientId}-sepsis-bundle-${spec.idSuffix}-${screenId}`;
        if (gameState.getStateSlice('tasks')?.has(id)) return;

        const task = taskSystem.createTask({
            id,
            name: spec.name,
            type: spec.type || 'assessment',
            taskClass: spec.taskClass || GameConfig.tasks.classes.STAT || 'stat',
            scheduled: now,
            expire: spec.expire || '+60',
            durationMins: spec.durationMins ?? 10,
            status: GameConfig.tasks.statuses.NOT_YET,
            patientId,
            metadata: {
                ...(spec.metadata || {}),
                kind: spec.metadata?.kind || 'sepsis-bundle',
                fromSepsisScreen: true,
                parentScreenId: screenId,
                sepsisTier: tier
            }
        });
        const live = presentSpawnedTask(task, {
            at: now,
            focusPatient: spawned.length === 0,
            scrollIntoView: spawned.length === 0
        }) || task;
        if (live?.patientId) mountTaskDom(live);
        spawned.push(live);
    });

    return spawned;
}

function onTaskCompleted(task) {
    if (!task?.id || handledComplete.has(task.id)) return;
    if (!isSepsisScreenTask(task) && task.metadata?.kind !== 'sepsis-screen') return;
    handledComplete.add(task.id);

    const now = gameState.getStateSlice('currentTime') ?? task.scheduled;
    const outcomeMeta = ensureSepsisScreenOutcome(task);
    const patientId = task.patientId;
    if (!patientId) return;

    if (!outcomeMeta?.bundle) {
        showShellToast({
            title: outcomeMeta?.label || 'Screen clear',
            detail: 'No sepsis bundle required this cycle',
            iconClass: 'fas fa-check',
            hideAfterMs: cfg().toastMs ?? 4200
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Sepsis screen clear (${patientId}) — continue Q4H monitoring`,
            timeLabel: formatHHMM(now)
        });
        statusMessage('Sepsis screen clear');
        return;
    }

    const tier = outcomeMeta.bundleTier || outcomeMeta.id;
    const spawned = spawnSepsisBundle(patientId, task, { now, bundleTier: tier });
    const match = (cfg().outcomes || []).find((o) => o.id === outcomeMeta.id);
    showShellToast({
        title: match?.toastTitle || outcomeMeta.label || 'Sepsis criteria',
        detail: match?.toastDetail
            || `${spawned.length} bundle task(s) spawned`,
        iconClass: 'fas fa-biohazard',
        hideAfterMs: cfg().toastMs ?? 5200
    });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Sepsis screen ${outcomeMeta.label} (${patientId}) — ${spawned.length} bundle task(s)`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`Sepsis bundle ×${spawned.length}`);
}

export function resetSepsisSystem() {
    handledComplete.clear();
}

export function initSepsisSystem() {
    resetSepsisSystem();
    initSepsisScreenDiceUi();
    gameState.subscribe('tasks', (tasks) => {
        if (!tasks) return;
        tasks.forEach((task) => {
            if (task.status === GameConfig.tasks.statuses.COMPLETED) {
                onTaskCompleted(task);
            }
        });
        if (typeof document !== 'undefined') {
            decorateSepsisScreenDice(document);
        }
    });
}

const SepsisSystemModule = {
    init: initSepsisSystem,
    reset: resetSepsisSystem,
    spawnSepsisBundle,
    ensureSepsisScreenOutcome,
    decorateSepsisScreenDice
};

export default SepsisSystemModule;
