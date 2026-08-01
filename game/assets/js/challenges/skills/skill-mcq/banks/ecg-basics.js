/**
 * ECG / telemetry rhythm-strip identification (skill-mcq).
 * Strips: repo acls-rhythm-strips/ (served from game/ via ../acls-rhythm-strips/).
 * Default run = 1 question; “I want to feel challenged” bumps count for boosters.
 *
 * `pools` ties strips to flavored incident alarms (metadata.rhythmPool).
 * General central/tele strip tasks omit rhythmPool → any strip.
 */
const STRIP = '../acls-rhythm-strips';

/** @type {{ id: string, label: string, file: string, distractors: string[], pools?: string[] }[]} */
const RHYTHMS = [
  {
    id: 'nsr',
    label: 'Normal Sinus Rhythm',
    file: 'normal-sinus-rhythm.gif',
    distractors: ['Sinus Bradycardia', 'Sinus Arrhythmia', 'First Degree Heart Block']
  },
  {
    id: 'sinus-brady',
    label: 'Sinus Bradycardia',
    file: 'sinus-bradycardia.gif',
    distractors: ['Normal Sinus Rhythm', 'Junctional Escape Rhythm', 'Second Degree Heart Block Type II'],
    pools: ['unstable']
  },
  {
    id: 'sinus-tachy',
    label: 'Sinus Tachycardia',
    file: 'sinus-tachycardia.gif',
    distractors: ['Supraventricular Tachycardia', 'Atrial Flutter', 'Normal Sinus Rhythm'],
    pools: ['unstable']
  },
  {
    id: 'sinus-arrhythmia',
    label: 'Sinus Arrhythmia',
    file: 'sinus-arrhythmia.gif',
    distractors: ['Atrial Fibrillation', 'Wandering Atrial Pacemaker', 'Sinus Pause']
  },
  {
    id: 'sinus-arrest',
    label: 'Sinus Arrest',
    file: 'sinus-arrest.gif',
    distractors: ['Sinus Exit Block', 'Sinus Pause', 'Third Degree Heart Block'],
    pools: ['pause-drop']
  },
  {
    id: 'sinus-exit-block',
    label: 'Sinus Exit Block',
    file: 'sinus-exit-block.gif',
    distractors: ['Sinus Arrest', 'Sinus Pause', 'Second Degree Heart Block Type II'],
    pools: ['pause-drop']
  },
  {
    id: 'sinus-pause',
    label: 'Sinus Pause',
    file: 'sinus-pause.gif',
    distractors: ['Sinus Arrest', 'Sinus Exit Block', 'Premature Atrial Complex'],
    pools: ['pause-drop']
  },
  {
    id: 'pac',
    label: 'Premature Atrial Complex',
    file: 'premature-atrial-complex.gif',
    distractors: ['Premature Junctional Complex', 'Normal Sinus Rhythm', 'Wandering Atrial Pacemaker']
  },
  {
    id: 'wap',
    label: 'Wandering Atrial Pacemaker',
    file: 'wandering-atrial-pacemaker.gif',
    distractors: ['Multifocal Atrial Tachycardia', 'Atrial Fibrillation', 'Sinus Arrhythmia']
  },
  {
    id: 'mat',
    label: 'Multifocal Atrial Tachycardia',
    file: 'multifocal-atrial-tachycardia.gif',
    distractors: ['Wandering Atrial Pacemaker', 'Atrial Fibrillation', 'Atrial Flutter'],
    pools: ['irregular-tachy', 'unstable']
  },
  {
    id: 'aflutter',
    label: 'Atrial Flutter',
    file: 'atrial-flutter.gif',
    distractors: ['Atrial Fibrillation', 'Supraventricular Tachycardia', 'Sinus Tachycardia'],
    pools: ['irregular-tachy', 'unstable']
  },
  {
    id: 'afib',
    label: 'Atrial Fibrillation',
    file: 'atrial-fibrillation.gif',
    distractors: ['Atrial Flutter', 'Multifocal Atrial Tachycardia', 'Wandering Atrial Pacemaker'],
    pools: ['irregular-tachy', 'unstable']
  },
  {
    id: 'svt',
    label: 'Supraventricular Tachycardia',
    file: 'supraventricular-tachycardia.gif',
    distractors: ['Sinus Tachycardia', 'Atrial Flutter', 'Junctional Tachycardia'],
    pools: ['unstable']
  },
  {
    id: 'wpw',
    label: 'Wolff-Parkinson-White Syndrome',
    file: 'wolff-parkinson-white.gif',
    distractors: ['Bundle Branch Block', 'Normal Sinus Rhythm', 'Ventricular Pacemaker Rhythm']
  },
  {
    id: 'pjc',
    label: 'Premature Junctional Complex',
    file: 'premature-junctional-complex.gif',
    distractors: ['Premature Atrial Complex', 'Junctional Escape Beat', 'Normal Sinus Rhythm']
  },
  {
    id: 'jeb',
    label: 'Junctional Escape Beat',
    file: 'junctional-escape-beat.gif',
    distractors: ['Premature Junctional Complex', 'Junctional Escape Rhythm', 'Sinus Pause'],
    pools: ['pause-drop']
  },
  {
    id: 'jer',
    label: 'Junctional Escape Rhythm',
    file: 'junctional-escape-rhythm.gif',
    distractors: ['Accelerated Junctional Rhythm', 'Sinus Bradycardia', 'Third Degree Heart Block']
  },
  {
    id: 'ajr',
    label: 'Accelerated Junctional Rhythm',
    file: 'accelerated-junctional-rhythm.gif',
    distractors: ['Junctional Escape Rhythm', 'Junctional Tachycardia', 'Sinus Tachycardia']
  },
  {
    id: 'jt',
    label: 'Junctional Tachycardia',
    file: 'junctional-tachycardia.gif',
    distractors: ['Supraventricular Tachycardia', 'Accelerated Junctional Rhythm', 'Sinus Tachycardia'],
    pools: ['unstable']
  },
  {
    id: '1avb',
    label: 'First Degree Heart Block',
    file: 'first-degree-heart-block.gif',
    distractors: ['Second Degree Heart Block Type I', 'Normal Sinus Rhythm', 'Bundle Branch Block']
  },
  {
    id: '2avb1',
    label: 'Second Degree Heart Block Type I',
    file: 'second-degree-heart-block-type-i.gif',
    distractors: ['Second Degree Heart Block Type II', 'First Degree Heart Block', 'Third Degree Heart Block'],
    pools: ['pause-drop']
  },
  {
    id: '2avb2',
    label: 'Second Degree Heart Block Type II',
    file: 'second-degree-heart-block-type-ii.gif',
    distractors: ['Second Degree Heart Block Type I', 'Third Degree Heart Block', 'Sinus Exit Block'],
    pools: ['pause-drop', 'unstable']
  },
  {
    id: '2avb2-unpatterned',
    label: 'Second Degree Heart Block Type II (unpatterned)',
    file: 'second-degree-heart-block-type-ii-unpatterned.gif',
    distractors: ['Second Degree Heart Block Type I', 'Third Degree Heart Block', 'Sinus Arrest'],
    pools: ['pause-drop', 'unstable']
  },
  {
    id: '3avb',
    label: 'Third Degree Heart Block',
    file: 'third-degree-heart-block.gif',
    distractors: ['Second Degree Heart Block Type II', 'Junctional Escape Rhythm', 'Ventricular Pacemaker Rhythm'],
    pools: ['pause-drop', 'unstable']
  },
  {
    id: 'bbb',
    label: 'Bundle Branch Block',
    file: 'bundle-branch-block.gif',
    distractors: ['Wolff-Parkinson-White Syndrome', 'Ventricular Pacemaker Rhythm', 'First Degree Heart Block']
  },
  {
    id: 'atrial-pacer',
    label: 'Atrial Pacemaker Rhythm',
    file: 'atrial-pacemaker-rhythm.gif',
    distractors: ['Ventricular Pacemaker Rhythm', 'AV Sequential Pacemaker Rhythm', 'Failure to Pace'],
    pools: ['pacer']
  },
  {
    id: 'vent-pacer',
    label: 'Ventricular Pacemaker Rhythm',
    file: 'ventricular-pacemaker-rhythm.gif',
    distractors: ['Atrial Pacemaker Rhythm', 'AV Sequential Pacemaker Rhythm', 'Failure to Capture'],
    pools: ['pacer']
  },
  {
    id: 'av-seq-pacer',
    label: 'AV Sequential Pacemaker Rhythm',
    file: 'av-sequential-pacemaker-rhythm.gif',
    distractors: ['Atrial Pacemaker Rhythm', 'Ventricular Pacemaker Rhythm', 'Failure to Sense'],
    pools: ['pacer']
  },
  {
    id: 'ftc',
    label: 'Failure to Capture',
    file: 'failure-to-capture.gif',
    distractors: ['Failure to Pace', 'Failure to Sense', 'Ventricular Pacemaker Rhythm'],
    pools: ['pacer', 'pause-drop', 'unstable']
  },
  {
    id: 'ftp',
    label: 'Failure to Pace',
    file: 'failure-to-pace.gif',
    distractors: ['Failure to Capture', 'Failure to Sense', 'Sinus Arrest'],
    pools: ['pacer', 'pause-drop', 'unstable']
  },
  {
    id: 'fts',
    label: 'Failure to Sense',
    file: 'failure-to-sense.jpg',
    distractors: ['Failure to Capture', 'Failure to Pace', 'AV Sequential Pacemaker Rhythm'],
    pools: ['pacer', 'unstable']
  }
];

