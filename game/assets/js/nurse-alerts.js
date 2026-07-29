/**
 * Nurse alerts — call lights (water/comfort) + bed near-fall alarms.
 * Cadence a few times per shift; plays alarm sound on spawn.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { presentSpawnedTask, weightedPick } from './dynamic-tasks.js';
import { playAlarm } from './sound.js';

const spawnedBuckets = {
    callLights: new Set(),
    bedAlarms: new Set()
};
const spawnCounts = {
    callLights: 0,
    bedAlarms: 0
};

let shiftStart = GameConfig.timer.defaultShiftStart;

function cfg() {
    return GameConfig.nurseAlerts || {};
}

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function minutesIntoShift(currentTime, start = shiftStart) {
    const startM = hhmmToMinutes(start);
    let curM = hhmmToMinutes(currentTime);
    if (curM < startM) curM += 24 * 60;
    return Math.max(0, curM - startM);
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function pickPatientId(random = Math.random) {
    const patients = gameState.getStateSlice('patients');
    if (!patients?.size) return null;
    const ids = [...patients.keys()];
    return ids[Math.floor(random() * ids.length)] || null;
}

function statusMessage(text) {
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

/**
 * @param {'callLights'|'bedAlarms'} channel
 * @param {object} template
 * @param {number} currentTime
 * @param {{ random?: () => number, silent?: boolean }} [opts]
 */
export function spawnNurseAlert(channel, template, currentTime, opts = {}) {
    if (!template) return null;
    const random = opts.random || Math.random;
    const patientId = (opts.patientId && gameState.getStateSlice('patients')?.has(opts.patientId))
        ? opts.patientId
        : pickPatientId(random);
    if (!patientId) return null;

    const id = `alert-${channel}-${template.id || 'x'}-${Date.now()}-${Math.floor(random() * 1e4)}`;
    const alarm = template.alarm || (channel === 'bedAlarms' ? 'bed' : 'callLight');
    const task = taskSystem.createTask({
        id,
        type: template.type || 'assessment',
        taskClass: template.taskClass || GameConfig.tasks.classes.URGENT,
        name: template.name || 'Nurse alert',
        scheduled: currentTime,
        expire: template.expire != null ? template.expire : '+40',
        durationMins: template.durationMins ?? 10,
        patientId,
        metadata: {
            dynamic: true,
            incident: true,
            nurseAlert: true,
            alertChannel: channel,
            alarm,
            templateId: template.id || null
        }
    });

    const live = presentSpawnedTask(task, {
        at: currentTime,
        focusPatient: opts.focusPatient === true,
        scrollIntoView: opts.scrollIntoView
    }) || task;

    if (!opts.silent) {
        playAlarm(alarm);
    }

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `${channel === 'bedAlarms' ? 'Bed alarm' : 'Call light'}: ${live.name} (${patientId})`,
        timeLabel: formatHHMM(currentTime)
    });
    statusMessage(live.name);
    spawnCounts[channel] = (spawnCounts[channel] || 0) + 1;
    return live;
}

function processChannel(channel, currentTime, opts = {}) {
    const channelCfg = cfg()[channel];
    if (!channelCfg) return null;

    const into = minutesIntoShift(currentTime, shiftStart);
    const firstAfter = Number(channelCfg.firstAfterGameMinutes) || 0;
    const cadence = Number(channelCfg.cadenceGameMinutes) || 120;
    const maxPerShift = Number(channelCfg.maxPerShift) || 2;

    if (into < firstAfter) return null;
    if (spawnCounts[channel] >= maxPerShift) return null;

    const bucket = Math.floor(into / cadence);
    const key = `${channel}-${bucket}`;
    if (spawnedBuckets[channel].has(key)) return null;

    const templates = channelCfg.templates || [];
    const template = weightedPick(templates, opts.random);
    spawnedBuckets[channel].add(key);
    if (!template) return null;

    return spawnNurseAlert(channel, template, currentTime, opts);
}

export function processNurseAlertsTime(currentTime, opts = {}) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (gameState.getStateSlice('gameStatus') !== GameConfig.gameStates.RUNNING) return;
    processChannel('callLights', currentTime, opts);
    processChannel('bedAlarms', currentTime, opts);
}

/** Test-mode / QA force spawn. */
export function spawnCallLightNow(opts = {}) {
    const channelCfg = cfg().callLights || {};
    const templates = channelCfg.templates || [];
    const template = opts.templateId
        ? templates.find((t) => t.id === opts.templateId)
        : weightedPick(templates, opts.random);
    const now = opts.at ?? gameState.getStateSlice('currentTime')
        ?? GameConfig.timer.defaultShiftStart;
    return spawnNurseAlert('callLights', template || templates[0], now, opts);
}

export function spawnBedAlarmNow(opts = {}) {
    const channelCfg = cfg().bedAlarms || {};
    const templates = channelCfg.templates || [];
    const template = opts.templateId
        ? templates.find((t) => t.id === opts.templateId)
        : weightedPick(templates, opts.random);
    const now = opts.at ?? gameState.getStateSlice('currentTime')
        ?? GameConfig.timer.defaultShiftStart;
    return spawnNurseAlert('bedAlarms', template || templates[0], now, opts);
}

export function resetNurseAlerts() {
    spawnedBuckets.callLights.clear();
    spawnedBuckets.bedAlarms.clear();
    spawnCounts.callLights = 0;
    spawnCounts.bedAlarms = 0;
}

export function initNurseAlerts(config = {}) {
    resetNurseAlerts();
    shiftStart = config.shiftStarts ?? GameConfig.timer.defaultShiftStart;
    gameState.subscribe('currentTime', (t) => processNurseAlertsTime(t));
}

const NurseAlertsModule = {
    init: initNurseAlerts,
    reset: resetNurseAlerts,
    processNurseAlertsTime,
    spawnNurseAlert,
    spawnCallLightNow,
    spawnBedAlarmNow
};

export default NurseAlertsModule;
