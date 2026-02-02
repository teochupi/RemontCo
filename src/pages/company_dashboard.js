import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, getCurrentLanguage, t, translateElement } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { renderNavbar } from '../components/navbar.js';

let currentCompany = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Guard access - Allow company admins, members, admins, and demo users
        const user = await requireRole(['company_admin', 'company_member', 'admin', 'demo']);
        if (!user) return;
        currentUser = user;

        // 2. Initialize UI
        await initI18n();
        await renderNavbar(document.getElementById('navbar-container'));
        translatePage();

        const isDemo = user.role === 'demo' || user.email === 'company-demo@remont.co';

        if (isDemo) {
            setupDemoMode();
        } else {
            // 3. Fetch Company Info
            await loadCompanyDetails(user.id);

            // 4. Load Data (if company exists)
            if (currentCompany) {
                loadAvailableJobs();
                loadMyOffers();
                loadFavorites();
                loadPortfolio();
            }
        }

        // 5. Setup Events
        setupEventListeners(isDemo);

        // 6. Handle hash navigation
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        // 7. Reveal the page
        document.body.classList.add('ready');
    } catch (err) {
        console.error('Initialization error:', err);
        document.body.classList.add('ready');
    }
});

/**
 * Setup Demo Mode: Load random/mock data and show demo notices
 */
