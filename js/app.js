// Initialize Parse
Parse.serverURL = 'https://parseapi.back4app.com';
Parse.initialize(
  'WIe9RmAzZNbmFo42rtIBNX1kc8sD96wKSjJNjWnP', // App ID
  'yw81o3qhqulagbHJMkvQJcKktzBcuhvhGNMnS7sY'  // JavaScript Key
);

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const currentUser = Parse.User.current();

    const isLoginPage = window.location.pathname.endsWith('index.php') || window.location.pathname === '/' || window.location.pathname === '';

    if (currentUser) {
        if (isLoginPage) {
            window.location.href = 'dashboard.php';
        }
    } else {
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
                window.location.href = 'index.php';
            } catch (error) {
                console.error('Error logging out:', error);
            }
        });
    }
});
