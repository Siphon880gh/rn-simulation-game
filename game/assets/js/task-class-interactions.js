/**
 * Task class interactions (E3.M4) — batch same-class speedup / context-switch penalty.
 * Adjusts slot duration only; does not change authored task.duration on the task record.
 * E13: optional metadata.assistFactor (e.g. 0.5) after class math.
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
    let duration = base;
    const reasons = [];
    const rules = GameConfig.taskClassInteractions || {};

    if (rules.enabled !== false) {
        const nextClass = String(task?.taskClass || GameConfig.tasks.classes.ROUTINE).toLowerCase();
        if (previousClass) {
            if (previousClass === nextClass) {
                const delta = Number(rules.sameClassDeltaMins);
                const adj = Number.isFinite(delta) ? delta : -2;
                duration = Math.max(1, duration + adj);
                if (adj !== 0) reasons.push(`batch ${nextClass} (${adj} min)`);
            } else {
                const delta = Number(rules.contextSwitchDeltaMins);
                const adj = Number.isFinite(delta) ? delta : 3;
                duration = Math.max(1, duration + adj);
                if (adj !== 0) reasons.push(`context-switch ${previousClass}→${nextClass} (+${adj} min)`);
            }
        }
    }

    const assist = Number(task?.metadata?.assistFactor);
    if (Number.isFinite(assist) && assist > 0 && assist < 1) {
        duration = Math.max(1, Math.round(duration * assist));
        const who = task.metadata?.assistedByLabel || 'assist';
        reasons.push(`${who} (${Math.round(assist * 100)}% time)`);
    }

    return {
        duration,
        adjustment: duration - base,
        reason: reasons.length ? reasons.join('; ') : null
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
