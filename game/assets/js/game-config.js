// game-config.js - Declarative game configuration
// Canonical timer defaults for the live app (app.js / timer_ingame.js).
// Note: game/app.config.js presets are NOT wired into app.js — treat as legacy/reference only.
// Challenge content lives under assets/js/challenges/{skills,emergencies}/<id>/config.js
import { challengeCopyConfig } from './challenges/shared/copy-config.js';
import { codeBlueChallengeConfig } from './challenges/emergencies/code-blue/config.js';
import { bedPrepChallengeConfig } from './challenges/skills/bed-prep/config.js';
import { ivpbHangChallengeConfig } from './challenges/skills/ivpb-hang/config.js';
import { medIdentityChallengeConfig } from './challenges/skills/med-identity/config.js';
import { icpChallengeConfig } from './challenges/skills/icp/config.js';
import { skillMcqChallengeConfig } from './challenges/skills/skill-mcq/config.js';
import { getChallengeTestSpawnIncidents } from './challenges/test-spawn.js';

export const GameConfig = {
  // Timer configuration (military HHMM + accelerated real-time budget)
  timer: {
    defaultSpeedFactor: 1440, // real ms between ticks = 1000 / speedFactor
    defaultShiftStart: 1900, // military HHMM
    defaultShiftDuration: 60 * 12, // game-minutes in the shift (also real-seconds budget before speed)
    pollInterval: 1000,
    taskPollBlockMinutes: 15,
    /**
     * Pause ownership (who may hold the clock stopped).
     * Clock is paused while pauseSources is non-empty (see game-state SET_PAUSE).
     * - user: #pause button
     * - modal: blocking clinical/help modals that should freeze the shift (opt-in per modal)
     * - challenge: perform mini-games (E5) — must pause for the challenge duration
     * - system: bootstrap / game-over teardown
     */
    pauseSources: {
      USER: 'user',
      MODAL: 'modal',
      CHALLENGE: 'challenge',
      /** Challenge-level booster: timed freeze (auto-clears). */
      BOOSTER: 'booster',
      SYSTEM: 'system'
    }
  },

  /**
   * Boosters earned from multi-question challenge levels (N questions → N−1 boosters).
   * Spend to freeze the clock (~15 game minutes) or finish all busy queue slots.
   */
  boosters: {
    freezeGameMinutes: 15,
    /** Floor so high speed-factor freezes still feel usable. */
    freezeMinRealMs: 8000,
    slotCompleteAnimMs: 700,
    selectors: {
      root: '#shell-boosters',
      count: '#shell-boosters-count',
      freezeBtn: '#shell-booster-freeze',
      slotsBtn: '#shell-booster-slots',
      status: '#shell-boosters-status'
    }
  },

  // Task system configuration (E3.M1 schema)
  tasks: {
    /**
     * Canonical task object shape produced by taskSystem.createTask:
     * { id, type, taskClass, name, scheduled, expire, duration, status, patientId, metadata }
     * - type: processor key (med | assessment | procedure | default)
     * - taskClass: workload class (routine | urgent | stat) — interaction math is Later (E3.M4)
     * - scheduled / expire: military HHMM integers (expire may be null)
     * - duration: minutes (slot occupancy in E3.M2)
     */
    schemaVersion: 1,
    classes: {
      ROUTINE: 'routine',
      URGENT: 'urgent',
      STAT: 'stat'
    },
    types: {
      MED: {
        name: 'Medication',
        icon: 'fas fa-pills',
        color: 'blue',
        contextMenu: {
          perform: { name: "Perform", icon: "add" },
          details: { name: 'Details', icon: 'question' }
        }
      },
      ASSESSMENT: {
        name: 'Assessment',
        icon: 'fas fa-stethoscope',
        color: 'green'
      },
      PROCEDURE: {
        name: 'Procedure',
        icon: 'fas fa-medical',
        color: 'purple',
        contextMenu: {
          perform: { name: 'Perform', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      ORDERS: {
        name: 'Doctor Orders',
        icon: 'fas fa-clipboard-list',
        color: 'indigo',
        contextMenu: {
          perform: { name: 'Check orders', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      BEDPREP: {
        name: 'Bed Prep',
        icon: 'fas fa-bed',
        color: 'amber',
        contextMenu: {
          perform: { name: 'Prepare bed', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      IV: {
        name: 'IV / Drip',
        icon: 'fas fa-syringe',
        color: 'teal',
        contextMenu: {
          perform: { name: 'Adjust / check IV', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      CRITICALLAB: {
        name: 'Critical lab',
        icon: 'fas fa-vial',
        color: 'red',
        contextMenu: {
          perform: { name: 'Call doctor', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      ADMISSION: {
        name: 'Admission',
        icon: 'fas fa-hospital-user',
        color: 'teal',
        contextMenu: {
          perform: { name: 'Perform', icon: 'add' },
          details: { name: 'Details', icon: 'question' }
        }
      },
      DEFAULT: {
        name: 'Task',
        icon: 'fas fa-tasks',
        color: 'gray'
      }
    },
    statuses: {
      NOT_YET: 'not-yet',
      ACTIVE: 'active',
      COMPLETED: 'completed',
      OVERDUE: 'overdue'
    },
    /**
     * Availability window phases inside [scheduled, expire] (E3.M3).
     * early / late / end = thirds of the open window; used for cues + Perform gating context.
     */
    availability: {
      phases: ['before', 'early', 'late', 'end', 'after', 'open'],
      gatePerform: true
    }
  },

  // Concurrent execution slots (E3.M2) + waiting queue (E3.M6)
  slots: {
    count: 3,
    queueSelector: '#slot-waiting-queue'
  },

  /**
   * Right-rail Delegate / assist staff (E13).
   * Naming: section "Delegate" (action verb). Helpers listed by role+name —
   * ICU = CCT (critical care tech); floor = CNA + room. Replaces vague
   * "Delegate-Whole" / "Delegate-Team" labels.
   */
  delegation: {
    sectionLabel: 'Delegate',
    turnAssistFactor: 0.5,
    hintMs: 2800,
    /**
     * Two clear modes:
     * - team: you work with them (turns) → half slot time
     * - solo: they do it for you → instant complete
     */
    modes: {
      team: {
        id: 'team',
        label: 'Team effort',
        shortLabel: 'Team · ½ time',
        effect: 'half'
      },
      solo: {
        id: 'solo',
        label: 'Aide completes',
        shortLabel: 'They do this · instant',
        effect: 'instant'
      }
    },
    icu: {
      role: 'cct',
      roleLabel: 'CCT',
      count: 1,
      names: ['Morgan', 'Riley', 'Casey', 'Quinn']
    },
    floor: {
      role: 'cna',
      roleLabel: 'CNA',
      maxCount: 2,
      /** Each CNA gets one distinct third of the shift (non-overlapping). */
      availabilityFraction: 1 / 3,
      staggerThirds: true,
      names: ['Wendy', 'Luis', 'Pat', 'Sam', 'Nina', 'Omar']
    },
    /**
     * Patient requests CNAs (or CCT) can complete alone — instant “they do this”.
     * Expanded per patient in patients.js (staggered times across the shift).
     */
    soloRequestCatalog: [
      { id: 'linen', name: 'Linen change / hygiene assist', icon: 'fas fa-tshirt', durationMins: 10, expireMins: 90 },
      { id: 'bathroom', name: 'Bathroom assist', icon: 'fas fa-door-open', durationMins: 10, expireMins: 60 },
      { id: 'water', name: 'Get water', icon: 'fas fa-tint', durationMins: 5, expireMins: 45 },
      { id: 'bed-position', name: 'Bed position request', icon: 'fas fa-bed', durationMins: 5, expireMins: 45 },
      { id: 'pillow', name: 'Pillow request', icon: 'fas fa-moon', durationMins: 5, expireMins: 45 }
    ]
  },

  /**
   * Recurring bedside care schedules (pressure-injury prevention).
   * Patient packs opt in via patientConfigs.careSchedules and/or
   * HTML `data-care-schedule="turn-q2h"` on `.patient` (reason in data-care-reason).
   * Typical for obesity, bedbound, or stroke/weakness that prevents self-turning.
   */
  careSchedules: {
    turnQ2h: {
      id: 'turnQ2h',
      htmlAttr: 'turn-q2h',
      intervalMins: 120,
      durationMins: 10,
      expireMins: 60,
      taskType: 'assessment',
      taskClass: 'routine',
      taskName: 'Turn / reposition (Q2H)',
      /** Align first due to shift start; then every intervalMins through the shift. */
      alignToShiftStart: true
    }
  },

  /**
   * Per-patient shift assessment → chart flow (injected for every census patient).
   * Bedside assess must finish in the first N game-hours; chart unlocks after assess
   * and occupies a slot (~15 game minutes). Perform assess → random skill from pool.
   */
  shiftAssessment: {
    assessWithinMins: 240,
    assessDurationMins: 12,
    assessTaskName: 'Shift assessment',
    chartDurationMins: 15,
    /** Chart due window from shift start (longer than assess so charting can finish). */
    chartExpireMins: 480,
    chartTaskName: 'Chart assessment',
    assessmentSkillIds: [
      'heart-sounds',
      'lung-sounds',
      'capillary-refill',
      'swelling'
    ]
  },

  // Scene presence (E7.M1 Later) — CSS themes; optional authored image URLs
  scene: {
    defaultTheme: 'medsurg',
    unitBackground: null,
    situationStills: {
      'code-blue': null,
      'bed-prep': null
    },
    motion: {
      panelSwap: true,
      statusPulse: true
    }
  },

  // Challenge configs — authored under challenges/{skills|emergencies}/<id>/config.js
  codeBlueChallenge: codeBlueChallengeConfig,
  challengeCopy: challengeCopyConfig,
  bedPrepChallenge: bedPrepChallengeConfig,
  ivpbHangChallenge: ivpbHangChallengeConfig,
  medIdentityChallenge: medIdentityChallengeConfig,
  icpChallenge: icpChallengeConfig,
  skillMcqChallenge: skillMcqChallengeConfig,

  /**
   * Landing skill library (search → pick one → shift or Test skill).
   * Catalog: game/events/skills/library.json
   * Test skill: ?skill=&skillMode=test → blank census + modal → landing.
   */
  skillLibrary: {
    url: 'events/skills/library.json',
    /** Delay after boot before opening the assigned skill game */
    launchDelayMs: 900,
    /** After Test skill challenge ends, return to repo landing */
    returnToLandingUrl: '../index.html'
  },

  // Task class interactions (E3.M4 Later) — adjust slot duration
  taskClassInteractions: {
    enabled: true,
    /** Minutes added when next task shares the previous released class (batching). Negative = faster. */
    sameClassDeltaMins: -2,
    /** Minutes added when switching to a different class (context switch cost). */
    contextSwitchDeltaMins: 3
  },

  // UI selectors — shell chrome regions locked in E1.M2
  selectors: {
    shell: '#shell',
    topPrimary: '#shell-top-primary',
    topSecondary: '#shell-top-secondary',
    leftMenu: '#shell-left-menu',
    rightMenu: '#shell-right-menu',
    ordersRail: '#orders-rail',
    toolsRail: '#tools-rail',
    delegateRail: '#delegate-rail',
    delegateHint: '#shell-delegate-hint',
    main: '#shell-main',
    bottom: '#shell-bottom',
    statusBar: '#shell-status-bar',
    statusMessage: '#shell-status-message',
    awaitingCallbackToast: '#shell-awaiting-callback-toast',
    hourTabs: '#shell-hour-tabs',
    shiftHistoryLog: '#shift-history-log',
    clockCluster: '#shell-clock-cluster',
    boosters: '#shell-boosters',
    topCollapse: '#shell-top-collapse',
    clock: '#clock',
    pauseButton: '#pause',
    testMode: '#shell-test-mode',
    brandTitle: '#shell-brand-title',
    modal: '#modal',
    modalTitle: '#modal-title',
    modalContent: '#modal-content',
    modalFooter: '#modal-footer',
    patients: '#patients',
    patientTabs: '#patient-tabs',
    globalPanel: '#global-panel',
    taskQueueBar: '#task-queue-bar',
    revealScheduledTasks: '#reveal-scheduled-tasks'
  },

  // URL parameters mapping
  urlParams: {
    speedFactor: 'speed-factor',
    shiftStarts: 'shift-starts',
    shiftDuration: 'shift-duration',
    scenarioPack: 'scenario',
    /** E9: full (omit) | minus1 | admitStart | admitMiddle | openAdmit (legacy random) */
    census: 'census',
    /** Skill library: single skill id from events/skills/library.json */
    skill: 'skill',
    /** Skill library mode: omit | test (blank census + modal → landing) */
    skillMode: 'skillMode'
  },

  /**
   * Open-to-admit / admission checklist (E9).
   * Hold last pack patient when census=minus1|admitStart|admitMiddle|openAdmit.
   * Spawn admit + tasks for admitStart / admitMiddle / openAdmit.
   */
  admission: {
    windows: {
      start: { minPct: 0.05, maxPct: 0.15 },
      middle: { minPct: 0.45, maxPct: 0.55 },
      nearEnd: { minPct: 0.80, maxPct: 0.90 }
    },
    findNurse: {
      maxAttempts: 4,
      retryEveryMins: 30,
      /** Fail chance by attempt index 0..3 (4th always succeeds) */
      failChances: [0.7, 0.5, 0.3, 0],
      durationMins: 8,
      expireOffsetMins: 45
    },
    callAdmitting: {
      callWindowMins: 60,
      callDurationMins: 8,
      callbackDurationMins: 10,
      recallEveryMins: 15,
      recallDurationMins: 5,
      immediateCallbackChance: 0.35,
      callbackDelayMins: { min: 5, max: 40 },
      awaitingToastMessage: 'Dr will call back',
      expireOffsetMins: 90
    },
    /** Per-patient consult / quiz flavor (ICU pack overrides consult → Intensivist) */
    profiles: {
      aisha: {
        consult: 'Endocrinology',
        allergies: ['NKDA'],
        homeMeds: ['insulin glargine', 'metformin'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'DKA resolving — endocrine follow-up'
      },
      lin: {
        consult: 'Surgery',
        allergies: ['Penicillin — rash'],
        homeMeds: ['omeprazole', 'acetaminophen'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'Post-op lap chole'
      },
      derek: {
        consult: 'Pulmonology',
        allergies: ['Sulfa'],
        homeMeds: ['albuterol', 'tiotropium', 'prednisone'],
        bpTarget: { systolicMin: 100, systolicMax: 160, diastolicMin: 60, diastolicMax: 100 },
        diagnosisHint: 'COPD exacerbation'
      },
      robert: {
        consult: 'Cardiology',
        allergies: ['NKDA'],
        homeMeds: ['aspirin', 'atorvastatin', 'metoprolol'],
        bpTarget: { systolicMin: 90, systolicMax: 140, diastolicMin: 55, diastolicMax: 90 },
        diagnosisHint: 'NSTEMI rule-out'
      },
      maria: {
        consult: 'Infectious Disease',
        allergies: ['Codeine'],
        homeMeds: ['lisinopril', 'albuterol'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'Community-acquired pneumonia'
      },
      joe: {
        consult: 'Orthopedics',
        allergies: ['Latex'],
        homeMeds: ['warfarin', 'metformin'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'Post-op total hip'
      },
      sloane: {
        consult: 'Infectious Disease',
        allergies: ['Penicillin — rash'],
        homeMeds: ['ibuprofen', 'metformin'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'Cellulitis — new floor admission'
      },
      default: {
        consult: 'Hospitalist',
        allergies: ['NKDA'],
        homeMeds: ['multivitamin'],
        bpTarget: { systolicMin: 100, systolicMax: 150, diastolicMin: 60, diastolicMax: 95 },
        diagnosisHint: 'New admission'
      }
    },
    /** Checklist spawned at admit time (skinCheck / callback spawn separately) */
    tasks: [
      {
        id: 'prepare-bed',
        type: 'bedprep',
        name: 'Prepare bed for admission',
        taskClass: 'urgent',
        scheduledOffsetMins: 0,
        expireOffsetMins: 90,
        durationMins: 15
      },
      {
        id: 'allergies',
        type: 'admission',
        challenge: 'allergies',
        name: 'Ask patient allergies',
        taskClass: 'urgent',
        scheduledOffsetMins: 0,
        expireOffsetMins: 120,
        durationMins: 5
      },
      {
        id: 'belongings',
        type: 'admission',
        challenge: 'belongings',
        name: 'Check belongings',
        taskClass: 'routine',
        scheduledOffsetMins: 5,
        expireOffsetMins: 120,
        durationMins: 8
      },
      {
        id: 'code-status',
        type: 'admission',
        challenge: 'codeStatus',
        name: 'Ask patient code status',
        taskClass: 'urgent',
        scheduledOffsetMins: 5,
        expireOffsetMins: 120,
        durationMins: 8
      },
      {
        id: 'home-recon',
        type: 'admission',
        challenge: 'homeRecon',
        name: 'Home medication reconciliation',
        taskClass: 'urgent',
        scheduledOffsetMins: 10,
        expireOffsetMins: 150,
        durationMins: 12
      },
      {
        id: 'npo',
        type: 'admission',
        challenge: 'npo',
        name: 'NPO at first (explain to patient waiting on doctor for diet order)',
        taskClass: 'urgent',
        scheduledOffsetMins: 0,
        expireOffsetMins: 90,
        durationMins: 5
      },
      {
        id: 'bp',
        type: 'admission',
        challenge: 'bp',
        name: 'Take admission blood pressure',
        taskClass: 'urgent',
        scheduledOffsetMins: 0,
        expireOffsetMins: 90,
        durationMins: 5
      },
      {
        id: 'flu-shot',
        type: 'admission',
        challenge: 'fluShot',
        name: 'Offer flu shot',
        taskClass: 'routine',
        scheduledOffsetMins: 15,
        expireOffsetMins: 180,
        durationMins: 5
      },
      {
        id: 'find-nurse',
        type: 'admission',
        phase: 'findNurse',
        name: 'Find second nurse for skin check (Might no one available)',
        taskClass: 'urgent',
        scheduledOffsetMins: 10,
        expireOffsetMins: 45,
        durationMins: 8,
        spawn: 'findNurse'
      },
      {
        id: 'call-admitting',
        type: 'admission',
        phase: 'call',
        challenge: 'callAdmitting',
        name: 'Call admitting for orders',
        taskClass: 'stat',
        scheduledOffsetMins: 20,
        expireOffsetMins: 90,
        durationMins: 8,
        spawn: 'call'
      }
    ]
  },

  /**
   * Dev / QA test mode — brand Test control opens a spawn-incident modal.
   * On/off is loaded from `configUrl` JSON (`enabled: true|false`). No URL query.
   */
  testMode: {
    configUrl: 'test-mode.json',
    /** Incident menu entries (handlers resolved in test-mode.js). Skills/Emergencies from challenges/test-spawn.js */
    incidents: [
      {
        id: 'critical-lab',
        label: 'Critical lab',
        kind: 'critical-lab',
        group: 'Labs',
        /** When true, show per-lab submenu from GameConfig.criticalLabs.labs */
        expandLabs: true
      },
      {
        id: 'call-light',
        label: 'Call light (water / comfort)',
        kind: 'call-light',
        group: 'Floor alerts'
      },
      {
        id: 'bed-alarm',
        label: 'Bed alarm — near fall',
        kind: 'bed-alarm',
        group: 'Floor alerts'
      },
      {
        id: 'dynamic-urgent',
        label: 'Dynamic urgent (random)',
        kind: 'dynamic-urgent',
        group: 'Floor alerts'
      },
      ...getChallengeTestSpawnIncidents()
    ]
  },

  scenario: {
    defaultPackUrl: 'events/scenarios/night-shift-default.json',
    // E7.M2: optional chaos/incident pack merged after scenario load
    defaultIncidentPackUrl: 'events/incidents/chaos-night-medsurg.json',
    // E7.M3: alternate shifts (use ?scenario=events/scenarios/day-shift-medsurg.json)
    availablePacks: [
      'events/scenarios/night-shift-default.json',
      'events/scenarios/day-shift-medsurg.json'
    ]
  },

  // E8.M1: portfolio / demo presets (query-string shortcuts)
  demo: {
    presets: {
      quickNight: 'game/index.html?speed-factor=48&scenario=events/scenarios/night-shift-default.json',
      quickDay: 'game/index.html?speed-factor=48&scenario=events/scenarios/day-shift-medsurg.json&shift-starts=0700'
    }
  },

  // Hourly check-doctor-orders (E4.M3) + E11 carryover / sudden procedures
  doctorOrders: {
    durationMins: 5,
    taskType: 'orders',
    defaultInjectExpire: '+60',
    procedures: {
      enabled: true,
      maxPerGame: 1,
      chancePerCheck: 0.35,
      minLeadMinsSameDay: 120,
      consentDurationMins: 10,
      npoTaskDurationMins: 5,
      procedureDurationMins: 20,
      procedureExpireMins: 60,
      /** Diagnosis substring/regex → procedure candidates (not every patient). */
      byDiagnosis: [
        {
          match: 'NSTEMI',
          name: 'Cardiac catheterization',
          defaultTiming: 'sameDay',
          timings: ['sameDay', 'tomorrow']
        },
        {
          match: 'COPD',
          name: 'Bronchoscopy',
          defaultTiming: 'tomorrow',
          timings: ['tomorrow', 'sameDay']
        },
        {
          match: 'pneumonia',
          name: 'Bronchoscopy',
          defaultTiming: 'tomorrow',
          timings: ['tomorrow', 'sameDay']
        },
        {
          match: 'cholecystectomy',
          name: 'ERCP',
          defaultTiming: 'sameDay',
          timings: ['sameDay', 'tomorrow']
        }
      ]
    }
  },

  /**
   * Critical lab incidents — call MD within callWindowMins; callback always lands
   * inside that same window (immediate or delayed after the call).
   * After a delayed page: temporary “Dr will call back” toast; every recallEveryMins
   * without a callback, spawn a repeat urgent Call MD task.
   */
  criticalLabs: {
    callWindowMins: 60,
    callDurationMins: 5,
    callbackDurationMins: 8,
    recallEveryMins: 15,
    recallDurationMins: 5,
    awaitingToastMs: 4200,
    awaitingToastMessage: 'Dr will call back',
    maxPerShift: 5,
    immediateCallbackChance: 0.35,
    callbackDelayMins: { min: 5, max: 40 },
    labs: [
      {
        id: 'k-high',
        shortName: 'K+',
        fullName: 'Potassium',
        result: '6.8 mEq/L (critical high — risk of arrhythmia)',
        ordersHint: 'STAT ECG, hold K supplements / ACEI, insulin-dextrose + kayexalate per MD',
        callbackEffects: [
          {
            type: 'assessment',
            name: 'STAT 12-lead ECG (hyperkalemia)',
            durationMins: 10,
            expire: '+45',
            taskClass: 'stat'
          },
          {
            type: 'med',
            name: 'Insulin regular IV + D50W (K+ shift)',
            durationMins: 15,
            expire: '+60',
            taskClass: 'stat'
          }
        ]
      },
      {
        id: 'hh-drop',
        shortName: 'H/H',
        fullName: 'Hemoglobin / Hematocrit',
        result: 'Hgb 5.9 g/dL / Hct 17.8% (critical low)',
        ordersHint: 'Type & cross 2U PRBCs, hold anticoagulants, prepare transfusion',
        callbackEffects: [
          {
            type: 'assessment',
            name: 'Type & crossmatch 2 units PRBCs',
            durationMins: 12,
            expire: '+90',
            taskClass: 'stat'
          },
          {
            type: 'med',
            name: 'Transfuse PRBCs 1 unit',
            durationMins: 45,
            expire: '+180',
            taskClass: 'urgent'
          }
        ]
      },
      {
        id: 'blood-culture',
        shortName: 'Blood culture',
        fullName: 'Blood culture',
        result: 'Gram-positive cocci in clusters — prelim positive (likely Staph)',
        ordersHint: 'Start empiric vancomycin, source control, consider ID consult',
        callbackEffects: [
          {
            type: 'med',
            name: 'Vancomycin 1 g IV (new — blood culture +)',
            durationMins: 20,
            expire: '+120',
            taskClass: 'stat'
          },
          {
            type: 'assessment',
            name: 'Repeat blood cultures ×2 (different sites)',
            durationMins: 15,
            expire: '+90',
            taskClass: 'urgent'
          }
        ]
      },
      {
        id: 'troponin',
        shortName: 'Troponin',
        fullName: 'Troponin I',
        result: 'Troponin I 4.6 ng/mL (critical high — ACS range)',
        ordersHint: 'STAT ECG, continuous telemetry, NSTEMI pathway / cardiology',
        callbackEffects: [
          {
            type: 'assessment',
            name: 'STAT 12-lead ECG (troponin+)',
            durationMins: 10,
            expire: '+30',
            taskClass: 'stat'
          },
          {
            type: 'med',
            name: 'Aspirin 325 mg PO (chew) — ACS order',
            durationMins: 10,
            expire: '+45',
            taskClass: 'stat'
          }
        ]
      },
      {
        id: 'mag-low',
        shortName: 'Mg',
        fullName: 'Magnesium',
        result: '0.8 mg/dL (critical low — tetany / QT risk)',
        ordersHint: 'IV magnesium sulfate repletion, telemetry',
        callbackEffects: [
          {
            type: 'med',
            name: 'Magnesium sulfate 2 g IV',
            durationMins: 20,
            expire: '+90',
            taskClass: 'stat'
          }
        ]
      },
      {
        id: 'inr-high',
        shortName: 'INR',
        fullName: 'INR',
        result: '6.2 (critical high — bleeding risk)',
        ordersHint: 'Hold warfarin, assess bleeding, vitamin K ± FFP/PCC per MD',
        callbackEffects: [
          {
            type: 'med',
            name: 'Vitamin K 10 mg IV (supratherapeutic INR)',
            durationMins: 15,
            expire: '+60',
            taskClass: 'stat'
          },
          {
            type: 'assessment',
            name: 'Bleed check — puncture sites / guaiac',
            durationMins: 10,
            expire: '+45',
            taskClass: 'urgent'
          }
        ]
      },
      {
        id: 'abg-resp-acidosis',
        shortName: 'ABG',
        fullName: 'Arterial blood gas',
        result: 'pH 7.18 · PaCO₂ 68 mmHg · HCO₃ 26 mEq/L · PaO₂ 48 mmHg · SaO₂ 82% (acute respiratory acidosis + hypoxemia)',
        ordersHint: 'Support ventilation (BiPAP/RT), treat cause, repeat ABG after intervention',
        callbackEffects: [
          {
            type: 'assessment',
            name: 'RT / BiPAP setup — ABG respiratory failure',
            durationMins: 20,
            expire: '+45',
            taskClass: 'stat'
          },
          {
            type: 'assessment',
            name: 'Repeat ABG after vent support',
            durationMins: 10,
            expire: '+60',
            taskClass: 'urgent'
          }
        ]
      },
      {
        id: 'abg-met-acidosis',
        shortName: 'ABG',
        fullName: 'Arterial blood gas',
        result: 'pH 7.10 · PaCO₂ 22 mmHg · HCO₃ 8 mEq/L · PaO₂ 88 mmHg · base excess −22 (severe metabolic acidosis)',
        ordersHint: 'Treat underlying cause, fluids, consider bicarb only per MD, serial ABGs',
        callbackEffects: [
          {
            type: 'med',
            name: 'Sodium bicarbonate IV (MD-ordered)',
            durationMins: 15,
            expire: '+60',
            taskClass: 'stat'
          },
          {
            type: 'assessment',
            name: 'Repeat ABG + lactate after bicarb',
            durationMins: 10,
            expire: '+75',
            taskClass: 'urgent'
          }
        ]
      }
    ],
    /** Timed spawns (shift HHMM). patientId must be on census. */
    schedule: [
      { id: 'crit-k-joe-2015', at: 2015, labId: 'k-high', patientId: 'joe' },
      { id: 'crit-hh-maria-2145', at: 2145, labId: 'hh-drop', patientId: 'maria' },
      { id: 'crit-abg-robert-2215', at: 2215, labId: 'abg-resp-acidosis', patientId: 'robert' },
      { id: 'crit-bcx-aisha-2310', at: 2310, labId: 'blood-culture', patientId: 'aisha' },
      { id: 'crit-trop-derek-0030', at: 30, labId: 'troponin', patientId: 'derek' }
    ]
  },

  // Scoring hooks (E6.M1) — practice points, not competency claims
  scoring: {
    startingTotal: 100,
    tasks: {
      complete: 10,
      lateComplete: 2,
      overdue: -6,
      miss: -4
    },
    challenge: {
      pass: 5,
      fail: -8
    },
    satisfaction: {
      watch: -3,
      worsening: -8
    },
    // E6.M2 practice outcome bands (not competency grades)
    outcomes: {
      strong: { min: 110, id: 'strong-pacing', label: 'Strong practice pacing' },
      pass: { min: 90, id: 'on-track', label: 'On track — keep practicing' },
      needsPractice: { min: 70, id: 'needs-practice', label: 'Needs more practice' },
      overtimeRisk: { min: 0, id: 'overtime-risk', label: 'Overtime / miss risk framing' }
    }
  },

  /**
   * IV / drip panel + titration / Heparin PTT (practice framing).
   * Patient HTML authors lines via [data-iv-line]; iv-system syncs rates + spawns tasks.
   */
  iv: {
    heparinPttIntervalMins: 360,
    heparinAdjustStep: 2, // units/kg/hr practice step
    pressorAdjustStep: 2, // mcg/min practice step
    insulinAdjustStep: 1, // units/hr
    /** Timed BP / drip incidents (shift HHMM) — spawn titration tasks */
    titrationIncidents: [
      {
        id: 'bp-drop-maria-levophed',
        at: 2030,
        patientId: 'maria',
        drug: 'levophed',
        brand: 'norepinephrine',
        sbp: 78,
        direction: 'increase'
      },
      {
        id: 'bp-rise-maria-levophed',
        at: 2300,
        patientId: 'maria',
        drug: 'levophed',
        brand: 'norepinephrine',
        sbp: 162,
        direction: 'decrease'
      }
    ]
  },

  /**
   * Alarm / UI sound (Web Audio beeps — no media files).
   * Toggle persists in localStorage; master `enabledDefault` is the first-run default.
   */
  sound: {
    enabledDefault: true,
    storageKey: 'rngame.soundEnabled',
    selector: '#shell-sound-toggle'
  },

  /**
   * Nurse alerts — call lights (water, etc.) + bed near-fall alarms a few times / shift.
   * Plays sound.alarms on spawn when sound is enabled.
   */
  nurseAlerts: {
    callLights: {
      cadenceGameMinutes: 120,
      maxPerShift: 4,
      firstAfterGameMinutes: 45,
      templates: [
        {
          id: 'water',
          weight: 4,
          name: 'Call light — water',
          type: 'assessment',
          taskClass: 'urgent',
          durationMins: 8,
          expire: '+40',
          alarm: 'callLight'
        },
        {
          id: 'bathroom',
          weight: 2,
          name: 'Call light — bathroom assist',
          type: 'assessment',
          taskClass: 'urgent',
          durationMins: 12,
          expire: '+35',
          alarm: 'callLight'
        },
        {
          id: 'reposition',
          weight: 2,
          name: 'Call light — reposition / pillow',
          type: 'assessment',
          taskClass: 'urgent',
          durationMins: 10,
          expire: '+45',
          alarm: 'callLight'
        },
        {
          id: 'blanket',
          weight: 1,
          name: 'Call light — blanket / comfort',
          type: 'assessment',
          taskClass: 'routine',
          durationMins: 8,
          expire: '+50',
          alarm: 'callLight'
        }
      ]
    },
    bedAlarms: {
      cadenceGameMinutes: 180,
      maxPerShift: 2,
      firstAfterGameMinutes: 90,
      templates: [
        {
          id: 'bed-exit',
          weight: 3,
          name: 'Bed alarm — near fall',
          type: 'assessment',
          taskClass: 'stat',
          durationMins: 12,
          expire: '+25',
          alarm: 'bed'
        },
        {
          id: 'chair-exit',
          weight: 1,
          name: 'Chair alarm — standing attempt',
          type: 'assessment',
          taskClass: 'stat',
          durationMins: 12,
          expire: '+25',
          alarm: 'bed'
        }
      ]
    }
  },

  // Thin dynamic/urgent spawn (E3.M5) — game-time cadence, capped
  // (Call lights / bed alarms live in nurseAlerts so they stay a few times per shift.)
  dynamicTasks: {
    cadenceGameMinutes: 60,
    maxActive: 3,
    maxPerShift: 6,
    templates: [
      {
        id: 'pain-med',
        weight: 2,
        type: 'med',
        taskClass: 'urgent',
        name: 'PRN pain medication',
        durationMins: 10,
        expire: '+60',
        patientScope: 'random'
      },
      {
        id: 'family-update',
        weight: 1,
        type: 'assessment',
        taskClass: 'routine',
        name: 'Family update request',
        durationMins: 15,
        expire: '+90',
        patientScope: 'random'
      }
    ]
  },

  // Game-time event drip + richer deterioration (E4.M2 thin → E7.M3)
  events: {
    deterioration: {
      steps: ['stable', 'watch', 'worsening', 'critical'],
      // Overdue STAT/urgent can skip a step (complication pressure)
      skipStepOnStat: true,
      acuityDeltaPerBump: 1
    },
    codeBlueHook: {
      enabled: true,
      maxPerShift: 1,
      // Escalate when patient reaches this status (or worse)
      escalateAtStatus: 'critical'
    }
  },

  // Game states
  gameStates: {
    INITIALIZING: 'initializing',
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
  }
};

export default GameConfig; 