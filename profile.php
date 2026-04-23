<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil - Finanças Pessoais</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
    </script>
    <script type="text/javascript" src="https://npmcdn.com/parse/dist/parse.min.js"></script>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen">

    <div class="flex flex-col md:flex-row h-screen overflow-hidden">

        <!-- Sidebar -->
        <aside class="w-full md:w-64 bg-white dark:bg-gray-800 shadow-md md:h-full flex-shrink-0">
            <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400">Finanças</h2>
                <button id="mobileMenuBtn" class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>

            <nav id="sidebarNav" class="hidden md:block p-4 space-y-2">
                <a href="dashboard.php" class="block py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Dashboard</a>
                <a href="profile.php" class="block py-2 px-4 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">Perfil</a>
                <button id="logoutBtn" class="w-full text-left py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 mt-auto">Sair</button>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-4 md:p-8 overflow-y-auto">
            <div class="max-w-2xl mx-auto">
                <h1 class="text-2xl font-bold mb-8">Perfil do Usuário</h1>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold uppercase" id="profileInitials">
                            U
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold" id="profileUsername">Carregando...</h2>
                            <p class="text-gray-500 dark:text-gray-400" id="profileEmail">carregando@email.com</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="border-t dark:border-gray-700 pt-4">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">ID de Usuário</h3>
                            <p class="mt-1" id="profileId">-</p>
                        </div>
                        <div class="border-t dark:border-gray-700 pt-4">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Criado em</h3>
                            <p class="mt-1" id="profileCreatedAt">-</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Initialization and Core Logic -->
    <script src="js/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Theme setup (simplified for profile)
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            }

            // Mobile menu
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const sidebarNav = document.getElementById('sidebarNav');
            if (mobileMenuBtn && sidebarNav) {
                mobileMenuBtn.addEventListener('click', () => {
                    sidebarNav.classList.toggle('hidden');
                });
            }

            // Load User Data
            const currentUser = Parse.User.current();
            if (currentUser) {
                const username = currentUser.get('username') || 'Usuário';
                const email = currentUser.get('email') || 'Não informado';

                document.getElementById('profileUsername').textContent = username;
                document.getElementById('profileEmail').textContent = email;
                document.getElementById('profileId').textContent = currentUser.id;

                const createdAt = currentUser.createdAt;
                if (createdAt) {
                    document.getElementById('profileCreatedAt').textContent = new Date(createdAt).toLocaleDateString('pt-BR');
                }

                document.getElementById('profileInitials').textContent = username.charAt(0).toUpperCase();
            }
        });
    </script>
</body>
</html>
