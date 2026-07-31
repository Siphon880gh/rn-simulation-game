/**
 * Delegate / assist staff (E13).
 * ICU: one CCT, available half of each clock hour (first or second :30).
 * Floor: up to 2 CNAs — each gets a distinct ⅓ of the shift (staggered, not overlapping).
 * Modes:
 *   team  — work with them (turns) → half slot time
 *   solo  — they do it for you → instant complete
 * Select an aide to highlight eligible tasks; invalid clicks get a soft hint.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import SlotSystem from './slot-system.js';

let hintTimer = null;

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function minutesToHhmm(totalMinutes) {
    const day = ((totalMinutes % 1440) + 1440) % 1440;
    return Math.floor(day / 60) * 100 + (day % 60);
}

function addMinutesToHhmm(hhmm, minutes) {
    return minutesToHhmm(hhmmToMinutes(hhmm) + Number(minutes));
}

function formatHHMM(hhmm) {
    if (hhmm == null || hhmm === '') return '—';
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function roomCode(patient) {
    const raw = String(patient?.room || '');
    const match = raw.match(/(\d{2,4}(?:-[A-Za-z])?)/);
    if (match) return match[1];
    return raw.replace(/^Room\s*/i, '').trim() || patient?.id || '—';
}

function pickName(names, used, random) {
    const pool = Array.isArray(names) ? names.filter((n) => !used.has(n)) : [];
    const list = pool.length ? pool : (names || ['Alex']);
    return list[Math.floor(random() * list.length)] || 'Alex';
}

function shuffleInPlace(arr, random) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function resolveDepartment(pack) {
    const raw = String(pack?.department || pack?.scene?.theme || '').toLowerCase();
    if (raw === 'icu') return 'icu';
    if (raw === 'tele' || raw === 'telemetry') return 'tele';
    return 'medsurg';
}

function shiftBounds() {
    const pack = gameState.getStateSlice('scenarioPack');
    const start = Number(pack?.shiftStart ?? GameConfig.timer.defaultShiftStart);
    const hours = Number(pack?.shiftDurationHours);
    const mins = Number.isFinite(hours) && hours > 0
        ? hours * 60
        : Number(GameConfig.timer.defaultShiftDuration) || 720;
    return { shiftStart: start, shiftMins: mins };
}

function buildHourHalfPlan(shiftStart, shiftMins, random) {
    /** @type {Record<string, 'first'|'second'>} */
    const plan = {};
    for (let elapsed = 0; elapsed < shiftMins; elapsed += 60) {
        const hourStart = addMinutesToHhmm(shiftStart, elapsed);
        plan[String(hourStart)] = random() < 0.5 ? 'first' : 'second';
    }
    return plan;
}

function splitPatientsEvenly(patientIds, aideCount) {
    const ids = [...patientIds];
    const buckets = Array.from({ length: aideCount }, () => []);
    ids.forEach((id, i) => {
        buckets[i % aideCount].push(id);
    });
    return buckets;
}

/** Assign each aide a distinct third of the shift (non-overlapping). */
export function assignStaggeredThirds(aideCount, shiftStart, shiftMins, random) {
    const thirdMins = Math.max(60, Math.floor(shiftMins / 3));
    const order = shuffleInPlace([0, 1, 2], random);
    return Array.from({ length: aideCount }, (_, i) => {
        const thirdIndex = order[i % 3];
        const startOffset = thirdIndex * thirdMins;
        return {
            thirdIndex,
            availableFrom: addMinutesToHhmm(shiftStart, startOffset),
            availableUntil: addMinutesToHhmm(shiftStart, startOffset + thirdMins)
        };
    });
}

function isWithinWindow(now, from, until) {
    if (from == null || until == null) return false;
    const n = hhmmToMinutes(now);
    const a = hhmmToMinutes(from);
    const b = hhmmToMinutes(until);
    if (a === b) return false;
    if (a < b) return n >= a && n < b;
    return n >= a || n < b;
}

