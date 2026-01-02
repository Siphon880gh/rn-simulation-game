# Milestone 6: Random & Urgent Tasks

## Context
The user specified three task categories with different availability rules:
1. **Scheduled tasks** - known in advance, configurable windows (done in Milestone 4)
2. **Random tasks** - spawn during shift, available until end of shift or specific time
3. **Urgent tasks** - must be started immediately with short completion windows

## Goal
Implement a task spawning system for random events and urgent tasks with appropriate timing rules and visual urgency indicators.

## Non-Goals
- ❌ Do NOT implement complex event chains
- ❌ Do NOT implement patient deterioration mechanics
- ❌ Do NOT add new patient types
- ❌ Do NOT implement difficulty scaling

## Constraints
- Random tasks spawn based on configurable probability per time unit
- Urgent tasks override normal task queue UI
- Use existing modal system for urgent task alerts
- Sound effects are optional (nice-to-have, not required)

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/task-spawner.js` | CREATE | Random/urgent task spawning |
| `game/assets/js/game-config.js` | MODIFY | Spawn configurations |
| `game/assets/js/task-schema.js` | MODIFY | Add urgency levels |
| `game/assets/js/app.js` | MODIFY | Initialize spawner |
| `game/assets/css/declarative-tasks.css` | MODIFY | Urgent task styles |

## Contracts / Interfaces

### Task Urgency Levels

```javascript
export const TaskUrgency = {
  NORMAL: 'normal',         // Standard scheduled task
  ELEVATED: 'elevated',     // Random task, needs attention
  URGENT: 'urgent',         // Must address soon
  CRITICAL: 'critical'      // Immediate attention required
};
```

### Random Task Configuration

```javascript
// In game-config.js
export const RandomTaskConfig = {
  /**
   * Spawn probability check interval (in-game minutes)
   */
  checkIntervalMins: 15,
  
  /**
   * Base spawn probability per check (0-1)
   * Actual probability may be modified by patient acuity, time of shift, etc.
   */
  baseSpawnProbability: 0.15,
  
  /**
   * Maximum concurrent random tasks per patient
   */
  maxRandomTasksPerPatient: 2,
  
  /**
   * Task pool - possible random tasks
   */
  taskPool: [
    {
      id: 'random-pain-reassess',
      name: 'Pain Reassessment',
      class: TaskClass.ASSESSMENT,
      type: TaskType.ASSESS_PAIN,
      urgency: TaskUrgency.ELEVATED,
      baseDurationMins: 10,
      availability: {
        mode: 'until-end-of-shift'
      },
      probability: 0.3,  // 30% of spawn opportunities
      conditions: ['patient-has-pain-meds']
    },
    {
      id: 'random-family-call',
      name: 'Family Member Calling',
      class: TaskClass.COMMUNICATION,
      type: TaskType.COMM_FAMILY,
      urgency: TaskUrgency.ELEVATED,
      baseDurationMins: 15,
      availability: {
        mode: 'window',
        lateEndMins: 60  // They'll call back if ignored
      },
      probability: 0.2
    },
    {
      id: 'random-iv-beeping',
      name: 'IV Pump Alarm',
      class: TaskClass.PROCEDURE,
      type: TaskType.PROC_IV_CHECK,
      urgency: TaskUrgency.URGENT,
      baseDurationMins: 5,
      availability: {
        mode: 'window',
        lateEndMins: 15  // Short window - urgent
      },
      probability: 0.25,
      conditions: ['patient-has-iv']
    }
  ]
};
```

### Urgent Task Configuration

```javascript
export const UrgentTaskConfig = {
  /**
   * Urgent tasks have much shorter windows and interrupt normal flow
   */
  tasks: [
    {
      id: 'urgent-fall',
      name: 'Patient Fall!',
      class: TaskClass.ASSESSMENT,
      type: TaskType.ASSESS_FALL,
      urgency: TaskUrgency.CRITICAL,
      baseDurationMins: 20,
      availability: {
        mode: 'immediate',
        lateEndMins: 10  // Must START within 10 mins
      },
      triggerProbability: 0.02,  // 2% per check - rare but impactful
      consequence: 'patient-injury'  // What happens if missed
    },
    {
      id: 'urgent-chest-pain',
      name: 'Patient Chest Pain',
      class: TaskClass.ASSESSMENT,
      type: TaskType.ASSESS_CARDIAC,
      urgency: TaskUrgency.CRITICAL,
      baseDurationMins: 30,
      availability: {
        mode: 'immediate',
        lateEndMins: 5  // Extremely urgent
      },
      triggerProbability: 0.01
    },
    {
      id: 'urgent-desaturation',
      name: 'O2 Desaturation',
      class: TaskClass.ASSESSMENT,
      type: TaskType.ASSESS_RESPIRATORY,
      urgency: TaskUrgency.CRITICAL,
      baseDurationMins: 15,
      availability: {
        mode: 'immediate',
        lateEndMins: 5
      },
      triggerProbability: 0.03
    }
  ],
  
  /**
   * Alert display configuration
   */
  alertConfig: {
    modal: true,           // Show modal for critical
    sound: true,           // Play alert sound (if implemented)
    pauseOnAlert: false,   // Don't auto-pause, keep pressure on
    flashScreen: true      // Flash screen border red
  }
};
```

### Task Spawner Module (`task-spawner.js`)

```javascript
import { RandomTaskConfig, UrgentTaskConfig } from './game-config.js';
import taskSystem from './task-system.js';
import gameState from './game-state.js';

