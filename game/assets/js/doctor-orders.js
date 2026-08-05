/**
 * Hourly check-doctor-orders (E4.M3) + E11 carryover / sudden procedures.
 * Spawn at each game-hour start; expire at next hour; complete injects pack + carryover + ≤1 procedure.
 * Also: dice-gated trivial order for a random census patient + clickable toast.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { mountTaskDom } from './dynamic-tasks.js';
import { minutesFromShiftAnchor } from './availability-windows.js';
import { showShellToast } from './critical-labs.js';

const spawnedHourStarts = new Set();
const injectionHandled = new Set();
/** @type {Map<string, object>} id → order spec awaiting next check complete */
const carryoverById = new Map();
/** Specs already queued from overdue so we do not spam while still overdue */
const overdueCarryNoted = new Set();
/** Pack hours whose undelivered injections were queued on missed check */
const missedCheckQueuedHours = new Set();
let procedureInjected = false;
let shiftStart = GameConfig.timer.defaultShiftStart;
let shiftDuration = GameConfig.timer.defaultShiftDuration;

/** @type {{ showPatientPanel?: Function }|null} */
let patientsApi = null;

/** @type {HTMLElement|null} */
let trivialOddsPopoverEl = null;
/** @type {HTMLElement|null} */
let trivialOddsAnchorEl = null;

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

/** Add minutes to HHMM with 24h wrap (for display / task schedule keys). */
export function addMinutesToHhmm(hhmm, minutes) {
    const total = hhmmToMinutes(hhmm) + Number(minutes);
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    return Math.floor(normalized / 60) * 100 + (normalized % 60);
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

export function buildHourMarks(start, durationMinutes) {
    const count = Math.max(1, Math.ceil(Number(durationMinutes || 60) / 60));
    return Array.from({ length: count }, (_, i) => addMinutesToHhmm(start, i * 60));
}

/**
 * Resolve the active shift hour using minutes-from-shift-start
 * (handles night shifts that wrap past midnight).
 */
export function getHourWindow(currentTime, start = shiftStart, durationMinutes = shiftDuration) {
    const marks = buildHourMarks(start, durationMinutes);
    const maxHours = marks.length;
    const startM = hhmmToMinutes(start);
    let curM = hhmmToMinutes(currentTime);
    if (curM < startM) curM += 24 * 60;
    const into = Math.max(0, curM - startM);
    const hourIndex = Math.min(maxHours - 1, Math.floor(into / 60));
    const hourStart = marks[hourIndex];
    const hourEnd = hourIndex + 1 < maxHours
        ? marks[hourIndex + 1]
        : addMinutesToHhmm(hourStart, 60);
    return { hourIndex, hourStart, hourEnd, marks };
}

/**
 * Next midnight HHMM for NPO expire. Before midnight in shift wrap → 0000;
 * if already past midnight this wrap → shift end (no second midnight in-shift).
 */
export function nextMidnightExpire(nowHhmm, anchor = shiftStart, durationMinutes = shiftDuration) {
    const mid = 0;
    const nowOff = minutesFromShiftAnchor(nowHhmm, anchor);
    const midOff = minutesFromShiftAnchor(mid, anchor);
    if (nowOff == null || midOff == null) return mid;
    if (nowOff < midOff) return mid;
    return addMinutesToHhmm(anchor, Number(durationMinutes) || 720);
}

function procCfg() {
    return GameConfig.doctorOrders?.procedures || {};
}

function trivialCfg() {
    return GameConfig.doctorOrders?.trivialOrders || {};
}

export function getTrivialOrderChance() {
    const chance = Number(trivialCfg().chancePerCheck);
    if (!Number.isFinite(chance)) return 0.4;
    return Math.max(0, Math.min(1, chance));
}

export function getTrivialOrderOdds() {
    const generatePct = Math.round(getTrivialOrderChance() * 100);
    return [
        { id: 'generate', label: 'New trivial order', percent: generatePct },
        { id: 'none', label: 'No new trivial order', percent: 100 - generatePct }
    ];
}

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function patientLabel(patientId) {
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    if (!patient) return patientId || 'patient';
    const room = patient.room ? ` · ${patient.room}` : '';
    return `${patient.name || patientId}${room}`;
}

function listCensusPatientIds() {
    const patients = gameState.getStateSlice('patients');
    if (!patients?.size) return [];
    return [...patients.keys()];
}

function focusTaskAtPatient(task) {
    if (!task) return;
    if (task.patientId && typeof patientsApi?.showPatientPanel === 'function') {
        patientsApi.showPatientPanel(task.patientId, {
            logMessage: `Opened from new order: ${task.name}`
        });
    } else if (task.patientId) {
        gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: task.patientId });
    }
    if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
        const el = document.getElementById(task.id);
        if (!el) return;
        el.classList.add('rail-focus-pulse');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        window.setTimeout(() => el.classList.remove('rail-focus-pulse'), 1200);
    });
}

