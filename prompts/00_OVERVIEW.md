# RN Shift Simulation Game - Milestone Overview

## Game Concept
A nursing shift simulation where players manage a 12-hour ICU/Med-Surg shift. Tasks (medications, assessments, procedures) become available at scheduled times with specific windows. Players use limited "slots" to perform tasks, where each task blocks a slot for its duration.

## Tech Stack
- **Frontend**: Vanilla JS with ES6 modules
- **Styling**: TailwindCSS (CDN)
- **Dependencies**: jQuery (for context menu), Signals.js
- **No build step** - runs directly in browser via local server

## Architecture Principles
- **Declarative configuration**: Tasks, patients defined in HTML/data attributes
- **Redux-like state**: `game-state.js` with dispatch/subscribe pattern
- **Module pattern**: Each feature is an IIFE or class module
- **Time format**: Military HHMM (e.g., 1900 = 7:00 PM)

## Current State (What's Built)
✅ In-game timer with speed acceleration  
✅ Patient cards with vitals display  
✅ Medications list with scheduled times  
✅ Task status lifecycle (not-yet → active → completed → overdue)  
✅ Time-based activation & expiration  
✅ Modal system for confirmations  
✅ Context menu for task actions  
✅ CSS styling for task states  
✅ 3 task slots UI (visible but non-functional)  

## Key Files
```
game/
├── index.html              # Main game entry
├── assets/
│   ├── js/
│   │   ├── app.js          # Main application
│   │   ├── game-config.js  # Configuration constants
│   │   ├── game-state.js   # Redux-like state manager
│   │   ├── task-system.js  # Task processing logic
│   │   ├── timer_ingame.js # Game clock
│   │   ├── patients.js     # Patient loading/rendering
│   │   └── modal.js        # Modal dialogs
│   └── css/
│       └── declarative-tasks.css  # Task status styles
└── events/patients/
    └── joe.html            # Patient data template
```

## Milestone Sequence

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Foundation (Timer, UI) | ✅ Complete |
| 1 | Basic Task System | ✅ Complete |
| 2 | Task Definition Schema | 🔜 Next |
| 3 | Slot System (Task Queue) | Pending |
| 4 | Availability Windows | Pending |
| 5 | Task Class Interactions | Pending |
| 6 | Random & Urgent Tasks | Pending |
| 7 | Scoring & Feedback | Pending |
| 8 | Multiple Patients | Pending |

## Core Game Mechanics (Target)

### Slots
- 3 slots at bottom of screen
- Task occupies a slot for its `duration` (in-game minutes)
- Cannot start a task if all slots are occupied
- Visual progress on slot during task execution

### Task Availability Windows
| Type | Available From | Available Until |
|------|----------------|-----------------|
| Scheduled | 1hr before scheduled OR at scheduled time | 1hr after scheduled OR end of shift |
| Random | When spawned | End of shift OR specific time |
| Urgent | Immediately | Short window (e.g., 15 mins) |

### Task Classes & Interactions
- Mixing certain task classes in same slot → penalty (longer duration)
- Synergistic task classes → boost (faster completion)
- Example: Giving 2 meds to same patient = efficiency bonus

## Development Commands
```bash
# Start local server (from project root)
python3 -m http.server 8000

# Access game
open http://localhost:8000/game/
```

