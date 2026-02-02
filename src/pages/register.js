/**
 * Registration Page Script
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { registerConsumer, registerCompany } from '../services/auth.js';
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
  const citySelect = document.getElementById('companyCity');
  if (!citySelect) return;

  const currentLang = localStorage.getItem('remontco_language') || 'bg';
  const cities = Object.keys(cityMapping.bg);

  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = cityMapping[currentLang][city] || city;
    citySelect.appendChild(option);
  });

  cityChoices = new Choices(citySelect, {
    searchEnabled: true,
    itemSelectText: '',
    noResultsText: t('common.no_results') || 'Няма намерени резултати',
    placeholder: true,
    placeholderValue: t('company.select_city') || 'Изберете град'
  });
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
      const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(cb => cb.value);

      if (selectedCategories.length === 0) {
        showAlert('danger', t('messages.select_category'));
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        return;
      }

      await registerCompany(
        document.getElementById('companyEmail').value,
        document.getElementById('companyUsername').value,
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
