/**
 * Open-to-admit scheduling + admission checklist (E9).
 * Hold last pack patient; spawn mid-shift with Admitting phase + task chain.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { isAtOrAfterInShift, hhmmToMinutes } from './availability-windows.js';
import { mountTaskDom } from './dynamic-tasks.js';
import { showAwaitingCallbackToast } from './critical-labs.js';
import { getAdmissionProfile } from './admission-quiz.js';

const spawnedTaskKeys = new Set();
const pendingCallbacks = new Map();
const spawnedCallbackKeys = new Set();
const spawnedRecallKeys = new Set();
const callbackCompleteHandled = new Set();

let shiftStart = GameConfig.timer.defaultShiftStart;
let shiftDurationMins = GameConfig.timer.defaultShiftDuration;
let patientsModule = null;
let unsubTime = null;
let unsubTasks = null;

function cfg() {
    return GameConfig.admission || {};
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

function statusMessage(text) {
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

function isOpenAdmitMode(mode) {
    return mode === 'openAdmit'
        || mode === 'admitStart'
        || mode === 'admitMiddle';
}

/**
 * Pick admit HHMM in a shift band.
 * @param {number} shiftStartHhmm
 * @param {number} durationMins
 * @param {() => number} [random]
 * @param {{ windowKey?: 'start'|'middle'|'nearEnd' }} [opts] — force band; else random
 * @returns {{ admitAt: number, windowKey: string }}
 */
export function pickAdmitAt(shiftStartHhmm, durationMins, random = Math.random, opts = {}) {
    const windows = cfg().windows || {};
    const keys = ['start', 'middle', 'nearEnd'].filter((k) => windows[k]);
    let windowKey = opts.windowKey;
    if (windowKey !== 'start' && windowKey !== 'middle' && windowKey !== 'nearEnd') {
        windowKey = keys[Math.floor(random() * keys.length)] || 'middle';
    }
    const band = windows[windowKey] || { minPct: 0.45, maxPct: 0.55 };
    const minPct = Number(band.minPct);
    const maxPct = Number(band.maxPct);
    const lo = Number.isFinite(minPct) ? minPct : 0.45;
    const hi = Number.isFinite(maxPct) ? Math.max(lo, maxPct) : 0.55;
    const pct = lo + random() * (hi - lo);
    const offset = Math.max(1, Math.round(Number(durationMins) * pct));
    return {
        admitAt: addMinutesToHhmm(shiftStartHhmm, offset),
        windowKey
    };
}

function windowKeyForMode(mode) {
    if (mode === 'admitStart') return 'start';
    if (mode === 'admitMiddle') return 'middle';
    return null;
}

/** Same callback timing model as critical labs. */
export function pickAdmissionCallbackAt(nowHhmm, windowEndHhmm, random = Math.random) {
    const callCfg = cfg().callAdmitting || {};
    const nowM = hhmmToMinutes(nowHhmm) ?? 0;
    let endM = hhmmToMinutes(windowEndHhmm) ?? 0;
    if (endM <= nowM) endM += 24 * 60;
    const remaining = endM - nowM;
    if (remaining <= 1) return Number(nowHhmm);

    const chance = Number(callCfg.immediateCallbackChance);
    const immediateChance = Number.isFinite(chance) ? chance : 0.35;
    if (random() < immediateChance) return Number(nowHhmm);

    const delayCfg = callCfg.callbackDelayMins || {};
    const minDelay = Math.max(1, Number(delayCfg.min) || 5);
    const maxDelay = Math.max(minDelay, Number(delayCfg.max) || 40);
    const maxAllowed = remaining - 1;
    const lo = Math.min(minDelay, maxAllowed);
    const hi = Math.min(maxDelay, maxAllowed);
    if (hi <= 0) return Number(nowHhmm);
    const delay = lo >= hi ? lo : lo + Math.floor(random() * (hi - lo + 1));
    return addMinutesToHhmm(nowHhmm, delay);
}

