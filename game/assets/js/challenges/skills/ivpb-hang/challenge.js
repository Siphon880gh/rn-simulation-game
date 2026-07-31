/**
 * IVPB hang sequence mini-game — spike → secondary → Y-site → backprime → drip check.
 * Author content: ./config.js (challenges/skills/ivpb-hang/)
 */
import { GameConfig } from '../../../game-config.js';
import { ivpbHangChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.ivpbHangChallenge || ivpbHangChallengeConfig || {};
}

export function getIvpbHangSequence() {
    return Array.isArray(cfg().sequence) && cfg().sequence.length
        ? cfg().sequence
        : ivpbHangChallengeConfig.sequence;
}

export function getIvpbFlashPool() {
    const seq = getIvpbHangSequence().map((s) => s.label);
    const distractors = Array.isArray(cfg().distractors) && cfg().distractors.length
        ? cfg().distractors
        : ivpbHangChallengeConfig.distractors;
    return [...seq, ...distractors];
}

export function isIvpbTask(task) {
    if (!task) return false;
    const challenge = String(task.metadata?.challenge || '').toLowerCase();
    if (challenge === 'ivpb' || challenge === 'ivpb-hang') return true;
    const route = String(task.metadata?.route || '').toLowerCase();
    if (route === 'ivpb' || route === 'piggyback') return true;
    const name = String(task.name || '');
    return /ivpb|piggyback|iv\s*piggy/i.test(name);
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
export function gradeIvpbHangOrder(playerLabels, sequence = getIvpbHangSequence()) {
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
        expectedLabels: sequence.map((s) => s.label)
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderIvpbHangHtml(taskName) {
    const sequence = getIvpbHangSequence();
    const options = shuffle([...new Set(getIvpbFlashPool())]);
    const optionHtml = options.map((label) => `
      <button type="button" class="ivpb-hang-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-indigo-50"
        data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
    `).join('');

    return `
      <div class="challenge-gate ivpb-hang-challenge space-y-3 text-left" data-challenge="ivpb-hang">
        ${challengeMediaHtml('ivpb-hang')}
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-sm text-gray-800">Hang IVPB: <strong>${escapeHtml(taskName || 'IVPB')}</strong></p>
        <p class="text-xs text-gray-500">Watch the flash, then build the hang sequence in order.</p>
        <div class="rounded border border-indigo-200 bg-indigo-50 p-3 text-center">
          <div id="ivpb-hang-flash" class="text-lg font-semibold text-indigo-900 min-h-[1.75rem]">…</div>
          <p class="text-xs text-indigo-800 mt-1">
            Hint views left: <span id="ivpb-hang-hints">${cfg().hintViews ?? 3}</span>
          </p>
          <div class="mt-2 flex items-center justify-center gap-2 text-xs text-indigo-900">
            <label for="ivpb-hang-speed" class="whitespace-nowrap">Preview speed</label>
            <input id="ivpb-hang-speed" type="range"
              min="${Number(cfg().flashSpeedMinPct) || 50}"
              max="${Number(cfg().flashSpeedMaxPct) || 150}"
              value="100" step="10" class="w-28 accent-indigo-600" />
            <span id="ivpb-hang-speed-label" class="tabular-nums w-10 text-left">100%</span>
          </div>
          <button type="button" id="ivpb-hang-ready"
            class="mt-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Ready</button>
        </div>
        <div id="ivpb-hang-build" class="hidden space-y-2">
          <p class="text-sm font-medium text-gray-800">Build the IVPB hang sequence (click in order)</p>
          <div id="ivpb-hang-chosen" class="min-h-[2rem] flex flex-wrap gap-1 text-sm"></div>
          <div id="ivpb-hang-options" class="flex flex-wrap gap-1">${optionHtml}</div>
          <button type="button" id="ivpb-hang-undo" class="text-xs text-gray-500 underline">Undo last</button>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
        <ol id="ivpb-hang-answer-key" class="hidden text-xs text-gray-600 list-decimal pl-5"></ol>
      </div>
    `;
}

/**
 * Wire DOM after modal open. Calls onDone({ passed, grade, reason, expected? }).
 */
export function wireIvpbHangHandlers({ onDone, random = Math.random } = {}) {
    const flashEl = document.querySelector('#ivpb-hang-flash');
    const hintsEl = document.querySelector('#ivpb-hang-hints');
    const readyBtn = document.querySelector('#ivpb-hang-ready');
    const build = document.querySelector('#ivpb-hang-build');
    const chosenEl = document.querySelector('#ivpb-hang-chosen');
    const optionsEl = document.querySelector('#ivpb-hang-options');
    const feedback = document.querySelector('#challenge-feedback');
    const undoBtn = document.querySelector('#ivpb-hang-undo');
    const speedInput = document.querySelector('#ivpb-hang-speed');
    const speedLabel = document.querySelector('#ivpb-hang-speed-label');

    let hintsLeft = Number(cfg().hintViews) || 3;
    let flashing = true;
    let flashTimer = null;
    let speedPct = Number(speedInput?.value) || 100;
    const pool = shuffle(getIvpbFlashPool(), random);
    let flashIdx = 0;
    const chosen = [];

    function paintChosen() {
        if (!chosenEl) return;
        chosenEl.innerHTML = chosen.length
            ? chosen.map((label, i) => `<span class="px-2 py-0.5 rounded bg-white border text-xs" data-idx="${i}">${i + 1}. ${escapeHtml(label)}</span>`).join('')
            : '<span class="text-gray-400 text-xs">No steps yet</span>';
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

    optionsEl?.querySelectorAll('.ivpb-hang-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
            const label = btn.getAttribute('data-label');
            if (!label || chosen.length >= getIvpbHangSequence().length) return;
            chosen.push(label);
            paintChosen();
        });
    });

    undoBtn?.addEventListener('click', () => {
        chosen.pop();
        paintChosen();
    });

    window.ivpbHangSubmit = () => {
        stopFlash();
        const grade = gradeIvpbHangOrder(chosen);
        if (grade.passed) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-rose-600');
                feedback.classList.add('text-emerald-700');
                feedback.textContent = GameConfig.challengeCopy?.passedFeedback
                    || 'You passed. Task being completed.';
            }
            onDone?.({ passed: true, grade, reason: 'ivpb-hang-correct' });
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
            reason: 'ivpb-hang-incorrect',
            expected: grade.expectedLabels.join(' → ')
        });
    };

    /** Practice aid: fill correct sequence; player still presses Submit. */
    window.ivpbHangCheat = () => {
        stopFlash();
        if (flashEl) flashEl.textContent = 'Sequence locked — assemble below';
        build?.classList.remove('hidden');
        chosen.length = 0;
        getIvpbHangSequence().forEach((step) => {
            chosen.push(step.label);
        });
        paintChosen();
        if (feedback) {
            feedback.classList.remove('hidden', 'text-rose-600');
            feedback.classList.add('text-emerald-700');
            feedback.textContent = 'Cheat filled the correct sequence — press Submit when ready.';
        }
    };

    return () => {
        stopFlash();
        delete window.ivpbHangSubmit;
        delete window.ivpbHangCheat;
    };
}

const IvpbHangChallenge = {
    isIvpbTask,
    gradeIvpbHangOrder,
    renderIvpbHangHtml,
    wireIvpbHangHandlers,
    getIvpbHangSequence
};

export default IvpbHangChallenge;
