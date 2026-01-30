/**
 * Login Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { signIn } from '../services/auth.js';
import { handlePostLoginRedirect } from '../utils/guards.js';
import { getCurrentUser } from '../services/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));

  const form = document.getElementById('loginForm');
  if (form) form.reset();
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const alertContainer = document.getElementById('alert-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Disable form
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    alertContainer.innerHTML = '';

    try {
      await signIn(identifier, password);

      // Show success message
      showAlert('success', t('messages.login_success'));

      // Redirect after short delay
      setTimeout(() => {
        handlePostLoginRedirect();
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      showAlert('danger', error.message || t('messages.login_error'));
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
