/**
 * Public Company Profile Page
 */

import { initI18n, translatePage, t } from '../utils/i18n.js';
import { injectNavbar, injectFooter } from '../components/shared.js';
import { supabase } from '../services/supabase.js';
import { showError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  injectNavbar();
  injectFooter();
  translatePage();

  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');

  if (companyId) {
    loadCompanyData(companyId);
    setupContactForm();
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

    // --- DEMO MODE ENHANCEMENTS ---
    // Inject SoftUni description if missing
    if (company.name.includes('СофтУни') && !company.description) {
      const currentLang = localStorage.getItem('remontco_language') || 'bg';
      company.description = currentLang === 'bg'
        ? 'Лидер в технологичното образование и професионалното обучение.'
        : 'Leader in technology education and professional training.';
    }

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

    // 4. Load Services
    loadServices(id);

    // 5. Load Portfolio (REAL Projects or FAKE if data missing)
    loadPortfolio(id, company.name);

  } catch (err) {
    console.error('Error loading company details:', err);
    showError(t('messages.company_not_found'));
    window.location.href = '/companies.html';
  }
}

async function loadServices(companyId) {
  const servicesContainer = document.getElementById('company-services');
  const currentLang = localStorage.getItem('remontco_language') || 'bg';

  try {
    const { data: services, error } = await supabase
      .from('company_services')
      .select('*, service_categories(*)')
      .eq('company_id', companyId);

    if (error) throw error;

    if (!services || services.length === 0) {
      servicesContainer.innerHTML = `<span class="text-muted italic">${t('company.no_services')}</span>`;
      return;
    }

    servicesContainer.innerHTML = services.map(s => {
      const cat = s.service_categories;
      const name = currentLang === 'bg' ? cat.name_bg : cat.name_en;
      return `<span class="badge rounded-pill bg-light text-primary border border-primary-light px-3 py-2">
                <i class="bi ${cat.icon || 'bi-check2-circle'} me-1"></i> ${name}
              </span>`;
    }).join('');

  } catch (err) {
    console.error('Error loading services:', err);
    servicesContainer.innerHTML = '<span class="text-danger small">Error loading services.</span>';
  }
}

