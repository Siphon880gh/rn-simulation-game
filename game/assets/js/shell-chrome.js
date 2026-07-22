/**
 * Shell chrome: hour-tab strip + append-only shift history log (E1.M2).
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { timemarkPlusMinutes } from './timer_utils.js';

const BOTTOM_HEIGHT_STORAGE_KEY = 'rngame.shellBottomHeightPx';
const BOTTOM_HEIGHT_MIN_PX = 120;
const BOTTOM_HEIGHT_MAX_VH = 0.55;
const BOTTOM_HEIGHT_DEFAULT_PX = 176;

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    const h = Math.floor(n / 100);
    const m = n % 100;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clampBottomHeight(px) {
    const topPrimary = document.querySelector(GameConfig.selectors.topPrimary);
    const topSecondary = document.querySelector(GameConfig.selectors.topSecondary);
    const topChrome = (topPrimary?.offsetHeight || 0) + (topSecondary?.offsetHeight || 0);
    const minBodyPx = 140;
    const maxByViewport = Math.floor(window.innerHeight * BOTTOM_HEIGHT_MAX_VH);
    const maxByLayout = window.innerHeight - topChrome - minBodyPx;
    const maxPx = Math.max(BOTTOM_HEIGHT_MIN_PX, Math.min(maxByViewport, maxByLayout));
    return Math.min(maxPx, Math.max(BOTTOM_HEIGHT_MIN_PX, Math.round(px)));
}

function applyBottomHeight(px) {
    const shell = document.querySelector(GameConfig.selectors.shell);
    if (!shell) return;
    const next = clampBottomHeight(px);
    shell.style.setProperty('--shell-bottom-height', `${next}px`);
    document.documentElement.style.setProperty('--shell-bottom-height', `${next}px`);
    return next;
}

function readStoredBottomHeight() {
    try {
        const raw = localStorage.getItem(BOTTOM_HEIGHT_STORAGE_KEY);
        if (raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    } catch {
        return null;
    }
}

function storeBottomHeight(px) {
    try {
        localStorage.setItem(BOTTOM_HEIGHT_STORAGE_KEY, String(px));
    } catch {
        /* ignore quota / private mode */
    }
}

function initBottomResize() {
    const handle = document.getElementById('shell-bottom-resize');
    if (!handle || handle.dataset.bound === '1') return;
    handle.dataset.bound = '1';

    const stored = readStoredBottomHeight();
    applyBottomHeight(stored ?? BOTTOM_HEIGHT_DEFAULT_PX);

    let dragStartY = 0;
    let dragStartHeight = 0;

    const onPointerMove = (event) => {
        const delta = dragStartY - event.clientY;
        applyBottomHeight(dragStartHeight + delta);
    };

    const onPointerUp = (event) => {
        handle.releasePointerCapture?.(event.pointerId);
        document.body.classList.remove('shell-bottom-resizing');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        const shell = document.querySelector(GameConfig.selectors.shell);
        const current = shell
            ? Number.parseFloat(getComputedStyle(shell).getPropertyValue('--shell-bottom-height'))
            : BOTTOM_HEIGHT_DEFAULT_PX;
        if (Number.isFinite(current)) {
            storeBottomHeight(clampBottomHeight(current));
        }
    };

    handle.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        const shell = document.querySelector(GameConfig.selectors.shell);
        const current = shell
            ? Number.parseFloat(getComputedStyle(shell).getPropertyValue('--shell-bottom-height'))
            : BOTTOM_HEIGHT_DEFAULT_PX;
        dragStartY = event.clientY;
        dragStartHeight = Number.isFinite(current) ? current : BOTTOM_HEIGHT_DEFAULT_PX;
        document.body.classList.add('shell-bottom-resizing');
        handle.setPointerCapture?.(event.pointerId);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    });

    handle.addEventListener('keydown', (event) => {
        const step = event.shiftKey ? 32 : 12;
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const shell = document.querySelector(GameConfig.selectors.shell);
        const current = shell
            ? Number.parseFloat(getComputedStyle(shell).getPropertyValue('--shell-bottom-height'))
            : BOTTOM_HEIGHT_DEFAULT_PX;
        const delta = event.key === 'ArrowUp' ? step : -step;
        const next = applyBottomHeight((Number.isFinite(current) ? current : BOTTOM_HEIGHT_DEFAULT_PX) + delta);
        if (next != null) storeBottomHeight(next);
    });

    window.addEventListener('resize', () => {
        const shell = document.querySelector(GameConfig.selectors.shell);
        const current = shell
            ? Number.parseFloat(getComputedStyle(shell).getPropertyValue('--shell-bottom-height'))
            : BOTTOM_HEIGHT_DEFAULT_PX;
        if (Number.isFinite(current)) applyBottomHeight(current);
    });
}

