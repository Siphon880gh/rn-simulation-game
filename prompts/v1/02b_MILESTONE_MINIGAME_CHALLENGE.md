# Milestone 3b: Mini-Game Challenge System (Scalable)

## Context
Some tasks should require the player to pass a skill check before the task is assigned to a slot. The mini-game system must be **scalable** - easy for developers to add new mini-game types. The medication name quiz is just ONE example; future mini-games could include dosage calculation, patient identification, etc.

## Goal
Implement a **plugin-based mini-game system** where:
1. Mini-games run in a popover modal
2. The in-game timer visibly pauses (frozen clock in backdrop)
3. Each mini-game emits a **pass/fail signal** when complete
4. Developers can easily register new mini-game types

## Non-Goals
- ❌ Do NOT implement more than one mini-game type (medication-name only for now)
- ❌ Do NOT implement difficulty scaling
- ❌ Do NOT track mini-game statistics (that's for scoring milestone)
- ❌ Do NOT implement time limits within mini-games (yet)

## Constraints
- Plugin architecture: each mini-game is a self-contained module
- Use Signals.js for pass/fail events
- Timer must visibly freeze (user sees clock stopped in backdrop)
- Build on existing modal/pause systems

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/minigame/minigame-system.js` | CREATE | Orchestrator - manages pause, modal, signals |
| `game/assets/js/minigame/minigame-base.js` | CREATE | Base class/interface for mini-games |
| `game/assets/js/minigame/minigame-registry.js` | CREATE | Registry of available mini-game types |
| `game/assets/js/minigame/games/medication-name.js` | CREATE | Medication name quiz implementation |
| `game/assets/js/minigame/data/medication-data.js` | CREATE | Brand/generic medication database |
| `game/assets/js/task-system.js` | MODIFY | Trigger mini-game before slot assignment |
| `game/assets/css/minigame.css` | CREATE | Mini-game modal styles |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MiniGameSystem (Orchestrator)               │
│  - Pauses game timer                                            │
│  - Opens modal popover                                          │
│  - Loads appropriate mini-game                                  │
│  - Listens for pass/fail signal                                 │
│  - Resumes game timer                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ loads
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MiniGameRegistry                            │
│  - Maps task types → mini-game types                            │
│  - Maps mini-game types → mini-game classes                     │
│  - Allows runtime registration of new mini-games                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ instantiates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MiniGameBase (Interface)                    │
│  + render(container): void      // Render UI into container     │
│  + destroy(): void              // Cleanup                       │
│  + onPass: Signal               // Emitted on success           │
│  + onFail: Signal               // Emitted on failure           │
└─────────────────────────────────────────────────────────────────┘
                              △
                              │ extends
                              │
┌─────────────────────────────────────────────────────────────────┐
│              MedicationNameGame (Implementation)                │
│  - Asks brand→generic or generic→brand                          │
│  - Validates answer (case insensitive)                          │
│  - Emits onPass or onFail                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Contracts / Interfaces

### MiniGameBase - Interface for All Mini-Games (`minigame-base.js`)

```javascript
/**
 * Base class that ALL mini-games must extend.
 * This defines the contract that the MiniGameSystem expects.
 */
export class MiniGameBase {
  constructor(task, context = {}) {
    this.task = task;           // The task triggering this mini-game
    this.context = context;     // Additional context (patient, etc.)
    
    // Signals - mini-game MUST emit one of these when complete
    this.onPass = new signals.Signal();  // Emit when player succeeds
    this.onFail = new signals.Signal();  // Emit when player fails
    
    this.isComplete = false;
  }
  
  /**
   * Render the mini-game UI into the provided container.
   * Called by MiniGameSystem after opening modal.
   * @param {HTMLElement} container - DOM element to render into
   */
  render(container) {
    throw new Error('Mini-game must implement render()');
  }
  
  /**
   * Cleanup when mini-game is destroyed.
   * Remove event listeners, timers, etc.
   */
  destroy() {
    this.onPass.removeAll();
    this.onFail.removeAll();
  }
  
  /**
   * Helper: Emit pass signal and mark complete
   */
  emitPass() {
    if (this.isComplete) return;
    this.isComplete = true;
    this.onPass.dispatch({ task: this.task });
  }
  
  /**
   * Helper: Emit fail signal and mark complete
   */
  emitFail(reason = '') {
    if (this.isComplete) return;
    this.isComplete = true;
    this.onFail.dispatch({ task: this.task, reason });
  }
  
  /**
   * Get display name for this mini-game type
   * @returns {string}
   */
  static getDisplayName() {
    return 'Mini-Game';
  }
  
  /**
   * Get icon for this mini-game type
   * @returns {string}
   */
  static getIcon() {
    return '🎮';
  }
}
```

### MiniGameRegistry - Plugin Registration (`minigame-registry.js`)

```javascript
/**
 * Registry for mini-game types.
 * Developers register new mini-games here.
 */
class MiniGameRegistry {
  constructor() {
    // Maps mini-game type ID → mini-game class
    this.games = new Map();
    
    // Maps task type → mini-game type ID
    this.taskMappings = new Map();
  }
  
  /**
   * Register a new mini-game type.
   * Call this to add a new mini-game to the system.
   * 
   * @param {string} gameTypeId - Unique identifier (e.g., 'medication-name')
   * @param {typeof MiniGameBase} gameClass - Class extending MiniGameBase
   * 
   * @example
   * registry.registerGame('medication-name', MedicationNameGame);
   * registry.registerGame('dosage-calc', DosageCalculationGame);
   */
  registerGame(gameTypeId, gameClass) {
    if (!(gameClass.prototype instanceof MiniGameBase)) {
      throw new Error(`${gameTypeId} must extend MiniGameBase`);
    }
    this.games.set(gameTypeId, gameClass);
    console.log(`Mini-game registered: ${gameTypeId}`);
  }
  
  /**
   * Map a task type to a mini-game type.
   * 
   * @param {string} taskType - Task type (e.g., 'med', 'med-iv')
   * @param {string} gameTypeId - Mini-game type ID
   * 
   * @example
   * registry.mapTaskToGame('med', 'medication-name');
   * registry.mapTaskToGame('med-iv', 'dosage-calc');
   */
  mapTaskToGame(taskType, gameTypeId) {
    if (!this.games.has(gameTypeId)) {
      throw new Error(`Mini-game "${gameTypeId}" not registered`);
    }
    this.taskMappings.set(taskType, gameTypeId);
  }
  
  /**
   * Check if a task type requires a mini-game
   * @param {string} taskType
   * @returns {boolean}
   */
  requiresGame(taskType) {
    return this.taskMappings.has(taskType);
  }
  
  /**
   * Get the mini-game class for a task type
   * @param {string} taskType
   * @returns {typeof MiniGameBase | null}
   */
  getGameForTask(taskType) {
    const gameTypeId = this.taskMappings.get(taskType);
    if (!gameTypeId) return null;
    return this.games.get(gameTypeId);
  }
  
  /**
   * Create a mini-game instance for a task
   * @param {TaskDefinition} task
   * @param {Object} context
   * @returns {MiniGameBase | null}
   */
  createGameForTask(task, context = {}) {
    const GameClass = this.getGameForTask(task.type);
    if (!GameClass) return null;
    return new GameClass(task, context);
  }
}

export const miniGameRegistry = new MiniGameRegistry();
export default miniGameRegistry;
```

### MiniGameSystem - Orchestrator (`minigame-system.js`)

```javascript
import { MiniGameBase } from './minigame-base.js';
import miniGameRegistry from './minigame-registry.js';
import gameState from '../game-state.js';

/**
 * Orchestrates mini-game execution:
 * 1. Pauses game (visible frozen timer)
 * 2. Opens modal popover
 * 3. Loads and runs the mini-game
 * 4. Listens for pass/fail signal
 * 5. Resumes game
 */
class MiniGameSystem {
  constructor() {
    this.currentGame = null;
    this.modalContainer = null;
    this.wasPausedBefore = false;
  }
  
  /**
   * Check if a task requires a mini-game
   * @param {TaskDefinition} task
   * @returns {boolean}
   */
  requiresChallenge(task) {
    return miniGameRegistry.requiresGame(task.type);
  }
  
  /**
   * Start a mini-game challenge for a task.
   * Returns a Promise that resolves to true (pass) or false (fail).
   * 
   * @param {TaskDefinition} task
   * @param {Object} context - Additional context (patient, etc.)
   * @returns {Promise<boolean>}
   */
  startChallenge(task, context = {}) {
    return new Promise((resolve) => {
      // 1. Pause the game timer (visible freeze)
      this.pauseGameForChallenge();
      
      // 2. Create the mini-game instance
      this.currentGame = miniGameRegistry.createGameForTask(task, context);
      
      if (!this.currentGame) {
        console.warn(`No mini-game found for task type: ${task.type}`);
        this.resumeGameAfterChallenge();
        resolve(true); // No game = auto-pass
        return;
      }
      
      // 3. Setup signal listeners
      this.currentGame.onPass.addOnce(() => {
        this.handleResult(true, resolve);
      });
      
      this.currentGame.onFail.addOnce((data) => {
        this.handleResult(false, resolve, data?.reason);
      });
      
      // 4. Open modal and render mini-game
      this.openMiniGameModal(this.currentGame);
    });
  }
  
  /**
   * Pause game timer - clock visibly freezes in backdrop
   */
  pauseGameForChallenge() {
    // Store previous pause state
    this.wasPausedBefore = gameState.getStateSlice('isPaused');
    
    // Force pause if not already paused
    if (!this.wasPausedBefore) {
      gameState.dispatch('TOGGLE_PAUSE');
    }
    
    // Add visual indicator that game is paused for mini-game
    document.body.classList.add('minigame-active');
    
    console.log('⏸️ Game paused for mini-game');
  }
  
  /**
   * Resume game timer after challenge
   */
  resumeGameAfterChallenge() {
    // Only resume if game wasn't paused before challenge
    if (!this.wasPausedBefore && gameState.getStateSlice('isPaused')) {
      gameState.dispatch('TOGGLE_PAUSE');
    }
    
    // Remove visual indicator
    document.body.classList.remove('minigame-active');
    
    console.log('▶️ Game resumed after mini-game');
  }
  
  /**
   * Open the mini-game modal popover
   */
  openMiniGameModal(game) {
    const GameClass = game.constructor;
    
    // Create modal content container
    const modalContent = `
      <div class="minigame-modal">
        <div class="minigame-header">
          <span class="minigame-icon">${GameClass.getIcon()}</span>
          <span class="minigame-title">${GameClass.getDisplayName()}</span>
        </div>
        <div class="minigame-task-info">
          Task: ${game.task.name}
        </div>
        <div id="minigame-container" class="minigame-content">
          <!-- Mini-game renders here -->
        </div>
        <div class="minigame-footer">
          <button id="minigame-cancel" class="minigame-cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Use existing modal system
    window.modifyModal('', modalContent, '');
    window.openModal();
    
    // Get container and render mini-game
    const container = document.getElementById('minigame-container');
    if (container) {
      game.render(container);
    }
    
    // Setup cancel button
    document.getElementById('minigame-cancel')?.addEventListener('click', () => {
      this.currentGame?.emitFail('cancelled');
    });
  }
  
  /**
   * Handle mini-game result
   */
  handleResult(passed, resolve, reason = '') {
    // Show brief result feedback
    this.showResultFeedback(passed, reason);
    
    // Delay to show feedback, then cleanup
    setTimeout(() => {
      this.cleanup();
      window.closeModal();
      this.resumeGameAfterChallenge();
      resolve(passed);
    }, passed ? 800 : 1500);
  }
  
  /**
   * Show pass/fail feedback overlay
   */
  showResultFeedback(passed, reason) {
    const container = document.querySelector('.minigame-modal');
    if (!container) return;
    
    const feedback = document.createElement('div');
    feedback.className = `minigame-result ${passed ? 'pass' : 'fail'}`;
    feedback.innerHTML = passed 
      ? '✓ Passed!' 
      : `✗ Failed${reason ? `: ${reason}` : ''}`;
    
    container.appendChild(feedback);
  }
  
  /**
   * Cleanup current mini-game
   */
  cleanup() {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
  }
}

export const miniGameSystem = new MiniGameSystem();
export default miniGameSystem;
```

### Example Mini-Game: Medication Name Quiz (`games/medication-name.js`)

```javascript
import { MiniGameBase } from '../minigame-base.js';
import { MedicationDatabase } from '../data/medication-data.js';

/**
 * Medication Name Quiz Mini-Game
 * 
 * Player must type the generic name when given brand name (or vice versa).
 * Case insensitive matching.
 */
export class MedicationNameGame extends MiniGameBase {
  constructor(task, context) {
    super(task, context);
    
    this.challenge = this.generateChallenge();
    this.inputElement = null;
  }
  
  /**
   * Generate a random challenge based on task medication
   */
  generateChallenge() {
    // Random direction
    const askForGeneric = Math.random() > 0.5;
    
    // Find medication in database
    const med = MedicationDatabase.findByName(this.task.name);
    
    if (!med) {
      // Fallback if medication not in database
      return {
        question: `Confirm medication: ${this.task.name}`,
        answer: this.task.name.toLowerCase(),
        type: 'confirm'
      };
    }
    
    if (askForGeneric) {
      return {
        question: `What is the GENERIC name for "${med.brand}"?`,
        answer: med.generic.toLowerCase(),
        hint: med.brand,
        type: 'brand-to-generic'
      };
    } else {
      return {
        question: `What is the BRAND name for "${med.generic}"?`,
        answer: med.brand.toLowerCase(),
        hint: med.generic,
        type: 'generic-to-brand'
      };
    }
  }
  
  /**
   * Render the quiz UI
   */
  render(container) {
    container.innerHTML = `
      <div class="med-name-game">
        <div class="question">
          ${this.challenge.question}
        </div>
        
        <input 
          type="text" 
          id="med-answer-input"
          class="answer-input"
          placeholder="Type your answer..."
          autocomplete="off"
        />
        
        <div class="input-hint">
          Press Enter to submit • Case insensitive
        </div>
        
        <button id="med-submit-btn" class="submit-btn">
          Submit Answer
        </button>
      </div>
    `;
    
    // Setup handlers
    this.inputElement = container.querySelector('#med-answer-input');
    const submitBtn = container.querySelector('#med-submit-btn');
    
    // Auto-focus
    setTimeout(() => this.inputElement?.focus(), 100);
    
    // Enter to submit
    this.inputElement?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitAnswer();
    });
    
    // Button submit
    submitBtn?.addEventListener('click', () => this.submitAnswer());
  }
  
  /**
   * Validate and submit answer
   */
  submitAnswer() {
    const userAnswer = this.inputElement?.value?.trim().toLowerCase() || '';
    const isCorrect = userAnswer === this.challenge.answer;
    
    if (isCorrect) {
      this.emitPass();
    } else {
      this.emitFail(`Correct answer: ${this.challenge.answer}`);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.inputElement = null;
    super.destroy();
  }
  
  // Static metadata for registry
  static getDisplayName() {
    return 'Medication Check';
  }
  
  static getIcon() {
    return '💊';
  }
}

export default MedicationNameGame;
```

### Medication Database (`data/medication-data.js`)

```javascript
/**
 * Database of brand/generic medication name mappings.
 * Easy to extend - just add more entries.
 */
export const MedicationDatabase = {
  medications: [
    { brand: 'Lipitor', generic: 'atorvastatin' },
    { brand: 'Tylenol', generic: 'acetaminophen' },
    { brand: 'Advil', generic: 'ibuprofen' },
    { brand: 'Motrin', generic: 'ibuprofen' },
    { brand: 'Lasix', generic: 'furosemide' },
    { brand: 'Coumadin', generic: 'warfarin' },
    { brand: 'Glucophage', generic: 'metformin' },
    { brand: 'Prinivil', generic: 'lisinopril' },
    { brand: 'Zestril', generic: 'lisinopril' },
    { brand: 'Lopressor', generic: 'metoprolol' },
    { brand: 'Toprol', generic: 'metoprolol' },
    { brand: 'Norvasc', generic: 'amlodipine' },
    { brand: 'Protonix', generic: 'pantoprazole' },
    { brand: 'Prilosec', generic: 'omeprazole' },
    { brand: 'Zofran', generic: 'ondansetron' },
    { brand: 'Ativan', generic: 'lorazepam' },
    { brand: 'Valium', generic: 'diazepam' },
    { brand: 'Xanax', generic: 'alprazolam' },
    { brand: 'Ambien', generic: 'zolpidem' },
    { brand: 'Desyrel', generic: 'trazodone' },
    { brand: 'Remeron', generic: 'mirtazapine' },
    { brand: 'Neurontin', generic: 'gabapentin' },
    { brand: 'Lyrica', generic: 'pregabalin' },
    { brand: 'Flexeril', generic: 'cyclobenzaprine' },
    { brand: 'Cardura', generic: 'doxazosin' },
    { brand: 'Heparin', generic: 'heparin' },
    { brand: 'Lovenox', generic: 'enoxaparin' },
    { brand: 'Plavix', generic: 'clopidogrel' },
    { brand: 'Eliquis', generic: 'apixaban' },
    { brand: 'Xarelto', generic: 'rivaroxaban' },
    { brand: 'Aspirin', generic: 'aspirin' },
    { brand: 'Melatonin', generic: 'melatonin' }
  ],
  
  /**
   * Find medication by name (brand or generic)
   * @param {string} name - Medication name to search
   * @returns {{ brand: string, generic: string } | null}
   */
  findByName(name) {
    const normalized = name.toLowerCase().trim();
    
    // Remove common suffixes for matching
    const cleanName = normalized
      .replace(/\s*\d+\s*mg$/i, '')      // Remove "40mg"
      .replace(/\s*\(.*\)$/i, '')         // Remove "(Low-dose)"
      .replace(/\s*(iv|po|subq|im)$/i, '') // Remove route
      .trim();
    
    return this.medications.find(med => 
      med.brand.toLowerCase() === cleanName ||
      med.generic.toLowerCase() === cleanName
    ) || null;
  }
};

export default MedicationDatabase;
```

### Registration & Initialization (`minigame/index.js`)

```javascript
/**
 * Mini-game module initialization.
 * Import this to setup all mini-games.
 */
import miniGameRegistry from './minigame-registry.js';
import MedicationNameGame from './games/medication-name.js';

// ============================================
// REGISTER MINI-GAMES HERE
// ============================================

// Register the Medication Name game
miniGameRegistry.registerGame('medication-name', MedicationNameGame);

// Future mini-games would be registered like:
// miniGameRegistry.registerGame('dosage-calc', DosageCalculationGame);
// miniGameRegistry.registerGame('patient-id', PatientIdentificationGame);
// miniGameRegistry.registerGame('vital-check', VitalSignsGame);

// ============================================
// MAP TASK TYPES TO MINI-GAMES
// ============================================

// All medication task types use the medication-name game
miniGameRegistry.mapTaskToGame('med', 'medication-name');
miniGameRegistry.mapTaskToGame('med-oral', 'medication-name');
miniGameRegistry.mapTaskToGame('med-iv', 'medication-name');
miniGameRegistry.mapTaskToGame('med-injection', 'medication-name');
miniGameRegistry.mapTaskToGame('med-topical', 'medication-name');

// Future mappings:
// miniGameRegistry.mapTaskToGame('med-iv', 'dosage-calc');

export { miniGameRegistry };
export { miniGameSystem } from './minigame-system.js';
```

### CSS Styles (`minigame.css`)

```css
/* ============================================
   MINI-GAME SYSTEM STYLES
   ============================================ */

/* Body state when mini-game is active */
body.minigame-active .container {
  filter: blur(2px);
  pointer-events: none;
}

/* Frozen clock indicator */
body.minigame-active #clock {
  color: #9ca3af;
  animation: frozen-pulse 1.5s ease-in-out infinite;
}

body.minigame-active #clock::after {
  content: ' ⏸';
  font-size: 0.8em;
}

@keyframes frozen-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ============================================
   MINI-GAME MODAL
   ============================================ */

.minigame-modal {
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
}

.minigame-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.minigame-icon {
  font-size: 32px;
}

.minigame-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.minigame-task-info {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.minigame-content {
  min-height: 150px;
}

.minigame-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.minigame-cancel-btn {
  padding: 8px 24px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.minigame-cancel-btn:hover {
  background: #e5e7eb;
}

/* ============================================
   RESULT FEEDBACK
   ============================================ */

.minigame-result {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  border-radius: inherit;
  animation: result-fade-in 0.3s ease;
}

.minigame-result.pass {
  background: rgba(16, 185, 129, 0.95);
  color: white;
}

.minigame-result.fail {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

@keyframes result-fade-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* ============================================
   MEDICATION NAME GAME SPECIFIC
   ============================================ */

.med-name-game {
  text-align: center;
}

.med-name-game .question {
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 24px;
  line-height: 1.5;
}

.med-name-game .answer-input {
  width: 100%;
  max-width: 300px;
  padding: 12px 16px;
  font-size: 18px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.med-name-game .answer-input:focus {
  border-color: #3b82f6;
}

.med-name-game .input-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
  margin-bottom: 16px;
}

.med-name-game .submit-btn {
  padding: 12px 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.med-name-game .submit-btn:hover {
  background: #2563eb;
}
```

## How to Add a New Mini-Game

Developers can add new mini-games in 3 steps:

### Step 1: Create the Mini-Game Class

```javascript
// game/assets/js/minigame/games/my-new-game.js
import { MiniGameBase } from '../minigame-base.js';

export class MyNewGame extends MiniGameBase {
  constructor(task, context) {
    super(task, context);
    // Initialize your game state
  }
  
  render(container) {
    // Render your game UI
    container.innerHTML = `<div>My game UI</div>`;
    
    // Setup event handlers
    // When player succeeds: this.emitPass()
    // When player fails: this.emitFail('reason')
  }
  
  destroy() {
    // Cleanup
    super.destroy();
  }
  
  static getDisplayName() { return 'My New Game'; }
  static getIcon() { return '🎯'; }
}
```

### Step 2: Register in `minigame/index.js`

```javascript
import MyNewGame from './games/my-new-game.js';

miniGameRegistry.registerGame('my-new-game', MyNewGame);
```

### Step 3: Map Task Types

```javascript
miniGameRegistry.mapTaskToGame('some-task-type', 'my-new-game');
```

## Acceptance Checks

1. **Scalable Architecture**
   - [ ] `MiniGameBase` defines clear interface (render, destroy, onPass, onFail)
   - [ ] New mini-games can be added without modifying core system
   - [ ] Registry allows runtime registration of mini-games
   - [ ] Task type → mini-game mapping is configurable

2. **Visible Pause State**
   - [ ] Clock display shows paused indicator (⏸) when mini-game active
   - [ ] Clock time is frozen (not advancing)
   - [ ] Background content is visually dimmed/blurred
   - [ ] Player can clearly see game is paused

3. **Signal-Based Results**
   - [ ] Mini-game emits `onPass` signal on success
   - [ ] Mini-game emits `onFail` signal on failure
   - [ ] System waits for signal before resuming game
   - [ ] Only one signal can be emitted (pass OR fail)

4. **Modal Popover**
   - [ ] Mini-game renders inside modal
   - [ ] Modal shows mini-game title and icon
   - [ ] Cancel button available to abort
   - [ ] Result feedback displays before closing

5. **Medication Name Game (Example)**
   - [ ] Randomly asks brand→generic or generic→brand
   - [ ] Case-insensitive answer validation
   - [ ] Pass emitted on correct answer
   - [ ] Fail emitted with correct answer shown

## Output Format Requirements

Return:
1. **File tree** showing minigame/ folder structure
2. **Code per file**
3. **Test steps**:
   - Start game
   - Perform medication task
   - Verify clock shows "⏸" and is frozen
   - Answer correctly → verify pass, task assigned
   - Answer incorrectly → verify fail, task NOT assigned

## Example: Adding a Dosage Calculation Game (Future)

```javascript
// games/dosage-calc.js
export class DosageCalculationGame extends MiniGameBase {
  constructor(task, context) {
    super(task, context);
    this.problem = this.generateProblem();
  }
  
  generateProblem() {
    // "Patient weighs 70kg. Order: 5mg/kg. What's the total dose?"
    const weight = Math.floor(Math.random() * 50) + 50; // 50-100kg
    const dosePerKg = [2, 5, 10][Math.floor(Math.random() * 3)];
    return {
      question: `Patient weighs ${weight}kg. Order: ${dosePerKg}mg/kg. Total dose?`,
      answer: weight * dosePerKg
    };
  }
  
  render(container) {
    container.innerHTML = `
      <div class="dosage-calc-game">
        <p>${this.problem.question}</p>
        <input type="number" id="dose-answer" />
        <span>mg</span>
        <button id="dose-submit">Calculate</button>
      </div>
    `;
    
    document.getElementById('dose-submit').onclick = () => {
      const answer = parseInt(document.getElementById('dose-answer').value);
      if (answer === this.problem.answer) {
        this.emitPass();
      } else {
        this.emitFail(`Correct: ${this.problem.answer}mg`);
      }
    };
  }
  
  static getDisplayName() { return 'Dosage Calculation'; }
  static getIcon() { return '🧮'; }
}

// In index.js:
// miniGameRegistry.registerGame('dosage-calc', DosageCalculationGame);
// miniGameRegistry.mapTaskToGame('med-iv', 'dosage-calc');
```
