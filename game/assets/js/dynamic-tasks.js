/**
 * Thin mid-shift dynamic/urgent spawn from templates (E3.M5).
 * Game-time cadence only (honors pause). Incident tabs omit event clock time.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { isAtOrAfterInShift } from './availability-windows.js';
import { decorateAccucheckDice } from './challenges/skills/accucheck/challenge.js';

const spawnedCadenceKeys = new Set();
let spawnCount = 0;
let shiftStart = GameConfig.timer.defaultShiftStart;
/** @type {{ showPatientPanel?: Function } | null} */
let patientsApi = null;

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

function pickPatientId(scope, random = Math.random, preferredId = null) {
    const patients = gameState.getStateSlice('patients');
    if (!patients || !patients.size) return null;
    if (preferredId && patients.has(preferredId)) return preferredId;
    const ids = [...patients.keys()];
    if (scope && scope !== 'random' && patients.has(scope)) return scope;
    return ids[Math.floor(random() * ids.length)] || null;
}

function injectRevealForTask(task) {
    const styleEl = document.querySelector(GameConfig.selectors.revealScheduledTasks);
    if (!styleEl || task?.scheduled == null) return;
    const sched = String(task.scheduled).padStart(4, '0');
    const marker = `li[data-scheduled="${sched}"]`;
    if (styleEl.textContent.includes(marker)) return;
    styleEl.innerHTML += taskSystem.buildRevealRule(
        task.scheduled,
        task.expire,
        task.metadata?.expireRaw || null
    );
}

function syncSpawnedTaskDom(task) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(task.id);
    if (!el) return;
    el.setAttribute('data-status', task.status);
    el.classList.remove(
        'task-status-not-yet',
        'task-status-active',
        'task-status-completed',
        'task-status-overdue'
    );
    el.classList.add(`task-status-${task.status}`);
    taskSystem.syncTaskWindowDomAttrs(el, task);
}

/**
 * Ensure a just-spawned task is active, mounted, revealed, and (optionally) focused.
 * Used by nurse alerts / dynamic / critical labs / test mode.
 */
export function presentSpawnedTask(task, opts = {}) {
    if (!task?.id) return null;
    const now = opts.at
        ?? gameState.getStateSlice('currentTime')
        ?? task.scheduled
        ?? GameConfig.timer.defaultShiftStart;

    if (task.status === GameConfig.tasks.statuses.NOT_YET) {
        taskSystem.processTasks(now);
    }
    let live = gameState.getStateSlice('tasks')?.get(task.id) || task;

    if (
        live.status === GameConfig.tasks.statuses.NOT_YET
        && isAtOrAfterInShift(now, live.scheduled)
    ) {
        gameState.dispatch('ACTIVATE_TASK', { taskId: live.id });
        live = gameState.getStateSlice('tasks')?.get(live.id) || live;
    }

    if (typeof document !== 'undefined') {
        mountTaskDom(live);
        syncSpawnedTaskDom(live);
        injectRevealForTask(live);
        if (live.metadata?.incident) renderIncidentTab(live);
    }

    if (opts.focusPatient && live.patientId) {
        gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: live.patientId });
    }
    if (opts.scrollIntoView !== false && typeof document !== 'undefined' && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
            document.getElementById(live.id)?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        });
    }
    return live;
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

