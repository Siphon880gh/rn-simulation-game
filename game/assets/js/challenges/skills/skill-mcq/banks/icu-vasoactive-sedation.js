/**
 * ICU vasoactive / sedation / inotrope drip MCQ banks.
 * Keys match library.json skill ids.
 */

function bank(title, questions) {
  return { title, questions };
}

export const levophedDripSkillBank = bank('Levophed (norepinephrine) drip', [
  {
    id: 'map-vs-sbp',
    prompt: 'Levophed titration targets commonly use which parameters (policy-dependent)?',
    correct: 'MAP goal (e.g. ≥65) and/or SBP goal — some units titrate up and down; others titrate up and call for wean parameters',
    choices: [
      'MAP goal (e.g. ≥65) and/or SBP goal — some units titrate up and down; others titrate up and call for wean parameters',
      'Heart rate only — ignore blood pressure',
      'SpO2 alone without an arterial or cuff pressure',
      'Pain score only'
    ]
  },
  {
    id: 'map-up',
    prompt: 'Order: titrate Levophed to MAP ≥65. Current MAP 58 on 12 mcg/min. Best next action?',
    correct: 'Increase Levophed per protocol step and recheck MAP (A-line preferred when available)',
    choices: [
      'Increase Levophed per protocol step and recheck MAP (A-line preferred when available)',
      'Stop the drip immediately without assessing volume or other pressors',
      'Double the rate every 30 seconds without a ceiling',
      'Switch to oral midodrine as the only intervention'
    ]
  },
  {
    id: 'sbp-mode',
    prompt: 'When the order says “titrate Levophed to SBP ≥90,” you primarily follow?',
    correct: 'Systolic BP (with clinical context); still watch MAP, perfusion, and urine output',
    choices: [
      'Systolic BP (with clinical context); still watch MAP, perfusion, and urine output',
      'Only diastolic BP and ignore SBP',
      'Only the pump color lights',
      'Capillary refill alone without a BP'
    ]
  },
  {
    id: 'policy-wean',
    prompt: 'Hospital policy may allow only upward titration by nursing with MD call for weaning. That means?',
    correct: 'You may increase toward the BP/MAP goal per protocol, but hold or decrease usually needs an order/call when policy says so',
    choices: [
      'You may increase toward the BP/MAP goal per protocol, but hold or decrease usually needs an order/call when policy says so',
      'Nurses may never change any drip rate',
      'You must wean to zero every hour regardless of MAP',
      'Policy never matters if the MAP looks fine once'
    ]
  },
  {
    id: 'access',
    prompt: 'Preferred access for continuous Levophed?',
    correct: 'Central line when available; peripheral only briefly with close site monitoring per policy',
    choices: [
      'Central line when available; peripheral only briefly with close site monitoring per policy',
      'Subcutaneous insulin pen sites',
      'Any random IM injection',
      'Oral tablets crushed into the NG'
    ]
  }
]);

export const vasopressinDripSkillBank = bank('Vasopressin drip', [
  {
    id: 'role',
    prompt: 'In septic shock, vasopressin is most often used as?',
    correct: 'A fixed-rate second (or adjunct) vasopressor alongside norepinephrine — not usually titrated like Levophed',
    choices: [
      'A fixed-rate second (or adjunct) vasopressor alongside norepinephrine — not usually titrated like Levophed',
      'First-line monotherapy titrated every minute to HR',
      'A sedative infusion',
      'An oral antidiuretic for all floor patients'
    ]
  },
  {
    id: 'rate',
    prompt: 'Typical ICU practice rate range for vasopressin in shock (confirm order/protocol)?',
    correct: 'Often around 0.03 units/min (or per protocol) as a non-titrating adjunct',
    choices: [
      'Often around 0.03 units/min (or per protocol) as a non-titrating adjunct',
      '500 units/min like a fluid bolus',
      '1 tablet PO qHS',
      'Titrate only to SpO2'
    ]
  },
  {
    id: 'monitor',
    prompt: 'While vasopressin runs, prioritize monitoring?',
    correct: 'BP/MAP, perfusion, urine output, and ischemia risks (digits/gut) with the rest of the pressor stack',
    choices: [
      'BP/MAP, perfusion, urine output, and ischemia risks (digits/gut) with the rest of the pressor stack',
      'Only the TV volume in the room',
      'Ignore MAP because vaso is fixed-rate',
      'Stop all other pressors automatically'
    ]
  }
]);