function buildStripQuestion(entry) {
  return {
    id: `strip-${entry.id}`,
    type: 'image',
    category: 'Rhythm strip',
    instruction: 'Identify the rhythm',
    prompt: 'What rhythm is shown on this strip?',
    image: `${STRIP}/${entry.file}`,
    correct: entry.label,
    choices: [entry.label, ...entry.distractors],
    pools: Array.isArray(entry.pools) ? [...entry.pools] : []
  };
}

export const ecgBasicsSkillBank = {
  title: 'ECG / telemetry basics',
  questions: [
    {
      id: 'vfib-priority',
      type: 'choice',
      category: 'Priorities',
      prompt: 'Unresponsive patient with VF on the monitor — priority?',
      correct: 'Call a code / start CPR and defibrillation pathway',
      choices: [
        'Call a code / start CPR and defibrillation pathway',
        'Obtain orthostatic vitals first',
        'Give oral aspirin and wait',
        'Turn off the monitor to stop the alarm'
      ]
    },
    {
      id: 'strip-approach',
      type: 'choice',
      category: 'Approach',
      prompt: 'Best systematic approach when reading a telemetry strip?',
      correct: 'Rate, regularity, P waves, PR interval, QRS width, then rhythm name',
      choices: [
        'Rate, regularity, P waves, PR interval, QRS width, then rhythm name',
        'Guess the name from the first complex only',
        'Silence the alarm before assessing the patient',
        'Treat every irregular rhythm as asystole'
      ]
    },
    ...RHYTHMS.map(buildStripQuestion)
  ]
};
