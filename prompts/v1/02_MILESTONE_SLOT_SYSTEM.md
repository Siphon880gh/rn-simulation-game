# Milestone 3: Slot System (Task Queue)

## Context
The game displays 3 empty task slots at the bottom of the screen. These slots represent the nurse's "hands" - how many tasks can be actively worked on. When a task is performed, it should occupy a slot for its duration and block that slot from being used.

## Goal
Implement a functional slot system where starting a task occupies a slot, the slot shows progress during the task duration, and the slot is released when the task completes.

## Non-Goals
- ❌ Do NOT implement penalty/boost modifiers to duration yet (Milestone 5)
- ❌ Do NOT implement task queuing (waiting for slot to free up)
- ❌ Do NOT implement slot upgrades or variable slot counts
- ❌ Do NOT implement random task interruptions

## Constraints
- Use existing HTML structure for slots (`#task-queue-bar`)
- Slot progress should update with the game timer (not real-time)
- Must work with the speed factor (1440x acceleration)
- Integrate with existing `game-state.js` for slot tracking

## Existing File Tree
```
game/
├── index.html              # Has #task-queue-bar with 3 slots
├── assets/
│   ├── js/
│   │   ├── game-state.js   # Modify: add slot state
│   │   ├── task-system.js  # Modify: slot assignment on task start
│   │   └── app.js          # May need slot UI updates
│   └── css/
│       └── declarative-tasks.css  # Modify: slot styles
```

## Required File Map for This Milestone

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/slot-system.js` | CREATE | Slot management module |
| `game/assets/js/game-state.js` | MODIFY | Add slots to state |
| `game/assets/js/task-system.js` | MODIFY | Integrate slot assignment |
| `game/assets/css/declarative-tasks.css` | MODIFY | Slot progress styles |
| `game/index.html` | MODIFY | Update slot HTML structure |

## Contracts / Interfaces

### Slot State Schema

```javascript
/**
 * Slot State
 * @typedef {Object} SlotState
 * @property {number} id - Slot index (0, 1, 2)
 * @property {'empty'|'occupied'|'completing'} status
 * @property {string|null} taskId - Currently assigned task
 * @property {number} startTime - HHMM when task started
 * @property {number} endTime - HHMM when task will complete
 * @property {number} progress - 0-100 percentage complete
 */

/**
 * Game State Slots Addition
 */
state.slots = [
  { id: 0, status: 'empty', taskId: null, startTime: null, endTime: null, progress: 0 },
  { id: 1, status: 'empty', taskId: null, startTime: null, endTime: null, progress: 0 },
  { id: 2, status: 'empty', taskId: null, startTime: null, endTime: null, progress: 0 }
];
```

### Slot System Module (`slot-system.js`)

```javascript
/**
 * Find first available slot
 * @returns {number|null} Slot index or null if all occupied
 */
export function findAvailableSlot();

/**
 * Assign task to a slot
 * @param {number} slotIndex
 * @param {string} taskId
 * @param {number} durationMins - In-game minutes
 * @param {number} currentTime - HHMM
 * @returns {boolean} Success
 */
export function assignTaskToSlot(slotIndex, taskId, durationMins, currentTime);

/**
 * Update slot progress based on current time
 * Called every timer tick
 * @param {number} currentTime - HHMM
 * @returns {Array<{slotIndex: number, taskId: string}>} Completed tasks
 */
export function updateSlotProgress(currentTime);

/**
 * Release a slot (task completed or cancelled)
 * @param {number} slotIndex
 */
export function releaseSlot(slotIndex);

/**
 * Get slot by task ID
 * @param {string} taskId
 * @returns {SlotState|null}
 */
export function getSlotByTask(taskId);

/**
 * Check if any slot is available
 * @returns {boolean}
 */
export function hasAvailableSlot();
```

### Updated HTML Structure

```html
<div id="task-queue-bar" class="fixed bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-lg">
  <div class="slot" data-slot-index="0" data-status="empty">
    <div class="slot-content">
      <img src="" alt="" class="slot-icon hidden">
      <span class="slot-label"></span>
    </div>
    <div class="slot-progress-bar">
      <div class="slot-progress-fill" style="width: 0%"></div>
    </div>
    <!-- Duration timemark: shows completion time in HHMM format -->
    <span class="slot-duration-timemark"></span>
  </div>
  <!-- Repeat for slots 1 and 2 -->
