/**
 * Alteplase (Cathflo) PICC occlusion — patency dice + MCQ.
 * Author content: ./config.js
 */
import { GameConfig } from '../../../game-config.js';
import { alteplaseChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
    return GameConfig.alteplasePicc || {};
}

function quizCfg() {
    return GameConfig.alteplaseChallenge || alteplaseChallengeConfig || {};
}

export function isAlteplaseTask(task) {
    const challenge = String(task?.metadata?.challenge || '').toLowerCase();
    if (challenge === 'alteplase') return true;
    const phase = String(task?.metadata?.alteplasePhase || '').toLowerCase();
    if (phase && phase.startsWith('alteplase')) return true;
    if (['assess', 'admin', 'aspirate', 'reassess-30', 'reassess-120', 'dwell-30', 'dwell-120', 'focus']
        .includes(phase) && /alteplase|cathflo|picc.*patent|occlud/i.test(task?.name || '')) {
        return true;
    }
    return /alteplase|cathflo/i.test(task?.name || '')
        && /picc|occlud|patent|dwell|aspirat/i.test(task?.name || '');
}

export function getAlteplasePhase(task) {
    const phase = String(task?.metadata?.alteplasePhase || '').trim();
    if (phase) return phase;
    const challenge = String(task?.metadata?.challenge || '').toLowerCase();
    if (challenge === 'alteplase') return 'assess';
    return 'focus';
}

export function getAlteplaseQuestions(phase = null) {
    const list = quizCfg().questions;
    const pool = Array.isArray(list) && list.length ? list : alteplaseChallengeConfig.questions;
    if (!phase || phase === 'focus') return pool;
    return pool.filter((q) => {
        const phases = Array.isArray(q.phases) ? q.phases : ['focus'];
        return phases.includes(phase);
    });
}

export function getAlteplasePoolSize(task) {
    return getAlteplaseQuestions(getAlteplasePhase(task)).length;
}

export function getAlteplaseQuestionIds(task) {
    return getAlteplaseQuestions(getAlteplasePhase(task))
        .map((q) => q?.id)
        .filter((id) => id != null && id !== '')
        .map(String);
}

export function pickAlteplaseQuestion(task, opts = {}) {
    const phase = opts.phase || getAlteplasePhase(task);
    const pool = getAlteplaseQuestions(phase);
    if (!pool.length) return null;
    if (opts.questionId != null && opts.questionId !== '') {
        const wanted = String(opts.questionId);
        const exact = pool.find((q) => String(q.id) === wanted)
            || (quizCfg().questions || []).find((q) => String(q.id) === wanted);
        if (exact) return exact;
    }
    // Prefer Cathflo brand question on initial patent assess
    if (phase === 'assess' && !opts.questionId) {
        const cathflo = pool.find((q) => q.id === 'cathflo');
        if (cathflo) return cathflo;
    }
    if (phase === 'admin' && !opts.questionId) {
        const admin = pool.find((q) => q.id === 'admin-method');
        if (admin) return admin;
    }
    if (phase === 'aspirate' && !opts.questionId) {
        const weightKg = Number(opts.weightKg ?? task?.metadata?.weightKg);
        const id = Number.isFinite(weightKg) && weightKg < 10 ? 'aspirate-peds' : 'aspirate-adult';
        const match = pool.find((q) => q.id === id) || pool.find((q) => q.id === 'aspirate-adult');
        if (match) return match;
    }
    const roll = typeof opts.random === 'function' ? opts.random() : Math.random();
    const idx = Math.min(pool.length - 1, Math.floor(roll * pool.length));
    return pool[idx];
}

function shuffle(list, random = Math.random) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * @returns {{ title: string, prompt: string, choices: {label:string,correct:boolean}[], expected: string, questionId?: string, methodSummary?: string }|null}
 */
export function buildAlteplaseQuiz(task, opts = {}) {
    if (!isAlteplaseTask(task) && opts.force !== true) return null;
    const question = opts.question || pickAlteplaseQuestion(task, opts);
    if (!question) return null;
    const labels = shuffle(question.choices || [], opts.random);
    return {
        title: 'Alteplase (Cathflo) — PICC occlusion',
        prompt: question.prompt,
        choices: labels.map((label) => ({
            label,
            correct: String(label).trim() === String(question.correct).trim()
        })),
        expected: question.correct,
        questionId: question.id,
        methodSummary: quizCfg().methodSummary || alteplaseChallengeConfig.methodSummary
    };
}