function showTrivialOrderToast(task) {
    const cfg = trivialCfg();
    const who = patientLabel(task.patientId);
    showShellToast({
        title: cfg.toastTitle || 'New doctor order',
        detail: `${task.name} · ${who}`,
        iconClass: 'fas fa-clipboard-list',
        hideAfterMs: cfg.toastMs ?? 6500,
        clickAriaLabel: `New order: ${task.name} for ${who}. Click to open task.`,
        onClick: () => focusTaskAtPatient(task)
    });
}

export function renderTrivialOrderOddsHtml() {
    const rows = getTrivialOrderOdds().map((row) => `
      <li class="orders-trivial-odds__row">
        <span class="orders-trivial-odds__label">${escapeHtml(row.label)}</span>
        <span class="orders-trivial-odds__pct">${row.percent}%</span>
      </li>
    `).join('');
    return `
      <div class="orders-trivial-odds" role="dialog" aria-label="Orders check trivial-order odds">
        <p class="orders-trivial-odds__title">Orders check — new task odds</p>
        <ul class="orders-trivial-odds__list">${rows}</ul>
      </div>
    `;
}

function ensureTrivialOddsPopover() {
    if (trivialOddsPopoverEl) return trivialOddsPopoverEl;
    if (typeof document === 'undefined') return null;
    trivialOddsPopoverEl = document.createElement('div');
    trivialOddsPopoverEl.className = 'orders-trivial-odds-popover';
    trivialOddsPopoverEl.hidden = true;
    trivialOddsPopoverEl.innerHTML = renderTrivialOrderOddsHtml();
    document.body.appendChild(trivialOddsPopoverEl);
    return trivialOddsPopoverEl;
}

function positionTrivialOddsPopover(anchor) {
    if (!trivialOddsPopoverEl || !anchor?.getBoundingClientRect) return;
    const rect = anchor.getBoundingClientRect();
    const pad = 8;
    const width = trivialOddsPopoverEl.offsetWidth || 240;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    let top = rect.bottom + 6;
    const height = trivialOddsPopoverEl.offsetHeight || 120;
    if (top + height > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - height - 6);
    }
    trivialOddsPopoverEl.style.left = `${left}px`;
    trivialOddsPopoverEl.style.top = `${top}px`;
}

export function showTrivialOrderOddsPopover(anchor) {
    if (typeof document === 'undefined') return;
    const pop = ensureTrivialOddsPopover();
    if (!pop) return;
    pop.innerHTML = renderTrivialOrderOddsHtml();
    pop.hidden = false;
    trivialOddsAnchorEl = anchor || null;
    positionTrivialOddsPopover(anchor);
}

export function hideTrivialOrderOddsPopover() {
    if (!trivialOddsPopoverEl) return;
    trivialOddsPopoverEl.hidden = true;
    trivialOddsAnchorEl = null;
}

