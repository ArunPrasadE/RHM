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
  { value: 'uram', label: 'Uram', labelTamil: 'உரம்', hasSequence: true },
  { value: 'kalai_parippu', label: 'Kalai Parippu', labelTamil: 'களை பறிப்பு', hasSequence: false },
  { value: 'vayal_velai', label: 'Vayal Velai', labelTamil: 'வயல் வேலை', hasSequence: false },
  { value: 'vayal_aruppu_machine', label: 'Vayal Aruppu Machine', labelTamil: 'வயல் அறுப்பு மெஷின்', hasSequence: false },
  { value: 'tractor', label: 'Tractor', labelTamil: 'டிராக்டர்', hasSequence: false },
  { value: 'patta_nel', label: 'Patta Nel', labelTamil: 'பட்டா நெல்', hasSequence: false, needsField: true },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [fields, setFields] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCrop, setFilterCrop] = useState(1);
  const [filterField, setFilterField] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterYear, filterCrop, filterField]);

  const fetchData = async () => {
    try {
      const [expensesData, fieldsData, workersData] = await Promise.all([
        api.get(`/paddy/expenses?year=${filterYear}&crop_number=${filterCrop}${filterField !== 'all' ? `&field_id=${filterField}` : ''}`),
        api.get('/paddy/fields'),
        api.get('/paddy/workers')
      ]);
      setExpenses(expensesData);
      setFields(fieldsData);
      setWorkers(workersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.label} (${cat.labelTamil})` : category;
  };

  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add Expense
        </button>
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
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Field</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-2">{expense.expense_date}</td>
                  <td className="py-3 px-2">{getFieldName(expense.field_id)}</td>
                  <td className="py-3 px-2">
                    {getCategoryLabel(expense.category)}
                    {expense.sequence_number && (
                      <span className="ml-1 text-sm text-gray-500">#{expense.sequence_number}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          fields={fields}
          workers={workers}
          categories={EXPENSE_CATEGORIES}
          defaultYear={filterYear}
          defaultCrop={filterCrop}
          onSave={async (data) => {
            try {
              await api.post('/paddy/expenses', data);
              setShowForm(false);
              fetchData();
            } catch (error) {
              console.error('Failed to save expense:', error);
              alert('Failed to save expense');
            }
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function ExpenseForm({ fields, workers, categories, defaultYear, defaultCrop, onSave, onClose }) {
  const [formData, setFormData] = useState({
    field_id: fields[0]?.id || '',
    year: defaultYear,
    crop_number: defaultCrop,
    category: '',
    sequence_number: '',
    worker_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const selectedCategory = categories.find(c => c.value === formData.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        sequence_number: formData.sequence_number ? parseInt(formData.sequence_number) : null,
        worker_id: formData.worker_id ? parseInt(formData.worker_id) : null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add Expense (செலவு சேர்)</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Field (வயல்) *</label>
                <select
                  value={formData.field_id}
                  onChange={(e) => setFormData({ ...formData, field_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value, sequence_number: '' })}
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
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount (தொகை) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  placeholder="Enter amount"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label className="label">Date (தேதி) *</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>

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
                {loading ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
