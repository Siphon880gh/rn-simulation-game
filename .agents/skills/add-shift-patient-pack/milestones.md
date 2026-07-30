# Add shift patient pack — milestones

Use with [SKILL.md](SKILL.md). Persist run state in `progress.json` beside this file when using `/loop`.

## Milestone list

| ID | Name | Done when |
|----|------|-----------|
| **M0** | Interview | `shift` + `unit` confirmed by user (or explicit in the triggering message). **Skill-driven:** satisfied when caller supplies `skillId` + `unit` |
| **M1** | Pack plan | Census table: id → diagnosis → condition→tasks → reuse/new |
| **M2** | Patient content | Each census id has HTML (+ optional past-hx) and `patients.js` entry; times match shift |
| **M3** | Scenario pack | Pack JSON valid; `patients[]` / events / injections consistent; theme + department set |
| **M4** | Wire entry | Landing and/or demo URL updated **only if** this pack is meant to be reachable |
| **M5** | Verify | AUTO checks pass; report condition highlights |

## Per-patient M2 checklist

For each id in the plan:

- [ ] Diagnosis + acuity fit the unit
- [ ] Meds/assessments unique to that condition (not a copy-paste twin)
- [ ] Mobility/obesity/stroke/bedbound → turn-q2h when indicated
- [ ] `data-scheduled` band matches day vs night
- [ ] `patientConfigs` entry + files on disk
- [ ] Past hx mentions the teaching condition when useful

## Loop protocol

1. Write `progress.json` after M0/M1 (see template below).
2. Start `/loop` only for M2+ multi-patient work.
3. Each tick: exactly one unfinished patient in `patients[].status !== "done"`, then save progress.
4. When all patients done → M3 → M4 → M5 in the same tick if small; otherwise next tick.
5. Stop loop on M5 PASS or `blocked_waiting_user`.

## progress.json template

```json
{
  "skill": "add-shift-patient-pack",
  "shift": "day",
  "unit": "medsurg",
  "packFile": "game/events/scenarios/day-shift-medsurg.json",
  "mode": "extend",
  "milestone": "M2",
  "patients": [
    {
      "id": "joe",
      "action": "reuse",
      "diagnosis": "Post-op THA",
      "conditionTasks": "turn-q2h (BMI 38)",
      "status": "done"
    },
    {
      "id": "new-id",
      "action": "create",
      "diagnosis": "…",
      "conditionTasks": "…",
      "status": "pending"
    }
  ],
  "blocked": null,
  "updatedAt": "ISO-8601"
}
```
