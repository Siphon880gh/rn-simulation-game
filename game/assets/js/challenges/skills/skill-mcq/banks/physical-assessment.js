/**
 * Bedside physical assessment banks for skill-mcq (shift assessment pool).
 * Types: choice | sata | match | audio (sheet "Video" audio identify)
 * Heart sound clips: game/assets/audio/heart-sounds/
 */
const HS = 'assets/audio/heart-sounds';

export const heartSoundsSkillBank = {
  title: 'Heart sounds',
  questions: [
    {
      id: 's1-s2',
      type: 'choice',
      category: 'Heart Sounds',
      prompt: 'Normal S₁ and S₂ correspond to?',
      choices: [
        'S₁ = AV valve closure (mitral/tricuspid); S₂ = semilunar valve closure (aortic/pulmonic)',
        'S₁ = lung crackles; S₂ = bowel sounds',
        'S₁ = only aortic opening; S₂ = only mitral opening',
        'S₁ and S₂ are always pathologic murmurs'
      ],
      correctIndex: 0
    },
    {
      id: 'apex',
      type: 'choice',
      category: 'Heart Sounds',
      prompt: 'Best auscultation landmark for the mitral (apex) area in adults?',
      choices: [
        '5th intercostal space, midclavicular line',
        '2nd intercostal space, right sternal border',
        'Over the umbilicus',
        'Posterior mid-scapular line only'
      ],
      correctIndex: 0
    },
    {
      id: 'murmur-vs-rub',
      type: 'choice',
      category: 'Heart Sounds',
      prompt: 'A harsh systolic murmur at the right 2nd ICS that radiates to the carotids most suggests?',
      choices: [
        'Aortic stenosis pattern (until proven otherwise clinically)',
        'Normal childhood venous hum only',
        'Isolated pleural friction rub',
        'Absent heart sounds'
      ],
      correctIndex: 0
    },
    {
      id: 'listen-sites',
      type: 'match',
      category: 'Heart Sounds',
      instruction: 'Mix and match',
      prompt: 'Match valve areas with common landmarks',
      pairs: [
        { term: 'Aortic', definition: '2nd ICS, right sternal border' },
        { term: 'Pulmonic', definition: '2nd ICS, left sternal border' },
        { term: 'Tricuspid', definition: 'Lower left sternal border' },
        { term: 'Mitral', definition: '5th ICS, midclavicular line (apex)' }
      ]
    },
    {
      id: 'audio-split-s2',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/s2-aka-split-s2.mp3`,
      choices: [
        'S2 aka Split S2 (Lub DbDb) (Aortic valve closing before the pulmonary valve; could be ASD / atrial septal defect)',
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)',
        'S4 (TENnessee) (Resistance pumping blood from the atria into the left ventricle due to stiffness)',
        'Normal (S1 S2) (Lub Dub) (Closing of AV valve and SL valve)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-s3',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/s3-aka-kentucky.mp3`,
      choices: [
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)',
        'S2 aka Split S2 (Lub DbDb) (Aortic valve closing before the pulmonary valve; could be ASD / atrial septal defect)',
        'S4 (TENnessee) (Resistance pumping blood from the atria into the left ventricle due to stiffness)',
        'Normal (S1 S2) (Lub Dub) (Closing of AV valve and SL valve)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-s4',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/s4-aka-tennessee.mp3`,
      choices: [
        'S4 (TENnessee) (Resistance pumping blood from the atria into the left ventricle due to stiffness)',
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)',
        'S2 aka Split S2 (Lub DbDb) (Aortic valve closing before the pulmonary valve; could be ASD / atrial septal defect)',
        'Normal (S1 S2) (Lub Dub) (Closing of AV valve and SL valve)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-normal',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/normal.mp3`,
      choices: [
        'Normal (S1 S2) (Lub Dub) (Closing of AV valve and SL valve)',
        'S2 aka Split S2 (Lub DbDb) (Aortic valve closing before the pulmonary valve; could be ASD / atrial septal defect)',
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)',
        'S4 (TENnessee) (Resistance pumping blood from the atria into the left ventricle due to stiffness)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-mitral-regurg',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/mitral-regurgitation.mp3`,
      choices: [
        'Mitral Regurgitation (Brrrr) (Back flow of blood due to valve not closing properly)',
        'Pulmonary Stenosis (Whooshing) (Narrowing of pulmonary valves)',
        'Ventricular Septal Defect (Soft Whoosh with Thrill) (Hole in the septum that divides ventricles)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)',
        'Aortic Regurgitation (Dub Grrrr) (Back flow of blood due to valve not closing correctly)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-mitral-stenosis',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/mitral-stenosis.mp3`,
      choices: [
        'Mitral Stenosis (Lub Dub Drr) (Narrowing of mitral valves)',
        'Atrial Septal Defect (Whooshing) (Hole in the septum that divides atria)',
        'Normal (S1 S2) (Lub Dub) (Closing of AV valve and SL valve)',
        'Pericardial Rub (Scratching) (Acute pericarditis)',
        'Pulmonary Stenosis (Whooshing) (Narrowing of pulmonary valves)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-aortic-regurg',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/aortic-regurgitation.mp3`,
      choices: [
        'Aortic Regurgitation (Dub Grrrr) (Back flow of blood due to valve not closing correctly)',
        'Mitral Regurgitation (Brrrr) (Back flow of blood due to valve not closing properly)',
        'Aortic Stenosis (Dub Whoosh) (Narrowing of aortic valve)',
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)',
        'Patent Ductus Arteriosus (Machine-like) (Persistent opening between aorta and pulmonary artery)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-aortic-stenosis',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/aortic-stenosis.mp3`,
      choices: [
        'Aortic Stenosis (Dub Whoosh) (Narrowing of aortic valve)',
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)',
        'Pericardial Rub (Scratching) (Acute pericarditis)',
        'Mitral Regurgitation (Brrrr) (Back flow of blood due to valve not closing properly)',
        'Mitral Stenosis (Lub Dub Drr) (Narrowing of mitral valves)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-benign-murmur',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/benign-murmur.mp3`,
      choices: [
        'Benign Murmur (Swishing) (Murmur caused by blood flowing through a normal heart)',
        'Pericardial Rub (Scratching) (Acute pericarditis)',
        'Aortic Regurgitation (Dub Grrrr) (Back flow of blood due to valve not closing correctly)',
        'Aortic Stenosis (Dub Whoosh) (Narrowing of aortic valve)',
        'Mitral Stenosis (Lub Dub Drr) (Narrowing of mitral valves)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-pericardial-rub',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/pericardial-rub.mp3`,
      choices: [
        'Pericardial Rub (Scratching) (Acute pericarditis)',
        'Patent Ductus Arteriosus (Machine-like) (Persistent opening between aorta and pulmonary artery)',
        'Mitral Regurgitation (Brrrr) (Back flow of blood due to valve not closing properly)',
        'Aortic Regurgitation (Dub Grrrr) (Back flow of blood due to valve not closing correctly)',
        'S3 (Ken-tuck-EY) (Tensing of chordae tendineae as rapid filling of the ventricles causes the chamber to expand)'
      ],
      correctIndex: 0
    },
    {
      id: 'audio-pulmonary-stenosis',
      type: 'audio',
      category: 'Heart Sound',
      instruction: 'Identify heart sound',
      prompt: 'Listen and identify the heart sound',
      audio: `${HS}/pulmonary-stenosis.mp3`,
      choices: [
        'Pulmonary Stenosis (Whooshing) (Narrowing of pulmonary valves)',
        'Aortic Stenosis (Dub Whoosh) (Narrowing of aortic valve)',
        'Mitral Stenosis (Lub Dub Drr) (Narrowing of mitral valves)',
        'Mitral Regurgitation (Brrrr) (Back flow of blood due to valve not closing properly)',
        'Aortic Regurgitation (Dub Grrrr) (Back flow of blood due to valve not closing correctly)'
      ],
      correctIndex: 0
    }
  ]
};

const LS = 'assets/audio/lung-sounds';

/** Shared choice set for lung-sound identify clips (sheet order; correctIndex 0-based). */
const LUNG_IDENTIFY_CHOICES = [
  'Stridor',
  'Coarse Crackles (Rales) (Exp / Inhal inflammation)',
  'Fine Crackles (Rales) (2nd and 1/2 of inspiration. Air going over fluid in alveoli)',
  'Wheezes (More in expiration, High pitched upper airway)',
  'Rhonchi (Low pitch cont wheeze, at lower airways)'
];

export const lungSoundsSkillBank = {
  title: 'Lung sounds',
  questions: [
    {
      id: 'crackles',
      type: 'choice',
      category: 'Lung Sounds',
      prompt: 'Fine crackles (rales) late in inspiration often suggest?',
      choices: [
        'Fluid / atelectasis / interstitial processes at alveoli',
        'Upper airway foreign body only',
        'Normal vesicular breath sounds',
        'Guaranteed pneumothorax'
      ],
      correctIndex: 0
    },
    {
      id: 'wheeze',
      type: 'choice',
      category: 'Lung Sounds',
      prompt: 'Continuous high-pitched musical sounds on expiration usually indicate?',
      choices: [
        'Airway narrowing (e.g. bronchospasm / wheeze)',
        'Normal tracheal breath sounds',
        'Pericardial knock',
        'Absent aeration only'
      ],
      correctIndex: 0
    },
    {
      id: 'compare',
      type: 'sata',
      category: 'Lung Sounds',
      instruction: 'Select all that apply',
      prompt: 'Good lung auscultation practice includes:',
      choices: [
        'Compare side-to-side at the same level',
        'Listen through a full inspiration and expiration',
        'Document adventitious sounds with location and timing',
        'Auscultate only over clothing for speed',
        'Skip bases if the patient is tired'
      ],
      correctIndexes: [0, 1, 2]
    },
    {
      id: 'sound-match',
      type: 'match',
      category: 'Lung Sounds',
      instruction: 'Mix and match',
      prompt: 'Match lung sound with typical meaning',
      pairs: [
        { term: 'Vesicular', definition: 'Soft normal peripheral breath sounds' },
        { term: 'Wheeze', definition: 'Musical continuous sound from narrowed airways' },
        { term: 'Crackles', definition: 'Discontinuous popping, often fluid/atelectasis' },
        { term: 'Stridor', definition: 'Harsh high-pitched sound — upper airway concern' }
      ]
    },
    {
      id: 'audio-stridor',
      type: 'audio',
      category: 'Lung Sound',
      instruction: 'Identify lung sound',
      prompt: 'Listen and identify the lung sound',
      audio: `${LS}/stridor.mp3`,
      choices: [...LUNG_IDENTIFY_CHOICES],
      correctIndex: 0
    },
    {
      id: 'audio-coarse',
      type: 'audio',
      category: 'Lung Sound',
      instruction: 'Identify lung sound',
      prompt: 'Listen and identify the lung sound',
      audio: `${LS}/coarse.mp3`,
      choices: [...LUNG_IDENTIFY_CHOICES],
      correctIndex: 1
    },
    {
      id: 'audio-fine',
      type: 'audio',
      category: 'Lung Sound',
      instruction: 'Identify lung sound',
      prompt: 'Listen and identify the lung sound',
      audio: `${LS}/fine.mp3`,
      choices: [...LUNG_IDENTIFY_CHOICES],
      correctIndex: 2
    },
    {
      id: 'audio-wheeze',
      type: 'audio',
      category: 'Lung Sound',
      instruction: 'Identify lung sound',
      prompt: 'Listen and identify the lung sound',
      audio: `${LS}/wheeze.mp3`,
      choices: [...LUNG_IDENTIFY_CHOICES],
      correctIndex: 3
    },
    {
      id: 'audio-rhonchi',
      type: 'audio',
      category: 'Lung Sound',
      instruction: 'Identify lung sound',
      prompt: 'Listen and identify the lung sound',
      audio: `${LS}/rhonchi.mp3`,
      choices: [...LUNG_IDENTIFY_CHOICES],
      correctIndex: 4
    }
  ]
};

export const capillaryRefillSkillBank = {
  title: 'Capillary refill',
  questions: [
    {
      id: 'normal',
      type: 'choice',
      category: 'Capillary Refill',
      prompt: 'Normal capillary refill time in adults is generally?',
      choices: [
        'Less than about 2–3 seconds',
        '10–15 seconds',
        'Exactly 30 seconds',
        'Only measured on the earlobe forever'
      ],
      correctIndex: 0
    },
    {
      id: 'technique',
      type: 'choice',
      category: 'Capillary Refill',
      prompt: 'Correct bedside technique for capillary refill?',
      choices: [
        'Briefly press nail bed or skin until blanch, release, time return of color',
        'Squeeze the arm with a BP cuff for 5 minutes then guess',
        'Only ask the patient if their fingers feel cold',
        'Document “WNL” without observing color return'
      ],
      correctIndex: 0
    },
    {
      id: 'delay-means',
      type: 'choice',
      category: 'Capillary Refill',
      prompt: 'Prolonged capillary refill may indicate?',
      choices: [
        'Poor peripheral perfusion (shock, cold, vasoconstriction) — correlate clinically',
        'Perfect fluid overload with no other findings',
        'That SpO₂ is always 100%',
        'A normal finding in every warm, well-perfused patient'
      ],
      correctIndex: 0
    },
    {
      id: 'limits',
      type: 'sata',
      category: 'Capillary Refill',
      instruction: 'Select all that apply',
      prompt: 'Capillary refill interpretation should consider:',
      choices: [
        'Ambient temperature and extremity temperature',
        'Overall perfusion (BP, mentation, urine, skin)',
        'That it is one data point, not a standalone diagnosis',
        'That nail polish or poor lighting can affect reading',
        'That a delayed refill always proves PE alone'
      ],
      correctIndexes: [0, 1, 2, 3]
    }
  ]
};

export const swellingSkillBank = {
  title: 'Swelling / pitting edema',
  questions: [
    {
      id: 'pitting-scale',
      type: 'choice',
      category: 'Swelling',
      prompt: 'How is pitting edema commonly graded?',
      choices: [
        '1+ barely detectable pit → 4+ deep pit with prolonged recovery',
        'Only “present” or “absent” with no depth description',
        'By SpO₂ percentage alone',
        'By heart rate only'
      ],
      correctIndex: 0
    },
    {
      id: 'one-plus',
      type: 'choice',
      category: 'Swelling',
      prompt: '1+ pitting edema typically means?',
      choices: [
        'Slight pit (~2 mm) that rebounds quickly',
        'Deep pit (~8 mm) lasting minutes',
        'No indentation possible',
        'Anasarca with weeping skin only'
      ],
      correctIndex: 0
    },
    {
      id: 'four-plus',
      type: 'choice',
      category: 'Swelling',
      prompt: '4+ pitting edema typically means?',
      choices: [
        'Very deep pit (~8 mm) with prolonged rebound',
        'Trace swelling only at the ankle bone',
        'Normal morning foot puffiness',
        'A bruise without fluid'
      ],
      correctIndex: 0
    },
    {
      id: 'assess-sata',
      type: 'sata',
      category: 'Swelling',
      instruction: 'Select all that apply',
      prompt: 'When charting edema / swelling, include:',
      choices: [
        'Location (e.g. bilateral ankles, sacral)',
        'Pitting grade if pitting is present',
        'Laterality / symmetry',
        'Associated skin changes (weeping, redness) when relevant',
        'Only the word “edema” with no location'
      ],
      correctIndexes: [0, 1, 2, 3]
    },
    {
      id: 'grade-match',
      type: 'match',
      category: 'Swelling',
      instruction: 'Mix and match',
      prompt: 'Match pitting grade with typical depth',
      pairs: [
        { term: '1+', definition: '~2 mm slight pit, rapid rebound' },
        { term: '2+', definition: '~4 mm pit, somewhat deeper' },
        { term: '3+', definition: '~6 mm deep pit, slower rebound' },
        { term: '4+', definition: '~8 mm very deep pit, prolonged rebound' }
      ]
    }
  ]
};
