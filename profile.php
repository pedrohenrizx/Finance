<?php
if (!isset($_COOKIE['parse_session'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil - Finanças Pessoais</title>
    <!-- Melhoria: Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
    </script>
    <script type="text/javascript" src="https://npmcdn.com/parse/dist/parse.min.js"></script>
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen flex flex-col">

    <div class="flex flex-col md:flex-row flex-grow overflow-hidden">

        <!-- Sidebar -->
        <aside class="w-full md:w-64 bg-white dark:bg-gray-800 shadow-md md:h-full flex-shrink-0 flex flex-col">
            <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400">Finanças</h2>
                <button id="mobileMenuBtn" class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none" aria-label="Menu">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>

            <nav id="sidebarNav" class="hidden md:block p-4 space-y-2 flex-grow">
                <a href="dashboard.php" class="block py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">Dashboard</a>
                <a href="profile.php" class="block py-2 px-4 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">Perfil</a>
                <button id="logoutBtn" class="w-full text-left py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 mt-auto">Sair</button>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-4 md:p-8 overflow-y-auto">
            <div class="max-w-3xl mx-auto">
                <h1 class="text-2xl font-bold mb-8">Perfil do Usuário</h1>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col md:flex-row gap-8 items-start">

                    <!-- Avatar Upload (Melhoria 13) -->
                    <div class="flex flex-col items-center space-y-4 w-full md:w-1/3">
                        <div class="relative w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-4xl font-bold uppercase overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg group">
                            <img id="profileImagePreview" src="" alt="Avatar" class="w-full h-full object-cover hidden">
                            <span id="profileInitials">U</span>

                            <!-- Hover Overlay for upload -->
                            <label for="avatarUpload" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </label>
                            <input type="file" id="avatarUpload" class="hidden" accept="image/*">
                        </div>
                        <button id="uploadAvatarBtn" class="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 hidden">Salvar Foto</button>
                    </div>

                    <!-- Profile Info Edit (Melhoria 14) -->
                    <div class="w-full md:w-2/3 space-y-4">
                        <form id="profileForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Nome de Usuário</label>
                                <input type="text" id="editUsername" class="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled>
                                <p class="text-xs text-gray-500 mt-1">O nome de usuário principal não pode ser alterado por segurança.</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Email</label>
                                <input type="email" id="editEmail" required class="w-full px-4 py-2 border rounded-md focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                            </div>
                            <!-- Assuming we add a custom 'name' field on Parse User -->
                            <div>
                                <label class="block text-sm font-medium mb-1">Nome Completo</label>
                                <input type="text" id="editName" class="w-full px-4 py-2 border rounded-md focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" placeholder="Seu nome">
                            </div>

                            <div class="pt-4 border-t dark:border-gray-700">
                                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">ID de Usuário: <span id="profileId" class="text-gray-800 dark:text-gray-200 font-mono"></span></h3>
                                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Criado em: <span id="profileCreatedAt" class="text-gray-800 dark:text-gray-200"></span></h3>
                            </div>

                            <div class="flex justify-end pt-4">
                                <button type="submit" id="saveProfileBtn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded transition-colors font-medium">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </main>
    </div>

    <!-- Modal Confirmação Logout (Melhoria 23) -->
    <div id="logoutModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center hidden">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h2 class="text-xl font-bold mb-4">Sair do Sistema</h2>
            <p class="mb-6 text-gray-600 dark:text-gray-400">Tem a certeza que deseja terminar a sessão?</p>
            <div class="flex justify-center gap-4">
                <button id="cancelLogoutBtn" class="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                <button id="confirmLogoutBtn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Sair</button>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/profile.js"></script>
</body>
</html>
