/**
 * Alteplase (Cathflo) PICC occlusion flow:
 * assess (dice) → clotted incident → Call MD (critical-lab callback) →
 * administer → dwell 30 → reassess → (optional dwell 120) → aspirate.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { presentSpawnedTask } from './dynamic-tasks.js';
import { spawnCriticalLabNow, showShellToast } from './critical-labs.js';
import {
    rollPiccPatencyOutcome,
    rollPiccRestoreOutcome,
    aspirateVolumeMl,
    decorateAlteplaseDice
} from './challenges/skills/alteplase/challenge.js';

const handledComplete = new Set();
/** @type {Map<string, string>} patientId → incident task id */
const openIncidents = new Map();

function cfg() {
    return GameConfig.alteplasePicc || {};
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function statusMessage(text) {
    if (typeof document === 'undefined') return;
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

function patientWeightKg(patientId) {
    const p = patientId ? gameState.getStateSlice('patients')?.get(patientId) : null;
    const fromPatient = Number(p?.weightKg);
    if (Number.isFinite(fromPatient) && fromPatient > 0) return fromPatient;
    return Number(cfg().defaultWeightKg) || 70;
}

function createFlowTask(spec) {
    const key = spec.id;
    if (gameState.getStateSlice('tasks')?.has(key)) return null;

    const created = taskSystem.createTask({
        id: key,
        type: spec.type || 'assessment',
        taskClass: spec.taskClass || GameConfig.tasks.classes.STAT,
        name: spec.name,
        scheduled: spec.at,
        expire: spec.expire != null ? spec.expire : '+90',
        durationMins: spec.durationMins ?? 10,
        patientId: spec.patientId,
        metadata: {
            challenge: spec.challenge || null,
            alteplasePhase: spec.phase,
            kind: spec.kind || `alteplase-${spec.phase}`,
            weightKg: spec.weightKg,
            incident: Boolean(spec.incident),
            fromAlteplase: true,
            parentIncidentId: spec.parentIncidentId || null,
            ...(spec.metadata || {})
        }
    });

    const now = gameState.getStateSlice('currentTime') || spec.at;
    taskSystem.processTasks(now);
    const live = presentSpawnedTask(created, {
        at: now,
        focusPatient: Boolean(spec.focusPatient),
        scrollIntoView: spec.scrollIntoView
    }) || gameState.getStateSlice('tasks')?.get(created.id) || created;

    if (typeof document !== 'undefined') {
        decorateAlteplaseDice(document);
        const el = document.getElementById(live.id);
        if (el && spec.phase) el.setAttribute('data-alteplase-phase', spec.phase);
    }
    return live;
}

/**
 * After clotted assess: incident tab + Call MD for alteplase (critical-lab mechanism).
 */
export function spawnClottedPiccFlow(sourceTask, opts = {}) {
    const patientId = sourceTask?.patientId || opts.patientId;
    if (!patientId) return null;
    const now = opts.now ?? gameState.getStateSlice('currentTime')
        ?? GameConfig.timer.defaultShiftStart;
    const weightKg = patientWeightKg(patientId);
    const stamp = `${patientId}-${now}-${Math.floor((opts.random || Math.random)() * 1e4)}`;

    const incidentId = `picc-clot-${stamp}`;
    const incident = createFlowTask({
        id: incidentId,
        at: now,
        patientId,
        name: 'PICC line clotted',
        durationMins: cfg().incidentDurationMins ?? 5,
        expire: '+180',
        phase: 'incident',
        kind: 'picc-clotted-incident',
        incident: true,
        weightKg,
        focusPatient: true,
        challenge: null
    });
    if (incident) openIncidents.set(patientId, incident.id);

    const callTask = spawnCriticalLabNow({
        labId: cfg().orderLabId || 'picc-alteplase',
        patientId,
        at: now,
        id: `crit-picc-alteplase-${stamp}`,
        focusPatient: false,
        result: 'PICC lumen occluded (critical access failure) — no blood return / will not flush (fibrin)',
        lab: {
            id: cfg().orderLabId || 'picc-alteplase',
            shortName: 'PICC occlusion',
            fullName: 'Occluded PICC — alteplase (Cathflo) order',
            result: 'PICC lumen occluded (critical access failure) — no blood return / will not flush (fibrin)',
            ordersHint: 'Alteplase (Cathflo) 2 mg instill into occluded lumen; dwell 30 min then reassess',
            callbackEffects: [
                {
                    type: 'assessment',
                    name: 'Administer alteplase (Cathflo) into occluded PICC',
                    durationMins: cfg().adminDurationMins ?? 15,
                    expire: '+60',
                    taskClass: 'stat',
                    metadata: {
                        challenge: 'alteplase',
                        alteplasePhase: 'admin',
                        kind: 'alteplase-admin',
                        fromAlteplase: true,
                        weightKg,
                        parentIncidentId: incident?.id || null
                    }
                }
            ]
        }
    });

    if (callTask) {
        const meta = {
            ...(callTask.metadata || {}),
            fromAlteplase: true,
            parentIncidentId: incident?.id || null,
            weightKg
        };
        callTask.metadata = meta;
        const liveCall = gameState.getStateSlice('tasks')?.get(callTask.id);
        if (liveCall) {
            liveCall.metadata = { ...(liveCall.metadata || {}), ...meta };
            taskSystem.taskRegistry?.set?.(liveCall.id, liveCall);
        }
        const el = typeof document !== 'undefined' ? document.getElementById(callTask.id) : null;
        if (el) el.setAttribute('data-alteplase-parent', incident?.id || '');
    }

    showShellToast({
        title: 'PICC line clotted',
        detail: `${patientId} · Call MD for alteplase (Cathflo) order`,
        iconClass: 'fas fa-syringe',
        hideAfterMs: cfg().toastMs ?? 4200,
        onClick: () => {
            const focusId = callTask?.id || incident?.id;
            if (!focusId) return;
            const live = gameState.getStateSlice('tasks')?.get(focusId);
            if (live?.patientId && typeof window !== 'undefined') {
                gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: live.patientId });
            }
            requestAnimationFrame(() => {
                const node = document.getElementById(focusId);
                node?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                node?.classList?.add('rail-focus-pulse');
                window.setTimeout(() => node?.classList?.remove('rail-focus-pulse'), 1200);
            });
        },
        clickAriaLabel: 'Open PICC clot dependent tasks'
    });

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `PICC clotted (${patientId}) — Call MD for alteplase (Cathflo)`,
        timeLabel: formatHHMM(now)
    });
    statusMessage('PICC clotted — call for alteplase order');

    return { incident, callTask };
}

