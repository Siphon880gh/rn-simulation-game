# Milestone 5: Task Class Interactions (Penalty/Boost System)

## Context
The user specified: "Some tasks get a penalty or a boost (faster than the time it takes) if mixed in with a certain class of other tasks."

This milestone implements the interaction rules between task classes, affecting the actual duration of tasks when performed together or in sequence.

## Goal
Implement a system where:
1. Certain task combinations in the same slot (or same patient context) result in **penalties** (longer duration)
2. Certain task combinations result in **boosts** (shorter duration)
3. Players can strategize task ordering for efficiency

## Non-Goals
- ❌ Do NOT implement random events
- ❌ Do NOT modify the scoring system yet
- ❌ Do NOT add new task types
- ❌ Do NOT implement slot upgrades

## Constraints
- Interaction rules defined declaratively in configuration
- Duration modifiers are percentages (-20% for boost, +50% for penalty)
- Modifiers stack additively, with a floor of 50% original duration
- UI must clearly show when modifier applies

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/task-interactions.js` | CREATE | Interaction rule engine |
| `game/assets/js/game-config.js` | MODIFY | Add interaction rule definitions |
| `game/assets/js/slot-system.js` | MODIFY | Apply duration modifiers |
| `game/assets/js/task-system.js` | MODIFY | Track interaction context |

## Contracts / Interfaces

### Interaction Rules Configuration

```javascript
// In game-config.js
export const TaskInteractionRules = {
  /**
   * Boosts - Task combinations that reduce duration
   * Key format: "class1:class2" (order doesn't matter)
   * Value: percentage reduction (negative = faster)
   */
  boosts: {
    // Same patient medication batching
    'medication:medication': {
      modifier: -0.20,  // 20% faster
      condition: 'same-patient',
      description: 'Medication batching - prepare meds together',
      icon: '⚡'
    },
    
    // Assessment helps with documentation
    'assessment:documentation': {
      modifier: -0.15,  // 15% faster
      condition: 'same-patient',
      description: 'Fresh assessment data speeds up charting',
      icon: '📋'
    },
    
    // Communication after assessment
    'assessment:communication': {
      modifier: -0.10,
      condition: 'same-patient',
      description: 'Recent assessment aids family/MD communication',
      icon: '💬'
    }
  },
  
  /**
   * Penalties - Task combinations that increase duration
   */
  penalties: {
    // Switching between patients frequently
    'any:any': {
      modifier: 0.15,  // 15% slower
      condition: 'different-patient',
      description: 'Context switching between patients',
      icon: '🔄'
    },
    
    // Interrupting procedure with communication
    'procedure:communication': {
      modifier: 0.25,  // 25% slower
      condition: 'interrupted',
      description: 'Breaking sterile field for communication',
      icon: '⚠️'
    },
    
    // Mixing IV meds that shouldn't be rushed
    'med-iv:med-iv': {
      modifier: 0.20,  // 20% slower for safety
      condition: 'same-slot',
      description: 'IV medication safety check required',
      icon: '💉'
    }
  },
  
  /**
   * Conditions explained:
   * - 'same-patient': Both tasks for same patient
   * - 'different-patient': Tasks for different patients
   * - 'same-slot': Tasks performed in same slot sequentially
   * - 'interrupted': One task interrupts another in progress
   * - 'any': Always applies
   */
};
```

### Interaction Engine (`task-interactions.js`)

```javascript
/**
 * Context for interaction calculations
 * @typedef {Object} InteractionContext
 * @property {string|null} lastTaskClass - Class of last completed task
 * @property {string|null} lastPatientId - Patient of last completed task
 * @property {number} lastCompletionTime - HHMM when last task completed
 * @property {Map<number, string>} slotTaskClasses - Current task class per slot
 */

/**
 * Calculate duration modifier for a task
 * @param {TaskDefinition} task - Task to calculate modifier for
 * @param {InteractionContext} context - Current interaction context
 * @returns {{ 
 *   modifier: number,           // Multiplier (1.0 = no change, 0.8 = 20% faster)
 *   appliedRules: Array<{rule: string, modifier: number, description: string}>
 * }}
 */
export function calculateDurationModifier(task, context) {
  const appliedRules = [];
  let totalModifier = 0;
  
  // Check boost rules
  for (const [key, rule] of Object.entries(TaskInteractionRules.boosts)) {
    if (ruleApplies(key, rule, task, context)) {
      appliedRules.push({ rule: key, ...rule });
      totalModifier += rule.modifier;
    }
  }
  
  // Check penalty rules
  for (const [key, rule] of Object.entries(TaskInteractionRules.penalties)) {
    if (ruleApplies(key, rule, task, context)) {
      appliedRules.push({ rule: key, ...rule });
      totalModifier += rule.modifier;
    }
  }
  
  // Floor at 50% of original (modifier of -0.5)
  const finalModifier = Math.max(-0.5, totalModifier);
  
  return {
    modifier: 1 + finalModifier,
    appliedRules
  };
}

