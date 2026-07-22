/**
 * Task class interactions (E3.M4) — batch same-class speedup / context-switch penalty.
 * Adjusts slot duration only; does not change authored task.duration on the task record.
 */
import { GameConfig } from './game-config.js';

let lastReleasedClass = null;

export function getLastReleasedClass() {
    return lastReleasedClass;
}

export function setLastReleasedClass(taskClass) {
    lastReleasedClass = taskClass ? String(taskClass).toLowerCase() : null;
}

export function resetClassInteractions() {
    lastReleasedClass = null;
}

/**
 * @returns {{ duration: number, adjustment: number, reason: string|null }}
 */
export function resolveEffectiveDuration(task, previousClass = lastReleasedClass) {
    const base = Math.max(1, Number(task?.duration) || 1);
    const rules = GameConfig.taskClassInteractions || {};
    if (rules.enabled === false) {
        return { duration: base, adjustment: 0, reason: null };
    }

    const nextClass = String(task?.taskClass || GameConfig.tasks.classes.ROUTINE).toLowerCase();
    if (!previousClass) {
        return { duration: base, adjustment: 0, reason: null };
    }

    if (previousClass === nextClass) {
        const delta = Number(rules.sameClassDeltaMins);
        const adj = Number.isFinite(delta) ? delta : -2;
        const duration = Math.max(1, base + adj);
        return {
            duration,
            adjustment: duration - base,
            reason: adj !== 0 ? `batch ${nextClass} (${adj} min)` : null
        };
    }

    const delta = Number(rules.contextSwitchDeltaMins);
    const adj = Number.isFinite(delta) ? delta : 3;
    const duration = Math.max(1, base + adj);
    return {
        duration,
        adjustment: duration - base,
        reason: adj !== 0 ? `context-switch ${previousClass}→${nextClass} (+${adj} min)` : null
    };
}

const TaskClassInteractions = {
    getLastReleasedClass,
    setLastReleasedClass,
    resetClassInteractions,
    resolveEffectiveDuration,
    init() {
        resetClassInteractions();
    }
};

export default TaskClassInteractions;
