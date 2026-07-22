// game-config.js - Declarative game configuration
// Canonical timer defaults for the live app (app.js / timer_ingame.js).
// Note: game/app.config.js presets are NOT wired into app.js — treat as legacy/reference only.
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
      SYSTEM: 'system'
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
        color: 'purple'
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

  // Code Blue mini-game (E5.M4 Later) — random practice questions (+ optional order item)
  codeBlueChallenge: {
    steps: [
      { id: 'call', label: 'Activate Code Blue / call for help' },
      { id: 'cpr', label: 'Start high-quality chest compressions' },
      { id: 'defib', label: 'Attach defibrillator / AED pads' }
    ],
    distractors: [
      'Leave to finish charting first',
      'Wait for the physician to arrive before acting',
      'Give oral meds before calling for help'
    ],
    questions: [
      {
        id: 'unresponsive-first',
        type: 'choice',
        prompt: 'Adult found unresponsive with no pulse. What do you do first?',
        choices: [
          'Activate Code Blue / call for help and start CPR',
          'Run to the med room for epinephrine',
          'Finish charting the last set of vitals',
          'Wait for the physician before touching the patient'
        ],
        correct: 'Activate Code Blue / call for help and start CPR'
      },
      {
        id: 'compression-rate',
        type: 'choice',
        prompt: 'Target chest compression rate for adult CPR?',
        choices: ['60–80/min', '100–120/min', '140–160/min', 'As fast as possible'],
        correct: '100–120/min'
      },
      {
        id: 'compression-depth',
        type: 'choice',
        prompt: 'Adult chest compression depth target?',
        choices: ['About 1 inch', 'At least 2 inches (5 cm)', '4–5 inches', 'Whatever feels firm'],
        correct: 'At least 2 inches (5 cm)'
      },
      {
        id: 'aed-wet',
        type: 'choice',
        prompt: 'Patient is in water / chest is soaking wet before AED shock. Best action?',
        choices: [
          'Dry the chest quickly, then apply pads',
          'Shock through wet clothing immediately',
          'Skip AED and only do breaths',
          'Move pads to the abdomen'
        ],
        correct: 'Dry the chest quickly, then apply pads'
      },
      {
        id: 'pulse-check',
        type: 'choice',
        prompt: 'During CPR, pulse checks should be:',
        choices: [
          'Brief (≤10 seconds) and limited',
          'At least 30 seconds every cycle',
          'Continuous with fingers on the neck',
          'Skipped entirely once compressions start'
        ],
        correct: 'Brief (≤10 seconds) and limited'
      },
      {
        id: 'team-role',
        type: 'choice',
        prompt: 'When Code Blue arrives, the bedside nurse should typically:',
        choices: [
          'Hand off situation, stay to help / document as assigned',
          'Leave immediately to avoid crowding',
          'Take over airway from respiratory without handoff',
          'Stop all compressions until the team lead arrives'
        ],
        correct: 'Hand off situation, stay to help / document as assigned'
      },
      {
        id: 'bls-order',
        type: 'order',
        prompt: 'Order the first response priorities (1 → 3):'
      }
    ]
  },

  // Bed prep admission mini-game (E5.M3 Later)
  bedPrepChallenge: {
    hintViews: 3,
    flashMs: 700,
    sequence: [
      { letter: 'C', label: 'Chux' },
      { letter: 'S', label: 'Socks' },
      { letter: 'B', label: 'Thick blanket' },
      { letter: 'B', label: 'Bed sheet' },
      { letter: 'B', label: 'Pillowcase' },
      { letter: 'C', label: 'Clean gown' },
      { letter: 'L', label: 'Lifting sheet' }
    ],
    distractors: ['Think blanket', 'Extra towel', 'Trash bag', 'IV pole cover']
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
    main: '#shell-main',
    bottom: '#shell-bottom',
    statusBar: '#shell-status-bar',
    statusMessage: '#shell-status-message',
    awaitingCallbackToast: '#shell-awaiting-callback-toast',
    hourTabs: '#shell-hour-tabs',
    shiftHistoryLog: '#shift-history-log',
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
    scenarioPack: 'scenario'
  },

  /**
   * Dev / QA test mode — brand Test control opens a spawn-incident modal.
   * On/off is loaded from `configUrl` JSON (`enabled: true|false`). No URL query.
   */
  testMode: {
    configUrl: 'test-mode.json',
    /** Incident menu entries (handlers resolved in test-mode.js). */
    incidents: [
      {
        id: 'critical-lab',
        label: 'Critical lab',
        kind: 'critical-lab',
        /** When true, show per-lab submenu from GameConfig.criticalLabs.labs */
        expandLabs: true
      },
      {
        id: 'call-light',
        label: 'Call light (water / comfort)',
        kind: 'call-light'
      },
      {
        id: 'bed-alarm',
        label: 'Bed alarm — near fall',
        kind: 'bed-alarm'
      },
      {
        id: 'dynamic-urgent',
        label: 'Dynamic urgent (random)',
        kind: 'dynamic-urgent'
      }
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

  // Hourly check-doctor-orders (E4.M3)
  doctorOrders: {
    durationMins: 5,
    taskType: 'orders'
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
    maxPerShift: 4,
    immediateCallbackChance: 0.35,
    callbackDelayMins: { min: 5, max: 40 },
    labs: [
      {
        id: 'k-high',
        shortName: 'K+',
        fullName: 'Potassium',
        result: '6.2 mEq/L (critical high)',
        ordersHint: 'ECG, hold K supplements, notify MD — consider kayexalate / insulin-dextrose per protocol'
      },
      {
        id: 'hh-drop',
        shortName: 'H/H',
        fullName: 'Hemoglobin / Hematocrit',
        result: 'Hgb 6.8 / Hct 20.4 (critical low)',
        ordersHint: 'Type & cross, hold anticoagulants, prepare for possible transfusion'
      },
      {
        id: 'blood-culture',
        shortName: 'Blood culture',
        fullName: 'Blood culture',
        result: 'Gram-positive cocci in clusters (prelim positive)',
        ordersHint: 'Review antibiotics, source control, consider ID consult'
      },
      {
        id: 'troponin',
        shortName: 'Troponin',
        fullName: 'Troponin I',
        result: 'Elevated — critical',
        ordersHint: 'ECG, continuous telemetry, hold for cardiology callback orders'
      },
      {
        id: 'mag-low',
        shortName: 'Mg',
        fullName: 'Magnesium',
        result: '1.0 mg/dL (critical low)',
        ordersHint: 'IV magnesium repletion, telemetry if dysrhythmia risk'
      },
      {
        id: 'inr-high',
        shortName: 'INR',
        fullName: 'INR',
        result: '4.8 (critical high)',
        ordersHint: 'Hold warfarin, assess bleeding, vitamin K / FFP per MD'
      }
    ],
    /** Timed spawns (shift HHMM). patientId must be on census. */
    schedule: [
      { id: 'crit-k-joe-2015', at: 2015, labId: 'k-high', patientId: 'joe' },
      { id: 'crit-hh-maria-2145', at: 2145, labId: 'hh-drop', patientId: 'maria' },
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