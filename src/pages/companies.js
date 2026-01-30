/**
 * Companies Listing Page
 */

import { initI18n, t } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { supabase } from '../services/supabase.js';

let allCompanies = [];

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
  const cities = [...new Set(companies.map(c => c.city).filter(Boolean))].sort();
  
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
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
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex align-items-start justify-content-between mb-3">
            <h5 class="card-title mb-0">${company.name}</h5>
            ${company.is_verified ? '<span class="badge badge-verified"><i class="bi bi-check-circle me-1"></i>Verified</span>' : ''}
          </div>
          <p class="text-muted small mb-2">
            <i class="bi bi-geo-alt"></i> ${company.city || 'N/A'}
          </p>
          <p class="text-muted small mb-2">
            <i class="bi bi-building"></i> EIK: ${company.eik}
          </p>
          ${company.description ? `<p class="card-text">${company.description.substring(0, 100)}...</p>` : ''}
        </div>
        <div class="card-footer bg-white">
          <a href="/company.html?id=${company.id}" class="btn btn-primary btn-sm w-100">
            <span data-i18n="company.view_profile">View Profile</span>
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