class TaskSpawner {
  constructor() {
    this.lastCheckTime = 0;
    this.activeRandomTasks = new Map();  // patientId -> Set<taskId>
  }
  
  /**
   * Initialize spawner with game state subscription
   */
  init() {
    gameState.subscribe('currentTime', (time) => this.onTimeUpdate(time));
  }
  
  /**
   * Called on each time update
   * @param {number} currentTime - HHMM
   */
  onTimeUpdate(currentTime) {
    const minutesSinceLastCheck = this.getMinutesBetween(this.lastCheckTime, currentTime);
    
    if (minutesSinceLastCheck >= RandomTaskConfig.checkIntervalMins) {
      this.performSpawnCheck(currentTime);
      this.lastCheckTime = currentTime;
    }
  }
  
  /**
   * Check if random/urgent tasks should spawn
   * @param {number} currentTime
   */
  performSpawnCheck(currentTime) {
    const patients = gameState.getStateSlice('patients');
    
    patients.forEach((patient) => {
      // Check random task spawn
      if (Math.random() < RandomTaskConfig.baseSpawnProbability) {
        this.trySpawnRandomTask(patient, currentTime);
      }
      
      // Check urgent task spawn (separate probability)
      this.checkUrgentTaskSpawn(patient, currentTime);
    });
  }
  
  /**
   * Attempt to spawn a random task for a patient
   */
  trySpawnRandomTask(patient, currentTime) {
    // Check max concurrent random tasks
    const currentCount = this.activeRandomTasks.get(patient.id)?.size || 0;
    if (currentCount >= RandomTaskConfig.maxRandomTasksPerPatient) return;
    
    // Select random task from pool
    const eligibleTasks = RandomTaskConfig.taskPool.filter(task => 
      this.taskConditionsMet(task, patient)
    );
    
    if (eligibleTasks.length === 0) return;
    
    // Weighted random selection
    const task = this.selectWeightedTask(eligibleTasks);
    this.spawnTask(task, patient, currentTime);
  }
  
  /**
   * Check if urgent task should spawn
   */
  checkUrgentTaskSpawn(patient, currentTime) {
    UrgentTaskConfig.tasks.forEach(urgentTask => {
      if (Math.random() < urgentTask.triggerProbability) {
        this.spawnUrgentTask(urgentTask, patient, currentTime);
      }
    });
  }
  
  /**
   * Spawn a task and add to patient's task list
   */
  spawnTask(taskTemplate, patient, currentTime) {
    const task = taskSystem.createTask({
      ...taskTemplate,
      id: `${taskTemplate.id}-${Date.now()}`,
      patientId: patient.id,
      scheduledTime: currentTime,  // Available now
      spawnedAt: currentTime,
      isRandom: true
    });
    
    // Track active random tasks
    if (!this.activeRandomTasks.has(patient.id)) {
      this.activeRandomTasks.set(patient.id, new Set());
    }
    this.activeRandomTasks.get(patient.id).add(task.id);
    
    // Add to patient's task list in UI
    this.addTaskToPatientUI(task, patient);
    
    console.log(`Random task spawned: ${task.name} for ${patient.name}`);
  }
  
  /**
   * Spawn urgent task with alert
   */
  spawnUrgentTask(taskTemplate, patient, currentTime) {
    const task = taskSystem.createTask({
      ...taskTemplate,
      id: `${taskTemplate.id}-${Date.now()}`,
      patientId: patient.id,
      scheduledTime: currentTime,
      spawnedAt: currentTime,
      isUrgent: true
    });
    
    // Show urgent alert
    this.showUrgentAlert(task, patient);
    
    // Add to UI with urgent styling
    this.addTaskToPatientUI(task, patient, { urgent: true });
    
    console.log(`🚨 URGENT task spawned: ${task.name} for ${patient.name}`);
  }
  
