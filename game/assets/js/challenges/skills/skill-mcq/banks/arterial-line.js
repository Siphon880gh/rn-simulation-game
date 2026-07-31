/**
 * Arterial line (A-line) skill-mcq bank — zeroing, waveform, sampling, safety.
 */
export const arterialLineSkillBank = {
  title: 'Arterial line / A-line',
  questions: [
    {
      id: 'zero-phlebostatic',
      type: 'choice',
      category: 'Zeroing',
      instruction: 'Choose the correct answer',
      prompt: 'Where do you level the arterial-line transducer before zeroing?',
      choices: [
        'Phlebostatic axis — 4th intercostal space, mid-axillary line (approx. right atrium)',
        'At the patient’s ankle',
        'At the IV pole top regardless of patient position',
        'Over the umbilicus only'
      ],
      correctIndex: 0
    },
    {
      id: 'zero-steps',
      type: 'choice',
      category: 'Zeroing',
      instruction: 'Choose the correct answer',
      prompt: 'Correct sequence to zero an arterial line transducer?',
      choices: [
        'Level to phlebostatic axis → turn stopcock off to patient / open to air → press Zero on monitor → close to air / open to patient → confirm waveform returns',
        'Open to patient and press Zero while flushing vigorously',
        'Zero with the stopcock closed to air and transducer on the floor',
        'Never zero — trust the last shift’s numbers'
      ],
      correctIndex: 0
    },
    {
      id: 'when-to-zero',
      type: 'sata',
      category: 'Zeroing',
      instruction: 'Select all that apply',
      prompt: 'When should you re-zero / re-level an arterial line?',
      choices: [
        'At the start of the shift / after setup',
        'After patient position changes that move the transducer relative to the heart',
        'When readings seem inaccurate or after transducer/tubing changes',
        'Only once ever, then never again',
        'Every time you give oral meds only'
      ],
      correctIndexes: [0, 1, 2]
    },
    {
      id: 'zero-why',
      type: 'choice',
      category: 'Zeroing',
      prompt: 'Why zero the arterial transducer to atmospheric pressure?',
      choices: [
        'So the monitor references atmospheric pressure as 0 mmHg and arterial pressures are accurate',
        'To inflate the pressure bag automatically',
        'To clear air from the lungs',
        'To calibrate SpO₂'
      ],
      correctIndex: 0
    },
    {
      id: 'transducer-too-low',
      type: 'choice',
      category: 'Zeroing',
      prompt: 'If the transducer sits lower than the phlebostatic axis, arterial pressures will typically?',
      choices: [
        'Read falsely high',
        'Read falsely low',
        'Be unchanged always',
        'Turn into venous waveforms only'
      ],
      correctIndex: 0
    },
    {
      id: 'transducer-too-high',
      type: 'choice',
      category: 'Zeroing',
      prompt: 'If the transducer sits higher than the phlebostatic axis, arterial pressures will typically?',
      choices: [
        'Read falsely low',
        'Read falsely high',
        'Always match NIBP exactly',
        'Cause the line to clot instantly'
      ],
      correctIndex: 0
    },
    {
      id: 'pressure-bag',
      type: 'choice',
      category: 'Setup',
      prompt: 'Pressure bag / flush system for an arterial line is usually kept at about?',
      choices: [
        '300 mmHg (keep fluid dripping / system pressurized per protocol)',
        '20 mmHg',
        'Atmospheric pressure only with bag empty',
        '600 mmHg continuously without checking'
      ],
      correctIndex: 0
    },
    {
      id: 'waveform',
      type: 'choice',
      category: 'Waveform',
      prompt: 'A normal arterial waveform should show?',
      choices: [
        'Sharp upstroke, dicrotic notch, and clear systolic/diastolic components',
        'A flat line at 0 always',
        'Only a square wave with no pulsatility at rest',
        'Identical appearance to an ICP waveform'
      ],
      correctIndex: 0
    },
    {
      id: 'dampened',
      type: 'sata',
      category: 'Waveform',
      instruction: 'Select all that apply',
      prompt: 'An overdamped (flattened) arterial waveform may be caused by:',
      choices: [
        'Air bubbles in the tubing',
        'Loose connections / leak',
        'Partial occlusion or kink',
        'Soft, compliant tubing or clot',
        'Transducer correctly leveled and zeroed with a patent system (always)'
      ],
      correctIndexes: [0, 1, 2, 3]
    },
    {
      id: 'square-wave',
      type: 'choice',
      category: 'Waveform',
      prompt: 'A fast-flush (square-wave) test helps you assess?',
      choices: [
        'Dynamic response of the monitoring system (under-/overdamping)',
        'Whether the patient needs antibiotics',
        'Exact cardiac output without any other data',
        'Blood type'
      ],
      correctIndex: 0
    },
    {
      id: 'sampling',
      type: 'choice',
      category: 'Sampling',
      prompt: 'Before drawing an ABG from an arterial line you should?',
      choices: [
        'Waste/clear the line per protocol so the sample is pure arterial blood, then draw, then flush',
        'Draw from the pressure bag bag-spike',
        'Never flush after sampling',
        'Sample while the stopcock is open to air during zero'
      ],
      correctIndex: 0
    },
    {
      id: 'safety',
      type: 'sata',
      category: 'Safety',
      instruction: 'Select all that apply',
      prompt: 'Arterial line safety priorities include:',
      choices: [
        'Keep connections tight; prevent disconnection/exsanguination',
        'Label as arterial; do not inject meds into the A-line (unless protocol exception)',
        'Monitor site for perfusion (color, temp, capillary refill distal to site)',
        'Alarm limits set appropriately; respond to flatline / disconnect alarms',
        'Hide the site under blankets and ignore alarms'
      ],
      correctIndexes: [0, 1, 2, 3]
    },
    {
      id: 'zero-match',
      type: 'match',
      category: 'Zeroing',
      instruction: 'Mix and match',
      prompt: 'Match A-line zeroing concepts',
      pairs: [
        {
          term: 'Phlebostatic axis',
          definition: 'Leveling landmark ≈ 4th ICS mid-axillary (right atrium)'
        },
        {
          term: 'Open to air',
          definition: 'Stopcock position that exposes transducer to atmosphere for zero'
        },
        {
          term: 'Zero on monitor',
          definition: 'Sets atmospheric pressure as the 0 mmHg reference'
        },
        {
          term: 'Return to patient',
          definition: 'Close to air / open to patient so arterial waveform resumes'
        }
      ]
    },
    {
      id: 'sites',
      type: 'choice',
      category: 'Sites',
      prompt: 'Common adult arterial line insertion site with good collaterals?',
      choices: [
        'Radial artery (Allen/modified Allen or Doppler assessment per protocol)',
        'External jugular vein',
        'Peripheral IV in the hand only',
        'Urinary catheter port'
      ],
      correctIndex: 0
    }
  ]
};

export default arterialLineSkillBank;
