/**
 * First-run How to play tour.
 * Saves a live shift, swaps in the how-to-play pack, then restores it.
 * With no shift running, the tour ends on the assignment start page.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import GameTimerModule from './timer_ingame.js';
import PatientsModule from './patients.js';
import ScenarioPackModule from './scenario-pack.js';
import { setShiftAnchor, getShiftAnchor } from './availability-windows.js';
import { buildDelegationState, clearDelegateSelection, getSelectedAide, isAideAvailable } from './delegation.js';
import { spawnCallLightNow } from './nurse-alerts.js';
import { captureNurseAlertsRuntime, restoreNurseAlertsRuntime } from './nurse-alerts.js';
import { spawnCriticalLabNow } from './critical-labs.js';
import { captureCriticalLabsRuntime, restoreCriticalLabsRuntime } from './critical-labs.js';
import {
    forceSpawnOrdersCheck,
    captureDoctorOrdersRuntime,
    restoreDoctorOrdersRuntime,
    setDoctorOrdersShift
} from './doctor-orders.js';
import { hideCriticalLabMedia } from './media-placeholders.js';
import ModalModule from './modal.js';
import {
    isTourActive,
    setTourActive
} from './tour-mode.js';

const TOUR_PACK_URL = 'events/scenarios/how-to-play.json';
const TOUR_PATIENT_ID = 'tour-sam';
const TOUR_SHIFT_START = 1900;
const TOUR_SHIFT_MINUTES = 720;
const TOUR_RUN_SPEED = 48;
const NARROW_QUERY = '(max-width: 900px)';

const TOUR_PATIENT = {
    id: TOUR_PATIENT_ID,
    name: 'Sam Ellis',
    room: 'Room 212-A',
    age: 64,
    sex: 'Male',
    diagnosis: 'Cellulitis, left lower leg',
    careSchedules: ['turnQ2h'],
    careReason: 'Limited mobility — needs help turning',
    htmlFile: 'events/patients/tour-sam.html'
};

let stepIndex = 0;
let steps = [];
let hadLiveShift = false;
let displaySpeed = 16;
let saved = null;
let gateMet = false;
let restoring = false;
let tourMemory = {};
let clockWatch = null;

function isNarrow() {
    return window.matchMedia(NARROW_QUERY).matches;
}

function completedStatus() {
    return GameConfig.tasks.statuses.COMPLETED;
}

function taskById(id) {
    return id ? gameState.getStateSlice('tasks')?.get(id) || null : null;
}

function findTask(pred) {
    let found = null;
    gameState.getStateSlice('tasks')?.forEach((task) => {
        if (!found && pred(task)) found = task;
    });
    return found;
}

function isCompleted(task) {
    return task?.status === completedStatus();
}

function slotHas(taskId) {
    if (!taskId) return false;
    const slots = gameState.getStateSlice('slots') || [];
    return slots.some((slot) => slot.taskId === taskId);
}

function patientName() {
    return gameState.getStateSlice('patients')?.get(TOUR_PATIENT_ID)?.name || 'Sam Ellis';
}

function coveringAide() {
    const delegation = gameState.getStateSlice('delegation');
    const aides = delegation?.aides || [];
    return aides.find((aide) => (aide.patientIds || []).includes(TOUR_PATIENT_ID)) || aides[0] || null;
}

function shiftAssessmentTask() {
    return taskById(`${TOUR_PATIENT_ID}-shift-assessment`);
}

function medTask() {
    return taskById('tour-sam-med-atorvastatin')
        || findTask((task) => task.patientId === TOUR_PATIENT_ID && task.type === 'med');
}

function turnTask() {
    if (tourMemory.turnId) return taskById(tourMemory.turnId);
    const at = tourMemory.parkedAt;
    return findTask((task) => {
        if (task.metadata?.kind !== 'turn-patient') return false;
        if (task.patientId !== TOUR_PATIENT_ID) return false;
        if (at == null) return false;
        return Number(task.scheduled) === Number(at);
    });
}

function callTask() {
    return taskById(tourMemory.callId);
}

function labCallTask() {
    return taskById(tourMemory.labCallId);
}

function labCallbackTask() {
    return findTask((task) => task.metadata?.kind === 'critical-lab-callback'
        && task.metadata?.callTaskId === tourMemory.labCallId);
}

function labOrderTasks() {
    const orders = [];
    gameState.getStateSlice('tasks')?.forEach((task) => {
        if (task.patientId !== TOUR_PATIENT_ID || !task.metadata?.fromCriticalLabCallback) return;
        orders.push(task);
    });
    return orders;
}

function labOrderTask() {
    return labOrderTasks()[0] || null;
}

function labOrderElements() {
    return labOrderTasks().map((task) => document.getElementById(task.id)).filter(Boolean);
}

function ordersCheckTask() {
    return taskById(tourMemory.ordersCheckId)
        || findTask((task) => task.metadata?.kind === 'doctor-orders-check');
}

function injectedOrderTask() {
    return taskById('tour-order-encourage-fluids')
        || findTask((task) => task.metadata?.orderKind === 'pack' || task.id === 'tour-order-encourage-fluids');
}

function panelMode() {
    return PatientsModule.getPanelMode?.() || 'patient';
}

function onTourPatient() {
    return panelMode() !== 'global'
        && gameState.getStateSlice('activePatientId') === TOUR_PATIENT_ID;
}

function liveShiftRunning() {
    if (isTourActive()) return false;
    const status = gameState.getStateSlice('gameStatus');
    const live = status === GameConfig.gameStates.RUNNING
        || status === GameConfig.gameStates.PAUSED;
    const timer = GameTimerModule.getState?.();
    return live && timer && timer.shiftStart !== -1;
}

function cloneValue(value) {
    if (value instanceof Map) {
        const copy = new Map();
        value.forEach((entry, key) => copy.set(key, cloneValue(entry)));
        return copy;
    }
    if (value instanceof Set) {
        return new Set([...value].map((entry) => cloneValue(entry)));
    }
    if (Array.isArray(value)) return value.map((entry) => cloneValue(entry));
    if (value && typeof value === 'object') {
        const copy = {};
        Object.keys(value).forEach((key) => {
            if (typeof value[key] === 'function') return;
            copy[key] = cloneValue(value[key]);
        });
        return copy;
    }
    return value;
}

function detachChildren(el) {
    const frag = document.createDocumentFragment();
    if (!el) return frag;
    while (el.firstChild) frag.appendChild(el.firstChild);
    return frag;
}

function fillElement(el, frag) {
    if (!el) return;
    el.replaceChildren();
    if (frag) el.appendChild(frag);
}

function revealTaskOpacity() {
    document.querySelectorAll('#patients [data-task-type], #doctor-orders-list [data-task-type]').forEach((el) => {
        el.style.opacity = '1';
    });
}

function blankTourState(pack) {
    const slots = Array.from({ length: GameConfig.slots.count }, (_, index) => ({
        id: index,
        taskId: null,
        taskName: null,
        taskType: null,
        taskKind: null,
        startedAt: null,
        endsAt: null,
        progress: 0
    }));
    return {
        gameStatus: GameConfig.gameStates.RUNNING,
        currentTime: TOUR_SHIFT_START,
        isPaused: true,
        pauseSources: [GameConfig.timer.pauseSources.TOUR],
        activeHourIndex: 0,
        activeHourHhmm: TOUR_SHIFT_START,
        shiftLog: [],
        activePatientId: null,
        tasks: new Map(),
        patients: new Map(),
        scheduledEvents: new Map(),
        activeTasks: new Set(),
        slots,
        slotQueue: [],
        scenarioPack: pack,
        admitHold: null,
        delegation: null,
        firedEvents: [],
        codeBlueHook: null,
        skillFocus: null,
        boosters: 0,
        boosterFreeze: null,
        score: {
            total: Number(GameConfig.scoring?.startingTotal) || 100,
            taskPoints: 0,
            challengePoints: 0,
            satisfactionPoints: 0,
            cheatsUsed: 0,
            challengeFails: 0,
            challengePasses: 0,
            challengeMisses: [],
            events: []
        }
    };
}

async function loadTourPack() {
    const response = await fetch(TOUR_PACK_URL);
    if (!response.ok) throw new Error(`How to play pack failed (${response.status})`);
    const pack = ScenarioPackModule.normalizePack(await response.json(), TOUR_PACK_URL);
    pack.skipIncidentPack = true;
    pack.events = [];
    pack.dynamicTemplates = [];
    pack.incidentPackUrl = null;
    return pack;
}

function captureShift() {
    const modal = document.getElementById('modal');
    const reveal = document.querySelector(GameConfig.selectors.revealScheduledTasks);
    return {
        state: cloneValue(gameState.getState()),
        timer: GameTimerModule.capture(),
        shiftAnchor: getShiftAnchor(),
        doctorOrders: captureDoctorOrdersRuntime(),
        nurseAlerts: captureNurseAlertsRuntime(),
        criticalLabs: captureCriticalLabsRuntime(),
        panelMode: panelMode(),
        patientsFrag: detachChildren(document.querySelector(GameConfig.selectors.patients)),
        ordersFrag: detachChildren(document.querySelector('#doctor-orders-list')),
        incidentsFrag: detachChildren(document.querySelector('#incident-tabs')),
        revealCss: reveal ? reveal.textContent : '',
        modal: modal
            ? {
                hidden: modal.classList.contains('hidden'),
                className: modal.className,
                html: modal.innerHTML
            }
            : null
    };
}

function restoreShift(snap) {
    if (!snap) return;
    restoring = true;
    const patientsEl = document.querySelector(GameConfig.selectors.patients);
    const ordersEl = document.querySelector('#doctor-orders-list');
    const incidentsEl = document.querySelector('#incident-tabs');
    patientsEl?.replaceChildren();
    ordersEl?.replaceChildren();
    incidentsEl?.replaceChildren();
    fillElement(patientsEl, snap.patientsFrag);
    fillElement(ordersEl, snap.ordersFrag);
    fillElement(incidentsEl, snap.incidentsFrag);

    const reveal = document.querySelector(GameConfig.selectors.revealScheduledTasks);
    if (reveal) reveal.textContent = snap.revealCss || '';

    restoreDoctorOrdersRuntime(snap.doctorOrders);
    restoreNurseAlertsRuntime(snap.nurseAlerts);
    restoreCriticalLabsRuntime(snap.criticalLabs);
    setShiftAnchor(snap.shiftAnchor);
    PatientsModule.setPanelMode?.(snap.panelMode);

    gameState.dispatch('REPLACE_STATE', { state: snap.state });
    GameTimerModule.restore(snap.timer);
    taskSystem.syncRegistryFromState?.();
    ScenarioPackModule.applyPackChrome?.(snap.state.scenarioPack);

    if (snap.panelMode === 'global') {
        PatientsModule.showGlobalPanel?.({ logMessage: false });
    } else if (snap.state.activePatientId) {
        PatientsModule.showPatientPanel?.(snap.state.activePatientId, { logMessage: false });
    } else {
        PatientsModule.renderPatientTabs?.();
        PatientsModule.applyPanelVisibility?.();
    }

    const modal = document.getElementById('modal');
    if (modal && snap.modal) {
        modal.className = snap.modal.className;
        modal.innerHTML = snap.modal.html;
        modal.classList.toggle('hidden', snap.modal.hidden);
    }
    restoring = false;
}

function hideLaunch() {
    const btn = document.getElementById('how-to-play-launch');
    if (btn) btn.hidden = true;
}

function showLaunch() {
    if (isTourActive()) return;
    const btn = document.getElementById('how-to-play-launch');
    if (btn) btn.hidden = false;
}

function watchFirstRealTask() {
    const seenCompleted = new Set();
    gameState.getStateSlice('tasks')?.forEach((task, id) => {
        if (task.status === completedStatus()) seenCompleted.add(id);
    });
    gameState.subscribe('tasks', (tasks) => {
        if (restoring || isTourActive() || !tasks) return;
        let started = false;
        tasks.forEach((task, id) => {
            if (task.status !== completedStatus()) return;
            if (seenCompleted.has(id)) return;
            seenCompleted.add(id);
            started = true;
        });
        if (started) hideLaunch();
    });
    gameState.subscribe('slots', (slots, prev) => {
        if (restoring || isTourActive()) return;
        const started = (slots || []).some((slot) => slot.taskId);
        const already = (prev || []).some((slot) => slot.taskId);
        if (started && !already) hideLaunch();
    });
}

function ensurePopover() {
    let pop = document.getElementById('how-to-play-popover');
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'how-to-play-popover';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.innerHTML = `
        <button type="button" class="how-to-play-popover__reset" id="how-to-play-reset" hidden aria-label="Reset position">
            <i class="fas fa-undo" aria-hidden="true"></i>
            <span class="how-to-play-popover__reset-tip" role="tooltip">Reset position</span>
        </button>
        <p class="how-to-play-popover__kicker">How to play</p>
        <div class="how-to-play-popover__body" id="how-to-play-body"></div>
        <div class="how-to-play-popover__actions">
            <button type="button" class="how-to-play-popover__prev" id="how-to-play-prev">Previous</button>
            <button type="button" class="how-to-play-popover__skip" id="how-to-play-skip">Skip tour</button>
            <button type="button" class="how-to-play-popover__next" id="how-to-play-next">Next</button>
        </div>
    `;
    document.body.appendChild(pop);
    bindPopoverDrag(pop);
    pop.querySelector('#how-to-play-prev').addEventListener('click', () => {
        if (steps[stepIndex]?.id === 'assess-question') assessAdvanceHold = true;
        showStep(stepIndex - 1);
    });
    pop.querySelector('#how-to-play-skip').addEventListener('click', () => { void exitTour(); });
    pop.querySelector('#how-to-play-next').addEventListener('click', () => {
        if (!gateMet) return;
        if (stepIndex >= steps.length - 1) {
            void exitTour();
            return;
        }
        showStep(stepIndex + 1);
    });
    return pop;
}

function clearTargetMark() {
    document.querySelectorAll('.tour-target').forEach((el) => el.classList.remove('tour-target'));
}

function modalIsOpen() {
    const modal = document.getElementById('modal');
    return !!(modal && !modal.classList.contains('hidden'));
}

function assessmentQuestionOpen() {
    if (!modalIsOpen()) return false;
    return !!document.querySelector('#modal .challenge-gate[data-challenge="skill-mcq"]');
}

let assessAdvanceHold = false;

function syncAssessQuestionStep() {
    if (!isTourActive() || restoring || !steps.length) return;
    const open = assessmentQuestionOpen();
    if (!open) assessAdvanceHold = false;
    if (steps[stepIndex]?.id !== 'assess' || !open || assessAdvanceHold) return;
    const next = steps.findIndex((step) => step.id === 'assess-question');
    if (next > stepIndex) showStep(next);
}

function syncModalTourChrome() {
    const pop = document.getElementById('how-to-play-popover');
    const on = isTourActive() && modalIsOpen() && !!pop && !pop.hidden;
    document.body.classList.toggle('tour-modal-clear', on);
    if (!on) document.documentElement.style.removeProperty('--tour-modal-popover');
}

let customPos = null;
let popDrag = null;

function clampPopoverPos(pop, left, top) {
    const width = pop.offsetWidth || 320;
    const height = pop.offsetHeight || 120;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    return {
        left: Math.round(Math.min(Math.max(8, left), maxLeft)),
        top: Math.round(Math.min(Math.max(8, top), maxTop))
    };
}

function setPopoverDragged(pop, dragged) {
    pop.classList.toggle('is-dragged', dragged);
    const reset = pop.querySelector('#how-to-play-reset');
    if (reset) reset.hidden = !dragged;
}

function clearPopoverDrag() {
    customPos = null;
    popDrag = null;
    const pop = document.getElementById('how-to-play-popover');
    if (!pop) return;
    pop.classList.remove('is-dragging');
    setPopoverDragged(pop, false);
}

function applyCustomPos(pop) {
    if (!customPos) return false;
    const next = clampPopoverPos(pop, customPos.left, customPos.top);
    customPos = next;
    pop.classList.remove('is-center');
    pop.style.left = `${next.left}px`;
    pop.style.top = `${next.top}px`;
    setPopoverDragged(pop, true);
    return true;
}

function bindPopoverDrag(pop) {
    pop.querySelector('#how-to-play-reset')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearPopoverDrag();
        const step = steps[stepIndex];
        placePopover(pop, step?.target?.() || null);
    });

    const onMove = (event) => {
        if (!popDrag || event.pointerId !== popDrag.pointerId) return;
        if (!popDrag.moved && Math.hypot(event.clientX - popDrag.startX, event.clientY - popDrag.startY) < 4) return;
        popDrag.moved = true;
        pop.classList.add('is-dragging');
        const next = clampPopoverPos(pop, event.clientX - popDrag.dx, event.clientY - popDrag.dy);
        customPos = next;
        pop.classList.remove('is-center');
        pop.style.left = `${next.left}px`;
        pop.style.top = `${next.top}px`;
        setPopoverDragged(pop, true);
    };

    const endDrag = (event) => {
        if (!popDrag || event.pointerId !== popDrag.pointerId) return;
        const moved = popDrag.moved;
        popDrag = null;
        pop.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        if (!moved) return;
        const swallow = (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            window.removeEventListener('click', swallow, true);
        };
        window.addEventListener('click', swallow, true);
        setTimeout(() => window.removeEventListener('click', swallow, true), 0);
    };

    pop.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (event.target.closest('button, a, input, textarea, select, label')) return;
        const rect = pop.getBoundingClientRect();
        popDrag = {
            pointerId: event.pointerId,
            dx: event.clientX - rect.left,
            dy: event.clientY - rect.top,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        try { pop.setPointerCapture(event.pointerId); } catch { /* gesture still tracked on window */ }
        event.preventDefault();
    });

    pop.addEventListener('dragstart', (event) => event.preventDefault());
}

