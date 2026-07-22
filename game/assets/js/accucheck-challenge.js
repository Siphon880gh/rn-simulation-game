/**
 * Accucheck / glucometer + sliding-scale insulin challenge.
 * BS randomly 60–200; player enters units from the scale for the ordered insulin.
 * Cheat fills the correct units; player still submits.
 */

export const INSULIN_TYPES = ['regular', 'aspart', 'lispro'];

/** Practice sliding scale covering BS 60–200 mg/dL */
export const SLIDING_SCALE = [
    { min: 60, max: 69, units: 0, note: 'Hold — hypoglycemia protocol' },
    { min: 70, max: 149, units: 0, note: null },
    { min: 150, max: 179, units: 2, note: null },
    { min: 180, max: 200, units: 4, note: null }
];

export function isAccucheckTask(task) {
    const challenge = String(task?.metadata?.challenge || '').toLowerCase();
    if (challenge === 'accucheck') return true;
    const name = String(task?.name || '').toLowerCase();
    return /accucheck|glucometer|blood glucose|\bachs\b/.test(name);
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
    const roll = typeof random === 'function' ? random() : Math.random();
    return 60 + Math.floor(roll * 141); // inclusive 60–200
}

/**
 * @param {{ name?: string, metadata?: object }} task
 * @param {{ random?: () => number, bloodSugar?: number, insulin?: string }} [opts]
 */
export function buildAccucheckPrompt(task, opts = {}) {
    if (!isAccucheckTask(task)) return null;

    const bloodSugar = opts.bloodSugar != null
        ? Number(opts.bloodSugar)
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
        <p class="text-sm text-gray-900 font-semibold">
          Accucheck / sliding-scale insulin
        </p>
        <p class="text-sm text-gray-600">
          Correct units → task starts in a slot. Incorrect → try again. Timer is paused.
        </p>
        <p class="text-sm text-gray-800">
          Task: <strong>${taskName}</strong>
        </p>
        <p class="text-sm text-gray-800">
          Glucometer reading: <strong id="accucheck-bs">${bs}</strong> mg/dL
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
