/**
 * Critical lab incidents — call MD within 1h; doctor callback always within that window
 * (immediate or randomly delayed after the nurse places the call).
 * After a delayed page: temporary “Dr will call back” toast; every recallEveryMins
 * without a callback, spawn a repeat urgent Call MD task.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { isAtOrAfterInShift, hhmmToMinutes, minutesFromShiftAnchor } from './availability-windows.js';
import { mountTaskDom, presentSpawnedTask } from './dynamic-tasks.js';
import { showCriticalLabMedia } from './media-placeholders.js';

const spawnedLabKeys = new Set();
/**
 * @type {Map<string, {
 *   callbackAt: number,
 *   windowEnd: number,
 *   labId: string,
 *   patientId: string,
 *   callTaskId: string,
 *   lab: object,
 *   nextRecallAt: number|null,
 *   recallCount: number
 * }>}
 */
const pendingCallbacks = new Map();
const spawnedCallbackKeys = new Set();
const spawnedRecallKeys = new Set();
const callbackCompleteHandled = new Set();

/** @type {ReturnType<typeof setTimeout>|null} */
let toastHideTimer = null;

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
    if (typeof document === 'undefined') return;
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

function ensureToastEl() {
    const sel = GameConfig.selectors.awaitingCallbackToast || '#shell-awaiting-callback-toast';
    let el = document.querySelector(sel);
    if (el) return el;
    el = document.createElement('div');
    el.id = 'shell-awaiting-callback-toast';
    el.className = 'shell-awaiting-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    el.innerHTML = `
        <div class="shell-awaiting-toast__card">
            <span class="shell-awaiting-toast__icon" aria-hidden="true"><i class="fas fa-phone-alt"></i></span>
            <div class="shell-awaiting-toast__copy">
                <p class="shell-awaiting-toast__title">Dr will call back</p>
                <p class="shell-awaiting-toast__detail"></p>
            </div>
        </div>
    `;
    document.body.appendChild(el);
    return el;
}

/**
 * Temporary top banner (same widget as “Dr will call back”).
 * @param {{ title?: string, detail?: string, iconClass?: string, hideAfterMs?: number }} [opts]
 */
export function showShellToast(opts = {}) {
    if (typeof document === 'undefined') return;
    const el = ensureToastEl();
    const titleEl = el.querySelector('.shell-awaiting-toast__title');
    const detailEl = el.querySelector('.shell-awaiting-toast__detail');
    const iconEl = el.querySelector('.shell-awaiting-toast__icon i');
    if (titleEl) titleEl.textContent = opts.title || cfg().awaitingToastMessage || 'Dr will call back';
    if (detailEl) detailEl.textContent = opts.detail || '';
    if (iconEl && opts.iconClass) {
        iconEl.className = opts.iconClass;
    } else if (iconEl && !opts.iconClass) {
        iconEl.className = 'fas fa-phone-alt';
    }
    el.hidden = false;
    // Force reflow so the enter transition runs when re-shown
    void el.offsetWidth;
    el.classList.add('is-visible');

    if (toastHideTimer) clearTimeout(toastHideTimer);
    const ms = Number(opts.hideAfterMs ?? cfg().awaitingToastMs);
    const hideAfter = Number.isFinite(ms) && ms > 0 ? ms : 4200;
    toastHideTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        toastHideTimer = setTimeout(() => {
            el.hidden = true;
            toastHideTimer = null;
        }, 300);
    }, hideAfter);
}

/**
 * Temporary, polished banner after paging MD (delayed callback path).
 * @param {{ labShort?: string, patientId?: string }} [detail]
 */
export function showAwaitingCallbackToast(detail = {}) {
    const bits = [];
    if (detail.labShort) bits.push(`Critical ${detail.labShort}`);
    if (detail.patientId) bits.push(detail.patientId);
    showShellToast({
        title: cfg().awaitingToastMessage || 'Dr will call back',
        detail: bits.length ? bits.join(' · ') : '',
        iconClass: 'fas fa-phone-alt'
    });
}

function hideAwaitingCallbackToast() {
    if (typeof document === 'undefined') return;
    if (toastHideTimer) {
        clearTimeout(toastHideTimer);
        toastHideTimer = null;
    }
    const el = document.querySelector(
        GameConfig.selectors.awaitingCallbackToast || '#shell-awaiting-callback-toast'
    );
    if (!el) return;
    el.classList.remove('is-visible');
    el.hidden = true;
}

function pickPatientId(preferred, random = Math.random) {
    const patients = gameState.getStateSlice('patients');
    if (!patients?.size) return null;
    if (preferred && patients.has(preferred)) return preferred;
    const ids = [...patients.keys()];
    return ids[Math.floor(random() * ids.length)] || null;
}

function resolveLab(metaOrPending) {
    const labId = metaOrPending.labId || metaOrPending.lab?.id;
    return labById(labId) || metaOrPending.lab || {
        id: labId,
        shortName: metaOrPending.labShort || metaOrPending.shortName,
        fullName: metaOrPending.labFull || metaOrPending.fullName,
        result: metaOrPending.labResult || metaOrPending.result,
        ordersHint: metaOrPending.ordersHint
    };
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

    const live = presentSpawnedTask(created, {
        at: gameState.getStateSlice('currentTime') || spec.at,
        focusPatient: Boolean(spec.focusPatient),
        scrollIntoView: spec.scrollIntoView
    }) || created;

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Critical lab ${lab.shortName} (${lab.result}) — call MD within ${windowMins} min (${spec.patientId})`,
        timeLabel: formatHHMM(spec.at)
    });
    statusMessage(`Critical ${lab.shortName} — call doctor`);
    showCriticalLabMedia({ labShort: lab.shortName, patientId: spec.patientId });
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

