/**
 * Code Blue mini-game (E5.M4) — random practice questions (choice or BLS order).
 * Author content: ./config.js (challenges/emergencies/code-blue/)
 * Triggered from E4 deterioration escalate, not from every Perform.
 */
import { GameConfig } from '../../../game-config.js';
import { codeBlueChallengeConfig } from './config.js';
import { renderChallengeLevelControl } from '../../shared/copy-config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.codeBlueChallenge || codeBlueChallengeConfig || {};
}

export function getCodeBlueSteps() {
    return Array.isArray(cfg().steps) && cfg().steps.length
        ? cfg().steps
        : codeBlueChallengeConfig.steps;
}

export function getCodeBlueOptionPool() {
    const steps = getCodeBlueSteps().map((s) => s.label);
    const distractors = Array.isArray(cfg().distractors) && cfg().distractors.length
        ? cfg().distractors
        : codeBlueChallengeConfig.distractors;
    return [...steps, ...distractors];
}

export function getCodeBlueQuestions() {
    const list = cfg().questions;
    return Array.isArray(list) && list.length ? list : codeBlueChallengeConfig.questions;
}

export function shuffle(list, random = Math.random) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function getCodeBluePoolSize() {
    return getCodeBlueQuestions().length;
}

/** Question ids in config order (caller should shuffle for a run). */
export function getCodeBlueQuestionIds() {
    return getCodeBlueQuestions()
        .map((q) => q?.id)
        .filter((id) => id != null && id !== '')
        .map(String);
}

