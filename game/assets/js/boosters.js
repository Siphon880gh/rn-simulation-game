/**
 * Challenge-level boosters — earn via multi-question quizzes; spend near the clock.
 * Freeze (~15 game minutes, stackable) or finish every busy queue slot (animated).
 * During freeze: shift clock/events pause; queue slots keep running; new tasks can be chosen.
 * Resume during freeze asks for confirmation; unused stacked time (>15m) reclaims boosters.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { setLastReleasedClass } from './task-class-interactions.js';

const BOOSTER_PAUSE = () => GameConfig.timer.pauseSources.BOOSTER;
const cfg = () => GameConfig.boosters || {};
const sel = () => cfg().selectors || {};

let freezeTimerId = null;
let freezeTickId = null;
let spending = false;
/** @type {{ processSlots?: Function, settleAfterFreeze?: Function, drainQueue?: Function } | null} */
let slotsRef = null;

function formatHhmm(hhmm) {
  if (hhmm == null) return '—';
  const n = Number(hhmm);
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

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

function statusMessage(text) {
  const el = document.querySelector(GameConfig.selectors.statusMessage);
  if (el) el.textContent = text;
}

function getCount() {
  return Math.max(0, Number(gameState.getStateSlice('boosters')) || 0);
}

function freezeVirtualMinutes(freeze) {
  if (!freeze?.startedAtMs || !freeze?.endsAtMs) return 0;
  const span = Math.max(1, Number(freeze.endsAtMs) - Number(freeze.startedAtMs));
  const elapsed = Math.max(0, Math.min(span, Date.now() - Number(freeze.startedAtMs)));
  return (elapsed / span) * (Math.max(0, Number(freeze.gameMinutes) || 0));
}

function freezeExecutionTime(freeze = gameState.getStateSlice('boosterFreeze')) {
  if (!freeze || freeze.baseTime == null || !freeze.startedAtMs || !freeze.endsAtMs) {
    return null;
  }
  return minutesToHhmm(hhmmToMinutes(freeze.baseTime) + Math.floor(freezeVirtualMinutes(freeze)));
}

function remainingFreezeGameMinutes(freeze = gameState.getStateSlice('boosterFreeze')) {
  if (!freeze?.endsAtMs || freeze.endsAtMs <= Date.now()) return 0;
  return Math.max(0, Number(freeze.gameMinutes) - freezeVirtualMinutes(freeze));
}

/** Full unused booster units when remaining freeze is greater than one unit (>15m). */
function reclaimBoostersForRemaining(remainingMins) {
  const unit = Number(cfg().freezeGameMinutes) || 15;
  if (!(remainingMins > unit)) return 0;
  return Math.floor(remainingMins / unit);
}

function isBoosterFreezeActive() {
  const freeze = gameState.getStateSlice('boosterFreeze');
  return Boolean(freeze?.endsAtMs && freeze.endsAtMs > Date.now());
}

function paintFreezeButton(freezeBtn, freezing, n) {
  if (!freezeBtn) return;
  const unit = Number(cfg().freezeGameMinutes) || 15;
  freezeBtn.disabled = n <= 0 || spending;
  freezeBtn.textContent = freezing
    ? `Stack freeze +${unit} min`
    : `Freeze timer ${unit} min`;
}

function paintCount() {
  const countEl = document.querySelector(sel().count || '#shell-boosters-count');
  const root = document.querySelector(sel().root || GameConfig.selectors.boosters || '#shell-boosters');
  const n = getCount();
  if (countEl) countEl.textContent = String(n);
  if (root) {
    root.dataset.count = String(n);
    root.classList.toggle('shell-boosters--empty', n <= 0);
    root.classList.toggle('shell-boosters--ready', n > 0);
  }
  const freezeBtn = document.querySelector(sel().freezeBtn);
  const slotsBtn = document.querySelector(sel().slotsBtn);
  const freezing = Boolean(gameState.getStateSlice('boosterFreeze'));
  paintFreezeButton(freezeBtn, freezing, n);
  if (slotsBtn) {
    slotsBtn.disabled = n <= 0 || spending;
  }
}

function paintFreezeStatus() {
  const statusEl = document.querySelector(sel().status);
  const root = document.querySelector(sel().root || GameConfig.selectors.boosters);
  const freeze = gameState.getStateSlice('boosterFreeze');
  if (!statusEl) return;
  if (!freeze?.endsAtMs) {
    statusEl.textContent = '';
    statusEl.classList.add('hidden');
    root?.classList.remove('shell-boosters--freezing');
    return;
  }
  const leftMs = Math.max(0, freeze.endsAtMs - Date.now());
  const leftSec = Math.ceil(leftMs / 1000);
  const minsLeft = Math.max(0, Math.ceil(Number(freeze.gameMinutes) - freezeVirtualMinutes(freeze)));
  statusEl.textContent = `Frozen ~${minsLeft}m · ${leftSec}s (slots keep running)`;
  statusEl.classList.remove('hidden');
  root?.classList.add('shell-boosters--freezing');
}

function clearFreezeTimers() {
  if (freezeTimerId != null) {
    clearTimeout(freezeTimerId);
    freezeTimerId = null;
  }
  if (freezeTickId != null) {
    clearInterval(freezeTickId);
    freezeTickId = null;
  }
}

function tickFreezeSlots() {
  const effective = freezeExecutionTime();
  if (effective == null) return;
  slotsRef?.processSlots?.(effective);
  paintFreezeStatus();
}

function scheduleFreezeEnd() {
  const freeze = gameState.getStateSlice('boosterFreeze');
  if (!freeze?.endsAtMs) return;
  clearFreezeTimers();
  freezeTickId = setInterval(tickFreezeSlots, 250);
  const left = Math.max(0, freeze.endsAtMs - Date.now());
  freezeTimerId = setTimeout(() => endFreeze(), left);
  tickFreezeSlots();
}

function endFreeze({ silent = false, reclaim = 0 } = {}) {
  slotsRef?.settleAfterFreeze?.();
  clearFreezeTimers();
  gameState.dispatch('SET_BOOSTER_FREEZE', { active: false });
  gameState.dispatch('SET_PAUSE', { paused: false, source: BOOSTER_PAUSE() });
  const giveBack = Math.max(0, Math.floor(Number(reclaim) || 0));
  if (giveBack > 0) {
    gameState.dispatch('ADD_BOOSTERS', { count: giveBack });
  }
  paintFreezeStatus();
  paintCount();
  if (!silent) {
    statusMessage(
      giveBack > 0
        ? `Booster freeze ended — reclaimed ${giveBack} booster${giveBack === 1 ? '' : 's'}`
        : 'Booster freeze ended — clock running'
    );
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: giveBack > 0
        ? `Booster freeze ended early (reclaimed ${giveBack})`
        : 'Booster freeze ended',
      timeLabel: formatHhmm(gameState.getStateSlice('currentTime'))
    });
  }
}

