/**
 * Code Blue — AUTHOR CONTENT HERE.
 * Path: challenges/emergencies/code-blue/config.js
 * Test spawn: Emergencies → Code Blue
 *
 * Question types:
 * - choice — MCQ; set `choices` + `correct`
 * - order  — BLS step order using `steps` + `distractors`
 */
export const codeBlueChallengeConfig = {
  steps: [
    { id: 'call', label: 'Activate Code Blue / call for help' },
    { id: 'cpr', label: 'Start high-quality chest compressions' },
    { id: 'defib', label: 'Attach defibrillator / AED pads' }
  ],
  distractors: [
    'Leave to finish charting first',
    'Wait for the physician to arrive before acting',
    'Give oral meds before calling for help'
  ],
  questions: [
    {
      id: 'unresponsive-first',
      type: 'choice',
      prompt: 'Adult found unresponsive with no pulse. What do you do first?',
      choices: [
        'Activate Code Blue / call for help and start CPR',
        'Run to the med room for epinephrine',
        'Finish charting the last set of vitals',
        'Wait for the physician before touching the patient'
      ],
      correct: 'Activate Code Blue / call for help and start CPR'
    },
    {
      id: 'compression-rate',
      type: 'choice',
      prompt: 'Target chest compression rate for adult CPR?',
      choices: ['60–80/min', '100–120/min', '140–160/min', 'As fast as possible'],
      correct: '100–120/min'
    },
    {
      id: 'compression-depth',
      type: 'choice',
      prompt: 'Adult chest compression depth target?',
      choices: ['About 1 inch', 'At least 2 inches (5 cm)', '4–5 inches', 'Whatever feels firm'],
      correct: 'At least 2 inches (5 cm)'
    },
    {
      id: 'aed-wet',
      type: 'choice',
      prompt: 'Patient is in water / chest is soaking wet before AED shock. Best action?',
      choices: [
        'Dry the chest quickly, then apply pads',
        'Shock through wet clothing immediately',
        'Skip AED and only do breaths',
        'Move pads to the abdomen'
      ],
      correct: 'Dry the chest quickly, then apply pads'
    },
    {
      id: 'pulse-check',
      type: 'choice',
      prompt: 'During CPR, pulse checks should be:',
      choices: [
        'Brief (≤10 seconds) and limited',
        'At least 30 seconds every cycle',
        'Continuous with fingers on the neck',
        'Skipped entirely once compressions start'
      ],
      correct: 'Brief (≤10 seconds) and limited'
    },
    {
      id: 'team-role',
      type: 'choice',
      prompt: 'When Code Blue arrives, the bedside nurse should typically:',
      choices: [
        'Hand off situation, stay to help / document as assigned',
        'Leave immediately to avoid crowding',
        'Take over airway from respiratory without handoff',
        'Stop all compressions until the team lead arrives'
      ],
      correct: 'Hand off situation, stay to help / document as assigned'
    },
    {
      id: 'twelve-lead',
      type: 'choice',
      prompt: 'After ROSC (or when the team requests a diagnostic ECG), 12-lead placement priority?',
      choices: [
        'Place limb + precordial leads correctly (V1–V6 landmarks) without interrupting essential resuscitation tasks when still coding',
        'Skip leads and only use a finger pulse ox waveform',
        'Put all 10 electrodes in a cluster on the abdomen',
        'Wait until the next calendar day to obtain any ECG'
      ],
      correct: 'Place limb + precordial leads correctly (V1–V6 landmarks) without interrupting essential resuscitation tasks when still coding'
    },
    {
      id: 'twelve-lead-v1',
      type: 'choice',
      prompt: 'During/after a code when obtaining a 12-lead, where is V1 placed?',
      choices: [
        '4th intercostal space, right sternal border',
        '5th ICS midclavicular line only',
        'On top of the defibrillator pad',
        'Left lower quadrant of the abdomen'
      ],
      correct: '4th intercostal space, right sternal border'
    },
    {
      id: 'bls-order',
      type: 'order',
      prompt: 'Order the first response priorities (1 → 3):'
    }
  ]
};

export default codeBlueChallengeConfig;
