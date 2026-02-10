import { supabase } from '../services/supabase.js';
import { initI18n, translatePage, t } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { injectNavbar, injectFooter } from '../components/shared.js';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { showConfirm } from '../utils/confirmModal.js';

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
        loadAllUsers();
        loadStats();

        // 4. Setup moderation modal handler
        setupModerationHandler();

        // 5. Reveal page
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
            .select('*, profiles(username, first_name, last_name, email)')
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
                                <i class="bi bi-person me-1"></i> ${job.profiles?.username || (job.profiles?.first_name ? `${job.profiles.first_name} ${job.profiles.last_name || ''}` : null) || t('admin.consumer')} 
                                <span class="mx-2 text-silver">|</span> 
                                <i class="bi bi-envelope me-1"></i> ${job.profiles?.email || 'N/A'}
                            </p>
                            <p class="mb-2 text-dark opacity-75 fs-6">${job.description}</p>
                            <div class="fw-bold text-primary"><i class="bi bi-wallet2 me-1"></i> ${job.budget_max ? job.budget_max + ' EUR' : t('common.negotiable')}</div>
                        </div>
                        <div class="col-md-4 text-md-end mt-3 mt-md-0">
                            <button class="btn btn-success rounded-pill approve-job-btn px-4" data-id="${job.id}">
                                <i class="bi bi-check-circle-fill me-2"></i> ${t('common.confirm')}
                            </button>
                            <button class="btn btn-outline-danger rounded-pill moderate-job-btn px-4 ms-2" data-id="${job.id}">
                                <i class="bi bi-exclamation-triangle me-1"></i> ${t('admin.moderate')}
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
    document.querySelectorAll('.moderate-job-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('moderation-id').value = btn.dataset.id;
            document.getElementById('moderation-type').value = 'job';
            document.getElementById('moderationModalLabel').innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i> ${t('admin.moderate_job')}`;
            document.getElementById('moderation-reason').value = '';
            const modal = new bootstrap.Modal(document.getElementById('moderationModal'));
            modal.show();
        });
    });

}

function setupModerationHandler() {
    const confirmBtn = document.getElementById('confirm-moderation-btn');
    if (confirmBtn && !confirmBtn.dataset.listener) {
        confirmBtn.addEventListener('click', async () => {
            const id = document.getElementById('moderation-id').value;
            const type = document.getElementById('moderation-type').value;
            const reason = document.getElementById('moderation-reason').value;
            if (!reason) {
                showWarning(t('admin.provide_reason'));
                return;
            }
            console.log('Moderation:', type, id, reason);
            if (type === 'job') {
                await updateJobStatus(id, 'rejected', reason);
            } else {
                await updateCompanyStatus(id, false, reason);
            }
            const modal = bootstrap.Modal.getInstance(document.getElementById('moderationModal'));
            if (modal) modal.hide();
        });
        confirmBtn.dataset.listener = "true";
    }
}

async function updateJobStatus(id, status, reason = null) {
    const confirmMsg = status === 'approved' ? t('admin.confirm_approve') : t('admin.confirm_revision_job');
    if (!reason) {
        const confirmed = await showConfirm(confirmMsg, {
            title: t('common.confirm'),
            confirmText: t('common.confirm'),
            confirmClass: status === 'approved' ? 'btn-success' : 'btn-warning'
        });
        if (!confirmed) return;
    }

    try {
        const updateData = {
            status: status,
            approved_at: status === 'approved' ? new Date().toISOString() : null
        };
        if (reason) updateData.moderation_reason = reason;

        const { error } = await supabase
            .from('jobs')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        loadPendingJobs();
        loadStats();
    } catch (err) {
        showError(t('messages.generic_error'));
    }
}

async function deleteUserViaEdgeFunction(userId, displayName, displayEmail, type) {
    const confirmKey = type === 'company' ? 'admin.confirm_delete_company' : 'admin.confirm_delete_user';
    const confirmed = await showConfirm(`${t(confirmKey)}\n\n${displayName} (${displayEmail})`, {
        title: t('common.confirm'),
        confirmText: t('common.delete'),
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ user_id: userId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Delete failed');
        }

        const successKey = type === 'company' ? 'admin.company_deleted' : 'admin.user_deleted';
        showSuccess(t(successKey));
        loadPendingCompanies();
        loadAllUsers();
        loadStats();

    } catch (err) {
        console.error('Delete user error:', err);
        showError(t('messages.generic_error') + ': ' + err.message);
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
                <td style="min-width: 180px;">
                    <div class="btn-group-vertical w-100" role="group">
                        <button class="btn btn-sm btn-success verify-btn" 
                                data-id="${company.id}" data-status="${company.is_verified}">
                            <i class="bi bi-check-circle me-1"></i>${t('admin.verify')}
                        </button>
                        <button class="btn btn-sm btn-outline-warning moderate-company-btn" 
                                data-id="${company.id}">
                            <i class="bi bi-pencil-square me-1"></i>${t('admin.moderate')}
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-company-btn" 
                                data-id="${company.id}" data-ownerid="${company.owner_id}" data-email="${company.email}" data-name="${company.name}">
                            <i class="bi bi-trash me-1"></i>${t('admin.delete')}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach events
        document.querySelectorAll('.verify-btn').forEach(btn => {
            btn.addEventListener('click', () => updateCompanyStatus(btn.dataset.id, true));
        });

        document.querySelectorAll('.moderate-company-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('moderation-id').value = btn.dataset.id;
                document.getElementById('moderation-type').value = 'company';
                document.getElementById('moderationModalLabel').innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i> ${t('admin.moderate_company')}`;
                document.getElementById('moderation-reason').value = '';
                const modal = new bootstrap.Modal(document.getElementById('moderationModal'));
                modal.show();
            });
        });

        document.querySelectorAll('.delete-company-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteUserViaEdgeFunction(btn.dataset.ownerid, btn.dataset.name, btn.dataset.email, 'company'));
        });

    } catch (err) {
        console.error('Error loading companies:', err);
    }
}

