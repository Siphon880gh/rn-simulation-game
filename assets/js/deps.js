// your-script.js (module file)

// Named export
export function greet(name) {
    return `Hello, ${name}!`;
}

// Exporting a variable
export const pi = 3.14159;

// Exporting a class
export class Person {
    constructor(name) {
        this.name = name;
    }
    sayHello() {
        return `Hi, I'm ${this.name}`;
    }
}

// Default export (only one default export per module)
export default function defaultFunction() {
    console.log("This is the default export function.");
}
