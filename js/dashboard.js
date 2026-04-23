// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = Parse.User.current();
    if (!currentUser) return;

    // Theme Management
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
        });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarNav = document.getElementById('sidebarNav');
    if (mobileMenuBtn && sidebarNav) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebarNav.classList.toggle('hidden');
        });
        sidebarNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && window.innerWidth < 768) {
                sidebarNav.classList.add('hidden');
            }
        });
    }

    // -----------------------------------------------------
    // Utilities & State
    // -----------------------------------------------------
    const loadingSpinner = document.getElementById('loadingSpinner');
    const showLoading = () => loadingSpinner.classList.remove('hidden');
    const hideLoading = () => loadingSpinner.classList.add('hidden');

    // Advanced Filters (Melhoria 16)
    const monthFilter = document.getElementById('monthFilter');
    const typeFilter = document.getElementById('typeFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    const today = new Date();
    monthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    [monthFilter, typeFilter, categoryFilter].forEach(el => {
        el.addEventListener('change', () => fetchDashboardData());
    });

    // Clear Filters (Melhoria 17)
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        monthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        typeFilter.value = 'all';
        categoryFilter.value = 'all';
        fetchDashboardData();
        Toast.show('Filtros limpos.', 'info');
    });

    // Refresh Data (Melhoria 18)
    document.getElementById('refreshDataBtn').addEventListener('click', () => {
        fetchDashboardData();
        Toast.show('Dados recarregados.', 'info');
    });

    // -----------------------------------------------------
    // Modals & IMask Setup
    // -----------------------------------------------------
    const transactionModal = document.getElementById('transactionModal');
    const goalModal = document.getElementById('goalModal');

    document.getElementById('addTransactionBtn').addEventListener('click', () => {
        document.getElementById('tModalTitle').textContent = 'Nova Transação';
        document.getElementById('transactionForm').reset();
        document.getElementById('tId').value = '';
        document.getElementById('tDate').valueAsDate = new Date();
        transactionModal.classList.remove('hidden');
    });
    document.getElementById('closeTransactionModal').addEventListener('click', () => transactionModal.classList.add('hidden'));

    document.getElementById('addGoalBtn').addEventListener('click', () => {
        document.getElementById('gModalTitle').textContent = 'Nova Meta';
        document.getElementById('goalForm').reset();
        document.getElementById('gId').value = '';
        goalModal.classList.remove('hidden');
    });
    document.getElementById('closeGoalModal').addEventListener('click', () => goalModal.classList.add('hidden'));

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

    // Load Categories
    let categories = [];
    const tCategorySelect = document.getElementById('tCategory');

    const loadCategories = async () => {
        const Category = Parse.Object.extend("Category");
        const query = new Parse.Query(Category);
        query.equalTo("user", currentUser);
        try {
            const results = await query.find();
            categories = results.map(c => c.get("name"));
            if (categories.length === 0) {
                categories = ['Salário', 'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Outros'];
            }
            updateCategorySelects();
        } catch (error) {
            console.error("Error loading categories", error);
        }
    };

    const updateCategorySelects = () => {
        const options = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        tCategorySelect.innerHTML = options;
        categoryFilter.innerHTML = '<option value="all">Todas</option>' + options;
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
                updateCategorySelects();
                tCategorySelect.value = newCat.trim();
                Toast.show('Categoria criada!', 'success');
            } catch (error) {
                Toast.show('Erro ao salvar categoria: ' + error.message, 'error');
            }
            hideLoading();
        }
    });

    // -----------------------------------------------------
    // Data Fetching & UI Update
    // -----------------------------------------------------
    let currentTransactions = [];
    let totalIncome = 0;
    let totalExpense = 0;
    let categoryExpenses = {};

    window.editTransaction = (id) => {
        const t = currentTransactions.find(x => x.id === id);
        if (!t) return;
        document.getElementById('tModalTitle').textContent = 'Editar Transação';
        document.getElementById('tId').value = t.id;
        document.getElementById('tType').value = t.type;
        document.getElementById('tCategory').value = t.category;
        tAmountMask.unmaskedValue = t.amount.toString();
        document.getElementById('tDate').value = t.date;
        transactionModal.classList.remove('hidden');
    };

    window.deleteTransaction = async (id) => {
        if (!confirm('Deseja realmente apagar esta transação?')) return;
        showLoading();
        try {
            const Transaction = Parse.Object.extend("Transaction");
            const query = new Parse.Query(Transaction);
            const obj = await query.get(id);
            await obj.destroy();
            Toast.show('Transação apagada.', 'success');
            fetchDashboardData();
        } catch (error) {
            Toast.show('Erro ao apagar: ' + error.message, 'error');
            hideLoading();
        }
    };

    window.editGoal = async (id) => {
        const Goal = Parse.Object.extend("Goal");
        const query = new Parse.Query(Goal);
        try {
            const g = await query.get(id);
            document.getElementById('gModalTitle').textContent = 'Editar Meta';
            document.getElementById('gId').value = g.id;
            document.getElementById('gName').value = g.get('name');
            gTargetMask.unmaskedValue = g.get('target').toString();
            gCurrentMask.unmaskedValue = g.get('current').toString();
            goalModal.classList.remove('hidden');
        } catch (error) {
            Toast.show('Erro ao carregar meta.', 'error');
        }
    };

    window.deleteGoal = async (id) => {
        if (!confirm('Deseja realmente apagar esta meta?')) return;
        showLoading();
        try {
            const Goal = Parse.Object.extend("Goal");
            const query = new Parse.Query(Goal);
            const obj = await query.get(id);
            await obj.destroy();
            Toast.show('Meta apagada.', 'success');
            fetchDashboardData();
        } catch (error) {
            Toast.show('Erro ao apagar: ' + error.message, 'error');
            hideLoading();
        }
    };

    const fetchDashboardData = async () => {
        showLoading();
        try {
            const filterParts = monthFilter.value.split('-');
            if (filterParts.length < 2) { hideLoading(); return; }
            const year = parseInt(filterParts[0]);
            const month = parseInt(filterParts[1]) - 1;

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const pad = (n) => String(n).padStart(2, '0');
            const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
            const endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

            const Transaction = Parse.Object.extend("Transaction");
            const tQuery = new Parse.Query(Transaction);
            tQuery.equalTo("user", currentUser);
            tQuery.greaterThanOrEqualTo("date", startDateStr);
            tQuery.lessThanOrEqualTo("date", endDateStr);

            if (typeFilter.value !== 'all') {
                tQuery.equalTo("type", typeFilter.value);
            }
            if (categoryFilter.value !== 'all') {
                tQuery.equalTo("category", categoryFilter.value);
            }

            tQuery.limit(1000);
            tQuery.descending("date"); // Recent first

            const transactions = await tQuery.find();

            let prevTotalIncome = totalIncome;
            let prevTotalExpense = totalExpense;
            let prevBalance = totalIncome - totalExpense;

            totalIncome = 0;
            totalExpense = 0;
            categoryExpenses = {};
            currentTransactions = [];

            const tbody = document.getElementById('recentTransactionsBody');
            tbody.innerHTML = '';

            transactions.forEach(t => {
                const data = {
                    id: t.id,
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

                // Populando a Tabela (Melhoria 8 & 19 & 20)
                const isIncome = data.type === 'income';
                const tr = document.createElement('tr');
                tr.className = "bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors";
                tr.innerHTML = `
                    <td class="px-4 py-2 font-medium">${data.date.split('-').reverse().join('/')}</td>
                    <td class="px-4 py-2">${data.category}</td>
                    <td class="px-4 py-2 text-right font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${isIncome ? '+' : '-'}${Utils.formatCurrency(data.amount)}
                    </td>
                    <td class="px-4 py-2 text-center">
                        <button onclick="editTransaction('${data.id}')" class="text-blue-500 hover:text-blue-700 mr-2" aria-label="Editar">
                            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteTransaction('${data.id}')" class="text-red-500 hover:text-red-700" aria-label="Eliminar">
                            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Empty States (Melhoria 9)
            if (currentTransactions.length === 0) {
                document.getElementById('transactionsEmpty').classList.remove('hidden');
                document.getElementById('expensesEmpty').classList.remove('hidden');
            } else {
                document.getElementById('transactionsEmpty').classList.add('hidden');
                if (Object.keys(categoryExpenses).length === 0) {
                    document.getElementById('expensesEmpty').classList.remove('hidden');
                } else {
                    document.getElementById('expensesEmpty').classList.add('hidden');
                }
            }

            const totalBalance = totalIncome - totalExpense;

            // Animations (Melhoria 6)
            animateValue(document.getElementById('totalBalance'), prevBalance, totalBalance, 500);
            animateValue(document.getElementById('totalIncome'), prevTotalIncome, totalIncome, 500);
            animateValue(document.getElementById('totalExpense'), prevTotalExpense, totalExpense, 500);

            // Fetch Goals
            const Goal = Parse.Object.extend("Goal");
            const gQuery = new Parse.Query(Goal);
            gQuery.equalTo("user", currentUser);
            const goals = await gQuery.find();

            const goalsContainer = document.getElementById('goalsContainer');
            goalsContainer.innerHTML = '';

            if (goals.length === 0) {
                 goalsContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center p-6 text-gray-400">
                        <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <p class="text-sm italic">Nenhuma meta definida.</p>
                    </div>`;
            }

            goals.forEach(g => {
                const id = g.id;
                const name = g.get("name");
                const target = g.get("target");
                const current = g.get("current");
                const percent = Math.min(100, Math.round((current / target) * 100));

                // Melhoria 21 & 22: Goal Edit/Delete
                const goalHtml = `
                    <div class="group relative pr-16">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="font-medium">${name}</span>
                            <span>${Utils.formatCurrency(current)} / ${Utils.formatCurrency(target)} (${percent}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-target="${percent}%"></div>
                        </div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onclick="editGoal('${id}')" class="text-blue-500 hover:text-blue-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onclick="deleteGoal('${id}')" class="text-red-500 hover:text-red-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </div>
                `;
                goalsContainer.innerHTML += goalHtml;
            });

            // Animate goal bars
            setTimeout(() => {
                document.querySelectorAll('#goalsContainer .bg-blue-600').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-target');
                });
            }, 100);

            // Alerts
            const spendingLimit = 2000;
            const alertsContainer = document.getElementById('alertsContainer');
            if (totalExpense > spendingLimit) {
                alertsContainer.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm dark:bg-red-900/30 dark:text-red-400 flex items-center justify-between" role="alert">
                        <div>
                            <p class="font-bold">Atenção!</p>
                            <p class="text-sm">Seus gastos totais (${Utils.formatCurrency(totalExpense)}) excederam o limite definido (${Utils.formatCurrency(spendingLimit)}).</p>
                        </div>
                        <svg class="w-6 h-6 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                `;
            } else {
                alertsContainer.innerHTML = '';
            }

            renderCharts();

        } catch (error) {
            Toast.show('Erro ao carregar dados: ' + error.message, 'error');
        }
        hideLoading();
    };

    // -----------------------------------------------------
    // Save Forms Logic (Melhoria 5 - Loading states)
    // -----------------------------------------------------
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.setButtonLoading('saveTransactionBtn', true);

        const Transaction = Parse.Object.extend("Transaction");
        const tId = document.getElementById('tId').value;
        let t;
        if (tId) {
            const query = new Parse.Query(Transaction);
            t = await query.get(tId);
        } else {
            t = new Transaction();
            t.set("user", currentUser);
        }

        t.set("type", document.getElementById('tType').value);
        t.set("category", document.getElementById('tCategory').value);
        t.set("amount", Utils.parseCurrency(document.getElementById('tAmount').value));
        t.set("date", document.getElementById('tDate').value);

        try {
            await t.save();
            transactionModal.classList.add('hidden');
            Toast.show('Transação salva com sucesso!', 'success');
            fetchDashboardData();
        } catch (error) {
            Toast.show("Erro ao salvar transação: " + error.message, 'error');
        } finally {
            Utils.setButtonLoading('saveTransactionBtn', false);
        }
    });

    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.setButtonLoading('saveGoalBtn', true);

        const Goal = Parse.Object.extend("Goal");
        const gId = document.getElementById('gId').value;
        let g;
        if (gId) {
            const query = new Parse.Query(Goal);
            g = await query.get(gId);
        } else {
            g = new Goal();
            g.set("user", currentUser);
        }

        g.set("name", document.getElementById('gName').value);
        g.set("target", Utils.parseCurrency(document.getElementById('gTarget').value));
        g.set("current", Utils.parseCurrency(document.getElementById('gCurrent').value));

        try {
            await g.save();
            goalModal.classList.add('hidden');
            Toast.show('Meta salva com sucesso!', 'success');
            fetchDashboardData();
        } catch (error) {
            Toast.show("Erro ao salvar meta: " + error.message, 'error');
        } finally {
            Utils.setButtonLoading('saveGoalBtn', false);
        }
    });

    // -----------------------------------------------------
    // Charts (Chart.js)
    // -----------------------------------------------------
    let expensesChartInstance = null;

    const renderCharts = () => {
        const textColor = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
        const borderColor = document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff';

        const ctxExpenses = document.getElementById('expensesChart');
        if (ctxExpenses) {
            if (expensesChartInstance) expensesChartInstance.destroy();
            const hasData = Object.keys(categoryExpenses).length > 0;

            expensesChartInstance = new Chart(ctxExpenses, {
                type: 'doughnut',
                data: {
                    labels: hasData ? Object.keys(categoryExpenses) : [],
                    datasets: [{
                        data: hasData ? Object.values(categoryExpenses) : [],
                        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'],
                        borderWidth: 2,
                        borderColor: borderColor,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'right', labels: { color: textColor, padding: 20, usePointStyle: true } },
                        // Melhoria 7: Tooltips refinados
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        label += Utils.formatCurrency(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    // -----------------------------------------------------
    // PDF Export
    // -----------------------------------------------------
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            showLoading();
            document.getElementById('pdfPeriod').textContent = `Período: ${monthFilter.value} | Filtros: ${typeFilter.options[typeFilter.selectedIndex].text} / ${categoryFilter.options[categoryFilter.selectedIndex].text}`;
            document.getElementById('pdfIncome').textContent = Utils.formatCurrency(totalIncome);
            document.getElementById('pdfExpense').textContent = Utils.formatCurrency(totalExpense);
            document.getElementById('pdfBalance').textContent = Utils.formatCurrency(totalIncome - totalExpense);

            const tbody = document.getElementById('pdfTableBody');
            tbody.innerHTML = '';

            currentTransactions.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="border p-2">${t.date.split('-').reverse().join('/')}</td>
                    <td class="border p-2">${t.category}</td>
                    <td class="border p-2 font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                    <td class="border p-2 text-right">${Utils.formatCurrency(t.amount)}</td>
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
                Toast.show('PDF gerado com sucesso!', 'success');
            }).catch(err => {
                element.classList.add('hidden');
                hideLoading();
                Toast.show('Erro ao gerar PDF: ' + err, 'error');
            });
        });
    }

    // -----------------------------------------------------
    // CSV Export (Melhoria 15)
    // -----------------------------------------------------
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (currentTransactions.length === 0) {
                Toast.show('Não há dados para exportar.', 'warning');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Data,Categoria,Tipo,Valor\n";

            currentTransactions.forEach(t => {
                const tipo = t.type === 'income' ? 'Receita' : 'Despesa';
                const row = `"${t.date}","${t.category}","${tipo}","${t.amount}"`;
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `transacoes_${monthFilter.value}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Toast.show('CSV baixado com sucesso!', 'success');
        });
    }

    // Init
    await loadCategories();
    fetchDashboardData();
});
