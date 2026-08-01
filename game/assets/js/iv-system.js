/**
 * IV module — fluids, IVPB, continuous drips + titration / Heparin PTT tasks.
 * Authored on patient HTML via [data-iv-line]; rates live on patient.ivLines.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { isAtOrAfterInShift, minutesFromShiftAnchor, hhmmToMinutes } from './availability-windows.js';
import { mountTaskDom } from './dynamic-tasks.js';
import { classifyPtt } from './iv-challenge.js';

const spawnedKeys = new Set();

function cfg() {
    return GameConfig.iv || {};
}

function formatHHMM(hhmm) {
    const n = Number(hhmm) || 0;
    return `${String(Math.floor(n / 100)).padStart(2, '0')}:${String(n % 100).padStart(2, '0')}`;
}

function addMinutesToHhmm(hhmm, minutes) {
    const total = (hhmmToMinutes(hhmm) ?? 0) + Number(minutes);
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    return Math.floor(normalized / 60) * 100 + (normalized % 60);
}

function drugLabel(drug) {
    const d = String(drug || '').toLowerCase();
    if (d === 'levophed' || d === 'norepinephrine') return 'Levophed (norepinephrine)';
    if (d === 'neosynephrine' || d === 'phenylephrine' || d === 'neo') return 'Neo-Synephrine (phenylephrine)';
    if (d === 'vasopressin' || d === 'vaso') return 'Vasopressin';
    if (d === 'dopamine') return 'Dopamine';
    if (d === 'dobutamine') return 'Dobutamine';
    if (d === 'propofol') return 'Propofol';
    if (d === 'precedex' || d === 'dexmedetomidine') return 'Precedex (dexmedetomidine)';
    if (d === 'fentanyl') return 'Fentanyl';
    if (d === 'morphine') return 'Morphine';
    if (d === 'cisatracurium') return 'Cisatracurium';
    if (d === 'heparin') return 'Heparin drip';
    if (d === 'insulin') return 'Insulin drip (regular)';
    return drug || 'IV drip';
}

export function extractIvLinesFromElement(root, patientId) {
    if (!root) return [];
    const nodes = root.querySelectorAll('[data-iv-line]');
    return Array.from(nodes).map((el, index) => {
        const drug = el.getAttribute('data-iv-drug') || el.getAttribute('data-iv-name') || 'line';
        const kind = (el.getAttribute('data-iv-kind') || 'fluid').toLowerCase();
        const startedAt = el.getAttribute('data-iv-started');
        const nextPttAttr = el.getAttribute('data-iv-next-ptt');
        const protocol = el.getAttribute('data-iv-protocol');
        let nextPttAt = nextPttAttr != null ? Number(nextPttAttr) : null;
        if (nextPttAt == null && protocol === 'heparin-ptt' && startedAt != null) {
            nextPttAt = addMinutesToHhmm(
                Number(startedAt),
                cfg().heparinPttIntervalMins ?? 360
            );
        }
        const emptyAtAttr = el.getAttribute('data-iv-empty-at');
        return {
            id: el.id || el.getAttribute('data-iv-id') || `${patientId}-iv-${index}`,
            kind,
            name: el.getAttribute('data-iv-name') || drugLabel(drug),
            drug: String(drug).toLowerCase(),
            rate: el.getAttribute('data-iv-rate') != null
                ? Number(el.getAttribute('data-iv-rate'))
                : null,
            unit: el.getAttribute('data-iv-unit') || '',
            status: el.getAttribute('data-iv-status') || 'running',
            ranAt: el.getAttribute('data-iv-ran-at') || null,
            startedAt: startedAt != null ? Number(startedAt) : null,
            emptyAt: emptyAtAttr != null && emptyAtAttr !== '' ? Number(emptyAtAttr) : null,
            emptiedAt: null,
            protocol: protocol || null,
            nextPttAt,
            lastPtt: null,
            lastPttResult: null
        };
    });
}

export function registerPatientIv(patientId, root) {
    const lines = extractIvLinesFromElement(root, patientId);
    if (!lines.length) return [];
    gameState.dispatch('REGISTER_IV_LINES', { patientId, lines });
    renderPatientIvPanel(patientId);
    return lines;
}

function statusBadge(status) {
    const s = String(status || 'running').toLowerCase();
    if (s === 'empty' || s === 'run-out' || s === 'runout') {
        return '<span class="text-xs px-1.5 py-0.5 rounded bg-rose-600 text-white font-semibold uppercase tracking-wide">bag empty</span>';
    }
    if (s === 'complete' || s === 'ran') {
        return '<span class="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">ran / complete</span>';
    }
    if (s === 'held') {
        return '<span class="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">held</span>';
    }
    if (s === 'due') {
        return '<span class="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">due</span>';
    }
    if (s === 'idle') {
        return '<span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">idle</span>';
    }
    return '<span class="text-xs px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">running</span>';
}

function replaceTaskName(line) {
    const label = line?.name || 'IV';
    const kind = String(line?.kind || 'fluid').toLowerCase();
    if (kind === 'ivpb') return `Replace IVPB (${label})`;
    if (kind === 'drip') return `Replace IV solution (${label})`;
    return `Replace IV solution (${label})`;
}

function kindIcon(kind) {
    if (kind === 'drip') return 'fa-syringe text-teal-600';
    if (kind === 'ivpb') return 'fa-flask text-indigo-500';
    return 'fa-tint text-blue-500';
}

export function renderPatientIvPanel(patientId) {
    const host = document.querySelector(
        `.patient-panel-host[data-patient-id="${patientId}"] [data-iv-panel]`
    );
    if (!host) return;
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    const lines = patient?.ivLines || [];
    if (!lines.length) {
        host.innerHTML = '<li class="text-sm text-gray-500 px-2">No IV lines charted.</li>';
        return;
    }

    host.innerHTML = lines.map((line) => {
        const rateText = line.rate != null && line.unit
            ? `${line.rate} ${line.unit}`
            : (line.rate != null ? String(line.rate) : '—');
        const empty = ['empty', 'run-out', 'runout'].includes(String(line.status || '').toLowerCase());
        const extra = [];
        if (empty) {
            extra.push(line.emptiedAt != null
                ? `Ran out ${formatHHMM(line.emptiedAt)} — replace needed`
                : 'Ran out — replace needed');
        }
        if (line.kind === 'ivpb' && line.ranAt) {
            extra.push(`IVPB ran ${formatHHMM(line.ranAt)}`);
        }
        if (line.protocol === 'heparin-ptt' && line.nextPttAt != null) {
            extra.push(`Next PTT ${formatHHMM(line.nextPttAt)}`);
        }
        if (line.lastPttResult) {
            extra.push(`Last PTT: ${line.lastPttResult}`);
        }
        const tileClass = empty
            ? 'bg-rose-50 p-3 rounded-lg shadow border-2 border-rose-400 flex items-start gap-3 ring-2 ring-rose-200'
            : 'bg-white p-3 rounded-lg shadow border border-gray-100 flex items-start gap-3';
        return `
          <li class="${tileClass}"
              data-iv-id="${line.id}" data-iv-drug="${line.drug}" data-iv-kind="${line.kind}"
              ${empty ? 'data-iv-empty="1"' : ''}>
            <i class="fas ${empty ? 'fa-exclamation-triangle text-rose-600' : kindIcon(line.kind)} text-xl mt-0.5"></i>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-gray-900">${line.name}</span>
                ${statusBadge(line.status)}
                <span class="text-xs uppercase tracking-wide text-gray-400">${line.kind}</span>
              </div>
              <p class="text-sm text-gray-700 mt-0.5">Rate: <strong class="iv-rate">${empty ? '—' : rateText}</strong></p>
              ${extra.length ? `<p class="text-xs ${empty ? 'text-rose-700 font-medium' : 'text-gray-500'} mt-0.5">${extra.join(' · ')}</p>` : ''}
            </div>
          </li>`;
    }).join('');
}

function findDripLine(patientId, drug) {
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    const want = String(drug || '').toLowerCase();
    return (patient?.ivLines || []).find((l) => (
        l.kind === 'drip' && String(l.drug).toLowerCase() === want
    )) || null;
}

function createIvTask(spec) {
    const key = spec.id;
    if (spawnedKeys.has(key)) return null;
    if (gameState.getStateSlice('tasks')?.has(key)) {
        spawnedKeys.add(key);
        return null;
    }
    spawnedKeys.add(key);
    const created = taskSystem.createTask({
        id: key,
        type: 'iv',
        taskClass: spec.taskClass || GameConfig.tasks.classes.URGENT,
        name: spec.name,
        scheduled: spec.scheduled,
        expire: spec.expire != null ? spec.expire : '+60',
        durationMins: spec.durationMins ?? 10,
        patientId: spec.patientId,
        metadata: {
            challenge: spec.challenge,
            drug: spec.drug,
            brand: spec.brand,
            unit: spec.unit,
            currentRate: spec.currentRate,
            direction: spec.direction,
            sbp: spec.sbp,
            map: spec.map,
            target: spec.target,
            pttResult: spec.pttResult,
            lineId: spec.lineId,
            lineKind: spec.lineKind,
            ivLineName: spec.ivLineName,
            ivKind: spec.lineKind || spec.challenge,
            incident: true
        }
    });
    taskSystem.processTasks(gameState.getStateSlice('currentTime') || spec.scheduled);
    const live = gameState.getStateSlice('tasks')?.get(created.id) || created;
    mountTaskDom(live);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: spec.logMessage || `IV task: ${spec.name}`,
        timeLabel: formatHHMM(spec.scheduled)
    });
    return live;
}

function processHeparinPtt(currentTime) {
    const patients = gameState.getStateSlice('patients');
    if (!patients) return;
    patients.forEach((patient, patientId) => {
        (patient.ivLines || []).forEach((line) => {
            if (line.protocol !== 'heparin-ptt' || line.nextPttAt == null) return;
            if (!isAtOrAfterInShift(currentTime, line.nextPttAt)) return;
            const taskId = `${patientId}-heparin-ptt-${line.nextPttAt}`;
            createIvTask({
                id: taskId,
                patientId,
                name: 'Heparin PTT check + drip adjust',
                scheduled: line.nextPttAt,
                expire: '+90',
                challenge: 'heparin-ptt',
                drug: 'heparin',
                unit: line.unit || 'units/kg/hr',
                currentRate: line.rate,
                lineId: line.id,
                logMessage: `Heparin PTT due for ${patient.name || patientId}`
            });
        });
    });
}

function processTitrationIncidents(currentTime) {
    const incidents = cfg().titrationIncidents || [];
    incidents.forEach((inc) => {
        if (!inc?.id || !isAtOrAfterInShift(currentTime, inc.at)) return;
        const key = `iv-titration-${inc.id}`;
        if (spawnedKeys.has(key)) return;
        const line = findDripLine(inc.patientId, inc.drug);
        if (!line) {
            spawnedKeys.add(key);
            return;
        }
        const target = String(inc.target || (inc.map != null ? 'map' : 'sbp')).toLowerCase();
        const direction = inc.direction
            || (target === 'map'
                ? (Number(inc.map) < 65 ? 'increase' : 'decrease')
                : (Number(inc.sbp) < 90 ? 'increase' : 'decrease'));
        const targetLabel = target === 'map'
            ? `MAP ${inc.map}`
            : `SBP ${inc.sbp}`;
        createIvTask({
            id: key,
            patientId: inc.patientId,
            name: `Titrate ${drugLabel(inc.drug)} (${targetLabel})`,
            scheduled: inc.at,
            expire: '+45',
            challenge: 'iv-titration',
            drug: inc.drug,
            brand: inc.brand || drugLabel(inc.drug),
            unit: line.unit || 'mcg/min',
            currentRate: line.rate,
            direction,
            sbp: inc.sbp,
            map: inc.map,
            target,
            lineId: line.id,
            logMessage: `BP incident: ${targetLabel} — titrate ${drugLabel(inc.drug)}`
        });
    });
}

/** Authored data-iv-empty-at: mark bag empty + spawn Replace IV solution / IVPB task. */
function processEmptyBags(currentTime) {
    const patients = gameState.getStateSlice('patients');
    if (!patients) return;
    patients.forEach((patient, patientId) => {
        (patient.ivLines || []).forEach((line) => {
            if (line.emptyAt == null) return;
            if (!isAtOrAfterInShift(currentTime, line.emptyAt)) return;
            const status = String(line.status || '').toLowerCase();
            if (status === 'empty' || status === 'run-out' || status === 'runout') {
                // Already empty — ensure replace task exists once.
            } else if (status !== 'running' && status !== 'due') {
                return;
            } else {
                gameState.dispatch('UPDATE_IV_LINE', {
                    patientId,
                    lineId: line.id,
                    patch: {
                        status: 'empty',
                        emptiedAt: line.emptyAt,
                        rate: line.kind === 'ivpb' ? null : line.rate
                    }
                });
            }
            const taskId = `${patientId}-iv-replace-${line.id}-${line.emptyAt}`;
            if (spawnedKeys.has(taskId)) return;
            createIvTask({
                id: taskId,
                patientId,
                name: replaceTaskName(line),
                scheduled: line.emptyAt,
                expire: '+90',
                challenge: 'iv-replace',
                drug: line.drug,
                unit: line.unit || '',
                currentRate: line.rate,
                lineId: line.id,
                lineKind: line.kind,
                ivLineName: line.name,
                logMessage: `IV bag empty: ${line.name} — ${replaceTaskName(line)}`
            });
        });
    });
}

