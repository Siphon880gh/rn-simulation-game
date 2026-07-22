/**
 * AUTO checks for E1.M2 shell chrome regions.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import { timemarkPlusMinutes } from '../game/assets/js/timer_utils.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');

const requiredIds = [
  'shell',
  'shell-top-primary',
  'shell-top-secondary',
  'shell-left-menu',
  'shell-right-menu',
  'shell-main',
  'shell-bottom',
  'shell-status-bar',
  'shell-hour-tabs',
  'shift-history-log',
  'task-queue-bar',
  'patients',
  'clock',
  'pause'
];

requiredIds.forEach((id) => {
  assert(html.includes(`id="${id}"`), `missing #${id}`);
});

assert(existsSync(join(root, 'game/assets/js/shell-chrome.js')), 'shell-chrome.js');
assert(existsSync(join(root, 'game/assets/css/shell.css')), 'shell.css');
assert(html.includes('shell.css'), 'shell.css linked');
assert(appSrc.includes('ShellChromeModule'), 'app wires shell chrome');
assert(GameConfig.selectors.hourTabs === '#shell-hour-tabs', 'hourTabs selector');
assert(GameConfig.selectors.shiftHistoryLog === '#shift-history-log', 'history selector');
assert(GameConfig.selectors.leftMenu === '#shell-left-menu', 'left menu selector');

const shellSrc = readFileSync(join(root, 'game/assets/js/shell-chrome.js'), 'utf8');
const cssSrc = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(shellSrc.includes('openHourPeekModal'), 'hour peek modal open');
assert(shellSrc.includes('renderHourPeekPopover'), 'hour peek hover popover');
assert(shellSrc.includes('PAUSE_MODAL') || shellSrc.includes("pauseSources.MODAL"), 'peek uses modal pause source');
assert(shellSrc.includes('hourPeekClose'), 'resume handler exposed');
assert(cssSrc.includes('.hour-peek-popover'), 'hour peek popover CSS');
assert(html.includes('Hour peek'), 'hour peek label in shell');
assert(GameConfig.timer.pauseSources.MODAL === 'modal', 'modal pause source id');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_ACTIVE_HOUR', { hourIndex: 2, hourHhmm: 2100 });
assert(gameState.getStateSlice('activeHourIndex') === 2, 'active hour');
assert(gameState.getStateSlice('activeHourHhmm') === 2100, 'active hour hhmm');

gameState.dispatch('APPEND_SHIFT_LOG', { message: 'Test event', timeLabel: '19:00' });
const log = gameState.getStateSlice('shiftLog');
assert(Array.isArray(log) && log.length >= 1, 'shift log append');
assert(log.some((e) => e.message === 'Test event'), 'log message present');

const h2 = Number(timemarkPlusMinutes(1900, 60));
assert(h2 === 2000, `hour+1 from 1900 => ${h2}`);

if (failures.length) {
  console.error('E1.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E1.M2 AUTO PASS');
