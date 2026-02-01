import { supabase } from '../services/supabase.js';
import { initI18n, getCurrentLanguage, t, translatePage } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { translateElement } from '../utils/i18n.js';

let loadedJobs = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Guard access - Allow consumers, admins, and demo users
        const userProfile = await requireRole(['consumer', 'admin', 'demo']);

        // 2. Initialize UI
        await initI18n();
        await renderNavbar(document.getElementById('navbar-container'));
        renderFooter(document.getElementById('footer-container'));
        translatePage();

        // Set User Info
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = userProfile.username || (userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User');
        }

        // Fill Profile Form
        const firstNameInput = document.getElementById('profile-first-name');
        const lastNameInput = document.getElementById('profile-last-name');
        const phoneInput = document.getElementById('profile-phone');

        if (firstNameInput) firstNameInput.value = userProfile.first_name || '';
        if (lastNameInput) lastNameInput.value = userProfile.last_name || '';
        if (phoneInput) phoneInput.value = userProfile.phone || '';

        // 3. Load UI Data
        loadCategories();

        if (userProfile.role === 'demo') {
            setupDemoMode();
        } else {
            loadUserJobs(userProfile.id);
            setupEventListeners(userProfile.id);
        }

        // 4. Handle initial hash for navigation
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        // 5. Reveal the page
        document.body.classList.add('ready');
    } catch (err) {
        console.error('Initialization error:', err);
        document.body.classList.add('ready');
    }
});

/**
 * Setup Demo Mode: Load random data and show demo notices
 */
async function setupDemoMode() {
    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.textContent = 'Demo User';

    // Show companies tab link (if exists)
    const companiesTabBtn = document.getElementById('v-pills-companies-tab');
    if (companiesTabBtn) companiesTabBtn.classList.remove('d-none');

    // Show notice
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-info border-0 shadow-sm mb-4 rounded-4 d-flex align-items-center p-3 animate-fade-in">
                <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>${t('demo.notice')}</div>
            </div>
        `;
    }

    // Load random data
    loadRandomJobs();
    loadRandomCompanies();

    // Setup events with isDemo=true
    setupEventListeners(null, true);
}

async function loadRandomJobs() {
    try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data, error } = await supabase
            .from('jobs')
            .select('*, category:service_categories(name_bg, name_en)')
            .eq('consumer_id', user.user.id)
            .limit(5);

        if (error) throw error;
        renderJobs(data);
    } catch (err) {
        console.error('Demo jobs error:', err);
    }
}

async function loadRandomCompanies() {
    const companiesList = document.getElementById('demo-companies-list');
    if (!companiesList) return;

    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('is_verified', true)
            .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
            companiesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted fw-medium">${t('demo.no_companies')}</p>
                </div>
            `;
            return;
        }

        companiesList.innerHTML = data.map(company => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-hover">
                    <div class="card-body p-4 text-center">
                        <div class="mb-3">
                            <i class="bi bi-building fs-1 text-primary"></i>
                        </div>
                        <h5 class="card-title fw-bold text-dark">${company.name}</h5>
                        <p class="text-muted small mb-3"><i class="bi bi-geo-alt me-1"></i> ${company.city}</p>
                        <hr class="opacity-10">
                        <p class="card-text text-truncate-2 small opacity-75">${company.description || t('demo.no_description')}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Demo companies error:', err);
    }
}

