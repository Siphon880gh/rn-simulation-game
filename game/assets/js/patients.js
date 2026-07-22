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

    // Declarative patient initialization
    const initializePatient = async (patientConfig) => {
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

            // Create patient data model
            const patient = {
                ...patientConfig,
                tasks: extractTasksFromHTML(html, patientConfig.id),
                pastHx: pastHxPack.pastHx || [],
                pastHxPack,
                status: 'active',
                clinicalStatus,
                clinicalStatusReason: overrides.clinicalStatusReason || null,
                acuityScore,
                loadedAt: new Date().toISOString()
            };

            // Register patient in game state
            gameState.dispatch('REGISTER_PATIENT', { patient });
            
            // Register patient tasks in task system
            patient.tasks.forEach((taskData) => {
                taskSystem.createTask({
                    ...taskData,
                    patientId: patient.id
                });
            });

            // Render patient in UI (all packs stay mounted; swap via activePatientId)
            renderPatient(patient, html);
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
            const room = (patient.room || '').replace(/^Room\s+/i, '');
            btn.innerHTML = `<span class="patient-tab-room">${room}</span><span class="patient-tab-name">${patient.name}</span>`;
            if (panelMode === 'patient' && patient.id === activeId) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.setAttribute('aria-selected', 'false');
            }
            btn.addEventListener('click', () => {
                panelMode = 'patient';
                gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: patient.id });
                gameState.dispatch('APPEND_SHIFT_LOG', {
                    message: `Switched to ${patient.name}`,
                    timeLabel: 'nav'
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
            panelMode = 'global';
            applyPanelVisibility();
            renderPatientTabs();
            gameState.dispatch('APPEND_SHIFT_LOG', {
                message: 'Opened global shift panel',
                timeLabel: 'nav'
            });
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

        // Learning UX: medications + IV start open so timed work is visible without an extra click
        patientElement.querySelectorAll('.meds-list, .iv-list').forEach((list) => {
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

    // Main initialization function — census order from active scenario pack (E4.M1) when present
    const init = async () => {
        try {
            const pack = gameState.getStateSlice('scenarioPack');
            const packIds = Array.isArray(pack?.patients) ? pack.patients : null;
            const configs = packIds
                ? packIds.map((id) => {
                    const cfg = patientConfigs[id];
                    if (!cfg) {
                        throw new Error(`Scenario pack references unknown patient id: ${id}`);
                    }
                    return cfg;
                })
                : Object.values(patientConfigs);

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

            console.log(`Initialized ${patients.length} patients (census)`);
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

    // Public API
    return {
        init,
        initializePatient,
        extractTasksFromHTML,
        renderPatient,
        handleTaskAction,
        
        // Getters
        getPatientConfigs: () => ({ ...patientConfigs }),
        getPatient: (id) => gameState.getStateSlice('patients').get(id),
        applyPanelVisibility,
        renderPatientTabs
    };
})();

export default PatientsModule;