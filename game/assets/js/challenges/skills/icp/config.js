/**
 * ICP monitoring skill — AUTHOR CONTENT HERE.
 * Path: challenges/skills/icp/config.js
 */
/** @type {{ id: string, prompt: string, correct: string, choices: string[] }[]} */
export const icpQuestions = [
  {
    id: 'range',
    prompt: 'What is a commonly cited normal adult ICP range?',
    correct: '5–15 mmHg',
    choices: ['5–15 mmHg', '40–60 mmHg', '0–2 mmHg', '90–120 mmHg']
  },
  {
    id: 'hob',
    prompt: 'First positioning priority for a patient with rising ICP (unless contraindicated)?',
    correct: 'Keep head midline; elevate HOB about 30°',
    choices: [
      'Keep head midline; elevate HOB about 30°',
      'Trendelenburg to increase cerebral perfusion',
      'Flat supine with neck flexed for comfort',
      'Chair position with legs dangling'
    ]
  },
  {
    id: 'late-sign',
    prompt: 'Which finding is a late/ominous sign of elevated ICP?',
    correct: 'Cushing triad (↑ SBP, ↓ HR, irregular respirations)',
    choices: [
      'Cushing triad (↑ SBP, ↓ HR, irregular respirations)',
      'Mild headache that improves with caffeine',
      'Warm flushed skin only',
      'Isolated low-grade fever'
    ]
  },
  {
    id: 'avoid',
    prompt: 'Which action should you avoid in a patient with elevated ICP?',
    correct: 'Cluster all care so coughing and suctioning happen back-to-back',
    choices: [
      'Cluster all care so coughing and suctioning happen back-to-back',
      'Space care to limit sustained ICP spikes',
      'Monitor neuro status for change',
      'Maintain a quiet, low-stimulus environment'
    ]
  }
];

export const icpChallengeConfig = {
  questions: icpQuestions
};

export default icpChallengeConfig;
