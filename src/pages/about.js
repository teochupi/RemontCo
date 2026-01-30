/**
 * About Page Script
 */

import { initI18n } from '../utils/i18n.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await renderNavbar(document.getElementById('navbar-container'));
  renderFooter(document.getElementById('footer-container'));
});
