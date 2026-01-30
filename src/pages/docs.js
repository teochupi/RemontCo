/**
 * Documentation Page Script
 */

import { initI18n, getCurrentLanguage } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));
  renderFooter(document.getElementById('footer-container'));
  
  // Force translation update for static content and footer
  import('../utils/i18n.js').then(module => module.translatePage());
  
  // Handle Language Visibility
  const currentLang = getCurrentLanguage();
  const enContent = document.getElementById('lang-en');
  const bgContent = document.getElementById('lang-bg');
  
  if (currentLang === 'bg') {
    if (enContent) enContent.classList.add('d-none');
    if (bgContent) bgContent.classList.remove('d-none');
  } else {
    if (enContent) enContent.classList.remove('d-none');
    if (bgContent) bgContent.classList.add('d-none');
  }
  
  // Handle sidebar links to scroll to the correct section based on language
  const sidebarLinks = document.querySelectorAll('.list-group-item');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const hash = link.getAttribute('href');
      const sectionId = hash.substring(1); // Remove #
      
      // Find the section in the active language content
      const activeContent = currentLang === 'bg' ? bgContent : enContent;
      const targetSection = activeContent?.querySelector(hash) || 
                           activeContent?.querySelector(`#${sectionId}-bg`) ||
                           activeContent?.querySelector(`#${sectionId}`);
      
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without triggering scroll
        history.pushState(null, null, hash);
      }
    });
  });
  
  // Smooth scroll to hash on page load
  if (window.location.hash) {
    setTimeout(() => {
      const hash = window.location.hash;
      const sectionId = hash.substring(1);
      const activeContent = currentLang === 'bg' ? bgContent : enContent;
      const targetSection = activeContent?.querySelector(hash) || 
                           activeContent?.querySelector(`#${sectionId}-bg`) ||
                           activeContent?.querySelector(`#${sectionId}`);
      
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
});
