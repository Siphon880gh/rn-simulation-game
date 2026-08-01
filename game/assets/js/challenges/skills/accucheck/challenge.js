/**
 * Accucheck / glucometer + sliding-scale insulin / finger-stick challenge.
 * Dice on the task shows outcome odds; Perform rolls a band (incl. critical lab).
 * Cheat fills the correct units; player still submits.
 */
import { GameConfig } from '../../../game-config.js';
import gameState from '../../../game-state.js';
import taskSystem from '../../../task-system.js';
import { showShellToast, spawnCriticalLabNow } from '../../../critical-labs.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

export const INSULIN_TYPES = ['regular', 'aspart', 'lispro'];

/** Practice sliding scale covering finger-stick bands (non-critical). */
export const SLIDING_SCALE = [
    { min: 40, max: 69, units: 0, note: 'Hold — hypoglycemia protocol' },
    { min: 70, max: 149, units: 0, note: null },
    { min: 150, max: 179, units: 2, note: null },
    { min: 180, max: 250, units: 4, note: null },
    { min: 251, max: 399, units: 6, note: null }
];

export function isAccucheckTask(task) {
    const challenge = String(task?.metadata?.challenge || '').toLowerCase();
    if (challenge === 'accucheck') return true;
    const name = String(task?.name || '').toLowerCase();
    return /accucheck|glucometer|blood glucose|\bachs\b|finger\s*stick/.test(name);
}

function fingerCfg() {
    return GameConfig.accucheckFingerStick || {};
}

function outcomeCatalog() {
    const rows = fingerCfg().outcomes;
    return Array.isArray(rows) && rows.length ? rows : [];
}

export function getFingerStickOdds() {
    const rows = outcomeCatalog();
    const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0) || 1;
    return rows.map((row) => {
        const weight = Number(row.weight) || 0;
        const percent = Math.round((weight / total) * 1000) / 10;
        return {
            id: row.id,
            label: row.label || row.id,
            weight,
            percent,
            criticalLab: Boolean(row.criticalLab)
        };
    });
}

function pickWeightedOutcome(random) {
    const rows = outcomeCatalog();
    if (!rows.length) {
        return {
            id: 'normal',
            label: 'Normal blood glucose',
            minBg: 70,
            maxBg: 140,
            toastTitle: 'Accucheck normal'
        };
    }
    const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0) || 1;
    let roll = (typeof random === 'function' ? random() : Math.random()) * total;
    for (const row of rows) {
        roll -= Number(row.weight) || 0;
        if (roll < 0) return row;
    }
    return rows[rows.length - 1];
}

function rollInRange(minBg, maxBg, random) {
    const lo = Number(minBg);
    const hi = Number(maxBg);
    const a = Number.isFinite(lo) ? lo : 70;
    const b = Number.isFinite(hi) ? Math.max(a, hi) : a;
    const roll = typeof random === 'function' ? random() : Math.random();
    return a + Math.floor(roll * (b - a + 1));
}

/**
 * Weighted finger-stick roll: band + blood sugar (+ critical-lab flag).
 * @param {{ random?: () => number }} [opts]
 */
export function rollFingerStickOutcome(opts = {}) {
    const random = opts.random || Math.random;
    const band = pickWeightedOutcome(random);
    const bloodSugar = rollInRange(band.minBg, band.maxBg, random);
    const criticalLab = Boolean(band.criticalLab);
    const toastTitle = band.toastTitle
        || (criticalLab ? 'Accucheck — critical high' : 'Accucheck result');
    return {
        id: band.id,
        label: band.label || band.id,
        bloodSugar,
        criticalLab,
        labId: band.labId || 'glucose-critical',
        toastTitle,
        toastDetail: `${bloodSugar} mg/dL`
    };
}

export function unitsForBloodSugar(bs) {
    const value = Number(bs);
    for (const row of SLIDING_SCALE) {
        if (value >= row.min && value <= row.max) {
            return row.units;
        }
    }
    return null;
}

function pickInsulin(random) {
    const roll = typeof random === 'function' ? random() : Math.random();
    const idx = Math.min(INSULIN_TYPES.length - 1, Math.floor(roll * INSULIN_TYPES.length));
    return INSULIN_TYPES[idx];
}

function rollBloodSugar(random) {
    // Legacy uniform 60–200 when no finger-stick outcome is provided
    const roll = typeof random === 'function' ? random() : Math.random();
    return 60 + Math.floor(roll * 141);
}

/**
 * Apply a finger-stick roll: toast (non-critical) or spawn critical-lab Call MD.
 * Stores reading on the live task for the sliding-scale challenge.
 * @returns {{ outcome: object, criticalTask: object|null, skipSlidingScale: boolean }}
 */
