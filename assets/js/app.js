// app.js (Main Entry Point)
import defaultFunction from './deps.js';
import starter from './timer_ingame.js';
import {greet, pi, Person} from './deps.js';

console.log(greet("Alice")); // Hello, Alice!
console.log(`Value of π: ${pi}`);

const user = new Person("Bob");
console.log(user.sayHello()); // Hi, I'm Bob

defaultFunction(); // Runs the default export function

const {start} = starter;

/**
 * 
 * @function start
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
 * @param {number} GAME_MINUTES_PER_SHIFT - How long the shift will be in game minutes?
 * @param {number} SHIFT_START - What time will the shift start? In thousand integers, eg 1900 for 19:00
 *
 * @example start("#clock", "#pause", 72, 4, 1900);
 * 
 */
start("#clock", "#pause", 72, 60, 1900);