function toggleTrivialOrderOddsPopover(anchor) {
    const pop = ensureTrivialOddsPopover();
    if (!pop) return;
    if (!pop.hidden && trivialOddsAnchorEl === anchor) {
        hideTrivialOrderOddsPopover();
        return;
    }
    showTrivialOrderOddsPopover(anchor);
}

function isOrdersCheckRow(el) {
    if (!el?.getAttribute) return false;
    if (el.getAttribute('data-task-type') !== 'orders') return false;
    if (el.getAttribute('data-orders-kind') === 'doctor-orders-check') return true;
    return Boolean(el.closest?.('#doctor-orders-list'));
}

/** Attach dice control inline after the task name (same placement as Accucheck). */
export function decorateOrdersTrivialDice(root = document) {
    if (typeof document === 'undefined' || !root?.querySelectorAll) return;
    if (trivialCfg().enabled === false) return;
    // Include root itself — querySelectorAll only matches descendants
    const nodes = [];
    if (isOrdersCheckRow(root)) nodes.push(root);
    root.querySelectorAll('[data-task-type="orders"]').forEach((el) => {
        if (isOrdersCheckRow(el) && !nodes.includes(el)) nodes.push(el);
    });
    nodes.forEach((el) => {
        if (el.querySelector('[data-orders-trivial-dice]')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'orders-trivial-dice';
        btn.setAttribute('data-orders-trivial-dice', '1');
        btn.setAttribute('title', 'New trivial order odds');
        btn.setAttribute('aria-label', 'Show new trivial order odds');
        btn.innerHTML = '<i class="fas fa-dice" aria-hidden="true"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            toggleTrivialOrderOddsPopover(btn);
        });

        const nameEl = el.querySelector('.font-medium');
        const timeEl = el.querySelector('.ml-auto');
        if (nameEl?.parentElement === el) {
            // Flat row: icon · name · dice · window (Accucheck layout)
            el.insertBefore(btn, timeEl || nameEl.nextSibling);
        } else if (nameEl) {
            nameEl.insertAdjacentElement('afterend', btn);
        } else if (timeEl) {
            el.insertBefore(btn, timeEl);
        } else {
            el.appendChild(btn);
        }
    });
}

let trivialDiceUiWired = false;
export function initOrdersTrivialDiceUi() {
    if (typeof document === 'undefined' || trivialDiceUiWired) return;
    trivialDiceUiWired = true;
    decorateOrdersTrivialDice(document);
    document.addEventListener('click', (e) => {
        if (e.target.closest?.('[data-orders-trivial-dice]')) return;
        if (e.target.closest?.('.orders-trivial-odds-popover')) return;
        hideTrivialOrderOddsPopover();
    });
    window.addEventListener('resize', () => {
        if (trivialOddsAnchorEl) positionTrivialOddsPopover(trivialOddsAnchorEl);
    });
}

function ensureOrdersHost() {
    let host = document.querySelector('#doctor-orders-list');
    if (host) {
        const wrap = host.closest('.doctor-orders');
        if (wrap && !wrap.classList.contains('space-y-2')) {
            wrap.classList.add('space-y-2', 'mb-4');
        }
        const heading = wrap?.querySelector(':scope > h4');
        if (heading) {
            heading.classList.add('flex', 'items-center', 'gap-2', 'task-section-heading');
            heading.classList.remove('mb-2');
        }
        if (host.classList.contains('space-y-2')) {
            host.classList.remove('space-y-2');
            host.classList.add('space-y-3');
        }
        return host;
    }
    const panel = document.querySelector(GameConfig.selectors.globalPanel)
        || document.querySelector('#global-panel');
    if (!panel) return null;
    const wrap = document.createElement('div');
    wrap.className = 'doctor-orders space-y-2 mb-4 mt-4 text-left';
    wrap.innerHTML = `
      <h4 class="font-semibold text-gray-800 flex items-center gap-2 task-section-heading">Doctor orders checks</h4>
      <ul id="doctor-orders-list" class="space-y-3"></ul>
    `;
    panel.querySelector('.bg-white, .rounded-lg')?.appendChild(wrap) || panel.appendChild(wrap);
    return wrap.querySelector('#doctor-orders-list');
}

