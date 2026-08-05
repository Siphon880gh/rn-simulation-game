/**
 * Shared challenge chrome copy + multi-question challenge-level UI.
 * Path: challenges/shared/copy-config.js
 */
export const challengeCopyConfig = {
  /** @deprecated Prefer the modal corner pause badge (`timerPausedLabel`). */
  pauseBanner: '',
  /** Short label for the challenge modal corner badge. */
  timerPausedLabel: 'Timer paused',
  /** Shown when the player answers correctly; they must click Continue to close. */
  correctFeedback: "You're correct.",
  /** Shown when a non-retry fail closes after Continue. */
  incorrectFeedback:
    'Incorrect — the task is not done. Select it again from the task list.',
  continueLabel: 'Continue',
  /** @deprecated Prefer correctFeedback + continue gate */
  passedFeedback: "You're correct.",
  /** Collapsed summary label for multi-question challenge intensity. */
  challengeLevelLabel: 'Add more questions for boosters',
  /** Expanded helper: how many of the pool to answer. */
  challengeLevelHelp: 'Choose how many questions to answer.',
  /** Expanded note: extra questions earn boosters (N questions → N−1 boosters). */
  challengeLevelBoosterNote:
    'Each extra question earns one booster (freeze the clock 15 game minutes, or clear every task in the queue slots).',
  /**
   * Always-visible (outside the challenge-level expand): fail consequence.
   * @deprecated Prefer `failureConsequence`.
   */
  challengeLevelWarning:
    'If you fail a question, the task is not done — select it again from the task list.',
  /** Always-visible fail consequence for challenge modals. */
  failureConsequence:
    'If you fail a question, the task is not done — select it again from the task list.'
};

function challengeLevelSummaryText(selected, poolSize) {
  const max = Math.max(1, Number(poolSize) || 1);
  const n = Math.min(max, Math.max(1, Number(selected) || 1));
  return `(${n})`;
}

function syncChallengeLevelSummary(host, selected) {
  if (!host) return;
  const max = Math.max(1, Number(host.getAttribute('data-pool-size')) || 1);
  const el = host.querySelector('[data-challenge-level-summary]');
  if (el) el.textContent = challengeLevelSummaryText(selected, max);
}

/** Max selectable challenge intensity (pool can be larger; Random still draws from full bank). */
const CHALLENGE_LEVEL_CAP = 10;

export function renderChallengeFailureNote() {
  const note = challengeCopyConfig.failureConsequence
    || challengeCopyConfig.challengeLevelWarning
    || 'If you fail a question, the task is not done — select it again from the task list.';
  return `<p class="challenge-failure-note text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2" data-challenge-failure-note role="note">${note}</p>`;
}

export function renderChallengeTimerPausedBadge() {
  const label = challengeCopyConfig.timerPausedLabel || 'Timer paused';
  return `
    <div class="challenge-timer-paused" data-challenge-timer-paused role="status" title="${label}" aria-label="${label}">
      <i class="fas fa-pause-circle" aria-hidden="true"></i>
      <span>${label}</span>
    </div>
  `;
}

/**
 * Corner pause badge + always-visible fail note for open challenge modals.
 * Safe to call after content remounts (e.g. Random next question).
 */
export function syncChallengeModalChrome() {
  const modal = document.querySelector('#modal');
  const panel = document.querySelector('#modal .modal-panel');
  const content = document.querySelector('#modal-content');
  if (!panel) return;

  const modalOpen = Boolean(modal && !modal.classList.contains('hidden'));
  const gate = modalOpen
    ? (content?.querySelector?.('.challenge-gate') || null)
    : null;
  const existingBadge = panel.querySelector('[data-challenge-timer-paused]');

  if (!gate) {
    existingBadge?.remove();
    panel.classList.remove('modal-panel--timer-paused');
    return;
  }

  panel.classList.add('modal-panel--timer-paused');
  if (!existingBadge) {
    panel.insertAdjacentHTML('afterbegin', renderChallengeTimerPausedBadge());
  }

  if (!gate.querySelector('[data-challenge-failure-note]')) {
    gate.insertAdjacentHTML('afterbegin', renderChallengeFailureNote());
  }
}

/**
 * Collapsible number-of-questions control for quizzes with a randomizable pool (>1).
 * Default selection is 1; starts collapsed.
 * Fail consequence lives outside this control (see syncChallengeModalChrome).
 */
