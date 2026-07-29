/**
 * Bed prep gather items — AUTHOR CONTENT HERE.
 * Path: challenges/skills/bed-prep/config.js
 */
export const bedPrepChallengeConfig = {
  hintViews: 3,
  flashMs: 700,
  /** Preview flash speed slider (% of flashMs). 50 = half speed (slower). */
  flashSpeedMinPct: 50,
  flashSpeedMaxPct: 150,
  distractorCountMin: 3,
  distractorCountMax: 5,
  requiredItems: [
    'Chux',
    'Socks',
    'Thick blanket',
    'Bed sheet',
    'Pillowcase',
    'Clean gown',
    'Lifting sheet'
  ],
  distractors: [
    'Think blanket',
    'Extra towel',
    'Trash bag',
    'IV pole cover',
    'Bedpan',
    'Telemetry leads',
    'Nasal cannula',
    'Urinal'
  ]
};

export default bedPrepChallengeConfig;
