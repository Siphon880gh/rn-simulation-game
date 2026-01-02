# Milestone 8: Multiple Patients

## Context
Currently the game has a single patient (Joe). Real nursing shifts involve managing 4-6 patients simultaneously. This adds complexity and requires prioritization skills.

## Goal
Enable loading and managing multiple patients with proper task organization per patient.

## Non-Goals
- ❌ Do NOT implement patient transfers (admission/discharge)
- ❌ Do NOT implement patient deterioration chains
- ❌ Do NOT implement different unit types yet

## Constraints
- Maximum 6 patients per shift
- Each patient has their own HTML file in `events/patients/`
- Grid layout adjusts based on patient count

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/events/patients/mary.html` | CREATE | Second patient |
| `game/events/patients/robert.html` | CREATE | Third patient |
| `game/assets/js/patients.js` | MODIFY | Load multiple patients |
| `game/index.html` | MODIFY | Grid layout for patients |

## Contracts / Interfaces

### Patient Configuration

```javascript
// In patients.js - expand patientConfigs
const patientConfigs = {
  joe: {
    id: 'joe',
    name: 'Joe Johnson',
    room: 'Room 201-A',
    age: 68,
    diagnosis: 'Post-op Total Hip Replacement',
    acuity: 3,  // 1-5 scale
    htmlFile: 'events/patients/joe.html'
  },
  mary: {
    id: 'mary',
    name: 'Mary Williams',
    room: 'Room 201-B',
    age: 74,
    diagnosis: 'CHF Exacerbation',
    acuity: 4,
    htmlFile: 'events/patients/mary.html'
  },
  robert: {
    id: 'robert', 
    name: 'Robert Chen',
    room: 'Room 202-A',
    age: 55,
    diagnosis: 'Post-op CABG Day 2',
    acuity: 4,
    htmlFile: 'events/patients/robert.html'
  }
};
```

### Grid Layout

```css
/* Dynamic grid based on patient count */
#patients {
  display: grid;
  gap: 16px;
}

#patients.patients-1 { grid-template-columns: 1fr; max-width: 400px; }
#patients.patients-2 { grid-template-columns: repeat(2, 1fr); }
#patients.patients-3 { grid-template-columns: repeat(3, 1fr); }
#patients.patients-4 { grid-template-columns: repeat(2, 1fr); }
#patients.patients-5 { grid-template-columns: repeat(3, 1fr); }
#patients.patients-6 { grid-template-columns: repeat(3, 1fr); }
```

## Acceptance Checks

- [ ] Multiple patient cards render in grid
- [ ] Each patient has own task list
- [ ] Context switch penalty applies between patients
- [ ] Batching boost applies within same patient
- [ ] Score tracks per-patient and total metrics

## Example Patient (Mary - CHF)

```html
<!-- events/patients/mary.html -->
<div class="patient">
  <div class="flex justify-between items-top mb-4">
    <h3 class="text-lg font-bold">Mary Williams</h3>
    <span class="text-sm bg-gray-100 px-2 py-1 rounded">Room 201-B</span>
  </div>
  <div class="mb-4">
    <p class="text-sm text-gray-600">Age: 74</p>
    <p class="text-sm text-gray-600">Diagnosis: CHF Exacerbation</p>
  </div>
  <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
    <div class="flex items-center gap-1">
      <span>HR: 92</span>
    </div>
    <div>BP: 148/88</div>
    <div>Temp: 98.2°F</div>
    <div>O<sub>2</sub>: 92% on 2L NC</div>
    <div>Weight: +3 lbs from yesterday</div>
    <div>RR: 22</div>
  </div>
  <!-- Medications -->
  <ul class="meds-list">
    <li data-task-type="med" data-task-class="medication" data-scheduled="2000" 
        data-early-start-mins="60" data-late-end-mins="60" data-duration-mins="5">
      <span class="font-medium">Furosemide 40mg IV</span>
      <span class="ml-auto text-sm text-gray-500">2000</span>
    </li>
    <li data-task-type="med" data-task-class="medication" data-scheduled="2200"
        data-early-start-mins="60" data-late-end-mins="60" data-duration-mins="5">
      <span class="font-medium">Metoprolol 25mg PO</span>
      <span class="ml-auto text-sm text-gray-500">2200</span>
    </li>
    <li data-task-type="med" data-task-class="medication" data-scheduled="0600"
        data-early-start-mins="60" data-late-end-mins="60" data-duration-mins="5">
      <span class="font-medium">Lisinopril 10mg PO</span>
      <span class="ml-auto text-sm text-gray-500">0600</span>
    </li>
  </ul>
  <!-- Assessments -->
  <ul class="tasks-list">
    <li data-task-type="assessment" data-task-class="assessment" data-scheduled="2000"
        data-availability-mode="until-end-of-shift" data-duration-mins="15">
      <span class="font-medium">Daily Weight & I/O Assessment</span>
    </li>
    <li data-task-type="assessment" data-task-class="assessment" data-scheduled="2200"
        data-availability-mode="window" data-late-end-mins="120" data-duration-mins="10">
      <span class="font-medium">Lung Sounds Assessment</span>
    </li>
  </ul>
</div>
```

## Output Format

Return:
1. File tree
2. Code for new patient HTML files
3. Modified patients.js for multi-patient loading
4. Test steps for verifying multiple patients render and interact correctly

