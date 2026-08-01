/**
 * Sepsis screen (Q4H) — dice-gated findings + classification quiz + cheat guide.
 * Extends skill sepsis-recognition. Bundle spawn: sepsis-system.js
 */
import { GameConfig } from '../../../game-config.js';
import gameState from '../../../game-state.js';
import taskSystem from '../../../task-system.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';
import { sepsisScreenChallengeConfig } from './config.js';

function cfg() {
    return GameConfig.sepsisScreen || {};
}

function quizCfg() {
    return sepsisScreenChallengeConfig || {};
}

export function isSepsisScreenTask(task) {
    const challenge = String(task?.metadata?.challenge || '').toLowerCase();
    if (challenge === 'sepsis-screen') return true;
    const kind = String(task?.metadata?.kind || '').toLowerCase();
    if (kind === 'sepsis-screen') return true;
    return /sepsis screen/i.test(task?.name || '');
}

function randInt(min, max, random = Math.random) {
    return min + Math.floor(random() * (max - min + 1));
}

function pickWeighted(outcomes, random = Math.random) {
    const list = (outcomes || []).filter((o) => o && Number(o.weight) > 0);
    if (!list.length) return null;
    const total = list.reduce((s, o) => s + Number(o.weight || 0), 0);
    let roll = random() * total;
    for (const o of list) {
        roll -= Number(o.weight || 0);
        if (roll <= 0) return o;
    }
    return list[list.length - 1];
}

export function getSepsisScreenOdds() {
    const outcomes = cfg().outcomes || [];
    const total = outcomes.reduce((s, o) => s + Number(o.weight || 0), 0) || 1;
    return outcomes.map((o) => ({
        id: o.id,
        label: o.label,
        percent: (Number(o.weight || 0) / total) * 100,
        bundle: Boolean(o.bundle)
    }));
}

export function rollSepsisScreenOutcome(opts = {}) {
    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const base = opts.outcomeId
        ? (cfg().outcomes || []).find((o) => o.id === opts.outcomeId)
        : pickWeighted(cfg().outcomes, random);
    const outcome = base || {
        id: 'clear',
        label: 'No sepsis criteria',
        bundle: false,
        classifyLabel: 'No sepsis — continue monitoring'
    };
    return {
        ...outcome,
        findings: buildSepsisFindings(outcome.id, { random })
    };
}

/**
 * Random-ish VS + body-system + labs rundown consistent with outcome tier.
 */