function mountAdmissionTask(task) {
    if (!task?.patientId) return;
    const panel = document.querySelector(`.patient-panel-host[data-patient-id="${task.patientId}"]`);
    if (!panel) {
        mountTaskDom(task);
        return;
    }

    let list = panel.querySelector('.admission-tasks-list');
    if (!list) {
        const block = document.createElement('div');
        block.className = 'space-y-2 mb-4 admission-tasks-block';
        const heading = document.createElement('h4');
        heading.className = 'font-semibold flex items-center gap-2 text-teal-800';
        heading.innerHTML = '<i class="fas fa-hospital-user"></i> Admission';
        list = document.createElement('ul');
        list.className = 'admission-tasks-list space-y-3';
        block.appendChild(heading);
        block.appendChild(list);
        const patientRoot = panel.querySelector('.patient') || panel;
        patientRoot.insertBefore(block, patientRoot.firstChild);
    }

    if (document.getElementById(task.id)) return;

    const li = document.createElement('li');
    li.id = task.id;
    li.setAttribute('data-task-type', task.type);
    li.setAttribute('data-status', task.status);
    li.setAttribute('data-scheduled', String(task.scheduled).padStart(4, '0'));
    if (task.expire != null) {
        li.setAttribute('data-expire', String(task.expire).padStart(4, '0'));
    }
    li.setAttribute('data-duration-mins', String(task.duration || 10));
    li.setAttribute('data-task-class', task.taskClass || 'urgent');
    if (task.metadata?.challenge) {
        li.setAttribute('data-challenge', task.metadata.challenge);
    }
    li.setAttribute('title', 'Click for Perform / Details menu');
    li.className = `bg-teal-50 p-4 rounded-lg shadow flex items-center task-status-${task.status} border border-teal-200`;
    const phase = task.metadata?.phase;
    const badge = phase === 'callback'
        ? 'callback'
        : phase === 'recall'
            ? 'recall'
            : phase === 'findNurse'
                ? 'find nurse'
                : 'admission';
    li.innerHTML = `
      <data class="slot-label" value="1"></data>
      <i class="fas fa-hospital-user text-teal-600 text-xl mr-3"></i>
      <span class="font-medium text-gray-900 flex-1 min-w-0">${task.name}</span>
      <span class="ml-auto text-xs uppercase tracking-wide text-teal-700">${badge}</span>
    `;
    list.appendChild(li);
}

function createAdmissionTask(spec) {
    const key = spec.id;
    if (spawnedTaskKeys.has(key) || gameState.getStateSlice('tasks')?.has(key)) {
        spawnedTaskKeys.add(key);
        return null;
    }
    spawnedTaskKeys.add(key);

    const created = taskSystem.createTask({
        id: key,
        type: spec.type || 'admission',
        taskClass: spec.taskClass || GameConfig.tasks.classes.URGENT,
        name: spec.name,
        scheduled: spec.scheduled,
        expire: spec.expire,
        durationMins: spec.durationMins ?? 8,
        patientId: spec.patientId,
        metadata: {
            admission: true,
            ...(spec.metadata || {})
        }
    });

    const now = gameState.getStateSlice('currentTime') || spec.scheduled;
    taskSystem.processTasks(now);
    const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
    mountAdmissionTask(live);
    return live;
}

function spawnChecklist(patientId, admitAt) {
    const templates = cfg().tasks || [];
    templates.forEach((tpl) => {
        if (tpl.spawn === 'findNurse') {
            spawnFindNurseAttempt(patientId, admitAt, 1);
            return;
        }
        if (tpl.phase === 'callback' || tpl.challenge === 'skinCheck') return;

        const scheduled = addMinutesToHhmm(admitAt, Number(tpl.scheduledOffsetMins) || 0);
        const expire = addMinutesToHhmm(
            admitAt,
            Number(tpl.expireOffsetMins) || 120
        );
        const isCall = tpl.phase === 'call' || tpl.spawn === 'call';
        const callCfg = cfg().callAdmitting || {};
        const profile = getAdmissionProfile(patientId);
        createAdmissionTask({
            id: `admit-${patientId}-${tpl.id}`,
            type: tpl.type || 'admission',
            taskClass: tpl.taskClass,
            name: tpl.name,
            scheduled,
            expire: isCall
                ? addMinutesToHhmm(scheduled, callCfg.callWindowMins || 60)
                : expire,
            durationMins: tpl.durationMins,
            patientId,
            metadata: {
                challenge: tpl.challenge || null,
                phase: tpl.phase || null,
                admissionChallenge: tpl.challenge || null,
                templateId: tpl.id,
                ...(isCall
                    ? {
                        kind: 'admission-call',
                        phase: 'call',
                        consult: profile.consult,
                        windowEnd: addMinutesToHhmm(scheduled, callCfg.callWindowMins || 60)
                    }
                    : {})
            }
        });
    });
}