function placePopover(pop, target) {
    if (applyCustomPos(pop)) return;
    const width = pop.offsetWidth || 320;
    const height = pop.offsetHeight || 120;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);

    if (modalIsOpen()) {
        placeAboveModal(pop);
        return;
    }

    const rect = target?.isConnected ? target.getBoundingClientRect() : null;
    const visible = rect && rect.width > 1 && rect.height > 1;
    if (!visible) {
        pop.classList.add('is-center');
        pop.style.top = '';
        pop.style.left = '';
        return;
    }

    pop.classList.remove('is-center');
    let top = rect.bottom + 10;
    let left = rect.left;
    if (top + height > window.innerHeight - 8) {
        top = rect.top - height - 10;
    }
    top = Math.min(Math.max(8, top), maxTop);
    left = Math.min(Math.max(8, left), maxLeft);
    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
}

let placeQueued = false;

function placeForStep(pop, target) {
    if (steps[stepIndex]?.id === 'lab-orders' && labOrderElements().length) {
        placeLabOrdersPopover(pop);
        return;
    }
    placePopover(pop, target);
}

function queuePlace() {
    if (placeQueued || !isTourActive() || !steps.length) return;
    placeQueued = true;
    requestAnimationFrame(() => {
        placeQueued = false;
        const pop = document.getElementById('how-to-play-popover');
        const step = steps[stepIndex];
        if (!pop || pop.hidden || !step) return;
        placeForStep(pop, step.target?.() || null);
    });
}

