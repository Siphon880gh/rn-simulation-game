/**
 * Peritoneal dialysis exchange sequence mini-game — flash full flow, then build
 * the next two steps from a random mid-sequence anchor (not start/end).
 * Author content: ./config.js (challenges/skills/peritoneal-dialysis/)
 */
import { GameConfig } from '../../../game-config.js';
import { peritonealDialysisChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.peritonealDialysisChallenge || peritonealDialysisChallengeConfig || {};
}

export function getPeritonealDialysisSequence() {
    return Array.isArray(cfg().sequence) && cfg().sequence.length
        ? cfg().sequence
        : peritonealDialysisChallengeConfig.sequence;
}

export function getPeritonealDialysisDistractors() {
    return Array.isArray(cfg().distractors) && cfg().distractors.length
        ? cfg().distractors
        : peritonealDialysisChallengeConfig.distractors;
}

export function getPeritonealDialysisFlashPool() {
    const seq = getPeritonealDialysisSequence().map((s) => s.label);
    return [...seq, ...getPeritonealDialysisDistractors()];
}

export function getPeritonealDialysisNextStepsCount() {
    const n = Number(cfg().nextStepsCount);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 2;
}

export function isPeritonealDialysisTask(task) {
    if (!task) return false;
    const challenge = String(task.metadata?.challenge || '').toLowerCase();
    if (challenge === 'peritoneal-dialysis' || challenge === 'pd' || challenge === 'pd-exchange') {
        return true;
    }
    // Leave skill-mcq (e.g. cloudy effluent) alone.
    if (challenge === 'skill-mcq') return false;
    const name = String(task.name || '');
    return /\b(peritoneal\s*dialysis|pd\s*exchange|capd)\b/i.test(name);
}

export function shuffle(list, random = Math.random) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Pick a mid-sequence anchor (not first/last) with room for the next N steps.
 * Options = full sequence labels + distractors (shuffled).
 */
export function buildPeritonealDialysisRound(random = Math.random) {
    const sequence = getPeritonealDialysisSequence();
    const nextCount = getPeritonealDialysisNextStepsCount();
    // Exclude start (0) and ending (length-1); need `nextCount` steps after anchor.
    const maxAnchor = sequence.length - 1 - nextCount;
    const minAnchor = 1;
    let anchorIndex = minAnchor;
    if (maxAnchor >= minAnchor) {
        anchorIndex = minAnchor + Math.floor(random() * (maxAnchor - minAnchor + 1));
    } else if (sequence.length > 2) {
        // Short sequences: best effort mid step that still has room for nextCount.
        anchorIndex = Math.max(1, Math.min(sequence.length - 1 - nextCount, sequence.length - 2));
        if (anchorIndex < 1) anchorIndex = 1;
    }
    const expectedNext = sequence
        .slice(anchorIndex + 1, anchorIndex + 1 + nextCount)
        .map((s) => s.label);
    const distractors = getPeritonealDialysisDistractors().map(String);
    const options = shuffle([...new Set([...sequence.map((s) => s.label), ...distractors])], random);
    const flashPool = shuffle(getPeritonealDialysisFlashPool(), random);
    return {
        anchorIndex,
        anchorLabel: sequence[anchorIndex]?.label || '',
        expectedNext,
        nextCount,
        distractors,
        options,
        flashPool
    };
}

