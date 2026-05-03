const expenseState = {
    expenses: [],
    filteredExpenses: [],
    initialized: false
};

const expenseElements = {};

window.initExpenseDashboard = initExpenseDashboard;
window.resetExpenseDashboard = resetExpenseDashboard;

function initExpenseDashboard() {
    cacheExpenseElements();

    if (!expenseState.initialized) {
        expenseElements.expenseForm.addEventListener("submit", saveExpense);
        expenseElements.cancelEditBtn.addEventListener("click", resetExpenseForm);
        expenseElements.refreshBtn.addEventListener("click", loadExpenses);
        expenseElements.searchInput.addEventListener("input", applyFilters);
        expenseElements.categoryFilter.addEventListener("change", applyFilters);
        expenseState.initialized = true;
    }

    loadExpenses();
}

function cacheExpenseElements() {
    expenseElements.expenseForm = document.getElementById("expenseForm");
    expenseElements.expenseId = document.getElementById("expenseId");
    expenseElements.formTitle = document.getElementById("formTitle");
    expenseElements.submitExpenseBtn = document.getElementById("submitExpenseBtn");
    expenseElements.cancelEditBtn = document.getElementById("cancelEditBtn");
    expenseElements.title = document.getElementById("title");
    expenseElements.amount = document.getElementById("amount");
    expenseElements.category = document.getElementById("category");
    expenseElements.date = document.getElementById("date");
    expenseElements.expenseMessage = document.getElementById("expenseMessage");
    expenseElements.tableBody = document.getElementById("expenseTableBody");
    expenseElements.emptyState = document.getElementById("emptyState");
    expenseElements.totalAmount = document.getElementById("totalAmount");
    expenseElements.expenseCount = document.getElementById("expenseCount");
    expenseElements.visibleCount = document.getElementById("visibleCount");
    expenseElements.searchInput = document.getElementById("searchInput");
    expenseElements.categoryFilter = document.getElementById("categoryFilter");
    expenseElements.refreshBtn = document.getElementById("refreshBtn");
    expenseElements.chart = document.getElementById("monthlyChart");
}

async function loadExpenses() {
    try {
        setLoading(true);
        const token = requireAuthToken();
        const expenses = await apiRequest("/expenses", {
            headers: { Authorization: `Bearer ${token}` }
        });

        expenseState.expenses = Array.isArray(expenses) ? expenses : [];
        updateCategoryFilter();
        applyFilters();
        showMessage(expenseElements.expenseMessage, "Expenses loaded.", "success");
    } catch (error) {
        showMessage(expenseElements.expenseMessage, readableError(error, "Could not load expenses."), "error");
    } finally {
        setLoading(false);
    }
}

async function saveExpense(event) {
    event.preventDefault();

    const expense = readExpenseForm();
    if (!expense) return;

    const isEdit = Boolean(expenseElements.expenseId.value);
    const endpoint = isEdit ? `/expenses/${expenseElements.expenseId.value}` : "/expenses";

    try {
        setLoading(true);
        const token = requireAuthToken();
        await apiRequest(endpoint, {
            method: isEdit ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(expense)
        });

        showMessage(
            expenseElements.expenseMessage,
            isEdit ? "Expense updated successfully." : "Expense added successfully.",
            "success"
        );
        resetExpenseForm();
        await loadExpenses();
    } catch (error) {
        showMessage(expenseElements.expenseMessage, readableError(error, "Could not save expense."), "error");
    } finally {
        setLoading(false);
    }
}

function readExpenseForm() {
    const title = expenseElements.title.value.trim();
    const amount = Number(expenseElements.amount.value);
    const category = expenseElements.category.value.trim();
    const date = expenseElements.date.value;

    if (!title || !expenseElements.amount.value || !category || !date) {
        showMessage(expenseElements.expenseMessage, "Please fill all expense fields.", "error");
        return null;
    }

    if (Number.isNaN(amount) || amount <= 0) {
        showMessage(expenseElements.expenseMessage, "Amount must be greater than 0.", "error");
        return null;
    }

    return { title, amount, category, date };
}

function editExpense(id) {
    const expense = expenseState.expenses.find(item => String(item.id) === String(id));
    if (!expense) return;

    expenseElements.expenseId.value = expense.id;
    expenseElements.title.value = expense.title || "";
    expenseElements.amount.value = expense.amount || "";
    expenseElements.category.value = expense.category || "";
    expenseElements.date.value = expense.date || "";
    expenseElements.formTitle.textContent = "Update Expense";
    expenseElements.submitExpenseBtn.textContent = "Update Expense";
    expenseElements.cancelEditBtn.classList.remove("hidden");
    expenseElements.title.focus();
}

