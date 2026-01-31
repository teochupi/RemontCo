import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, t } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { injectNavbar, injectFooter } from '../components/shared.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Guard access
        const user = await requireRole(['admin']);
        if (!user) return;

        // 2. Initialize UI
        await initI18n();
        await injectNavbar();
        await injectFooter();
        translatePage();

        // 3. Load Data
        loadPendingJobs();
        loadPendingCompanies();
        loadStats();

        // 4. Reveal page
        document.body.classList.add('ready');
    } catch (err) {
        console.error('Admin initialization error:', err);
        document.body.classList.add('ready');
    }
});

async function loadPendingJobs() {
    const listEl = document.getElementById('pending-jobs-list');
    if (!listEl) return;

    try {
        // Try fetching without profiles first to see if that's the issue
        const { data, error } = await supabase
            .from('jobs')
            .select('*, profiles(first_name, last_name, email)') // Supabase usually handles this if FK is set
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            // Fallback: try without profiles join if join fails
            const { data: simpleData, error: simpleError } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (simpleError) throw simpleError;
            renderJobList(simpleData);
        } else {
            renderJobList(data);
        }

    } catch (err) {
        console.error('Error loading jobs:', err);
        // User wants a simple "No pending jobs" message instead of a red error box
        listEl.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="p-5 bg-white rounded-4 shadow-sm border">
                    <div class="icon-circle mb-4 mx-auto bg-light text-secondary d-flex align-items-center justify-content-center" style="width: 80px; height: 80px; border-radius: 50%;">
                        <i class="bi bi-clipboard-check fs-1"></i>
                    </div>
                    <h5 class="text-muted mb-0">${t('admin.no_pending_jobs')}</h5>
                </div>
            </div>
        `;
    }
}

function renderJobList(data) {
    const listEl = document.getElementById('pending-jobs-list');
    if (!listEl) return;

    if (!data || data.length === 0) {
        listEl.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="p-5 bg-white rounded-4 shadow-sm border">
                    <div class="icon-circle mb-4 mx-auto bg-light text-primary d-flex align-items-center justify-content-center" style="width: 80px; height: 80px; border-radius: 50%;">
                        <i class="bi bi-clipboard-check fs-1"></i>
                    </div>
                    <h5 class="fw-bold mb-2">${t('admin.no_pending_jobs')}</h5>
                </div>
            </div>
        `;
        return;
    }

    listEl.innerHTML = data.map(job => `
        <div class="col-12">
            <div class="card shadow-sm border-0 mb-3 rounded-4 overflow-hidden border-start border-primary border-4">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill small uppercase">${t('admin.job_request')}</span>
                                <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${new Date(job.created_at).toLocaleDateString()}</small>
                            </div>
                            <h5 class="fw-bold mb-1">${job.title}</h5>
                            <p class="text-muted small mb-3">
                                <i class="bi bi-person me-1"></i> ${job.profiles?.first_name || t('admin.consumer')} ${job.profiles?.last_name || ''} 
                                <span class="mx-2 text-silver">|</span> 
                                <i class="bi bi-envelope me-1"></i> ${job.profiles?.email || 'N/A'}
                            </p>
                            <p class="mb-0 text-dark opacity-75 fs-6">${job.description}</p>
                        </div>
                        <div class="col-md-4 text-md-end mt-3 mt-md-0">
                            <button class="btn btn-success rounded-pill approve-job-btn px-4" data-id="${job.id}">
                                <i class="bi bi-check-circle-fill me-2"></i> ${t('common.confirm')}
                            </button>
                            <button class="btn btn-link text-danger text-decoration-none reject-job-btn fw-bold ms-2" data-id="${job.id}">
                                ${t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Attach events
    document.querySelectorAll('.approve-job-btn').forEach(btn => {
        btn.addEventListener('click', () => updateJobStatus(btn.dataset.id, 'approved'));
    });
    document.querySelectorAll('.reject-job-btn').forEach(btn => {
        btn.addEventListener('click', () => updateJobStatus(btn.dataset.id, 'rejected'));
    });
}

async function updateJobStatus(id, status) {
    const confirmMsg = status === 'approved' ? t('admin.confirm_approve') : t('admin.confirm_reject');
    if (!confirm(confirmMsg)) return;

    try {
        const { error } = await supabase
            .from('jobs')
            .update({ status: status, approved_at: status === 'approved' ? new Date().toISOString() : null })
            .eq('id', id);

        if (error) throw error;
        loadPendingJobs();
        loadStats();
    } catch (err) {
        alert('Грешка: ' + err.message);
    }
}

async function loadPendingCompanies() {
    const tableBody = document.getElementById('pending-companies-table');
    if (!tableBody) return;

    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">${t('admin.no_pending_companies')}</td></tr>`;
            return;
        }

        tableBody.innerHTML = data.map(company => `
            <tr class="align-middle">
                <td>
                    <div class="fw-bold text-dark">${company.name}</div>
                    <small class="text-muted">${company.email}</small>
                </td>
                <td><code class="text-primary fw-bold">${company.eik}</code></td>
                <td><i class="bi bi-geo-alt me-1 text-muted"></i>${company.city}</td>
                <td>
                    <span class="badge ${company.is_verified ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-3 py-2 rounded-pill">
                        ${company.is_verified ? t('company.verified') : t('admin.pending')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${company.is_verified ? 'btn-outline-danger' : 'btn-primary'} rounded-pill px-3 verify-btn shadow-sm" 
                            data-id="${company.id}" data-status="${company.is_verified}">
                        ${company.is_verified ? t('common.cancel') : t('admin.verify')}
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach events
        document.querySelectorAll('.verify-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const currentStatus = btn.dataset.status === 'true';
                const { error } = await supabase
                    .from('companies')
                    .update({ is_verified: !currentStatus })
                    .eq('id', id);

                if (error) {
                    alert('Error: ' + error.message);
                } else {
                    loadPendingCompanies();
                    loadStats();
                }
            });
        });

    } catch (err) {
        console.error('Error loading companies:', err);
    }
}

async function loadStats() {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });

        const uEl = document.getElementById('stat-users');
        const jEl = document.getElementById('stat-jobs');
        const cEl = document.getElementById('stat-companies');

        if (uEl) uEl.textContent = userCount || 0;
        if (jEl) jEl.textContent = jobCount || 0;
        if (cEl) cEl.textContent = companyCount || 0;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}