function isCctAvailableNow(now, hourHalfPlan) {
    const mins = hhmmToMinutes(now);
    const hourStartMins = Math.floor(mins / 60) * 60;
    const hourStart = minutesToHhmm(hourStartMins);
    const half = hourHalfPlan[String(hourStart)] || hourHalfPlan[hourStart];
    const intoHour = mins % 60;
    if (half === 'first') return intoHour < 30;
    return intoHour >= 30;
}

function cctWindowMeta(now, hourHalfPlan) {
    const mins = hhmmToMinutes(now);
    const hourStartMins = Math.floor(mins / 60) * 60;
    const hourStart = minutesToHhmm(hourStartMins);
    const half = hourHalfPlan[String(hourStart)] || 'first';
    const free = half === 'first' ? ':00–:30' : ':30–:00';
    const busy = half === 'first' ? ':30–:00' : ':00–:30';
    const available = isCctAvailableNow(now, hourHalfPlan);
    return {
        available,
        meta: available ? `Free ${free} this hour` : `Busy ${busy} this hour`
    };
}

export function modeConfig(modeId) {
    return GameConfig.delegation?.modes?.[modeId] || null;
}

export function isTurnCareTask(task) {
    return task?.metadata?.careSchedule === 'turnQ2h'
        || /turn\s*\/\s*reposition/i.test(String(task?.name || ''));
}

/** Call light water/comfort — floor CNA solo (instant) on tele/med-surg. */
export function isCallLightTask(task) {
    if (!task) return false;
    if (task.metadata?.alertChannel === 'callLights') return true;
    if (task.metadata?.nurseAlert && /call\s*light/i.test(String(task.name || ''))) return true;
    return false;
}

/** @returns {'team'|'solo'|null} */
export function getDelegateMode(task) {
    if (!task) return null;
    if (isTurnCareTask(task)) return 'team';
    if (isCallLightTask(task)) return 'solo';
    const raw = String(task.metadata?.delegateMode || '').toLowerCase();
    if (raw === 'team' || raw === 'solo') return raw;
    return null;
}

export function buildDelegationState(opts = {}) {
    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const pack = opts.pack || gameState.getStateSlice('scenarioPack');
    const department = resolveDepartment(pack);
    const { shiftStart, shiftMins } = opts.shiftStart != null
        ? { shiftStart: opts.shiftStart, shiftMins: opts.shiftMins || 720 }
        : shiftBounds();
    const patients = opts.patientIds
        || [...(gameState.getStateSlice('patients')?.keys?.() || [])];
    const patientList = patients.length
        ? patients
        : [...(gameState.getStateSlice('patients')?.keys?.() || [])];

    const usedNames = new Set();
    const cfg = GameConfig.delegation || {};

    if (department === 'icu') {
        const icu = cfg.icu || {};
        const name = pickName(icu.names, usedNames, random);
        usedNames.add(name);
        const hourHalfPlan = buildHourHalfPlan(shiftStart, shiftMins, random);
        return {
            department,
            mode: 'icu-cct',
            sectionLabel: cfg.sectionLabel || 'Delegate',
            selectedAideId: null,
            aides: [{
                id: 'cct-1',
                role: 'cct',
                roleLabel: icu.roleLabel || 'CCT',
                name,
                patientIds: [...patientList],
                hourHalfPlan,
                thirdIndex: null,
                availableFrom: null,
                availableUntil: null
            }]
        };
    }

    const floor = cfg.floor || {};
    const maxCount = Number(floor.maxCount) || 2;
    const aideCount = Math.min(maxCount, Math.max(1, patientList.length >= 2 ? 2 : 1));
    const buckets = splitPatientsEvenly(patientList, aideCount);
    const windows = assignStaggeredThirds(aideCount, shiftStart, shiftMins, random);

    const aides = buckets.map((bucket, index) => {
        const name = pickName(floor.names, usedNames, random);
        usedNames.add(name);
        const win = windows[index];
        return {
            id: `cna-${index + 1}`,
            role: 'cna',
            roleLabel: floor.roleLabel || 'CNA',
            name,
            patientIds: bucket,
            hourHalfPlan: null,
            thirdIndex: win.thirdIndex,
            availableFrom: win.availableFrom,
            availableUntil: win.availableUntil
        };
    });

    return {
        department,
        mode: 'floor-cna',
        sectionLabel: cfg.sectionLabel || 'Delegate',
        selectedAideId: null,
        aides
    };
}

