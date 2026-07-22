/**
 * AUTO checks for E10 Right rail: Orders & Tools.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import {
  listOrderChecks,
  listInjectedOrders
} from '../game/assets/js/right-menu.js';
import { listPendingCriticalLabCallbacks } from '../game/assets/js/critical-labs.js';
import { listPendingAdmissionCallbacks } from '../game/assets/js/admission-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const children = [];
globalThis.document = {
  querySelector: (sel) => {
    if (sel === '#orders-rail' || sel === GameConfig.selectors.ordersRail) {
      return {
        replaceChildren(...nodes) {
          children.length = 0;
          nodes.forEach((n) => children.push(n));
        },
        appendChild(n) { children.push(n); },
        querySelector: () => null
      };
    }
    if (sel === '#tools-rail' || sel === GameConfig.selectors.toolsRail) {
      return {
        replaceChildren() {},
        appendChild() {},
        querySelector: () => null
      };
    }
    return null;
  },
  getElementById: () => null,
  createElement: () => ({
    className: '',
    innerHTML: '',
    style: {},
    dataset: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    appendChild() {},
    addEventListener() {},
    querySelector: () => null
  })
};
globalThis.window = { requestAnimationFrame: (cb) => cb(), setTimeout };

assert(existsSync(join(root, 'game/assets/js/right-menu.js')), 'right-menu.js');
assert(GameConfig.selectors.ordersRail === '#orders-rail', 'ordersRail selector');
assert(GameConfig.selectors.toolsRail === '#tools-rail', 'toolsRail selector');
assert(GameConfig.selectors.rightMenu === '#shell-right-menu', 'rightMenu selector');

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(html.includes('id="orders-rail"'), 'orders-rail host');
assert(html.includes('id="tools-rail"'), 'tools-rail host');
assert(html.includes('Orders'), 'Orders label');
assert(html.includes('Tools'), 'Tools label');
assert(!html.includes('Tools / orders (later)'), 'placeholder removed');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('RightMenuModule'), 'app wires right menu');
assert(appSrc.includes('rightMenu.init'), 'rightMenu.init called');

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes('showGlobalPanel'), 'patients showGlobalPanel');

const css = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(css.includes('.rail-item'), 'rail-item CSS');
assert(css.includes('E10.M6'), 'narrow layout note');
assert(!/#shell-right-menu\s*\{\s*display:\s*none/.test(css), 'right menu not hard-hidden');

assert(typeof listPendingCriticalLabCallbacks === 'function', 'crit lab pending helper');
assert(typeof listPendingAdmissionCallbacks === 'function', 'admit pending helper');
assert(Array.isArray(listPendingCriticalLabCallbacks()), 'crit pending array');
assert(Array.isArray(listPendingAdmissionCallbacks()), 'admit pending array');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
taskSystem.createTask({
  id: 'orders-check-1900',
  type: 'orders',
  taskClass: GameConfig.tasks.classes.ROUTINE,
  name: 'Check doctor orders (H1)',
  scheduled: 1900,
  expire: 2000,
  durationMins: 5,
  patientId: null,
  metadata: { kind: 'doctor-orders-check', hourIndex: 0, hourStart: 1900, hourEnd: 2000 }
});
taskSystem.createTask({
  id: 'inj-1',
  type: 'med',
  taskClass: GameConfig.tasks.classes.ROUTINE,
  name: 'New doctor order',
  scheduled: 1915,
  expire: 2015,
  durationMins: 10,
  patientId: 'p1',
  metadata: { fromOrdersCheck: true, hourStart: 1900 }
});

const tasks = gameState.getStateSlice('tasks');
const checks = listOrderChecks(tasks);
const injected = listInjectedOrders(tasks);
assert(checks.length === 1 && checks[0].id === 'orders-check-1900', 'listOrderChecks');
assert(injected.length === 1 && injected[0].id === 'inj-1', 'listInjectedOrders');

if (failures.length) {
  console.error('E10 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E10 AUTO PASS');
