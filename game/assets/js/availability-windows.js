/**
 * Availability windows (E3.M3) — scheduled→expire gating + early/late/end phases.
 * Relative +N expire is resolved at task create; DOM should carry absolute data-expire.
 */
import { GameConfig } from './game-config.js';

export function hhmmToMinutes(hhmm) {
    const n = Number(hhmm);
    if (!Number.isFinite(n)) return null;
    return Math.floor(n / 100) * 60 + (n % 100);
}

export function minutesBetween(startHhmm, endHhmm) {
    const a = hhmmToMinutes(startHhmm);
    const b = hhmmToMinutes(endHhmm);
    if (a == null || b == null) return null;
    let diff = b - a;
    if (diff < 0) diff += 24 * 60;
    return diff;
}

/**
 * @returns {'before'|'early'|'late'|'end'|'after'|'open'}
 * open = active with no expire (treat as single open window)
 */
export function getWindowPhase(task, currentTime) {
    if (task == null || currentTime == null) return 'before';
    const t = Number(currentTime);
    const start = Number(task.scheduled);
    if (!Number.isFinite(start)) return 'before';
    if (t < start) return 'before';

    const expire = task.expire != null && task.expire !== '' ? Number(task.expire) : null;
    if (expire == null || !Number.isFinite(expire)) {
        return 'open';
    }
    if (t > expire) return 'after';

    const span = minutesBetween(start, expire) || 1;
    const into = minutesBetween(start, t) || 0;
    const ratio = into / span;
    if (ratio < 1 / 3) return 'early';
    if (ratio < 2 / 3) return 'late';
    return 'end';
}

/** Perform allowed while status is active and current time is inside [scheduled, expire]. */
export function isPerformAllowed(task, currentTime) {
    if (!task) return false;
    const status = task.status;
    if (status === GameConfig.tasks.statuses.COMPLETED) return false;
    if (status === GameConfig.tasks.statuses.OVERDUE) return false;
    if (status === GameConfig.tasks.statuses.NOT_YET) return false;

    const t = Number(currentTime);
    const start = Number(task.scheduled);
    if (!Number.isFinite(t) || !Number.isFinite(start)) return false;
    if (t < start) return false;

    if (task.expire != null && task.expire !== '') {
        const expire = Number(task.expire);
        if (Number.isFinite(expire) && t > expire) return false;
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
    if (task.expire != null && task.expire !== '') {
        element.setAttribute('data-expire', String(task.expire).padStart(4, '0'));
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
