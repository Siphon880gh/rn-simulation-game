/**
 * Shell chrome: hour-tab strip + append-only shift history log (E1.M2).
 * Hour tabs: hover peek (truncated popover) / click peek (pause + modal).
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import ModalModule from './modal.js';
import { timemarkPlusMinutes } from './timer_utils.js';

const BOTTOM_HEIGHT_STORAGE_KEY = 'rngame.shellBottomHeightPx';
const BOTTOM_HEIGHT_MIN_PX = 120;
const BOTTOM_HEIGHT_MAX_VH = 0.55;
const BOTTOM_HEIGHT_DEFAULT_PX = 176;
const TOP_COLLAPSED_STORAGE_KEY = 'rngame.shellTopCollapsed';
const CLOCK_FLOAT_POS_STORAGE_KEY = 'rngame.shellClockFloatPos';
const HOUR_PEEK_TRUNCATE = 3;
const HOUR_PEEK_SHOW_MS = 220;
const HOUR_PEEK_HIDE_MS = 180;
const PAUSE_MODAL = GameConfig.timer.pauseSources.MODAL;

let hourPeekPopoverEl = null;
let hourPeekShowTimer = null;
let hourPeekHideTimer = null;
let hourPeekActiveBtn = null;
let hourPeekModalOpen = false;
let brandMenuModalOpen = false;

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    const h = Math.floor(n / 100);
    const m = n % 100;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function parseTimeLabelToMinutes(label) {
    if (label == null) return null;
    if (typeof label === 'number') return hhmmToMinutes(label);
    const m = String(label).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
}

function minutesInHourWindow(mins, hourStartHhmm, hourEndHhmm) {
    if (mins == null || !Number.isFinite(mins)) return false;
    const start = hhmmToMinutes(hourStartHhmm);
    let end = hhmmToMinutes(hourEndHhmm);
    if (end <= start) end += 24 * 60;
    let t = mins;
    if (t < start) t += 24 * 60;
    return t >= start && t < end;
}

function hourEndMark(marks, index) {
    if (index + 1 < marks.length) return Number(marks[index + 1]);
    return Number(timemarkPlusMinutes(marks[index], 60));
}

/**
 * Collect truncated/full peek lines for one shift hour.
 * @returns {{ label: string, hourStart: number, hourEnd: number, lines: string[], more: number }}
 */
function collectHourPeek(hourIndex, marks) {
    const hourStart = Number(marks[hourIndex]);
    const hourEnd = hourEndMark(marks, hourIndex);
    const label = formatHHMM(hourStart);
    const lines = [];

    const fired = gameState.getStateSlice('firedEvents') || [];
    fired.forEach((ev) => {
        if (!minutesInHourWindow(hhmmToMinutes(ev.at), hourStart, hourEnd)) return;
        const prefix = ev.type === 'emergency' ? '⚠ ' : '';
        lines.push(`${prefix}${ev.message || ev.eventId || 'Event'}`);
    });

    const tasks = gameState.getStateSlice('tasks');
    if (tasks) {
        tasks.forEach((task) => {
            if (!minutesInHourWindow(hhmmToMinutes(task.scheduled), hourStart, hourEnd)) return;
            const status = task.status || 'pending';
            lines.push(`Task: ${task.name || task.id} (${status})`);
        });
    }

    const log = gameState.getStateSlice('shiftLog') || [];
    log.forEach((entry) => {
        const mins = parseTimeLabelToMinutes(entry.timeLabel);
        if (!minutesInHourWindow(mins, hourStart, hourEnd)) return;
        const msg = entry.message || '';
        // Skip chrome seed noise; prefer event/task lines already listed
        if (/^Shift chrome ready/i.test(msg)) return;
        if (lines.some((l) => msg.includes(l.replace(/^⚠\s*/, '').slice(0, 24)))) return;
        lines.push(msg);
    });

    return {
        label,
        hourStart,
        hourEnd,
        lines,
        more: 0
    };
}