function renderOrdersTask(task) {
    const host = ensureOrdersHost();
    if (!host) return;
    let li = document.getElementById(task.id);
    if (!li || !host.contains(li)) {
        li = document.createElement('li');
        li.id = task.id;
        host.appendChild(li);
    }
    const expireLabel = task.expire != null ? formatHHMM(task.expire) : '—';
    li.setAttribute('data-task-type', 'orders');
    li.setAttribute('data-orders-kind', 'doctor-orders-check');
    li.setAttribute('data-status', task.status);
    li.setAttribute('data-scheduled', String(task.scheduled).padStart(4, '0'));
    li.setAttribute('data-expire', task.expire != null ? String(task.expire).padStart(4, '0') : '');
    li.setAttribute('data-duration-mins', String(task.duration || 5));
    li.className = `bg-white p-3 rounded-lg shadow flex items-center task-status-${task.status} border border-gray-100`;
    // Flat row like Accucheck: icon · name · (dice) · window — dice stays clickable outside Perform
    li.innerHTML = `
      <i class="fas fa-clipboard-list text-indigo-500 text-xl mr-3"></i>
      <span class="font-medium text-gray-900">${task.name}</span>
      <span class="ml-auto text-xs text-gray-500 whitespace-nowrap">Window ${formatHHMM(task.scheduled)} – ${expireLabel}</span>
    `;
    decorateOrdersTrivialDice(li);
    taskSystem.syncTaskWindowDomAttrs?.(li, task);
    taskSystem.refreshFalloutUi?.(host.closest('.doctor-orders') || host.parentElement || host);
}