export function applyFingerStickResult(task, opts = {}) {
    const outcome = opts.outcome || rollFingerStickOutcome(opts);
    const patientId = task?.patientId || null;
    const now = gameState.getStateSlice('currentTime');

    const stickMeta = {
        id: outcome.id,
        bloodSugar: outcome.bloodSugar,
        criticalLab: outcome.criticalLab,
        label: outcome.label
    };
    if (task) {
        task.metadata = {
            ...(task.metadata || {}),
            fingerStick: stickMeta,
            fingerStickBg: outcome.bloodSugar
        };
    }
    if (task?.id) {
        const live = gameState.getStateSlice('tasks')?.get(task.id);
        if (live) {
            live.metadata = {
                ...(live.metadata || {}),
                fingerStick: stickMeta,
                fingerStickBg: outcome.bloodSugar
            };
            taskSystem.taskRegistry?.set?.(task.id, live);
        }
    }

    let criticalTask = null;
    if (outcome.criticalLab) {
        criticalTask = spawnCriticalLabNow({
            labId: outcome.labId || 'glucose-critical',
            patientId,
            at: now,
            result: `Glucose ${outcome.bloodSugar} mg/dL (critical high — finger stick)`,
            id: `crit-glucose-${task?.id || 'fs'}-${Date.now()}`,
            focusPatient: true
        });
        showShellToast({
            title: outcome.toastTitle,
            detail: `${outcome.toastDetail} · Call MD task spawned`,
            iconClass: 'fas fa-vial',
            hideAfterMs: fingerCfg().toastMs
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Finger stick critical glucose ${outcome.bloodSugar} mg/dL (${patientId || 'patient'})`,
            timeLabel: String(now ?? '—')
        });
    } else {
        showShellToast({
            title: outcome.toastTitle,
            detail: outcome.toastDetail,
            iconClass: 'fas fa-tint',
            hideAfterMs: fingerCfg().toastMs
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Finger stick ${outcome.label}: ${outcome.bloodSugar} mg/dL (${patientId || 'patient'})`,
            timeLabel: String(now ?? '—')
        });
    }

    return {
        outcome,
        criticalTask,
        skipSlidingScale: Boolean(outcome.criticalLab)
    };
}

/**
 * @param {{ name?: string, metadata?: object }} task
 * @param {{ random?: () => number, bloodSugar?: number, insulin?: string }} [opts]
 */
export function buildAccucheckPrompt(task, opts = {}) {
    if (!isAccucheckTask(task)) return null;

    const fromMeta = task?.metadata?.fingerStickBg ?? task?.metadata?.fingerStick?.bloodSugar;
    const bloodSugar = opts.bloodSugar != null
        ? Number(opts.bloodSugar)
        : fromMeta != null
            ? Number(fromMeta)
            : rollBloodSugar(opts.random);
    const insulin = opts.insulin
        || pickInsulin(opts.random);
    const units = unitsForBloodSugar(bloodSugar);
    if (units == null) return null;

    const scaleRow = SLIDING_SCALE.find((r) => bloodSugar >= r.min && bloodSugar <= r.max);

    return {
        taskName: task?.name || 'Accucheck',
        bloodSugar,
        insulin,
        units,
        expected: String(units),
        scaleNote: scaleRow?.note || null,
        accepted: [String(units), `${units} units`, `${units} unit`].map((s) =>
            normalizeAccucheckAnswer(s)
        )
    };
}

export function normalizeAccucheckAnswer(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\bunits?\b/g, '')
        .replace(/\bu\b/g, '')
        .trim();
}