function truncatePeekLines(peek, limit = HOUR_PEEK_TRUNCATE) {
    if (peek.lines.length <= limit) {
        return { ...peek, shown: peek.lines, more: 0 };
    }
    return {
        ...peek,
        shown: peek.lines.slice(0, limit),
        more: peek.lines.length - limit
    };
}

function ensureHourPeekPopover() {
    if (hourPeekPopoverEl) return hourPeekPopoverEl;
    hourPeekPopoverEl = document.createElement('div');
    hourPeekPopoverEl.id = 'hour-peek-popover';
    hourPeekPopoverEl.className = 'hour-peek-popover hidden';
    hourPeekPopoverEl.setAttribute('role', 'tooltip');
    document.body.appendChild(hourPeekPopoverEl);

    hourPeekPopoverEl.addEventListener('mouseenter', () => {
        clearTimeout(hourPeekHideTimer);
    });
    hourPeekPopoverEl.addEventListener('mouseleave', () => {
        scheduleHideHourPeekPopover();
    });
    return hourPeekPopoverEl;
}

function hideHourPeekPopover() {
    clearTimeout(hourPeekShowTimer);
    clearTimeout(hourPeekHideTimer);
    hourPeekActiveBtn = null;
    if (hourPeekPopoverEl) hourPeekPopoverEl.classList.add('hidden');
}

function scheduleHideHourPeekPopover() {
    clearTimeout(hourPeekHideTimer);
    hourPeekHideTimer = setTimeout(hideHourPeekPopover, HOUR_PEEK_HIDE_MS);
}

function positionHourPeekPopover(anchor) {
    const el = ensureHourPeekPopover();
    const rect = anchor.getBoundingClientRect();
    const pad = 8;
    const width = Math.min(280, window.innerWidth - pad * 2);
    el.style.width = `${width}px`;
    el.classList.remove('hidden');
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 6;
    const box = el.getBoundingClientRect();
    if (left + box.width > window.scrollX + window.innerWidth - pad) {
        left = window.scrollX + window.innerWidth - box.width - pad;
    }
    if (left < window.scrollX + pad) left = window.scrollX + pad;
    if (rect.bottom + box.height + 6 > window.innerHeight && rect.top > box.height + 6) {
        top = rect.top + window.scrollY - box.height - 6;
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
}

function renderHourPeekPopover(btn, marks) {
    const hourIndex = Number(btn.dataset.hourIndex);
    const peek = truncatePeekLines(collectHourPeek(hourIndex, marks));
    const el = ensureHourPeekPopover();
    const items = peek.shown.length
        ? `<ul class="hour-peek-popover__list">${peek.shown.map((line) =>
            `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
        : '<p class="hour-peek-popover__empty">No activity yet this hour.</p>';
    const more = peek.more > 0
        ? `<p class="hour-peek-popover__more">+${peek.more} more</p>`
        : '';
    el.innerHTML = `
        <p class="hour-peek-popover__title">${escapeHtml(peek.label)}–${escapeHtml(formatHHMM(peek.hourEnd))}</p>
        ${items}
        ${more}
        <p class="hour-peek-popover__hint">Click to pause &amp; peek full hour</p>
    `;
    positionHourPeekPopover(btn);
}

function closeHourPeekModal() {
    document.removeEventListener('keydown', onHourPeekKeydown);
    if (!hourPeekModalOpen) {
        ModalModule.closeModal();
        return;
    }
    hourPeekModalOpen = false;
    gameState.dispatch('SET_PAUSE', { paused: false, source: PAUSE_MODAL });
    ModalModule.closeModal();
    setStatusMessage(gameState.getStateSlice('isPaused') ? 'Shift paused' : 'Shift running');
}

function onHourPeekKeydown(event) {
    if (event.key === 'Escape' && hourPeekModalOpen) {
        event.preventDefault();
        closeHourPeekModal();
    }
}

function openHourPeekModal(hourIndex, marks) {
    hideHourPeekPopover();
    const peek = collectHourPeek(hourIndex, marks);
    gameState.dispatch('SET_ACTIVE_HOUR', { hourIndex, hourHhmm: peek.hourStart });
    gameState.dispatch('SET_PAUSE', { paused: true, source: PAUSE_MODAL });
    hourPeekModalOpen = true;
    document.addEventListener('keydown', onHourPeekKeydown);

    const listHtml = peek.lines.length
        ? `<ul class="hour-peek-modal__list">${peek.lines.map((line) =>
            `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
        : '<p class="text-sm text-gray-600">No events or tasks recorded for this hour yet.</p>';

    ModalModule.openModal({
        title: `Hour peek · ${formatHHMM(peek.hourStart)}–${formatHHMM(peek.hourEnd)}`,
        content: `
            <div class="hour-peek-modal space-y-2 text-left">
                <p class="text-sm text-gray-600">Shift clock paused while you review this hour.</p>
                ${listHtml}
            </div>
        `,
        footer: `<button type="button" class="px-4 py-2 bg-blue-500 text-white rounded" onclick="window.hourPeekClose()">Resume shift</button>`,
        overlay: true,
        persistent: false
    });
    setStatusMessage(`Paused — peeking ${formatHHMM(peek.hourStart)}`);
}

window.hourPeekClose = closeHourPeekModal;

function closeBrandMenuModal() {
    document.removeEventListener('keydown', onBrandMenuKeydown);
    if (!brandMenuModalOpen) {
        ModalModule.closeModal();
        return;
    }
    brandMenuModalOpen = false;
    gameState.dispatch('SET_PAUSE', { paused: false, source: PAUSE_MODAL });
    ModalModule.closeModal();
    setStatusMessage(gameState.getStateSlice('isPaused') ? 'Shift paused' : 'Shift running');
}

function onBrandMenuKeydown(event) {
    if (event.key === 'Escape' && brandMenuModalOpen) {
        event.preventDefault();
        closeBrandMenuModal();
    }
}

function restartCurrentShift() {
    window.location.reload();
}

function chooseAnotherDepartment() {
    window.location.href = '../index.html';
}

function wireBrandMenuModalActions() {
    const footer = document.querySelector(GameConfig.selectors.modalFooter);
    if (!footer) return;
    footer.querySelectorAll('[data-brand-menu-action]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const action = btn.getAttribute('data-brand-menu-action');
            if (action === 'resume') closeBrandMenuModal();
            else if (action === 'restart') restartCurrentShift();
            else if (action === 'department') chooseAnotherDepartment();
        });
    });
}

