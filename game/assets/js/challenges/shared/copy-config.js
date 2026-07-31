/**
 * Shared challenge chrome copy + multi-question challenge-level UI.
 * Path: challenges/shared/copy-config.js
 */
export const challengeCopyConfig = {
  pauseBanner:
    "Timer is paused. Complete this game/quiz. Failure means the task doesn't get done and adds back to the task choices list",
  /** Shown when the player answers correctly; they must click Continue to close. */
  correctFeedback: "You're correct.",
  continueLabel: 'Continue',
  /** @deprecated Prefer correctFeedback + continue gate */
  passedFeedback: "You're correct.",
  /** Label for choosing how many random-pool questions to answer (default 1). */
  challengeLevelLabel: 'I want to feel challenged:'
};

/**
 * Number-of-questions control for quizzes with a randomizable pool (>1).
 * Default selection is 1.
 */
export function renderChallengeLevelControl(poolSize, selected = 1) {
  const max = Math.max(0, Number(poolSize) || 0);
  if (max <= 1) return '';
  const current = Math.min(max, Math.max(1, Number(selected) || 1));
  const label = challengeCopyConfig.challengeLevelLabel || 'I want to feel challenged:';
  const buttons = Array.from({ length: max }, (_, i) => i + 1).map((n) => {
    const pressed = n === current;
    return `<button type="button" class="challenge-level-btn px-2.5 py-1 rounded border text-sm font-medium ${
      pressed
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-800 border-gray-300 hover:bg-violet-50'
    }" data-challenge-level="${n}" aria-pressed="${pressed ? 'true' : 'false'}">${n}</button>`;
  }).join('');
  return `
    <div class="challenge-level-control flex flex-wrap items-center gap-2 text-sm text-gray-800"
      data-challenge-level-root data-pool-size="${max}">
      <span class="font-medium">${label}</span>
      <div class="flex flex-wrap gap-1" role="group" aria-label="Number of questions to answer">${buttons}</div>
      <span class="challenge-level-progress text-xs text-gray-500" data-challenge-level-progress></span>
    </div>
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
  const el = document.querySelector('[data-challenge-level-progress]');
  if (!el) return;
  const target = Math.max(1, Number(targetCount) || 1);
  const correct = Math.max(0, Number(correctCount) || 0);
  el.textContent = target > 1 ? `${correct} / ${target} correct` : '';
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
  };

  const onClick = (e) => {
    if (host.dataset.locked === '1') return;
    const btn = e.target?.closest?.('.challenge-level-btn');
    if (!btn || !host.contains(btn)) return;
    const n = Number(btn.getAttribute('data-challenge-level')) || 1;
    paint(n);
    updateChallengeLevelProgress(0, n);
    onChange?.(n);
  };

  host.addEventListener('click', onClick);
  updateChallengeLevelProgress(0, readChallengeLevel(host));
  return () => host.removeEventListener('click', onClick);
}

export default challengeCopyConfig;
