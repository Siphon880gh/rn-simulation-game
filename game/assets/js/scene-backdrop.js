/**
 * Scene presence (E7.M1) — unit backdrop + optional situation stills.
 * CSS-first; image URLs optional when authored. No GSAP.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

function sceneCfg() {
    return GameConfig.scene || {};
}

function resolveUnitBackground() {
    const pack = gameState.getStateSlice('scenarioPack');
    const fromPack = pack?.scene?.unitBackground;
    if (fromPack) return { url: fromPack, theme: pack?.scene?.theme || 'medsurg' };
    const cfg = sceneCfg();
    return {
        url: cfg.unitBackground || null,
        theme: cfg.defaultTheme || 'medsurg'
    };
}

/** Apply static unit backdrop to #shell-main (image if URL, else CSS theme class). */
export function applyUnitScene() {
    const main = document.querySelector(GameConfig.selectors.main || '#shell-main');
    if (!main) return;
    const { url, theme } = resolveUnitBackground();
    main.classList.add('shell-scene-main');
    main.classList.remove('scene-theme-medsurg', 'scene-theme-icu', 'scene-theme-ed', 'scene-theme-tele');
    main.classList.add(`scene-theme-${theme || 'medsurg'}`);
    if (url) {
        main.style.setProperty('--scene-unit-image', `url("${url}")`);
        main.classList.add('has-scene-image');
    } else {
        main.style.removeProperty('--scene-unit-image');
        main.classList.remove('has-scene-image');
    }
}

/** Optional still behind challenge modal (config/pack key → URL). */
export function resolveSituationStill(key) {
    if (!key) return null;
    const pack = gameState.getStateSlice('scenarioPack');
    const fromPack = pack?.scene?.situationStills?.[key];
    if (fromPack) return fromPack;
    return sceneCfg().situationStills?.[key] || null;
}

export function applySituationStill(key) {
    const modal = document.querySelector('#modal');
    if (!modal) return;
    const url = resolveSituationStill(key);
    if (url) {
        modal.style.setProperty('--scene-situation-image', `url("${url}")`);
        modal.classList.add('has-situation-still');
    } else {
        modal.style.removeProperty('--scene-situation-image');
        modal.classList.remove('has-situation-still');
    }
}

export function clearSituationStill() {
    const modal = document.querySelector('#modal');
    if (!modal) return;
    modal.style.removeProperty('--scene-situation-image');
    modal.classList.remove('has-situation-still');
}

const SceneBackdropModule = {
    applyUnitScene,
    applySituationStill,
    clearSituationStill,
    resolveSituationStill,
    init() {
        applyUnitScene();
        gameState.subscribe('scenarioPack', () => applyUnitScene());
        if (sceneCfg().motion?.statusPulse !== false) {
            document.documentElement.classList.add('scene-motion-status');
        }
        if (sceneCfg().motion?.panelSwap !== false) {
            document.documentElement.classList.add('scene-motion-panels');
        }
    }
};

export default SceneBackdropModule;
