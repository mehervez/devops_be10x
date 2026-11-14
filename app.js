const categories = {
  expense: [
    { name: "Food & dining", icon: "🍜", color: "#4c9368", tint: "#edf5ef" },
    { name: "Housing", icon: "⌂", color: "#88b697", tint: "#eef6ef" },
    { name: "Transport", icon: "↗", color: "#d2a35f", tint: "#faf3e9" },
    { name: "Shopping", icon: "◇", color: "#d18770", tint: "#fbefeb" },
    { name: "Bills & utilities", icon: "ϟ", color: "#8595b0", tint: "#eef1f7" },
    { name: "Health", icon: "✚", color: "#b77e8a", tint: "#f7eef0" },
    { name: "Entertainment", icon: "♫", color: "#9b84b4", tint: "#f2eef7" },
    { name: "Other", icon: "✳", color: "#a6aea8", tint: "#f1f3f1" }
  ],
  income: [
    { name: "Salary", icon: "↙", color: "#4c9368", tint: "#edf5ef" },
    { name: "Freelance", icon: "✳", color: "#8595b0", tint: "#eef1f7" },
    { name: "Other income", icon: "◇", color: "#d2a35f", tint: "#faf3e9" }
  ]
};

const budgetDefaults = [
  { name: "Food & dining", limit: 12000 },
  { name: "Transport", limit: 6000 },
  { name: "Shopping", limit: 8000 }
];
const storageKey = "penny-finance-transactions-v1";
const budgetKey = "penny-finance-budgets-v1";
const today = new Date();
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};
const makeSeedTransactions = () => [
  { id: crypto.randomUUID(), name: "Salary", type: "income", category: "Salary", amount: 85000, date: dateOffset(3), account: "Everyday account", note: "Monthly salary" },
  { id: crypto.randomUUID(), name: "Weekly groceries", type: "expense", category: "Food & dining", amount: 2450, date: dateOffset(1), account: "Everyday account", note: "Groceries" },
  { id: crypto.randomUUID(), name: "Monthly rent", type: "expense", category: "Housing", amount: 22000, date: dateOffset(2), account: "Everyday account", note: "Apartment rent" },
  { id: crypto.randomUUID(), name: "Coffee & brunch", type: "expense", category: "Food & dining", amount: 680, date: dateOffset(4), account: "Cash wallet", note: "Sunday brunch" },
  { id: crypto.randomUUID(), name: "Metro card", type: "expense", category: "Transport", amount: 1200, date: dateOffset(5), account: "Everyday account", note: "Transit top-up" },
  { id: crypto.randomUUID(), name: "Internet bill", type: "expense", category: "Bills & utilities", amount: 999, date: dateOffset(7), account: "Everyday account", note: "Home Wi-Fi" },
  { id: crypto.randomUUID(), name: "Dinner with friends", type: "expense", category: "Food & dining", amount: 1650, date: dateOffset(9), account: "Everyday account", note: "" },
  { id: crypto.randomUUID(), name: "New headphones", type: "expense", category: "Shopping", amount: 3499, date: dateOffset(12), account: "Everyday account", note: "Wireless headphones" },
  { id: crypto.randomUUID(), name: "Pharmacy", type: "expense", category: "Health", amount: 540, date: dateOffset(15), account: "Cash wallet", note: "Essentials" }
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from local storage.`, error);
    return fallback;
  }
}

let transactions = readStorage(storageKey, null);
if (!Array.isArray(transactions)) {
  transactions = makeSeedTransactions();
  saveTransactions();
}
let budgets = readStorage(budgetKey, budgetDefaults);
if (!Array.isArray(budgets)) budgets = budgetDefaults;
let selectedType = "expense";
let activeFilter = "all";
let toastTimer;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
});
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const monthSelect = document.querySelector("#month-select");

function saveTransactions() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  } catch (error) {
    console.error("Unable to save transactions to local storage.", error);
    showToast("Could not save your transaction. Check browser storage.");
  }
}

function saveBudgets() {
  try {
    localStorage.setItem(budgetKey, JSON.stringify(budgets));
  } catch (error) {
    console.error("Unable to save budgets to local storage.", error);
    showToast("Could not save your budget. Check browser storage.");
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function getSelectedMonth() {
  return monthSelect.value || monthKey(today);
}

function monthTransactions() {
  return transactions.filter((item) => item.date.startsWith(getSelectedMonth()));
}

function getCategory(name) {
  return [...categories.expense, ...categories.income].find((item) => item.name === name)
    || { name, icon: "✳", color: "#a6aea8", tint: "#f1f3f1" };
}

function setupMonthSelect() {
  const options = [];
  for (let offset = 0; offset < 12; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    options.push(`<option value="${monthKey(date)}">${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date)}</option>`);
  }
  monthSelect.innerHTML = options.join("");
  monthSelect.value = monthKey(today);
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  }).format(today).toUpperCase();
}

function renderSummary(items) {
  const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const allIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const allExpenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  document.querySelector("#balance-value").textContent = currency.format(allIncome - allExpenses);
  document.querySelector("#income-value").textContent = currency.format(income);
  document.querySelector("#expense-value").textContent = currency.format(expenses);
  document.querySelector("#savings-value").textContent = currency.format(income - expenses);
  document.querySelector("#savings-caption").textContent = income ? `${Math.round(((income - expenses) / income) * 100)}% savings rate` : "Income minus expenses";
}

function renderSpending(items) {
  const expenses = items.filter((item) => item.type === "expense");
  const totals = new Map();
  expenses.forEach((item) => totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount)));
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  document.querySelector("#donut-total").textContent = currency.format(total);
  const chart = document.querySelector("#donut-chart");
  if (total === 0) chart.style.background = "conic-gradient(#e8ece7 0% 100%)";
  else {
    let position = 0;
    const segments = sorted.map(([name, amount]) => {
      const start = position;
      position += (amount / total) * 100;
      return `${getCategory(name).color} ${start}% ${position}%`;
    });
    chart.style.background = `conic-gradient(${segments.join(", ")})`;
  }
  const visible = sorted.slice(0, 5);
  document.querySelector("#category-legend").innerHTML = visible.length
    ? visible.map(([name, amount]) => `<div class="legend-item"><span class="legend-dot" style="background:${getCategory(name).color}"></span><span class="legend-name">${escapeHtml(name)}</span><span class="legend-value">${currency.format(amount)}</span></div>`).join("")
    : '<div class="budget-empty">No spending to show yet.</div>';
}

function renderBudgets(items) {
  const expenses = items.filter((item) => item.type === "expense");
  const totalLimit = budgets.reduce((sum, budget) => sum + Number(budget.limit), 0);
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const percent = totalLimit > 0 ? (spent / totalLimit) * 100 : 0;
  const overallProgress = document.querySelector("#overall-progress");
  document.querySelector("#overall-budget-label").textContent = currency.format(totalLimit);
  document.querySelector("#budget-spent-label").textContent = `${currency.format(spent)} spent`;
  document.querySelector("#budget-remaining-label").textContent = `${currency.format(Math.max(totalLimit - spent, 0))} left`;
  overallProgress.style.width = `${Math.min(percent, 100)}%`;
  overallProgress.className = `budget-progress-fill${percent > 100 ? " over" : percent >= 80 ? " warning" : ""}`;
  document.querySelector("#budget-list").innerHTML = budgets.length
    ? budgets.slice(0, 3).map((budget) => {
      const categorySpent = expenses.filter((item) => item.category === budget.name).reduce((sum, item) => sum + Number(item.amount), 0);
      const icon = getCategory(budget.name).icon;
      return `<div class="budget-item"><div class="budget-category"><span class="budget-emoji">${icon}</span><span>${escapeHtml(budget.name)}</span></div><span class="budget-amount"><strong>${currency.format(categorySpent)}</strong> / ${currency.format(Number(budget.limit))}</span></div>`;
    }).join("")
    : '<div class="budget-empty">No budgets yet. Choose Edit to set your first budget.</div>';
}

function renderTransactions() {
  const query = document.querySelector("#transaction-search").value.trim().toLowerCase();
  const items = monthTransactions()
    .filter((item) => activeFilter === "all" || item.type === activeFilter)
    .filter((item) => `${item.name} ${item.category} ${item.account} ${item.note || ""}`.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date));
  const rows = document.querySelector("#transaction-rows");
  rows.innerHTML = items.slice(0, 8).map((item) => {
    const category = getCategory(item.category);
    const amountPrefix = item.type === "income" ? "+" : "−";
    return `<tr>
      <td><div class="transaction-info"><span class="transaction-icon" style="background:${category.tint};color:${category.color}">${category.icon}</span><span class="transaction-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.note || item.type[0].toUpperCase() + item.type.slice(1))}</small></span></div></td>
      <td><span class="category-tag"><span class="category-dot" style="background:${category.color}"></span>${escapeHtml(item.category)}</span></td>
      <td>${shortDate.format(new Date(`${item.date}T12:00:00`))}</td>
      <td>${escapeHtml(item.account)}</td>
      <td class="amount-cell ${item.type}">${amountPrefix}${currency.format(Number(item.amount))}</td>
      <td><button class="row-menu" data-delete="${escapeHtml(item.id)}" type="button" aria-label="Delete ${escapeHtml(item.name)}">×</button></td>
    </tr>`;
  }).join("");
  document.querySelector("#empty-state").hidden = items.length > 0;
  document.querySelector("#transaction-count").textContent = `Showing ${Math.min(items.length, 8)} of ${items.length} transaction${items.length === 1 ? "" : "s"}`;
}

function render() {
  const items = monthTransactions();
  renderSummary(items);
  renderSpending(items);
  renderBudgets(items);
  renderTransactions();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function populateCategories(type) {
  const categorySelect = document.querySelector("#category-input");
  categorySelect.innerHTML = categories[type].map((item) => `<option>${escapeHtml(item.name)}</option>`).join("");
}

function openModal() {
  const modal = document.querySelector("#transaction-modal");
  document.querySelector("#transaction-form").reset();
  document.querySelector("#date-input").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#transaction-type").value = selectedType;
  document.querySelectorAll(".type-option").forEach((button) => button.classList.toggle("selected", button.dataset.type === selectedType));
  populateCategories(selectedType);
  modal.hidden = false;
  window.setTimeout(() => document.querySelector("#amount-input").focus(), 30);
}

function closeModal() {
  document.querySelector("#transaction-modal").hidden = true;
}

function exportCsv() {
  const headers = ["date", "type", "amount", "category", "account", "note"];
  const rows = transactions.map((item) => headers.map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`).join(","));
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "penny-transactions.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Your transactions are ready to export.");
}