export const neosynephrineDripSkillBank = bank('Neo-Synephrine (phenylephrine) drip', [
  {
    id: 'mechanism',
    prompt: 'Phenylephrine (Neo-Synephrine) primarily raises BP by?',
    correct: 'Pure α-agonist vasoconstriction (watch reflex bradycardia)',
    choices: [
      'Pure α-agonist vasoconstriction (watch reflex bradycardia)',
      'β1 inotropy without vascular effect',
      'Opioid receptor blockade',
      'Bronchodilation only'
    ]
  },
  {
    id: 'use',
    prompt: 'Neo drip is commonly considered when?',
    correct: 'Additional vasoconstriction is needed (e.g. second-line / special situations) per order — confirm units (mcg/min)',
    choices: [
      'Additional vasoconstriction is needed (e.g. second-line / special situations) per order — confirm units (mcg/min)',
      'As the only treatment for hypoglycemia',
      'To reverse neuromuscular blockade',
      'Instead of fluids for every tachycardic patient without assessment'
    ]
  },
  {
    id: 'brady',
    prompt: 'Important cardiac side effect to anticipate with phenylephrine?',
    correct: 'Reflex bradycardia from increased afterload/vasoconstriction',
    choices: [
      'Reflex bradycardia from increased afterload/vasoconstriction',
      'Guaranteed ventricular fibrillation every dose',
      'Therapeutic hypothermia',
      'Complete immunity to hypotension'
    ]
  }
]);

export const dopamineDripSkillBank = bank('Dopamine drip', [
  {
    id: 'dose-effects',
    prompt: 'Dopamine effects are dose-dependent. Teaching point?',
    correct: 'Lower rates favor dopaminergic/β effects; higher rates add α vasoconstriction — follow ordered goal and monitor rhythm',
    choices: [
      'Lower rates favor dopaminergic/β effects; higher rates add α vasoconstriction — follow ordered goal and monitor rhythm',
      'Any dose only sedates the patient',
      'Dopamine never affects heart rate',
      'Dose is irrelevant if the bag is labeled correctly'
    ]
  },
  {
    id: 'arrhythmia',
    prompt: 'Priority monitoring on dopamine?',
    correct: 'Telemetry for tachyarrhythmias plus BP/MAP and perfusion',
    choices: [
      'Telemetry for tachyarrhythmias plus BP/MAP and perfusion',
      'Only capillary blood glucose every 24 hours',
      'Ignore PVCs and ST changes',
      'Stop the monitor to save battery'
    ]
  },
  {
    id: 'vs-levo',
    prompt: 'Compared with norepinephrine for most septic shock protocols today?',
    correct: 'Norepinephrine is usually preferred first-line; dopamine is less common and more arrhythmogenic',
    choices: [
      'Norepinephrine is usually preferred first-line; dopamine is less common and more arrhythmogenic',
      'Dopamine always replaces Levophed in every ICU',
      'Neither drug affects blood pressure',
      'Dopamine is only given IM'
    ]
  }
]);

export const dobutamineDripSkillBank = bank('Dobutamine drip', [
  {
    id: 'role',
    prompt: 'Dobutamine is primarily used as?',
    correct: 'An inotrope (β1) to support cardiac output in low-output / cardiogenic states — not a pure vasopressor',
    choices: [
      'An inotrope (β1) to support cardiac output in low-output / cardiogenic states — not a pure vasopressor',
      'A neuromuscular blocker',
      'A loop diuretic',
      'An oral antiplatelet'
    ]
  },
  {
    id: 'hypotension',
    prompt: 'Why can BP fall on dobutamine?',
    correct: 'Vasodilation / β2 effects may drop SVR even as contractility rises — watch MAP and consider pressors if ordered',
    choices: [
      'Vasodilation / β2 effects may drop SVR even as contractility rises — watch MAP and consider pressors if ordered',
      'It always raises SVR like phenylephrine',
      'It has no cardiovascular effects',
      'It only works if given as a tablet'
    ]
  },
  {
    id: 'monitor',
    prompt: 'Nursing priorities on dobutamine include?',
    correct: 'Rhythm (tachycardia/arrhythmia), BP/MAP, perfusion, and ordered titration goals (e.g. CI / ScvO2 / lactate trends)',
    choices: [
      'Rhythm (tachycardia/arrhythmia), BP/MAP, perfusion, and ordered titration goals (e.g. CI / ScvO2 / lactate trends)',
      'Only the patient’s favorite TV channel',
      'Stopping all telemetry',
      'Ignoring chest pain or new ST changes'
    ]
  }
]);

