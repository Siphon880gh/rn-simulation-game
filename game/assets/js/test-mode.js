/**
 * Test mode — `config/test.json` `{ "enabled": true }` shows a brand Test
 * control that opens a modal to spawn incidents. No URL query.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { spawnCriticalLabNow } from './critical-labs.js';
import { presentSpawnedTask, spawnFromTemplate, weightedPick } from './dynamic-tasks.js';
import { spawnCallLightNow, spawnBedAlarmNow } from './nurse-alerts.js';
import {
    buildTestChallengeTask,
    isChallengeTestSpawnKind,
    isCodeBlueTestSpawn
} from './challenges/test-spawn.js';

/** Lazy — avoids loading modal.js (window globals) during Node AUTO checks. */
async function getModalModule() {
    const mod = await import('./modal.js');
    return mod.default;
}

/** Lazy — challenge-gate pulls modal/DOM; keep off Node AUTO import path. */
async function getChallengeGate() {
    return import('./challenge-gate.js');
}

let enabledFromJson = false;
let jsonLoaded = false;

function testCfg() {
    return GameConfig.testMode || {};
}

/** True after init when `config/test.json` has `"enabled": true`. */
export function isTestModeEnabled() {
    return jsonLoaded && enabledFromJson === true;
}

async function loadTestModeJson() {
    const url = testCfg().configUrl || '../config/test.json';
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            console.warn(`Test mode: could not load ${url} (${response.status})`);
            return { enabled: false };
        }
        const data = await response.json();
        return data && typeof data === 'object' ? data : { enabled: false };
    } catch (err) {
        console.warn('Test mode: failed to load config JSON', err);
        return { enabled: false };
    }
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function statusMessage(text) {
    const el = document.querySelector(GameConfig.selectors.statusMessage);
    if (el) el.textContent = text;
}

/** Prefer the open patient chart so Test spawns are visible/selectable immediately. */
function resolveTestPatientId() {
    const patients = gameState.getStateSlice('patients');
    const activeId = gameState.getStateSlice('activePatientId');
    if (activeId && patients?.has(activeId)) return activeId;
    if (!patients || typeof patients.keys !== 'function') return null;
    return [...patients.keys()][0] || null;
}

function patientLabel(patientId) {
    if (!patientId) return '';
    const p = gameState.getStateSlice('patients')?.get(patientId);
    return p?.name || patientId;
}

function finishTestTaskSpawn(task, label) {
    if (!task) return null;
    const live = presentSpawnedTask(task, { focusPatient: true }) || task;
    const who = patientLabel(live.patientId);
    statusMessage(who ? `${label} — ${who}` : label);
    return live;
}

