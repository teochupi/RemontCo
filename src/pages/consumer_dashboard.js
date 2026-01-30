import { supabase } from '../services/supabase.js';
import { initI18n, getCurrentLanguage, t } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard access
    try {
        const userProfile = await requireRole(['consumer', 'admin']);

        // 2. Initialize UI
        await initI18n();
        await renderNavbar(document.getElementById('navbar-container'));
        renderFooter(document.getElementById('footer-container'));

        // Set User Info
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User';
        }

        // Fill Profile Form
        document.getElementById('profile-first-name').value = userProfile.first_name || '';
        document.getElementById('profile-last-name').value = userProfile.last_name || '';
        document.getElementById('profile-phone').value = userProfile.phone || '';

        // 3. Load UI Data
        loadCategories();
        loadUserJobs(userProfile.id);

        // 4. Setup Events
        setupEventListeners(userProfile.id);

        // 5. Handle initial hash for navigation (e.g., #profile)
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        // 6. Show page after all translations are ready
        document.body.classList.add('ready');
    } catch (err) {
        console.error('Initialization error:', err);
        document.body.classList.add('ready'); // Show anyway if error
    }
});

async function loadCategories() {
    const categorySelect = document.getElementById('job-category');
    if (!categorySelect) return;

    try {
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('name_bg', { ascending: true });

        if (error) throw error;

        const currentLang = getCurrentLanguage();

        data.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = currentLang === 'bg' ? cat.name_bg : cat.name_en;
            categorySelect.appendChild(option);
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

        if (!data || data.length === 0) {
            jobsList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted"></i>
                    <p class="mt-2 text-muted">${t('dashboard_consumer.no_jobs')}</p>
                </div>
            `;
            return;
        }

        const currentLang = getCurrentLanguage();

        jobsList.innerHTML = data.map(job => `
            <div class="col-12 mb-4">
                <div class="card shadow-sm border-0 job-card h-100">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge ${getStatusBadgeClass(job.status)}">
                                ${job.status.toUpperCase()}
                            </span>
                            <small class="text-muted">${new Date(job.created_at).toLocaleDateString()}</small>
                        </div>
                        <h5 class="card-title h5 mb-2">${job.title}</h5>
                        <div class="d-flex gap-3 mb-3 small text-muted">
                            <span><i class="bi bi-tag me-1"></i> ${currentLang === 'bg' ? job.category.name_bg : job.category.name_en}</span>
                            <span><i class="bi bi-geo-alt me-1"></i> ${job.city || job.location}</span>
                        </div>
                        <p class="card-text text-muted">${job.description}</p>
                        <div class="mt-4 border-top pt-3 d-flex justify-content-between align-items-center">
                            <span class="h6 mb-0 fw-bold text-primary">${job.budget_max ? job.budget_max + ' EUR' : t('common.negotiable')}</span>
                            <button class="btn btn-sm btn-outline-primary px-3">
                                <i class="bi bi-eye me-1"></i> ${t('common.view')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading jobs:', err);
        jobsList.innerHTML = `<div class="alert alert-danger">Грешка при зареждане на обявите.</div>`;
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'approved': return 'bg-success-subtle text-success';
        case 'pending': return 'bg-warning-subtle text-warning';
        case 'draft': return 'bg-light text-dark';
        case 'closed': return 'bg-secondary-subtle text-secondary';
        default: return 'bg-light text-dark';
    }
}

function setupEventListeners(userId) {
    // Post Job Form
    const jobForm = document.getElementById('post-job-form');
    if (jobForm) {
        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = jobForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            const jobData = {
                consumer_id: userId,
                title: document.getElementById('job-title').value,
                category_id: document.getElementById('job-category').value,
                description: document.getElementById('job-description').value,
                city: document.getElementById('job-location').value,
                budget_max: document.getElementById('job-budget').value || null,
                status: 'pending' // Default to pending for admin approval
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
                alert('Грешка при публикуване: ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Profile Form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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

                alert('Профилът е обновен успешно!');
                // Update header name
                document.getElementById('username').textContent = `${updateData.first_name} ${updateData.last_name}`;
            } catch (err) {
                alert('Грешка при обновяване: ' + err.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn-profile');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        });
    }

    // Sync hash with tabs
    const tabButtons = document.querySelectorAll('button[data-bs-toggle="pill"]');
    tabButtons.forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            const hash = e.target.getAttribute('data-bs-target').replace('#v-pills-', '#');
            history.replaceState(null, null, hash);
        });
    });
}

/**
 * Handle tab navigation via URL hash
 */
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