function turnQueued(taskId) {
    if (!taskId) return false;
    const queue = gameState.getStateSlice('slotQueue') || [];
    return queue.some((item) => item.taskId === taskId);
}

function noteTurnAssist() {
    const covering = coveringAide();
    const selected = getSelectedAide();
    const aideOn = !!(selected && covering && selected.id === covering.id);
    if (aideOn) {
        const live = findTask((task) => task.patientId === TOUR_PATIENT_ID
            && task.metadata?.kind === 'turn-patient'
            && (slotHas(task.id) || turnQueued(task.id)));
        if (live) {
            tourMemory.turnId = live.id;
            tourMemory.turnAssisted = true;
        }
    }
    const turn = turnTask();
    if (turn && (turn.metadata?.assistedBy || Number(turn.metadata?.assistFactor) > 0)) {
        tourMemory.turnAssisted = true;
    }
    if (tourMemory.turnAssigned) tourMemory.turnAssisted = true;
}

function cnaClickTarget() {
    const aide = coveringAide();
    const button = aide
        ? document.querySelector(`#delegate-rail [data-aide-id="${CSS.escape(aide.id)}"]`)
        : null;
    const panel = document.querySelector('#delegate-rail-panel');
    const panelOpen = panel && !panel.hidden && button && button.getClientRects().length > 0;
    if (panelOpen) return button;
    return document.querySelector('[data-rail-toggle="delegate"]') || button
        || document.querySelector('#delegate-rail');
}