  /**
   * Show modal/alert for urgent task
   */
  showUrgentAlert(task, patient) {
    if (UrgentTaskConfig.alertConfig.flashScreen) {
      document.body.classList.add('urgent-alert-flash');
      setTimeout(() => document.body.classList.remove('urgent-alert-flash'), 2000);
    }
    
    // Show modal
    if (UrgentTaskConfig.alertConfig.modal) {
      window.openModal({
        title: `🚨 ${task.name}`,
        content: `
          <div class="text-center">
            <p class="text-lg font-bold text-red-600 mb-2">${patient.name} - ${patient.room}</p>
            <p class="mb-4">Requires immediate attention!</p>
            <p class="text-sm text-gray-600">You have ${task.availability.lateEndMins} minutes to respond.</p>
          </div>
        `,
        footer: `
          <button class="px-6 py-2 bg-red-600 text-white rounded font-bold" onclick="closeModal()">
            Acknowledge
          </button>
        `,
        overlay: true,
        persistent: false
      });
    }
  }
  
  /**
   * Clean up completed random task tracking
   */
  onTaskCompleted(taskId, patientId) {
    this.activeRandomTasks.get(patientId)?.delete(taskId);
  }
}

export const taskSpawner = new TaskSpawner();
export default taskSpawner;
```

### CSS for Urgent Tasks

```css
/* Urgent task styling */
.task-urgency-urgent {
  border-left: 4px solid #f59e0b !important;
  background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);
  animation: urgency-pulse 2s infinite;
}

.task-urgency-critical {
  border-left: 4px solid #dc2626 !important;
  background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
  animation: critical-pulse 1s infinite;
}

@keyframes urgency-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
}

@keyframes critical-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 12px rgba(220, 38, 38, 0);
    transform: scale(1.02);
  }
}

/* Screen flash for urgent alerts */
@keyframes urgent-flash {
  0%, 100% { border-color: transparent; }
  50% { border-color: #dc2626; }
}

body.urgent-alert-flash {
  border: 4px solid transparent;
  animation: urgent-flash 0.5s ease-in-out 4;
}

/* Random task indicator */
.task-random-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #8b5cf6;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.task-random-badge::before {
  content: '🎲';
  margin-right: 2px;
}
```

## Acceptance Checks

1. **Random Task Spawning**
   - [ ] Random tasks spawn at configured probability
   - [ ] Maximum concurrent limit per patient is enforced
   - [ ] Random tasks appear in patient's task list with indicator
   - [ ] Random tasks follow availability rules (until end of shift or specific time)

2. **Urgent Task Spawning**
   - [ ] Urgent tasks spawn with lower probability
   - [ ] Alert modal appears immediately
   - [ ] Screen flashes red briefly
   - [ ] Urgent tasks have short completion windows

3. **Task Availability**
   - [ ] Random task with `until-end-of-shift` stays available until 0700
   - [ ] Random task with `window` mode expires after configured time
   - [ ] Urgent task expires quickly if not started

4. **Visual Distinction**
   - [ ] Random tasks have purple badge indicator
   - [ ] Urgent tasks have amber styling
   - [ ] Critical tasks have red styling with pulse animation

5. **Integration**
   - [ ] Spawned tasks work with slot system
   - [ ] Spawned tasks work with interaction system (penalties/boosts)
   - [ ] Completing spawned tasks removes from tracking

## Output Format Requirements

Return:
1. **File tree**
2. **Code per file**
3. **Test steps**:
   - Start game, wait 15+ game minutes
   - Verify random task spawns with indicator
   - Check that random task follows availability rules
   - (For urgent testing, temporarily increase probability to 0.5)
   - Verify urgent task shows alert and short window

## Example Timeline

```
19:00 - Shift starts
19:15 - Spawn check: 15% chance, rolls 0.12 → Random task spawns
       "Pain Reassessment" appears for Joe with 🎲 badge
       Mode: until-end-of-shift
       
20:00 - Spawn check: rolls 0.45 → No spawn
20:15 - Spawn check: rolls 0.08 → Random spawn
       "Family Member Calling" appears
       Mode: window, 60 mins to respond
       
21:00 - Urgent check: rolls 0.018 → URGENT SPAWN!
       🚨 "Patient Fall!" alert appears
       Screen flashes red
       Modal: "Joe Johnson - Requires immediate attention!"
       Mode: immediate, 10 mins to START
       
21:05 - Player hasn't started fall assessment
       Task shows critical styling, 5 mins remaining
       
21:10 - Task becomes MISSED if not started
       Consequence: "patient-injury" logged
```

