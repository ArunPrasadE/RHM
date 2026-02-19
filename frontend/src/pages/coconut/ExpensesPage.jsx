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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterGrove, setFilterGrove] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterYear, filterGrove]);

  const fetchData = async () => {
    try {
      const [expensesData, grovesData, workersData] = await Promise.all([
        api.get(`/coconut/expenses?year=${filterYear}${filterGrove !== 'all' ? `&grove_id=${filterGrove}` : ''}`),
        api.get('/coconut/groves'),
        api.get('/coconut/workers')
      ]);
      setExpenses(expensesData);
      setGroves(grovesData);
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

  const getGroveName = (groveId) => {
    const grove = groves.find(g => g.id === groveId);
    return grove ? grove.name : 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add Expense
        </button>
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
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Grove</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-2">{expense.expense_date}</td>
                  <td className="py-3 px-2">{getGroveName(expense.grove_id)}</td>
                  <td className="py-3 px-2">{getCategoryLabel(expense.category)}</td>
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
          groves={groves}
          workers={workers}
          categories={EXPENSE_CATEGORIES}
          defaultYear={filterYear}
          onSave={async (data) => {
            try {
              await api.post('/coconut/expenses', data);
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

function ExpenseForm({ groves, workers, categories, defaultYear, onSave, onClose }) {
  const [formData, setFormData] = useState({
    grove_id: groves[0]?.id || '',
    year: defaultYear,
    category: '',
    worker_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
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
                <label className="label">Grove (தோப்பு) *</label>
                <select
                  value={formData.grove_id}
                  onChange={(e) => setFormData({ ...formData, grove_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  {groves.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year (ஆண்டு) *</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Category (வகை) *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
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