export function checkAccucheckAnswer(answer, prompt) {
    if (!prompt) return false;
    const got = normalizeAccucheckAnswer(answer);
    if (!got) return false;
    return prompt.accepted.includes(got) || got === normalizeAccucheckAnswer(prompt.expected);
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderScaleTable() {
    const rows = SLIDING_SCALE.map((row) => {
        const range = `${row.min}–${row.max}`;
        const units = row.units === 0
            ? (row.note ? `0 (${escapeHtml(row.note)})` : '0')
            : String(row.units);
        return `<tr><td class="border border-gray-200 px-2 py-1">${range}</td><td class="border border-gray-200 px-2 py-1">${units}</td></tr>`;
    }).join('');
    return `
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-200 px-2 py-1 text-left">BG (mg/dL)</th>
            <th class="border border-gray-200 px-2 py-1 text-left">Insulin units</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
}

export function renderAccucheckHtml(prompt) {
    const insulin = escapeHtml(prompt.insulin);
    const bs = escapeHtml(String(prompt.bloodSugar));
    const taskName = escapeHtml(prompt.taskName);
    return `
      <div class="challenge-gate accucheck-challenge space-y-3 text-left" data-challenge="accucheck">
        ${challengeMediaHtml('accucheck')}
        <p class="text-sm text-gray-900 font-semibold">
          Accucheck / sliding scale / finger stick
        </p>
        <p class="text-sm text-gray-600">
          ${GameConfig.challengeCopy?.pauseBanner
            || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}
        </p>
        <p class="text-sm text-gray-800">
          Task: <strong>${taskName}</strong>
        </p>
        <p class="text-sm text-gray-800">
          Finger-stick / glucometer: <strong id="accucheck-bs">${bs}</strong> mg/dL
        </p>
        <p class="text-sm text-gray-800">
          Ordered insulin: <strong id="accucheck-insulin">${insulin}</strong>
          (regular / aspart / lispro)
        </p>
        <div class="rounded border border-gray-200 overflow-hidden">
          ${renderScaleTable()}
        </div>
        <label class="block text-sm text-gray-700" for="accucheck-answer">
          Units of ${insulin} to give
        </label>
        <input id="accucheck-answer" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Enter units from sliding scale" />
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>
    `;
}

/** Fill the answer field with the correct units (does not submit). */
export function applyAccucheckCheat(prompt) {
    const input = document.querySelector('#accucheck-answer');
    if (!input || !prompt) return false;
    input.value = String(prompt.expected);
    input.focus();
    input.select();
    return true;
}

export function renderFingerStickOddsHtml() {
    const rows = getFingerStickOdds().map((row) => `
      <li class="finger-stick-odds__row${row.criticalLab ? ' finger-stick-odds__row--critical' : ''}">
        <span class="finger-stick-odds__label">${escapeHtml(row.label)}</span>
        <span class="finger-stick-odds__pct">${row.percent}%</span>
      </li>
    `).join('');
    return `
      <div class="finger-stick-odds" role="dialog" aria-label="Finger-stick outcome odds">
        <p class="finger-stick-odds__title">Finger-stick outcome odds</p>
        <ul class="finger-stick-odds__list">${rows}</ul>
      </div>
    `;
}

/** Attach dice control to accucheck / finger-stick task rows. */
export function decorateAccucheckDice(root = document) {
    if (typeof document === 'undefined' || !root?.querySelectorAll) return;
    const nodes = root.querySelectorAll(
        '[data-challenge="accucheck"], [data-task-type="med"]'
    );
    nodes.forEach((el) => {
        if (el.querySelector('[data-finger-stick-dice]')) return;
        const challenge = String(el.getAttribute('data-challenge') || '').toLowerCase();
        const name = el.querySelector('.font-medium')?.textContent || '';
        const taskLike = { metadata: { challenge }, name };
        if (!isAccucheckTask(taskLike)) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'finger-stick-dice';
        btn.setAttribute('data-finger-stick-dice', '1');
        btn.setAttribute('title', 'Finger-stick outcome odds');
        btn.setAttribute('aria-label', 'Show finger-stick outcome odds');
        btn.innerHTML = '<i class="fas fa-dice" aria-hidden="true"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            toggleFingerStickOddsPopover(btn);
        });

        const nameEl = el.querySelector('.font-medium');
        const timeEl = el.querySelector('.ml-auto');
        if (nameEl?.parentElement === el) {
            el.insertBefore(btn, timeEl || nameEl.nextSibling);
        } else if (timeEl) {
            el.insertBefore(btn, timeEl);
        } else {
            el.appendChild(btn);
        }
    });
}

let oddsPopoverEl = null;
let oddsAnchorEl = null;

function ensureOddsPopover() {
    if (oddsPopoverEl) return oddsPopoverEl;
    oddsPopoverEl = document.createElement('div');
    oddsPopoverEl.className = 'finger-stick-odds-popover';
    oddsPopoverEl.hidden = true;
    oddsPopoverEl.innerHTML = renderFingerStickOddsHtml();
    document.body.appendChild(oddsPopoverEl);
    return oddsPopoverEl;
}

export function showFingerStickOddsPopover(anchor) {
    if (typeof document === 'undefined') return;
    const pop = ensureOddsPopover();
    pop.innerHTML = renderFingerStickOddsHtml();
    pop.hidden = false;
    oddsAnchorEl = anchor || null;
    positionOddsPopover(anchor);
}

export function hideFingerStickOddsPopover() {
    if (!oddsPopoverEl) return;
    oddsPopoverEl.hidden = true;
    oddsAnchorEl = null;
}

function toggleFingerStickOddsPopover(anchor) {
    const pop = ensureOddsPopover();
    if (!pop.hidden && oddsAnchorEl === anchor) {
        hideFingerStickOddsPopover();
        return;
    }
    showFingerStickOddsPopover(anchor);
}

function positionOddsPopover(anchor) {
    if (!oddsPopoverEl || !anchor?.getBoundingClientRect) return;
    const rect = anchor.getBoundingClientRect();
    const pad = 8;
    const width = oddsPopoverEl.offsetWidth || 240;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    let top = rect.bottom + 6;
    const height = oddsPopoverEl.offsetHeight || 160;
    if (top + height > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - height - 6);
    }
    oddsPopoverEl.style.left = `${left}px`;
    oddsPopoverEl.style.top = `${top}px`;
}

export function initFingerStickDiceUi() {
    if (typeof document === 'undefined') return;
    decorateAccucheckDice(document);
    document.addEventListener('click', (e) => {
        if (e.target.closest?.('[data-finger-stick-dice]')) return;
        if (e.target.closest?.('.finger-stick-odds-popover')) return;
        hideFingerStickOddsPopover();
    });
    window.addEventListener('resize', () => {
        if (oddsAnchorEl && oddsPopoverEl && !oddsPopoverEl.hidden) {
            positionOddsPopover(oddsAnchorEl);
        }
    });
}