/** After a successful IV challenge, apply new rate and advance Heparin PTT clock. */
export function applyIvChallengeResult(task, prompt) {
    if (!task?.patientId || !prompt) return;
    const lineId = task.metadata?.lineId;
    if (!lineId) return;
    const newRate = Number(prompt.expected);
    const patch = {
        rate: newRate,
        status: 'running'
    };
    if (prompt.kind === 'heparin-ptt') {
        const now = gameState.getStateSlice('currentTime');
        patch.lastPtt = now;
        patch.lastPttResult = prompt.pttLabel || classifyPtt(prompt.pttResult);
        patch.nextPttAt = addMinutesToHhmm(now, cfg().heparinPttIntervalMins ?? 360);
    }
    gameState.dispatch('UPDATE_IV_LINE', {
        patientId: task.patientId,
        lineId,
        patch
    });
    renderPatientIvPanel(task.patientId);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `IV updated: ${task.metadata?.drug || 'drip'} → ${newRate} ${task.metadata?.unit || ''}`.trim(),
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
}

/** After a successful IV bag replace challenge, restore running status on the line. */
export function applyIvReplaceResult(task) {
    if (!task?.patientId) return;
    const lineId = task.metadata?.lineId;
    if (!lineId) return;
    const line = getIvLine(task.patientId, lineId);
    const patch = {
        status: 'running',
        emptyAt: null,
        emptiedAt: null
    };
    if (line?.rate != null) patch.rate = line.rate;
    gameState.dispatch('UPDATE_IV_LINE', {
        patientId: task.patientId,
        lineId,
        patch
    });
    renderPatientIvPanel(task.patientId);
    gameState.dispatch('APPEND_SHIFT_LOG', {
        message: `IV replaced: ${task.metadata?.ivLineName || task.name || 'line'} running again`,
        timeLabel: formatHHMM(gameState.getStateSlice('currentTime'))
    });
}

