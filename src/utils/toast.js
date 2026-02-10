let toastContainer = null;

function createToastContainer() {
    if (toastContainer) return toastContainer;
    
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    
    return toastContainer;
}

function isBootstrapAvailable() {
    return typeof bootstrap !== 'undefined' && bootstrap.Toast;
}

function createToast(message, type = 'success', duration = 4000) {
    if (!isBootstrapAvailable()) {
        console.warn('Bootstrap not available, using fallback alert');
        alert(message);
        return null;
    }
    
    const container = createToastContainer();
    
    const icons = {
        success: '<i class="bi bi-check-circle-fill me-2"></i>',
        error: '<i class="bi bi-exclamation-triangle-fill me-2"></i>',
        warning: '<i class="bi bi-exclamation-circle-fill me-2"></i>',
        info: '<i class="bi bi-info-circle-fill me-2"></i>'
    };
    
    const bgColors = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning text-dark',
        info: 'bg-primary'
    };
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgColors[type]} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center fs-6">
                    ${icons[type] || icons.info}
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
    });
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
    
    bsToast.show();
    
    return bsToast;
}

export function showToast(message, type = 'success', duration = 4000) {
    return createToast(message, type, duration);
}

export function showSuccess(message, duration = 4000) {
    return createToast(message, 'success', duration);
}

export function showError(message, duration = 5000) {
    return createToast(message, 'error', duration);
}

export function showWarning(message, duration = 4000) {
    return createToast(message, 'warning', duration);
}

export function showInfo(message, duration = 4000) {
    return createToast(message, 'info', duration);
}