export function buildSepsisFindings(outcomeId, opts = {}) {
    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const id = String(outcomeId || 'clear');

    if (id === 'clear') {
        const hr = randInt(72, 98, random);
        const sbp = randInt(110, 138, random);
        const dbp = randInt(64, 84, random);
        const temp = (97.8 + random() * 1.4).toFixed(1);
        const rr = randInt(14, 20, random);
        const spo2 = randInt(95, 99, random);
        const lactate = (0.6 + random() * 1.2).toFixed(1);
        const wbc = (6 + random() * 5).toFixed(1);
        return {
            vitals: {
                hr,
                bp: `${sbp}/${dbp}`,
                temp: `${temp}°F`,
                rr,
                spo2: `${spo2}% RA`,
                mentation: 'Alert, oriented ×3'
            },
            systems: [
                { name: 'Neuro', detail: 'No new confusion; follows commands' },
                { name: 'CV', detail: 'Warm, capillary refill <2 s; pulses 2+' },
                { name: 'Resp', detail: 'Clear bilaterally; no distress' },
                { name: 'Renal', detail: 'Urine output adequate this hour' },
                { name: 'Skin', detail: 'Warm, dry; no mottling' }
            ],
            labs: [
                { name: 'Lactate', detail: `${lactate} mmol/L` },
                { name: 'WBC', detail: `${wbc} K/µL` },
                { name: 'Cr', detail: 'Baseline' },
                { name: 'Plt', detail: 'Within normal limits' }
            ]
        };
    }

    if (id === 'sepsis') {
        const hr = randInt(105, 128, random);
        const sbp = randInt(92, 108, random);
        const dbp = randInt(52, 68, random);
        const temp = (100.4 + random() * 2.2).toFixed(1);
        const rr = randInt(22, 28, random);
        const spo2 = randInt(91, 95, random);
        const lactate = (2.1 + random() * 1.4).toFixed(1);
        const wbc = (14 + random() * 8).toFixed(1);
        const cr = (1.4 + random() * 0.6).toFixed(1);
        return {
            vitals: {
                hr,
                bp: `${sbp}/${dbp}`,
                temp: `${temp}°F`,
                rr,
                spo2: `${spo2}% RA`,
                mentation: 'New confusion / delayed answers'
            },
            systems: [
                { name: 'Neuro', detail: 'New altered mentation (qSOFA+)' },
                { name: 'CV', detail: 'Tachycardic; CRT delayed; cool extremities' },
                { name: 'Resp', detail: 'Tachypnea; mild work of breathing' },
                { name: 'Renal', detail: 'Urine output trending down' },
                { name: 'Source', detail: 'Suspected infection (UTI / pneumonia / soft tissue)' }
            ],
            labs: [
                { name: 'Lactate', detail: `${lactate} mmol/L (elevated)` },
                { name: 'WBC', detail: `${wbc} K/µL` },
                { name: 'Cr', detail: `${cr} mg/dL (rising)` },
                { name: 'Plt', detail: 'Mild decrease from baseline' }
            ]
        };
    }

    if (id === 'septic-shock') {
        const hr = randInt(118, 145, random);
        const sbp = randInt(72, 88, random);
        const dbp = randInt(40, 54, random);
        const temp = random() < 0.35
            ? (96.2 + random() * 1.2).toFixed(1)
            : (101.2 + random() * 2.0).toFixed(1);
        const rr = randInt(26, 36, random);
        const spo2 = randInt(86, 92, random);
        const lactate = (4.0 + random() * 3.5).toFixed(1);
        const wbc = (16 + random() * 12).toFixed(1);
        return {
            vitals: {
                hr,
                bp: `${sbp}/${dbp}`,
                temp: `${temp}°F`,
                rr,
                spo2: `${spo2}% on O₂`,
                mentation: 'Obtunded / only responds to voice'
            },
            systems: [
                { name: 'Neuro', detail: 'Profound altered mentation' },
                { name: 'CV', detail: 'Hypotension after fluids risk; cool/mottled' },
                { name: 'Resp', detail: 'High work of breathing; O₂ requirement up' },
                { name: 'Renal', detail: 'Oliguria this hour' },
                { name: 'Source', detail: 'Known/suspected infection with shock physiology' }
            ],
            labs: [
                { name: 'Lactate', detail: `${lactate} mmol/L (≥2 — shock marker)` },
                { name: 'WBC', detail: `${wbc} K/µL` },
                { name: 'Cr', detail: 'Acute rise from baseline' },
                { name: 'MAP', detail: '<65 mmHg (estimate from cuff BP)' }
            ]
        };
    }

    // MODS
    const hr = randInt(110, 150, random);
    const sbp = randInt(70, 90, random);
    const dbp = randInt(38, 52, random);
    const temp = (96.8 + random() * 4.5).toFixed(1);
    const rr = randInt(28, 40, random);
    const spo2 = randInt(82, 90, random);
    const lactate = (5.5 + random() * 4).toFixed(1);
    const cr = (2.4 + random() * 1.8).toFixed(1);
    const plt = randInt(38, 88, random);
    const bil = (2.2 + random() * 2.5).toFixed(1);
    return {
        vitals: {
            hr,
            bp: `${sbp}/${dbp}`,
            temp: `${temp}°F`,
            rr,
            spo2: `${spo2}% high-flow / NRB`,
            mentation: 'Unresponsive / only to pain'
        },
        systems: [
            { name: 'Neuro', detail: 'Encephalopathy / low GCS' },
            { name: 'CV', detail: 'Shock — vasopressor consideration' },
            { name: 'Resp', detail: 'Respiratory failure trajectory (ARDS risk)' },
            { name: 'Renal', detail: 'Acute kidney injury — oliguria / rising Cr' },
            { name: 'Heme / Liver', detail: 'Coagulopathy / thrombocytopenia; rising bilirubin' }
        ],
        labs: [
            { name: 'Lactate', detail: `${lactate} mmol/L` },
            { name: 'Cr', detail: `${cr} mg/dL` },
            { name: 'Plt', detail: `${plt} K/µL` },
            { name: 'Bili', detail: `${bil} mg/dL` },
            { name: 'INR', detail: 'Elevated' }
        ]
    };
}

export function storeSepsisScreenOnTask(task, outcome) {
    if (!task || !outcome) return;
    const meta = {
        sepsisScreen: {
            id: outcome.id,
            label: outcome.label,
            bundle: Boolean(outcome.bundle),
            bundleTier: outcome.bundleTier || null,
            classifyLabel: outcome.classifyLabel || outcome.label
        },
        sepsisFindings: outcome.findings || null
    };
    task.metadata = { ...(task.metadata || {}), ...meta };
    if (task.id) {
        const live = gameState.getStateSlice('tasks')?.get(task.id);
        if (live) {
            live.metadata = { ...(live.metadata || {}), ...meta };
            taskSystem.taskRegistry?.set?.(task.id, live);
        }
    }
}

