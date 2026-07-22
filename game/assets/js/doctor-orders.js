/**
 * Hourly check-doctor-orders tasks (E4.M3).
 * Spawn at each game-hour start; expire at next hour; complete may inject pack orders.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
const spawnedHourStarts = new Set();
const injectionHandled = new Set();
let shiftStart = GameConfig.timer.defaultShiftStart;
let shiftDuration = GameConfig.timer.defaultShiftDuration;

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

/** Add minutes to HHMM with 24h wrap (for display / task schedule keys). */
function addMinutesToHhmm(hhmm, minutes) {
    const total = hhmmToMinutes(hhmm) + Number(minutes);
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    return Math.floor(normalized / 60) * 100 + (normalized % 60);
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

export function buildHourMarks(start, durationMinutes) {
    const count = Math.max(1, Math.ceil(Number(durationMinutes || 60) / 60));
    return Array.from({ length: count }, (_, i) => addMinutesToHhmm(start, i * 60));
}

/**
 * Resolve the active shift hour using minutes-from-shift-start
 * (handles night shifts that wrap past midnight).
 */
export function getHourWindow(currentTime, start = shiftStart, durationMinutes = shiftDuration) {
    const marks = buildHourMarks(start, durationMinutes);
    const maxHours = marks.length;
    const startM = hhmmToMinutes(start);
    let curM = hhmmToMinutes(currentTime);
    if (curM < startM) curM += 24 * 60;
    const into = Math.max(0, curM - startM);
    const hourIndex = Math.min(maxHours - 1, Math.floor(into / 60));
    const hourStart = marks[hourIndex];
    const hourEnd = hourIndex + 1 < maxHours
        ? marks[hourIndex + 1]
        : addMinutesToHhmm(hourStart, 60);
    return { hourIndex, hourStart, hourEnd, marks };
}

function ensureOrdersHost() {
    let host = document.querySelector('#doctor-orders-list');
    if (host) return host;
    const panel = document.querySelector(GameConfig.selectors.globalPanel)
        || document.querySelector('#global-panel');
    if (!panel) return null;
    const wrap = document.createElement('div');
    wrap.className = 'doctor-orders mt-4 text-left';
    wrap.innerHTML = `
      <h4 class="font-semibold text-gray-800 mb-2">Doctor orders checks</h4>
      <ul id="doctor-orders-list" class="space-y-2"></ul>
    `;
    panel.querySelector('.bg-white, .rounded-lg')?.appendChild(wrap) || panel.appendChild(wrap);
    return wrap.querySelector('#doctor-orders-list');
}

function renderOrdersTask(task) {
    const host = ensureOrdersHost();
    if (!host) return;
    let li = document.getElementById(task.id);
    if (!li || !host.contains(li)) {
        li = document.createElement('li');
        li.id = task.id;
        host.appendChild(li);
    }
    const expireLabel = task.expire != null ? formatHHMM(task.expire) : '—';
    li.setAttribute('data-task-type', 'orders');
    li.setAttribute('data-status', task.status);
    li.setAttribute('data-scheduled', String(task.scheduled).padStart(4, '0'));
    li.setAttribute('data-expire', task.expire != null ? String(task.expire).padStart(4, '0') : '');
    li.setAttribute('data-duration-mins', String(task.duration || 5));
    li.className = `bg-white p-3 rounded-lg shadow flex items-center task-status-${task.status} border border-gray-100`;
    li.innerHTML = `
      <i class="fas fa-clipboard-list text-indigo-500 text-xl mr-3"></i>
      <div class="flex-1 text-left">
        <span class="font-medium text-gray-900">${task.name}</span>
        <p class="text-xs text-gray-500">Window ${formatHHMM(task.scheduled)} – ${expireLabel}</p>
      </div>
    `;
}

function spawnHourlyCheck(hourStart, hourEnd, hourIndex) {
    if (spawnedHourStarts.has(hourStart)) return null;
    spawnedHourStarts.add(hourStart);

    const task = taskSystem.createTask({
        id: `orders-check-${hourStart}`,
        type: 'orders',
        taskClass: GameConfig.tasks.classes.ROUTINE,
        name: `Check doctor orders (H${hourIndex + 1})`,
        scheduled: hourStart,
        expire: hourEnd,
        durationMins: GameConfig.doctorOrders?.durationMins ?? 5,
        patientId: null,
        metadata: {
            kind: 'doctor-orders-check',
            hourIndex,
            hourStart,
            hourEnd
        }
    });

    taskSystem.processTasks(gameState.getStateSlice('currentTime') || hourStart);
    const live = gameState.getStateSlice('tasks').get(task.id) || task;
    renderOrdersTask(live);

    gameState.dispatch('SET_ACTIVE_HOUR', {
        hourIndex,
        hourHhmm: hourStart
    });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Doctor orders check available for ${formatHHMM(hourStart)} hour`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime') || hourStart)
    });

    return live;
}

function injectionsForHour(hourStart) {
    const pack = gameState.getStateSlice('scenarioPack');
    const map = pack?.orderInjections || {};
    const key = String(hourStart);
    if (Array.isArray(map[key])) return map[key];
    if (Array.isArray(map[hourStart])) return map[hourStart];
    if (Array.isArray(map.default)) return map.default;
    return [];
}

export function handleOrdersCheckComplete(task) {
    if (!task || task.metadata?.kind !== 'doctor-orders-check') return;
    if (injectionHandled.has(task.id)) return;
    injectionHandled.add(task.id);

    const hourStart = task.metadata.hourStart ?? task.scheduled;
    const specs = injectionsForHour(hourStart);
    const now = gameState.getStateSlice('currentTime') || hourStart;

    if (!specs.length) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Orders check complete — no new orders this hour`,
            timeLabel: formatHHMM(now)
        });
        renderOrdersTask(gameState.getStateSlice('tasks').get(task.id) || task);
        return;
    }

    specs.forEach((spec, index) => {
        taskSystem.createTask({
            id: spec.id || `order-inj-${hourStart}-${index}`,
            type: spec.type || 'med',
            taskClass: spec.taskClass || GameConfig.tasks.classes.ROUTINE,
            name: spec.name || 'New doctor order',
            scheduled: spec.scheduled != null ? spec.scheduled : now,
            expire: spec.expire != null ? spec.expire : '+60',
            durationMins: spec.durationMins ?? 10,
            patientId: spec.patientId || null,
            metadata: { ...(spec.metadata || {}), fromOrdersCheck: true, hourStart }
        });
    });

    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Orders check complete — ${specs.length} new order(s) injected`,
        timeLabel: formatHHMM(now)
    });
    renderOrdersTask(gameState.getStateSlice('tasks').get(task.id) || task);
}

export function processDoctorOrdersTime(currentTime) {
    if (currentTime == null) return;
    if (gameState.getStateSlice('isPaused')) return;
    if (gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER) return;

    const { hourIndex, hourStart, hourEnd } = getHourWindow(currentTime);
    spawnHourlyCheck(hourStart, hourEnd, hourIndex);

    // Refresh DOM statuses for order checks
    const tasks = gameState.getStateSlice('tasks');
    tasks?.forEach((task) => {
        if (task.metadata?.kind === 'doctor-orders-check') {
            renderOrdersTask(task);
        }
    });
}

export function resetDoctorOrders() {
    spawnedHourStarts.clear();
    injectionHandled.clear();
}

const DoctorOrdersModule = {
    buildHourMarks,
    getHourWindow,
    processDoctorOrdersTime,
    handleOrdersCheckComplete,
    resetDoctorOrders,
    init(config = {}) {
        resetDoctorOrders();
        shiftStart = config.shiftStarts ?? GameConfig.timer.defaultShiftStart;
        shiftDuration = config.shiftDuration ?? GameConfig.timer.defaultShiftDuration;

        gameState.subscribe('currentTime', (t) => processDoctorOrdersTime(t));
        gameState.subscribe('tasks', (tasks) => {
            if (!tasks) return;
            tasks.forEach((task) => {
                if (
                    task.metadata?.kind === 'doctor-orders-check'
                    && task.status === GameConfig.tasks.statuses.COMPLETED
                ) {
                    handleOrdersCheckComplete(task);
                }
            });
        });
    }
};

export default DoctorOrdersModule;
