document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------------------------------------
    // 1. Core Elements & Theme Management
    // -----------------------------------------------------
    const currentUser = Parse.User.current();
    if (!currentUser) return; // app.js handles redirect

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarNav = document.getElementById('sidebarNav');
    if (mobileMenuBtn && sidebarNav) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebarNav.classList.toggle('hidden');
        });
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIconDark = document.getElementById('themeIconDark');
    const themeIconLight = document.getElementById('themeIconLight');

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
            if (expensesChartInstance) expensesChartInstance.update();
            if (historyChartInstance) historyChartInstance.update();
        });
    }

    // -----------------------------------------------------
    // 2. State & UI Controls
    // -----------------------------------------------------
    const loadingSpinner = document.getElementById('loadingSpinner');
    const showLoading = () => loadingSpinner.classList.remove('hidden');
    const hideLoading = () => loadingSpinner.classList.add('hidden');

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const parseCurrency = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g,"").replace(',', '.'));
    };

    // Date Filter Setup
    const monthFilter = document.getElementById('monthFilter');
    const today = new Date();
    monthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    monthFilter.addEventListener('change', () => {
        fetchDashboardData();
    });

    // -----------------------------------------------------
    // 3. Modals & IMask Setup
    // -----------------------------------------------------
    const transactionModal = document.getElementById('transactionModal');
    const goalModal = document.getElementById('goalModal');

    document.getElementById('addTransactionBtn').addEventListener('click', () => {
        document.getElementById('transactionForm').reset();
        document.getElementById('tDate').valueAsDate = new Date();
        transactionModal.classList.remove('hidden');
    });

    document.getElementById('closeTransactionModal').addEventListener('click', () => transactionModal.classList.add('hidden'));

    document.getElementById('addGoalBtn').addEventListener('click', () => {
        document.getElementById('goalForm').reset();
        goalModal.classList.remove('hidden');
    });
    document.getElementById('closeGoalModal').addEventListener('click', () => goalModal.classList.add('hidden'));

    // Apply IMask to currency inputs
    const currencyMaskOptions = {
        mask: 'R$ num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                radix: ',',
                scale: 2,
                padFractionalZeros: true,
                normalizeZeros: true,
            }
        }
    };
    const tAmountMask = IMask(document.getElementById('tAmount'), currencyMaskOptions);
    const gTargetMask = IMask(document.getElementById('gTarget'), currencyMaskOptions);
    const gCurrentMask = IMask(document.getElementById('gCurrent'), currencyMaskOptions);

    // Categories Logic
    let categories = [];
    const tCategorySelect = document.getElementById('tCategory');

    const loadCategories = async () => {
        const Category = Parse.Object.extend("Category");
        const query = new Parse.Query(Category);
        query.equalTo("user", currentUser);
        try {
            const results = await query.find();
            categories = results.map(c => c.get("name"));
            // Default categories if none
            if (categories.length === 0) {
                categories = ['Salário', 'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Outros'];
            }
            updateCategorySelect();
        } catch (error) {
            console.error("Error loading categories", error);
        }
    };

    const updateCategorySelect = () => {
        tCategorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    };

    document.getElementById('newCategoryBtn').addEventListener('click', async () => {
        const newCat = prompt("Nome da nova categoria:");
        if (newCat && newCat.trim() !== "") {
            const Category = Parse.Object.extend("Category");
            const cat = new Category();
            cat.set("name", newCat.trim());
            cat.set("user", currentUser);
            showLoading();
            try {
                await cat.save();
                categories.push(newCat.trim());
                updateCategorySelect();
                tCategorySelect.value = newCat.trim();
            } catch (error) {
                alert("Erro ao salvar categoria: " + error.message);
            }
            hideLoading();
        }
    });

    // -----------------------------------------------------
    // 4. Data Fetching & Dashboard Update
    // -----------------------------------------------------
    let currentTransactions = [];
    let totalIncome = 0;
    let totalExpense = 0;
    let categoryExpenses = {};

    const fetchDashboardData = async () => {
        showLoading();
        try {
            // Get selected month boundaries
            const filterParts = monthFilter.value.split('-');
            const year = parseInt(filterParts[0]);
            const month = parseInt(filterParts[1]) - 1; // 0-indexed

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59);

            // Fetch Transactions
            const Transaction = Parse.Object.extend("Transaction");
            const tQuery = new Parse.Query(Transaction);
            tQuery.equalTo("user", currentUser);
            // We use string compare for simple dates (YYYY-MM-DD) or actual Dates depending on save format.
            // Let's assume we save as string 'YYYY-MM-DD' for simplicity
            // Format dates manually to avoid timezone shift from toISOString()
            const pad = (n) => String(n).padStart(2, '0');
            const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
            const endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

            tQuery.greaterThanOrEqualTo("date", startDateStr);
            tQuery.lessThanOrEqualTo("date", endDateStr);
            tQuery.limit(1000); // adjust as needed

            const transactions = await tQuery.find();

            totalIncome = 0;
            totalExpense = 0;
            categoryExpenses = {};
            currentTransactions = [];

            transactions.forEach(t => {
                const data = {
                    type: t.get("type"),
                    amount: t.get("amount"),
                    category: t.get("category"),
                    date: t.get("date")
                };
                currentTransactions.push(data);

                if (data.type === 'income') {
                    totalIncome += data.amount;
                } else if (data.type === 'expense') {
                    totalExpense += data.amount;
                    if (categoryExpenses[data.category]) {
                        categoryExpenses[data.category] += data.amount;
                    } else {
                        categoryExpenses[data.category] = data.amount;
                    }
                }
            });

            const totalBalance = totalIncome - totalExpense;

            document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
            document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
            document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);

            // Fetch Goals
            const Goal = Parse.Object.extend("Goal");
            const gQuery = new Parse.Query(Goal);
            gQuery.equalTo("user", currentUser);
            const goals = await gQuery.find();

            const goalsContainer = document.getElementById('goalsContainer');
            goalsContainer.innerHTML = '';

            if (goals.length === 0) {
                 goalsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm italic">Nenhuma meta encontrada.</p>';
            }

            goals.forEach(g => {
                const name = g.get("name");
                const target = g.get("target");
                const current = g.get("current");
                const percent = Math.min(100, Math.round((current / target) * 100));

                const goalHtml = `
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="font-medium">${name}</span>
                            <span>${formatCurrency(current)} / ${formatCurrency(target)} (${percent}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
                goalsContainer.innerHTML += goalHtml;
            });

            // Spending limits alert (Hardcoded for demonstration, could be user setting)
            const spendingLimit = 2000;
            const alertsContainer = document.getElementById('alertsContainer');
            if (totalExpense > spendingLimit) {
                alertsContainer.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded dark:bg-red-900/30 dark:text-red-400" role="alert">
                        <p class="font-bold">Atenção!</p>
                        <p>Seus gastos totais (${formatCurrency(totalExpense)}) excederam o limite definido de ${formatCurrency(spendingLimit)}.</p>
                    </div>
                `;
            } else {
                alertsContainer.innerHTML = '';
            }

            renderCharts();

        } catch (error) {
            console.error("Error fetching data", error);
        }
        hideLoading();
    };

    // -----------------------------------------------------
    // 5. Save Forms Logic
    // -----------------------------------------------------
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const Transaction = Parse.Object.extend("Transaction");
        const t = new Transaction();
        t.set("type", document.getElementById('tType').value);
        t.set("category", document.getElementById('tCategory').value);
        t.set("amount", parseCurrency(document.getElementById('tAmount').value));
        t.set("date", document.getElementById('tDate').value);
        t.set("user", currentUser);

        try {
            await t.save();
            transactionModal.classList.add('hidden');
            fetchDashboardData();
        } catch (error) {
            alert("Erro ao salvar transação: " + error.message);
            hideLoading();
        }
    });

    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const Goal = Parse.Object.extend("Goal");
        const g = new Goal();
        g.set("name", document.getElementById('gName').value);
        g.set("target", parseCurrency(document.getElementById('gTarget').value));
        g.set("current", parseCurrency(document.getElementById('gCurrent').value));
        g.set("user", currentUser);

        try {
            await g.save();
            goalModal.classList.add('hidden');
            fetchDashboardData();
        } catch (error) {
            alert("Erro ao salvar meta: " + error.message);
            hideLoading();
        }
    });

    // -----------------------------------------------------
    // 6. Charts (Chart.js)
    // -----------------------------------------------------
    let expensesChartInstance = null;
    let historyChartInstance = null;

    const renderCharts = () => {
        const textColor = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
        const gridColor = document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb';
        const borderColor = document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff';

        // Expenses Pie Chart
        const ctxExpenses = document.getElementById('expensesChart');
        if (ctxExpenses) {
            if (expensesChartInstance) expensesChartInstance.destroy();
            expensesChartInstance = new Chart(ctxExpenses, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categoryExpenses).length > 0 ? Object.keys(categoryExpenses) : ['Sem dados'],
                    datasets: [{
                        data: Object.values(categoryExpenses).length > 0 ? Object.values(categoryExpenses) : [1],
                        backgroundColor: Object.values(categoryExpenses).length > 0 ? ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'] : ['#9ca3af'],
                        borderWidth: 1,
                        borderColor: borderColor
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

        // History Chart (Simplified - showing daily aggregated for the month)
        const ctxHistory = document.getElementById('historyChart');
        if (ctxHistory) {
            // Aggregate by date
            const dailyData = {};
            currentTransactions.forEach(t => {
                if (!dailyData[t.date]) dailyData[t.date] = { inc: 0, exp: 0 };
                if (t.type === 'income') dailyData[t.date].inc += t.amount;
                if (t.type === 'expense') dailyData[t.date].exp += t.amount;
            });

            const labels = Object.keys(dailyData).sort();
            const incData = labels.map(l => dailyData[l].inc);
            const expData = labels.map(l => dailyData[l].exp);

            if (historyChartInstance) historyChartInstance.destroy();
            historyChartInstance = new Chart(ctxHistory, {
                type: 'bar',
                data: {
                    labels: labels.length > 0 ? labels : ['Sem dados'],
                    datasets: [
                        { label: 'Receitas', data: incData.length > 0 ? incData : [0], backgroundColor: '#22c55e' },
                        { label: 'Despesas', data: expData.length > 0 ? expData : [0], backgroundColor: '#ef4444' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor } }
                    },
                    plugins: {
                        legend: { labels: { color: textColor } }
                    }
                }
            });
        }
    };

    // -----------------------------------------------------
    // 7. Download Report (html2pdf via Template)
    // -----------------------------------------------------
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            showLoading();

            // Populate the template
            document.getElementById('pdfPeriod').textContent = `Período: ${monthFilter.value}`;
            document.getElementById('pdfIncome').textContent = formatCurrency(totalIncome);
            document.getElementById('pdfExpense').textContent = formatCurrency(totalExpense);
            document.getElementById('pdfBalance').textContent = formatCurrency(totalIncome - totalExpense);

            const tbody = document.getElementById('pdfTableBody');
            tbody.innerHTML = '';

            // Sort transactions by date descending
            const sortedTx = [...currentTransactions].sort((a,b) => new Date(b.date) - new Date(a.date));

            sortedTx.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="border p-2">${t.date}</td>
                    <td class="border p-2">${t.category}</td>
                    <td class="border p-2 font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                    <td class="border p-2">${formatCurrency(t.amount)}</td>
                `;
                tbody.appendChild(tr);
            });

            const element = document.getElementById('pdfTemplate');
            element.classList.remove('hidden');

            const opt = {
                margin:       10,
                filename:     `relatorio_financas_${monthFilter.value}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                element.classList.add('hidden');
                hideLoading();
            }).catch(err => {
                console.error('PDF generation error', err);
                element.classList.add('hidden');
                hideLoading();
            });
        });
    }

    // Init
    await loadCategories();
    fetchDashboardData();
});
