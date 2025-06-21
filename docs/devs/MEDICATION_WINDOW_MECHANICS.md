# Medication Window Time Mechanics

This document explains how medication administration windows work in the RN Game simulation.

## Overview

The RN Game simulates realistic nursing medication administration with time-sensitive windows. Medications have scheduled times and expiration windows that reflect real-world clinical practice where medications must be administered within specific timeframes.

## Core Components

### 1. Task System Architecture

The medication window system is built on a declarative task processing system located in `game/assets/js/task-system.js`. Key components include:

- **Task Processors**: Handle medication-specific logic
- **Time Parsing**: Supports both absolute and relative time formats
- **Status Management**: Tracks medication states through their lifecycle

### 2. Time Format

The game uses a 24-hour military time format (HHMM):
- `1900` = 7:00 PM
- `2300` = 11:00 PM
- `0700` = 7:00 AM

## Medication Window Configuration

### HTML Data Attributes

Medications are defined in patient HTML files (e.g., `game/events/patients/joe.html`) using data attributes:

```html
<li data-task-type="med" 
    data-status="not-yet" 
    data-scheduled="2100" 
    data-expire="+120" 
    data-duration-mins="10">
```

### Key Attributes

| Attribute | Description | Example Values |
|-----------|-------------|----------------|
| `data-scheduled` | When medication becomes available to administer | `"2100"` (9:00 PM) |
| `data-expire` | When medication window expires | `"2300"` or `"+120"` |
| `data-duration-mins` | How long administration takes | `"10"` (10 minutes) |

### Expiration Time Formats

The system supports two expiration formats:

1. **Absolute Time**: `data-expire="2300"`
   - Medication expires at exactly 11:00 PM

2. **Relative Time**: `data-expire="+120"`
   - Medication expires 120 minutes after scheduled time
   - If scheduled at 21:00, expires at 23:00

## Time Window Logic

### Task Status Lifecycle

```
NOT_YET → ACTIVE → COMPLETED/OVERDUE
```

1. **NOT_YET**: Before scheduled time
2. **ACTIVE**: Within administration window (scheduled ≤ current time < expire)
3. **OVERDUE**: Past expiration time without completion
4. **COMPLETED**: Successfully administered

### Processing Rules

Located in `task-system.js`, the system processes each medication task:

```javascript
// Activation check
shouldActivate: (task, currentTime) => {
  return currentTime >= task.scheduled;
}

// Expiration check  
shouldExpire: (task, currentTime) => {
  return task.expire && currentTime > task.expire;
}
```

### Time Calculation

The `parseTime()` method handles both formats:

```javascript
parseTime(timeStr, baseTime = null) {
  if (str.startsWith('+')) {
    const minutes = parseInt(str.slice(1));
    return this.addMinutesToTime(baseTime, minutes);
  }
  return parseInt(str);
}
```

The `addMinutesToTime()` function properly handles time arithmetic:
- Converts HHMM to minutes since midnight
- Adds offset minutes
- Handles day rollover (24-hour wrap)
- Converts back to HHMM format

## Real Examples from Joe Patient

### Example 1: Relative Window
```html
<li data-scheduled="2100" data-expire="+120">Atorvastatin</li>
```
- **Scheduled**: 21:00 (9:00 PM)  
- **Expires**: 23:00 (11:00 PM) - 2 hours after scheduled
- **Window**: 2 hours to administer

### Example 2: Absolute Window  
```html
<li data-scheduled="2100" data-expire="2300">Aspirin</li>
```
- **Scheduled**: 21:00 (9:00 PM)
- **Expires**: 23:00 (11:00 PM) - absolute time
- **Window**: 2 hours to administer

### Example 3: Tight Window
```html
<li data-scheduled="1900" data-expire="2030">Heparin</li>
```
- **Scheduled**: 19:00 (7:00 PM)
- **Expires**: 20:30 (8:30 PM)  
- **Window**: 1.5 hours to administer

## User Interface Elements

### Display Time vs. Actual Schedule

The UI presents medication times in a user-friendly way that mimics real clinical practice:

- **Displayed Time**: Shows the midpoint between scheduled and expiration times
- **Actual Activation**: Tasks become clickable at the true scheduled time
- **Visual Window**: Creates impression of ±1 hour administration window

#### Example:
```html
<li data-scheduled="2100" data-expire="2300">
  <span class="ml-auto text-sm text-gray-500">2200</span>
</li>
```

- **Scheduled**: 21:00 (actual activation time)
- **Expires**: 23:00 
- **Displayed**: 22:00 (midpoint - suggests 1 hour before/after)
- **User perception**: "Give medication around 22:00 ±1 hour"
- **System behavior**: Becomes clickable at 21:00, expires at 23:00

This design mirrors real nursing practice where medications are often charted with target times but have acceptable administration windows.

### Visual Indicators

Tasks change appearance based on status:
- CSS classes: `task-status-not-yet`, `task-status-active`, `task-status-overdue`
- Status-based styling in `game/assets/css/patients.css`

### Context Menu Actions

Right-click on active medications provides:
- **"Administer Medication"**: Initiates administration process
- **"Medication Details"**: Shows scheduling and expiration info

### Confirmation Flow

When administering medication:
1. Confirmation modal appears
2. User confirms administration  
3. Time is recorded in task metadata
4. Task status changes to COMPLETED

## Implementation Files

| File | Purpose |
|------|---------|
| `game/assets/js/task-system.js` | Core medication window logic |
| `game/assets/js/timer_utils.js` | Time arithmetic utilities |
| `game/events/patients/joe.html` | Patient-specific medication data |
| `game/assets/js/modal.js` | Confirmation dialogs |
| `game/assets/css/patients.css` | Visual styling |

## Clinical Accuracy

The system reflects real nursing practice:
- **PRN medications**: Given as needed within windows
- **Scheduled medications**: Must be given within safe time ranges  
- **Critical medications**: Tighter windows (e.g., Heparin)
- **Documentation**: Administration times are recorded

## Game Mechanics Impact

- **Scoring**: Late or missed medications affect patient outcomes
- **Time pressure**: Multiple medications with overlapping windows
- **Prioritization**: Players must decide medication order
- **Realism**: Mirrors actual clinical decision-making

This medication window system creates authentic nursing simulation experiences while teaching proper medication administration timing and prioritization skills. 