# Milestone 7: Scoring & Feedback System

## Context
Players need feedback on their performance throughout the shift and a comprehensive end-of-shift summary. This creates the "game feel" and helps players improve.

## Goal
Implement a scoring system that tracks task completion, timing, and quality. Provide real-time feedback and end-of-shift summary.

## Non-Goals
- ❌ Do NOT implement leaderboards
- ❌ Do NOT implement save/load game state
- ❌ Do NOT implement achievements
- ❌ Do NOT implement difficulty levels (yet)

## Constraints
- Score updates should be non-intrusive
- End-of-shift summary should be detailed but skippable
- Performance metrics should be medically meaningful

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/scoring-system.js` | CREATE | Score calculation and tracking |
| `game/assets/js/feedback-ui.js` | CREATE | Real-time feedback display |
| `game/assets/js/end-of-shift.js` | CREATE | Summary screen |
| `game/assets/css/scoring.css` | CREATE | Score display styles |
| `game/index.html` | MODIFY | Add score UI elements |

## Contracts / Interfaces

### Scoring Configuration

```javascript
export const ScoringConfig = {
  /**
   * Points for task completion based on timing
   */
  taskPoints: {
    // Completed well within window
    onTime: 100,
    
    // Completed but close to deadline (last 25% of window)
    nearDeadline: 75,
    
    // Task missed entirely
    missed: -50,
    
    // Urgent task completed
    urgentCompleted: 150,
    
    // Urgent task missed
    urgentMissed: -200
  },
  
  /**
   * Multipliers for task importance
   */
  taskMultipliers: {
    [TaskClass.MEDICATION]: 1.5,   // Medications are critical
    [TaskClass.ASSESSMENT]: 1.2,
    [TaskClass.PROCEDURE]: 1.3,
    [TaskClass.DOCUMENTATION]: 0.8,
    [TaskClass.COMMUNICATION]: 0.7
  },
  
  /**
   * Bonus points
   */
  bonuses: {
    // All scheduled medications on time
    perfectMedPass: 500,
    
    // No missed tasks in a 2-hour period
    flawlessWindow: 200,
    
    // Completed shift without overtime
    onTimeFinish: 300,
    
    // Used batching efficiently (X boosts applied)
    efficientBatching: 10  // per boost applied
  },
  
  /**
   * Penalties
   */
  penalties: {
    // Shift went into overtime (per minute)
    overtimePerMin: -10,
    
    // Multiple urgent tasks at once (poor prioritization)
    urgentBacklog: -100
  },
  
  /**
   * Grade thresholds (percentage of max possible)
   */
  grades: {
    A: 0.90,  // 90%+ = A
    B: 0.80,  // 80-89% = B
    C: 0.70,  // 70-79% = C
    D: 0.60,  // 60-69% = D
    F: 0      // <60% = F
  }
};
```

### Score State

```javascript
/**
 * @typedef {Object} ScoreState
 * @property {number} totalScore - Current total score
 * @property {number} maxPossibleScore - Maximum achievable score
 * @property {Array<ScoreEvent>} events - Score change history
 * @property {Object} stats - Aggregated statistics
 */

/**
 * @typedef {Object} ScoreEvent
 * @property {number} timestamp - HHMM when event occurred
 * @property {string} taskId - Related task
 * @property {string} type - 'completion'|'miss'|'bonus'|'penalty'
 * @property {number} points - Points awarded (can be negative)
 * @property {string} reason - Human-readable reason
 */

/**
 * @typedef {Object} ShiftStats
 * @property {number} tasksCompleted
 * @property {number} tasksMissed
 * @property {number} medicationsOnTime
 * @property {number} medicationsLate
 * @property {number} medicationsMissed
 * @property {number} urgentTasksHandled
 * @property {number} urgentTasksMissed
 * @property {number} boostsEarned
 * @property {number} penaltiesIncurred
 * @property {number} averageResponseTime - Average mins between available and started
 * @property {number} totalActiveTime - Mins with tasks in slots
 * @property {number} totalIdleTime - Mins with empty slots
 */
```

### Scoring System Module (`scoring-system.js`)

```javascript
class ScoringSystem {
  constructor() {
    this.score = 0;
    this.maxPossible = 0;
    this.events = [];
    this.stats = this.initStats();
  }
  
  initStats() {
    return {
      tasksCompleted: 0,
      tasksMissed: 0,
      medicationsOnTime: 0,
      medicationsLate: 0,
      medicationsMissed: 0,
      urgentTasksHandled: 0,
      urgentTasksMissed: 0,
      boostsEarned: 0,
      penaltiesIncurred: 0,
      responseTimesSum: 0,
      responseTimesCount: 0,
      activeTimeSum: 0,
      idleTimeSum: 0
    };
  }
  
