// task-system.js - Declarative task management system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

class TaskSystem {
  constructor() {
    this.taskRegistry = new Map();
    this.taskProcessors = new Map();
    this.setupTaskProcessors();
  }

  // Declarative task processor definitions
  setupTaskProcessors() {
    // Generic task processor
    this.taskProcessors.set('default', {
      shouldActivate: (task, currentTime) => {
        return currentTime >= task.scheduled;
      },
      
      shouldExpire: (task, currentTime) => {
        return task.expire && currentTime > task.expire;
      },

      getContextMenu: (task) => {
        const taskType = GameConfig.tasks.types[task.type.toUpperCase()];
        return taskType?.contextMenu || {};
      },

      render: (task) => this.renderGenericTask(task)
    });

    // Medication-specific processor
    this.taskProcessors.set('med', {
      shouldActivate: (task, currentTime) => {
        return currentTime >= task.scheduled;
      },
      
      shouldExpire: (task, currentTime) => {
        return task.expire && currentTime > task.expire;
      },

      getContextMenu: (task) => ({
        perform: { 
          name: "Administer Medication", 
          icon: "add",
          action: () => this.performMedication(task)
        },
        details: { 
          name: 'Medication Details', 
          icon: 'question',
          action: () => this.showTaskDetails(task)
        }
      }),

      render: (task) => this.renderMedicationTask(task)
    });
  }

  // Declarative task factory
  createTask(taskData) {
    const task = {
      id: taskData.id || this.generateTaskId(),
      type: taskData.type || 'default',
      name: taskData.name,
      scheduled: this.parseTime(taskData.scheduled),
      expire: taskData.expire ? this.parseTime(taskData.expire, taskData.scheduled) : null,
      duration: taskData.durationMins || 0,
      status: GameConfig.tasks.statuses.NOT_YET,
      patientId: taskData.patientId,
      metadata: taskData.metadata || {}
    };

    this.taskRegistry.set(task.id, task);
    gameState.dispatch('REGISTER_TASK', { task });
    
    return task;
  }

  // Parse time declarations (handles "+120" format)
  parseTime(timeStr, baseTime = null) {
    if (typeof timeStr === 'number') return timeStr;
    
    const str = String(timeStr);
    if (str.startsWith('+')) {
      if (!baseTime) {
        throw new Error('Relative time requires base time');
      }
      const minutes = parseInt(str.slice(1));
      return this.addMinutesToTime(baseTime, minutes);
    }
    
    return parseInt(str);
  }

  // Declarative task processing pipeline
  processTasks(currentTime) {
    const tasks = gameState.getStateSlice('tasks');
    const changes = [];

    for (const [taskId, task] of tasks) {
      const processor = this.getTaskProcessor(task.type);
      const currentStatus = task.status;
      let newStatus = currentStatus;

      // Determine new status based on rules
      if (currentStatus === GameConfig.tasks.statuses.NOT_YET) {
        if (processor.shouldActivate(task, currentTime)) {
          newStatus = GameConfig.tasks.statuses.ACTIVE;
          changes.push({ type: 'ACTIVATE_TASK', payload: { taskId } });
        }
      } else if (currentStatus === GameConfig.tasks.statuses.ACTIVE) {
        if (processor.shouldExpire(task, currentTime)) {
          newStatus = GameConfig.tasks.statuses.OVERDUE;
        }
      }

      if (newStatus !== currentStatus) {
        task.status = newStatus;
      }
    }

    // Apply changes to state
    changes.forEach(change => {
      gameState.dispatch(change.type, change.payload);
    });
  }

  // Get appropriate processor for task type
  getTaskProcessor(taskType) {
    return this.taskProcessors.get(taskType.toLowerCase()) || 
           this.taskProcessors.get('default');
  }

  // Task action handlers
  performMedication(task) {
    // Declarative medication administration logic
    const actions = [
      () => this.showMedicationConfirmation(task),
      () => this.recordMedicationTime(task),
      () => this.completeTask(task)
    ];

    // Execute action pipeline
    this.executeActionPipeline(actions);
  }

