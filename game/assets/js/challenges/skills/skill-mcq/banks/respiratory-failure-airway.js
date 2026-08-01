/**
 * Desat → respiratory failure pathway.
 * Floor skill: fewer questions; ends with Transfer to ICU.
 * ICU skill: shared desat path + RSI / intubation assist (more questions).
 * Educational fiction — not certification.
 */

function bank(title, questions) {
  return { title, questions };
}

/** Shared desat → BVM → Code Blue for ETT (floor + ICU). */
const floorAirwayQuestions = [
  {
    id: 'desat-cues',
    prompt: 'Which cluster best marks acute hypoxemic respiratory failure needing immediate action?',
    correct: 'Falling SpO2, increased work of breathing, accessory muscles, and/or altered mentation',
    choices: [
      'Falling SpO2, increased work of breathing, accessory muscles, and/or altered mentation',
      'Isolated mild anxiety with SpO2 99% on room air',
      'Chronic stable O2 need at baseline with no change',
      'A single cough after drinking water'
    ]
  },
  {
    id: 'first-escalate-o2',
    prompt: 'Patient SpO2 drops into the mid-80s on nasal cannula. Best first cluster of actions?',
    correct: 'Stay with the patient, escalate oxygen (e.g. NRB), sit upright if able, call for help / RT',
    choices: [
      'Stay with the patient, escalate oxygen (e.g. NRB), sit upright if able, call for help / RT',
      'Leave alone to print a full ABG order set first',
      'Remove all oxygen to “reset” the sat probe',
      'Wait 30 minutes to see if it self-corrects'
    ]
  },
  {
    id: 'when-bvm',
    prompt: 'When is bag-valve-mask (Ambu) ventilation indicated in this desat pathway?',
    correct: 'Inadequate breathing effort, severe hypoxemia not corrected by high-flow O2, or impending respiratory arrest — while help is coming',
    choices: [
      'Inadequate breathing effort, severe hypoxemia not corrected by high-flow O2, or impending respiratory arrest — while help is coming',
      'Only after the patient is already intubated',
      'For every patient with SpO2 94% on 2 L NC',
      'Never on med-surg — only ICU may bag'
    ]
  },
  {
    id: 'bvm-technique',
    prompt: 'Key BVM / Ambu technique priorities?',
    correct: 'Open airway, tight mask seal (EC clamp), squeeze for visible chest rise, avoid excessive rate/volume',
    choices: [
      'Open airway, tight mask seal (EC clamp), squeeze for visible chest rise, avoid excessive rate/volume',
      'Hyperventilate as fast as possible until SpO2 is 100%',
      'Hold the mask loosely so the patient can talk',
      'Bag only once every 30 seconds regardless of effort'
    ]
  },
  {
    id: 'bvm-rate-pulse',
    prompt: 'Adult with a pulse being bagged for respiratory failure — approximate ventilation rate teaching point?',
    correct: 'About 1 breath every 5–6 seconds (~10–12/min); do not hyperventilate',
    choices: [
      'About 1 breath every 5–6 seconds (~10–12/min); do not hyperventilate',
      '1 breath per second continuously',
      '30 breaths between each pulse check only',
      'No breaths until Code Blue arrives'
    ]
  },
  {
    id: 'still-desatting',
    prompt: 'Despite correct BVM with high-flow O2, SpO2 keeps falling and mentation worsens. Best interpretation?',
    correct: 'Failure of noninvasive support — escalate urgently toward advanced airway / Code Blue for ETT',
    choices: [
      'Failure of noninvasive support — escalate urgently toward advanced airway / Code Blue for ETT',
      'Continue BVM alone for another hour before calling anyone',
      'The sat probe is always wrong — stop monitoring',
      'Give oral antibiotics and recheck in the morning'
    ]
  },
  {
    id: 'code-for-ett',
    prompt: 'On med-surg or telemetry, when bagging fails and the patient needs emergent intubation, the nurse should?',
    correct: 'Activate Code Blue (or airway emergency per facility) so an intubation-capable team brings ETT support',
    choices: [
      'Activate Code Blue (or airway emergency per facility) so an intubation-capable team brings ETT support',
      'Attempt solo RSI with etomidate from the Pyxis without a team',
      'Send the patient walking to radiology for a chest x-ray first',
      'Chart for 15 minutes, then decide'
    ]
  },
  {
    id: 'floor-role-during-code-airway',
    prompt: 'Floor / tele nurse role while awaiting / during Code Blue for airway?',
    correct: 'Continue BVM/oxygenation, prepare suction and airway cart access, give concise handoff, stay to help as assigned',
    choices: [
      'Continue BVM/oxygenation, prepare suction and airway cart access, give concise handoff, stay to help as assigned',
      'Stop bagging and leave to finish unrelated tasks',
      'Intubate independently because the crash cart has a laryngoscope',
      'Remove the monitor cables to reduce clutter and walk away'
    ]
  },
  {
    id: 'do-not-leave',
    prompt: 'During progressive desat treated with Ambu, which action is wrong?',
    correct: 'Leave the bedside alone to gather supplies while the patient is still deteriorating',
    choices: [
      'Leave the bedside alone to gather supplies while the patient is still deteriorating',
      'Call for help and keep bagging',
      'Ask a colleague to bring the airway cart / suction',
      'Reassess pulse and responsiveness while supporting ventilation'
    ]
  },
  {
    id: 'pulse-vs-arrest',
    prompt: 'While bagging a desatting patient you lose a pulse. Next?',
    correct: 'Start CPR and continue Code Blue / cardiac-arrest priorities',
    choices: [
      'Start CPR and continue Code Blue / cardiac-arrest priorities',
      'Keep only bagging and never compress',
      'Cancel the code because it started as a respiratory problem',
      'Wait for a full chemistry panel before CPR'
    ]
  },
  {
    id: 'nrb-vs-bvm',
    prompt: 'NRB at 15 L vs BVM — when is BVM preferred?',
    correct: 'When the patient cannot protect/generate adequate tidal breaths — NRB needs spontaneous breathing',
    choices: [
      'When the patient cannot protect/generate adequate tidal breaths — NRB needs spontaneous breathing',
      'NRB always replaces BVM in every emergency',
      'BVM is only for patients who are talking in full sentences',
      'Neither device is used until after intubation'
    ]
  },
  {
    id: 'suction-ready',
    prompt: 'Before and during BVM / impending intubation, suction should be?',
    correct: 'At the ready (on, yankauer available) in case of secretions or vomiting',
    choices: [
      'At the ready (on, yankauer available) in case of secretions or vomiting',
      'Locked in another wing until after the tube is placed',
      'Never used near an airway emergency',
      'Only for oral care after the shift ends'
    ]
  }
];

