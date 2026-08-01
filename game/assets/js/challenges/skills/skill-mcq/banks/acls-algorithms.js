/**
 * ACLS adult bradycardia / tachycardia-with-pulse algorithm MCQ banks.
 * Keys match library.json skill ids. Educational fiction — not certification.
 */

function bank(title, questions) {
  return { title, questions };
}

/** Adult Bradycardia Algorithm (with a pulse). */
export const aclsBradycardiaSkillBank = bank('Adult bradycardia algorithm', [
  {
    id: 'first-assess',
    prompt: 'Monitor shows bradycardia and the patient has a pulse. First priority?',
    correct: 'Assess ABCs / airway–breathing–circulation, oxygen if hypoxic, and check for signs of poor perfusion',
    choices: [
      'Assess ABCs / airway–breathing–circulation, oxygen if hypoxic, and check for signs of poor perfusion',
      'Immediately defibrillate at 200 J unsynchronized',
      'Start chest compressions because the rate is under 60',
      'Give amiodarone 300 mg IV push first'
    ]
  },
  {
    id: 'poor-perfusion',
    prompt: 'Which cluster best marks symptomatic bradycardia needing urgent treatment?',
    correct: 'Hypotension, acutely altered mentation, shock, ischemic chest discomfort, or acute heart failure',
    choices: [
      'Hypotension, acutely altered mentation, shock, ischemic chest discomfort, or acute heart failure',
      'Asymptomatic HR 55 with normal BP and mentation',
      'Chronic stable resting HR 58 in a well athlete only',
      'Mild anxiety with SpO2 99% and warm extremities'
    ]
  },
  {
    id: 'atropine-first',
    prompt: 'For symptomatic bradycardia with a pulse, the usual first medication step is?',
    correct: 'Atropine while preparing TCP / considering infusions if needed',
    choices: [
      'Atropine while preparing TCP / considering infusions if needed',
      'Immediate unsynchronized defibrillation',
      'Adenosine 6 mg rapid IV push',
      'Procainamide loading dose only'
    ]
  },
  {
    id: 'atropine-dose',
    prompt: 'Adult atropine dose for symptomatic bradycardia (AHA algorithm teaching)?',
    correct: '1 mg IV; may repeat every 3–5 minutes up to a total of 3 mg',
    choices: [
      '1 mg IV; may repeat every 3–5 minutes up to a total of 3 mg',
      '0.1 mg IV once only',
      '6 mg rapid IV push with flush',
      '300 mg IV over 10 minutes'
    ]
  },
  {
    id: 'atropine-fails',
    prompt: 'Atropine is ineffective and the patient remains unstable with a pulse. Next algorithm options include?',
    correct: 'Transcutaneous pacing and/or dopamine or epinephrine infusion',
    choices: [
      'Transcutaneous pacing and/or dopamine or epinephrine infusion',
      'Only oral beta-blockers and observation',
      'Immediate fibrinolytics for every bradycardia',
      'Vagal maneuvers until the rate rises'
    ]
  },
  {
    id: 'tcp-ready',
    prompt: 'When should you be ready to start transcutaneous pacing (TCP)?',
    correct: 'Do not delay TCP for patients with severe symptoms or high-degree block while preparing meds/expert help',
    choices: [
      'Do not delay TCP for patients with severe symptoms or high-degree block while preparing meds/expert help',
      'Only after 24 hours of atropine trials',
      'Never if a pulse is present',
      'Only after giving adenosine first'
    ]
  },
  {
    id: 'dopamine-range',
    prompt: 'Typical dopamine infusion range taught on the adult bradycardia algorithm?',
    correct: '5–20 mcg/kg/min IV infusion; titrate to patient response',
    choices: [
      '5–20 mcg/kg/min IV infusion; titrate to patient response',
      '1 mg IV push every minute',
      '300 mg IV bolus once',
      '6 mg rapid IV with saline flush'
    ]
  },
  {
    id: 'epi-infusion',
    prompt: 'Epinephrine infusion option on the adult bradycardia algorithm?',
    correct: '2–10 mcg/min IV infusion; titrate to patient response',
    choices: [
      '2–10 mcg/min IV infusion; titrate to patient response',
      '1 mg IV push every 3–5 min as the only brady treatment',
      '40 units IV once like vasopressin for arrest only',
      'Oral epinephrine tablets'
    ]
  },
  {
    id: 'identify-cause',
    prompt: 'While treating symptomatic bradycardia, you should also?',
    correct: 'Search for and treat reversible causes (Hs/Ts and contributing meds/ischemia)',
    choices: [
      'Search for and treat reversible causes (Hs/Ts and contributing meds/ischemia)',
      'Ignore oxygen sat if the rate looks low on the monitor',
      'Stop all monitoring once atropine is given',
      'Assume pacing will never be needed if HR is over 40'
    ]
  },
  {
    id: 'hypoxia',
    prompt: 'Bradycardia with hypoxia — priority alongside the algorithm meds/pacing path?',
    correct: 'Support oxygenation/ventilation; hypoxia can drive or worsen bradycardia',
    choices: [
      'Support oxygenation/ventilation; hypoxia can drive or worsen bradycardia',
      'Withhold oxygen until after three atropine doses',
      'Defibrillate for every SpO2 under 94%',
      'Remove the pulse oximeter so numbers do not distract'
    ]
  },
  {
    id: 'asymptomatic',
    prompt: 'HR 48, warm, alert, BP normal, no ischemic symptoms. Best approach?',
    correct: 'Observe, monitor, and investigate causes — do not automatically push atropine',
    choices: [
      'Observe, monitor, and investigate causes — do not automatically push atropine',
      'Immediate TCP at maximum output',
      'Unsynchronized shock at 360 J',
      'Adenosine 12 mg for diagnosis'
    ]
  },
  {
    id: 'pulse-check',
    prompt: 'Bradycardia algorithm assumes which key finding?',
    correct: 'A pulse is present (this is not the pulseless arrest algorithm)',
    choices: [
      'A pulse is present (this is not the pulseless arrest algorithm)',
      'No pulse for 10 minutes already',
      'Asystole on every lead',
      'Only PEA without any organized rhythm'
    ]
  },
  {
    id: 'rate-threshold',
    prompt: 'On the adult bradycardia algorithm, a heart rate is typically treated as clinically significant bradycardia when?',
    correct: 'Heart rate is <50 beats/minute (and then judged in clinical context)',
    choices: [
      'Heart rate is <50 beats/minute (and then judged in clinical context)',
      'Heart rate is exactly 100 beats/minute',
      'Heart rate is >150 with no pulse',
      'Any rate under 80 in every sleeping patient'
    ]
  },
  {
    id: 'context-appropriate',
    prompt: 'After recognizing bradycardia, what should you assess about the rate itself?',
    correct: 'Whether the slow rate is appropriate for the patient’s clinical condition (not every slow rate needs atropine)',
    choices: [
      'Whether the slow rate is appropriate for the patient’s clinical condition (not every slow rate needs atropine)',
      'Only the monitor number — ignore symptoms and BP',
      'Whether the printer has paper for a rhythm strip only',
      'Whether the patient prefers oral meds first'
    ]
  },
  {
    id: 'supportive-bundle',
    prompt: 'Initial supportive measures on the adult bradycardia algorithm include?',
    correct: 'Patent airway and assist breathing as needed; O₂ if hypoxemic; cardiac monitor; BP and SpO₂; IV access',
    choices: [
      'Patent airway and assist breathing as needed; O₂ if hypoxemic; cardiac monitor; BP and SpO₂; IV access',
      'Send the patient to walk to radiology alone first',
      'Remove monitoring so the patient can rest undisturbed',
      'Give three adenosine doses before any airway assessment'
    ]
  },
  {
    id: 'twelve-lead',
    prompt: 'Regarding a 12-lead ECG in symptomatic bradycardia?',
    correct: 'Obtain a 12-lead if available, but do not delay urgent treatment to get it',
    choices: [
      'Obtain a 12-lead if available, but do not delay urgent treatment to get it',
      'Never treat until a 12-lead and full lab panel return',
      '12-lead replaces the need for continuous cardiac monitoring',
      'Skip ECG forever if atropine was given once'
    ]
  },
  {
    id: 'toxic-electrolyte-causes',
    prompt: 'Which cause cluster is highlighted for bradycardia workup on the algorithm?',
    correct: 'Myocardial ischemia/infarction; drugs (CCB, beta blockers, digoxin); hypoxia; electrolyte problems such as hyperkalemia',
    choices: [
      'Myocardial ischemia/infarction; drugs (CCB, beta blockers, digoxin); hypoxia; electrolyte problems such as hyperkalemia',
      'Only seasonal allergies',
      'Only chronic knee osteoarthritis',
      'Only constipation without cardiac meds or labs'
    ]
  },
  {
    id: 'expert-tvp',
    prompt: 'If bradycardia and poor perfusion persist after atropine / TCP / infusions, consider?',
    correct: 'Expert consultation and transvenous pacing',
    choices: [
      'Expert consultation and transvenous pacing',
      'Discharge home with a Holter only',
      'Stop all monitoring and reassess tomorrow',
      'Adenosine 6 mg to “reset” sinus bradycardia'
    ]
  },
  {
    id: 'memory-sequence',
    prompt: 'Useful ACLS memory sequence for symptomatic bradycardia with poor perfusion?',
    correct: 'Atropine → pacing and/or dopamine/epinephrine → expert consultation / transvenous pacing',
    choices: [
      'Atropine → pacing and/or dopamine/epinephrine → expert consultation / transvenous pacing',
      'Adenosine → amiodarone → unsynchronized defibrillation for every pulse',
      'Vagal maneuvers → beta blocker → discharge',
      'Aspirin only → wait 4 hours → repeat ECG'
    ]
  },
  {
    id: 'dopamine-taper',
    prompt: 'When stopping or reducing a dopamine infusion used for symptomatic bradycardia, teaching point?',
    correct: 'Taper slowly when appropriate',
    choices: [
      'Taper slowly when appropriate',
      'Stop abruptly every time to “test” the rhythm',
      'Double the rate for 1 hour before any wean',
      'Switch to adenosine bolus before any taper'
    ]
  },
  {
    id: 'post-atropine-alternatives',
    prompt: 'If atropine is ineffective, how does the adult bradycardia algorithm present TCP, dopamine, and epinephrine?',
    correct: 'As alternatives (one or more) chosen by clinical situation — not a single fixed mandatory sequence',
    choices: [
      'As alternatives (one or more) chosen by clinical situation — not a single fixed mandatory sequence',
      'Always TCP first, then dopamine only, then epinephrine last — never skip steps',
      'Always epinephrine bolus before any pacing consideration',
      'Only oral beta-blockers after atropine fails'
    ]
  },
  {
    id: 'persistent-brady',
    prompt: 'When does persistent bradycardia require urgent algorithm treatment (atropine / TCP / infusions)?',
    correct: 'When it is causing hypotension, acutely altered mentation, shock, ischemic chest discomfort, or acute heart failure',
    choices: [
      'When it is causing hypotension, acutely altered mentation, shock, ischemic chest discomfort, or acute heart failure',
      'For every single beat under 60, even if brief and asymptomatic',
      'Only after 24 hours of observation with no symptoms',
      'Only when the printer fails to print a strip'
    ]
  },
  {
    id: 'monitor-purpose',
    prompt: 'Why place the bradycardic patient on a cardiac monitor early in the algorithm?',
    correct: 'To identify the rhythm while continuing assessment and treatment',
    choices: [
      'To identify the rhythm while continuing assessment and treatment',
      'To replace the need for pulse checks and blood pressure',
      'Only so the family can watch the tracing',
      'Because monitoring alone treats the bradycardia'
    ]
  },
  {
    id: 'hypoxic-toxic-screen',
    prompt: 'Early in adult bradycardia care, alongside supportive measures, specifically consider?',
    correct: 'Possible hypoxic and toxicologic causes',
    choices: [
      'Possible hypoxic and toxicologic causes',
      'Only seasonal allergies as the cause',
      'Only chronic knee pain as the cause',
      'Defer all cause search until after transvenous pacing is placed'
    ]
  }
]);

