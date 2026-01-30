/**
 * Home/Landing Page Script
 */

import { initI18n, t, getCurrentLanguage } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { supabase } from '../services/supabase.js';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  await initI18n();

  // Render shared components
  await renderNavbar(document.getElementById('navbar-container'));
  renderFooter(document.getElementById('footer-container'));

  // Load categories
  await loadCategories();

  // Load recent jobs
  await loadRecentJobs();

  // Show page
  document.body.classList.add('ready');
});

/**
 * Load and display recent job postings
 */
async function loadRecentJobs() {
  const container = document.getElementById('recent-jobs-feed');
  if (!container) return;

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        category:service_categories(name_bg, name_en)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="bi bi-patch-question fs-1 d-block mb-3"></i>
          <p>${t('common.no_active_requests')}</p>
          <a href="/auth/register.html?type=consumer" class="btn btn-primary mt-2" data-i18n="nav.register">${t('nav.register')}</a>
        </div>
      `;
      return;
    }

    const currentLang = getCurrentLanguage();

    container.innerHTML = jobs.map(job => `
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm rounded-4 hover-lift">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between mb-3">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                ${currentLang === 'bg' ? job.category.name_bg : job.category.name_en}
              </span>
              <small class="text-muted"><i class="bi bi-geo-alt me-1"></i> ${job.location}</small>
            </div>
            <h5 class="card-title h6 fw-bold mb-3">${job.title}</h5>
            <p class="card-text text-muted small text-truncate-3 mb-4">
              ${job.description}
            </p>
            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
              <span class="fw-bold text-dark">${job.budget_max ? job.budget_max + ' EUR' : t('common.negotiable')}</span>
              <a href="/auth/login.html" class="btn btn-link btn-sm text-primary p-0">
                ${t('common.details')} <i class="bi bi-chevron-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading jobs:', err);
    container.innerHTML = `<div class="alert alert-light text-center">${t('market.feed_unavailable')}</div>`;
  }
}

/**
 * Load and display service categories
 */
async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!grid) return;

  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    grid.innerHTML = '';

    if (categories && categories.length > 0) {
      categories.forEach(category => {
        grid.appendChild(createCategoryCard(category));
      });
      initCategorySlider(grid, prevBtn, nextBtn);
    } else {
      grid.innerHTML = '<div class="col-12 text-center"><p>No categories available yet.</p></div>';
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    const FALLBACK_CATEGORIES = [
      { slug: 'interior-renovation', name_en: 'Interior Renovation', name_bg: 'Вътрешни Ремонти', icon: 'bi-house-heart' },
      { slug: 'plumbing', name_en: 'Plumbing', name_bg: 'ВиК Услуги', icon: 'bi-droplet-fill' },
      { slug: 'electrical', name_en: 'Electrical Services', name_bg: 'Ел. Услуги', icon: 'bi-lightning-charge-fill' },
      { slug: 'painting', name_en: 'Painting', name_bg: 'Бояджийски', icon: 'bi-paint-bucket' },
      { slug: 'cleaning', name_en: 'Cleaning', name_bg: 'Почистване', icon: 'bi-stars' },
      { slug: 'roofing', name_en: 'Roofing', name_bg: 'Покриви', icon: 'bi-house-fill' },
      { slug: 'construction', name_en: 'Construction', name_bg: 'Строителство', icon: 'bi-building-fill-add' },
      { slug: 'interior-design', name_en: 'Interior Design', name_bg: 'Дизайн', icon: 'bi-palette' }
    ];

    grid.innerHTML = '';
    FALLBACK_CATEGORIES.forEach(category => {
      grid.appendChild(createCategoryCard(category));
    });
    initCategorySlider(grid, prevBtn, nextBtn);
  }
}

/**
 * Initialize the horizontal slider logic
 */
function initCategorySlider(grid, prevBtn, nextBtn) {
  let currentPosition = 0;
  const items = grid.children;

  function updateSlider() {
    const viewWidth = grid.parentElement.offsetWidth;
    const itemWidth = items[0].offsetWidth;
    const maxScroll = Math.max(0, grid.scrollWidth - viewWidth);

    // Clamp position
    currentPosition = Math.max(0, Math.min(currentPosition, maxScroll));

    grid.style.transform = `translateX(-${currentPosition}px)`;

    // Update buttons
    prevBtn.disabled = currentPosition <= 0;
    nextBtn.disabled = currentPosition >= maxScroll - 5; // small buffer
  }

  nextBtn.addEventListener('click', () => {
    const itemWidth = items[0].offsetWidth;
    currentPosition += itemWidth;
    updateSlider();
  });

  prevBtn.addEventListener('click', () => {
    const itemWidth = items[0].offsetWidth;
    currentPosition -= itemWidth;
    updateSlider();
  });

  // Handle window resize
  window.addEventListener('resize', updateSlider);

  // Initial update
  setTimeout(updateSlider, 100);
}

/**
 * Create category card element
 */
function createCategoryCard(category) {
  const wrapper = document.createElement('div');
  wrapper.className = 'category-card-wrapper';

  const currentLang = getCurrentLanguage();
  const categoryName = currentLang === 'bg' ? category.name_bg : category.name_en;

  const iconMap = {
    'interior-renovation': 'bi-house-heart',
    'plumbing': 'bi-droplet-fill',
    'electrical': 'bi-lightning-charge-fill',
    'painting': 'bi-paint-bucket',
    'roofing': 'bi-house-fill',
    'construction': 'bi-building-fill-add',
    'moving': 'bi-truck',
    'interior-design': 'bi-palette',
    'furniture': 'bi-chair',
    'cleaning': 'bi-stars',
    'smart-home': 'bi-cpu-fill'
  };

  const iconClass = iconMap[category.slug] || category.icon || 'bi-tools';

  wrapper.innerHTML = `
    <div class="category-card h-100 d-flex flex-column align-items-center justify-content-center">
      <div class="category-icon-wrapper mb-3 p-3 bg-light rounded-circle text-primary">
        <i class="bi ${iconClass}" style="font-size: 2.5rem;"></i>
      </div>
      <h4 class="h6 text-center mb-0 mt-2">${categoryName}</h4>
    </div>
  `;

  wrapper.querySelector('.category-card').addEventListener('click', () => {
    window.location.href = `/companies.html?category=${category.slug}`;
  });

  return wrapper;
}