async function loadPortfolio(companyId, companyName) {
  const portfolioContainer = document.getElementById('company-portfolio');
  try {
    const { data: projects, error } = await supabase
      .from('company_portfolio')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let displayProjects = projects || [];

    // --- DEMO MODE ENHANCEMENTS ---
    // If no portfolio and not SoftUni (which might have real data or we want to force it elsewhere)
    // Note: If SoftUni has data in DB, it shows. If not, we generate random ones.
    if (displayProjects.length === 0) {
      // Pool of local project images
      const portfolioPool = [
        {
          url: '/image_1.jpg',
          title: 'Монтажни дейности',
          desc: 'Професионално изпълнение на монтажни работи.'
        },
        {
          url: '/image_2.jpg',
          title: 'Строителен обект',
          desc: 'Комплексни строителни услуги и ремонти.'
        },
        {
          url: '/image_3.jpg',
          title: 'Интериорен дизайн',
          desc: 'Модерни решения за вашия дом.'
        },
        {
          url: '/image_4.jpg',
          title: 'Реновация',
          desc: 'Качествено обновяване на жилищни площи.'
        },
        {
          url: '/image_5.jpg',
          title: 'Довършителни работи',
          desc: 'Фини довършителни дейности и декорации.'
        },
        {
          url: '/image_6.png',
          title: 'Външни ремонти',
          desc: 'Фасадни и външни строителни дейности.'
        }
      ];

      // Deterministically select 1 image based on companyId
      let seed = 0;
      if (companyId) {
        for (let i = 0; i < companyId.length; i++) {
          seed += companyId.charCodeAt(i);
        }
      }

      // Use mod operator to cycle through the 6 images
      const index = seed % portfolioPool.length;
      const selectedImage = portfolioPool[index];

      displayProjects = [{
        image_url: selectedImage.url,
        title: selectedImage.title,
        description: selectedImage.desc
      }];
    }
    // -----------------------------

    if (displayProjects.length === 0) {
      portfolioContainer.innerHTML = `<div class="col-12 text-center text-muted py-4">${t('company.no_portfolio')}</div>`;
      return;
    }

    portfolioContainer.innerHTML = displayProjects.map(project => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-scale portfolio-card" 
                     style="cursor: pointer;"
                     data-url="${project.image_url}"
                     data-title="${project.title || ''}"
                     data-desc="${project.description || ''}">
                    <div class="position-relative">
                        <img src="${project.image_url}" class="card-img-top" alt="${project.title || 'Portfolio'}" style="height: 220px; object-fit: cover;">
                        <div class="portfolio-overlay">
                            <i class="bi bi-zoom-in text-white fs-2"></i>
                        </div>
                    </div>
                    <div class="card-body p-3 text-center">
                        <h6 class="fw-bold mb-1">${project.title || ''}</h6>
                        <p class="text-muted small mb-0">${project.description || ''}</p>
                    </div>
                </div>
            </div>
        `).join('');

    // Attach click events for modal
    const modalEl = document.getElementById('imageViewerModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    const modalImg = document.getElementById('full-portfolio-image');
    const modalTitle = document.getElementById('portfolio-modal-title');
    const modalDesc = document.getElementById('portfolio-modal-desc');

    document.querySelectorAll('.portfolio-card').forEach(card => {
      card.addEventListener('click', () => {
        if (modalImg) modalImg.src = card.dataset.url;
        if (modalTitle) modalTitle.textContent = card.dataset.title;
        if (modalDesc) modalDesc.textContent = card.dataset.desc;
        modal.show();
      });
    });

  } catch (err) {
    console.error('Error loading portfolio:', err);
    portfolioContainer.innerHTML = '<p class="text-muted text-center">Error loading portfolio items.</p>';
  }
}

async function setupContactForm() {
  // Check User Status and update UI
  const { data: { user } } = await supabase.auth.getUser();
  const hireBtn = document.querySelector('a[href="/auth/register.html"][data-i18n="company.hire_button"]');
  const registerCta = document.querySelector('[data-i18n="company.register_cta"]');
  const contactForm = document.getElementById('contactForm');

  if (user && hireBtn) {
    // Check if it's a demo user (optional: treat demo users as anonymous or logged in? User said: "If demo client clicked ... logic is absolutely correct")
    // User SAID: "If registered user steps ... platform takes him to register screen which is wrong."
    // So for registered users (including demo?), show the modal.
    // Wait, user said: "When logged in demo_client ... button takes to register page. Here for demo_client logic is absolutely correct !!!"
    // AND "When real registered user ... platform takes to register screen which is wrong."
    // So:
    // IF Demo User -> Keep Link to Register (as per user request "Here for demo_client... logic is absolutely correct")
    // IF Real User -> Open Modal

    const isDemo = user.email === 'demo@remont.co' || user.email === 'company-demo@remont.co';

    if (!isDemo) {
      // It is a real user
      hireBtn.removeAttribute('href');
      hireBtn.style.cursor = 'pointer';
      hireBtn.dataset.i18n = 'company.contact_button'; // "Send Message"
      hireBtn.textContent = t('company.contact_button') || 'Изпрати запитване';

      // Hide the "register" text
      if (registerCta) {
        registerCta.style.display = 'none';
      }

      // Add click listener to open modal
      hireBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Pre-fill form
        const contactName = document.getElementById('contactName');
        const contactEmail = document.getElementById('contactEmail');

        // We can fetch profile to fill name if needed, but email is in user object
        contactEmail.value = user.email;

        // Fetch profile for name
        supabase.from('profiles').select('first_name, last_name, phone').eq('id', user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              contactName.value = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.username || '';
              document.getElementById('contactPhone').value = profile.phone || '';
            }
          });

        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
      });
    }
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const spinner = document.getElementById('contactBtnSpinner');
      const btnText = document.getElementById('contactBtnText');

      btn.disabled = true;
      spinner.classList.remove('d-none');
      btnText.textContent = t('common.sending') || 'Изпращане...';

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const companyId = urlParams.get('id');

        const payload = {
          company_id: companyId,
          sender_name: document.getElementById('contactName').value,
          sender_email: document.getElementById('contactEmail').value,
          sender_phone: document.getElementById('contactPhone').value,
          message: document.getElementById('contactMessage').value
        };

        const { data, error } = await supabase.functions.invoke('send-company-inquiry', {
          body: payload
        });

        if (error) throw error;

        // Hide modal
        const modalEl = document.getElementById('contactModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Show success
        // We can use a simple alert or a nice toast/modal. User asked for "Modern modal 'Sent successfully'". 
        // We can promote a simple success alert for now or reuse the success modal from register.js if we duplicate it, 
        // OR just use a standard alert for step 1 and improve later. 
        // Let's create a dynamic success modal or just use alert for speed then refine.
        // Actually, let's use a nice Alert since we have `showAlert` in other files, but here we can just alert or use toast.
        // The user specifically asked: "User sees message 'Sent successfully' in a modern modal".
        // I will use `showSuccessModal` logic similar to register.js but I need to inject it or create it.
        // Let's just create a quick Success Modal dynamically.

        showSuccessMessage();
        contactForm.reset();

      } catch (err) {
        console.error('Error sending inquiry:', err);
        showError(t('messages.error_sending') || 'Грешка при изпращане. Моля, опитайте по-късно.');
      } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
        btnText.textContent = t('common.send') || 'Изпрати';
      }
    });
  }
}

function showSuccessMessage() {
  // Check if success modal exists, if not create it
  let modalEl = document.getElementById('inquirySuccessModal');
  if (!modalEl) {
    const modalHtml = `
      <div class="modal fade" id="inquirySuccessModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-4 text-center p-4">
            <div class="modal-body">
              <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px;">
                <i class="bi bi-check-lg fs-2"></i>
              </div>
              <h4 class="fw-bold mb-2 text-success" data-i18n="messages.success">Успешно!</h4>
              <p class="text-muted mb-4" data-i18n="messages.inquiry_sent_desc">Вашето запитване беше изпратено успешно до фирмата.</p>
              <button type="button" class="btn btn-success rounded-pill px-4" data-bs-dismiss="modal">Добре</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modalEl = document.getElementById('inquirySuccessModal');
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}
