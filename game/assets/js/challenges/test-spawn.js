/**
 * Test spawn menu entries + stub tasks for challenges/.
 * Path: challenges/test-spawn.js
 * Groups: Skills / Emergencies (see registry.js).
 */
import { CHALLENGE_REGISTRY, TEST_SPAWN_GROUPS } from './registry.js';
import { medIdentityPairs } from './skills/med-identity/config.js';
import { skillMcqBanks } from './skills/skill-mcq/config.js';

/** Extra skill spawns beyond one-entry-per-registry-id (IV variants, admission MCQs). */
const EXTRA_SKILL_SPAWNS = [
  {
    id: 'heparin-ptt',
    kind: 'heparin-ptt',
    label: 'Heparin PTT adjust',
    category: 'skills'
  },
  {
    id: 'iv-titration',
    kind: 'iv-titration',
    label: 'IV titration (pressor)',
    category: 'skills'
  },
  {
    id: 'admission-allergies',
    kind: 'admission-allergies',
    label: 'Admission — allergies',
    category: 'skills'
  },
  {
    id: 'admission-belongings',
    kind: 'admission-belongings',
    label: 'Admission — belongings',
    category: 'skills'
  },
  {
    id: 'admission-code-status',
    kind: 'admission-code-status',
    label: 'Admission — code status',
    category: 'skills'
  },
  {
    id: 'admission-home-recon',
    kind: 'admission-home-recon',
    label: 'Admission — home recon',
    category: 'skills'
  },
  {
    id: 'admission-npo',
    kind: 'admission-npo',
    label: 'Admission — NPO',
    category: 'skills'
  },
  {
    id: 'admission-bp',
    kind: 'admission-bp',
    label: 'Admission — blood pressure',
    category: 'skills'
  },
  {
    id: 'admission-flu-shot',
    kind: 'admission-flu-shot',
    label: 'Admission — flu shot',
    category: 'skills'
  },
  {
    id: 'admission-call-admitting',
    kind: 'admission-call-admitting',
    label: 'Admission — call admitting',
    category: 'skills'
  }
];

const GROUP_ORDER = {
  [TEST_SPAWN_GROUPS.skills]: 0,
  [TEST_SPAWN_GROUPS.emergencies]: 1
};

/**
 * Menu rows for GameConfig.testMode.incidents (Skills + Emergencies only).
 */
export function getChallengeTestSpawnIncidents() {
  const fromRegistry = Object.values(CHALLENGE_REGISTRY)
    .filter((entry) => entry.testSpawnKind)
    .map((entry) => ({
      id: entry.testSpawnKind,
      kind: entry.testSpawnKind,
      label: entry.label,
      group: TEST_SPAWN_GROUPS[entry.category] || TEST_SPAWN_GROUPS.skills
    }));

  const extras = EXTRA_SKILL_SPAWNS.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    group: TEST_SPAWN_GROUPS[entry.category] || TEST_SPAWN_GROUPS.skills
  }));

  return [...fromRegistry, ...extras].sort((a, b) => {
    const ga = GROUP_ORDER[a.group] ?? 9;
    const gb = GROUP_ORDER[b.group] ?? 9;
    if (ga !== gb) return ga - gb;
    return String(a.label).localeCompare(String(b.label));
  });
}

export function isChallengeTestSpawnKind(kind) {
  return Boolean(kind) && (
    Object.values(CHALLENGE_REGISTRY).some((e) => e.testSpawnKind === kind)
    || EXTRA_SKILL_SPAWNS.some((e) => e.kind === kind)
  );
}

export function isCodeBlueTestSpawn(kind) {
  return kind === 'code-blue';
}

/**
 * Stub task for runChallengeGate. Returns null for Code Blue (use runCodeBlueChallenge).
 * @param {string} kind
 * @param {string|null} patientId
 * @param {{ skillId?: string, skillLabel?: string }} [opts]
 */
