/**
 * Shared challenge chrome copy.
 * Path: challenges/shared/copy-config.js
 */
export const challengeCopyConfig = {
  pauseBanner:
    "Timer is paused. Complete this game/quiz. Failure means the task doesn't get done and adds back to the task choices list",
  /** Shown when the player answers correctly; they must click Continue to close. */
  correctFeedback: "You're correct.",
  continueLabel: 'Continue',
  /** @deprecated Prefer correctFeedback + continue gate */
  passedFeedback: "You're correct."
};

export default challengeCopyConfig;
