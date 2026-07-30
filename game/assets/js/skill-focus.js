/**
 * Skill library focus — URL ?skill=<id> picks one mini-game from the skill’s games[].
 * Catalog: game/events/skills/library.json
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import PatientsModule from './patients.js';
import {
  buildTestChallengeTask,
  isChallengeTestSpawnKind,
  isCodeBlueTestSpawn
} from './challenges/test-spawn.js';

async function getChallengeGate() {
  return import('./challenges/challenge-gate.js');
}

function libraryUrl() {
  return GameConfig.skillLibrary?.url || 'events/skills/library.json';
}

function skillParamName() {
  return GameConfig.urlParams?.skill || 'skill';
}

export async function loadSkillLibrary() {
  const url = libraryUrl();
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      console.warn(`Skill library: could not load ${url} (${response.status})`);
      return { version: 1, skills: [] };
    }
    const data = await response.json();
    return data && typeof data === 'object' ? data : { version: 1, skills: [] };
  } catch (err) {
    console.warn('Skill library: failed to load', err);
    return { version: 1, skills: [] };
  }
}

export function findSkillEntry(library, skillId) {
  const id = String(skillId || '').trim().toLowerCase();
  if (!id) return null;
  const skills = Array.isArray(library?.skills) ? library.skills : [];
  return skills.find((s) => String(s.id || '').toLowerCase() === id) || null;
}

/** Pick one playable game id from the skill’s games list. */
export function pickGameForSkill(skillEntry, random = Math.random) {
  const games = Array.isArray(skillEntry?.games)
    ? skillEntry.games.filter((g) => typeof g === 'string' && g.trim())
    : [];
  if (!games.length) return null;
  const idx = Math.min(games.length - 1, Math.floor(random() * games.length));
  return games[idx];
}

/** Prefer a census patient tagged with this library skill id. */
function resolvePatientId(skillId) {
  const patients = gameState.getStateSlice('patients');
  if (!patients || typeof patients.keys !== 'function') return null;

  const want = String(skillId || '').trim().toLowerCase();
  if (want) {
    const configs = PatientsModule.getPatientConfigs?.() || {};
    const tagged = Object.values(configs)
      .filter((c) => Array.isArray(c?.skills) && c.skills.some((s) => String(s).toLowerCase() === want))
      .map((c) => c.id);
    for (const id of tagged) {
      if (patients.has(id)) return id;
    }
    // Also honor skills stamped on live patient records
    for (const id of patients.keys()) {
      const live = patients.get(id);
      const skills = live?.skills || live?.config?.skills;
      if (Array.isArray(skills) && skills.some((s) => String(s).toLowerCase() === want)) {
        return id;
      }
    }
  }

  const activeId = gameState.getStateSlice('activePatientId');
  if (activeId && patients.has(activeId)) return activeId;
  return [...patients.keys()][0] || null;
}

function statusMessage(text) {
  const el = document.querySelector(GameConfig.selectors.statusMessage);
  if (el) el.textContent = text;
}

/** Wait until the patient host is mounted and painted (not opacity:0). */
function waitForPatientPanel(patientId, timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!patientId) {
      resolve(false);
      return;
    }
    const started = performance.now();
    const tick = () => {
      const host = document.querySelector(
        `.patient-panel-host[data-patient-id="${patientId}"]`
      );
      const ready = Boolean(
        host
        && host.classList.contains('is-active')
        && getComputedStyle(host).opacity !== '0'
        && host.getBoundingClientRect().height > 0
      );
      if (ready) {
        resolve(true);
        return;
      }
      if (performance.now() - started > timeoutMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * Focus the skill’s patient in the main pane.
 * Must use showPatientPanel — SET_ACTIVE_PATIENT is a no-op when the id is
 * already active, so Global / opacity:0 hosts would stay blank.
 */
function focusSkillPatient(patientId) {
  if (!patientId) return;
  if (typeof PatientsModule.showPatientPanel === 'function') {
    PatientsModule.showPatientPanel(patientId, { logMessage: false });
    return;
  }
  gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
  PatientsModule.applyPanelVisibility?.();
}

async function launchGame(kind, skillEntry) {
  const skillLabel = skillEntry?.label || skillEntry?.id || 'Skill';
  const patientId = resolvePatientId(skillEntry?.id);
  focusSkillPatient(patientId);
  await waitForPatientPanel(patientId);
  await nextPaint();

  if (isCodeBlueTestSpawn(kind)) {
    const { runCodeBlueChallenge } = await getChallengeGate();
    statusMessage(`Skill focus: ${skillLabel} → Code Blue`);
    await runCodeBlueChallenge({ patientId });
    return;
  }

  if (!isChallengeTestSpawnKind(kind)) {
    statusMessage(`Skill focus: no playable game for “${kind}”`);
    return;
  }

  const task = buildTestChallengeTask(kind, patientId, {
    skillId: skillEntry?.id,
    skillLabel
  });
  if (!task) {
    statusMessage(`Skill focus: could not build game “${kind}”`);
    return;
  }

  gameState.dispatch('APPEND_SHIFT_LOG', {
    message: `Skill focus: ${skillLabel} → ${task.name}`,
    timeLabel: String(gameState.getStateSlice('currentTime') ?? '')
  });
  statusMessage(`Skill focus: ${skillLabel}`);

  const { runChallengeGate } = await getChallengeGate();
  await runChallengeGate(task);
}

/**
 * If URL has skill=, load library, pick one game, open challenge after patients exist.
 */
export async function initSkillFocus() {
  const params = new URLSearchParams(window.location.search);
  const skillId = params.get(skillParamName());
  if (!skillId) return null;

  const library = await loadSkillLibrary();
  const entry = findSkillEntry(library, skillId);
  if (!entry) {
    statusMessage(`Unknown skill “${skillId}”`);
    return null;
  }

  const gameKind = pickGameForSkill(entry);
  if (!gameKind) {
    statusMessage(`Skill “${entry.label || skillId}” has no playable games yet`);
    return { skillId, gameKind: null };
  }

  gameState.dispatch('SET_SKILL_FOCUS', {
    skillId: entry.id,
    label: entry.label,
    gameKind
  });

  const delay = Number(GameConfig.skillLibrary?.launchDelayMs);
  const waitMs = Number.isFinite(delay) ? Math.max(0, delay) : 900;

  const tryLaunch = () => {
    if (!resolvePatientId(entry.id)) {
      setTimeout(tryLaunch, 200);
      return;
    }
    launchGame(gameKind, entry).catch((err) => {
      console.warn('Skill focus launch failed', err);
    });
  };

  setTimeout(tryLaunch, waitMs);
  return { skillId: entry.id, gameKind };
}

const SkillFocusModule = {
  init: initSkillFocus,
  loadSkillLibrary,
  findSkillEntry,
  pickGameForSkill
};

export default SkillFocusModule;