function fireCriticalLab(labId) {
    const patientId = resolveTestPatientId();
    const task = spawnCriticalLabNow({
        labId: labId || undefined,
        patientId,
        focusPatient: true
    });
    if (!task) {
        statusMessage('Test: could not spawn critical lab (no patients?)');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: critical lab ${task.metadata?.labShort || labId || 'random'} — ${patientLabel(task.patientId)}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    finishTestTaskSpawn(task, `TEST: critical lab — ${task.name}`);
}

function fireDynamicUrgent() {
    const pack = gameState.getStateSlice('scenarioPack');
    const templates = (Array.isArray(pack?.dynamicTemplates) && pack.dynamicTemplates.length)
        ? pack.dynamicTemplates
        : (GameConfig.dynamicTasks?.templates || []);
    const template = weightedPick(templates);
    const now = gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
    if (!template) {
        statusMessage('Test: no dynamic templates available');
        return;
    }
    const task = spawnFromTemplate(template, now, {
        patientId: resolveTestPatientId(),
        focusPatient: true
    });
    if (!task) {
        statusMessage('Test: dynamic spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: dynamic ${task.name} — ${patientLabel(task.patientId)}`,
        timeLabel: formatHHMM(now)
    });
    finishTestTaskSpawn(task, `TEST: ${task.name}`);
}

function fireCallLight() {
    const task = spawnCallLightNow({
        templateId: 'water',
        patientId: resolveTestPatientId(),
        focusPatient: true
    });
    if (!task) {
        statusMessage('Test: call light spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: ${task.name} — ${patientLabel(task.patientId)}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    finishTestTaskSpawn(task, `TEST: ${task.name}`);
}

function fireBedAlarm() {
    const task = spawnBedAlarmNow({
        patientId: resolveTestPatientId(),
        focusPatient: true
    });
    if (!task) {
        statusMessage('Test: bed alarm spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: ${task.name} — ${patientLabel(task.patientId)}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    finishTestTaskSpawn(task, `TEST: ${task.name}`);
}

async function fireCodeBlue() {
    const patientId = resolveTestPatientId();
    if (!patientId) {
        statusMessage('Test: could not open Code Blue (no patients?)');
        return;
    }
    const now = gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
    gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: Code Blue — ${patientLabel(patientId)}`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`TEST: Code Blue — ${patientLabel(patientId)}`);
    const { runCodeBlueChallenge } = await getChallengeGate();
    await runCodeBlueChallenge({ patientId });
}

/** Open a Skills/Emergencies challenge from challenges/test-spawn.js */
async function fireChallengeSpawn(kind) {
    if (isCodeBlueTestSpawn(kind)) {
        await fireCodeBlue();
        return;
    }
    const patientId = resolveTestPatientId();
    if (patientId) {
        gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
    }
    const task = buildTestChallengeTask(kind, patientId);
    if (!task) {
        statusMessage(`Test: unknown challenge spawn “${kind}”`);
        return;
    }
    const now = gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart;
    const who = patientId ? ` — ${patientLabel(patientId)}` : '';
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: ${task.name}${who}`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`TEST: ${task.name}`);
    const { runChallengeGate } = await getChallengeGate();
    await runChallengeGate(task);
}

async function onIncidentSelect(kind, detail) {
    if (kind === 'critical-lab') {
        fireCriticalLab(detail?.labId || null);
        return;
    }
    if (kind === 'call-light') {
        fireCallLight();
        return;
    }
    if (kind === 'bed-alarm') {
        fireBedAlarm();
        return;
    }
    if (kind === 'dynamic-urgent') {
        fireDynamicUrgent();
        return;
    }
    if (isChallengeTestSpawnKind(kind)) {
        await fireChallengeSpawn(kind);
    }
}

function itemButton(kind, label, attrs = '') {
    return `
      <button type="button" class="shell-test-mode__item" data-kind="${escapeHtml(kind)}"${attrs}>
        ${escapeHtml(label)}
      </button>`;
}

function buildModalBody() {
    const incidents = testCfg().incidents || [];
    const labs = GameConfig.criticalLabs?.labs || [];
    /** @type {Map<string, string[]>} */
    const groups = new Map();

    const bucket = (group) => {
        const key = group || 'Other';
        if (!groups.has(key)) groups.set(key, []);
        return groups.get(key);
    };

    incidents.forEach((inc) => {
        const items = bucket(inc.group);
        if (inc.kind === 'critical-lab' && inc.expandLabs !== false) {
            labs.forEach((lab) => {
                items.push(itemButton(
                    'critical-lab',
                    `${lab.shortName} — ${lab.result || lab.fullName || ''}`,
                    ` data-lab-id="${escapeHtml(lab.id)}"`
                ));
            });
            items.push(itemButton('critical-lab', 'Random critical lab', ' data-lab-id=""'));
            return;
        }
        items.push(itemButton(inc.kind, inc.label || inc.id));
    });

    const parts = [];
    let groupIndex = 0;
    groups.forEach((items, group) => {
        if (!items.length) return;
        const panelId = `shell-test-mode-group-${groupIndex}`;
        groupIndex += 1;
        parts.push(`
          <section class="shell-test-mode__group is-collapsed" data-group="${escapeHtml(group)}">
            <button type="button" class="shell-test-mode__section"
              aria-expanded="false" aria-controls="${panelId}">
              <span class="shell-test-mode__section-label">${escapeHtml(group)}</span>
              <span class="shell-test-mode__section-meta">${items.length}</span>
              <span class="shell-test-mode__section-chevron" aria-hidden="true"></span>
            </button>
            <div id="${panelId}" class="shell-test-mode__group-items" hidden>
              ${items.join('')}
            </div>
          </section>`);
    });

    if (!parts.length) {
        parts.push('<p class="shell-test-mode__empty">No test incidents configured.</p>');
    }

    return `
      <div class="shell-test-mode-modal__scroll" tabindex="0" role="region" aria-label="Spawnable incidents">
        ${parts.join('')}
      </div>
      <p class="shell-test-mode__scroll-hint" hidden>More below ↓</p>`;
}

function bindGroupToggles(root) {
    root?.querySelectorAll?.('.shell-test-mode__group').forEach((group) => {
        const toggle = group.querySelector('.shell-test-mode__section');
        const panel = group.querySelector('.shell-test-mode__group-items');
        if (!toggle || !panel) return;
        toggle.addEventListener('click', () => {
            const collapsed = group.classList.toggle('is-collapsed');
            panel.hidden = collapsed;
            toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            syncScrollHint(root);
        });
    });
}

function syncScrollHint(root) {
    const scroller = root?.querySelector?.('.shell-test-mode-modal__scroll');
    const hint = root?.querySelector?.('.shell-test-mode__scroll-hint');
    if (!scroller || !hint) return;
    const overflow = scroller.scrollHeight > scroller.clientHeight + 2;
    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 6;
    root.classList.toggle('is-scrollable', overflow);
    root.classList.toggle('is-at-bottom', !overflow || atBottom);
    hint.hidden = !overflow || atBottom;
}

function bindScrollHint(root) {
    const scroller = root?.querySelector?.('.shell-test-mode-modal__scroll');
    if (!scroller) return;
    const update = () => syncScrollHint(root);
    scroller.addEventListener('scroll', update, { passive: true });
    update();
    requestAnimationFrame(update);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function bindModalItems(ModalModule) {
    const content = document.querySelector(GameConfig.selectors.modalContent);
    if (!content) return;
    content.querySelectorAll('.shell-test-mode__item').forEach((item) => {
        item.addEventListener('click', () => {
            const kind = item.getAttribute('data-kind');
            const labId = item.getAttribute('data-lab-id');
            // Close spawn menu first so skill/emergency challenge modals are not dismissed.
            ModalModule.closeModal();
            onIncidentSelect(kind, labId != null && labId !== '' ? { labId } : {});
        });
    });
}

async function openTestModeModal() {
    const ModalModule = await getModalModule();
    ModalModule.openModal({
        title: 'Test mode — spawn incident',
        content: `<div class="shell-test-mode-modal text-left">${buildModalBody()}</div>`,
        footer: `<button type="button" class="px-4 py-2 bg-gray-500 text-white rounded" onclick="closeModal()">Close</button>`,
        overlay: true,
        persistent: false
    });
    const root = document.querySelector(`${GameConfig.selectors.modalContent} .shell-test-mode-modal`);
    bindModalItems(ModalModule);
    bindGroupToggles(root);
    bindScrollHint(root);
}

function mountTestControl() {
    const host = document.querySelector(GameConfig.selectors.testMode || '#shell-test-mode');
    if (!host) return null;

    host.hidden = false;
    host.classList.remove('hidden');
    host.innerHTML = `
      <button type="button" class="shell-test-mode__btn" aria-haspopup="dialog"
              title="Test mode — spawn incidents" aria-label="Open test mode">
        <i class="fas fa-flask" aria-hidden="true"></i>
        <span>Test</span>
      </button>
    `;

    const btn = host.querySelector('.shell-test-mode__btn');
    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        openTestModeModal();
    });

    document.body.classList.add('is-test-mode');
    return host;
}

export async function initTestMode() {
    const data = await loadTestModeJson();
    enabledFromJson = data.enabled === true;
    jsonLoaded = true;

    if (!enabledFromJson) return { enabled: false };

    mountTestControl();
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: 'TEST MODE on — use flask Test control by the title to spawn incidents',
        timeLabel: formatHHMM(
            gameState.getStateSlice('currentTime') ?? GameConfig.timer.defaultShiftStart
        )
    });
    return { enabled: true };
}

const TestModeModule = {
    init: initTestMode,
    isEnabled: isTestModeEnabled,
    spawnCriticalLabNow
};

export default TestModeModule;
