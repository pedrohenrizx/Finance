// js/utils.js

// 1. Toast Notification System (Melhoria 1)
const Toast = {
    init() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    },
    show(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            this.init();
            container = document.getElementById('toast-container');
        }

        const toast = document.createElement('div');

        // Colors based on type
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        const bgColor = colors[type] || colors.info;

        toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;

        toast.innerHTML = `
            <span>${message}</span>
            <button class="ml-auto focus:outline-none hover:text-gray-200" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// 2. Count-up Animation (Melhoria 6)
const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress * (end - start) + start;
        obj.innerHTML = Utils.formatCurrency(currentVal);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// 3. Shared Utilities
const Utils = {
    formatCurrency: (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val),
    parseCurrency: (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9,-]+/g,"").replace(',', '.'));
    },
    // Form button states (Melhoria 5 & 25)
    setButtonLoading(btnId, isLoading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando...`;
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            btn.innerHTML = btn.dataset.originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }
};
