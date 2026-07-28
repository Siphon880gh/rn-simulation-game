/**
 * IV drip titration / Heparin PTT adjust challenge (practice framing).
 * Cheat fills the expected new rate; player still submits.
 */

import { GameConfig } from './game-config.js';

export function isIvTask(task) {
    if (!task) return false;
    if (String(task.type).toLowerCase() === 'iv') return true;
    const challenge = String(task.metadata?.challenge || '').toLowerCase();
    return challenge === 'iv-titration' || challenge === 'heparin-ptt' || challenge === 'iv-check';
}

function cfg() {
    return GameConfig.iv || {};
}

function drugLabelFallback(drug) {
    const d = String(drug || '').toLowerCase();
    if (d === 'insulin') return 'Insulin drip (regular)';
    if (d === 'heparin') return 'Heparin drip';
    if (d === 'levophed' || d === 'norepinephrine') return 'Levophed (norepinephrine)';
    if (d === 'neosynephrine' || d === 'phenylephrine') return 'Neo-Synephrine (phenylephrine)';
    return drug || 'IV drip';
}

export function classifyPtt(result) {
    if (result === 'low' || result === 'subtherapeutic') return 'low';
    if (result === 'high' || result === 'supratherapeutic') return 'high';
    return 'therapeutic';
}

export function heparinNewRate(currentRate, pttResult, step = cfg().heparinAdjustStep ?? 2) {
    const rate = Number(currentRate) || 0;
    const band = classifyPtt(pttResult);
    if (band === 'low') return rate + step;
    if (band === 'high') return Math.max(0, rate - step);
    return rate;
}

export function pressorNewRate(currentRate, direction, step = cfg().pressorAdjustStep ?? 2) {
    const rate = Number(currentRate) || 0;
    if (direction === 'increase' || direction === 'up') return rate + step;
    if (direction === 'decrease' || direction === 'down') return Math.max(0, rate - step);
    return rate;
}

export function insulinNewRate(currentRate, direction, step = cfg().insulinAdjustStep ?? 1) {
    return pressorNewRate(currentRate, direction, step);
}

/**
 * @param {{ name?: string, metadata?: object }} task
 * @param {{ random?: () => number }} [opts]
 */
export function buildIvPrompt(task, opts = {}) {
    if (!isIvTask(task)) return null;
    const meta = task.metadata || {};
    const kind = String(meta.challenge || meta.ivKind || 'iv-titration').toLowerCase();
    const drug = meta.drug || meta.ivDrug || 'drip';
    const unit = meta.unit || 'units/hr';
    const currentRate = Number(meta.currentRate);
    const roll = typeof opts.random === 'function' ? opts.random() : Math.random();

    if (kind === 'iv-check') {
        const rate = Number.isFinite(currentRate) ? currentRate : 0;
        return {
            kind: 'iv-check',
            drug,
            brand: meta.brand || drugLabelFallback(drug),
            unit: unit || 'units/hr',
            currentRate: rate,
            expected: String(rate),
            accepted: [String(rate), `${rate}`].map(normalizeIvAnswer)
        };
    }

    if (kind === 'heparin-ptt') {
        const bands = ['low', 'therapeutic', 'high'];
        const pttResult = meta.pttResult || bands[Math.floor(roll * bands.length)];
        const expected = heparinNewRate(currentRate, pttResult);
        return {
            kind: 'heparin-ptt',
            drug: 'heparin',
            brand: 'Heparin drip',
            unit: unit || 'units/kg/hr',
            currentRate,
            pttResult: classifyPtt(pttResult),
            pttLabel: classifyPtt(pttResult) === 'low'
                ? 'subtherapeutic (low)'
                : classifyPtt(pttResult) === 'high'
                    ? 'supratherapeutic (high)'
                    : 'therapeutic',
            step: cfg().heparinAdjustStep ?? 2,
            expected: String(expected),
            accepted: [String(expected), `${expected}`, `${expected} units`].map(normalizeIvAnswer)
        };
    }

    const direction = meta.direction || (roll < 0.5 ? 'increase' : 'decrease');
    const sbp = meta.sbp != null ? Number(meta.sbp) : (direction === 'increase' ? 78 : 160);
    const isInsulin = /insulin/i.test(drug);
    const step = isInsulin ? (cfg().insulinAdjustStep ?? 1) : (cfg().pressorAdjustStep ?? 2);
    const expected = isInsulin
        ? insulinNewRate(currentRate, direction, step)
        : pressorNewRate(currentRate, direction, step);

    return {
        kind: 'iv-titration',
        drug,
        brand: meta.brand || drug,
        unit,
        currentRate,
        direction,
        sbp,
        step,
        expected: String(expected),
        accepted: [String(expected), `${expected}`].map(normalizeIvAnswer)
    };
}

