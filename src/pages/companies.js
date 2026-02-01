/**
 * Companies Listing Page
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { supabase } from '../services/supabase.js';

let allCompanies = [];

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

function getLocalizedCity(city) {
  const currentLang = localStorage.getItem('remontco_language') || 'bg';
  return cityMapping[currentLang][city] || city;
}

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));
  renderFooter(document.getElementById('footer-container'));

  await loadCategories();
  await loadCompanies();
  setupFilters();
});

async function loadCategories() {
  const { data: categories } = await supabase
    .from('service_categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('order_index');

  const select = document.getElementById('categoryFilter');
  const currentLang = localStorage.getItem('remontco_language') || 'bg';

  if (categories) {
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = currentLang === 'bg' ? cat.name_bg : cat.name_en;
      select.appendChild(option);
    });
  }
}

async function loadCompanies() {
  const grid = document.getElementById('companies-grid');

  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_services(category_id)
      `)
      .eq('is_verified', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allCompanies = companies || [];
    populateCityFilter(allCompanies);
    displayCompanies(allCompanies);
  } catch (error) {
    console.error('Error loading companies:', error);
    grid.innerHTML = '<div class="col-12 text-center text-danger"><p>Error loading companies</p></div>';
  }
}

function populateCityFilter(companies) {
  const cityFilter = document.getElementById('cityFilter');
  const currentLang = localStorage.getItem('remontco_language') || 'bg';

  // Comprehensive list of Bulgarian regional centers (Cyrillic keys for matching)
  const regionalCenters = Object.keys(cityMapping.bg);

  // Get unique cities from actual companies and merge with regional centers
  const companyCities = companies.map(c => c.city).filter(Boolean);
  const allCities = [...new Set([...regionalCenters, ...companyCities])].sort((a, b) => {
    const nameA = getLocalizedCity(a);
    const nameB = getLocalizedCity(b);
    return nameA.localeCompare(nameB, currentLang);
  });

  // Clear existing options except the first one
  cityFilter.innerHTML = `<option value="">${t('company.all_cities')}</option>`;

  allCities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = getLocalizedCity(city);
    // Highlight cities that actually have companies
    const hasCompanies = companies.some(c => c.city === city);
    if (!hasCompanies) {
      option.style.color = '#999';
    }
    cityFilter.appendChild(option);
  });
}

function displayCompanies(companies) {
  const grid = document.getElementById('companies-grid');
  grid.innerHTML = '';

  if (companies.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center"><p>No companies found</p></div>';
    return;
  }

  companies.forEach(company => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 border-0 shadow-sm animate-fade-in">
        <div class="card-body">
          <div class="d-flex align-items-start justify-content-between mb-3">
            <h5 class="card-title mb-0 fw-bold">${company.name}</h5>
            ${company.is_verified ? `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                <i class="bi bi-patch-check-fill me-1"></i>${t('ads.verified_badge')}</span>` : ''}
          </div>
          <p class="text-muted small mb-2">
            <i class="bi bi-geo-alt me-1 text-primary"></i> ${getLocalizedCity(company.city) || 'N/A'}
          </p>
          <p class="text-muted small mb-3">
            <i class="bi bi-building me-1 text-primary"></i> EIK: ${company.eik}
          </p>
          ${company.description ? `<p class="card-text text-secondary small">${company.description.substring(0, 100)}...</p>` : ''}
        </div>
        <div class="card-footer bg-white border-0 pt-0 pb-4 px-4">
          <a href="/company.html?id=${company.id}" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold">
            ${t('company.view_profile')}
          </a>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const cityFilter = document.getElementById('cityFilter');

  // Initialize Choices.js for a premium searchable experience
  const categoryChoices = new Choices(categoryFilter, {
    searchEnabled: true,
    itemSelectText: '',
    shouldSort: false, // Keep "All Categories" at the top
    noResultsText: t('common.no_results') || 'No results found',
    noChoicesText: t('common.no_choices') || 'No choices available',
    placeholder: true,
    placeholderValue: t('company.all_categories')
  });

  const cityChoices = new Choices(cityFilter, {
    searchEnabled: true,
    itemSelectText: '',
    shouldSort: false, // Keep "All Cities" at the top
    noResultsText: t('common.no_results') || 'No results found',
    noChoicesText: t('common.no_choices') || 'No choices available',
    placeholder: true,
    placeholderValue: t('company.all_cities')
  });

  const applyFilters = () => {
    let filtered = [...allCompanies];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.description && c.description.toLowerCase().includes(searchTerm))
      );
    }

    const selectedCity = cityFilter.value;
    if (selectedCity) {
      filtered = filtered.filter(c => c.city === selectedCity);
    }

    const selectedCategory = categoryFilter.value;
    if (selectedCategory) {
      filtered = filtered.filter(c =>
        c.company_services && c.company_services.some(s => s.category_id === selectedCategory)
      );
    }

    displayCompanies(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  cityFilter.addEventListener('change', applyFilters);
}
