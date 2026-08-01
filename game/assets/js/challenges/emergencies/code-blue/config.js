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
      id: 'code-blue-meaning',
      type: 'choice',
      prompt: 'A Code Blue most commonly signals which situation?',
      choices: [
        'A critical life-threatening event — usually cardiac or respiratory arrest (also urgent advanced airway/intubation before full arrest)',
        'Any fever over 100.4°F on the unit',
        'A routine discharge medication teaching',
        'Only a broken bed alarm with a stable patient'
      ],
      correct: 'A critical life-threatening event — usually cardiac or respiratory arrest (also urgent advanced airway/intubation before full arrest)'
    },
    {
      id: 'initial-arrest-actions',
      type: 'choice',
      prompt: 'Immediate cardiac-arrest priorities after starting CPR include?',
      choices: [
        'Give oxygen, attach a monitor/defibrillator, and determine if the rhythm is shockable',
        'Obtain a full chemistry panel before any CPR',
        'Give oral aspirin and wait for cardiology',
        'Leave the room to print the code cart checklist'
      ],
      correct: 'Give oxygen, attach a monitor/defibrillator, and determine if the rhythm is shockable'
    },
    {
      id: 'shockable-rhythms',
      type: 'choice',
      prompt: 'Which rhythms are shockable in adult cardiac arrest?',
      choices: [
        'Ventricular fibrillation (VF) and pulseless ventricular tachycardia (pVT)',
        'Asystole and sinus bradycardia with a strong pulse',
        'PEA and stable atrial fibrillation',
        'Only first-degree AV block'
      ],
      correct: 'Ventricular fibrillation (VF) and pulseless ventricular tachycardia (pVT)'
    },
    {
      id: 'nonshockable-rhythms',
      type: 'choice',
      prompt: 'Which rhythms are nonshockable in adult cardiac arrest?',
      choices: [
        'Asystole and pulseless electrical activity (PEA)',
        'VF and pulseless VT',
        'Stable SVT with a pulse',
        'Sinus tachycardia from fever'
      ],
      correct: 'Asystole and pulseless electrical activity (PEA)'
    },
    {
      id: 'vf-first-shock',
      type: 'choice',
      prompt: 'Pulseless VF/pVT — first rhythm-specific action?',
      choices: [
        'Defibrillate (shock), then resume CPR for 2 minutes',
        'Give amiodarone 300 mg before any shock',
        'Shock only after three epinephrine doses',
        'Do not shock — treat like asystole'
      ],
      correct: 'Defibrillate (shock), then resume CPR for 2 minutes'
    },
    {
      id: 'iv-io-during-cpr',
      type: 'choice',
      prompt: 'When should IV or IO access be obtained in cardiac arrest?',
      choices: [
        'During CPR (do not stop the arrest pathway to chase access alone)',
        'Only after ROSC is confirmed for 30 minutes',
        'Never — oral meds are preferred in arrest',
        'Only if the patient asks for an IV'
      ],
      correct: 'During CPR (do not stop the arrest pathway to chase access alone)'
    },
    {
      id: 'rhythm-check-interval',
      type: 'choice',
      prompt: 'After a shock (or during nonshockable CPR), when do you reassess the rhythm?',
      choices: [
        'After each ~2-minute CPR cycle',
        'Every 30 seconds without compressions',
        'Only once at the end of the code',
        'Never — keep shocking continuously'
      ],
      correct: 'After each ~2-minute CPR cycle'
    },
    {
      id: 'vf-shockable-sequence',
      type: 'choice',
      prompt: 'Easy memory sequence for refractory shockable VF/pVT in this algorithm?',
      choices: [
        'Shock → CPR → Shock → CPR + epinephrine → Shock → CPR + amiodarone',
        'Epinephrine only → never shock VF',
        'Amiodarone → atropine → adenosine for every VF',
        'Shock once, then stop all CPR permanently'
      ],
      correct: 'Shock → CPR → Shock → CPR + epinephrine → Shock → CPR + amiodarone'
    },
    {
      id: 'epi-after-second-shock',
      type: 'choice',
      prompt: 'In VF/pVT, when does the algorithm typically introduce epinephrine?',
      choices: [
        'After the second shock, during CPR (then every 3–5 minutes)',
        'Before the first shock in every VF case',
        'Only after ROSC',
        'Never in shockable arrest'
      ],
      correct: 'After the second shock, during CPR (then every 3–5 minutes)'
    },
    {
      id: 'amio-after-third-shock',
      type: 'choice',
      prompt: 'In this VF/pVT algorithm, when does amiodarone appear?',
      choices: [
        'After the third shock, during the next CPR cycle',
        'Before any defibrillation attempt',
        'As first-line for every PEA',
        'Only as an oral tablet during compressions'
      ],
      correct: 'After the third shock, during the next CPR cycle'
    },
    {
      id: 'no-shock-asystole-pea',
      type: 'choice',
      prompt: 'Asystole or PEA on the monitor — defibrillation?',
      choices: [
        'Do NOT shock; continue high-quality CPR and the nonshockable pathway',
        'Shock at 360 J immediately every 10 seconds',
        'Synchronized cardioversion at 50 J',
        'Shock only the PEA limb leads'
      ],
      correct: 'Do NOT shock; continue high-quality CPR and the nonshockable pathway'
    },
    {
      id: 'pea-asystole-pathway',
      type: 'choice',
      prompt: 'Best high-yield memory for PEA/asystole?',
      choices: [
        'CPR + epinephrine ASAP → rhythm check every 2 minutes → treat H’s and T’s',
        'Shock → amiodarone → stop compressions',
        'Adenosine 6 mg then discharge home',
        'Wait for a 12-lead before any CPR'
      ],
      correct: 'CPR + epinephrine ASAP → rhythm check every 2 minutes → treat H’s and T’s'
    },
    {
      id: 'pea-becomes-shockable',
      type: 'choice',
      prompt: 'During PEA/asystole care the rhythm becomes VF. Next?',
      choices: [
        'Move to the VF/pVT shock pathway',
        'Continue never shocking because the code started as PEA',
        'Give only atropine and stop CPR',
        'Cancel the Code Blue'
      ],
      correct: 'Move to the VF/pVT shock pathway'
    },
    {
      id: 'epi-arrest-dose',
      type: 'choice',
      prompt: 'Adult cardiac-arrest epinephrine dose?',
      choices: [
        '1 mg IV/IO every 3–5 minutes',
        '1 mg oral every hour',
        '300 mg IV bolus once only',
        '6 mg rapid IV push with flush'
      ],
      correct: '1 mg IV/IO every 3–5 minutes'
    },
    {
      id: 'epi-both-pathways',
      type: 'choice',
      prompt: 'Epinephrine in adult cardiac arrest is used for?',
      choices: [
        'Both shockable and nonshockable cardiac arrest',
        'Only sinus bradycardia with a pulse',
        'Only after the patient refuses defibrillation',
        'Never if an advanced airway is placed'
      ],
      correct: 'Both shockable and nonshockable cardiac arrest'
    },
    {
      id: 'amio-indication',
      type: 'choice',
      prompt: 'Amiodarone in cardiac arrest is primarily for?',
      choices: [
        'Refractory VF/pulseless VT — not routine asystole/PEA',
        'Every asystole as the first drug',
        'Stable sinus tach from pain',
        'Oral loading before CPR starts'
      ],
      correct: 'Refractory VF/pulseless VT — not routine asystole/PEA'
    },
    {
      id: 'amio-doses',
      type: 'choice',
      prompt: 'Adult amiodarone dosing commonly taught for refractory VF/pVT?',
      choices: [
        'First dose 300 mg IV/IO bolus; second dose 150 mg IV/IO',
        'First dose 150 mg; second dose 300 mg always',
        '1 mg IV every 3–5 minutes',
        '6 mg then 12 mg rapid push'
      ],
      correct: 'First dose 300 mg IV/IO bolus; second dose 150 mg IV/IO'
    },
    {
      id: 'chest-recoil',
      type: 'choice',
      prompt: 'Besides rate and depth, high-quality CPR also requires?',
      choices: [
        'Allow complete chest recoil and minimize interruptions in compressions',
        'Lean on the chest between every compression',
        'Pause 20 seconds after each breath even with an advanced airway',
        'Compress only once every 10 seconds'
      ],
      correct: 'Allow complete chest recoil and minimize interruptions in compressions'
    },
    {
      id: 'avoid-excessive-ventilation',
      type: 'choice',
      prompt: 'Ventilation during CPR — key quality point?',
      choices: [
        'Avoid excessive ventilation',
        'Hyperventilate as fast as possible to raise SpO2',
        'Give 30 breaths between every compression',
        'Never give oxygen during arrest'
      ],
      correct: 'Avoid excessive ventilation'
    },
    {
      id: 'switch-compressors',
      type: 'choice',
      prompt: 'How often should compressors typically rotate?',
      choices: [
        'About every 2 minutes, or sooner if fatigued',
        'Only at the end of the shift',
        'Never — one person compresses the whole code',
        'Every 30 minutes on the hour'
      ],
      correct: 'About every 2 minutes, or sooner if fatigued'
    },
    {
      id: 'ratio-no-advanced-airway',
      type: 'choice',
      prompt: 'Adult CPR without an advanced airway — compression:ventilation ratio?',
      choices: [
        '30 compressions : 2 breaths',
        '15 compressions : 15 breaths',
        '5 compressions : 1 breath continuously paused',
        '100 compressions with no breaths ever'
      ],
      correct: '30 compressions : 2 breaths'
    },
    {
      id: 'ventilation-advanced-airway',
      type: 'choice',
      prompt: 'Once an advanced airway is in place during CPR?',
      choices: [
        'Continuous compressions; 1 breath every 6 seconds (~10 breaths/min); do not pause for ventilations',
        'Stop compressions for each breath using 30:2 forever',
        'Give 1 breath every second without compressions',
        'Remove the airway before any further CPR'
      ],
      correct: 'Continuous compressions; 1 breath every 6 seconds (~10 breaths/min); do not pause for ventilations'
    },
    {
      id: 'petco2-low',
      type: 'choice',
      prompt: 'Quantitative waveform capnography during CPR shows PETCO₂ <10 mm Hg. Implication?',
      choices: [
        'Attempt to improve CPR quality',
        'ROSC is guaranteed — stop compressions',
        'Shock asystole immediately',
        'Capnography is useless in arrest'
      ],
      correct: 'Attempt to improve CPR quality'
    },
    {
      id: 'petco2-rosc',
      type: 'choice',
      prompt: 'An abrupt sustained rise in PETCO₂ (often ≥40 mm Hg) during CPR may indicate?',
      choices: [
        'Return of spontaneous circulation (ROSC)',
        'Need to stop all monitoring',
        'Certain need for immediate amiodarone only',
        'That the ET tube is definitely in the esophagus'
      ],
      correct: 'Return of spontaneous circulation (ROSC)'
    },
    {
      id: 'arterial-diastolic-cpr',
      type: 'choice',
      prompt: 'If an arterial line is present and diastolic pressure is <20 mm Hg during the relaxation phase of CPR?',
      choices: [
        'Attempt to improve CPR quality',
        'That finding always means ROSC — stop CPR',
        'Ignore A-line data during codes',
        'Give oral antihypertensives immediately'
      ],
      correct: 'Attempt to improve CPR quality'
    },
    {
      id: 'defib-biphasic-energy',
      type: 'choice',
      prompt: 'Biphasic defibrillation energy for VF/pVT?',
      choices: [
        'Use the manufacturer’s recommended energy (often ~120–200 J initially); if unknown, use the maximum available',
        'Always start at 10 J and stop after one shock',
        'Biphasic devices never deliver a shock',
        'Only 360 J is allowed on every biphasic device'
      ],
      correct: 'Use the manufacturer’s recommended energy (often ~120–200 J initially); if unknown, use the maximum available'
    },
    {
      id: 'defib-subsequent-biphasic',
      type: 'choice',
      prompt: 'Subsequent biphasic shocks after the first should be?',
      choices: [
        'Equivalent or higher energy when appropriate',
        'Always half the prior dose',
        'Never repeated if the first shock failed',
        'Replaced by synchronized cardioversion at 25 J'
      ],
      correct: 'Equivalent or higher energy when appropriate'
    },
    {
      id: 'defib-monophasic',
      type: 'choice',
      prompt: 'Monophasic defibrillation energy for VF/pVT?',
      choices: [
        '360 J',
        '50 J synchronized only',
        '10 J for the first three shocks',
        'No shock — drugs only'
      ],
      correct: '360 J'
    },
    {
      id: 'advanced-airway-options',
      type: 'choice',
      prompt: 'Advanced airway options during cardiac arrest include?',
      choices: [
        'Endotracheal intubation or a supraglottic advanced airway',
        'Nasal cannula alone as the only advanced airway',
        'Incentive spirometry during compressions',
        'Tracheostomy tray without any ventilation plan'
      ],
      correct: 'Endotracheal intubation or a supraglottic advanced airway'
    },
    {
      id: 'ett-confirm-capnography',
      type: 'choice',
      prompt: 'How should ET-tube placement be confirmed and monitored when available?',
      choices: [
        'Waveform capnography / capnometry',
        'Guess by chest rise only and remove the monitor',
        'Ask the patient to speak immediately',
        'Listen once then never reassess'
      ],
      correct: 'Waveform capnography / capnometry'
    },
    {
      id: 'rosc-signs',
      type: 'choice',
      prompt: 'Signs that support ROSC include?',
      choices: [
        'Pulse and measurable blood pressure; abrupt sustained PETCO₂ rise; spontaneous arterial pressure waves if an A-line is present',
        'Flat PETCO₂ forever with no pulse',
        'Only a ringing phone at the nurses’ station',
        'Asystole on every lead with no arterial waveform'
      ],
      correct: 'Pulse and measurable blood pressure; abrupt sustained PETCO₂ rise; spontaneous arterial pressure waves if an A-line is present'
    },
    {
      id: 'rosc-next',
      type: 'choice',
      prompt: 'If ROSC occurs, the team should?',
      choices: [
        'Proceed to post–cardiac arrest care',
        'Immediately stop all monitoring and leave',
        'Shock asystole prophylactically every minute',
        'Give three more unsynchronized shocks for celebration'
      ],
      correct: 'Proceed to post–cardiac arrest care'
    },
    {
      id: 'hs-list',
      type: 'choice',
      prompt: 'Which cluster lists classic reversible “H” causes of arrest?',
      choices: [
        'Hypovolemia, hypoxia, hydrogen ion excess (acidosis), hypo/hyperkalemia, hypothermia',
        'Headache, hiccups, hay fever, hangnail, hunger',
        'Only hyperthyroidism and happiness',
        'Hypertension only — ignore oxygen and volume'
      ],
      correct: 'Hypovolemia, hypoxia, hydrogen ion excess (acidosis), hypo/hyperkalemia, hypothermia'
    },
    {
      id: 'ts-list',
      type: 'choice',
      prompt: 'Which cluster lists classic reversible “T” causes of arrest?',
      choices: [
        'Tension pneumothorax, cardiac tamponade, toxins, pulmonary thrombosis, coronary thrombosis',
        'Toothache, tinnitus, tremors, thirst, typo',
        'Only typhoid and tennis elbow',
        'Tachypnea from anxiety alone'
      ],
      correct: 'Tension pneumothorax, cardiac tamponade, toxins, pulmonary thrombosis, coronary thrombosis'
    },
    {
      id: 'universal-arrest-priorities',
      type: 'choice',
      prompt: 'Universal adult cardiac-arrest priorities across pathways?',
      choices: [
        'High-quality CPR + oxygen + IV/IO + rhythm checks every 2 minutes + treat reversible causes',
        'Charting first, then optional compressions later',
        'Antiarrhythmics only — skip CPR if a monitor is attached',
        'Wait for family consent before any defibrillation in VF'
      ],
      correct: 'High-quality CPR + oxygen + IV/IO + rhythm checks every 2 minutes + treat reversible causes'
    },
    {
      id: 'consider-airway-capnography',
      type: 'choice',
      prompt: 'During ongoing CPR cycles on either arrest pathway, also consider?',
      choices: [
        'Advanced airway placement and waveform capnography when available',
        'Removing all oxygen to simplify the scene',
        'Stopping IV/IO access permanently',
        'Canceling rhythm checks after the first minute'
      ],
      correct: 'Advanced airway placement and waveform capnography when available'
    },
    {
      id: 'bls-order',
      type: 'order',
      prompt: 'Order the first response priorities (1 → 3):'
    }
  ]
};

export default codeBlueChallengeConfig;
