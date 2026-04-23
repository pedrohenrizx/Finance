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
        setCookie('parse_session', currentUser.getSessionToken(), 7);
        if (isLoginPage && !window.location.search.includes('test=1')) {
            window.location.href = 'dashboard.php';
        }
    } else {
        eraseCookie('parse_session');
        if (!isLoginPage && !window.location.search.includes('test=1')) {
            window.location.href = 'index.php';
        }
    }

    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');

            try {
                const user = await Parse.User.logIn(username, password);
                setCookie('parse_session', user.getSessionToken(), 7);
                window.location.href = 'dashboard.php';
            } catch (error) {
                errorMessage.textContent = 'Erro ao fazer login: ' + error.message;
                errorMessage.classList.remove('hidden');
            }
        });
    }

    // Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await Parse.User.logOut();
                eraseCookie('parse_session');
                window.location.href = 'index.php';
            } catch (error) {
                console.error('Error logging out:', error);
            }
        });
    }
});
