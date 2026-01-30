import { supabase } from '../services/supabase.js';
import { initI18n, translatePage } from '../utils/i18n.js';
import { requireRole } from '../utils/guards.js';
import { injectNavbar, injectFooter } from '../components/shared.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard access
    const { user } = await requireRole(['admin']);
    if (!user) return;

    // 2. Initialize UI
    await initI18n();
    injectNavbar();
    injectFooter();
    translatePage();

    // 3. Load Data
    loadPendingCompanies();
    loadStats();
});

async function loadPendingCompanies() {
    const tableBody = document.getElementById('pending-companies-table');
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No companies found.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map(company => `
            <tr>
                <td><strong>${company.name}</strong></td>
                <td><code>${company.eik}</code></td>
                <td>${company.city}</td>
                <td>
                    <span class="badge ${company.is_verified ? 'bg-success' : 'bg-warning text-dark'}">
                        ${company.is_verified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${company.is_verified ? 'btn-outline-danger' : 'btn-success'} verify-btn" 
                            data-id="${company.id}" data-status="${company.is_verified}">
                        ${company.is_verified ? 'Revoke' : 'Verify'}
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
                }
            });
        });

    } catch (err) {
        console.error('Error loading companies:', err);
    }
}

async function loadStats() {
    try {
        // Simple count queries
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: jobCount } = await supabase.from('job_postings').select('*', { count: 'exact', head: true });
        const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });

        document.getElementById('stat-users').textContent = userCount || 0;
        document.getElementById('stat-jobs').textContent = jobCount || 0;
        document.getElementById('stat-companies').textContent = companyCount || 0;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}