/** Floor path closes with ICU transfer (not RSI drugs on the floor). */
const floorTransferQuestion = {
  id: 'transfer-to-icu',
  prompt: 'After Code Blue for airway / ETT on med-surg or tele and the patient remains critically unstable, the expected disposition step is?',
  correct: 'Transfer to ICU once airway and transport readiness criteria are met',
  choices: [
    'Transfer to ICU once airway and transport readiness criteria are met',
    'Discharge home with a portable oxygen tank',
    'Keep on the floor indefinitely without higher-acuity handoff',
    'Cancel the ICU bed because the Code Blue was already called'
  ]
};

/** ICU RSI / intubation assist (extra questions beyond the floor path). */
const icuRsiQuestions = [
  {
    id: 'rsi-purpose',
    prompt: 'Rapid sequence intubation (RSI) is best described as?',
    correct: 'Near-simultaneous induction + neuromuscular blockade to facilitate emergent ETT with minimized aspiration risk',
    choices: [
      'Near-simultaneous induction + neuromuscular blockade to facilitate emergent ETT with minimized aspiration risk',
      'Elective nasal cannula titration over several hours',
      'Oral midazolam only, then wait for the patient to self-intubate',
      'Chest compressions without any airway plan'
    ]
  },
  {
    id: 'preoxygenate',
    prompt: 'Before RSI drugs, a key nursing/team priority is?',
    correct: 'Preoxygenate (and continue apneic oxygenation strategies per team) while assembling equipment and assigning roles',
    choices: [
      'Preoxygenate (and continue apneic oxygenation strategies per team) while assembling equipment and assigning roles',
      'Stop all oxygen so the sat can “baseline” at room air',
      'Skip equipment checks to save time',
      'Give a full meal to reduce aspiration risk'
    ]
  },
  {
    id: 'etomidate-role',
    prompt: 'Etomidate in RSI is typically used as?',
    correct: 'An induction (sedative) agent — often chosen when hemodynamics are a concern (confirm order/protocol)',
    choices: [
      'An induction (sedative) agent — often chosen when hemodynamics are a concern (confirm order/protocol)',
      'A long-acting paralytic that replaces rocuronium',
      'A vasopressor infusion for MAP titration only',
      'An oral anxiolytic for discharge teaching'
    ]
  },
  {
    id: 'paralytic-role',
    prompt: 'After induction in RSI, a neuromuscular blocker (e.g. succinylcholine or rocuronium) is given to?',
    correct: 'Paralyze for optimal intubating conditions — never give a paralytic without sedation/induction',
    choices: [
      'Paralyze for optimal intubating conditions — never give a paralytic without sedation/induction',
      'Treat pain as the sole agent without any sedative',
      'Replace the need for oxygen entirely',
      'Reverse the ETT if placement fails'
    ]
  },
  {
    id: 'equipment-ready',
    prompt: 'Before the laryngoscope blade enters the mouth, the nurse should ensure?',
    correct: 'Suction on, BVM ready, correctly sized ETT with stylet/syringe, meds drawn, EtCO2 available, roles clear',
    choices: [
      'Suction on, BVM ready, correctly sized ETT with stylet/syringe, meds drawn, EtCO2 available, roles clear',
      'Only a nasal cannula and a blank progress note',
      'The room lights off and family crowding the airway',
      'All monitors disconnected for a cleaner view'
    ]
  },
  {
    id: 'assist-laryngoscope',
    prompt: 'How should the bedside nurse assist with laryngoscope insertion?',
    correct: 'Position patient (sniffing if safe), hand requested blade/handle, provide BURP/ELM if asked, keep suction ready, do not block the intubator’s view',
    choices: [
      'Position patient (sniffing if safe), hand requested blade/handle, provide BURP/ELM if asked, keep suction ready, do not block the intubator’s view',
      'Grab the laryngoscope mid-attempt and intubate without being asked',
      'Stand in front of the airway with a phone flashlight only',
      'Remove the pillow and flex the neck hard against orders'
    ]
  },
  {
    id: 'burp-elm',
    prompt: 'BURP / external laryngeal manipulation during intubation means?',
    correct: 'Directed pressure on the larynx (backward-upward-rightward pressure / ELM) only as guided by the intubator to improve view',
    choices: [
      'Directed pressure on the larynx (backward-upward-rightward pressure / ELM) only as guided by the intubator to improve view',
      'Compressing the chest for CPR during every attempt',
      'Pushing on the abdomen to force the tube in',
      'Occluding both nares until the sat drops'
    ]
  },
  {
    id: 'cricoid-modern',
    prompt: 'Routine cricoid pressure (Sellick) during RSI in modern practice?',
    correct: 'Not routinely required; apply or release only if the team lead requests it — may worsen the view if misapplied',
    choices: [
      'Not routinely required; apply or release only if the team lead requests it — may worsen the view if misapplied',
      'Mandatory maximum force by every nurse on every intubation',
      'Replaces the need for suction and BVM',
      'Used only after the tube is confirmed in the trachea'
    ]
  },
  {
    id: 'confirm-ett',
    prompt: 'After ETT placement, best confirmation / monitoring when available?',
    correct: 'Waveform capnography (EtCO2) plus clinical signs; secure the tube and continue ventilation',
    choices: [
      'Waveform capnography (EtCO2) plus clinical signs; secure the tube and continue ventilation',
      'Guess by tube depth numbers alone and remove the monitor',
      'Ask the patient to speak immediately through the ETT',
      'Skip confirmation if the first attempt felt easy'
    ]
  },
  {
    id: 'failed-attempt',
    prompt: 'If an intubation attempt fails and sats drop, priority is?',
    correct: 'Stop the attempt, re-oxygenate with BVM (two-person if needed), call for more advanced airway help per algorithm',
    choices: [
      'Stop the attempt, re-oxygenate with BVM (two-person if needed), call for more advanced airway help per algorithm',
      'Keep probing blindly for several minutes without bagging',
      'Remove oxygen permanently',
      'Give another paralytic without re-oxygenating'
    ]
  },
  {
    id: 'post-intubation',
    prompt: 'Immediate post-intubation nursing priorities include?',
    correct: 'Confirm EtCO2, secure ETT, connect to ventilator/appropriate support, sedation/analgesia per order, reassess vitals',
    choices: [
      'Confirm EtCO2, secure ETT, connect to ventilator/appropriate support, sedation/analgesia per order, reassess vitals',
      'Extubate immediately to check the voice',
      'Leave the tube untaped and leave the room',
      'Stop all monitoring because the airway is done'
    ]
  },
  {
    id: 'med-sequence',
    prompt: 'Typical RSI medication sequence teaching point?',
    correct: 'Induction agent (e.g. etomidate) then immediate paralytic — bag/ventilate strategy per team if needed between attempts',
    choices: [
      'Induction agent (e.g. etomidate) then immediate paralytic — bag/ventilate strategy per team if needed between attempts',
      'Paralytic first, then induction 10 minutes later',
      'Only atropine for every adult RSI',
      'Oral etomidate tablets crushed in juice'
    ]
  }
];

/** Med-surg / tele skill library entry — shorter bank; last step Transfer to ICU. */
export const respiratoryFailureAirwaySkillBank = bank(
  'Desat -> Respiratory Failure',
  [...floorAirwayQuestions, floorTransferQuestion]
);

/** ICU skill library entry — desat path + RSI / ETT assist. */
export const respiratoryFailureAirwayIcuSkillBank = bank(
  'Desat -> Respiratory Failure in ICU',
  [...floorAirwayQuestions, ...icuRsiQuestions]
);

export default respiratoryFailureAirwaySkillBank;
