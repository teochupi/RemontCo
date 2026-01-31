import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, getCurrentLanguage, t, translateElement } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { renderNavbar } from '../components/navbar.js';

let currentCompany = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard access
    const user = await requireRole(['company_admin', 'company_member', 'admin']);
    if (!user) return;
    currentUser = user;

    // 2. Initialize UI
    await initI18n();
    await renderNavbar(document.getElementById('navbar-container'));
    translatePage();

    // 3. Fetch Company Info
    await loadCompanyDetails(user.id);

    // 4. Load Data (if company exists)
    if (currentCompany) {
        loadAvailableJobs();
        loadMyOffers();
        loadFavorites();
    }

    // 5. Setup Events
    setupEventListeners();

    // 6. Handle hash navigation
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
});

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

async function loadAvailableJobs() {
    const list = document.getElementById('available-jobs-list');
    try {
        // Fetch approved jobs
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                category:service_categories(name_bg, name_en)
            `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch user favorites
        const { data: favs } = await supabase
            .from('favorites')
            .select('job_id')
            .eq('company_id', currentCompany.id);

        const favIds = new Set(favs?.map(f => f.job_id) || []);

        const currentLang = getCurrentLanguage();

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
                                <p class="text-muted small mb-0"><i class="bi bi-geo-alt me-1"></i> ${job.city || job.location}</p>
                                <p class="mt-3 text-secondary text-italic">${job.description}</p>
                            </div>
                            <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                <div class="mb-3">
                                    <span class="fs-4 fw-bold text-primary">${job.budget_min ? job.budget_min + ' лв.' : t('common.negotiable')}</span>
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

async function loadMyOffers() {
    const list = document.getElementById('company-offers-list');
    if (!currentCompany) return;

    try {
        const { data, error } = await supabase
            .from('quotes')
            .select(`
                *,
                job:jobs(title, city)
            `)
            .eq('company_id', currentCompany.id)
            .eq('is_hidden_by_company', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const filteredData = data; // Already filtered by SQL but just in case
        if (filteredData.length === 0) {
            list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Все още нямате изпратени оферти.</p>
                </div>`;
            return;
        }

        list.innerHTML = data.map(offer => `
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 mb-3">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold mb-0">${offer.job?.title}</h6>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge ${offer.status === 'accepted' ? 'bg-success' : offer.status === 'rejected' ? 'bg-danger' : 'bg-primary'} px-3 py-2 rounded-pill">
                                    ${offer.status === 'pending' ? t('offers.status_pending') : offer.status === 'accepted' ? t('offers.status_accepted') : t('offers.status_rejected')}
                                </span>
                                <button class="btn btn-sm btn-outline-danger border-0 rounded-circle delete-offer-btn" data-id="${offer.id}" title="Изтрий оферта">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <p class="mb-1 small text-muted">Предложена цена:</p>
                                <p class="fw-bold fs-5 mb-0">${offer.price} лв.</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1 small text-muted">Срок:</p>
                                <p class="mb-0">${offer.timeline_days || 'Не е посочен'} дни</p>
                            </div>
                        </div>
                        <div class="mt-3 p-3 bg-light rounded-3 small">
                            <p class="mb-0 text-secondary">${offer.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading offers:', err);
    }
}
async function loadFavorites() {
    const list = document.getElementById('favorites-list');
    if (!currentCompany) return;

    try {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                *,
                job:jobs(
                    *,
                    category:service_categories(name_bg, name_en)
                )
            `)
            .eq('company_id', currentCompany.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            list.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Нямате добавени обяви за наблюдение.</p>
                </div>`;
            return;
        }

        const currentLang = getCurrentLanguage();

        list.innerHTML = data.map(fav => {
            const job = fav.job;
            if (!job) return ''; // Handled by ON DELETE CASCADE, but for safety

            return `
                <div class="col-12">
                    <div class="card shadow-sm border-0 mb-3 rounded-4">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill small uppercase mb-2">
                                        ${currentLang === 'bg' ? job.category?.name_bg : job.category?.name_en}
                                    </span>
                                    <h5 class="fw-bold mb-2">${job.title}</h5>
                                    <p class="text-muted small mb-0"><i class="bi bi-geo-alt me-1"></i> ${job.city || job.location}</p>
                                </div>
                                <div class="text-end">
                                    <button class="btn btn-outline-danger btn-sm rounded-pill remove-favorite-btn" data-id="${job.id}">
                                        <i class="bi bi-heart-fill me-1"></i> Премахни
                                    </button>
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

function setupEventListeners() {
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
                    titleEl.textContent = `${t('offers.send_offer')}: ${jobTitle}`;
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
            if (titleEl) titleEl.textContent = `${t('offers.send_offer')}: ${jobTitle}`;
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
            if (removeBtn) {
                const jobId = removeBtn.dataset.id;
                await toggleFavorite(jobId);
            }
        });
    }

    // Delegation for Offer Deletion
    const offersList = document.getElementById('company-offers-list');
    if (offersList) {
        offersList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-offer-btn');
            if (deleteBtn) {
                const offerId = deleteBtn.dataset.id;
                if (confirm('Сигурни ли сте, че искате да изтриете тази оферта?')) {
                    try {
                        const { error } = await supabase
                            .from('quotes')
                            .update({ is_hidden_by_company: true })
                            .eq('id', offerId);

                        if (error) throw error;
                        loadMyOffers();
                    } catch (err) {
                        alert('Грешка при изтриване: ' + err.message);
                    }
                }
            }
        });
    }

    const offerForm = document.getElementById('submit-offer-form');
    if (offerForm) {
        offerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

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
                description: document.getElementById('profile-company-description').value,
                updated_at: new Date().toISOString()
            };

            try {
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
}

function handleHashNavigation() {
    const hash = window.location.hash;
    if (!hash) return;
    const tabId = `v-pills-${hash.substring(1)}-tab`;
    const tabBtn = document.getElementById(tabId);
    if (tabBtn) tabBtn.click();
}
