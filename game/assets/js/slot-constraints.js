/**
 * Declarative queue-slot concurrency constraints.
 *
 * Rule types (GameConfig.slotConstraints.rules):
 * - mutexSimilar — only one matching task may occupy a busy slot at a time
 * - requiresEmptySlots — may start only when all slots are empty; exclusive:true
 *   also blocks other starts while active and marks remaining slots disabled
 * - blocksWith — may not start while any busy-slot task matches blocksWhen
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

function cfg() {
    return GameConfig.slotConstraints || {};
}

function rules() {
    const list = cfg().rules;
    return Array.isArray(list) ? list : [];
}

export function taskKind(task) {
    return String(task?.metadata?.kind || '').toLowerCase();
}

export function taskTypeKey(task) {
    return String(task?.type || '').toLowerCase();
}

/** Stable key used by mutexSimilar (kind → similarityKey → type). */
export function similarityKey(task) {
    const kind = taskKind(task);
    if (kind) return `kind:${kind}`;
    const sim = String(task?.metadata?.similarityKey || '').toLowerCase();
    if (sim) return `sim:${sim}`;
    const type = taskTypeKey(task);
    return type ? `type:${type}` : '';
}

function matchSpec(task, spec) {
    if (!task || !spec || typeof spec !== 'object') return false;
    if (spec.kind != null && taskKind(task) !== String(spec.kind).toLowerCase()) return false;
    if (spec.type != null && taskTypeKey(task) !== String(spec.type).toLowerCase()) return false;
    if (spec.similarityKey != null) {
        const want = String(spec.similarityKey).toLowerCase();
        const have = String(task?.metadata?.similarityKey || '').toLowerCase();
        if (have !== want) return false;
    }
    return true;
}

/** Tasks currently occupying the 3 queue slots (in progress). */
export function getBusySlotTasks() {
    const slots = gameState.getStateSlice('slots') || [];
    const tasks = gameState.getStateSlice('tasks');
    return slots
        .filter((s) => s?.taskId)
        .map((s) => tasks?.get(s.taskId) || {
            id: s.taskId,
            name: s.taskName,
            metadata: {}
        });
}

export function busySlotCount() {
    return (gameState.getStateSlice('slots') || []).filter((s) => s?.taskId).length;
}

export function allSlotsEmpty() {
    return busySlotCount() === 0;
}

function ruleAppliesToTask(rule, task) {
    if (!rule?.type || !task) return false;
    if (rule.match) return matchSpec(task, rule.match);
    return false;
}

/**
 * @returns {{ ok: boolean, reason?: string, ruleId?: string, message?: string }}
 */
export function canEnterSlot(task, options = {}) {
    if (cfg().enabled === false) return { ok: true };
    if (!task?.id) return { ok: false, reason: 'missing-task', message: 'Missing task' };

    const busy = getBusySlotTasks().filter((t) => t.id !== task.id);
    const ignoreExclusive = options.ignoreExclusive === true;

    for (const rule of rules()) {
        if (!ruleAppliesToTask(rule, task)) continue;
        const type = String(rule.type || '').toLowerCase();

        if (type === 'mutexsimilar') {
            const key = similarityKey(task);
            if (!key) continue;
            const conflict = busy.find((other) => similarityKey(other) === key);
            if (conflict) {
                return {
                    ok: false,
                    reason: 'mutex-similar',
                    ruleId: rule.id,
                    message: rule.message
                        || `A similar task is already in a queue slot (${conflict.name || conflict.id})`
                };
            }
        }

        if (type === 'requiresemptyslots') {
            const occupyingSelf = (gameState.getStateSlice('slots') || [])
                .some((s) => s.taskId === task.id);
            if (!occupyingSelf && !allSlotsEmpty()) {
                return {
                    ok: false,
                    reason: 'requires-empty-slots',
                    ruleId: rule.id,
                    message: rule.message || 'All queue slots must be empty before starting this task'
                };
            }
        }

        if (type === 'blockswith') {
            const when = rule.blocksWhen || {};
            const conflict = busy.find((other) => matchSpec(other, when));
            if (conflict) {
                return {
                    ok: false,
                    reason: 'blocks-with',
                    ruleId: rule.id,
                    message: rule.message
                        || `Blocked by ${conflict.name || conflict.id} in a queue slot`
                };
            }
        }
    }

    // Exclusive occupancy: while an exclusive task is busy, block other starts
    if (!ignoreExclusive) {
        const exclusive = findActiveExclusive(busy);
        if (exclusive && exclusive.id !== task.id) {
            return {
                ok: false,
                reason: 'exclusive-active',
                ruleId: exclusive.ruleId,
                message: exclusive.message
                    || `${exclusive.name || 'A focused task'} is occupying the queue — finish it first`
            };
        }
    }

    return { ok: true };
}

function findActiveExclusive(busyTasks = getBusySlotTasks()) {
    for (const busy of busyTasks) {
        for (const rule of rules()) {
            if (String(rule.type || '').toLowerCase() !== 'requiresemptyslots') continue;
            if (rule.exclusive === false) continue;
            if (!ruleAppliesToTask(rule, busy)) continue;
            return {
                id: busy.id,
                name: busy.name,
                ruleId: rule.id,
                message: rule.exclusiveMessage
                    || rule.message
                    || `${busy.name || 'Task'} requires sole use of the queue slots`
            };
        }
    }
    return null;
}

/** True when an exclusive (requiresEmptySlots + exclusive) task occupies a slot. */
export function isExclusiveOccupancyActive() {
    if (cfg().enabled === false) return false;
    return findActiveExclusive() != null;
}

export function getExclusiveOccupancy() {
    if (cfg().enabled === false) return null;
    return findActiveExclusive();
}

/**
 * UI helper: empty slots are disabled while exclusive occupancy is active.
 * @returns {'empty'|'busy'|'disabled'}
 */
export function slotDisplayState(slot) {
    if (slot?.taskId) return 'busy';
    if (isExclusiveOccupancyActive()) return 'disabled';
    return 'empty';
}

const SlotConstraints = {
    canEnterSlot,
    getBusySlotTasks,
    allSlotsEmpty,
    isExclusiveOccupancyActive,
    getExclusiveOccupancy,
    slotDisplayState,
    similarityKey,
    taskKind,
    matchSpec
};

export default SlotConstraints;
export { matchSpec };
