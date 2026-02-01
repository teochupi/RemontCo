/**
 * Public Company Profile Page
 */

import { initI18n, translatePage, t } from '../utils/i18n.js';
import { injectNavbar, injectFooter } from '../components/shared.js';
import { supabase } from '../services/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  injectNavbar();
  injectFooter();
  translatePage();

  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');

  if (companyId) {
    loadCompanyData(companyId);
  } else {
    window.location.href = '/companies.html';
  }
});

async function loadCompanyData(id) {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Set UI
    document.getElementById('company-name').textContent = company.name;
    document.getElementById('breadcrumb-company-name').textContent = company.name;
    document.title = `${company.name} - ${t('nav.profile')} | RemontCo`;

    document.getElementById('company-description').textContent = company.description || t('demo.no_description');
    document.getElementById('company-address').textContent = `${company.address || 'N/A'}, ${company.city || ''}`;
    document.getElementById('company-phone').textContent = company.phone || 'N/A';
    document.getElementById('company-email').textContent = company.email || 'N/A';

    if (company.website) {
      const webEl = document.getElementById('company-website');
      const displayUrl = company.website.replace(/^https?:\/\//, '');
      const fullUrl = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      webEl.innerHTML = `<a href="${fullUrl}" target="_blank">${displayUrl}</a>`;
    }

    const badges = document.getElementById('company-badges');
    if (company.is_verified) {
      badges.innerHTML = `<span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i> ${t('company.verified_partner')}</span>`;
    } else {
      badges.innerHTML = `<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i> ${t('company.under_verification')}</span>`;
    }

    // 4. Load Portfolio (REAL Projects)
    loadPortfolio(id);

  } catch (err) {
    console.error('Error loading company details:', err);
    alert('Company not found.');
    window.location.href = '/companies.html';
  }
}

async function loadPortfolio(companyId) {
  const portfolioContainer = document.getElementById('company-portfolio');
  try {
    const { data: projects, error } = await supabase
      .from('company_portfolio')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!projects || projects.length === 0) {
      portfolioContainer.innerHTML = `<div class="col-12 text-center text-muted py-4">${t('company.no_portfolio')}</div>`;
      return;
    }

    portfolioContainer.innerHTML = projects.map(project => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-scale portfolio-card" 
                     style="cursor: pointer;"
                     data-url="${project.image_url}"
                     data-title="${project.title}"
                     data-desc="${project.description || ''}">
                    <div class="position-relative">
                        <img src="${project.image_url}" class="card-img-top" alt="${project.title}" style="height: 220px; object-fit: cover;">
                        <div class="portfolio-overlay">
                            <i class="bi bi-zoom-in text-white fs-2"></i>
                        </div>
                    </div>
                    <div class="card-body p-3 text-center">
                        <h6 class="fw-bold mb-1">${project.title}</h6>
                        <p class="text-muted small mb-0">${project.description || ''}</p>
                    </div>
                </div>
            </div>
        `).join('');

    // Attach click events for modal
    const modal = new bootstrap.Modal(document.getElementById('imageViewerModal'));
    const modalImg = document.getElementById('full-portfolio-image');
    const modalTitle = document.getElementById('portfolio-modal-title');
    const modalDesc = document.getElementById('portfolio-modal-desc');

    document.querySelectorAll('.portfolio-card').forEach(card => {
      card.addEventListener('click', () => {
        modalImg.src = card.dataset.url;
        modalTitle.textContent = card.dataset.title;
        modalDesc.textContent = card.dataset.desc;
        modal.show();
      });
    });

  } catch (err) {
    console.error('Error loading portfolio:', err);
    portfolioContainer.innerHTML = '<p class="text-muted text-center">Error loading portfolio items.</p>';
  }
}
