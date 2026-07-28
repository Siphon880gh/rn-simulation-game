/**
 * Admission checklist quizzes (E9.M4 / E9.M6) — MCQ content for challenge-gate.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

export function getAdmissionProfile(patientId) {
    const profiles = GameConfig.admission?.profiles || {};
    const pack = gameState.getStateSlice('scenarioPack');
    const base = profiles[patientId] || profiles.default || {
        consult: 'Hospitalist',
        allergies: ['NKDA'],
        homeMeds: ['multivitamin'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'New admission'
    };
    const department = String(pack?.department || '').toLowerCase();
    if (department === 'icu') {
        return { ...base, consult: 'Intensivist' };
    }
    return { ...base };
}

export function isAdmissionQuizTask(task) {
    const kind = String(task?.type || '').toLowerCase();
    if (kind !== 'admission') return false;
    const challenge = task?.metadata?.challenge || task?.metadata?.admissionChallenge;
    const phase = task?.metadata?.phase;
    if (phase === 'findNurse' || phase === 'callback' || phase === 'recall') return false;
    return Boolean(challenge);
}

function choice(label, correct) {
    return { label, correct: Boolean(correct) };
}

/**
 * @returns {{ title: string, prompt: string, choices: {label:string,correct:boolean}[], expected?: string }|null}
 */
export function buildAdmissionQuiz(task) {
    if (!isAdmissionQuizTask(task)) return null;
    const challenge = task.metadata?.challenge || task.metadata?.admissionChallenge;
    const profile = getAdmissionProfile(task.patientId);
    const allergy = (profile.allergies && profile.allergies[0]) || 'NKDA';
    const homeMeds = profile.homeMeds || [];
    const consult = profile.consult || 'Hospitalist';
    const bp = profile.bpTarget || {};

    switch (challenge) {
        case 'allergies':
            return {
                title: 'Admission — allergies',
                prompt: 'Which allergy documentation is correct for this admission?',
                choices: [
                    choice(`Document allergy: ${allergy}`, true),
                    choice('Skip allergies — pharmacy will catch it later', false),
                    choice('Copy allergies from a prior roommate chart', false)
                ],
                expected: allergy
            };
        case 'belongings':
            return {
                title: 'Admission — belongings',
                prompt: 'Best practice when checking belongings on admission?',
                choices: [
                    choice('Inventory valuables with patient/family and secure per policy', true),
                    choice('Leave bags unopened in the closet without documenting', false),
                    choice('Discard unlabeled items immediately', false)
                ],
                expected: 'Inventory valuables with patient/family and secure per policy'
            };
        case 'codeStatus':
            return {
                title: 'Admission — code status',
                prompt: 'Code status review should clarify which decisions?',
                choices: [
                    choice('CPR, defibrillation/shock, ACLS drugs, and long-term nutrition', true),
                    choice('Only whether the patient wants a flu shot', false),
                    choice('Only the attending’s pager number', false)
                ],
                expected: 'CPR, defibrillation/shock, ACLS drugs, and long-term nutrition'
            };
        case 'homeRecon':
            return {
                title: 'Home medication reconciliation',
                prompt: homeMeds.length
                    ? `Which set matches this patient’s home meds to reconcile with the provider?`
                    : 'What is the priority during home medication reconciliation?',
                choices: homeMeds.length
                    ? [
                        choice(homeMeds.join(', '), true),
                        choice('Random OTC supplements only — skip prescriptions', false),
                        choice('Hold all home meds without reviewing with the provider', false)
                    ]
                    : [
                        choice('Review each home med with the provider before continuing', true),
                        choice('Restart all home meds automatically at home doses', false),
                        choice('Skip recon until discharge', false)
                    ],
                expected: homeMeds.length
                    ? homeMeds.join(', ')
                    : 'Review each home med with the provider before continuing'
            };
        case 'npo':
            return {
                title: 'NPO at first',
                prompt: 'Explain NPO right away. What do you tell the patient?',
                choices: [
                    choice('You are NPO for now — we are waiting on the doctor for a diet order', true),
                    choice('You may have clear liquids until the tray arrives', false),
                    choice('Eat a light snack before labs', false)
                ],
                expected: 'You are NPO for now — we are waiting on the doctor for a diet order'
            };
        case 'bp': {
            const sys = Math.round(((bp.systolicMin || 100) + (bp.systolicMax || 150)) / 2);
            const dia = Math.round(((bp.diastolicMin || 60) + (bp.diastolicMax || 95)) / 2);
            const good = `${sys}/${dia} mmHg (within expected admission range)`;
            return {
                title: 'Admission — blood pressure',
                prompt: 'Which BP reading is appropriate to document for this admission?',
                choices: [
                    choice(good, true),
                    choice('60/30 mmHg — document and walk away', false),
                    choice('Skip vitals until the next shift', false)
                ],
                expected: good
            };
        }
        case 'fluShot':
            return {
                title: 'Admission — flu shot',
                prompt: 'Best action when offering a flu vaccine on admission?',
                choices: [
                    choice('Ask preference, screen for contraindications, and document accept/decline', true),
                    choice('Give the vaccine without asking', false),
                    choice('Never offer vaccines during admission', false)
                ],
                expected: 'Ask preference, screen for contraindications, and document accept/decline'
            };
        case 'skinCheck':
            return {
                title: 'Admission — skin check',
                prompt: 'Two-nurse admission skin check should prioritize:',
                choices: [
                    choice('Full skin survey for pressure injury / wounds with co-signer documentation', true),
                    choice('Check only the face and document “WNL”', false),
                    choice('Skip if the patient looks comfortable', false)
                ],
                expected: 'Full skin survey for pressure injury / wounds with co-signer documentation'
            };
        case 'callAdmitting':
            return {
                title: 'Call admitting for orders',
                prompt: `Review with admitting (consult target: ${consult}). Which set must you cover?`,
                choices: [
                    choice('Inpatient order, diet order, PRN medications, and review home meds with the doctor', true),
                    choice('Only the room number and meal preference', false),
                    choice('Discharge instructions only', false)
                ],
                expected: 'Inpatient order, diet order, PRN medications, and review home meds with the doctor',
                consult
            };
        default:
            return null;
    }
}

export function renderAdmissionQuizHtml(quiz, taskName) {
    if (!quiz) return '';
    const choices = (quiz.choices || []).map((c, i) => `
      <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-challenge-correct="${c.correct ? '1' : '0'}" data-choice-index="${i}">${c.label}</button>
    `).join('');
    return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="admission-quiz">
        <p class="text-sm text-gray-900 font-semibold">${quiz.prompt}</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz. Failure means the task doesn\'t get done and adds back to the task choices list'}</p>
        <p class="text-xs text-gray-500">Task: ${taskName || 'Admission'}.</p>
        <div class="flex flex-col gap-2">${choices}</div>
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>
    `;
}
