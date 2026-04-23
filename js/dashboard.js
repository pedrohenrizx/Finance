document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------------------------------------
    // 1. Mobile Menu Toggle
    // -----------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarNav = document.getElementById('sidebarNav');
    if (mobileMenuBtn && sidebarNav) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebarNav.classList.toggle('hidden');
        });
    }

    // -----------------------------------------------------
    // 2. Theme Management (Light/Dark Mode)
    // -----------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIconDark = document.getElementById('themeIconDark');
    const themeIconLight = document.getElementById('themeIconLight');

    // Check local storage or system preference
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeIconLight.classList.add('hidden');
        themeIconDark.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                themeIconLight.classList.add('hidden');
                themeIconDark.classList.remove('hidden');
            } else {
                localStorage.setItem('theme', 'light');
                themeIconDark.classList.add('hidden');
                themeIconLight.classList.remove('hidden');
            }
            // Update charts colors if they exist
            updateChartsTheme();
        });
    }

    // -----------------------------------------------------
    // 3. Data Fetching & Dashboard Logic
    // -----------------------------------------------------
    const currentUser = Parse.User.current();
    if (!currentUser) return; // app.js will handle redirect

    // Mock data for demonstration since custom Parse Classes might not exist yet
    // In a real app, you would fetch from Parse like:
    // const Transaction = Parse.Object.extend("Transaction");
    // const query = new Parse.Query(Transaction);
    // query.equalTo("user", currentUser);

    const mockTransactions = [
        { type: 'income', amount: 5000, category: 'Salário', date: '2023-10-01' },
        { type: 'expense', amount: 1200, category: 'Moradia', date: '2023-10-05' },
        { type: 'expense', amount: 400, category: 'Alimentação', date: '2023-10-10' },
        { type: 'expense', amount: 200, category: 'Transporte', date: '2023-10-15' },
        { type: 'expense', amount: 150, category: 'Lazer', date: '2023-10-20' },
        { type: 'income', amount: 800, category: 'Freelance', date: '2023-10-25' }
    ];

    const mockGoals = [
        { name: 'Viagem', target: 5000, current: 2000 },
        { name: 'Reserva de Emergência', target: 10000, current: 8500 }
    ];

    const spendingLimit = 2000; // Example limit for alerts

    // Calculate Totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};

    mockTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else if (t.type === 'expense') {
            totalExpense += t.amount;
            if (categoryExpenses[t.category]) {
                categoryExpenses[t.category] += t.amount;
            } else {
                categoryExpenses[t.category] = t.amount;
            }
        }
    });

    const totalBalance = totalIncome - totalExpense;

    // Format Currency
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);

    // Alerts
    const alertsContainer = document.getElementById('alertsContainer');
    if (totalExpense > spendingLimit) {
        alertsContainer.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded dark:bg-red-900/30 dark:text-red-400" role="alert">
                <p class="font-bold">Atenção!</p>
                <p>Seus gastos totais (${formatCurrency(totalExpense)}) excederam o limite definido de ${formatCurrency(spendingLimit)}.</p>
            </div>
        `;
    }

    // Render Goals
    const goalsContainer = document.getElementById('goalsContainer');
    if (goalsContainer) {
        goalsContainer.innerHTML = '';
        mockGoals.forEach(goal => {
            const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const goalHtml = `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium">${goal.name}</span>
                        <span>${formatCurrency(goal.current)} / ${formatCurrency(goal.target)} (${percent}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            goalsContainer.innerHTML += goalHtml;
        });
    }

    // -----------------------------------------------------
    // 4. Charts (Chart.js)
    // -----------------------------------------------------
    const getChartTextColor = () => document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';

    let expensesChartInstance = null;
    let historyChartInstance = null;

    const renderCharts = () => {
        const textColor = getChartTextColor();

        // Expenses Pie Chart
        const ctxExpenses = document.getElementById('expensesChart');
        if (ctxExpenses) {
            if (expensesChartInstance) expensesChartInstance.destroy();
            expensesChartInstance = new Chart(ctxExpenses, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categoryExpenses),
                    datasets: [{
                        data: Object.values(categoryExpenses),
                        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
                        borderWidth: 1,
                        borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: textColor } }
                    }
                }
            });
        }

        // History/Forecast Bar Chart (Mock Data)
        const ctxHistory = document.getElementById('historyChart');
        if (ctxHistory) {
            if (historyChartInstance) historyChartInstance.destroy();
            historyChartInstance = new Chart(ctxHistory, {
                type: 'bar',
                data: {
                    labels: ['Jul', 'Ago', 'Set', 'Out (Atual)', 'Nov (Prev)'],
                    datasets: [
                        {
                            label: 'Receitas',
                            data: [4500, 4800, 5200, totalIncome, 5000],
                            backgroundColor: '#22c55e'
                        },
                        {
                            label: 'Despesas',
                            data: [1500, 1800, 1400, totalExpense, 1600],
                            backgroundColor: '#ef4444'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: textColor }, grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } },
                        y: { ticks: { color: textColor }, grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } }
                    },
                    plugins: {
                        legend: { labels: { color: textColor } }
                    }
                }
            });
        }
    };

    renderCharts();

    const updateChartsTheme = () => {
        renderCharts();
    };

    // -----------------------------------------------------
    // 5. Download Report (html2pdf)
    // -----------------------------------------------------
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            const element = document.getElementById('dashboardContent');

            // Temporary hide elements not meant for the report
            const hideForPdf = element.querySelectorAll('button');
            hideForPdf.forEach(el => el.style.display = 'none');

            const opt = {
                margin:       10,
                filename:     'relatorio_financas.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // Restore hidden elements
                hideForPdf.forEach(el => el.style.display = '');
            });
        });
    }
});
