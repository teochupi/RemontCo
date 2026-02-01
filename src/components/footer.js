/**
 * Footer Component
 * Renders site footer with links and information
 */

import { t, getCurrentLanguage } from '../utils/i18n.js';

/**
 * Render footer
 * @param {HTMLElement} container - Container to render footer into
 */
export function renderFooter(container) {
  const currentYear = new Date().getFullYear();

  const footer = document.createElement('footer');
  footer.className = 'bg-dark text-light py-5 mt-auto';
  footer.innerHTML = `
    <div class="container">
      <div class="row">
        <!-- About Section -->
        <div class="col-lg-4 mb-4 mb-lg-0">
          <h5 class="mb-3">
            <i class="bi bi-house-check-fill me-2 text-primary"></i>
            RemontCo
          </h5>
          <p class="text-white">
            ${t('footer.about_text')}
          </p>
          <div class="mt-3 d-flex gap-3">
            <a href="https://www.linkedin.com/in/teodor-chupetlov" target="_blank" 
               class="d-inline-flex align-items-center justify-content-center text-white hover-primary fs-4" 
               style="text-decoration: none;">
              <i class="bi bi-linkedin"></i>
            </a>
            <a href="https://github.com/teochupi" target="_blank" 
               class="d-inline-flex align-items-center justify-content-center text-white hover-primary fs-4" 
               style="text-decoration: none;">
              <i class="bi bi-github"></i>
            </a>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div class="col-lg-2 col-md-4 mb-4 mb-lg-0">
          <h6 class="text-uppercase mb-3 fw-bold text-white">${t('footer.quick_links')}</h6>
          <ul class="list-unstyled">
            <li class="mb-2">
              <a href="/index.html" class="text-decoration-none text-white hover-primary">${t('nav.home')}</a>
            </li>
            <li class="mb-2">
              <a href="/companies.html" class="text-decoration-none text-white hover-primary">${t('nav.companies')}</a>
            </li>
            <li class="mb-2">
              <a href="/about.html" class="text-decoration-none text-white hover-primary">${t('nav.about')}</a>
            </li>
            <li class="mb-2">
              <a href="/docs.html" class="text-decoration-none text-white hover-primary">${t('nav.docs')}</a>
            </li>
          </ul>
        </div>
        
        <!-- For Consumers -->
        <div class="col-lg-2 col-md-4 mb-4 mb-lg-0">
          <h6 class="text-uppercase mb-3 fw-bold text-white">${t('footer.for_consumers')}</h6>
          <ul class="list-unstyled">
            <li class="mb-2">
              <a href="/auth/register.html" class="text-decoration-none text-white hover-primary">${t('nav.register')}</a>
            </li>
            <li class="mb-2">
              <a href="/auth/login.html" class="text-decoration-none text-white hover-primary">${t('nav.login')}</a>
            </li>

          </ul>
        </div>
        
        <!-- For Companies -->
        <div class="col-lg-2 col-md-4 mb-4 mb-lg-0">
          <h6 class="text-uppercase mb-3 fw-bold text-white">${t('footer.for_companies')}</h6>
          <ul class="list-unstyled">
            <li class="mb-2">
              <a href="/auth/register.html?type=company" class="text-decoration-none text-white hover-primary">${t('hero.cta_company')}</a>
            </li>
            <li class="mb-2">
              <a href="/auth/login.html" class="text-decoration-none text-white hover-primary">${t('nav.login')}</a>
            </li>
          </ul>
        </div>
        
        <!-- Legal -->
        <div class="col-lg-2 col-md-4">
          <h6 class="text-uppercase mb-3 fw-bold text-white">${t('footer.legal')}</h6>
          <ul class="list-unstyled">
            <li class="mb-2">
              <a href="/docs.html#terms" class="text-decoration-none text-white hover-primary">${t('footer.terms')}</a>
            </li>
            <li class="mb-2">
              <a href="/docs.html#privacy" class="text-decoration-none text-white hover-primary">${t('footer.privacy')}</a>
            </li>
            <li class="mb-2">
              <a href="/docs.html#contact" class="text-decoration-none text-white hover-primary">${t('footer.contact')}</a>
            </li>
          </ul>
        </div>
      </div>
      
      <hr class="my-4 bg-secondary">
      
      <!-- Copyright -->
      <div class="row">
        <div class="col-12 text-center text-white">
          <small>
            &copy; ${currentYear} Made by <a href="https://teodor-chupetlov.eu" target="_blank" class="text-white text-decoration-none fw-bold hover-primary">Teodor Chupetlov</a>
          </small>
        </div>
      </div>
    </div>
  `;

  container.appendChild(footer);
}
