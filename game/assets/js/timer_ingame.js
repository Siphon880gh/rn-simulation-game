import { roundDownTo15, timemarkPlusMinutes, divideBy15Mins, list15MinTimemarksFromHHMM } from './timer_utils.js';
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

const GameTimerModule = (() => {
  // Timer state
  let timerState = {
    totalDays: 1,
    gameMinutesPerShift: 10,
    timePerDay: 0,
    shiftStart: -1,
    gameMinutesPerRealSecond: 1,
    secondsLeft: 0,
    currentShiftTime: 0,
    intervalId: null,
    isPaused: false,
    time: 0,
    gameOverCallback: () => {},
    pollTaskTimes: [],
    clockSelector: null,
    pauseSelector: null,
    speedFactor: 1
  };

  // Declarative timer configuration
  const timerActions = {
    initialize: (config) => {
      timerState = {
        ...timerState,
        gameMinutesPerShift: config.gameMinutesPerShift,
        timePerDay: config.gameMinutesPerShift * 60,
        shiftStart: config.shiftStart,
        currentShiftTime: config.shiftStart,
        secondsLeft: config.gameMinutesPerShift * 60,
        gameOverCallback: config.gameOverCallback || (() => {}),
        clockSelector: config.clockSelector,
        pauseSelector: config.pauseSelector,
        speedFactor: config.speedFactor
      };

      // Calculate poll task times
      timerState.pollTaskTimes = list15MinTimemarksFromHHMM(
        config.shiftStart, 
        divideBy15Mins(config.gameMinutesPerShift)
      );

      console.log('Timer initialized with config:', config);
      console.log('Poll task times:', timerState.pollTaskTimes);
    },

    start: () => {
      if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
      }

      // Setup pause button
      setupPauseButton();

      // Start the main timer loop
      timerState.intervalId = setInterval(() => {
        if (!timerState.isPaused) {
          tickTimer();
        }
      }, 1000 / timerState.speedFactor);

      console.log('Timer started');
    },

    pause: (source = GameConfig.timer.pauseSources.USER) => {
      gameState.dispatch('SET_PAUSE', { paused: true, source });
    },

    resume: (source = GameConfig.timer.pauseSources.USER) => {
      gameState.dispatch('SET_PAUSE', { paused: false, source });
    },

    stop: () => {
      if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      console.log('Timer stopped');
    }
  };

  // Main timer tick function
  function tickTimer() {
    if (timerState.shiftStart === -1) return;

    if (timerState.secondsLeft > 0) {
      timerState.secondsLeft--;
      
      // Calculate and update current time
      const currentTime = calculateCurrentTime();
      updateClockDisplay(currentTime);
      
      // Update game state with current time
      gameState.dispatch('UPDATE_TIME', { time: currentTime.hours });
      
      // Check for scheduled events
      checkScheduledEvents(currentTime.hours);
      
    } else {
      // Game over
      handleGameOver();
    }
  }

  // Calculate current game time
  function calculateCurrentTime() {
    if (timerState.shiftStart === -1) return { hours: 0, seconds: 0 };

    const elapsedGameSeconds = (timerState.timePerDay - timerState.secondsLeft) * timerState.gameMinutesPerRealSecond;
    const startMinutes = Math.floor(timerState.shiftStart / 100) * 60 + (timerState.shiftStart % 100);
    const totalMinutes = startMinutes + Math.floor(elapsedGameSeconds / 60);
    const seconds = elapsedGameSeconds % 60;

    // Handle day rollover
    let adjustedMinutes = totalMinutes;
    if (totalMinutes >= 24 * 60) {
      adjustedMinutes = totalMinutes - 24 * 60;
    }

    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;

    return { 
      hours: hours * 100 + minutes, 
      seconds: Math.floor(seconds),
      totalMinutes: adjustedMinutes
    };
  }

  // Update clock display
  function updateClockDisplay(currentTime) {
    const clockElement = document.querySelector(timerState.clockSelector);
    if (!clockElement) {
      console.error(`Clock element with selector "${timerState.clockSelector}" not found.`);
      return;
    }

    timerState.currentShiftTime = currentTime.hours;
    clockElement.textContent = formatMilitaryTime(currentTime.hours, currentTime.seconds);
  }

  // Format time for display
  function formatMilitaryTime(time, seconds) {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Check for scheduled events
  function checkScheduledEvents(currentTime) {
    const elapsedGameSeconds = (timerState.timePerDay - timerState.secondsLeft) * timerState.gameMinutesPerRealSecond;
    const elapsedGameMins = Math.round(elapsedGameSeconds / 60);
    const elapsedHHMM = timemarkPlusMinutes(timerState.shiftStart, elapsedGameMins);

    // Check if we've hit a poll task time
    if (timerState.pollTaskTimes.length && timerState.pollTaskTimes[0] <= elapsedHHMM) {
      const hitTime = timerState.pollTaskTimes.shift();
      console.log("Poll task time hit:", hitTime);
      
      // Dispatch scheduled event
      dispatchScheduledTaskEvent(hitTime);
    }
  }

  // Dispatch scheduled task event — style-block reveal includes expire (+N raw or absolute)
  function dispatchScheduledTaskEvent(hhmm) {
    const revealElement = document.querySelector(GameConfig.selectors.revealScheduledTasks);
    const tasksMap = gameState.getStateSlice('tasks');
    const schedKey = String(hhmm).padStart(4, '0');
    const matching = [];

    if (tasksMap) {
      tasksMap.forEach((task) => {
        if (Number(task.scheduled) === Number(hhmm)) matching.push(task);
      });
    }

    if (revealElement) {
      let rules = revealElement.innerHTML;
      if (matching.length) {
        matching.forEach((task) => {
          rules += taskSystemRevealRule(task);
        });
      } else {
        rules += `
li[data-scheduled="${schedKey}"] {
  opacity: 1 !important;
}
`;
      }
      revealElement.innerHTML = rules;
    }

    // Update task statuses in DOM (match padded or bare scheduled attrs).
    // Never revive completed/overdue tasks — registry status wins over schedule unlock.
    const scheduledTasks = document.querySelectorAll(
      `[data-scheduled="${hhmm}"], [data-scheduled="${schedKey}"]`
    );
    const terminal = new Set([
      GameConfig.tasks.statuses.COMPLETED,
      GameConfig.tasks.statuses.OVERDUE
    ]);
    scheduledTasks.forEach((el) => {
      const task = tasksMap?.get(el.id);
      if (task && terminal.has(task.status)) {
        el.setAttribute('data-status', task.status);
        el.classList.remove('task-status-active');
        el.classList.add(`task-status-${task.status}`);
        return;
      }
      if (terminal.has(el.getAttribute('data-status'))) {
        return;
      }
      el.setAttribute('data-status', GameConfig.tasks.statuses.ACTIVE);
      el.classList.add('task-status-active');
      if (task?.expire != null) {
        el.setAttribute('data-expire', String(task.expire).padStart(4, '0'));
      }
    });

    gameState.dispatch('ACTIVATE_SCHEDULED_TASKS', { time: hhmm });
    const hours = Math.floor(hhmm / 100);
    const minutes = hhmm % 100;
    const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: `Scheduled tasks unlocked for ${timeLabel}`,
      timeLabel
    });
  }

  function taskSystemRevealRule(task) {
    const scheduled = String(task.scheduled).padStart(4, '0');
    const expire = task.expire != null ? String(task.expire).padStart(4, '0') : '';
    const expireRaw = task.metadata?.expireRaw || null;
    const selectors = [`li[data-scheduled="${scheduled}"]`];
    if (expire) {
      selectors.push(`li[data-scheduled="${scheduled}"][data-expire="${expire}"]`);
    }
    if (expireRaw) {
      selectors.push(`li[data-scheduled="${scheduled}"][data-expire="${expireRaw}"]`);
    }
    return `
${selectors.join(',\n')} {
  opacity: 1 !important;
}
`;
  }

  function syncPauseButtonLabel() {
    const pauseButton = document.querySelector(timerState.pauseSelector);
    if (!pauseButton) return;
    pauseButton.textContent = timerState.isPaused ? 'Resume' : 'Pause';
  }

  // Setup pause button functionality (toggles only the `user` pause source)
  function setupPauseButton() {
    const pauseButton = document.querySelector(timerState.pauseSelector);
    if (!pauseButton) {
      console.error(`Pause button with selector "${timerState.pauseSelector}" not found.`);
      return;
    }

    // Remove existing listeners
    pauseButton.replaceWith(pauseButton.cloneNode(true));
    const newPauseButton = document.querySelector(timerState.pauseSelector);
    const userSource = GameConfig.timer.pauseSources.USER;

    newPauseButton.addEventListener('click', () => {
      const sources = gameState.getStateSlice('pauseSources') || [];
      if (sources.includes(userSource)) {
        timerActions.resume(userSource);
      } else {
        timerActions.pause(userSource);
      }
    });

    syncPauseButtonLabel();
  }

  // Handle game over
  function handleGameOver() {
    timerActions.stop();
    gameState.dispatch('GAME_OVER');
    timerState.gameOverCallback();
    console.log('Game Over!');
  }

  // Public API
  const start = (clockSelector, pauseSelector, speedFactor = 1, gameMinutesPerShift = 10, shiftStart = 1900, gameOverCallback = () => {}) => {
    const config = {
      clockSelector,
      pauseSelector,
      speedFactor,
      gameMinutesPerShift,
      shiftStart,
      gameOverCallback
    };

    timerActions.initialize(config);
    timerActions.start();
  };

  const pollTime = () => {
    return {
      currentTime: timerState.currentShiftTime,
      secondsLeft: timerState.secondsLeft,
      isPaused: timerState.isPaused,
      progress: ((timerState.timePerDay - timerState.secondsLeft) / timerState.timePerDay) * 100
    };
  };

  const pause = (source) => timerActions.pause(source);
  const resume = (source) => timerActions.resume(source);
  const stop = () => timerActions.stop();

  // Clock follows declarative pauseSources / isPaused (user, modal, challenge, system)
  gameState.subscribe('isPaused', (isPaused) => {
    timerState.isPaused = !!isPaused;
    syncPauseButtonLabel();
  });

  return {
    start,
    pollTime,
    pause,
    resume,
    stop,
    getState: () => ({ ...timerState })
  };
})();

export default GameTimerModule;
