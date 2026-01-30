import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, getCurrentLanguage } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { injectNavbar, injectFooter } from '../components/shared.js';

let currentCompany = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard access
    const { user, profile } = await requireRole(['company_admin', 'company_member', 'admin']);
    if (!user) return;

    // 2. Initialize UI
    await initI18n();
    injectNavbar();
    injectFooter();
    translatePage();

    // 3. Fetch Company Info
    await loadCompanyDetails(user.id);

    // 4. Load Data
    loadAvailableJobs();
    loadMyOffers();

    // 5. Setup Events
    setupEventListeners();
});

async function loadCompanyDetails(userId) {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .or(`owner_id.eq.${userId},id.in.(select company_id from company_members where user_id.eq.${userId})`)
            .single();

        if (error) throw error;
        currentCompany = data;

        document.getElementById('company-name').textContent = data.name;
        document.getElementById('company-eik').textContent = `EIK/BULSTAT: ${data.eik}`;
        document.getElementById('company-address').textContent = `Address: ${data.address}, ${data.city}`;

        const badge = document.getElementById('verification-badge');
        if (data.is_verified) {
            badge.innerHTML = '<span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i> Verified</span>';
        } else {
            badge.innerHTML = '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i> Pending Verification</span>';
        }
    } catch (err) {
        console.error('Error loading company:', err);
    }
}

async function loadAvailableJobs() {
    const list = document.getElementById('available-jobs-list');
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .select(`
                *,
                category:service_categories(name_bg, name_en)
            `)
            .eq('status', 'open')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const currentLang = getCurrentLanguage();

        if (data.length === 0) {
            list.innerHTML = '<div class="col-12 text-center py-5"><p>No open jobs at the moment.</p></div>';
            return;
        }

        list.innerHTML = data.map(job => `
            <div class="col-md-6 col-lg-12">
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${job.title}</h5>
                            <span class="text-primary fw-bold">${job.budget ? job.budget + ' BGN' : 'Negotiable'}</span>
                        </div>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-tag me-1"></i> ${currentLang === 'bg' ? job.category.name_bg : job.category.name_en} | 
                            <i class="bi bi-geo-alt me-1"></i> ${job.location}
                        </p>
                        <p class="card-text">${job.description}</p>
                        <button class="btn btn-primary btn-sm send-offer-btn" 
                                data-id="${job.id}" 
                                data-title="${job.title}"
                                ${!currentCompany.is_verified ? 'disabled' : ''}>
                                ${currentCompany.is_verified ? 'Send Offer' : 'Verify Company to Send Offers'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach event listeners to buttons
        document.querySelectorAll('.send-offer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('modal-job-id').value = btn.dataset.id;
                document.querySelector('#offerModal .modal-title').textContent = `Offer for: ${btn.dataset.title}`;
                const modal = new bootstrap.Modal(document.getElementById('offerModal'));
                modal.show();
            });
        });

    } catch (err) {
        console.error('Error loading jobs:', err);
    }
}

async function loadMyOffers() {
    const list = document.getElementById('company-offers-list');
    if (!currentCompany) return;

    try {
        const { data, error } = await supabase
            .from('job_offers')
            .select(`
                *,
                job:job_postings(title, location)
            `)
            .eq('company_id', currentCompany.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            list.innerHTML = '<p class="text-muted">You haven\'t sent any offers yet.</p>';
            return;
        }

        list.innerHTML = data.map(offer => `
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h6>${offer.job.title}</h6>
                            <span class="badge ${offer.status === 'accepted' ? 'bg-success' : 'bg-info'}">${offer.status}</span>
                        </div>
                        <p class="mb-1">Proposed Price: <strong>${offer.price} BGN</strong></p>
                        <p class="text-muted small">${offer.message}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading offers:', err);
    }
}

function setupEventListeners() {
    const offerForm = document.getElementById('submit-offer-form');
    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const jobId = document.getElementById('modal-job-id').value;
        const offerData = {
            job_id: jobId,
            company_id: currentCompany.id,
            price: document.getElementById('offer-price').value,
            message: document.getElementById('offer-message').value,
            // duration: document.getElementById('offer-duration').value // Add this to DB later if needed
        };

        try {
            const { error } = await supabase.from('job_offers').insert([offerData]);
            if (error) throw error;
            
            alert('Offer sent successfully!');
            bootstrap.Modal.getInstance(document.getElementById('offerModal')).hide();
            loadMyOffers();
        } catch (err) {
            alert('Error sending offer: ' + err.message);
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        });
    }
}
