/**
 * Accucheck / AccuData Inform competency — AUTHOR CONTENT HERE.
 * Path: challenges/skills/accucheck/config.js
 * Sliding-scale units (always question 1) live in challenge.js; these MCQs
 * fill extra “I want to feel challenged” slots from AccuData Inform facts.
 */
/** @type {{ id: string, prompt: string, correct: string, choices: string[], category?: string }[]} */
export const accucheckMcqQuestions = [
  {
    id: 'control-stability',
    category: 'Meter care',
    prompt: 'How long are opened glucose control solutions stable?',
    correct: '90 days after opening',
    choices: [
      '90 days after opening',
      '30 days after opening',
      '7 days after opening',
      'Until the printed expiration date only (ignore open date)'
    ]
  },
  {
    id: 'clean-contact',
    category: 'Meter care',
    prompt: 'Instrument cleaning/disinfection contact time for the AccuData Inform meter?',
    correct: '2 minutes',
    choices: ['1 minute', '2 minutes', '3 minutes', '4 minutes']
  },
  {
    id: 'qc-frequency',
    category: 'Quality control',
    prompt: 'How often must Quality Control (QC) testing be performed?',
    correct: 'Once every 24 hours',
    choices: [
      'Once every 24 hours',
      'Once per shift',
      'Once per week',
      'Only after a failed patient result'
    ]
  },
  {
    id: 'lo-hi',
    category: 'Meter limits',
    prompt: 'What do LO and HI mean on the AccuData Inform meter display?',
    correct: 'LO = glucose <10 mg/dL; HI = glucose >600 mg/dL',
    choices: [
      'LO = glucose <10 mg/dL; HI = glucose >600 mg/dL',
      'LO = glucose <60 mg/dL; HI = glucose >400 mg/dL',
      'LO = low battery; HI = high temperature',
      'LO = Level 1 QC; HI = Level 2 QC'
    ]
  },
  {
    id: 'patient-id',
    category: 'Patient test',
    prompt: 'Which patient identifier should you use when programming a patient test?',
    correct: 'Account Number',
    choices: [
      'Account Number',
      'Medical Record Number',
      'Room Number',
      'Date of birth only'
    ]
  },
  {
    id: 'critical-values',
    category: 'Critical values',
    prompt: 'Adult point-of-care glucose critical values (facility thresholds)?',
    correct: 'Less than 60 mg/dL or greater than 400 mg/dL',
    choices: [
      'Less than 60 mg/dL or greater than 400 mg/dL',
      'Less than 10 mg/dL or greater than 600 mg/dL',
      'Less than 70 mg/dL or greater than 180 mg/dL',
      'Less than 40 mg/dL or greater than 250 mg/dL'
    ]
  },
  {
    id: 'lo-hi-vs-critical',
    category: 'Critical values',
    prompt: 'How do meter LO/HI limits differ from adult critical-value thresholds?',
    correct:
      'LO/HI are meter display limits (<10 / >600); critical values are facility thresholds (<60 / >400)',
    choices: [
      'LO/HI are meter display limits (<10 / >600); critical values are facility thresholds (<60 / >400)',
      'They are the same numbers used for different labels',
      'Critical values only apply to lab analyzers, never POC meters',
      'LO/HI mean critical low/high at <60 / >400'
    ]
  },
  {
    id: 'qc-start',
    category: 'Quality control',
    prompt: 'To perform a QC test, what do you select first on the meter?',
    correct: 'QUALITY CONTROL',
    choices: ['QUALITY CONTROL', 'Patient Test', 'Data Review', 'Strip Lot Setup']
  },
  {
    id: 'qc-scan-control',
    category: 'Quality control',
    prompt: 'During QC, which barcode do you scan for the control being tested?',
    correct: 'The barcode on the control-solution vial',
    choices: [
      'The barcode on the control-solution vial',
      'The patient’s wristband only',
      'A random strip from the box without scanning',
      'The meter serial number sticker'
    ]
  },
  {
    id: 'qc-scan-strips',
    category: 'Quality control',
    prompt: 'During QC, after scanning the control vial, you must also scan?',
    correct: 'The barcode on the vial of test strips',
    choices: [
      'The barcode on the vial of test strips',
      'The charge nurse’s badge only',
      'The printer barcode',
      'Nothing else — start the test immediately'
    ]
  },
  {
    id: 'qc-levels',
    category: 'Quality control',
    prompt: 'Which QC levels must be performed for AccuData Inform competency/recertification?',
    correct: 'Level 1 and Level 2 QC using your own user ID',
    choices: [
      'Level 1 and Level 2 QC using your own user ID',
      'Level 1 only under a shared unit login',
      'Either Level 1 or Level 2 once per month',
      'No QC if you pass the written quiz'
    ]
  },
  {
    id: 'qc-document',
    category: 'Quality control',
    prompt: 'How must both QC control results be documented?',
    correct: 'As PASS or FAIL for each control',
    choices: [
      'As PASS or FAIL for each control',
      'As numeric glucose only with no pass/fail',
      'Only if one control fails',
      'Documented by lab staff only; nurses never record QC'
    ]
  },
  {
    id: 'pass-score',
    category: 'Recertification',
    prompt: 'What written competency score is required to pass?',
    correct: 'At least 80%',
    choices: ['At least 80%', 'At least 70%', 'At least 90%', '100% only']
  },
  {
    id: 'recert-incomplete',
    category: 'Recertification',
    prompt: 'Is passing the written questions alone enough for AccuData Inform recertification?',
    correct:
      'No — you must also demonstrate proper testing with required blind samples/QC and be observed',
    choices: [
      'No — you must also demonstrate proper testing with required blind samples/QC and be observed',
      'Yes — written score ≥80% completes recertification',
      'Yes — if your supervisor initials the form',
      'No — only observation is required; skip written and QC'
    ]
  },
  {
    id: 'observer',
    category: 'Recertification',
    prompt: 'Who may observe the glucose-testing procedure for competency?',
    correct:
      'An authorized person (e.g., charge nurse, director, educator, or laboratory POC coordinator)',
    choices: [
      'An authorized person (e.g., charge nurse, director, educator, or laboratory POC coordinator)',
      'Any coworker who has used the meter once',
      'Only a physician',
      'No observation is required'
    ]
  },
  {
    id: 'form-return',
    category: 'Recertification',
    prompt: 'Where must the completed competency form be returned, and by when?',
    correct: 'To the laboratory before the certification due date',
    choices: [
      'To the laboratory before the certification due date',
      'To medical records after the due date',
      'Keep it in your locker indefinitely',
      'Email only; no form is needed'
    ]
  },
  {
    id: 'missing-results',
    category: 'Recertification',
    prompt: 'If the laboratory cannot locate your Inform meter testing results?',
    correct: 'You will not be recertified, and your supervisor will be informed of the deficiency',
    choices: [
      'You will not be recertified, and your supervisor will be informed of the deficiency',
      'You are automatically recertified anyway',
      'Only a verbal warning is issued with no effect on certification',
      'You may use a coworker’s results under your name'
    ]
  }
];

export const accucheckChallengeConfig = {
  /** Id reserved for the always-first sliding-scale units prompt (not in MCQ list). */
  slidingScaleQuestionId: 'sliding-scale',
  questions: accucheckMcqQuestions
};

export default accucheckChallengeConfig;
