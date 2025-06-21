// app.js - Declarative Main Entry Point
import { GameConfig } from './game-config.js';
import gameState from './game-state.js'; 
import taskSystem from './task-system.js';
import GameTimerModule from './timer_ingame.js';
import ModalModule from './modal.js';
import PatientsModule from './patients.js';
import { timemarkPlusMinutes } from './timer_utils.js';

// Declarative Application Configuration
const AppConfig = {
    modules: {
        modal: ModalModule,
        patients: PatientsModule,
        timer: GameTimerModule,
        tasks: taskSystem
    },
    
    urlParams: {
        speedFactor: 'speed-factor',
        shiftStarts: 'shift-starts',
        shiftDuration: 'shift-duration'
    },

    defaults: {
        speedFactor: 1440,
        shiftStarts: 1900,
        shiftDuration: 60 * 12
    }
};

// Declarative Application Class
class GameApplication {
    constructor(config) {
        this.config = config;
        this.initialized = false;
        this.modules = new Map();
        
        // Bind methods
        this.handleGameOver = this.handleGameOver.bind(this);
    }

    // Declarative initialization pipeline
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            console.log('Initializing game application...');
            
            // Setup application state
            this.setupGlobalState();
            
            // Initialize modules in dependency order
            await this.initializeModules();
            
            // Setup UI event handlers
            this.setupUIHandlers();
            
            // Parse URL parameters and start game
            this.startGame();
            