/** Compare player order of labels to expected labels (case-insensitive). */
export function gradePeritonealDialysisOrder(playerLabels, expectedLabels) {
    const expected = (expectedLabels || getPeritonealDialysisSequence().map((s) => s.label))
        .map((s) => String(s).trim().toLowerCase());
    const got = (playerLabels || []).map((s) => String(s).trim().toLowerCase());
    const wrongIndexes = [];
    const max = Math.max(expected.length, got.length);
    for (let i = 0; i < max; i += 1) {
        if (got[i] !== expected[i]) wrongIndexes.push(i);
    }
    return {
        passed: wrongIndexes.length === 0 && got.length === expected.length,
        wrongIndexes,
        expectedLabels: (expectedLabels || getPeritonealDialysisSequence().map((s) => s.label)).map(String)
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderPeritonealDialysisHtml(taskName, round) {
    const r = round || buildPeritonealDialysisRound();
    const optionHtml = r.options.map((label) => `
      <button type="button" class="pd-seq-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-indigo-50"
        data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
    `).join('');
    const nextWord = r.nextCount === 1 ? 'step' : 'steps';

    return `
      <div class="challenge-gate pd-seq-challenge space-y-3 text-left" data-challenge="peritoneal-dialysis">
        ${challengeMediaHtml('peritoneal-dialysis') || challengeMediaHtml('skill-mcq') || ''}
        <p class="text-sm text-gray-800">PD exchange: <strong>${escapeHtml(taskName || 'Peritoneal dialysis')}</strong></p>
        <p class="text-xs text-gray-500">Watch the flash for the full exchange flow (some steps are distractors), then build the next ${r.nextCount} ${nextWord} from the given step.</p>
        <div class="rounded border border-indigo-200 bg-indigo-50 p-3 text-center">
          <div id="pd-seq-flash" class="text-lg font-semibold text-indigo-900 min-h-[1.75rem]">…</div>
          <p class="text-xs text-indigo-800 mt-1">
            Hint views left: <span id="pd-seq-hints">${cfg().hintViews ?? 3}</span>
          </p>
          <div class="mt-2 flex items-center justify-center gap-2 text-xs text-indigo-900">
            <label for="pd-seq-speed" class="whitespace-nowrap">Preview speed</label>
            <input id="pd-seq-speed" type="range"
              min="${Number(cfg().flashSpeedMinPct) || 50}"
              max="${Number(cfg().flashSpeedMaxPct) || 150}"
              value="100" step="10" class="w-28 accent-indigo-600" />
            <span id="pd-seq-speed-label" class="tabular-nums w-10 text-left">100%</span>
          </div>
          <button type="button" id="pd-seq-ready"
            class="mt-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Ready</button>
        </div>
        <div id="pd-seq-build" class="hidden space-y-2">
          <p class="text-sm font-medium text-gray-800">
            Given: <strong>${escapeHtml(r.anchorLabel)}</strong>
          </p>
          <p class="text-sm text-gray-800">Click the next ${r.nextCount} ${nextWord} in order. Some options are distractors. Click a chosen step to remove it.</p>
          <div id="pd-seq-chosen" class="min-h-[2rem] flex flex-wrap gap-1 text-sm"></div>
          <div id="pd-seq-options" class="flex flex-wrap gap-1">${optionHtml}</div>
          <button type="button" id="pd-seq-undo" class="text-xs text-gray-500 underline">Undo last</button>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
        <ol id="pd-seq-answer-key" class="hidden text-xs text-gray-600 list-decimal pl-5"></ol>
      </div>
    `;
}

/**
 * Wire DOM after modal open. Calls onDone({ passed, grade, reason, expected? }).
 * Pass the same `round` used in renderPeritonealDialysisHtml when available.
 */
export function wirePeritonealDialysisHandlers({ onDone, onStarted, random = Math.random, round } = {}) {
    const flashEl = document.querySelector('#pd-seq-flash');
    const hintsEl = document.querySelector('#pd-seq-hints');
    const readyBtn = document.querySelector('#pd-seq-ready');
    const build = document.querySelector('#pd-seq-build');
    const chosenEl = document.querySelector('#pd-seq-chosen');
    const optionsEl = document.querySelector('#pd-seq-options');
    const feedback = document.querySelector('#challenge-feedback');
    const undoBtn = document.querySelector('#pd-seq-undo');
    const speedInput = document.querySelector('#pd-seq-speed');
    const speedLabel = document.querySelector('#pd-seq-speed-label');

    const activeRound = round || buildPeritonealDialysisRound(random);
    const need = activeRound.expectedNext.length;
    let hintsLeft = Number(cfg().hintViews) || 3;
    let flashing = true;
    let flashTimer = null;
    let speedPct = Number(speedInput?.value) || 100;
    let hasStarted = false;
    const pool = activeRound.flashPool?.length
        ? activeRound.flashPool
        : shuffle(getPeritonealDialysisFlashPool(), random);
    let flashIdx = 0;
    const chosen = [];

    function markStarted() {
        if (hasStarted) return;
        hasStarted = true;
        onStarted?.();
    }

    function paintChosen() {
        if (!chosenEl) return;
        chosenEl.innerHTML = chosen.length
            ? chosen.map((label, i) => (
                `<button type="button" class="pd-seq-chosen-step px-2 py-0.5 rounded bg-white border text-xs hover:border-rose-400 hover:bg-rose-50"
                  data-idx="${i}" title="Remove this step" aria-label="Remove step ${i + 1}: ${escapeHtml(label)}">
                  ${i + 1}. ${escapeHtml(label)} <span aria-hidden="true" class="text-rose-500">×</span>
                </button>`
            )).join('')
            : '<span class="text-gray-400 text-xs">No steps yet</span>';
    }

    function removeChosenAt(idx) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= chosen.length) return;
        chosen.splice(idx, 1);
        paintChosen();
    }

    function flashIntervalMs() {
        const base = Number(cfg().flashMs) || 700;
        const min = Number(cfg().flashSpeedMinPct) || 50;
        const max = Number(cfg().flashSpeedMaxPct) || 150;
        const pct = Math.min(max, Math.max(min, speedPct || 100));
        return Math.max(1, Math.round(base / (pct / 100)));
    }

    function paintFlashFrame() {
        if (!flashEl || !pool.length) return;
        flashEl.textContent = pool[flashIdx % pool.length];
        flashIdx += 1;
    }

    function stopFlash() {
        flashing = false;
        if (flashTimer) {
            clearInterval(flashTimer);
            flashTimer = null;
        }
    }

    function startFlash({ paintNow = true } = {}) {
        if (!flashEl) return;
        stopFlash();
        flashing = true;
        if (paintNow) paintFlashFrame();
        flashTimer = setInterval(() => {
            if (!flashing) return;
            paintFlashFrame();
        }, flashIntervalMs());
    }

    if (hintsEl) hintsEl.textContent = String(hintsLeft);
    if (speedLabel) speedLabel.textContent = `${speedPct}%`;
    startFlash();

    speedInput?.addEventListener('input', () => {
        speedPct = Number(speedInput.value) || 100;
        if (speedLabel) speedLabel.textContent = `${speedPct}%`;
        if (flashing) startFlash({ paintNow: false });
    });

    readyBtn?.addEventListener('click', () => {
        if (hintsLeft <= 0 && build && !build.classList.contains('hidden')) return;
        if (flashing) {
            hintsLeft -= 1;
            if (hintsEl) hintsEl.textContent = String(Math.max(0, hintsLeft));
            stopFlash();
            if (flashEl) flashEl.textContent = 'Sequence locked — assemble below';
            build?.classList.remove('hidden');
            markStarted();
            if (hintsLeft <= 0 && readyBtn) {
                readyBtn.disabled = true;
                readyBtn.textContent = 'No hint views left';
            } else if (readyBtn) {
                readyBtn.textContent = 'Watch again';
            }
            return;
        }
        if (hintsLeft > 0) {
            // Hide assemble panel so the next hint view clearly shows flash items again.
            build?.classList.add('hidden');
            flashIdx = 0;
            startFlash({ paintNow: true });
            if (readyBtn) readyBtn.textContent = 'Ready';
        }
    });

    optionsEl?.querySelectorAll('.pd-seq-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
            const label = btn.getAttribute('data-label');
            if (!label || chosen.length >= need) return;
            chosen.push(label);
            paintChosen();
        });
    });

    chosenEl?.addEventListener('click', (ev) => {
        const stepBtn = ev.target?.closest?.('.pd-seq-chosen-step');
        if (!stepBtn || !chosenEl.contains(stepBtn)) return;
        removeChosenAt(Number(stepBtn.getAttribute('data-idx')));
    });

    undoBtn?.addEventListener('click', () => {
        removeChosenAt(chosen.length - 1);
    });

    window.pdSeqSubmit = () => {
        stopFlash();
        const grade = gradePeritonealDialysisOrder(chosen, activeRound.expectedNext);
        if (grade.passed) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-rose-600');
                feedback.classList.add('text-emerald-700');
                feedback.textContent = GameConfig.challengeCopy?.passedFeedback
                    || 'You passed. Task being completed.';
            }
            onDone?.({ passed: true, grade, reason: 'peritoneal-dialysis-correct' });
            return;
        }
        // Keep modal open for retry — highlight wrong steps; do not spoil the full key.
        if (feedback) {
            feedback.classList.remove('hidden', 'text-emerald-700');
            feedback.classList.add('text-rose-600');
            feedback.textContent = 'Incorrect sequence — undo or rebuild, then submit again.';
        }
        chosenEl?.querySelectorAll('[data-idx]').forEach((el) => {
            const idx = Number(el.getAttribute('data-idx'));
            el.classList.remove('border-rose-500', 'bg-rose-50');
            if (grade.wrongIndexes.includes(idx)) {
                el.classList.add('border-rose-500', 'bg-rose-50');
            }
        });
        onDone?.({
            passed: false,
            grade,
            reason: 'peritoneal-dialysis-incorrect',
            expected: grade.expectedLabels.join(' → ')
        });
    };

    /** Practice aid: fill correct next steps; player still presses Submit. */
    window.pdSeqCheat = () => {
        stopFlash();
        if (flashEl) flashEl.textContent = 'Sequence locked — assemble below';
        build?.classList.remove('hidden');
        markStarted();
        chosen.length = 0;
        activeRound.expectedNext.forEach((label) => {
            chosen.push(label);
        });
        paintChosen();
        if (feedback) {
            feedback.classList.remove('hidden', 'text-rose-600');
            feedback.classList.add('text-emerald-700');
            feedback.textContent = 'Cheat filled the next steps — press Submit when ready.';
        }
    };

    return () => {
        stopFlash();
        delete window.pdSeqSubmit;
        delete window.pdSeqCheat;
    };
}

const PeritonealDialysisChallenge = {
    isPeritonealDialysisTask,
    gradePeritonealDialysisOrder,
    buildPeritonealDialysisRound,
    renderPeritonealDialysisHtml,
    wirePeritonealDialysisHandlers,
    getPeritonealDialysisSequence
};

export default PeritonealDialysisChallenge;
