/**
 * Vascular emergency recognition MCQ banks (AAA, PE, peripheral clot).
 * Keys match library.json skill ids.
 */

function bank(title, questions) {
  return { title, questions };
}

export const aaaSkillBank = bank('Abdominal aortic aneurysm (AAA)', [
  {
    id: 'ss-rupture',
    prompt: 'Which cluster best suggests possible AAA rupture / expansion?',
    correct: 'Sudden severe back or abdominal pain, hypotension, and a pulsatile abdominal mass (or known AAA)',
    choices: [
      'Sudden severe back or abdominal pain, hypotension, and a pulsatile abdominal mass (or known AAA)',
      'Isolated mild ankle edema after a long walk',
      'Chronic stable knee pain only',
      'Low-grade fever with normal BP and soft abdomen'
    ]
  },
  {
    id: 'grey-turner',
    prompt: 'Flank or periumbilical ecchymosis with shock after known AAA raises concern for?',
    correct: 'Retroperitoneal or abdominal hemorrhage from rupture — emergently escalate',
    choices: [
      'Retroperitoneal or abdominal hemorrhage from rupture — emergently escalate',
      'Expected post-op bruising that never needs reporting',
      'Only a medication allergy',
      'Benign constipation'
    ]
  },
  {
    id: 'priority',
    prompt: 'Suspected rupturing AAA — nursing priority?',
    correct: 'Activate rapid response / OR pathway; large-bore IV access; keep NPO; continuous monitoring; do not delay for nonessential tasks',
    choices: [
      'Activate rapid response / OR pathway; large-bore IV access; keep NPO; continuous monitoring; do not delay for nonessential tasks',
      'Send the patient to walk to radiology alone',
      'Give a full meal tray before calling',
      'Wait until the next routine round in 4 hours'
    ]
  },
  {
    id: 'bp-pain',
    prompt: 'Known AAA with new tearing back pain and falling BP — best interpretation?',
    correct: 'Treat as possible rupture until proven otherwise; escalate immediately',
    choices: [
      'Treat as possible rupture until proven otherwise; escalate immediately',
      'Document as musculoskeletal strain and continue SCDs only',
      'Discharge home with NSAIDs',
      'Ignore BP if pain is controlled with ice'
    ]
  },
  {
    id: 'palpate',
    prompt: 'Bedside abdominal assessment cue for AAA (when appropriate / ordered)?',
    correct: 'Note a pulsatile expansile mass; avoid aggressive deep palpation if rupture is suspected',
    choices: [
      'Note a pulsatile expansile mass; avoid aggressive deep palpation if rupture is suspected',
      'Force deep palpation until the patient vomits',
      'Skip abdominal exam entirely forever',
      'Only check capillary refill on the earlobes'
    ]
  }
]);

export const pulmonaryEmbolismSkillBank = bank('Pulmonary embolism', [
  {
    id: 'ss',
    prompt: 'Classic acute PE warning pattern?',
    correct: 'Sudden dyspnea, tachycardia, hypoxemia ± pleuritic chest pain; may have anxiety or syncope',
    choices: [
      'Sudden dyspnea, tachycardia, hypoxemia ± pleuritic chest pain; may have anxiety or syncope',
      'Isolated chronic knee crepitus for years',
      'Stable SpO2 99% with no vitals change after ambulation',
      'Only constipation without respiratory change'
    ]
  },
  {
    id: 'risk',
    prompt: 'Which recent history raises PE suspicion with new SOB?',
    correct: 'Immobility, recent surgery, DVT history, cancer, or estrogen — plus sudden respiratory change',
    choices: [
      'Immobility, recent surgery, DVT history, cancer, or estrogen — plus sudden respiratory change',
      'Well-controlled seasonal allergies only',
      'Eating ice chips',
      'Having a full night of sleep'
    ]
  },
  {
    id: 'priority',
    prompt: 'New sudden desaturation and tachycardia after hip surgery — priority?',
    correct: 'Support airway/O2 per protocol, stay with patient, notify provider / escalate for PE workup',
    choices: [
      'Support airway/O2 per protocol, stay with patient, notify provider / escalate for PE workup',
      'Encourage hallway ambulation without reassessment',
      'Turn off telemetry to silence alarms',
      'Wait for morning rounds only'
    ]
  },
  {
    id: 'vs',
    prompt: 'Vital-sign pattern that should heighten PE concern?',
    correct: 'Unexplained tachycardia with falling SpO2 and increased work of breathing',
    choices: [
      'Unexplained tachycardia with falling SpO2 and increased work of breathing',
      'Bradycardia with perfect SpO2 and no distress',
      'Normal RR with no change from baseline after rest',
      'Only a one-point drop in pain score'
    ]
  },
  {
    id: 'vs-dvt',
    prompt: 'Unilateral leg swelling before sudden dyspnea suggests you should also consider?',
    correct: 'DVT with embolization to the lungs — assess limb and escalate for PE',
    choices: [
      'DVT with embolization to the lungs — assess limb and escalate for PE',
      'That PE is impossible if a leg looks swollen',
      'Only cellulitis forever without respiratory assessment',
      'Stopping all VTE prophylaxis documentation'
    ]
  }
]);