function spawnFindNurseAttempt(patientId, atHhmm, attempt) {
    const fn = cfg().findNurse || {};
    const max = Number(fn.maxAttempts) || 4;
    if (attempt > max) return null;
    const id = `admit-${patientId}-find-nurse-${attempt}`;
    const expire = addMinutesToHhmm(atHhmm, Number(fn.expireOffsetMins) || 45);
    gameState.dispatch('UPDATE_ADMIT_HOLD', { findNurseAttempt: attempt });
    return createAdmissionTask({
        id,
        type: 'admission',
        taskClass: GameConfig.tasks.classes.URGENT,
        name: attempt === 1
            ? 'Find second nurse for skin check (Might no one available)'
            : `Find second nurse for skin check (Might no one available) — attempt ${attempt}`,
        scheduled: atHhmm,
        expire,
        durationMins: fn.durationMins ?? 8,
        patientId,
        metadata: {
            phase: 'findNurse',
            findNurseAttempt: attempt,
            admission: true
        }
    });
}

function spawnSkinCheck(patientId, atHhmm) {
    return createAdmissionTask({
        id: `admit-${patientId}-skin-check`,
        type: 'admission',
        taskClass: GameConfig.tasks.classes.URGENT,
        name: 'Skin check with nurse',
        scheduled: atHhmm,
        expire: addMinutesToHhmm(atHhmm, 60),
        durationMins: 10,
        patientId,
        metadata: {
            challenge: 'skinCheck',
            admissionChallenge: 'skinCheck',
            phase: 'skinCheck',
            admission: true
        }
    });
}

async function spawnAdmitPatient() {
    const hold = gameState.getStateSlice('admitHold');
    if (!hold?.heldPatientId || hold.spawned || !isOpenAdmitMode(hold.mode)) return null;
    if (!patientsModule?.initializePatient || !patientsModule.getPatientConfigs) return null;

    const configs = patientsModule.getPatientConfigs();
    const config = configs[hold.heldPatientId];
    if (!config) {
        gameState.dispatch('UPDATE_ADMIT_HOLD', { spawned: true });
        return null;
    }

    const patient = await patientsModule.initializePatient(config, {
        skipPackTasks: true,
        admissionPhase: 'admitting'
    });

    gameState.dispatch('UPDATE_ADMIT_HOLD', { spawned: true });
    gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: patient.id });
    patientsModule.renderPatientTabs?.();
    patientsModule.applyPanelVisibility?.();

    const admitAt = hold.admitAt
        || gameState.getStateSlice('currentTime')
        || shiftStart;
    spawnChecklist(patient.id, Number(admitAt));

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `New admission — ${patient.name} (${hold.windowKey || 'mid-shift'})`,
        timeLabel: formatHHMM(admitAt)
    });
    statusMessage(`New admission: ${patient.name}`);
    return patient;
}

function scheduleNextRecall(pending, fromHhmm) {
    const every = Number(cfg().callAdmitting?.recallEveryMins) || 15;
    pending.nextRecallAt = addMinutesToHhmm(fromHhmm, every);
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
            task.metadata?.kind === 'admission-recall'
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
    const key = `admit-recall-${pending.callTaskId}-${n}`;
    if (spawnedRecallKeys.has(key)) return null;
    spawnedRecallKeys.add(key);
    pending.recallCount = n;

    const callCfg = cfg().callAdmitting || {};
    const created = createAdmissionTask({
        id: key,
        type: 'admission',
        taskClass: GameConfig.tasks.classes.STAT,
        name: 'Call admitting again',
        scheduled: atHhmm,
        expire: pending.windowEnd,
        durationMins: callCfg.recallDurationMins ?? 5,
        patientId: pending.patientId,
        metadata: {
            kind: 'admission-recall',
            phase: 'recall',
            callTaskId: pending.callTaskId,
            consult: pending.consult,
            admission: true
        }
    });
    if (created) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `No admitting callback yet — re-call due (${pending.patientId})`,
            timeLabel: formatHHMM(atHhmm)
        });
    }
    return created;
}

function spawnCallbackTask(pending, atHhmm) {
    const key = `admit-cb-${pending.callTaskId}`;
    if (spawnedCallbackKeys.has(key)) return null;
    spawnedCallbackKeys.add(key);
    pending.nextRecallAt = null;

    const callCfg = cfg().callAdmitting || {};
    return createAdmissionTask({
        id: key,
        type: 'admission',
        taskClass: GameConfig.tasks.classes.STAT,
        name: `Admitting MD callback — orders / ${pending.consult}`,
        scheduled: atHhmm,
        expire: pending.windowEnd,
        durationMins: callCfg.callbackDurationMins ?? 10,
        patientId: pending.patientId,
        metadata: {
            kind: 'admission-callback',
            phase: 'callback',
            callTaskId: pending.callTaskId,
            consult: pending.consult,
            admission: true
        }
    });
}