function spawnDwell(patientId, mins, parentIncidentId, weightKg, now) {
    const phase = mins === 120 ? 'dwell-120' : 'dwell-30';
    return createFlowTask({
        id: `alteplase-${phase}-${patientId}-${now}`,
        at: now,
        patientId,
        name: mins === 120
            ? 'Wait 120 min — alteplase second dwell'
            : 'Wait 30 min — alteplase dwell',
        durationMins: mins,
        expire: `+${mins + 60}`,
        phase,
        kind: `alteplase-${phase}`,
        challenge: null,
        weightKg,
        parentIncidentId,
        incident: true,
        focusPatient: true
    });
}

function spawnReassess(patientId, which, parentIncidentId, weightKg, now) {
    const phase = which === 120 ? 'reassess-120' : 'reassess-30';
    return createFlowTask({
        id: `alteplase-${phase}-${patientId}-${now}`,
        at: now,
        patientId,
        name: which === 120
            ? 'Assess PICC after 120-min alteplase dwell'
            : 'Assess PICC after 30-min alteplase dwell',
        durationMins: cfg().reassessDurationMins ?? 8,
        expire: '+45',
        phase,
        kind: `alteplase-${phase}`,
        challenge: 'alteplase',
        weightKg,
        parentIncidentId,
        incident: true,
        focusPatient: true
    });
}