  /**
   * Called when task is completed
   * @param {TaskDefinition} task
   * @param {number} completionTime - HHMM
   * @param {number} windowCloseTime - HHMM when window would have closed
   */
  onTaskCompleted(task, completionTime, windowCloseTime) {
    const timingScore = this.calculateTimingScore(task, completionTime, windowCloseTime);
    const multiplier = ScoringConfig.taskMultipliers[task.class] || 1;
    const points = Math.round(timingScore * multiplier);
    
    this.addScoreEvent({
      timestamp: completionTime,
      taskId: task.id,
      type: 'completion',
      points,
      reason: this.getCompletionReason(task, completionTime, windowCloseTime)
    });
    
    this.updateStats('completed', task, completionTime);
  }
  
  /**
   * Called when task window expires without completion
   */
  onTaskMissed(task, missTime) {
    const basePoints = task.urgency === TaskUrgency.CRITICAL 
      ? ScoringConfig.taskPoints.urgentMissed
      : ScoringConfig.taskPoints.missed;
    const multiplier = ScoringConfig.taskMultipliers[task.class] || 1;
    const points = Math.round(basePoints * multiplier);
    
    this.addScoreEvent({
      timestamp: missTime,
      taskId: task.id,
      type: 'miss',
      points,
      reason: `Missed: ${task.name}`
    });
    
    this.updateStats('missed', task);
  }
  
  /**
   * Called when a boost is applied (efficiency)
   */
  onBoostApplied(task, boostRule) {
    this.addScoreEvent({
      timestamp: gameState.getStateSlice('currentTime'),
      taskId: task.id,
      type: 'bonus',
      points: ScoringConfig.bonuses.efficientBatching,
      reason: `Efficiency: ${boostRule.description}`
    });
    
    this.stats.boostsEarned++;
  }
  
  /**
   * Calculate current grade
   */
  getGrade() {
    if (this.maxPossible === 0) return 'N/A';
    const percentage = this.score / this.maxPossible;
    
    for (const [grade, threshold] of Object.entries(ScoringConfig.grades)) {
      if (percentage >= threshold) return grade;
    }
    return 'F';
  }
  
  /**
   * Get formatted score for display
   */
  getDisplayScore() {
    return {
      score: this.score,
      maxPossible: this.maxPossible,
      percentage: this.maxPossible > 0 
        ? Math.round((this.score / this.maxPossible) * 100) 
        : 0,
      grade: this.getGrade()
    };
  }
  
  /**
   * Get end of shift summary
   */
  getShiftSummary() {
    return {
      score: this.getDisplayScore(),
      stats: { ...this.stats },
      events: [...this.events],
      bonuses: this.calculateEndOfShiftBonuses(),
      timeline: this.generateTimeline()
    };
  }
  
  /**
   * Generate timeline of significant events
   */
  generateTimeline() {
    return this.events
      .filter(e => Math.abs(e.points) >= 50)  // Significant events only
      .map(e => ({
        time: this.formatTime(e.timestamp),
        event: e.reason,
        impact: e.points > 0 ? 'positive' : 'negative'
      }));
  }
}

export const scoringSystem = new ScoringSystem();
export default scoringSystem;
```

### Feedback UI (`feedback-ui.js`)

```javascript
class FeedbackUI {
  constructor() {
    this.scoreElement = null;
    this.feedbackQueue = [];
  }
  
  init() {
    this.createScoreDisplay();
    this.subscribToEvents();
  }
  