function processPendingCallbacks(currentTime) {
    pendingCallbacks.forEach((pending, callTaskId) => {
        if (pending.nextRecallAt != null && isAtOrAfterInShift(currentTime, pending.nextRecallAt)) {
            if (!isAtOrAfterInShift(currentTime, pending.callbackAt)
                && !hasOpenRecallFor(pending.callTaskId)) {
                const at = pending.nextRecallAt;
                pending.nextRecallAt = null;
                spawnRecallTask(pending, at);
            } else if (isAtOrAfterInShift(currentTime, pending.callbackAt)) {
                pending.nextRecallAt = null;
            }
        }
        if (!isAtOrAfterInShift(currentTime, pending.callbackAt)) return;
        spawnCallbackTask(pending, pending.callbackAt);
        pendingCallbacks.delete(callTaskId);
    });
}

function clearAdmittingPhase(patientId) {
    if (!patientId) return;
    gameState.dispatch('UPDATE_PATIENT', {
        patientId,
        patch: { admissionPhase: 'admitted', clinicalStatusReason: 'Admission complete' }
    });
    patientsModule?.renderPatientTabs?.();
}

function spawnConsultTask(patientId, consult, atHhmm) {
    return createAdmissionTask({
        id: `admit-${patientId}-consult-${consult.replace(/\s+/g, '-').toLowerCase()}`,
        type: 'admission',
        taskClass: GameConfig.tasks.classes.URGENT,
        name: `Call consult — ${consult}`,
        scheduled: atHhmm,
        expire: addMinutesToHhmm(atHhmm, 120),
        durationMins: 10,
        patientId,
        metadata: {
            challenge: null,
            phase: 'consult',
            consult,
            admission: true
        }
    });
}

/**
 * Find-nurse perform: roll success; retry every 30m up to 4 attempts.
 */
export function handleFindNursePerform(task, opts = {}) {
    if (task?.metadata?.phase !== 'findNurse') return { ok: false };
    const fn = cfg().findNurse || {};
    const attempt = Number(task.metadata.findNurseAttempt) || 1;
    const max = Number(fn.maxAttempts) || 4;
    const chances = Array.isArray(fn.failChances) ? fn.failChances : [0.7, 0.5, 0.3, 0];
    const failChance = attempt >= max ? 0 : Number(chances[attempt - 1] ?? 0);
    const random = opts.random || Math.random;
    const failed = random() < failChance;
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;

    taskSystem.completeTask(task.id);

    if (failed) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `No nurse available for skin check (attempt ${attempt}/${max})`,
            timeLabel: formatHHMM(now)
        });
        statusMessage('No nurse available — try again in 30 min');
        if (attempt < max) {
            const nextAt = addMinutesToHhmm(now, Number(fn.retryEveryMins) || 30);
            spawnFindNurseAttempt(task.patientId, nextAt, attempt + 1);
        }
        return { ok: true, found: false, attempt };
    }

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Found nurse for skin check (attempt ${attempt})`,
        timeLabel: formatHHMM(now)
    });
    statusMessage('Nurse available — perform skin check');
    spawnSkinCheck(task.patientId, now);
    return { ok: true, found: true, attempt };
}

/**
 * After call-admitting quiz passed and task completed — schedule MD callback.
 */
export function handleAdmissionCallComplete(task, opts = {}) {
    if (!task?.id) return null;
    const phase = task.metadata?.phase;
    if (phase !== 'call' && task.metadata?.kind !== 'admission-call') return null;
    if (pendingCallbacks.has(task.id) || spawnedCallbackKeys.has(`admit-cb-${task.id}`)) {
        return null;
    }

    const callCfg = cfg().callAdmitting || {};
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;
    const windowEnd = task.metadata.windowEnd
        ?? addMinutesToHhmm(now, callCfg.callWindowMins || 60);
    const profile = getAdmissionProfile(task.patientId);
    const consult = task.metadata?.consult || profile.consult;

    const callbackAt = pickAdmissionCallbackAt(now, windowEnd, opts.random || Math.random);
    const pending = {
        callbackAt,
        windowEnd,
        patientId: task.patientId,
        callTaskId: task.id,
        consult,
        nextRecallAt: null,
        recallCount: 0
    };
    pendingCallbacks.set(task.id, pending);

    const immediate = Number(callbackAt) === Number(now);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: immediate
            ? `Called admitting — doctor answering now (${consult})`
            : `Called admitting — Dr will call back (by ${formatHHMM(windowEnd)})`,
        timeLabel: formatHHMM(now)
    });

    if (immediate) {
        statusMessage('Admitting on the line');
        processPendingCallbacks(now);
    } else {
        statusMessage('Paged admitting — awaiting callback');
        showAwaitingCallbackToast({ labShort: 'Admitting', patientId: task.patientId });
        const toastTitle = document.querySelector('.shell-awaiting-toast__title');
        if (toastTitle) {
            toastTitle.textContent = callCfg.awaitingToastMessage || 'Dr will call back';
        }
        scheduleNextRecall(pending, now);
    }

    return { callbackAt, windowEnd, immediate, consult };
}

export function handleAdmissionRecallComplete(task, opts = {}) {
    if (task?.metadata?.phase !== 'recall' && task?.metadata?.kind !== 'admission-recall') {
        return null;
    }
    const callTaskId = task.metadata.callTaskId;
    const pending = callTaskId ? pendingCallbacks.get(callTaskId) : null;
    if (!pending) {
        statusMessage('Admitting already called back');
        return null;
    }
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: 'Re-called admitting — still awaiting callback',
        timeLabel: formatHHMM(now)
    });
    showAwaitingCallbackToast({ labShort: 'Admitting', patientId: pending.patientId });
    scheduleNextRecall(pending, now);
    return { nextRecallAt: pending.nextRecallAt };
}

export function handleAdmissionCallbackComplete(task, opts = {}) {
    if (!task?.id || task.metadata?.phase !== 'callback') return null;
    if (callbackCompleteHandled.has(task.id)) return null;
    callbackCompleteHandled.add(task.id);

    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task.scheduled;
    const consult = task.metadata?.consult || getAdmissionProfile(task.patientId).consult;

    spawnConsultTask(task.patientId, consult, now);
    clearAdmittingPhase(task.patientId);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Admitting orders received — consult ${consult}; admission complete`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`Orders in — consult ${consult}`);
    return { consult };
}

