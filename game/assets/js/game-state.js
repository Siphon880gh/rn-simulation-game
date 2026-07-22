// game-state.js - Declarative state management
import { GameConfig } from './game-config.js';

class GameState {
  constructor() {
    this.state = {
      gameStatus: GameConfig.gameStates.INITIALIZING,
      currentTime: null,
      isPaused: false,
      pauseSources: [],
      activeHourIndex: 0,
      activeHourHhmm: null,
      shiftLog: [],
      activePatientId: null,
      tasks: new Map(),
      patients: new Map(),
      scheduledEvents: new Map(),
      activeTasks: new Set(),
      slots: Array.from({ length: GameConfig.slots.count }, (_, index) => ({
        id: index,
        taskId: null,
        taskName: null,
        startedAt: null,
        endsAt: null,
        progress: 0
      })),
      slotQueue: [],
      scenarioPack: null,
      admitHold: null,
      /** E13: { department, mode, aides: [...] } — CCT/CNA availability */
      delegation: null,
      firedEvents: [],
      codeBlueHook: null,
      score: {
        total: 100,
        taskPoints: 0,
        challengePoints: 0,
        satisfactionPoints: 0,
        events: []
      }
    };
    
    this.subscribers = new Map();
    this.actions = new Map();
    
    this.setupActions();
  }