  showTaskDetails(task) {
    const details = {
      title: task.name,
      content: `
        <div class="space-y-2">
          <p><strong>Duration:</strong> ${task.duration} minutes</p>
          <p><strong>Scheduled:</strong> ${this.formatTime(task.scheduled)}</p>
          ${task.expire ? `<p><strong>Expires:</strong> ${this.formatTime(task.expire)}</p>` : ''}
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
      `,
      footer: '<button class="px-4 py-2 bg-blue-500 text-white rounded" onclick="closeModal()">Close</button>'
    };

    // Dispatch modal update
    this.showModal(details);
  }

  completeTask(task) {
    gameState.dispatch('COMPLETE_TASK', { taskId: task.id });
  }

  // Declarative rendering system
  renderGenericTask(task) {
    const taskConfig = GameConfig.tasks.types[task.type.toUpperCase()] || {};
    
    return `
      <li data-task-type="${task.type}" 
          data-status="${task.status}" 
          data-scheduled="${task.scheduled}" 
          data-expire="${task.expire || ''}" 
          data-duration-mins="${task.duration}"
          id="${task.id}"
          class="bg-white p-4 rounded-lg shadow flex items-center task-status-${task.status}">
        <i class="${taskConfig.icon || 'fas fa-tasks'} text-${taskConfig.color || 'gray'}-500 text-xl mr-3"></i>
        <span class="font-medium text-gray-900">${task.name}</span>
        <span class="ml-auto text-sm text-gray-500">${this.formatTime(task.scheduled)}</span>
      </li>
    `;
  }

  renderMedicationTask(task) {
    return `
      <li data-task-type="med" 
          data-status="${task.status}" 
          data-scheduled="${task.scheduled}" 
          data-expire="${task.expire || ''}" 
          data-duration-mins="${task.duration}"
          id="${task.id}"
          class="bg-white p-4 rounded-lg shadow flex items-center task-status-${task.status}">
        <data class="slot-label" value="1"></data>
        <i class="fas fa-pills text-blue-500 text-xl mr-3"></i>
        <span class="font-medium text-gray-900">${task.name}</span>
        <span class="ml-auto text-sm text-gray-500">${this.formatTime(task.scheduled)}</span>
      </li>
    `;
  }

  // Utility methods
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addMinutesToTime(baseTime, minutes) {
    const hours = Math.floor(baseTime / 100);
    const mins = baseTime % 100;
    const totalMinutes = hours * 60 + mins + minutes;
    
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return newHours * 100 + newMins;
  }

  formatTime(time) {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  executeActionPipeline(actions) {
    return actions.reduce((promise, action) => 
      promise.then(action), Promise.resolve());
  }

  showModal(details) {
    // This would integrate with your modal system
    if (window.modifyModal && window.openModal) {
      window.modifyModal(details.title, details.content, details.footer);
      window.openModal();
    }
  }

  showMedicationConfirmation(task) {
    return new Promise(resolve => {
      this.showModal({
        title: 'Confirm Medication Administration',
        content: `Are you sure you want to administer ${task.name}?`,
        footer: `
          <button class="px-4 py-2 bg-green-500 text-white rounded mr-2" onclick="this.closest('#modal').dispatchEvent(new CustomEvent('confirm')); closeModal();">Confirm</button>
          <button class="px-4 py-2 bg-gray-500 text-white rounded" onclick="closeModal();">Cancel</button>
        `
      });
      
      document.getElementById('modal').addEventListener('confirm', resolve, { once: true });
    });
  }

  recordMedicationTime(task) {
    task.metadata.administeredAt = gameState.getStateSlice('currentTime');
    console.log(`Medication ${task.name} administered at ${this.formatTime(task.metadata.administeredAt)}`);
  }
}

export const taskSystem = new TaskSystem();
export default taskSystem; 