function hasOpenRecallFor(callTaskId) {
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks?.size) return false;
    const open = new Set([
        GameConfig.tasks.statuses.NOT_YET,
        GameConfig.tasks.statuses.ACTIVE,
        GameConfig.tasks.statuses.OVERDUE
    ]);
    for (const task of tasks.values()) {
        if (
            task.metadata?.kind === 'critical-lab-recall'
            && task.metadata?.callTaskId === callTaskId
            && open.has(task.status)
        ) {
            return true;
        }
    }
    return false;
}

function spawnRecallTask(pending, atHhmm) {
    const n = (pending.recallCount || 0) + 1;
    const key = `crit-recall-${pending.callTaskId}-${n}`;
    if (spawnedRecallKeys.has(key)) return null;
    if (gameState.getStateSlice('tasks')?.has(key)) {
        spawnedRecallKeys.add(key);
        return null;
    }
    if (hasOpenRecallFor(pending.callTaskId)) return null;

    spawnedRecallKeys.add(key);
    pending.recallCount = n;

    const lab = pending.lab;
    const created = taskSystem.createTask({
        id: key,
        type: 'criticallab',
        taskClass: GameConfig.tasks.classes.STAT,
        name: `Call MD again — critical ${lab.shortName}`,
        scheduled: atHhmm,
        expire: pending.windowEnd,
        durationMins: cfg().recallDurationMins ?? cfg().callDurationMins ?? 5,
        patientId: pending.patientId,
        metadata: {
            kind: 'critical-lab-recall',
            phase: 'recall',
            labId: lab.id,
            labShort: lab.shortName,
            labFull: lab.fullName,
            labResult: lab.result,
            ordersHint: lab.ordersHint,
            callTaskId: pending.callTaskId,
            windowEnd: pending.windowEnd,
            recallIndex: n,
            incident: true,
            criticalLab: true,
            urgent: true
        }
    });

    taskSystem.processTasks(gameState.getStateSlice('currentTime') || atHhmm);
    const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
    mountTaskDom(live);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Still no MD callback for critical ${lab.shortName} — call again (${pending.patientId})`,
        timeLabel: formatHHMM(atHhmm)
    });
    statusMessage(`Call MD again — ${lab.shortName}`);
    return live;
}

function scheduleNextRecall(pending, fromHhmm) {
    const every = Number(cfg().recallEveryMins);
    const mins = Number.isFinite(every) && every > 0 ? every : 15;
    const next = addMinutesToHhmm(fromHhmm, mins);
    // Only schedule if still before the doctor callback and inside the critical window
    if (isAtOrAfterInShift(next, pending.callbackAt)) {
        pending.nextRecallAt = null;
        return null;
    }
    if (isAtOrAfterInShift(next, pending.windowEnd)) {
        pending.nextRecallAt = null;
        return null;
    }
    pending.nextRecallAt = next;
    return next;
}

function processPendingRecalls(currentTime) {
    pendingCallbacks.forEach((pending) => {
        if (pending.nextRecallAt == null) return;
        if (!isAtOrAfterInShift(currentTime, pending.nextRecallAt)) return;
        // Doctor already due / about to spawn — do not stack a recall
        if (isAtOrAfterInShift(currentTime, pending.callbackAt)) {
            pending.nextRecallAt = null;
            return;
        }
        // One open re-call at a time; next 15m clock restarts when that Call MD is completed
        if (hasOpenRecallFor(pending.callTaskId)) return;
        const at = pending.nextRecallAt;
        pending.nextRecallAt = null;
        spawnRecallTask(pending, at);
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
    pending.nextRecallAt = null;

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
 * Force-spawn a critical lab call at current (or given) game time — for test mode / QA.
 * @param {{ labId?: string, patientId?: string, at?: number, random?: () => number, result?: string, lab?: object }} [opts]
 */
export function spawnCriticalLabNow(opts = {}) {
    const random = opts.random || Math.random;
    const now = opts.at ?? gameState.getStateSlice('currentTime')
        ?? GameConfig.timer.defaultShiftStart;
    const labs = cfg().labs || [];
    let lab = opts.labId ? labById(opts.labId) : null;
    if (!lab && opts.lab) lab = opts.lab;
    if (!lab && labs.length) {
        lab = labs[Math.floor(random() * labs.length)];
    }
    if (!lab) return null;

    if (opts.result || opts.lab) {
        lab = {
            ...lab,
            ...(opts.lab || {}),
            ...(opts.result ? { result: opts.result } : {})
        };
    }

    const patientId = pickPatientId(opts.patientId, random);
    if (!patientId) return null;

    const id = opts.id || `crit-test-${lab.id}-${Date.now()}-${Math.floor(random() * 1e4)}`;
    return createCallTask({
        id,
        at: Number(now),
        patientId,
        lab,
        focusPatient: opts.focusPatient === true,
        scrollIntoView: opts.scrollIntoView
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
    const lab = resolveLab(task.metadata);

    const callbackAt = pickCallbackAt(now, windowEnd, opts.random || Math.random);
    const pending = {
        callbackAt,
        windowEnd,
        labId: lab.id,
        patientId: task.patientId,
        callTaskId: task.id,
        lab,
        nextRecallAt: null,
        recallCount: 0
    };
    pendingCallbacks.set(task.id, pending);

    const immediate = Number(callbackAt) === Number(now);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: immediate
            ? `Called MD about critical ${lab.shortName} — doctor answering now`
            : `Called MD about critical ${lab.shortName} — awaiting callback (by ${formatHHMM(windowEnd)})`,
        timeLabel: formatHHMM(now)
    });

    if (immediate) {
        statusMessage(`Doctor on the line — ${lab.shortName}`);
        processPendingCallbacks(now);
    } else {
        statusMessage(`Paged MD — ${lab.shortName}`);
        showAwaitingCallbackToast({ labShort: lab.shortName, patientId: task.patientId });
        scheduleNextRecall(pending, now);
    }

    return { callbackAt, windowEnd, immediate, nextRecallAt: pending.nextRecallAt };
}

/**
 * Nurse re-pages MD after 15+ min with no callback — toast again; keep original callbackAt.
 */
export function handleCriticalLabRecallComplete(task, opts = {}) {
    if (!task?.id || task.metadata?.kind !== 'critical-lab-recall') return null;
    const callTaskId = task.metadata.callTaskId;
    const pending = callTaskId ? pendingCallbacks.get(callTaskId) : null;
    if (!pending) {
        statusMessage('MD already called back — no need to re-page');
        return null;
    }

    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;
    const lab = pending.lab || resolveLab(task.metadata);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Re-paged MD about critical ${lab.shortName} — still awaiting callback`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`Re-paged MD — ${lab.shortName}`);
    showAwaitingCallbackToast({ labShort: lab.shortName, patientId: pending.patientId });
    scheduleNextRecall(pending, now);

    return { nextRecallAt: pending.nextRecallAt, callbackAt: pending.callbackAt };
}