async function loadAllUsers() {
    const tableBody = document.getElementById('all-users-table');
    if (!tableBody) return;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderUserList(data);
    } catch (err) {
        console.error('Error loading users:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">${err.message}</td></tr>`;
    }
}

function renderUserList(data) {
    const tableBody = document.getElementById('all-users-table');
    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">${t('admin.no_users_found')}</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(user => {
        const isDemoOrAdmin = user.role === 'admin' || user.role === 'demo';
        return `
        <tr class="align-middle">
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-circle bg-primary-subtle text-primary me-3 d-flex align-items-center justify-content-center fw-bold" style="width: 35px; height: 35px; border-radius: 50%;">
                        ${(user.username || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <div class="fw-bold text-dark">${user.username || 'N/A'}</div>
                        <small class="text-muted">${user.first_name || ''} ${user.last_name || ''}</small>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${getRoleBadgeClass(user.role)} px-3 py-2 rounded-pill">
                    ${t('admin.roles.' + user.role)}
                </span>
            </td>
            <td><small class="text-muted">${new Date(user.created_at).toLocaleDateString()}</small></td>
            <td>
                ${isDemoOrAdmin ? '' : `
                    <button class="btn btn-sm btn-outline-danger delete-user-btn" 
                            data-id="${user.id}" data-email="${user.email}" data-name="${user.username || user.email}" data-role="${user.role}">
                        <i class="bi bi-trash me-1"></i>${t('admin.delete')}
                    </button>
                `}
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteUserViaEdgeFunction(btn.dataset.id, btn.dataset.name, btn.dataset.email, btn.dataset.role);
        });
    });
}

function getRoleBadgeClass(role) {
    switch (role) {
        case 'admin': return 'bg-danger-subtle text-danger border border-danger-subtle';
        case 'company': return 'bg-primary-subtle text-primary border border-primary-subtle';
        case 'demo': return 'bg-info-subtle text-info border border-info-subtle';
        default: return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    }
}

async function updateCompanyStatus(id, isVerified, reason = null) {
    const confirmMsg = isVerified ? t('admin.confirm_verify_company') : t('admin.confirm_revision_company');
    if (!reason) {
        const confirmed = await showConfirm(confirmMsg, {
            title: t('common.confirm'),
            confirmText: t('common.confirm'),
            confirmClass: isVerified ? 'btn-success' : 'btn-warning'
        });
        if (!confirmed) return;
    }

    try {
        const updateData = {
            is_verified: isVerified,
            verified_at: isVerified ? new Date().toISOString() : null,
            status: isVerified ? 'approved' : 'pending'
        };
        if (reason) {
            updateData.moderation_reason = reason;
            updateData.is_verified = false;
            updateData.status = 'pending';
        }

        console.log('Updating company:', id, 'with data:', updateData);

        const { data, error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Update error:', error);
            throw error;
        }

        console.log('Update result:', data);
        loadPendingCompanies();
        loadStats();
    } catch (err) {
        console.error('Company status update failed:', err);
        showError(t('messages.generic_error'));
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
