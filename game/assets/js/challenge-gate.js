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
    renderMedIdentityHtml
} from './med-identity-quiz.js';
import {
    isBedPrepTask,
    renderBedPrepHtml,
    wireBedPrepHandlers
} from './bed-prep-challenge.js';
import {
    renderCodeBlueHtml,
    wireCodeBlueHandlers
} from './code-blue-challenge.js';
import { applySituationStill, clearSituationStill } from './scene-backdrop.js';
import { recordChallengeOutcome } from './scoring.js';

const CHALLENGE = GameConfig.timer.pauseSources.CHALLENGE;

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
        activeSession = {
            resolve,
            taskId: null,
            taskName: `Code Blue — ${name}`,
            codeBluePatientId: patientId
        };
        codeBlueOpenPending = false;

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });
        applySituationStill('code-blue');

        ModalModule.openModal({
            title: 'Code Blue',
            content: renderCodeBlueHtml(name),
            footer: `
              <button type="button" class="px-4 py-2 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 mr-2"
                onclick="window.codeBlueSubmit && window.codeBlueSubmit()">Submit order</button>
              <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
                onclick="window.challengeGateCancel && window.challengeGateCancel()">Cancel</button>
            `,
            overlay: true,
            persistent: false
        });

        setTimeout(() => {
            cleanupCodeBlue = wireCodeBlueHandlers({
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
        <p class="text-sm text-gray-600">Practice challenge (not a competency assessment). Timer is paused.</p>
        <p class="text-sm text-gray-800">Before performing <strong>${name}</strong>, which action comes first?</p>
        <div class="flex flex-col gap-2">
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="0">Document the dose after skipping checks</button>
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="1">Verify patient identity and the order</button>
          <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
            data-challenge-correct="0">Administer first; clarify later if unsure</button>
        </div>
        <p id="challenge-feedback" class="text-sm text-rose-600 hidden"></p>
      </div>
    `;
}

function wireSafetyHandlers() {
    const root = document.querySelector('.challenge-gate');
    if (!root) return;
    root.querySelectorAll('.challenge-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
            const ok = btn.getAttribute('data-challenge-correct') === '1';
            finishAttempt(ok, ok ? 'correct' : 'incorrect');
        });
    });
}

function finishAttempt(passed, reason, expected) {
    const feedback = document.querySelector('#challenge-feedback');
    recordChallengeOutcome({ passed, reason, expected });
    if (passed) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Challenge passed: ${activeSession?.taskName || 'task'}`,
            timeLabel: String(gameState.getStateSlice('currentTime') ?? '—')
        });
        endSession({ passed: true, reason });
        return;
    }
    if (feedback && !feedback.textContent) {
        feedback.textContent = expected
            ? `Incorrect (expected “${expected}”) — task was not started. You may retry Perform.`
            : 'Incorrect — task was not started. You may retry Perform.';
        feedback.classList.remove('hidden');
    }
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
    if (!activeSession?.medPrompt) return;
    const input = document.querySelector('#med-identity-answer');
    const answer = input?.value || '';
    const ok = checkMedIdentityAnswer(answer, activeSession.medPrompt);
    finishAttempt(
        ok,
        ok ? 'med-identity-correct' : 'med-identity-incorrect',
        activeSession.medPrompt.expected
    );
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
        const bedPrep = isBedPrepTask(task);
        const isMed = !bedPrep && (!task?.type || String(task.type).toLowerCase() === 'med');
        const prompt = isMed ? buildMedIdentityPrompt(task) : null;
        const useMedQuiz = Boolean(prompt);

        activeSession = {
            resolve,
            taskId: task?.id || null,
            taskName: task?.name || null,
            medPrompt: useMedQuiz ? prompt : null,
            bedPrep
        };

        gameState.dispatch('SET_PAUSE', { paused: true, source: CHALLENGE });

        if (bedPrep) {
            applySituationStill('bed-prep');
            ModalModule.openModal({
                title: 'Bed prep for admission',
                content: renderBedPrepHtml(task?.name),
                footer: `
                  <button type="button" class="px-4 py-2 rounded-lg font-medium bg-amber-600 text-white hover:bg-amber-700 mr-2"
                    onclick="window.bedPrepSubmit && window.bedPrepSubmit()">Submit sequence</button>
                  <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
                    onclick="window.challengeGateCancel && window.challengeGateCancel()">Cancel</button>
                `,
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
        } else if (useMedQuiz) {
            ModalModule.openModal({
                title: 'Med identity challenge',
                content: renderMedIdentityHtml(prompt, task?.name),
                footer: `
                  <button type="button" class="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 mr-2"
                    onclick="window.challengeGateSubmit && window.challengeGateSubmit()">Submit</button>
                  <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
                    onclick="window.challengeGateCancel && window.challengeGateCancel()">Cancel</button>
                `,
                overlay: true,
                persistent: false
            });
            setTimeout(wireMedIdentityHandlers, 0);
        } else {
            ModalModule.openModal({
                title: 'Perform challenge',
                content: buildSafetyContent(task),
                footer: `
                  <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
                    onclick="window.challengeGateCancel && window.challengeGateCancel()">Cancel</button>
                `,
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
    const steps = GameConfig.codeBlueChallenge?.steps;
    if (!Array.isArray(steps)) return undefined;
    return steps.map((s) => s.label).join(' → ');
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
    init() {
        window.challengeGateCancel = () => cancelChallengeGate();
        window.challengeGateSubmit = () => submitMedIdentity();
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
