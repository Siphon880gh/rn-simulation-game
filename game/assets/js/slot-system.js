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

const SlotSystem = {
    init() {
        resetClassInteractions();
        renderSlots(gameState.getStateSlice('slots') || []);
        renderQueue(gameState.getStateSlice('slotQueue') || []);
        gameState.subscribe('slots', (slots) => {
            renderSlots(slots || []);
        });
        gameState.subscribe('slotQueue', (queue) => {
            renderQueue(queue || []);
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

    /**
     * Start task in a free slot, or enqueue FIFO when full.
     * @returns {{ ok: boolean, queued?: boolean, reason?: string }}
     */
    requestSlot(task, currentTime) {
        if (!task?.id) return { ok: false, reason: 'missing-task' };
        if (this.findSlotForTask(task.id)) return { ok: true };
        if (this.isQueued(task.id)) return { ok: true, queued: true };

        if (this.hasFreeSlot()) {
            this.assignTaskNow(task, currentTime);
            return { ok: true };
        }

        gameState.dispatch('ENQUEUE_SLOT_TASK', {
            taskId: task.id,
            taskName: task.name,
            patientId: task.patientId || null
        });
        gameState.dispatch('APPEND_SHIFT_LOG', {
            message: `Queued ${task.name} (slots full)`,
            timeLabel: formatHhmm(currentTime ?? gameState.getStateSlice('currentTime'))
        });
        return { ok: true, queued: true };
    },

    /** @deprecated use requestSlot — kept for callers that expect boolean assign-only */
    tryAssignTask(task, currentTime) {
        if (!task?.id) return false;
        if (this.findSlotForTask(task.id)) return true;
        if (!this.hasFreeSlot()) return false;
        this.assignTaskNow(task, currentTime);
        return true;
    },

    assignTaskNow(task, currentTime) {
        const now = currentTime ?? gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
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
            this.assignTaskNow(task, currentTime);
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: `Auto-assigned queued ${task.name || next.taskId}`,
                timeLabel: formatHhmm(currentTime ?? gameState.getStateSlice('currentTime'))
            });
        }
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
            const elapsed = nowMins - startMins;
            const progress = Math.round(Math.max(0, Math.min(100, (elapsed / span) * 100)));

            if (progress !== Math.round(slot.progress || 0)) {
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
