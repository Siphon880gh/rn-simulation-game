/**
 * IV bag / IVPB replace mini-game — tubing MCQ + primary-bag setup sequence.
 * Author content: ./config.js (challenges/skills/iv-replace/)
 */
import { GameConfig } from '../../../game-config.js';
import { ivReplaceChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.ivReplaceChallenge || ivReplaceChallengeConfig || {};
}

export function getIvReplaceSequence() {
    return Array.isArray(cfg().sequence) && cfg().sequence.length
        ? cfg().sequence
        : ivReplaceChallengeConfig.sequence;
}

export function getIvReplaceDistractors() {
    return Array.isArray(cfg().distractors) && cfg().distractors.length
        ? cfg().distractors
        : ivReplaceChallengeConfig.distractors;
}

export function getIvReplaceFlashPool() {
    const seq = getIvReplaceSequence().map((s) => s.label);
    return [...seq, ...getIvReplaceDistractors()];
}

export function getIvReplaceNextStepsCount() {
    const n = Number(cfg().nextStepsCount);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 2;
}

export function getIvReplaceTubingMcq() {
    return cfg().tubingMcq || ivReplaceChallengeConfig.tubingMcq;
}

export function isIvReplaceTask(task) {
    if (!task) return false;
    const challenge = String(task.metadata?.challenge || '').toLowerCase();
    return challenge === 'iv-replace' || challenge === 'iv-bag-replace';
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
 * Mid-sequence anchor (not first/last) + next N steps; options mix sequence + distractors.
 * Also shuffles tubing MCQ choices.
 */
export function buildIvReplaceRound(random = Math.random) {
    const sequence = getIvReplaceSequence();
    const nextCount = getIvReplaceNextStepsCount();
    const maxAnchor = sequence.length - 1 - nextCount;
    const minAnchor = 1;
    let anchorIndex = minAnchor;
    if (maxAnchor >= minAnchor) {
        anchorIndex = minAnchor + Math.floor(random() * (maxAnchor - minAnchor + 1));
    } else if (sequence.length > 2) {
        anchorIndex = Math.max(1, Math.min(sequence.length - 1 - nextCount, sequence.length - 2));
        if (anchorIndex < 1) anchorIndex = 1;
    }
    const expectedNext = sequence
        .slice(anchorIndex + 1, anchorIndex + 1 + nextCount)
        .map((s) => s.label);
    const distractors = getIvReplaceDistractors().map(String);
    const options = shuffle([...new Set([...sequence.map((s) => s.label), ...distractors])], random);
    const flashPool = shuffle(getIvReplaceFlashPool(), random);
    const mcq = getIvReplaceTubingMcq();
    const mcqChoices = shuffle([...(mcq?.choices || [])], random);
    return {
        anchorIndex,
        anchorLabel: sequence[anchorIndex]?.label || '',
        expectedNext,
        nextCount,
        distractors,
        options,
        flashPool,
        mcq: mcq
            ? {
                id: mcq.id,
                prompt: mcq.prompt,
                correct: mcq.correct,
                choices: mcqChoices
            }
            : null
    };
}

export function gradeIvReplaceOrder(playerLabels, expectedLabels) {
    const expected = (expectedLabels || getIvReplaceSequence().map((s) => s.label))
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
        expectedLabels: (expectedLabels || getIvReplaceSequence().map((s) => s.label)).map(String)
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function replaceTitleForKind(kind) {
    const k = String(kind || 'fluid').toLowerCase();
    if (k === 'ivpb') return 'Replace IVPB';
    if (k === 'drip') return 'Replace IV drip bag';
    return 'Replace IV solution';
}

export function renderIvReplaceHtml(taskName, round, meta = {}) {
    const r = round || buildIvReplaceRound();
    const kind = meta.lineKind || meta.ivKind || 'fluid';
    const optionHtml = r.options.map((label) => `
      <button type="button" class="iv-replace-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-rose-50"
        data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
    `).join('');
    const nextWord = r.nextCount === 1 ? 'step' : 'steps';
    const mcq = r.mcq;
    const mcqHtml = mcq
        ? `
        <div id="iv-replace-mcq" class="rounded border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p class="text-sm font-medium text-amber-950">${escapeHtml(mcq.prompt)}</p>
          <div class="space-y-1" role="radiogroup" aria-label="Tubing date question">
            ${mcq.choices.map((choice, i) => `
              <label class="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                <input type="radio" name="iv-replace-tubing" value="${escapeHtml(choice)}"
                  class="mt-1 iv-replace-mcq-choice" data-choice-index="${i}" />
                <span>${escapeHtml(choice)}</span>
              </label>
            `).join('')}
          </div>
        </div>`
        : '';

    return `
      <div class="challenge-gate iv-replace-challenge space-y-3 text-left" data-challenge="iv-replace">
        ${challengeMediaHtml('iv-replace') || challengeMediaHtml('ivpb-hang') || ''}
        <p class="text-sm text-gray-800">${escapeHtml(replaceTitleForKind(kind))}: <strong>${escapeHtml(taskName || 'IV')}</strong></p>
        <p class="text-xs text-gray-500">Watch the flash for primary bag setup (some steps are distractors). After Ready: answer the tubing sticker question, then build the next ${r.nextCount} ${nextWord}.</p>
        <div class="rounded border border-rose-200 bg-rose-50 p-3 text-center">
          <div id="iv-replace-flash" class="text-lg font-semibold text-rose-900 min-h-[1.75rem]">…</div>
          <p class="text-xs text-rose-800 mt-1">
            Hint views left: <span id="iv-replace-hints">${cfg().hintViews ?? 3}</span>
          </p>
          <div class="mt-2 flex items-center justify-center gap-2 text-xs text-rose-900">
            <label for="iv-replace-speed" class="whitespace-nowrap">Preview speed</label>
            <input id="iv-replace-speed" type="range"
              min="${Number(cfg().flashSpeedMinPct) || 50}"
              max="${Number(cfg().flashSpeedMaxPct) || 150}"
              value="100" step="10" class="w-28 accent-rose-600" />
            <span id="iv-replace-speed-label" class="tabular-nums w-10 text-left">100%</span>
          </div>
          <button type="button" id="iv-replace-ready"
            class="mt-2 px-3 py-1 rounded bg-rose-600 text-white text-sm hover:bg-rose-700">Ready</button>
        </div>
        <div id="iv-replace-build" class="hidden space-y-3">
          ${mcqHtml}
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-800">
              Given: <strong>${escapeHtml(r.anchorLabel)}</strong>
            </p>
            <p class="text-sm text-gray-800">Click the next ${r.nextCount} ${nextWord} in order. Some options are distractors. Click a chosen step to remove it.</p>
            <div id="iv-replace-chosen" class="min-h-[2rem] flex flex-wrap gap-1 text-sm"></div>
            <div id="iv-replace-options" class="flex flex-wrap gap-1">${optionHtml}</div>
            <button type="button" id="iv-replace-undo" class="text-xs text-gray-500 underline">Undo last</button>
          </div>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
      </div>
    `;
}

export function wireIvReplaceHandlers({ onDone, onStarted, random = Math.random, round } = {}) {
    const flashEl = document.querySelector('#iv-replace-flash');
    const hintsEl = document.querySelector('#iv-replace-hints');
    const readyBtn = document.querySelector('#iv-replace-ready');
    const build = document.querySelector('#iv-replace-build');
    const chosenEl = document.querySelector('#iv-replace-chosen');
    const optionsEl = document.querySelector('#iv-replace-options');
    const feedback = document.querySelector('#challenge-feedback');
    const undoBtn = document.querySelector('#iv-replace-undo');
    const speedInput = document.querySelector('#iv-replace-speed');
    const speedLabel = document.querySelector('#iv-replace-speed-label');

    const activeRound = round || buildIvReplaceRound(random);
    const need = activeRound.expectedNext.length;
    let hintsLeft = Number(cfg().hintViews) || 3;
    let flashing = true;
    let flashTimer = null;
    let speedPct = Number(speedInput?.value) || 100;
    let hasStarted = false;
    const pool = activeRound.flashPool?.length
        ? activeRound.flashPool
        : shuffle(getIvReplaceFlashPool(), random);
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
                `<button type="button" class="iv-replace-chosen-step px-2 py-0.5 rounded bg-white border text-xs hover:border-rose-400 hover:bg-rose-50"
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

    function readMcqChoice() {
        const selected = document.querySelector('input[name="iv-replace-tubing"]:checked');
        return selected ? String(selected.value) : '';
    }

    function selectMcqCorrect() {
        const correct = String(activeRound.mcq?.correct || '');
        document.querySelectorAll('input[name="iv-replace-tubing"]').forEach((input) => {
            input.checked = String(input.value) === correct;
        });
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
            if (flashEl) flashEl.textContent = 'Bag empty — replace setup below';
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
            build?.classList.add('hidden');
            flashIdx = 0;
            startFlash({ paintNow: true });
            if (readyBtn) readyBtn.textContent = 'Ready';
        }
    });

    optionsEl?.querySelectorAll('.iv-replace-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
            const label = btn.getAttribute('data-label');
            if (!label || chosen.length >= need) return;
            chosen.push(label);
            paintChosen();
        });
    });

    chosenEl?.addEventListener('click', (ev) => {
        const stepBtn = ev.target?.closest?.('.iv-replace-chosen-step');
        if (!stepBtn || !chosenEl.contains(stepBtn)) return;
        removeChosenAt(Number(stepBtn.getAttribute('data-idx')));
    });

    undoBtn?.addEventListener('click', () => {
        removeChosenAt(chosen.length - 1);
    });

    window.ivReplaceSubmit = () => {
        stopFlash();
        const mcqCorrect = String(activeRound.mcq?.correct || '').trim().toLowerCase();
        const mcqGot = readMcqChoice().trim().toLowerCase();
        if (activeRound.mcq && mcqGot !== mcqCorrect) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-emerald-700');
                feedback.classList.add('text-rose-600');
                feedback.textContent = mcqGot
                    ? 'Incorrect tubing answer — check the date sticker question, then submit again.'
                    : 'Select an answer for the tubing date sticker question.';
            }
            onDone?.({
                passed: false,
                reason: 'iv-replace-mcq-incorrect'
            });
            return;
        }
        const grade = gradeIvReplaceOrder(chosen, activeRound.expectedNext);
        if (grade.passed) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-rose-600');
                feedback.classList.add('text-emerald-700');
                feedback.textContent = GameConfig.challengeCopy?.passedFeedback
                    || 'You passed. Task being completed.';
            }
            onDone?.({ passed: true, grade, reason: 'iv-replace-correct' });
            return;
        }
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
            reason: 'iv-replace-incorrect',
            expected: grade.expectedLabels.join(' → ')
        });
    };

    /** Practice aid: fill MCQ + next steps; player still presses Submit. */
    window.ivReplaceCheat = () => {
        stopFlash();
        if (flashEl) flashEl.textContent = 'Bag empty — replace setup below';
        build?.classList.remove('hidden');
        markStarted();
        selectMcqCorrect();
        chosen.length = 0;
        activeRound.expectedNext.forEach((label) => {
            chosen.push(label);
        });
        paintChosen();
        if (feedback) {
            feedback.classList.remove('hidden', 'text-rose-600');
            feedback.classList.add('text-emerald-700');
            feedback.textContent = 'Cheat filled tubing answer + next steps — press Submit when ready.';
        }
    };

    return () => {
        stopFlash();
        delete window.ivReplaceSubmit;
        delete window.ivReplaceCheat;
    };
}

const IvReplaceChallenge = {
    isIvReplaceTask,
    gradeIvReplaceOrder,
    buildIvReplaceRound,
    renderIvReplaceHtml,
    wireIvReplaceHandlers,
    getIvReplaceSequence
};

export default IvReplaceChallenge;