/**
 * After MD callback: spawn follow-up tasks declared on the lab (meds, assessments).
 */
function applyCallbackEffects(task, lab, now) {
    const effects = Array.isArray(lab?.callbackEffects) ? lab.callbackEffects : [];
    if (!effects.length) return [];

    const spawned = [];
    const callKey = task.metadata?.callTaskId || task.id;
    effects.forEach((effect, index) => {
        if (!effect?.name) return;
        const id = `crit-fx-${callKey}-${index}`;
        if (gameState.getStateSlice('tasks')?.has(id)) return;

        const created = taskSystem.createTask({
            id,
            type: effect.type || 'assessment',
            taskClass: effect.taskClass || GameConfig.tasks.classes.STAT,
            name: effect.name,
            scheduled: now,
            expire: effect.expire != null ? effect.expire : '+90',
            durationMins: effect.durationMins ?? 10,
            patientId: task.patientId || null,
            metadata: {
                ...(effect.metadata || {}),
                fromCriticalLabCallback: true,
                labId: lab.id,
                labShort: lab.shortName,
                incident: true
            }
        });

        taskSystem.processTasks(now);
        const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
        mountTaskDom(live);
        spawned.push(live);
    });

    return spawned;
}

/**
 * Player takes the callback — document orders and apply MD side-effect tasks.
 */
