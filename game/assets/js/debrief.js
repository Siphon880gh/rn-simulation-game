/**
 * Shift debrief (E6) — short Won/Lost performance meter, optional teaching expand.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import ModalModule from './modal.js';
import { finalizeShiftScore, resolvePerformanceBand } from './scoring.js';

function classifyTasks(tasksMap) {
    const summary = {
        completed: [],
        late: [],
        missed: [],
        inProgress: []
    };

    if (!tasksMap) return summary;

    tasksMap.forEach((task) => {
        const status = task.status;
        if (status === GameConfig.tasks.statuses.COMPLETED) {
            summary.completed.push(task);
        } else if (status === GameConfig.tasks.statuses.OVERDUE) {
            summary.late.push(task);
        } else if (
            status === GameConfig.tasks.statuses.NOT_YET
            || status === GameConfig.tasks.statuses.ACTIVE
        ) {
            summary.missed.push(task);
        } else {
            summary.inProgress.push(task);
        }
    });

    return summary;
}

function buildTeachingNotes(summary, outcome) {
    const notes = [];
    if (summary.late.length) {
        notes.push('Late/overdue work usually means higher-acuity or time-window tasks needed earlier attention.');
    }
    if (summary.missed.length) {
        notes.push('Missed items were still open at shift end — review whether slots were saturated or lower-priority work blocked critical meds.');
    }
    if (!summary.late.length && !summary.missed.length && summary.completed.length) {
        notes.push('Strong pacing: completed work stayed inside availability windows.');
    }
    if (outcome?.guidance) {
        notes.push(outcome.guidance);
    }
    if (!notes.length) {
        notes.push('Run another shift to generate prioritization feedback from timed tasks.');
    }
    notes.push('This is practice feedback for training — not a clinical competency assessment.');
    return notes;
}

function buildPatientNotes(summary) {
    const byPatient = new Map();
    const bump = (task, bucket) => {
        const pid = task.patientId || 'unit';
        if (!byPatient.has(pid)) {
            byPatient.set(pid, { patientId: pid, completed: 0, late: 0, missed: 0 });
        }
        byPatient.get(pid)[bucket] += 1;
    };
    summary.completed.forEach((t) => bump(t, 'completed'));
    summary.late.forEach((t) => bump(t, 'late'));
    summary.missed.forEach((t) => bump(t, 'missed'));

    const patients = gameState.getStateSlice('patients');
    return [...byPatient.values()].map((row) => {
        const p = patients?.get(row.patientId);
        return {
            ...row,
            label: p?.name || row.patientId,
            clinicalStatus: p?.clinicalStatus || 'stable'
        };
    });
}

function recentLogLines(limit = 6) {
    const log = gameState.getStateSlice('shiftLog') || [];
    return log.slice(-limit);
}

export function buildDebriefReport() {
    const tasks = gameState.getStateSlice('tasks');
    const summary = classifyTasks(tasks);
    const counts = {
        completed: summary.completed.length,
        late: summary.late.length,
        missed: summary.missed.length
    };
    const score = finalizeShiftScore();
    const outcome = resolvePerformanceBand(score, counts);
    const notes = buildTeachingNotes(summary, outcome);
    const byPatient = buildPatientNotes(summary);
    const logLines = recentLogLines();

    return {
        summary,
        notes,
        logLines,
        score,
        outcome,
        byPatient,
        counts,
        cheatsUsed: Number(score?.cheatsUsed) || 0,
        challengeFails: Number(score?.challengeFails) || 0,
        challengePasses: Number(score?.challengePasses) || 0
    };
}

function renderTaskList(tasks, emptyLabel) {
    if (!tasks.length) {
        return `<p class="text-sm text-gray-500">${emptyLabel}</p>`;
    }
    const items = tasks.slice(0, 8).map((t) => {
        const patient = t.patientId ? ` <span class="text-gray-400">(${t.patientId})</span>` : '';
        return `<li class="text-sm text-gray-700">${t.name || t.id}${patient}</li>`;
    }).join('');
    const more = tasks.length > 8 ? `<li class="text-xs text-gray-400">+${tasks.length - 8} more</li>` : '';
    return `<ul class="list-disc pl-5 space-y-1 text-left">${items}${more}</ul>`;
}

function renderPatientBreakdown(byPatient) {
    if (!byPatient?.length) {
        return '<p class="text-sm text-gray-500">No per-patient task rows.</p>';
    }
    return `
      <ul class="text-sm text-gray-700 space-y-1 text-left">
        ${byPatient.map((row) => `
          <li>
            <span class="font-medium">${row.label}</span>
            <span class="text-gray-400">(${row.clinicalStatus})</span>
            — ✓${row.completed} · late ${row.late} · open ${row.missed}
          </li>
        `).join('')}
      </ul>
    `;
}

function renderPerformanceMeter(outcome) {
    const steps = outcome?.meter || [];
    if (!steps.length) return '';
    const cells = steps.map((step) => {
        const active = step.active
            ? 'ring-2 ring-offset-1 ring-blue-600 bg-blue-100 border-blue-400 font-semibold'
            : 'bg-gray-50 border-gray-200 text-gray-500';
        const wonTint = step.result === 'won' ? 'text-emerald-800' : 'text-rose-800';
        return `
          <div class="flex-1 min-w-0 rounded border px-1.5 py-2 text-center ${active} ${step.active ? wonTint : ''}"
               data-meter-id="${step.id}" ${step.active ? 'aria-current="true"' : ''}>
            <div class="text-[0.65rem] uppercase tracking-wide leading-tight">${step.label}</div>
          </div>`;
    }).join('');
    return `
      <div class="game-over-meter" role="group" aria-label="Performance meter">
        <div class="flex gap-1 sm:gap-2">${cells}</div>
        <p class="text-xs text-gray-500 mt-2 text-center">
          Getting by and below = Lost · Steady charge and above = Won
        </p>
      </div>`;
}

export function renderShortGameOverHtml(report) {
    const { counts, score, outcome, cheatsUsed } = report;
    const won = outcome?.result === 'won';
    const bannerClass = won
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-rose-200 bg-rose-50 text-rose-900';
    return `
      <div class="space-y-4 text-left" data-game-over-view="short">
        <div class="rounded border p-3 ${bannerClass}">
          <div class="text-xs uppercase tracking-wide opacity-80 mb-1">Performance</div>
          <div class="text-xl font-bold">${outcome.label}</div>
          <p class="text-sm mt-1">${won ? 'You won this practice shift.' : 'You lost this practice shift.'}</p>
        </div>
        ${renderPerformanceMeter(outcome)}
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div class="rounded bg-blue-50 border border-blue-100 p-2">
            <div class="text-lg font-bold text-blue-800">${outcome.total}</div>
            <div class="text-xs text-blue-900">Score</div>
          </div>
          <div class="rounded bg-amber-50 border border-amber-100 p-2">
            <div class="text-lg font-bold text-amber-700">${counts.late}</div>
            <div class="text-xs text-amber-800">Too late</div>
          </div>
          <div class="rounded bg-emerald-50 border border-emerald-100 p-2">
            <div class="text-lg font-bold text-emerald-700">${counts.completed}</div>
            <div class="text-xs text-emerald-800">Completed</div>
          </div>
          <div class="rounded bg-rose-50 border border-rose-100 p-2">
            <div class="text-lg font-bold text-rose-700">${counts.missed}</div>
            <div class="text-xs text-rose-800">Missed</div>
          </div>
          <div class="rounded bg-violet-50 border border-violet-100 p-2 col-span-2 sm:col-span-1">
            <div class="text-lg font-bold text-violet-800">${cheatsUsed}</div>
            <div class="text-xs text-violet-900">Cheated</div>
          </div>
        </div>
        ${score ? `
          <p class="text-xs text-gray-500 text-center">
            Tasks ${score.taskPoints >= 0 ? '+' : ''}${score.taskPoints}
            · Challenges ${score.challengePoints >= 0 ? '+' : ''}${score.challengePoints}
            · Satisfaction ${score.satisfactionPoints >= 0 ? '+' : ''}${score.satisfactionPoints}
          </p>` : ''}
      </div>`;
}

function renderChallengeFailBlock(report) {
    const fails = Number(report.challengeFails) || 0;
    const passes = Number(report.challengePasses) || 0;
    const notes = fails > 0
        ? '<p class="text-sm text-rose-800 mt-2">Wrong answers docked practice points — review expected answers from challenge feedback during the shift.</p>'
        : '<p class="text-sm text-gray-600 mt-2">No incorrect perform answers this shift.</p>';
    return `
      <div class="rounded border border-violet-100 bg-violet-50 p-3 text-left">
        <h4 class="font-semibold text-violet-900 mb-1">Perform challenges</h4>
        <div class="flex gap-4 text-sm text-violet-900">
          <span>Passed: <strong>${passes}</strong></span>
          <span>Failed questions: <strong>${fails}</strong></span>
          <span>Cheats used: <strong>${Number(report.cheatsUsed) || 0}</strong></span>
        </div>
        ${notes}
      </div>`;
}

export function renderDebriefHtml(report) {
    const { counts, summary, notes, logLines, score, outcome, byPatient } = report;
    const outcomeBlock = outcome
        ? `<div class="rounded border border-indigo-200 bg-indigo-50 p-3 text-left" data-outcome-id="${outcome.id}">
            <div class="text-xs uppercase tracking-wide text-indigo-600 mb-1">Practice outcome</div>
            <div class="text-lg font-bold text-indigo-900">${outcome.label} — ${outcome.result === 'won' ? 'Won' : 'Lost'}</div>
            <p class="text-sm text-indigo-800 mt-1">Final practice score: <strong>${outcome.total}</strong></p>
            <p class="text-xs text-indigo-700 mt-2">${outcome.framing}</p>
          </div>`
        : '';
    const scoreBlock = score
        ? `<div class="rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            <div class="font-semibold">Score breakdown</div>
            <div class="text-xs mt-1 text-blue-800">
              Tasks ${score.taskPoints >= 0 ? '+' : ''}${score.taskPoints}
              · Challenges ${score.challengePoints >= 0 ? '+' : ''}${score.challengePoints}
              · Satisfaction ${score.satisfactionPoints >= 0 ? '+' : ''}${score.satisfactionPoints}
            </div>
          </div>`
        : '';
    const logHtml = logLines.length
        ? `<ul class="text-left text-xs text-gray-600 space-y-1 max-h-28 overflow-y-auto border border-gray-100 rounded p-2 bg-gray-50">
            ${logLines.map((e) => `<li><span class="text-gray-400">${e.timeLabel || '—'}</span> ${e.message}</li>`).join('')}
           </ul>`
        : '<p class="text-sm text-gray-500">No shift log entries.</p>';

    return `
      <div class="space-y-4 text-left" data-game-over-view="debrief">
        <p class="text-sm text-gray-600">Teaching debrief — prioritization, score, and perform-challenge results.</p>
        ${outcomeBlock}
        ${scoreBlock}
        ${renderChallengeFailBlock(report)}
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded bg-emerald-50 border border-emerald-100 p-2">
            <div class="text-lg font-bold text-emerald-700">${counts.completed}</div>
            <div class="text-xs text-emerald-800">Completed</div>
          </div>
          <div class="rounded bg-amber-50 border border-amber-100 p-2">
            <div class="text-lg font-bold text-amber-700">${counts.late}</div>
            <div class="text-xs text-amber-800">Too late</div>
          </div>
          <div class="rounded bg-rose-50 border border-rose-100 p-2">
            <div class="text-lg font-bold text-rose-700">${counts.missed}</div>
            <div class="text-xs text-rose-800">Missed / open</div>
          </div>
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">By patient</h4>
          ${renderPatientBreakdown(byPatient)}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">Completed</h4>
          ${renderTaskList(summary.completed, 'None completed.')}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">Late / overdue</h4>
          ${renderTaskList(summary.late, 'None overdue.')}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">Missed / still open</h4>
          ${renderTaskList(summary.missed, 'None left open.')}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">Teaching notes</h4>
          <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
            ${notes.map((n) => `<li>${n}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 mb-1">Recent shift log</h4>
          ${logHtml}
        </div>
      </div>
    `;
}

function shortFooterHtml() {
    return `
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700"
              data-game-over-action="show-debrief">Show debrief</button>
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
              onclick="closeModal()">Close</button>`;
}

function debriefFooterHtml() {
    return `
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              data-game-over-action="show-short">Back</button>
      <button type="button" class="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600"
              onclick="closeModal()">Close</button>`;
}

function wireGameOverActions() {
    const modal = document.querySelector(GameConfig.selectors.modal);
    if (!modal || modal._gameOverWired) return;
    modal._gameOverWired = true;
    modal.addEventListener('click', (ev) => {
        const btn = ev.target.closest?.('[data-game-over-action]');
        if (!btn || !lastGameOverReport) return;
        const report = lastGameOverReport;
        const action = btn.getAttribute('data-game-over-action');
        if (action === 'show-debrief') {
            ModalModule.modifyModal(
                'Shift debrief — practice outcome',
                renderDebriefHtml(report),
                debriefFooterHtml()
            );
        } else if (action === 'show-short') {
            const won = report.outcome?.result === 'won';
            ModalModule.modifyModal(
                won ? 'Game Over — Won' : 'Game Over — Lost',
                renderShortGameOverHtml(report),
                shortFooterHtml()
            );
        }
    });
}

let lastGameOverReport = null;

export function showPrioritizationDebrief() {
    const report = buildDebriefReport();
    lastGameOverReport = report;
    const won = report.outcome?.result === 'won';
    ModalModule.openModal({
        title: won ? 'Game Over — Won' : 'Game Over — Lost',
        content: renderShortGameOverHtml(report),
        footer: shortFooterHtml(),
        overlay: true,
        persistent: false
    });
    wireGameOverActions();
    return report;
}

const DebriefModule = {
    buildDebriefReport,
    renderDebriefHtml,
    renderShortGameOverHtml,
    showPrioritizationDebrief,
    init() {
        // Shown from app.handleGameOver so we do not double-open with the bare game-over modal
    }
};

export default DebriefModule;