async function deleteExpense(id) {
    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) return;

    try {
        setLoading(true);
        const token = requireAuthToken();
        await apiRequest(`/expenses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        showMessage(expenseElements.expenseMessage, "Expense deleted successfully.", "success");
        await loadExpenses();
    } catch (error) {
        showMessage(expenseElements.expenseMessage, readableError(error, "Could not delete expense."), "error");
    } finally {
        setLoading(false);
    }
}

function applyFilters() {
    const searchText = expenseElements.searchInput.value.trim().toLowerCase();
    const category = expenseElements.categoryFilter.value;

    expenseState.filteredExpenses = expenseState.expenses.filter(expense => {
        const matchesTitle = (expense.title || "").toLowerCase().includes(searchText);
        const matchesCategory = !category || expense.category === category;
        return matchesTitle && matchesCategory;
    });

    renderExpenses();
    renderSummary();
    renderMonthlyChart();
}

function renderExpenses() {
    expenseElements.tableBody.innerHTML = "";

    if (!expenseState.filteredExpenses.length) {
        expenseElements.emptyState.classList.remove("hidden");
        return;
    }

    expenseElements.emptyState.classList.add("hidden");
    expenseState.filteredExpenses.forEach(expense => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(expense.title)}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td>${escapeHtml(expense.date)}</td>
            <td>
                <div class="row-actions">
                    <button type="button" onclick="editExpense(${expense.id})">Edit</button>
                    <button type="button" class="danger-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </td>
        `;
        expenseElements.tableBody.appendChild(row);
    });
}

function renderSummary() {
    const total = expenseState.filteredExpenses.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);

    expenseElements.totalAmount.textContent = formatCurrency(total);
    expenseElements.expenseCount.textContent = String(expenseState.expenses.length);
    expenseElements.visibleCount.textContent = String(expenseState.filteredExpenses.length);
}

function updateCategoryFilter() {
    const selectedValue = expenseElements.categoryFilter.value;
    const categories = [...new Set(expenseState.expenses.map(expense => expense.category).filter(Boolean))].sort();

    expenseElements.categoryFilter.innerHTML = '<option value="">All categories</option>';
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        expenseElements.categoryFilter.appendChild(option);
    });

    if (categories.includes(selectedValue)) {
        expenseElements.categoryFilter.value = selectedValue;
    }
}

function renderMonthlyChart() {
    const canvas = expenseElements.chart;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 42;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fffaf0";
    context.fillRect(0, 0, width, height);

    const monthlyTotals = buildMonthlyTotals(expenseState.filteredExpenses);
    const entries = Object.entries(monthlyTotals);

    if (!entries.length) {
        context.fillStyle = "#746958";
        context.font = "18px Georgia";
        context.textAlign = "center";
        context.fillText("No chart data yet", width / 2, height / 2);
        return;
    }

    const maxAmount = Math.max(...entries.map(([, amount]) => amount), 1);
    const barGap = 14;
    const barWidth = Math.max(18, (chartWidth - barGap * (entries.length - 1)) / entries.length);

    context.strokeStyle = "#ded0b9";
    context.beginPath();
    context.moveTo(padding, padding);
    context.lineTo(padding, height - padding);
    context.lineTo(width - padding / 2, height - padding);
    context.stroke();

    entries.forEach(([month, amount], index) => {
        const x = padding + index * (barWidth + barGap);
        const barHeight = (amount / maxAmount) * chartHeight;
        const y = height - padding - barHeight;

        context.fillStyle = "#176b56";
        context.fillRect(x, y, barWidth, barHeight);
        context.fillStyle = "#262018";
        context.font = "13px Georgia";
        context.textAlign = "center";
        context.fillText(month, x + barWidth / 2, height - 16);
        context.fillText(Math.round(amount), x + barWidth / 2, y - 8);
    });
}

function buildMonthlyTotals(expenses) {
    return expenses.reduce((months, expense) => {
        if (!expense.date) return months;
        const month = expense.date.slice(0, 7);
        months[month] = (months[month] || 0) + Number(expense.amount || 0);
        return months;
    }, {});
}

function resetExpenseForm() {
    expenseElements.expenseForm.reset();
    expenseElements.expenseId.value = "";
    expenseElements.formTitle.textContent = "Add Expense";
    expenseElements.submitExpenseBtn.textContent = "Add Expense";
    expenseElements.cancelEditBtn.classList.add("hidden");
}

function resetExpenseDashboard() {
    if (!expenseState.initialized) return;

    expenseState.expenses = [];
    expenseState.filteredExpenses = [];
    resetExpenseForm();
    renderExpenses();
    renderSummary();
    renderMonthlyChart();
    showMessage(expenseElements.expenseMessage, "", "");
}

function formatCurrency(value) {
    return `Rs ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