function openBrandMenuModal() {
    if (brandMenuModalOpen || hourPeekModalOpen) return;
    if (gameState.getStateSlice('gameStatus') === GameConfig.gameStates.GAME_OVER) return;

    gameState.dispatch('SET_PAUSE', { paused: true, source: PAUSE_MODAL });
    brandMenuModalOpen = true;
    document.addEventListener('keydown', onBrandMenuKeydown);

    ModalModule.openModal({
        title: 'Shift menu',
        content: `
            <div class="brand-menu-modal space-y-3 text-left">
                <p class="text-sm text-gray-600">Shift clock is paused. Restart this assignment, pick another unit, or resume.</p>
            </div>
        `,
        footer: `
            <div class="brand-menu-modal__actions flex flex-wrap gap-2 justify-end">
                <button type="button" data-brand-menu-action="resume"
                    class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Resume</button>
                <button type="button" data-brand-menu-action="restart"
                    class="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Restart shift</button>
                <button type="button" data-brand-menu-action="department"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Choose department</button>
            </div>
        `,
        overlay: true,
        persistent: false
    });
    wireBrandMenuModalActions();
    setStatusMessage('Paused — shift menu');
}

function wireBrandMenu() {
    const brandEl = document.querySelector(GameConfig.selectors.brandTitle);
    if (!brandEl) return;

    brandEl.classList.add('shell-brand-title--interactive');
    brandEl.setAttribute('role', 'button');
    brandEl.setAttribute('tabindex', '0');
    brandEl.setAttribute('title', 'Shift menu');
    brandEl.setAttribute('aria-haspopup', 'dialog');
    brandEl.setAttribute('aria-label', 'Open shift menu');

    const open = (event) => {
        event.preventDefault();
        openBrandMenuModal();
    };
    brandEl.addEventListener('click', open);
    brandEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openBrandMenuModal();
        }
    });
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

