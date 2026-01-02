# Milestone 4: Availability Windows

## Context
Tasks (especially medications) should become available before their scheduled time and remain available after. The user specified: "can be readily available 1 hour or some time before it's scheduled, up till one hour after the scheduled times."

Currently, tasks become available exactly at scheduled time. We need flexible availability windows.

## Goal
Implement comprehensive availability window logic where scheduled tasks can start early, have configurable "available until" periods, and properly transition through AVAILABLE → ACTIVE → COMPLETED/MISSED states.

## Non-Goals
- ❌ Do NOT implement random task spawning (Milestone 6)
- ❌ Do NOT implement urgent task mechanics (Milestone 6)
- ❌ Do NOT change slot blocking duration (that's based on task duration, not availability)
- ❌ Do NOT implement penalty/boost systems

## Constraints
- Build on Milestone 2's task schema
- Use existing timer tick mechanism for state transitions
- Maintain backward compatibility with `data-expire` attribute

## Existing Context (After Milestone 2 & 3)
- Tasks have `availability.earlyStartMins`, `availability.lateEndMins`, `availability.mode`
- Slot system handles task execution duration
- Game state tracks `currentTime` in HHMM format

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/task-system.js` | MODIFY | New availability window processing |
| `game/assets/js/task-schema.js` | MODIFY | Add helper functions |
| `game/assets/css/declarative-tasks.css` | MODIFY | New 'available' status styling |

## Contracts / Interfaces

### Task Status Lifecycle (Updated)

```
NOT_YET ──[earlyStart reached]──► AVAILABLE ──[user performs]──► ACTIVE ──[duration elapsed]──► COMPLETED
                                      │
                                      └──[lateEnd passed]──► MISSED
```

### Availability Window Types

```javascript
/**
 * Type 1: Fixed Window
 * Available from (scheduled - earlyStartMins) to (scheduled + lateEndMins)
 */
{
  mode: 'window',
  earlyStartMins: 60,  // Available 1 hour before scheduled
  lateEndMins: 60      // Must complete within 1 hour after scheduled
}

/**
 * Type 2: Until End of Shift
 * Available from (scheduled - earlyStartMins) until shift ends (0700)
 */
{
  mode: 'until-end-of-shift',
  earlyStartMins: 60
}

/**
 * Type 3: Until Specific Time
 * Available from (scheduled - earlyStartMins) until specific HHMM
 */
{
  mode: 'until-specific-time',
  earlyStartMins: 60,
  untilTime: 2300  // Must complete by 11 PM regardless of scheduled time
}
```

### Processing Functions

```javascript
/**
 * Determine if a task should transition to AVAILABLE status
 * @param {TaskDefinition} task
 * @param {number} currentTime - HHMM
 * @returns {boolean}
 */
function shouldBecomeAvailable(task, currentTime) {
  const { scheduledTime, availability } = task;
  const earlyStart = subtractMinutes(scheduledTime, availability.earlyStartMins);
  return currentTime >= earlyStart && task.status === 'not-yet';
}

/**
 * Determine if a task should transition to MISSED status
 * @param {TaskDefinition} task
 * @param {number} currentTime - HHMM
 * @param {number} shiftEndTime - HHMM
 * @returns {boolean}
 */
function shouldBecomeMissed(task, currentTime, shiftEndTime) {
  if (task.status !== 'available') return false;
  
  const { availability, scheduledTime } = task;
  
  switch (availability.mode) {
    case 'window':
      const lateEnd = addMinutes(scheduledTime, availability.lateEndMins);
      return currentTime > lateEnd;
      
    case 'until-end-of-shift':
      return currentTime >= shiftEndTime;
      
    case 'until-specific-time':
      return currentTime > availability.untilTime;
      
    default:
      return false;
  }
}

/**
 * Calculate remaining time until task window closes
 * @param {TaskDefinition} task
 * @param {number} currentTime - HHMM
 * @param {number} shiftEndTime - HHMM
 * @returns {number} Minutes remaining, or -1 if already missed
 */
function getTimeUntilWindowCloses(task, currentTime, shiftEndTime) {
  // Returns minutes until the task will become MISSED
}
```

### Visual Indicators

```javascript
/**
 * Get urgency level for UI coloring
 * @param {TaskDefinition} task
 * @param {number} currentTime
 * @param {number} shiftEndTime
 * @returns {'normal'|'warning'|'critical'}
 */
function getTaskUrgency(task, currentTime, shiftEndTime) {
  const minsRemaining = getTimeUntilWindowCloses(task, currentTime, shiftEndTime);
  
  if (minsRemaining <= 15) return 'critical';    // Red - urgent
  if (minsRemaining <= 30) return 'warning';     // Yellow - getting close
  return 'normal';                                // Green - plenty of time
}
```

### CSS States

```css
/* Available but plenty of time */
.task-status-available {
  opacity: 1;
  background-color: #ffffff;
  border-left: 4px solid #10b981; /* green */
}

/* Available but getting close to deadline */
.task-status-available.urgency-warning {
  border-left-color: #f59e0b; /* yellow/amber */
  background-color: #fffbeb;
}

/* Available but almost out of time */
.task-status-available.urgency-critical {
  border-left-color: #ef4444; /* red */
  background-color: #fef2f2;
  animation: pulse-urgent 1s infinite;
}

/* Missed - window closed */
.task-status-missed {
  opacity: 0.5;
  background-color: #fecaca;
  border-left: 4px solid #b91c1c;
  text-decoration: line-through;
}
```

### HTML Data Attribute Updates

```html
<!-- Current format (backward compatible) -->
<li data-scheduled="2200" data-expire="+120">

<!-- New extended format -->
<li 
  data-scheduled="2200"
  data-early-start-mins="60"
  data-late-end-mins="60"
  data-availability-mode="window"
>
```

## Acceptance Checks

1. **Early Availability**
   - [ ] Task with `earlyStartMins: 60` and `scheduled: 2200` becomes AVAILABLE at 21:00
   - [ ] Task appears clickable/performable when AVAILABLE
   - [ ] NOT_YET tasks remain non-interactive

2. **Window Closing**
   - [ ] Task becomes MISSED when `lateEndMins` passes (mode: window)
   - [ ] Task becomes MISSED at end of shift (mode: until-end-of-shift)
   - [ ] Task becomes MISSED at specific time (mode: until-specific-time)

3. **Urgency Indicators**
   - [ ] Tasks show normal styling when >30 mins remaining
   - [ ] Tasks show warning styling when 15-30 mins remaining
   - [ ] Tasks show critical styling when <15 mins remaining

4. **Time Display**
   - [ ] Each available task shows "X mins remaining" or countdown
   - [ ] Countdown updates with game time

5. **Backward Compatibility**
   - [ ] Existing `data-expire="+120"` still works (converts to lateEndMins: 120)
   - [ ] Existing `data-expire="2300"` still works (mode: until-specific-time)

## Output Format Requirements

Return:
1. **File tree**
2. **Code per file**
3. **Test steps**:
   - Set shift start to 19:00
   - Heparin scheduled at 19:30 with 60 min early start
   - Verify Heparin shows as AVAILABLE at 19:00 (not 19:30)
   - Wait until 20:30 (1 hour after scheduled)
   - Verify Heparin shows as MISSED if not performed

## Example Timeline

```
Medication: Heparin
Scheduled: 19:30
Early Start: 60 mins
Late End: 60 mins

18:00 - Status: NOT_YET (grayed out)
18:30 - Status: AVAILABLE (green, clickable) ← earlyStart reached
19:00 - Status: AVAILABLE (still green)
19:30 - Status: AVAILABLE (scheduled time, still available)
20:00 - Status: AVAILABLE + WARNING (yellow, 30 mins left)
20:15 - Status: AVAILABLE + CRITICAL (red, 15 mins left)
20:30 - Status: MISSED (if not performed) ← lateEnd reached
```