function renderJobs(data) {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;

    if (!data || data.length === 0) {
        jobsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder2-open fs-1 text-muted opacity-25 mb-3"></i>
                <p class="text-muted fw-medium">${t('dashboard_consumer.no_jobs')}</p>
            </div>
        `;
        return;
    }

    const currentLang = getCurrentLanguage();
    jobsList.innerHTML = data.map(job => {
        const title = (currentLang === 'en' && job.title_en) ? job.title_en : job.title;
        const description = (currentLang === 'en' && job.description_en) ? job.description_en : job.description;
        const categoryName = (job.category && currentLang === 'bg') ? job.category.name_bg : (job.category ? job.category.name_en : '');
        const city = job.city || job.location;
        const isRejected = job.status === 'rejected';
        const now = new Date();
        const expiryDate = new Date(job.expires_at || job.created_at);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = diffDays <= 0;

        return `
            <div class="col-12 mb-4">
                <div class="card shadow-sm border-0 job-card h-100 rounded-4 overflow-hidden ${isRejected ? 'border-start border-danger border-4' : ''}">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge ${getStatusBadgeClass(job.status)} px-3 py-2 rounded-pill uppercase small">
                                    ${t('ads.status_' + job.status)}
                                </span>
                                ${!isExpired ? `
                                    <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill small">
                                        <i class="bi bi-clock-history me-1"></i> ${t('dashboard_consumer.expires_in')} ${diffDays} ${t('dashboard_consumer.days')}
                                    </span>
                                ` : `
                                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill small">
                                        <i class="bi bi-exclamation-triangle me-1"></i> ${t('dashboard_consumer.expired')}
                                    </span>
                                `}
                            </div>
                            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${new Date(job.created_at).toLocaleDateString(currentLang === 'bg' ? 'bg-BG' : 'en-US')}</small>
                        </div>
                        <h5 class="card-title fw-bold text-dark mb-2">${title}</h5>
                        <div class="d-flex gap-3 mb-3 small text-muted">
                            <span><i class="bi bi-tag me-1"></i> ${categoryName}</span>
                            <span><i class="bi bi-geo-alt me-1"></i> ${city}</span>
                        </div>

                        ${isRejected ? `
                            <div class="alert alert-danger border-0 rounded-3 mb-3 small d-flex">
                                <i class="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
                                <div>
                                    <div class="fw-bold">Обявата изисква корекция:</div>
                                    <div>${job.moderation_reason || 'Не е посочена конкретна причина.'}</div>
                                    <div class="mt-2 text-decoration-underline" style="cursor: pointer;" onclick="document.querySelector('.view-job-btn[data-id=\\'${job.id}\\']').click()">
                                        Редактирайте и изпратете отново
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <p class="card-text text-dark opacity-75 text-truncate-3">${description}</p>
                        `}

                        <div class="mt-4 border-top pt-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <span class="h5 mb-0 fw-bold text-primary">${job.budget_max ? job.budget_max + ' EUR' : t('common.negotiable')}</span>
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-sm btn-outline-info px-3 rounded-pill fw-bold extend-job-btn" data-id="${job.id}">
                                    <i class="bi bi-arrow-clockwise me-1"></i> ${t('dashboard_consumer.extend')}
                                </button>
                                <button class="btn btn-sm btn-outline-danger px-3 rounded-pill fw-bold delete-job-btn" data-id="${job.id}">
                                    <i class="bi bi-trash me-1"></i> ${t('dashboard_consumer.delete')}
                                </button>
                                ${job.quotes_count > 0 ? `
                                    <button class="btn btn-sm btn-success px-4 rounded-pill fw-bold view-offers-btn" data-id="${job.id}">
                                        <i class="bi bi-chat-left-text me-1"></i> ${job.quotes_count} ${t('dashboard_consumer.offers')}
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-primary px-4 rounded-pill fw-bold view-job-btn" data-id="${job.id}">
                                    <i class="bi bi-pencil me-1"></i> ${t('common.edit')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadCategories() {
    const categorySelect = document.getElementById('job-category');
    const editCategorySelect = document.getElementById('edit-job-category');
    if (!categorySelect && !editCategorySelect) return;

    try {
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('name_bg', { ascending: true });

        if (error) throw error;

        const currentLang = getCurrentLanguage();

        data.forEach(cat => {
            const name = currentLang === 'bg' ? cat.name_bg : cat.name_en;
            if (categorySelect) {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = name;
                categorySelect.appendChild(option);
            }
            if (editCategorySelect) {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = name;
                editCategorySelect.appendChild(option);
            }
        });
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

async function loadUserJobs(userId) {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;

    try {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                expires_at,
                category:service_categories(name_bg, name_en),
                quotes:quotes(
                    id, 
                    price, 
                    message, 
                    status, 
                    created_at,
                    is_hidden_by_consumer,
                    company:companies(name, city, is_verified)
                )
            `)
            .eq('consumer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out hidden quotes and recalculate count
        loadedJobs = data.map(job => {
            const visibleQuotes = (job.quotes || []).filter(q => !q.is_hidden_by_consumer);
            return {
                ...job,
                quotes: visibleQuotes,
                quotes_count: visibleQuotes.length
            };
        });

        renderJobs(loadedJobs);

    } catch (err) {
        console.error('Error loading jobs:', err);
        jobsList.innerHTML = `<div class="alert alert-soft-danger rounded-4 p-4 border">${t('common.error')}</div>`;
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'approved': return 'bg-success-subtle text-success border border-success-subtle';
        case 'pending': return 'bg-warning-subtle text-warning border border-warning-subtle';
        case 'draft': return 'bg-light text-dark border';
        case 'closed': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
        case 'rejected': return 'bg-danger-subtle text-danger border border-danger-subtle';
        default: return 'bg-light text-dark border';
    }
}

/**
 * Delete a job posting
 * @param {string} jobId 
 */
async function deleteJob(jobId) {
    if (!confirm(t('dashboard_consumer.delete_confirm'))) return;

    try {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId);

        if (error) throw error;

        alert(t('common.success'));
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
            await loadUserJobs(user.user.id);
        }
    } catch (err) {
        console.error('Error deleting job:', err);
        alert(t('common.error') + ': ' + err.message);
    }
}