async function confirmEarlyResumeFreeze() {
  const freeze = gameState.getStateSlice('boosterFreeze');
  if (!freeze?.endsAtMs || freeze.endsAtMs <= Date.now()) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const remaining = remainingFreezeGameMinutes(freeze);
  const reclaim = reclaimBoostersForRemaining(remaining);
  const minsLabel = Math.max(1, Math.ceil(remaining));
  const unit = Number(cfg().freezeGameMinutes) || 15;

  let body = `<p class="text-sm text-gray-700">End the booster freeze and resume the shift clock?</p>
    <p class="text-sm text-gray-600 mt-2">About <strong>${minsLabel} game minutes</strong> of freeze remain. Queue slots will keep their progress.</p>`;
  if (reclaim > 0) {
    body += `<p class="text-sm text-amber-800 mt-3 font-medium">You will reclaim <strong>${reclaim}</strong> booster${reclaim === 1 ? '' : 's'} (unused freeze beyond ${unit} min).</p>`;
  }

  const { default: ModalModule } = await import('./modal.js');

  window.boosterFreezeResumeYes = () => {
    ModalModule.closeModal();
    endFreeze({ reclaim });
    delete window.boosterFreezeResumeYes;
    delete window.boosterFreezeResumeNo;
  };
  window.boosterFreezeResumeNo = () => {
    ModalModule.closeModal();
    delete window.boosterFreezeResumeYes;
    delete window.boosterFreezeResumeNo;
  };

  ModalModule.openModal({
    title: 'Resume during freeze?',
    content: `<div class="space-y-1 text-left">${body}</div>`,
    footer: `
      <div class="flex flex-wrap gap-2 justify-end">
        <button type="button" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onclick="window.boosterFreezeResumeNo && window.boosterFreezeResumeNo()">Keep frozen</button>
        <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onclick="window.boosterFreezeResumeYes && window.boosterFreezeResumeYes()">Resume shift</button>
      </div>
    `,
    overlay: true,
    persistent: false
  });
}

