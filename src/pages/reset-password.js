/**
 * Reset Password Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { updatePassword } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    await renderNavbar(document.getElementById('navbar-container'));

    const form = document.getElementById('resetPasswordForm');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const alertContainer = document.getElementById('alert-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showAlert('danger', 'Passwords do not match');
            return;
        }

        // Disable form
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        alertContainer.innerHTML = '';

        try {
            await updatePassword(newPassword);

            // Show success message
            showAlert('success', t('messages.password_updated'));

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = '/auth/login.html';
            }, 3000);

        } catch (error) {
            console.error('Reset error:', error);
            showAlert('danger', error.message || t('common.error'));
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    });

    function showAlert(type, message) {
        alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    }
});
