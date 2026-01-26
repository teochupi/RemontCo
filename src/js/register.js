import { authService } from './services/authService.js';

const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('name').value;
        const role = document.getElementById('user-role').value;
        const uic = document.getElementById('uic').value;

        // Метаданни за потребителя в Supabase
        const metadata = {
            full_name: fullName,
            role: role === 'company' ? 'company_admin' : 'consumer'
        };

        if (role === 'company') {
            metadata.uic = uic;
        }

        const { data, error } = await authService.signUp(email, password, metadata);

        if (error) {
            alert('Грешка при регистрация: ' + error.message);
        } else {
            alert('Регистрацията е успешна! Моля, проверете имейла си за потвърждение.');
            window.location.href = '/auth/login.html';
        }
    });
}
