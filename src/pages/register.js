/**
 * Registration Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { registerConsumer, registerCompany } from '../services/auth.js';

let currentType = 'consumer';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));

  // Check URL parameter for type
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  if (typeParam === 'company') {
    document.getElementById('typeCompany').checked = true;
    currentType = 'company';
    toggleForms();
  }

  setupTypeSwitch();
  setupConsumerForm();
  setupCompanyForm();
});

function setupTypeSwitch() {
  const typeInputs = document.querySelectorAll('input[name="userType"]');
  typeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      currentType = e.target.value;
      toggleForms();
    });
  });
}

function toggleForms() {
  const consumerForm = document.getElementById('consumerForm');
  const companyForm = document.getElementById('companyForm');

  if (currentType === 'consumer') {
    consumerForm.classList.remove('d-none');
    companyForm.classList.add('d-none');
  } else {
    consumerForm.classList.add('d-none');
    companyForm.classList.remove('d-none');
  }
}

function setupConsumerForm() {
  const form = document.getElementById('consumerForm');
  const spinner = document.getElementById('consumerSpinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('consumerPassword').value;
    const confirmPassword = document.getElementById('consumerConfirmPassword').value;

    if (password !== confirmPassword) {
      showAlert('danger', t('messages.password_mismatch'));
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      await registerConsumer(
        document.getElementById('consumerEmail').value,
        document.getElementById('consumerUsername').value,
        password,
        {
          first_name: document.getElementById('consumerFirstName').value,
          last_name: document.getElementById('consumerLastName').value,
          phone: document.getElementById('consumerPhone').value
        }
      );

      showAlert('success', t('messages.register_success'));

      setTimeout(() => {
        window.location.href = '/auth/login.html';
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      showAlert('danger', error.message || t('messages.register_error'));
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
}

function setupCompanyForm() {
  const form = document.getElementById('companyForm');
  const spinner = document.getElementById('companySpinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('companyPassword').value;
    const confirmPassword = document.getElementById('companyConfirmPassword').value;

    if (password !== confirmPassword) {
      showAlert('danger', t('messages.password_mismatch'));
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      await registerCompany(
        document.getElementById('companyEmail').value,
        document.getElementById('companyUsername').value,
        password,
        {
          name: document.getElementById('companyName').value,
          eik: document.getElementById('companyEIK').value,
          address: document.getElementById('companyAddress').value,
          city: document.getElementById('companyCity').value,
          phone: document.getElementById('companyPhone').value
        }
      );

      showAlert('success', t('messages.register_company_success'));

      setTimeout(() => {
        window.location.href = '/auth/login.html';
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      showAlert('danger', error.message || t('messages.register_error'));
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
}

function showAlert(type, message) {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  // Scroll to alert
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
