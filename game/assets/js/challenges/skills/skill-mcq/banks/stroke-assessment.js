/**
 * Adult suspected stroke / BEFAST MCQ bank (library id: stroke-assessment).
 * Educational fiction — not a competency assessment or AHA certification.
 */

function bank(title, questions) {
  return { title, questions };
}

/** BEFAST + adult suspected-stroke pathway (EMS → ED → imaging → fibrinolytic / hemorrhage). */
export const strokeAssessmentSkillBank = bank('Stroke assessment (BEFAST)', [
  {
    id: 'befast-letters',
    prompt: 'BEFAST stroke recognition stands for?',
    correct: 'Balance, Eyes, Face, Arms, Speech, Time (last known well)',
    choices: [
      'Balance, Eyes, Face, Arms, Speech, Time (last known well)',
      'Blood pressure, EKG, Fever, Airway, Saturation, Temperature',
      'Bradycardia, Edema, Fluids, Antibiotics, Sedation, Transfer',
      'Bleed, Embolus, Fibrinolysis, Aspirin, Stent, Thrombolysis'
    ]
  },
  {
    id: 'befast-activate',
    prompt: 'New facial droop, arm drift, and slurred speech — priority?',
    correct: 'Treat as suspected stroke: activate the emergency/stroke response and establish last known well',
    choices: [
      'Treat as suspected stroke: activate the emergency/stroke response and establish last known well',
      'Wait one hour to see if symptoms resolve before calling anyone',
      'Give aspirin immediately before any assessment or imaging',
      'Document only and continue routine med pass'
    ]
  },
  {
    id: 'time-is-brain',
    prompt: 'Core teaching principle for suspected stroke timing?',
    correct: 'Time is brain — rapid recognition, assessment, imaging, and treatment decisions matter',
    choices: [
      'Time is brain — rapid recognition, assessment, imaging, and treatment decisions matter',
      'Stroke workup can safely wait until the next morning rounds',
      'Only BP matters; neurologic timing is optional',
      'Imaging is never urgent if the patient can speak'
    ]
  },
  {
    id: 'ems-abcs',
    prompt: 'Initial EMS/bedside priorities for suspected stroke?',
    correct: 'ABCs (airway, breathing, circulation); give oxygen if needed',
    choices: [
      'ABCs (airway, breathing, circulation); give oxygen if needed',
      'Immediate fibrinolytic push before ABCs',
      'Full meal tray to prevent hypoglycemia only',
      'Remove all monitors to reduce anxiety'
    ]
  },
  {
    id: 'glucose-mimic',
    prompt: 'Why check blood glucose early in suspected stroke?',
    correct: 'Hypoglycemia can mimic stroke and should be treated if present',
    choices: [
      'Hypoglycemia can mimic stroke and should be treated if present',
      'Glucose never affects neurologic findings',
      'Only check glucose after 24 hours',
      'Hyperglycemia alone confirms ischemic stroke'
    ]
  },
  {
    id: 'last-known-well',
    prompt: 'Which time stamp is critical to establish as accurately as possible?',
    correct: 'Time of symptom onset or last known normal/well',
    choices: [
      'Time of symptom onset or last known normal/well',
      'Time of the last bowel movement only',
      'Hospital admission date from a prior year',
      'Time the family first heard of stroke in general'
    ]
  },
  {
    id: 'triage-center',
    prompt: 'Destination / notification teaching for suspected stroke?',
    correct: 'Triage to an appropriate stroke center and alert the receiving hospital before arrival when in the EMS path',
    choices: [
      'Triage to an appropriate stroke center and alert the receiving hospital before arrival when in the EMS path',
      'Bypass all hospitals and go home for rest',
      'Never notify the hospital in advance',
      'Only go to a clinic without imaging capability'
    ]
  },
  {
    id: 'ed-initial',
    prompt: 'Initial ED assessment bundle for suspected stroke includes?',
    correct: 'ABCs, vitals, O2 if hypoxemic, IV access, labs, glucose, neuro screen, stroke-team activation, emergency brain imaging, 12-lead ECG',
    choices: [
      'ABCs, vitals, O2 if hypoxemic, IV access, labs, glucose, neuro screen, stroke-team activation, emergency brain imaging, 12-lead ECG',
      'Oral antibiotics and discharge home only',
      'MRI in one week as the only step',
      'Hold all assessment until family arrives tomorrow'
    ]
  },
  {
    id: 'ed-time-10',
    prompt: 'ED time goal often taught for immediate general assessment/stabilization after arrival?',
    correct: 'About 10 minutes',
    choices: [
      'About 10 minutes',
      'About 6 hours',
      'About 24 hours',
      'No time goal applies'
    ]
  },
  {
    id: 'ed-time-25',
    prompt: 'ED target window toward rapid neurologic/stroke-team assessment and imaging progress?',
    correct: 'About 25 minutes',
    choices: [
      'About 25 minutes',
      'About 12 hours',
      'Next calendar day',
      'Only after full admission paperwork'
    ]
  },
  {
    id: 'ed-time-45',
    prompt: 'Target for brain imaging evaluated for hemorrhage (teaching diagram)?',
    correct: 'About 45 minutes from ED arrival',
    choices: [
      'About 45 minutes from ED arrival',
      'About 3 days',
      'Only if symptoms worsen after aspirin',
      'Never before fibrinolytics'
    ]
  },
  {
    id: 'ed-time-60',
    prompt: 'Target for treatment decision / fibrinolytic treatment when indicated?',
    correct: 'About 60 minutes from ED arrival (door-to-needle teaching goal)',
    choices: [
      'About 60 minutes from ED arrival (door-to-needle teaching goal)',
      'About one week',
      'After ICU day 3 only',
      'Whenever the CT tech is free next shift'
    ]
  },
  {
    id: 'ed-time-admit',
    prompt: 'Admission to stroke unit or ICU time goal shown on the pathway diagram?',
    correct: 'About 3 hours',
    choices: [
      'About 3 hours',
      'About 3 days',
      'About 3 weeks',
      'No admission is needed after rtPA'
    ]
  },
  {
    id: 'neuro-scale',
    prompt: 'Stroke severity should be assessed with a standardized scale such as?',
    correct: 'NIH Stroke Scale (NIHSS) or Canadian Neurological Scale',
    choices: [
      'NIH Stroke Scale (NIHSS) or Canadian Neurological Scale',
      'Braden scale only',
      'Glasgow Blatchford score only',
      'Apgar score'
    ]
  },
  {
    id: 'imaging-question',
    prompt: 'One of the most important early imaging questions is?',
    correct: 'Does the CT (or MRI) show hemorrhage?',
    choices: [
      'Does the CT (or MRI) show hemorrhage?',
      'What is the patient’s favorite food?',
      'Is the white count slightly high from yesterday?',
      'Did the patient ever have a childhood vaccine?'
    ]
  },
  {
    id: 'no-hemorrhage',
    prompt: 'If emergency noncontrast CT/MRI shows no hemorrhage, teaching implication?',
    correct: 'Acute ischemic stroke is probable; evaluate fibrinolytic eligibility next',
    choices: [
      'Acute ischemic stroke is probable; evaluate fibrinolytic eligibility next',
      'Fibrinolytics are automatically excluded forever',
      'The pathway ends without any further care',
      'Only physical therapy is indicated'
    ]
  },
  {
    id: 'hemorrhage-path',
    prompt: 'If imaging shows intracranial hemorrhage, next pathway teaching?',
    correct: 'Do not pursue ischemic-stroke fibrinolytic therapy; obtain neurology/neurosurgery consult (or transfer) and start hemorrhage-specific care',
    choices: [
      'Do not pursue ischemic-stroke fibrinolytic therapy; obtain neurology/neurosurgery consult (or transfer) and start hemorrhage-specific care',
      'Give IV rtPA immediately',
      'Give full-dose anticoagulant bolus',
      'Discharge home with outpatient MRI'
    ]
  },
  {
    id: 'fibrinolytic-eligible',
    prompt: 'For probable ischemic stroke, before IV rtPA the clinician should?',
    correct: 'Evaluate fibrinolytic eligibility/exclusions, repeat the neuro exam for rapid improvement, and discuss risks/benefits with patient/family',
    choices: [
      'Evaluate fibrinolytic eligibility/exclusions, repeat the neuro exam for rapid improvement, and discuss risks/benefits with patient/family',
      'Skip history and give rtPA to every patient with a headache',
      'Start heparin drip before any imaging',
      'Wait 24 hours before any decision'
    ]
  },
  {
    id: 'post-rtpa',
    prompt: 'After IV rtPA (alteplase), pathway teaching includes?',
    correct: 'No anticoagulant or antiplatelet therapy for the first 24 hours; aggressive BP monitoring; watch for neurologic deterioration; admit stroke unit/ICU',
    choices: [
      'No anticoagulant or antiplatelet therapy for the first 24 hours; aggressive BP monitoring; watch for neurologic deterioration; admit stroke unit/ICU',
      'Start dual antiplatelet and heparin immediately',
      'Stop all monitoring after the bolus',
      'Send the patient to a med-surg hallway without observation'
    ]
  },
  {
    id: 'not-fibrinolytic',
    prompt: 'If ischemic stroke but not a fibrinolytic candidate, the diagram directs clinicians toward?',
    correct: 'Aspirin administration, then the appropriate stroke pathway and stroke unit/ICU admission',
    choices: [
      'Aspirin administration, then the appropriate stroke pathway and stroke unit/ICU admission',
      'Immediate IV rtPA anyway',
      'No treatment and discharge',
      'Only outpatient follow-up in one month'
    ]
  },
  {
    id: 'ecg-note',
    prompt: '12-lead ECG in the stroke workup — correct teaching?',
    correct: 'Obtain a 12-lead ECG, but do not delay ongoing stroke evaluation for it',
    choices: [
      'Obtain a 12-lead ECG, but do not delay ongoing stroke evaluation for it',
      'ECG replaces the need for brain imaging',
      'Never obtain an ECG in stroke alerts',
      'Hold the stroke team until a full stress test is done'
    ]
  },
  {
    id: 'sequence',
    prompt: 'High-yield memorize sequence for adult suspected stroke?',
    correct: 'Recognize → ABCs/glucose → last-known-well → activate stroke team → CT/MRI → hemorrhage vs not → fibrinolytic eligibility → rtPA if eligible / aspirin if not → stroke unit or ICU',
    choices: [
      'Recognize → ABCs/glucose → last-known-well → activate stroke team → CT/MRI → hemorrhage vs not → fibrinolytic eligibility → rtPA if eligible / aspirin if not → stroke unit or ICU',
      'Aspirin first → skip imaging → discharge',
      'MRI next week → then maybe call someone',
      'Intubate every patient before any neuro check'
    ]
  }
]);