function spawnAspirate(patientId, parentIncidentId, weightKg, now) {
    const vol = aspirateVolumeMl(weightKg);
    return createFlowTask({
        id: `alteplase-aspirate-${patientId}-${now}`,
        at: now,
        patientId,
        name: `Aspirate ${vol.label} blood from PICC (post-Cathflo)`,
        durationMins: cfg().aspirateDurationMins ?? 10,
        expire: '+60',
        phase: 'aspirate',
        kind: 'alteplase-aspirate',
        challenge: 'alteplase',
        weightKg,
        parentIncidentId,
        incident: true,
        focusPatient: true
    });
}

function resolveIncident(patientId) {
    const id = openIncidents.get(patientId);
    if (!id) return;
    const live = gameState.getStateSlice('tasks')?.get(id);
    if (live && live.status !== GameConfig.tasks.statuses.COMPLETED) {
        taskSystem.completeTask(id);
    }
    openIncidents.delete(patientId);
}

/**
 * Apply initial assess dice. Returns { outcome, clottedFlow }.
 */
export function applyPiccAssessRoll(task, opts = {}) {
    const outcome = opts.outcome || rollPiccPatencyOutcome(opts);
    if (task) {
        task.metadata = {
            ...(task.metadata || {}),
            piccPatency: outcome,
            alteplasePhase: task.metadata?.alteplasePhase || 'assess'
        };
        if (task.id) {
            const live = gameState.getStateSlice('tasks')?.get(task.id);
            if (live) {
                live.metadata = { ...(live.metadata || {}), piccPatency: outcome };
                taskSystem.taskRegistry?.set?.(task.id, live);
            }
        }
    }

    let clottedFlow = null;
    if (outcome.clotted) {
        clottedFlow = spawnClottedPiccFlow(task, opts);
    } else {
        showShellToast({
            title: outcome.toastTitle,
            detail: outcome.toastDetail,
            iconClass: 'fas fa-check-circle',
            hideAfterMs: cfg().toastMs ?? 4200
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `PICC assess patent (${task?.patientId || 'patient'}) — Cathflo quiz`,
            timeLabel: formatHHMM(opts.now ?? gameState.getStateSlice('currentTime'))
        });
    }
    return { outcome, clottedFlow, skipQuiz: Boolean(outcome.clotted) };
}

/**
 * After dwell reassess dice — spawn next dwell or aspirate.
 */
export function applyPiccRestoreRoll(task, opts = {}) {
    const phase = String(task?.metadata?.alteplasePhase || opts.phase || 'reassess-30');
    const outcome = opts.outcome || rollPiccRestoreOutcome(phase, opts);
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? task?.scheduled;
    const patientId = task?.patientId;
    const weightKg = Number(task?.metadata?.weightKg) || patientWeightKg(patientId);
    const parentIncidentId = task?.metadata?.parentIncidentId
        || openIncidents.get(patientId)
        || null;

    showShellToast({
        title: outcome.toastTitle,
        detail: outcome.toastDetail,
        iconClass: outcome.restored ? 'fas fa-check-circle' : 'fas fa-hourglass-half',
        hideAfterMs: cfg().toastMs ?? 4200
    });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `PICC ${outcome.label} after ${phase} (${patientId})`,
        timeLabel: formatHHMM(now)
    });

    let next = null;
    if (outcome.restored) {
        next = spawnAspirate(patientId, parentIncidentId, weightKg, now);
        statusMessage('PICC restored — aspirate waste blood');
    } else if (phase === 'reassess-30') {
        next = spawnDwell(patientId, 120, parentIncidentId, weightKg, now);
        statusMessage('Still occluded — start 120-min dwell');
    } else {
        statusMessage('PICC still occluded after 120-min dwell — notify provider');
    }

    return { outcome, next, restored: Boolean(outcome.restored) };
}

