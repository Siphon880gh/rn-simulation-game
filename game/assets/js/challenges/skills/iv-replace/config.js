/**
 * IV bag / IVPB replace — AUTHOR CONTENT HERE.
 * Path: challenges/skills/iv-replace/config.js
 * Triggered when an IV line hits data-iv-empty-at (bag empty).
 * Test spawn: Skills → IV bag replace
 */
export const ivReplaceChallengeConfig = {
  hintViews: 3,
  flashMs: 700,
  flashSpeedMinPct: 50,
  flashSpeedMaxPct: 150,
  /** After a random mid-sequence anchor (not first/last), player builds this many next steps. */
  nextStepsCount: 2,
  sequence: [
    { label: 'Check tubing date sticker (beyond-use)' },
    { label: 'If expired: replace primary tubing with the new bag' },
    { label: 'Spike the new primary bag' },
    { label: 'Hang new bag and prime as needed' },
    { label: 'Unclamp and confirm drip at ordered rate' },
    { label: 'Label bag with hang time/date and document' }
  ],
  distractors: [
    'Reuse tubing past the sticker date',
    'Spike the new bag without checking the tubing sticker',
    'Hang the empty bag again and increase the rate',
    'Clamp primary and leave the line dry',
    'Flush only — skip hanging a new bag',
    'Connect secondary tubing below the Y site'
  ],
  tubingMcq: {
    id: 'tubing-sticker',
    prompt: 'Primary bag is empty. The tubing date sticker shows yesterday (past facility beyond-use). Best action when hanging the new bag?',
    correct: 'Replace the primary tubing with the new bag',
    choices: [
      'Replace the primary tubing with the new bag',
      'Keep the old tubing — stickers are only for pharmacy',
      'Increase the rate on the empty bag until pharmacy arrives',
      'Clamp the line and wait for the next scheduled tubing change day'
    ]
  }
};

export default ivReplaceChallengeConfig;