async function setupDemoMode() {
    const currentLang = getCurrentLanguage();
    // 1. Mock Company Data
    currentCompany = {
        id: 'demo-company-id',
        name: currentLang === 'bg' ? 'Демо Ремонти ЕООД' : 'Demo Renovation Ltd.',
        eik: '123456789',
        city: currentLang === 'bg' ? 'София' : 'Sofia',
        phone: '0888 123 456',
        address: currentLang === 'bg' ? 'ул. Демонстрационна 10' : '10 Demonstration St.',
        website: 'www.demo-remonti.bg',
        description: currentLang === 'bg'
            ? 'Ние сме лидер в сферата на професионалните ремонти. Това е демо профил за тестване на функционалностите на платформата.'
            : 'We are a leader in the field of professional renovations. This is a demo profile for testing the platform functionalities.',
        is_verified: true
    };

    const companyNameEl = document.getElementById('company-name');
    if (companyNameEl) companyNameEl.textContent = currentCompany.name;

    // Populate profile form
    const fields = {
        'profile-company-name': currentCompany.name,
        'profile-company-eik': currentCompany.eik,
        'profile-company-city': currentCompany.city,
        'profile-company-phone': currentCompany.phone,
        'profile-company-address': currentCompany.address,
        'profile-company-website': currentCompany.website,
        'profile-company-description': currentCompany.description
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    // 2. Show Notice
    const notification = document.getElementById('status-notification');
    if (notification) {
        notification.innerHTML = `
            <div class="alert alert-info border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center p-3 animate-fade-in">
                <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>${t('demo.notice_company')}</div>
            </div>
        `;
    }

    const badge = document.getElementById('verification-badge');
    if (badge) {
        badge.innerHTML = `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
            <i class="bi bi-patch-check-fill me-1"></i> ${t('company.verified')}</span>`;
    }

    // 3. Load Mock Content
    loadAvailableJobs(true); // pass true for isDemo
    loadMyOffers(true);
    loadFavorites(true);
    loadPortfolio(true);
}


async function loadCompanyDetails(userId) {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('owner_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            console.error('No company found for this user');
            return;
        }

        currentCompany = data;

        document.getElementById('company-name').textContent = data.name;

        // Populate profile form
        document.getElementById('profile-company-name').value = data.name;
        document.getElementById('profile-company-eik').value = data.eik;
        document.getElementById('profile-company-city').value = data.city || '';
        document.getElementById('profile-company-phone').value = data.phone || '';
        document.getElementById('profile-company-address').value = data.address || '';
        document.getElementById('profile-company-website').value = data.website || '';
        document.getElementById('profile-company-description').value = data.description || '';

        const badge = document.getElementById('verification-badge');
        const notification = document.getElementById('status-notification');

        if (data.is_verified) {
            badge.innerHTML = `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-patch-check-fill me-1"></i> ${t('company.verified')}</span>`;
            notification.innerHTML = '';
        } else {
            badge.innerHTML = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">
                <i class="bi bi-clock-history me-1"></i> ${t('company.pending')}</span>`;

            notification.innerHTML = `
                <div class="alert alert-warning border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center">
                    <div class="bg-warning text-white rounded-circle p-2 me-3">
                        <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                    </div>
                    <div>
                        <h5 class="alert-heading mb-1 fw-bold">${t('company.pending')}</h5>
                        <p class="mb-0 small opacity-75">Вашият фирмен профил в момента се преглежда от администратор. Ще получите пълни функционалности, след като бъдете верифицирани.</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading company:', err);
    }
}

async function loadAvailableJobs(isDemo = false) {
    const list = document.getElementById('available-jobs-list');
    try {
        let data = [];
        let favIds = new Set();
        const currentLang = getCurrentLanguage();
        const cityMap = {
            'София': 'Sofia',
            'Пловдив': 'Plovdiv',
            'Варна': 'Varna',
            'Стара Загора': 'Stara Zagora',
            'Велико Търново': 'Veliko Tarnovo',
            'Плевен': 'Pleven',
            'Бургас': 'Burgas',
            'Русе': 'Ruse'
        };

        if (isDemo) {
            data = [
                {
                    id: 'demo-job-1',
                    title: currentLang === 'bg' ? 'Ремонт на баня 5кв.м.' : 'Bathroom renovation 5sq.m.',
                    city: 'София',
                    description: currentLang === 'bg'
                        ? 'Търсим фирма за цялостен ремонт на баня - плочки, ВиК и монтаж на санитария.'
                        : 'Looking for a company for a complete bathroom renovation - tiles, plumbing and installation.',
                    created_at: new Date().toISOString(),
                    budget_min: 2500,
                    budget_max: 3500,
                    category: { name_bg: 'ВиК', name_en: 'Plumbing' }
                },
                {
                    id: 'demo-job-2',
                    title: currentLang === 'bg' ? 'Боядисване на офис' : 'Office painting',
                    city: 'Варна',
                    description: currentLang === 'bg'
                        ? 'Освежаващо боядисване на стени и тавани in три стаи. Около 120кв.м. обща площ.'
                        : 'Fresh painting of walls and ceilings in three rooms. About 120sq.m. total area.',
                    created_at: new Date().toISOString(),
                    budget_min: 600,
                    budget_max: 1000,
                    category: { name_bg: 'Бояджийство', name_en: 'Painting' }
                },
                {
                    id: 'demo-job-3',
                    title: currentLang === 'bg' ? 'Смяна на ел. табло' : 'Electrical panel replacement',
                    city: 'Пловдив',
                    description: currentLang === 'bg'
                        ? 'Необходима е смяна на старо ел. табло с нови автоматични предпазители.'
                        : 'Replacement of an old electrical panel with new automatic fuses is required.',
                    created_at: new Date().toISOString(),
                    budget_min: 200,
                    budget_max: 400,
                    category: { name_bg: 'Ел. Инсталации', name_en: 'Electrical' }
                }
            ];
        } else {
            // Fetch approved jobs
            const { data: realData, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    category:service_categories(name_bg, name_en)
                `)
                .eq('status', 'approved')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            data = realData;

            // Fetch user favorites
            const { data: favs } = await supabase
                .from('favorites')
                .select('job_id')
                .eq('company_id', currentCompany.id);

            favIds = new Set(favs?.map(f => f.job_id) || []);
        }

        if (data.length === 0) {
            list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="mb-3 text-muted opacity-25">
                        <i class="bi bi-clipboard-x fs-1"></i>
                    </div>
                    <p class="text-muted">${t('market.no_jobs')}</p>
                </div>`;
            return;
        }

        list.innerHTML = data.map(job => `
            <div class="col-12">
                <div class="card shadow-sm border-0 mb-3 rounded-4 hover-lift">
                    <div class="card-body p-4">
                        <div class="row align-items-start">
                            <div class="col-md-8">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill small uppercase">
                                        ${currentLang === 'bg' ? job.category?.name_bg : job.category?.name_en}
                                    </span>
                                    <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${new Date(job.created_at).toLocaleDateString()}</small>
                                </div>
                                <h5 class="fw-bold mb-2">${job.title}</h5>
                                <p class="text-muted small mb-0"><i class="bi bi-geo-alt me-1"></i> ${currentLang === 'en' && cityMap[job.city] ? cityMap[job.city] : (job.city || job.location)}</p>
                                <p class="mt-3 text-secondary text-italic">${job.description}</p>
                            </div>
                            <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                <div class="mb-3">
                                    <span class="fs-4 fw-bold text-primary">${(job.budget_max || job.budget_min) ? (job.budget_max || job.budget_min) + ' EUR' : t('common.negotiable')}</span>
                                </div>
                                 <button class="btn btn-primary rounded-pill px-4 send-offer-btn" 
                                         data-id="${job.id}" 
                                         data-title="${job.title}">
                                        <i class="bi bi-send-fill me-2"></i> ${t('offers.send_offer')}
                                </button>
                                <button class="btn ${favIds.has(job.id) ? 'btn-danger' : 'btn-outline-danger'} border-0 rounded-circle ms-2 toggle-favorite-btn" 
                                        data-id="${job.id}" 
                                        title="${favIds.has(job.id) ? 'Премахни от наблюдавани' : 'Добави в наблюдавани'}">
                                    <i class="bi ${favIds.has(job.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
                                </button>
                                ${!currentCompany.is_verified ? `<div class="small text-danger mt-1">Очаква верификация</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading jobs:', err);
    }
}

async function loadMyOffers(isDemo = false) {
    const list = document.getElementById('company-offers-list');
    if (!currentCompany) return;

    try {
        const currentLang = getCurrentLanguage();

        if (isDemo) {
            data = [
                {
                    id: 'demo-offer-1',
                    status: 'pending',
                    price: 2800,
                    timeline_days: 10,
                    message: currentLang === 'bg'
                        ? 'Здравейте, можем да започнем ремонта на вашата баня още следващата седмица. Имаме голям опит с подобни малки проекти.'
                        : 'Hello, we can start your bathroom renovation as early as next week. We have great experience with such small projects.',
                    created_at: new Date().toISOString(),
                    job: {
                        title: currentLang === 'bg' ? 'Ремонт на баня 5кв.м.' : 'Bathroom renovation 5sq.m.',
                        city: currentLang === 'bg' ? 'София' : 'Sofia'
                    }
                },
                {
                    id: 'demo-offer-2',
                    status: 'accepted',
                    price: 850,
                    timeline_days: 3,
                    message: currentLang === 'bg'
                        ? 'Предлагаме качествено боядисване с латекс по ваш избор. Срокът за изпълнение е 3 работни дни.'
                        : 'We offer high-quality latex painting of your choice. The completion time is 3 working days.',
                    created_at: new Date().toISOString(),
                    job: {
                        title: currentLang === 'bg' ? 'Боядисване на офис' : 'Office painting',
                        city: currentLang === 'bg' ? 'Варна' : 'Varna'
                    }
                }
            ];
        } else {
            const { data: realData, error } = await supabase
                .from('quotes')
                .select(`
                    *,
                    job:jobs(title, city)
                `)
                .eq('company_id', currentCompany.id)
                .eq('is_hidden_by_company', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            data = realData;
        }

        if (data.length === 0) {
            list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Все още нямате изпратени оферти.</p>
                </div>`;
            return;
        }

        list.innerHTML = data.map(offer => {
            const jobTitle = offer.job?.title || 'Архивирана / Изтрита обява';
            const jobCity = offer.job?.city || '';
            const isJobDeleted = !offer.job;

            return `
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 mb-3">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="fw-bold mb-0">${jobTitle}</h6>
                                ${isJobDeleted ?
                    '<span class="badge bg-secondary-subtle text-secondary small">Архив</span>' :
                    `<small class="text-muted"><i class="bi bi-geo-alt me-1"></i> ${jobCity}</small>`
                }
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge ${offer.status === 'accepted' ? 'bg-success' : offer.status === 'rejected' ? 'bg-danger' : 'bg-primary'} px-3 py-2 rounded-pill">
                                    ${offer.status === 'pending' ? t('offers.status_pending') : offer.status === 'accepted' ? t('offers.status_accepted') : t('offers.status_rejected')}
                                </span>
                                <button class="btn btn-sm btn-outline-danger border-0 rounded-circle delete-offer-btn" data-id="${offer.id}" title="Изтрий от моя списък">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <p class="mb-1 small text-muted">${t('offers.price_label')}:</p>
                                <p class="fw-bold fs-5 mb-0">${offer.price} ${t('common.currency_bgn')}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1 small text-muted">${t('offers.timeline')}:</p>
                                <p class="mb-0">${offer.timeline_days || t('common.not_specified')} ${t('dashboard_consumer.days')}</p>
                            </div>
                        </div>
                        <div class="mt-3 p-3 bg-light rounded-3 small">
                            <p class="mb-0 text-secondary">${offer.message}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Error loading offers:', err);
    }
}
async function loadFavorites(isDemo = false) {
    const list = document.getElementById('favorites-list');
    if (!currentCompany) return;

    try {
        let data = [];
        const currentLang = getCurrentLanguage();
        const cityMap = {
            'София': 'Sofia',
            'Пловдив': 'Plovdiv',
            'Варна': 'Varna',
            'Стара Загора': 'Stara Zagora',
            'Велико Търново': 'Veliko Tarnovo',
            'Плевен': 'Pleven',
            'Бургас': 'Burgas',
            'Русе': 'Ruse'
        };

        if (isDemo) {
            data = [
                {
                    job: {
                        id: 'demo-job-3',
                        title: currentLang === 'bg' ? 'Смяна на ел. табло' : 'Electrical panel replacement',
                        city: 'Пловдив',
                        description: currentLang === 'bg'
                            ? 'Необходима е смяна на старо ел. табло с нови автоматични предпазители.'
                            : 'Replacement of an old electrical panel with new automatic fuses is required.',
                        created_at: new Date().toISOString(),
                        budget_min: 200,
                        budget_max: 400,
                        category: { name_bg: 'Ел. Инсталации', name_en: 'Electrical' }
                    }
                }
            ];
        } else {
            const { data: realData, error } = await supabase
                .from('favorites')
                .select(`
                *,
                job: jobs(
                        *,
                    category: service_categories(name_bg, name_en)
                )
                    `)
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            data = realData;
        }

        if (data.length === 0) {
            list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Нямате добавени обяви за наблюдение.</p>
                </div>`;
            return;
        }

        list.innerHTML = data.map(fav => {
            const job = fav.job;
            if (!job) return ''; // Handled by ON DELETE CASCADE, but for safety

            return `
            <div class="col-12">
                <div class="card shadow-sm border-0 mb-3 rounded-4">
                    <div class="card-body p-4">
                        <div class="row align-items-start">
                            <div class="col-md-8">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill small uppercase">
                                        ${currentLang === 'bg' ? job.category?.name_bg : job.category?.name_en}
                                    </span>
                                    <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${new Date(job.created_at).toLocaleDateString()}</small>
                                </div>
                                <h5 class="fw-bold mb-2">${job.title}</h5>
                                <p class="text-muted small mb-0"><i class="bi bi-geo-alt me-1"></i> ${currentLang === 'en' && cityMap[job.city] ? cityMap[job.city] : (job.city || job.location)}</p>
                                <p class="mt-3 text-secondary text-italic">${job.description}</p>
                            </div>
                            <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                <div class="mb-3">
                                    <span class="fs-4 fw-bold text-primary">${(job.budget_max || job.budget_min) ? (job.budget_max || job.budget_min) + ' EUR' : t('common.negotiable')}</span>
                                </div>
                                <div class="d-flex flex-column gap-2 align-items-md-end">
                                    <button class="btn btn-primary rounded-pill px-4 send-offer-btn"
                                        data-id="${job.id}"
                                        data-title="${job.title}">
                                        <i class="bi bi-send-fill me-1"></i> ${t('offers.send_offer')}
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm rounded-pill remove-favorite-btn w-auto" data-id="${job.id}">
                                        <i class="bi bi-heart-fill me-1"></i> ${t('common.remove')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading favorites:', err);
    }
}

async function toggleFavorite(jobId) {
    if (!currentCompany) return;

    try {
        // Check if already in favorites
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('company_id', currentCompany.id)
            .eq('job_id', jobId)
            .maybeSingle();

        if (existing) {
            await supabase.from('favorites').delete().eq('id', existing.id);
        } else {
            await supabase.from('favorites').insert({
                company_id: currentCompany.id,
                job_id: jobId
            });
        }

        // Refresh views
        await loadAvailableJobs();
        await loadFavorites();
    } catch (err) {
        console.error('Error toggling favorite:', err);
    }
}

function setupEventListeners(isDemo = false) {
    // Delegation for Job Offer Buttons
    const jobsList = document.getElementById('available-jobs-list');
    if (jobsList) {
        jobsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.send-offer-btn');
            if (btn) {
                console.log('Send offer button clicked for job:', btn.dataset.id);
                const jobId = btn.dataset.id;
                const jobTitle = btn.dataset.title;

                document.getElementById('modal-job-id').value = jobId;

                const titleEl = document.querySelector('#offerModal .modal-title');
                if (titleEl) {
                    titleEl.textContent = `${t('offers.send_offer')}: ${jobTitle} `;
                }

                const modalEl = document.getElementById('offerModal');
                if (modalEl) {
                    translateElement(modalEl);
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                }
            }
        });
        jobsList.addEventListener('click', async (e) => {
            const favBtn = e.target.closest('.toggle-favorite-btn');
            if (favBtn) {
                const jobId = favBtn.dataset.id;
                await toggleFavorite(jobId);
            }
        });
    }

    // Fail-safe global listener
    window.addEventListener('click', (e) => {
        const btn = e.target.closest('.send-offer-btn');
        if (btn && !bootstrap.Modal.getInstance(document.getElementById('offerModal'))) {
            console.log('Failsafe trigger for modal');
            const jobId = btn.dataset.id;
            const jobTitle = btn.dataset.title;
            document.getElementById('modal-job-id').value = jobId;
            const titleEl = document.querySelector('#offerModal .modal-title');
            if (titleEl) titleEl.textContent = `${t('offers.send_offer')}: ${jobTitle} `;
            const modalEl = document.getElementById('offerModal');
            translateElement(modalEl);
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    });

    // Delegation for Sidebar Watchlist
    const favoritesList = document.getElementById('favorites-list');
    if (favoritesList) {
        favoritesList.addEventListener('click', async (e) => {
            const removeBtn = e.target.closest('.remove-favorite-btn');
            const sendOfferBtn = e.target.closest('.send-offer-btn');

            if (removeBtn) {
                const jobId = removeBtn.dataset.id;
                await toggleFavorite(jobId);
            }

            if (sendOfferBtn) {
                const jobId = sendOfferBtn.dataset.id;
                const jobTitle = sendOfferBtn.dataset.title;

                document.getElementById('modal-job-id').value = jobId;
                const titleEl = document.querySelector('#offerModal .modal-title');
                if (titleEl) titleEl.textContent = `${t('offers.send_offer')}: ${jobTitle} `;

                const modalEl = document.getElementById('offerModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                }
            }
        });
    }

    // Delegation for Offer Deletion
    const offersList = document.getElementById('company-offers-list');
    if (offersList) {
        offersList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-offer-btn');
            if (deleteBtn) {
                if (isDemo) {
                    alert(t('demo.demo_alert'));
                    return;
                }
                const offerId = deleteBtn.dataset.id;

                if (confirm('Сигурни ли сте, че искате да премахнете тази оферта от вашето табло?')) {
                    try {
                        const { error } = await supabase
                            .from('quotes')
                            .update({ is_hidden_by_company: true })
                            .eq('id', offerId);

                        if (error) throw error;
                        loadMyOffers();
                    } catch (err) {
                        alert('Грешка: ' + err.message);
                    }
                }
            }
        });
    }

    const offerForm = document.getElementById('submit-offer-form');
    if (offerForm) {
        offerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isDemo) {
                alert(t('demo.demo_alert'));
                return;
            }

            const submitBtn = offerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Изпращане...';

            const jobId = document.getElementById('modal-job-id').value;
            const fileInput = document.getElementById('offer-file');
            let fileUrl = null;

            try {
                if (!currentCompany || !currentUser) {
                    throw new Error('Липсват данни за фирмата или потребителя. Моля, опитайте да презаредите страницата.');
                }

                console.log('Starting offer submission for job:', jobId);

                // 1. Insert Quote first
                const quoteData = {
                    job_id: jobId,
                    company_id: currentCompany.id,
                    offered_by: currentUser.id,
                    price: parseFloat(document.getElementById('offer-price').value),
                    price_unit: document.getElementById('offer-unit').value,
                    message: document.getElementById('offer-message').value,
                    timeline_days: parseInt(document.getElementById('offer-duration').value) || null,
                    status: 'pending'
                };

                const { data: insertedQuote, error: quoteError } = await supabase
                    .from('quotes')
                    .insert([quoteData])
                    .select()
                    .single();

                if (quoteError) {
                    console.error('Quote insertion error:', quoteError);
                    throw quoteError;
                }

                console.log('Quote inserted successfully:', insertedQuote.id);

                // 2. Handle File Upload if present
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${jobId}-${currentCompany.id}.${fileExt}`;
                    const filePath = `offers/${fileName}`;

                    console.log('Uploading file:', filePath);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('business-docs')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('File upload error:', uploadError);
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('business-docs')
                        .getPublicUrl(filePath);

                    fileUrl = publicUrl;

                    // Create media record linked to the quote
                    const { error: mediaError } = await supabase.from('media').insert({
                        uploaded_by: currentUser.id,
                        entity_type: 'quote',
                        entity_id: insertedQuote.id,
                        file_name: file.name,
                        file_url: fileUrl,
                        file_type: file.type,
                        file_size: file.size
                    });

                    if (mediaError) {
                        console.warn('Media record creation failed (offer still sent):', mediaError);
                    }
                }

                console.log('Offer submission completed successfully');
                alert('Офертата е изпратена успешно!');

                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('offerModal'));
                if (modalInstance) modalInstance.hide();

                offerForm.reset();
                loadMyOffers();

            } catch (err) {
                console.error('Submission caught error:', err);
                alert('Грешка при изпращане на оферта: ' + (err.message || 'Възникна неочаквана грешка'));
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = t('offers.send_offer');
            }
        });
    }

    const profileForm = document.getElementById('company-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            const updateData = {
                name: document.getElementById('profile-company-name').value,
                city: document.getElementById('profile-company-city').value,
                phone: document.getElementById('profile-company-phone').value,
                address: document.getElementById('profile-company-address').value,
                website: document.getElementById('profile-company-website').value,
                description: document.getElementById('profile-company-description').value,
                updated_at: new Date().toISOString()
            };

            try {
                if (isDemo) {
                    alert(t('demo.demo_alert'));
                    return;
                }
                const { error } = await supabase
                    .from('companies')
                    .update(updateData)
                    .eq('id', currentCompany.id);

                if (error) throw error;

                document.getElementById('company-name').textContent = updateData.name;
                alert('Профилът е обновен успешно!');
            } catch (err) {
                alert('Грешка при обновяване: ' + err.message);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Hash navigation sync
    const tabButtons = document.querySelectorAll('button[data-bs-toggle="pill"]');
    tabButtons.forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            const hash = e.target.getAttribute('data-bs-target').replace('#v-pills-', '#');
            history.replaceState(null, null, hash);
        });
    });

    // Portfolio Form
    const portfolioForm = document.getElementById('portfolio-form');
    if (portfolioForm) {
        portfolioForm.addEventListener('submit', (e) => {
            if (isDemo) {
                e.preventDefault();
                alert(t('demo.demo_alert'));
                return;
            }
            handlePortfolioSubmit(e);
        });
    }
}

function handleHashNavigation() {
    const hash = window.location.hash;
    if (!hash) return;
    const tabId = `v-pills-${hash.substring(1)}-tab`;
    const tabBtn = document.getElementById(tabId);
    if (tabBtn) tabBtn.click();
}

async function loadPortfolio(isDemo = false) {
    const list = document.getElementById('company-portfolio-list');
    if (!currentCompany) return;

    try {
        let data = [];
        const currentLang = getCurrentLanguage();
        if (isDemo) {
            data = [
                {
                    id: 'demo-port-1',
                    title: currentLang === 'bg' ? 'Луксозен апартамент Лозенец' : 'Luxury Apartment Lozenets',
                    description: currentLang === 'bg' ? 'Цялостен интериорен проект и изпълнение.' : 'Complete interior project and execution.',
                    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: 'demo-port-2',
                    title: currentLang === 'bg' ? 'Реновация на къща в Бистрица' : 'House Renovation in Bistritsa',
                    description: currentLang === 'bg' ? 'Фасадна изолация и нов покрив.' : 'Facade insulation and new roof.',
                    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
                }
            ];
        } else {
            const { data: realData, error } = await supabase
                .from('company_portfolio')
                .select('*')
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            data = realData;
        }

        if (data.length === 0) {
            list.innerHTML = `
            <div class="col-12 text-center py-5">
                    <div class="mb-3 text-muted opacity-25">
                        <i class="bi bi-images fs-1"></i>
                    </div>
                    <p class="text-muted">Все още нямате добавени проекти в портфолиото.</p>
                </div>`;
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <img src="${item.image_url}" class="card-img-top" alt="${item.title}" style="height: 200px; object-fit: cover;">
                        <div class="card-body p-3">
                            <h6 class="fw-bold mb-1">${item.title}</h6>
                            <p class="text-muted small mb-3">${item.description || ''}</p>
                            <button class="btn btn-outline-danger btn-sm rounded-pill w-100 delete-portfolio-btn" data-id="${item.id}">
                                <i class="bi bi-trash3 me-1"></i> Изтрий
                            </button>
                    </div>
                </div>
            </div>
            `).join('');

        // Attach delete events
        document.querySelectorAll('.delete-portfolio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (isDemo) {
                    alert(t('demo.demo_alert'));
                    return;
                }
                deletePortfolioItem(btn.dataset.id);
            });
        });

    } catch (err) {
        console.error('Error loading portfolio:', err);
    }
}

async function handlePortfolioSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Качване...';

        const title = document.getElementById('portfolio-title').value;
        const description = document.getElementById('portfolio-description').value;
        const imageFile = document.getElementById('portfolio-image').files[0];

        if (!imageFile) throw new Error('Моля, изберете снимка.');

        // 1. Upload image to Storage
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${currentCompany.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(fileName);

        // 3. Insert into Database
        const { error: dbError } = await supabase
            .from('company_portfolio')
            .insert({
                company_id: currentCompany.id,
                title,
                description,
                image_url: publicUrl
            });

        if (dbError) throw dbError;

        // Success
        bootstrap.Modal.getInstance(document.getElementById('portfolioModal')).hide();
        e.target.reset();
        await loadPortfolio();
        alert('Проектът беше добавен успешно!');

    } catch (err) {
        console.error('Error adding portfolio project:', err);
        alert('Грешка при добавяне: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function deletePortfolioItem(id) {
    if (!confirm('Сигурни ли сте, че искате да изтриете този проект от портфолиото си?')) return;

    try {
        const { error } = await supabase
            .from('company_portfolio')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await loadPortfolio();
    } catch (err) {
        console.error('Error deleting portfolio item:', err);
        alert('Грешка при изтриване.');
    }
}