function spawnHourlyCheck(hourStart, hourEnd, hourIndex) {
    if (spawnedHourStarts.has(hourStart)) return null;
    spawnedHourStarts.add(hourStart);

    const task = taskSystem.createTask({
        id: `orders-check-${hourStart}`,
        type: 'orders',
        taskClass: GameConfig.tasks.classes.ROUTINE,
        name: `Check doctor orders (H${hourIndex + 1})`,
        scheduled: hourStart,
        expire: hourEnd,
        durationMins: GameConfig.doctorOrders?.durationMins ?? 5,
        patientId: null,
        metadata: {
            kind: 'doctor-orders-check',
            hourIndex,
            hourStart,
            hourEnd
        }
    });

    taskSystem.processTasks(gameState.getStateSlice('currentTime') || hourStart);
    const live = gameState.getStateSlice('tasks').get(task.id) || task;
    renderOrdersTask(live);

    gameState.dispatch('SET_ACTIVE_HOUR', {
        hourIndex,
        hourHhmm: hourStart
    });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Doctor orders check available for ${formatHHMM(hourStart)} hour`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime') || hourStart)
    });

    return live;
}

export function injectionsForHour(hourStart) {
    const pack = gameState.getStateSlice('scenarioPack');
    const map = pack?.orderInjections || {};
    const n = Number(hourStart);
    const candidates = [
        hourStart,
        String(hourStart),
        Number.isFinite(n) ? n : null,
        Number.isFinite(n) ? String(n) : null,
        Number.isFinite(n) ? String(n).padStart(4, '0') : null
    ];
    for (const key of candidates) {
        if (key == null) continue;
        if (Array.isArray(map[key])) return map[key];
    }
    if (Array.isArray(map.default)) return map.default;
    return [];
}

function cloneSpec(spec) {
    return {
        ...spec,
        metadata: { ...(spec.metadata || {}) }
    };
}

function queueCarryoverSpec(spec) {
    if (!spec?.id) return;
    if (carryoverById.has(spec.id)) return;
    carryoverById.set(spec.id, cloneSpec(spec));
}

function taskToCarryoverSpec(task) {
    return {
        id: task.id,
        type: task.type,
        name: task.name,
        patientId: task.patientId,
        taskClass: task.taskClass,
        durationMins: task.duration,
        expire: GameConfig.doctorOrders?.defaultInjectExpire || '+60',
        metadata: { ...(task.metadata || {}) }
    };
}

function queueMissedCheckInjections(hourStart) {
    if (missedCheckQueuedHours.has(hourStart)) return;
    missedCheckQueuedHours.add(hourStart);
    injectionsForHour(hourStart).forEach((spec) => queueCarryoverSpec(spec));
}

function noteOverdueInjectedOrder(task) {
    if (!task?.metadata?.fromOrdersCheck) return;
    if (task.metadata?.kind === 'doctor-orders-check') return;
    if (task.status !== GameConfig.tasks.statuses.OVERDUE) return;
    if (overdueCarryNoted.has(task.id)) return;
    overdueCarryNoted.add(task.id);
    queueCarryoverSpec(taskToCarryoverSpec(task));
}

function noteOverdueOrdersCheck(task) {
    if (task?.metadata?.kind !== 'doctor-orders-check') return;
    if (task.status !== GameConfig.tasks.statuses.OVERDUE) return;
    if (injectionHandled.has(task.id)) return;
    const hourStart = task.metadata.hourStart ?? task.scheduled;
    queueMissedCheckInjections(hourStart);
}

/**
 * Create or refresh an order task; mount on patient panel when scoped.
 */
export function injectOrderSpec(spec, opts = {}) {
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? shiftStart;
    const hourStart = opts.hourStart ?? now;
    const id = spec.id || `order-inj-${hourStart}-${Math.random().toString(36).slice(2, 7)}`;
    const scheduled = spec.scheduled != null ? spec.scheduled : now;
    const expire = spec.expire != null ? spec.expire : (GameConfig.doctorOrders?.defaultInjectExpire || '+60');
    const existing = gameState.getStateSlice('tasks')?.get(id);

    const taskData = {
        id,
        type: spec.type || 'med',
        taskClass: spec.taskClass || GameConfig.tasks.classes.ROUTINE,
        name: spec.name || 'New doctor order',
        scheduled,
        expire,
        durationMins: spec.durationMins ?? 10,
        patientId: spec.patientId || null,
        status: opts.status
            || (Number(scheduled) === Number(now) || !existing
                ? GameConfig.tasks.statuses.NOT_YET
                : GameConfig.tasks.statuses.ACTIVE),
        metadata: {
            ...(spec.metadata || {}),
            fromOrdersCheck: true,
            hourStart,
            carriedOver: Boolean(opts.carriedOver || existing)
        }
    };

    // Stable id overwrite when re-presenting overdue work
    const task = taskSystem.createTask(taskData);
    taskSystem.processTasks(now);
    const live = gameState.getStateSlice('tasks').get(task.id) || task;
    if (live.patientId) mountTaskDom(live);
    overdueCarryNoted.delete(id);
    carryoverById.delete(id);
    return live;
}

function minutesLeftInShift(nowHhmm) {
    const into = minutesFromShiftAnchor(nowHhmm, shiftStart);
    if (into == null) return 0;
    return Math.max(0, Number(shiftDuration) - into);
}

function diagnosisMatches(diagnosis, match) {
    if (!diagnosis || !match) return false;
    const d = String(diagnosis);
    if (match instanceof RegExp) return match.test(d);
    return d.toLowerCase().includes(String(match).toLowerCase());
}

/** Eligible census patients with a catalog procedure match. */
export function listProcedureEligiblePatients(patients = gameState.getStateSlice('patients')) {
    const catalog = procCfg().byDiagnosis || [];
    const out = [];
    patients?.forEach((patient) => {
        const diagnosis = patient.diagnosis || '';
        for (const entry of catalog) {
            if (!diagnosisMatches(diagnosis, entry.match)) continue;
            out.push({ patient, entry });
            break;
        }
    });
    return out;
}

function pickTiming(entry, now, random) {
    const timings = Array.isArray(entry.timings) && entry.timings.length
        ? entry.timings
        : [entry.defaultTiming || 'sameDay'];
    let timing = timings.includes(entry.defaultTiming)
        ? entry.defaultTiming
        : timings[0];
    // Weighted coin among listed timings
    if (timings.length > 1) {
        timing = timings[Math.floor(random() * timings.length)] || timing;
    }

    const minLead = Number(procCfg().minLeadMinsSameDay) || 120;
    if (timing === 'sameDay' && minutesLeftInShift(now) < minLead) {
        timing = 'tomorrow';
    }
    return timing;
}

function scheduleSameDayProcedure(now, random) {
    const minLead = Number(procCfg().minLeadMinsSameDay) || 120;
    const left = minutesLeftInShift(now);
    if (left < minLead) return null;
    const slack = left - minLead;
    const extra = slack > 0 ? Math.floor(random() * Math.min(slack, 180)) : 0;
    const lead = minLead + extra;
    return addMinutesToHhmm(now, lead);
}

/**
 * Maybe inject one condition-matched sudden procedure (max per game).
 * @returns {object|null} summary of spawned tasks
 */
export function maybeInjectSuddenProcedure(opts = {}) {
    const cfg = procCfg();
    if (cfg.enabled === false) return null;
    if (procedureInjected) return null;
    const max = Number(cfg.maxPerGame) || 1;
    if (max < 1) return null;

    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const force = Boolean(opts.force);
    const chance = Number(cfg.chancePerCheck);
    if (!force && !(Number.isFinite(chance) && random() < chance)) return null;

    const eligible = listProcedureEligiblePatients();
    if (!eligible.length) return null;

    const pick = eligible[Math.floor(random() * eligible.length)];
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? shiftStart;
    const timing = opts.timing || pickTiming(pick.entry, now, random);
    const patientId = pick.patient.id;
    const procName = pick.entry.name || 'Procedure';
    const procedureOrderId = `proc-${patientId}-${now}`;

    procedureInjected = true;

    const consent = injectOrderSpec({
        id: `${procedureOrderId}-consent`,
        type: 'procedure',
        name: `Obtain consent — ${procName}`,
        patientId,
        taskClass: GameConfig.tasks.classes.URGENT || 'urgent',
        durationMins: cfg.consentDurationMins ?? 10,
        scheduled: now,
        expire: '+60',
        metadata: {
            kind: 'procedure-consent',
            orderKind: 'procedure',
            procedureTiming: timing,
            procedureOrderId,
            procedureName: procName
        }
    }, { now, hourStart: opts.hourStart ?? now });

    const spawned = { timing, patientId, procedureOrderId, consentId: consent.id, taskIds: [consent.id] };

    if (timing === 'sameDay') {
        const procAt = opts.procedureScheduled
            ?? scheduleSameDayProcedure(now, random)
            ?? addMinutesToHhmm(now, cfg.minLeadMinsSameDay || 120);
        const procTask = injectOrderSpec({
            id: `${procedureOrderId}-perform`,
            type: 'procedure',
            name: `Prepare / accompany — ${procName}`,
            patientId,
            taskClass: 'urgent',
            durationMins: cfg.procedureDurationMins ?? 20,
            scheduled: procAt,
            expire: `+${cfg.procedureExpireMins ?? 60}`,
            metadata: {
                kind: 'procedure-perform',
                orderKind: 'procedure',
                procedureTiming: 'sameDay',
                procedureOrderId,
                procedureName: procName
            }
        }, { now, hourStart: opts.hourStart ?? now, status: GameConfig.tasks.statuses.NOT_YET });
        spawned.procedureScheduled = procAt;
        spawned.procedureTaskId = procTask.id;
        spawned.taskIds.push(procTask.id);
    } else {
        const midnight = nextMidnightExpire(now, shiftStart, shiftDuration);
        const npoInform = injectOrderSpec({
            id: `${procedureOrderId}-npo-inform`,
            type: 'procedure',
            name: 'Inform patient NPO after midnight',
            patientId,
            taskClass: GameConfig.tasks.classes.ROUTINE,
            durationMins: cfg.npoTaskDurationMins ?? 5,
            scheduled: now,
            expire: midnight,
            metadata: {
                kind: 'procedure-npo-inform',
                orderKind: 'procedure',
                procedureTiming: 'tomorrow',
                procedureOrderId,
                procedureName: procName,
                expireAtMidnight: true
            }
        }, { now, hourStart: opts.hourStart ?? now });
        const npoBoard = injectOrderSpec({
            id: `${procedureOrderId}-npo-board`,
            type: 'procedure',
            name: 'Write whiteboard NPO after midnight and inform CNA',
            patientId,
            taskClass: GameConfig.tasks.classes.ROUTINE,
            durationMins: cfg.npoTaskDurationMins ?? 5,
            scheduled: now,
            expire: midnight,
            metadata: {
                kind: 'procedure-npo-board',
                orderKind: 'procedure',
                procedureTiming: 'tomorrow',
                procedureOrderId,
                procedureName: procName,
                expireAtMidnight: true
            }
        }, { now, hourStart: opts.hourStart ?? now });
        spawned.npoExpire = midnight;
        spawned.npoInformId = npoInform.id;
        spawned.npoBoardId = npoBoard.id;
        spawned.taskIds.push(npoInform.id, npoBoard.id);
    }

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `New procedure order (${timing}): ${procName} — ${patientId}`,
        timeLabel: formatHHMM(now)
    });

    return spawned;
}

/**
 * Dice roll: maybe inject one random trivial order for a random census patient.
 * @returns {object|null} live task when generated
 */
export function maybeInjectTrivialOrder(opts = {}) {
    const cfg = trivialCfg();
    if (cfg.enabled === false) return null;
    const catalog = Array.isArray(cfg.catalog) ? cfg.catalog : [];
    if (!catalog.length) return null;

    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const force = Boolean(opts.force);
    const chance = getTrivialOrderChance();
    if (!force && !(chance > 0 && random() < chance)) return null;

    const patientIds = listCensusPatientIds();
    if (!patientIds.length) return null;

    const patientId = opts.patientId && patientIds.includes(opts.patientId)
        ? opts.patientId
        : patientIds[Math.floor(random() * patientIds.length)];
    const template = opts.template
        || catalog[Math.floor(random() * catalog.length)];
    if (!template?.name) return null;

    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? shiftStart;
    const hourStart = opts.hourStart ?? now;
    const id = opts.id || `order-trivial-${patientId}-${hourStart}-${Math.random().toString(36).slice(2, 6)}`;

    const live = injectOrderSpec({
        id,
        type: template.type || 'assessment',
        name: template.name,
        patientId,
        taskClass: template.taskClass || GameConfig.tasks.classes.ROUTINE,
        durationMins: template.durationMins ?? cfg.durationMins ?? 5,
        scheduled: now,
        expire: template.expire || cfg.expire || '+60',
        metadata: {
            kind: 'trivial-order',
            orderKind: 'trivial',
            fromTrivialDice: true
        }
    }, { now, hourStart });

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `New trivial order: ${live.name} — ${patientId}`,
        timeLabel: formatHHMM(now)
    });

    if (opts.showToast !== false) {
        showTrivialOrderToast(live);
    }

    return live;
}

export function handleOrdersCheckComplete(task, opts = {}) {
    if (!task || task.metadata?.kind !== 'doctor-orders-check') return;
    if (injectionHandled.has(task.id)) return;
    injectionHandled.add(task.id);

    const hourStart = task.metadata.hourStart ?? task.scheduled;
    const now = opts.now ?? gameState.getStateSlice('currentTime') ?? hourStart;

    const carrySpecs = Array.from(carryoverById.values());
    const packSpecs = injectionsForHour(hourStart).filter((s) => !carryoverById.has(s.id));
    let injected = 0;

    carrySpecs.forEach((spec) => {
        injectOrderSpec(spec, { now, hourStart, carriedOver: true });
        injected += 1;
    });

    packSpecs.forEach((spec, index) => {
        const withId = {
            ...spec,
            id: spec.id || `order-inj-${hourStart}-${index}`
        };
        injectOrderSpec(withId, { now, hourStart });
        injected += 1;
    });

    const trivial = maybeInjectTrivialOrder({
        now,
        hourStart,
        random: opts.random,
        force: opts.forceTrivial,
        patientId: opts.trivialPatientId,
        template: opts.trivialTemplate,
        showToast: opts.showToast
    });
    if (trivial) injected += 1;

    const proc = maybeInjectSuddenProcedure({
        now,
        hourStart,
        random: opts.random,
        force: opts.forceProcedure,
        timing: opts.procedureTiming
    });
    if (proc) injected += proc.taskIds?.length || 0;

    if (!injected) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Orders check complete — no new orders this hour`,
            timeLabel: formatHHMM(now)
        });
    } else {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Orders check complete — ${injected} order task(s) (incl. carryover/procedure/trivial)`,
            timeLabel: formatHHMM(now)
        });
    }
    renderOrdersTask(gameState.getStateSlice('tasks').get(task.id) || task);
}

export function processDoctorOrdersTime(currentTime) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER) return;

    const { hourIndex, hourStart, hourEnd } = getHourWindow(currentTime);
    spawnHourlyCheck(hourStart, hourEnd, hourIndex);

    const tasks = gameState.getStateSlice('tasks');
    tasks?.forEach((task) => {
        if (task.metadata?.kind === 'doctor-orders-check') {
            renderOrdersTask(task);
            noteOverdueOrdersCheck(task);
        }
        noteOverdueInjectedOrder(task);
    });
}

export function getCarryoverSpecs() {
    return Array.from(carryoverById.values());
}

export function isProcedureInjected() {
    return procedureInjected;
}

export function resetDoctorOrders() {
    spawnedHourStarts.clear();
    injectionHandled.clear();
    carryoverById.clear();
    overdueCarryNoted.clear();
    missedCheckQueuedHours.clear();
    procedureInjected = false;
}

const DoctorOrdersModule = {
    buildHourMarks,
    getHourWindow,
    processDoctorOrdersTime,
    handleOrdersCheckComplete,
    resetDoctorOrders,
    injectOrderSpec,
    injectionsForHour,
    maybeInjectSuddenProcedure,
    maybeInjectTrivialOrder,
    getTrivialOrderChance,
    getTrivialOrderOdds,
    decorateOrdersTrivialDice,
    initOrdersTrivialDiceUi,
    listProcedureEligiblePatients,
    nextMidnightExpire,
    addMinutesToHhmm,
    getCarryoverSpecs,
    isProcedureInjected,
    init(config = {}) {
        resetDoctorOrders();
        shiftStart = config.shiftStarts ?? GameConfig.timer.defaultShiftStart;
        shiftDuration = config.shiftDuration ?? GameConfig.timer.defaultShiftDuration;
        patientsApi = config.patients || patientsApi;
        initOrdersTrivialDiceUi();

        gameState.subscribe('currentTime', (t) => processDoctorOrdersTime(t));
        gameState.subscribe('tasks', (tasks) => {
            if (!tasks) return;
            tasks.forEach((task) => {
                if (
                    task.metadata?.kind === 'doctor-orders-check'
                    && task.status === GameConfig.tasks.statuses.COMPLETED
                ) {
                    handleOrdersCheckComplete(task);
                }
                noteOverdueOrdersCheck(task);
                noteOverdueInjectedOrder(task);
            });
        });
    }
};

export default DoctorOrdersModule;
