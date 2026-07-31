/**
 * Med brand ↔ generic pairs — AUTHOR CONTENT HERE.
 * Path: challenges/skills/med-identity/config.js
 *
 * Matching is case-insensitive. Optional:
 * - brands — all accepted brand names (SATA when length > 1); first is primary
 * - brand — single brand (legacy; used when brands omitted)
 * - aliases — extra accepted generics
 * - brandAliases — extra accepted brand spellings (typed single-brand only)
 *
 * Scanned from patient med tasks (game/events/patients/*.html).
 */
/** @type {{ generic: string, brand?: string, brands?: string[], aliases?: string[], brandAliases?: string[] }[]} */
export const medIdentityPairs = [
  { generic: 'atorvastatin', brand: 'Lipitor' },
  {
    generic: 'acetaminophen',
    brands: ['Tylenol', 'Ofirmev', 'Panadol'],
    aliases: ['paracetamol']
  },
  {
    generic: 'aspirin',
    brands: ['Bayer', 'Ecotrin', 'Bufferin'],
    aliases: ['asa', 'acetylsalicylic acid']
  },
  { generic: 'heparin', brand: 'Hep-Lock', brandAliases: ['heplock', 'hep lock'] },
  {
    generic: 'gabapentin',
    brands: ['Neurontin', 'Gralise', 'Horizant']
  },
  { generic: 'melatonin', brand: 'Circadin' },
  { generic: 'trazodone', brands: ['Desyrel', 'Oleptro'] },
  { generic: 'doxazosin', brand: 'Cardura' },
  { generic: 'mirtazapine', brand: 'Remeron' },
  { generic: 'ceftriaxone', brand: 'Rocephin' },
  {
    generic: 'albuterol',
    brands: ['ProAir', 'Ventolin', 'Proventil'],
    aliases: ['salbutamol']
  },
  { generic: 'prednisone', brands: ['Deltasone', 'Rayos'] },
  { generic: 'ondansetron', brand: 'Zofran' },
  {
    generic: 'oxycodone',
    brands: ['OxyContin', 'Roxicodone', 'Oxaydo']
  },
  {
    generic: 'potassium chloride',
    brands: ['Klor-Con', 'K-Dur', 'Micro-K'],
    aliases: ['kcl']
  },
  { generic: 'insulin', brands: ['Humulin', 'Novolin'] },
  { generic: 'hydromorphone', brand: 'Dilaudid' },
  { generic: 'levetiracetam', brand: 'Keppra' },
  { generic: 'vancomycin', brand: 'Vancocin', aliases: ['oral vancomycin'] },
  {
    generic: 'metformin',
    brands: ['Glucophage', 'Glumetza', 'Fortamet']
  },
  {
    generic: 'lisinopril',
    brands: ['Zestril', 'Prinivil']
  }
];

export const medIdentityChallengeConfig = {
  pairs: medIdentityPairs
};

export default medIdentityChallengeConfig;
