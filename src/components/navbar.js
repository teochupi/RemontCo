/**
 * Navbar Component
 * Dynamically renders navigation based on user authentication and role
 */

import { isAuthenticated, hasRole } from '../utils/guards.js';
import { getCurrentUser, signOut } from '../services/supabase.js';
import { t, switchLanguage, getCurrentLanguage } from '../utils/i18n.js';

/**
 * Render navigation bar
 * @param {HTMLElement} container - Container to render navbar into
 */
export async function renderNavbar(container) {
  const authenticated = await isAuthenticated();
  const user = authenticated ? await getCurrentUser() : null;

  const currentLang = getCurrentLanguage();

  const navbar = document.createElement('nav');
  navbar.className = 'navbar navbar-expand-lg navbar-dark bg-dark fixed-top';
  navbar.innerHTML = `
    <div class="container">
      <span class="navbar-brand fw-bold">
        <i class="bi bi-house-check-fill me-2"></i>RemontCo
      </span>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
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
          ${authenticated ? `
            <li class="nav-item">
              <a class="nav-link text-white fw-bold" href="${getDashboardUrl(user?.role)}" data-i18n="nav.dashboard">${t('nav.dashboard')}</a>
            </li>
          ` : ''}
        </ul>
        
        <ul class="navbar-nav align-items-lg-center">
          <!-- Language Switcher -->
          <li class="nav-item me-3">
            <a href="#" class="nav-link text-white fw-bold" id="langToggle">
               ${currentLang === 'bg' ? 'EN' : 'BG'}
            </a>
          </li>
          
          ${!authenticated ? `
            <!-- Not Authenticated -->
            <li class="nav-item">
              <a class="nav-link text-white fw-bold" href="/auth/login.html" data-i18n="nav.login">${t('nav.login')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white fw-bold" href="/auth/register.html" data-i18n="nav.register">${t('nav.register')}</a>
            </li>
          ` : `
            <!-- Authenticated -->
            <li class="nav-item dropdown">
              <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle fs-5"></i>
                <span>${user?.first_name || t('nav.user')}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow">
                <li><a class="dropdown-item py-2" href="${getDashboardUrl(user?.role)}" data-i18n="nav.dashboard"><i class="bi bi-speedometer2 me-2"></i> ${t('nav.dashboard')}</a></li>
                <li><a class="dropdown-item py-2" href="${getDashboardUrl(user?.role)}#profile" data-i18n="nav.profile"><i class="bi bi-person me-2"></i> ${t('nav.profile')}</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2 text-danger" href="#" id="logoutBtn" data-i18n="nav.logout"><i class="bi bi-box-arrow-right me-2"></i> ${t('nav.logout')}</a></li>
              </ul>
            </li>
          `}
        </ul>
      </div>
    </div>
  `;

  container.appendChild(navbar);

  // Add event listeners
  setupNavbarListeners(navbar);
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role) {
  const dashboardMap = {
    'consumer': '/dashboard/consumer.html',
    'company_admin': '/dashboard/company.html',
    'company_member': '/dashboard/company.html',
    'admin': '/dashboard/admin.html'
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
      const currentLang = getCurrentLanguage();
      const newLang = currentLang === 'bg' ? 'en' : 'bg';
      await switchLanguage(newLang);
      window.location.reload(); // Reload to apply language
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
        alert('Error logging out. Please try again.');
      }
    });
  }
}
