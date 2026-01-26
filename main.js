import { categories } from './src/js/categories.js';

async function loadTranslations(lang) {
    try {
        const response = await fetch(`/i18n/${lang}.json`);
        return await response.json();
    } catch (err) {
        console.error("Language loading failed", err);
        return {};
    }
}

async function updateContent(lang) {
    const translations = await loadTranslations(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });

    // Само на началната страница зареждаме категориите
    if (document.getElementById('categories-container')) {
        renderCategories(lang);
    }
}

function renderCategories(lang) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = '';
    categories.forEach(cat => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="card h-100 p-4 text-center border-0 shadow-sm border-bottom border-primary border-3">
                <div class="mb-3">
                    <i class="bi ${cat.icon} fs-1 text-primary"></i>
                </div>
                <h5 class="fw-bold">${lang === 'bg' ? cat.name_bg : cat.name_en}</h5>
            </div>
        `;
        container.appendChild(col);
    });
}

const langSwitcher = document.getElementById('lang-switcher');
if (langSwitcher) {
    langSwitcher.addEventListener('change', (e) => {
        const lang = e.target.value;
        updateContent(lang);
        localStorage.setItem('preferredLang', lang);
    });
}

// По подразбиране
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLang') || 'bg';
    if (langSwitcher) langSwitcher.value = savedLang;
    updateContent(savedLang);
});
