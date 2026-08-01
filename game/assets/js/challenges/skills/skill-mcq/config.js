/**
 * Shared skill-library MCQ banks — AUTHOR CONTENT HERE.
 * Path: challenges/skills/skill-mcq/config.js
 * Keys match game/events/skills/library.json skill ids.
 * Larger banks may live under ./banks/ and be merged below.
 * Question types: choice (default) | sata | match | flash | audio (sheet "Video") | image (rhythm strip)
 */
import { abgSkillBank } from './banks/abg.js';
import { arterialLineSkillBank } from './banks/arterial-line.js';
import {
  heartSoundsSkillBank,
  lungSoundsSkillBank,
  capillaryRefillSkillBank,
  swellingSkillBank
} from './banks/physical-assessment.js';
import {
  levophedDripSkillBank,
  vasopressinDripSkillBank,
  neosynephrineDripSkillBank,
  dopamineDripSkillBank,
  dobutamineDripSkillBank,
  propofolDripSkillBank,
  precedexDripSkillBank,
  fentanylDripSkillBank,
  morphineDripSkillBank,
  vasopressorsSkillBank,
  icuSedationSkillBank
} from './banks/icu-vasoactive-sedation.js';
import {
  aaaSkillBank,
  pulmonaryEmbolismSkillBank,
  peripheralClotSkillBank
} from './banks/vascular-emergencies.js';
import {
  aclsBradycardiaSkillBank,
  aclsTachycardiaSkillBank
} from './banks/acls-algorithms.js';
import {
  respiratoryFailureAirwaySkillBank,
  respiratoryFailureAirwayIcuSkillBank
} from './banks/respiratory-failure-airway.js';
import { strokeAssessmentSkillBank } from './banks/stroke-assessment.js';
import { ecgBasicsSkillBank } from './banks/ecg-basics.js';

