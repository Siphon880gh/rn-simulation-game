// patients.js - Declarative patient management system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import taskSystem from './task-system.js';

const PatientsModule = (() => {
    console.log("Patients module initialized");

    // Patient data structure
    const patientConfigs = {
        joe: {
            id: 'joe',
            name: 'Joe Johnson',
            room: 'Room 201-A',
            age: 68,
            diagnosis: 'Post-op Total Hip Replacement',
            vitals: {
                hr: 82,
                bp: '128/78',
                temp: '98.6°F',
                o2: '96%',
                pain: '1/10 R hip',
                rr: 18
            },
            htmlFile: 'events/patients/joe.html'
        }
    };

    // Declarative patient initialization
    const initializePatient = async (patientConfig) => {
        try {
            // Load patient HTML template
            const response = await fetch(patientConfig.htmlFile);
            const html = await response.text();
            
            // Create patient data model
            const patient = {
                ...patientConfig,
                tasks: extractTasksFromHTML(html, patientConfig.id),
                status: 'active',
                loadedAt: new Date().toISOString()
            };

            // Register patient in game state
            gameState.dispatch('REGISTER_PATIENT', { patient });
            
            // Register patient tasks in task system
            patient.tasks.forEach(taskData => {
                taskSystem.createTask({
                    ...taskData,
                    patientId: patient.id
                });
            });

            // Render patient in UI
            renderPatient(patient, html);
            
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
        
        return Array.from(taskElements).map((element, index) => ({
            id: element.id || `${patientId}-task-${index}`,
            name: element.querySelector('.font-medium')?.textContent || 'Unknown Task',
            type: element.getAttribute('data-task-type'),
            scheduled: element.getAttribute('data-scheduled'),
            expire: element.getAttribute('data-expire'),
            durationMins: parseInt(element.getAttribute('data-duration-mins')) || 0,
            status: element.getAttribute('data-status') || GameConfig.tasks.statuses.NOT_YET,
            element: element.outerHTML
        }));
    };

    // Declarative patient rendering
    const renderPatient = (patient, html) => {
        const patientsContainer = document.querySelector(GameConfig.selectors.patients);
        if (!patientsContainer) {
            console.error('Patients container not found');
            return;
        }

        // Create patient element
        const patientElement = document.createElement('div');
        patientElement.innerHTML = html;
        patientElement.setAttribute('data-patient-id', patient.id);
        
        // Add patient to container
        patientsContainer.appendChild(patientElement);

        // Setup patient interactions
        setupPatientInteractions(patient, patientElement);
    };

    // Setup declarative patient interactions
    const setupPatientInteractions = (patient, patientElement) => {
        // Collapsible sections
        const collapsibleHeaders = patientElement.querySelectorAll('[onclick*="toggleClass"]');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const targetElement = header.nextElementSibling;
                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                }
            });
            
            // Remove inline onclick
            header.removeAttribute('onclick');
        });

        // Task interactions - ensure all task elements have proper IDs
        const taskElements = patientElement.querySelectorAll('[data-task-type]');
        taskElements.forEach((taskElement, index) => {
            // Assign ID if not present
            if (!taskElement.id) {
                taskElement.id = `${patient.id}-task-${index}-${Date.now()}`;
            }
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

    // Setup medication task interactions
    const setupMedicationTaskInteractions = (taskElement, patient) => {
        // Remove existing context menu setup and use declarative approach
        const taskData = {
            id: taskElement.id,
            name: taskElement.querySelector('.font-medium')?.textContent || 'Unknown Medication',
            type: 'med',
            patientId: patient.id
        };

        // Setup context menu declaratively
        const contextMenuConfig = {
            selector: `#${taskElement.id}`,
            trigger: 'left',
            build: function(triggerElement, e) {
                const element = e.target.closest('[data-task-type]');
                if (!element || element.getAttribute('data-status') !== 'active') {
                    return false;
                }

                return {
                    callback: function(key, options) {
                        handleTaskAction(key, taskData);
                    },
                    items: {
                        perform: { name: "Perform", icon: "add" },
                        details: { name: 'Details', icon: 'question' }
                    }
                };
            }
        };

        // Apply context menu
        $.contextMenu(contextMenuConfig);
    };

    // Declarative task action handler
    const handleTaskAction = (action, taskData) => {
        const actionHandlers = {
            perform: () => {
                console.log(`Performing task: ${taskData.name}`);
                // This would integrate with the task system
                taskSystem.completeTask(taskData);
            },
            details: () => {
                console.log(`Showing details for: ${taskData.name}`);
                // This would show task details modal
                if (window.ModalModule) {
                    window.ModalModule.showTaskDetails(taskData);
                }
            }
        };

        const handler = actionHandlers[action];
        if (handler) {
            handler();
        } else {
            console.warn(`Unknown task action: ${action}`);
        }
    };

    // Main initialization function
    const init = async () => {
        try {
            // Initialize all configured patients
            const patients = await Promise.all(
                Object.values(patientConfigs).map(config => initializePatient(config))
            );

            console.log(`Initialized ${patients.length} patients`);
            return patients;
        } catch (error) {
            console.error('Failed to initialize patients:', error);
            throw error;
        }
    };

    // Subscribe to game state changes
    gameState.subscribe('currentTime', (currentTime) => {
        // Update patient task statuses based on time
        updatePatientTaskStatuses(currentTime);
    });

    // Update patient task statuses declaratively
    const updatePatientTaskStatuses = (currentTime) => {
        const patients = gameState.getStateSlice('patients');
        if (!patients) return;

        patients.forEach(patient => {
            const patientElement = document.querySelector(`[data-patient-id="${patient.id}"]`);
            if (!patientElement) return;

            const taskElements = patientElement.querySelectorAll('[data-task-type]');
            taskElements.forEach(taskElement => {
                const taskId = taskElement.id;
                const task = gameState.getStateSlice('tasks').get(taskId);
                
                if (task) {
                    // Update task status in DOM
                    taskElement.setAttribute('data-status', task.status);
                    taskElement.className = taskElement.className.replace(/task-status-\w+/g, '');
                    taskElement.classList.add(`task-status-${task.status}`);
                }
            });
        });
    };

    // Public API
    return {
        init,
        initializePatient,
        extractTasksFromHTML,
        renderPatient,
        handleTaskAction,
        
        // Getters
        getPatientConfigs: () => ({ ...patientConfigs }),
        getPatient: (id) => gameState.getStateSlice('patients').get(id)
    };
})();

export default PatientsModule;