function focusIncidentTask(taskId) {
    const live = gameState.getStateSlice('tasks')?.get(taskId);
    if (!live) return;

    if (live.patientId) {
        if (typeof patientsApi?.showPatientPanel === 'function') {
            patientsApi.showPatientPanel(live.patientId, {
                logMessage: `Opened from incident: ${live.name}`
            });
        } else {
            gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: live.patientId });
        }
    }

    if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
        const el = document.getElementById(live.id);
        if (!el) return;
        el.classList.add('rail-focus-pulse');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        window.setTimeout(() => el.classList.remove('rail-focus-pulse'), 1200);
    });
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
            focusIncidentTask(task.id);
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
    if (typeof document === 'undefined') return;
    const panel = document.querySelector(`.patient-panel-host[data-patient-id="${task.patientId}"]`);
    if (!panel) return;

    let list = panel.querySelector('.dynamic-tasks-list');
    if (!list) {
        const block = document.createElement('div');
        block.className = 'space-y-2 mb-4 dynamic-tasks-block';
        const heading = document.createElement('h4');
        heading.className = 'font-semibold flex items-center gap-2 text-amber-800 w-full task-section-heading cursor-pointer hover:bg-amber-50';
        heading.innerHTML = '<span class="task-section-chevron" aria-hidden="true"></span><i class="fas fa-bell text-amber-600 text-xl mr-1"></i><span>Urgent / dynamic</span>';
        list = document.createElement('ul');
        list.className = 'dynamic-tasks-list space-y-3';
        heading.setAttribute('aria-expanded', 'true');
        heading.addEventListener('click', (e) => {
            if (e.target.closest('.task-fallout-toggle')) return;
            list.classList.toggle('hidden');
            const expanded = !list.classList.contains('hidden');
            heading.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            heading.classList.toggle('is-collapsed', !expanded);
        });
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
    if (task.metadata?.delegateMode) {
        li.setAttribute('data-delegate-mode', String(task.metadata.delegateMode));
    }
    if (task.metadata?.challenge) {
        li.setAttribute('data-challenge', task.metadata.challenge);
    }
    li.setAttribute('title', 'Click for Perform / Details menu');
    const isCrit = task.type === 'criticallab' || task.metadata?.criticalLab;
    li.className = isCrit
        ? `bg-red-50 p-4 rounded-lg shadow flex items-center task-status-${task.status} border border-red-300`
        : `bg-amber-50 p-4 rounded-lg shadow flex items-center task-status-${task.status} border border-amber-200`;
    const icon = task.type === 'med'
        ? 'fa-pills text-blue-500'
        : isCrit
            ? 'fa-vial text-red-600'
            : 'fa-bell text-amber-600';
    const badge = isCrit ? 'critical lab' : 'dynamic';
    const badgeClass = isCrit ? 'text-red-700' : 'text-amber-700';
    const labResult = isCrit && task.metadata?.labResult
        ? `<span class="block text-xs text-red-800 mt-0.5 font-normal">${task.metadata.labResult}</span>`
        : '';
    li.innerHTML = `
      <data class="slot-label" value="1"></data>
      <i class="fas ${icon} text-xl mr-3"></i>
      <span class="font-medium text-gray-900 flex-1 min-w-0">${task.name}${labResult}</span>
      <span class="ml-auto text-xs uppercase tracking-wide ${badgeClass}">${badge}</span>
    `;
    list.appendChild(li);
    decorateAccucheckDice(li.parentElement || list);
    taskSystem.syncTaskWindowDomAttrs?.(li, task);
    taskSystem.refreshFalloutUi?.(list.closest('.dynamic-tasks-block') || panel);
}

export function spawnFromTemplate(template, currentTime, opts = {}) {
    const random = opts.random || Math.random;
    const patientId = pickPatientId(
        template.patientScope || 'random',
        random,
        opts.patientId || null
    );
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

    const live = presentSpawnedTask(task, {
        at: currentTime,
        focusPatient: opts.focusPatient === true,
        scrollIntoView: opts.scrollIntoView
    }) || task;

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
    presentSpawnedTask,
    weightedPick,
    resetDynamicTasks,
    init(config = {}) {
        resetDynamicTasks();
        shiftStart = config.shiftStarts ?? GameConfig.timer.defaultShiftStart;
        patientsApi = config.patients || patientsApi;
        ensureIncidentHost();
        gameState.subscribe('currentTime', (t) => processDynamicTasksTime(t));
        gameState.subscribe('tasks', () => refreshIncidentTabs());
    }
};

export default DynamicTasksModule;
