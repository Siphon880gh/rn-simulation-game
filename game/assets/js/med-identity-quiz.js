/**
 * Med brand ↔ generic typed quiz (E5.M2) — DOM challenge content for challenge-gate.
 * Matching is case-insensitive; practice framing only.
 */

/** @type {{ generic: string, brand: string, aliases?: string[] }[]} */
export const MED_PAIRS = [
    { generic: 'atorvastatin', brand: 'Lipitor' },
    { generic: 'acetaminophen', brand: 'Tylenol', aliases: ['paracetamol'] },
    { generic: 'aspirin', brand: 'Bayer', aliases: ['asa', 'acetylsalicylic acid'] },
    { generic: 'heparin', brand: 'Hep-Lock' },
    { generic: 'gabapentin', brand: 'Neurontin' },
    { generic: 'melatonin', brand: 'Circadin' },
    { generic: 'trazodone', brand: 'Desyrel' },
    { generic: 'doxazosin', brand: 'Cardura' },
    { generic: 'mirtazapine', brand: 'Remeron' },
    { generic: 'ceftriaxone', brand: 'Rocephin' },
    { generic: 'albuterol', brand: 'ProAir', aliases: ['salbutamol'] },
    { generic: 'prednisone', brand: 'Deltasone' },
    { generic: 'ondansetron', brand: 'Zofran' },
    { generic: 'oxycodone', brand: 'OxyContin' },
    { generic: 'potassium chloride', brand: 'Klor-Con', aliases: ['kcl'] },
    { generic: 'insulin', brand: 'Humulin' }
];

export function normalizeAnswer(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[()]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*-\s*/g, '-')
        .trim();
}

function nameTokens(name) {
    const n = normalizeAnswer(name);
    return n.split(/[\s,/]+/).filter(Boolean);
}

export function resolveMedPair(taskName) {
    const normalized = normalizeAnswer(taskName);
    if (!normalized) return null;

    for (const pair of MED_PAIRS) {
        const keys = [
            pair.generic,
            pair.brand,
            ...(pair.aliases || [])
        ].map(normalizeAnswer);

        if (keys.some((k) => normalized === k || normalized.includes(k) || k.includes(normalized))) {
            return pair;
        }

        // Token overlap (e.g. "Aspirin (Low-dose)", "Albuterol neb", "Insulin drip check")
        const tokens = nameTokens(taskName);
        if (tokens.some((t) => keys.includes(t) || keys.some((k) => k.startsWith(t) || t.startsWith(k)))) {
            return pair;
        }
    }
    return null;
}

/**
 * @param {{ name?: string }} task
 * @param {{ direction?: 'brandToGeneric'|'genericToBrand', random?: () => number }} [opts]
 */
export function buildMedIdentityPrompt(task, opts = {}) {
    const pair = resolveMedPair(task?.name);
    if (!pair) return null;

    const roll = typeof opts.random === 'function' ? opts.random() : Math.random();
    const direction = opts.direction
        || (roll < 0.5 ? 'brandToGeneric' : 'genericToBrand');

    if (direction === 'brandToGeneric') {
        return {
            pair,
            direction,
            promptLabel: 'generic name',
            shownLabel: 'brand',
            shown: pair.brand,
            expected: pair.generic,
            accepted: [pair.generic, ...(pair.aliases || [])].map(normalizeAnswer)
        };
    }

    return {
        pair,
        direction,
        promptLabel: 'brand name',
        shownLabel: 'generic',
        shown: pair.generic,
        expected: pair.brand,
        accepted: [pair.brand].map(normalizeAnswer)
    };
}

export function checkMedIdentityAnswer(answer, prompt) {
    if (!prompt) return false;
    const got = normalizeAnswer(answer);
    return prompt.accepted.includes(got);
}

export function renderMedIdentityHtml(prompt, taskName) {
    return `
      <div class="challenge-gate med-identity-quiz space-y-3 text-left" data-challenge="med-identity">
        <p class="text-sm text-gray-600">Practice challenge (not a competency assessment). Timer is paused.</p>
        <p class="text-sm text-gray-800">
          Medication task: <strong>${taskName || 'med'}</strong>
        </p>
        <p class="text-sm text-gray-800">
          What is the <strong>${prompt.promptLabel}</strong> for
          <strong>${prompt.shown}</strong> (${prompt.shownLabel})?
        </p>
        <label class="block text-sm text-gray-700" for="med-identity-answer">Your answer</label>
        <input id="med-identity-answer" type="text" autocomplete="off" spellcheck="false"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Type ${prompt.promptLabel}" />
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
      </div>
    `;
}
