/**
 * Bed setup for admission mini-game (E5.M3) — CSBBBCL mnemonic.
 * Spec: AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md
 */
import { GameConfig } from './game-config.js';

const DEFAULT_SEQUENCE = [
    { letter: 'C', label: 'Chux' },
    { letter: 'S', label: 'Socks' },
    { letter: 'B', label: 'Thick blanket' },
    { letter: 'B', label: 'Bed sheet' },
    { letter: 'B', label: 'Pillowcase' },
    { letter: 'C', label: 'Clean gown' },
    { letter: 'L', label: 'Lifting sheet' }
];

const DEFAULT_DISTRACTORS = ['Think blanket', 'Extra towel', 'Trash bag', 'IV pole cover'];

function cfg() {
    return GameConfig.bedPrepChallenge || {};
}

export function getBedPrepSequence() {
    return Array.isArray(cfg().sequence) && cfg().sequence.length
        ? cfg().sequence
        : DEFAULT_SEQUENCE;
}

export function getFlashPool() {
    const seq = getBedPrepSequence().map((s) => s.label);
    const distractors = Array.isArray(cfg().distractors) ? cfg().distractors : DEFAULT_DISTRACTORS;
    return [...seq, ...distractors];
}

export function isBedPrepTask(task) {
    if (!task) return false;
    if (task.metadata?.challenge === 'bed-prep') return true;
    if (String(task.type).toLowerCase() === 'bedprep') return true;
    const name = String(task.name || '').toLowerCase();
    return /bed\s*prep|admission\s*bed|ready.*admission|bed.*admission/i.test(name);
}

export function shuffle(list, random = Math.random) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Compare player order of labels to correct sequence (case-insensitive). */
export function gradeBedPrepOrder(playerLabels, sequence = getBedPrepSequence()) {
    const expected = sequence.map((s) => String(s.label).trim().toLowerCase());
    const got = (playerLabels || []).map((s) => String(s).trim().toLowerCase());
    const wrongIndexes = [];
    const max = Math.max(expected.length, got.length);
    for (let i = 0; i < max; i += 1) {
        if (got[i] !== expected[i]) wrongIndexes.push(i);
    }
    return {
        passed: wrongIndexes.length === 0 && got.length === expected.length,
        wrongIndexes,
        expectedLabels: sequence.map((s) => s.label),
        mnemonic: sequence.map((s) => s.letter).join('')
    };
}

export function renderBedPrepHtml(taskName) {
    const sequence = getBedPrepSequence();
    const options = shuffle([...new Set(getFlashPool())]);
    const optionHtml = options.map((label) => `
      <button type="button" class="bed-prep-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-amber-50"
        data-label="${label}">${label}</button>
    `).join('');

    return `
      <div class="challenge-gate bed-prep-challenge space-y-3 text-left" data-challenge="bed-prep">
        <p class="text-sm text-gray-600">Practice challenge (not a competency assessment). Timer is paused.</p>
        <p class="text-sm text-gray-800">Get a bed ready for admission: <strong>${taskName || 'Bed prep'}</strong></p>
        <p class="text-xs text-gray-500">Mnemonic: <strong>CSBBBCL</strong> — watch the flash, then assemble the sequence.</p>
        <div class="rounded border border-amber-200 bg-amber-50 p-3 text-center">
          <div id="bed-prep-flash" class="text-lg font-semibold text-amber-900 min-h-[1.75rem]">…</div>
          <p class="text-xs text-amber-800 mt-1">
            Hint views left: <span id="bed-prep-hints">${cfg().hintViews ?? 3}</span>
          </p>
          <button type="button" id="bed-prep-ready"
            class="mt-2 px-3 py-1 rounded bg-amber-600 text-white text-sm hover:bg-amber-700">Ready</button>
        </div>
        <div id="bed-prep-build" class="hidden space-y-2">
          <p class="text-sm font-medium text-gray-800">Build the linen sequence (click in order)</p>
          <div id="bed-prep-chosen" class="min-h-[2rem] flex flex-wrap gap-1 text-sm"></div>
          <div id="bed-prep-options" class="flex flex-wrap gap-1">${optionHtml}</div>
          <button type="button" id="bed-prep-undo" class="text-xs text-gray-500 underline">Undo last</button>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
        <ol id="bed-prep-answer-key" class="hidden text-xs text-gray-600 list-decimal pl-5"></ol>
      </div>
    `;
}

/**
 * Wire DOM after modal open. Calls onDone({ passed, grade, reason }).
 */
