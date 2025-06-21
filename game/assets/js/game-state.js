// game-state.js - Declarative state management
import { GameConfig } from './game-config.js';

class GameState {
  constructor() {
    this.state = {
      gameStatus: GameConfig.gameStates.INITIALIZING,
      currentTime: null,
      isPaused: false,
      tasks: new Map(),
      patients: new Map(),
      scheduledEvents: new Map(),
      activeTasks: new Set()
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
      currentTime: payload.startTime
    }));

    this.actions.set('UPDATE_TIME', (payload) => ({
      ...this.state,
      currentTime: payload.time
    }));

    this.actions.set('TOGGLE_PAUSE', () => ({
      ...this.state,
      isPaused: !this.state.isPaused,
      gameStatus: this.state.isPaused ? GameConfig.gameStates.RUNNING : GameConfig.gameStates.PAUSED
    }));

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