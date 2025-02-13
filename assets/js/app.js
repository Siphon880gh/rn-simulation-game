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
start("#clock", "#pause", 72);
/**
 * 
    12 hours → speedFactor = 1
    6 hours → speedFactor = 2
    3 hours → speedFactor = 4
    2 hours → speedFactor = 6
    1 hour → speedFactor = 12
    45 minutes → speedFactor = 16
    30 minutes → speedFactor = 24
    15 minutes → speedFactor = 48
    10 minutes → speedFactor = 72
 *
 */