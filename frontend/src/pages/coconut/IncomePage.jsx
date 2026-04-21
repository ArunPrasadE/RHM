import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

const INCOME_CATEGORIES = [
  { value: 'thengai', label: 'Thengai', labelTamil: 'தேங்காய்' },
  { value: 'mangai', label: 'Mangai', labelTamil: 'மாங்காய்' },
];

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [groves, setGroves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterGrove, setFilterGrove] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterYear, filterGrove]);

  const fetchData = async () => {
    try {
      const [incomeData, grovesData] = await Promise.all([
        api.get(`/coconut/income?year=${filterYear}${filterGrove !== 'all' ? `&grove_id=${filterGrove}` : ''}`),
        api.get('/coconut/groves')
      ]);
      setIncomes(incomeData);
      setGroves(grovesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = INCOME_CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.label} (${cat.labelTamil})` : category;
  };

  const getGroveName = (groveId) => {
    const grove = groves.find(g => g.id === groveId);
    return grove ? grove.name : 'Unknown';
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  const handleEdit = (income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (income) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await api.delete(`/coconut/income/${income.id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete income:', error);
      alert('Failed to delete income');
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
          Income
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (வருமானம்)
          </span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add Income
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
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No income recorded for this period</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Add First Income
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Grove</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Qty (kg)</th>
                <th className="text-right py-3 px-2">Rate/kg</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-2">{income.income_date}</td>
                  <td className="py-3 px-2">{getGroveName(income.grove_id)}</td>
                  <td className="py-3 px-2">{getCategoryLabel(income.category)}</td>
                  <td className="py-3 px-2 text-right">
                    {income.quantity_kg ? `${income.quantity_kg} kg` : '-'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {income.rate_per_kg ? formatCurrency(income.rate_per_kg) : '-'}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(income.amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income)}
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
        <IncomeForm
          income={editingIncome}
          groves={groves}
          categories={INCOME_CATEGORIES}
          defaultYear={filterYear}
          onSave={async (data) => {
            try {
              if (editingIncome) {
                await api.put(`/coconut/income/${editingIncome.id}`, data);
              } else {
                await api.post('/coconut/income', data);
              }
              setShowForm(false);
              setEditingIncome(null);
              fetchData();
            } catch (error) {
              console.error('Failed to save income:', error);
              alert('Failed to save income');
            }
          }}
          onClose={() => { setShowForm(false); setEditingIncome(null); }}
        />
      )}
    </div>
  );
}

function IncomeForm({ income, groves, categories, defaultYear, onSave, onClose }) {
  const isEditing = !!income;
  
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  
  const [formData, setFormData] = useState({
    grove_id: income?.grove_id || groves[0]?.id || '',
    year: income?.year || defaultYear,
    category: income?.category || 'thengai',
    unit_type: income?.unit_type || 'kg',
    quantity_kg: income?.quantity_kg || '',
    quantity_count: income?.quantity_count || '',
    rate_per_unit: income?.rate_per_unit || '',
    income_date: income?.income_date || new Date().toISOString().split('T')[0],
    sale_time: income?.sale_time || (isEditing ? income?.sale_time : getCurrentTime()),
    notes: income?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const calculatedAmount = (() => {
    if (formData.unit_type === 'kg' && formData.quantity_kg && formData.rate_per_unit) {
      return (parseFloat(formData.quantity_kg) * parseFloat(formData.rate_per_unit)).toFixed(2);
    }
    if (formData.unit_type === 'count' && formData.quantity_count && formData.rate_per_unit) {
      return (parseFloat(formData.quantity_count) * parseFloat(formData.rate_per_unit)).toFixed(2);
    }
    return '';
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        grove_id: parseInt(formData.grove_id),
        year: formData.year,
        category: formData.category,
        unit_type: formData.unit_type,
        quantity_kg: formData.unit_type === 'kg' ? parseFloat(formData.quantity_kg) : null,
        quantity_count: formData.unit_type === 'count' ? parseInt(formData.quantity_count) : null,
        rate_per_unit: parseFloat(formData.rate_per_unit),
        amount: parseFloat(calculatedAmount),
        income_date: formData.income_date,
        sale_time: formData.sale_time || null,
        notes: formData.notes
      };

      await onSave(data);
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
              {isEditing ? 'Edit Income (வருமானம் திருத்து)' : 'Add Income (வருமானம் சேர்)'}
            </h2>
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
                  onChange={(e) => setFormData({ ...formData, grove_id: e.target.value })}
                  className="input"
                  required
                >
                  {groves.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category (வகை) *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  required
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label} ({c.labelTamil})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Unit Type (அலகு) *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="unit_type"
                    value="kg"
                    checked={formData.unit_type === 'kg'}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span>KG (கிலோ)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="unit_type"
                    value="count"
                    checked={formData.unit_type === 'count'}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span>Count (எண்ணிக்கை)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {formData.unit_type === 'kg' ? 'Quantity (அளவு) kg *' : 'Count (எண்ணிக்கை) *'}
                </label>
                <input
                  type="number"
                  value={formData.unit_type === 'kg' ? formData.quantity_kg : formData.quantity_count}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    [formData.unit_type === 'kg' ? 'quantity_kg' : 'quantity_count']: e.target.value 
                  })}
                  className="input"
                  placeholder={formData.unit_type === 'kg' ? 'Enter kg' : 'Enter count'}
                  min="0"
                  step={formData.unit_type === 'kg' ? '0.1' : '1'}
                  required
                />
              </div>
              <div>
                <label className="label">
                  {formData.unit_type === 'kg' ? 'Rate per kg (விலை/கிலோ) *' : 'Rate per unit (விலை/அலகு) *'}
                </label>
                <input
                  type="number"
                  value={formData.rate_per_unit}
                  onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                  className="input"
                  placeholder={formData.unit_type === 'kg' ? 'Rate per kg' : 'Rate per unit'}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Total Amount (மொத்த தொகை)</label>
              <input
                type="text"
                value={calculatedAmount ? `Rs. ${calculatedAmount}` : ''}
                className="input bg-gray-100 dark:bg-gray-700 font-bold text-green-600"
                disabled
                placeholder="Auto-calculated"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date (தேதி) *</label>
                <input
                  type="date"
                  value={formData.income_date}
                  onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Time (நேரம்)</label>
                <input
                  type="time"
                  value={formData.sale_time}
                  onChange={(e) => setFormData({ ...formData, sale_time: e.target.value })}
                  className="input"
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
                {loading ? 'Saving...' : isEditing ? 'Update Income' : 'Add Income'}
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
