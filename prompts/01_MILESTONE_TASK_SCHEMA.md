# Milestone 2: Task Definition Schema

## Context
The game has a basic task system that activates tasks at scheduled times. Now we need a formal schema for defining tasks with all their properties: class, type, duration, availability windows, and interaction rules.

## Goal
Create a comprehensive task definition schema that supports scheduled tasks, their availability windows (early start, late end), task classes for interaction rules, and duration tracking.

## Non-Goals
- ❌ Do NOT implement the slot blocking system yet (that's Milestone 3)
- ❌ Do NOT implement penalty/boost calculations yet (that's Milestone 5)
- ❌ Do NOT implement random or urgent task spawning (that's Milestone 6)
- ❌ Do NOT change the timer system
- ❌ Do NOT add new patients

## Constraints
- Use existing module pattern (ES6 modules)
- Maintain backward compatibility with current `data-*` attributes in HTML
- Keep `game-config.js` as the source of truth for constants
- No new npm dependencies

## Existing File Tree
```
game/assets/js/
├── app.js
├── game-config.js      # Modify
├── game-state.js       # Modify if needed
├── task-system.js      # Major changes
├── timer_ingame.js
├── timer_utils.js
├── patients.js
└── modal.js
```

## Required File Map for This Milestone

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/task-schema.js` | CREATE | Task schema definitions and validation |
| `game/assets/js/game-config.js` | MODIFY | Add task class and type enums |
| `game/assets/js/task-system.js` | MODIFY | Use new schema for task creation |

## Contracts / Interfaces

### Task Schema (`task-schema.js`)

```javascript
/**
 * Task Class Enum - Categories of tasks for interaction rules
 */
export const TaskClass = {
  MEDICATION: 'medication',
  ASSESSMENT: 'assessment', 
  PROCEDURE: 'procedure',
  DOCUMENTATION: 'documentation',
  COMMUNICATION: 'communication'
};

/**
 * Task Type Enum - Specific task types within classes
 */
export const TaskType = {
  // Medication types
  MED_ORAL: 'med-oral',
  MED_IV: 'med-iv',
  MED_INJECTION: 'med-injection',
  MED_TOPICAL: 'med-topical',
  
  // Assessment types
  ASSESS_VITALS: 'assess-vitals',
  ASSESS_PAIN: 'assess-pain',
  ASSESS_NEURO: 'assess-neuro',
  ASSESS_SKIN: 'assess-skin',
  
  // Procedure types
  PROC_WOUND_CARE: 'proc-wound-care',
  PROC_CATHETER: 'proc-catheter',
  PROC_DRESSING: 'proc-dressing',
  
  // Documentation types
  DOC_CHARTING: 'doc-charting',
  DOC_HANDOFF: 'doc-handoff',
  
  // Communication types
  COMM_CALL_MD: 'comm-call-md',
  COMM_FAMILY: 'comm-family'
};

/**
 * Availability Mode - How task availability is calculated
 */
export const AvailabilityMode = {
  WINDOW: 'window',           // Available from earlyStart to lateEnd
  UNTIL_END_OF_SHIFT: 'until-end-of-shift',
  UNTIL_SPECIFIC_TIME: 'until-specific-time',
  IMMEDIATE: 'immediate'      // For urgent tasks
};

/**
 * Task Definition Schema
 * @typedef {Object} TaskDefinition
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {TaskClass} class - Task category for interactions
 * @property {TaskType} type - Specific task type
 * @property {string} patientId - Associated patient
 * @property {number} scheduledTime - HHMM when task appears on schedule
 * @property {Object} availability - Availability window config
 * @property {number} availability.earlyStartMins - Minutes before scheduled can start (e.g., 60)
 * @property {number|string} availability.lateEndMins - Minutes after scheduled OR 'end-of-shift'
 * @property {AvailabilityMode} availability.mode - How to calculate availability
 * @property {number} baseDurationMins - Base time to complete task (in-game minutes)
 * @property {Object} metadata - Additional task-specific data
 */

/**
 * Create a validated task from definition
 * @param {Partial<TaskDefinition>} def 
 * @returns {TaskDefinition}
 */
export function createTaskDefinition(def) {
  // Validate and apply defaults
}

/**
 * Calculate actual availability window for a task
 * @param {TaskDefinition} task
 * @param {number} shiftEndTime - HHMM
 * @returns {{ availableFrom: number, availableUntil: number }}
 */
export function calculateAvailabilityWindow(task, shiftEndTime) {
  // Return computed HHMM times
}
```

### HTML Data Attributes (Extended)

```html
<li 
  data-task-id="joe-med-1"
  data-task-class="medication"
  data-task-type="med-oral"
  data-scheduled="2200"
  data-early-start-mins="60"
  data-late-end-mins="60"
  data-availability-mode="window"
  data-duration-mins="5"
  data-status="not-yet"
>
```

### Updated GameConfig (`game-config.js`)

```javascript
export const GameConfig = {
  // ... existing config ...
  
  tasks: {
    classes: TaskClass,
    types: TaskType,
    availabilityModes: AvailabilityMode,
    
    statuses: {
      NOT_YET: 'not-yet',
      AVAILABLE: 'available',  // NEW: within window but not started
      ACTIVE: 'active',        // Currently being performed
      COMPLETED: 'completed',
      OVERDUE: 'overdue',
      MISSED: 'missed'         // NEW: window closed without completion
    },
    
    // Default durations by task type (in-game minutes)
    defaultDurations: {
      [TaskType.MED_ORAL]: 5,
      [TaskType.MED_IV]: 15,
      [TaskType.MED_INJECTION]: 10,
      [TaskType.ASSESS_VITALS]: 10,
      // ... etc
    },
    
    // Default availability windows
    defaultAvailability: {
      earlyStartMins: 60,  // 1 hour before
      lateEndMins: 60      // 1 hour after
    }
  }
};
```

## Acceptance Checks

1. **Schema Validation**
   - [ ] `createTaskDefinition()` validates required fields (id, name, class, type, patientId)
   - [ ] `createTaskDefinition()` applies defaults for missing optional fields
   - [ ] Invalid task class/type throws descriptive error

2. **Availability Calculation**
   - [ ] `calculateAvailabilityWindow()` correctly calculates window for mode='window'
   - [ ] `calculateAvailabilityWindow()` handles 'end-of-shift' mode
   - [ ] `calculateAvailabilityWindow()` handles day rollover (e.g., scheduled 2300, earlyStart 60 = 2200)

3. **HTML Parsing**
   - [ ] Task system reads new `data-task-class`, `data-task-type` attributes
   - [ ] Task system reads `data-early-start-mins`, `data-late-end-mins`
   - [ ] Falls back to defaults when attributes missing

4. **Backward Compatibility**
   - [ ] Existing `joe.html` medications still load correctly
   - [ ] Existing `data-scheduled`, `data-expire`, `data-duration-mins` still work
   - [ ] No breaking changes to current game flow

5. **Console Logging**
   - [ ] Log parsed task definitions on patient load
   - [ ] Log availability windows when tasks become available

## Output Format Requirements

Return:
1. **File tree** with new/modified files marked
2. **Code per file** - full file contents for new files, diff-style for modifications
3. **Test steps** - manual verification in browser console

## Example Task Definition

```javascript
// In patient HTML or configuration
const heparinTask = createTaskDefinition({
  id: 'joe-heparin-1',
  name: 'Heparin 5000 units SubQ',
  class: TaskClass.MEDICATION,
  type: TaskType.MED_INJECTION,
  patientId: 'joe',
  scheduledTime: 1930,  // 7:30 PM
  availability: {
    earlyStartMins: 60,           // Can start at 1830
    lateEndMins: 60,              // Must complete by 2030
    mode: AvailabilityMode.WINDOW
  },
  baseDurationMins: 10,
  metadata: {
    dose: '5000 units',
    route: 'subcutaneous',
    site: 'abdomen'
  }
});
```

