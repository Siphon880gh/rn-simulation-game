# RN Simulation Game

By Weng Fei Fung

![Last Commit](https://img.shields.io/github/last-commit/Siphon880gh/In-Game-Timer/main)
<a target="_blank" href="https://github.com/Siphon880gh" rel="nofollow"><img src="https://img.shields.io/badge/GitHub--blue?style=social&logo=GitHub" alt="Github" data-canonical-src="https://img.shields.io/badge/GitHub--blue?style=social&logo=GitHub" style="max-width:8.5ch;"></a>
<a target="_blank" href="https://www.linkedin.com/in/weng-fung/" rel="nofollow"><img src="https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin&labelColor=blue" alt="Linked-In" data-canonical-src="https://img.shields.io/badge/LinkedIn-blue?style=flat&amp;logo=linkedin&amp;labelColor=blue" style="max-width:10ch;"></a>
<a target="_blank" href="https://www.youtube.com/@WayneTeachesCode/" rel="nofollow"><img src="https://img.shields.io/badge/Youtube-red?style=flat&logo=youtube&labelColor=red" alt="Youtube" data-canonical-src="https://img.shields.io/badge/Youtube-red?style=flat&amp;logo=youtube&amp;labelColor=red" style="max-width:10ch;"></a>

## Description

Experience the intensity of a fast-paced 12-hour shift in this nursing simulation game. Manage multiple patients in ICU and Med-Surg units, facing real workloads and emergent situations. Your goal is to complete your shift without going into overtime, testing your clinical judgment, time management, and prioritization skills in a dynamic hospital environment.

## STATUS
This project is a work in progress and is currently in its early stages.

## Hospital Shifts

These are optional:
- ?speed-factor=4&shift-starts=1700


## Tasks

For an element to be read as a task that is scheduled, the player can perfrom, and there's a deadline, there are three html attributes:
- `data-scheduled="2100"`
- `data-expire="+120"` or `data-expire="2300"` 
- `data-duration-mins="10"`

```
    <li data-scheduled="2100" data-expire="+120" data-duration-mins="10" class="bg-white p-4 rounded-lg shadow flex items-center">
        <i class="fas fa-pills text-blue-500 text-xl mr-3"></i>
        <span class="font-medium text-gray-900">Atorvastatin</span>
        <span class="ml-auto text-sm text-gray-500">2200</span>
    </li>
    <li data-scheduled="2100" data-expire="2300" data-duration-mins="10" class="bg-white p-4 rounded-lg shadow flex items-center">
        <i class="fas fa-pills text-blue-500 text-xl mr-3"></i>
        <span class="font-medium text-gray-900">Aspirin (Low-dose)</span>
        <span class="ml-auto text-sm text-gray-500">2200</span>
    </li>
```

Speed factors to how long your simulation session will be:
- 12 hours → speedFactor = 1
- 6 hours → speedFactor = 2
- 3 hours → speedFactor = 4
- 2 hours → speedFactor = 6
- 1 hour → speedFactor = 12
- 45 minutes → speedFactor = 16
- 30 minutes → speedFactor = 24
- 15 minutes → speedFactor = 48
- 10 minutes → speedFactor = 72
- 5 minutes → speedFactor = 144
- 3 minutes → speedFactor = 360


### Future Features:

- Handle diverse patient populations in both ICU and Med-Surg settings
- Respond to emergent situations like:
  - Code Blues
  - Rapid Responses
  - Sudden Patient Deterioration
  - New Admissions/Transfers
- Balance competing priorities:
  - Medication Administration
  - Patient Assessments
  - New Orders & Procedures
  - Documentation
  - Care Planning
  - Family Communication
- Real-time vital sign monitoring
- Dynamic patient conditions that can change based on interventions
- Realistic time pressure with an in-game 12-hour shift clock
- Performance scoring based on patient outcomes and task completion

### Learning Objectives:

- Develop clinical prioritization skills
- Practice safe medication administration
- Improve time management in high-pressure situations
- Learn to delegate appropriately
- Master documentation requirements
- Handle emergencies while maintaining care for other assigned patients

Perfect for nursing students and new graduates to practice clinical decision-making in a risk-free environment. Challenge yourself with increasing difficulty levels as you gain experience managing complex patient assignments.
