/**
 * AUTO checks for E5.M1 challenge gate + timer pause.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

// Minimal DOM for modal + challenge wiring
const listeners = new Map();
function el(tag = 'div') {
  const node = {
    tagName: tag.toUpperCase(),
    className: '',
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); node.className = [...this._s].join(' '); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); node.className = [...this._s].join(' '); },
      toggle(c, on) { if (on === false) this.remove(c); else if (on === true) this.add(c); else if (this._s.has(c)) this.remove(c); else this.add(c); },
      contains(c) { return this._s.has(c); }
    },
    style: {
      removeProperty() {},
      setProperty() {}
    },
    attributes: {},
    children: [],
    textContent: '',
    innerHTML: '',
    hidden: false,
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    appendChild(c) { this.children.push(c); return c; },
    prepend(c) { this.children.unshift(c); return c; },
    addEventListener(type, fn) {
      const key = type;
      if (!listeners.has(this)) listeners.set(this, new Map());
      const m = listeners.get(this);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(fn);
    },
    click() {
      (listeners.get(this)?.get('click') || []).forEach((fn) => fn({ target: this }));
    },
    querySelector(sel) {
      if (sel === '#challenge-feedback') return feedbackEl;
      if (sel.startsWith('.')) {
        const cls = sel.slice(1);
        return this.children.find((c) => c.classList.contains(cls)) || null;
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.challenge-choice') return choiceButtons;
      return [];
    }
  };
  return node;
}

const modalEl = el('div');
modalEl.classList.add('hidden');
const titleEl = el('div');
const contentEl = el('div');
const footerEl = el('div');
const shellEl = el('div');
const feedbackEl = el('p');
feedbackEl.id = 'challenge-feedback';
feedbackEl.classList.add('hidden');

const choiceButtons = [
  Object.assign(el('button'), { attributes: { 'data-challenge-correct': '0' } }),
  Object.assign(el('button'), { attributes: { 'data-challenge-correct': '1' } }),
  Object.assign(el('button'), { attributes: { 'data-challenge-correct': '0' } })
];
choiceButtons.forEach((b) => {
  b.getAttribute = (k) => b.attributes[k] ?? null;
  b.classList.add('challenge-choice');
});

const challengeRoot = el('div');
challengeRoot.classList.add('challenge-gate');
challengeRoot.children = [...choiceButtons, feedbackEl];
challengeRoot.querySelector = (sel) => {
  if (sel === '#challenge-feedback') return feedbackEl;
  return null;
};
challengeRoot.querySelectorAll = (sel) => (sel === '.challenge-choice' ? choiceButtons : []);

globalThis.window = globalThis;
globalThis.document = {
  querySelector(sel) {
    if (sel === GameConfig.selectors.modal) return modalEl;
    if (sel === GameConfig.selectors.modalTitle) return titleEl;
    if (sel === GameConfig.selectors.modalContent) return contentEl;
    if (sel === GameConfig.selectors.modalFooter) return footerEl;
    if (sel === GameConfig.selectors.shell) return shellEl;
    if (sel === '.challenge-gate') return challengeRoot;
    if (sel === '#challenge-feedback') return feedbackEl;
    return null;
  },
  querySelectorAll: () => [],
  createElement: (tag) => el(tag),
  body: { appendChild() {}, removeChild() {} }
};

const { runChallengeGate, cancelChallengeGate, resetForTests } = await import(
  '../game/assets/js/challenge-gate.js'
).then(async (mod) => {
  // expose a test reset if needed via cancel
  return {
    runChallengeGate: mod.runChallengeGate,
    cancelChallengeGate: mod.cancelChallengeGate,
    resetForTests: () => {
      if (mod.isChallengeActive()) mod.cancelChallengeGate();
    }
  };
});

assert(existsSync(join(root, 'game/assets/js/challenges/challenge-gate.js')), 'challenges/challenge-gate.js');
assert(existsSync(join(root, 'game/assets/js/challenges/README.md')), 'challenges authoring README');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('ChallengeGateModule'), 'app wires challenge gate');
assert(appSrc.includes('runChallengeGate'), 'perform uses gate');
assert(GameConfig.timer.pauseSources.CHALLENGE === 'challenge', 'challenge pause source');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });

// Pass path: pause during challenge, clear after
const passPromise = runChallengeGate({ id: 't1', name: 'Test Med' });
assert(gameState.getStateSlice('isPaused') === true, 'paused during challenge');
assert(
  (gameState.getStateSlice('pauseSources') || []).includes('challenge'),
  'challenge pause source set'
);
await new Promise((r) => setTimeout(r, 5));
choiceButtons[1].click();
const passResult = await passPromise;
assert(passResult.passed === true, 'pass outcome');
assert(gameState.getStateSlice('isPaused') === false, 'unpaused after pass');
assert(
  !(gameState.getStateSlice('pauseSources') || []).includes('challenge'),
  'challenge pause cleared'
);

// Incorrect keeps modal open for retry (pause held); cancel clears pause
const failPromise = runChallengeGate({ id: 't2', name: 'Fail Med' });
await new Promise((r) => setTimeout(r, 5));
choiceButtons[0].click();
assert(gameState.getStateSlice('isPaused') === true, 'still paused after incorrect retry');
cancelChallengeGate();
const failResult = await failPromise;
assert(failResult.passed === false, 'fail/cancel after incorrect');
assert(gameState.getStateSlice('isPaused') === false, 'unpaused after cancel');

// Cancel path
const cancelPromise = runChallengeGate({ id: 't3', name: 'Cancel Med' });
cancelChallengeGate();
const cancelResult = await cancelPromise;
assert(cancelResult.passed === false && cancelResult.reason === 'cancelled', 'cancel outcome');

if (failures.length) {
  console.error('E5.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E5.M1 AUTO PASS');
