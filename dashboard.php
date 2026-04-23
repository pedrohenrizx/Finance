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
    <title>Dashboard - Finanças Pessoais</title>
    <!-- Melhoria: Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
    </script>
    <script type="text/javascript" src="https://npmcdn.com/parse/dist/parse.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://unpkg.com/imask"></script>
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
                <a href="dashboard.php" class="block py-2 px-4 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium">Dashboard</a>
                <a href="profile.php" class="block py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Perfil</a>
                <button id="logoutBtn" class="w-full text-left py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 mt-auto">Sair</button>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-4 md:p-8 overflow-y-auto" id="dashboardContent">

            <!-- Loading Spinner (Overlay) -->
            <div id="loadingSpinner" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center hidden">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>

            <!-- Header -->
            <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div class="flex flex-col">
                    <h1 class="text-2xl font-bold">Resumo Financeiro</h1>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                        <!-- Melhoria 16: Filtros Avançados -->
                        <div class="flex items-center gap-1">
                            <label for="monthFilter" class="text-sm font-medium">Mês:</label>
                            <input type="month" id="monthFilter" class="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex items-center gap-1">
                            <label for="typeFilter" class="text-sm font-medium">Tipo:</label>
                            <select id="typeFilter" class="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                                <option value="all">Todos</option>
                                <option value="income">Receitas</option>
                                <option value="expense">Despesas</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-1">
                            <label for="categoryFilter" class="text-sm font-medium">Categoria:</label>
                            <select id="categoryFilter" class="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                                <option value="all">Todas</option>
                                <!-- Categories injected here -->
                            </select>
                        </div>
                        <!-- Melhoria 17 & 18: Botões de Filtro/Refresh -->
                        <button id="clearFiltersBtn" class="text-xs text-gray-500 hover:text-blue-600 underline" title="Limpar Filtros">Limpar</button>
                        <button id="refreshDataBtn" class="p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ml-2" title="Recarregar Dados" aria-label="Recarregar Dados">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button id="addTransactionBtn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium shadow-sm">+ Transação</button>
                    <button id="addGoalBtn" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium shadow-sm">+ Meta</button>
                    <button id="themeToggleBtn" class="p-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Alternar Tema">
                        <svg id="themeIconDark" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <svg id="themeIconLight" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- Alerts -->
            <div id="alertsContainer" class="mb-4 space-y-2"></div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

            <!-- Charts & Recent Transactions (Melhoria 8) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Despesas por Categoria (Chart) -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col h-96">
                    <h3 class="text-lg font-bold mb-4">Despesas por Categoria</h3>
                    <div class="flex-grow relative w-full h-full">
                        <canvas id="expensesChart"></canvas>
                        <!-- Melhoria 9: Empty State -->
                        <div id="expensesEmpty" class="absolute inset-0 flex items-center justify-center hidden">
                            <p class="text-gray-400 text-sm italic">Sem dados de despesa para o período.</p>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Transações Recentes (Melhoria 8) -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col h-96">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Transações</h3>
                        <div class="flex gap-2">
                            <!-- Melhoria 15: Export CSV -->
                            <button id="exportCsvBtn" class="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-1 rounded" title="Exportar CSV">CSV</button>
                            <button id="downloadReportBtn" class="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" title="Exportar PDF">PDF</button>
                        </div>
                    </div>
                    <div class="overflow-auto flex-grow rounded border dark:border-gray-700 relative">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
                                <tr>
                                    <th class="px-4 py-2">Data</th>
                                    <th class="px-4 py-2">Categoria</th>
                                    <th class="px-4 py-2 text-right">Valor</th>
                                    <th class="px-4 py-2 text-center w-16">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="recentTransactionsBody">
                                <!-- Rows injected here -->
                            </tbody>
                        </table>
                        <!-- Melhoria 9: Empty State -->
                        <div id="transactionsEmpty" class="absolute inset-0 flex items-center justify-center hidden bg-white dark:bg-gray-800 bg-opacity-90">
                            <p class="text-gray-400 text-sm italic">Nenhuma transação encontrada.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Goals -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 mb-8">
                <h3 class="text-lg font-bold mb-4">Metas Financeiras</h3>
                <div id="goalsContainer" class="space-y-4">
                    <!-- Goals will be injected here -->
                </div>
            </div>

        </main>
    </div>

    <!-- Modals -->
    <!-- Add/Edit Transaction Modal -->
    <div id="transactionModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 flex items-center justify-center hidden">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4" id="tModalTitle">Nova Transação</h2>
            <form id="transactionForm" class="space-y-4">
                <input type="hidden" id="tId">
                <div>
                    <label class="block text-sm font-medium mb-1">Tipo</label>
                    <select id="tType" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Categoria</label>
                    <div class="flex gap-2">
                        <select id="tCategory" required class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                            <!-- Categories injected here -->
                        </select>
                        <button type="button" id="newCategoryBtn" class="bg-gray-200 dark:bg-gray-600 px-3 rounded hover:bg-gray-300" aria-label="Nova categoria">+</button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Valor</label>
                    <input type="text" id="tAmount" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500" placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Data</label>
                    <input type="date" id="tDate" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" id="closeTransactionModal" class="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                    <button type="submit" id="saveTransactionBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Guardar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add/Edit Goal Modal -->
    <div id="goalModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 flex items-center justify-center hidden">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4" id="gModalTitle">Nova Meta</h2>
            <form id="goalForm" class="space-y-4">
                <input type="hidden" id="gId">
                <div>
                    <label class="block text-sm font-medium mb-1">Nome</label>
                    <input type="text" id="gName" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Valor Alvo</label>
                    <input type="text" id="gTarget" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500" placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Valor Atual Salvo</label>
                    <input type="text" id="gCurrent" required class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500" placeholder="R$ 0,00">
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" id="closeGoalModal" class="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                    <button type="submit" id="saveGoalBtn" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">Guardar</button>
                </div>
            </form>
        </div>
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

    <!-- PDF Report Template (Hidden) -->
    <div id="pdfTemplate" class="hidden bg-white text-black p-8" style="width: 210mm; min-height: 297mm;">
        <h1 class="text-3xl font-bold mb-4 text-center">Relatório Financeiro</h1>
        <p class="mb-8 text-center text-gray-600" id="pdfPeriod">Período: </p>

        <div class="grid grid-cols-3 gap-4 mb-8 text-center">
            <div class="border p-4 rounded">
                <h3 class="font-bold">Receitas</h3>
                <p id="pdfIncome" class="text-xl text-green-600"></p>
            </div>
            <div class="border p-4 rounded">
                <h3 class="font-bold">Despesas</h3>
                <p id="pdfExpense" class="text-xl text-red-600"></p>
            </div>
            <div class="border p-4 rounded">
                <h3 class="font-bold">Saldo Total</h3>
                <p id="pdfBalance" class="text-xl"></p>
            </div>
        </div>

        <h2 class="text-xl font-bold mb-4 border-b pb-2">Detalhes das Transações</h2>
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-gray-100">
                    <th class="border p-2">Data</th>
                    <th class="border p-2">Categoria</th>
                    <th class="border p-2">Tipo</th>
                    <th class="border p-2 text-right">Valor</th>
                </tr>
            </thead>
            <tbody id="pdfTableBody">
                <!-- Rows injected here -->
            </tbody>
        </table>
    </div>

    <!-- Initialization and Core Logic -->
    <script src="js/app.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
