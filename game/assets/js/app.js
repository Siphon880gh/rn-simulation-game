// app.js - Declarative Main Entry Point
import { GameConfig } from './game-config.js';
import gameState from './game-state.js'; 
import taskSystem from './task-system.js';
import GameTimerModule from './timer_ingame.js';
import ModalModule from './modal.js';
import PatientsModule from './patients.js';
import { timemarkPlusMinutes } from './timer_utils.js';
import ShellChromeModule from './shell-chrome.js';
import SlotSystem from './slot-system.js';
import DebriefModule from './debrief.js';
import ScenarioPackModule from './scenario-pack.js';
import EventDripModule from './event-drip.js';
import ChallengeGateModule from './challenge-gate.js';
import DoctorOrdersModule from './doctor-orders.js';
import DynamicTasksModule from './dynamic-tasks.js';
import ScoringModule from './scoring.js';
import SceneBackdropModule from './scene-backdrop.js';

// Declarative Application Configuration
const AppConfig = {
    modules: {
        modal: ModalModule,
        patients: PatientsModule,
        timer: GameTimerModule,
        tasks: taskSystem,
        shell: ShellChromeModule,
        slots: SlotSystem,
        debrief: DebriefModule,
        scenario: ScenarioPackModule,
        eventDrip: EventDripModule,
        challengeGate: ChallengeGateModule,
        doctorOrders: DoctorOrdersModule,
        dynamicTasks: DynamicTasksModule,
        scoring: ScoringModule,
        scene: SceneBackdropModule
    },
    
    urlParams: GameConfig.urlParams,

    // Single source of truth: GameConfig.timer (+ URL overrides in parseURLParameters)
    defaults: {
        speedFactor: GameConfig.timer.defaultSpeedFactor,
        shiftStarts: GameConfig.timer.defaultShiftStart,
        shiftDuration: GameConfig.timer.defaultShiftDuration
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
        const { modal, patients, timer, tasks, shell, slots, debrief, scenario, eventDrip, challengeGate, doctorOrders, dynamicTasks, scoring, scene } = this.config.modules;
        
        // Register modules
        this.modules.set('modal', modal);
        this.modules.set('patients', patients);
        this.modules.set('timer', timer);
        this.modules.set('tasks', tasks);
        this.modules.set('shell', shell);
        this.modules.set('slots', slots);
        this.modules.set('debrief', debrief);
        this.modules.set('scenario', scenario);
        this.modules.set('eventDrip', eventDrip);
        this.modules.set('challengeGate', challengeGate);
        this.modules.set('doctorOrders', doctorOrders);
        this.modules.set('dynamicTasks', dynamicTasks);
        this.modules.set('scoring', scoring);
        this.modules.set('scene', scene);

        if (slots && slots.init) {
            slots.init();
        }
        if (debrief && debrief.init) {
            debrief.init();
        }
        if (challengeGate && challengeGate.init) {
            challengeGate.init();
        }
        if (scoring && scoring.init) {
            scoring.init();
        }

        // E4.M1: load scenario pack before census so patient order comes from pack
        if (scenario && scenario.init) {
            await scenario.init();
        }

        // E7.M1: unit backdrop after pack (theme / optional image URL)
        if (scene && scene.init) {
            scene.init();
        }

        // Initialize patients (loads tasks)
        await patients.init();

        // E4.M2: game-time drip after census (subscribes to currentTime)
        if (eventDrip && eventDrip.init) {
            eventDrip.init();
        }
        
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
                taskSystem.syncWindowPhases(currentTime);
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
            selector: '[data-task-type="med"][data-status="active"], [data-task-type="orders"][data-status="active"], [data-task-type="assessment"][data-status="active"], [data-task-type="bedprep"][data-status="active"]',
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
                    duration: parseInt(element.getAttribute('data-duration-mins')) || 0,
                    status: element.getAttribute('data-status')
                };

                const now = gameState.getStateSlice('currentTime');
                const canPerform = taskSystem.isPerformAllowed(task, now);
                const phase = taskSystem.getWindowPhase(task, now);
                const isOrders = String(task.type).toLowerCase() === 'orders';
                
                return {
                    callback: (key, options) => {
                        this.handleTaskAction(key, task, element);
                    },
                    items: {
                        perform: {
                            name: !canPerform
                                ? `Perform (outside window: ${phase})`
                                : (isOrders ? 'Check orders' : 'Perform'),
                            icon: 'add',
                            disabled: !canPerform
                        },
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
                const kind = String(task.type).toLowerCase();
                if (kind === 'orders') {
                    this.performOrdersCheck(task);
                    return;
                }
                if (kind === 'assessment') {
                    this.performAssessmentTask(task);
                    return;
                }
                if (kind === 'bedprep') {
                    this.performBedPrepTask(task);
                    return;
                }
                console.log(`Performing medication: ${task.name}`);
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

    // E5.M3: bed prep — win mini-game required to complete (no slot on fail)
    async performBedPrepTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const challengeGate = this.modules.get('challengeGate');
        const outcome = challengeGate?.runChallengeGate
            ? await challengeGate.runChallengeGate(task)
            : { passed: false, reason: 'no-gate' };
        if (!outcome?.passed) {
            console.log(`Bed prep not completed (${outcome?.reason || 'fail'})`);
            return;
        }
        taskSystem.completeTask(task.id);
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Bed prep completed: ${task.name}`,
            timeLabel: String(now ?? '—')
        });
    }

    // E3.M5: assessment/dynamic perform — window gate → short slot (no med quiz)
    async performAssessmentTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const slotSystem = this.modules.get('slots');
        const result = slotSystem?.requestSlot(task, now);
        if (!result?.ok) {
            alert('Could not start or queue that task.');
        }
    }

    // E4.M3: hourly doctor-orders check — complete (no med challenge / no slot)
    async performOrdersCheck(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            const phase = taskSystem.getWindowPhase(task, now);
            alert(`Orders check not available (${phase}).`);
            return;
        }
        taskSystem.completeTask(task.id);
        const doctorOrders = this.modules.get('doctorOrders');
        const live = gameState.getStateSlice('tasks').get(task.id);
        doctorOrders?.handleOrdersCheckComplete?.(live || task);
    }

    // Handle medication task performance — window gate → challenge → slot/queue
    async performMedicationTask(task) {
        try {
            const slotSystem = this.modules.get('slots');
            const challengeGate = this.modules.get('challengeGate');
            const now = gameState.getStateSlice('currentTime');

            // E3.M3: availability window gates Perform
            if (!taskSystem.isPerformAllowed(task, now)) {
                const phase = taskSystem.getWindowPhase(task, now);
                alert(`Cannot perform outside the availability window (${phase}).`);
                return;
            }

            // E5.M1: modal challenge freezes shift timer; fail → no slot
            const outcome = challengeGate?.runChallengeGate
                ? await challengeGate.runChallengeGate(task)
                : { passed: true, reason: 'no-gate' };

            if (!outcome?.passed) {
                console.log(`Challenge not passed (${outcome?.reason || 'fail'}); task not slotted`);
                return;
            }

            const result = slotSystem?.requestSlot(task, gameState.getStateSlice('currentTime'));
            if (!result?.ok) {
                alert('Could not start or queue that task.');
                return;
            }

            if (result.queued) {
                console.log(`Medication ${task.name} queued (slots full)`);
            } else {
                console.log(`Medication ${task.name} started in a slot`);
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
        const pack = gameState.getStateSlice('scenarioPack');
        const params = new URLSearchParams(window.location.search);
        // E7.M3: pack may author shift window when URL does not override
        if (!params.get(this.config.urlParams.shiftStarts) && pack?.shiftStart != null) {
            gameConfig.shiftStarts = pack.shiftStart;
        }
        if (!params.get(this.config.urlParams.shiftDuration) && pack?.shiftDurationHours != null) {
            gameConfig.shiftDuration = pack.shiftDurationHours;
        }

        console.log('Starting game with config:', gameConfig);

        // Initialize game state
        gameState.dispatch('INITIALIZE_GAME', {
            startTime: gameConfig.shiftStarts
        });

        if (pack?.title) {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Scenario pack: ${pack.title}`,
                timeLabel: String(gameConfig.shiftStarts)
            });
        }

        // Lock shell chrome (hour tabs + history log) before the clock runs
        const shell = this.modules.get('shell');
        if (shell && shell.init) {
            shell.init(gameConfig);
        }

        // E4.M3: hourly doctor-orders checks (subscribes to currentTime)
        const doctorOrders = this.modules.get('doctorOrders');
        if (doctorOrders && doctorOrders.init) {
            doctorOrders.init(gameConfig);
        }

        // E3.M5: thin dynamic/urgent spawn (game-time cadence)
        const dynamicTasks = this.modules.get('dynamicTasks');
        if (dynamicTasks && dynamicTasks.init) {
            dynamicTasks.init(gameConfig);
        }

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

    // Handle game over (timer may already have dispatched GAME_OVER)
    handleGameOver() {
        if (gameState.getStateSlice('gameStatus') !== GameConfig.gameStates.GAME_OVER) {
            gameState.dispatch('GAME_OVER');
        }

        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: 'Shift ended — game over',
            timeLabel: 'end'
        });

        document.querySelector('#shell')?.classList.add('opacity-40');
        // E6.M0: thin prioritization debrief replaces bare game-over modal
        const debrief = this.modules.get('debrief');
        if (debrief?.showPrioritizationDebrief) {
            debrief.showPrioritizationDebrief();
        } else {
            ModalModule.openModal('gameOver');
        }
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