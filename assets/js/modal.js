
const ModalModule = (() => {
    const openModal = () => {
        document.getElementById('modal').classList.remove('hidden');
    }

    const closeModal = () => {
        document.getElementById('modal').classList.add('hidden');
    }

    /**
     * 
     * @param {string} titleHTML - The HTML for the title of the modal
     * @param {string} contentHTML - The HTML for the content of the modal
     */
    const modifyModal = (titleHTML, contentHTML) => {
        document.getElementById('modal-title').innerHTML = titleHTML;
        document.getElementById('modal-content').innerHTML = contentHTML;
    }

    return {
        openModal,
        closeModal,
        modifyModal
    }
})();

export default ModalModule;