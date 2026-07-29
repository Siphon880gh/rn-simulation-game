/**
 * Right rail — Orders & Tools (E10).
 * Declarative: subscribe to gameState; do not scrape Global DOM.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { listPendingCriticalLabCallbacks } from './critical-labs.js';
import { listPendingAdmissionCallbacks, isOpenAdmitMode } from './admission-system.js';
import { isAtOrAfterInShift } from './availability-windows.js';
import {
    listDelegateRailRows,
    selectAide,
    modeConfig
} from './delegation.js';

/** @type {{ showGlobalPanel?: Function, getPatient?: Function } | null} */
let patientsApi = null;

function formatHHMM(hhmm) {
    if (hhmm == null || hhmm === '') return '—';
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function ordersHost() {
    return document.querySelector(GameConfig.selectors.ordersRail || '#orders-rail');
}

function toolsHost() {
    return document.querySelector(GameConfig.selectors.toolsRail || '#tools-rail');
}

function delegateHost() {
    return document.querySelector(GameConfig.selectors.delegateRail || '#delegate-rail');
}

function emptyRow(host, message) {
    if (!host) return;
    const p = document.createElement('p');
    p.className = 'shell-menu-placeholder';
    p.textContent = message;
    host.appendChild(p);
}

function statusClass(status) {
    return `rail-item status-${status || 'unknown'}`;
}

export function listOrderChecks(tasks) {
    const out = [];
    tasks?.forEach((task) => {
        if (task?.metadata?.kind === 'doctor-orders-check') out.push(task);
    });
    out.sort((a, b) => Number(a.scheduled) - Number(b.scheduled));
    return out;
}

export function listInjectedOrders(tasks) {
    const out = [];
    const done = GameConfig.tasks.statuses.COMPLETED;
    tasks?.forEach((task) => {
        if (!task?.metadata?.fromOrdersCheck) return;
        if (task.status === done) return;
        out.push(task);
    });
    out.sort((a, b) => Number(a.scheduled) - Number(b.scheduled));
    return out;
}

function focusOrdersCheckInGlobal(taskId) {
    const el = document.getElementById(taskId);
    if (!el) return;
    el.classList.add('rail-focus-pulse');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    window.setTimeout(() => el.classList.remove('rail-focus-pulse'), 1200);
}

function onOrdersCheckClick(task) {
    patientsApi?.showGlobalPanel?.({
        logMessage: `Opened Global from Orders rail (${task.name})`
    });
    window.requestAnimationFrame(() => focusOrdersCheckInGlobal(task.id));
}

function onInjectedOrderClick(task) {
    if (task.patientId) {
        patientsApi?.showPatientPanel?.(task.patientId, {
            logMessage: `Jumped to order: ${task.name}`
        });
        window.requestAnimationFrame(() => {
            const el = document.getElementById(task.id);
            el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
        });
        return;
    }
    patientsApi?.showGlobalPanel?.({
        logMessage: `Opened Global for unit order: ${task.name}`
    });
}

function renderOrders() {
    const host = ordersHost();
    if (!host) return;
    host.replaceChildren();

    const tasks = gameState.getStateSlice('tasks');
    const checks = listOrderChecks(tasks);
    const injected = listInjectedOrders(tasks);
    const activeHour = gameState.getStateSlice('activeHourHhmm');

    if (!checks.length && !injected.length) {
        emptyRow(host, 'No orders checks yet');
        return;
    }

    checks.forEach((task) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = statusClass(task.status);
        btn.setAttribute('role', 'listitem');
        btn.dataset.railKind = 'orders-check';
        btn.dataset.taskId = task.id;
        if (Number(task.scheduled) === Number(activeHour)) {
            btn.classList.add('is-current-hour');
        }
        const expireLabel = task.expire != null ? formatHHMM(task.expire) : '—';
        btn.innerHTML = `
          <span class="rail-item__title">${task.name}</span>
          <span class="rail-item__meta">${formatHHMM(task.scheduled)} – ${expireLabel} · ${task.status}</span>
        `;
        btn.addEventListener('click', () => onOrdersCheckClick(task));
        host.appendChild(btn);
    });

    injected.forEach((task) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `${statusClass(task.status)} is-injected`;
        btn.setAttribute('role', 'listitem');
        btn.dataset.railKind = 'injected-order';
        btn.dataset.taskId = task.id;
        const who = task.patientId ? ` · ${task.patientId}` : '';
        btn.innerHTML = `
          <span class="rail-item__title">New: ${task.name}</span>
          <span class="rail-item__meta">${formatHHMM(task.scheduled)}${who}</span>
        `;
        btn.addEventListener('click', () => onInjectedOrderClick(task));
        host.appendChild(btn);
    });
}

