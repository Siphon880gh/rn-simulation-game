// game-config.js - Declarative game configuration
export const GameConfig = {
  // Timer configuration
  timer: {
    defaultSpeedFactor: 1440,
    defaultShiftStart: 1900,
    defaultShiftDuration: 60 * 12, // 12 hours in minutes
    pollInterval: 1000
  },

  // Task system configuration
  tasks: {
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
      }
    },
    statuses: {
      NOT_YET: 'not-yet',
      ACTIVE: 'active',
      COMPLETED: 'completed',
      OVERDUE: 'overdue'
    }
  },

  // UI selectors
  selectors: {
    clock: '#clock',
    pauseButton: '#pause',
    modal: '#modal',
    modalTitle: '#modal-title',
    modalContent: '#modal-content',
    modalFooter: '#modal-footer',
    patients: '#patients',
    revealScheduledTasks: '#reveal-scheduled-tasks'
  },

  // URL parameters mapping
  urlParams: {
    speedFactor: 'speed-factor',
    shiftStarts: 'shift-starts', 
    shiftDuration: 'shift-duration'
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