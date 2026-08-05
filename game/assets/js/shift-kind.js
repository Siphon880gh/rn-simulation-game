/**
 * Day / night shift kind + HHMM remapping when the player picks the opposite
 * of what a scenario / patient pack was authored for.
 *
 * Convention: night packs use ~1900 start; day packs use ~0700.
 * Opposite-kind runs add ±12h to absolute military times (relative +N expires stay).
 */
import { addMinutesToHhmm } from './availability-windows.js';

export const SHIFT_KINDS = Object.freeze(['day', 'night']);

/** Canonical shift starts (military HHMM). */
export const SHIFT_STARTS = Object.freeze({
    day: 700,
    night: 1900
});

/** Night ↔ day on a 12-hour assignment. */
export const SHIFT_FLIP_OFFSET_MINS = 12 * 60;

/**
 * Infer day vs night from a shift-start HHMM.
 * Morning starts (05:00–11:59) → day; everything else → night.
 */
export function resolveShiftKindFromStart(hhmm) {
    const n = Number(hhmm);
    if (!Number.isFinite(n)) return 'night';
    const hours = Math.floor(n / 100);
    return hours >= 5 && hours < 12 ? 'day' : 'night';
}

/** Normalize authored pack field; fall back to shiftStart, then night. */
export function resolvePackShiftKind(pack) {
    const raw = String(pack?.shiftKind || '').toLowerCase();
    if (raw === 'day' || raw === 'night') return raw;
    if (pack?.shiftStart != null) return resolveShiftKindFromStart(pack.shiftStart);
    return 'night';
}

/**
 * Player request from URL (`shift=day|night`) or `shift-starts`, else pack kind.
 * @param {URLSearchParams|Record<string,string>|null} params
 * @param {object} pack
 * @param {{ shift?: string, shiftStarts?: string }} [urlKeys]
 */
export function resolveRequestedShiftKind(params, pack, urlKeys = {}) {
    const shiftKey = urlKeys.shift || 'shift';
    const startsKey = urlKeys.shiftStarts || 'shift-starts';
    const get = (key) => {
        if (!params) return null;
        if (typeof params.get === 'function') return params.get(key);
        return params[key] ?? null;
    };
    const explicit = String(get(shiftKey) || '').toLowerCase();
    if (explicit === 'day' || explicit === 'night') return explicit;
    const starts = get(startsKey);
    if (starts != null && String(starts).trim() !== '') {
        const clean = String(starts).replaceAll(':', '');
        return resolveShiftKindFromStart(parseInt(clean, 10));
    }
    return resolvePackShiftKind(pack);
}

export function shiftOffsetMins(fromKind, toKind) {
    const from = fromKind === 'day' ? 'day' : 'night';
    const to = toKind === 'day' ? 'day' : 'night';
    if (from === to) return 0;
    return from === 'night' ? SHIFT_FLIP_OFFSET_MINS : -SHIFT_FLIP_OFFSET_MINS;
}

function padHhmm(n) {
    return String(n).padStart(4, '0');
}

function sameHhmm(a, b) {
    if (a == null || b == null) return false;
    const na = Number(String(a).trim());
    const nb = Number(String(b).trim());
    return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

/** Update leaf labels that still show the pre-convert HHMM (e.g. `<span>2200</span>`). */
function syncVisibleHhmmLabels(root, fromRaw, toRaw) {
    if (!root || fromRaw == null || toRaw == null) return;
    const toPad = padHhmm(Number(toRaw));
    root.querySelectorAll('span, time, em, strong, b, small').forEach((node) => {
        if (node.children.length) return;
        const t = (node.textContent || '').trim();
        if (!/^\d{3,4}$/.test(t)) return;
        if (sameHhmm(t, fromRaw)) node.textContent = toPad;
    });
}

/**
 * Shift an absolute HHMM. Relative expire strings (`+60`, `-15`) pass through.
 * Preserves number vs zero-padded string input shape when possible.
 */
export function convertHhmmValue(value, offsetMins) {
    if (value == null || offsetMins === 0) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return value;
        if (/^[+-]\d+$/.test(trimmed)) return value;
        if (!/^\d{3,4}$/.test(trimmed)) return value;
        const next = Number(addMinutesToHhmm(Number(trimmed), offsetMins));
        return trimmed.length >= 4 ? padHhmm(next) : String(next);
    }
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return Number(addMinutesToHhmm(n, offsetMins));
}

