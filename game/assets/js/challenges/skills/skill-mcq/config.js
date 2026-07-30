/**
 * Shared skill-library MCQ banks — AUTHOR CONTENT HERE.
 * Path: challenges/skills/skill-mcq/config.js
 * Keys match game/events/skills/library.json skill ids.
 */
/** @type {Record<string, { title: string, questions: { id: string, prompt: string, correct: string, choices: string[] }[] }>} */
export const skillMcqBanks = {
  'seizure-precautions': {
    title: 'Seizure precautions',
    questions: [
      {
        id: 'rails',
        prompt: 'Priority environmental setup for a patient on seizure precautions?',
        correct: 'Pad siderails; keep bed low; suction and O2 available',
        choices: [
          'Pad siderails; keep bed low; suction and O2 available',
          'Raise all four rails and leave the room to chart',
          'Place the patient in a locked wheelchair in the hall',
          'Remove the call light so they rest undisturbed'
        ]
      },
      {
        id: 'during',
        prompt: 'Best first action when a patient begins seizing?',
        correct: 'Protect airway/position safely; time the seizure; do not force objects into the mouth',
        choices: [
          'Protect airway/position safely; time the seizure; do not force objects into the mouth',
          'Insert a tongue blade immediately',
          'Hold the limbs tightly still',
          'Leave to get a full set of vital signs first'
        ]
      }
    ]
  },
  'stroke-assessment': {
    title: 'Stroke assessment',
    questions: [
      {
        id: 'fast',
        prompt: 'Which cluster best supports immediate stroke activation?',
        correct: 'Facial droop, arm weakness, speech change, time last known well',
        choices: [
          'Facial droop, arm weakness, speech change, time last known well',
          'Isolated low-grade fever only',
          'Chronic stable back pain',
          'Mild headache that resolved yesterday'
        ]
      }
    ]
  },
  'chest-tube': {
    title: 'Chest tube care',
    questions: [
      {
        id: 'disconnect',
        prompt: 'Chest tube becomes disconnected from the drainage system. Priority?',
        correct: 'Place the open end in sterile water; call for help / notify provider',
        choices: [
          'Place the open end in sterile water; call for help / notify provider',
          'Clamp permanently and ignore bubbling',
          'Milk the tubing vigorously toward the patient',
          'Remove the tube completely at the bedside'
        ]
      }
    ]
  },
  'trach-care': {
    title: 'Trach care',
    questions: [
      {
        id: 'spare',
        prompt: 'What should stay at the bedside for a fresh tracheostomy?',
        correct: 'Obturator, spare trach (same/smaller size), suction, Ambu',
        choices: [
          'Obturator, spare trach (same/smaller size), suction, Ambu',
          'Only oral swabs',
          'A full OR pack with no suction',
          'Nothing — central supply will bring items later'
        ]
      }
    ]
  },
  'oxygen-therapy': {
    title: 'Oxygen therapy',
    questions: [
      {
        id: 'nrb',
        prompt: 'Non-rebreather mask is indicated for which need?',
        correct: 'High FiO2 delivery for severe hypoxemia (reservoir inflated)',
        choices: [
          'High FiO2 delivery for severe hypoxemia (reservoir inflated)',
          'Long-term home O2 at 0.5 L/min for comfort only',
          'Replacing incentive spirometry after meals',
          'Routine care for every stable patient on room air'
        ]
      }
    ]
  },
  'ventilator-basics': {
    title: 'Ventilator basics',
    questions: [
      {
        id: 'high-pressure',
        prompt: 'Vent high-pressure alarm sounds. First bedside check?',
        correct: 'Assess patient for biting/kink/secretions; bag if needed',
        choices: [
          'Assess patient for biting/kink/secretions; bag if needed',
          'Silence alarms and leave the room',
          'Increase sedation without assessing the airway',
          'Disconnect power to reset the vent'
        ]
      }
    ]
  },
  'blood-transfusion': {
    title: 'Blood transfusion',
    questions: [
      {
        id: 'verify',
        prompt: 'Before starting PRBCs, two-nurse verification must confirm?',
        correct: 'Patient identity, product, ABO/Rh, expiration, order',
        choices: [
          'Patient identity, product, ABO/Rh, expiration, order',
          'Only the unit number on the cooler',
          'Only the patient’s room number',
          'Pharmacy label color alone'
        ]
      },
      {
        id: 'reaction',
        prompt: 'Suspected acute transfusion reaction — first action?',
        correct: 'Stop the transfusion; keep IV open with NS; notify provider',
        choices: [
          'Stop the transfusion; keep IV open with NS; notify provider',
          'Speed the infusion to finish faster',
          'Give the rest of the unit then document',
          'Remove the IV catheter immediately without keeping access'
        ]
      }
    ]
  },
  'wound-vac': {
    title: 'Wound vac',
    questions: [
      {
        id: 'seal',
        prompt: 'NPWT canister is full / alarm for leak. Priority nursing check?',
        correct: 'Check dressing seal and tubing; replace canister per protocol',
        choices: [
          'Check dressing seal and tubing; replace canister per protocol',
          'Cut a hole in the drape for air',
          'Clamp arterial lines nearby',
          'Ignore alarms if the wound looks dry'
        ]
      }
    ]
  },
  'wound-care': {
    title: 'Wound care / dressing',
    questions: [
      {
        id: 'aseptic',
        prompt: 'During a sterile dressing change, which action is correct?',
        correct: 'Clean from least to most contaminated; use aseptic technique',
        choices: [
          'Clean from least to most contaminated; use aseptic technique',
          'Reuse the same gauze on multiple wound beds',
          'Soak dry dressings with tap water from the sink',
          'Remove packing and leave the wound open to air overnight without an order'
        ]
      }
    ]
  },
  'pressure-injury': {
    title: 'Pressure injury prevention',
    questions: [
      {
        id: 'turn',
        prompt: 'Best prevention priority for a bedbound high-risk patient?',
        correct: 'Reposition on schedule; offload bony prominences; keep skin dry',
        choices: [
          'Reposition on schedule; offload bony prominences; keep skin dry',
          'Massage reddened bony areas vigorously',
          'Leave on a bedpan for long periods',
          'Skip skin checks if the patient is sleeping'
        ]
      }
    ]
  },
  'pca-pump': {
    title: 'PCA pump',
    questions: [
      {
        id: 'proxy',
        prompt: 'Who should press the PCA button?',
        correct: 'Only the patient (no proxy dosing by family)',
        choices: [
          'Only the patient (no proxy dosing by family)',
          'Family whenever the patient looks uncomfortable',
          'Any visitor at the bedside',
          'Housekeeping if the pump beeps'
        ]
      }
    ]
  },
  'pain-assessment': {
    title: 'Pain assessment',
    questions: [
      {
        id: 'reassess',
        prompt: 'After giving an opioid for acute pain, you should?',
        correct: 'Reassess pain and sedation within the expected onset window',
        choices: [
          'Reassess pain and sedation within the expected onset window',
          'Wait until the next shift without reassessment',
          'Document “appears comfortable” without asking the patient',
          'Stop all monitoring once the dose is given'
        ]
      }
    ]
  },
  'foley-care': {
    title: 'Foley / catheter care',
    questions: [
      {
        id: 'cauti',
        prompt: 'CAUTI prevention priority?',
        correct: 'Maintain closed system; bag below bladder; daily necessity review',
        choices: [
          'Maintain closed system; bag below bladder; daily necessity review',
          'Disconnect tubing to collect samples from the bag spout routinely',
          'Keep the bag on the bed mattress',
          'Irrigate with tap water every hour'
        ]
      }
    ]
  },
  'ng-tube': {
    title: 'NG tube',
    questions: [
      {
        id: 'verify',
        prompt: 'Before first feeding via NG, placement should be verified by?',
        correct: 'Radiograph (or facility-approved method) before use',
        choices: [
          'Radiograph (or facility-approved method) before use',
          'Air bolus auscultation alone as the only check forever',
          'Patient report of “feeling full”',
          'Checking only the external mark once on admission'
        ]
      }
    ]
  },
  'ostomy-care': {
    title: 'Ostomy care',
    questions: [
      {
        id: 'stoma',
        prompt: 'Expected healthy stoma appearance?',
        correct: 'Moist, pink/red; report duskiness or separation',
        choices: [
          'Moist, pink/red; report duskiness or separation',
          'Dry, pale, and painless always',
          'Black and necrotic is normal for week one',
          'Pushed fully below skin level without concern'
        ]
      }
    ]
  },
  'central-line': {
    title: 'Central line care',
    questions: [
      {
        id: 'clabsi',
        prompt: 'CLABSI prevention action during access?',
        correct: 'Scrub the hub; aseptic technique; assess necessity daily',
        choices: [
          'Scrub the hub; aseptic technique; assess necessity daily',
          'Leave unused ports uncapped',
          'Draw labs by disconnecting TPN without scrubbing',
          'Change the dressing with bare hands only'
        ]
      }
    ]
  },
  'isolation-ppe': {
    title: 'Isolation / PPE',
    questions: [
      {
        id: 'contact',
        prompt: 'Contact precautions for C. difficile typically require?',
        correct: 'Gown and gloves; soap-and-water hand hygiene after care',
        choices: [
          'Gown and gloves; soap-and-water hand hygiene after care',
          'N95 only with no gown',
          'No PPE if the patient is asymptomatic',
          'Shoe covers only'
        ]
      }
    ]
  },
  'hand-hygiene': {
    title: 'Hand hygiene',
    questions: [
      {
        id: 'when',
        prompt: 'When is soap and water preferred over alcohol rub?',
        correct: 'When hands are visibly soiled or after C. difficile care',
        choices: [
          'When hands are visibly soiled or after C. difficile care',
          'Only before going home',
          'Never — alcohol is always enough',
          'Only after eating snacks'
        ]
      }
    ]
  },
  'fall-precautions': {
    title: 'Fall precautions',
    questions: [
      {
        id: 'risk',
        prompt: 'High fall-risk patient leaving for the bathroom — best practice?',
        correct: 'Assist/stay within reach; non-slip footwear; clear path',
        choices: [
          'Assist/stay within reach; non-slip footwear; clear path',
          'Tell them to hurry so they finish before meals',
          'Leave all four rails up and walk away',
          'Remove the call light to reduce interruptions'
        ]
      }
    ]
  },
  'sepsis-recognition': {
    title: 'Sepsis recognition',
    questions: [
      {
        id: 'escalate',
        prompt: 'New confusion, fever, tachycardia, and hypotension after a UTI — priority?',
        correct: 'Escalate for possible sepsis; rapid assessment and notify provider',
        choices: [
          'Escalate for possible sepsis; rapid assessment and notify provider',
          'Wait for the next routine round in 4 hours',
          'Encourage ambulation only',
          'Document and discharge home immediately'
        ]
      }
    ]
  },
  sbar: {
    title: 'SBAR communication',
    questions: [
      {
        id: 'structure',
        prompt: 'Correct SBAR order?',
        correct: 'Situation, Background, Assessment, Recommendation',
        choices: [
          'Situation, Background, Assessment, Recommendation',
          'Story, Blame, Argument, Rumor',
          'Assessment only, skip the rest',
          'Recommendation first, then silence'
        ]
      }
    ]
  },
  'ecg-basics': {
    title: 'ECG / telemetry basics',
    questions: [
      {
        id: 'vfib',
        prompt: 'Unresponsive patient with VF on the monitor — priority?',
        correct: 'Call a code / start CPR and defibrillation pathway',
        choices: [
          'Call a code / start CPR and defibrillation pathway',
          'Obtain orthostatic vitals first',
          'Give oral aspirin and wait',
          'Turn off the monitor to stop the alarm'
        ]
      }
    ]
  },
  'dvt-prophylaxis': {
    title: 'DVT prophylaxis',
    questions: [
      {
        id: 'scd',
        prompt: 'SCD sleeves are ordered. Correct practice?',
        correct: 'Apply when in bed; remove for skin checks; combine with mobility/meds as ordered',
        choices: [
          'Apply when in bed; remove for skin checks; combine with mobility/meds as ordered',
          'Leave them in the closet until discharge',
          'Place on one leg only forever',
          'Inflate manually with a BP cuff instead'
        ]
      }
    ]
  },
  'fluid-balance': {
    title: 'Fluid balance / I&O',
    questions: [
      {
        id: 'io',
        prompt: 'Best practice for accurate I&O?',
        correct: 'Record all intake/output with volumes; note trends and notify for large imbalances',
        choices: [
          'Record all intake/output with volumes; note trends and notify for large imbalances',
          'Estimate once per week',
          'Only count IV fluids, ignore oral intake',
          'Empty catheters without measuring'
        ]
      }
    ]
  },
  'dialysis-access': {
    title: 'Dialysis access care',
    questions: [
      {
        id: 'fistula',
        prompt: 'Caring for an AV fistula arm?',
        correct: 'No BP/sticks on that arm; feel thrill / listen bruit',
        choices: [
          'No BP/sticks on that arm; feel thrill / listen bruit',
          'Use the fistula for routine blood draws each shift',
          'Place SCDs tightly over the anastomosis',
          'Ignore loss of thrill until the next dialysis day'
        ]
      }
    ]
  },
  'suicide-precautions': {
    title: 'Suicide precautions',
    questions: [
      {
        id: 'safety',
        prompt: 'Patient on suicide precautions — priority environment action?',
        correct: 'Remove hazards; follow observation level; stay with during high-risk moments',
        choices: [
          'Remove hazards; follow observation level; stay with during high-risk moments',
          'Leave sharps at the bedside for independence',
          'Allow unmonitored bathroom trips if they ask once',
          'Hide the care plan from the team'
        ]
      }
    ]
  },
  'restraint-safety': {
    title: 'Restraint safety',
    questions: [
      {
        id: 'least',
        prompt: 'Before applying restraints, you should?',
        correct: 'Try least-restrictive alternatives; obtain order; monitor frequently',
        choices: [
          'Try least-restrictive alternatives; obtain order; monitor frequently',
          'Restrain first, document later without an order',
          'Tie restraints to the siderail in a quick-release knot that tightens',
          'Leave restrained patients unassessed for hours'
        ]
      }
    ]
  },
  'critical-labs': {
    title: 'Critical lab response',
    questions: [
      {
        id: 'readback',
        prompt: 'Receiving a critical lab call — correct steps?',
        correct: 'Write down, read back, notify provider promptly, document',
        choices: [
          'Write down, read back, notify provider promptly, document',
          'Ignore until the end of shift',
          'Tell the patient to call their PCP next week only',
          'Change the result in the chart without notifying anyone'
        ]
      }
    ]
  }
};

export const skillMcqChallengeConfig = {
  banks: skillMcqBanks
};

export default skillMcqChallengeConfig;