export function isAideAvailable(aide, now = gameState.getStateSlice('currentTime')) {
    if (!aide || now == null) return false;
    if (aide.role === 'cct' && aide.hourHalfPlan) {
        return isCctAvailableNow(now, aide.hourHalfPlan);
    }
    return isWithinWindow(now, aide.availableFrom, aide.availableUntil);
}

export function aideCoversPatient(aide, patientId) {
    if (!aide || !patientId) return false;
    return (aide.patientIds || []).includes(patientId);
}

export function getAideById(aideId) {
    const delegation = gameState.getStateSlice('delegation');
    return delegation?.aides?.find((a) => a.id === aideId) || null;
}

export function getSelectedAide() {
    const delegation = gameState.getStateSlice('delegation');
    if (!delegation?.selectedAideId) return null;
    return getAideById(delegation.selectedAideId);
}

export function findAvailableAideForPatient(patientId, now = gameState.getStateSlice('currentTime')) {
    const delegation = gameState.getStateSlice('delegation');
    if (!delegation?.aides?.length || !patientId) return null;
    return delegation.aides.find(
        (aide) => aideCoversPatient(aide, patientId) && isAideAvailable(aide, now)
    ) || null;
}

export function formatAideLabel(aide, patientsMap) {
    if (!aide) return '';
    const role = aide.roleLabel || (aide.role === 'cct' ? 'CCT' : 'CNA');
    if (aide.role === 'cct') {
        return `${role} ${aide.name}`;
    }
    const patients = patientsMap || gameState.getStateSlice('patients');
    const rooms = (aide.patientIds || [])
        .map((id) => roomCode(patients?.get?.(id)))
        .filter(Boolean);
    const roomPart = rooms.length ? rooms.join('/') : '—';
    return `${role} ${aide.name} · ${roomPart}`;
}

/**
 * Can this aide perform this task right now?
 * @returns {{ ok: boolean, mode: 'team'|'solo'|null, reason?: string }}
 */
export function canAidePerformTask(aide, task, now = gameState.getStateSlice('currentTime')) {
    if (!aide || !task) return { ok: false, mode: null, reason: 'missing' };
    if (!isAideAvailable(aide, now)) {
        return { ok: false, mode: null, reason: 'aide-unavailable' };
    }
    if (!task.patientId || !aideCoversPatient(aide, task.patientId)) {
        return { ok: false, mode: getDelegateMode(task), reason: 'wrong-patient' };
    }
    const status = task.status || GameConfig.tasks.statuses.NOT_YET;
    if (status !== GameConfig.tasks.statuses.ACTIVE) {
        return { ok: false, mode: getDelegateMode(task), reason: 'not-active' };
    }
    if (SlotSystem.isOccupied(task.id)) {
        return { ok: false, mode: getDelegateMode(task), reason: 'in-progress' };
    }
    const mode = getDelegateMode(task);
    if (!mode) return { ok: false, mode: null, reason: 'not-delegable' };
    // Call lights: tele/med-surg CNA only (not ICU CCT)
    if (isCallLightTask(task) && aide.role !== 'cna') {
        return { ok: false, mode: null, reason: 'not-delegable' };
    }
    // Meds / IV / orders / etc. never go through CNA even if mis-tagged
    const kind = String(task.type || '').toLowerCase();
    if (['med', 'iv', 'orders', 'criticallab', 'bedprep', 'admission'].includes(kind)) {
        return { ok: false, mode: null, reason: 'wrong-type' };
    }
    return { ok: true, mode };
}