/** Pick a question by id, or random; optionally exclude id(s) so Random / multi-q advances change the prompt. */
export function pickCodeBlueQuestion(opts = {}) {
    const pool = getCodeBlueQuestions();
    if (opts.questionId != null && opts.questionId !== '') {
        const wanted = String(opts.questionId);
        const exact = pool.find((q) => String(q.id) === wanted);
        if (exact) return exact;
    }
    const exclude = new Set(
        [opts.excludeId, ...(Array.isArray(opts.excludeIds) ? opts.excludeIds : [])]
            .filter((id) => id != null && id !== '')
            .map(String)
    );
    let candidates = exclude.size
        ? pool.filter((q) => !exclude.has(String(q.id)))
        : pool;
    if (!candidates.length && opts.excludeId != null) {
        candidates = pool.filter((q) => String(q.id) !== String(opts.excludeId));
    }
    if (!candidates.length) candidates = pool;
    const roll = typeof opts.random === 'function' ? opts.random() : Math.random();
    const idx = Math.min(candidates.length - 1, Math.floor(roll * candidates.length));
    return candidates[idx];
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

export function gradeCodeBlueChoice(answer, question) {
    const expected = String(question?.correct || '').trim();
    const got = String(answer || '').trim();
    return {
        passed: Boolean(expected) && got.toLowerCase() === expected.toLowerCase(),
        expectedLabels: [expected],
        expected
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderChoiceBody(question) {
    const choices = shuffle([...(question.choices || [])]);
    const choiceHtml = choices.map((label) => `
      <button type="button" class="code-blue-choice w-full text-left px-3 py-2 rounded border border-gray-200 text-sm hover:bg-sky-50"
        data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
    `).join('');
    return `
      <p class="text-sm text-gray-800" id="code-blue-prompt">${escapeHtml(question.prompt)}</p>
      <div id="code-blue-choices" class="flex flex-col gap-2">${choiceHtml}</div>
      <p class="text-xs text-gray-500">Selected: <span id="code-blue-selected" class="font-medium text-gray-800">none</span></p>
    `;
}

function renderOrderBody(question) {
    const steps = getCodeBlueSteps();
    const options = shuffle([...new Set(getCodeBlueOptionPool())]);
    const optionHtml = options.map((label) => `
      <button type="button" class="code-blue-pick px-2 py-1 rounded border border-gray-200 text-sm hover:bg-sky-50"
        data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
    `).join('');
    return `
      <p class="text-sm text-gray-800" id="code-blue-prompt">${escapeHtml(question.prompt || `Order the first response priorities (1 → ${steps.length}):`)}</p>
      <div id="code-blue-chosen" class="min-h-[2rem] flex flex-col gap-1 text-sm"></div>
      <div id="code-blue-options" class="flex flex-wrap gap-1">${optionHtml}</div>
      <button type="button" id="code-blue-undo" class="text-xs text-gray-500 underline">Undo last</button>
    `;
}

export function renderCodeBlueHtml(patientName, question, opts = {}) {
    const q = question || pickCodeBlueQuestion();
    const poolSize = Number(opts.poolSize) || getCodeBluePoolSize() || 1;
    const levelHtml = poolSize > 1
        ? (opts.levelHtml || renderChallengeLevelControl(poolSize, opts.selectedLevel || 1))
        : '';
    const body = q.type === 'order' ? renderOrderBody(q) : renderChoiceBody(q);
    const mediaHtml = challengeMediaHtml('code-blue');
    return `
      <div class="challenge-gate code-blue-challenge space-y-3 text-left" data-challenge="code-blue" data-question-id="${escapeHtml(q.id)}" data-pool-size="${poolSize}">
        ${levelHtml}
        ${mediaHtml}
        <p class="text-sm text-sky-800 font-medium">Code Blue — ${escapeHtml(patientName || 'patient')}</p>
        <div id="code-blue-body">${body}</div>
        <p class="text-xs text-gray-500">Give up on this prompt? Use <strong>Random</strong> for another Code Blue question.</p>
        <p id="challenge-feedback" class="text-sm hidden" role="status" aria-live="polite"></p>
        <ol id="code-blue-answer-key" class="hidden text-xs text-gray-600 list-decimal pl-5"></ol>
      </div>
    `;
}

function setFeedback(message, { ok = false } = {}) {
    const feedback = document.querySelector('#challenge-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove(
        'hidden',
        'text-rose-600',
        'text-rose-700',
        'text-emerald-700',
        'text-emerald-800',
        'bg-rose-50',
        'bg-emerald-50',
        'border',
        'border-rose-200',
        'border-emerald-200'
    );
    feedback.classList.add(
        'border',
        ok ? 'text-emerald-800' : 'text-rose-700',
        ok ? 'bg-emerald-50' : 'bg-rose-50',
        ok ? 'border-emerald-200' : 'border-rose-200'
    );
}

/**
 * Wire pick/undo/submit/random/cheat. Returns cleanup fn.
 * @param {{
 *   onDone: (r: object) => void,
 *   patientName?: string,
 *   initialQuestion?: object,
 *   excludeIds?: string[],
 *   onAdvanceQuestion?: (q: object) => void
 * }} opts
 */
export function wireCodeBlueHandlers({
    onDone,
    patientName = 'patient',
    initialQuestion,
    excludeIds = [],
    onAdvanceQuestion,
    questionDeck = null
} = {}) {
    const root = document.querySelector('.code-blue-challenge');
    let question = initialQuestion || pickCodeBlueQuestion();
    let chosen = [];
    let selectedChoice = null;
    const seenIds = new Set(
        [...excludeIds, question?.id].filter((id) => id != null && id !== '').map(String)
    );
    const deck = Array.isArray(questionDeck) && questionDeck.length
        ? questionDeck.map(String)
        : null;
    let deckIndex = question?.id != null && deck
        ? Math.max(0, deck.indexOf(String(question.id)))
        : 0;

    const answerKey = () => document.querySelector('#code-blue-answer-key');

    function paintOrderChosen() {
        const chosenEl = document.querySelector('#code-blue-chosen');
        if (!chosenEl) return;
        chosenEl.innerHTML = chosen.map((label, i) => `
          <div class="px-2 py-1 rounded bg-sky-50 border border-sky-100">${i + 1}. ${escapeHtml(label)}</div>
        `).join('') || '<span class="text-xs text-gray-400">Tap actions in order…</span>';
    }

    function bindChoiceHandlers() {
        const host = document.querySelector('#code-blue-choices');
        host?.querySelectorAll('.code-blue-choice').forEach((btn) => {
            btn.addEventListener('click', () => {
                selectedChoice = btn.getAttribute('data-label');
                host.querySelectorAll('.code-blue-choice').forEach((b) => {
                    b.classList.remove('ring-2', 'ring-sky-400', 'bg-sky-50');
                });
                btn.classList.add('ring-2', 'ring-sky-400', 'bg-sky-50');
                const sel = document.querySelector('#code-blue-selected');
                if (sel) sel.textContent = selectedChoice || 'none';
            });
        });
    }

    function bindOrderHandlers() {
        const optionsEl = document.querySelector('#code-blue-options');
        const undoBtn = document.querySelector('#code-blue-undo');
        const steps = getCodeBlueSteps();

        optionsEl?.addEventListener('click', (e) => {
            const btn = e.target?.closest?.('.code-blue-pick');
            if (!btn || chosen.length >= steps.length) return;
            chosen.push(btn.getAttribute('data-label'));
            btn.disabled = true;
            btn.classList.add('opacity-40');
            paintOrderChosen();
        });

        undoBtn?.addEventListener('click', () => {
            const last = chosen.pop();
            if (!last) return;
            optionsEl?.querySelectorAll('.code-blue-pick').forEach((btn) => {
                if (btn.getAttribute('data-label') === last && btn.disabled) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-40');
                }
            });
            paintOrderChosen();
        });

        paintOrderChosen();
    }

    function mountQuestion(next) {
        question = next;
        chosen = [];
        selectedChoice = null;
        if (root) root.setAttribute('data-question-id', question.id || '');
        const body = document.querySelector('#code-blue-body');
        if (body) {
            body.innerHTML = question.type === 'order'
                ? renderOrderBody(question)
                : renderChoiceBody(question);
        }
        const key = answerKey();
        if (key) {
            key.classList.add('hidden');
            key.innerHTML = '';
        }
        const feedback = document.querySelector('#challenge-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
        }
        if (question.type === 'order') bindOrderHandlers();
        else bindChoiceHandlers();
    }

    mountQuestion(question);

    window.codeBlueSubmit = () => {
        if (question.type === 'order') {
            const grade = gradeCodeBlueOrder(chosen, getCodeBlueSteps());
            if (grade.passed) {
                onDone?.({
                    passed: true,
                    grade,
                    reason: 'code-blue-correct',
                    expected: grade.expectedLabels.join(' → '),
                    given: chosen.join(' → '),
                    prompt: question.prompt || question.stem,
                    questionId: question.id
                });
                return;
            }
            const key = answerKey();
            if (key) {
                key.innerHTML = grade.expectedLabels.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
                key.classList.remove('hidden');
            }
            document.querySelectorAll('#code-blue-chosen div').forEach((row, i) => {
                if (grade.wrongIndexes.includes(i)) {
                    row.classList.add('bg-rose-100', 'border-rose-300');
                }
            });
            onDone?.({
                passed: false,
                grade,
                reason: 'code-blue-incorrect',
                expected: grade.expectedLabels.join(' → '),
                given: chosen.join(' → ') || '—',
                prompt: question.prompt || question.stem,
                questionId: question.id
            });
            return;
        }

        if (!selectedChoice) {
            setFeedback('Select an answer, then press Submit.');
            return;
        }
        const grade = gradeCodeBlueChoice(selectedChoice, question);
        if (grade.passed) {
            onDone?.({
                passed: true,
                grade,
                reason: 'code-blue-correct',
                expected: grade.expected,
                given: selectedChoice,
                prompt: question.prompt || question.stem,
                questionId: question.id
            });
            return;
        }
        const key = answerKey();
        if (key) {
            key.innerHTML = `<li>${escapeHtml(grade.expected)}</li>`;
            key.classList.remove('hidden');
        }
        onDone?.({
            passed: false,
            grade,
            reason: 'code-blue-incorrect',
            expected: grade.expected,
            given: selectedChoice,
            prompt: question.prompt || question.stem,
            questionId: question.id
        });
    };

    /** Practice aid: fill correct answer; player still presses Submit. */
    window.codeBlueCheat = () => {
        if (question.type === 'order') {
            const steps = getCodeBlueSteps();
            const optionsEl = document.querySelector('#code-blue-options');
            chosen.length = 0;
            optionsEl?.querySelectorAll('.code-blue-pick').forEach((btn) => {
                btn.disabled = false;
                btn.classList.remove('opacity-40');
            });
            steps.forEach((step) => {
                const label = step.label;
                chosen.push(label);
                optionsEl?.querySelectorAll('.code-blue-pick').forEach((btn) => {
                    if (btn.getAttribute('data-label') === label) {
                        btn.disabled = true;
                        btn.classList.add('opacity-40');
                    }
                });
            });
            paintOrderChosen();
            setFeedback('Cheat filled the correct order — press Submit when ready.', { ok: true });
            return;
        }

        selectedChoice = question.correct;
        const host = document.querySelector('#code-blue-choices');
        host?.querySelectorAll('.code-blue-choice').forEach((btn) => {
            const match = btn.getAttribute('data-label') === selectedChoice;
            btn.classList.toggle('ring-2', match);
            btn.classList.toggle('ring-sky-400', match);
            btn.classList.toggle('bg-sky-50', match);
        });
        const sel = document.querySelector('#code-blue-selected');
        if (sel) sel.textContent = selectedChoice || 'none';
        setFeedback('Cheat selected the correct answer — press Submit when ready.', { ok: true });
    };

    function loadNextQuestion({ excludeCurrentOnly = false } = {}) {
        let next = null;
        if (deck?.length) {
            if (excludeCurrentOnly) {
                const cur = String(question?.id || '');
                const others = deck.filter((id) => id !== cur);
                if (others.length) {
                    const pick = others[Math.floor(Math.random() * others.length)];
                    next = pickCodeBlueQuestion({ questionId: pick });
                    const idx = deck.indexOf(String(pick));
                    if (idx >= 0) deckIndex = idx;
                }
            } else {
                let i = deckIndex + 1;
                while (i < deck.length) {
                    const candidate = pickCodeBlueQuestion({ questionId: deck[i] });
                    deckIndex = i;
                    if (candidate) {
                        next = candidate;
                        break;
                    }
                    i += 1;
                }
            }
        }
        if (!next) {
            next = pickCodeBlueQuestion({
                excludeId: question.id,
                excludeIds: excludeCurrentOnly ? [] : [...seenIds]
            });
        }
        if (next?.id) seenIds.add(String(next.id));
        mountQuestion(next);
        onAdvanceQuestion?.(next);
        return next;
    }

    /** Give up on current prompt; draw another Code Blue question. */
    window.codeBlueRandom = () => {
        loadNextQuestion({ excludeCurrentOnly: true });
        setFeedback('New Code Blue question loaded — answer and Submit when ready.', { ok: true });
    };

    /** Advance to another prompt after a correct answer (multi-question challenge). */
    window.codeBlueNextQuestion = () => {
        loadNextQuestion({ excludeCurrentOnly: false });
        setFeedback('Next Code Blue question — answer and Submit when ready.', { ok: true });
    };

    return () => {
        delete window.codeBlueSubmit;
        delete window.codeBlueCheat;
        delete window.codeBlueRandom;
        delete window.codeBlueNextQuestion;
    };
}

export function getCodeBlueExpectedCite(question) {
    if (question?.type === 'choice' && question.correct) return question.correct;
    return getCodeBlueSteps().map((s) => s.label).join(' → ');
}