</div>
```

### Duration Timemark Display

When a slot is occupied, display the **completion time** (not remaining time) as a timemark in HHMM format at the bottom center of the slot.

```javascript
/**
 * Format end time for slot display
 * @param {number} endTime - HHMM when task completes
 * @returns {string} Formatted time "HH:MM"
 */
function formatSlotTimemark(endTime) {
  const hours = Math.floor(endTime / 100);
  const mins = endTime % 100;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Example: Task starts at 19:00, duration 10 mins
// Slot shows: "19:10" at bottom center
```

### Game State Actions

```javascript
// New actions for game-state.js
this.actions.set('ASSIGN_SLOT', (payload) => {
  const { slotIndex, taskId, startTime, endTime } = payload;
  const newSlots = [...this.state.slots];
  newSlots[slotIndex] = {
    ...newSlots[slotIndex],
    status: 'occupied',
    taskId,
    startTime,
    endTime,
    progress: 0
  };
  return { ...this.state, slots: newSlots };
});

this.actions.set('UPDATE_SLOT_PROGRESS', (payload) => {
  const { slotIndex, progress } = payload;
  // Update slot progress
});

this.actions.set('RELEASE_SLOT', (payload) => {
  const { slotIndex } = payload;
  // Reset slot to empty
});
```

### CSS Additions

```css
.slot {
  @apply w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden;
  @apply flex flex-col items-center justify-center;
  @apply transition-all duration-300;
}

.slot[data-status="empty"] {
  @apply bg-gray-50 border-dashed;
}

.slot[data-status="occupied"] {
  @apply bg-blue-50 border-blue-300 border-solid;
}

.slot[data-status="completing"] {
  @apply bg-green-50 border-green-300;
  animation: pulse 0.5s ease-in-out;
}

.slot-progress-bar {
  @apply absolute bottom-0 left-0 right-0 h-1 bg-gray-200;
}

.slot-progress-fill {
  @apply h-full bg-blue-500 transition-all duration-100;
}

/* Duration timemark - shows completion time at bottom center */
.slot-duration-timemark {
  @apply absolute bottom-1 left-1/2 -translate-x-1/2;
  @apply text-xs font-mono font-medium text-gray-600;
  @apply bg-white/80 px-1 rounded;
}

.slot[data-status="empty"] .slot-duration-timemark {
  @apply hidden;
}

.slot[data-status="occupied"] .slot-duration-timemark {
  @apply block;
}
```

## Acceptance Checks

1. **Slot Assignment**
   - [ ] Clicking "Perform" on available task assigns to first empty slot
   - [ ] If all slots occupied, "Perform" action is disabled/hidden
   - [ ] Task element shows "In Progress" indicator when in slot

2. **Progress Tracking**
   - [ ] Slot progress bar advances with game time
   - [ ] Progress calculation accounts for speed factor
   - [ ] Time remaining displays correctly (in game time)

3. **Task Completion**
   - [ ] Task auto-completes when progress reaches 100%
   - [ ] Slot releases and returns to empty state
   - [ ] Task status updates to 'completed'
   - [ ] Completion event fires (for future scoring)

4. **Visual Feedback**
   - [ ] Empty slots appear dashed/faded
   - [ ] Occupied slots show task icon/name
   - [ ] Progress bar fills smoothly
   - [ ] Completion has brief animation
   - [ ] **Duration timemark shows completion time (e.g., "19:10") at bottom center**
   - [ ] Timemark hidden when slot is empty

5. **State Persistence**
   - [ ] Pausing game pauses slot progress
   - [ ] Slot state survives timer tick updates
   - [ ] `game-state.slots` reflects current slot status

## Output Format Requirements

Return:
1. **File tree** with new/modified files
2. **Code per file**
3. **Test steps**:
   - Start game
   - Wait for medication to become available
   - Click medication → Perform
   - Observe slot fills and progress advances
   - Verify task completes when progress reaches 100%

## Example Flow

```
Time: 19:00 - Shift starts
Time: 19:00 - Heparin becomes available (scheduled 19:30, early start 60min)
User: Clicks Heparin → Perform
Slot 0: Occupied, taskId: 'joe-heparin-1', duration: 10min
       Progress bar starts at 0%
       Timemark shows: "19:10" (completion time)
Time: 19:05 - Progress: 50%, timemark still shows "19:10"
Time: 19:10 - Progress: 100%, task completes
Slot 0: Empty again, timemark hidden
Heparin: Status = 'completed'
```

