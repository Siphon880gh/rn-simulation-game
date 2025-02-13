# Game Timer

By Weng Fei Fung

![Last Commit](https://img.shields.io/github/last-commit/Siphon880gh/In-Game-Timer/main)
<a target="_blank" href="https://github.com/Siphon880gh" rel="nofollow"><img src="https://img.shields.io/badge/GitHub--blue?style=social&logo=GitHub" alt="Github" data-canonical-src="https://img.shields.io/badge/GitHub--blue?style=social&logo=GitHub" style="max-width:8.5ch;"></a>
<a target="_blank" href="https://www.linkedin.com/in/weng-fung/" rel="nofollow"><img src="https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin&labelColor=blue" alt="Linked-In" data-canonical-src="https://img.shields.io/badge/LinkedIn-blue?style=flat&amp;logo=linkedin&amp;labelColor=blue" style="max-width:10ch;"></a>
<a target="_blank" href="https://www.youtube.com/@WayneTeachesCode/" rel="nofollow"><img src="https://img.shields.io/badge/Youtube-red?style=flat&logo=youtube&labelColor=red" alt="Youtube" data-canonical-src="https://img.shields.io/badge/Youtube-red?style=flat&amp;logo=youtube&amp;labelColor=red" style="max-width:10ch;"></a>

## Overview
This engine is an in-game timer that starts at military time. The game concludes after a specified duration, and you have the ability to control the speed at which game seconds progress.

## Features
- **Military Time Start**: The timer begins at military time format.
- **Game Duration**: The game ends after a set duration.
- **Adjustable Speed**: Control how fast the game seconds progress.

## Usage
1. **Start the Timer**: Initialize the game timer at the desired military time.
2. **Set Duration**: Define how long the game should last.
3. **Adjust Speed**: Modify the speed of the game seconds as needed.

```
/**
 * 
 * @function GameTimerModule_start
 * @param {string} selector - The selector for the clock element
 * @param {string} pauseSelector - The selector for the pause button
 * @param {number} speedFactor - The speed factor for the clock. How long will your play be in real time?
 *                               - 12 hours → speedFactor = 1
 *                               - 6 hours → speedFactor = 2
 *                               - 3 hours → speedFactor = 4
 *                               - 2 hours → speedFactor = 6
 *                               - 1 hour → speedFactor = 12
 *                               - 45 minutes → speedFactor = 16
 *                               - 30 minutes → speedFactor = 24
 *                               - 15 minutes → speedFactor = 48
 *                               - 10 minutes → speedFactor = 72
 *                               - 5 minutes → speedFactor = 144
 *                               - 3 minutes → speedFactor = 360
 * @param {number} GAME_MINUTES_PER_SHIFT - How long the shift will be in game minutes?
 * @param {number} SHIFT_START - What time will the shift start? In thousand integers, eg 1900 for 19:00
 *
 * @example startGameTimer("#clock", "#pause", 72, 4, 1900);
 * 
 */
GameTimerModule_start("#clock", "#pause", 360, 60*12, 1900);
```


## Author
- **Weng Fei Fung**