function ivAttentionRows(patients, now) {
    const rows = [];
    patients?.forEach((patient) => {
        (patient.ivLines || []).forEach((line) => {
            const needsPtt = line.protocol === 'heparin-ptt'
                && line.nextPttAt != null
                && isAtOrAfterInShift(now, line.nextPttAt);
            const isDrip = line.kind === 'drip' || line.category === 'drip';
            const held = line.status === 'held' || line.held === true;
            if (!needsPtt && !held && !isDrip) return;
            if (!needsPtt && !held && isDrip) {
                // Drips only surface when held or PTT due — skip quiet continuous drips
                return;
            }
            let reason = 'IV attention';
            if (needsPtt) reason = `PTT due ${formatHHMM(line.nextPttAt)}`;
            else if (held) reason = 'IV held';
            rows.push({
                id: `iv-${patient.id}-${line.id}`,
                patientId: patient.id,
                title: `${patient.name || patient.id}`,
                meta: `${line.label || line.id || 'IV'} · ${reason}`
            });
        });
    });
    return rows;
}

function admitGlanceRows() {
    const rows = [];
    const hold = gameState.getStateSlice('admitHold');
    if (hold?.heldPatientId && !hold.spawned && isOpenAdmitMode(hold.mode)) {
        rows.push({
            id: 'admit-hold',
            patientId: null,
            title: 'Open admit pending',
            meta: hold.admitAt != null
                ? `Expected ~${formatHHMM(hold.admitAt)}${hold.windowKey ? ` (${hold.windowKey})` : ''}`
                : 'Waiting for arrival'
        });
    }
    const patients = gameState.getStateSlice('patients');
    patients?.forEach((patient) => {
        if (patient.admissionPhase !== 'admitting') return;
        rows.push({
            id: `admit-${patient.id}`,
            patientId: patient.id,
            title: `${patient.name || patient.id}`,
            meta: 'Admitting checklist in progress'
        });
    });
    return rows;
}

function onPatientJump(patientId, message) {
    if (!patientId) return;
    patientsApi?.showPatientPanel?.(patientId, {
        logMessage: message || false
    });
}