export function normalizeIvAnswer(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/units?\/kg\/hr|units?\/hr|mcg\/min|ml\/hr/g, '')
        .replace(/units?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function checkIvAnswer(answer, prompt) {
    if (!prompt) return false;
    const got = normalizeIvAnswer(answer);
    if (!got) return false;
    return prompt.accepted.includes(got) || got === normalizeIvAnswer(prompt.expected);
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderIvChallengeHtml(prompt, taskName) {
    if (prompt.kind === 'iv-check') {
        return `
      <div class="challenge-gate iv-challenge space-y-3 text-left" data-challenge="iv-check">
        <p class="text-sm text-gray-900 font-semibold">IV drip check</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-sm text-gray-800">Task: <strong>${escapeHtml(taskName || 'IV check')}</strong></p>
        <p class="text-sm text-gray-800">
          Drip: <strong>${escapeHtml(prompt.brand)}</strong> — continuous IV infusion
        </p>
        <p class="text-sm text-gray-800">
          Charted rate: <strong>${escapeHtml(String(prompt.currentRate))}</strong> ${escapeHtml(prompt.unit)}
        </p>
        <label class="block text-sm text-gray-700" for="iv-answer">Document rate (units/hr)</label>
        <input id="iv-answer" type="text" inputmode="decimal" autocomplete="off"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Enter charted rate" />
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>`;
    }

    if (prompt.kind === 'heparin-ptt') {
        return `
      <div class="challenge-gate iv-challenge space-y-3 text-left" data-challenge="heparin-ptt">
        <p class="text-sm text-gray-900 font-semibold">Heparin drip — PTT result</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-sm text-gray-800">Task: <strong>${escapeHtml(taskName || 'Heparin PTT')}</strong></p>
        <p class="text-sm text-gray-800">Current rate: <strong>${escapeHtml(String(prompt.currentRate))}</strong> ${escapeHtml(prompt.unit)}</p>
        <p class="text-sm text-gray-800">PTT: <strong id="iv-ptt-result">${escapeHtml(prompt.pttLabel)}</strong></p>
        <div class="rounded border border-gray-200 text-sm overflow-hidden">
          <table class="w-full border-collapse">
            <thead><tr class="bg-gray-50">
              <th class="border border-gray-200 px-2 py-1 text-left">PTT</th>
              <th class="border border-gray-200 px-2 py-1 text-left">Action</th>
            </tr></thead>
            <tbody>
              <tr><td class="border border-gray-200 px-2 py-1">Subtherapeutic (low)</td><td class="border border-gray-200 px-2 py-1">↑ ${prompt.step} ${escapeHtml(prompt.unit)}</td></tr>
              <tr><td class="border border-gray-200 px-2 py-1">Therapeutic</td><td class="border border-gray-200 px-2 py-1">No change</td></tr>
              <tr><td class="border border-gray-200 px-2 py-1">Supratherapeutic (high)</td><td class="border border-gray-200 px-2 py-1">↓ ${prompt.step} ${escapeHtml(prompt.unit)}</td></tr>
            </tbody>
          </table>
        </div>
        <label class="block text-sm text-gray-700" for="iv-answer">New heparin rate</label>
        <input id="iv-answer" type="text" inputmode="decimal" autocomplete="off"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Enter new rate (${escapeHtml(prompt.unit)})" />
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>`;
    }

    const dirLabel = prompt.direction === 'increase' ? 'increase' : 'decrease';
    return `
      <div class="challenge-gate iv-challenge space-y-3 text-left" data-challenge="iv-titration">
        <p class="text-sm text-gray-900 font-semibold">IV drip titration</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-sm text-gray-800">Task: <strong>${escapeHtml(taskName || 'Titrate drip')}</strong></p>
        <p class="text-sm text-gray-800">
          Drip: <strong>${escapeHtml(prompt.brand)}</strong> (${escapeHtml(prompt.drug)})
        </p>
        <p class="text-sm text-gray-800">
          Current rate: <strong>${escapeHtml(String(prompt.currentRate))}</strong> ${escapeHtml(prompt.unit)}
        </p>
        <p class="text-sm text-rose-800">
          Incident: SBP <strong>${escapeHtml(String(prompt.sbp))}</strong> — ${dirLabel} drip by ${prompt.step} ${escapeHtml(prompt.unit)}
        </p>
        <label class="block text-sm text-gray-700" for="iv-answer">New rate</label>
        <input id="iv-answer" type="text" inputmode="decimal" autocomplete="off"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Enter new rate" />
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>`;
}

export function applyIvCheat(prompt) {
    const input = document.querySelector('#iv-answer');
    if (!input || !prompt) return false;
    input.value = String(prompt.expected);
    input.focus();
    input.select();
    return true;
}