export const peripheralClotSkillBank = bank('Peripheral clot suspicion (limb)', [
  {
    id: 'arterial-ss',
    prompt: 'Signs that suggest acute arterial occlusion of a limb?',
    correct: 'Pain, pallor, pulselessness, paresthesia, paralysis, poikilothermia (the “6 Ps”)',
    choices: [
      'Pain, pallor, pulselessness, paresthesia, paralysis, poikilothermia (the “6 Ps”)',
      'Warm red limb with bounding pulses only',
      'Bilateral equal strong pulses and pink warm feet',
      'Isolated headache without limb findings'
    ]
  },
  {
    id: 'venous-ss',
    prompt: 'Findings more consistent with DVT than acute arterial occlusion?',
    correct: 'Unilateral swelling, warmth, erythema, calf pain — pulses usually still present',
    choices: [
      'Unilateral swelling, warmth, erythema, calf pain — pulses usually still present',
      'Cold pale pulseless limb with mottling',
      'Absent arterial Doppler signals with paralysis',
      'Sudden loss of all sensation and movement with no swelling history'
    ]
  },
  {
    id: 'no-pulse',
    prompt: 'You cannot palpate a dorsalis pedis / radial pulse on the affected side. Next bedside step?',
    correct: 'Compare to the other side; use Doppler if available; escalate immediately if pulse is truly absent with ischemic signs',
    choices: [
      'Compare to the other side; use Doppler if available; escalate immediately if pulse is truly absent with ischemic signs',
      'Document “pulse fine” without checking the other limb',
      'Apply SCDs tightly over the cold pulseless limb and leave',
      'Wait until tomorrow’s PT session'
    ]
  },
  {
    id: 'doppler-arterial',
    prompt: 'Suspected acute arterial occlusion (cold, pale, no pulse) — which vascular study is most appropriate to order/advocate for?',
    correct: 'Arterial Doppler / arterial duplex of the affected limb (urgent vascular evaluation)',
    choices: [
      'Arterial Doppler / arterial duplex of the affected limb (urgent vascular evaluation)',
      'Venous Doppler only, because arterial flow never matters',
      'Abdominal ultrasound for gallstones as first-line',
      'No imaging — ice the limb and ambulate'
    ]
  },
  {
    id: 'doppler-venous',
    prompt: 'Suspected DVT (swollen, warm, painful calf with pulses present) — which test is typically ordered?',
    correct: 'Venous Doppler / venous duplex ultrasound of the affected limb',
    choices: [
      'Venous Doppler / venous duplex ultrasound of the affected limb',
      'Arterial Doppler only, ignoring the venous system',
      'EEG as the first test',
      'No test — start random IM antibiotics without assessment'
    ]
  },
  {
    id: 'which-test',
    prompt: 'Quick rule: pulseless cold limb vs swollen warm limb with pulses — which Doppler?',
    correct: 'Pulseless/cold → arterial Doppler; swollen/warm with pulses → venous Doppler (and escalate either way)',
    choices: [
      'Pulseless/cold → arterial Doppler; swollen/warm with pulses → venous Doppler (and escalate either way)',
      'Always venous Doppler for every limb complaint',
      'Always arterial Doppler even when pulses are bounding and the limb is warm/swollen',
      'Doppler type does not matter and never call vascular'
    ]
  }
]);
