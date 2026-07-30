/**
 * Challenge kind registry — pathing for authors + Test spawn categories.
 * Path: challenges/registry.js
 *
 * category:
 * - skills      → Test spawn group "Skills"
 * - emergencies → Test spawn group "Emergencies"
 *
 * Set testSpawnKind to surface the challenge in the Test flask modal
 * (stub task builders live in test-spawn.js).
 */
export const CHALLENGE_REGISTRY = {
  'ivpb-hang': {
    id: 'ivpb-hang',
    category: 'skills',
    label: 'IVPB hang sequence',
    configPath: 'challenges/skills/ivpb-hang/config.js',
    modulePath: 'challenges/skills/ivpb-hang/challenge.js',
    testSpawnKind: 'ivpb-hang'
  },
  'med-identity': {
    id: 'med-identity',
    category: 'skills',
    label: 'Med identity quiz',
    configPath: 'challenges/skills/med-identity/config.js',
    modulePath: 'challenges/skills/med-identity/challenge.js',
    testSpawnKind: 'med-identity'
  },
  'bed-prep': {
    id: 'bed-prep',
    category: 'skills',
    label: 'Bed prep gather',
    configPath: 'challenges/skills/bed-prep/config.js',
    modulePath: 'challenges/skills/bed-prep/challenge.js',
    testSpawnKind: 'bed-prep'
  },
  accucheck: {
    id: 'accucheck',
    category: 'skills',
    label: 'Accucheck / sliding scale',
    configPath: null,
    modulePath: 'challenges/skills/accucheck/challenge.js',
    testSpawnKind: 'accucheck'
  },
  'iv-check': {
    id: 'iv-check',
    category: 'skills',
    label: 'IV rate check',
    configPath: null,
    modulePath: 'challenges/skills/iv-check/challenge.js',
    testSpawnKind: 'iv-check'
  },
  admission: {
    id: 'admission',
    category: 'skills',
    label: 'Admission quizzes',
    configPath: null,
    modulePath: 'challenges/skills/admission/challenge.js'
    // Expanded as admission-* rows in test-spawn.js
  },
  icp: {
    id: 'icp',
    category: 'skills',
    label: 'ICP monitoring',
    configPath: 'challenges/skills/icp/config.js',
    modulePath: 'challenges/skills/icp/challenge.js',
    testSpawnKind: 'icp'
  },
  'skill-mcq': {
    id: 'skill-mcq',
    category: 'skills',
    label: 'Skill library MCQ',
    configPath: 'challenges/skills/skill-mcq/config.js',
    modulePath: 'challenges/skills/skill-mcq/challenge.js',
    testSpawnKind: 'skill-mcq'
  },
  'code-blue': {
    id: 'code-blue',
    category: 'emergencies',
    label: 'Code Blue',
    configPath: 'challenges/emergencies/code-blue/config.js',
    modulePath: 'challenges/emergencies/code-blue/challenge.js',
    testSpawnKind: 'code-blue'
  }
};

export const TEST_SPAWN_GROUPS = {
  skills: 'Skills',
  emergencies: 'Emergencies'
};

export default CHALLENGE_REGISTRY;