export function listEligibleTaskIdsForAide(aide, now = gameState.getStateSlice('currentTime')) {
    if (!aide || !isAideAvailable(aide, now)) return [];
    const tasks = gameState.getStateSlice('tasks');
    const out = [];
    tasks?.forEach((task) => {
        const check = canAidePerformTask(aide, task, now);
        if (check.ok) out.push({ taskId: task.id, mode: check.mode });
    });
    return out;
}

export function withTeamAssist(task, aide) {
    if (!task || !aide) return task;
    const factor = Number(GameConfig.delegation?.turnAssistFactor);
    const assistFactor = Number.isFinite(factor) && factor > 0 && factor < 1 ? factor : 0.5;
    const mode = modeConfig('team');
    return {
        ...task,
        metadata: {
            ...(task.metadata || {}),
            assistFactor,
            delegateMode: 'team',
            assistedBy: aide.id,
            assistedByLabel: formatAideLabel(aide),
            delegateModeLabel: mode?.shortLabel || 'Team · ½ time'
        }
    };
}

/** @deprecated use withTeamAssist */
export function withTurnAssist(task, aide) {
    return withTeamAssist(task, aide);
}

export function listDelegateRailRows(now = gameState.getStateSlice('currentTime')) {
    const delegation = gameState.getStateSlice('delegation');
    if (!delegation?.aides?.length) return [];
    const patients = gameState.getStateSlice('patients');
    const selectedId = delegation.selectedAideId || null;

    return delegation.aides.map((aide) => {
        const title = formatAideLabel(aide, patients);
        let available = false;
        let meta = '';
        if (aide.role === 'cct' && aide.hourHalfPlan) {
            const win = cctWindowMeta(now, aide.hourHalfPlan);
            available = win.available;
            meta = win.meta;
        } else {
            available = isAideAvailable(aide, now);
            const fromLabel = formatHHMM(aide.availableFrom);
            const untilLabel = formatHHMM(aide.availableUntil);
            if (available) {
                meta = `Available ${fromLabel}–${untilLabel}`;
            } else if (now != null && aide.availableFrom != null
                && hhmmToMinutes(now) < hhmmToMinutes(aide.availableFrom)) {
                meta = `Starts ${fromLabel} · until ${untilLabel}`;
            } else {
                meta = `Off floor · was ${fromLabel}–${untilLabel}`;
            }
        }
        const rooms = (aide.patientIds || [])
            .map((id) => roomCode(patients?.get?.(id)))
            .filter(Boolean);
        return {
            id: aide.id,
            aide,
            title,
            meta: rooms.length && aide.role === 'cna'
                ? `${meta} · rooms ${rooms.join(', ')}`
                : meta,
            available,
            selected: selectedId === aide.id,
            patientIds: aide.patientIds || []
        };
    });
}

export function selectAide(aideId) {
    const delegation = gameState.getStateSlice('delegation');
    if (!delegation) return;
    const next = aideId && delegation.selectedAideId === aideId ? null : (aideId || null);
    if (next) {
        const aide = getAideById(next);
        if (!aide || !isAideAvailable(aide)) {
            showDelegateHint(`${formatAideLabel(aide) || 'Aide'} is not available right now`);
            gameState.dispatch('SET_DELEGATE_SELECTION', { aideId: null });
            clearDelegateHighlights();
            return;
        }
    }
    gameState.dispatch('SET_DELEGATE_SELECTION', { aideId: next });
    paintDelegateHighlights();
}

export function clearDelegateSelection() {
    if (!gameState.getStateSlice('delegation')?.selectedAideId) {
        clearDelegateHighlights();
        return;
    }
    gameState.dispatch('SET_DELEGATE_SELECTION', { aideId: null });
    clearDelegateHighlights();
}

export function clearDelegateHighlights() {
    document.querySelectorAll('.delegate-eligible-team, .delegate-eligible-solo, .delegate-mode-badge')
        .forEach((el) => {
            el.classList.remove('delegate-eligible-team', 'delegate-eligible-solo');
            el.querySelectorAll('.delegate-mode-badge').forEach((b) => b.remove());
        });
    document.querySelectorAll('.rail-item.is-delegate.is-selected')
        .forEach((el) => el.classList.remove('is-selected'));
}