  createScoreDisplay() {
    // Create floating score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.innerHTML = `
      <div class="score-container">
        <span class="score-value">0</span>
        <span class="score-label">Score</span>
      </div>
      <div class="grade-container">
        <span class="grade-value">A</span>
      </div>
    `;
    document.body.appendChild(scoreDisplay);
    this.scoreElement = scoreDisplay;
  }
  
  /**
   * Show floating feedback for score change
   */
  showScoreFeedback(event) {
    const feedback = document.createElement('div');
    feedback.className = `score-feedback ${event.points >= 0 ? 'positive' : 'negative'}`;
    feedback.innerHTML = `
      <span class="feedback-points">${event.points >= 0 ? '+' : ''}${event.points}</span>
      <span class="feedback-reason">${event.reason}</span>
    `;
    
    // Position near the task or center screen
    const rect = this.getEventPosition(event);
    feedback.style.left = `${rect.x}px`;
    feedback.style.top = `${rect.y}px`;
    
    document.body.appendChild(feedback);
    
    // Animate and remove
    requestAnimationFrame(() => {
      feedback.classList.add('animate');
      setTimeout(() => feedback.remove(), 2000);
    });
  }
  
  /**
   * Update score display
   */
  updateScoreDisplay(scoreData) {
    this.scoreElement.querySelector('.score-value').textContent = scoreData.score;
    this.scoreElement.querySelector('.grade-value').textContent = scoreData.grade;
    
    // Update grade color
    const gradeEl = this.scoreElement.querySelector('.grade-value');
    gradeEl.className = `grade-value grade-${scoreData.grade.toLowerCase()}`;
  }
}

export const feedbackUI = new FeedbackUI();
export default feedbackUI;
```

### End of Shift Screen (`end-of-shift.js`)

```javascript
class EndOfShiftScreen {
  show(summary) {
    const modal = document.createElement('div');
    modal.className = 'end-of-shift-modal';
    modal.innerHTML = `
      <div class="eos-content">
        <h1 class="eos-title">Shift Complete!</h1>
        
        <div class="eos-grade grade-${summary.score.grade.toLowerCase()}">
          <span class="grade-letter">${summary.score.grade}</span>
          <span class="grade-score">${summary.score.score} points</span>
        </div>
        
        <div class="eos-stats">
          <div class="stat">
            <span class="stat-value">${summary.stats.tasksCompleted}</span>
            <span class="stat-label">Tasks Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${summary.stats.tasksMissed}</span>
            <span class="stat-label">Tasks Missed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${summary.stats.medicationsOnTime}</span>
            <span class="stat-label">Meds On Time</span>
          </div>
          <div class="stat">
            <span class="stat-value">${summary.stats.urgentTasksHandled}</span>
            <span class="stat-label">Urgent Handled</span>
          </div>
        </div>
        
        <div class="eos-timeline">
          <h3>Shift Highlights</h3>
          ${this.renderTimeline(summary.timeline)}
        </div>
        
        <div class="eos-bonuses">
          ${this.renderBonuses(summary.bonuses)}
        </div>
        
        <button class="eos-button" onclick="location.reload()">
          Play Again
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('visible'));
  }
  
  renderTimeline(timeline) {
    return timeline.map(event => `
      <div class="timeline-event ${event.impact}">
        <span class="event-time">${event.time}</span>
        <span class="event-text">${event.event}</span>
      </div>
    `).join('');
  }
  
  renderBonuses(bonuses) {
    return bonuses.map(bonus => `
      <div class="bonus-item">
        <span class="bonus-icon">${bonus.icon}</span>
        <span class="bonus-name">${bonus.name}</span>
        <span class="bonus-points">+${bonus.points}</span>
      </div>
    `).join('');
  }
}

export const endOfShiftScreen = new EndOfShiftScreen();
export default endOfShiftScreen;
```

### CSS (`scoring.css`)

```css
/* Score Display */
#score-display {
  position: fixed;
  top: 100px;
  right: 12px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 100;
}

.score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
}

.grade-value {
  font-size: 36px;
  font-weight: bold;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.grade-a { background: #10b981; color: white; }
.grade-b { background: #3b82f6; color: white; }
.grade-c { background: #f59e0b; color: white; }
.grade-d { background: #f97316; color: white; }
.grade-f { background: #ef4444; color: white; }

/* Floating Feedback */
.score-feedback {
  position: fixed;
  z-index: 200;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  pointer-events: none;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease-out;
}

.score-feedback.animate {
  opacity: 1;
  transform: translateY(-30px);
}

.score-feedback.positive {
  background: #10b981;
  color: white;
}

.score-feedback.negative {
  background: #ef4444;
  color: white;
}

/* End of Shift Modal */
.end-of-shift-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s;
}

.end-of-shift-modal.visible {
  opacity: 1;
}

.eos-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 600px;
  width: 90%;
  text-align: center;
}

.eos-grade {
  margin: 24px 0;
}

.eos-grade .grade-letter {
  font-size: 120px;
  font-weight: bold;
  display: block;
}

.eos-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 32px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.eos-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 16px 48px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 32px;
}

.eos-button:hover {
  background: #2563eb;
}
```

## Acceptance Checks

1. **Real-time Score Display**
   - [ ] Score appears in top-right area
   - [ ] Score updates on task completion
   - [ ] Grade letter updates appropriately

2. **Score Feedback**
   - [ ] Floating "+100" appears when task completed on time
   - [ ] Floating "-50" appears when task missed
   - [ ] Feedback animates smoothly

3. **End of Shift Summary**
   - [ ] Modal appears when shift ends
   - [ ] Shows final grade prominently
   - [ ] Shows task statistics
   - [ ] Shows timeline of significant events
   - [ ] "Play Again" reloads the game

4. **Stat Tracking**
   - [ ] Medications on time vs late tracked correctly
   - [ ] Urgent tasks handled tracked
   - [ ] Boosts earned tracked

5. **Bonus Calculation**
   - [ ] Perfect med pass bonus awarded when applicable
   - [ ] On-time finish bonus awarded
   - [ ] Efficiency bonus for batching

## Output Format Requirements

Return:
1. **File tree**
2. **Code per file**
3. **Test steps**:
   - Complete a task on time, verify score increases
   - Let a task expire, verify score decreases
   - Complete shift, verify summary screen appears
   - Check all statistics are accurate