export function renderAlteplaseQuizHtml(quiz, taskName, opts = {}) {
    if (!quiz) return '';
    const poolSize = Number(opts.poolSize) || 1;
    const levelHtml = poolSize > 1 ? (opts.levelHtml || '') : '';
    const choices = (quiz.choices || []).map((c, i) => `
      <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-challenge-correct="${c.correct ? '1' : '0'}" data-choice-index="${i}">${c.label}</button>
    `).join('');
    const summary = quiz.methodSummary
        ? `<p class="text-xs text-gray-600 bg-slate-50 border border-slate-200 rounded p-2">${escapeHtml(quiz.methodSummary)}</p>`
        : '';
    return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="alteplase" data-question-id="${quiz.questionId || ''}" data-pool-size="${poolSize}">
        ${levelHtml}
        ${challengeMediaHtml('alteplase')}
        <p class="text-sm text-gray-600">Skill check${taskName ? `: <strong>${escapeHtml(taskName)}</strong>` : ''}</p>
        ${summary}
        <p class="font-medium text-gray-900">${escapeHtml(quiz.prompt)}</p>
        <div class="flex flex-col gap-2" role="group" aria-label="Answer choices">${choices}</div>
      </div>
    `;
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function pickWeighted(outcomes, random) {
    const total = outcomes.reduce((s, o) => s + (Number(o.weight) || 0), 0);
    let r = random() * total;
    for (const row of outcomes) {
        r -= Number(row.weight) || 0;
        if (r <= 0) return row;
    }
    return outcomes[outcomes.length - 1];
}

/**
 * Initial PICC assess: 75% patent / 25% clotted (config weights).
 */
export function rollPiccPatencyOutcome(opts = {}) {
    const random = opts.random || Math.random;
    const outcomes = cfg().patencyOutcomes || [
        { id: 'patent', label: 'PICC patent', weight: 75, clotted: false },
        { id: 'clotted', label: 'PICC clotted', weight: 25, clotted: true }
    ];
    const band = pickWeighted(outcomes, random);
    return {
        id: band.id,
        label: band.label || band.id,
        clotted: Boolean(band.clotted),
        toastTitle: band.clotted ? 'PICC occluded' : 'PICC patent',
        toastDetail: band.clotted
            ? 'No blood return / will not flush — incident spawned'
            : 'Line flushes and aspirates freely'
    };
}

/**
 * After alteplase dwell: chance catheter function restored.
 */
export function rollPiccRestoreOutcome(phase, opts = {}) {
    const random = opts.random || Math.random;
    const key = phase === 'reassess-120' ? 'restoreAfter120' : 'restoreAfter30';
    const chance = Number(cfg()[key]);
    const p = Number.isFinite(chance) ? chance : (phase === 'reassess-120' ? 1 : 0.55);
    const restored = random() < p;
    return {
        id: restored ? 'restored' : 'still-occluded',
        label: restored ? 'Catheter function restored' : 'Still occluded',
        restored,
        toastTitle: restored ? 'PICC function restored' : 'PICC still occluded',
        toastDetail: restored
            ? 'Proceed to aspirate waste blood, then flush'
            : (phase === 'reassess-30'
                ? 'Allow additional 120-minute dwell'
                : 'Notify provider — line still occluded')
    };
}

export function getPiccPatencyOdds() {
    const outcomes = cfg().patencyOutcomes || [];
    const total = outcomes.reduce((s, o) => s + (Number(o.weight) || 0), 0) || 100;
    return outcomes.map((o) => ({
        id: o.id,
        label: o.label || o.id,
        percent: Math.round(((Number(o.weight) || 0) / total) * 1000) / 10,
        clotted: Boolean(o.clotted)
    }));
}

export function aspirateVolumeMl(weightKg) {
    const w = Number(weightKg);
    const adult = cfg().aspirateMlAdult || { min: 4, max: 5 };
    const peds = cfg().aspirateMlPeds || 3;
    if (Number.isFinite(w) && w < 10) {
        return { ml: peds, label: `${peds} mL`, under10kg: true };
    }
    return {
        ml: adult.max,
        label: `${adult.min} to ${adult.max} mL`,
        under10kg: false
    };
}

export function renderPiccPatencyOddsHtml() {
    const rows = getPiccPatencyOdds().map((row) => `
      <li class="finger-stick-odds__row${row.clotted ? ' finger-stick-odds__row--critical' : ''}">
        <span class="finger-stick-odds__label">${escapeHtml(row.label)}</span>
        <span class="finger-stick-odds__pct">${row.percent}%</span>
      </li>
    `).join('');
    return `
      <div class="finger-stick-odds" role="dialog" aria-label="PICC patency odds">
        <p class="finger-stick-odds__title">PICC assess odds</p>
        <ul class="finger-stick-odds__list">${rows}</ul>
      </div>
    `;
}

/** Attach dice control to alteplase PICC assess rows. */
export function decorateAlteplaseDice(root = document) {
    if (typeof document === 'undefined' || !root?.querySelectorAll) return;
    const nodes = root.querySelectorAll(
        '[data-challenge="alteplase"], [data-alteplase-phase="assess"]'
    );
    nodes.forEach((el) => {
        if (el.querySelector('[data-picc-patency-dice]')) return;
        const phase = String(el.getAttribute('data-alteplase-phase') || 'assess');
        // Only initial assess shows 75/25 dice (reassess uses restore odds in toast)
        if (phase !== 'assess') return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'finger-stick-dice';
        btn.setAttribute('data-picc-patency-dice', '1');
        btn.setAttribute('title', 'PICC patency outcome odds');
        btn.setAttribute('aria-label', 'Show PICC patency outcome odds');
        btn.innerHTML = '<i class="fas fa-dice" aria-hidden="true"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            togglePiccOddsPopover(btn);
        });

        const nameEl = el.querySelector('.font-medium');
        const timeEl = el.querySelector('.ml-auto');
        if (nameEl?.parentElement === el) {
            el.insertBefore(btn, timeEl || nameEl.nextSibling);
        } else if (timeEl) {
            el.insertBefore(btn, timeEl);
        } else {
            el.appendChild(btn);
        }
    });
}

let oddsPopoverEl = null;
let oddsAnchorEl = null;

function ensureOddsPopover() {
    if (oddsPopoverEl) return oddsPopoverEl;
    oddsPopoverEl = document.createElement('div');
    oddsPopoverEl.className = 'finger-stick-odds-popover';
    oddsPopoverEl.hidden = true;
    oddsPopoverEl.innerHTML = renderPiccPatencyOddsHtml();
    document.body.appendChild(oddsPopoverEl);
    return oddsPopoverEl;
}

export function showPiccPatencyOddsPopover(anchor) {
    if (typeof document === 'undefined') return;
    const pop = ensureOddsPopover();
    pop.innerHTML = renderPiccPatencyOddsHtml();
    pop.hidden = false;
    oddsAnchorEl = anchor || null;
    positionOddsPopover(anchor);
}

export function hidePiccPatencyOddsPopover() {
    if (!oddsPopoverEl) return;
    oddsPopoverEl.hidden = true;
    oddsAnchorEl = null;
}

function togglePiccOddsPopover(anchor) {
    const pop = ensureOddsPopover();
    if (!pop.hidden && oddsAnchorEl === anchor) {
        hidePiccPatencyOddsPopover();
        return;
    }
    showPiccPatencyOddsPopover(anchor);
}

function positionOddsPopover(anchor) {
    if (!oddsPopoverEl || !anchor?.getBoundingClientRect) return;
    const rect = anchor.getBoundingClientRect();
    const pad = 8;
    const width = oddsPopoverEl.offsetWidth || 240;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    let top = rect.bottom + 6;
    const height = oddsPopoverEl.offsetHeight || 160;
    if (top + height > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - height - 6);
    }
    oddsPopoverEl.style.left = `${left}px`;
    oddsPopoverEl.style.top = `${top}px`;
}

export function initAlteplaseDiceUi() {
    if (typeof document === 'undefined') return;
    decorateAlteplaseDice(document);
    document.addEventListener('click', (e) => {
        if (e.target.closest?.('[data-picc-patency-dice]')) return;
        if (e.target.closest?.('.finger-stick-odds-popover')) return;
        hidePiccPatencyOddsPopover();
    });
    window.addEventListener('resize', () => {
        if (oddsAnchorEl && oddsPopoverEl && !oddsPopoverEl.hidden) {
            positionOddsPopover(oddsAnchorEl);
        }
    });
}

export default {
    isAlteplaseTask,
    getAlteplasePhase,
    buildAlteplaseQuiz,
    renderAlteplaseQuizHtml,
    rollPiccPatencyOutcome,
    rollPiccRestoreOutcome,
    getPiccPatencyOdds,
    aspirateVolumeMl,
    decorateAlteplaseDice,
    initAlteplaseDiceUi
};
