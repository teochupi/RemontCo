/**
 * Public Company Profile Page
 */

import { initI18n, translatePage } from '../utils/i18n.js';
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
    document.title = `${company.name} - Company Profile | RemontCo`;
    
    document.getElementById('company-description').textContent = company.description || 'No description provided.';
    document.getElementById('company-address').textContent = `${company.address || 'N/A'}, ${company.city || ''}`;
    document.getElementById('company-phone').textContent = company.phone || 'N/A';
    document.getElementById('company-email').textContent = company.email || 'N/A';
    
    if (company.website) {
      const webEl = document.getElementById('company-website');
      webEl.innerHTML = `<a href="${company.website}" target="_blank">${company.website.replace('https://','')}</a>`;
    }

    const badges = document.getElementById('company-badges');
    if (company.is_verified) {
      badges.innerHTML = '<span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i> Verified Partner</span>';
    } else {
      badges.innerHTML = '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i> Under Verification</span>';
    }

  } catch (err) {
    console.error('Error loading company details:', err);
    alert('Company not found.');
    window.location.href = '/companies.html';
  }
}