/** Adult Tachycardia With a Pulse Algorithm. */
export const aclsTachycardiaSkillBank = bank('Adult tachycardia with pulse', [
  {
    id: 'first-assess',
    prompt: 'Tachycardia on the monitor and a pulse is present. First priority?',
    correct: 'Maintain airway/oxygenation as needed, monitor ECG and vitals, and decide if the patient is stable or unstable',
    choices: [
      'Maintain airway/oxygenation as needed, monitor ECG and vitals, and decide if the patient is stable or unstable',
      'Start CPR immediately for any HR over 100',
      'Give atropine 1 mg first for every tachycardia',
      'Wait for a full chemistry panel before any assessment'
    ]
  },
  {
    id: 'unstable-signs',
    prompt: 'Which best defines unstable tachycardia needing immediate synchronized cardioversion?',
    correct: 'Serious signs from the tachyarrhythmia: hypotension, acutely altered mentation, shock, ischemic chest pain, or acute heart failure',
    choices: [
      'Serious signs from the tachyarrhythmia: hypotension, acutely altered mentation, shock, ischemic chest pain, or acute heart failure',
      'Mild anxiety with normal BP and mentation only',
      'Chronic AFib with HR 88 and no new symptoms',
      'Sinus tach from pain that improves when pain is treated'
    ]
  },
  {
    id: 'cardioversion',
    prompt: 'Unstable tachycardia with a pulse — algorithm action?',
    correct: 'Synchronized cardioversion (sedate if conscious and it will not delay shock)',
    choices: [
      'Synchronized cardioversion (sedate if conscious and it will not delay shock)',
      'Unsynchronized defibrillation for every stable SVT',
      'Atropine 1 mg IV push',
      'Oral metoprolol only and leave the room'
    ]
  },
  {
    id: 'narrow-regular',
    prompt: 'Stable regular narrow-complex tachycardia — common next steps?',
    correct: 'Vagal maneuvers, then adenosine if regular and monomorphic',
    choices: [
      'Vagal maneuvers, then adenosine if regular and monomorphic',
      'Immediate unsynchronized defibrillation at 360 J',
      'Chest compressions for 2 minutes first',
      'Atropine 3 mg total as first-line'
    ]
  },
  {
    id: 'adenosine-dose',
    prompt: 'Adult adenosine dosing commonly taught for regular narrow-complex SVT?',
    correct: '6 mg rapid IV push with flush; if needed, 12 mg rapid IV push',
    choices: [
      '6 mg rapid IV push with flush; if needed, 12 mg rapid IV push',
      '1 mg IV slow over 10 minutes',
      '300 mg IV bolus',
      '40 units IV once'
    ]
  },
  {
    id: 'wide-regular',
    prompt: 'Stable regular wide-complex tachycardia — algorithm direction?',
    correct: 'Expert consultation; antiarrhythmic options (e.g., procainamide, amiodarone, sotalol) if appropriate — avoid delay if unstable',
    choices: [
      'Expert consultation; antiarrhythmic options (e.g., procainamide, amiodarone, sotalol) if appropriate — avoid delay if unstable',
      'Always give adenosine for every wide irregular rhythm',
      'Atropine first-line for wide-complex tachycardia',
      'Ignore QRS width and treat as sinus tach only'
    ]
  },
  {
    id: 'wide-irregular',
    prompt: 'Why is adenosine generally avoided for irregular wide-complex tachycardia?',
    correct: 'Risk of harm in rhythms such as pre-excited AF; irregular wide complexes need expert/path-specific care',
    choices: [
      'Risk of harm in rhythms such as pre-excited AF; irregular wide complexes need expert/path-specific care',
      'Adenosine always cures VT so it is never needed',
      'Because atropine replaces adenosine in all tachycardias',
      'Because the patient must be NPO for 12 hours first'
    ]
  },
  {
    id: 'qrs-cutoff',
    prompt: 'On the adult tachycardia algorithm, “wide QRS” is commonly taught as?',
    correct: 'QRS ≥ 0.12 seconds',
    choices: [
      'QRS ≥ 0.12 seconds',
      'QRS ≤ 0.04 seconds only',
      'Any P wave taller than 1 mm',
      'Heart rate exactly 100'
    ]
  },
  {
    id: 'polymorphic',
    prompt: 'Unstable polymorphic VT / irregular wide polymorphic rhythm with a pulse deteriorating — priority concept?',
    correct: 'Treat as a shockable deteriorating rhythm pathway (defibrillation energy/unsynchronized as indicated) and address causes (e.g., magnesium for torsades when appropriate)',
    choices: [
      'Treat as a shockable deteriorating rhythm pathway (defibrillation energy/unsynchronized as indicated) and address causes (e.g., magnesium for torsades when appropriate)',
      'Vagal maneuvers only for 30 minutes',
      'Atropine 1 mg as the sole therapy',
      'Discharge home with a Holter'
    ]
  },
  {
    id: 'stable-af',
    prompt: 'Stable irregular narrow-complex tachycardia (e.g., AF with RVR) — teaching priority?',
    correct: 'Rate control / expert consultation and treat underlying causes; avoid adenosine as a rate-control strategy for AF',
    choices: [
      'Rate control / expert consultation and treat underlying causes; avoid adenosine as a rate-control strategy for AF',
      'Immediate TCP for every AF',
      'Adenosine 6–12 mg to “convert” chronic AF reliably',
      'Chest compressions while a pulse is strong and BP is normal'
    ]
  },
  {
    id: 'sedation',
    prompt: 'Conscious unstable patient needing synchronized cardioversion — sedation teaching point?',
    correct: 'Sedate if possible, but do not delay cardioversion for deteriorating instability',
    choices: [
      'Sedate if possible, but do not delay cardioversion for deteriorating instability',
      'Never cardiovert until fully NPO for 8 hours',
      'Always wait for MRI clearance first',
      'Only shock after three adenosine doses fail'
    ]
  },
  {
    id: 'sinus-tach',
    prompt: 'Sinus tachycardia from fever/pain/hypovolemia — best algorithm mindset?',
    correct: 'Treat the underlying cause; the rhythm itself is usually not the primary “antiarrhythmic target”',
    choices: [
      'Treat the underlying cause; the rhythm itself is usually not the primary “antiarrhythmic target”',
      'Immediate synchronized cardioversion for every sinus tach',
      'Adenosine 12 mg to diagnose sinus tach',
      'Start dopamine infusion for every sinus rate over 100'
    ]
  },
  {
    id: 'rate-threshold',
    prompt: 'Tachyarrhythmia that typically requires the adult ACLS tachycardia pathway is taught as a heart rate of?',
    correct: '≥150/min (then judged with clinical context)',
    choices: [
      '≥150/min (then judged with clinical context)',
      '<50/min with a pulse',
      'Exactly 100/min in every patient',
      'Any rate over 80 while sleeping'
    ]
  },
  {
    id: 'context-appropriate',
    prompt: 'After recognizing tachycardia with a pulse, what should you assess about the rate itself?',
    correct: 'Whether the tachycardia is appropriate for the patient’s clinical condition (e.g., fever, pain, hypovolemia)',
    choices: [
      'Whether the tachycardia is appropriate for the patient’s clinical condition (e.g., fever, pain, hypovolemia)',
      'Only the monitor number — ignore symptoms, BP, and causes',
      'Whether the printer has paper for a rhythm strip only',
      'Whether the patient prefers oral meds before any assessment'
    ]
  },
  {
    id: 'supportive-bundle',
    prompt: 'Initial supportive care on the adult tachycardia-with-pulse algorithm includes?',
    correct: 'Patent airway; assist breathing as needed; O₂ if hypoxemic; cardiac monitor; BP and pulse oximetry',
    choices: [
      'Patent airway; assist breathing as needed; O₂ if hypoxemic; cardiac monitor; BP and pulse oximetry',
      'Send the patient to walk to radiology alone first',
      'Remove monitoring so the patient can rest undisturbed',
      'Give three atropine doses before any airway assessment'
    ]
  },
  {
    id: 'adenosine-pre-cardioversion',
    prompt: 'Unstable patient with regular narrow-complex tachycardia — adenosine teaching point while preparing cardioversion?',
    correct: 'Adenosine may be considered while preparing for synchronized cardioversion',
    choices: [
      'Adenosine may be considered while preparing for synchronized cardioversion',
      'Adenosine replaces cardioversion and shocks are never used',
      'Adenosine is only for asystole',
      'Adenosine must wait until after three unsynchronized shocks'
    ]
  },
  {
    id: 'energy-narrow-regular',
    prompt: 'Initial synchronized cardioversion energy commonly taught for narrow, regular tachycardia?',
    correct: '50–100 J',
    choices: [
      '50–100 J',
      '1 J only',
      '360 J unsynchronized for every stable SVT',
      'No energy — adenosine is the only option forever'
    ]
  },
  {
    id: 'energy-narrow-irregular',
    prompt: 'Initial synchronized cardioversion energy commonly taught for narrow, irregular tachycardia?',
    correct: '120–200 J biphasic (or 200 J monophasic)',
    choices: [
      '120–200 J biphasic (or 200 J monophasic)',
      '10–20 J only',
      'Always 50 J synchronized for AF with RVR',
      'Defibrillation dose unsynchronized for every stable AF'
    ]
  },
  {
    id: 'energy-wide-regular',
    prompt: 'Initial synchronized cardioversion energy commonly taught for wide, regular tachycardia?',
    correct: '100 J',
    choices: [
      '100 J',
      '5 J only',
      'Adenosine 300 mg IV push instead of any shock',
      'Always 360 J unsynchronized when a pulse is strong and BP is normal'
    ]
  },
  {
    id: 'wide-irregular-shock',
    prompt: 'Wide, irregular tachycardia on the adult tachycardia algorithm — shock approach?',
    correct: 'Use a defibrillation dose — not synchronized cardioversion',
    choices: [
      'Use a defibrillation dose — not synchronized cardioversion',
      'Always synchronize at 50 J and stop',
      'Vagal maneuvers only for 30 minutes',
      'Atropine 1 mg as the sole therapy'
    ]
  },
  {
    id: 'wide-adenosine-rule',
    prompt: 'For stable wide-QRS tachycardia, adenosine is considered when?',
    correct: 'Only if the rhythm is regular and monomorphic',
    choices: [
      'Only if the rhythm is regular and monomorphic',
      'For every irregular polymorphic wide rhythm first-line',
      'Never if QRS is ≥0.12 seconds',
      'Only after three unsynchronized shocks fail'
    ]
  },
  {
    id: 'narrow-rate-control',
    prompt: 'Stable narrow-QRS tachycardia after vagal maneuvers / adenosine (when appropriate) — algorithm also considers?',
    correct: 'A β-blocker or calcium channel blocker, plus expert consultation',
    choices: [
      'A β-blocker or calcium channel blocker, plus expert consultation',
      'Immediate TCP for every narrow complex',
      'Atropine 1 mg IV push',
      'Chest compressions while BP and mentation are normal'
    ]
  },
  {
    id: 'iv-twelve-lead',
    prompt: 'For stable tachycardia with a pulse, while sorting QRS width / treatment path, also?',
    correct: 'Establish IV access and obtain a 12-lead ECG if available',
    choices: [
      'Establish IV access and obtain a 12-lead ECG if available',
      'Never place IV until after three shocks',
      'Skip ECG forever if the rate is over 100',
      'Remove the pulse oximeter before any meds'
    ]
  },
  {
    id: 'procainamide',
    prompt: 'Procainamide for stable wide-QRS tachycardia — teaching points?',
    correct: '20–50 mg/min IV until suppressed, hypotension, QRS ↑ >50%, or max 17 mg/kg; maint 1–4 mg/min; avoid prolonged QT / CHF',
    choices: [
      '20–50 mg/min IV until suppressed, hypotension, QRS ↑ >50%, or max 17 mg/kg; maint 1–4 mg/min; avoid prolonged QT / CHF',
      '6 mg rapid IV push with flush only',
      '1 mg IV every 3–5 minutes up to 3 mg',
      'Oral procainamide once daily at home first'
    ]
  },
  {
    id: 'amiodarone',
    prompt: 'Amiodarone for stable wide-QRS / VT teaching dose on this algorithm?',
    correct: '150 mg IV over 10 minutes; may repeat if VT recurs; then maintenance 1 mg/min for the first 6 hours',
    choices: [
      '150 mg IV over 10 minutes; may repeat if VT recurs; then maintenance 1 mg/min for the first 6 hours',
      '6 mg rapid IV push with flush',
      '1 mg IV push every 3–5 minutes',
      '300 mg IV push for every stable patient with a strong pulse'
    ]
  },
  {
    id: 'sotalol',
    prompt: 'Sotalol option for stable wide-QRS tachycardia — dose / caution?',
    correct: '100 mg (1.5 mg/kg) IV over 5 minutes; avoid with prolonged QT',
    choices: [
      '100 mg (1.5 mg/kg) IV over 5 minutes; avoid with prolonged QT',
      '6 mg rapid IV push only',
      '1 mg IV every 3–5 minutes up to 3 mg',
      'Always first-line for prolonged QT torsades'
    ]
  },
  {
    id: 'memory-sequence',
    prompt: 'Useful ACLS memory sequence for tachycardia with a pulse?',
    correct: 'Stable or unstable? Unstable → cardiovert. Stable → QRS wide or narrow? Wide: regular monomorphic → consider adenosine/antiarrhythmic. Narrow: vagal → adenosine if regular → β-blocker/CCB',
    choices: [
      'Stable or unstable? Unstable → cardiovert. Stable → QRS wide or narrow? Wide: regular monomorphic → consider adenosine/antiarrhythmic. Narrow: vagal → adenosine if regular → β-blocker/CCB',
      'Atropine → TCP → dopamine for every HR over 100',
      'Immediate CPR for any pulse with HR over 120',
      'Adenosine → amiodarone → discharge home without assessing stability'
    ]
  },
  {
    id: 'instability-mnemonic',
    prompt: 'Classic instability checklist mnemonic for tachycardia with a pulse (H-M-S-I-H)?',
    correct: 'Hypotension, altered Mental status, Shock, Ischemic chest discomfort, acute Heart failure',
    choices: [
      'Hypotension, altered Mental status, Shock, Ischemic chest discomfort, acute Heart failure',
      'Hunger, Mild headache, Soft stools, Itchy skin, Hiccups',
      'Hyperthermia only, Murmur only, Snoring, Insomnia, Hives',
      'High potassium, Mild bradycardia, Sinus pause, Ischemia ignored, Hold oxygen'
    ]
  }
]);
