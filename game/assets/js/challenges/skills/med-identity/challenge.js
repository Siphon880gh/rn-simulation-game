/**
 * Med brand ↔ generic quiz (E5.M2) — DOM challenge content for challenge-gate.
 * Generic task names ask for brand (typed, or SATA when multiple brands).
 * Brand task names ask for generic.
 * Author content: ./config.js (challenges/skills/med-identity/)
 */
import { GameConfig } from '../../../game-config.js';
import { medIdentityPairs } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

/** @type {{ generic: string, brand?: string, brands?: string[], aliases?: string[], brandAliases?: string[] }[]} */
export const MED_PAIRS = medIdentityPairs;

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

/** Primary + all listed brand names for a pair. */
export function pairBrands(pair) {
    if (!pair) return [];
    if (Array.isArray(pair.brands) && pair.brands.length) {
        return pair.brands.map((b) => String(b).trim()).filter(Boolean);
    }
    if (pair.brand) return [String(pair.brand).trim()];
    return [];
}

function pairGenericKeys(pair) {
    return [pair.generic, ...(pair.aliases || [])].map(normalizeAnswer).filter(Boolean);
}

function pairBrandKeys(pair) {
    return [
        ...pairBrands(pair),
        ...(pair.brandAliases || [])
    ].map(normalizeAnswer).filter(Boolean);
}

function keysMatchTask(taskName, keys) {
    const normalized = normalizeAnswer(taskName);
    if (!normalized || !keys.length) return false;
    if (keys.some((k) => normalized === k || normalized.includes(k) || k.includes(normalized))) {
        return true;
    }
    const tokens = nameTokens(taskName);
    return tokens.some((t) => keys.includes(t) || keys.some((k) => k.startsWith(t) || t.startsWith(k)));
}

export function resolveMedPair(taskName) {
    const normalized = normalizeAnswer(taskName);
    if (!normalized) return null;

    for (const pair of MED_PAIRS) {
        const keys = [...pairGenericKeys(pair), ...pairBrandKeys(pair)];
        if (keysMatchTask(taskName, keys)) return pair;
    }
    return null;
}

/**
 * Whether the task label is presenting a brand (vs generic).
 * Brand wins only when brand keys match and generic keys do not.
 */
export function taskPresentsBrand(taskName, pair) {
    if (!pair) return false;
    const brandHit = keysMatchTask(taskName, pairBrandKeys(pair));
    const genericHit = keysMatchTask(taskName, pairGenericKeys(pair));
    return brandHit && !genericHit;
}