/**
 * Get effective duration for a task
 * @param {TaskDefinition} task
 * @param {InteractionContext} context
 * @returns {number} Adjusted duration in minutes
 */
export function getEffectiveDuration(task, context) {
  const { modifier } = calculateDurationModifier(task, context);
  return Math.ceil(task.baseDurationMins * modifier);
}

/**
 * Update interaction context after task completion
 * @param {InteractionContext} context
 * @param {TaskDefinition} completedTask
 * @param {number} slotIndex
 * @param {number} completionTime
 * @returns {InteractionContext}
 */
export function updateContext(context, completedTask, slotIndex, completionTime);

/**
 * Reset context for a slot (e.g., after long idle)
 * @param {InteractionContext} context
 * @param {number} slotIndex
 */
export function resetSlotContext(context, slotIndex);
```

### UI Feedback

```javascript
/**
 * Tooltip/preview when hovering over task
 * Shows base duration + any modifiers
 */
function getTaskDurationPreview(task, context) {
  const { modifier, appliedRules } = calculateDurationModifier(task, context);
  const baseDuration = task.baseDurationMins;
  const effectiveDuration = Math.ceil(baseDuration * modifier);
  
  return {
    baseDuration,
    effectiveDuration,
    modifierPercent: Math.round((modifier - 1) * 100),
    appliedRules,
    summary: effectiveDuration < baseDuration 
      ? `${effectiveDuration} mins (${appliedRules[0]?.icon} boosted!)`
      : effectiveDuration > baseDuration
      ? `${effectiveDuration} mins (${appliedRules[0]?.icon} penalty)`
      : `${effectiveDuration} mins`
  };
}
```

### CSS for Modifiers

```css
/* Boost indicator on task */
.task-modifier-boost {
  position: relative;
}

.task-modifier-boost::before {
  content: '⚡';
  position: absolute;
  left: -20px;
  font-size: 14px;
}

.task-modifier-boost .task-duration {
  color: #10b981;
  font-weight: bold;
}

/* Penalty indicator */
.task-modifier-penalty {
  position: relative;
}

.task-modifier-penalty::before {
  content: '⚠️';
  position: absolute;
  left: -20px;
  font-size: 14px;
}

.task-modifier-penalty .task-duration {
  color: #f59e0b;
  font-weight: bold;
}

/* Duration tooltip */
.duration-breakdown {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.task-item:hover .duration-breakdown {
  opacity: 1;
}
```

## Acceptance Checks

1. **Boost Application**
   - [ ] Performing 2nd medication for same patient shows boost indicator
   - [ ] Duration is reduced by configured percentage
   - [ ] Tooltip shows "Medication batching" explanation

2. **Penalty Application**
   - [ ] Switching to different patient shows context switch penalty
   - [ ] Duration is increased by configured percentage
   - [ ] Tooltip shows penalty explanation

3. **Stacking**
   - [ ] Multiple rules can apply simultaneously
   - [ ] Modifiers add together (not multiply)
   - [ ] Total modifier cannot go below -50% (floor)

4. **Context Tracking**
   - [ ] System remembers last completed task per slot
   - [ ] Context resets after configurable idle time (e.g., 30 game mins)
   - [ ] Context persists through game pause

5. **Visual Feedback**
   - [ ] Tasks show modified duration (not base duration) when modifier applies
   - [ ] Boost/penalty icons visible on affected tasks
   - [ ] Hover shows breakdown of applied rules

## Output Format Requirements

Return:
1. **File tree**
2. **Code per file**
3. **Test steps**:
   - Give one medication to patient Joe
   - Immediately give second medication to patient Joe
   - Verify second medication shows boosted (shorter) duration
   - Switch to different patient task
   - Verify penalty applies

## Example Scenario

```
Slot 0: Empty, no context

1. User performs "Heparin" for Joe (base: 10 mins)
   - No modifier (first task)
   - Duration: 10 mins
   
2. User immediately performs "Aspirin" for Joe (base: 5 mins)
   - Boost: medication:medication, same-patient = -20%
   - Modified duration: 5 * 0.8 = 4 mins
   - UI shows: "4 mins ⚡ boosted!"
   
3. User switches to perform "Vitals" for Mary (base: 10 mins)
   - Penalty: any:any, different-patient = +15%
   - Modified duration: 10 * 1.15 = 12 mins
   - UI shows: "12 mins 🔄 context switch"
```

