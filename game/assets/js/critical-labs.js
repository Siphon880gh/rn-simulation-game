/**
 * Critical lab incidents — call MD within 1h; doctor callback always within that window
 * (immediate or randomly delayed after the nurse places the call).
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { isAtOrAfterInShift, hhmmToMinutes, minutesFromShiftAnchor } from './availability-windows.js';
import { mountTaskDom } from './dynamic-tasks.js';

const spawnedLabKeys = new Set();
/** @type {Map<string, { callbackAt: number, windowEnd: number, labId: string, patientId: string, callTaskId: string, lab: object }>} */
const pendingCallbacks = new Map();
const spawnedCallbackKeys = new Set();
const callbackCompleteHandled = new Set();

function cfg() {
    return GameConfig.criticalLabs || {};
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function addMinutesToHhmm(hhmm, minutes) {
    const total = (hhmmToMinutes(hhmm) ?? 0) + Number(minutes);
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    return Math.floor(normalized / 60) * 100 + (normalized % 60);
}

function labById(labId) {
    const labs = cfg().labs || [];
    return labs.find((l) => l.id === labId) || null;
}

/**
 * Pick callback HHMM after a successful call.
 * Always strictly before windowEnd when possible; otherwise at `now` (immediate).
 */
export function pickCallbackAt(nowHhmm, windowEndHhmm, random = Math.random) {
    const nowM = hhmmToMinutes(nowHhmm) ?? 0;
    let endM = hhmmToMinutes(windowEndHhmm) ?? 0;
    if (endM <= nowM) endM += 24 * 60;

    const remaining = endM - nowM;
    if (remaining <= 1) {
        return Number(nowHhmm);
    }

    const chance = Number(cfg().immediateCallbackChance);
    const immediateChance = Number.isFinite(chance) ? chance : 0.35;
    if (random() < immediateChance) {
        return Number(nowHhmm);
    }

    const delayCfg = cfg().callbackDelayMins || {};
    const minDelay = Math.max(1, Number(delayCfg.min) || 5);
    const maxDelay = Math.max(minDelay, Number(delayCfg.max) || 40);
    const maxAllowed = remaining - 1;
    const lo = Math.min(minDelay, maxAllowed);
    const hi = Math.min(maxDelay, maxAllowed);
    if (hi <= 0) return Number(nowHhmm);
    const delay = lo >= hi
        ? lo
        : lo + Math.floor(random() * (hi - lo + 1));
    return addMinutesToHhmm(nowHhmm, delay);
}

function statusMessage(text) {
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

function createCallTask(spec) {
    const key = spec.id;
    if (spawnedLabKeys.has(key)) return null;
    if (gameState.getStateSlice('tasks')?.has(key)) {
        spawnedLabKeys.add(key);
        return null;
    }
    spawnedLabKeys.add(key);

    const lab = spec.lab;
    const windowMins = Number(cfg().callWindowMins) || 60;
    const windowEnd = addMinutesToHhmm(spec.at, windowMins);
    const created = taskSystem.createTask({
        id: key,
        type: 'criticallab',
        taskClass: GameConfig.tasks.classes.STAT,
        name: `Call MD — critical ${lab.shortName}`,
        scheduled: spec.at,
        expire: windowEnd,
        durationMins: cfg().callDurationMins ?? 5,
        patientId: spec.patientId,
        metadata: {
            kind: 'critical-lab-call',
            phase: 'call',
            labId: lab.id,
            labShort: lab.shortName,
            labFull: lab.fullName,
            labResult: lab.result,
            ordersHint: lab.ordersHint,
            windowEnd,
            incident: true,
            criticalLab: true
        }
    });

    taskSystem.processTasks(gameState.getStateSlice('currentTime') || spec.at);
    const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
    mountTaskDom(live);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Critical lab ${lab.shortName} (${lab.result}) — call MD within ${windowMins} min (${spec.patientId})`,
        timeLabel: formatHHMM(spec.at)
    });
    statusMessage(`Critical ${lab.shortName} — call doctor`);
    return live;
}

function spawnScheduledLabs(currentTime) {
    const schedule = cfg().schedule || [];
    const max = Number(cfg().maxPerShift) || 4;
    let spawned = spawnedLabKeys.size;
    schedule.forEach((row) => {
        if (!row?.id || !row.labId) return;
        if (spawned >= max) return;
        if (!isAtOrAfterInShift(currentTime, row.at)) return;
        if (spawnedLabKeys.has(row.id)) return;
        const patients = gameState.getStateSlice('patients');
        if (!patients?.has(row.patientId)) {
            spawnedLabKeys.add(row.id);
            return;
        }
        const lab = labById(row.labId);
        if (!lab) {
            spawnedLabKeys.add(row.id);
            return;
        }
        const task = createCallTask({
            id: row.id,
            at: row.at,
            patientId: row.patientId,
            lab
        });
        if (task) spawned += 1;
    });
}

function spawnCallbackTask(pending, atHhmm) {
    const key = `crit-cb-${pending.callTaskId}`;
    if (spawnedCallbackKeys.has(key)) return null;
    if (gameState.getStateSlice('tasks')?.has(key)) {
        spawnedCallbackKeys.add(key);
        return null;
    }
    spawnedCallbackKeys.add(key);

    const lab = pending.lab;
    const created = taskSystem.createTask({
        id: key,
        type: 'criticallab',
        taskClass: GameConfig.tasks.classes.STAT,
        name: `MD callback — ${lab.shortName} orders`,
        scheduled: atHhmm,
        expire: pending.windowEnd,
        durationMins: cfg().callbackDurationMins ?? 8,
        patientId: pending.patientId,
        metadata: {
            kind: 'critical-lab-callback',
            phase: 'callback',
            labId: lab.id,
            labShort: lab.shortName,
            labFull: lab.fullName,
            labResult: lab.result,
            ordersHint: lab.ordersHint,
            callTaskId: pending.callTaskId,
            windowEnd: pending.windowEnd,
            incident: true,
            criticalLab: true
        }
    });

    taskSystem.processTasks(gameState.getStateSlice('currentTime') || atHhmm);
    const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
    mountTaskDom(live);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Doctor calling back re: critical ${lab.shortName} (${pending.patientId})`,
        timeLabel: formatHHMM(atHhmm)
    });
    statusMessage(`Doctor callback — ${lab.shortName}`);
    return live;
}