function onTime(currentTime) {
    if (!currentTime) return;
    const hold = gameState.getStateSlice('admitHold');
    if (isOpenAdmitMode(hold?.mode) && !hold.spawned && hold.admitAt != null) {
        if (isAtOrAfterInShift(currentTime, hold.admitAt)) {
            spawnAdmitPatient().catch((err) => {
                console.error('Admission spawn failed:', err);
            });
        }
    }
    processPendingCallbacks(currentTime);
}

function onTasks(tasks) {
    if (!tasks) return;
    tasks.forEach((task) => {
        if (
            task.status === GameConfig.tasks.statuses.COMPLETED
            && task.metadata?.phase === 'callback'
            && task.metadata?.kind === 'admission-callback'
        ) {
            handleAdmissionCallbackComplete(task);
        }
    });
}

export function initAdmissionSystem(deps = {}) {
    patientsModule = deps.patients || null;
    const shiftConfig = deps.shiftConfig || {};
    shiftStart = shiftConfig.shiftStarts ?? GameConfig.timer.defaultShiftStart;
    shiftDurationMins = shiftConfig.shiftDuration ?? GameConfig.timer.defaultShiftDuration;

    const hold = gameState.getStateSlice('admitHold');
    if (isOpenAdmitMode(hold?.mode) && hold.heldPatientId && hold.admitAt == null) {
        const forced = windowKeyForMode(hold.mode);
        const picked = pickAdmitAt(shiftStart, shiftDurationMins, Math.random, {
            windowKey: forced || undefined
        });
        gameState.dispatch('UPDATE_ADMIT_HOLD', {
            admitAt: picked.admitAt,
            windowKey: picked.windowKey
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Open to admit — new admission expected (${picked.windowKey} ~${formatHHMM(picked.admitAt)})`,
            timeLabel: formatHHMM(shiftStart)
        });
    }

    if (unsubTime) unsubTime();
    if (unsubTasks) unsubTasks();
    unsubTime = gameState.subscribe('currentTime', onTime);
    unsubTasks = gameState.subscribe('tasks', onTasks);
}

const AdmissionSystemModule = {
    init(deps) {
        initAdmissionSystem(deps || {});
    },
    pickAdmitAt,
    pickAdmissionCallbackAt,
    handleFindNursePerform,
    handleAdmissionCallComplete,
    handleAdmissionRecallComplete,
    handleAdmissionCallbackComplete,
    spawnAdmitPatient
};

export default AdmissionSystemModule;
