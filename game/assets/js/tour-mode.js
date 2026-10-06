/** First-run How to play session flag. Scoring, spawns, and shift-end check this. */

let active = false;

export function isTourActive() {
    return active;
}

export function setTourActive(next) {
    active = !!next;
}

export const HOW_TO_PLAY_STORAGE_KEY = 'rngame.howToPlay.firstTaskDone';

export function hasCompletedFirstRealTask() {
    try {
        return localStorage.getItem(HOW_TO_PLAY_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export function markFirstRealTaskDone() {
    try {
        localStorage.setItem(HOW_TO_PLAY_STORAGE_KEY, '1');
    } catch {
        /* private mode */
    }
}