function editBudgets() {
  const current = budgets.reduce((sum, budget) => sum + Number(budget.limit), 0);
  const answer = window.prompt("Set your overall monthly budget (₹):", String(current || 30000));
  if (answer === null) return;
  const amount = Number(answer);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter a budget greater than zero.");
    return;
  }
  budgets = [{ name: "Food & dining", limit: Math.round(amount * 0.4) }, { name: "Transport", limit: Math.round(amount * 0.2) }, { name: "Shopping", limit: Math.round(amount * 0.25) }, { name: "Other", limit: amount - Math.round(amount * 0.85) }];
  saveBudgets();
  render();
  showToast("Your monthly budget has been updated.");
}

setupMonthSelect();
render();

document.querySelectorAll("[data-open-modal]").forEach((button) => button.addEventListener("click", openModal));
document.querySelector(".close-button").addEventListener("click", closeModal);
document.querySelector(".cancel-button").addEventListener("click", closeModal);
document.querySelector("#transaction-modal").addEventListener("click", (event) => {
  if (event.target.id === "transaction-modal") closeModal();
});
document.querySelectorAll(".type-option").forEach((button) => button.addEventListener("click", () => {
  selectedType = button.dataset.type;
  document.querySelector("#transaction-type").value = selectedType;
  document.querySelectorAll(".type-option").forEach((option) => option.classList.toggle("selected", option === button));
  populateCategories(selectedType);
}));
document.querySelector("#transaction-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const amount = Number(form.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter an amount greater than zero.");
    return;
  }
  const category = String(form.get("category"));
  const name = String(form.get("note") || category);
  transactions.push({
    id: crypto.randomUUID(),
    type: document.querySelector("#transaction-type").value,
    amount: Math.round(amount * 100) / 100,
    category,
    date: String(form.get("date")),
    account: String(form.get("account")),
    note: String(form.get("note")),
    name
  });
  saveTransactions();
  closeModal();
  render();
  showToast("Transaction saved. Looking good!");
});
document.querySelector("#month-select").addEventListener("change", render);
document.querySelector("#transaction-search").addEventListener("input", renderTransactions);
document.querySelector("#transaction-rows").addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const transaction = transactions.find((item) => item.id === button.dataset.delete);
  transactions = transactions.filter((item) => item.id !== button.dataset.delete);
  saveTransactions();
  render();
  showToast(`${transaction?.name || "Transaction"} deleted.`);
});
document.querySelector("#export-button").addEventListener("click", exportCsv);
document.querySelector("#edit-budget-button").addEventListener("click", editBudgets);
document.querySelector("#filter-button").addEventListener("click", () => {
  const filters = ["all", "expense", "income"];
  activeFilter = filters[(filters.indexOf(activeFilter) + 1) % filters.length];
  document.querySelector("#filter-button span").textContent = activeFilter === "all" ? "Filter" : activeFilter[0].toUpperCase() + activeFilter.slice(1);
  renderTransactions();
});
document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => {
  document.querySelector("#transactions").scrollIntoView({ behavior: "smooth" });
}));
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
  link.classList.add("active");
}));
document.querySelector(".mobile-menu").addEventListener("click", () => showToast("Navigation is available on the left."));
document.querySelector(".profile-button").addEventListener("click", () => showToast("Account settings are coming soon."));
document.addEventListener("keydown", (event) => {
  const isApple = navigator.userAgent.includes("Mac");
  if ((event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey && !event.altKey && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName))
    || (event.key === "Enter" && (isApple ? event.metaKey : event.ctrlKey) && !document.querySelector("#transaction-modal").hidden)) {
    event.preventDefault();
    if (document.querySelector("#transaction-modal").hidden) openModal();
    else document.querySelector("#transaction-form").requestSubmit();
  }
  if (event.key === "Escape" && !document.querySelector("#transaction-modal").hidden) closeModal();
});
