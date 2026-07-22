/**
 * Delegate / assist staff (E13).
 * ICU: one CCT, available half of each clock hour (first or second :30).
 * Floor (tele/medsurg): up to 2 CNAs, each available ~1/3 of shift, patients split evenly.
 * Assist on turn/reposition tasks halves slot duration.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

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

function isWithinWindow(now, from, until) {
    if (from == null || until == null) return false;
    const n = hhmmToMinutes(now);
    const a = hhmmToMinutes(from);
    const b = hhmmToMinutes(until);
    if (a === b) return false;
    if (a < b) return n >= a && n < b;
    // wraps midnight
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
            aides: [{
                id: 'cct-1',
                role: 'cct',
                roleLabel: icu.roleLabel || 'CCT',
                name,
                patientIds: [...patientList],
                hourHalfPlan,
                availableFrom: null,
                availableUntil: null
            }]
        };
    }

    const floor = cfg.floor || {};
    const maxCount = Number(floor.maxCount) || 2;
    const aideCount = Math.min(maxCount, Math.max(1, patientList.length >= 2 ? 2 : 1));
    const buckets = splitPatientsEvenly(patientList, aideCount);
    const fraction = Number(floor.availabilityFraction);
    const availMins = Math.max(60, Math.floor(shiftMins * (Number.isFinite(fraction) ? fraction : 1 / 3)));
    const maxStart = Math.max(0, shiftMins - availMins);

    const aides = buckets.map((bucket, index) => {
        const name = pickName(floor.names, usedNames, random);
        usedNames.add(name);
        const startOffset = maxStart > 0 ? Math.floor(random() * (maxStart + 1)) : 0;
        return {
            id: `cna-${index + 1}`,
            role: 'cna',
            roleLabel: floor.roleLabel || 'CNA',
            name,
            patientIds: bucket,
            hourHalfPlan: null,
            availableFrom: addMinutesToHhmm(shiftStart, startOffset),
            availableUntil: addMinutesToHhmm(shiftStart, startOffset + availMins)
        };
    });

    return {
        department,
        mode: 'floor-cna',
        sectionLabel: cfg.sectionLabel || 'Delegate',
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

export function listDelegateRailRows(now = gameState.getStateSlice('currentTime')) {
    const delegation = gameState.getStateSlice('delegation');
    if (!delegation?.aides?.length) return [];
    const patients = gameState.getStateSlice('patients');

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
            patientIds: aide.patientIds || []
        };
    });
}

export function isTurnCareTask(task) {
    return task?.metadata?.careSchedule === 'turnQ2h'
        || /turn\s*\/\s*reposition/i.test(String(task?.name || ''));
}

export function withTurnAssist(task, aide) {
    if (!task || !aide) return task;
    const factor = Number(GameConfig.delegation?.turnAssistFactor);
    const assistFactor = Number.isFinite(factor) && factor > 0 && factor < 1 ? factor : 0.5;
    return {
        ...task,
        metadata: {
            ...(task.metadata || {}),
            assistFactor,
            assistedBy: aide.id,
            assistedByLabel: formatAideLabel(aide)
        }
    };
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
            : `Delegate: ${delegation.aides.map((a) => formatAideLabel(a)).join('; ')}`,
        timeLabel: 'boot'
    });
    return delegation;
}

const DelegationModule = {
    init: initDelegation,
    buildDelegationState,
    listDelegateRailRows,
    findAvailableAideForPatient,
    isAideAvailable,
    isTurnCareTask,
    withTurnAssist,
    formatAideLabel
};

export default DelegationModule;
