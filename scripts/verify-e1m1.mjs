/**
 * AUTO checks for E1.M1 clock / speed / pause contracts.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const timerSrc = readFileSync(join(root, 'game/assets/js/timer_ingame.js'), 'utf8');
const stateSrc = readFileSync(join(root, 'game/assets/js/game-state.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const configSrc = readFileSync(join(root, 'game/assets/js/game-config.js'), 'utf8');

assert(stateSrc.includes("actions.set('SET_PAUSE'"), 'SET_PAUSE action defined');
assert(configSrc.includes('pauseSources'), 'pauseSources documented in GameConfig');
assert(timerSrc.includes("dispatch('SET_PAUSE'"), 'timer uses SET_PAUSE');
assert(timerSrc.includes("subscribe('isPaused'"), 'timer syncs from isPaused');
assert(appSrc.includes('GameConfig.timer.defaultSpeedFactor'), 'app defaults from GameConfig.timer');
assert(appSrc.includes('GameConfig.urlParams'), 'app urlParams from GameConfig');

assert(GameConfig.timer.defaultSpeedFactor === 1440, 'default speed factor');
assert(GameConfig.timer.defaultShiftStart === 1900, 'default shift start HHMM');
assert(GameConfig.timer.defaultShiftDuration === 720, 'default 12h duration minutes');
assert(GameConfig.timer.pauseSources.USER === 'user', 'user pause source');
assert(GameConfig.timer.pauseSources.CHALLENGE === 'challenge', 'challenge pause source');

// Runtime pause ownership matrix
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_PAUSE', { paused: true, source: 'user' });
assert(gameState.getStateSlice('isPaused') === true, 'user pause sets isPaused');
assert(gameState.getStateSlice('pauseSources').includes('user'), 'user in pauseSources');

gameState.dispatch('SET_PAUSE', { paused: true, source: 'challenge' });
assert(gameState.getStateSlice('pauseSources').length === 2, 'stack user+challenge');

gameState.dispatch('SET_PAUSE', { paused: false, source: 'user' });
assert(gameState.getStateSlice('isPaused') === true, 'still paused under challenge');

gameState.dispatch('SET_PAUSE', { paused: false, source: 'challenge' });
assert(gameState.getStateSlice('isPaused') === false, 'fully resumed');
assert(gameState.getStateSlice('gameStatus') === GameConfig.gameStates.RUNNING, 'status running');

gameState.dispatch('GAME_OVER');
gameState.dispatch('SET_PAUSE', { paused: true, source: 'system' });
assert(gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER, 'GAME_OVER not overwritten by pause');

if (failures.length) {
  console.error('E1.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E1.M1 AUTO PASS');
