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

            // Clear any previous alerts
            alertContainer.innerHTML = '';

            // Create success message element
            const successDiv = document.createElement('div');
            successDiv.className = 'text-center py-4 fade-in';
            successDiv.innerHTML = `
                <div class="mb-4">
                    <i class="bi bi-envelope-check-fill text-success" style="font-size: 4rem;"></i>
                </div>
                <h4 class="fw-bold mb-3">${t('messages.email_sent_title') || 'Email Изпратен!'}</h4>
                <p class="text-muted mb-4">${t('messages.reset_link_sent')}</p>
                <a href="/auth/login.html" class="btn btn-primary px-4 rounded-pill">
                    <i class="bi bi-arrow-left me-2"></i> ${t('auth.back_to_login')}
                </a>
            `;

            // Replace the form with the success message
            form.replaceWith(successDiv);

            // Hide the description text and title
            const desc = document.querySelector('[data-i18n="auth.forgot_password_desc"]');
            const title = document.querySelector('[data-i18n="auth.forgot_password_title"]');

            if (desc) desc.remove();
            if (title) title.remove();

            console.log('Success UI updated');

            return;

        } catch (error) {
            console.error('Detailed Error Context:', error);
            let errorMessage = error.message || 'Unknown network error';

            if (errorMessage.includes('For security purposes, you can only request this after')) {
                // Extract the seconds
                const seconds = errorMessage.match(/\d+/);
                const secondsText = seconds ? seconds[0] : 'няколко';
                errorMessage = t('messages.rate_limit_error') || `За сигурност, моля изчакайте ${secondsText} секунди преди да опитате отново.`;
            } else if (errorMessage === 'Failed to fetch') {
                errorMessage = 'Network error: "Failed to fetch". Please check if your Supabase project is active and your internet connection is stable.';
            }

            showAlert('danger', errorMessage);
        } finally {
            if (!form.classList.contains('d-none')) {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
            }
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