function readStoredTopCollapsed() {
    try {
        return localStorage.getItem(TOP_COLLAPSED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function storeTopCollapsed(collapsed) {
    try {
        localStorage.setItem(TOP_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
        /* ignore quota / private mode */
    }
}

function readStoredClockFloatPos() {
    try {
        const raw = localStorage.getItem(CLOCK_FLOAT_POS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const left = Number(parsed?.left);
        const top = Number(parsed?.top);
        if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
        return { left, top };
    } catch {
        return null;
    }
}

function storeClockFloatPos(left, top) {
    try {
        localStorage.setItem(CLOCK_FLOAT_POS_STORAGE_KEY, JSON.stringify({ left, top }));
    } catch {
        /* ignore quota / private mode */
    }
}

function clampClockFloatPos(left, top, cluster) {
    const margin = 8;
    const width = cluster.offsetWidth || 170;
    const height = cluster.offsetHeight || 220;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    return {
        left: Math.min(Math.max(margin, left), maxLeft),
        top: Math.min(Math.max(margin, top), maxTop)
    };
}

function applyClockFloatPos(left, top) {
    const cluster = document.getElementById('shell-clock-cluster');
    if (!cluster) return null;
    const next = clampClockFloatPos(left, top, cluster);
    cluster.style.left = `${next.left}px`;
    cluster.style.top = `${next.top}px`;
    cluster.style.right = 'auto';
    return next;
}

function clearClockFloatPosStyles() {
    const cluster = document.getElementById('shell-clock-cluster');
    if (!cluster) return;
    cluster.style.left = '';
    cluster.style.top = '';
    cluster.style.right = '';
}

function syncTopCollapseChrome(collapsed) {
    const header = document.querySelector(GameConfig.selectors.topPrimary);
    const toggle = document.getElementById('shell-top-collapse');
    if (!header || !toggle) return;

    header.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.title = collapsed ? 'Expand top bar' : 'Collapse top bar';

    const label = toggle.querySelector('[data-collapse-label]');
    if (label) label.textContent = collapsed ? 'Expand' : 'Collapse';

    const collapseIcon = toggle.querySelector('[data-collapse-icon="collapse"]');
    const expandIcon = toggle.querySelector('[data-collapse-icon="expand"]');
    if (collapseIcon) collapseIcon.classList.toggle('hidden', collapsed);
    if (expandIcon) expandIcon.classList.toggle('hidden', !collapsed);
}

function placeFloatingClockCluster() {
    const cluster = document.getElementById('shell-clock-cluster');
    if (!cluster) return;

    const stored = readStoredClockFloatPos();
    if (stored) {
        applyClockFloatPos(stored.left, stored.top);
        return;
    }

    const rect = cluster.getBoundingClientRect();
    const next = applyClockFloatPos(rect.left, rect.top);
    if (next) storeClockFloatPos(next.left, next.top);
}

function setTopCollapsed(collapsed) {
    const header = document.querySelector(GameConfig.selectors.topPrimary);
    if (!header) return;

    if (collapsed) {
        // Capture on-screen position before fixed positioning takes over.
        placeFloatingClockCluster();
        syncTopCollapseChrome(true);
        // Re-clamp after layout settles (padding/border change size).
        requestAnimationFrame(() => {
            const cluster = document.getElementById('shell-clock-cluster');
            if (!cluster) return;
            const left = Number.parseFloat(cluster.style.left);
            const top = Number.parseFloat(cluster.style.top);
            if (Number.isFinite(left) && Number.isFinite(top)) {
                const next = applyClockFloatPos(left, top);
                if (next) storeClockFloatPos(next.left, next.top);
            } else {
                placeFloatingClockCluster();
            }
        });
    } else {
        syncTopCollapseChrome(false);
        clearClockFloatPosStyles();
    }

    storeTopCollapsed(collapsed);
}

function initTopCollapse() {
    const header = document.querySelector(GameConfig.selectors.topPrimary);
    const toggle = document.getElementById('shell-top-collapse');
    const dragHandle = document.getElementById('shell-clock-drag');
    const cluster = document.getElementById('shell-clock-cluster');
    if (!header || !toggle || !cluster || toggle.dataset.bound === '1') return;
    toggle.dataset.bound = '1';

    toggle.addEventListener('click', () => {
        setTopCollapsed(!header.classList.contains('is-collapsed'));
    });

    if (dragHandle && dragHandle.dataset.bound !== '1') {
        dragHandle.dataset.bound = '1';

        let dragStartX = 0;
        let dragStartY = 0;
        let originLeft = 0;
        let originTop = 0;

        const onPointerMove = (event) => {
            applyClockFloatPos(
                originLeft + (event.clientX - dragStartX),
                originTop + (event.clientY - dragStartY)
            );
        };

        const onPointerUp = (event) => {
            dragHandle.releasePointerCapture?.(event.pointerId);
            document.body.classList.remove('shell-clock-dragging');
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            const left = Number.parseFloat(cluster.style.left);
            const top = Number.parseFloat(cluster.style.top);
            if (Number.isFinite(left) && Number.isFinite(top)) {
                storeClockFloatPos(left, top);
            }
        };

        dragHandle.addEventListener('pointerdown', (event) => {
            if (!header.classList.contains('is-collapsed')) return;
            if (event.button != null && event.button !== 0) return;
            event.preventDefault();
            const rect = cluster.getBoundingClientRect();
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            originLeft = rect.left;
            originTop = rect.top;
            document.body.classList.add('shell-clock-dragging');
            dragHandle.setPointerCapture?.(event.pointerId);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    }

    window.addEventListener('resize', () => {
        if (!header.classList.contains('is-collapsed')) return;
        const left = Number.parseFloat(cluster.style.left);
        const top = Number.parseFloat(cluster.style.top);
        if (Number.isFinite(left) && Number.isFinite(top)) {
            const next = applyClockFloatPos(left, top);
            if (next) storeClockFloatPos(next.left, next.top);
        }
    });

    if (readStoredTopCollapsed()) {
        setTopCollapsed(true);
    } else {
        syncTopCollapseChrome(false);
    }
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
        btn.setAttribute('role', 'tab');
        btn.dataset.hourIndex = String(index);
        btn.dataset.hourHhmm = String(hhmm);
        const label = formatHHMM(hhmm);
        btn.textContent = label;
        btn.setAttribute('aria-label', `Peek hour ${label}`);
        btn.setAttribute('aria-haspopup', 'dialog');
        if (index === activeHour) btn.classList.add('is-active');

        btn.addEventListener('mouseenter', () => {
            if (hourPeekModalOpen) return;
            clearTimeout(hourPeekHideTimer);
            clearTimeout(hourPeekShowTimer);
            hourPeekActiveBtn = btn;
            hourPeekShowTimer = setTimeout(() => {
                if (hourPeekActiveBtn === btn) renderHourPeekPopover(btn, marks);
            }, HOUR_PEEK_SHOW_MS);
        });
        btn.addEventListener('mouseleave', () => {
            scheduleHideHourPeekPopover();
        });
        btn.addEventListener('focus', () => {
            if (hourPeekModalOpen) return;
            clearTimeout(hourPeekHideTimer);
            hourPeekActiveBtn = btn;
            renderHourPeekPopover(btn, marks);
        });
        btn.addEventListener('blur', () => {
            scheduleHideHourPeekPopover();
        });
        btn.addEventListener('click', () => {
            openHourPeekModal(index, marks);
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
        initTopCollapse();
        wireBrandMenu();
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
            if (hourPeekModalOpen || brandMenuModalOpen) return;
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
