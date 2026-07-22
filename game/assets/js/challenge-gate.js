/**
 * Perform challenge gate (E5.M1) — modal mini-game + shift timer freeze.
 * E5.M2: med brand↔generic; E5.M3: bed-prep; E5.M4: Code Blue (E4 escalate).
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import ModalModule from './modal.js';
import {
    buildMedIdentityPrompt,
    checkMedIdentityAnswer,
    renderMedIdentityHtml,
    applyMedIdentityCheat
} from './med-identity-quiz.js';
import {
    isAccucheckTask,
    buildAccucheckPrompt,
    checkAccucheckAnswer,
    renderAccucheckHtml,
    applyAccucheckCheat
} from './accucheck-challenge.js';
import {
    isIvTask,
    buildIvPrompt,
    checkIvAnswer,
    renderIvChallengeHtml,
    applyIvCheat
} from './iv-challenge.js';
import {
    isBedPrepTask,
    renderBedPrepHtml,
    wireBedPrepHandlers
} from './bed-prep-challenge.js';
import {
    renderCodeBlueHtml,
    wireCodeBlueHandlers,
    pickCodeBlueQuestion,
    getCodeBlueExpectedCite as citeCodeBlueQuestion
} from './code-blue-challenge.js';
import { applySituationStill, clearSituationStill } from './scene-backdrop.js';
import { recordChallengeOutcome } from './scoring.js';
import { applyIvChallengeResult, syncIvTaskMetadata } from './iv-system.js';

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
let cleanupCodeBlue = null;
let codeBlueOpenPending = false;

function endSession(result) {
    const session = activeSession;
    activeSession = null;
    if (typeof cleanupBedPrep === 'function') {
        cleanupBedPrep();
        cleanupBedPrep = null;
    }
    if (typeof cleanupCodeBlue === 'function') {
        cleanupCodeBlue();
        cleanupCodeBlue = null;
    }
    clearSituationStill();
    gameState.dispatch('SET_PAUSE', { paused: false, source: CHALLENGE });
    ModalModule.closeModal();
    if (session?.resolve) {
        session.resolve(result);
    }
}

function finishCodeBlue(passed, reason, expected, patientId) {
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
        const initialQuestion = pickCodeBlueQuestion();
        activeSession = {
            resolve,
            taskId: null,
            taskName: `Code Blue — ${name}`,
            codeBluePatientId: patientId,
            codeBlueQuestion: initialQuestion
        };
        codeBlueOpenPending = false;

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });
        applySituationStill('code-blue');

        ModalModule.openModal({
            title: 'Code Blue',
            content: renderCodeBlueHtml(name, initialQuestion),
            footer: challengeModalFooter({
                submitLabel: 'Submit',
                submitHandler: 'codeBlueSubmit',
                showRandom: true,
                randomHandler: 'codeBlueRandom',
                randomLabel: 'Random'
            }),
            overlay: true,
            persistent: false
        });

        setTimeout(() => {
            cleanupCodeBlue = wireCodeBlueHandlers({
                patientName: name,
                initialQuestion,
                onDone: ({ passed, reason, expected }) => {
                    finishCodeBlue(passed, reason, expected, patientId);
                }
            });
        }, 0);
    });
}

function buildSafetyContent(task) {
    const name = task?.name || 'this task';
    return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="safety-first">
        <p class="text-sm text-gray-900 font-semibold">Complete this challenge to perform the task.</p>
        <p class="text-sm text-gray-600">Correct → task starts in a slot. Incorrect → try again. Timer is paused.</p>
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
        'text-rose-700',
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

function finishAttempt(passed, reason, expected, opts = {}) {
    const allowRetry = opts.allowRetry === true;
    if (activeSession?.closing) return;

    if (passed) {
        recordChallengeOutcome({ passed: true, reason, expected });
        const successMsg = activeSession?.bedPrep
            ? 'Correct — bed prep is done.'
            : activeSession?.codeBluePatientId
                ? 'Correct — Code Blue response recorded.'
                : 'Correct — task is now performing in a slot.';
        setChallengeFeedback(successMsg, { ok: true });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Challenge passed: ${activeSession?.taskName || 'task'} → performing in slot`,
            timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
        });
        const statusEl = document.querySelector(GameConfig.selectors.statusMessage);
        if (statusEl && !activeSession?.bedPrep && !activeSession?.codeBluePatientId) {
            statusEl.textContent = `Performing ${activeSession?.taskName || 'task'} in a slot`;
        }
        activeSession.closing = true;
        document.querySelectorAll('#modal-footer button').forEach((btn) => {
            btn.disabled = true;
        });
        const input = document.querySelector('#med-identity-answer, #accucheck-answer, #iv-answer');
        if (input) input.disabled = true;
        if (activeSession?.ivPrompt && activeSession?.ivTask) {
            applyIvChallengeResult(activeSession.ivTask, activeSession.ivPrompt);
        }
        setTimeout(() => {
            endSession({ passed: true, reason });
        }, 900);
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
    const input = document.querySelector('#med-identity-answer');
    const answer = input?.value || '';
    if (!String(answer).trim()) {
        setChallengeFeedback('Enter an answer, then press Submit.');
        input?.focus();
        return;
    }
    const ok = checkMedIdentityAnswer(answer, activeSession.medPrompt);
    finishAttempt(
        ok,
        ok ? 'med-identity-correct' : 'med-identity-incorrect',
        activeSession.medPrompt.expected,
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
    const root = document.querySelector('.challenge-gate[data-challenge="safety-first"]');
    if (!root) return false;
    root.querySelectorAll('.challenge-choice').forEach((btn) => {
        btn.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
        if (btn.getAttribute('data-challenge-correct') === '1') {
            btn.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50');
            btn.focus();
        }
    });
    return true;
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
        setChallengeFeedback('Cheat filled the correct answer — press Submit when ready.', { ok: true });
        return;
    }
    if (activeSession.bedPrep) {
        if (typeof window.bedPrepCheat === 'function') {
            window.bedPrepCheat();
        }
        return;
    }
    if (activeSession.codeBluePatientId) {
        if (typeof window.codeBlueCheat === 'function') {
            window.codeBlueCheat();
        }
        return;
    }
    if (activeSession.safety) {
        cheatSafetyHighlight();
        setChallengeFeedback('Cheat highlighted the correct choice — click it to submit.', { ok: true });
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
        const useIv = !bedPrep && isIvTask(liveTask);
        const ivPrompt = useIv ? buildIvPrompt(liveTask) : null;
        const isMed = !bedPrep && !useIv && (!liveTask?.type || String(liveTask.type).toLowerCase() === 'med');
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
            safety: !bedPrep && !useIv && !accucheckPrompt && !useMedQuiz
        };

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });

        if (bedPrep) {
            applySituationStill('bed-prep');
            ModalModule.openModal({
                title: 'Bed prep for admission',
                content: renderBedPrepHtml(task?.name),
                footer: challengeModalFooter({
                    submitLabel: 'Submit sequence',
                    submitHandler: 'bedPrepSubmit'
                }),
                overlay: true,
                persistent: false
            });
            setTimeout(() => {
                cleanupBedPrep = wireBedPrepHandlers({
                    onDone: ({ passed, reason, expected }) => {
                        finishAttempt(passed, reason, expected);
                    }
                });
            }, 0);
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
                title: 'Accucheck / sliding scale',
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
