/**
 * Perform challenge gate (E5.M1) — modal mini-game + shift timer freeze.
 * Skills under challenges/skills/; emergencies under challenges/emergencies/.
 * Author map: challenges/README.md
 */
import { GameConfig } from '../game-config.js';
import gameState from '../game-state.js';
import ModalModule from '../modal.js';
import {
    buildMedIdentityPrompt,
    checkMedIdentityAnswer,
    renderMedIdentityHtml,
    applyMedIdentityCheat,
    readMedIdentitySataSelection
} from './skills/med-identity/challenge.js';
import {
    isAccucheckTask,
    buildAccucheckPrompt,
    checkAccucheckAnswer,
    renderAccucheckHtml,
    applyAccucheckCheat
} from './skills/accucheck/challenge.js';
import {
    isIvTask,
    buildIvPrompt,
    checkIvAnswer,
    renderIvChallengeHtml,
    applyIvCheat
} from './skills/iv-check/challenge.js';
import {
    isBedPrepTask,
    renderBedPrepHtml,
    wireBedPrepHandlers,
    buildBedPrepRound
} from './skills/bed-prep/challenge.js';
import {
    isIvpbTask,
    renderIvpbHangHtml,
    wireIvpbHangHandlers
} from './skills/ivpb-hang/challenge.js';
import {
    renderCodeBlueHtml,
    wireCodeBlueHandlers,
    pickCodeBlueQuestion,
    getCodeBlueExpectedCite as citeCodeBlueQuestion,
    getCodeBluePoolSize,
    getCodeBlueQuestionIds
} from './emergencies/code-blue/challenge.js';
import {
    buildAdmissionQuiz,
    renderAdmissionQuizHtml
} from './skills/admission/challenge.js';
import {
    isIcpTask,
    buildIcpQuiz,
    renderIcpQuizHtml,
    getIcpPoolSize,
    getIcpQuestionIds
} from './skills/icp/challenge.js';
import {
    isSkillMcqTask,
    buildSkillMcqQuiz,
    renderSkillMcqHtml,
    getSkillMcqPoolSize,
    getSkillMcqQuestionIds,
    wireSkillMcqInteractions,
    applySkillMcqCheat
} from './skills/skill-mcq/challenge.js';
import {
    renderChallengeLevelControl,
    readChallengeLevel,
    updateChallengeLevelProgress,
    lockChallengeLevelControl,
    wireChallengeLevelControl
} from './shared/copy-config.js';
import BoostersModule from '../boosters.js';
import { applySituationStill, clearSituationStill } from '../scene-backdrop.js';
import { recordChallengeOutcome } from '../scoring.js';
import { applyIvChallengeResult, syncIvTaskMetadata } from '../iv-system.js';

const CHALLENGE = GameConfig.timer.pauseSources.CHALLENGE;

/** Shared footer: Cheat fills the answer; player still submits (when a submit control exists). */
function challengeModalFooter({
    submitLabel = 'Submit',
    submitHandler = 'challengeGateSubmit',
    showSubmit = true,
    showRandom = false,
    randomHandler = 'codeBlueRandom',
    randomLabel = 'Random'
} = {}) {
    const randomBtn = showRandom
        ? `<button type="button" class="px-4 py-2 rounded-lg font-medium bg-violet-500 text-white hover:bg-violet-600 mr-2"
            onclick="window.${randomHandler} && window.${randomHandler}()">${randomLabel}</button>`
        : '';
    const submitBtn = showSubmit
        ? `<button type="button" class="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 mr-2"
            onclick="window.${submitHandler} && window.${submitHandler}()">${submitLabel}</button>`
        : '';
    return `
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 mr-2"
        onclick="window.challengeGateCheat && window.challengeGateCheat()">Cheat</button>
      ${randomBtn}
      ${submitBtn}
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
        onclick="window.challengeGateCancel && window.challengeGateCancel()">Cancel</button>
    `;
}

let activeSession = null;
let cleanupBedPrep = null;
let cleanupIvpbHang = null;
let cleanupCodeBlue = null;
let cleanupChallengeLevel = null;
let cleanupPoolQuizRandom = null;
let codeBlueOpenPending = false;

function clearChallengeLevelWire() {
    if (typeof cleanupChallengeLevel === 'function') {
        cleanupChallengeLevel();
        cleanupChallengeLevel = null;
    }
    if (typeof cleanupPoolQuizRandom === 'function') {
        cleanupPoolQuizRandom();
        cleanupPoolQuizRandom = null;
    }
}

