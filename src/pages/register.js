/**
 * Registration Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { registerConsumer, registerCompany, checkUsernameExists, checkEmailExists } from '../services/auth.js';
import { supabase } from '../services/supabase.js';

let currentType = 'consumer';
let cityChoices = null;

const cityMapping = {
  'bg': {
    'Благоевград': 'Благоевград', 'Бургас': 'Бургас', 'Варна': 'Варна', 'Велико Търново': 'Велико Търново',
    'Видин': 'Видин', 'Враца': 'Враца', 'Габрово': 'Габрово', 'Добрич': 'Добрич', 'Кърджали': 'Кърджали',
    'Кюстендил': 'Кюстендил', 'Ловеч': 'Ловеч', 'Монтана': 'Монтана', 'Пазарджик': 'Пазарджик', 'Перник': 'Перник',
    'Плевен': 'Плевен', 'Пловдив': 'Пловдив', 'Разград': 'Разград', 'Русе': 'Русе', 'Силистра': 'Силистра',
    'Сливен': 'Сливен', 'Смолян': 'Смолян', 'София': 'София', 'Стара Загора': 'Стара Загора',
    'Търговище': 'Търговище', 'Хасково': 'Хасково', 'Шумен': 'Шумен', 'Ямбол': 'Ямбол'
  },
  'en': {
    'Благоевград': 'Blagoevgrad', 'Бургас': 'Burgas', 'Варна': 'Varna', 'Велико Търново': 'Veliko Tarnovo',
    'Видин': 'Vidin', 'Враца': 'Vratsa', 'Габрово': 'Gabrovo', 'Добрич': 'Dobrich', 'Кърджали': 'Kardzhali',
    'Кюстендил': 'Kyustendil', 'Ловеч': 'Lovech', 'Монтана': 'Montana', 'Пазарджик': 'Pazardzhik', 'Перник': 'Pernik',
    'Плевен': 'Pleven', 'Пловдив': 'Plovdiv', 'Разград': 'Razgrad', 'Русе': 'Ruse', 'Силистра': 'Silistra',
    'Сливен': 'Sliven', 'Смолян': 'Smolyan', 'София': 'Sofia', 'Стара Загора': 'Stara Zagora',
    'Търговище': 'Targovishte', 'Хасково': 'Haskovo', 'Шумен': 'Shumen', 'Ямбол': 'Yambol'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));

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
  initCityPicker();
  loadCategories();
});

function initCityPicker() {
  const currentLang = localStorage.getItem('remontco_language') || 'bg';
  const cities = Object.keys(cityMapping.bg);

  const companyCitySelect = document.getElementById('companyCity');
  if (companyCitySelect) {
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = cityMapping[currentLang][city] || city;
      companyCitySelect.appendChild(option);
    });

    cityChoices = new Choices(companyCitySelect, {
      searchEnabled: true,
      itemSelectText: '',
      noResultsText: t('common.no_results') || 'Няма намерени резултати',
      placeholder: true,
      placeholderValue: t('company.select_city') || 'Изберете град'
    });
  }

}

async function loadCategories() {
  const container = document.getElementById('companyCategories');
  if (!container) return;

  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;

    container.innerHTML = '';
    const currentLang = localStorage.getItem('remontco_language') || 'bg';

    categories.forEach(cat => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-3';
      col.innerHTML = `
        <div class="custom-checkbox-card" onclick="document.getElementById('cat_${cat.id}').click()">
          <div class="checkbox-wrapper">
            <input class="category-checkbox" type="checkbox" value="${cat.id}" id="cat_${cat.id}" onclick="event.stopPropagation()">
          </div>
          <div class="card-content">
            <i class="bi ${cat.icon || 'bi-check2-circle'}"></i>
            <span class="category-name">${currentLang === 'bg' ? cat.name_bg : cat.name_en}</span>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = '<div class="col-12 text-danger">Грешка при зареждане на категориите</div>';
  }
}

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
      const email = document.getElementById('consumerEmail').value;
      const username = document.getElementById('consumerUsername').value;

      // Check if username already exists
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        showAlert('danger', t('messages.username_taken'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        showAlert('danger', t('messages.email_taken'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      await registerConsumer(
        email,
        username,
        password,
        {
          first_name: document.getElementById('consumerFirstName').value,
          last_name: document.getElementById('consumerLastName').value,
          phone: document.getElementById('consumerPhone').value
        }
      );

      showSuccessModal(
        'Успешна регистрация!',
        t('messages.register_success'),
        '/auth/login.html'
      );

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
      const email = document.getElementById('companyEmail').value;
      const username = document.getElementById('companyUsername').value;

      // Check if username already exists
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        showAlert('danger', t('messages.username_taken'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        showAlert('danger', t('messages.email_taken'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(cb => cb.value);

      if (selectedCategories.length === 0) {
        showAlert('danger', t('messages.select_category'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      await registerCompany(
        email,
        username,
        password,
        {
          name: document.getElementById('companyName').value,
          eik: document.getElementById('companyEIK').value,
          address: document.getElementById('companyAddress').value,
          city: document.getElementById('companyCity').value,
          description: document.getElementById('companyDescription').value,
          website: document.getElementById('companyWebsite').value,
          phone: document.getElementById('companyPhone').value,
          categories: selectedCategories
        }
      );

      showSuccessModal(
        'Успешна регистрация!',
        t('messages.register_company_success'),
        '/auth/login.html'
      );

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
  
  let icon = '';
  if (type === 'danger') {
    icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
  } else if (type === 'success') {
    icon = '<i class="bi bi-check-circle-fill me-2"></i>';
  } else if (type === 'warning') {
    icon = '<i class="bi bi-exclamation-circle-fill me-2"></i>';
  }
  
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center" role="alert">
      ${icon}
      <div>${message}</div>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
    </div>
  `;

  // Scroll to alert
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccessModal(title, message, redirectUrl = null) {
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
