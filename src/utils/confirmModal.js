let modalContainer = null;

function createModalContainer() {
    if (modalContainer) return modalContainer;
    
    modalContainer = document.createElement('div');
    modalContainer.id = 'confirm-modal-container';
    modalContainer.innerHTML = `
        <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold" id="confirmModalTitle">Потвърждение</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <p class="mb-0 text-secondary" id="confirmModalMessage"></p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="confirmModalCancel">Отказ</button>
                        <button type="button" class="btn btn-danger" id="confirmModalConfirm">Потвърди</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);
    
    return modalContainer;
}

export function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
            resolve(confirm(message));
            return;
        }
        
        createModalContainer();
        
        const modalEl = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirm');
        const cancelBtn = document.getElementById('confirmModalCancel');
        
        titleEl.textContent = options.title || 'Потвърждение';
        messageEl.innerHTML = message.replace(/\n/g, '<br>');
        confirmBtn.textContent = options.confirmText || 'Потвърди';
        cancelBtn.textContent = options.cancelText || 'Отказ';
        
        confirmBtn.className = `btn ${options.confirmClass || 'btn-danger'}`;
        
        const modal = new bootstrap.Modal(modalEl);
        
        let resolved = false;
        
        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
        };
        
        const onConfirm = () => {
            resolved = true;
            modal.hide();
            cleanup();
            resolve(true);
        };
        
        const onHidden = () => {
            if (!resolved) {
                cleanup();
                resolve(false);
            }
        };
        
        confirmBtn.addEventListener('click', onConfirm);
        modalEl.addEventListener('hidden.bs.modal', onHidden);
        
        modal.show();
    });
}
