<?php
if (isset($_COOKIE['parse_session'])) {
    header('Location: /dashboard');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Finanças Pessoais</title>
    <!-- Melhoria: Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
    </script>
    <script type="text/javascript" src="https://npmcdn.com/parse/dist/parse.min.js"></script>
    <script src="/js/config.js"></script>
    <script src="/js/utils.js"></script>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen flex flex-col items-center justify-center">

    <div class="flex-grow flex items-center justify-center w-full">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
            <h1 class="text-2xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">Finanças Pessoais</h1>

            <form id="loginForm" class="space-y-4">
                <div>
                    <label for="username" class="block text-sm font-medium mb-1">Usuário</label>
                    <input type="text" id="username" name="username" required
                        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium mb-1">Senha</label>
                    <div class="relative">
                        <input type="password" id="password" name="password" required
                            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10">
                        <!-- Melhoria 2: Password Visibility Toggle -->
                        <button type="button" id="togglePasswordBtn" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Mostrar/ocultar senha">
                            <svg id="eyeIcon" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between mt-2">
                    <!-- Melhoria 3: Lembrar de mim -->
                    <div class="flex items-center">
                        <input id="remember_me" name="remember_me" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="remember_me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Lembrar de mim
                        </label>
                    </div>
                    <!-- Melhoria 4: Esqueci a Senha -->
                    <div class="text-sm">
                        <a href="#" id="forgotPasswordLnk" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Esqueci a senha?</a>
                    </div>
                </div>

                <div id="errorMessage" class="text-red-500 text-sm hidden"></div>

                <button type="submit" id="loginSubmitBtn"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                    Entrar
                </button>
            </form>
        </div>
    </div>

    <!-- Melhoria 11: Footer Global -->
    <footer class="w-full py-4 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
        &copy; <script>document.write(new Date().getFullYear())</script> Finanças Pessoais. Todos os direitos reservados.
    </footer>

    <script src="/js/app.js"></script>
</body>
</html>
