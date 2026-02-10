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

  // Redirect if already logged in
  const user = await getCurrentUser();
  if (user && user.role) {
    handlePostLoginRedirect();
    return;
  }

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
      const errorMessage = translateError(error.message);
      showAlert('danger', errorMessage);
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });

  function translateError(errorMessage) {
    if (!errorMessage) return t('messages.login_error');
    
    const msg = errorMessage.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return t('messages.invalid_credentials');
    }
    if (msg.includes('email not confirmed')) {
      return t('messages.email_not_confirmed');
    }
    return t('messages.login_error');
  }

  function showAlert(type, message) {
    const icon = type === 'danger' 
      ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>' 
      : '<i class="bi bi-check-circle-fill me-2"></i>';
    
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center" role="alert">
        ${icon}
        <div>${message}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
      </div>
    `;
  }
});