export function renderChallengeLevelControl(poolSize, selected = 1) {
  const pool = Math.max(0, Number(poolSize) || 0);
  const max = Math.min(CHALLENGE_LEVEL_CAP, pool);
  if (max <= 1) return '';
  const current = Math.min(max, Math.max(1, Number(selected) || 1));
  const label = challengeCopyConfig.challengeLevelLabel || 'Add more questions for boosters';
  const help = challengeCopyConfig.challengeLevelHelp
    || 'Choose how many questions to answer.';
  const boosterNote = challengeCopyConfig.challengeLevelBoosterNote
    || 'Each extra question earns one booster.';
  const buttons = Array.from({ length: max }, (_, i) => i + 1).map((n) => {
    const pressed = n === current;
    return `<button type="button" class="challenge-level-btn px-2.5 py-1 rounded border text-sm font-medium ${
      pressed
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-800 border-gray-300 hover:bg-violet-50'
    }" data-challenge-level="${n}" aria-pressed="${pressed ? 'true' : 'false'}">${n}</button>`;
  }).join('');
  return `
    <details class="challenge-level-control rounded-md border border-violet-200 bg-white text-sm text-gray-800"
      data-challenge-level-root data-pool-size="${max}">
      <summary class="cursor-pointer select-none px-3 py-2 font-medium list-none flex flex-wrap items-center gap-2
        [&::-webkit-details-marker]:hidden">
        <span>${label}</span>
        <span class="text-xs font-normal text-violet-700" data-challenge-level-summary>${challengeLevelSummaryText(current, max)}</span>
        <span class="text-xs font-normal text-gray-500" data-challenge-level-progress></span>
      </summary>
      <div class="px-3 pb-3 space-y-2.5 border-t border-violet-100">
        <p class="text-xs text-gray-600 pt-2">${help}</p>
        <div class="flex flex-wrap gap-1" role="group" aria-label="Number of questions to answer">${buttons}</div>
        <p class="text-xs text-violet-800/90">${boosterNote}</p>
      </div>
    </details>
  `;
}

export function readChallengeLevel(root = document) {
  const host = root.querySelector?.('[data-challenge-level-root]')
    || document.querySelector('[data-challenge-level-root]');
  if (!host) return 1;
  const pressed = host.querySelector('.challenge-level-btn[aria-pressed="true"]');
  const max = Math.max(1, Number(host.getAttribute('data-pool-size')) || 1);
  const n = Number(pressed?.getAttribute('data-challenge-level')) || 1;
  return Math.min(max, Math.max(1, n));
}

export function updateChallengeLevelProgress(correctCount, targetCount) {
  const host = document.querySelector('[data-challenge-level-root]');
  const el = host?.querySelector('[data-challenge-level-progress]')
    || document.querySelector('[data-challenge-level-progress]');
  if (!el) return;
  const target = Math.max(1, Number(targetCount) || 1);
  const correct = Math.max(0, Number(correctCount) || 0);
  el.textContent = target > 1 ? `· ${correct} / ${target} correct` : '';
  if (host) syncChallengeLevelSummary(host, target);
}

export function lockChallengeLevelControl() {
  const host = document.querySelector('[data-challenge-level-root]');
  if (!host) return;
  host.dataset.locked = '1';
  host.querySelectorAll('.challenge-level-btn').forEach((btn) => {
    btn.disabled = true;
  });
}

/**
 * Wire level buttons. Returns cleanup. Locked after first correct answer.
 * @param {{ onChange?: (n: number) => void }} [opts]
 */
export function wireChallengeLevelControl({ onChange } = {}) {
  const host = document.querySelector('[data-challenge-level-root]');
  if (!host) return () => {};

  const paint = (selected) => {
    host.querySelectorAll('.challenge-level-btn').forEach((btn) => {
      const n = Number(btn.getAttribute('data-challenge-level'));
      const pressed = n === selected;
      btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      btn.classList.toggle('bg-violet-600', pressed);
      btn.classList.toggle('text-white', pressed);
      btn.classList.toggle('border-violet-600', pressed);
      btn.classList.toggle('bg-white', !pressed);
      btn.classList.toggle('text-gray-800', !pressed);
      btn.classList.toggle('border-gray-300', !pressed);
    });
    syncChallengeLevelSummary(host, selected);
  };

  const onClick = (e) => {
    const btn = e.target?.closest?.('.challenge-level-btn');
    if (!btn || !host.contains(btn)) return;
    if (host.dataset.locked === '1') return;
    e.preventDefault();
    const n = Number(btn.getAttribute('data-challenge-level')) || 1;
    paint(n);
    updateChallengeLevelProgress(0, n);
    onChange?.(n);
  };

  host.addEventListener('click', onClick);
  const initial = readChallengeLevel(host);
  syncChallengeLevelSummary(host, initial);
  updateChallengeLevelProgress(0, initial);
  return () => host.removeEventListener('click', onClick);
}

export default challengeCopyConfig;
