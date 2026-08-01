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
import { canEnterSlot } from './slot-constraints.js';
import DebriefModule from './debrief.js';
import ScenarioPackModule from './scenario-pack.js';
import EventDripModule from './event-drip.js';
import ChallengeGateModule from './challenge-gate.js';
import DoctorOrdersModule from './doctor-orders.js';
import DynamicTasksModule from './dynamic-tasks.js';
import ScoringModule from './scoring.js';
import SceneBackdropModule from './scene-backdrop.js';
import MediaPlaceholdersModule from './media-placeholders.js';
import IvSystemModule from './iv-system.js';
import CriticalLabsModule from './critical-labs.js';
import AlteplaseSystemModule, {
    applyPiccAssessRoll,
    applyPiccRestoreRoll,
    focusPiccClotDependents
} from './alteplase-system.js';
import TestModeModule from './test-mode.js';
import SoundModule from './sound.js';
import NurseAlertsModule from './nurse-alerts.js';
import AdmissionSystemModule from './admission-system.js';
import RightMenuModule from './right-menu.js';
import DelegationModule, {
    findAvailableAideForPatient,
    isTurnCareTask,
    withTeamAssist,
    formatAideLabel,
    getSelectedAide,
    canAidePerformTask,
    showDelegateHint,
    modeConfig
} from './delegation.js';
import SkillFocusModule from './skill-focus.js';
import BoostersModule from './boosters.js';
import { setShiftAnchor } from './availability-windows.js';
import {
    isAccucheckTask,
    applyFingerStickResult,
    initFingerStickDiceUi
} from './challenges/skills/accucheck/challenge.js';
import {
    isAlteplaseTask,
    getAlteplasePhase,
    initAlteplaseDiceUi
} from './challenges/skills/alteplase/challenge.js';

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
        mediaPlaceholders: MediaPlaceholdersModule,
        scene: SceneBackdropModule,
        iv: IvSystemModule,
        criticalLabs: CriticalLabsModule,
        alteplase: AlteplaseSystemModule,
        testMode: TestModeModule,
        sound: SoundModule,
        nurseAlerts: NurseAlertsModule,
        admission: AdmissionSystemModule,
        rightMenu: RightMenuModule,
        delegation: DelegationModule,
        skillFocus: SkillFocusModule,
        boosters: BoostersModule
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
        const { modal, patients, timer, tasks, shell, slots, debrief, scenario, eventDrip, challengeGate, doctorOrders, dynamicTasks, scoring, mediaPlaceholders, scene, iv, criticalLabs, alteplase, testMode, sound, nurseAlerts, admission, rightMenu, delegation, skillFocus, boosters } = this.config.modules;
        
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
        this.modules.set('mediaPlaceholders', mediaPlaceholders);
        this.modules.set('scene', scene);
        this.modules.set('iv', iv);
        this.modules.set('criticalLabs', criticalLabs);
        this.modules.set('alteplase', alteplase);
        this.modules.set('testMode', testMode);
        this.modules.set('sound', sound);
        this.modules.set('nurseAlerts', nurseAlerts);
        this.modules.set('admission', admission);
        this.modules.set('rightMenu', rightMenu);
        this.modules.set('delegation', delegation);
        this.modules.set('skillFocus', skillFocus);
        this.modules.set('boosters', boosters);

        if (slots && slots.init) {
            slots.init();
        }
        if (boosters && boosters.init) {
            boosters.init({ timer, slots });
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
        if (iv && iv.init) {
            iv.init();
        }
        if (criticalLabs && criticalLabs.init) {
            criticalLabs.init();
        }
        if (alteplase && alteplase.init) {
            alteplase.init();
        }
        if (sound && sound.init) {
            sound.init();
        }

        // E4.M1: load scenario pack before census so patient order comes from pack
        if (scenario && scenario.init) {
            await scenario.init();
        }

        // Placeholder media catalog → situation still URLs before scene/challenges
        if (mediaPlaceholders && mediaPlaceholders.init) {
            await mediaPlaceholders.init();
        }

        // E7.M1: unit backdrop after pack (theme / optional image URL)
        if (scene && scene.init) {
            scene.init();
        }

        // Initialize patients (loads tasks)
        await patients.init();
        initFingerStickDiceUi();
        initAlteplaseDiceUi();

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
        // E13: when a CNA/CCT is selected, capture task clicks for delegate modes
        document.addEventListener('click', (e) => {
            if (e.target.closest?.('[data-finger-stick-dice], [data-orders-trivial-dice], [data-picc-patency-dice]')) return;
            const aide = getSelectedAide();
            if (!aide) return;
            const taskElement = e.target.closest('[data-task-type]');
            if (!taskElement?.id) return;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            this.handleDelegateTaskClick(taskElement, aide);
        }, true);

        // Use event delegation for dynamic task elements
        document.addEventListener('click', (e) => {
            if (getSelectedAide()) return;
            // Dice odds controls own their click (Accucheck + orders trivial + PICC patency)
            if (e.target.closest?.('[data-finger-stick-dice], [data-orders-trivial-dice], [data-picc-patency-dice]')) return;
            const taskElement = e.target.closest('[data-task-type]');
            if (!taskElement) return;

            const taskStatus = taskElement.getAttribute('data-status');
            
            if (taskStatus === GameConfig.tasks.statuses.ACTIVE) {
                this.handleTaskClick(taskElement, e);
            }
        });

        // Setup context menu for tasks
        this.setupTaskContextMenus();
    }

    /** E13: click task while aide selected — team (½) / solo (instant) / soft deny */
    handleDelegateTaskClick(taskElement, aide) {
        const taskId = taskElement.id;
        const task = gameState.getStateSlice('tasks').get(taskId);
        if (!task) {
            showDelegateHint('Task not ready');
            return;
        }
        const slotState = SlotSystem.getTaskSlotState(taskId);
        if (slotState === 'busy') {
            showDelegateHint('That task is already in a slot');
            return;
        }
        if (slotState === 'queued') {
            showDelegateHint('That task is already waiting in the queue');
            return;
        }
        const now = gameState.getStateSlice('currentTime');
        const check = canAidePerformTask(aide, task, now);
        if (!check.ok) {
            const who = formatAideLabel(aide);
            const hints = {
                'wrong-patient': `${who} is not assigned to this patient`,
                'not-active': 'That task is not available yet',
                'in-progress': 'That task is already in a slot or queue',
                'not-delegable': `${who} can't perform this task`,
                'wrong-type': `${who} can't perform this task`,
                'aide-unavailable': `${who} is not available right now`
            };
            showDelegateHint(hints[check.reason] || `${who} can't perform this task`);
            return;
        }
        if (check.mode === 'solo') {
            this.performDelegatedSolo(task, aide);
            return;
        }
        if (check.mode === 'team') {
            this.performAssessmentTask(task, { assist: true, aide });
        }
    }

    performDelegatedSolo(task, aide) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            showDelegateHint('Task is outside its time window');
            return;
        }
        const mode = modeConfig('solo');
        taskSystem.completeTask(task.id);
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `${formatAideLabel(aide)} completed ${task.name} (${mode?.label || 'CNA completes'})`,
            timeLabel: String(now ?? '—')
        });
        showDelegateHint(`${formatAideLabel(aide)} finished it · instant`);
    }

    // Setup task context menus declaratively
    setupTaskContextMenus() {
        const contextMenuConfig = {
            selector: '[data-task-type="med"][data-status="active"], [data-task-type="orders"][data-status="active"], [data-task-type="assessment"][data-status="active"], [data-task-type="bedprep"][data-status="active"], [data-task-type="iv"][data-status="active"], [data-task-type="criticallab"][data-status="active"], [data-task-type="admission"][data-status="active"]',
            trigger: 'left',
            build: (triggerElement, e) => {
                // Leave Accucheck / orders dice clicks alone (odds popover, not Perform)
                if (e?.target?.closest?.('[data-finger-stick-dice], [data-orders-trivial-dice], [data-picc-patency-dice]')) {
                    return false;
                }
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
                const challenge = element.getAttribute('data-challenge');
                const task = gameState.getStateSlice('tasks').get(taskId) || {
                    id: taskId,
                    name: element.querySelector('.font-medium')?.textContent || 'Unknown Task',
                    type: element.getAttribute('data-task-type'),
                    scheduled: element.getAttribute('data-scheduled'),
                    expire: element.getAttribute('data-expire'),
                    duration: parseInt(element.getAttribute('data-duration-mins')) || 0,
                    status: element.getAttribute('data-status'),
                    metadata: challenge ? { challenge } : {}
                };

                const now = gameState.getStateSlice('currentTime');
                const prereqMet = taskSystem.isPrerequisiteMet
                    ? taskSystem.isPrerequisiteMet(task)
                    : true;
                const slotState = SlotSystem.getTaskSlotState(taskId);
                const occupied = Boolean(slotState);
                const windowOk = taskSystem.isPerformAllowed(task, now);
                const slotGate = occupied
                    ? { ok: true }
                    : (SlotSystem.canAcceptTask?.(task) || canEnterSlot(task));
                const canPerform = windowOk && !occupied && slotGate.ok !== false;
                const phase = taskSystem.getWindowPhase(task, now);
                const kind = String(task.type).toLowerCase();
                const metaKind = String(task.metadata?.kind || '').toLowerCase();
                const isOrders = kind === 'orders';
                const isCritCall = kind === 'criticallab'
                    && (task.metadata?.phase === 'call' || task.metadata?.phase === 'recall'
                        || task.metadata?.kind === 'critical-lab-call'
                        || task.metadata?.kind === 'critical-lab-recall');
                const isCritCb = kind === 'criticallab' && task.metadata?.phase === 'callback';
                const isAdmitFind = kind === 'admission' && task.metadata?.phase === 'findNurse';
                const isAdmitCall = kind === 'admission'
                    && (task.metadata?.phase === 'call' || task.metadata?.kind === 'admission-call');
                const isAdmitRecall = kind === 'admission'
                    && (task.metadata?.phase === 'recall' || task.metadata?.kind === 'admission-recall');
                const isAdmitCb = kind === 'admission' && task.metadata?.phase === 'callback';
                let performName = 'Perform';
                if (isOrders) performName = 'Check orders';
                if (isCritCall) {
                    performName = task.metadata?.phase === 'recall'
                        || task.metadata?.kind === 'critical-lab-recall'
                        ? 'Call doctor again'
                        : 'Call doctor';
                }
                if (isCritCb) performName = 'Take callback';
                if (isAdmitFind) performName = 'Look for second nurse';
                if (isAdmitCall) performName = 'Call admitting';
                if (isAdmitRecall) performName = 'Call admitting again';
                if (isAdmitCb) performName = 'Take admitting callback';
                if (metaKind === 'shift-assessment') performName = 'Assess (skill check)';
                if (metaKind === 'chart-assessment') performName = 'Chart assessment';

                let performLabel = performName;
                if (occupied) {
                    performLabel = slotState === 'queued'
                        ? `${performName} (already queued)`
                        : `${performName} (in progress)`;
                } else if (!prereqMet) {
                    performLabel = 'Perform (complete shift assessment first)';
                } else if (!windowOk) {
                    performLabel = `Perform (outside window: ${phase})`;
                } else if (slotGate.ok === false) {
                    performLabel = `${performName} (blocked)`;
                }

                const items = {
                    perform: {
                        name: performLabel,
                        icon: 'add',
                        disabled: !canPerform
                    },
                    details: { name: 'Details', icon: 'question' }
                };

                // E13: team/solo when an available aide can perform (call lights = floor CNA only)
                if (canPerform && task.patientId) {
                    const aide = findAvailableAideForPatient(task.patientId, now);
                    if (aide) {
                        const check = canAidePerformTask(aide, task, now);
                        if (check.ok && check.mode === 'team') {
                            const label = modeConfig('team')?.shortLabel || 'Team · ½ time';
                            items.assistTurn = {
                                name: `${label} with ${formatAideLabel(aide)}`,
                                icon: 'add'
                            };
                        }
                        if (check.ok && check.mode === 'solo') {
                            const label = modeConfig('solo')?.shortLabel || 'CNA does this · instant';
                            items.delegateSolo = {
                                name: `${label} — ${formatAideLabel(aide)}`,
                                icon: 'add'
                            };
                        }
                    }
                }

                return {
                    callback: (key, options) => {
                        this.handleTaskAction(key, task, element);
                    },
                    items
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
        const occupiedBlock = () => {
            const slotState = SlotSystem.getTaskSlotState(task?.id);
            if (!slotState) return false;
            const msg = slotState === 'queued'
                ? 'That task is already waiting in the queue.'
                : 'That task is already in progress in a slot.';
            alert(msg);
            return true;
        };

        const actionHandlers = {
            perform: () => {
                if (occupiedBlock()) return;
                const kind = String(task.type).toLowerCase();
                if (kind === 'orders') {
                    this.performOrdersCheck(task);
                    return;
                }
                if (kind === 'assessment') {
                    this.performAssessmentTask(task, { assist: false });
                    return;
                }
                if (kind === 'bedprep') {
                    this.performBedPrepTask(task);
                    return;
                }
                if (kind === 'iv') {
                    this.performIvTask(task);
                    return;
                }
                if (kind === 'criticallab') {
                    this.performCriticalLabTask(task);
                    return;
                }
                if (kind === 'admission') {
                    this.performAdmissionTask(task);
                    return;
                }
                console.log(`Performing medication: ${task.name}`);
                this.performMedicationTask(task);
            },
            assistTurn: () => {
                if (occupiedBlock()) return;
                this.performAssessmentTask(task, { assist: true });
            },
            delegateSolo: () => {
                if (occupiedBlock()) return;
                const aide = findAvailableAideForPatient(task.patientId);
                if (!aide) {
                    showDelegateHint('No aide available for this patient right now');
                    return;
                }
                const check = canAidePerformTask(aide, task);
                if (!check.ok || check.mode !== 'solo') {
                    showDelegateHint(`${formatAideLabel(aide)} can't perform this task`);
                    return;
                }
                this.performDelegatedSolo(task, aide);
            },
            details: () => {
                const durationMins = task.duration;
                const expire = task.expire;
                let msg = `Task is ${durationMins} mins long. Expires at ${expire}.`;
                const occupied = SlotSystem.getTaskSlotState(task?.id);
                if (occupied === 'busy') {
                    msg += ' Already in progress in a queue slot.';
                } else if (occupied === 'queued') {
                    msg += ' Already waiting in the queue.';
                } else {
                    const gate = SlotSystem.canAcceptTask?.(task) || canEnterSlot(task);
                    if (gate?.ok === false && gate.message) {
                        const reason = String(gate.message).trim().replace(/\.$/, '');
                        msg += ` ${reason}.`;
                    }
                }
                alert(msg);
            }
        };

        const handler = actionHandlers[action];
        if (handler) {
            handler();
        } else {
            console.warn(`Unknown action: ${action}`);
        }
    }

    // IV drip check / titration / Heparin PTT — challenge then slot
    async performIvTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const challengeGate = this.modules.get('challengeGate');
        const slotSystem = this.modules.get('slots');
        const outcome = challengeGate?.runChallengeGate
            ? await challengeGate.runChallengeGate(task)
            : { passed: false, reason: 'no-gate' };
        if (!outcome?.passed) {
            console.log(`IV challenge not passed (${outcome?.reason || 'fail'})`);
            return;
        }
        const result = slotSystem?.requestSlot(task, gameState.getStateSlice('currentTime'));
        if (!result?.ok) {
            alert(result?.message || 'Could not start or queue that IV task.');
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

    // Alteplase / Cathflo PICC: patency dice → patent quiz or clotted incident + MD order flow
    async performAlteplaseTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const phase = getAlteplasePhase(task);
        const kind = String(task.metadata?.kind || '').toLowerCase();

        if (kind === 'picc-clotted-incident' || phase === 'incident') {
            focusPiccClotDependents(task);
            return;
        }

        if (phase === 'assess') {
            const roll = applyPiccAssessRoll(task, { now });
            if (roll.skipQuiz) {
                taskSystem.completeTask(task.id);
                return;
            }
            const challengeGate = this.modules.get('challengeGate');
            const outcome = challengeGate?.runChallengeGate
                ? await challengeGate.runChallengeGate(task)
                : { passed: false, reason: 'no-gate' };
            if (!outcome?.passed) return;
            const slotSystem = this.modules.get('slots');
            const result = slotSystem?.requestSlot(task, gameState.getStateSlice('currentTime'));
            if (!result?.ok) {
                alert(result?.message || 'Could not start or queue that task.');
            }
            return;
        }

        if (phase === 'reassess-30' || phase === 'reassess-120') {
            applyPiccRestoreRoll(task, { now, phase });
            taskSystem.completeTask(task.id);
            return;
        }

        if (phase === 'dwell-30' || phase === 'dwell-120') {
            const slotGate = SlotSystem.canAcceptTask?.(task) || canEnterSlot(task);
            if (slotGate?.ok === false) {
                alert(slotGate.message || 'Cannot start that task in the queue slots right now.');
                return;
            }
            const slotSystem = this.modules.get('slots');
            const result = slotSystem?.requestSlot(task, now);
            if (!result?.ok) {
                alert(result?.message || 'Could not start or queue that dwell.');
            }
            return;
        }

        // admin / aspirate / focus (skill practice): quiz then slot
        const slotGate = SlotSystem.canAcceptTask?.(task) || canEnterSlot(task);
        if (slotGate?.ok === false) {
            alert(slotGate.message || 'Cannot start that task in the queue slots right now.');
            return;
        }
        const challengeGate = this.modules.get('challengeGate');
        const outcome = challengeGate?.runChallengeGate
            ? await challengeGate.runChallengeGate(task)
            : { passed: false, reason: 'no-gate' };
        if (!outcome?.passed) return;
        const slotSystem = this.modules.get('slots');
        const result = slotSystem?.requestSlot(task, gameState.getStateSlice('currentTime'));
        if (!result?.ok) {
            alert(result?.message || 'Could not start or queue that task.');
        }
    }

    // E3.M5: assessment/dynamic perform — window gate → optional challenge → slot
    // Shift assessment: random physical-assessment skill-mcq, then slot.
    // Chart assessment: unlocked only after shift assessment completes (15 min slot).
    // E13: opts.assist → team effort with CCT/CNA at half duration
    async performAssessmentTask(task, opts = {}) {
        if (isAlteplaseTask(task) || task.metadata?.kind === 'picc-clotted-incident') {
            await this.performAlteplaseTask(task);
            return;
        }
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPrerequisiteMet?.(task)) {
            alert('Complete the bedside shift assessment first, then chart.');
            return;
        }
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const slotGate = SlotSystem.canAcceptTask?.(task) || canEnterSlot(task);
        if (slotGate?.ok === false) {
            alert(slotGate.message || 'Cannot start that task in the queue slots right now.');
            return;
        }

        const kind = String(task.metadata?.kind || '').toLowerCase();
        const challengeId = String(task.metadata?.challenge || '').toLowerCase();
        const needsChallenge = kind === 'shift-assessment'
            || Boolean(challengeId);

        if (needsChallenge && !opts.assist) {
            let gateTask = task;
            if (kind === 'shift-assessment') {
                const pool = Array.isArray(task.metadata?.skillPool) && task.metadata.skillPool.length
                    ? task.metadata.skillPool
                    : (GameConfig.shiftAssessment?.assessmentSkillIds || []);
                const skillId = pool[Math.floor(Math.random() * pool.length)] || pool[0];
                if (!skillId) {
                    alert('No assessment skills configured.');
                    return;
                }
                gateTask = {
                    ...task,
                    metadata: {
                        ...task.metadata,
                        challenge: 'skill-mcq',
                        skillId
                    }
                };
            }
            const challengeGate = this.modules.get('challengeGate');
            const outcome = challengeGate?.runChallengeGate
                ? await challengeGate.runChallengeGate(gateTask)
                : { passed: false, reason: 'no-gate' };
            if (!outcome?.passed) {
                console.log(`Assessment challenge not passed (${outcome?.reason || 'fail'})`);
                return;
            }
        }

        let workTask = task;
        if (opts.assist && isTurnCareTask(task) && task.patientId) {
            const aide = opts.aide || findAvailableAideForPatient(task.patientId, now);
            if (!aide) {
                showDelegateHint('No assist available for this patient right now');
                return;
            }
            const check = canAidePerformTask(aide, task, now);
            if (!check.ok || check.mode !== 'team') {
                showDelegateHint(`${formatAideLabel(aide)} can't team on this task`);
                return;
            }
            workTask = withTeamAssist(task, aide);
            const teamLabel = modeConfig('team')?.label || 'Team effort';
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `${teamLabel}: turn with ${formatAideLabel(aide)} (½ time)`,
                timeLabel: String(now ?? '—')
            });
            showDelegateHint(`${teamLabel} · ½ time with ${formatAideLabel(aide)}`);
        }
        const slotSystem = this.modules.get('slots');
        const result = slotSystem?.requestSlot(workTask, now);
        if (!result?.ok) {
            alert(result?.message || 'Could not start or queue that task.');
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

    // E9: admission checklist — quizzes, find-nurse, admitting call/callback
    async performAdmissionTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const admission = this.modules.get('admission');
        const phase = task.metadata?.phase;
        const kind = task.metadata?.kind;

        if (phase === 'findNurse') {
            admission?.handleFindNursePerform?.(task, { now });
            return;
        }

        if (phase === 'recall' || kind === 'admission-recall') {
            taskSystem.completeTask(task.id);
            const live = gameState.getStateSlice('tasks')?.get(task.id) || task;
            admission?.handleAdmissionRecallComplete?.(live, { now });
            return;
        }

        if (phase === 'callback' || kind === 'admission-callback') {
            const slotSystem = this.modules.get('slots');
            const result = slotSystem?.requestSlot(task, now);
            if (!result?.ok) {
                alert(result?.message || 'Could not start or queue the admitting callback.');
            }
            return;
        }

        if (phase === 'consult') {
            taskSystem.completeTask(task.id);
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Consult placed: ${task.name}`,
                timeLabel: String(now ?? '—')
            });
            return;
        }

        const challengeGate = this.modules.get('challengeGate');
        const outcome = challengeGate?.runChallengeGate
            ? await challengeGate.runChallengeGate(task)
            : { passed: false, reason: 'no-gate' };
        if (!outcome?.passed) {
            console.log(`Admission challenge not passed (${outcome?.reason || 'fail'})`);
            return;
        }

        taskSystem.completeTask(task.id);
        const live = gameState.getStateSlice('tasks')?.get(task.id) || task;
        if (phase === 'call' || kind === 'admission-call' || live.metadata?.challenge === 'callAdmitting') {
            admission?.handleAdmissionCallComplete?.(live, { now });
        } else {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Admission step done: ${task.name}`,
                timeLabel: String(now ?? '—')
            });
        }
    }

    // Critical lab: call MD (complete + schedule callback) or take callback (slot)
    async performCriticalLabTask(task) {
        const now = gameState.getStateSlice('currentTime');
        if (!taskSystem.isPerformAllowed(task, now)) {
            alert(`Cannot perform outside the availability window (${taskSystem.getWindowPhase(task, now)}).`);
            return;
        }
        const criticalLabs = this.modules.get('criticalLabs');
        const phase = task.metadata?.phase || task.metadata?.kind;
        if (phase === 'call' || task.metadata?.kind === 'critical-lab-call') {
            taskSystem.completeTask(task.id);
            const live = gameState.getStateSlice('tasks')?.get(task.id) || task;
            criticalLabs?.handleCriticalLabCallComplete?.(live, { now });
            return;
        }
        if (phase === 'recall' || task.metadata?.kind === 'critical-lab-recall') {
            taskSystem.completeTask(task.id);
            const live = gameState.getStateSlice('tasks')?.get(task.id) || task;
            criticalLabs?.handleCriticalLabRecallComplete?.(live, { now });
            return;
        }
        // MD callback — occupy a slot while taking orders
        const slotSystem = this.modules.get('slots');
        const result = slotSystem?.requestSlot(task, now);
        if (!result?.ok) {
            alert(result?.message || 'Could not start or queue the doctor callback.');
        }
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

            let liveTask = gameState.getStateSlice('tasks')?.get(task.id) || task;
            let skipChallenge = false;
            if (isAccucheckTask(liveTask)) {
                const stick = applyFingerStickResult(liveTask);
                liveTask = gameState.getStateSlice('tasks')?.get(task.id) || liveTask;
                skipChallenge = Boolean(stick?.skipSlidingScale);
            }

            // E5.M1: modal challenge freezes shift timer; fail → no slot
            // Critical finger-stick skips sliding scale (Call MD task already spawned).
            let outcome = { passed: true, reason: 'no-gate' };
            if (!skipChallenge) {
                outcome = challengeGate?.runChallengeGate
                    ? await challengeGate.runChallengeGate(liveTask)
                    : { passed: true, reason: 'no-gate' };
            } else {
                outcome = { passed: true, reason: 'finger-stick-critical' };
            }

            if (!outcome?.passed) {
                console.log(`Challenge not passed (${outcome?.reason || 'fail'}); task not slotted`);
                return;
            }

            const result = slotSystem?.requestSlot(liveTask, gameState.getStateSlice('currentTime'));
            if (!result?.ok) {
                alert(result?.message || 'Could not start or queue that task.');
                return;
            }

            if (result.queued) {
                console.log(`Medication ${liveTask.name} queued (slots full)`);
            } else {
                console.log(`Medication ${liveTask.name} started in a slot`);
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

        // Night-shift wrap: task windows compare relative to shift start
        setShiftAnchor(gameConfig.shiftStarts);

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

        // Dev/QA: Test control next to brand when game/test-mode.json enabled
        const testMode = this.modules.get('testMode');
        if (testMode && testMode.init) {
            Promise.resolve(testMode.init()).catch((err) => {
                console.warn('Test mode init failed', err);
            });
        }

        // E4.M3: hourly doctor-orders checks (subscribes to currentTime)
        const doctorOrders = this.modules.get('doctorOrders');
        if (doctorOrders && doctorOrders.init) {
            doctorOrders.init({
                ...gameConfig,
                patients: this.modules.get('patients')
            });
        }

        // E3.M5: thin dynamic/urgent spawn (game-time cadence)
        const dynamicTasks = this.modules.get('dynamicTasks');
        if (dynamicTasks && dynamicTasks.init) {
            dynamicTasks.init({
                ...gameConfig,
                patients: this.modules.get('patients')
            });
        }

        // Call lights + bed near-fall alarms (own cadence + sound)
        const nurseAlerts = this.modules.get('nurseAlerts');
        if (nurseAlerts && nurseAlerts.init) {
            nurseAlerts.init(gameConfig);
        }

        // E9: open-to-admit schedule + admission checklist
        const admission = this.modules.get('admission');
        if (admission && admission.init) {
            admission.init({
                patients: this.modules.get('patients'),
                shiftConfig: gameConfig
            });
        }

        // E13: CCT / CNA availability for Delegate rail (after census)
        const delegation = this.modules.get('delegation');
        if (delegation && delegation.init) {
            delegation.init();
        }

        // E10: Orders & Tools right rail (+ E13 Delegate)
        const rightMenu = this.modules.get('rightMenu');
        if (rightMenu && rightMenu.init) {
            rightMenu.init({
                patients: this.modules.get('patients')
            });
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

        // Landing Test skill: ?skill=&skillMode=test → blank census + challenge → landing
        const skillFocus = this.modules.get('skillFocus');
        if (skillFocus && skillFocus.init) {
            Promise.resolve(skillFocus.init()).catch((err) => {
                console.warn('Skill focus init failed', err);
            });
        }
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