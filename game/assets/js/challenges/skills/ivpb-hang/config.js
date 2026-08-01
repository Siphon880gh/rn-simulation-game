/**
 * IVPB hang sequence — AUTHOR CONTENT HERE.
 * Path: challenges/skills/ivpb-hang/config.js
 * Test spawn: Skills → IVPB hang sequence
 */
export const ivpbHangChallengeConfig = {
  hintViews: 3,
  flashMs: 700,
  /** Preview flash speed slider (% of flashMs). 50 = half speed (slower). */
  flashSpeedMinPct: 50,
  flashSpeedMaxPct: 150,
  /** After a random mid-sequence anchor (not first/last), player builds this many next steps. */
  nextStepsCount: 2,
  sequence: [
    { label: 'Spike the IVPB' },
    { label: 'Connect to secondary tubing' },
    { label: 'Connect tubing to above Y site at primary' },
    { label: 'Backprime' },
    { label: "Check it's dripping" },
    { label: 'If not dripping: open clamps / no kink / IVPB higher than primary' }
  ],
  distractors: [
    'Connect tubing below Y site at primary',
    'Hang IVPB lower than the primary bag',
    'Spike the primary bag again',
    'Flush with a saline syringe only',
    'Clamp secondary and leave it closed',
    'Connect secondary to the pump cassette'
  ]
};

export default ivpbHangChallengeConfig;
