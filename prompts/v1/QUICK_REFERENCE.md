# Quick Reference - Task Types & Configuration

## Task Classes (for interaction rules)

| Class | Description | Multiplier |
|-------|-------------|------------|
| `medication` | Drug administration | 1.5x |
| `assessment` | Patient evaluation | 1.2x |
| `procedure` | Hands-on interventions | 1.3x |
| `documentation` | Charting, forms | 0.8x |
| `communication` | MD calls, family | 0.7x |

## Task Types by Class

### Medication
- `med-oral` - Oral medications (5 mins)
- `med-iv` - IV push/piggyback (15 mins)
- `med-injection` - SubQ/IM (10 mins)
- `med-topical` - Creams, patches (5 mins)

### Assessment
- `assess-vitals` - Vital signs (10 mins)
- `assess-pain` - Pain evaluation (10 mins)
- `assess-neuro` - Neurological (15 mins)
- `assess-skin` - Skin/wound check (10 mins)

### Procedure
- `proc-wound-care` - Dressing change (20 mins)
- `proc-catheter` - Foley care (15 mins)
- `proc-iv-check` - IV site check (5 mins)

### Documentation
- `doc-charting` - General charting (10 mins)
- `doc-handoff` - Shift report (20 mins)

### Communication
- `comm-call-md` - Physician call (15 mins)
- `comm-family` - Family update (15 mins)

## Availability Modes

```html
<!-- Mode 1: Window (default) -->
<li data-availability-mode="window"
    data-early-start-mins="60"
    data-late-end-mins="60">

<!-- Mode 2: Until End of Shift -->
<li data-availability-mode="until-end-of-shift"
    data-early-start-mins="60">

<!-- Mode 3: Until Specific Time -->
<li data-availability-mode="until-specific-time"
    data-early-start-mins="60"
    data-until-time="2300">

<!-- Mode 4: Immediate (urgent) -->
<li data-availability-mode="immediate"
    data-late-end-mins="10">
```

## Task Status Flow

```
NOT_YET ──► AVAILABLE ──► ACTIVE ──► COMPLETED
                │                         
                └──────► MISSED (if window closes)
```

## HTML Data Attributes

| Attribute | Required | Example | Description |
|-----------|----------|---------|-------------|
| `data-task-type` | Yes | `"med"` | Task type |
| `data-task-class` | Yes | `"medication"` | Task class |
| `data-scheduled` | Yes | `"2200"` | HHMM scheduled time |
| `data-duration-mins` | Yes | `"10"` | Base duration |
| `data-early-start-mins` | No | `"60"` | Minutes before scheduled (default: 60) |
| `data-late-end-mins` | No | `"60"` | Minutes after scheduled (default: 60) |
| `data-availability-mode` | No | `"window"` | Availability mode (default: window) |
| `data-status` | Auto | `"not-yet"` | Current status |

## Interaction Rules Quick Ref

### Boosts (faster)
- Same patient meds back-to-back: **-20%**
- Assessment → Documentation: **-15%**
- Assessment → Communication: **-10%**

### Penalties (slower)
- Different patient context switch: **+15%**
- Interrupt procedure for communication: **+25%**
- IV meds back-to-back: **+20%** (safety check)

## Urgency Levels

| Level | Styling | Use Case |
|-------|---------|----------|
| `normal` | Green border | Regular scheduled tasks |
| `elevated` | Blue border | Random tasks |
| `urgent` | Amber border, pulse | Needs attention soon |
| `critical` | Red border, fast pulse | Immediate attention |

## Scoring Quick Ref

| Event | Points |
|-------|--------|
| Task on time | +100 × multiplier |
| Task near deadline | +75 × multiplier |
| Task missed | -50 × multiplier |
| Urgent completed | +150 × multiplier |
| Urgent missed | -200 × multiplier |
| Perfect med pass | +500 bonus |
| On-time shift finish | +300 bonus |
| Per boost earned | +10 bonus |

## Milestone Checklist

- [ ] **M2**: Task Schema - definitions, validation, parsing
- [ ] **M3**: Slot System - blocking, progress, completion
- [ ] **M4**: Availability Windows - early/late, modes
- [ ] **M5**: Interactions - boosts, penalties, context
- [ ] **M6**: Random/Urgent - spawning, alerts
- [ ] **M7**: Scoring - points, grades, summary
- [ ] **M8**: Multiple Patients - grid, patient configs

