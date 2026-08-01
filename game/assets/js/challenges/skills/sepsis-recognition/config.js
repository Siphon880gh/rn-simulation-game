/**
 * Sepsis screen challenge copy — Q4H findings classification.
 * Runtime: ./challenge.js + sepsis-system.js
 */
export const sepsisScreenChallengeConfig = {
  title: 'Sepsis screen (Q4H)',
  prompt: 'Classify these findings using sepsis / septic shock / MODS guidelines:',
  guideButtonLabel: 'Open sepsis cheat guide',
  methodSummary:
    'qSOFA / infection + organ dysfunction → sepsis; sepsis + lactate ≥2 or fluid-refractory hypotension → septic shock; ≥2 failing organs → MODS.'
};
