Created Files
File	Purpose
00_OVERVIEW.md	Project overview, tech stack, current state, milestone roadmap
01_MILESTONE_TASK_SCHEMA.md	Task classes, types, duration, availability schema
02_MILESTONE_SLOT_SYSTEM.md	3 slots that block during task execution
03_MILESTONE_AVAILABILITY_WINDOWS.md	Early start (1hr before), late end (1hr after), modes
04_MILESTONE_TASK_INTERACTIONS.md	Penalty/boost system for task combinations
05_MILESTONE_RANDOM_URGENT_TASKS.md	Random task spawning, urgent alerts
06_MILESTONE_SCORING_FEEDBACK.md	Points, grades, real-time feedback, end-of-shift summary
07_MILESTONE_MULTIPLE_PATIENTS.md	Supporting 4-6 patients per shift
QUICK_REFERENCE.md	Cheat sheet for task types, attributes, interactions
Phase Breakdown
Already Complete (Phase 0-1):
✅ Timer with speed acceleration
✅ Patient cards, medications display
✅ Task status lifecycle (not-yet → active → completed)
✅ Basic time-based activation
Next Milestones:
Phase	Focus	Key Deliverable
M2	Task Schema	Formal task definitions with class/type/duration
M3	Slot System	Tasks block slots for their duration
M4	Availability Windows	1hr early, 1hr late, end-of-shift modes
M5	Interactions	Batching bonus (-20%), context switch penalty (+15%)
M6	Random/Urgent	Task spawning during shift, urgent alerts
M7	Scoring	Points, grades, end-of-shift summary
M8	Multiple Patients	4-6 patient grid layout
How to Use
Each milestone prompt includes the 5-block structure you specified:
Goal - What this milestone delivers
Non-goals - Explicit scope boundaries
Interfaces/contracts - Data shapes, function signatures
File map - Expected files and their purpose
Acceptance checks - How to verify completion
Feed a milestone prompt to the AI when ready to implement that phase. The prompts prevent scope creep by explicitly stating what NOT to do in each phase.