function timemarkPlusMinutes(hhmm, totalMinutes) {
    
  function roundDownTo15(hhmm) {
      let hours = Math.floor(hhmm / 100);
      let minutes = hhmm % 100;
  
      // Round down to the nearest 15-minute mark
      minutes = Math.floor(minutes / 15) * 15;
  
      return hours * 100 + minutes;
  }

  let hours = Math.floor(hhmm / 100);
  let minutes = hhmm % 100;

  // Add totalMinutes
  let newMinutes = minutes + totalMinutes;
  let newHours = hours + Math.floor(newMinutes / 60);
  newMinutes = newMinutes % 60;

  // Handle overflow past midnight (optional behavior)
  if (newHours >= 24) newHours = newHours % 24;

  let newTime = newHours * 100 + newMinutes;

  // Round down to the next 15-minute mark
  return roundDownTo15(newTime).toString().padStart(4, '0');
}


// console.log(timemarkPlusMinutes(1900, 37)); // Output: '1930'
// console.log(timemarkPlusMinutes(2330, 45)); // Output: '0015'
// console.log(timemarkPlusMinutes(1007, 120)); // Output: '1200'

const GameTimerModule = (() => {
  // Configuration constants
  const TOTAL_DAYS = 1;
  let GAME_MINUTES_PER_SHIFT = 10; // Set how long you want the shift to last in real minutes
  let TIME_PER_DAY = GAME_MINUTES_PER_SHIFT * 60; // Convert to seconds

  // Shift time configuration (24-hour format)
  let SHIFT_START = -1; // 19:00

  const GAME_MINUTES_PER_REAL_SECOND = 1; // Each real second corresponds to one game second

  let secondsLeft = TIME_PER_DAY;
  let currentShiftTime = SHIFT_START;
  let timer;
  let intervalId = null;
  let isPaused = false;
  let time = 0;

  // Gameover callback
  let gameOverCallback = ()=>{};

  // Function to format military time to HH:MM:SS
  function formatMilitaryTime(time, seconds) {
    let hours = Math.floor(time / 100);
    let minutes = time % 100;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }


  // Function to calculate current shift time based on seconds remaining
  function calculateCurrentTime() {
    // console.log({secondsLeft, SHIFT_START, GAME_MINUTES_PER_SHIFT, TIME_PER_DAY});
    if(SHIFT_START === -1) return;
    let elapsedGameSeconds = (TIME_PER_DAY - secondsLeft) * GAME_MINUTES_PER_REAL_SECOND;


    // startMinutes is the total minutes from 0000 to the start of the shift
    // Eg. Having startMinutes 1140 is equivalent to 19h start of shift (Underlying equation is 1140/60 = 19h)
    // Same value through the game
    let startMinutes = Math.floor(SHIFT_START / 100) * 60 + (SHIFT_START % 100);

    // totalMinutes is the total minutes from 0000 to the current time used to calculate the military time
    // Eg. When totalMinutes is 1200, it means it's currently 20h (Underlying equation is 1200/60 = 20h)
    // Eg. When totalMinutes is 1860, it means it's currently 7h (Underlying equation is 1860/60 = 31h => 31h-24h = 7h)
    // Progresses through the game
    let totalMinutes = startMinutes + Math.floor(elapsedGameSeconds / 60);
    let seconds = elapsedGameSeconds % 60;

    let elapsedGameMins = Math.round(elapsedGameSeconds / 60);
    let elasedHHMM = timemarkPlusMinutes(SHIFT_START, elapsedGameMins);
    // console.log(elasedHHMM); // will round to 1900, 1930, 1945, 2000, etc

    // Check if the current time is a poll task time from 1900, 1930, 1945, 2000, etc, and run once when hit time
    if(pollTaskTimes.length && pollTaskTimes[0]<=elasedHHMM) {
      var hitTime = pollTaskTimes.shift();
      console.log("Poll task time", hitTime);
    }
    
    // Handle day rollover
    if (totalMinutes >= 24 * 60) {
      totalMinutes -= 24 * 60;
    }
    
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    
    return { hours: hours * 100 + minutes, seconds };
  }

  let pollTaskTimes = [];
  function pollTasks() {
    
    let elapsedGameSeconds = (TIME_PER_DAY - secondsLeft) * GAME_MINUTES_PER_REAL_SECOND;
    let startMinutes = Math.floor(SHIFT_START / 100) * 60 + (SHIFT_START % 100);
    let totalMinutes = startMinutes + Math.floor(elapsedGameSeconds / 60);

    // elapsedGameMins is the total minutes from the start of the shift to the current time
    // Eg. If the game start time was 1900, then elapsedGameMins 60 means the time now is 2000
    let elapsedGameMins = Math.round(elapsedGameSeconds / 60);

    // console.log({elapsedGameMins, startMinutes, totalMinutes});
  }

  // Function to update the clock and place it in a specified DOM element
  function updateClock(selector) {
    if(SHIFT_START === -1) return;
    const clockElement = document.querySelector(selector);
    if (!clockElement) {
      console.error(`Element with selector "${selector}" not found.`);
      return;
    }

    if (secondsLeft > 0) {
      secondsLeft--; // Decrease the time left
      
      // Calculate and display current shift time
      const { hours, seconds } = calculateCurrentTime();
      currentShiftTime = hours;
      // clockElement.textContent = "Shift Time: " + formatMilitaryTime(currentShiftTime, seconds);
      clockElement.textContent = formatMilitaryTime(currentShiftTime, seconds);
    } else {
      // Shift is over
      clearInterval(intervalId);
      // clockElement.style.display = "none"; // Decided to freeze on the last second
      gameOverCallback();
    }
  }

  // Public method to start the timer
  function start(selector, pauseSelector, speedFactor = 1, aGAME_MINUTES_PER_SHIFT = 10, aSHIFT_START = 1900, aGameOverCallback = ()=>{}) {
    GAME_MINUTES_PER_SHIFT = aGAME_MINUTES_PER_SHIFT;
    TIME_PER_DAY = GAME_MINUTES_PER_SHIFT * 60; // Convert to seconds
    secondsLeft = TIME_PER_DAY;

    SHIFT_START = aSHIFT_START;
    currentShiftTime = aSHIFT_START;

    const clockElement = document.querySelector(selector);
    const pauseButton = document.querySelector(pauseSelector);
    
    // Reset state
    secondsLeft = TIME_PER_DAY;
    currentShiftTime = SHIFT_START;
    isPaused = false;

    // Game over callback
    gameOverCallback = aGameOverCallback;

    /**
     * 
     * Add to shift start hhmm with total minutes aka game shift duration
     * Return an array of hhmm with 15 min intervals
     * 
     */
    function generateTimeIntervals(hhmm, totalMinutes) {
      function calculateIntervalsCount(totalMinutes) {
          return Math.floor(totalMinutes / 15);
      }
      var count = calculateIntervalsCount(totalMinutes);
      
      let hours = Math.floor(hhmm / 100);
      let minutes = hhmm % 100;
  
      // Round down to the nearest 15-minute mark
      minutes = Math.floor(minutes / 15) * 15;
  
      let intervals = [];
      for (let i = 0; i < count; i++) {
          let newMinutes = minutes + i * 15;
          let newHours = hours + Math.floor(newMinutes / 60);
          newMinutes = newMinutes % 60;
  
          if (newHours >= 24) break; // Stop if we pass midnight
  
          let formattedTime = (newHours * 100 + newMinutes).toString().padStart(4, '0');
          formattedTime = parseInt(formattedTime);
          intervals.push(formattedTime);
      }
  
      return intervals;
  }
  
  pollTaskTimes = generateTimeIntervals(SHIFT_START, GAME_MINUTES_PER_SHIFT);
  console.log(pollTaskTimes);
    // Add pause button listener
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    });

    // Clear any existing interval
    if (intervalId) clearInterval(intervalId);
    
    // Start the timer with speed factor
    intervalId = setInterval(() => {
        if (!isPaused) {
            updateClock(selector);
            pollTasks();
        }
    }, 1000 / speedFactor);
  }

  return {
    start
  };
})();

export default GameTimerModule;
