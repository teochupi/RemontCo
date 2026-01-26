import { authService } from './services/authService.js';

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await authService.signIn(email, password);

        if (error) {
            alert('Грешка при вход: ' + error.message);
        } else {
            const user = data.user;
            const role = user.user_metadata.role;

            // Пренасочване според ролята
            if (role === 'admin') {
                window.location.href = '/dashboard/admin.html';
            } else if (role === 'company_admin') {
                window.location.href = '/dashboard/company.html';
            } else {
                window.location.href = '/dashboard/consumer.html';
            }
        }
    });
}