function freezeRealMs(timerModule) {
  const gameMins = Number(cfg().freezeGameMinutes) || 15;
  const speed = Number(timerModule?.getState?.()?.speedFactor) || Number(GameConfig.timer.defaultSpeedFactor) || 1;
  const raw = Math.round((gameMins * 60 * 1000) / Math.max(1, speed));
  const floor = Number(cfg().freezeMinRealMs) || 8000;
  return { gameMins, realMs: Math.max(floor, raw) };
}

function trySpend(count = 1) {
  const have = getCount();
  if (have < count) return false;
  gameState.dispatch('SPEND_BOOSTER', { count });
  return getCount() === have - count;
}

function useFreeze(timerModule) {
  if (spending) return;
  if (!trySpend(1)) {
    statusMessage('No boosters left');
    paintCount();
    return;
  }

  const { gameMins, realMs } = freezeRealMs(timerModule);
  const existing = gameState.getStateSlice('boosterFreeze');
  const nowMs = Date.now();

  if (existing?.endsAtMs && existing.endsAtMs > nowMs && existing.baseTime != null) {
    const virtualNow = freezeVirtualMinutes(existing);
    const remainingReal = Math.max(0, existing.endsAtMs - nowMs);
    const remainingVirtual = Math.max(0, Number(existing.gameMinutes) - virtualNow);
    const totalMins = remainingVirtual + gameMins;
    gameState.dispatch('SET_BOOSTER_FREEZE', {
      active: true,
      startedAtMs: nowMs,
      endsAtMs: nowMs + remainingReal + realMs,
      gameMinutes: totalMins,
      baseTime: minutesToHhmm(hhmmToMinutes(existing.baseTime) + Math.floor(virtualNow))
    });
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: `Booster: stacked +${gameMins} game minutes freeze (${Math.ceil(totalMins)}m total)`,
      timeLabel: formatHhmm(gameState.getStateSlice('currentTime'))
    });
    statusMessage(`Booster freeze stacked — +${gameMins}m (${Math.ceil(totalMins)}m total)`);
  } else {
    const baseTime = gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
    gameState.dispatch('SET_BOOSTER_FREEZE', {
      active: true,
      startedAtMs: nowMs,
      endsAtMs: nowMs + realMs,
      gameMinutes: gameMins,
      baseTime
    });
    gameState.dispatch('SET_PAUSE', { paused: true, source: BOOSTER_PAUSE() });
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: `Booster: froze clock for ${gameMins} game minutes (slots keep running)`,
      timeLabel: formatHhmm(baseTime)
    });
    statusMessage(`Booster freeze — ${gameMins} game minutes (slots keep running)`);
  }

  paintCount();
  paintFreezeStatus();
  scheduleFreezeEnd();
}

async function animateSlotComplete(slotEl) {
  if (!slotEl) return;
  const fill = slotEl.querySelector('.task-slot-progress-fill');
  slotEl.classList.add('task-slot--completing');
  if (fill) fill.style.width = '100%';
  const badge = document.createElement('span');
  badge.className = 'task-slot-done-badge';
  badge.textContent = 'Done';
  slotEl.appendChild(badge);
  const ms = Number(cfg().slotCompleteAnimMs) || 700;
  await new Promise((r) => setTimeout(r, ms));
}