function processPendingCallbacks(currentTime) {
    pendingCallbacks.forEach((pending, callTaskId) => {
        if (!isAtOrAfterInShift(currentTime, pending.callbackAt)) return;
        spawnCallbackTask(pending, pending.callbackAt);
        pendingCallbacks.delete(callTaskId);
    });
}

/**
 * After nurse completes the call task: schedule MD callback inside the 1h window.
 */
export function handleCriticalLabCallComplete(task, opts = {}) {
    if (!task?.id || task.metadata?.kind !== 'critical-lab-call') return null;
    if (pendingCallbacks.has(task.id) || spawnedCallbackKeys.has(`crit-cb-${task.id}`)) {
        return null;
    }

    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;
    const windowEnd = task.metadata.windowEnd
        ?? addMinutesToHhmm(task.scheduled, cfg().callWindowMins || 60);
    const lab = labById(task.metadata.labId) || {
        id: task.metadata.labId,
        shortName: task.metadata.labShort,
        fullName: task.metadata.labFull,
        result: task.metadata.labResult,
        ordersHint: task.metadata.ordersHint
    };

    const callbackAt = pickCallbackAt(now, windowEnd, opts.random || Math.random);
    pendingCallbacks.set(task.id, {
        callbackAt,
        windowEnd,
        labId: lab.id,
        patientId: task.patientId,
        callTaskId: task.id,
        lab
    });

    const immediate = Number(callbackAt) === Number(now);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: immediate
            ? `Called MD about critical ${lab.shortName} — doctor answering now`
            : `Called MD about critical ${lab.shortName} — awaiting callback (by ${formatHHMM(windowEnd)})`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(
        immediate
            ? `Doctor on the line — ${lab.shortName}`
            : `Paged MD — waiting on callback (${lab.shortName})`
    );

    // Immediate callback: spawn on this same tick
    if (immediate) {
        processPendingCallbacks(now);
    }

    return { callbackAt, windowEnd, immediate };
}

/**
 * Player takes the callback — document orders (no further wait).
 */
export function handleCriticalLabCallbackComplete(task) {
    if (!task?.id || task.metadata?.kind !== 'critical-lab-callback') return;
    if (callbackCompleteHandled.has(task.id)) return;
    callbackCompleteHandled.add(task.id);
    const now = gameState.getStateSlice('currentTime') ?? task.scheduled;
    const hint = task.metadata.ordersHint || 'Follow new MD orders';
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `MD orders for critical ${task.metadata.labShort}: ${hint}`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`Orders received — ${task.metadata.labShort}`);
}

function onTime(currentTime) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER) return;
    spawnScheduledLabs(currentTime);
    processPendingCallbacks(currentTime);
}

export function resetCriticalLabs() {
    spawnedLabKeys.clear();
    pendingCallbacks.clear();
    spawnedCallbackKeys.clear();
    callbackCompleteHandled.clear();
}

export function initCriticalLabs() {
    resetCriticalLabs();
    gameState.subscribe('currentTime', (t) => onTime(t));
    gameState.subscribe('tasks', (tasks) => {
        if (!tasks) return;
        tasks.forEach((task) => {
            if (
                task.metadata?.kind === 'critical-lab-callback'
                && task.status === GameConfig.tasks.statuses.COMPLETED
            ) {
                handleCriticalLabCallbackComplete(task);
            }
        });
    });
}

export { addMinutesToHhmm as _addMinutesToHhmm, minutesFromShiftAnchor as _minutesFromShift };

const CriticalLabsModule = {
    init: initCriticalLabs,
    reset: resetCriticalLabs,
    handleCriticalLabCallComplete,
    handleCriticalLabCallbackComplete,
    pickCallbackAt,
    _addMinutesToHhmm: addMinutesToHhmm
};

export default CriticalLabsModule;
