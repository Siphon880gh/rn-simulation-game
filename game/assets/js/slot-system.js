/**
 * Concurrent task slots (E3.M2) — perform occupies a slot for task.duration.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import {
    resolveEffectiveDuration,
    setLastReleasedClass,
    resetClassInteractions
} from './task-class-interactions.js';

function hhmmToMinutes(hhmm) {
    const n = Number(hhmm) || 0;
    return Math.floor(n / 100) * 60 + (n % 100);
}

function minutesToHhmm(totalMinutes) {
    const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return hours * 100 + mins;
}

function formatHhmm(hhmm) {
    if (hhmm == null) return '';
    const n = Number(hhmm);
    const h = Math.floor(n / 100);
    const m = n % 100;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * While a booster freeze is active, slots advance on a virtual clock from freeze.baseTime
 * (shift display clock stays frozen). Reads boosterFreeze state shape from boosters.js.
 */
function freezeExecutionTime() {
    const freeze = gameState.getStateSlice('boosterFreeze');
    if (!freeze || freeze.baseTime == null || !freeze.startedAtMs || !freeze.endsAtMs) {
        return null;
    }
    const span = Math.max(1, Number(freeze.endsAtMs) - Number(freeze.startedAtMs));
    const elapsed = Math.max(0, Math.min(span, Date.now() - Number(freeze.startedAtMs)));
    const gameMinutes = Math.max(0, Number(freeze.gameMinutes) || 0);
    const virtualMins = Math.floor((elapsed / span) * gameMinutes);
    return minutesToHhmm(hhmmToMinutes(freeze.baseTime) + virtualMins);
}

function resolveExecutionTime(hint) {
    const freezeTime = freezeExecutionTime();
    if (freezeTime != null) return freezeTime;
    return hint ?? gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
}

function renderSlots(slots) {
    const bar = document.querySelector(GameConfig.selectors.taskQueueBar);
    if (!bar) return;

    bar.innerHTML = slots.map((slot) => {
        if (!slot.taskId) {
            return `
              <div class="task-slot task-slot--empty" data-slot-id="${slot.id}" title="Click an active task → Perform to fill this slot">
                <span class="task-slot-label">Slot ${slot.id + 1}</span>
                <span class="task-slot-hint">idle</span>
              </div>`;
        }
        const progress = Number(slot.progress) || 0;
        return `
          <div class="task-slot task-slot--busy" data-slot-id="${slot.id}" data-task-id="${slot.taskId}">
            <span class="task-slot-name">${slot.taskName || 'Task'}</span>
            <div class="task-slot-progress" aria-hidden="true">
              <div class="task-slot-progress-fill" style="width:${progress}%"></div>
            </div>
            <span class="task-slot-timemark">${formatHhmm(slot.endsAt)}</span>
          </div>`;
    }).join('');
}

function renderQueue(queue) {
    const host = document.querySelector(GameConfig.slots.queueSelector);
    if (!host) return;

    if (!queue || !queue.length) {
        host.innerHTML = '<p class="slot-queue-empty">Waiting queue empty</p>';
        host.dataset.count = '0';
        return;
    }

    host.dataset.count = String(queue.length);
    host.innerHTML = `
      <p class="slot-queue-heading">Waiting (${queue.length})</p>
      <ol class="slot-queue-list">
        ${queue.map((item, index) => `
          <li class="slot-queue-item" data-task-id="${item.taskId}">
            <span class="slot-queue-pos">${index + 1}</span>
            <span class="slot-queue-name">${item.taskName || item.taskId}</span>
          </li>`).join('')}
      </ol>`;
}

function ensureOccupancySpinner(el, state) {
    if (!el) return;
    let spin = el.querySelector(':scope > .task-occupancy-spin');
    if (!spin) {
        spin = document.createElement('span');
        spin.className = 'task-occupancy-spin';
        spin.setAttribute('aria-hidden', 'true');
        spin.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        el.appendChild(spin);
    }
    spin.dataset.state = state;
}

