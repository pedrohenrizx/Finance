// js/app.js

// Helper to set cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Helper to remove cookie
function eraseCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// Initialize Parse
if (typeof PARSE_SERVER_URL !== 'undefined') {
    Parse.serverURL = PARSE_SERVER_URL;
    Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const currentUser = Parse.User.current();

    const isLoginPage = window.location.pathname.endsWith('index.php') || window.location.pathname === '/' || window.location.pathname === '';

    if (currentUser) {
        // We only renew cookie if they visit app.js again; duration here is default 7 unless we read previous pref,
        // but for safety we just set a short one or leave it alone. We will just ensure it exists.
        if (isLoginPage && !window.location.search.includes('test=1')) {
            window.location.href = 'dashboard.php';
        }
    } else {
        eraseCookie('parse_session');
        if (!isLoginPage && !window.location.search.includes('test=1')) {
            window.location.href = 'index.php';
        }
    }

    // Toggle Password Visibility (Melhoria 2)
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Toggle eye icon (simple visual change)
            if (type === 'text') {
                togglePasswordBtn.innerHTML = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`;
            } else {
                togglePasswordBtn.innerHTML = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
            }
        });
    }

    // Forgot Password Logic (Melhoria 4)
    const forgotPasswordLnk = document.getElementById('forgotPasswordLnk');
    if (forgotPasswordLnk) {
        forgotPasswordLnk.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            if (!username) {
                if (typeof Toast !== 'undefined') Toast.show('Preencha o campo de usuário ou email primeiro para recuperar.', 'warning');
                else alert('Preencha o campo de usuário ou email primeiro.');
                return;
            }
            try {
                // In a real scenario we need the email. Assuming username is email or we ask for email.
                await Parse.User.requestPasswordReset(username);
                if (typeof Toast !== 'undefined') Toast.show('Email de recuperação enviado!', 'success');
                else alert('Email de recuperação enviado!');
            } catch (error) {
                if (typeof Toast !== 'undefined') Toast.show('Erro: ' + error.message, 'error');
                else alert('Erro: ' + error.message);
            }
        });
    }

    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof Utils !== 'undefined') Utils.setButtonLoading('loginSubmitBtn', true);

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember_me').checked;
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.classList.add('hidden');

            try {
                const user = await Parse.User.logIn(username, password);
                const cookieDays = rememberMe ? 30 : 1; // Melhoria 3
                setCookie('parse_session', user.getSessionToken(), cookieDays);

                if (typeof Toast !== 'undefined') Toast.show('Login efetuado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.php';
                }, 500);
            } catch (error) {
                if (typeof Utils !== 'undefined') Utils.setButtonLoading('loginSubmitBtn', false);
                if (typeof Toast !== 'undefined') Toast.show('Erro ao fazer login: ' + error.message, 'error');
                else {
                    errorMessage.textContent = 'Erro ao fazer login: ' + error.message;
                    errorMessage.classList.remove('hidden');
                }
            }
        });
    }

    // Confirm Logout Modal (Melhoria 23)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show confirmation modal if exists, else fallback to confirm
            const logoutModal = document.getElementById('logoutModal');
            if (logoutModal) {
                logoutModal.classList.remove('hidden');
            } else {
                if (confirm('Tem a certeza que deseja sair?')) {
                    executeLogout();
                }
            }
        });
    }

    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', executeLogout);
    }

    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            document.getElementById('logoutModal').classList.add('hidden');
        });
    }

    async function executeLogout() {
        try {
            await Parse.User.logOut();
            eraseCookie('parse_session');
            window.location.href = 'index.php';
        } catch (error) {
            console.error('Error logging out:', error);
            if (typeof Toast !== 'undefined') Toast.show('Erro ao sair.', 'error');
        }
    }
});
