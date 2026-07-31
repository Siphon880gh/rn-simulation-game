/**
 * Availability windows (E3.M3) — scheduled→expire gating + early/late/end phases.
 * Relative +N expire is resolved at task create; DOM should carry absolute data-expire.
 * Night-shift wrap: compare times relative to shift anchor (default 1900).
 * Meds: due = scheduled; perform window starts medEarlyMins before due.
 */
import { GameConfig } from './game-config.js';

let shiftAnchorHhmm = GameConfig.timer.defaultShiftStart;

export function setShiftAnchor(hhmm) {
    const n = Number(hhmm);
    if (Number.isFinite(n)) {
        shiftAnchorHhmm = n;
    }
}

export function getShiftAnchor() {
    return shiftAnchorHhmm;
}

export function hhmmToMinutes(hhmm) {
    const n = Number(hhmm);
    if (!Number.isFinite(n)) return null;
    return Math.floor(n / 100) * 60 + (n % 100);
}

/** Add minutes to HHMM (wraps 24h). */
export function addMinutesToHhmm(hhmm, minutes) {
    const base = hhmmToMinutes(hhmm);
    if (base == null || !Number.isFinite(Number(minutes))) return null;
    let total = base + Number(minutes);
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h * 100 + m;
}

/** Minutes since shift anchor (0…1439+), wrapping past midnight. */
export function minutesFromShiftAnchor(hhmm, anchor = shiftAnchorHhmm) {
    const startM = hhmmToMinutes(anchor);
    let curM = hhmmToMinutes(hhmm);
    if (startM == null || curM == null) return null;
    if (curM < startM) curM += 24 * 60;
    return curM - startM;
}

export function isAtOrAfterInShift(currentHhmm, targetHhmm, anchor = shiftAnchorHhmm) {
    const a = minutesFromShiftAnchor(currentHhmm, anchor);
    const b = minutesFromShiftAnchor(targetHhmm, anchor);
    if (a == null || b == null) return false;
    return a >= b;
}

export function isAfterInShift(currentHhmm, targetHhmm, anchor = shiftAnchorHhmm) {
    const a = minutesFromShiftAnchor(currentHhmm, anchor);
    const b = minutesFromShiftAnchor(targetHhmm, anchor);
    if (a == null || b == null) return false;
    return a > b;
}

export function minutesBetween(startHhmm, endHhmm) {
    const a = hhmmToMinutes(startHhmm);
    const b = hhmmToMinutes(endHhmm);
    if (a == null || b == null) return null;
    let diff = b - a;
    if (diff < 0) diff += 24 * 60;
    return diff;
}

function isMedTask(task) {
    return String(task?.type || '').toLowerCase() === 'med';
}

/**
 * Inclusive perform window for a task.
 * Meds open medEarlyMins before due (`scheduled`); expire unchanged (author late edge).
 * Early edge is clamped to the shift anchor so night-shift windows stay coherent
 * (due 1930 → open at 1900, not 1830 which would wrap past midnight).
 * @returns {{ start: number, expire: number|null, due: number }}
 */
export function getTaskWindowBounds(task) {
    const due = Number(task?.scheduled);
    if (!Number.isFinite(due)) {
        return { start: null, expire: null, due: null };
    }
    let start = due;
    if (isMedTask(task)) {
        const early = Number(GameConfig.tasks.availability?.medEarlyMins);
        const earlyMins = Number.isFinite(early) ? early : 60;
        const dueRel = minutesFromShiftAnchor(due);
        if (dueRel != null) {
            const startRel = Math.max(0, dueRel - earlyMins);
            const clamped = addMinutesToHhmm(shiftAnchorHhmm, startRel);
            if (clamped != null) start = clamped;
        } else {
            const earlyStart = addMinutesToHhmm(due, -earlyMins);
            if (earlyStart != null) start = earlyStart;
        }
    }
    let expire = task?.expire != null && task.expire !== '' ? Number(task.expire) : null;
    if (!Number.isFinite(expire)) expire = null;
    if (expire == null && isMedTask(task)) {
        const late = Number(GameConfig.tasks.availability?.medLateMins);
        const lateMins = Number.isFinite(late) ? late : 60;
        expire = addMinutesToHhmm(due, lateMins);
    }
    return { start, expire, due };
}

/**
 * @returns {'before'|'early'|'late'|'end'|'after'|'open'}
 * open = active with no expire (treat as single open window)
 */
export function getWindowPhase(task, currentTime) {
    if (task == null || currentTime == null) return 'before';
    const { start, expire } = getTaskWindowBounds(task);
    const tRel = minutesFromShiftAnchor(currentTime);
    const startRel = minutesFromShiftAnchor(start);
    if (tRel == null || startRel == null) return 'before';
    if (tRel < startRel) return 'before';

    if (expire == null || !Number.isFinite(expire)) {
        return 'open';
    }
    const expireRel = minutesFromShiftAnchor(expire);
    if (expireRel == null) return 'open';
    if (tRel > expireRel) return 'after';

    const span = Math.max(1, expireRel - startRel);
    const into = Math.max(0, tRel - startRel);
    const ratio = into / span;
    if (ratio < 1 / 3) return 'early';
    if (ratio < 2 / 3) return 'late';
    return 'end';
}

/** Perform allowed while status is active and current time is inside the task window. */
export function isPerformAllowed(task, currentTime) {
    if (!task) return false;
    const status = task.status;
    if (status === GameConfig.tasks.statuses.COMPLETED) return false;
    if (status === GameConfig.tasks.statuses.OVERDUE) return false;
    if (status === GameConfig.tasks.statuses.NOT_YET) return false;

    const { start, expire } = getTaskWindowBounds(task);
    if (start == null || !isAtOrAfterInShift(currentTime, start)) return false;

    if (expire != null && expire !== '') {
        if (isAfterInShift(currentTime, expire)) return false;
    }
    return status === GameConfig.tasks.statuses.ACTIVE;
}

/** CSS rule fragment for #reveal-scheduled-tasks (absolute expire preferred). */
export function buildRevealRule(scheduled, expire, expireRaw = null) {
    const sched = String(scheduled).padStart(4, '0');
    const parts = [`li[data-scheduled="${sched}"]`];
    if (expire != null && expire !== '') {
        parts.push(`li[data-scheduled="${sched}"][data-expire="${expire}"]`);
    }
    if (expireRaw != null && String(expireRaw).startsWith('+')) {
        parts.push(`li[data-scheduled="${sched}"][data-expire="${expireRaw}"]`);
    }
    return `
${parts.join(',\n')} {
  opacity: 1 !important;
}
`;
}

export function syncTaskWindowDomAttrs(element, task) {
    if (!element || !task) return;
    if (task.scheduled != null) {
        element.setAttribute('data-scheduled', String(task.scheduled).padStart(4, '0'));
    }
    const { start, expire } = getTaskWindowBounds(task);
    if (start != null) {
        element.setAttribute('data-available-from', String(start).padStart(4, '0'));
    }
    if (expire != null && expire !== '') {
        element.setAttribute('data-expire', String(expire).padStart(4, '0'));
    } else if (task.metadata?.expireRaw) {
        element.setAttribute('data-expire', task.metadata.expireRaw);
    }
}

export function applyWindowPhaseClass(element, phase) {
    if (!element) return;
    element.setAttribute('data-window-phase', phase);
    element.classList.remove(
        'window-phase-before',
        'window-phase-early',
        'window-phase-late',
        'window-phase-end',
        'window-phase-after',
        'window-phase-open'
    );
    element.classList.add(`window-phase-${phase}`);
}