function syncTurnPrompt() {
    const step = steps[stepIndex];
    if (!step || step.id !== 'turn') return;
    const task = turnTask();
    const done = isCompleted(task);
    const covering = coveringAide();
    const selected = getSelectedAide();
    const stillSelected = !!(selected && covering && selected.id === covering.id);
    const body = document.getElementById('how-to-play-body');
    if (body && !(done && !stillSelected)) {
        body.textContent = done && stillSelected
            ? 'Turn patient is done. Click that CNA again to deselect. By not having CNA selected, delegatable tasks are done by you only.'
            : 'With this CNA selected, Turn patient is shared work and takes half the slot time. Assign it, let it run, then deselect the CNA. The next task can be done by you, instead of working with the CNA, or by the CNA.';
    }
    if (!(done && stillSelected)) return;
    const target = cnaClickTarget();
    if (!target) return;
    clearTargetMark();
    target.classList.add('tour-target');
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    const pop = document.getElementById('how-to-play-popover');
    if (pop && !pop.hidden) placePopover(pop, target);
}

function refreshGate() {
    if (restoring || !steps.length) return;
    noteTurnAssist();
    const call = callTask();
    if (call && slotHas(call.id)) tourMemory.callSlotted = true;
    const step = steps[stepIndex];
    gateMet = step ? !!step.ready() : false;
    const next = document.getElementById('how-to-play-next');
    const prev = document.getElementById('how-to-play-prev');
    if (next) {
        next.disabled = !gateMet;
        next.textContent = stepIndex >= steps.length - 1 ? 'Finish' : 'Next';
    }
    if (prev) prev.disabled = stepIndex <= 0;
    syncTurnPrompt();
    syncLabOrdersAim();
    syncTourClock();
}