export const propofolDripSkillBank = bank('Propofol drip', [
  {
    id: 'use',
    prompt: 'Propofol continuous infusion in ICU is primarily for?',
    correct: 'Sedation (often ventilated patients) — titrate to RASS/SAS goal; watch BP and lipids/triglycerides',
    choices: [
      'Sedation (often ventilated patients) — titrate to RASS/SAS goal; watch BP and lipids/triglycerides',
      'Vasopressor support in septic shock',
      'Neuromuscular paralysis without sedation',
      'Replacing insulin drips'
    ]
  },
  {
    id: 'hypotension',
    prompt: 'Common hemodynamic effect of propofol?',
    correct: 'Hypotension / decreased SVR — may need pressor support while sedated',
    choices: [
      'Hypotension / decreased SVR — may need pressor support while sedated',
      'Guaranteed hypertensive crisis every dose',
      'No effect on blood pressure',
      'Only raises intracranial pressure intentionally'
    ]
  },
  {
    id: 'prs',
    prompt: 'Propofol-related infusion syndrome (PRIS) teaching cue?',
    correct: 'High-dose / prolonged infusions — watch unexplained metabolic acidosis, rhabdo, lipid changes; escalate early',
    choices: [
      'High-dose / prolonged infusions — watch unexplained metabolic acidosis, rhabdo, lipid changes; escalate early',
      'Only occurs with PO acetaminophen',
      'Is cured by increasing the propofol rate',
      'Is unrelated to infusion duration or dose'
    ]
  }
]);

export const precedexDripSkillBank = bank('Precedex (dexmedetomidine) drip', [
  {
    id: 'profile',
    prompt: 'Dexmedetomidine (Precedex) is distinctive because it often?',
    correct: 'Provides sedation with less respiratory depression than many agents — watch bradycardia and hypotension',
    choices: [
      'Provides sedation with less respiratory depression than many agents — watch bradycardia and hypotension',
      'Is a pure vasopressor with no sedative effect',
      'Is a depolarizing paralytic',
      'Must be given only as an IM shot'
    ]
  },
  {
    id: 'brady',
    prompt: 'Priority adverse effects on Precedex?',
    correct: 'Bradycardia and hypotension — hold/notify per protocol if severe',
    choices: [
      'Bradycardia and hypotension — hold/notify per protocol if severe',
      'Only hyperglycemia',
      'Only constipation',
      'Guaranteed seizures with every bag'
    ]
  },
  {
    id: 'titrate',
    prompt: 'Best titration practice?',
    correct: 'Titrate to ordered sedation goal (RASS) within protocol limits; do not bolus recklessly',
    choices: [
      'Titrate to ordered sedation goal (RASS) within protocol limits; do not bolus recklessly',
      'Run wide open without a goal',
      'Ignore HR and BP while increasing',
      'Replace the ventilator with Precedex alone'
    ]
  }
]);

export const fentanylDripSkillBank = bank('Fentanyl drip', [
  {
    id: 'role',
    prompt: 'Continuous fentanyl in the ICU is primarily for?',
    correct: 'Analgesia (and often paired with a sedative) — titrate to pain/CPOT goal; watch respiratory depression and rigidity at high doses',
    choices: [
      'Analgesia (and often paired with a sedative) — titrate to pain/CPOT goal; watch respiratory depression and rigidity at high doses',
      'First-line vasopressor for MAP <65',
      'Neuromuscular blockade assessment',
      'Antibiotic coverage for MRSA'
    ]
  },
  {
    id: 'vent',
    prompt: 'On a ventilated patient, fentanyl drip nursing priorities include?',
    correct: 'Pain score/CPOT, sedation synergy, hemodynamics, and ordered rate limits',
    choices: [
      'Pain score/CPOT, sedation synergy, hemodynamics, and ordered rate limits',
      'Stopping the ventilator alarm permanently',
      'Giving only PO oxycodone instead without assessment',
      'Ignoring chest rigidity or high peak pressures'
    ]
  },
  {
    id: 'stacking',
    prompt: 'When fentanyl is stacked with propofol/Precedex?',
    correct: 'Expect additive sedation/hypotension risk — reassess goals and avoid oversedation',
    choices: [
      'Expect additive sedation/hypotension risk — reassess goals and avoid oversedation',
      'Drugs cancel each other so rates never matter',
      'You can ignore RASS entirely',
      'Paralytics become unnecessary forever'
    ]
  }
]);