/**
 * Extend a job posting expiration by 90 days
 * @param {string} jobId 
 */
async function extendJob(jobId) {
    try {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 90);

        const { error } = await supabase
            .from('jobs')
            .update({
                expires_at: newExpiry.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        if (error) throw error;

        alert(t('common.success'));
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
            await loadUserJobs(user.user.id);
        }
    } catch (err) {
        console.error('Error extending job:', err);
        alert(t('common.error') + ': ' + err.message);
    }
}

function setupEventListeners(userId, isDemo = false) {
    // Handle view/edit button clicks
    document.addEventListener('click', async (e) => {
        const viewBtn = e.target.closest('.view-job-btn');
        if (viewBtn) {
            const jobId = viewBtn.dataset.id;
            const job = loadedJobs.find(j => j.id === jobId);
            if (job) {
                openEditModal(job);
            }
        }

        const offersBtn = e.target.closest('.view-offers-btn');
        if (offersBtn) {
            const jobId = offersBtn.dataset.id;
            const job = loadedJobs.find(j => j.id === jobId);
            if (job) {
                openOffersModal(job);
            }
        }
    });

    const jobForm = document.getElementById('post-job-form');
    if (jobForm) {
        if (isDemo) {
            const btn = jobForm.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = `<i class="bi bi-slash-circle me-2"></i> ${t('demo.post_disabled')}`;
                btn.classList.replace('btn-primary', 'btn-secondary');
            }
        }

        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isDemo) {
                alert(t('demo.edit_disabled'));
                return;
            }

            const btn = jobForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            const isNegotiable = document.getElementById('job-budget-negotiable').checked;
            const jobData = {
                consumer_id: userId,
                title: document.getElementById('job-title').value,
                category_id: document.getElementById('job-category').value,
                description: document.getElementById('job-description').value,
                city: document.getElementById('job-location').value,
                budget_max: isNegotiable ? null : (document.getElementById('job-budget').value || null),
                status: 'pending'
            };

            try {
                const { error } = await supabase
                    .from('jobs')
                    .insert([jobData]);

                if (error) throw error;

                alert(t('messages.success'));
                jobForm.reset();
                document.getElementById('v-pills-jobs-tab').click();
                loadUserJobs(userId);
            } catch (err) {
                alert(t('common.error') + ': ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        if (isDemo) {
            const btn = profileForm.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = `<i class="bi bi-slash-circle me-2"></i> ${t('demo.save_disabled')}`;
                btn.classList.replace('btn-primary', 'btn-secondary');
            }
        }
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isDemo) {
                alert(t('demo.edit_disabled'));
                return;
            }

            const btn = profileForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            const updateData = {
                first_name: document.getElementById('profile-first-name').value,
                last_name: document.getElementById('profile-last-name').value,
                phone: document.getElementById('profile-phone').value,
                updated_at: new Date().toISOString()
            };

            try {
                const { error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userId);

                if (error) throw error;

                alert(t('common.success'));
                document.getElementById('username').textContent = `${updateData.first_name} ${updateData.last_name}`;
            } catch (err) {
                alert(t('common.error') + ': ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    const editJobForm = document.getElementById('edit-job-form');
    if (editJobForm) {
        if (isDemo) {
            const btn = editJobForm.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = `<i class="bi bi-slash-circle me-2"></i> ${t('demo.save_disabled')}`;
                btn.classList.replace('btn-primary', 'btn-secondary');
            }
        }
        editJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isDemo) {
                alert(t('demo.edit_disabled'));
                return;
            }

            const btn = editJobForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            const jobId = document.getElementById('edit-job-id').value;
            const isNegotiable = document.getElementById('edit-job-budget-negotiable').checked;
            const jobData = {
                title: document.getElementById('edit-job-title').value,
                category_id: document.getElementById('edit-job-category').value,
                description: document.getElementById('edit-job-description').value,
                city: document.getElementById('edit-job-location').value,
                budget_max: isNegotiable ? null : (document.getElementById('edit-job-budget').value || null),
                status: 'pending', // Send back for approval
                moderation_reason: null,
                updated_at: new Date().toISOString()
            };

            try {
                const { error } = await supabase
                    .from('jobs')
                    .update(jobData)
                    .eq('id', jobId);

                if (error) throw error;

                // Close modal
                const modalEl = document.getElementById('editJobModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                alert(t('messages.success'));
                loadUserJobs(userId);
            } catch (err) {
                alert(t('common.error') + ': ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn-profile');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        });
    }

    // Delegation for Job Card Buttons
    const jobsList = document.getElementById('jobs-list');
    if (jobsList) {
        jobsList.addEventListener('click', async (e) => {
            const viewJobBtn = e.target.closest('.view-job-btn');
            const viewOffersBtn = e.target.closest('.view-offers-btn');

            if (viewJobBtn) {
                const jobId = viewJobBtn.dataset.id;
                const job = loadedJobs.find(j => j.id === jobId);
                if (job) openEditModal(job);
            }

            if (viewOffersBtn) {
                const jobId = viewOffersBtn.dataset.id;
                const job = loadedJobs.find(j => j.id === jobId);
                if (job) await openOffersModal(job);
            }

            const deleteJobBtn = e.target.closest('.delete-job-btn');
            if (deleteJobBtn) {
                const jobId = deleteJobBtn.dataset.id;
                await deleteJob(jobId);
            }

            const extendJobBtn = e.target.closest('.extend-job-btn');
            if (extendJobBtn) {
                const jobId = extendJobBtn.dataset.id;
                await extendJob(jobId);
            }
        });
        // Toggle budget input based on negotiable checkbox
        const setupBudgetToggle = (checkboxId, inputId) => {
            const checkbox = document.getElementById(checkboxId);
            const input = document.getElementById(inputId);
            if (checkbox && input) {
                checkbox.addEventListener('change', () => {
                    input.disabled = checkbox.checked;
                    if (checkbox.checked) input.value = '';
                });
            }
        };

        setupBudgetToggle('job-budget-negotiable', 'job-budget');
        setupBudgetToggle('edit-job-budget-negotiable', 'edit-job-budget');
    }

    // Delegation for Offer Action Buttons (Accept/Reject)
    const offersContainer = document.getElementById('offers-container');
    if (offersContainer) {
        offersContainer.addEventListener('click', async (e) => {
            const acceptBtn = e.target.closest('.accept-quote-btn');
            const rejectBtn = e.target.closest('.reject-quote-btn');
            const deleteBtn = e.target.closest('.delete-quote-btn');

            if (acceptBtn) {
                const quoteId = acceptBtn.dataset.id;
                const jobId = acceptBtn.dataset.jobId;
                await acceptQuote(quoteId, jobId);
            }

            if (rejectBtn) {
                const quoteId = rejectBtn.dataset.id;
                await rejectQuote(quoteId);
            }

            if (deleteBtn) {
                const quoteId = deleteBtn.dataset.id;
                await hideQuoteForConsumer(quoteId);
            }
        });
    }
}