export function getIvLine(patientId, lineId) {
    const patient = gameState.getStateSlice('patients')?.get(patientId);
    return (patient?.ivLines || []).find((l) => l.id === lineId) || null;
}

/** Refresh challenge metadata currentRate from live IV line before perform. */
export function syncIvTaskMetadata(task) {
    if (!task?.metadata?.lineId || !task.patientId) return task;
    const line = getIvLine(task.patientId, task.metadata.lineId);
    if (!line) return task;
    const next = {
        ...task,
        metadata: {
            ...task.metadata,
            currentRate: line.rate,
            unit: line.unit || task.metadata.unit
        }
    };
    return next;
}

function onTime(currentTime) {
    if (currentTime == null) return;
    processHeparinPtt(currentTime);
    processTitrationIncidents(currentTime);
    processEmptyBags(currentTime);
    const patients = gameState.getStateSlice('patients');
    patients?.forEach((_, patientId) => renderPatientIvPanel(patientId));
}

export function initIvSystem() {
    spawnedKeys.clear();
    gameState.subscribe('currentTime', (t) => onTime(t));
    gameState.subscribe('patients', () => {
        const patients = gameState.getStateSlice('patients');
        patients?.forEach((_, patientId) => renderPatientIvPanel(patientId));
    });
}

export { addMinutesToHhmm as _addMinutesToHhmm, minutesFromShiftAnchor as _minutesFromShift };

const IvSystemModule = {
    init: initIvSystem,
    registerPatientIv,
    extractIvLinesFromElement,
    renderPatientIvPanel,
    applyIvChallengeResult,
    applyIvReplaceResult,
    syncIvTaskMetadata,
    getIvLine,
    _addMinutesToHhmm: addMinutesToHhmm,
    _minutesFromShift: minutesFromShiftAnchor
};

export default IvSystemModule;
