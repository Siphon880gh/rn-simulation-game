// task-system.js - Declarative task management system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';
import {
  getWindowPhase,
  getTaskWindowBounds,
  isPerformAllowed,
  buildRevealRule,
  syncTaskWindowDomAttrs,
  applyWindowPhaseClass,
  isAtOrAfterInShift,
  isAfterInShift,
  addMinutesToHhmm
} from './availability-windows.js';

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
        return isAtOrAfterInShift(currentTime, task.scheduled);
      },
      
      shouldExpire: (task, currentTime) => {
        return task.expire != null && isAfterInShift(currentTime, task.expire);
      },

      getContextMenu: (task) => {
        const taskType = GameConfig.tasks.types[task.type.toUpperCase()];
        return taskType?.contextMenu || {};
      },

      render: (task) => this.renderGenericTask(task)
    });

    // Medication-specific processor — ±1h around due (`scheduled`)
    this.taskProcessors.set('med', {
      shouldActivate: (task, currentTime) => {
        const { start } = getTaskWindowBounds(task);
        return start != null && isAtOrAfterInShift(currentTime, start);
      },
      
      shouldExpire: (task, currentTime) => {
        const { expire } = getTaskWindowBounds(task);
        return expire != null && isAfterInShift(currentTime, expire);
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

    // Hourly doctor-orders check (E4.M3) — expire at hour boundary (>=)
    this.taskProcessors.set('orders', {
      shouldActivate: (task, currentTime) => isAtOrAfterInShift(currentTime, task.scheduled),
      shouldExpire: (task, currentTime) => (
        task.expire != null && isAtOrAfterInShift(currentTime, task.expire)
      ),
      getContextMenu: () => ({
        perform: { name: 'Check orders', icon: 'add' },
        details: { name: 'Details', icon: 'question' }
      }),
      render: (task) => this.renderGenericTask(task)
    });

    // E11 sudden procedures / consent / NPO prep
    this.taskProcessors.set('procedure', {
      shouldActivate: (task, currentTime) => isAtOrAfterInShift(currentTime, task.scheduled),
      shouldExpire: (task, currentTime) => (
        task.expire != null && isAfterInShift(currentTime, task.expire)
      ),
      getContextMenu: () => ({
        perform: { name: 'Perform', icon: 'add' },
        details: { name: 'Details', icon: 'question' }
      }),
      render: (task) => this.renderGenericTask(task)
    });

    // Bed prep / admission (E5.M3) — completion gated by mini-game win
    this.taskProcessors.set('bedprep', {
      shouldActivate: (task, currentTime) => isAtOrAfterInShift(currentTime, task.scheduled),
      shouldExpire: (task, currentTime) => (
        task.expire != null && isAfterInShift(currentTime, task.expire)
      ),
      getContextMenu: () => ({
        perform: { name: 'Prepare bed', icon: 'add' },
        details: { name: 'Details', icon: 'question' }
      }),
      render: (task) => this.renderGenericTask(task)
    });

    // IV / drip titration + Heparin PTT
    this.taskProcessors.set('iv', {
      shouldActivate: (task, currentTime) => isAtOrAfterInShift(currentTime, task.scheduled),
      shouldExpire: (task, currentTime) => (
        task.expire != null && isAfterInShift(currentTime, task.expire)
      ),
      getContextMenu: () => ({
        perform: { name: 'Adjust / check IV', icon: 'add' },
        details: { name: 'Details', icon: 'question' }
      }),
      render: (task) => this.renderGenericTask(task)
    });

    // Open-to-admit checklist (E9)
    this.taskProcessors.set('admission', {
      shouldActivate: (task, currentTime) => isAtOrAfterInShift(currentTime, task.scheduled),
      shouldExpire: (task, currentTime) => (
        task.expire != null && isAfterInShift(currentTime, task.expire)
      ),
      getContextMenu: () => ({
        perform: { name: 'Perform', icon: 'add' },
        details: { name: 'Details', icon: 'question' }
      }),
      render: (task) => this.renderGenericTask(task)
    });
  }

  /**
   * Normalize authoring / HTML attrs into the locked task schema (E3.M1).
   */
  normalizeTaskData(taskData = {}) {
    const type = String(taskData.type || 'default').toLowerCase();
    const taskClass = String(
      taskData.taskClass ||
      taskData.class ||
      GameConfig.tasks.classes.ROUTINE
    ).toLowerCase();
    const scheduledRaw = taskData.scheduled;
    const scheduled = this.parseTime(scheduledRaw);
    let expire = taskData.expire != null && taskData.expire !== ''
      ? this.parseTime(taskData.expire, scheduledRaw ?? scheduled)
      : null;
    // Meds default to +medLateMins after due when author omits expire
    if (expire == null && type === 'med' && Number.isFinite(scheduled)) {
      const late = Number(GameConfig.tasks.availability?.medLateMins);
      const lateMins = Number.isFinite(late) ? late : 60;
      expire = addMinutesToHhmm(scheduled, lateMins);
    }
    const duration = Number(taskData.durationMins ?? taskData.duration ?? 0) || 0;

    return {
      id: taskData.id || this.generateTaskId(),
      type,
      taskClass,
      name: taskData.name || 'Untitled task',
      scheduled,
      expire,
      duration,
      status: taskData.status || GameConfig.tasks.statuses.NOT_YET,
      patientId: taskData.patientId || null,
      metadata: { ...(taskData.metadata || {}) },
      schemaVersion: GameConfig.tasks.schemaVersion
    };
  }

  // Declarative task factory
  createTask(taskData) {
    const task = this.normalizeTaskData(taskData);
    // Keep raw relative expire for CSS reveal rules that still match authored +N attrs
    if (typeof taskData.expire === 'string' && taskData.expire.startsWith('+')) {
      task.metadata = { ...task.metadata, expireRaw: taskData.expire };
    }

    this.taskRegistry.set(task.id, task);
    gameState.dispatch('REGISTER_TASK', { task });
    
    return task;
  }

  getWindowPhase(task, currentTime) {
    return getWindowPhase(task, currentTime);
  }

  isPrerequisiteMet(task) {
    const reqId = task?.metadata?.requiresCompletedTaskId;
    if (!reqId) return true;
    const req = gameState.getStateSlice('tasks')?.get(reqId);
    return req?.status === GameConfig.tasks.statuses.COMPLETED;
  }

  isPerformAllowed(task, currentTime = gameState.getStateSlice('currentTime')) {
    if (!this.isPrerequisiteMet(task)) return false;
    if (GameConfig.tasks.availability?.gatePerform === false) {
      return task?.status === GameConfig.tasks.statuses.ACTIVE;
    }
    return isPerformAllowed(task, currentTime);
  }

  buildRevealRule(scheduled, expire, expireRaw) {
    return buildRevealRule(scheduled, expire, expireRaw);
  }

  syncTaskWindowDomAttrs(element, task) {
    syncTaskWindowDomAttrs(element, task);
  }

  /** Refresh data-window-phase on mounted task elements from game time */
  syncWindowPhases(currentTime) {
    const tasks = gameState.getStateSlice('tasks');
    if (!tasks) return;
    tasks.forEach((task) => {
      const el = document.getElementById(task.id);
      if (!el) return;
      syncTaskWindowDomAttrs(el, task);
      applyWindowPhaseClass(el, getWindowPhase(task, currentTime));
    });
    this.refreshFalloutUi();
  }

  /** Too-late / overdue task tiles (red + not-allowed cursor). */
  isTaskFallout(el) {
    if (!el || !el.hasAttribute?.('data-task-type')) return false;
    if (el.getAttribute('data-status') === GameConfig.tasks.statuses.OVERDUE) return true;
    if (el.classList.contains('task-status-overdue')) return true;
    if (el.getAttribute('data-window-phase') === 'after') return true;
    return false;
  }

  ensureFalloutToggle(heading, block) {
    if (!heading || !block) return null;
    let link = heading.querySelector(':scope > .task-fallout-toggle');
    if (link) return link;
    link = document.createElement('a');
    link.href = '#';
    link.className = 'task-fallout-toggle';
    link.setAttribute('role', 'button');
    link.setAttribute('data-count', '0');
    link.hidden = true;
    link.textContent = 'Hide fallouts (0)';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hiding = !block.classList.contains('task-section-hide-fallouts');
      block.classList.toggle('task-section-hide-fallouts', hiding);
      this.updateFalloutToggleLabel(link, block);
    });
    heading.appendChild(link);
    return link;
  }

  updateFalloutToggleLabel(link, block) {
    if (!link || !block) return;
    const count = Number(link.getAttribute('data-count') || 0);
    const hiding = block.classList.contains('task-section-hide-fallouts');
    link.textContent = hiding
      ? `Show fallouts (${count})`
      : `Hide fallouts (${count})`;
    link.setAttribute('aria-pressed', hiding ? 'true' : 'false');
    link.title = hiding
      ? 'Show missed / too-late tasks in this section'
      : 'Hide missed / too-late tasks in this section';
  }

  /**
   * Mark fallout tiles and attach heading toggles (Hide/Show fallouts (n))
   * on sections that contain performable task lists.
   */
  refreshFalloutUi(root = typeof document !== 'undefined' ? document : null) {
    if (!root) return;

    root.querySelectorAll('[data-task-type]').forEach((el) => {
      el.setAttribute('data-fallout', this.isTaskFallout(el) ? '1' : '0');
    });

    const lists = [];
    root.querySelectorAll('ul').forEach((ul) => {
      if (ul.querySelector(':scope > [data-task-type]')) lists.push(ul);
    });

    lists.forEach((list) => {
      const block = list.closest(
        '.dynamic-tasks-block, .shift-assessment-block, .care-tasks-block, .care-solo-block, .space-y-2.mb-4, .space-y-2'
      ) || list.parentElement;
      if (!block) return;
      const heading = [...block.children].find((el) => el.tagName === 'H4');
      if (!heading) return;

      const link = this.ensureFalloutToggle(heading, block);
      const count = list.querySelectorAll(':scope > [data-task-type][data-fallout="1"]').length;
      link.setAttribute('data-count', String(count));
      link.hidden = count === 0;
      this.updateFalloutToggleLabel(link, block);
    });
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

  // Declarative task processing pipeline — lifecycle only via game-state actions
  processTasks(currentTime) {
    const tasks = gameState.getStateSlice('tasks');
    const changes = [];

    for (const [taskId, task] of tasks) {
      if (task.status === GameConfig.tasks.statuses.COMPLETED) continue;

      const processor = this.getTaskProcessor(task.type);

      if (task.status === GameConfig.tasks.statuses.NOT_YET) {
        if (processor.shouldActivate(task, currentTime)) {
          changes.push({ type: 'ACTIVATE_TASK', payload: { taskId } });
        }
      } else if (task.status === GameConfig.tasks.statuses.ACTIVE) {
        if (processor.shouldExpire(task, currentTime)) {
          changes.push({ type: 'MARK_OVERDUE', payload: { taskId } });
        }
      }
    }

    changes.forEach((change) => {
      gameState.dispatch(change.type, change.payload);
      const updated = gameState.getStateSlice('tasks').get(change.payload.taskId);
      if (updated) {
        this.taskRegistry.set(change.payload.taskId, updated);
      }
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
    const bounds = getTaskWindowBounds(task);
    const isMed = String(task.type || '').toLowerCase() === 'med';
    const windowBlock = isMed && bounds.start != null
      ? `<p><strong>Give window:</strong> ${this.formatTime(bounds.start)} – ${
          bounds.expire != null ? this.formatTime(bounds.expire) : 'open'
        } (±1 hour from due)</p>`
      : '';
    const details = {
      title: task.name,
      content: `
        <div class="space-y-2">
          <p><strong>Duration:</strong> ${task.duration} minutes</p>
          <p><strong>Due:</strong> ${this.formatTime(task.scheduled)}</p>
          ${windowBlock}
          ${task.expire ? `<p><strong>Expires:</strong> ${this.formatTime(task.expire)}</p>` : ''}
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
      `,
      footer: '<button class="px-4 py-2 bg-blue-500 text-white rounded" onclick="closeModal()">Close</button>'
    };

    // Dispatch modal update
    this.showModal(details);
  }

  /** Human phrase for med early/late minutes (e.g. 60 → "1 hour"). */
  formatMedWindowSpan(mins) {
    const n = Number(mins);
    if (!Number.isFinite(n) || n <= 0) return '0 minutes';
    if (n === 60) return '1 hour';
    if (n % 60 === 0) {
      const h = n / 60;
      return h === 1 ? '1 hour' : `${h} hours`;
    }
    return n === 1 ? '1 minute' : `${n} minutes`;
  }

  /** Player-facing copy for the Medications section “?” control. */
  getMedicationWindowHelpHtml() {
    const early = Number(GameConfig.tasks.availability?.medEarlyMins) || 60;
    const late = Number(GameConfig.tasks.availability?.medLateMins) || 60;
    const earlyLabel = this.formatMedWindowSpan(early);
    const lateLabel = this.formatMedWindowSpan(late);
    return `
      <div class="space-y-3 text-left text-sm text-gray-700">
        <p>Each medication lists a <strong>due time</strong> (the time on the right of the row).</p>
        <p><strong>Perform window:</strong> you can give the med starting
           <strong>${earlyLabel} before</strong> the due time, through
           <strong>${lateLabel} after</strong> the due time
           (never earlier than the start of the shift).</p>
        <p>Example: due at <strong>19:30</strong> → available from about
           <strong>18:30</strong> until <strong>20:30</strong>
           (night shift clamps the early edge to shift start when needed).</p>
        <p>Inside that window the med is selectable — click it and choose
           <strong>Perform</strong> / Administer.</p>
        <p class="text-xs text-gray-500">Outside the window, Perform stays disabled.</p>
      </div>
    `;
  }

  showMedicationWindowHelp() {
    this.showModal({
      title: 'Medication time window',
      content: this.getMedicationWindowHelpHtml(),
      footer: '<button class="px-4 py-2 bg-blue-500 text-white rounded" onclick="closeModal()">Close</button>'
    });
  }

  completeTask(task) {
    const taskId = typeof task === 'string' ? task : task.id;
    gameState.dispatch('COMPLETE_TASK', { taskId });
    const updated = gameState.getStateSlice('tasks').get(taskId);
    if (updated) {
      this.taskRegistry.set(taskId, updated);
    }
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
    // openModal(config) — do not modifyModal-then-open (update no-ops when closed)
    if (typeof window.openModal === 'function') {
      window.openModal({
        title: details.title || '',
        content: details.content || '',
        footer: details.footer || '',
        overlay: true
      });
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