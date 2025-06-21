// modal.js - Declarative modal system
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

const ModalModule = (() => {
    // Modal state
    let currentModal = null;
    
    // Declarative modal configurations
    const modalConfigs = {
        gameOver: {
            title: "Game Over",
            content: "You have failed to save the patient",
            footer: "<button class='px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600' onclick='closeModal()'>Close</button>",
            overlay: true,
            persistent: true
        },
        
        taskDetails: {
            title: "Task Details",
            content: "",
            footer: "<button class='px-4 py-2 bg-blue-500 text-white rounded' onclick='closeModal()'>Close</button>",
            overlay: true,
            persistent: false
        },
        
        medicationConfirm: {
            title: "Confirm Medication",
            content: "",
            footer: `
                <button class='px-4 py-2 bg-green-500 text-white rounded mr-2' onclick='confirmAction()'>Confirm</button>
                <button class='px-4 py-2 bg-gray-500 text-white rounded' onclick='closeModal()'>Cancel</button>
            `,
            overlay: true,
            persistent: false
        }
    };

    // Declarative modal actions
    const actions = {
        show: (config) => {
            const modal = document.querySelector(GameConfig.selectors.modal);
            if (!modal) return false;

            updateModalContent(config);
            modal.classList.remove('hidden');
            currentModal = config;
            
            // Add overlay effects if configured
            if (config.overlay) {
                document.querySelector(".container")?.classList.add("opacity-40");
            }
            
            return true;
        },

        hide: () => {
            const modal = document.querySelector(GameConfig.selectors.modal);
            if (!modal) return false;

            modal.classList.add('hidden');
            
            // Remove overlay effects
            document.querySelector(".container")?.classList.remove("opacity-40");
            currentModal = null;
            
            return true;
        },

        update: (config) => {
            if (!currentModal) return false;
            
            const mergedConfig = { ...currentModal, ...config };
            updateModalContent(mergedConfig);
            currentModal = mergedConfig;
            
            return true;
        }
    };

    // Update modal content based on configuration
    function updateModalContent(config) {
        const elements = {
            title: document.querySelector(GameConfig.selectors.modalTitle),
            content: document.querySelector(GameConfig.selectors.modalContent),
            footer: document.querySelector(GameConfig.selectors.modalFooter)
        };

        if (elements.title) elements.title.innerHTML = config.title || "";
        if (elements.content) elements.content.innerHTML = config.content || "";
        if (elements.footer) elements.footer.innerHTML = config.footer || "";
    }

    // Declarative modal API
    const openModal = (configOrType = {}) => {
        let config;
        
        if (typeof configOrType === 'string') {
            // Use predefined modal configuration
            config = modalConfigs[configOrType];
            if (!config) {
                console.warn(`Modal configuration '${configOrType}' not found`);
                return false;
            }
        } else {
            // Use provided configuration object
            config = configOrType;
        }
        
        return actions.show(config);
    };

    const closeModal = () => {
        if (currentModal?.persistent) {
            console.log("Modal is persistent and cannot be closed");
            return false;
        }
        
        return actions.hide();
    };

    const modifyModal = (titleHTML = "", contentHTML = "", footerHTML = "") => {
        return actions.update({
            title: titleHTML,
            content: contentHTML,
            footer: footerHTML
        });
    };

    // Enhanced modal with promises for user interaction
    const showModalWithPromise = (config) => {
        return new Promise((resolve, reject) => {
            const enhancedConfig = {
                ...config,
                onConfirm: resolve,
                onCancel: () => reject(new Error('Modal cancelled'))
            };
            
            openModal(enhancedConfig);
        });
    };

    // Modal factory functions for common use cases
    const showGameOver = () => {
        return openModal('gameOver');
    };

    const showTaskDetails = (task) => {
        const config = {
            ...modalConfigs.taskDetails,
            title: task.name,
            content: `
                <div class="space-y-2">
                    <p><strong>Duration:</strong> ${task.duration} minutes</p>
                    <p><strong>Scheduled:</strong> ${formatTime(task.scheduled)}</p>
                    ${task.expire ? `<p><strong>Expires:</strong> ${formatTime(task.expire)}</p>` : ''}
                    <p><strong>Status:</strong> ${task.status}</p>
                </div>
            `
        };
        
        return openModal(config);
    };

    const showMedicationConfirmation = (medication) => {
        const config = {
            ...modalConfigs.medicationConfirm,
            content: `Are you sure you want to administer ${medication}?`
        };
        
        return showModalWithPromise(config);
    };

    // Utility function
    function formatTime(time) {
        const hours = Math.floor(time / 100);
        const minutes = time % 100;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Global action handlers for modal buttons
    window.confirmAction = () => {
        if (currentModal?.onConfirm) {
            currentModal.onConfirm(true);
        }
        closeModal();
    };

    // Subscribe to game state changes
    gameState.subscribe('gameStatus', (status) => {
        if (status === GameConfig.gameStates.GAME_OVER) {
            showGameOver();
        }
    });

    // Public API
    return {
        openModal,
        closeModal,
        modifyModal,
        showGameOver,
        showTaskDetails,
        showMedicationConfirmation,
        showModalWithPromise,
        
        // Legacy compatibility
        show: openModal,
        hide: closeModal,
        update: modifyModal
    };
})();

export default ModalModule;