async function useFinishSlots(slotSystem) {
  if (spending) return;
  const snapshot = (gameState.getStateSlice('slots') || []).filter((s) => s.taskId);
  if (!snapshot.length) {
    statusMessage('No tasks in queue slots to finish');
    return;
  }
  if (!trySpend(1)) {
    statusMessage('No boosters left');
    paintCount();
    return;
  }

  spending = true;
  paintCount();
  const currentTime = freezeExecutionTime() ?? gameState.getStateSlice('currentTime');
  const bar = document.querySelector(GameConfig.selectors.taskQueueBar);
  let finished = 0;

  try {
    for (const slot of snapshot) {
      const live = (gameState.getStateSlice('slots') || []).find((s) => s.id === slot.id);
      if (!live?.taskId || live.taskId !== slot.taskId) continue;
      const slotEl = bar?.querySelector(`.task-slot[data-slot-id="${slot.id}"]`);
      await animateSlotComplete(slotEl);
      const still = (gameState.getStateSlice('slots') || []).find((s) => s.id === slot.id);
      if (!still?.taskId || still.taskId !== slot.taskId) continue;
      const finishedTask = gameState.getStateSlice('tasks')?.get(slot.taskId);
      if (finishedTask?.taskClass) {
        setLastReleasedClass(finishedTask.taskClass);
      }
      gameState.dispatch('RELEASE_SLOT', { slotId: slot.id, taskId: slot.taskId });
      taskSystem.completeTask(slot.taskId);
      finished += 1;
      gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `Booster finished ${slot.taskName || 'slot task'}`,
        timeLabel: formatHhmm(currentTime)
      });
    }
    slotSystem?.drainQueue?.(currentTime);
    statusMessage(
      finished
        ? `Booster finished ${finished} slot task${finished === 1 ? '' : 's'}`
        : 'Booster: slot tasks already finished'
    );
  } finally {
    spending = false;
    paintCount();
  }
}

const BoostersModule = {
  init({ timer, slots } = {}) {
    slotsRef = slots || null;
    paintCount();
    paintFreezeStatus();

    gameState.subscribe('boosters', () => paintCount());
    gameState.subscribe('boosterFreeze', () => {
      paintFreezeStatus();
      paintCount();
    });

    const freezeBtn = document.querySelector(sel().freezeBtn);
    const slotsBtn = document.querySelector(sel().slotsBtn);
    freezeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      useFreeze(timer);
    });
    slotsBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      useFinishSlots(slots);
    });

    // If a freeze was mid-flight across hot reload, clear orphan pause source
    const freeze = gameState.getStateSlice('boosterFreeze');
    if (freeze?.endsAtMs && freeze.endsAtMs <= Date.now()) {
      endFreeze({ silent: true });
    } else if (freeze?.endsAtMs) {
      gameState.dispatch('SET_PAUSE', { paused: true, source: BOOSTER_PAUSE() });
      scheduleFreezeEnd();
    }
  },

  /**
   * Pause/Resume button hook. When a booster freeze is active, Resume asks for
   * confirmation (and may reclaim stacked boosters). Returns true if handled.
   */
  handlePauseButtonClick() {
    if (!isBoosterFreezeActive()) return false;
    void confirmEarlyResumeFreeze();
    return true;
  },

  /** Effective HHMM for slot work during an active freeze; null when not freezing. */
  getFreezeExecutionTime() {
    return freezeExecutionTime();
  },

  /** Award boosters after a multi-question challenge pass (N answers → N−1 boosters). */
  awardFromChallengeLevel(questionCount) {
    const n = Math.max(0, Math.floor(Number(questionCount) || 0));
    const earned = Math.max(0, n - 1);
    if (!earned) return 0;
    gameState.dispatch('ADD_BOOSTERS', { count: earned });
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: `Earned ${earned} booster${earned === 1 ? '' : 's'} (challenge level ${n})`,
      timeLabel: formatHhmm(gameState.getStateSlice('currentTime'))
    });
    statusMessage(
      earned === 1
        ? 'Earned 1 booster — open Boosters by the clock'
        : `Earned ${earned} boosters — open Boosters by the clock`
    );
    paintCount();
    return earned;
  }
};

export default BoostersModule;
