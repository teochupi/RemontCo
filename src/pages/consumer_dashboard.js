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
            usernameEl.textContent = userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : (userProfile.username || 'User');
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
        const categoryName = currentLang === 'bg' ? job.category.name_bg : job.category.name_en;
        const city = job.city || job.location;

        return `
            <div class="col-12 mb-4">
                <div class="card shadow-sm border-0 job-card h-100 rounded-4 overflow-hidden">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge ${getStatusBadgeClass(job.status)} px-3 py-2 rounded-pill uppercase small">
                                ${job.status.toUpperCase()}
                            </span>
                            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${new Date(job.created_at).toLocaleDateString(currentLang === 'bg' ? 'bg-BG' : 'en-US')}</small>
                        </div>
                        <h5 class="card-title fw-bold text-dark mb-2">${title}</h5>
                        <div class="d-flex gap-3 mb-3 small text-muted">
                            <span><i class="bi bi-tag me-1"></i> ${categoryName}</span>
                            <span><i class="bi bi-geo-alt me-1"></i> ${city}</span>
                        </div>
                        <p class="card-text text-dark opacity-75 text-truncate-3">${description}</p>
                        <div class="mt-4 border-top pt-3 d-flex justify-content-between align-items-center">
                            <span class="h5 mb-0 fw-bold text-primary">${job.budget_max ? job.budget_max + ' EUR' : t('common.negotiable')}</span>
                            <button class="btn btn-sm btn-outline-primary px-4 rounded-pill fw-bold view-job-btn" data-id="${job.id}">
                                <i class="bi bi-eye me-1"></i> ${t('common.view')}
                            </button>
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
                category:service_categories(name_bg, name_en)
            `)
            .eq('consumer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        loadedJobs = data;
        renderJobs(data);

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
        default: return 'bg-light text-dark border';
    }
}

function setupEventListeners(userId, isDemo = false) {
    // Handle view/edit button clicks
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-job-btn');
        if (btn) {
            const jobId = btn.dataset.id;
            const job = loadedJobs.find(j => j.id === jobId);
            if (job) {
                openEditModal(job);
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

            const jobData = {
                consumer_id: userId,
                title: document.getElementById('job-title').value,
                category_id: document.getElementById('job-category').value,
                description: document.getElementById('job-description').value,
                city: document.getElementById('job-location').value,
                budget_max: document.getElementById('job-budget').value || null,
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
            const jobData = {
                title: document.getElementById('edit-job-title').value,
                category_id: document.getElementById('edit-job-category').value,
                description: document.getElementById('edit-job-description').value,
                city: document.getElementById('edit-job-location').value,
                budget_max: document.getElementById('edit-job-budget').value || null,
                status: 'pending', // Send back for approval
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

    const tabButtons = document.querySelectorAll('button[data-bs-toggle="pill"]');
    tabButtons.forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            const hash = e.target.getAttribute('data-bs-target').replace('#v-pills-', '#');
            history.replaceState(null, null, hash);
        });
    });
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

    const modalEl = document.getElementById('editJobModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}