function syncTourClock() {
    if (restoring || !isTourActive() || !steps.length) return;
    const step = steps[stepIndex];
    const running = !!(step && step.runWhile && step.runWhile());
    if (running) {
        const raised = Math.max(Number(displaySpeed) || 1, TOUR_RUN_SPEED);
        GameTimerModule.setSpeedFactor(raised);
        GameTimerModule.resume(GameConfig.timer.pauseSources.TOUR);
        return;
    }
    GameTimerModule.pause(GameConfig.timer.pauseSources.TOUR);
    GameTimerModule.setSpeedFactor(displaySpeed);
}

function allowedEventTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest('#how-to-play-popover')) return true;
    const modal = document.getElementById('modal');
    if (modal && !modal.classList.contains('hidden') && target.closest('#modal')) return true;
    if (target.closest('.context-menu-list, .context-menu-root, .context-menu-layer')) return true;
    if (gateMet) return labOrderClick(target);
    const step = steps[stepIndex];
    const allow = step?.allow?.() || [];
    return allow.some((selector) => {
        try {
            return !!target.closest(selector);
        } catch {
            return false;
        }
    });
}

function labOrderClick(target) {
    if (steps[stepIndex]?.id !== 'lab-orders') return false;
    const hit = target.closest?.('[data-task-type]');
    if (!hit?.id) return false;
    return !!taskById(hit.id)?.metadata?.fromCriticalLabCallback;
}

function noteTurnClick(target) {
    if (steps[stepIndex]?.id !== 'turn' || !target?.closest) return;
    const hit = target.closest('[data-task-kind="turn-patient"]');
    if (!hit?.id) return;
    const task = taskById(hit.id);
    if (!task || task.patientId !== TOUR_PATIENT_ID || task.metadata?.kind !== 'turn-patient') return;
    const covering = coveringAide();
    if (getSelectedAide()?.id !== covering?.id) return;
    tourMemory.turnId = task.id;
    tourMemory.turnAssigned = true;
    tourMemory.turnAssisted = true;
}

function onTourPointer(event) {
    if (!isTourActive() || !steps.length) return;
    if (allowedEventTarget(event.target)) {
        if (event.type === 'click') noteTurnClick(event.target);
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
    }
}

function scrollShellTo(el) {
    if (!el) return;
    const scroller = document.getElementById('shell-main');
    if (!scroller || !scroller.contains(el)) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        return;
    }
    const elRect = el.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    const delta = (elRect.top + elRect.height / 2) - (box.top + box.height / 2);
    scroller.scrollTop += delta;
}

let labOrdersAimed = '';
let labOrdersAimTries = 0;
let labOrdersAimFrame = 0;

function syncLabOrdersAim() {
    if (steps[stepIndex]?.id !== 'lab-orders') {
        labOrdersAimed = '';
        labOrdersAimTries = 0;
        return;
    }
    const orders = labOrderTasks();
    const body = document.getElementById('how-to-play-body');
    if (body) {
        const names = orders.map((task) => task.name).filter(Boolean);
        body.textContent = names.length
            ? `Receive the orders at the bottom of the chart: ${names.join('; ')}.`
            : 'Receive the orders. They show up at the bottom of the chart.';
    }
    const els = labOrderElements();
    if (orders.length && els.length < orders.length) {
        if (labOrdersAimTries >= 20 || labOrdersAimFrame) return;
        labOrdersAimTries += 1;
        labOrdersAimFrame = requestAnimationFrame(() => {
            labOrdersAimFrame = 0;
            syncLabOrdersAim();
        });
        return;
    }
    if (!els.length) return;
    const key = els.map((el) => el.id).join('|');
    if (key === labOrdersAimed) return;
    labOrdersAimed = key;
    labOrdersAimTries = 0;
    clearTargetMark();
    els.forEach((el) => el.classList.add('tour-target'));
    revealTaskOpacity();
    const focus = els[els.length - 1];
    scrollShellTo(focus);
    const pop = document.getElementById('how-to-play-popover');
    if (pop && !pop.hidden) placeLabOrdersPopover(pop);
}

function placeAboveModal(pop) {
    if (applyCustomPos(pop)) return;
    const width = pop.offsetWidth || 320;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const left = Math.min(Math.max(8, (window.innerWidth - width) / 2), maxLeft);
    pop.classList.remove('is-center');
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = '12px';
    const gap = Math.ceil((pop.offsetHeight || 150) + 24);
    document.documentElement.style.setProperty('--tour-modal-popover', `${gap}px`);
}

function placeLabOrdersPopover(pop) {
    if (applyCustomPos(pop)) return;
    const width = pop.offsetWidth || 320;
    const height = pop.offsetHeight || 150;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    pop.classList.remove('is-center');
    pop.style.left = `${Math.min(12, maxLeft)}px`;
    pop.style.top = `${Math.min(12, maxTop)}px`;
}

function showStep(index) {
    if (!steps.length) return;
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    const step = steps[stepIndex];
    try {
        step.onEnter?.();
    } catch (err) {
        console.error('How to play step failed', step.id, err);
    }
    const pop = ensurePopover();
    const body = pop.querySelector('#how-to-play-body');
    if (body) body.innerHTML = step.body();
    clearTargetMark();
    const target = step.target?.() || null;
    if (target) {
        target.classList.add('tour-target');
        scrollShellTo(target);
    }
    pop.hidden = false;
    syncModalTourChrome();
    placeForStep(pop, target);
    refreshGate();
    queuePlace();
}

