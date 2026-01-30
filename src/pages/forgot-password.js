/**
 * Forgot Password Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { resetPassword } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    await renderNavbar(document.getElementById('navbar-container'));

    const form = document.getElementById('forgotPasswordForm');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const alertContainer = document.getElementById('alert-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();

        // Disable form
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        alertContainer.innerHTML = '';

        try {
            console.log('Sending reset request for email:', email);
            await resetPassword(email);

            console.log('Reset request success');
            showAlert('success', t('messages.reset_link_sent'));
            form.reset();

        } catch (error) {
            console.error('Detailed Error Context:', error);
            let errorMessage = error.message || 'Unknown network error';

            if (errorMessage === 'Failed to fetch') {
                errorMessage = 'Network error: "Failed to fetch". Please check if your Supabase project is active and your internet connection is stable.';
            }

            showAlert('danger', errorMessage);
        } finally {
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
