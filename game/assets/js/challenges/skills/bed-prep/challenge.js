/**
 * Bed setup for admission mini-game (E5.M3) — gather required items (no sequence).
 * Author content: ./config.js (challenges/skills/bed-prep/)
 * Spec: AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md
 */
import { GameConfig } from '../../../game-config.js';
import { bedPrepChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.bedPrepChallenge || bedPrepChallengeConfig || {};
}

/** @deprecated use getBedPrepRequired — kept for callers that still expect sequence shape */
export function getBedPrepSequence() {
    return getBedPrepRequired().map((label) => ({ letter: label[0] || '?', label }));
}

export function getBedPrepRequired() {
    const fromCfg = cfg().requiredItems || cfg().sequence?.map((s) => (typeof s === 'string' ? s : s.label));
    return Array.isArray(fromCfg) && fromCfg.length
        ? fromCfg.map(String)
        : [...bedPrepChallengeConfig.requiredItems];
}

export function getDistractorPool() {
    return Array.isArray(cfg().distractors) && cfg().distractors.length
        ? cfg().distractors.map(String)
        : [...bedPrepChallengeConfig.distractors];
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

/**
 * Build one gather round: fixed required set + random distractors mixed into options.
 * Flash pool = required + distractors (memory cue for what to gather).
 */
export function buildBedPrepRound(random = Math.random) {
    const required = [...getBedPrepRequired()];
    const distractorPool = getDistractorPool().filter(
        (d) => !required.some((r) => r.toLowerCase() === String(d).toLowerCase())
    );
    const minD = Number(cfg().distractorCountMin);
    const maxD = Number(cfg().distractorCountMax);
    const lo = Number.isFinite(minD) ? minD : 3;
    const hi = Number.isFinite(maxD) ? Math.max(lo, maxD) : 5;
    const count = Math.min(
        distractorPool.length,
        lo + Math.floor(random() * (hi - lo + 1))
    );
    const distractors = shuffle(distractorPool, random).slice(0, count);
    const options = shuffle([...required, ...distractors], random);
    return { required, distractors, options, flashPool: shuffle([...required, ...distractors], random) };
}

/** Set equality: selected must match required (order ignored; no extras). */
export function gradeBedPrepGather(selectedLabels, requiredLabels = getBedPrepRequired()) {
    const required = [...new Set((requiredLabels || []).map((s) => String(s).trim().toLowerCase()))];
    const got = [...new Set((selectedLabels || []).map((s) => String(s).trim().toLowerCase()))];
    const missing = required.filter((r) => !got.includes(r));
    const extras = got.filter((g) => !required.includes(g));
    return {
        passed: missing.length === 0 && extras.length === 0 && got.length === required.length,
        missing,
        extras,
        expectedLabels: requiredLabels.map(String)
    };
}

/** @deprecated use gradeBedPrepGather — order no longer scored */
export function gradeBedPrepOrder(playerLabels, sequence = getBedPrepSequence()) {
    const required = sequence.map((s) => (typeof s === 'string' ? s : s.label));
    const grade = gradeBedPrepGather(playerLabels, required);
    return {
        passed: grade.passed,
        wrongIndexes: grade.passed ? [] : playerLabels.map((_, i) => i),
        expectedLabels: grade.expectedLabels,
        mnemonic: 'gather',
        missing: grade.missing,
        extras: grade.extras
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderBedPrepHtml(taskName, round) {
    const r = round || buildBedPrepRound();
    const optionHtml = r.options.map((label) => `
      <button type="button" class="bed-prep-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-amber-50"
        data-label="${escapeHtml(label)}" aria-pressed="false">${escapeHtml(label)}</button>
    `).join('');

    return `
      <div class="challenge-gate bed-prep-challenge space-y-3 text-left" data-challenge="bed-prep">
        ${challengeMediaHtml('bed-prep')}
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-sm text-gray-800">Get a bed ready for admission: <strong>${escapeHtml(taskName || 'Bed prep')}</strong></p>
        <p class="text-xs text-gray-500">Watch the flash for what you need, then gather the items (order does not matter).</p>
        <div class="rounded border border-amber-200 bg-amber-50 p-3 text-center">
          <div id="bed-prep-flash" class="text-lg font-semibold text-amber-900 min-h-[1.75rem]">…</div>
          <p class="text-xs text-amber-800 mt-1">
            Hint views left: <span id="bed-prep-hints">${cfg().hintViews ?? 3}</span>
          </p>
          <div class="mt-2 flex items-center justify-center gap-2 text-xs text-amber-900">
            <label for="bed-prep-speed" class="whitespace-nowrap">Preview speed</label>
            <input id="bed-prep-speed" type="range"
              min="${Number(cfg().flashSpeedMinPct) || 50}"
              max="${Number(cfg().flashSpeedMaxPct) || 150}"
              value="100" step="10" class="w-28 accent-amber-600" />
            <span id="bed-prep-speed-label" class="tabular-nums w-10 text-left">100%</span>
          </div>
          <button type="button" id="bed-prep-ready"
            class="mt-2 px-3 py-1 rounded bg-amber-600 text-white text-sm hover:bg-amber-700">Ready</button>
        </div>
        <div id="bed-prep-build" class="hidden space-y-2">
          <p class="text-sm font-medium text-gray-800">Gather these items</p>
          <p class="text-xs text-gray-500">Click to select / deselect. Need ${r.required.length} items.</p>
          <div id="bed-prep-chosen" class="min-h-[2rem] flex flex-wrap gap-1 text-sm"></div>
          <div id="bed-prep-options" class="flex flex-wrap gap-1">${optionHtml}</div>
          <button type="button" id="bed-prep-clear" class="text-xs text-gray-500 underline">Clear selection</button>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
        <ul id="bed-prep-answer-key" class="hidden text-xs text-gray-600 list-disc pl-5"></ul>
      </div>
    `;
}

/**
 * Wire DOM after modal open. Calls onDone({ passed, grade, reason }).
 * Pass the same `round` used in renderBedPrepHtml when available.
 */
export function wireBedPrepHandlers({ onDone, onStarted, random = Math.random, round } = {}) {
    const flashEl = document.querySelector('#bed-prep-flash');
    const hintsEl = document.querySelector('#bed-prep-hints');
    const readyBtn = document.querySelector('#bed-prep-ready');
    const build = document.querySelector('#bed-prep-build');
    const chosenEl = document.querySelector('#bed-prep-chosen');
    const optionsEl = document.querySelector('#bed-prep-options');
    const feedback = document.querySelector('#challenge-feedback');
    const answerKey = document.querySelector('#bed-prep-answer-key');
    const clearBtn = document.querySelector('#bed-prep-clear');
    const speedInput = document.querySelector('#bed-prep-speed');
    const speedLabel = document.querySelector('#bed-prep-speed-label');

    const activeRound = round || buildBedPrepRound(random);
    let hintsLeft = Number(cfg().hintViews) || 3;
    let flashing = true;
    let flashTimer = null;
    let speedPct = Number(speedInput?.value) || 100;
    let hasStarted = false;
    const pool = activeRound.flashPool?.length
        ? activeRound.flashPool
        : shuffle([...activeRound.required, ...activeRound.distractors], random);
    let flashIdx = 0;
    /** @type {Set<string>} */
    const selected = new Set();

    function markStarted() {
        if (hasStarted) return;
        hasStarted = true;
        onStarted?.();
    }

    function paintChosen() {
        if (!chosenEl) return;
        const labels = [...selected];
        chosenEl.innerHTML = labels.length
            ? labels.map((label) => `<span class="px-2 py-0.5 rounded bg-white border text-xs">${escapeHtml(label)}</span>`).join('')
            : '<span class="text-gray-400 text-xs">No items selected</span>';
    }

    function paintOptionState(btn) {
        const label = btn.getAttribute('data-label');
        const on = label && selected.has(label);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('bg-amber-100', Boolean(on));
        btn.classList.toggle('border-amber-500', Boolean(on));
        btn.classList.toggle('ring-2', Boolean(on));
        btn.classList.toggle('ring-amber-400', Boolean(on));
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
            if (flashEl) flashEl.textContent = 'Gather the items you need below';
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
            // Hide gather panel so the next hint view clearly shows flash items again.
            build?.classList.add('hidden');
            flashIdx = 0;
            startFlash({ paintNow: true });
            if (readyBtn) readyBtn.textContent = 'Ready';
        }
    });

    optionsEl?.querySelectorAll('.bed-prep-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
            const label = btn.getAttribute('data-label');
            if (!label) return;
            if (selected.has(label)) selected.delete(label);
            else selected.add(label);
            paintOptionState(btn);
            paintChosen();
        });
    });

    clearBtn?.addEventListener('click', () => {
        selected.clear();
        optionsEl?.querySelectorAll('.bed-prep-pick').forEach((btn) => paintOptionState(btn));
        paintChosen();
    });

    window.bedPrepSubmit = () => {
        stopFlash();
        const grade = gradeBedPrepGather([...selected], activeRound.required);
        if (grade.passed) {
            if (feedback) {
                feedback.classList.remove('hidden', 'text-rose-600');
                feedback.classList.add('text-emerald-700');
                feedback.textContent = GameConfig.challengeCopy?.passedFeedback
                    || 'You passed. Task being completed.';
            }
            onDone?.({ passed: true, grade, reason: 'bed-prep-correct' });
            return;
        }
        if (feedback) {
            feedback.classList.remove('hidden');
            feedback.textContent = 'Incorrect gather — task not completed. Needed items shown below.';
        }
        if (answerKey) {
            answerKey.classList.remove('hidden');
            answerKey.innerHTML = grade.expectedLabels
                .map((label) => `<li>${escapeHtml(label)}</li>`)
                .join('');
        }
        optionsEl?.querySelectorAll('.bed-prep-pick').forEach((btn) => {
            const label = String(btn.getAttribute('data-label') || '').toLowerCase();
            const needed = grade.expectedLabels.some((e) => e.toLowerCase() === label);
            const on = selected.has(btn.getAttribute('data-label') || '');
            if (on && !needed) {
                btn.classList.add('border-rose-500', 'bg-rose-50');
            }
            if (needed && !on) {
                btn.classList.add('border-emerald-500', 'bg-emerald-50');
            }
        });
        onDone?.({
            passed: false,
            grade,
            reason: 'bed-prep-incorrect',
            expected: grade.expectedLabels.join(', ')
        });
    };

    /** Practice aid: select all required items; player still presses Submit. */
    window.bedPrepCheat = () => {
        stopFlash();
        if (flashEl) flashEl.textContent = 'Gather the items you need below';
        build?.classList.remove('hidden');
        markStarted();
        selected.clear();
        activeRound.required.forEach((label) => selected.add(label));
        optionsEl?.querySelectorAll('.bed-prep-pick').forEach((btn) => paintOptionState(btn));
        paintChosen();
        if (feedback) {
            feedback.classList.remove('hidden', 'text-rose-600');
            feedback.classList.add('text-emerald-700');
            feedback.textContent = 'Cheat selected the correct items — press Submit when ready.';
        }
    };

    return () => {
        stopFlash();
        delete window.bedPrepSubmit;
        delete window.bedPrepCheat;
    };
}

const BedPrepChallenge = {
    isBedPrepTask,
    gradeBedPrepGather,
    gradeBedPrepOrder,
    renderBedPrepHtml,
    wireBedPrepHandlers,
    getBedPrepRequired,
    getBedPrepSequence,
    buildBedPrepRound
};

export default BedPrepChallenge;