export function handleCriticalLabCallbackComplete(task) {
    if (!task?.id || task.metadata?.kind !== 'critical-lab-callback') return;
    if (callbackCompleteHandled.has(task.id)) return;
    callbackCompleteHandled.add(task.id);
    const callTaskId = task.metadata.callTaskId;
    if (callTaskId) {
        const pending = pendingCallbacks.get(callTaskId);
        if (pending) pending.nextRecallAt = null;
        pendingCallbacks.delete(callTaskId);
    }
    hideAwaitingCallbackToast();
    const now = gameState.getStateSlice('currentTime') ?? task.scheduled;
    const lab = resolveLab(task.metadata);
    const hint = lab.ordersHint || task.metadata.ordersHint || 'Follow new MD orders';
    const effects = applyCallbackEffects(task, lab, now);
    const effectNames = effects.map((t) => t.name).filter(Boolean);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: effectNames.length
            ? `MD orders for critical ${lab.shortName || task.metadata.labShort}: ${hint} → new tasks: ${effectNames.join('; ')}`
            : `MD orders for critical ${lab.shortName || task.metadata.labShort}: ${hint}`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(
        effectNames.length
            ? `Orders received — ${effectNames.join('; ')}`
            : `Orders received — ${lab.shortName || task.metadata.labShort}`
    );
}

function onTime(currentTime) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER) return;
    spawnScheduledLabs(currentTime);
    processPendingRecalls(currentTime);
    processPendingCallbacks(currentTime);
}

/** E10 Tools rail — pending MD callbacks (read-only snapshot). */
export function listPendingCriticalLabCallbacks() {
    return Array.from(pendingCallbacks.values()).map((p) => ({
        callTaskId: p.callTaskId,
        patientId: p.patientId,
        labId: p.labId || p.lab?.id || null,
        labShortName: p.lab?.shortName || null,
        callbackAt: p.callbackAt,
        windowEnd: p.windowEnd,
        recallCount: p.recallCount || 0
    }));
}

export function resetCriticalLabs() {
    spawnedLabKeys.clear();
    pendingCallbacks.clear();
    spawnedCallbackKeys.clear();
    spawnedRecallKeys.clear();
    callbackCompleteHandled.clear();
    hideAwaitingCallbackToast();
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
    handleCriticalLabRecallComplete,
    handleCriticalLabCallbackComplete,
    showShellToast,
    showAwaitingCallbackToast,
    spawnCriticalLabNow,
    pickCallbackAt,
    listPendingCriticalLabCallbacks,
    _addMinutesToHhmm: addMinutesToHhmm
};

export default CriticalLabsModule;