            this.initialized = true;
            console.log('Game application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    // Setup global application state
    setupGlobalState() {
        // Subscribe to game state changes
        gameState.subscribe('gameStatus', (status, prevStatus) => {
            console.log(`Game status changed: ${prevStatus} -> ${status}`);
            this.handleGameStatusChange(status, prevStatus);
        });
    }

    // Initialize modules with dependency management
    async initializeModules() {
        const { modal, patients, timer, tasks } = this.config.modules;
        
        // Register modules
        this.modules.set('modal', modal);
        this.modules.set('patients', patients);
        this.modules.set('timer', timer);
        this.modules.set('tasks', tasks);

        // Initialize patients (loads tasks)
        await patients.init();
        
        // Setup task system listeners
        this.setupTaskSystemListeners();

        // Expose necessary globals for backward compatibility (after modules are initialized)
        this.exposeGlobals();

        console.log('All modules initialized');
    }

    // Setup task system event listeners
    setupTaskSystemListeners() {
        // Subscribe to time updates to process tasks
        gameState.subscribe('currentTime', (currentTime) => {
            if (currentTime) {
                taskSystem.processTasks(currentTime);
            }
        });
    }

    // Setup UI event handlers declaratively
    setupUIHandlers() {
        // Remove old jQuery liveQuery patterns and replace with declarative handlers
        this.setupTaskUIHandlers();
        this.setupDocumentHandlers();
    }

    // Setup task UI handlers declaratively
    setupTaskUIHandlers() {
        // Use event delegation for dynamic task elements
        document.addEventListener('click', (e) => {
            const taskElement = e.target.closest('[data-task-type]');
            if (!taskElement) return;

            const taskType = taskElement.getAttribute('data-task-type');
            const taskStatus = taskElement.getAttribute('data-status');
            
            if (taskStatus === GameConfig.tasks.statuses.ACTIVE) {
                this.handleTaskClick(taskElement, e);
            }
        });

        // Setup context menu for tasks
        this.setupTaskContextMenus();
    }

    // Setup task context menus declaratively
    setupTaskContextMenus() {
        const contextMenuConfig = {
            selector: '[data-task-type="med"][data-status="active"]',
            trigger: 'left',
            build: (triggerElement, e) => {
                const element = e.target.closest('[data-task-type]');
                if (!element || element.getAttribute('data-status') !== GameConfig.tasks.statuses.ACTIVE) {
                    return false;
                }

                const taskId = element.id;
                if (!taskId) {
                    console.warn('Task element has no ID:', element);
                    return false;
                }

                // Create a basic task object from DOM if not in state yet
                const task = gameState.getStateSlice('tasks').get(taskId) || {
                    id: taskId,
                    name: element.querySelector('.font-medium')?.textContent || 'Unknown Task',
                    type: element.getAttribute('data-task-type'),
                    scheduled: element.getAttribute('data-scheduled'),
                    expire: element.getAttribute('data-expire'),
                    duration: parseInt(element.getAttribute('data-duration-mins')) || 0
                };
                
                return {
                    callback: (key, options) => {
                        this.handleTaskAction(key, task, element);
                    },
                    items: {
                        perform: { name: "Perform", icon: "add" },
                        details: { name: 'Details', icon: 'question' }
                    }
                };
            }
        };

        // Apply context menu when jQuery is available
        if (window.$ && $.contextMenu) {
            $.contextMenu(contextMenuConfig);
        }
    }

    // Handle task actions declaratively
    handleTaskAction(action, task, element) {
        const actionHandlers = {
            perform: () => {
                console.log(`Performing medication: ${task.name}`);
                // Show confirmation and complete task
                this.performMedicationTask(task);
            },
            details: () => {
                const durationMins = task.duration;
                const expire = task.expire;
                alert(`Task is ${durationMins} mins long. Expires at ${expire}.`);
            }
        };

        const handler = actionHandlers[action];
        if (handler) {
            handler();
        } else {
            console.warn(`Unknown action: ${action}`);
        }
    }

    // Handle medication task performance
    async performMedicationTask(task) {
        try {
            // Show confirmation modal
            const confirmed = await ModalModule.showMedicationConfirmation(task.name);
            
            if (confirmed) {
                // Complete the task
                taskSystem.completeTask(task);
                console.log(`Medication ${task.name} administered successfully`);
            }
        } catch (error) {
            console.log('Medication administration cancelled');
        }
    }

    // Setup document-level handlers
    setupDocumentHandlers() {
        // Handle task clicks for collapsible sections
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="toggleClass"]')) {
                e.preventDefault();
                const targetElement = e.target.nextElementSibling;
                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                }
            }
        });
    }

    // Parse URL parameters declaratively
    parseURLParameters() {
        const params = new URLSearchParams(window.location.search);
        const config = { ...this.config.defaults };

        // Parse speed factor
        const speedFactor = params.get(this.config.urlParams.speedFactor);
        if (speedFactor) config.speedFactor = parseInt(speedFactor);

        // Parse shift start time
        const shiftStarts = params.get(this.config.urlParams.shiftStarts);
        if (shiftStarts) {
            const cleanTime = shiftStarts.replaceAll(':', '');
            config.shiftStarts = parseInt(cleanTime);
        }

        // Parse shift duration
        const shiftDuration = params.get(this.config.urlParams.shiftDuration);
        if (shiftDuration) config.shiftDuration = parseInt(shiftDuration);

        return config;
    }

    // Start the game with configuration
    startGame() {
        const gameConfig = this.parseURLParameters();
        
        console.log('Starting game with config:', gameConfig);

        // Initialize game state
        gameState.dispatch('INITIALIZE_GAME', {
            startTime: gameConfig.shiftStarts
        });

        // Start the timer
        const { start: timerStart } = this.modules.get('timer');
        timerStart(
            GameConfig.selectors.clock,
            GameConfig.selectors.pauseButton,
            gameConfig.speedFactor,
            gameConfig.shiftDuration,
            gameConfig.shiftStarts,
            this.handleGameOver
        );
    }

    // Handle game status changes
    handleGameStatusChange(status, prevStatus) {
        switch (status) {
            case GameConfig.gameStates.GAME_OVER:
                this.handleGameOver();
                break;
            case GameConfig.gameStates.PAUSED:
                console.log('Game paused');
                break;
            case GameConfig.gameStates.RUNNING:
                console.log('Game running');
                break;
        }
    }

    // Handle game over
    handleGameOver() {
        console.log('Game Over!');
        gameState.dispatch('GAME_OVER');
        
        // Show game over modal
        ModalModule.openModal('gameOver');
        
        // Add visual effect
        document.querySelector(".container")?.classList.add("opacity-40");
    }

    // Handle task clicks
    handleTaskClick(taskElement, event) {
        // This could be extended for different task types
        console.log('Task clicked:', taskElement.id);
    }

    // Expose necessary globals for backward compatibility
    exposeGlobals() {
        // Modal functions
        window.openModal = ModalModule.openModal;
        window.closeModal = ModalModule.closeModal;
        window.modifyModal = ModalModule.modifyModal;

        // Timer functions
        const timerModule = this.modules.get('timer');
        if (timerModule && timerModule.pollTime) {
            window.pollTime = timerModule.pollTime;
        }

        // Task system
        window.taskSystem = taskSystem;
    }

    // Public API
    getModule(name) {
        return this.modules.get(name);
    }

    getGameState() {
        return gameState.getState();
    }
}

// Initialize application
const app = new GameApplication(AppConfig);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Export for external access
export default app;