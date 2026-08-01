/**
 * Alteplase (Cathflo) for occluded PICC — AUTHOR CONTENT HERE.
 * Path: challenges/skills/alteplase/config.js
 *
 * Dwell: assess after 30 min; if still occluded, additional 120 min.
 * After function restored: aspirate 4–5 mL blood (≥10 kg) or 3 mL (<10 kg).
 */
/** @type {{ id: string, prompt: string, correct: string, choices: string[], phases?: string[] }[]} */
export const alteplaseQuestions = [
  {
    id: 'cathflo',
    phases: ['assess', 'focus'],
    prompt: 'What is the alternate (brand) name for alteplase used to clear a fibrin clot from a PICC line?',
    correct: 'Cathflo',
    choices: [
      'Cathflo',
      'Activase only (systemic stroke dose brand)',
      'Heparin lock flush',
      'tPA oral tablet'
    ]
  },
  {
    id: 'admin-method',
    phases: ['admin', 'focus'],
    prompt: 'How is alteplase (Cathflo) administered for an occluded PICC?',
    correct: 'Instill into the occluded lumen and allow to dwell; do not force against resistance',
    choices: [
      'Instill into the occluded lumen and allow to dwell; do not force against resistance',
      'Give as a rapid IV push into a peripheral vein',
      'Mix with antibiotics and run as a continuous drip',
      'Have the patient swallow the reconstituted powder'
    ]
  },
  {
    id: 'dwell-30',
    phases: ['admin', 'focus'],
    prompt: 'After instilling alteplase into an occluded PICC, when do you first reassess catheter function?',
    correct: 'After a 30-minute dwell',
    choices: [
      'After a 30-minute dwell',
      'Immediately (no dwell)',
      'Only at the end of the shift',
      'After 24 hours'
    ]
  },
  {
    id: 'dwell-120',
    phases: ['focus', 'reassess-30'],
    prompt: 'If the PICC is still occluded after the first 30-minute alteplase dwell, what is the next dwell?',
    correct: 'Allow an additional 120-minute dwell, then reassess',
    choices: [
      'Allow an additional 120-minute dwell, then reassess',
      'Pull the PICC immediately without further dwell',
      'Repeat a 5-minute dwell only',
      'Give a second dose orally'
    ]
  },
  {
    id: 'aspirate-adult',
    phases: ['aspirate', 'focus'],
    prompt: 'After catheter function is restored, how much blood do you aspirate in a patient ≥10 kg before flushing?',
    correct: '4 to 5 mL of blood',
    choices: [
      '4 to 5 mL of blood',
      '3 mL of blood',
      '20 mL of blood',
      'No aspiration — flush first with force'
    ]
  },
  {
    id: 'aspirate-peds',
    phases: ['focus'],
    prompt: 'After catheter function is restored, how much blood do you aspirate in a patient <10 kg before flushing?',
    correct: '3 mL of blood',
    choices: [
      '3 mL of blood',
      '4 to 5 mL of blood',
      '10 mL of blood',
      'Skip aspiration in small patients'
    ]
  }
];

export const alteplaseChallengeConfig = {
  questions: alteplaseQuestions,
  /** Teaching blurb for skill library / challenge chrome */
  methodSummary:
    'Instill alteplase (Cathflo) into the occluded PICC lumen and dwell 30 min; if still occluded, dwell an additional 120 min. When function returns, aspirate 4–5 mL blood (≥10 kg) or 3 mL (<10 kg), then flush with NS.',
  brandName: 'Cathflo'
};

export default alteplaseChallengeConfig;
