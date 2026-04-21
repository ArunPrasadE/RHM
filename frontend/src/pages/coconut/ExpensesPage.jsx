import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

const EXPENSE_CATEGORIES = [
  { value: 'thoppu_vetuthal', label: 'Thoppu Vetuthal', labelTamil: 'தோப்பு வெட்டுதல்' },
  { value: 'kalai_kolli', label: 'Kalai Kolli', labelTamil: 'களை கொல்லி' },
  { value: 'neer_paichuthal', label: 'Neer Paichuthal', labelTamil: 'நீர் பாய்ச்சுதல்' },
  { value: 'thengai_vettu', label: 'Thengai Vettu', labelTamil: 'தேங்காய் வெட்டு' },
  { value: 'thengai_eduthu_poduthal', label: 'Thengai Eduthu Poduthal', labelTamil: 'தேங்காய் எடுத்து போடுதல்' },
  { value: 'veli_paramarithal', label: 'Veli Paramarithal', labelTamil: 'வேலி பராமரித்தல்' },
  { value: 'puthiya_thennai_naduthal', label: 'Puthiya Thennai Naduthal', labelTamil: 'புதிய தென்னை நடுதல்' },
  { value: 'pazhaya_maram_vetuthal', label: 'Pazhaya Maram Vetuthal', labelTamil: 'பழைய மரம் வெட்டுதல்' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [groves, setGroves] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterGrove, setFilterGrove] = useState('all');

  const allCategories = [...EXPENSE_CATEGORIES, ...customCategories.map(c => ({
    value: c.value,
    label: c.label,
    labelTamil: c.label_tamil || ''
  }))];

  useEffect(() => {
    fetchData();
  }, [filterYear, filterGrove]);

  const fetchData = async () => {
    try {
      alert('API call starting...');
      const categoriesRes = await api.get(`/coconut/expenses/categories`);
      alert('API returned: ' + JSON.stringify(categoriesRes));
      
      const [expensesData, grovesData, workersData] = await Promise.all([
        api.get(`/coconut/expenses?year=${filterYear}${filterGrove !== 'all' ? `&grove_id=${filterGrove}` : ''}`),
        api.get('/coconut/groves'),
        api.get('/coconut/workers')
      ]);
      setExpenses(expensesData);
      setGroves(grovesData);
      setWorkers(workersData);
      setCustomCategories(categoriesRes || []);
    } catch (error) {
      alert('Error: ' + error.message);
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = allCategories.find(c => c.value === category);
    return cat ? `${cat.label} (${cat.labelTamil || ''})` : category;
  };

  const getGroveName = (groveId) => {
    const grove = groves.find(g => g.id === groveId);
    return grove ? grove.name : 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category for "All Groves" view
  const groupedExpenses = () => {
    if (filterGrove !== 'all') return null;

    const grouped = {};
    expenses.forEach(exp => {
      const key = `${exp.category}_${exp.expense_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: exp.category,
          expense_date: exp.expense_date,
          notes: exp.notes,
          total_amount: 0,
          expense_ids: []
        };
      }
      grouped[key].total_amount += exp.amount;
      grouped[key].expense_ids.push(exp.id);
    });
    return Object.values(grouped).sort((a, b) =>
      new Date(b.expense_date) - new Date(a.expense_date)
    );
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleEditGrouped = (group) => {
    setEditingExpense({
      ...group,
      isGrouped: true,
      year: filterYear
    });
    setShowForm(true);
  };

  const handleDelete = async (expense) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/coconut/expenses/${expense.id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense');
    }
  };

  const handleDeleteGrouped = async (group) => {
    if (!confirm(`Delete all ${group.expense_ids.length} expense records for this category?`)) return;
    try {
      for (const id of group.expense_ids) {
        await api.delete(`/coconut/expenses/${id}`);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to delete grouped expense:', error);
      alert('Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Expenses
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (செலவுகள்)
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="btn btn-secondary"
          >
            Categories
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Year (ஆண்டு)</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="input"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="label">Grove (தோப்பு)</label>
            <select
              value={filterGrove}
              onChange={(e) => setFilterGrove(e.target.value)}
              className="input"
            >
              <option value="all">All Groves</option>
              {groves.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Total (மொத்தம்)</label>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No expenses recorded for this period</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Add First Expense
          </button>
        </div>
      ) : filterGrove === 'all' ? (
        /* Grouped view - show category totals */
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Total Amount</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedExpenses()?.map((group, idx) => (
                <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-2">{group.expense_date}</td>
                  <td className="py-3 px-2">{getCategoryLabel(group.category)}</td>
                  <td className="py-3 px-2 text-right font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(group.total_amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditGrouped(group)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGrouped(group)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Individual grove view - show split values with edit/delete */
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-2">{expense.expense_date}</td>
                  <td className="py-3 px-2">{getCategoryLabel(expense.category)}</td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          groves={groves}
          workers={workers}
          categories={allCategories}
          defaultYear={filterYear}
          onSave={async (data) => {
            try {
              if (editingExpense?.isGrouped) {
                // Grouped edit - update all related expenses
                await api.put('/coconut/expenses/grouped', data);
              } else if (editingExpense) {
                // Single expense edit
                await api.put(`/coconut/expenses/${editingExpense.id}`, data);
              } else {
                // New expense
                await api.post('/coconut/expenses', data);
              }
              setShowForm(false);
              setEditingExpense(null);
              fetchData();
            } catch (error) {
              console.error('Failed to save expense:', error);
              alert('Failed to save expense');
            }
          }}
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {showCategoryForm && (
        <CategoryManagerModal
          categories={customCategories}
          onRefresh={fetchData}
          onSave={async (data) => {
            try {
              if (data.id) {
                await api.put(`/coconut/expenses/categories/${data.id}`, data);
              } else {
                await api.post('/coconut/expenses/categories', data);
              }
              await fetchData();
            } catch (error) {
              console.error('Failed to save category:', error);
              alert(`Failed to save category: ${error.message || error}`);
            }
          }}
          onDelete={async (id) => {
            try {
              await api.delete(`/coconut/expenses/categories/${id}`);
              await fetchData();
            } catch (error) {
              console.error('Failed to delete category:', error);
              alert(`Failed to delete category: ${error.message || error}`);
            }
          }}
          onClose={() => setShowCategoryForm(false)}
        />
      )}
    </div>
  );
}

function ExpenseForm({ expense, groves, workers, categories, defaultYear, onSave, onClose }) {
  const isEditing = !!expense;
  const isGrouped = expense?.isGrouped;
  const [formData, setFormData] = useState({
    grove_id: expense?.grove_id || groves[0]?.id || '',
    year: expense?.year || defaultYear,
    category: expense?.category || '',
    worker_id: expense?.worker_id || '',
    amount: expense?.amount || '',
    total_amount: isGrouped ? expense?.total_amount || '' : '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    notes: expense?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  // Calculate total area for split preview
  const totalAreaCents = groves.reduce((sum, g) => sum + g.area_cents, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isGrouped) {
        // When editing grouped, update all related expenses with new total
        await onSave({
          category: formData.category,
          expense_date: formData.expense_date,
          year: formData.year,
          new_total_amount: parseFloat(formData.total_amount),
          worker_id: formData.worker_id ? parseInt(formData.worker_id) : null,
          notes: formData.notes
        });
      } else if (isEditing) {
        // When editing single expense
        await onSave({
          grove_id: parseInt(formData.grove_id),
          year: formData.year,
          category: formData.category,
          worker_id: formData.worker_id ? parseInt(formData.worker_id) : null,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          notes: formData.notes
        });
      } else {
        // When adding new, split across groves
        await onSave({
          ...formData,
          total_amount: parseFloat(formData.total_amount),
          worker_id: formData.worker_id ? parseInt(formData.worker_id) : null
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Expense (செலவு திருத்து)' : 'Add Expense (செலவு சேர்)'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show grove dropdown only when editing single expense (not grouped) */}
            {isEditing && !isGrouped && (
              <div>
                <label className="label">Grove (தோப்பு) *</label>
                <select
                  value={formData.grove_id}
                  onChange={(e) => setFormData({ ...formData, grove_id: e.target.value })}
                  className="input"
                  required
                >
                  {groves.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Show "All Groves" indicator for grouped edit */}
            {isGrouped && (
              <div>
                <label className="label">Grove (தோப்பு)</label>
                <p className="input bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  All Groves (எல்லா தோப்புகள்)
                </p>
              </div>
            )}

            <div>
              <label className="label">Year (ஆண்டு) *</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="input"
                required
                disabled={isGrouped}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="label">Category (வகை) *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`input ${isGrouped ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                required
                disabled={isGrouped}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label} ({c.labelTamil})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Pay To (யாருக்கு கொடுக்க வேண்டும்)</label>
              <select
                value={formData.worker_id}
                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                className="input"
              >
                <option value="">Select worker (optional)</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} - {w.category}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="label whitespace-nowrap">
                  {isEditing && !isGrouped ? 'Amount (தொகை) *' : 'Total Amount (மொத்த தொகை) *'}
                </label>
                <input
                  type="number"
                  value={isEditing && !isGrouped ? formData.amount : formData.total_amount}
                  onChange={(e) => setFormData({
                    ...formData,
                    [isEditing && !isGrouped ? 'amount' : 'total_amount']: e.target.value
                  })}
                  className="input"
                  placeholder={isEditing && !isGrouped ? 'Enter amount' : 'Enter total'}
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label className="label whitespace-nowrap">Date (தேதி) *</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className={`input ${isGrouped ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  required
                  disabled={isGrouped}
                />
              </div>
            </div>

            {/* Split Preview - for new expenses and grouped edits */}
            {(!isEditing || isGrouped) && formData.total_amount && groves.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  {isGrouped ? 'New Split Preview (புதிய பிரிவு முன்னோட்டம்):' : 'Split Preview (பிரிவு முன்னோட்டம்):'}
                </p>
                <div className="space-y-1 text-sm">
                  {groves.map(g => {
                    const groveAmount = (parseFloat(formData.total_amount) / totalAreaCents * g.area_cents).toFixed(2);
                    return (
                      <div key={g.id} className="flex justify-between text-amber-700 dark:text-amber-400">
                        <span>{g.name}</span>
                        <span>₹{groveAmount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="label">Notes (குறிப்புகள்)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={2}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn btn-primary">
                {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DeleteIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CategoryManagerModal({ categories, onRefresh, onSave, onDelete, onClose }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    label_tamil: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(editingCategory ? { ...formData, id: editingCategory.id } : formData);
      setEditingCategory(null);
      setFormData({ value: '', label: '', label_tamil: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      value: category.value,
      label: category.label,
      label_tamil: category.label_tamil || ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Manage Categories (வகைகள்)</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="label">Value (API key) *</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="input"
                placeholder="e.g., my_category"
                required
              />
            </div>
            <div>
              <label className="label">Label (English) *</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="input"
                placeholder="e.g., My Category"
                required
              />
            </div>
            <div>
              <label className="label">Label (Tamil)</label>
              <input
                type="text"
                value={formData.label_tamil}
                onChange={(e) => setFormData({ ...formData, label_tamil: e.target.value })}
                className="input"
                placeholder="e.g., என் வகை"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setEditingCategory(null); setFormData({ value: '', label: '', label_tamil: '' }); }} className="flex-1 btn btn-secondary">
                Clear
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn btn-primary">
                {loading ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
              </button>
            </div>
          </form>

          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Existing Categories:</h3>
              <button onClick={onRefresh} className="text-blue-600 text-sm hover:underline">
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-sm">No custom categories yet</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span>{cat.label} ({cat.label_tamil || cat.value})</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800 text-sm">
                        Edit
                      </button>
                      <button onClick={() => onDelete(cat.id)} className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={onClose} className="w-full btn btn-secondary mt-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