/** @type {Record<string, { title: string, questions: object[] }>} */
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
  'stroke-assessment': strokeAssessmentSkillBank,
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
      },
      {
        id: 'bundle',
        prompt: 'Sepsis criteria met — which hour-1 actions belong together?',
        correct: 'Lactate, blood cultures, IV fluids, and empiric antibiotics',
        choices: [
          'Lactate, blood cultures, IV fluids, and empiric antibiotics',
          'Wait for next morning labs only',
          'Oral acetaminophen and ambulate',
          'Discharge home with follow-up in a week'
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
  'ecg-basics': ecgBasicsSkillBank,
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
  },
  cbi: {
    title: 'CBI / Continuous bladder irrigation',
    questions: [
      {
        id: 'outflow',
        prompt: 'CBI outflow suddenly slows and the patient has bladder spasms. Priority?',
        correct: 'Check for clots/kinks; hand-irrigate per protocol; notify provider if obstructed',
        choices: [
          'Check for clots/kinks; hand-irrigate per protocol; notify provider if obstructed',
          'Clamp inflow and ignore output',
          'Increase inflow rate without assessing outflow',
          'Remove the catheter immediately without an order'
        ]
      },
      {
        id: 'balance',
        prompt: 'How do you calculate true urine output on CBI?',
        correct: 'Total output minus irrigation fluid infused',
        choices: [
          'Total output minus irrigation fluid infused',
          'Irrigation bag volume alone',
          'Only the color of the drainage',
          'Ignore I&O while on CBI'
        ]
      }
    ]
  },
  ecmo: {
    title: 'ECMO',
    questions: [
      {
        id: 'circuit',
        prompt: 'Priority nursing focus for a patient on ECMO?',
        correct: 'Circuit integrity, cannulation site bleeding, perfusion/oxygenation, emergency readiness',
        choices: [
          'Circuit integrity, cannulation site bleeding, perfusion/oxygenation, emergency readiness',
          'Ambulate freely without circuit precautions',
          'Stop anticoagulation without notifying the team',
          'Ignore alarms if SpO2 looks okay once'
        ]
      }
    ]
  },
  iabp: {
    title: 'IABP',
    questions: [
      {
        id: 'timing',
        prompt: 'Correct IABP inflation timing relative to the cardiac cycle?',
        correct: 'Inflate in diastole; deflate just before systole',
        choices: [
          'Inflate in diastole; deflate just before systole',
          'Inflate throughout systole only',
          'Keep balloon inflated continuously',
          'Deflate only during diastole'
        ]
      },
      {
        id: 'limb',
        prompt: 'Priority distal assessment with femoral IABP?',
        correct: 'Check limb pulses, color, temperature, and sensation frequently',
        choices: [
          'Check limb pulses, color, temperature, and sensation frequently',
          'Ignore the access leg if the waveform looks good',
          'Elevate HOB to 90° routinely',
          'Ambulate in the hall with the balloon on'
        ]
      }
    ]
  },
  crrt: {
    title: 'CRRT',
    questions: [
      {
        id: 'alarm',
        prompt: 'CRRT filter pressure rising / clotting concern — nurse action?',
        correct: 'Assess access, flush/replace per protocol, notify provider/team; do not ignore alarms',
        choices: [
          'Assess access, flush/replace per protocol, notify provider/team; do not ignore alarms',
          'Silence alarms and leave the room',
          'Bolus free water into the circuit randomly',
          'Disconnect and discard the catheter without an order'
        ]
      }
    ]
  },
  cgs: {
    title: 'Cardiogenic shock (CGS)',
    questions: [
      {
        id: 'signs',
        prompt: 'Which pattern best fits cardiogenic shock?',
        correct: 'Low cardiac output, cool clammy skin, elevated filling pressures, pulmonary congestion',
        choices: [
          'Low cardiac output, cool clammy skin, elevated filling pressures, pulmonary congestion',
          'Warm flushed skin with bounding pulses only',
          'Isolated fever without hemodynamic change',
          'Hypertension with excellent urine output'
        ]
      }
    ]
  },
  'tof-assessment': {
    title: 'Paralytic assessment (TOF)',
    questions: [
      {
        id: 'tof',
        prompt: 'Train-of-four (TOF) assesses what?',
        correct: 'Depth of neuromuscular blockade (twitch count/ratio)',
        choices: [
          'Depth of neuromuscular blockade (twitch count/ratio)',
          'Only blood glucose',
          'Only pupillary light reflex',
          'Only skin temperature'
        ]
      },
      {
        id: 'site',
        prompt: 'Common peripheral nerve sites for TOF?',
        correct: 'Ulnar (adductor pollicis) or facial (orbicularis oculi)',
        choices: [
          'Ulnar (adductor pollicis) or facial (orbicularis oculi)',
          'Only the Achilles tendon',
          'Only the carotid pulse',
          'Abdominal wall only'
        ]
      }
    ]
  },
  'pacemaker-trans': {
    title: 'Pacemaker assessment (trans)',
    questions: [
      {
        id: 'capture',
        prompt: 'Failure to capture on a temporary pacemaker means?',
        correct: 'Pacing spikes without resulting QRS; check connections, output, and patient status',
        choices: [
          'Pacing spikes without resulting QRS; check connections, output, and patient status',
          'Normal sensing with no further action needed',
          'Always increase sensitivity only',
          'Immediately remove the wire at the bedside'
        ]
      }
    ]
  },
  'foley-insertion': {
    title: 'Foley catheter insertion',
    questions: [
      {
        id: 'sterile',
        prompt: 'Key sterile step during Foley insertion?',
        correct: 'Maintain sterile field; advance until urine returns; inflate balloon only when in bladder',
        choices: [
          'Maintain sterile field; advance until urine returns; inflate balloon only when in bladder',
          'Inflate the balloon in the urethra if resistance is felt',
          'Skip cleansing if the patient is NPO',
          'Use the same gloves after contaminating them on the sheets'
        ]
      }
    ]
  },
  'ngt-insertion': {
    title: 'NGT insertion',
    questions: [
      {
        id: 'confirm',
        prompt: 'Best confirmation of NG tube placement before first use?',
        correct: 'Radiographic confirmation (or facility-approved method) before feeding/meds',
        choices: [
          'Radiographic confirmation (or facility-approved method) before feeding/meds',
          'Only ask the patient if it feels okay',
          'Auscultate air once and always start feeds',
          'Skip confirmation if the tube was easy to insert'
        ]
      }
    ]
  },
  'picc-dressing': {
    title: 'PICC dressing change',
    questions: [
      {
        id: 'sterile',
        prompt: 'PICC dressing change priority?',
        correct: 'Aseptic/sterile technique; assess site; securement; document external length',
        choices: [
          'Aseptic/sterile technique; assess site; securement; document external length',
          'Change only when dripping blood and skip site assessment',
          'Soak the site in tap water daily',
          'Pull the catheter back 2 cm each dressing change'
        ]
      }
    ]
  },
  'iv-insertion': {
    title: 'IV insertion',
    questions: [
      {
        id: 'site',
        prompt: 'Preferred approach for peripheral IV insertion?',
        correct: 'Distal site first when appropriate; aseptic prep; stabilize and confirm flash/patency',
        choices: [
          'Distal site first when appropriate; aseptic prep; stabilize and confirm flash/patency',
          'Always start in the foot of an adult without indication',
          'Reuse the same needle after a failed stick',
          'Skip tourniquet and skin prep to save time'
        ]
      }
    ]
  },
  'ct-contrast-iv': {
    title: 'CT with contrast (18g IV)',
    questions: [
      {
        id: 'gauge',
        prompt: 'Why does CT with power-injected contrast often need a large-bore IV (e.g. 18g)?',
        correct: 'To tolerate high flow rates and reduce extravasation risk from inadequate access',
        choices: [
          'To tolerate high flow rates and reduce extravasation risk from inadequate access',
          'Because contrast only works through pink catheters',
          'So the patient can ambulate sooner',
          '18g is required for every blood draw'
        ]
      },
      {
        id: 'site',
        prompt: 'Before sending for contrast CT, you should?',
        correct: 'Verify patent adequate IV, allergies/eGFR per protocol, and line location suitability',
        choices: [
          'Verify patent adequate IV, allergies/eGFR per protocol, and line location suitability',
          'Send with any infiltrated IV',
          'Ignore allergy history if the scanner is ready',
          'Always use a 24g hand IV for power inject'
        ]
      }
    ]
  },
  'wound-change': {
    title: 'Wound dressing change',
    questions: [
      {
        id: 'moisture',
        prompt: 'Wet-to-dry dressings are most appropriate when?',
        correct: 'For mechanical debridement of necrotic tissue when ordered — not for every moist healing wound',
        choices: [
          'For mechanical debridement of necrotic tissue when ordered — not for every moist healing wound',
          'For every epithelializing wound to keep it dry',
          'For moisture-associated skin damage (MASD) as first-line',
          'Instead of assessing wound bed moisture'
        ]
      },
      {
        id: 'honey',
        prompt: 'Medical-grade honey (e.g. TheraHoney) is typically used to?',
        correct: 'Support moist wound healing / antimicrobial environment on appropriate partial-thickness wounds per order',
        choices: [
          'Support moist wound healing / antimicrobial environment on appropriate partial-thickness wounds per order',
          'Dry out intact skin for MASD',
          'Replace all surgical dry sterile dressings always',
          'Be packed into every tunneling wound without assessment'
        ]
      },
      {
        id: 'masd',
        prompt: 'Moisture-associated skin damage (MASD) care priority?',
        correct: 'Gentle cleanse, protect skin, manage moisture source; avoid harsh wet-to-dry on intact damaged skin',
        choices: [
          'Gentle cleanse, protect skin, manage moisture source; avoid harsh wet-to-dry on intact damaged skin',
          'Aggressive wet-to-dry on intact perineal skin',
          'Ignore incontinence and only chart later',
          'Apply honey to dry intact skin as a lotion'
        ]
      }
    ]
  },
  nihss: {
    title: 'NIHSS assessment',
    questions: [
      {
        id: 'purpose',
        prompt: 'NIHSS is primarily used to?',
        correct: 'Quantify stroke deficit severity and trends for treatment decisions',
        choices: [
          'Quantify stroke deficit severity and trends for treatment decisions',
          'Replace all vital signs',
          'Diagnose MI only',
          'Measure only blood glucose'
        ]
      }
    ]
  },
  'peritoneal-dialysis': {
    title: 'Peritoneal dialysis',
    questions: [
      {
        id: 'cloudy',
        prompt: 'Cloudy PD effluent may indicate?',
        correct: 'Possible peritonitis — culture/notify per protocol',
        choices: [
          'Possible peritonitis — culture/notify per protocol',
          'Normal finding every exchange',
          'That the patient should eat more fiber only',
          'That you should increase fill volume randomly'
        ]
      }
    ]
  },
  'new-dialysis-start': {
    title: 'New dialysis start',
    questions: [
      {
        id: 'coord',
        prompt: 'Before a new hemodialysis start, coordination often includes?',
        correct: 'Hepatitis panel/serologies, access readiness, timing with dialysis team, consents/orders',
        choices: [
          'Hepatitis panel/serologies, access readiness, timing with dialysis team, consents/orders',
          'Only a random glucose and no call to dialysis',
          'Skipping labs if the patient is hungry',
          'Starting without verifying access'
        ]
      }
    ]
  },
  'surgery-preop': {
    title: 'Surgery preop checklist',
    questions: [
      {
        id: 'checklist',
        prompt: 'Typical preop nursing checklist items include?',
        correct: 'NPO status, consents, site marking, allergies, holding blood thinners per order',
        choices: [
          'NPO status, consents, site marking, allergies, holding blood thinners per order',
          'Giving all home anticoagulants the morning of surgery without asking',
          'Skipping ID band if the patient knows their name',
          'Ignoring last food/drink time'
        ]
      }
    ]
  },
  /** SQ / therapeutic heparin safety (med perform). Default 1 Q; extra Qs = boosters. */
  heparin: {
    title: 'Heparin safety',
    questions: [
      {
        id: 'antidote',
        prompt: 'What is the antidote for heparin?',
        correct: 'Protamine sulfate',
        choices: [
          'Protamine sulfate',
          'Vitamin K',
          'Flumazenil',
          'Naloxone'
        ]
      },
      {
        id: 'lab-before',
        prompt: 'Which lab value is most important to review before giving therapeutic heparin?',
        correct: 'aPTT / PTT (and platelets for HIT risk)',
        choices: [
          'aPTT / PTT (and platelets for HIT risk)',
          'HbA1c only',
          'Serum amylase only',
          'Urine specific gravity only'
        ]
      },
      {
        id: 'hit',
        prompt: 'A falling platelet count on heparin raises concern for?',
        correct: 'Heparin-induced thrombocytopenia (HIT)',
        choices: [
          'Heparin-induced thrombocytopenia (HIT)',
          'Iron-deficiency anemia from diet',
          'Expected benign hemodilution only',
          'Vitamin K deficiency'
        ]
      },
      {
        id: 'bleed',
        prompt: 'Priority assessment while a patient is on heparin?',
        correct: 'Signs of bleeding (gums, urine/stool, neuro change, hematoma)',
        choices: [
          'Signs of bleeding (gums, urine/stool, neuro change, hematoma)',
          'Only daily weight for fluid status',
          'Pupil checks for opioid toxicity',
          'Peak/trough vancomycin levels only'
        ]
      }
    ]
  },
  'heparin-drip': {
    title: 'Heparin drip',
    questions: [
      {
        id: 'ptt',
        prompt: 'Heparin drip protocols commonly require aPTT/PTT checks how often after changes?',
        correct: 'At protocol intervals (often q6h) and after dose changes',
        choices: [
          'At protocol intervals (often q6h) and after dose changes',
          'Only once at discharge',
          'Never — titrate by blood pressure alone',
          'Only if the patient requests it'
        ]
      },
      {
        id: 'antidote',
        prompt: 'What is the antidote for heparin?',
        correct: 'Protamine sulfate',
        choices: [
          'Protamine sulfate',
          'Vitamin K',
          'Idarucizumab',
          'Andexanet alfa'
        ]
      },
      {
        id: 'hold-high',
        prompt: 'If aPTT/PTT is critically high on a heparin drip, the usual first nursing action is?',
        correct: 'Hold/adjust per protocol and notify the provider',
        choices: [
          'Hold/adjust per protocol and notify the provider',
          'Double the infusion rate to catch up',
          'Give IM vitamin K without an order',
          'Ignore the result until the next shift'
        ]
      }
    ]
  },
  'bladder-scan': {
    title: 'Bladder scan',
    questions: [
      {
        id: 'pvr',
        prompt: 'Bladder scan after void measures?',
        correct: 'Post-void residual (PVR) volume',
        choices: [
          'Post-void residual (PVR) volume',
          'Serum creatinine only',
          'Only blood pressure',
          'CSF pressure'
        ]
      },
      {
        id: 'timing',
        prompt: 'Ordered “bladder scan q6h” means?',
        correct: 'Perform bladder volume assessment every 6 hours (and PRN per protocol)',
        choices: [
          'Perform bladder volume assessment every 6 hours (and PRN per protocol)',
          'Scan once then discontinue forever',
          'Only scan if the patient asks',
          'Replace the Foley every 6 hours'
        ]
      }
    ]
  },
  'insulin-drip': {
    title: 'Insulin drip (ICU)',
    questions: [
      {
        id: 'monitor',
        prompt: 'ICU insulin infusion priority monitoring?',
        correct: 'Frequent glucose checks per protocol; titrate rate; watch for hypoglycemia',
        choices: [
          'Frequent glucose checks per protocol; titrate rate; watch for hypoglycemia',
          'Check glucose once daily only',
          'Stop all dextrose sources always',
          'Bolus SQ insulin without assessing the drip'
        ]
      }
    ]
  },
  'amiodarone-drip': {
    title: 'Amiodarone drip',
    questions: [
      {
        id: 'phases',
        prompt: 'Common IV amiodarone dosing phases after a load include?',
        correct: 'Higher infusion for first ~6 hours, then lower rate for next ~18 hours (per order/protocol)',
        choices: [
          'Higher infusion for first ~6 hours, then lower rate for next ~18 hours (per order/protocol)',
          'Same rate forever with no load',
          'Only oral tablets crushed into the IV',
          'Stop after one minute regardless of rhythm'
        ]
      }
    ]
  },
  'protonix-drip': {
    title: 'Protonix drip (pantoprazole)',
    questions: [
      {
        id: 'indication',
        prompt: 'Continuous IV pantoprazole (Protonix) is most often started for which GI bleed goal?',
        correct: 'Acid suppression to stabilize clot after upper GI bleed (often after an IV bolus)',
        choices: [
          'Acid suppression to stabilize clot after upper GI bleed (often after an IV bolus)',
          'Immediate sclerotherapy of esophageal varices at the bedside',
          'Replacement of oral stool softeners',
          'Treatment of lower GI bleed with diverticulosis only'
        ]
      },
      {
        id: 'rate',
        prompt: 'A common pantoprazole continuous infusion rate after the IV bolus (per many UGIB protocols) is?',
        correct: '8 mg/hr continuous IV',
        choices: [
          '8 mg/hr continuous IV',
          '80 mg/hr continuous IV',
          '8 mg PO once daily only',
          '0.8 mg/min subcutaneous'
        ]
      },
      {
        id: 'bolus',
        prompt: 'Before starting the continuous Protonix drip for UGIB, many orders include?',
        correct: 'An 80 mg IV pantoprazole bolus, then start the continuous infusion',
        choices: [
          'An 80 mg IV pantoprazole bolus, then start the continuous infusion',
          'Crushing enteric-coated tablets into the IV bag',
          'Holding all IV access until endoscopy is finished tomorrow',
          'Giving IM Protonix into the deltoid'
        ]
      },
      {
        id: 'monitor',
        prompt: 'While a Protonix drip is running for GI bleed, nursing priorities include?',
        correct: 'Confirm correct rate/line, watch for ongoing bleed / volume loss, and keep serial H&H / vitals trending',
        choices: [
          'Confirm correct rate/line, watch for ongoing bleed / volume loss, and keep serial H&H / vitals trending',
          'Stop the drip whenever the patient eats crackers',
          'Titrate the rate to MAP like a vasopressor',
          'Ignore hematemesis because the PPI is running'
        ]
      }
    ]
  },
  'sandostatin-drip': {
    title: 'Sandostatin drip (octreotide)',
    questions: [
      {
        id: 'indication',
        prompt: 'Continuous octreotide (Sandostatin) is primarily indicated in GI bleed for?',
        correct: 'Suspected or confirmed variceal bleeding (reduce splanchnic flow / portal pressure)',
        choices: [
          'Suspected or confirmed variceal bleeding (reduce splanchnic flow / portal pressure)',
          'Uncomplicated hemorrhoids without bleeding',
          'Routine stress-ulcer prophylaxis in every floor admit',
          'Replacing type and screen before transfusion'
        ]
      },
      {
        id: 'rate',
        prompt: 'A common octreotide continuous infusion after the IV bolus for variceal bleed is?',
        correct: '50 mcg/hr continuous IV',
        choices: [
          '50 mcg/hr continuous IV',
          '50 mg/hr continuous IV',
          '5 units/hr like heparin',
          '50 mcg PO three times daily only'
        ]
      },
      {
        id: 'bolus',
        prompt: 'Typical first step when starting Sandostatin for variceal bleed?',
        correct: 'Give an IV bolus (often 50 mcg), then start the continuous infusion',
        choices: [
          'Give an IV bolus (often 50 mcg), then start the continuous infusion',
          'Start oral Sandostatin LAR depot in the GI lab',
          'Inject into the varices at the bedside without an order',
          'Hold until hemoglobin is above 12 without assessing bleed'
        ]
      },
      {
        id: 'monitor',
        prompt: 'Extra monitoring tip while octreotide is infusing?',
        correct: 'Watch glucose (can affect insulin/glucagon pathways) plus bleed signs and drip rate/line integrity',
        choices: [
          'Watch glucose (can affect insulin/glucagon pathways) plus bleed signs and drip rate/line integrity',
          'Expect therapeutic aPTT titration like heparin',
          'Discontinue if the patient has any bowel sounds',
          'Only check the bag once at end of shift'
        ]
      }
    ]
  },
  'lasix-drip': {
    title: 'Lasix drip (furosemide)',
    questions: [
      {
        id: 'indication',
        prompt: 'A continuous IV furosemide (Lasix) drip is most often used for?',
        correct: 'Acute decompensated HF / volume overload when intermittent IV doses are not enough',
        choices: [
          'Acute decompensated HF / volume overload when intermittent IV doses are not enough',
          'Routine outpatient blood-pressure control without congestion',
          'Replacing oral stool softeners',
          'Treating hypokalemia as the primary therapy'
        ]
      },
      {
        id: 'adjust',
        prompt: 'Best approach when adjusting a Lasix drip rate?',
        correct: 'Titrate per order/protocol using urine output, BP, and clinical volume response — then recheck electrolytes/renal function',
        choices: [
          'Titrate per order/protocol using urine output, BP, and clinical volume response — then recheck electrolytes/renal function',
          'Double the rate every 5 minutes like a pressor without assessing UOP',
          'Stop diuresis permanently if the patient voids once',
          'Change the rate based only on the clock, ignoring vitals and labs'
        ]
      },
      {
        id: 'hold-up',
        prompt: 'Which finding should make you pause and call before increasing a Lasix drip?',
        correct: 'Significant hypotension, marked creatinine rise, or severe electrolyte derangement',
        choices: [
          'Significant hypotension, marked creatinine rise, or severe electrolyte derangement',
          'Mild orthopnea that is improving with diuresis',
          'A single PVC on telemetry with stable BP',
          'Patient requesting ice chips'
        ]
      },
      {
        id: 'labs',
        prompt: 'Priority labs to trend while a patient is on a continuous Lasix drip?',
        correct: 'Potassium, magnesium, and creatinine/BMP (plus weight / I&O; BNP as ordered)',
        choices: [
          'Potassium, magnesium, and creatinine/BMP (plus weight / I&O; BNP as ordered)',
          'Only amylase and lipase every hour',
          'Only type and screen',
          'No labs needed if the drip rate looks correct on the pump'
        ]
      },
      {
        id: 'hypokalemia',
        prompt: 'Why does low potassium matter during aggressive loop diuretic therapy?',
        correct: 'Hypokalemia increases arrhythmia risk and may need repletion before or while continuing diuresis',
        choices: [
          'Hypokalemia increases arrhythmia risk and may need repletion before or while continuing diuresis',
          'Low K always means the drip should be increased immediately',
          'Potassium is irrelevant on telemetry units',
          'Loop diuretics raise potassium, so hypokalemia rules out Lasix effect'
        ]
      },
      {
        id: 'monitor',
        prompt: 'Nursing priorities while a Lasix drip is running include?',
        correct: 'Confirm rate/line, strict I&O and daily weights, watch BP/volume status, and trend K/Mag/Cr',
        choices: [
          'Confirm rate/line, strict I&O and daily weights, watch BP/volume status, and trend K/Mag/Cr',
          'Ignore urine output if the pump is green',
          'Titrate only to SpO2 without assessing congestion or BP',
          'Hold all electrolyte checks until discharge'
        ]
      }
    ]
  },
  evd: {
    title: 'EVD management',
    questions: [
      {
        id: 'zero',
        prompt: 'To obtain a true ICP from an EVD/monitor setup you must?',
        correct: 'Level/zero the transducer at the ordered landmark (e.g. tragus/external auditory canal)',
        choices: [
          'Level/zero the transducer at the ordered landmark (e.g. tragus/external auditory canal)',
          'Zero at the patient’s ankle',
          'Never zero — estimate from SpO2',
          'Open the drain to air continuously without leveling'
        ]
      },
      {
        id: 'cpp',
        prompt: 'CPP is calculated as?',
        correct: 'MAP − ICP',
        choices: [
          'MAP − ICP',
          'ICP − MAP',
          'HR × SV only',
          'SpO2 − EtCO2'
        ]
      }
    ]
  },
  'cardiac-index': {
    title: 'Cardiac index (thermodilution)',
    questions: [
      {
        id: 'inject',
        prompt: 'Thermodilution cardiac output technique key point?',
        correct: 'Inject the correct iced/room-temp saline volume rapidly/smoothly (“slam”) per protocol, then calculate CI = CO/BSA',
        choices: [
          'Inject the correct iced/room-temp saline volume rapidly/smoothly (“slam”) per protocol, then calculate CI = CO/BSA',
          'Drip saline slowly over 10 minutes into the PA catheter',
          'Use any random fluid volume without a computer constant',
          'Cardiac index equals only the heart rate'
        ]
      }
    ]
  },
  'ileostomy-emptying': {
    title: 'Ileostomy emptying',
    questions: [
      {
        id: 'setup',
        prompt: 'Best setup to empty an ileostomy pouch?',
        correct: 'Towel/barrier, basin or toilet, gloves; empty when 1/3–1/2 full; clean spout',
        choices: [
          'Towel/barrier, basin or toilet, gloves; empty when 1/3–1/2 full; clean spout',
          'Wait until the bag bursts',
          'Cut the wafer every time you empty',
          'Irrigate forcefully into the stoma with a bulb syringe each empty'
        ]
      }
    ]
  },
  'ileostomy-bag-change': {
    title: 'Ileostomy bag replacement',
    questions: [
      {
        id: 'cut',
        prompt: 'When cutting an ileostomy wafer, the opening should be?',
        correct: 'About 1/8 inch (≈2–3 mm) larger than the stoma diameter — not cutting into the stoma',
        choices: [
          'About 1/8 inch (≈2–3 mm) larger than the stoma diameter — not cutting into the stoma',
          'Twice the stoma size with large exposed skin',
          'Smaller than the stoma so it squeezes tightly',
          'Any random shape without measuring'
        ]
      }
    ]
  },
  'skeletal-traction': {
    title: 'Skeletal traction (weights / pins)',
    questions: [
      {
        id: 'weights',
        prompt: 'Skeletal traction with hanging weights — correct setup?',
        correct: 'Weights hang freely off the floor/bed; ropes in pulley grooves; ordered amount maintained',
        choices: [
          'Weights hang freely off the floor/bed; ropes in pulley grooves; ordered amount maintained',
          'Rest the weights on the floor to “stabilize” the pull',
          'Remove weights whenever the patient turns without an order',
          'Tie weights to the siderail so they do not swing'
        ]
      },
      {
        id: 'alignment',
        prompt: 'Priority nursing check for a patient in skeletal traction?',
        correct: 'Maintain body alignment and continuous ordered traction; CMS of the extremity',
        choices: [
          'Maintain body alignment and continuous ordered traction; CMS of the extremity',
          'Elevate the weights onto the mattress each shift',
          'Allow the patient to sit fully upright with slack ropes',
          'Ignore pin sites because traction replaces skin care'
        ]
      }
    ]
  },
  'pin-care': {
    title: 'Pin care',
    questions: [
      {
        id: 'clean',
        prompt: 'Pin-site care priority?',
        correct: 'Clean each pin site per protocol; assess for redness, drainage, loosening; keep sites dry',
        choices: [
          'Clean each pin site per protocol; assess for redness, drainage, loosening; keep sites dry',
          'Soak the entire limb in tap water daily',
          'Ignore crusting and never clean around pins',
          'Apply thick occlusive cream that buries the pin hubs'
        ]
      },
      {
        id: 'infection',
        prompt: 'Sign that needs prompt reporting at a pin site?',
        correct: 'Increasing redness, purulent drainage, pin looseness, or fever',
        choices: [
          'Increasing redness, purulent drainage, pin looseness, or fever',
          'Mild dried serous crust only on day one with no other change',
          'Intact skin far from the pins',
          'Patient asking for a snack'
        ]
      }
    ]
  },
  'ekg-12-lead': {
    title: '12-lead EKG placement',
    questions: [
      {
        id: 'v1',
        prompt: 'Correct placement for V1?',
        correct: '4th intercostal space, right sternal border',
        choices: [
          '4th intercostal space, right sternal border',
          '5th intercostal space, midclavicular line',
          '2nd intercostal space, left midaxillary line',
          'Over the umbilicus'
        ]
      },
      {
        id: 'v4',
        prompt: 'Correct placement for V4?',
        correct: '5th intercostal space, midclavicular line',
        choices: [
          '5th intercostal space, midclavicular line',
          '4th intercostal space, right sternal border',
          'Directly on the clavicle',
          'Lower abdomen midline'
        ]
      },
      {
        id: 'limbs',
        prompt: 'Limb lead placement tip for a clean 12-lead?',
        correct: 'Place limb electrodes on limbs (or torso per protocol) with good skin contact; avoid bony prominences when possible',
        choices: [
          'Place limb electrodes on limbs (or torso per protocol) with good skin contact; avoid bony prominences when possible',
          'Stack all limb leads on one ankle',
          'Skip limb leads if precordial leads look fine',
          'Put limb leads only on the forehead'
        ]
      }
    ]
  },
  abg: abgSkillBank,
  'arterial-line': arterialLineSkillBank,
  'heart-sounds': heartSoundsSkillBank,
  'lung-sounds': lungSoundsSkillBank,
  'capillary-refill': capillaryRefillSkillBank,
  swelling: swellingSkillBank,
  'levophed-drip': levophedDripSkillBank,
  'vasopressin-drip': vasopressinDripSkillBank,
  'neosynephrine-drip': neosynephrineDripSkillBank,
  'dopamine-drip': dopamineDripSkillBank,
  'dobutamine-drip': dobutamineDripSkillBank,
  'propofol-drip': propofolDripSkillBank,
  'precedex-drip': precedexDripSkillBank,
  'fentanyl-drip': fentanylDripSkillBank,
  'morphine-drip': morphineDripSkillBank,
  vasopressors: vasopressorsSkillBank,
  'icu-sedation': icuSedationSkillBank,
  aaa: aaaSkillBank,
  'pulmonary-embolism': pulmonaryEmbolismSkillBank,
  'peripheral-clot': peripheralClotSkillBank,
  'acls-bradycardia': aclsBradycardiaSkillBank,
  'acls-tachycardia': aclsTachycardiaSkillBank,
  'respiratory-failure-airway': respiratoryFailureAirwaySkillBank,
  'respiratory-failure-airway-icu': respiratoryFailureAirwayIcuSkillBank
};

export const skillMcqChallengeConfig = {
  banks: skillMcqBanks
};

export default skillMcqChallengeConfig;
