const API_URL = 'http://localhost:3000/api/expenses';

const expensesTableBody = document.getElementById('expenses-table-body');
const totalAmountEl = document.getElementById('total-amount');
const expensesCountEl = document.getElementById('expenses-count');
const highestExpenseEl = document.getElementById('highest-expense');
const loadingSpinner = document.getElementById('loading-spinner');
const serverError = document.getElementById('server-error');
const addExpenseForm = document.getElementById('add-expense-form');
const formError = document.getElementById('form-error');
const filterCategory = document.getElementById('filter-category');
const editExpenseForm = document.getElementById('edit-expense-form');
const editFormError = document.getElementById('edit-form-error');
const searchTitle = document.getElementById('search-title');

let allExpenses = []; 

// (GET)
async function fetchExpenses() {
  if (loadingSpinner) loadingSpinner.classList.remove('d-none');
  if (serverError) serverError.classList.add('d-none');

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }

    allExpenses = await response.json();

    renderTable(allExpenses);
    updateSummary(allExpenses);

  } catch (error) {
    console.error('Fetch Error:', error);
    if (serverError) {
      serverError.textContent = 'Could not connect to server. Make sure backend is running on port 3000.';
      serverError.classList.remove('d-none');
    }
  } finally {
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  }
}

function renderTable(expenses) {
  expensesTableBody.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">No expenses found.</td>
      </tr>
    `;
    return;
  }

  expenses.forEach(expense => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${expense.title}</td>
      <td>$${Number(expense.amount).toFixed(2)}</td>
      <td><span class="badge ${getCategoryBadgeClass(expense.category)}">${expense.category}</span></td>
      <td>${expense.date}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${expense.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    `;
    expensesTableBody.appendChild(tr);
  });
}

function updateSummary(expenses) {
  const count = expenses.length;
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const highest = expenses.length > 0 
    ? Math.max(...expenses.map(item => Number(item.amount))) 
    : 0;

  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  expensesCountEl.textContent = count;
  highestExpenseEl.textContent = `$${highest.toFixed(2)}`;
}

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Food': return 'bg-success';
    case 'Transport': return 'bg-info text-dark';
    case 'Bills': return 'bg-warning text-dark';
    case 'Entertainment': return 'bg-primary';
    default: return 'bg-secondary';
  }
}

addExpenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('d-none');

  const newExpense = {
    title: document.getElementById('title').value,
    amount: Number(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date: document.getElementById('date').value
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add expense');
    }

    addExpenseForm.reset();
    fetchExpenses(); 

  } catch (error) {
    console.error('Add Error:', error);
    formError.textContent = error.message;
    formError.classList.remove('d-none');
  }
});

window.deleteExpense = async function(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }

    fetchExpenses();

  } catch (error) {
    console.error('Delete Error:', error);
    alert('Could not delete expense.');
  }
};

window.openEditModal = function(id) {
  const expense = allExpenses.find(item => item.id === id);
  if (!expense) return;

  document.getElementById('edit-id').value = expense.id;
  document.getElementById('edit-title').value = expense.title;
  document.getElementById('edit-amount').value = expense.amount;
  document.getElementById('edit-category').value = expense.category;
  document.getElementById('edit-date').value = expense.date;

  editFormError.classList.add('d-none');

  const editModal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
  editModal.show();
};

// (PUT)
editExpenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editFormError.classList.add('d-none');

  const id = document.getElementById('edit-id').value;
  const updatedExpense = {
    title: document.getElementById('edit-title').value,
    amount: Number(document.getElementById('edit-amount').value),
    category: document.getElementById('edit-category').value,
    date: document.getElementById('edit-date').value
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedExpense)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update expense');
    }

    const modalElement = document.getElementById('editExpenseModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    fetchExpenses();

  } catch (error) {
    console.error('Update Error:', error);
    editFormError.textContent = error.message;
    editFormError.classList.remove('d-none');
  }
});

// (Filter)
function applyFilters() {
  const searchTerm = searchTitle.value.toLowerCase();
  const selectedCategory = filterCategory.value;

  const filteredExpenses = allExpenses.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  renderTable(filteredExpenses);
}

filterCategory.addEventListener('change', applyFilters);

searchTitle.addEventListener('input', applyFilters);

document.addEventListener('DOMContentLoaded', fetchExpenses);