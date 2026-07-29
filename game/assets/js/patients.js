// patients.js - Declarative patient management system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';
import { registerPatientIv } from './iv-system.js';
import { loadPastHxPack, ensurePastHxTimeline } from './past-hx-timeline.js';

const PatientsModule = (() => {
    console.log("Patients module initialized");

    // Patient data structure
    const patientConfigs = {
        joe: {
            id: 'joe',
            name: 'Joe Johnson',
            room: 'Room 201-A',
            age: 68,
            sex: 'Male',
            diagnosis: 'Post-op Total Hip Replacement',
            /** BMI 38 + post-op mobility limits → pressure-injury risk */
            careSchedules: ['turnQ2h'],
            careReason: 'BMI 38; limited mobility post THA — cannot self-reposition',
            vitals: {
                hr: 82,
                bp: '128/78',
                temp: '98.6°F',
                o2: '96%',
                pain: '1/10 R hip',
                rr: 18
            },
            htmlFile: 'events/patients/joe.html',
            pastHxFile: 'events/patients/joe-past-hx.json'
        },
        maria: {
            id: 'maria',
            name: 'Maria Santos',
            room: 'Room 204-B',
            age: 54,
            sex: 'Female',
            diagnosis: 'Community-acquired pneumonia',
            /** Bedbound / too weak to turn independently */
            careSchedules: ['turnQ2h'],
            careReason: 'Bedbound; profound weakness on pressors — cannot self-turn',
            vitals: {
                hr: 94,
                bp: '118/72',
                temp: '100.8°F',
                o2: '93% on 2L NC',
                pain: '0/10',
                rr: 22
            },
            htmlFile: 'events/patients/maria.html',
            pastHxFile: 'events/patients/maria-past-hx.json'
        },
        derek: {
            id: 'derek',
            name: 'Derek Nguyen',
            room: 'Room 203-A',
            age: 71,
            sex: 'Male',
            diagnosis: 'COPD exacerbation',
            /** Prior CVA residual weakness + obesity → Q2H turns */
            careSchedules: ['turnQ2h'],
            careReason: 'Class III obesity; prior CVA with residual weakness — bedbound',
            htmlFile: 'events/patients/derek.html',
            pastHxFile: 'events/patients/derek-past-hx.json'
        },
        aisha: {
            id: 'aisha',
            name: 'Aisha Rahman',
            room: 'Room 205-C',
            age: 29,
            sex: 'Female',
            diagnosis: 'DKA resolving',
            htmlFile: 'events/patients/aisha.html',
            pastHxFile: 'events/patients/aisha-past-hx.json'
        },
        robert: {
            id: 'robert',
            name: 'Robert Hale',
            room: 'Room 202-B',
            age: 62,
            sex: 'Male',
            diagnosis: 'NSTEMI rule-out',
            htmlFile: 'events/patients/robert.html',
            pastHxFile: 'events/patients/robert-past-hx.json'
        },
        lin: {
            id: 'lin',
            name: 'Lin Chen',
            room: 'Room 206-A',
            age: 45,
            sex: 'Female',
            diagnosis: 'Post-op lap cholecystectomy',
            htmlFile: 'events/patients/lin.html',
            pastHxFile: 'events/patients/lin-past-hx.json'
        }
    };

    let panelMode = 'patient'; // 'patient' | 'global'

    function addMinutesToHhmm(hhmm, minutes) {
        const n = Number(hhmm);
        const base = Number.isFinite(n) ? n : 0;
        const total = Math.floor(base / 100) * 60 + (base % 100) + Number(minutes);
        const day = ((total % 1440) + 1440) % 1440;
        return Math.floor(day / 60) * 100 + (day % 60);
    }

    function resolveCareScheduleKeys(patientConfig, html) {
        const keys = new Set(
            Array.isArray(patientConfig.careSchedules) ? patientConfig.careSchedules : []
        );
        let careReason = patientConfig.careReason || null;
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const root = doc.querySelector('.patient[data-care-schedule], [data-care-schedule]');
            const raw = root?.getAttribute('data-care-schedule') || '';
            const schedules = GameConfig.careSchedules || {};
            raw.split(/[,\s]+/).filter(Boolean).forEach((token) => {
                const match = Object.entries(schedules).find(
                    ([, cfg]) => cfg.htmlAttr === token || cfg.id === token
                );
                if (match) keys.add(match[0]);
                else if (schedules[token]) keys.add(token);
            });
            const reason = root?.getAttribute('data-care-reason');
            if (reason) careReason = reason;
        } catch {
            /* ignore parse errors — config keys still apply */
        }
        return { keys: [...keys], careReason };
    }

    function shiftStartHhmm() {
        const pack = gameState.getStateSlice('scenarioPack');
        const start = Number(pack?.shiftStart ?? GameConfig.timer.defaultShiftStart);
        return Number.isFinite(start) ? start : GameConfig.timer.defaultShiftStart;
    }

    function buildCareScheduleTasks(patientId, scheduleKey, careReason) {
        const cfg = GameConfig.careSchedules?.[scheduleKey];
        if (!cfg) return [];
        const shiftStart = shiftStartHhmm();
        const hours = Number(gameState.getStateSlice('scenarioPack')?.shiftDurationHours);
        const shiftMins = Number.isFinite(hours) && hours > 0
            ? hours * 60
            : Number(GameConfig.timer.defaultShiftDuration) || 720;
        const interval = Number(cfg.intervalMins) || 120;
        const tasks = [];
        for (let elapsed = 0; elapsed < shiftMins; elapsed += interval) {
            const scheduled = addMinutesToHhmm(shiftStart, elapsed);
            tasks.push({
                id: `${patientId}-${scheduleKey}-${String(scheduled).padStart(4, '0')}`,
                name: cfg.taskName || 'Care task',
                type: cfg.taskType || 'assessment',
                taskClass: cfg.taskClass || GameConfig.tasks.classes.ROUTINE,
                scheduled,
                expire: `+${Number(cfg.expireMins) || 60}`,
                durationMins: Number(cfg.durationMins) || 10,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: {
                    careSchedule: scheduleKey,
                    reason: careReason || null,
                    delegateMode: scheduleKey === 'turnQ2h' ? 'team' : undefined
                }
            });
        }
        return tasks;
    }

    /** CNA/CCT solo requests — bathroom, water, bed position, pillow, linen (instant delegate). */
    function buildSoloRequestTasks(patientId, patientIndex = 0) {
        const catalog = GameConfig.delegation?.soloRequestCatalog || [];
        if (!catalog.length) return [];
        const shiftStart = shiftStartHhmm();
        return catalog.map((spec, i) => {
            const scheduled = addMinutesToHhmm(
                shiftStart,
                45 + (Number(patientIndex) || 0) * 20 + i * 55
            );
            return {
                id: `${patientId}-cna-${spec.id}`,
                name: spec.name || 'Patient request',
                type: 'assessment',
                taskClass: GameConfig.tasks.classes.ROUTINE,
                scheduled,
                expire: `+${Number(spec.expireMins) || 60}`,
                durationMins: Number(spec.durationMins) || 5,
                status: GameConfig.tasks.statuses.NOT_YET,
                metadata: {
                    delegateMode: 'solo',
                    cnaRequest: spec.id,
                    icon: spec.icon || 'fas fa-hands-helping'
                }
            };
        });
    }

    function mountSoloRequestTasks(patientId, soloTasks) {
        if (!soloTasks.length) return;
        const panel = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
        if (!panel) return;

        let list = panel.querySelector('.care-solo-list');
        if (!list) {
            const block = document.createElement('div');
            block.className = 'space-y-2 mb-4 care-solo-block';
            const heading = document.createElement('h4');
            heading.className = 'font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100';
            heading.innerHTML = '<i class="fas fa-hands-helping text-xl mr-1 text-violet-600"></i> Patient requests (CNA)';
            list = document.createElement('ul');
            list.className = 'care-solo-list space-y-3';
            heading.addEventListener('click', () => list.classList.toggle('hidden'));
            block.appendChild(heading);
            const note = document.createElement('p');
            note.className = 'text-xs text-gray-600 mb-2';
            note.textContent = 'Delegate: they do this · instant (bathroom, water, bed position, pillow, linen)';
            block.appendChild(note);
            block.appendChild(list);
            const patientRoot = panel.querySelector('.patient') || panel;
            const vitalsGrid = patientRoot.querySelector('.grid.grid-cols-2');
            if (vitalsGrid?.nextSibling) {
                patientRoot.insertBefore(block, vitalsGrid.nextSibling);
            } else {
                const medsBlock = patientRoot.querySelector('.meds-list')?.closest('.space-y-2.mb-4, .space-y-2');
                if (medsBlock) patientRoot.insertBefore(block, medsBlock);
                else patientRoot.appendChild(block);
            }
        } else {
            list.replaceChildren();
            const heading = list.previousElementSibling;
            if (heading && !panel.querySelector('.care-solo-block .text-xs')) {
                /* keep authored heading */
            }
        }

        soloTasks.forEach((task) => {
            if (document.getElementById(task.id)) return;
            const live = gameState.getStateSlice('tasks').get(task.id) || task;
            const li = document.createElement('li');
            li.id = live.id;
            li.setAttribute('data-task-type', live.type);
            li.setAttribute('data-task-class', live.taskClass || 'routine');
            li.setAttribute('data-status', live.status);
            li.setAttribute('data-scheduled', String(live.scheduled).padStart(4, '0'));
            li.setAttribute('data-delegate-mode', 'solo');
            if (live.expire != null) {
                li.setAttribute(
                    'data-expire',
                    typeof live.expire === 'number'
                        ? String(live.expire).padStart(4, '0')
                        : String(live.expire)
                );
            }
            li.setAttribute('data-duration-mins', String(live.duration || 5));
            li.setAttribute('title', 'Select a CNA then click — they do this · instant');
            li.className = `bg-violet-50 p-4 rounded-lg shadow flex items-center task-status-${live.status} border border-violet-200`;
            const timeLabel = String(live.scheduled).padStart(4, '0');
            const icon = live.metadata?.icon || 'fas fa-hands-helping';
            li.innerHTML = `
              <data class="slot-label" value="1"></data>
              <i class="${icon} text-violet-600 text-xl mr-3"></i>
              <span class="font-medium text-gray-900">${live.name}</span>
              <span class="ml-auto text-sm text-gray-500">${timeLabel.slice(0, 2)}:${timeLabel.slice(2)}</span>
            `;
            list.appendChild(li);
            taskSystem.syncTaskWindowDomAttrs?.(li, live);
        });
    }

    function mountCareScheduleTasks(patientId, careTasks, careReason) {
        if (!careTasks.length) return;
        const panel = document.querySelector(`.patient-panel-host[data-patient-id="${patientId}"]`);
        if (!panel) return;

        let list = panel.querySelector('.care-tasks-list');
        if (!list) {
            const block = document.createElement('div');
            block.className = 'space-y-2 mb-4 care-tasks-block';
            const heading = document.createElement('h4');
            heading.className = 'font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100';
            heading.innerHTML = '<i class="fas fa-bed text-xl mr-1 text-emerald-700"></i> Turning / skin care';
            list = document.createElement('ul');
            list.className = 'care-tasks-list space-y-3';
            heading.addEventListener('click', () => {
                list.classList.toggle('hidden');
            });
            block.appendChild(heading);
            if (careReason) {
                const note = document.createElement('p');
                note.className = 'text-xs text-gray-600 mb-2 care-schedule-reason';
                note.textContent = careReason;
                block.appendChild(note);
            }
            block.appendChild(list);
            const patientRoot = panel.querySelector('.patient') || panel;
            const vitalsGrid = patientRoot.querySelector('.grid.grid-cols-2');
            if (vitalsGrid?.nextSibling) {
                patientRoot.insertBefore(block, vitalsGrid.nextSibling);
            } else {
                const medsBlock = patientRoot.querySelector('.meds-list')?.closest('.space-y-2.mb-4, .space-y-2');
                if (medsBlock) patientRoot.insertBefore(block, medsBlock);
                else patientRoot.appendChild(block);
            }
        } else if (careReason && !panel.querySelector('.care-schedule-reason')) {
            const note = document.createElement('p');
            note.className = 'text-xs text-gray-600 mb-2 care-schedule-reason';
            note.textContent = careReason;
            list.parentElement?.insertBefore(note, list);
        }

        careTasks.forEach((task) => {
            if (document.getElementById(task.id)) return;
            const live = gameState.getStateSlice('tasks').get(task.id) || task;
            const li = document.createElement('li');
            li.id = live.id;
            li.setAttribute('data-task-type', live.type);
            li.setAttribute('data-task-class', live.taskClass || 'routine');
            li.setAttribute('data-status', live.status);
            li.setAttribute('data-scheduled', String(live.scheduled).padStart(4, '0'));
            if (live.expire != null) {
                li.setAttribute(
                    'data-expire',
                    typeof live.expire === 'number'
                        ? String(live.expire).padStart(4, '0')
                        : String(live.expire)
                );
            }
            li.setAttribute('data-duration-mins', String(live.duration || 10));
            li.setAttribute('data-delegate-mode', 'team');
            li.setAttribute('title', 'Click for Perform / Details menu');
            li.className = `bg-emerald-50 p-4 rounded-lg shadow flex items-center task-status-${live.status} border border-emerald-200`;
            const timeLabel = String(live.scheduled).padStart(4, '0');
            li.innerHTML = `
              <data class="slot-label" value="1"></data>
              <i class="fas fa-bed text-emerald-700 text-xl mr-3"></i>
              <span class="font-medium text-gray-900">${live.name}</span>
              <span class="ml-auto text-sm text-gray-500">${timeLabel.slice(0, 2)}:${timeLabel.slice(2)}</span>
            `;
            list.appendChild(li);
            taskSystem.syncTaskWindowDomAttrs?.(li, live);
        });
    }

    // Declarative patient initialization
    // options.skipPackTasks — admit spawn: panel only; checklist comes from admission-system
    // options.admissionPhase — 'admitting' | 'admitted' | null
    const initializePatient = async (patientConfig, options = {}) => {
        try {
            // Load patient HTML template
            const response = await fetch(patientConfig.htmlFile);
            const html = await response.text();
            
            let pastHxPack = { displayName: patientConfig.name, pastHx: [] };
            if (patientConfig.pastHxFile) {
                try {
                    pastHxPack = await loadPastHxPack(patientConfig.pastHxFile);
                    if (!pastHxPack.displayName) {
                        pastHxPack.displayName = patientConfig.name;
                    }
                } catch (pastHxError) {
                    console.warn(`Past hx unavailable for ${patientConfig.id}:`, pastHxError);
                }
            }

            // Pack may raise starting acuity (e.g. ICU assignment)
            const pack = gameState.getStateSlice('scenarioPack');
            const overrides = pack?.patientOverrides?.[patientConfig.id] || {};
            const clinicalStatus = overrides.clinicalStatus || 'stable';
            const acuityScore = Number.isFinite(Number(overrides.acuityScore))
                ? Number(overrides.acuityScore)
                : 0;

            const skipPackTasks = Boolean(options.skipPackTasks);
            const packTasks = extractTasksFromHTML(html, patientConfig.id)
                // Catalog-driven solo requests replace authored CNA linen rows
                .filter((t) => t.metadata?.delegateMode !== 'solo' && !String(t.id).includes('-linen-solo'));
            const { keys: careKeys, careReason } = resolveCareScheduleKeys(patientConfig, html);
            const careTasks = skipPackTasks
                ? []
                : careKeys.flatMap((key) => buildCareScheduleTasks(patientConfig.id, key, careReason));
            const patientIndex = gameState.getStateSlice('patients')?.size || 0;
            const soloTasks = skipPackTasks
                ? []
                : buildSoloRequestTasks(patientConfig.id, patientIndex);

            // Create patient data model
            const patient = {
                ...patientConfig,
                careReason,
                tasks: skipPackTasks ? [] : [...packTasks, ...careTasks, ...soloTasks],
                pastHx: pastHxPack.pastHx || [],
                pastHxPack,
                status: 'active',
                clinicalStatus,
                clinicalStatusReason: overrides.clinicalStatusReason
                    || (options.admissionPhase === 'admitting' ? 'New admission' : null),
                acuityScore,
                admissionPhase: options.admissionPhase || null,
                loadedAt: new Date().toISOString()
            };

            // Register patient in game state
            gameState.dispatch('REGISTER_PATIENT', { patient });
            
            // Register patient tasks in task system (skipped for mid-shift admits)
            if (!skipPackTasks) {
                patient.tasks.forEach((taskData) => {
                    taskSystem.createTask({
                        ...taskData,
                        patientId: patient.id
                    });
                });
            }

            // Render patient in UI (all packs stay mounted; swap via activePatientId)
            renderPatient(patient, html);

            if (skipPackTasks) {
                const panelHost = document.querySelector(
                    `.patient-panel-host[data-patient-id="${patient.id}"]`
                );
                panelHost?.querySelectorAll('[data-task-type]').forEach((el) => el.remove());
            } else {
                if (careTasks.length) {
                    mountCareScheduleTasks(patient.id, careTasks, careReason);
                }
                if (soloTasks.length) {
                    // Drop authored single-linen CNA blocks; remount full catalog
                    const host = document.querySelector(
                        `.patient-panel-host[data-patient-id="${patient.id}"]`
                    );
                    host?.querySelectorAll('.care-solo-list [data-delegate-mode="solo"]').forEach((el) => el.remove());
                    mountSoloRequestTasks(patient.id, soloTasks);
                }
            }

            // E3.M3: write absolute expire (+ resolved) onto DOM for reveal rules / window phase
            syncMountedTaskWindows(patient);
            paintInitialClinicalStatus(patient);

            // IV panel: fluids / IVPB / drips from [data-iv-line]
            const panelHost = document.querySelector(
                `.patient-panel-host[data-patient-id="${patient.id}"]`
            );
            if (panelHost) {
                registerPatientIv(patient.id, panelHost);
            }

            console.log(`Patient ${patient.name} initialized with ${patient.tasks.length} tasks`);
            return patient;
            
        } catch (error) {
            console.error('Failed to initialize patient:', error);
            throw error;
        }
    };

    // Extract tasks from HTML in a declarative way
    const extractTasksFromHTML = (html, patientId) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const taskElements = doc.querySelectorAll('[data-task-type]');
        
        return Array.from(taskElements).map((element, index) => {
            const challenge = element.getAttribute('data-challenge');
            const metadata = {};
            if (challenge) metadata.challenge = challenge;
            if (element.getAttribute('data-iv-drug')) {
                metadata.drug = element.getAttribute('data-iv-drug');
            }
            if (element.getAttribute('data-iv-line-id')) {
                metadata.lineId = element.getAttribute('data-iv-line-id');
            }
            if (element.getAttribute('data-iv-unit')) {
                metadata.unit = element.getAttribute('data-iv-unit');
            }
            if (element.getAttribute('data-iv-rate') != null) {
                metadata.currentRate = Number(element.getAttribute('data-iv-rate'));
            }
            const delegateMode = element.getAttribute('data-delegate-mode');
            if (delegateMode) metadata.delegateMode = delegateMode;
            return {
                id: element.id || `${patientId}-task-${index}`,
                name: element.querySelector('.font-medium')?.textContent || 'Unknown Task',
                type: element.getAttribute('data-task-type'),
                taskClass: element.getAttribute('data-task-class') || GameConfig.tasks.classes.ROUTINE,
                scheduled: element.getAttribute('data-scheduled'),
                expire: element.getAttribute('data-expire'),
                durationMins: parseInt(element.getAttribute('data-duration-mins')) || 0,
                status: element.getAttribute('data-status') || GameConfig.tasks.statuses.NOT_YET,
                metadata,
                element: element.outerHTML
            };
        });
    };

    // Declarative patient rendering — keep hosts mounted for efficient swap
    const renderPatient = (patient, html) => {
        const patientsContainer = document.querySelector(GameConfig.selectors.patients);
        if (!patientsContainer) {
            console.error('Patients container not found');
            return;
        }

        const host = document.createElement('div');
        host.className = 'patient-panel-host';
        host.setAttribute('data-patient-id', patient.id);
        host.setAttribute('role', 'tabpanel');
        host.innerHTML = html;

        patientsContainer.appendChild(host);
        setupPatientInteractions(patient, host);
    };

    /** Show pack-driven starting acuity on the panel header (ICU etc.). */
    const paintInitialClinicalStatus = (patient) => {
        const status = patient?.clinicalStatus || 'stable';
        if (status === 'stable') return;
        const host = document.querySelector(`.patient-panel-host[data-patient-id="${patient.id}"]`);
        if (!host) return;
        let badge = host.querySelector('[data-clinical-status]');
        if (!badge) {
            const header = host.querySelector('.patient .flex, .patient > div');
            badge = document.createElement('span');
            badge.className = 'text-xs font-semibold px-2 py-0.5 rounded ml-2 clinical-status-badge';
            if (header) header.appendChild(badge);
            else host.prepend(badge);
        }
        badge.setAttribute('data-clinical-status', status);
        badge.textContent = status;
        badge.classList.toggle('is-watch', status === 'watch');
        badge.classList.toggle('is-worsening', status === 'worsening');
        badge.classList.toggle('is-critical', status === 'critical');
    };

    const syncMountedTaskWindows = (patient) => {
        const host = document.querySelector(`.patient-panel-host[data-patient-id="${patient.id}"]`);
        if (!host) return;
        const elements = host.querySelectorAll('[data-task-type]');
        elements.forEach((el, index) => {
            const taskId = el.id || patient.tasks[index]?.id;
            if (!el.id && taskId) el.id = taskId;
            const task = gameState.getStateSlice('tasks')?.get(taskId);
            if (task) {
                taskSystem.syncTaskWindowDomAttrs(el, task);
            }
        });
    };

    const updateCensusMeta = () => {
        const patients = gameState.getStateSlice('patients');
        const count = patients ? patients.size : 0;
        const meta = document.querySelector('#shell-status-meta');
        if (meta) {
            meta.textContent = `Census: ${count} · Slots: 3`;
        }
        const badge = document.querySelector('#census-count-badge');
        if (badge) {
            badge.textContent = String(count);
        }
    };

    const renderPatientTabs = () => {
        const tabsHost = document.querySelector(GameConfig.selectors.patientTabs);
        if (!tabsHost) return;

        const patients = gameState.getStateSlice('patients');
        const activeId = gameState.getStateSlice('activePatientId');
        tabsHost.innerHTML = '';

        const heading = document.createElement('div');
        heading.className = 'census-tabs-heading';
        heading.innerHTML = `<span>Patients</span><span id="census-count-badge" class="census-count-badge">${patients.size}</span>`;
        tabsHost.appendChild(heading);

        patients.forEach((patient) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'patient-tab';
            btn.setAttribute('role', 'tab');
            btn.dataset.tab = 'patient';
            btn.dataset.patientId = patient.id;
            if (patient.admissionPhase === 'admitting') {
                btn.classList.add('is-admitting');
            }
            const room = (patient.room || '').replace(/^Room\s+/i, '');
            const admitBadge = patient.admissionPhase === 'admitting'
                ? '<span class="patient-tab-admit">Admitting</span>'
                : '';
            btn.innerHTML = `<span class="patient-tab-room">${room}</span><span class="patient-tab-name">${patient.name}</span>${admitBadge}`;
            if (panelMode === 'patient' && patient.id === activeId) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.setAttribute('aria-selected', 'false');
            }
            btn.addEventListener('click', () => {
                showPatientPanel(patient.id, {
                    logMessage: `Switched to ${patient.name}`
                });
            });
            tabsHost.appendChild(btn);
        });

        const globalBtn = document.createElement('button');
        globalBtn.type = 'button';
        globalBtn.className = 'patient-tab';
        globalBtn.dataset.tab = 'global';
        globalBtn.setAttribute('role', 'tab');
        globalBtn.textContent = 'Global';
        if (panelMode === 'global') {
            globalBtn.classList.add('is-active');
            globalBtn.setAttribute('aria-selected', 'true');
        } else {
            globalBtn.setAttribute('aria-selected', 'false');
        }
        globalBtn.addEventListener('click', () => {
            showGlobalPanel();
        });
        tabsHost.appendChild(globalBtn);
        updateCensusMeta();
    };

    const applyPanelVisibility = () => {
        const activeId = gameState.getStateSlice('activePatientId');
        const patientsContainer = document.querySelector(GameConfig.selectors.patients);
        const globalPanel = document.querySelector(GameConfig.selectors.globalPanel);

        if (panelMode === 'global') {
            if (patientsContainer) patientsContainer.classList.add('hidden');
            if (globalPanel) {
                globalPanel.classList.remove('hidden');
                // force reflow for transition
                void globalPanel.offsetWidth;
                globalPanel.classList.add('is-active');
            }
            document.querySelectorAll('.patient-panel-host').forEach((host) => {
                host.classList.remove('is-active');
            });
            return;
        }

        if (globalPanel) {
            globalPanel.classList.remove('is-active');
            globalPanel.classList.add('hidden');
        }
        if (patientsContainer) patientsContainer.classList.remove('hidden');

        document.querySelectorAll('.patient-panel-host').forEach((host) => {
            const isActive = host.getAttribute('data-patient-id') === activeId;
            host.classList.toggle('is-active', isActive);
            if (isActive) {
                host.classList.remove('patient-panel-swap');
                void host.offsetWidth;
                host.classList.add('patient-panel-swap');
            }
        });
    };

    // Setup declarative patient interactions
    const setupPatientInteractions = (patient, patientElement) => {
        // Collapsible sections (legacy inline onclick + declarative toggles)
        const collapsibleHeaders = patientElement.querySelectorAll('[onclick*="toggleClass"], .past-hx-toggle');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const targetElement = header.nextElementSibling;
                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                }

                // Lazy-init TimelineJS when past hx opens
                if (header.classList.contains('past-hx-toggle') && targetElement && !targetElement.classList.contains('hidden')) {
                    const mount = targetElement.querySelector('[data-past-hx-mount]');
                    ensurePastHxTimeline(patient.id, mount, patient.pastHxPack || {
                        displayName: patient.name,
                        pastHx: patient.pastHx || []
                    });
                }
            });
            
            // Remove inline onclick
            header.removeAttribute('onclick');
        });

        // Learning UX: medications + IV + turning / CNA care start open so timed work is visible
        patientElement.querySelectorAll('.meds-list, .iv-list, .care-tasks-list, .care-solo-list').forEach((list) => {
            list.classList.remove('hidden');
        });

        // Task interactions — DOM ids must match extractTasksFromHTML / createTask registry ids
        const taskElements = patientElement.querySelectorAll('[data-task-type]');
        taskElements.forEach((taskElement, index) => {
            if (!taskElement.id) {
                taskElement.id = patient.tasks[index]?.id || `${patient.id}-task-${index}`;
            }
            taskElement.setAttribute('title', 'Click for Perform / Details menu');
            setupTaskInteractions(taskElement, patient);
        });
    };

    // Setup task-specific interactions
    const setupTaskInteractions = (taskElement, patient) => {
        const taskId = taskElement.id;
        const taskType = taskElement.getAttribute('data-task-type');
        
        if (taskType === 'med') {
            setupMedicationTaskInteractions(taskElement, patient);
        }
    };

    // Med interactions: context menu owned by app.js (jquery-contextmenu, census-wide selector)
    const setupMedicationTaskInteractions = () => {};

    const handleTaskAction = () => {};

    function resolveCensusMode() {
        const key = GameConfig.urlParams?.census || 'census';
        const raw = new URLSearchParams(window.location.search).get(key);
        // full / absent = full pack; minus1 = N-1 no admit; admit* / openAdmit = hold + spawn
        if (
            raw === 'minus1'
            || raw === 'admitStart'
            || raw === 'admitMiddle'
            || raw === 'openAdmit'
        ) {
            return raw;
        }
        return null;
    }

    // Main initialization function — census order from active scenario pack (E4.M1) when present
    const init = async () => {
        try {
            const pack = gameState.getStateSlice('scenarioPack');
            const packIds = Array.isArray(pack?.patients) ? pack.patients : null;
            let ids = packIds
                ? packIds.map((id) => {
                    const cfg = patientConfigs[id];
                    if (!cfg) {
                        throw new Error(`Scenario pack references unknown patient id: ${id}`);
                    }
                    return id;
                })
                : Object.keys(patientConfigs);

            const censusMode = resolveCensusMode();
            let heldPatientId = null;
            if (censusMode && ids.length > 1) {
                heldPatientId = ids[ids.length - 1];
                ids = ids.slice(0, -1);
                gameState.dispatch('SET_ADMIT_HOLD', {
                    heldPatientId,
                    mode: censusMode,
                    spawned: false,
                    findNurseAttempt: 0
                });
            } else if (censusMode && ids.length <= 1) {
                console.warn('Census hold skipped — pack has fewer than 2 patients');
            }

            const configs = ids.map((id) => patientConfigs[id]);
            const patients = await Promise.all(
                configs.map((config) => initializePatient(config))
            );

            const firstId = patients[0]?.id || null;
            if (firstId) {
                gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: firstId });
            }

            panelMode = 'patient';
            renderPatientTabs();
            applyPanelVisibility();
            updateCensusMeta();

            console.log(
                `Initialized ${patients.length} patients (census)`
                + (heldPatientId ? `; held ${heldPatientId} (${censusMode})` : '')
            );
            return patients;
        } catch (error) {
            console.error('Failed to initialize patients:', error);
            throw error;
        }
    };

    // Update patient task statuses declaratively (panel host only — tabs also use data-patient-id)
    const updatePatientTaskStatuses = () => {
        const patients = gameState.getStateSlice('patients');
        if (!patients) return;

        patients.forEach(patient => {
            const patientElement = document.querySelector(
                `.patient-panel-host[data-patient-id="${patient.id}"]`
            );
            if (!patientElement) return;

            const taskElements = patientElement.querySelectorAll('[data-task-type]');
            taskElements.forEach(taskElement => {
                const taskId = taskElement.id;
                const task = gameState.getStateSlice('tasks').get(taskId);
                
                if (task) {
                    // Update task status in DOM (\w+ alone breaks on not-yet / multi-hyphen statuses)
                    taskElement.setAttribute('data-status', task.status);
                    taskElement.className = taskElement.className.replace(/task-status-[\w-]+/g, '').trim();
                    taskElement.classList.add(`task-status-${task.status}`);
                }
            });
        });
    };

    // Subscribe to game state changes
    gameState.subscribe('currentTime', () => {
        updatePatientTaskStatuses();
    });
    // Challenge wins can COMPLETE_TASK while paused — sync without waiting for a clock tick
    gameState.subscribe('tasks', () => {
        updatePatientTaskStatuses();
    });

    gameState.subscribe('activePatientId', () => {
        if (panelMode !== 'patient') {
            panelMode = 'patient';
        }
        applyPanelVisibility();
        renderPatientTabs();
    });

    /** Reset main clinical pane scroll when opening a patient or Global. */
    const scrollMainPanelToTop = () => {
        const main = document.querySelector(GameConfig.selectors.main);
        if (main) main.scrollTop = 0;
    };

    /**
     * Open a patient panel. Must apply visibility even when patientId is already
     * active — Global keeps the prior activePatientId, so SET_ACTIVE_PATIENT is a
     * no-op and the activePatientId subscriber would never leave Global (ICU
     * admitStart / N−1 single-census case).
     */
    const showPatientPanel = (patientId, opts = {}) => {
        if (!patientId) return;
        panelMode = 'patient';
        const prev = gameState.getStateSlice('activePatientId');
        if (prev !== patientId) {
            gameState.dispatch('SET_ACTIVE_PATIENT', { patientId });
            // Subscriber applies visibility + tabs when id changes.
        } else {
            applyPanelVisibility();
            renderPatientTabs();
        }
        scrollMainPanelToTop();
        if (opts.logMessage !== false) {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: opts.logMessage || `Switched to ${patientId}`,
                timeLabel: 'nav'
            });
        }
    };

    /** E10: open Global from Orders/Tools rail (or other chrome). */
    const showGlobalPanel = (opts = {}) => {
        panelMode = 'global';
        applyPanelVisibility();
        renderPatientTabs();
        scrollMainPanelToTop();
        if (opts.logMessage !== false) {
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: opts.logMessage || 'Opened global shift panel',
                timeLabel: 'nav'
            });
        }
    };

    // Public API
    return {
        init,
        initializePatient,
        extractTasksFromHTML,
        renderPatient,
        handleTaskAction,
        showPatientPanel,
        showGlobalPanel,
        
        // Getters
        getPatientConfigs: () => ({ ...patientConfigs }),
        getPatient: (id) => gameState.getStateSlice('patients').get(id),
        applyPanelVisibility,
        renderPatientTabs
    };
})();

export default PatientsModule;