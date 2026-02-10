import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, getCurrentLanguage, t, translateElement } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { renderNavbar } from '../components/navbar.js';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { showConfirm } from '../utils/confirmModal.js';

let currentCompany = null;
let currentUser = null;
let allAvailableJobs = [];
let allFavIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Guard access - Allow company admins, members, admins, and demo users
        const user = await requireRole(['company', 'admin', 'demo']);
        if (!user) return;
        currentUser = user;

        // 2. Initialize UI
        await initI18n();
        await renderNavbar(document.getElementById('navbar-container'));
        translatePage();

        const { data: { user: authUser } } = await supabase.auth.getUser();
        const isDemo = user.role === 'demo' || authUser?.email === 'company-demo@remont.co';

        if (isDemo) {
            setupDemoMode();
        } else {
            // 3. Fetch Company Info
            await loadCompanyDetails(user.id);

            // 4. Load Data (if company exists)
            if (currentCompany) {
                if (currentCompany.is_verified) {
                    loadAvailableJobs();
                    loadMyOffers();
                    loadFavorites();
                } else {
                    showVerificationPendingOverlay();
                }
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
 * Apply pending categories from user metadata (stored during registration)
 */
async function applyPendingCategories(companyId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const categories = user.user_metadata?.company_categories;
        if (!categories || categories.length === 0) return;

        // Check if categories already exist for this company
        const { data: existingServices } = await supabase
            .from('company_services')
            .select('id')
            .eq('company_id', companyId)
            .limit(1);

        if (existingServices && existingServices.length > 0) return;

        // Insert categories
        const serviceRecords = categories.map(catId => ({
            company_id: companyId,
            category_id: catId
        }));

        await supabase.from('company_services').insert(serviceRecords);
        console.log('Applied pending categories from user metadata');
    } catch (err) {
        console.error('Error applying pending categories:', err);
    }
}

/**
 * Create company from user metadata (fallback if trigger didn't run)
 */
async function createCompanyFromMetadata(userId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const meta = user.user_metadata;
        if (!meta?.company_name) return null;

        const { data: company, error } = await supabase
            .from('companies')
            .insert({
                owner_id: userId,
                name: meta.company_name,
                eik: meta.company_eik || '',
                city: meta.company_city,
                phone: meta.company_phone,
                address: meta.company_address,
                description: meta.company_description,
                website: meta.company_website,
                email: meta.email,
                is_verified: false,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating company from metadata:', error);
            return null;
        }

        console.log('Created company from user metadata (fallback)');
        return company;
    } catch (err) {
        console.error('Error in createCompanyFromMetadata:', err);
        return null;
    }
}

/**
 * Show the "No Company" section and hide the main dashboard
 * Shows a message that the company is being processed or needs to be registered
 */
function showNoCompanySection(hasMetadata = false) {
    const noCompanySection = document.getElementById('no-company-section');
    const sidebar = document.querySelector('.col-lg-3');
    const tabContent = document.getElementById('v-pills-tabContent');

    if (noCompanySection) {
        noCompanySection.classList.remove('d-none');

        if (hasMetadata) {
            // User registered but company creation failed - show error with retry
            noCompanySection.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle display-1 text-warning mb-4"></i>
                    <h3>${t('company.creation_error_title') || 'Грешка при създаване на фирма'}</h3>
                    <p class="text-muted mb-4">${t('company.creation_error_message') || 'Възникна проблем при създаването на вашата фирма. Моля, опитайте отново или се свържете с поддръжката.'}</p>
                    <button class="btn btn-primary me-2" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise me-2"></i>${t('common.retry') || 'Опитай отново'}
                    </button>
                    <a href="mailto:support@remont.co" class="btn btn-outline-secondary">
                        <i class="bi bi-envelope me-2"></i>${t('common.contact_support') || 'Свържете се с нас'}
                    </a>
                </div>
            `;
        } else {
            // User has no company data - needs to register first
            noCompanySection.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-building display-1 text-muted mb-4"></i>
                    <h3>${t('company.no_company_title') || 'Нямате регистрирана фирма'}</h3>
                    <p class="text-muted mb-4">${t('company.no_company_message') || 'Регистрирайте вашата фирма, за да започнете да получавате заявки.'}</p>
                    <a href="/auth/register.html?type=company" class="btn btn-primary">
                        <i class="bi bi-building-add me-2"></i>${t('company.register_company') || 'Регистрирай фирма'}
                    </a>
                </div>
            `;
        }
    }
    if (sidebar) sidebar.classList.add('d-none');
    if (tabContent) tabContent.classList.add('d-none');

    document.getElementById('company-name')?.closest('.card')?.classList.add('d-none');
}

/**
 * Handle company creation form submission
 */
async function handleCreateCompany(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>...';

    try {
        const companyData = {
            owner_id: currentUser.id,
            name: document.getElementById('new-company-name').value.trim(),
            eik: document.getElementById('new-company-eik').value.trim(),
            city: document.getElementById('new-company-city').value.trim(),
            phone: document.getElementById('new-company-phone').value.trim() || null,
            description: document.getElementById('new-company-description').value.trim() || null,
            is_verified: false
        };

        const { data, error } = await supabase
            .from('companies')
            .insert(companyData)
            .select()
            .single();

        if (error) throw error;

        currentCompany = data;
        window.location.reload();

    } catch (err) {
        console.error('Error creating company:', err);
        showError(t('messages.generic_error'));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

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

/**
 * Format offer price with currency and unit
 * Handles backward compatibility for old offers without unit field
 */
function formatOfferPrice(offer) {
    if (!offer.price) {
        return t('common.negotiable');
    }

    // Unit translation mapping
    const unitMap = {
        'm2': { bg: 'кв.м.', en: 'sq.m.' },
        'lm': { bg: 'л.м.', en: 'lin.m.' },
        'kg': { bg: 'кг.', en: 'kg' },
        'ton': { bg: 'тон', en: 'ton' },
        'hour': { bg: 'час', en: 'hour' },
        'total': null // No unit for total price
    };

    // New offers have unit field
    if (offer.unit && offer.unit !== 'total') {
        const currentLang = getCurrentLanguage();
        const translatedUnit = unitMap[offer.unit]?.[currentLang] || offer.unit;
        return `${offer.price} EUR/${translatedUnit}`;
    }

    // If unit is 'total' or null, show price without unit
    if (offer.unit === 'total' || offer.unit === null) {
        return `${offer.price} EUR`;
    }

    // Old offers without unit field - assume m2 as most common unit
    const currentLang = getCurrentLanguage();
    const defaultUnit = unitMap['m2'][currentLang];
    return `${offer.price} EUR/${defaultUnit}`;
}


async function loadCompanyDetails(userId) {
    try {
        let { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('owner_id', userId)
            .maybeSingle();

        if (error) throw error;

        // If no company exists, try to create from user metadata (fallback for missing trigger)
        if (!data) {
            console.log('No company found - attempting fallback creation from metadata');
            data = await createCompanyFromMetadata(userId);

            if (!data) {
                // Check if user has company metadata (registered but creation failed)
                const { data: { user } } = await supabase.auth.getUser();
                const hasMetadata = !!user?.user_metadata?.company_name;
                console.log('Could not create company - hasMetadata:', hasMetadata);
                showNoCompanySection(hasMetadata);
                return;
            }
        }

        currentCompany = data;

        // Apply pending categories from registration if any
        await applyPendingCategories(data.id);

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
                        <p class="mb-0 small opacity-75">${t('dashboard_company.verification_required_desc')}</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading company:', err);
    }
}

function showVerificationPendingOverlay() {
    const overlayHTML = `
        <div class="col-12">
            <div class="text-center py-5 px-4">
                <div class="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle mb-4" style="width: 100px; height: 100px;">
                    <i class="bi bi-shield-lock text-warning" style="font-size: 2.8rem;"></i>
                </div>
                <h4 class="fw-bold mb-3">${t('dashboard_company.verification_required_title')}</h4>
                <p class="text-muted mb-4 mx-auto" style="max-width: 480px;">${t('dashboard_company.verification_required_desc')}</p>
                <div class="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                    <div class="d-flex align-items-center gap-2 text-muted small">
                        <div class="bg-success bg-opacity-10 rounded-circle p-2">
                            <i class="bi bi-1-circle-fill text-success"></i>
                        </div>
                        <span>${t('dashboard_company.verification_step_1')}</span>
                    </div>
                    <i class="bi bi-chevron-right text-muted d-none d-sm-block"></i>
                    <div class="d-flex align-items-center gap-2 text-muted small">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2">
                            <i class="bi bi-2-circle-fill text-primary"></i>
                        </div>
                        <span>${t('dashboard_company.verification_step_2')}</span>
                    </div>
                    <i class="bi bi-chevron-right text-muted d-none d-sm-block"></i>
                    <div class="d-flex align-items-center gap-2 text-muted small">
                        <div class="bg-warning bg-opacity-10 rounded-circle p-2">
                            <i class="bi bi-3-circle-fill text-warning"></i>
                        </div>
                        <span>${t('dashboard_company.verification_step_3')}</span>
                    </div>
                </div>
            </div>
        </div>`;

    const jobsList = document.getElementById('available-jobs-list');
    if (jobsList) {
        const filterBar = jobsList.closest('.tab-pane')?.querySelector('.d-flex.flex-wrap');
        if (filterBar) filterBar.style.display = 'none';
        const filterBadge = document.getElementById('city-filter-badge');
        if (filterBadge) filterBadge.style.display = 'none';
        jobsList.innerHTML = overlayHTML;
    }

    const offersList = document.getElementById('company-offers-list');
    if (offersList) {
        offersList.innerHTML = overlayHTML;
    }

    const favoritesList = document.getElementById('favorites-list');
    if (favoritesList) {
        favoritesList.innerHTML = overlayHTML;
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
            // Fetch approved jobs - ONLY real jobs (is_demo = false) for real companies
            const { data: realData, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    category:service_categories(name_bg, name_en)
                `)
                .eq('status', 'approved')
                .eq('is_demo', false)
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

        allAvailableJobs = data;
        allFavIds = favIds;

        populateCityFilter(data);

        const cityFilter = document.getElementById('city-filter');
        const selectedCity = cityFilter?.value;
        if (selectedCity) {
            const filtered = data.filter(j => j.city === selectedCity);
            renderAvailableJobs(filtered, favIds, true);
        } else {
            renderAvailableJobs(data, favIds);
        }

    } catch (err) {
        console.error('Error loading jobs:', err);
    }
}

function populateCityFilter(jobs) {
    const filter = document.getElementById('city-filter');
    if (!filter) return;

    const currentLang = getCurrentLanguage();
    const cityMap = {
        'Благоевград': 'Blagoevgrad', 'Бургас': 'Burgas', 'Варна': 'Varna',
        'Велико Търново': 'Veliko Tarnovo', 'Видин': 'Vidin', 'Враца': 'Vratsa',
        'Габрово': 'Gabrovo', 'Добрич': 'Dobrich', 'Кърджали': 'Kardzhali',
        'Кюстендил': 'Kyustendil', 'Ловеч': 'Lovech', 'Монтана': 'Montana',
        'Пазарджик': 'Pazardzhik', 'Перник': 'Pernik', 'Плевен': 'Pleven',
        'Пловдив': 'Plovdiv', 'Разград': 'Razgrad', 'Русе': 'Ruse',
        'Силистра': 'Silistra', 'Сливен': 'Sliven', 'Смолян': 'Smolyan',
        'София': 'Sofia', 'Стара Загора': 'Stara Zagora', 'Търговище': 'Targovishte',
        'Хасково': 'Haskovo', 'Шумен': 'Shumen', 'Ямбол': 'Yambol'
    };

    const cities = [...new Set(jobs.map(j => j.city).filter(Boolean))].sort();

    while (filter.options.length > 1) filter.remove(1);

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = currentLang === 'en' && cityMap[city] ? cityMap[city] : city;
        filter.appendChild(option);
    });
}

function renderAvailableJobs(data, favIds, isFiltered = false) {
    const list = document.getElementById('available-jobs-list');
    const currentLang = getCurrentLanguage();
    const cityMap = {
        'София': 'Sofia', 'Пловдив': 'Plovdiv', 'Варна': 'Varna',
        'Стара Загора': 'Stara Zagora', 'Велико Търново': 'Veliko Tarnovo',
        'Плевен': 'Pleven', 'Бургас': 'Burgas', 'Русе': 'Ruse',
        'Благоевград': 'Blagoevgrad', 'Видин': 'Vidin', 'Враца': 'Vratsa',
        'Габрово': 'Gabrovo', 'Добрич': 'Dobrich', 'Кърджали': 'Kardzhali',
        'Кюстендил': 'Kyustendil', 'Ловеч': 'Lovech', 'Монтана': 'Montana',
        'Пазарджик': 'Pazardzhik', 'Перник': 'Pernik', 'Разград': 'Razgrad',
        'Силистра': 'Silistra', 'Сливен': 'Sliven', 'Смолян': 'Smolyan',
        'Търговище': 'Targovishte', 'Хасково': 'Haskovo', 'Шумен': 'Shumen',
        'Ямбол': 'Yambol'
    };

    if (data.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="mb-3 text-muted opacity-25">
                    <i class="bi ${isFiltered ? 'bi-funnel' : 'bi-clipboard-x'} fs-1"></i>
                </div>
                <p class="text-muted">${isFiltered ? t('common.no_results') : t('market.no_jobs')}</p>
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
}

async function loadMyOffers(isDemo = false) {
    const list = document.getElementById('company-offers-list');
    if (!currentCompany) return;

    try {
        const currentLang = getCurrentLanguage();
        let data = [];

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
                                <p class="fw-bold fs-5 mb-0">${formatOfferPrice(offer)}</p>
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
    if (!currentCompany || !currentCompany.is_verified) return;

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
    const cityFilter = document.getElementById('city-filter');
    if (cityFilter) {
        cityFilter.addEventListener('change', () => {
            const selectedCity = cityFilter.value;
            const badge = document.getElementById('city-filter-badge');
            const label = document.getElementById('city-filter-label');

            if (selectedCity) {
                const selectedText = cityFilter.options[cityFilter.selectedIndex].text;
                if (badge) badge.classList.remove('d-none');
                if (label) label.textContent = selectedText;
                const filtered = allAvailableJobs.filter(j => j.city === selectedCity);
                renderAvailableJobs(filtered, allFavIds, true);
            } else {
                if (badge) badge.classList.add('d-none');
                renderAvailableJobs(allAvailableJobs, allFavIds, false);
            }
        });
    }

    const clearCityFilter = document.getElementById('clear-city-filter');
    if (clearCityFilter) {
        clearCityFilter.addEventListener('click', () => {
            const cityFilter = document.getElementById('city-filter');
            if (cityFilter) cityFilter.value = '';
            const badge = document.getElementById('city-filter-badge');
            if (badge) badge.classList.add('d-none');
            renderAvailableJobs(allAvailableJobs, allFavIds);
        });
    }

    // Delegation for Job Offer Buttons
    const jobsList = document.getElementById('available-jobs-list');
    if (jobsList) {
        jobsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.send-offer-btn');
            if (btn) {
                if (currentCompany && !currentCompany.is_verified) return;
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
        if (btn && !bootstrap.Modal.getInstance(document.getElementById('offerModal')) && (!currentCompany || currentCompany.is_verified)) {
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
                if (currentCompany && !currentCompany.is_verified) return;
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
                    showWarning(t('demo.demo_alert'));
                    return;
                }
                const offerId = deleteBtn.dataset.id;

                const confirmed = await showConfirm(t('messages.confirm_remove_offer'), {
                    title: t('common.confirm'),
                    confirmText: t('common.remove'),
                    confirmClass: 'btn-danger'
                });
                if (confirmed) {
                    try {
                        const { error } = await supabase
                            .from('quotes')
                            .update({ is_hidden_by_company: true })
                            .eq('id', offerId);

                        if (error) throw error;
                        loadMyOffers();
                    } catch (err) {
                        showError(t('messages.generic_error'));
                    }
                }
            }
        });
    }

    // Toggle price input based on negotiable checkbox
    const negotiableCheckbox = document.getElementById('offer-price-negotiable');
    const priceInput = document.getElementById('offer-price');
    if (negotiableCheckbox && priceInput) {
        negotiableCheckbox.addEventListener('change', () => {
            priceInput.disabled = negotiableCheckbox.checked;
            if (negotiableCheckbox.checked) {
                priceInput.value = '';
            }
        });
    }

    const offerForm = document.getElementById('submit-offer-form');
    if (offerForm) {
        // Reset form when modal is shown
        const offerModal = document.getElementById('offerModal');
        if (offerModal) {
            offerModal.addEventListener('show.bs.modal', () => {
                offerForm.reset();
                if (priceInput) priceInput.disabled = false;
            });
        }

        offerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isDemo) {
                showWarning(t('demo.demo_alert'));
                return;
            }

            if (currentCompany && !currentCompany.is_verified) return;

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
                    price: document.getElementById('offer-price-negotiable').checked || !document.getElementById('offer-price').value
                        ? null
                        : parseFloat(document.getElementById('offer-price').value),
                    currency: 'EUR',
                    unit: document.getElementById('offer-unit').value === 'total' ? null : document.getElementById('offer-unit').value,
                    is_negotiable: document.getElementById('offer-price-negotiable').checked || !document.getElementById('offer-price').value,
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

                // 3. Trigger Email Notification (Non-blocking)
                supabase.functions.invoke('send-offer-email', {
                    body: { record: insertedQuote }
                }).then(({ error }) => {
                    if (error) console.error('Email notification failed:', error);
                });

                showSuccess(t('messages.offer_sent'));

                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('offerModal'));
                if (modalInstance) modalInstance.hide();

                offerForm.reset();
                loadMyOffers();

            } catch (err) {
                console.error('Submission caught error:', err);
                showError(t('messages.generic_error'));
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
                    showWarning(t('demo.demo_alert'));
                    return;
                }
                const { error } = await supabase
                    .from('companies')
                    .update(updateData)
                    .eq('id', currentCompany.id);

                if (error) throw error;

                document.getElementById('company-name').textContent = updateData.name;
                showSuccess(t('messages.profile_updated'));
            } catch (err) {
                showError(t('messages.generic_error'));
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
                showWarning(t('demo.demo_alert'));
                return;
            }
            handlePortfolioSubmit(e);
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn-settings');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        });
    }

    // Change Password Handler
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            if (isDemo) {
                showWarning(t('demo.demo_alert'));
                return;
            }
            const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            modal.show();
        });
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPasswordModal').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            const alertContainer = document.getElementById('password-alert-container');
            const saveBtn = document.getElementById('savePasswordBtn');
            const spinner = document.getElementById('passwordSpinner');

            alertContainer.innerHTML = '';

            if (newPassword !== confirmPassword) {
                showPasswordAlert('danger', t('messages.password_mismatch'));
                return;
            }

            if (newPassword.length < 6) {
                showPasswordAlert('danger', t('messages.password_too_short') || 'Паролата трябва да е поне 6 символа.');
                return;
            }

            saveBtn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const { data: { user } } = await supabase.auth.getUser();
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword
                });

                if (signInError) {
                    showPasswordAlert('danger', t('messages.wrong_current_password') || 'Грешна текуща парола.');
                    saveBtn.disabled = false;
                    spinner.classList.add('d-none');
                    return;
                }

                const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (updateError) throw updateError;

                showPasswordAlert('success', t('messages.password_changed_success') || 'Паролата е променена успешно!');

                setTimeout(() => {
                    changePasswordForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                    alertContainer.innerHTML = '';
                }, 2000);

            } catch (error) {
                console.error('Password change error:', error);
                showPasswordAlert('danger', t('messages.generic_error'));
            } finally {
                saveBtn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    }

    function showPasswordAlert(type, message) {
        const alertContainer = document.getElementById('password-alert-container');
        const icon = type === 'danger'
            ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>'
            : '<i class="bi bi-check-circle-fill me-2"></i>';

        alertContainer.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center mb-3" role="alert">
                ${icon}
                <div>${message}</div>
            </div>
        `;
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
                    showWarning(t('demo.demo_alert'));
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
        showSuccess(t('messages.portfolio_added'));

    } catch (err) {
        console.error('Error adding portfolio project:', err);
        showError(t('messages.generic_error'));
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function deletePortfolioItem(id) {
    const confirmed = await showConfirm(t('messages.confirm_delete_project'), {
        title: t('common.confirm'),
        confirmText: t('common.delete'),
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from('company_portfolio')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await loadPortfolio();
    } catch (err) {
        console.error('Error deleting portfolio item:', err);
        showError(t('messages.generic_error'));
    }
}
