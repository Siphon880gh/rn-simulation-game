/**
 * Shift alarm sounds via Web Audio (no media assets).
 * Enable/disable persists in localStorage (GameConfig.sound).
 */
import { GameConfig } from './game-config.js';

let audioCtx = null;
let enabledCache = null;

function storageKey() {
    return GameConfig.sound?.storageKey || 'rngame.soundEnabled';
}

function readStoredEnabled() {
    try {
        const raw = localStorage.getItem(storageKey());
        if (raw == null) return GameConfig.sound?.enabledDefault !== false;
        return raw === '1' || raw === 'true';
    } catch {
        return GameConfig.sound?.enabledDefault !== false;
    }
}

export function isSoundEnabled() {
    if (enabledCache == null) enabledCache = readStoredEnabled();
    return enabledCache;
}

export function setSoundEnabled(on) {
    enabledCache = Boolean(on);
    try {
        localStorage.setItem(storageKey(), enabledCache ? '1' : '0');
    } catch {
        /* private mode */
    }
    syncSoundToggleUi();
    return enabledCache;
}

export function toggleSoundEnabled() {
    return setSoundEnabled(!isSoundEnabled());
}

function ensureAudioContext() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

/** Preset beep patterns for nurse alerts. */
const ALARM_PRESETS = {
    callLight: {
        frequency: 920,
        pulseMs: 140,
        gapMs: 90,
        pulses: 3,
        gain: 0.08
    },
    bed: {
        frequency: 620,
        pulseMs: 180,
        gapMs: 70,
        pulses: 5,
        gain: 0.11,
        alternateHz: 780
    }
};

/**
 * Play a named alarm (`callLight` | `bed`) or a custom pattern object.
 * No-ops when sound is disabled or AudioContext unavailable.
 */
export function playAlarm(kindOrPattern = 'callLight') {
    if (!isSoundEnabled()) return false;
    const ctx = ensureAudioContext();
    if (!ctx) return false;

    const pattern = typeof kindOrPattern === 'string'
        ? (ALARM_PRESETS[kindOrPattern] || ALARM_PRESETS.callLight)
        : kindOrPattern;

    const pulses = Number(pattern.pulses) || 2;
    const pulseMs = Number(pattern.pulseMs) || 120;
    const gapMs = Number(pattern.gapMs) || 80;
    const baseGain = Number(pattern.gain) || 0.08;
    const t0 = ctx.currentTime + 0.02;

    for (let i = 0; i < pulses; i += 1) {
        const freq = pattern.alternateHz && i % 2 === 1
            ? Number(pattern.alternateHz)
            : Number(pattern.frequency) || 880;
        const start = t0 + (i * (pulseMs + gapMs)) / 1000;
        const end = start + pulseMs / 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(baseGain, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
    }
    return true;
}

export function syncSoundToggleUi() {
    if (typeof document === 'undefined') return;
    const btn = document.querySelector(GameConfig.sound?.selector || '#shell-sound-toggle');
    if (!btn) return;
    const on = isSoundEnabled();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('is-muted', !on);
    btn.title = on ? 'Sound on — click to mute alarms' : 'Sound off — click to enable alarms';
    const label = btn.querySelector('[data-sound-label]');
    if (label) label.textContent = on ? 'Sound' : 'Muted';
    const iconOn = btn.querySelector('[data-sound-icon="on"]');
    const iconOff = btn.querySelector('[data-sound-icon="off"]');
    if (iconOn) iconOn.classList.toggle('hidden', !on);
    if (iconOff) iconOff.classList.toggle('hidden', on);
}

function mountSoundToggle() {
    const btn = document.querySelector(GameConfig.sound?.selector || '#shell-sound-toggle');
    if (!btn || btn.dataset.bound === '1') {
        syncSoundToggleUi();
        return;
    }
    btn.dataset.bound = '1';
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        const next = toggleSoundEnabled();
        // Unlock AudioContext on the same user gesture when enabling
        if (next) {
            ensureAudioContext();
            playAlarm('callLight');
        }
        syncSoundToggleUi();
    });
    syncSoundToggleUi();
}

export function initSound() {
    enabledCache = readStoredEnabled();
    mountSoundToggle();
    return { enabled: isSoundEnabled() };
}

const SoundModule = {
    init: initSound,
    isEnabled: isSoundEnabled,
    setEnabled: setSoundEnabled,
    toggle: toggleSoundEnabled,
    playAlarm,
    syncUi: syncSoundToggleUi
};

export default SoundModule;