export function paintDelegateHighlights() {
    clearDelegateHighlights();
    const aide = getSelectedAide();
    if (!aide) return;
    const now = gameState.getStateSlice('currentTime');
    if (!isAideAvailable(aide, now)) {
        clearDelegateSelection();
        return;
    }

    const railEl = document.querySelector(`[data-rail-kind="delegate"][data-aide-id="${aide.id}"]`);
    railEl?.classList.add('is-selected');

    listEligibleTaskIdsForAide(aide, now).forEach(({ taskId, mode }) => {
        const el = document.getElementById(taskId);
        if (!el) return;
        const modeCls = mode === 'solo' ? 'delegate-eligible-solo' : 'delegate-eligible-team';
        el.classList.add(modeCls);
        if (!el.querySelector('.delegate-mode-badge')) {
            const badge = document.createElement('span');
            badge.className = `delegate-mode-badge delegate-mode-badge--${mode}`;
            const cfg = modeConfig(mode);
            const role = aide.roleLabel || (aide.role === 'cct' ? 'CCT' : 'CNA');
            badge.textContent = mode === 'solo'
                ? `${role} does this · instant`
                : (cfg?.shortLabel || 'Team · ½ time');
            el.appendChild(badge);
        }
    });
}

function ensureHintEl() {
    const sel = GameConfig.selectors.delegateHint || '#shell-delegate-hint';
    let el = document.querySelector(sel);
    if (el) return el;
    el = document.createElement('div');
    el.id = 'shell-delegate-hint';
    el.className = 'shell-delegate-hint';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    el.innerHTML = `<p class="shell-delegate-hint__text"></p>`;
    document.body.appendChild(el);
    return el;
}

export function showDelegateHint(message) {
    const el = ensureHintEl();
    const text = el.querySelector('.shell-delegate-hint__text');
    if (text) text.textContent = message || '';
    el.hidden = false;
    el.classList.add('is-visible');
    if (hintTimer) clearTimeout(hintTimer);
    const ms = Number(GameConfig.delegation?.hintMs) || 2800;
    hintTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        hintTimer = setTimeout(() => {
            el.hidden = true;
            hintTimer = null;
        }, 280);
    }, ms);
}

export function initDelegation() {
    const patients = gameState.getStateSlice('patients');
    if (!patients?.size) {
        gameState.dispatch('SET_DELEGATION', { delegation: null });
        return null;
    }
    const delegation = buildDelegationState();
    gameState.dispatch('SET_DELEGATION', { delegation });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: delegation.mode === 'icu-cct'
            ? `Delegate: ${formatAideLabel(delegation.aides[0])} on unit (half-hour windows)`
            : `Delegate: ${delegation.aides.map((a) => `${formatAideLabel(a)} (${formatHHMM(a.availableFrom)}–${formatHHMM(a.availableUntil)})`).join('; ')}`,
        timeLabel: 'boot'
    });

    gameState.subscribe('currentTime', () => {
        const selected = getSelectedAide();
        if (selected && !isAideAvailable(selected)) {
            showDelegateHint(`${formatAideLabel(selected)} went off the floor`);
            clearDelegateSelection();
            return;
        }
        if (selected) paintDelegateHighlights();
    });
    gameState.subscribe('tasks', () => {
        if (getSelectedAide()) paintDelegateHighlights();
    });
    gameState.subscribe('delegation', () => {
        paintDelegateHighlights();
    });

    return delegation;
}

const DelegationModule = {
    init: initDelegation,
    buildDelegationState,
    assignStaggeredThirds,
    listDelegateRailRows,
    findAvailableAideForPatient,
    isAideAvailable,
    isTurnCareTask,
    getDelegateMode,
    canAidePerformTask,
    listEligibleTaskIdsForAide,
    withTeamAssist,
    withTurnAssist,
    formatAideLabel,
    selectAide,
    clearDelegateSelection,
    paintDelegateHighlights,
    showDelegateHint,
    getSelectedAide,
    modeConfig
};

export default DelegationModule;
