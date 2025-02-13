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
start("#clock", "#pause");