export function wireBedPrepHandlers({ onDone, random = Math.random } = {}) {
    const flashEl = document.querySelector('#bed-prep-flash');
    const hintsEl = document.querySelector('#bed-prep-hints');
    const readyBtn = document.querySelector('#bed-prep-ready');
    const build = document.querySelector('#bed-prep-build');
    const chosenEl = document.querySelector('#bed-prep-chosen');
    const optionsEl = document.querySelector('#bed-prep-options');
    const feedback = document.querySelector('#challenge-feedback');
    const answerKey = document.querySelector('#bed-prep-answer-key');
    const undoBtn = document.querySelector('#bed-prep-undo');

    let hintsLeft = Number(cfg().hintViews) || 3;
    let flashing = true;
    let flashTimer = null;
    const pool = shuffle(getFlashPool(), random);
    let flashIdx = 0;
    const chosen = [];

    function paintChosen() {
        if (!chosenEl) return;
        chosenEl.innerHTML = chosen.length
            ? chosen.map((label, i) => `<span class="px-2 py-0.5 rounded bg-white border text-xs" data-idx="${i}">${i + 1}. ${label}</span>`).join('')
            : '<span class="text-gray-400 text-xs">No items yet</span>';
    }

    function stopFlash() {
        flashing = false;
        if (flashTimer) {
            clearInterval(flashTimer);
            flashTimer = null;
        }
    }

    function startFlash() {
        if (!flashEl) return;
        stopFlash();
        flashing = true;
        flashTimer = setInterval(() => {
            if (!flashing) return;
            flashEl.textContent = pool[flashIdx % pool.length];
            flashIdx += 1;
        }, Number(cfg().flashMs) || 700);
    }

    if (hintsEl) hintsEl.textContent = String(hintsLeft);
    startFlash();

    readyBtn?.addEventListener('click', () => {
        if (hintsLeft <= 0 && build && !build.classList.contains('hidden')) return;
        if (flashing) {
            hintsLeft -= 1;
            if (hintsEl) hintsEl.textContent = String(Math.max(0, hintsLeft));
            stopFlash();
            if (flashEl) flashEl.textContent = 'Sequence locked — assemble below';
            build?.classList.remove('hidden');
            if (hintsLeft <= 0 && readyBtn) {
                readyBtn.disabled = true;
                readyBtn.textContent = 'No hint views left';
            } else if (readyBtn) {
                readyBtn.textContent = 'Watch again';
            }
            return;
        }
        // Watch again if hints remain
        if (hintsLeft > 0) {
            startFlash();
            if (readyBtn) readyBtn.textContent = 'Ready';
        }
    });

    optionsEl?.querySelectorAll('.bed-prep-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
            const label = btn.getAttribute('data-label');
            if (!label || chosen.length >= getBedPrepSequence().length) return;
            chosen.push(label);
            paintChosen();
        });
    });

    undoBtn?.addEventListener('click', () => {
        chosen.pop();
        paintChosen();
    });

    window.bedPrepSubmit = () => {
        stopFlash();
        const grade = gradeBedPrepOrder(chosen);
        if (grade.passed) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-rose-600');
                feedback.classList.add('text-emerald-700');
                feedback.textContent = 'Correct sequence — bed ready for admission.';
            }
            onDone?.({ passed: true, grade, reason: 'bed-prep-correct' });
            return;
        }
        if (feedback) {
            feedback.classList.remove('hidden');
            feedback.textContent = 'Incorrect sequence — task not completed. Correct order shown below.';
        }
        if (answerKey) {
            answerKey.classList.remove('hidden');
            answerKey.innerHTML = grade.expectedLabels
                .map((label, i) => `<li class="${grade.wrongIndexes.includes(i) ? 'text-rose-600 font-semibold' : ''}">${label}</li>`)
                .join('');
        }
        chosenEl?.querySelectorAll('[data-idx]').forEach((el) => {
            const idx = Number(el.getAttribute('data-idx'));
            if (grade.wrongIndexes.includes(idx)) {
                el.classList.add('border-rose-500', 'bg-rose-50');
            }
        });
        onDone?.({
            passed: false,
            grade,
            reason: 'bed-prep-incorrect',
            expected: grade.expectedLabels.join(' → ')
        });
    };

    return () => {
        stopFlash();
        delete window.bedPrepSubmit;
    };
}

const BedPrepChallenge = {
    isBedPrepTask,
    gradeBedPrepOrder,
    renderBedPrepHtml,
    wireBedPrepHandlers,
    getBedPrepSequence
};

export default BedPrepChallenge;
