/**
 * Test mode — `game/test-mode.json` `{ "enabled": true }` shows a brand Test
 * control that opens a modal to spawn incidents. No URL query.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import { spawnCriticalLabNow } from './critical-labs.js';
import { spawnFromTemplate, weightedPick } from './dynamic-tasks.js';
import { spawnCallLightNow, spawnBedAlarmNow } from './nurse-alerts.js';

/** Lazy — avoids loading modal.js (window globals) during Node AUTO checks. */
async function getModalModule() {
    const mod = await import('./modal.js');
    return mod.default;
}

let enabledFromJson = false;
let jsonLoaded = false;

function testCfg() {
    return GameConfig.testMode || {};
}

/** True after init when `test-mode.json` has `"enabled": true`. */
export function isTestModeEnabled() {
    return jsonLoaded && enabledFromJson === true;
}

async function loadTestModeJson() {
    const url = testCfg().configUrl || 'test-mode.json';
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

function fireCriticalLab(labId) {
    const task = spawnCriticalLabNow(labId ? { labId } : {});
    if (!task) {
        statusMessage('Test: could not spawn critical lab (no patients?)');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: critical lab ${task.metadata?.labShort || labId || 'random'}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    statusMessage(`TEST: critical lab — ${task.name}`);
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
    const task = spawnFromTemplate(template, now);
    if (!task) {
        statusMessage('Test: dynamic spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: dynamic ${task.name}`,
        timeLabel: formatHHMM(now)
    });
    statusMessage(`TEST: ${task.name}`);
}

function fireCallLight() {
    const task = spawnCallLightNow({ templateId: 'water' });
    if (!task) {
        statusMessage('Test: call light spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: ${task.name}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    statusMessage(`TEST: ${task.name}`);
}

function fireBedAlarm() {
    const task = spawnBedAlarmNow();
    if (!task) {
        statusMessage('Test: bed alarm spawn failed');
        return;
    }
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `TEST spawn: ${task.name}`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
    statusMessage(`TEST: ${task.name}`);
}

function onIncidentSelect(kind, detail) {
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
    }
}

function buildModalBody() {
    const incidents = testCfg().incidents || [];
    const labs = GameConfig.criticalLabs?.labs || [];
    const parts = [];

    incidents.forEach((inc) => {
        if (inc.kind === 'critical-lab' && inc.expandLabs !== false) {
            parts.push(`<p class="shell-test-mode__section">${escapeHtml(inc.label || 'Critical lab')}</p>`);
            labs.forEach((lab) => {
                parts.push(`
                  <button type="button" class="shell-test-mode__item" data-kind="critical-lab" data-lab-id="${escapeHtml(lab.id)}">
                    ${escapeHtml(lab.shortName)} — ${escapeHtml(lab.result || lab.fullName || '')}
                  </button>`);
            });
            parts.push(`
              <button type="button" class="shell-test-mode__item" data-kind="critical-lab" data-lab-id="">
                Random critical lab
              </button>`);
            return;
        }
        parts.push(`
          <button type="button" class="shell-test-mode__item" data-kind="${escapeHtml(inc.kind)}">
            ${escapeHtml(inc.label || inc.id)}
          </button>`);
    });

    if (!parts.length) {
        parts.push('<p class="shell-test-mode__empty">No test incidents configured.</p>');
    }
    return parts.join('');
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
            onIncidentSelect(kind, labId != null && labId !== '' ? { labId } : {});
            ModalModule.closeModal();
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
    bindModalItems(ModalModule);
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