export function buildTestChallengeTask(kind, patientId = null, opts = {}) {
  if (!kind || kind === 'code-blue') return null;

  const base = {
    id: null,
    patientId: patientId || null
  };

  switch (kind) {
    case 'ivpb-hang':
      return {
        ...base,
        name: 'Ceftriaxone IVPB (test)',
        type: 'med',
        metadata: { challenge: 'ivpb', route: 'ivpb' }
      };
    case 'iv-replace':
      return {
        ...base,
        name: 'Replace IV solution (0.9% NS) (test)',
        type: 'iv',
        metadata: {
          challenge: 'iv-replace',
          lineKind: 'fluid',
          ivLineName: '0.9% NS',
          lineId: 'test-ns'
        }
      };
    case 'peritoneal-dialysis':
      return {
        ...base,
        name: 'PD exchange (BP, prime, drain, fill)',
        type: 'assessment',
        metadata: { challenge: 'peritoneal-dialysis', skillId: 'peritoneal-dialysis' }
      };
    case 'med-identity': {
      const pair = medIdentityPairs[0] || { generic: 'atorvastatin', brand: 'Lipitor' };
      return {
        ...base,
        name: pair.generic,
        type: 'med',
        metadata: { challenge: 'med-identity' }
      };
    }
    case 'bed-prep':
      return {
        ...base,
        name: 'Prepare bed for admission (test)',
        type: 'bedprep',
        metadata: { challenge: 'bed-prep' }
      };
    case 'accucheck':
      return {
        ...base,
        name: 'Accucheck / sliding scale / finger stick (test)',
        type: 'med',
        metadata: { challenge: 'accucheck' }
      };
    case 'iv-check':
      return {
        ...base,
        name: 'Insulin drip rate check (test)',
        type: 'iv',
        metadata: {
          challenge: 'iv-check',
          drug: 'insulin',
          currentRate: 5,
          unit: 'units/hr'
        }
      };
    case 'heparin-ptt':
      return {
        ...base,
        name: 'Heparin PTT adjust (test)',
        type: 'iv',
        metadata: {
          challenge: 'heparin-ptt',
          drug: 'heparin',
          currentRate: 12,
          unit: 'units/kg/hr'
        }
      };
    case 'iv-titration':
      return {
        ...base,
        name: 'Levophed titration (test)',
        type: 'iv',
        metadata: {
          challenge: 'iv-titration',
          drug: 'levophed',
          currentRate: 8,
          unit: 'mcg/min',
          direction: 'increase',
          sbp: 78
        }
      };
    case 'admission-allergies':
      return admissionTask(base, 'allergies', 'Ask patient allergies (test)');
    case 'admission-belongings':
      return admissionTask(base, 'belongings', 'Check belongings (test)');
    case 'admission-code-status':
      return admissionTask(base, 'codeStatus', 'Ask patient code status (test)');
    case 'admission-home-recon':
      return admissionTask(base, 'homeRecon', 'Home medication reconciliation (test)');
    case 'admission-npo':
      return admissionTask(base, 'npo', 'NPO at first (test)');
    case 'admission-bp':
      return admissionTask(base, 'bp', 'Take admission blood pressure (test)');
    case 'admission-flu-shot':
      return admissionTask(base, 'fluShot', 'Offer flu shot (test)');
    case 'admission-call-admitting':
      return admissionTask(base, 'callAdmitting', 'Call admitting for orders (test)');
    case 'icp':
      return {
        ...base,
        name: 'ICP monitoring (skill focus)',
        type: 'assessment',
        metadata: { challenge: 'icp' }
      };
    case 'alteplase':
      return {
        ...base,
        name: 'Assess PICC patency / alteplase (Cathflo)',
        type: 'assessment',
        metadata: {
          challenge: 'alteplase',
          alteplasePhase: 'focus',
          weightKg: 70
        }
      };
    case 'sepsis-screen':
      return {
        ...base,
        name: 'Sepsis screen (Q4H)',
        type: 'assessment',
        metadata: {
          challenge: 'sepsis-screen',
          kind: 'sepsis-screen',
          skillId: 'sepsis-recognition'
        }
      };
    case 'skill-mcq': {
      const requested = String(opts.skillId || '').trim();
      // Landing Test skill always passes skillId — never silently swap to another bank
      // (old bug: missing bank → bankIds[0] → seizure-precautions for every skill-mcq).
      if (requested) {
        if (!skillMcqBanks[requested]) {
          console.warn(`skill-mcq: no question bank for skillId “${requested}”`);
          return null;
        }
        const title = opts.skillLabel || skillMcqBanks[requested]?.title || requested;
        return {
          ...base,
          name: `${title} (skill focus)`,
          type: 'assessment',
          metadata: { challenge: 'skill-mcq', skillId: requested }
        };
      }
      // Dev test-spawn menu (no skillId): use first authored bank only.
      const bankIds = Object.keys(skillMcqBanks);
      const skillId = bankIds[0] || '';
      if (!skillId) return null;
      const title = skillMcqBanks[skillId]?.title || skillId;
      return {
        ...base,
        name: `${title} (skill focus)`,
        type: 'assessment',
        metadata: { challenge: 'skill-mcq', skillId }
      };
    }
    default:
      return null;
  }
}

function admissionTask(base, challenge, name) {
  return {
    ...base,
    name,
    type: 'admission',
    metadata: { challenge }
  };
}
