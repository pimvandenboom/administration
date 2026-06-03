// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

const STORAGE_KEY = 'expenses';
let expenses = [];

// Initialize application
function initializeApp() {
    loadExpenses();
    setupEventListeners();
    setDefaultDate();
    renderExpenses();
    updateStatistics();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('monthFilter').addEventListener('change', renderExpenses);
    document.getElementById('categoryFilter').addEventListener('change', renderExpenses);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
}

// Set today's date as default
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Add new expense
function addExpense(e) {
    e.preventDefault();

    const expense = {
        id: Date.now(),
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
    };

    expenses.push(expense);
    saveExpenses();
    updateStatistics();
    renderExpenses();
    
    // Reset form
    document.getElementById('expenseForm').reset();
    setDefaultDate();
    
    showNotification('Uitgave toegevoegd!', 'success');
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Weet je zeker dat je deze uitgave wilt verwijderen?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses();
        updateStatistics();
        renderExpenses();
        showNotification('Uitgave verwijderd!', 'success');
    }
}

// Render expenses table
function renderExpenses() {
    const tbody = document.getElementById('expensesBody');
    tbody.innerHTML = '';

    const monthFilter = document.getElementById('monthFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filtered = expenses.filter(exp => {
        const monthMatch = !monthFilter || exp.date.startsWith(monthFilter);
        const categoryMatch = !categoryFilter || exp.category === categoryFilter;
        return monthMatch && categoryMatch;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">Geen uitgaven gevonden</td></tr>';
        updateCategorySummary([]);
        return;
    }

    filtered.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(exp.date)}</td>
            <td>${exp.category}</td>
            <td>${exp.description}</td>
            <td>€${exp.amount.toFixed(2)}</td>
            <td><button class="delete-btn btn-small" onclick="deleteExpense(${exp.id})">Verwijderen</button></td>
        `;
        tbody.appendChild(row);
    });

    updateCategorySummary(filtered);
}

// Update statistics
function updateStatistics() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = expenses
        .filter(exp => exp.date.startsWith(currentMonth))
        .reduce((sum, exp) => sum + exp.amount, 0);

    document.getElementById('totalAmount').textContent = `€${total.toFixed(2)}`;
    document.getElementById('transactionCount').textContent = expenses.length;
    document.getElementById('monthAmount').textContent = `€${monthTotal.toFixed(2)}`;
}

// Update category summary
function updateCategorySummary(filtered) {
    const container = document.getElementById('categorySummary');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen uitgaven gevonden</p>';
        return;
    }

    const categories = {};
    filtered.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    container.innerHTML = '';
    Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <div class="category-name">${category}</div>
                <div class="category-amount">€${amount.toFixed(2)}</div>
            `;
            container.appendChild(div);
        });
}

// Export data to CSV
function exportData() {
    if (expenses.length === 0) {
        alert('Geen uitgaven om te exporteren');
        return;
    }

    const monthFilter = document.getElementById('monthFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filtered = expenses.filter(exp => {
        const monthMatch = !monthFilter || exp.date.startsWith(monthFilter);
        const categoryMatch = !categoryFilter || exp.category === categoryFilter;
        return monthMatch && categoryMatch;
    });

    let csv = 'Datum,Categorie,Omschrijving,Bedrag\n';
    
    filtered.forEach(exp => {
        csv += `${exp.date},${exp.category},"${exp.description}",€${exp.amount.toFixed(2)}\n`;
    });

    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    csv += `\nTotaal,,,€${total.toFixed(2)}`;

    downloadCSV(csv, `administratie_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Geexporteerd naar CSV!', 'success');
}

// Download CSV file
function downloadCSV(csv, filename) {
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = filename;
    link.click();
}

// Clear all data
function clearAllData() {
    if (confirm('WAARSCHUWING: Dit zal alle gegevens permanent verwijderen. Weet je het zeker?')) {
        expenses = [];
        saveExpenses();
        updateStatistics();
        renderExpenses();
        showNotification('Alle gegevens verwijderd!', 'success');
    }
}

// Format date to Dutch format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('nl-NL', options);
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Add animation
    if (!document.querySelector('style[data-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification', 'true');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// Load expenses from localStorage
function loadExpenses() {
    const stored = localStorage.getItem(STORAGE_KEY);
    expenses = stored ? JSON.parse(stored) : [];
}