function endSession(result) {
    const session = activeSession;
    activeSession = null;
    if (typeof cleanupBedPrep === 'function') {
        cleanupBedPrep();
        cleanupBedPrep = null;
    }
    if (typeof cleanupIvpbHang === 'function') {
        cleanupIvpbHang();
        cleanupIvpbHang = null;
    }
    if (typeof cleanupCodeBlue === 'function') {
        cleanupCodeBlue();
        cleanupCodeBlue = null;
    }
    clearChallengeLevelWire();
    clearSituationStill();
    gameState.dispatch('SET_PAUSE', { paused: false, source: CHALLENGE });
    ModalModule.closeModal();
    if (session?.resolve) {
        session.resolve(result);
    }
}

/** Fisher–Yates shuffle — fresh order each challenge run. */
function shuffleIds(ids) {
    const arr = [...(ids || [])].map(String).filter(Boolean);
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Start a per-run shuffled question deck (used when “I want to feel challenged” > 1).
 * Returns the deck; first id is the opening question.
 */
function beginShuffledQuizDeck(poolIds) {
    const deck = shuffleIds(poolIds);
    if (activeSession) {
        activeSession.quizDeck = deck;
        activeSession.quizDeckIndex = 0;
    }
    return deck;
}

/** Draw next / random question from the session deck (falls back to exclude-based pick). */
function drawFromQuizDeck(rebuild, { excludeCurrentOnly = false } = {}) {
    if (typeof rebuild !== 'function' || !activeSession) return null;
    const deck = Array.isArray(activeSession.quizDeck) ? activeSession.quizDeck : null;
    const seen = activeSession.quizSeenIds || new Set();

    if (deck?.length) {
        if (excludeCurrentOnly) {
            const cur = String(activeSession.currentQuestionId || '');
            const others = deck.filter((id) => id !== cur);
            if (others.length) {
                const pick = others[Math.floor(Math.random() * others.length)];
                const next = rebuild({ questionId: pick });
                const idx = deck.indexOf(String(pick));
                if (idx >= 0) activeSession.quizDeckIndex = idx;
                return next;
            }
        } else {
            let i = (Number(activeSession.quizDeckIndex) || 0) + 1;
            while (i < deck.length) {
                const next = rebuild({ questionId: deck[i] });
                activeSession.quizDeckIndex = i;
                if (next?.quiz) return next;
                i += 1;
            }
        }
    }

    return rebuild({
        excludeId: activeSession.currentQuestionId,
        excludeIds: excludeCurrentOnly ? [] : [...seen]
    });
}

function initQuizChallengeLevel(poolSize) {
    clearChallengeLevelWire();
    if (!activeSession || poolSize <= 1) return;
    activeSession.quizPoolSize = poolSize;
    activeSession.quizTarget = 1;
    activeSession.quizCorrect = 0;
    activeSession.quizSeenIds = new Set(
        activeSession.currentQuestionId != null && activeSession.currentQuestionId !== ''
            ? [String(activeSession.currentQuestionId)]
            : []
    );
    cleanupChallengeLevel = wireChallengeLevelControl({
        onChange: (n) => {
            if (!activeSession) return;
            activeSession.quizTarget = n;
        }
    });
}

function noteQuizCorrectAndMaybeContinue({ onNeedNext, onComplete }) {
    if (!activeSession) return;
    const target = Math.max(1, Number(activeSession.quizTarget) || readChallengeLevel() || 1);
    activeSession.quizTarget = target;
    activeSession.quizCorrect = (Number(activeSession.quizCorrect) || 0) + 1;
    lockChallengeLevelControl();
    updateChallengeLevelProgress(activeSession.quizCorrect, target);
    if (activeSession.quizCorrect >= target) {
        BoostersModule.awardFromChallengeLevel(target);
        onComplete?.();
        return;
    }
    onNeedNext?.();
}

function finishCodeBlue(passed, reason, expected, patientId) {
    if (activeSession?.closing) return;

    const settle = () => {
        recordChallengeOutcome({ passed, reason, expected });
        if (passed) {
            gameState.dispatch('UPDATE_PATIENT', {
                patientId,
                patch: {
                    clinicalStatus: 'stable',
                    clinicalStatusReason: 'code blue response (practice)'
                }
            });
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Code Blue response successful: ${activeSession?.taskName || patientId}`,
                timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
            });
        } else {
            gameState.dispatch('UPDATE_PATIENT', {
                patientId,
                patch: {
                    clinicalStatus: 'critical',
                    clinicalStatusReason: 'code blue response incomplete (practice)'
                }
            });
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Code Blue response incomplete: ${activeSession?.taskName || patientId}`,
                timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
            });
        }
        gameState.dispatch('RESOLVE_CODE_BLUE', { patientId, passed });
        endSession({ passed, reason, expected });
    };

    if (passed) {
        showPassedAcknowledge(settle);
        return;
    }

    settle();
}