function shuffleInPlace(arr, random) {
    const rnd = typeof random === 'function' ? random : Math.random;
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Build SATA brand choices: all correct brands + distractors from other pairs.
 * @param {string[]} correctBrands
 * @param {() => number} [random]
 */
export function buildBrandSataChoices(correctBrands, random) {
    const correctNorm = new Set(correctBrands.map(normalizeAnswer));
    const distractors = [];
    for (const pair of MED_PAIRS) {
        for (const b of pairBrands(pair)) {
            if (correctNorm.has(normalizeAnswer(b))) continue;
            if (distractors.some((d) => normalizeAnswer(d) === normalizeAnswer(b))) continue;
            distractors.push(b);
        }
    }
    shuffleInPlace(distractors, random);
    const need = Math.min(3, distractors.length);
    const picks = distractors.slice(0, need);
    const choices = [
        ...correctBrands.map((label) => ({ label, correct: true })),
        ...picks.map((label) => ({ label, correct: false }))
    ];
    shuffleInPlace(choices, random);
    return choices;
}

/**
 * @param {{ name?: string }} task
 * @param {{ direction?: 'brandToGeneric'|'genericToBrand', random?: () => number }} [opts]
 */
export function buildMedIdentityPrompt(task, opts = {}) {
    const pair = resolveMedPair(task?.name);
    if (!pair) return null;

    const brands = pairBrands(pair);
    const primaryBrand = brands[0] || pair.brand || '';
    if (!primaryBrand) return null;

    let direction = opts.direction;
    if (!direction) {
        direction = taskPresentsBrand(task?.name, pair) ? 'brandToGeneric' : 'genericToBrand';
    }

    if (direction === 'brandToGeneric') {
        return {
            pair,
            direction,
            mode: 'typed',
            promptLabel: 'generic name',
            shownLabel: 'brand',
            shown: primaryBrand,
            expected: pair.generic,
            accepted: pairGenericKeys(pair)
        };
    }

    // Generic task → ask brand. Multiple brands → SATA.
    if (brands.length > 1) {
        const choices = buildBrandSataChoices(brands, opts.random);
        return {
            pair,
            direction: 'genericToBrand',
            mode: 'sata',
            promptLabel: 'brand name(s)',
            shownLabel: 'generic',
            shown: pair.generic,
            expected: brands.join(', '),
            correctBrands: brands.map(normalizeAnswer),
            choices
        };
    }

    return {
        pair,
        direction: 'genericToBrand',
        mode: 'typed',
        promptLabel: 'brand name',
        shownLabel: 'generic',
        shown: pair.generic,
        expected: primaryBrand,
        accepted: [...brands, ...(pair.brandAliases || [])].map(normalizeAnswer)
    };
}

/**
 * @param {string|string[]} answer typed string, or selected brand labels for SATA
 * @param {ReturnType<typeof buildMedIdentityPrompt>} prompt
 */
export function checkMedIdentityAnswer(answer, prompt) {
    if (!prompt) return false;

    if (prompt.mode === 'sata') {
        const selected = (Array.isArray(answer) ? answer : [answer])
            .map(normalizeAnswer)
            .filter(Boolean)
            .sort();
        const correct = [...(prompt.correctBrands || [])].sort();
        if (!selected.length || selected.length !== correct.length) return false;
        return selected.every((v, i) => v === correct[i]);
    }

    const got = normalizeAnswer(answer);
    return (prompt.accepted || []).includes(got);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const MED_SATA_PAINT = [
    'border-emerald-500',
    'bg-emerald-50',
    'border-rose-500',
    'bg-rose-50',
    'ring-2',
    'ring-amber-400',
    'bg-amber-50'
];

function clearMedSataOutcomePaint(gate) {
    gate?.querySelectorAll?.('.med-sata-choice')?.forEach((b) => {
        const label = b.closest('label');
        if (!label) return;
        label.classList.remove(...MED_SATA_PAINT);
        label.querySelectorAll('.skill-sata-result-badge').forEach((el) => el.remove());
    });
    const key = gate?.querySelector?.('#challenge-answer-key');
    if (key) {
        key.classList.add('hidden');
        key.innerHTML = '';
    }
}

/** Visual key for incorrect med-identity SATA (keeps textual expected line). */
export function revealMedIdentitySataOutcome(
    gate = document.querySelector('.challenge-gate[data-challenge="med-identity"]')
) {
    if (!gate) return [];
    clearMedSataOutcomePaint(gate);
    const correctLabels = [];
    gate.querySelectorAll('.med-sata-choice').forEach((b) => {
        const label = b.closest('label');
        if (!label) return;
        const correct = b.getAttribute('data-challenge-correct') === '1';
        const checked = b.checked;
        const text = b.getAttribute('data-label') || '';
        if (correct) {
            correctLabels.push(text);
            label.classList.add('border-emerald-500', 'bg-emerald-50');
            const badge = document.createElement('span');
            badge.className = 'skill-sata-result-badge ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-800';
            badge.textContent = checked ? 'Correct' : 'Should select';
            label.appendChild(badge);
        } else if (checked) {
            label.classList.add('border-rose-500', 'bg-rose-50');
            const badge = document.createElement('span');
            badge.className = 'skill-sata-result-badge ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-rose-800';
            badge.textContent = 'Not correct';
            label.appendChild(badge);
        }
    });
    const key = gate.querySelector('#challenge-answer-key');
    if (key && correctLabels.length) {
        key.innerHTML = `
      <li class="list-none -ml-5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Correct selections</li>
      ${correctLabels.map((l) => `<li class="text-emerald-900">${escapeHtml(l)}</li>`).join('')}
    `;
        key.classList.remove('hidden');
    }
    return correctLabels;
}

function renderSataHtml(prompt) {
    const opts = (prompt.choices || []).map((c, i) => `
        <label class="flex items-start gap-2 px-3 py-2 rounded border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
          <input type="checkbox" class="mt-1 med-sata-choice" data-choice-index="${i}"
            data-challenge-correct="${c.correct ? '1' : '0'}" data-label="${escapeHtml(c.label)}" />
          <span class="flex-1 min-w-0">${escapeHtml(c.label)}</span>
        </label>
      `).join('');
    return `
      <p class="text-xs text-gray-500">Select all that apply</p>
      <div class="flex flex-col gap-2" data-med-sata-choices>${opts}</div>
    `;
}

export function renderMedIdentityHtml(prompt, taskName) {
    const body = prompt?.mode === 'sata'
        ? renderSataHtml(prompt)
        : `
        <label class="block text-sm text-gray-700" for="med-identity-answer">Your answer</label>
        <input id="med-identity-answer" type="text" autocomplete="off" spellcheck="false"
          class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Type ${escapeHtml(prompt?.promptLabel || 'answer')}" />
      `;

    return `
      <div class="challenge-gate med-identity-quiz space-y-3 text-left" data-challenge="med-identity"
        data-quiz-mode="${escapeHtml(prompt?.mode || 'typed')}">
        ${challengeMediaHtml('med-identity')}
        <p class="text-sm text-gray-900 font-semibold">
          Complete this challenge to perform the task.
        </p>
        <p class="text-sm text-gray-600">
          ${GameConfig.challengeCopy?.pauseBanner
            || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}
        </p>
        <p class="text-sm text-gray-800">
          Medication task: <strong>${escapeHtml(taskName || 'med')}</strong>
        </p>
        <p class="text-sm text-gray-800">
          What ${prompt?.mode === 'sata' ? 'are' : 'is'} the <strong>${escapeHtml(prompt?.promptLabel || 'name')}</strong> for
          <strong>${escapeHtml(prompt?.shown || '')}</strong> (${escapeHtml(prompt?.shownLabel || '')})?
        </p>
        ${body}
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
        <ul id="challenge-answer-key" class="hidden text-sm text-emerald-900 list-disc pl-5 space-y-1 rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2" aria-label="Correct selections"></ul>
      </div>
    `;
}

/** Fill typed answer or check SATA boxes (does not submit). */
export function applyMedIdentityCheat(prompt) {
    if (!prompt) return false;

    if (prompt.mode === 'sata') {
        const gate = document.querySelector('.challenge-gate[data-challenge="med-identity"]');
        clearMedSataOutcomePaint(gate);
        const boxes = [...document.querySelectorAll('.med-sata-choice')];
        if (!boxes.length) return false;
        boxes.forEach((b) => {
            const correct = b.getAttribute('data-challenge-correct') === '1';
            b.checked = correct;
            const label = b.closest('label');
            label?.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
            if (correct) label?.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50');
        });
        return true;
    }

    const input = document.querySelector('#med-identity-answer');
    if (!input) return false;
    input.value = String(prompt.expected || '');
    input.focus();
    input.select();
    return true;
}

/** Selected brand labels from SATA checkboxes in the open modal. */
export function readMedIdentitySataSelection() {
    return [...document.querySelectorAll('.med-sata-choice:checked')]
        .map((el) => el.getAttribute('data-label') || '')
        .filter(Boolean);
}