async function acceptQuote(quoteId, jobId) {
    if (!confirm('Сигурни ли сте, че искате да потвърдите получаването на тази оферта?')) return;

    try {
        // 1. Accept the quote
        const { error: quoteError } = await supabase
            .from('quotes')
            .update({ status: 'accepted' })
            .eq('id', quoteId);

        if (quoteError) throw quoteError;

        alert('Получаването е потвърдено успешно!');

        // Reload dashboard
        const modal = bootstrap.Modal.getInstance(document.getElementById('offersModal'));
        if (modal) modal.hide();

        const user = await supabase.auth.getUser();
        await loadUserJobs(user.data.user.id);

    } catch (err) {
        console.error('Error accepting quote:', err);
        alert('Грешка при приемане на офертата: ' + err.message);
    }
}

async function hideQuoteForConsumer(quoteId) {
    if (!confirm('Сигурни ли сте, че искате да премахнете тази оферта от вашия списък?')) return;

    try {
        const { error } = await supabase
            .from('quotes')
            .update({ is_hidden_by_consumer: true })
            .eq('id', quoteId);

        if (error) throw error;

        // Hide modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('offersModal'));
        if (modal) modal.hide();

        const user = await supabase.auth.getUser();
        await loadUserJobs(user.data.user.id);
    } catch (err) {
        console.error('Error hiding quote:', err);
        alert('Грешка при премахване на офертата.');
    }
}
async function rejectQuote(quoteId) {
    if (!confirm('Сигурни ли сте, че искате да отхвърлите тази оферта?')) return;

    try {
        const { error } = await supabase
            .from('quotes')
            .update({ status: 'rejected' })
            .eq('id', quoteId);

        if (error) throw error;

        alert('Офертата беше отхвърлена.');

        // Refresh the quotes view in the modal if possible, or just reload the whole page
        const modal = bootstrap.Modal.getInstance(document.getElementById('offersModal'));
        if (modal) modal.hide();

        const user = await supabase.auth.getUser();
        await loadUserJobs(user.data.user.id);
    } catch (err) {
        console.error('Error rejecting quote:', err);
        alert('Грешка при отхвърляне на офертата.');
    }
}

