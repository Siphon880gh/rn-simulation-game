/**
 * Challenge-level boosters — earn via multi-question quizzes; spend near the clock.
 * Freeze (~15 game minutes) or finish every busy queue slot (animated).
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

function formatHhmm(hhmm) {
  if (hhmm == null) return '—';
  const n = Number(hhmm);
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function statusMessage(text) {
  const el = document.querySelector(GameConfig.selectors.statusMessage);
  if (el) el.textContent = text;
}

function getCount() {
  return Math.max(0, Number(gameState.getStateSlice('boosters')) || 0);
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
  if (freezeBtn) {
    freezeBtn.disabled = n <= 0 || freezing || spending;
  }
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
  const mins = Number(freeze.gameMinutes) || cfg().freezeGameMinutes || 15;
  statusEl.textContent = `Frozen ${mins}m · ${leftSec}s`;
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

function endFreeze({ silent = false } = {}) {
  clearFreezeTimers();
  gameState.dispatch('SET_BOOSTER_FREEZE', { active: false });
  gameState.dispatch('SET_PAUSE', { paused: false, source: BOOSTER_PAUSE() });
  paintFreezeStatus();
  paintCount();
  if (!silent) {
    statusMessage('Booster freeze ended — clock running');
    gameState.dispatch('APPEND_SHIFT_LOG', {
      message: 'Booster freeze ended',
      timeLabel: formatHhmm(gameState.getStateSlice('currentTime'))
    });
  }
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
  if (gameState.getStateSlice('boosterFreeze')) {
    statusMessage('Already using a booster freeze');
    return;
  }
  if (!trySpend(1)) {
    statusMessage('No boosters left');
    paintCount();
    return;
  }

  const { gameMins, realMs } = freezeRealMs(timerModule);
  const endsAtMs = Date.now() + realMs;
  gameState.dispatch('SET_BOOSTER_FREEZE', {
    active: true,
    endsAtMs,
    gameMinutes: gameMins
  });
  gameState.dispatch('SET_PAUSE', { paused: true, source: BOOSTER_PAUSE() });
  gameState.dispatch('APPEND_SHIFT_LOG', {
    message: `Booster: froze clock for ${gameMins} game minutes`,
    timeLabel: formatHhmm(gameState.getStateSlice('currentTime'))
  });
  statusMessage(`Booster freeze — ${gameMins} game minutes`);
  paintCount();
  paintFreezeStatus();

  clearFreezeTimers();
  freezeTickId = setInterval(paintFreezeStatus, 250);
  freezeTimerId = setTimeout(() => endFreeze(), realMs);
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
  const currentTime = gameState.getStateSlice('currentTime');
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
      const left = freeze.endsAtMs - Date.now();
      clearFreezeTimers();
      freezeTickId = setInterval(paintFreezeStatus, 250);
      freezeTimerId = setTimeout(() => endFreeze(), left);
      gameState.dispatch('SET_PAUSE', { paused: true, source: BOOSTER_PAUSE() });
    }
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