function hourCount(shiftDurationMinutes) {
    return Math.max(1, Math.ceil(Number(shiftDurationMinutes || 60) / 60));
}

function buildHourMarks(shiftStart, shiftDurationMinutes) {
    const count = hourCount(shiftDurationMinutes);
    const marks = [];
    for (let i = 0; i < count; i += 1) {
        marks.push(timemarkPlusMinutes(shiftStart, i * 60));
    }
    return marks;
}

function renderHourTabs(shiftStart, shiftDurationMinutes, activeHour) {
    const host = document.querySelector(GameConfig.selectors.hourTabs);
    if (!host) return;

    const marks = buildHourMarks(shiftStart, shiftDurationMinutes);
    host.innerHTML = '';

    marks.forEach((hhmm, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shell-hour-tab';
        btn.dataset.hourIndex = String(index);
        btn.dataset.hourHhmm = String(hhmm);
        btn.textContent = `H${index + 1} ${formatHHMM(hhmm)}`;
        if (index === activeHour) btn.classList.add('is-active');
        btn.addEventListener('click', () => {
            gameState.dispatch('SET_ACTIVE_HOUR', { hourIndex: index, hourHhmm: hhmm });
        });
        host.appendChild(btn);
    });
}

function syncActiveHourTab(activeHour) {
    const host = document.querySelector(GameConfig.selectors.hourTabs);
    if (!host) return;
    host.querySelectorAll('.shell-hour-tab').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.dataset.hourIndex) === Number(activeHour));
    });
}

function renderShiftLog(entries) {
    const host = document.querySelector(GameConfig.selectors.shiftHistoryLog);
    if (!host) return;

    if (!entries || !entries.length) {
        host.innerHTML = '<p class="shift-log-empty">No shift events yet.</p>';
        return;
    }

    host.innerHTML = entries.map((entry) => `
        <div class="shift-log-entry" data-log-id="${entry.id}">
            <span class="shift-log-time">${entry.timeLabel || '—'}</span>
            <span class="shift-log-message">${entry.message}</span>
        </div>
    `).join('');
    host.scrollTop = host.scrollHeight;
}

function setStatusMessage(text) {
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

function timeLabelFromState() {
    const t = gameState.getStateSlice('currentTime');
    return t == null ? '—' : formatHHMM(t);
}

const ShellChromeModule = {
    init(shiftConfig = {}) {
        const shiftStart = shiftConfig.shiftStarts ?? GameConfig.timer.defaultShiftStart;
        const shiftDuration = shiftConfig.shiftDuration ?? GameConfig.timer.defaultShiftDuration;
        const activeHour = gameState.getStateSlice('activeHourIndex') || 0;

        initBottomResize();
        renderHourTabs(shiftStart, shiftDuration, activeHour);
        renderShiftLog(gameState.getStateSlice('shiftLog') || []);
        setStatusMessage('Shift ready');

        gameState.subscribe('activeHourIndex', (hourIndex) => {
            syncActiveHourTab(hourIndex);
            const marks = buildHourMarks(shiftStart, shiftDuration);
            const hhmm = marks[hourIndex];
            setStatusMessage(hhmm != null ? `Viewing hour starting ${formatHHMM(hhmm)}` : 'Shift');
        });

        gameState.subscribe('shiftLog', (entries) => {
            renderShiftLog(entries);
        });

        gameState.subscribe('isPaused', (isPaused) => {
            setStatusMessage(isPaused ? 'Shift paused' : 'Shift running');
        });

        gameState.subscribe('gameStatus', (status) => {
            if (status === GameConfig.gameStates.GAME_OVER) {
                setStatusMessage('Shift ended');
            }
        });

        // Seed log once per init
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Shift chrome ready (${formatHHMM(shiftStart)}, ${Math.round(shiftDuration / 60)}h)`,
            timeLabel: formatHHMM(shiftStart)
        });
    },

    appendLog(message, timeLabel) {
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message,
            timeLabel: timeLabel || timeLabelFromState()
        });
    }
};

export default ShellChromeModule;