/**
 * Open Code Blue challenge from E4 escalate hook (not Perform).
 * @returns {Promise<{passed:boolean, reason:string}>}
 */
export function runCodeBlueChallenge(hook) {
    if (activeSession || codeBlueOpenPending) {
        return Promise.resolve({ passed: false, reason: 'busy' });
    }
    if (GameConfig.events?.codeBlueHook?.enabled === false) {
        return Promise.resolve({ passed: false, reason: 'disabled' });
    }

    const patientId = hook?.patientId;
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    const name = patient?.name || patientId || 'patient';

    codeBlueOpenPending = true;
    return new Promise((resolve) => {
        const poolSize = getCodeBluePoolSize();
        const questionDeck = beginShuffledQuizDeck(getCodeBlueQuestionIds());
        const initialQuestion = pickCodeBlueQuestion({ questionId: questionDeck[0] })
            || pickCodeBlueQuestion();
        activeSession = {
            resolve,
            taskId: null,
            taskName: `Code Blue — ${name}`,
            codeBluePatientId: patientId,
            codeBlueQuestion: initialQuestion,
            currentQuestionId: initialQuestion?.id || null,
            quizPoolSize: poolSize,
            quizTarget: 1,
            quizCorrect: 0,
            quizDeck: questionDeck,
            quizDeckIndex: 0,
            quizSeenIds: new Set(
                initialQuestion?.id != null ? [String(initialQuestion.id)] : []
            )
        };
        codeBlueOpenPending = false;

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });
        applySituationStill('code-blue');

        ModalModule.openModal({
            title: 'Code Blue',
            content: renderCodeBlueHtml(name, initialQuestion, {
                poolSize,
                levelHtml: renderChallengeLevelControl(poolSize, 1)
            }),
            footer: challengeModalFooter({
                submitLabel: 'Submit',
                submitHandler: 'codeBlueSubmit',
                showRandom: poolSize > 1,
                randomHandler: 'codeBlueRandom',
                randomLabel: 'Random'
            }),
            overlay: true,
            persistent: false
        });

        setTimeout(() => {
            initQuizChallengeLevel(poolSize);
            cleanupCodeBlue = wireCodeBlueHandlers({
                patientName: name,
                initialQuestion,
                excludeIds: [...(activeSession.quizSeenIds || [])],
                questionDeck: activeSession.quizDeck,
                onAdvanceQuestion: (q) => {
                    if (!activeSession) return;
                    activeSession.codeBlueQuestion = q;
                    activeSession.currentQuestionId = q?.id || null;
                    if (q?.id != null) activeSession.quizSeenIds?.add(String(q.id));
                },
                onDone: ({ passed, reason, expected }) => {
                    if (!passed) {
                        finishCodeBlue(false, reason, expected, patientId);
                        return;
                    }
                    noteQuizCorrectAndMaybeContinue({
                        onComplete: () => finishCodeBlue(true, reason, expected, patientId),
                        onNeedNext: () => {
                            if (typeof window.codeBlueNextQuestion === 'function') {
                                window.codeBlueNextQuestion();
                            }
                        }
                    });
                }
            });
        }, 0);
    });
}

function challengePauseBanner() {
    return GameConfig.challengeCopy?.pauseBanner
        || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list';
}

function challengeCorrectFeedback() {
    return GameConfig.challengeCopy?.correctFeedback
        || GameConfig.challengeCopy?.passedFeedback
        || "You're correct.";
}

function challengeContinueLabel() {
    return GameConfig.challengeCopy?.continueLabel || 'Continue';
}

/** Lock quiz controls so the player must click Continue after a correct answer. */
function lockChallengeControls() {
    const content = document.querySelector(GameConfig.selectors.modalContent || '#modal-content');
    content?.querySelectorAll('button, input, select, textarea').forEach((el) => {
        el.disabled = true;
    });
}

/**
 * Show “You're correct.” and swap the footer to a Continue control.
 * Session stays open until the player clicks Continue.
 */
function showPassedAcknowledge(onContinue) {
    if (!activeSession) {
        onContinue?.();
        return;
    }
    activeSession.closing = true;
    activeSession.pendingPassContinue = onContinue;
    setChallengeFeedback(challengeCorrectFeedback(), { ok: true });
    lockChallengeControls();

    const footer = document.querySelector(GameConfig.selectors.modalFooter || '#modal-footer');
    if (!footer) {
        onContinue?.();
        return;
    }
    const label = challengeContinueLabel();
    footer.innerHTML = `
      <button type="button" id="challenge-continue-btn"
        class="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700"
        onclick="window.challengeGateContinue && window.challengeGateContinue()">${label}</button>
    `;
    document.querySelector('#challenge-continue-btn')?.focus();
}

