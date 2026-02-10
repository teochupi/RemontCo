/**
 * Reset Password Page Script
 * Handles the password reset flow when user clicks the email link
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { supabase } from '../services/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'), { forceGuest: true, hideLinks: true, hideAuth: true });

  const form = document.getElementById('resetPasswordForm');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const alertContainer = document.getElementById('alert-container');
  const formContainer = document.getElementById('formContainer');
  const loadingContainer = document.getElementById('loadingContainer');

  // Show loading initially
  if (loadingContainer) loadingContainer.classList.remove('d-none');
  if (formContainer) formContainer.classList.add('d-none');

  let sessionDetected = false;

  // Function to handle successful session detection
  const handleSessionFound = () => {
    if (sessionDetected) return;
    sessionDetected = true;
    console.log('Valid session found for password reset');

    if (loadingContainer) loadingContainer.classList.add('d-none');
    if (formContainer) formContainer.classList.remove('d-none');
  };

  // 1. Immediate check
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    handleSessionFound();
  }

  // 2. Listen for auth changes (this catches the PASSWORD_RECOVERY event)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event);
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
      handleSessionFound();
    }
  });

  // 3. Fail-safe timeout
  // If we don't have a session after 2 seconds, assume the link is invalid/expired
  // But strictly only if we really don't have a session.
  setTimeout(async () => {
    if (!sessionDetected) {
      // Double check
      const { data: { session: textSession } } = await supabase.auth.getSession();
      if (textSession) {
        handleSessionFound();
      } else {
        // Still no session? Then it's an error.
        if (loadingContainer) loadingContainer.classList.add('d-none');
        showAlert('danger', t('messages.invalid_reset_link') || 'Невалиден или изтекъл линк за възстановяване. Моля поискайте нов.');
      }
    }
  }, 2500);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      showAlert('danger', t('messages.password_mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      showAlert('danger', t('messages.password_too_short') || 'Паролата трябва да е поне 6 символа.');
      return;
    }

    // Disable form
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    alertContainer.innerHTML = '';

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Sign out after password update to force fresh login
      await supabase.auth.signOut();

      // Show success modal
      showSuccessModal(
        t('messages.password_updated_title') || 'Паролата е променена!',
        t('messages.password_updated'),
        '/auth/login.html'
      );

    } catch (error) {
      console.error('Reset error:', error);
      showAlert('danger', translateError(error.message));
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });

  function translateError(errorMessage) {
    if (!errorMessage) return t('messages.generic_error');

    const msg = errorMessage.toLowerCase();
    if (msg.includes('same password') || msg.includes('different from the old')) {
      return t('messages.same_password') || 'Новата парола трябва да е различна от старата.';
    }
    if (msg.includes('weak') || msg.includes('too short')) {
      return t('messages.password_too_short') || 'Паролата е твърде слаба. Използвайте поне 6 символа.';
    }
    return t('messages.generic_error');
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

  function showSuccessModal(title, message, redirectUrl) {
    const modalEl = document.getElementById('successModal');

    if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) {
      alert(message);
      if (redirectUrl) window.location.href = redirectUrl;
      return;
    }

    const titleEl = document.getElementById('successModalTitle');
    const messageEl = document.getElementById('successModalMessage');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.innerHTML = message;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    if (redirectUrl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        window.location.href = redirectUrl;
      }, { once: true });
    }
  }
  // Force logout if user tries to leave via Logo
  const brandLink = document.querySelector('.navbar-brand');
  if (brandLink) {
    brandLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = '/index.html';
    });
  }
});
