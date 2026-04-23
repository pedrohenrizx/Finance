<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Finanças Pessoais</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
    </script>
    <script type="text/javascript" src="https://npmcdn.com/parse/dist/parse.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
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
                <a href="dashboard.php" class="block py-2 px-4 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium">Dashboard</a>
                <a href="profile.php" class="block py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Perfil</a>
                <button id="logoutBtn" class="w-full text-left py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 mt-auto">Sair</button>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-4 md:p-8 overflow-y-auto" id="dashboardContent">

            <!-- Header (Theme Toggle & Report) -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 class="text-2xl font-bold">Resumo Financeiro</h1>
                <div class="flex gap-2">
                    <button id="themeToggleBtn" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <svg id="themeIconDark" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <svg id="themeIconLight" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </button>
                    <button id="downloadReportBtn" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium shadow-sm">
                        Baixar Relatório
                    </button>
                </div>
            </div>

            <!-- Alerts -->
            <div id="alertsContainer" class="mb-6 space-y-2"></div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Total</h3>
                    <p class="text-2xl font-bold mt-2" id="totalBalance">R$ 0,00</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas</h3>
                    <p class="text-2xl font-bold text-green-500 mt-2" id="totalIncome">R$ 0,00</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas</h3>
                    <p class="text-2xl font-bold text-red-500 mt-2" id="totalExpense">R$ 0,00</p>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 class="text-lg font-bold mb-4">Despesas por Categoria</h3>
                    <div class="relative h-64 w-full">
                        <canvas id="expensesChart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 class="text-lg font-bold mb-4">Histórico e Previsão</h3>
                    <div class="relative h-64 w-full">
                        <canvas id="historyChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Goals -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 mb-8">
                <h3 class="text-lg font-bold mb-4">Metas Financeiras</h3>
                <div id="goalsContainer" class="space-y-4">
                    <!-- Goals will be injected here -->
                    <p class="text-gray-500 dark:text-gray-400 text-sm italic">Carregando metas...</p>
                </div>
            </div>

        </main>
    </div>

    <!-- Initialization and Core Logic -->
    <script src="js/app.js"></script>
    <!-- Dashboard Specific Logic -->
    <script src="js/dashboard.js"></script>
</body>
</html>