function continueAfterPassed() {
    if (!activeSession?.pendingPassContinue) return;
    const fn = activeSession.pendingPassContinue;
    activeSession.pendingPassContinue = null;
    fn();
}

function buildSafetyContent(task) {
    const name = task?.name || 'this task';
    return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="safety-first">
        <p class="text-sm text-gray-900 font-semibold">Complete this challenge to perform the task.</p>
        <p class="text-sm text-gray-600">${challengePauseBanner()}</p>
        <p class="text-sm text-gray-800">Before performing <strong>${name}</strong>, which action comes first?</p>
        <div class="flex flex-col gap-2">
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="0">Document the dose after skipping checks</button>
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="1">Verify patient identity and the order</button>
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="0">Administer first; clarify later if unsure</button>
        </div>
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>
    `;
}

function setChallengeFeedback(message, { ok = false } = {}) {
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

function wireSafetyHandlers() {
    const root = document.querySelector('.challenge-gate');
    if (!root) return;
    root.querySelectorAll('.challenge-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
            const ok = btn.getAttribute('data-challenge-correct') === '1';
            finishAttempt(ok, ok ? 'correct' : 'incorrect', undefined, { allowRetry: true });
        });
    });
}

/**
 * Choice quizzes with a randomizable pool: optional challenge-level + Random + multi-q.
 * @param {{
 *   kind: 'icp'|'skill-mcq',
 *   task: object,
 *   poolSize: number,
 *   rebuild: (opts: object) => { quiz: object, html: string }|null
 * }} cfg
 */
function wirePoolChoiceQuiz(cfg) {
    const { kind, task, poolSize, rebuild } = cfg;
    const root = document.querySelector('.challenge-gate');
    if (!root) return;

    initQuizChallengeLevel(poolSize);

    const handleGrade = ({ ok, empty }) => {
        if (activeSession?.closing) return;
        const expected = activeSession?.quizExpected;
        if (empty) {
            setChallengeFeedback('Select at least one option, then check your answer.');
            return;
        }
        if (!ok) {
            finishAttempt(false, `${kind}-incorrect`, expected, { allowRetry: true });
            return;
        }
        noteQuizCorrectAndMaybeContinue({
            onComplete: () => {
                finishAttempt(true, `${kind}-correct`, expected, { allowRetry: true });
            },
            onNeedNext: () => {
                const next = drawFromQuizDeck(rebuild, { excludeCurrentOnly: false });
                if (!next?.quiz) {
                    finishAttempt(true, `${kind}-correct`, expected, { allowRetry: true });
                    return;
                }
                mountPoolChoiceQuiz(next, task, poolSize, kind);
                setChallengeFeedback(
                    `Correct — ${activeSession.quizCorrect} / ${activeSession.quizTarget}. Next question…`,
                    { ok: true }
                );
                bindChoices();
            }
        });
    };

    const bindChoices = () => {
        const gate = document.querySelector('.challenge-gate');
        if (!gate) return;
        if (kind === 'skill-mcq') {
            wireSkillMcqInteractions(handleGrade);
            return;
        }
        gate.querySelectorAll('.challenge-choice').forEach((btn) => {
            btn.addEventListener('click', () => {
                const ok = btn.getAttribute('data-challenge-correct') === '1';
                handleGrade({ ok });
            });
        });
    };

    bindChoices();

    if (poolSize > 1) {
        window.poolQuizRandom = () => {
            if (!activeSession || activeSession.closing) return;
            const next = drawFromQuizDeck(rebuild, { excludeCurrentOnly: true });
            if (!next?.quiz) return;
            mountPoolChoiceQuiz(next, task, poolSize, kind);
            setChallengeFeedback('New question loaded — pick an answer.', { ok: true });
            bindChoices();
        };
        cleanupPoolQuizRandom = () => {
            delete window.poolQuizRandom;
        };
    }
}

function mountPoolChoiceQuiz(next, task, poolSize, kind) {
    if (!activeSession || !next?.quiz) return;
    activeSession.quizExpected = next.quiz.expected;
    activeSession.currentQuestionId = next.quiz.questionId || null;
    if (next.quiz.questionId != null) {
        activeSession.quizSeenIds?.add(String(next.quiz.questionId));
    }

    const content = document.querySelector(GameConfig.selectors.modalContent || '#modal-content');
    if (!content) return;
    const levelHost = content.querySelector('[data-challenge-level-root]');
    const selectedLevel = activeSession.quizTarget || readChallengeLevel() || 1;
    const levelHtml = levelHost
        ? levelHost.outerHTML
        : renderChallengeLevelControl(poolSize, selectedLevel);
    content.innerHTML = kind === 'icp'
        ? renderIcpQuizHtml(next.quiz, task?.name, { poolSize, levelHtml })
        : renderSkillMcqHtml(next.quiz, task?.name, { poolSize, levelHtml });

    // Fresh DOM: re-bind or re-lock the challenge-level control
    if (typeof cleanupChallengeLevel === 'function') {
        cleanupChallengeLevel();
        cleanupChallengeLevel = null;
    }
    if ((Number(activeSession.quizCorrect) || 0) > 0) {
        lockChallengeLevelControl();
    } else if (poolSize > 1) {
        cleanupChallengeLevel = wireChallengeLevelControl({
            onChange: (n) => {
                if (!activeSession) return;
                activeSession.quizTarget = n;
            }
        });
        activeSession.quizTarget = readChallengeLevel() || selectedLevel;
    }
    updateChallengeLevelProgress(activeSession.quizCorrect || 0, activeSession.quizTarget || selectedLevel);

    const titleEl = document.querySelector(GameConfig.selectors.modalTitle || '#modal-title');
    if (titleEl && next.quiz.title) titleEl.textContent = next.quiz.title;
}

function finishAttempt(passed, reason, expected, opts = {}) {
    const allowRetry = opts.allowRetry === true;
    if (activeSession?.closing) return;

    if (passed) {
        recordChallengeOutcome({ passed: true, reason, expected });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: activeSession?.admissionQuiz || activeSession?.bedPrep
                ? `Challenge passed: ${activeSession?.taskName || 'task'}`
                : `Challenge passed: ${activeSession?.taskName || 'task'} → performing in slot`,
            timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
        });
        const statusEl = document.querySelector(GameConfig.selectors.statusMessage);
        if (statusEl && !activeSession?.bedPrep && !activeSession?.codeBluePatientId && !activeSession?.admissionQuiz) {
            statusEl.textContent = `Performing ${activeSession?.taskName || 'task'} in a slot`;
        }
        if (activeSession?.ivPrompt && activeSession?.ivTask) {
            applyIvChallengeResult(activeSession.ivTask, activeSession.ivPrompt);
        }
        showPassedAcknowledge(() => {
            endSession({ passed: true, reason });
        });
        return;
    }

    // Wrong: keep modal open so the player can try again (task not started / no slot).
    if (allowRetry && activeSession) {
        if (!activeSession.failLogged) {
            activeSession.failLogged = true;
            recordChallengeOutcome({ passed: false, reason, expected });
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Challenge incorrect: ${activeSession?.taskName || 'task'} — retry in modal (no slot yet)`,
                timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
            });
        }
        setChallengeFeedback(
            expected
                ? `Incorrect — expected “${expected}”. Task not started. Try again.`
                : 'Incorrect — task not started. Try again.'
        );
        const input = document.querySelector('#med-identity-answer, #accucheck-answer, #iv-answer');
        if (input) {
            input.focus();
            input.select();
        }
        return;
    }

    recordChallengeOutcome({ passed: false, reason, expected });
    setChallengeFeedback(
        expected
            ? `Incorrect (expected “${expected}”) — task was not started.`
            : 'Incorrect — task was not started.'
    );
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Challenge failed: ${activeSession?.taskName || 'task'} (no slot)`,
        timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
    });
    endSession({ passed: false, reason, expected });
}

function wireMedIdentityHandlers() {
    const input = document.querySelector('#med-identity-answer');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitMedIdentity();
            }
        });
    }
}

export function submitMedIdentity() {
    if (!activeSession?.medPrompt || activeSession.closing) return;
    const prompt = activeSession.medPrompt;

    if (prompt.mode === 'sata') {
        const selected = readMedIdentitySataSelection();
        if (!selected.length) {
            setChallengeFeedback('Select all that apply, then press Submit.');
            return;
        }
        const ok = checkMedIdentityAnswer(selected, prompt);
        finishAttempt(
            ok,
            ok ? 'med-identity-correct' : 'med-identity-incorrect',
            prompt.expected,
            { allowRetry: true }
        );
        return;
    }

    const input = document.querySelector('#med-identity-answer');
    const answer = input?.value || '';
    if (!String(answer).trim()) {
        setChallengeFeedback('Enter an answer, then press Submit.');
        input?.focus();
        return;
    }
    const ok = checkMedIdentityAnswer(answer, prompt);
    finishAttempt(
        ok,
        ok ? 'med-identity-correct' : 'med-identity-incorrect',
        prompt.expected,
        { allowRetry: true }
    );
}

function wireAccucheckHandlers() {
    const input = document.querySelector('#accucheck-answer');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitAccucheck();
            }
        });
    }
}

export function submitAccucheck() {
    if (!activeSession?.accucheckPrompt || activeSession.closing) return;
    const input = document.querySelector('#accucheck-answer');
    const answer = input?.value || '';
    if (!String(answer).trim()) {
        setChallengeFeedback('Enter units from the sliding scale, then press Submit.');
        input?.focus();
        return;
    }
    const ok = checkAccucheckAnswer(answer, activeSession.accucheckPrompt);
    finishAttempt(
        ok,
        ok ? 'accucheck-correct' : 'accucheck-incorrect',
        activeSession.accucheckPrompt.expected,
        { allowRetry: true }
    );
}

function cheatSafetyHighlight() {
    const root = document.querySelector('.challenge-gate');
    if (!root) return false;
    let found = false;
    root.querySelectorAll('.challenge-choice').forEach((btn) => {
        btn.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
        if (btn.getAttribute('data-challenge-correct') === '1') {
            btn.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50');
            btn.focus();
            found = true;
        }
    });
    return found;
}

/**
 * Practice aid for every challenge modal: fill/highlight the correct answer.
 * Does not submit — player still confirms.
 */
export function cheatChallenge() {
    if (!activeSession || activeSession.closing) return;

    if (activeSession.ivPrompt) {
        applyIvCheat(activeSession.ivPrompt);
        setChallengeFeedback('Cheat filled the correct rate — press Submit when ready.', { ok: true });
        return;
    }
    if (activeSession.accucheckPrompt) {
        applyAccucheckCheat(activeSession.accucheckPrompt);
        setChallengeFeedback('Cheat filled the correct units — press Submit when ready.', { ok: true });
        return;
    }
    if (activeSession.medPrompt) {
        applyMedIdentityCheat(activeSession.medPrompt);
        const sata = activeSession.medPrompt.mode === 'sata';
        setChallengeFeedback(
            sata
                ? 'Cheat checked the correct brand names — press Submit when ready.'
                : 'Cheat filled the correct answer — press Submit when ready.',
            { ok: true }
        );
        return;
    }
    if (activeSession.bedPrep) {
        if (typeof window.bedPrepCheat === 'function') {
            window.bedPrepCheat();
        }
        return;
    }
    if (activeSession.ivpbHang) {
        if (typeof window.ivpbHangCheat === 'function') {
            window.ivpbHangCheat();
        }
        return;
    }
    if (activeSession.codeBluePatientId) {
        if (typeof window.codeBlueCheat === 'function') {
            window.codeBlueCheat();
        }
        return;
    }
    if (activeSession.skillMcq) {
        const filled = applySkillMcqCheat();
        if (filled.ok && filled.cleared) {
            const feedback = document.querySelector('#challenge-feedback');
            if (feedback) {
                feedback.textContent = '';
                feedback.classList.add('hidden');
            }
        } else if (filled.ok) {
            setChallengeFeedback(filled.message, { ok: true });
        }
        return;
    }
    if (
        activeSession.safety
        || activeSession.icpQuiz
        || activeSession.admissionQuiz
    ) {
        if (cheatSafetyHighlight()) {
            setChallengeFeedback('Cheat highlighted the correct choice — click it to submit.', { ok: true });
        }
    }
}

/** @deprecated use cheatChallenge */
export function cheatAccucheck() {
    cheatChallenge();
}

export function submitIvChallenge() {
    if (!activeSession?.ivPrompt || activeSession.closing) return;
    const input = document.querySelector('#iv-answer');
    const answer = input?.value || '';
    if (!String(answer).trim()) {
        setChallengeFeedback('Enter the rate, then press Submit.');
        input?.focus();
        return;
    }
    const ok = checkIvAnswer(answer, activeSession.ivPrompt);
    finishAttempt(
        ok,
        ok ? 'iv-correct' : 'iv-incorrect',
        activeSession.ivPrompt.expected,
        { allowRetry: true }
    );
}

function wireIvHandlers() {
    const input = document.querySelector('#iv-answer');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitIvChallenge();
            }
        });
    }
}

export function submitChallengeAnswer() {
    if (activeSession?.ivPrompt) {
        submitIvChallenge();
        return;
    }
    if (activeSession?.accucheckPrompt) {
        submitAccucheck();
        return;
    }
    submitMedIdentity();
}

/**
 * Open challenge modal; freezes shift clock via pause source `challenge`.
 * @returns {Promise<{passed:boolean, reason:string, expected?:string}>}
 */
export function runChallengeGate(task) {
    if (activeSession) {
        return Promise.resolve({ passed: false, reason: 'busy' });
    }

    return new Promise((resolve) => {
        const liveTask = isIvTask(task) ? syncIvTaskMetadata(task) : task;
        const bedPrep = isBedPrepTask(liveTask);
        const ivpbHang = !bedPrep && isIvpbTask(liveTask);

        // Per-run shuffled decks so multi-question challenge levels are not bank order.
        let icpQuiz = null;
        let skillMcq = null;
        let quizDeck = null;
        if (!bedPrep && !ivpbHang && isIcpTask(liveTask)) {
            quizDeck = beginShuffledQuizDeck(getIcpQuestionIds());
            icpQuiz = buildIcpQuiz(liveTask, { questionId: quizDeck[0] });
        } else if (!bedPrep && !ivpbHang && isSkillMcqTask(liveTask)) {
            const skillId = String(liveTask?.metadata?.skillId || '').trim();
            quizDeck = beginShuffledQuizDeck(getSkillMcqQuestionIds(skillId));
            skillMcq = buildSkillMcqQuiz(liveTask, { questionId: quizDeck[0] });
        }

        const admissionQuiz = !bedPrep && !ivpbHang && !icpQuiz && !skillMcq
            ? buildAdmissionQuiz(liveTask)
            : null;
        const useIv = !bedPrep && !ivpbHang && !icpQuiz && !skillMcq && !admissionQuiz && isIvTask(liveTask);
        const ivPrompt = useIv ? buildIvPrompt(liveTask) : null;
        const isMed = !bedPrep && !ivpbHang && !icpQuiz && !skillMcq && !admissionQuiz && !useIv
            && (!liveTask?.type || String(liveTask.type).toLowerCase() === 'med');
        const useAccucheck = isMed && isAccucheckTask(liveTask);
        const accucheckPrompt = useAccucheck ? buildAccucheckPrompt(liveTask) : null;
        const medPrompt = isMed && !useAccucheck ? buildMedIdentityPrompt(liveTask) : null;
        const useMedQuiz = Boolean(medPrompt);

        activeSession = {
            resolve,
            taskId: liveTask?.id || null,
            taskName: liveTask?.name || null,
            medPrompt: useMedQuiz ? medPrompt : null,
            accucheckPrompt,
            ivPrompt,
            ivTask: useIv ? liveTask : null,
            bedPrep,
            ivpbHang,
            icpQuiz: Boolean(icpQuiz),
            skillMcq: Boolean(skillMcq),
            admissionQuiz: Boolean(admissionQuiz),
            quizDeck,
            quizDeckIndex: 0,
            safety: !bedPrep && !ivpbHang && !icpQuiz && !skillMcq && !admissionQuiz
                && !useIv && !accucheckPrompt && !useMedQuiz
        };

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });

        if (bedPrep) {
            const bedRound = buildBedPrepRound();
            applySituationStill('bed-prep');
            ModalModule.openModal({
                title: 'Bed prep for admission',
                content: renderBedPrepHtml(task?.name, bedRound),
                footer: challengeModalFooter({
                    submitLabel: 'Submit gather',
                    submitHandler: 'bedPrepSubmit'
                }),
                overlay: true,
                persistent: false
            });
            setTimeout(() => {
                cleanupBedPrep = wireBedPrepHandlers({
                    round: bedRound,
                    onDone: ({ passed, reason, expected }) => {
                        finishAttempt(passed, reason, expected);
                    }
                });
            }, 0);
        } else if (ivpbHang) {
            ModalModule.openModal({
                title: 'IVPB hang sequence',
                content: renderIvpbHangHtml(liveTask?.name),
                footer: challengeModalFooter({
                    submitLabel: 'Submit sequence',
                    submitHandler: 'ivpbHangSubmit'
                }),
                overlay: true,
                persistent: false
            });
            setTimeout(() => {
                cleanupIvpbHang = wireIvpbHangHandlers({
                    onDone: ({ passed, reason, expected }) => {
                        // On fail, omit expected so retry does not spoil the sequence.
                        finishAttempt(passed, reason, passed ? expected : undefined, { allowRetry: true });
                    }
                });
            }, 0);
        } else if (icpQuiz) {
            const poolSize = getIcpPoolSize();
            activeSession.quizExpected = icpQuiz.expected;
            activeSession.currentQuestionId = icpQuiz.questionId || null;
            ModalModule.openModal({
                title: icpQuiz.title || 'ICP monitoring',
                content: renderIcpQuizHtml(icpQuiz, liveTask?.name, {
                    poolSize,
                    levelHtml: renderChallengeLevelControl(poolSize, 1)
                }),
                footer: challengeModalFooter({
                    showSubmit: false,
                    showRandom: poolSize > 1,
                    randomHandler: 'poolQuizRandom',
                    randomLabel: 'Random'
                }),
                overlay: true,
                persistent: false
            });
            setTimeout(() => {
                wirePoolChoiceQuiz({
                    kind: 'icp',
                    task: liveTask,
                    poolSize,
                    rebuild: (opts) => {
                        const quiz = buildIcpQuiz(liveTask, opts);
                        return quiz ? { quiz } : null;
                    }
                });
            }, 0);
        } else if (skillMcq) {
            const skillId = String(liveTask?.metadata?.skillId || '').trim();
            const poolSize = getSkillMcqPoolSize(skillId);
            activeSession.quizExpected = skillMcq.expected;
            activeSession.currentQuestionId = skillMcq.questionId || null;
            ModalModule.openModal({
                title: skillMcq.title || 'Skill practice',
                content: renderSkillMcqHtml(skillMcq, liveTask?.name, {
                    poolSize,
                    levelHtml: renderChallengeLevelControl(poolSize, 1)
                }),
                footer: challengeModalFooter({
                    showSubmit: false,
                    showRandom: poolSize > 1,
                    randomHandler: 'poolQuizRandom',
                    randomLabel: 'Random'
                }),
                overlay: true,
                persistent: false
            });
            setTimeout(() => {
                wirePoolChoiceQuiz({
                    kind: 'skill-mcq',
                    task: liveTask,
                    poolSize,
                    rebuild: (opts) => {
                        const quiz = buildSkillMcqQuiz(liveTask, opts);
                        return quiz ? { quiz } : null;
                    }
                });
            }, 0);
        } else if (admissionQuiz) {
            ModalModule.openModal({
                title: admissionQuiz.title || 'Admission challenge',
                content: renderAdmissionQuizHtml(admissionQuiz, liveTask?.name),
                footer: challengeModalFooter({ showSubmit: false }),
                overlay: true,
                persistent: false
            });
            setTimeout(wireSafetyHandlers, 0);
        } else if (ivPrompt) {
            ModalModule.openModal({
                title: ivPrompt.kind === 'heparin-ptt'
                    ? 'Heparin PTT / drip adjust'
                    : ivPrompt.kind === 'iv-check'
                        ? 'IV drip check'
                        : 'IV drip titration',
                content: renderIvChallengeHtml(ivPrompt, liveTask?.name),
                footer: challengeModalFooter(),
                overlay: true,
                persistent: false
            });
            setTimeout(wireIvHandlers, 0);
        } else if (accucheckPrompt) {
            ModalModule.openModal({
                title: 'Accucheck / sliding scale / finger stick',
                content: renderAccucheckHtml(accucheckPrompt),
                footer: challengeModalFooter(),
                overlay: true,
                persistent: false
            });
            setTimeout(wireAccucheckHandlers, 0);
        } else if (useMedQuiz) {
            ModalModule.openModal({
                title: 'Med identity challenge',
                content: renderMedIdentityHtml(medPrompt, task?.name),
                footer: challengeModalFooter(),
                overlay: true,
                persistent: false
            });
            setTimeout(wireMedIdentityHandlers, 0);
        } else {
            ModalModule.openModal({
                title: 'Perform challenge',
                content: buildSafetyContent(task),
                footer: challengeModalFooter({ showSubmit: false }),
                overlay: true,
                persistent: false
            });
            setTimeout(wireSafetyHandlers, 0);
        }
    });
}

export function cancelChallengeGate() {
    if (!activeSession) {
        ModalModule.closeModal();
        return;
    }
    if (activeSession.codeBluePatientId) {
        finishCodeBlue(
            false,
            'cancelled',
            getCodeBlueExpectedCite(),
            activeSession.codeBluePatientId
        );
        return;
    }
    endSession({ passed: false, reason: 'cancelled' });
}

function getCodeBlueExpectedCite() {
    return citeCodeBlueQuestion(activeSession?.codeBlueQuestion);
}

export function isChallengeActive() {
    return Boolean(activeSession);
}

const ChallengeGateModule = {
    runChallengeGate,
    runCodeBlueChallenge,
    cancelChallengeGate,
    isChallengeActive,
    submitMedIdentity,
    submitAccucheck,
    cheatChallenge,
    cheatAccucheck,
    init() {
        window.challengeGateCancel = () => cancelChallengeGate();
        window.challengeGateSubmit = () => submitChallengeAnswer();
        window.challengeGateCheat = () => cheatChallenge();
        window.challengeGateContinue = () => continueAfterPassed();
        gameState.subscribe('codeBlueHook', (hook, prev) => {
            if (!hook?.patientId || hook.resolved) return;
            if (prev?.patientId === hook.patientId && prev?.at === hook.at && !prev?.resolved) {
                return;
            }
            runCodeBlueChallenge(hook);
        });
    }
};

export default ChallengeGateModule;
