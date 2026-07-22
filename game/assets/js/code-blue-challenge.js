/**
 * Code Blue mini-game (E5.M4) — thin BLS priority sequence (practice framing).
 * Triggered from E4 deterioration escalate, not from every Perform.
 */
import { GameConfig } from './game-config.js';

const DEFAULT_STEPS = [
    { id: 'call', label: 'Activate Code Blue / call for help' },
    { id: 'cpr', label: 'Start high-quality chest compressions' },
    { id: 'defib', label: 'Attach defibrillator / AED pads' }
];

const DEFAULT_DISTRACTORS = [
    'Leave to finish charting first',
    'Wait for the physician to arrive before acting',
    'Give oral meds before calling for help'
];

function cfg() {
    return GameConfig.codeBlueChallenge || {};
}

export function getCodeBlueSteps() {
    return Array.isArray(cfg().steps) && cfg().steps.length
        ? cfg().steps
        : DEFAULT_STEPS;
}

export function getCodeBlueOptionPool() {
    const steps = getCodeBlueSteps().map((s) => s.label);
    const distractors = Array.isArray(cfg().distractors) ? cfg().distractors : DEFAULT_DISTRACTORS;
    return [...steps, ...distractors];
}

export function shuffle(list, random = Math.random) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Grade ordered labels against BLS priority sequence. */
export function gradeCodeBlueOrder(playerLabels, steps = getCodeBlueSteps()) {
    const expected = steps.map((s) => String(s.label).trim().toLowerCase());
    const got = (playerLabels || []).map((s) => String(s).trim().toLowerCase());
    const wrongIndexes = [];
    const max = Math.max(expected.length, got.length);
    for (let i = 0; i < max; i += 1) {
        if (got[i] !== expected[i]) wrongIndexes.push(i);
    }
    return {
        passed: wrongIndexes.length === 0 && got.length === expected.length,
        wrongIndexes,
        expectedLabels: steps.map((s) => s.label)
    };
}

export function renderCodeBlueHtml(patientName) {
    const steps = getCodeBlueSteps();
    const options = shuffle([...new Set(getCodeBlueOptionPool())]);
    const optionHtml = options.map((label) => `
      <button type="button" class="code-blue-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-rose-50"
        data-label="${label}">${label}</button>
    `).join('');

    return `
      <div class="challenge-gate code-blue-challenge space-y-3 text-left" data-challenge="code-blue">
        <p class="text-sm text-gray-600">Practice challenge (not a competency assessment). Timer is paused.</p>
        <p class="text-sm text-rose-800 font-medium">Code Blue — ${patientName || 'patient'}</p>
        <p class="text-sm text-gray-800">Order the first response priorities (1 → ${steps.length}):</p>
        <div id="code-blue-chosen" class="min-h-[2rem] flex flex-col gap-1 text-sm"></div>
        <div id="code-blue-options" class="flex flex-wrap gap-1">${optionHtml}</div>
        <button type="button" id="code-blue-undo" class="text-xs text-gray-500 underline">Undo last</button>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
        <ol id="code-blue-answer-key" class="hidden text-xs text-gray-600 list-decimal pl-5"></ol>
      </div>
    `;
}

/**
 * Wire pick/undo/submit. Returns cleanup fn.
 * @param {{ onDone: (r: object) => void }} opts
 */
export function wireCodeBlueHandlers({ onDone } = {}) {
    const steps = getCodeBlueSteps();
    const chosenEl = document.querySelector('#code-blue-chosen');
    const optionsEl = document.querySelector('#code-blue-options');
    const undoBtn = document.querySelector('#code-blue-undo');
    const answerKey = document.querySelector('#code-blue-answer-key');
    const chosen = [];

    function paintChosen() {
        if (!chosenEl) return;
        chosenEl.innerHTML = chosen.map((label, i) => `
          <div class="px-2 py-1 rounded bg-rose-50 border border-rose-100">${i + 1}. ${label}</div>
        `).join('') || '<span class="text-xs text-gray-400">Tap actions in order…</span>';
    }

    function onPick(e) {
        const btn = e.target?.closest?.('.code-blue-pick');
        if (!btn || chosen.length >= steps.length) return;
        chosen.push(btn.getAttribute('data-label'));
        btn.disabled = true;
        btn.classList.add('opacity-40');
        paintChosen();
    }

    function onUndo() {
        const last = chosen.pop();
        if (!last) return;
        optionsEl?.querySelectorAll('.code-blue-pick').forEach((btn) => {
            if (btn.getAttribute('data-label') === last && btn.disabled) {
                btn.disabled = false;
                btn.classList.remove('opacity-40');
            }
        });
        paintChosen();
    }

    window.codeBlueSubmit = () => {
        const grade = gradeCodeBlueOrder(chosen, steps);
        if (grade.passed) {
            onDone?.({
                passed: true,
                grade,
                reason: 'code-blue-correct',
                expected: grade.expectedLabels.join(' → ')
            });
            return;
        }
        if (answerKey) {
            answerKey.innerHTML = grade.expectedLabels.map((l) => `<li>${l}</li>`).join('');
            answerKey.classList.remove('hidden');
        }
        chosenEl?.querySelectorAll('div').forEach((row, i) => {
            if (grade.wrongIndexes.includes(i)) {
                row.classList.add('bg-rose-100', 'border-rose-300');
            }
        });
        onDone?.({
            passed: false,
            grade,
            reason: 'code-blue-incorrect',
            expected: grade.expectedLabels.join(' → ')
        });
    };

    optionsEl?.addEventListener('click', onPick);
    undoBtn?.addEventListener('click', onUndo);
    paintChosen();

    return () => {
        optionsEl?.removeEventListener('click', onPick);
        undoBtn?.removeEventListener('click', onUndo);
        delete window.codeBlueSubmit;
    };
}