/**
 * Build quiz session: findings already rolled + classify choices.
 */
export function buildSepsisScreenPrompt(task, opts = {}) {
    if (!isSepsisScreenTask(task) && opts.force !== true) return null;
    const random = typeof opts.random === 'function' ? opts.random : Math.random;
    const existingId = task?.metadata?.sepsisScreen?.id;
    const outcome = opts.outcome
        || (existingId
            ? rollSepsisScreenOutcome({ outcomeId: existingId, random })
            : rollSepsisScreenOutcome({ random }));
    if (!task?.metadata?.sepsisScreen) {
        storeSepsisScreenOnTask(task, outcome);
    }

    const choices = (cfg().outcomes || []).map((o) => ({
        label: o.classifyLabel || o.label,
        correct: o.id === outcome.id
    }));
    // Shuffle choices
    for (let i = choices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    const guide = cfg().guideDoc || { category: 'learning', filename: 'SEPSIS_GUIDELINES.md' };

    return {
        title: quizCfg().title || 'Sepsis screen (Q4H)',
        prompt: quizCfg().prompt || 'Classify these findings:',
        methodSummary: quizCfg().methodSummary || '',
        guideButtonLabel: quizCfg().guideButtonLabel || 'Open sepsis cheat guide',
        guideCategory: guide.category || 'learning',
        guideFilename: guide.filename || 'SEPSIS_GUIDELINES.md',
        outcome,
        findings: outcome.findings,
        choices,
        expected: outcome.classifyLabel || outcome.label
    };
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderSepsisScreenHtml(prompt, taskName) {
    if (!prompt) return '';
    const v = prompt.findings?.vitals || {};
    const systems = (prompt.findings?.systems || [])
        .map((s) => `<li><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(s.detail)}</li>`)
        .join('');
    const labs = (prompt.findings?.labs || [])
        .map((l) => `<li><strong>${escapeHtml(l.name)}:</strong> ${escapeHtml(l.detail)}</li>`)
        .join('');
    const choices = (prompt.choices || [])
        .map((c) => `
          <button type="button"
            class="challenge-choice w-full text-left px-3 py-2 rounded border border-gray-300 hover:bg-red-50 text-sm"
            data-challenge-correct="${c.correct ? '1' : '0'}">${escapeHtml(c.label)}</button>`)
        .join('');

    return `
      <div class="challenge-gate sepsis-screen-challenge space-y-3 text-left" data-challenge="sepsis-screen">
        ${challengeMediaHtml('skill-mcq') || challengeMediaHtml('admission') || ''}
        <p class="text-sm text-gray-600">${escapeHtml(taskName || 'Sepsis screen')}</p>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" id="sepsis-cheat-guide-btn"
            class="text-sm px-3 py-1.5 rounded border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
            data-guide-category="${escapeHtml(prompt.guideCategory)}"
            data-guide-filename="${escapeHtml(prompt.guideFilename)}">
            <i class="fas fa-book-medical mr-1" aria-hidden="true"></i>
            ${escapeHtml(prompt.guideButtonLabel)}
          </button>
        </div>
        <div class="rounded-lg border border-red-200 bg-red-50/60 p-3 text-sm">
          <p class="font-semibold text-red-900 mb-2">Vitals (this screen)</p>
          <div class="grid grid-cols-2 gap-1 text-gray-800">
            <div>HR: ${escapeHtml(v.hr)}</div>
            <div>BP: ${escapeHtml(v.bp)}</div>
            <div>Temp: ${escapeHtml(v.temp)}</div>
            <div>RR: ${escapeHtml(v.rr)}</div>
            <div>O<sub>2</sub>: ${escapeHtml(v.spo2)}</div>
            <div>Mentation: ${escapeHtml(v.mentation)}</div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="rounded border border-gray-200 bg-white p-3">
            <p class="font-semibold text-gray-900 mb-1">Body systems</p>
            <ul class="list-disc pl-4 space-y-0.5 text-gray-800">${systems}</ul>
          </div>
          <div class="rounded border border-gray-200 bg-white p-3">
            <p class="font-semibold text-gray-900 mb-1">Labs</p>
            <ul class="list-disc pl-4 space-y-0.5 text-gray-800">${labs}</ul>
          </div>
        </div>
        ${prompt.methodSummary
            ? `<p class="text-xs text-gray-600">${escapeHtml(prompt.methodSummary)}</p>`
            : ''}
        <p class="font-medium text-gray-900">${escapeHtml(prompt.prompt)}</p>
        <div class="space-y-2" data-sepsis-choices>${choices}</div>
      </div>
    `;
}

export function openSepsisCheatGuide(category, filename) {
    const cat = category || cfg().guideDoc?.category || 'learning';
    const file = filename || cfg().guideDoc?.filename || 'SEPSIS_GUIDELINES.md';
    if (typeof window !== 'undefined' && typeof window.docsOpenMarkdown === 'function') {
        window.docsOpenMarkdown(cat, file);
        return;
    }
    // Fallback: hash navigation (docs.js may not have exported yet)
    if (typeof window !== 'undefined') {
        window.location.hash = `doc=${encodeURIComponent(`${cat}/${file}`)}`;
    }
}

export function wireSepsisScreenGuideButton(root = document) {
    const btn = root.querySelector?.('#sepsis-cheat-guide-btn');
    if (!btn || btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSepsisCheatGuide(
            btn.getAttribute('data-guide-category'),
            btn.getAttribute('data-guide-filename')
        );
    });
}

export function renderSepsisScreenOddsHtml() {
    const odds = getSepsisScreenOdds();
    const rows = odds.map((o) => `
      <li class="finger-stick-odds__row${o.bundle ? ' finger-stick-odds__row--critical' : ''}">
        <span>${escapeHtml(o.label)}</span>
        <span class="finger-stick-odds__pct">${Math.round(o.percent)}%</span>
      </li>`).join('');
    return `
      <div class="finger-stick-odds">
        <p class="finger-stick-odds__title">Sepsis screen outcomes</p>
        <ul class="finger-stick-odds__list">${rows}</ul>
      </div>
    `;
}

/** Attach dice control to sepsis-screen task rows. */
export function decorateSepsisScreenDice(root = document) {
    if (typeof document === 'undefined' || !root?.querySelectorAll) return;
    const nodes = [];
    if (root.matches?.('[data-challenge="sepsis-screen"], [data-task-kind="sepsis-screen"]')) {
        nodes.push(root);
    }
    root.querySelectorAll('[data-challenge="sepsis-screen"], [data-task-kind="sepsis-screen"]').forEach((el) => {
        if (!nodes.includes(el)) nodes.push(el);
    });
    // Also match by name for care-schedule rows without challenge attr yet
    root.querySelectorAll('[data-task-type="assessment"]').forEach((el) => {
        const name = el.querySelector('.font-medium')?.textContent || '';
        if (/sepsis screen/i.test(name) && !nodes.includes(el)) nodes.push(el);
    });

    nodes.forEach((el) => {
        if (el.querySelector('[data-sepsis-screen-dice]')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'orders-trivial-dice';
        btn.setAttribute('data-sepsis-screen-dice', '1');
        btn.setAttribute('title', 'Sepsis screen outcome odds');
        btn.setAttribute('aria-label', 'Show sepsis screen outcome odds');
        btn.innerHTML = '<i class="fas fa-dice" aria-hidden="true"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            toggleSepsisOddsPopover(btn);
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
    oddsPopoverEl.className = 'orders-trivial-odds-popover';
    oddsPopoverEl.hidden = true;
    oddsPopoverEl.innerHTML = renderSepsisScreenOddsHtml();
    document.body.appendChild(oddsPopoverEl);
    return oddsPopoverEl;
}

function positionOddsPopover(anchor) {
    if (!oddsPopoverEl || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popW = oddsPopoverEl.offsetWidth || 240;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    oddsPopoverEl.style.left = `${Math.max(8, left)}px`;
    oddsPopoverEl.style.top = `${rect.bottom + 6}px`;
}

export function showSepsisOddsPopover(anchor) {
    if (typeof document === 'undefined') return;
    const pop = ensureOddsPopover();
    pop.innerHTML = renderSepsisScreenOddsHtml();
    pop.hidden = false;
    oddsAnchorEl = anchor || null;
    positionOddsPopover(anchor);
}

export function hideSepsisOddsPopover() {
    if (!oddsPopoverEl) return;
    oddsPopoverEl.hidden = true;
    oddsAnchorEl = null;
}

function toggleSepsisOddsPopover(anchor) {
    const pop = ensureOddsPopover();
    if (!pop.hidden && oddsAnchorEl === anchor) {
        hideSepsisOddsPopover();
        return;
    }
    showSepsisOddsPopover(anchor);
}

let sepsisDiceUiWired = false;
export function initSepsisScreenDiceUi() {
    if (typeof document === 'undefined' || sepsisDiceUiWired) return;
    sepsisDiceUiWired = true;
    decorateSepsisScreenDice(document);
    document.addEventListener('click', (e) => {
        if (e.target.closest?.('[data-sepsis-screen-dice]')) return;
        if (e.target.closest?.('.orders-trivial-odds-popover')) return;
        hideSepsisOddsPopover();
    });
    window.addEventListener('resize', () => {
        if (oddsAnchorEl) positionOddsPopover(oddsAnchorEl);
    });
}