/** Mark patient-panel tasks that already occupy a slot or waiting-queue entry. */
function syncTaskOccupancyMarkers() {
    const busyIds = new Set(
        (gameState.getStateSlice('slots') || [])
            .map((s) => s.taskId)
            .filter(Boolean)
    );
    const queuedIds = new Set(
        (gameState.getStateSlice('slotQueue') || [])
            .map((item) => item.taskId)
            .filter(Boolean)
    );
    const occupiedIds = new Set([...busyIds, ...queuedIds]);

    document.querySelectorAll('[data-slot-state]').forEach((el) => {
        if (!occupiedIds.has(el.id)) {
            el.removeAttribute('data-slot-state');
            el.querySelector(':scope > .task-occupancy-spin')?.remove();
        }
    });
    document.querySelectorAll('.task-occupancy-spin').forEach((spin) => {
        const host = spin.parentElement;
        if (!host?.id || !occupiedIds.has(host.id)) spin.remove();
    });

    busyIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('data-slot-state', 'busy');
        ensureOccupancySpinner(el, 'busy');
    });
    queuedIds.forEach((id) => {
        if (busyIds.has(id)) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('data-slot-state', 'queued');
        ensureOccupancySpinner(el, 'queued');
    });
}

const SlotSystem = {
    init() {
        resetClassInteractions();
        renderSlots(gameState.getStateSlice('slots') || []);
        renderQueue(gameState.getStateSlice('slotQueue') || []);
        syncTaskOccupancyMarkers();
        gameState.subscribe('slots', (slots) => {
            renderSlots(slots || []);
            syncTaskOccupancyMarkers();
        });
        gameState.subscribe('slotQueue', (queue) => {
            renderQueue(queue || []);
            syncTaskOccupancyMarkers();
        });
        gameState.subscribe('currentTime', (currentTime) => {
            if (currentTime != null) {
                this.processSlots(currentTime);
            }
        });
    },

    hasFreeSlot() {
        const slots = gameState.getStateSlice('slots') || [];
        return slots.some((s) => !s.taskId);
    },

    findSlotForTask(taskId) {
        return (gameState.getStateSlice('slots') || []).find((s) => s.taskId === taskId) || null;
    },

    isQueued(taskId) {
        return (gameState.getStateSlice('slotQueue') || []).some((item) => item.taskId === taskId);
    },

    /** @returns {'busy'|'queued'|null} */
    getTaskSlotState(taskId) {
        if (!taskId) return null;
        if (this.findSlotForTask(taskId)) return 'busy';
        if (this.isQueued(taskId)) return 'queued';
        return null;
    },

    isOccupied(taskId) {
        return this.getTaskSlotState(taskId) != null;
    },

    /** Re-apply data-slot-state after patient panel re-renders. */
    refreshOccupancyMarkers() {
        syncTaskOccupancyMarkers();
    },

    /**
     * Start task in a free slot, or enqueue FIFO when full.
     * @returns {{ ok: boolean, queued?: boolean, reason?: string }}
     */
    requestSlot(task, currentTime) {
        if (!task?.id) return { ok: false, reason: 'missing-task' };
        if (this.findSlotForTask(task.id)) return { ok: true };
        if (this.isQueued(task.id)) return { ok: true, queued: true };

        const now = resolveExecutionTime(currentTime);
        if (this.hasFreeSlot()) {
            this.assignTaskNow(task, now);
            return { ok: true };
        }

        gameState.dispatch('ENQUEUE_SLOT_TASK', {
            taskId: task.id,
            taskName: task.name,
            patientId: task.patientId || null
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Queued ${task.name} (slots full)`,
            timeLabel: formatHhmm(now)
        });
        return { ok: true, queued: true };
    },

    /** @deprecated use requestSlot — kept for callers that expect boolean assign-only */
    tryAssignTask(task, currentTime) {
        if (!task?.id) return false;
        if (this.findSlotForTask(task.id)) return true;
        if (!this.hasFreeSlot()) return false;
        this.assignTaskNow(task, resolveExecutionTime(currentTime));
        return true;
    },

    assignTaskNow(task, currentTime) {
        const now = resolveExecutionTime(currentTime);
        const resolved = resolveEffectiveDuration(task);
        const duration = resolved.duration;
        const endsAt = minutesToHhmm(hhmmToMinutes(now) + duration);

        gameState.dispatch('ASSIGN_SLOT', {
            taskId: task.id,
            taskName: task.name,
            startedAt: now,
            endsAt
        });

        const adjNote = resolved.reason ? ` [${resolved.reason}]` : '';
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Started ${task.name} in a slot (${duration} min → ${formatHhmm(endsAt)})${adjNote}`,
            timeLabel: formatHhmm(now)
        });
    },

    /** Pull FIFO waiting tasks into free slots (auto-assign). */
    drainQueue(currentTime) {
        const now = resolveExecutionTime(currentTime);
        let guard = GameConfig.slots.count + 2;
        while (guard-- > 0 && this.hasFreeSlot()) {
            const queue = gameState.getStateSlice('slotQueue') || [];
            if (!queue.length) break;
            const next = queue[0];
            const task = gameState.getStateSlice('tasks').get(next.taskId)
                || { id: next.taskId, name: next.taskName, duration: 10, patientId: next.patientId };

            // Skip if already running or completed
            if (this.findSlotForTask(next.taskId)) {
                gameState.dispatch('DEQUEUE_SLOT_TASK', { taskId: next.taskId });
                continue;
            }
            if (task.status === GameConfig.tasks.statuses.COMPLETED) {
                gameState.dispatch('DEQUEUE_SLOT_TASK', { taskId: next.taskId });
                continue;
            }

            gameState.dispatch('DEQUEUE_SLOT_TASK', { taskId: next.taskId });
            this.assignTaskNow(task, now);
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Auto-assigned queued ${task.name || next.taskId}`,
                timeLabel: formatHhmm(now)
            });
        }
    },

    /**
     * After booster freeze: finish anything due on the virtual clock, then rewrite
     * remaining busy slots onto the frozen display clock so resume stays consistent.
     */
    settleAfterFreeze() {
        const freeze = gameState.getStateSlice('boosterFreeze');
        if (!freeze) return;
        const effective = freezeExecutionTime() ?? resolveExecutionTime();
        this.processSlots(effective);

        const display = gameState.getStateSlice('currentTime') ?? freeze.baseTime;
        const displayMins = hhmmToMinutes(display);
        const effectiveMins = hhmmToMinutes(effective);
        const slots = gameState.getStateSlice('slots') || [];

        slots.forEach((slot) => {
            if (!slot.taskId || slot.startedAt == null || slot.endsAt == null) return;
            const endMins = hhmmToMinutes(slot.endsAt);
            const startMins = hhmmToMinutes(slot.startedAt);
            const duration = Math.max(1, endMins - startMins);
            const remaining = Math.max(0, endMins - effectiveMins);
            if (remaining <= 0) return;
            // Remaining window on the frozen display clock (avoid startedAt before display).
            const newEnds = minutesToHhmm(displayMins + remaining);
            const progress = Math.round(((duration - remaining) / duration) * 100);
            gameState.dispatch('UPDATE_SLOT_TIMING', {
                slotId: slot.id,
                startedAt: display,
                endsAt: newEnds,
                progress
            });
        });
    },

    processSlots(currentTime) {
        const slots = gameState.getStateSlice('slots') || [];
        const nowMins = hhmmToMinutes(currentTime);
        const finished = [];

        slots.forEach((slot) => {
            if (!slot.taskId || slot.startedAt == null || slot.endsAt == null) return;

            const startMins = hhmmToMinutes(slot.startedAt);
            const endMins = hhmmToMinutes(slot.endsAt);
            const span = Math.max(1, endMins - startMins);
            const elapsed = Math.max(0, nowMins - startMins);
            let progress = Math.round(Math.max(0, Math.min(100, (elapsed / span) * 100)));
            const prior = Math.round(slot.progress || 0);
            // After freeze settle, keep earned progress until the remaining window catches up.
            if (progress < prior && nowMins < endMins) {
                progress = prior;
            }

            if (progress !== prior) {
                gameState.dispatch('UPDATE_SLOT_PROGRESS', {
                    slotId: slot.id,
                    progress
                });
            }

            if (nowMins >= endMins) {
                finished.push({ slotId: slot.id, taskId: slot.taskId, taskName: slot.taskName });
            }
        });

        finished.forEach((item) => {
            const finishedTask = gameState.getStateSlice('tasks')?.get(item.taskId);
            if (finishedTask?.taskClass) {
                setLastReleasedClass(finishedTask.taskClass);
            }
            gameState.dispatch('RELEASE_SLOT', { slotId: item.slotId, taskId: item.taskId });
            taskSystem.completeTask(item.taskId);
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Finished ${item.taskName || 'slot task'}`,
                timeLabel: formatHhmm(currentTime)
            });
        });

        if (finished.length) {
            this.drainQueue(currentTime);
        }
    }
};

export default SlotSystem;
export { formatHhmm, hhmmToMinutes, minutesToHhmm };
