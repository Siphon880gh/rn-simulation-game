/**
 * Game-time event drip + thin overdue→status deterioration (E4.M2).
 * Honors pause/speed because it only runs on currentTime updates.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { mountTaskDom } from './dynamic-tasks.js';

const firedEventIds = new Set();
const deterioratedPatients = new Set();
let codeBlueHookUsed = false;
let lastProcessedTime = null;

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    const h = Math.floor(n / 100);
    const m = n % 100;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function annotateHourTab(at, label) {
    const host = document.querySelector(GameConfig.selectors.hourTabs);
    if (!host) return;
    const tabs = [...host.querySelectorAll('.shell-hour-tab')];
    if (!tabs.length) return;

    let best = null;
    let bestDiff = Infinity;
    const atMins = hhmmToMinutes(at);
    tabs.forEach((tab) => {
        const markMins = hhmmToMinutes(tab.dataset.hourHhmm);
        const diff = atMins - markMins;
        if (diff >= 0 && diff < 60 && diff < bestDiff) {
            bestDiff = diff;
            best = tab;
        }
    });
    if (!best) return;

    const count = Number(best.dataset.eventCount || 0) + 1;
    best.dataset.eventCount = String(count);
    best.classList.add('has-events');
    const base = best.textContent.replace(/\s*\(\d+\)$/, '');
    best.textContent = `${base} (${count})`;
    const prev = best.getAttribute('title') || '';
    best.setAttribute('title', prev ? `${prev}\n• ${label}` : `• ${label}`);
}

function injectTasks(taskSpecs, at) {
    if (!Array.isArray(taskSpecs)) return;
    taskSpecs.forEach((spec) => {
        const scheduled = spec.scheduled != null ? spec.scheduled : at;
        const created = taskSystem.createTask({
            id: spec.id || `evt-task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: spec.type || 'assessment',
            taskClass: spec.taskClass || GameConfig.tasks.classes.URGENT,
            name: spec.name || 'Follow-up task',
            scheduled,
            expire: spec.expire != null ? spec.expire : '+60',
            durationMins: spec.durationMins ?? 10,
            patientId: spec.patientId || null,
            metadata: { ...(spec.metadata || {}), fromEvent: true, incident: true }
        });
        // Activate immediately if already at/after scheduled
        taskSystem.processTasks(gameState.getStateSlice('currentTime') || scheduled);
        const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
        mountTaskDom(live);
    });
}

function fireEvent(event, currentTime) {
    if (!event?.id || firedEventIds.has(event.id)) return false;
    firedEventIds.add(event.id);

    const message = event.message || `Event: ${event.id}`;
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: event.type === 'emergency' ? `⚠ ${message}` : message,
        timeLabel: formatHHMM(currentTime)
    });

    const statusEl = document.querySelector(GameConfig.selectors.statusMessage);
    if (statusEl) {
        statusEl.textContent = message;
    }

    injectTasks(event.injectTasks, event.at ?? currentTime);
    annotateHourTab(event.at ?? currentTime, message);

    gameState.dispatch('MARK_EVENT_FIRED', {
        eventId: event.id,
        at: currentTime,
        type: event.type || 'unlock',
        message
    });

    return true;
}

function clinicalSteps() {
    return GameConfig.events?.deterioration?.steps
        || ['stable', 'watch', 'worsening'];
}

function acuityDelta() {
    return Number(GameConfig.events?.deterioration?.acuityDeltaPerBump) || 1;
}

function bumpClinicalStatus(patientId, reason, { skipStep = false } = {}) {
    const patients = gameState.getStateSlice('patients');
    const patient = patients?.get(patientId);
    if (!patient) return null;

    const steps = clinicalSteps();
    const current = patient.clinicalStatus || steps[0];
    const idx = Math.max(0, steps.indexOf(current));
    if (idx >= steps.length - 1) return current;

    const advance = skipStep && GameConfig.events?.deterioration?.skipStepOnStat !== false
        ? 2
        : 1;
    const next = steps[Math.min(steps.length - 1, idx + advance)];
    const acuity = Number(patient.acuityScore || 0) + acuityDelta() * (skipStep ? 2 : 1);
    gameState.dispatch('UPDATE_PATIENT', {
        patientId,
        patch: {
            clinicalStatus: next,
            clinicalStatusReason: reason,
            acuityScore: acuity
        }
    });

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `${patient.name || patientId} status → ${next} (acuity ${acuity}; ${reason})`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });

    paintPatientStatusCue(patientId, next);
    return next;
}

function paintPatientStatusCue(patientId, status) {
    const host = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
    if (!host) return;
    let badge = host.querySelector('[data-clinical-status]');
    if (!badge) {
        const header = host.querySelector('.patient .flex, .patient > div');
        badge = document.createElement('span');
        badge.setAttribute('data-clinical-status', status);
        badge.className = 'text-xs font-semibold px-2 py-0.5 rounded ml-2 clinical-status-badge';
        if (header) header.appendChild(badge);
        else host.prepend(badge);
    }
    badge.setAttribute('data-clinical-status', status);
    badge.textContent = status;
    badge.classList.toggle('is-watch', status === 'watch');
    badge.classList.toggle('is-worsening', status === 'worsening');
    badge.classList.toggle('is-critical', status === 'critical');
}

function shouldEscalateCodeBlue(status) {
    const steps = clinicalSteps();
    const at = GameConfig.events?.codeBlueHook?.escalateAtStatus || 'critical';
    const atIdx = steps.indexOf(at);
    const statusIdx = steps.indexOf(status);
    if (statusIdx < 0) return status === at;
    if (atIdx < 0) return status === at;
    return statusIdx >= atIdx;
}

function processDeterioration() {
    const tasks = gameState.getStateSlice('tasks');
    const patients = gameState.getStateSlice('patients');
    if (!tasks || !patients) return;

    const overdueByPatient = new Map();
    tasks.forEach((task) => {
        if (task.status !== GameConfig.tasks.statuses.OVERDUE || !task.patientId) return;
        if (!overdueByPatient.has(task.patientId)) overdueByPatient.set(task.patientId, []);
        overdueByPatient.get(task.patientId).push(task);
    });

    overdueByPatient.forEach((overdueTasks, patientId) => {
        if (deterioratedPatients.has(patientId)) {
            // Further bumps while overdue work lingers (E7.M3 richer chain)
            const patient = patients.get(patientId);
            const status = patient?.clinicalStatus || 'stable';
            if (status === 'stable') return;
            const hasStat = overdueTasks.some((t) =>
                t.taskClass === GameConfig.tasks.classes.STAT
            );
            const hasUrgent = overdueTasks.some((t) =>
                t.taskClass === GameConfig.tasks.classes.URGENT
                || t.taskClass === GameConfig.tasks.classes.STAT
            );
            if (!hasUrgent) return;
            const next = bumpClinicalStatus(
                patientId,
                hasStat ? 'overdue STAT work' : 'overdue urgent/stat work',
                { skipStep: hasStat }
            );
            if (shouldEscalateCodeBlue(next)) {
                maybeCodeBlueHook(patientId);
            }
            return;
        }

        deterioratedPatients.add(patientId);
        bumpClinicalStatus(patientId, 'overdue task unresolved');
        injectTasks([{
            id: `det-${patientId}-reassess`,
            type: 'assessment',
            name: 'Reassess after deterioration cue',
            patientId,
            taskClass: GameConfig.tasks.classes.URGENT,
            scheduled: gameState.getStateSlice('currentTime'),
            expire: '+45',
            durationMins: 10
        }], gameState.getStateSlice('currentTime'));
    });
}

function maybeCodeBlueHook(patientId) {
    if (codeBlueHookUsed) return;
    if (GameConfig.events?.codeBlueHook?.enabled === false) return;
    codeBlueHookUsed = true;
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    const name = patient?.name || patientId;
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Code Blue: ${name} — opening response challenge`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    gameState.dispatch('MARK_CODE_BLUE_HOOK', { patientId });
}

export function processGameTime(currentTime) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (lastProcessedTime === currentTime) return;
    lastProcessedTime = currentTime;

    const pack = gameState.getStateSlice('scenarioPack');
    const events = pack?.events || [];
    events.forEach((event) => {
        const at = Number(event.at);
        if (!Number.isFinite(at)) return;
        if (Number(currentTime) >= at) {
            fireEvent(event, currentTime);
        }
    });

    processDeterioration();
}

export function resetEventDrip() {
    firedEventIds.clear();
    deterioratedPatients.clear();
    codeBlueHookUsed = false;
    lastProcessedTime = null;
}

const EventDripModule = {
    processGameTime,
    resetEventDrip,
    fireEvent,
    init() {
        resetEventDrip();
        gameState.subscribe('currentTime', (t) => processGameTime(t));
    }
};

export default EventDripModule;