function handleHashNavigation() {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash === '#profile') {
        const profileTab = document.getElementById('v-pills-profile-tab');
        if (profileTab) profileTab.click();
    } else if (hash === '#post') {
        const postTab = document.getElementById('v-pills-post-tab');
        if (postTab) postTab.click();
    } else if (hash === '#jobs') {
        const jobsTab = document.getElementById('v-pills-jobs-tab');
        if (jobsTab) jobsTab.click();
    }
}

/**
 * Open edit modal and populate with job data
 * @param {Object} job - Job data
 */
function openEditModal(job) {
    document.getElementById('edit-job-id').value = job.id;
    document.getElementById('edit-job-title').value = job.title;
    document.getElementById('edit-job-category').value = job.category_id;
    document.getElementById('edit-job-location').value = job.city || job.location;
    document.getElementById('edit-job-description').value = job.description;
    document.getElementById('edit-job-budget').value = job.budget_max || '';

    const negotiableCheck = document.getElementById('edit-job-budget-negotiable');
    if (negotiableCheck) {
        negotiableCheck.checked = !job.budget_max;
        document.getElementById('edit-job-budget').disabled = !job.budget_max;
    }

    const modalEl = document.getElementById('editJobModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}
/**
 * Open offers modal and show received quotes
 * @param {Object} job - Job data
 */
async function openOffersModal(job) {
    const modalEl = document.getElementById('offersModal');
    const container = document.getElementById('offers-container');

    document.getElementById('offersModalLabel').textContent = `${t('dashboard_consumer.offers')} за: ${job.title}`;

    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    try {
        // Fetch files for these quotes
        const quoteIds = job.quotes.map(q => q.id);
        const { data: media, error: mediaError } = await supabase
            .from('media')
            .select('*')
            .in('entity_id', quoteIds)
            .eq('entity_type', 'quote');

        if (mediaError) {
            console.error('Media fetch error:', mediaError);
            throw mediaError;
        }

        console.log(`Fetched ${media?.length || 0} files for ${quoteIds.length} quotes`);

        if (!job.quotes || job.quotes.length === 0) {
            container.innerHTML = '<p class="text-center py-4">Няма получени оферти.</p>';
            return;
        }

        container.innerHTML = job.quotes.map(quote => {
            const quoteFiles = media.filter(m => m.entity_id === quote.id);
            return `
                <div class="card border-0 shadow-sm rounded-4 mb-3 ${quote.status === 'rejected' ? 'opacity-50' : ''}">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="fw-bold mb-0">${quote.company?.name}</h6>
                                <small class="text-muted"><i class="bi bi-geo-alt me-1"></i> ${quote.company?.city}</small>
                                ${quote.company?.is_verified ? '<span class="badge bg-success-subtle text-success ms-2 small">Проверена</span>' : ''}
                            </div>
                            <div class="text-end">
                                <span class="fs-5 fw-bold text-primary">${quote.price} лв.</span>
                                <div><small class="badge ${quote.status === 'accepted' ? 'bg-success' : quote.status === 'rejected' ? 'bg-danger' : 'bg-primary-subtle text-primary border border-primary-subtle'} px-2 py-1">${t('offers.status_' + quote.status)}</small></div>
                            </div>
                            <div class="ms-3">
                                <button class="btn btn-sm btn-link text-danger p-1 delete-quote-btn" data-id="${quote.id}" title="Премахни от списъка">
                                    <i class="bi bi-trash3 fs-5"></i>
                                </button>
                            </div>
                        </div>
                        <p class="text-secondary small mb-3">${quote.message}</p>
                        
                        ${quoteFiles.length > 0 ? `
                            <div class="bg-light p-3 rounded-4 mb-3 border border-dashed">
                                <h6 class="small fw-bold mb-2">Прикачени документи:</h6>
                                <div class="row g-2">
                                    ${quoteFiles.map(file => `
                                        <div class="col-sm-6">
                                            <a href="${file.file_url}" target="_blank" class="d-flex align-items-center p-2 bg-white rounded-3 border text-decoration-none hover-shadow transition-all">
                                                <div class="bg-primary-subtle text-primary rounded-circle p-2 me-2">
                                                    <i class="bi bi-file-earmark-arrow-down fs-5"></i>
                                                </div>
                                                <div class="overflow-hidden">
                                                    <div class="small fw-bold text-dark text-truncate">${file.file_name}</div>
                                                    <div class="x-small text-muted">Виж/Изтегли</div>
                                                </div>
                                            </a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${quote.status === 'pending' ? `
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary rounded-pill px-4 accept-quote-btn" data-id="${quote.id}" data-job-id="${job.id}">
                                    <i class="bi bi-check-lg me-1"></i> Потвърждение за получаване
                                </button>
                                <button class="btn btn-outline-secondary rounded-pill px-4 reject-quote-btn" data-id="${quote.id}">
                                    Отхвърли
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading offers:', err);
        container.innerHTML = '<div class="alert alert-danger">Грешка при зареждане на офертите.</div>';
    }
}