export const morphineDripSkillBank = bank('Morphine drip', [
  {
    id: 'use',
    prompt: 'Continuous morphine infusion teaching point?',
    correct: 'Opioid analgesia/sedation adjunct — watch hypotension, histamine effects, and accumulation in renal impairment',
    choices: [
      'Opioid analgesia/sedation adjunct — watch hypotension, histamine effects, and accumulation in renal impairment',
      'Preferred pure α vasopressor',
      'Train-of-four monitoring agent',
      'First-line for hyperkalemia'
    ]
  },
  {
    id: 'renal',
    prompt: 'Why is renal function relevant on morphine drip?',
    correct: 'Active metabolites can accumulate with poor renal clearance — may prefer alternatives per protocol',
    choices: [
      'Active metabolites can accumulate with poor renal clearance — may prefer alternatives per protocol',
      'Morphine only works if Cr is infinite',
      'Renal function never matters for opioids',
      'Morphine clears exclusively through the skin'
    ]
  },
  {
    id: 'vs-fentanyl',
    prompt: 'Compared with fentanyl for many ventilated ICU patients?',
    correct: 'Fentanyl is often preferred (hemodynamics / metabolites); morphine still appears in some protocols — follow the order',
    choices: [
      'Fentanyl is often preferred (hemodynamics / metabolites); morphine still appears in some protocols — follow the order',
      'Morphine is always safer than fentanyl in shock',
      'Neither drug requires monitoring',
      'Morphine drips are only for outpatient clinics'
    ]
  }
]);

export const vasopressorsSkillBank = bank('Vasopressors (ICU class)', [
  {
    id: 'classes',
    prompt: 'Which agents are vasopressors / vasoactive supports commonly seen in ICU shock?',
    correct: 'Norepinephrine (Levophed), vasopressin, phenylephrine (Neo); dopamine also used less often — dobutamine is primarily an inotrope',
    choices: [
      'Norepinephrine (Levophed), vasopressin, phenylephrine (Neo); dopamine also used less often — dobutamine is primarily an inotrope',
      'Propofol, Precedex, and fentanyl only',
      'Cisatracurium and succinylcholine only',
      'Lactulose and polyethylene glycol only'
    ]
  },
  {
    id: 'map-goal',
    prompt: 'Common initial MAP goal in septic shock protocols?',
    correct: 'Often MAP ≥65 mmHg (individualize) while restoring perfusion',
    choices: [
      'Often MAP ≥65 mmHg (individualize) while restoring perfusion',
      'MAP of 30 is always adequate',
      'Ignore MAP and chase SpO2 only',
      'Titrate only to pain score'
    ]
  },
  {
    id: 'stack',
    prompt: 'Best practice when stacking pressors?',
    correct: 'Confirm each agent’s role/rate/units, central access when needed, and reassess perfusion — not just the number on one cuff',
    choices: [
      'Confirm each agent’s role/rate/units, central access when needed, and reassess perfusion — not just the number on one cuff',
      'Start every pressor at maximum simultaneously without orders',
      'Never document rates',
      'Stop fluids forever once any pressor starts'
    ]
  }
]);

export const icuSedationSkillBank = bank('ICU sedation (class)', [
  {
    id: 'agents',
    prompt: 'Common continuous ICU sedation / analgesia agents include?',
    correct: 'Propofol, dexmedetomidine (Precedex), and opioid drips such as fentanyl or morphine — titrate to RASS/pain goals',
    choices: [
      'Propofol, dexmedetomidine (Precedex), and opioid drips such as fentanyl or morphine — titrate to RASS/pain goals',
      'Only vasopressin and phenylephrine',
      'Only subcutaneous heparin',
      'Only oral stool softeners'
    ]
  },
  {
    id: 'rass',
    prompt: 'Why target a sedation scale (e.g. RASS)?',
    correct: 'Avoid oversedation and delirium risk while keeping the patient safe on the ventilator',
    choices: [
      'Avoid oversedation and delirium risk while keeping the patient safe on the ventilator',
      'So the pump can run without nursing assessment',
      'Sedation scales replace all vital signs',
      'RASS is only for measuring urine output'
    ]
  },
  {
    id: 'with-nmb',
    prompt: 'If a paralytic is running, sedation/analgesia must?',
    correct: 'Be adequate — never paralyze an awake undersedated patient; use TOF to guide blockade',
    choices: [
      'Be adequate — never paralyze an awake undersedated patient; use TOF to guide blockade',
      'Be stopped completely whenever TOF is checked',
      'Be replaced by a pressor alone',
      'Be irrelevant because paralysis feels comfortable'
    ]
  }
]);