function buildSteps() {
    const name = () => patientName();
    return [
        {
            id: 'clock',
            body: () => 'This is a 12-hour shift. The clock is sped up.',
            target: () => {
                const collapsed = document.querySelector('#shell-top-primary')?.classList.contains('is-collapsed');
                if (isNarrow() && collapsed) return document.querySelector('#shell-lean-pause');
                return document.querySelector('#clock')?.closest('.shell-clock-display')
                    || document.querySelector('#clock');
            },
            allow: () => [],
            ready: () => true
        },
        {
            id: 'badges',
            body: () => {
                const first = patientName().split(/\s+/)[0] || 'Sam';
                const badge = document.querySelector(
                    `#patient-tabs [data-patient-id="${TOUR_PATIENT_ID}"] [data-tab-badge]`
                );
                const parsed = Number(badge?.textContent);
                const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
                const tasks = count === 1 ? 'task' : 'tasks';
                return `Each red badge is how many tasks that patient still has. For example, ${first} has ${count} open ${tasks}. Try to complete all tasks in a reasonable amount of time, or by the end of the shift.`;
            },
            target: () => document.querySelector('#patient-tabs'),
            allow: () => [`[data-patient-id="${TOUR_PATIENT_ID}"]`],
            ready: () => onTourPatient()
        },
        {
            id: 'assess',
            body: () => 'Start Shift assessment.',
            target: () => document.getElementById(`${TOUR_PATIENT_ID}-shift-assessment`),
            allow: () => [`#${TOUR_PATIENT_ID}-shift-assessment`],
            ready: () => slotHas(shiftAssessmentTask()?.id)
                || isCompleted(shiftAssessmentTask())
        },
        {
            id: 'assess-question',
            body: () => 'Answer an assessment question to start the assessment task.',
            target: () => null,
            allow: () => ['#modal'],
            ready: () => slotHas(shiftAssessmentTask()?.id) || isCompleted(shiftAssessmentTask())
        },
        {
            id: 'focus',
            body: () => 'Some tasks, including Shift assessment, take full focus, so other tasks wait.',
            target: () => (isNarrow()
                ? document.querySelector('#shell-slots-toggle')
                : document.querySelector('#task-queue-bar')),
            allow: () => ['#shell-slots-toggle', '#task-queue-bar', '#shell-bottom'],
            ready: () => isCompleted(shiftAssessmentTask()),
            runWhile: () => slotHas(shiftAssessmentTask()?.id) && !isCompleted(shiftAssessmentTask())
        },
        {
            id: 'meds',
            body: () => 'Complete this patient’s medications.',
            target: () => document.getElementById('tour-sam-med-atorvastatin')
                || document.querySelector(`#patients [data-task-type="med"]`),
            allow: () => ['#tour-sam-med-atorvastatin', '#patients [data-task-type="med"]'],
            ready: () => isCompleted(medTask()),
            runWhile: () => slotHas(medTask()?.id) && !isCompleted(medTask())
        },
        {
            id: 'cna',
            body: () => {
                const aide = coveringAide();
                const who = aide?.name ? `CNA ${aide.name}` : 'This CNA';
                return `${who} covers ${patientName()} only, and only for part of the shift. Select that CNA, then open ${patientName()}.`;
            },
            target: () => (isNarrow()
                ? document.querySelector('[data-rail-toggle="delegate"]')
                : document.querySelector('#delegate-rail [data-rail-kind="delegate"]')
                    || document.querySelector('#delegate-rail')),
            allow: () => [
                '[data-rail-toggle="delegate"]',
                '#delegate-rail',
                '#delegate-rail-panel',
                `[data-patient-id="${TOUR_PATIENT_ID}"]`
            ],
            ready: () => {
                const aide = coveringAide();
                const selected = getSelectedAide();
                return !!aide && selected?.id === aide.id && onTourPatient();
            },
            onEnter: () => parkForCna()
        },
        {
            id: 'turn',
            body: () => 'With this CNA selected, Turn patient is shared work and takes half the slot time. Assign it, let it run, then deselect the CNA. The next task can be done by you, instead of working with the CNA, or by the CNA.',
            target: () => {
                const task = turnTask();
                return task ? document.getElementById(task.id) : document.querySelector('[data-task-kind="turn-patient"]');
            },
            allow: () => {
                const task = turnTask();
                const sel = task ? `#${CSS.escape(task.id)}` : '[data-task-kind="turn-patient"]';
                const aideOn = getSelectedAide()?.id && getSelectedAide().id === coveringAide()?.id;
                const controls = ['[data-rail-toggle="delegate"]', '#delegate-rail', '#delegate-rail-panel'];
                if (!aideOn && !slotHas(task?.id) && !isCompleted(task)) return controls;
                return [sel, '[data-task-kind="turn-patient"]', ...controls, '#shell-slots-toggle', '#task-queue-bar'];
            },
            ready: () => {
                const task = turnTask();
                return isCompleted(task) && !!tourMemory.turnAssisted && !getSelectedAide();
            },
            runWhile: () => {
                const task = turnTask();
                return slotHas(task?.id) && !isCompleted(task);
            },
            onEnter: () => {
                const task = turnTask();
                if (task) tourMemory.turnId = task.id;
            }
        },
        {
            id: 'call',
            body: () => `${patientName()} wants water. Open the call light and complete it yourself.`,
            target: () => document.querySelector('#incident-tabs'),
            allow: () => ['#incident-tabs', '[data-task-kind="call-light"]', '#shell-slots-toggle', '#task-queue-bar'],
            ready: () => isCompleted(callTask()) && !!tourMemory.callSlotted && !getSelectedAide(),
            runWhile: () => slotHas(callTask()?.id) && !isCompleted(callTask()),
            onEnter: () => spawnTourCallLight()
        },
        {
            id: 'lab-call',
            body: () => 'A critical lab is in. Call the doctor.',
            target: () => document.querySelector('#incident-tabs'),
            allow: () => ['#incident-tabs', '[data-task-kind="critical-lab-call"]', '[data-task-type="criticallab"]'],
            ready: () => isCompleted(labCallTask()),
            onEnter: () => spawnTourLab()
        },
        {
            id: 'lab-callback',
            body: () => 'Take the callback.',
            target: () => {
                const task = labCallbackTask();
                return task ? document.getElementById(task.id) : document.querySelector('#incident-tabs');
            },
            allow: () => {
                const task = labCallbackTask();
                const sel = task ? `#${CSS.escape(task.id)}` : '[data-task-type="criticallab"]';
                return [sel, '#incident-tabs', '[data-task-type="criticallab"]', '#shell-slots-toggle', '#task-queue-bar'];
            },
            ready: () => slotHas(labCallbackTask()?.id) || isCompleted(labCallbackTask()),
            runWhile: () => slotHas(labCallbackTask()?.id) && !isCompleted(labCallbackTask()),
            onEnter: () => {
                PatientsModule.showPatientPanel?.(TOUR_PATIENT_ID, { logMessage: false });
            }
        },
        {
            id: 'lab-orders',
            body: () => {
                const names = labOrderTasks().map((task) => task.name).filter(Boolean);
                return names.length
                    ? `Receive the orders at the bottom of the chart: ${names.join('; ')}.`
                    : 'Receive the orders. They show up at the bottom of the chart.';
            },
            target: () => {
                const els = labOrderElements();
                return els[els.length - 1] || null;
            },
            allow: () => labOrderTasks().map((task) => `#${CSS.escape(task.id)}`),
            ready: () => {
                if (!labOrderTasks().length) return false;
                if (isCompleted(labCallbackTask())) return true;
                return !!findTask((task) => task.patientId === TOUR_PATIENT_ID
                    && task.metadata?.kind === 'critical-lab-callback'
                    && isCompleted(task));
            },
            runWhile: () => slotHas(labCallbackTask()?.id) && !isCompleted(labCallbackTask()),
            onEnter: () => {
                PatientsModule.showPatientPanel?.(TOUR_PATIENT_ID, { logMessage: false });
            }
        },
        {
            id: 'orders',
            body: () => `
                <ul class="how-to-play-popover__list">
                    <li>Open Global and run Check orders. Do this every hour.</li>
                    <li>This check expires. Miss it, and it counts against your final score.</li>
                    <li>Checking orders, there's a chance a new order may appear under a patient just like in real life.</li>
                </ul>
            `,
            target: () => document.querySelector('.patient-tab[data-tab="global"]')
                || document.querySelector('#patient-tabs'),
            allow: () => ['.patient-tab[data-tab="global"]', '#global-panel', '#doctor-orders-list', '[data-task-type="orders"]'],
            ready: () => isCompleted(ordersCheckTask()) && !!injectedOrderTask(),
            onEnter: () => spawnTourOrdersCheck()
        },
        {
            id: 'refresher',
            body: () => `
                <ul class="how-to-play-popover__list">
                    <li>Fewer open tasks is better. Finish them on time, or by the end of the shift.</li>
                    <li>Medications count from 1 hour before they are due until 1 hour after.</li>
                    <li>Check orders every hour. New tasks can show up.</li>
                    <li>Under the patient list, handle call lights, phone calls, critical labs, and emergencies.</li>
                    <li>The clock is sped up. Last the full 12 hours.</li>
                </ul>
                <p class="how-to-play-popover__close">Good luck.</p>
            `,
            target: () => null,
            allow: () => [],
            ready: () => true
        }
    ];
}

