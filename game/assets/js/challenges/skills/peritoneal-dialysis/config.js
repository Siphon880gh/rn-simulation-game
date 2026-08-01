/**
 * Peritoneal dialysis exchange sequence — AUTHOR CONTENT HERE.
 * Path: challenges/skills/peritoneal-dialysis/config.js
 * Test spawn: Skills → Peritoneal dialysis sequence
 */
export const peritonealDialysisChallengeConfig = {
  hintViews: 3,
  flashMs: 700,
  /** Preview flash speed slider (% of flashMs). 50 = half speed (slower). */
  flashSpeedMinPct: 50,
  flashSpeedMaxPct: 150,
  /** After a random mid-sequence anchor (not first/last), player builds this many next steps. */
  nextStepsCount: 2,
  sequence: [
    { label: 'Check BP/vitals' },
    { label: 'Hand hygiene / prepare sterile supplies' },
    { label: 'Warm and prime dialysate' },
    { label: 'Drain first (outflow)' },
    { label: 'Fill abdomen' },
    { label: 'Clamp / dwell per protocol' }
  ],
  distractors: [
    'Fill first, never drain',
    'Skip priming and force cold dialysate',
    'Ignore cloudy effluent',
    'Flush PD catheter with IV saline push',
    'Disconnect without clamping',
    'Start dwell before drain completes'
  ]
};

export default peritonealDialysisChallengeConfig;
