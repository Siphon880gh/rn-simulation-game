/**
 * ABG / arterial blood gas question bank for skill-mcq.
 * Types: choice | sata | match | flash
 * correctIndex / correctIndexes are 0-based (sheet used 1-based).
 */
export const abgSkillBank = {
  title: 'ABG / Arterial blood gases',
  questions: [
    {
      id: 'hco3-normal',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blank',
      prompt: 'HCO₃ normal values is __ mEq/L to __ mEq/L',
      choices: ['22-26', '25-35', '35-45', '23-29', '30-45'],
      correctIndex: 0
    },
    {
      id: 'pco2-normal',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blank',
      prompt: 'pCO₂ normal values is __ mmHg to __ mmHg',
      choices: ['35-45', '22-26', '7.35-7.45', '30-40', '25-35'],
      correctIndex: 0
    },
    {
      id: 'ph-normal',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blank',
      prompt: 'pH normal range is __',
      choices: ['22-26', '7.25-7.35', '35-45', '7.35-7.45', '25-35', '7.22-7.26'],
      correctIndex: 3
    },
    {
      id: 'subscripts',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Choose the correct subscripts',
      prompt: 'Correct ABG subscripts / notations?',
      choices: ['PCO₂, PO₂, HCO₃', 'PCO₂, PO₂, HCO₂', 'PCO₂, PO₂, HCO'],
      correctIndex: 0
    },
    {
      id: 'value-concepts',
      type: 'match',
      category: 'ABG Concepts',
      instruction: 'Mix and match',
      prompt: 'Match each ABG value with what it represents',
      pairs: [
        { term: 'pH', definition: 'How acidic or basic the arterial blood is' },
        { term: 'pCO₂', definition: "Carbon dioxide regulated by the lungs' respiratory rate" },
        { term: 'HCO₃', definition: 'Bicarbonate produced by the kidney' },
        { term: 'pO₂', definition: 'Amount of oxygen dissolved in the blood' },
        { term: 'SaO₂', definition: 'Percent of oxygen bound to hemoglobin in arterial blood' }
      ]
    },
    {
      id: 'value-normals',
      type: 'match',
      category: 'ABG Concepts: Normal / Reference Values',
      instruction: 'Mix and match',
      prompt: 'Match each ABG value with its normal range',
      pairs: [
        { term: 'pH', definition: '7.35–7.45' },
        { term: 'pCO₂', definition: '35–45 mmHg' },
        { term: 'HCO₃', definition: '22–26 mEq/L' },
        { term: 'pO₂', definition: '80–100 mmHg' },
        { term: 'SaO₂', definition: '95–100%' }
      ]
    },
    {
      id: 'ph-in-range-state',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Choose the correct answer',
      prompt: 'pH is within range. What are possible answers?',
      choices: [
        'Fully compensated',
        'Fully compensated or partially compensated',
        'Fully compensated or normal'
      ],
      correctIndex: 2
    },
    {
      id: 'comp-rr-risk',
      type: 'sata',
      category: 'ABG Concepts',
      instruction: 'Select all that apply',
      prompt:
        'The body is compensating by increasing respiratory rate. This risks tiring out the lungs causing respiratory failure and requiring a ventilator. Which apply?',
      choices: ['Uncompensated', 'Partially compensated', 'Normal'],
      correctIndexes: [0, 1]
    },
    {
      id: 'partial-resp-acidosis',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Choose the correct answer',
      prompt:
        'The kidneys produced a higher quantity of bicarb to lower acidity because respiratory function is compromised and depressed, causing CO₂ to build up. There is not enough bicarb yet for the pH to be within normal range. What is this state called?',
      choices: [
        'Partially compensated respiratory acidosis',
        'Fully compensated respiratory acidosis',
        'Fully compensated metabolic alkalosis',
        'Partially compensated metabolic alkalosis'
      ],
      correctIndex: 0
    },
    {
      id: 'partial-resp-acidosis-drivers',
      type: 'sata',
      category: 'ABG Concepts',
      instruction: 'Select all that apply',
      prompt:
        'In partially compensated respiratory acidosis, which describe the main driver of disease and how compensation is incomplete?',
      choices: [
        'Lungs are the primary driver by retaining CO₂ (insufficient RR); kidneys try to compensate by producing more bicarb',
        'The kidney has not produced enough bicarb for the pH to return to normal range',
        'Kidney is primary driver by not producing enough bicarb; lungs compensate with higher RR',
        'The lungs have not activated a high enough RR to clear CO₂'
      ],
      correctIndexes: [0, 1]
    },
    {
      id: 'ph-7',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.00 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 0
    },
    {
      id: 'ph-734',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.34 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 0
    },
    {
      id: 'ph-744',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.44 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 1
    },
    {
      id: 'ph-745',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.45 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 1
    },
    {
      id: 'ph-753',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.53 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 2
    },
    {
      id: 'ph-746',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'pH 7.46 — classify',
      choices: ['Acidic', 'Normal', 'Alkalotic'],
      correctIndex: 2
    },
    {
      id: 'full-comp-met-acidosis',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blanks',
      prompt:
        'The kidneys produced a low quantity of bicarb causing blood to go acidic. The lungs counter by breathing more rapidly to expel CO₂. This pushed the pH from __ back to normal range. What state is this?',
      choices: [
        'low → Fully compensated metabolic acidosis',
        'high → Fully compensated metabolic acidosis',
        'low → Fully compensated respiratory acidosis',
        'high → Fully compensated respiratory acidosis'
      ],
      correctIndex: 0
    },
    {
      id: 'why-increase-rr',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'The body is compensating by increasing respiratory rate. Usually why?',
      choices: [
        'Blood was too acidic because the kidneys did not produce enough bicarb',
        'Blood was too acidic because the kidneys produced excessive bicarb'
      ],
      correctIndex: 0
    },
    {
      id: 'partial-resp-alkalosis',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blanks',
      prompt:
        'RR is too high, making blood alkaline by expelling too much CO₂. Kidneys compensate by producing less bicarb. Even though the pH was ___ and moved toward normal, it is still not within normal range. What state is this?',
      choices: [
        'high → Partially compensated respiratory alkalosis',
        'low → Partially compensated respiratory alkalosis',
        'high → Partially compensated metabolic alkalosis',
        'low → Partially compensated metabolic alkalosis'
      ],
      correctIndex: 0
    },
    {
      id: 'partial-met-alkalosis',
      type: 'choice',
      category: 'ABG Concepts',
      instruction: 'Fill in the blanks',
      prompt:
        'Kidneys produced high bicarb (alkaline blood). Lungs counteract by lowering RR and retaining CO₂. This pushed the pH from __ toward normal, but it is still not within normal range. What state is this?',
      choices: [
        'high → Partially compensated metabolic alkalosis',
        'low → Partially compensated metabolic alkalosis',
        'high → Partially compensated respiratory alkalosis',
        'low → Partially compensated respiratory alkalosis'
      ],
      correctIndex: 0
    },
    {
      id: 'hypoxemia-1',
      type: 'sata',
      category: 'ABG Oxygenation',
      instruction: 'Select all that apply',
      prompt: "Patient's ABG returned. Select lab values that point to hypoxemia.",
      choices: ['pO₂ 79 mmHg', 'SaO₂ 94%', 'SaO₂ 91%', 'pO₂ 81 mmHg', 'SaO₂ 96%'],
      correctIndexes: [0, 1, 2]
    },
    {
      id: 'hypoxemia-2',
      type: 'sata',
      category: 'ABG Oxygenation',
      instruction: 'Select all that apply',
      prompt: "Patient's ABG returned. Select lab values that point to hypoxemia.",
      choices: ['pO₂ 70 mmHg', 'SaO₂ 92%', 'pO₂ 81 mmHg', 'SaO₂ 96%'],
      correctIndexes: [0, 1]
    },
    {
      id: 'po2-sao2-normals',
      type: 'sata',
      category: 'ABG Oxygenation',
      instruction: 'Select all that apply',
      prompt: 'Select the normal ranges for pO₂ and SaO₂',
      choices: [
        'pO₂ 80–100 mmHg',
        'SaO₂ 95–100%',
        'SaO₂ 93–100%',
        'SaO₂ 92–100%',
        'pO₂ 93–100 mmHg',
        'pO₂ 95–100 mmHg'
      ],
      correctIndexes: [0, 1]
    },
    {
      id: 'po2-sao2-defs',
      type: 'match',
      category: 'ABG Oxygenation',
      instruction: 'Mix and match',
      prompt: 'Regarding pO₂ and SaO₂',
      pairs: [
        {
          term: 'pO₂',
          definition:
            'Pressure from oxygen molecules dissolved in arterial blood; reflects oxygen concentration measured on blood gas analysis'
        },
        {
          term: 'SaO₂',
          definition:
            'Percentage of hemoglobin saturated with oxygen; proportion of O₂-binding sites occupied'
        }
      ]
    },
    {
      id: 'sao2-measured-by',
      type: 'sata',
      category: 'ABG Oxygenation',
      instruction: 'Select all that apply',
      prompt: 'SaO₂ is measured by',
      choices: ['ABG sampling (blood sample)', 'Pulse oximeter'],
      correctIndexes: [0, 1]
    },
    {
      id: 'pulse-ox-flash',
      type: 'flash',
      category: 'ABG Oxygenation',
      instruction: 'Did you answer correctly?',
      prompt: 'Pulse oximeter — how it works',
      front:
        '<strong>Pulse oximeter — how it works?</strong><p class="mt-2 text-sm">Recall how SpO₂ estimation works, then flip.</p>',
      back:
        'Emits two wavelengths of light (red and infrared) that pass through tissue and are absorbed differently by oxygenated vs deoxygenated hemoglobin. By analyzing absorption, it estimates the percentage of oxygen-saturated hemoglobin in arterial blood.'
    },
    {
      id: 'oxyhb-curve-facts',
      type: 'sata',
      category: 'ABG Oxygenation',
      instruction: 'Select all that apply',
      prompt: 'Regarding pO₂ and SaO₂',
      choices: [
        'Correlated',
        'Described by the oxygen-hemoglobin dissociation curve',
        'As pO₂ increases, hemoglobin affinity for O₂ rises → higher SaO₂; as pO₂ falls, affinity falls → lower SaO₂',
        'Described by the oxygen-pressure-affinity curve',
        'Inversely correlated'
      ],
      correctIndexes: [0, 1, 2]
    },
    {
      id: 'oxyhb-axes',
      type: 'match',
      category: 'ABG Oxygenation',
      instruction: 'Mix and match',
      prompt: 'Regarding the oxygen-hemoglobin dissociation curve',
      pairs: [
        { term: 'Y axis', definition: 'Percent of Hb saturated with O₂ (%)' },
        { term: 'X axis', definition: 'Partial pressure of O₂ (mmHg)' }
      ]
    },
    {
      id: 'oxyhb-shift-flash',
      type: 'flash',
      category: 'ABG Oxygenation',
      instruction: 'Did you answer correctly?',
      prompt: 'O₂–Hb dissociation curve — left vs right shift',
      front:
        '<p class="text-sm mb-2">What happens with left shift vs right shift? What are the axes?</p>' +
        '<img src="https://wengindustry.com/tools/quiz-gsheet-hosting/icu/Hboxygendissociationcurv-partial.png" alt="O2-Hb dissociation curve" style="max-height:40vh;width:auto;max-width:100%;">' +
        '<p class="text-xs text-gray-500 mt-2">For education use only. Image rights: UpToDate.</p>',
      back:
        '<img src="https://wengindustry.com/tools/quiz-gsheet-hosting/icu/Hboxygendissociationcurv.gif" alt="O2-Hb curve shifts" style="max-height:40vh;width:auto;max-width:100%;">' +
        '<p class="text-sm mt-2">X = PaO₂ (mmHg), Y = % Hb saturation. Right shift ↓ affinity (unload O₂ to tissues); left shift ↑ affinity (hold O₂).</p>' +
        '<p class="text-xs text-gray-500 mt-1">For education use only. Image rights: UpToDate.</p>'
    },
    {
      id: 'ph-match-terms',
      type: 'match',
      category: 'ABG Concepts',
      instruction: 'Mix and match',
      prompt: 'Match the following pH values with the correct term',
      pairs: [
        { term: '7.49', definition: 'Alkalosis' },
        { term: '7.35', definition: 'Normal pH' },
        { term: '7.25', definition: 'Acidosis' }
      ]
    },
    {
      id: 'pao2-match-status',
      type: 'match',
      category: 'ABG Oxygenation',
      instruction: 'Mix and match',
      prompt: 'Match the following PaO₂ values with oxygen status',
      pairs: [
        { term: '70 mmHg', definition: 'Hypoxemia' },
        { term: '80 mmHg', definition: 'Normal oxygen status' }
      ]
    },
    {
      id: 'sat-match-status',
      type: 'match',
      category: 'ABG Oxygenation',
      instruction: 'Mix and match',
      prompt: 'Match O₂ sat with oxygen status',
      pairs: [
        { term: '88%', definition: 'Low oxygen saturation' },
        { term: '95%', definition: 'Normal oxygen saturation' }
      ]
    },
    {
      id: 'mixed-acidosis',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'Mixed acidosis is:',
      choices: [
        'Low pH, high pCO₂, low HCO₃',
        'Low pH, low pCO₂, low HCO₃',
        'Low pH, low pCO₂, high HCO₃'
      ],
      correctIndex: 0
    },
    {
      id: 'mixed-alkalosis',
      type: 'choice',
      category: 'ABG Concepts',
      prompt: 'Mixed alkalosis is:',
      choices: [
        'High pH, low pCO₂, high HCO₃',
        'High pH, low pCO₂, low HCO₃',
        'High pH, high pCO₂, low HCO₃'
      ],
      correctIndex: 0
    }
  ]
};

export default abgSkillBank;