  // Declarative action definitions
  setupActions() {
    this.actions.set('INITIALIZE_GAME', (payload) => ({
      ...this.state,
      gameStatus: GameConfig.gameStates.RUNNING,
      currentTime: payload.startTime,
      isPaused: false,
      pauseSources: [],
      activeHourIndex: 0,
      activeHourHhmm: payload.startTime ?? null,
      shiftLog: [],
      slots: Array.from({ length: GameConfig.slots.count }, (_, index) => ({
        id: index,
        taskId: null,
        taskName: null,
        startedAt: null,
        endsAt: null,
        progress: 0
      })),
      slotQueue: [],
      delegation: null,
      score: {
        total: Number(GameConfig.scoring?.startingTotal) || 100,
        taskPoints: 0,
        challengePoints: 0,
        satisfactionPoints: 0,
        events: []
      }
    }));

    this.actions.set('UPDATE_TIME', (payload) => ({
      ...this.state,
      currentTime: payload.time
    }));

    // Explicit pause ownership — prefer SET_PAUSE over TOGGLE_PAUSE.
    this.actions.set('SET_PAUSE', (payload) => {
      const source = payload.source || GameConfig.timer.pauseSources.SYSTEM;
      const wantPaused = !!payload.paused;
      let sources = Array.isArray(this.state.pauseSources) ? [...this.state.pauseSources] : [];

      if (wantPaused) {
        if (!sources.includes(source)) sources.push(source);
      } else {
        sources = sources.filter((s) => s !== source);
      }

      const isPaused = sources.length > 0;
      const gameStatus =
        this.state.gameStatus === GameConfig.gameStates.GAME_OVER
          ? GameConfig.gameStates.GAME_OVER
          : isPaused
            ? GameConfig.gameStates.PAUSED
            : GameConfig.gameStates.RUNNING;

      return {
        ...this.state,
        pauseSources: sources,
        isPaused,
        gameStatus
      };
    });

    // User-button convenience: flips only the `user` pause source.
    this.actions.set('TOGGLE_PAUSE', () => {
      const user = GameConfig.timer.pauseSources.USER;
      const hasUser = this.state.pauseSources.includes(user);
      return this.actions.get('SET_PAUSE')({ paused: !hasUser, source: user });
    });

    this.actions.set('ACTIVATE_TASK', (payload) => {
      const newActiveTasks = new Set(this.state.activeTasks);
      newActiveTasks.add(payload.taskId);
      
      const newTasks = new Map(this.state.tasks);
      if (newTasks.has(payload.taskId)) {
        newTasks.set(payload.taskId, {
          ...newTasks.get(payload.taskId),
          status: GameConfig.tasks.statuses.ACTIVE
        });
      }

      return {
        ...this.state,
        activeTasks: newActiveTasks,
        tasks: newTasks
      };
    });

    this.actions.set('COMPLETE_TASK', (payload) => {
      const newActiveTasks = new Set(this.state.activeTasks);
      newActiveTasks.delete(payload.taskId);
      
      const newTasks = new Map(this.state.tasks);
      if (newTasks.has(payload.taskId)) {
        newTasks.set(payload.taskId, {
          ...newTasks.get(payload.taskId),
          status: GameConfig.tasks.statuses.COMPLETED
        });
      }

      return {
        ...this.state,
        activeTasks: newActiveTasks,
        tasks: newTasks
      };
    });

    this.actions.set('MARK_OVERDUE', (payload) => {
      const newTasks = new Map(this.state.tasks);
      if (newTasks.has(payload.taskId)) {
        newTasks.set(payload.taskId, {
          ...newTasks.get(payload.taskId),
          status: GameConfig.tasks.statuses.OVERDUE
        });
      }
      return {
        ...this.state,
        tasks: newTasks
      };
    });

    this.actions.set('REGISTER_TASK', (payload) => {
      const newTasks = new Map(this.state.tasks);
      newTasks.set(payload.task.id, payload.task);
      
      return {
        ...this.state,
        tasks: newTasks
      };
    });

    this.actions.set('REGISTER_PATIENT', (payload) => {
      const newPatients = new Map(this.state.patients);
      newPatients.set(payload.patient.id, payload.patient);
      
      return {
        ...this.state,
        patients: newPatients
      };
    });

    this.actions.set('ACTIVATE_SCHEDULED_TASKS', (payload) => {
      // This could be used to track which tasks are activated at specific times
      console.log(`Activating tasks scheduled for ${payload.time}`);
      return this.state; // No state change needed for now
    });

    this.actions.set('GAME_OVER', () => ({
      ...this.state,
      gameStatus: GameConfig.gameStates.GAME_OVER
    }));

    this.actions.set('SET_ACTIVE_HOUR', (payload) => ({
      ...this.state,
      activeHourIndex: Number(payload.hourIndex) || 0,
      activeHourHhmm: payload.hourHhmm ?? null
    }));

    this.actions.set('APPEND_SHIFT_LOG', (payload) => {
      const entry = {
        id: `log-${Date.now()}-${this.state.shiftLog.length}`,
        message: payload.message || '',
        timeLabel: payload.timeLabel || '—',
        at: Date.now()
      };
      return {
        ...this.state,
        shiftLog: [...this.state.shiftLog, entry]
      };
    });

    this.actions.set('SET_ACTIVE_PATIENT', (payload) => ({
      ...this.state,
      activePatientId: payload.patientId || null
    }));

    this.actions.set('SET_SCENARIO_PACK', (payload) => ({
      ...this.state,
      scenarioPack: payload.pack || null
    }));

    /** E9: held patient off census (minus1 / admitStart / admitMiddle / openAdmit) */
    this.actions.set('SET_ADMIT_HOLD', (payload) => ({
      ...this.state,
      admitHold: payload?.heldPatientId
        ? {
            heldPatientId: payload.heldPatientId,
            mode: payload.mode || 'minus1',
            admitAt: payload.admitAt ?? null,
            windowKey: payload.windowKey ?? null,
            spawned: Boolean(payload.spawned),
            findNurseAttempt: Number(payload.findNurseAttempt) || 0
          }
        : null
    }));

    this.actions.set('UPDATE_ADMIT_HOLD', (payload) => {
      if (!this.state.admitHold) return this.state;
      return {
        ...this.state,
        admitHold: { ...this.state.admitHold, ...(payload || {}) }
      };
    });

    this.actions.set('UPDATE_PATIENT', (payload) => {
      const patients = new Map(this.state.patients);
      const existing = patients.get(payload.patientId);
      if (!existing) return this.state;
      patients.set(payload.patientId, { ...existing, ...(payload.patch || {}) });
      return { ...this.state, patients };
    });

    /** Replace or set IV lines on a patient (fluids / IVPB / drips). */
    this.actions.set('REGISTER_IV_LINES', (payload) => {
      const patients = new Map(this.state.patients);
      const existing = patients.get(payload.patientId);
      if (!existing) return this.state;
      patients.set(payload.patientId, {
        ...existing,
        ivLines: Array.isArray(payload.lines) ? payload.lines : []
      });
      return { ...this.state, patients };
    });

    /** Patch one IV line by id (rate, status, lastPtt, nextPttAt, …). */
    this.actions.set('UPDATE_IV_LINE', (payload) => {
      const patients = new Map(this.state.patients);
      const existing = patients.get(payload.patientId);
      if (!existing || !Array.isArray(existing.ivLines)) return this.state;
      const lines = existing.ivLines.map((line) => (
        line.id === payload.lineId
          ? { ...line, ...(payload.patch || {}) }
          : line
      ));
      patients.set(payload.patientId, { ...existing, ivLines: lines });
      return { ...this.state, patients };
    });

    this.actions.set('MARK_EVENT_FIRED', (payload) => ({
      ...this.state,
      firedEvents: [
        ...this.state.firedEvents,
        {
          eventId: payload.eventId,
          at: payload.at,
          type: payload.type || 'unlock',
          message: payload.message || ''
        }
      ]
    }));

    this.actions.set('MARK_CODE_BLUE_HOOK', (payload) => ({
      ...this.state,
      codeBlueHook: {
        patientId: payload.patientId || null,
        at: this.state.currentTime,
        resolved: false,
        passed: null
      }
    }));

    this.actions.set('RESOLVE_CODE_BLUE', (payload) => {
      const prev = this.state.codeBlueHook || {};
      return {
        ...this.state,
        codeBlueHook: {
          ...prev,
          patientId: payload.patientId || prev.patientId || null,
          resolved: true,
          passed: Boolean(payload.passed),
          at: prev.at ?? this.state.currentTime
        }
      };
    });

    this.actions.set('RESET_SCORE', () => ({
      ...this.state,
      score: {
        total: Number(GameConfig.scoring?.startingTotal) || 100,
        taskPoints: 0,
        challengePoints: 0,
        satisfactionPoints: 0,
        events: []
      }
    }));

    this.actions.set('ADJUST_SCORE', (payload) => {
      const delta = Number(payload.delta) || 0;
      const dimension = payload.dimension || 'task';
      const prev = this.state.score || {
        total: Number(GameConfig.scoring?.startingTotal) || 100,
        taskPoints: 0,
        challengePoints: 0,
        satisfactionPoints: 0,
        events: []
      };
      const next = {
        ...prev,
        total: prev.total + delta,
        taskPoints: prev.taskPoints + (dimension === 'task' ? delta : 0),
        challengePoints: prev.challengePoints + (dimension === 'challenge' ? delta : 0),
        satisfactionPoints: prev.satisfactionPoints + (dimension === 'satisfaction' ? delta : 0),
        events: [
          ...prev.events,
          {
            delta,
            dimension,
            reason: payload.reason || '',
            at: this.state.currentTime,
            ts: Date.now()
          }
        ].slice(-40)
      };
      return { ...this.state, score: next };
    });

    this.actions.set('ASSIGN_SLOT', (payload) => {
      const slots = this.state.slots.map((slot) => ({ ...slot }));
      const free = slots.find((s) => !s.taskId);
      if (!free) return this.state;
      free.taskId = payload.taskId;
      free.taskName = payload.taskName || null;
      free.startedAt = payload.startedAt;
      free.endsAt = payload.endsAt;
      free.progress = 0;
      return { ...this.state, slots };
    });

    this.actions.set('UPDATE_SLOT_PROGRESS', (payload) => {
      const slots = this.state.slots.map((slot) => {
        if (slot.id !== payload.slotId) return slot;
        return { ...slot, progress: Math.max(0, Math.min(100, payload.progress || 0)) };
      });
      return { ...this.state, slots };
    });

    this.actions.set('RELEASE_SLOT', (payload) => {
      const slots = this.state.slots.map((slot) => {
        if (slot.id !== payload.slotId && slot.taskId !== payload.taskId) return slot;
        return {
          id: slot.id,
          taskId: null,
          taskName: null,
          startedAt: null,
          endsAt: null,
          progress: 0
        };
      });
      return { ...this.state, slots };
    });

    this.actions.set('ENQUEUE_SLOT_TASK', (payload) => {
      const queue = Array.isArray(this.state.slotQueue) ? [...this.state.slotQueue] : [];
      if (queue.some((item) => item.taskId === payload.taskId)) {
        return this.state;
      }
      queue.push({
        taskId: payload.taskId,
        taskName: payload.taskName || null,
        patientId: payload.patientId || null,
        enqueuedAt: payload.enqueuedAt ?? Date.now()
      });
      return { ...this.state, slotQueue: queue };
    });

    this.actions.set('DEQUEUE_SLOT_TASK', (payload = {}) => {
      const queue = Array.isArray(this.state.slotQueue) ? [...this.state.slotQueue] : [];
      if (!queue.length) return this.state;
      if (payload.taskId) {
        return {
          ...this.state,
          slotQueue: queue.filter((item) => item.taskId !== payload.taskId)
        };
      }
      queue.shift();
      return { ...this.state, slotQueue: queue };
    });

    this.actions.set('SET_DELEGATION', (payload = {}) => ({
      ...this.state,
      delegation: payload.delegation ?? null
    }));

    this.actions.set('SET_DELEGATE_SELECTION', (payload = {}) => {
      if (!this.state.delegation) return this.state;
      const aideId = payload.aideId == null ? null : String(payload.aideId);
      if (this.state.delegation.selectedAideId === aideId) return this.state;
      return {
        ...this.state,
        delegation: {
          ...this.state.delegation,
          selectedAideId: aideId
        }
      };
    });
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(key)) {
        this.subscribers.get(key).delete(callback);
      }
    };
  }

  // Dispatch actions declaratively
  dispatch(actionType, payload = {}) {
    const actionHandler = this.actions.get(actionType);
    if (!actionHandler) {
      console.warn(`Action ${actionType} not found`);
      return;
    }

    const newState = actionHandler(payload);
    const oldState = this.state;
    this.state = newState;

    // Notify subscribers of state changes
    this.notifySubscribers(oldState, newState);
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Get specific state slice
  getStateSlice(key) {
    return this.state[key];
  }

  // Notify subscribers of changes
  notifySubscribers(oldState, newState) {
    // Check for changes and notify relevant subscribers
    Object.keys(newState).forEach(key => {
      if (oldState[key] !== newState[key] && this.subscribers.has(key)) {
        this.subscribers.get(key).forEach(callback => {
          callback(newState[key], oldState[key]);
        });
      }
    });

    // Notify general state subscribers
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(callback => {
        callback(newState, oldState);
      });
    }
  }
}

// Singleton instance
export const gameState = new GameState();
export default gameState; 