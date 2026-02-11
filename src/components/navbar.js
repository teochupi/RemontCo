/**
 * Navbar Component
 * Dynamically renders navigation based on user authentication and role
 */

import { isAuthenticated, hasRole } from '../utils/guards.js';
import { supabase, getCurrentUser, signOut } from '../services/supabase.js';
import { t, switchLanguage, getCurrentLanguage } from '../utils/i18n.js';
import { showError } from '../utils/toast.js';

/**
 * Render navigation bar
 * @param {HTMLElement} container - Container to render navbar into
 */
export async function renderNavbar(container, options = {}) {
  const isForceGuest = options.forceGuest || false;
  const authenticated = isForceGuest ? false : await isAuthenticated();
  const user = authenticated ? await getCurrentUser() : null;

  const currentLang = getCurrentLanguage();

  const navbar = document.createElement('nav');
  navbar.className = 'navbar navbar-expand-lg navbar-dark bg-dark fixed-top';
  navbar.innerHTML = `
    <div class="container">
      <a class="navbar-brand fw-bold" href="/index.html">
        <i class="bi bi-house-check-fill me-2"></i>RemontCo
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        ${!options.hideLinks ? `
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link text-white fw-bold" href="/index.html" data-i18n="nav.home">${t('nav.home')}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link text-white fw-bold" href="/companies.html" data-i18n="nav.companies">${t('nav.companies')}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link text-white fw-bold" href="/about.html" data-i18n="nav.about">${t('nav.about')}</a>
          </li>
        </ul>
        ` : '<ul class="navbar-nav me-auto"></ul>'}

        
        <ul class="navbar-nav align-items-lg-center">
          <!-- Language Switcher -->
          <li class="nav-item me-3">
            <a href="#" class="nav-link text-white fw-bold" id="langToggle">
               ${currentLang === 'bg' ? 'EN' : 'BG'}
            </a>
          </li>
          
          ${!options.hideAuth ? (!authenticated ? `
            <!-- Not Authenticated -->
            <li class="nav-item">
              <a class="nav-link text-white fw-bold d-flex align-items-center gap-1" href="#" id="demoBtn">
                <i class="bi bi-magic"></i>
                <span data-i18n="nav.demo">${t('nav.demo')}</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white fw-bold mx-2" href="/auth/login.html" data-i18n="nav.login">${t('nav.login')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white fw-bold" href="/auth/register.html" data-i18n="nav.register">${t('nav.register')}</a>
            </li>
          ` : `
            <!-- Authenticated -->
            <li class="nav-item dropdown">
              <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle fs-5"></i>
                <span>${user?.username || user?.first_name || t('nav.user')}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow">
                <li><a class="dropdown-item py-2" href="${getDashboardUrl(user?.role)}" data-i18n="nav.dashboard"><i class="bi bi-speedometer2 me-2"></i> ${t('nav.dashboard')}</a></li>

                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2 text-danger" href="#" id="logoutBtn" data-i18n="nav.logout"><i class="bi bi-box-arrow-right me-2"></i> ${t('nav.logout')}</a></li>
              </ul>
            </li>
          `) : ''}
        </ul>
      </div>
    </div>
  `;

  container.appendChild(navbar);

  // Add event listeners
  setupNavbarListeners(navbar);

  // Render Modal if not already present
  if (!document.getElementById('demoModal')) {
    renderDemoModal();
  }
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role) {
  const dashboardMap = {
    'consumer': '/dashboard/consumer.html',
    'company': '/dashboard/company.html',
    'admin': '/dashboard/admin.html',
    'demo': '/dashboard/consumer.html'
  };
  return dashboardMap[role] || '/index.html';
}

/**
 * Setup navbar event listeners
 */
function setupNavbarListeners(navbar) {
  // Language switcher
  const langToggle = navbar.querySelector('#langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', async (e) => {
      e.preventDefault();
      sessionStorage.setItem('remontco_lang_switch', 'true');
      const currentLang = getCurrentLanguage();
      const newLang = currentLang === 'bg' ? 'en' : 'bg';
      await switchLanguage(newLang);
      window.location.reload();
    });
  }

  // Logout button
  const logoutBtn = navbar.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut();
      } catch (error) {
        console.error('Logout error:', error);
        showError(t('messages.logout_error'));
      }
    });
  }

  // Demo button click
  const demoBtn = navbar.querySelector('#demoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = new bootstrap.Modal(document.getElementById('demoModal'));
      modal.show();
    });
  }
}

/**
 * Render Demo Role Selection Modal
 */
function renderDemoModal() {
  const modalHtml = `
    <div class="modal fade" id="demoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <div class="modal-header bg-dark text-white border-0 p-4">
          <div>
            <h5 class="modal-title fw-bold fs-4 mb-1">${t('demo.modal_title')}</h5>
            <p class="text-white-50 mb-0 small">${t('demo.modal_subtitle')}</p>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4 bg-light">
          <div class="row g-3">
            <!-- Consumer Demo -->
            <div class="col-12">
              <button class="btn btn-white border shadow-sm w-100 p-4 text-start rounded-4 demo-select-btn" data-type="consumer">
                <div class="d-flex align-items-center gap-4">
                  <div class="flex-shrink-0 bg-primary-subtle text-primary rounded-3 p-3">
                    <i class="bi bi-person-circle fs-2"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-1">${t('demo.as_consumer')}</h6>
                    <p class="text-muted small mb-0">${t('demo.as_consumer_desc')}</p>
                  </div>
                  <i class="bi bi-chevron-right ms-auto text-muted"></i>
                </div>
              </button>
            </div>

            <!-- Company Demo -->
            <div class="col-12">
              <button class="btn btn-white border shadow-sm w-100 p-4 text-start rounded-4 demo-select-btn" data-type="company">
                <div class="d-flex align-items-center gap-4">
                  <div class="flex-shrink-0 bg-success-subtle text-success rounded-3 p-3">
                    <i class="bi bi-building fs-2"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-1">${t('demo.as_company')}</h6>
                    <p class="text-muted small mb-0">${t('demo.as_company_desc')}</p>
                  </div>
                  <i class="bi bi-chevron-right ms-auto text-muted"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-light border-0 px-4 pb-4">
          <p class="text-muted small mb-0 w-100 text-center">
            <i class="bi bi-info-circle me-1"></i> ${t('demo.notice').replace(/<\/?[^>]+(>|$)/g, "")}
          </p>
        </div>
      </div>
    </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add click listeners to demo buttons
  document.querySelectorAll('.demo-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      const email = type === 'consumer' ? 'demo@remont.co' : 'company-demo@remont.co';
      const password = 'demo123'; // Standard demo password for both now

      try {
        btn.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
        btn.disabled = true;

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Redirect based on role
        const redirectTo = type === 'consumer' ? '/dashboard/consumer.html' : '/dashboard/company.html';
        window.location.href = redirectTo;
      } catch (err) {
        console.error('Demo login error:', err);
        showError(t('demo.login_error'));
        btn.disabled = false;
        // Restore content (simplified)
        window.location.reload();
      }
    });
  });
}
