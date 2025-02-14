// app.js (Main Entry Point)
import GameTimerModule from './timer_ingame.js';
import ModalModule from './modal.js';

const {start:GameTimerModule_start} = GameTimerModule;

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

const { openModal, closeModal, modifyModal } = ModalModule;

window.openModal = openModal;
window.closeModal = closeModal;
window.modifyModal = modifyModal;