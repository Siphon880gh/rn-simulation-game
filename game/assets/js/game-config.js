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

  // Code Blue mini-game (E5.M4 Later) — thin BLS priority order
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
    hourTabs: '#shell-hour-tabs',
    shiftHistoryLog: '#shift-history-log',
    clock: '#clock',
    pauseButton: '#pause',
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

  // Thin dynamic/urgent spawn (E3.M5) — game-time cadence, capped
  dynamicTasks: {
    cadenceGameMinutes: 60,
    maxActive: 3,
    maxPerShift: 6,
    templates: [
      {
        id: 'call-light',
        weight: 3,
        type: 'assessment',
        taskClass: 'urgent',
        name: 'Call light',
        durationMins: 10,
        expire: '+45',
        patientScope: 'random'
      },
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