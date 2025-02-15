// app.js (Main Entry Point)
import GameTimerModule from './timer_ingame.js';
import ModalModule from './modal.js';
import PatientsModule from './patients.js';
import { timemarkPlusMinutes } from './timer_utils.js';


// #region MODAL

const { openModal, closeModal, modifyModal } = ModalModule;

window.openModal = openModal;
window.closeModal = closeModal;
window.modifyModal = modifyModal;

// #endregion MODAL

// #region PATIENTS

const { init: PatientsModule_init } = PatientsModule;
await PatientsModule_init();

// #endregion PATIENTS

// #region Standardize tasks

$("[data-scheduled]").livequery( (i, task)=>{
    let $task = $(task);
    let scheduled = $task.data("scheduled");
    let expire = $task.data("expire");
    let durationMins = $task.data("duration-mins");

    if(expire) {
        expire = String(expire);
        if(expire[0] == "+") {
            expire = expire.slice(1);
            expire = parseInt(expire);
            expire = timemarkPlusMinutes(scheduled, expire);
            $task.attr("data-expire", expire);
        }
    }
});

window.nextTaskId = -1;

$("[data-scheduled]").livequery( (i, task)=>{
    let $task = $(task);
    let scheduled = $task.data("scheduled");
    let expire = $task.data("expire");
    let durationMins = $task.data("duration-mins");

    if(expire) {
        expire = String(expire);
        if(expire[0] == "+") {
            expire = expire.slice(1);
            expire = parseInt(expire);
            expire = timemarkPlusMinutes(scheduled, expire);
            $task.attr("data-expire", expire);
        }
    }

    if (!$task.attr('id')) {
        nextTaskId++;
        $task.attr('id', "task-"+nextTaskId);
    }
});


$(`[data-task-type="med"]`).livequery( (i, task)=>{
    let $task = $(task);

    $.contextMenu({
        selector: "#"+task.id,
        trigger: 'left',
        build: function ($triggerElement, e) {
            var element = e.target;
            if(!e.target.matches('[data-task-type]')) {
                element = e.target.closest('[data-task-type]');
            }
            if ($(element).attr("data-status")!=="active") {
                return false; // Prevent menu from opening if the flag is false
            }
            return {
                callback: function (key, options) {
                    // alert("Clicked: " + key);
                    switch(key) {
                        case "perform":
                            alert("Coming soon!");
                            break;
                        case "details":
                            const durationMins = $(element).data("duration-mins");
                            const expire = $(element).data("expire");
                            alert(`Task is ${durationMins} mins long. Expires at ${expire}.`);
                            break;
                            
                    }
                },
                items: {
                    perform: { name: "Perform", icon: "add" },
                    // help: {type: 'html', html: '<div class="hover:bg-blue-500"><i class="fa fa-question absolute left-2.5 top-1.5" style="color:#2980b9"></i><span>Help</span></div>'}
                    details: {name: 'Details', icon: 'question'}
                }
            };
        }
        // items: {
        //     perform: { name: "Perform", icon: "add" },
        //     details: {name: 'Details', icon: 'question'}
        //   }
      });
});

// #endregion Standardize


// #region TIMER (Must at end)
const {start:GameTimerModule_start, pollTime} = GameTimerModule;
window.pollTime = pollTime;

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
 * @param {function} gameOverCallback - The function to call when the game is over
 *
 * @example startGameTimer("#clock", "#pause", 72, 5, 1900, ()=>{ alert("Game over"); });
 * 
 */

// ?speed-factor=NUMERIC&shift-starts=HHMM&shift-duration=MINS
var searches = new URLSearchParams(window.location.search);
var speedFactor = searches.get("speed-factor")
if(speedFactor) speedFactor = parseInt(speedFactor);
var defaultSpeedFactor = 1440; // 360 // 1440

var shiftStarts = searches.get("shift-starts")
if(shiftStarts) {
    shiftStarts = "" + shiftStarts;
    shiftStarts = shiftStarts.replaceAll(":", "");
    shiftStarts = parseInt(shiftStarts);
}
var defaultShiftStarts = 1900;

var shiftDuration = searches.get("shift-duration")
if(shiftDuration) {
    shiftDuration = parseInt(shiftDuration);
}
var defaultShiftDuration = 60*12;

GameTimerModule_start(
    "#clock", 
    "#pause", 
    speedFactor || defaultSpeedFactor, 
    shiftDuration || defaultShiftDuration, 
    shiftStarts || defaultShiftStarts, 
    ()=>{
        modifyModal(
            "Game Over", 
            "You have failed to save the patient", 
            "<button class='px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600' onclick='closeModal()'>Close</button>");
        openModal();
        document.querySelector(".container").classList.add("opacity-40");
});

// #endregion TIMER