function onTaskCompleted(task) {
    if (!task?.id || handledComplete.has(task.id)) return;
    const phase = String(task.metadata?.alteplasePhase || '');
    const fromAlteplase = task.metadata?.fromAlteplase
        || phase.startsWith('dwell')
        || phase.startsWith('reassess')
        || phase === 'admin'
        || phase === 'aspirate'
        || task.metadata?.kind === 'alteplase-admin';
    if (!fromAlteplase && phase !== 'admin' && phase !== 'aspirate') return;

    // Admin comes from critical-lab callbackEffects — mark and continue
    const isAdmin = phase === 'admin' || task.metadata?.kind === 'alteplase-admin'
        || /Administer alteplase/i.test(task.name || '');
    const isDwell30 = phase === 'dwell-30';
    const isDwell120 = phase === 'dwell-120';
    const isAspirate = phase === 'aspirate' || task.metadata?.kind === 'alteplase-aspirate';

    if (!isAdmin && !isDwell30 && !isDwell120 && !isAspirate) return;
    handledComplete.add(task.id);

    const now = gameState.getStateSlice('currentTime') ?? task.scheduled;
    const patientId = task.patientId;
    const weightKg = Number(task.metadata?.weightKg) || patientWeightKg(patientId);
    const parentIncidentId = task.metadata?.parentIncidentId
        || openIncidents.get(patientId)
        || null;

    if (isAdmin) {
        spawnDwell(patientId, 30, parentIncidentId, weightKg, now);
        statusMessage('Alteplase instilled — wait 30 min dwell');
        return;
    }
    if (isDwell30) {
        spawnReassess(patientId, 30, parentIncidentId, weightKg, now);
        statusMessage('30-min dwell done — reassess PICC');
        return;
    }
    if (isDwell120) {
        spawnReassess(patientId, 120, parentIncidentId, weightKg, now);
        statusMessage('120-min dwell done — reassess PICC');
        return;
    }
    if (isAspirate) {
        resolveIncident(patientId);
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Post-Cathflo aspiration complete (${patientId}) — flush PICC per protocol`,
            timeLabel: formatHHMM(now)
        });
        statusMessage('PICC clot cleared — aspirate done');
        showShellToast({
            title: 'PICC function restored',
            detail: 'Waste blood aspirated — flush with NS per protocol',
            iconClass: 'fas fa-check-double',
            hideAfterMs: cfg().toastMs ?? 4200
        });
    }
}

export function focusPiccClotDependents(incidentTask) {
    const patientId = incidentTask?.patientId;
    if (!patientId) return;
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks?.size) return;
    let target = null;
    for (const t of tasks.values()) {
        if (t.patientId !== patientId) continue;
        if (t.status === GameConfig.tasks.statuses.COMPLETED) continue;
        const kind = t.metadata?.kind || '';
        if (
            kind === 'critical-lab-call'
            || kind === 'critical-lab-recall'
            || kind === 'critical-lab-callback'
            || String(t.metadata?.alteplasePhase || '').length
            || t.metadata?.fromAlteplase
        ) {
            if (t.metadata?.parentIncidentId === incidentTask.id || t.metadata?.fromAlteplase || t.metadata?.criticalLab) {
                target = t;
                if (kind === 'critical-lab-call' || kind === 'critical-lab-callback') break;
            }
        }
    }
    const focus = target || incidentTask;
    gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
    requestAnimationFrame(() => {
        const el = document.getElementById(focus.id);
        if (!el) return;
        el.classList.add('rail-focus-pulse');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        window.setTimeout(() => el.classList.remove('rail-focus-pulse'), 1200);
    });
    statusMessage(target ? `Dependent: ${target.name}` : 'PICC clot incident');
}

export function resetAlteplaseSystem() {
    handledComplete.clear();
    openIncidents.clear();
}

export function initAlteplaseSystem() {
    resetAlteplaseSystem();
    gameState.subscribe('tasks', (tasks) => {
        if (!tasks) return;
        tasks.forEach((task) => {
            if (task.status === GameConfig.tasks.statuses.COMPLETED) {
                onTaskCompleted(task);
            }
        });
        if (typeof document !== 'undefined') {
            decorateAlteplaseDice(document);
        }
    });
}

const AlteplaseSystemModule = {
    init: initAlteplaseSystem,
    reset: resetAlteplaseSystem,
    applyPiccAssessRoll,
    applyPiccRestoreRoll,
    spawnClottedPiccFlow,
    focusPiccClotDependents
};

export default AlteplaseSystemModule;