/** Remap absolute data-scheduled / data-expire attrs and matching visible HHMM labels. */
export function convertPatientHtmlTimes(html, offsetMins) {
    if (!html || !offsetMins) return html;
    const raw = String(html);

    if (typeof DOMParser !== 'undefined') {
        const doc = new DOMParser().parseFromString(raw, 'text/html');
        const root = doc.body;
        root.querySelectorAll('[data-scheduled], [data-expire]').forEach((el) => {
            const sched = el.getAttribute('data-scheduled');
            if (sched && /^\d{3,4}$/.test(sched)) {
                const next = convertHhmmValue(sched, offsetMins);
                el.setAttribute('data-scheduled', String(next));
                syncVisibleHhmmLabels(el, sched, next);
            }
            const exp = el.getAttribute('data-expire');
            if (exp && /^\d{3,4}$/.test(exp)) {
                el.setAttribute('data-expire', String(convertHhmmValue(exp, offsetMins)));
            }
        });
        return root.innerHTML;
    }

    // Node / no-DOM fallback: attrs + bare HHMM label spans
    const schedMap = new Map();
    let out = raw.replace(/\b(data-scheduled)="(\d{3,4})"/gi, (_, attr, sched) => {
        const next = String(convertHhmmValue(sched, offsetMins));
        const toPad = padHhmm(Number(next));
        schedMap.set(padHhmm(Number(sched)), toPad);
        schedMap.set(String(Number(sched)), toPad);
        return `${attr}="${next}"`;
    });
    out = out.replace(/\b(data-expire)="(\d{3,4})"/gi, (_, attr, exp) => (
        `${attr}="${convertHhmmValue(exp, offsetMins)}"`
    ));
    out = out.replace(/>(\d{3,4})<\/span>/g, (full, t) => {
        const mapped = schedMap.get(padHhmm(Number(t))) || schedMap.get(String(Number(t)));
        return mapped ? `>${mapped}</span>` : full;
    });
    return out;
}

function convertInjectTask(spec, offsetMins) {
    if (!spec || typeof spec !== 'object') return spec;
    const out = { ...spec };
    if (out.scheduled != null) out.scheduled = convertHhmmValue(out.scheduled, offsetMins);
    if (out.expire != null) out.expire = convertHhmmValue(out.expire, offsetMins);
    return out;
}

function convertOrderInjections(map, offsetMins) {
    if (!map || typeof map !== 'object') return map || {};
    const out = {};
    Object.keys(map).forEach((key) => {
        // Doctor-orders hour marks are numeric HHMM (700, 1900) — normalize padded keys
        const nextKey = /^\d{3,4}$/.test(String(key))
            ? String(Number(convertHhmmValue(Number(key), offsetMins)))
            : key;
        const bucket = map[key];
        out[nextKey] = Array.isArray(bucket)
            ? bucket.map((row) => convertInjectTask(row, offsetMins))
            : bucket;
    });
    return out;
}

function convertEvents(events, offsetMins) {
    if (!Array.isArray(events)) return [];
    return events.map((ev) => {
        if (!ev || typeof ev !== 'object') return ev;
        const out = { ...ev };
        if (out.at != null) out.at = convertHhmmValue(out.at, offsetMins);
        if (Array.isArray(out.injectTasks)) {
            out.injectTasks = out.injectTasks.map((t) => convertInjectTask(t, offsetMins));
        }
        return out;
    });
}

/** Deep-ish remap of pack absolute times (events, order injections, shiftStart). */
export function convertScenarioPackTimes(pack, offsetMins) {
    if (!pack || !offsetMins) return pack;
    return {
        ...pack,
        shiftStart: pack.shiftStart != null
            ? convertHhmmValue(pack.shiftStart, offsetMins)
            : pack.shiftStart,
        events: convertEvents(pack.events, offsetMins),
        orderInjections: convertOrderInjections(pack.orderInjections, offsetMins)
    };
}

/**
 * Align pack clock + absolute times to the requested day/night kind.
 * Leaves relative (+N) expires alone. Idempotent when kinds already match.
 */
export function applyRequestedShiftToPack(pack, requestedKind) {
    if (!pack) return pack;
    const authored = resolvePackShiftKind(pack);
    const requested = requestedKind === 'day' ? 'day' : 'night';
    const offset = shiftOffsetMins(authored, requested);
    const base = {
        ...pack,
        shiftKind: authored,
        authoredShiftKind: authored,
        requestedShiftKind: requested,
        shiftOffsetMins: offset,
        shiftConverted: offset !== 0
    };
    if (offset === 0) {
        return {
            ...base,
            shiftStart: pack.shiftStart != null ? pack.shiftStart : SHIFT_STARTS[authored]
        };
    }
    const converted = convertScenarioPackTimes(base, offset);
    return {
        ...converted,
        shiftStart: SHIFT_STARTS[requested],
        shiftKind: authored,
        authoredShiftKind: authored,
        requestedShiftKind: requested,
        shiftOffsetMins: offset,
        shiftConverted: true
    };
}

const ShiftKindModule = {
    SHIFT_KINDS,
    SHIFT_STARTS,
    SHIFT_FLIP_OFFSET_MINS,
    resolveShiftKindFromStart,
    resolvePackShiftKind,
    resolveRequestedShiftKind,
    shiftOffsetMins,
    convertHhmmValue,
    convertPatientHtmlTimes,
    convertScenarioPackTimes,
    applyRequestedShiftToPack
};

export default ShiftKindModule;
