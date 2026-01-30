import { renderNavbar } from './navbar.js';
import { renderFooter } from './footer.js';

export async function injectNavbar() {
    const container = document.getElementById('navbar-container');
    if (container) {
        await renderNavbar(container);
    }
}

export async function injectFooter() {
    const container = document.getElementById('footer-container');
    if (container) {
        await renderFooter(container);
    }
}
