import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

const EXPENSE_CATEGORIES = [
  { value: 'varappu_velai', label: 'Varappu Velai', labelTamil: 'வரப்பு வேலை', hasSequence: true },
  { value: 'uzhavu', label: 'Uzhavu', labelTamil: 'உழவு', hasSequence: false },
  { value: 'nathu_pavuthal', label: 'Nathu Pavuthal', labelTamil: 'நாற்று பாவுதல்', hasSequence: false },
  { value: 'vithaipu', label: 'Vithaipu', labelTamil: 'விதைப்பு', hasSequence: false },
  { value: 'vidhai_nel', label: 'Vidhai Nel', labelTamil: 'விதை நெல்', hasSequence: false },
  { value: 'nadavu', label: 'Nadavu', labelTamil: 'நடவு', hasSequence: false },
  { value: 'kalai_kolli', label: 'Kalai Kolli', labelTamil: 'களை கொல்லி', hasSequence: false },
  { value: 'kalai_parippu', label: 'Kalai Parippu', labelTamil: 'களை பறிப்பு', hasSequence: false },
  { value: 'vayal_aruppu_machine', label: 'Vayal Aruppu Machine', labelTamil: 'வயல் அறுப்பு மெஷின்', hasSequence: false },
  { value: 'tractor', label: 'Tractor', labelTamil: 'டிராக்டர்', hasSequence: false },
  { value: 'patta_nel', label: 'Patta Nel', labelTamil: 'பாட்ட நெல்', hasSequence: false, isDirectExpense: true },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [fields, setFields] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCrop, setFilterCrop] = useState(1);
  const [filterField, setFilterField] = useState('all');

  const allCategories = [...EXPENSE_CATEGORIES, ...customCategories.map(c => ({
    id: c.id,
    value: c.value,
    label: c.label,
    labelTamil: c.label_tamil || ''
  }))];

  useEffect(() => {
    fetchData();
  }, [filterYear, filterCrop, filterField]);

  const fetchData = async () => {
    try {
      const [expensesData, fieldsData, workersData, categoriesData] = await Promise.all([
        api.get(`/paddy/expenses?year=${filterYear}&crop_number=${filterCrop}${filterField !== 'all' ? `&field_id=${filterField}` : ''}`),
        api.get('/paddy/fields'),
        api.get('/paddy/workers'),
        api.get('/paddy/expenses/categories')
      ]);
      setExpenses(expensesData);
      setFields(fieldsData);
      setWorkers(workersData);
      setCustomCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = allCategories.find(c => c.value === category);
    return cat ? `${cat.label} (${cat.labelTamil || ''})` : category;
  };

  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category+sequence for "All Fields" view
  const groupedExpenses = () => {
    if (filterField !== 'all') return null;

    const grouped = {};
    expenses.forEach(exp => {
      const key = `${exp.category}_${exp.sequence_number || 0}_${exp.expense_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: exp.category,
          sequence_number: exp.sequence_number,
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
    // For grouped edit, get the first individual expense to access worker_id
    const firstExpense = group.expense_ids?.length > 0 
      ? expenses.find(e => e.id === group.expense_ids[0]) 
      : null;
    
    setEditingExpense({
      ...group,
      isGrouped: true,
      year: filterYear,
      crop_number: filterCrop,
      original_category: group.category,
      original_sequence_number: group.sequence_number,
      original_expense_date: group.expense_date,
      original_year: filterYear,
      original_crop_number: filterCrop,
      // Include individual expense data
      field_id: firstExpense?.field_id,
      worker_id: firstExpense?.worker_id,
      amount: firstExpense?.amount,
      worker_name: firstExpense?.worker_name
    });
    setShowForm(true);
  };

  const handleDelete = async (expense) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/paddy/expenses/${expense.id}`);
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
        await api.delete(`/paddy/expenses/${id}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <label className="label">Crop (பயிர்)</label>
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>Crop 1 (பயிர் 1)</option>
              <option value={2}>Crop 2 (பயிர் 2)</option>
            </select>
          </div>
          <div>
            <label className="label">Field (வயல்)</label>
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="input"
            >
              <option value="all">All Fields</option>
              {fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
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

      {/* Category Summary */}
      {expenses.length > 0 && (
        <div className="card">
          <h3 className="font-medium mb-3">Summary by Category (வகை வாரியாக)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
              expenses.reduce((acc, exp) => {
                acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                return acc;
              }, {})
            ).map(([cat, total]) => (
              <div key={cat} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">{getCategoryLabel(cat)}</p>
                <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
      )}

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          fields={fields}
          workers={workers}
          categories={allCategories}
          defaultYear={filterYear}
          defaultCrop={filterCrop}
          existingExpenses={expenses}
          onSave={async (data) => {
            try {
              if (editingExpense?.isGrouped) {
                // Grouped edit - update all related expenses
                await api.put('/paddy/expenses/grouped', data);
              } else if (editingExpense) {
                // Single expense edit
                await api.put(`/paddy/expenses/${editingExpense.id}`, data);
              } else {
                // New expense
                await api.post('/paddy/expenses', data);
              }
              setShowForm(false);
              setEditingExpense(null);
              fetchData();
            } catch (error) {
              console.error('Failed to save expense:', error);
              alert(`Failed to save expense: ${error.message || error}`);
            }
          }}
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {showCategoryForm && (
        <CategoryManagerModal
          categories={customCategories}
          allCategories={allCategories}
          onRefresh={fetchData}
          onSave={async (data) => {
            try {
              if (data.id) {
                await api.put(`/paddy/expenses/categories/${data.id}`, data);
              } else {
                await api.post('/paddy/expenses/categories', data);
              }
              fetchData();
            } catch (error) {
              console.error('Failed to save category:', error);
              alert(`Failed to save category: ${error.message || error}`);
            }
          }}
          onDelete={async (id) => {
            try {
              await api.delete(`/paddy/expenses/categories/${id}`);
              fetchData();
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

function ExpenseForm({ expense, fields, workers, categories, defaultYear, defaultCrop, existingExpenses, onSave, onClose }) {
  const isEditing = !!expense;
  const isGrouped = expense?.isGrouped;
  const [formData, setFormData] = useState({
    field_id: expense?.field_id || fields[0]?.id || '',
    year: expense?.year || defaultYear,
    crop_number: expense?.crop_number || defaultCrop,
    category: expense?.category || '',
    sequence_number: expense?.sequence_number || '',
    worker_id: expense?.worker_id ? String(expense.worker_id) : '',
    amount: expense?.amount || '',
    total_amount: isGrouped ? expense?.total_amount || '' : '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    notes: expense?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const selectedCategory = categories.find(c => c.value === formData.category);

  // Auto-select next sequence number when category changes
  const getNextSequenceNumber = (category) => {
    if (!category) return '';
    const cat = categories.find(c => c.value === category);
    if (!cat?.hasSequence) return '';

    // Find existing sequence numbers for this category in current year/crop
    const usedNumbers = existingExpenses
      .filter(e => e.category === category)
      .map(e => e.sequence_number)
      .filter(n => n);

    // Find next available number (1-10)
    for (let i = 1; i <= 10; i++) {
      if (!usedNumbers.includes(i)) return i;
    }
    return 1; // Default to 1 if all used
  };

  const handleCategoryChange = (category) => {
    const nextSeq = getNextSequenceNumber(category);
    setFormData({ ...formData, category, sequence_number: nextSeq || '' });
  };

  // Calculate total area for split preview (only for new expenses)
  const totalAreaCents = fields.reduce((sum, f) => sum + f.area_cents, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isDirectExpense = selectedCategory?.isDirectExpense;

      if (isGrouped) {
        // When editing grouped, update all related expenses with new total
        await onSave({
          // New values
          category: formData.category,
          sequence_number: formData.sequence_number ? parseInt(formData.sequence_number) : null,
          expense_date: formData.expense_date,
          year: parseInt(formData.year),
          crop_number: parseInt(formData.crop_number),
          new_total_amount: parseFloat(formData.total_amount),
          worker_id: formData.worker_id ? parseInt(formData.worker_id) : null,
          notes: formData.notes,
          // Old values for finding the group
          old_category: expense?.original_category,
          old_sequence_number: expense?.original_sequence_number,
          old_expense_date: expense?.original_expense_date,
          old_year: expense?.original_year,
          old_crop_number: expense?.original_crop_number
        });
      } else if (isEditing) {
        // When editing single expense
        const payload = {
          field_id: parseInt(formData.field_id),
          year: parseInt(formData.year),
          crop_number: parseInt(formData.crop_number),
          category: formData.category,
          sequence_number: formData.sequence_number ? parseInt(formData.sequence_number) : null,
          worker_id: formData.worker_id ? parseInt(formData.worker_id) : null,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          notes: formData.notes || ''
        };
        
        console.log('Updating expense with data:', payload); // Debug log
        await onSave(payload);
      } else if (isDirectExpense) {
        // Direct expense to selected field (no split) - e.g., patta_nel
        await onSave({
          field_id: parseInt(formData.field_id),
          year: parseInt(formData.year),
          crop_number: parseInt(formData.crop_number),
          category: formData.category,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          notes: formData.notes || ''
        });
      } else {
        // When adding new, split across fields
        await onSave({
          ...formData,
          total_amount: parseFloat(formData.total_amount),
          sequence_number: formData.sequence_number ? parseInt(formData.sequence_number) : null,
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
            {/* Show field dropdown for direct expenses (patta_nel) or when editing single expense */}
            {(selectedCategory?.isDirectExpense || (isEditing && !isGrouped)) && (
              <div>
                <label className="label">Field (வயல்) *</label>
                <select
                  value={formData.field_id}
                  onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                  className="input"
                  required
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Show "All Fields" indicator for grouped edit */}
            {isGrouped && (
              <div>
                <label className="label">Field (வயல்)</label>
                <p className="input bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  All Fields (எல்லா வயல்கள்)
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Year (ஆண்டு) *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="input"
                  min="2000"
                  max="2100"
                  required
                />
              </div>
              <div>
                <label className="label">Crop (பயிர்) *</label>
                <select
                  value={formData.crop_number}
                  onChange={(e) => setFormData({ ...formData, crop_number: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={1}>Crop 1</option>
                  <option value={2}>Crop 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Category (வகை) *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label} ({c.labelTamil})</option>
                ))}
              </select>
            </div>

            {selectedCategory?.hasSequence && (
              <div>
                <label className="label">Sequence Number (வரிசை எண்) *</label>
                <select
                  value={formData.sequence_number}
                  onChange={(e) => setFormData({ ...formData, sequence_number: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hide worker dropdown for direct expenses like patta_nel */}
            {!selectedCategory?.isDirectExpense && (
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
            )}

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="label whitespace-nowrap">
                  {selectedCategory?.isDirectExpense || (isEditing && !isGrouped) ? 'Amount (தொகை) *' : 'Total Amount (மொத்த தொகை) *'}
                </label>
                <input
                  type="number"
                  value={selectedCategory?.isDirectExpense || (isEditing && !isGrouped) ? formData.amount : formData.total_amount}
                  onChange={(e) => setFormData({
                    ...formData,
                    [selectedCategory?.isDirectExpense || (isEditing && !isGrouped) ? 'amount' : 'total_amount']: e.target.value
                  })}
                  className="input"
                  placeholder={selectedCategory?.isDirectExpense || (isEditing && !isGrouped) ? 'Enter amount' : 'Enter total'}
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
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Split Preview - for new expenses and grouped edits, hide for direct expenses */}
            {(!selectedCategory?.isDirectExpense) && (!isEditing || isGrouped) && formData.total_amount && fields.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  {isGrouped ? 'New Split Preview (புதிய பிரிவு முன்னோட்டம்):' : 'Split Preview (பிரிவு முன்னோட்டம்):'}
                </p>
                <div className="space-y-1 text-sm">
                  {fields.map(f => {
                    const fieldAmount = (parseFloat(formData.total_amount) / totalAreaCents * f.area_cents).toFixed(2);
                    return (
                      <div key={f.id} className="flex justify-between text-green-700 dark:text-green-400">
                        <span>{f.name}</span>
                        <span>₹{fieldAmount}</span>
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

function CategoryManagerModal({ categories, allCategories, onRefresh, onSave, onDelete, onClose }) {
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
              <h3 className="font-medium">All Categories:</h3>
              <button onClick={onRefresh} className="text-blue-600 text-sm hover:underline">
                Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No categories available</p>
              ) : (
                allCategories.map(cat => (
                  <div key={cat.value} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span>{cat.label} ({cat.labelTamil || cat.value})</span>
                    {cat.id && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800 text-sm">
                          Edit
                        </button>
                        <button onClick={() => onDelete(cat.id)} className="text-red-600 hover:text-red-800 text-sm">
                          Delete
                        </button>
                      </div>
                    )}
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
