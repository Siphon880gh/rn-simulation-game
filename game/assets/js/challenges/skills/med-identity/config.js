/**
 * Med brand ↔ generic pairs — AUTHOR CONTENT HERE.
 * Path: challenges/skills/med-identity/config.js
 *
 * Matching is case-insensitive. Optional:
 * - aliases — extra accepted generics
 * - brandAliases — extra accepted brand spellings
 */
/** @type {{ generic: string, brand: string, aliases?: string[], brandAliases?: string[] }[]} */
export const medIdentityPairs = [
  { generic: 'atorvastatin', brand: 'Lipitor' },
  { generic: 'acetaminophen', brand: 'Tylenol', aliases: ['paracetamol'] },
  { generic: 'aspirin', brand: 'Bayer', aliases: ['asa', 'acetylsalicylic acid'] },
  { generic: 'heparin', brand: 'Hep-Lock', brandAliases: ['heplock', 'hep lock'] },
  { generic: 'gabapentin', brand: 'Neurontin' },
  { generic: 'melatonin', brand: 'Circadin' },
  { generic: 'trazodone', brand: 'Desyrel' },
  { generic: 'doxazosin', brand: 'Cardura' },
  { generic: 'mirtazapine', brand: 'Remeron' },
  { generic: 'ceftriaxone', brand: 'Rocephin' },
  { generic: 'albuterol', brand: 'ProAir', aliases: ['salbutamol'] },
  { generic: 'prednisone', brand: 'Deltasone' },
  { generic: 'ondansetron', brand: 'Zofran' },
  { generic: 'oxycodone', brand: 'OxyContin' },
  { generic: 'potassium chloride', brand: 'Klor-Con', aliases: ['kcl'] },
  { generic: 'insulin', brand: 'Humulin' }
];

export const medIdentityChallengeConfig = {
  pairs: medIdentityPairs
};

export default medIdentityChallengeConfig;