function parkForCna() {
    const aide = coveringAide();
    if (!aide?.availableFrom) return;
    const now = Number(gameState.getStateSlice('currentTime'));
    if (!isAideAvailable(aide, now)) {
        GameTimerModule.seekToHhmm(aide.availableFrom);
    }
    tourMemory.parkedAt = Number(aide.availableFrom);
    taskSystem.processTasks(gameState.getStateSlice('currentTime'));
    revealTaskOpacity();
    const task = turnTask();
    if (task) tourMemory.turnId = task.id;
    PatientsModule.renderPatientTabs?.();
}

function spawnTourCallLight() {
    clearDelegateSelection();
    if (tourMemory.callId && taskById(tourMemory.callId)) return;
    const live = spawnCallLightNow({
        templateId: 'water',
        patientId: TOUR_PATIENT_ID,
        focusPatient: false,
        scrollIntoView: false,
        silent: true
    });
    if (live?.id) tourMemory.callId = live.id;
    revealTaskOpacity();
}

function spawnTourLab() {
    if (tourMemory.labCallId && taskById(tourMemory.labCallId)) return;
    const live = spawnCriticalLabNow({
        labId: 'k-high',
        patientId: TOUR_PATIENT_ID,
        focusPatient: false,
        scrollIntoView: false
    });
    if (live?.id) tourMemory.labCallId = live.id;
    revealTaskOpacity();
}

function spawnTourOrdersCheck() {
    if (tourMemory.ordersCheckId && taskById(tourMemory.ordersCheckId)) return;
    const now = gameState.getStateSlice('currentTime') || TOUR_SHIFT_START;
    const live = forceSpawnOrdersCheck(now);
    if (live?.id) tourMemory.ordersCheckId = live.id;
    revealTaskOpacity();
}

