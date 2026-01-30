import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Public pages
        main: resolve(__dirname, 'index.html'),
        companies: resolve(__dirname, 'companies.html'),
        company_profile: resolve(__dirname, 'company.html'),
        about: resolve(__dirname, 'about.html'),
        docs: resolve(__dirname, 'docs.html'),
        
        // Auth pages
        login: resolve(__dirname, 'auth/login.html'),
        register: resolve(__dirname, 'auth/register.html'),

        // Dashboards
        consumer_dashboard: resolve(__dirname, 'dashboard/consumer.html'),
        company_dashboard: resolve(__dirname, 'dashboard/company.html'),
        admin_dashboard: resolve(__dirname, 'dashboard/admin.html'),
        
        // Additional pages will be added as they are created
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