function renderTools() {
    const host = toolsHost();
    if (!host) return;
    host.replaceChildren();

    const now = gameState.getStateSlice('currentTime');
    const patients = gameState.getStateSlice('patients');
    const awaiting = [
        ...listPendingCriticalLabCallbacks().map((p) => ({
            id: `md-crit-${p.callTaskId}`,
            patientId: p.patientId,
            title: `Awaiting MD · ${p.labShortName || p.labId || 'lab'}`,
            meta: `${p.patientId || '—'} · callback by ${formatHHMM(p.callbackAt)}`
        })),
        ...listPendingAdmissionCallbacks().map((p) => ({
            id: `md-admit-${p.callTaskId}`,
            patientId: p.patientId,
            title: 'Awaiting admitting MD',
            meta: `${p.patientId || '—'} · ${p.consult || 'consult'} by ${formatHHMM(p.callbackAt)}`
        }))
    ];
    const ivRows = ivAttentionRows(patients, now);
    const admitRows = admitGlanceRows();

    if (!awaiting.length && !ivRows.length && !admitRows.length) {
        emptyRow(host, 'No unit tools alerts');
        return;
    }

    awaiting.forEach((row) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-item is-awaiting-md';
        btn.setAttribute('role', 'listitem');
        btn.dataset.railKind = 'awaiting-md';
        btn.innerHTML = `
          <span class="rail-item__title">${row.title}</span>
          <span class="rail-item__meta">${row.meta}</span>
        `;
        btn.addEventListener('click', () => onPatientJump(row.patientId, `Opened patient for ${row.title}`));
        host.appendChild(btn);
    });

    ivRows.forEach((row) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-item is-iv';
        btn.setAttribute('role', 'listitem');
        btn.dataset.railKind = 'iv-attention';
        btn.innerHTML = `
          <span class="rail-item__title">${row.title}</span>
          <span class="rail-item__meta">${row.meta}</span>
        `;
        btn.addEventListener('click', () => onPatientJump(row.patientId, `Opened patient for IV: ${row.meta}`));
        host.appendChild(btn);
    });

    admitRows.forEach((row) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-item is-admit';
        btn.setAttribute('role', 'listitem');
        btn.dataset.railKind = 'admit-glance';
        btn.innerHTML = `
          <span class="rail-item__title">${row.title}</span>
          <span class="rail-item__meta">${row.meta}</span>
        `;
        btn.addEventListener('click', () => {
            if (row.patientId) onPatientJump(row.patientId, `Opened admitting patient`);
            else {
                patientsApi?.showGlobalPanel?.({
                    logMessage: 'Opened Global — open admit pending'
                });
            }
        });
        host.appendChild(btn);
    });
}

function renderDelegate() {
    const host = delegateHost();
    if (!host) return;
    host.replaceChildren();

    const label = document.querySelector('#delegate-rail-label');
    const sectionLabel = gameState.getStateSlice('delegation')?.sectionLabel
        || GameConfig.delegation?.sectionLabel
        || 'Delegate';
    if (label) label.textContent = sectionLabel;

    const rows = listDelegateRailRows();
    if (!rows.length) {
        emptyRow(host, 'No assist staff this assignment');
        return;
    }

    const team = modeConfig('team');
    const solo = modeConfig('solo');
    const legend = document.createElement('p');
    legend.className = 'delegate-legend';
    legend.textContent = `${team?.shortLabel || 'Team · ½ time'} · ${solo?.shortLabel || 'CNA does this · instant'}`;
    host.appendChild(legend);

    rows.forEach((row) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `rail-item is-delegate ${row.available ? 'is-available' : 'is-away'}${row.selected ? ' is-selected' : ''}`;
        el.setAttribute('role', 'listitem');
        el.dataset.railKind = 'delegate';
        el.dataset.aideId = row.id;
        el.setAttribute('aria-pressed', row.selected ? 'true' : 'false');
        el.innerHTML = `
          <span class="rail-item__title">${row.title}</span>
          <span class="rail-item__meta">${row.meta}${row.selected ? ' · selected — click a highlighted task' : row.available ? ' · click to select' : ''}</span>
        `;
        el.title = row.available
            ? (row.selected ? 'Click again to deselect' : 'Select to highlight tasks they can do')
            : 'Not available now';
        el.addEventListener('click', () => {
            if (!row.available) {
                selectAide(row.id);
                return;
            }
            selectAide(row.id);
        });
        host.appendChild(el);
    });
}

function renderAll() {
    renderOrders();
    renderTools();
    renderDelegate();
}

export function initRightMenu(deps = {}) {
    patientsApi = deps.patients || null;
    renderAll();
    gameState.subscribe('tasks', renderAll);
    gameState.subscribe('currentTime', renderAll);
    gameState.subscribe('patients', renderTools);
    gameState.subscribe('admitHold', renderTools);
    gameState.subscribe('activeHourHhmm', renderOrders);
    gameState.subscribe('activePatientId', renderOrders);
    gameState.subscribe('delegation', renderDelegate);
}

const RightMenuModule = {
    init: initRightMenu,
    renderOrders,
    renderTools,
    renderDelegate,
    listOrderChecks,
    listInjectedOrders
};

export default RightMenuModule;