function bindTourGuards() {
    if (bindTourGuards.bound) return;
    bindTourGuards.bound = true;
    document.addEventListener('pointerdown', onTourPointer, true);
    document.addEventListener('click', onTourPointer, true);
    document.addEventListener('click', () => queuePlace(), true);
    document.addEventListener('scroll', () => queuePlace(), true);
    window.addEventListener('resize', () => queuePlace());
    const modal = document.getElementById('modal');
    if (modal) {
        const modalWatch = new MutationObserver(() => {
            if (!isTourActive()) return;
            syncAssessQuestionStep();
            syncModalTourChrome();
            queuePlace();
        });
        modalWatch.observe(modal, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true
        });
    }
    clockWatch = gameState.subscribe('tasks', () => {
        if (isTourActive()) refreshGate();
    });
    gameState.subscribe('slots', () => {
        if (isTourActive()) refreshGate();
    });
    gameState.subscribe('activePatientId', () => {
        if (isTourActive()) refreshGate();
    });
    gameState.subscribe('delegation', () => {
        if (isTourActive()) refreshGate();
    });
    gameState.subscribe('slotQueue', () => {
        if (isTourActive()) refreshGate();
    });
}

async function enterSwappedTour() {
    displaySpeed = GameTimerModule.getState()?.speedFactor || displaySpeed;
    const pack = await loadTourPack();
    saved = captureShift();
    hadLiveShift = true;
    setTourActive(true);
    ModalModule.closeModal?.();
    tourMemory = {};
    gameState.dispatch('REPLACE_STATE', { state: blankTourState(pack) });
    setShiftAnchor(TOUR_SHIFT_START);
    setDoctorOrdersShift(TOUR_SHIFT_START, TOUR_SHIFT_MINUTES);
    ScenarioPackModule.applyPackChrome?.(pack);
    GameTimerModule.beginWindow({
        shiftStart: TOUR_SHIFT_START,
        gameMinutesPerShift: TOUR_SHIFT_MINUTES,
        speedFactor: displaySpeed
    });
    GameTimerModule.pause(GameConfig.timer.pauseSources.TOUR);
    await PatientsModule.initializePatient(TOUR_PATIENT, { skipSoloTasks: true });
    taskSystem.syncRegistryFromState?.();
    const delegation = buildDelegationState({
        pack,
        patientIds: [TOUR_PATIENT_ID],
        shiftStart: TOUR_SHIFT_START,
        shiftMins: TOUR_SHIFT_MINUTES
    });
    gameState.dispatch('SET_DELEGATION', { delegation });
    taskSystem.processTasks(TOUR_SHIFT_START);
    revealTaskOpacity();
    PatientsModule.setPanelMode?.('patient');
    PatientsModule.renderPatientTabs?.();
    PatientsModule.applyPanelVisibility?.();
}

function beginPopovers() {
    hideLaunch();
    clearPopoverDrag();
    bindTourGuards();
    steps = buildSteps();
    stepIndex = 0;
    if (!hadLiveShift) {
        displaySpeed = GameTimerModule.getState()?.speedFactor || displaySpeed;
        setShiftAnchor(TOUR_SHIFT_START);
        setDoctorOrdersShift(TOUR_SHIFT_START, TOUR_SHIFT_MINUTES);
        GameTimerModule.pause(GameConfig.timer.pauseSources.TOUR);
        taskSystem.processTasks(gameState.getStateSlice('currentTime') || TOUR_SHIFT_START);
        revealTaskOpacity();
    }
    showStep(0);
}

async function exitTour() {
    clearPopoverDrag();
    const pop = document.getElementById('how-to-play-popover');
    if (pop) pop.hidden = true;
    clearTargetMark();
    assessAdvanceHold = false;
    document.body.classList.remove('tour-modal-clear');
    document.documentElement.style.removeProperty('--tour-modal-popover');
    steps = [];
    hideCriticalLabMedia?.();
    const toast = document.querySelector('#shell-awaiting-callback-toast');
    if (toast) {
        toast.hidden = true;
        toast.classList.remove('is-visible');
    }
    ModalModule.closeModal?.();
    if (!hadLiveShift) {
        window.location.assign('../index.html');
        return;
    }
    const snap = saved;
    saved = null;
    hadLiveShift = false;
    tourMemory = {};
    if (snap) restoreShift(snap);
    setTourActive(false);
    showLaunch();
}

function onTourStartError(err) {
    console.error('How to play failed', err);
    if (saved) restoreShift(saved);
    saved = null;
    hadLiveShift = false;
    setTourActive(false);
    showLaunch();
}

async function startFromButton() {
    if (isTourActive()) return;
    if (!liveShiftRunning()) {
        const params = new URLSearchParams({
            'speed-factor': '16',
            scenario: TOUR_PACK_URL
        });
        window.location.assign(`index.html?${params.toString()}`);
        return;
    }
    await enterSwappedTour();
    beginPopovers();
}

function bindTourStart(el) {
    el?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('docs-dropdown')?.classList.add('hidden');
        startFromButton().catch(onTourStartError);
    });
}

function init() {
    bindTourStart(document.getElementById('how-to-play-launch'));
    bindTourStart(document.getElementById('docs-how-to-play'));
    watchFirstRealTask();
    const pack = gameState.getStateSlice('scenarioPack');
    if (pack?.id === 'how-to-play') {
        setTourActive(true);
        hadLiveShift = false;
        beginPopovers();
    }
}

const HowToPlayModule = { init };
bindTourGuards();
export default HowToPlayModule;
