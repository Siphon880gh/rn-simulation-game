/**
 * Thin mid-shift dynamic/urgent spawn from templates (E3.M5).
 * Game-time cadence only (honors pause). Incident tabs omit event clock time.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';

const spawnedCadenceKeys = new Set();
let spawnCount = 0;
let shiftStart = GameConfig.timer.defaultShiftStart;

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function minutesIntoShift(currentTime, start = shiftStart) {
    const startM = hhmmToMinutes(start);
    let curM = hhmmToMinutes(currentTime);
    if (curM < startM) curM += 24 * 60;
    return Math.max(0, curM - startM);
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function getTemplates() {
    const pack = gameState.getStateSlice('scenarioPack');
    const fromPack = pack?.dynamicTemplates;
    if (Array.isArray(fromPack) && fromPack.length) return fromPack;
    return GameConfig.dynamicTasks?.templates || [];
}

export function weightedPick(templates, random = Math.random) {
    const list = templates.filter((t) => t && t.weight > 0);
    if (!list.length) return null;
    const total = list.reduce((sum, t) => sum + Number(t.weight || 0), 0);
    if (total <= 0) return null;
    let roll = random() * total;
    for (const t of list) {
        roll -= Number(t.weight || 0);
        if (roll <= 0) return t;
    }
    return list[list.length - 1];
}

function pickPatientId(scope, random = Math.random) {
    const patients = gameState.getStateSlice('patients');
    if (!patients || !patients.size) return null;
    const ids = [...patients.keys()];
    if (scope && scope !== 'random' && patients.has(scope)) return scope;
    return ids[Math.floor(random() * ids.length)] || null;
}

function countActiveDynamic() {
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks) return 0;
    let n = 0;
    tasks.forEach((t) => {
        if (
            t.metadata?.dynamic
            && (t.status === GameConfig.tasks.statuses.ACTIVE
                || t.status === GameConfig.tasks.statuses.NOT_YET)
        ) {
            n += 1;
        }
    });
    return n;
}

function ensureIncidentHost() {
    let host = document.querySelector('#incident-tabs');
    if (host) return host;
    const left = document.querySelector(GameConfig.selectors.leftMenu);
    if (!left) return null;
    const wrap = document.createElement('div');
    wrap.className = 'incident-tabs-wrap mt-3';
    wrap.innerHTML = `
      <p class="shell-menu-label">Incidents</p>
      <div id="incident-tabs" class="incident-tabs" role="list" aria-label="Emergent incidents"></div>
    `;
    left.appendChild(wrap);
    return wrap.querySelector('#incident-tabs');
}

function renderIncidentTab(task) {
    const host = ensureIncidentHost();
    if (!host) return;
    let tab = host.querySelector(`[data-incident-task="${task.id}"]`);
    if (!tab) {
        tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'incident-tab';
        tab.setAttribute('data-incident-task', task.id);
        tab.setAttribute('role', 'listitem');
        tab.addEventListener('click', () => {
            if (task.patientId) {
                gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: task.patientId });
            }
        });
        host.appendChild(tab);
    }

    const patient = task.patientId
        ? gameState.getStateSlice('patients')?.get(task.patientId)
        : null;
    const who = patient?.room || patient?.name || task.patientId || 'Unit';
    // S3.9: do NOT show event clock time on the tab
    tab.textContent = `${task.name} · ${who}`;
    tab.classList.toggle('is-resolved', task.status === GameConfig.tasks.statuses.COMPLETED);
    tab.classList.toggle('is-overdue', task.status === GameConfig.tasks.statuses.OVERDUE);
    if (
        task.status === GameConfig.tasks.statuses.COMPLETED
        || task.status === GameConfig.tasks.statuses.OVERDUE
    ) {
        tab.disabled = task.status === GameConfig.tasks.statuses.COMPLETED;
    }
}

/** Mount an injected/dynamic task tile on the patient panel (used by event-drip too). */
export function mountTaskDom(task) {
    if (!task.patientId) return;
    const panel = document.querySelector(`.patient-panel-host[data-patient-id="${task.patientId}"]`);
    if (!panel) return;

    let list = panel.querySelector('.dynamic-tasks-list');
    if (!list) {
        const block = document.createElement('div');
        block.className = 'space-y-2 mb-4 dynamic-tasks-block';
        const heading = document.createElement('h4');
        heading.className = 'font-semibold flex items-center gap-2 text-amber-800';
        heading.textContent = 'Urgent / dynamic';
        list = document.createElement('ul');
        list.className = 'dynamic-tasks-list space-y-3';
        block.appendChild(heading);
        block.appendChild(list);
        const patientRoot = panel.querySelector('.patient') || panel;
        patientRoot.appendChild(block);
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
    li.setAttribute('title', 'Click for Perform / Details menu');
    li.className = `bg-amber-50 p-4 rounded-lg shadow flex items-center task-status-${task.status} border border-amber-200`;
    const icon = task.type === 'med' ? 'fa-pills text-blue-500' : 'fa-bell text-amber-600';
    li.innerHTML = `
      <data class="slot-label" value="1"></data>
      <i class="fas ${icon} text-xl mr-3"></i>
      <span class="font-medium text-gray-900">${task.name}</span>
      <span class="ml-auto text-xs uppercase tracking-wide text-amber-700">dynamic</span>
    `;
    list.appendChild(li);
}

export function spawnFromTemplate(template, currentTime, opts = {}) {
    const random = opts.random || Math.random;
    const patientId = pickPatientId(template.patientScope || 'random', random);
    if (!patientId && template.patientScope !== 'unit') return null;

    const id = `dyn-${template.id || 'task'}-${Date.now()}-${Math.floor(random() * 1e4)}`;
    const task = taskSystem.createTask({
        id,
        type: template.type || 'assessment',
        taskClass: template.taskClass || GameConfig.tasks.classes.URGENT,
        name: template.name || 'Dynamic task',
        scheduled: currentTime,
        expire: template.expire != null ? template.expire : '+45',
        durationMins: template.durationMins ?? 10,
        patientId: patientId || null,
        metadata: {
            dynamic: true,
            templateId: template.id || null,
            incident: true
        }
    });

    taskSystem.processTasks(currentTime);
    const live = gameState.getStateSlice('tasks').get(task.id) || task;
    mountTaskDom(live);
    renderIncidentTab(live);

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Dynamic urgent: ${live.name}${patientId ? ` (${patientId})` : ''}`,
        timeLabel: formatHHMM(currentTime)
    });

    const statusEl = document.querySelector(GameConfig.selectors.statusMessage);
    if (statusEl) {
        statusEl.textContent = `Urgent: ${live.name}`;
    }

    spawnCount += 1;
    return live;
}

export function processDynamicTasksTime(currentTime, opts = {}) {
    if (currentTime == null) return null;
    if (gameState.getStateSlice('isPaused')) return null;
    if (gameState.getStateSlice('gameStatus') !== GameConfig.gameStates.RUNNING) return null;

    const cfg = GameConfig.dynamicTasks || {};
    const cadence = Number(cfg.cadenceGameMinutes) || 60;
    const maxActive = Number(cfg.maxActive) || 2;
    const maxPerShift = Number(cfg.maxPerShift) || 4;
    const into = minutesIntoShift(currentTime, shiftStart);

    // Skip spawn at shift start (into === 0); first opportunity at cadence boundary
    if (into < cadence) {
        refreshIncidentTabs();
        return null;
    }

    const bucket = Math.floor(into / cadence);
    const key = `cadence-${bucket}`;
    if (spawnedCadenceKeys.has(key)) {
        refreshIncidentTabs();
        return null;
    }

    if (spawnCount >= maxPerShift || countActiveDynamic() >= maxActive) {
        spawnedCadenceKeys.add(key);
        refreshIncidentTabs();
        return null;
    }

    const template = weightedPick(getTemplates(), opts.random);
    if (!template) {
        spawnedCadenceKeys.add(key);
        return null;
    }

    spawnedCadenceKeys.add(key);
    return spawnFromTemplate(template, currentTime, opts);
}

function refreshIncidentTabs() {
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks) return;
    tasks.forEach((task) => {
        if (task.metadata?.incident) renderIncidentTab(task);
    });
}

export function resetDynamicTasks() {
    spawnedCadenceKeys.clear();
    spawnCount = 0;
}

const DynamicTasksModule = {
    processDynamicTasksTime,
    spawnFromTemplate,
    mountTaskDom,
    weightedPick,
    resetDynamicTasks,
    init(config = {}) {
        resetDynamicTasks();
        shiftStart = config.shiftStarts ?? GameConfig.timer.defaultShiftStart;
        ensureIncidentHost();
        gameState.subscribe('currentTime', (t) => processDynamicTasksTime(t));
        gameState.subscribe('tasks', () => refreshIncidentTabs());
    }
};

export default DynamicTasksModule;
