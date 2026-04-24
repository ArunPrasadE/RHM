import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

const INCOME_CATEGORIES = [
  { value: 'nel', label: 'Nel', labelTamil: 'நெல்' },
  { value: 'vaikkol', label: 'Vaikkol', labelTamil: 'வைக்கோல்' },
];

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCrop, setFilterCrop] = useState(1);
  const [filterField, setFilterField] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterYear, filterCrop, filterField]);

  const fetchData = async () => {
    try {
      const [incomeData, fieldsData] = await Promise.all([
        api.get(`/paddy/income?year=${filterYear}&crop_number=${filterCrop}${filterField !== 'all' ? `&field_id=${filterField}` : ''}`),
        api.get('/paddy/fields')
      ]);
      setIncomes(incomeData);
      setFields(fieldsData);
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

  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown';
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  const handleEdit = (income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (income) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await api.delete(`/paddy/income/${income.id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete income:', error);
      alert('Failed to delete income');
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
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      {incomes.length > 0 && (
        <div className="card">
          <h3 className="font-medium mb-3">Summary by Category (வகை வாரியாக)</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(
              incomes.reduce((acc, inc) => {
                acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
                return acc;
              }, {})
            ).map(([cat, total]) => (
              <div key={cat} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">{getCategoryLabel(cat)}</p>
                <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <th className="text-left py-3 px-2">Field</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Yield (kg)</th>
                <th className="text-right py-3 px-2">Kottai</th>
                <th className="text-right py-3 px-2">Rate</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-2">{income.income_date}</td>
                  <td className="py-3 px-2">{getFieldName(income.field_id)}</td>
                  <td className="py-3 px-2">{getCategoryLabel(income.category)}</td>
                  <td className="py-3 px-2 text-right">
                    {income.yield_kg ? `${income.yield_kg} kg` : '-'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {income.kottai_count ? income.kottai_count.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {income.rate_per_kottai ? formatCurrency(income.rate_per_kottai) : '-'}
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
          fields={fields}
          categories={INCOME_CATEGORIES}
          defaultYear={filterYear}
          defaultCrop={filterCrop}
          onSave={async (data) => {
            try {
              if (editingIncome) {
                await api.put(`/paddy/income/${editingIncome.id}`, data);
              } else {
                await api.post('/paddy/income', data);
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

function IncomeForm({ income, fields, categories, defaultYear, defaultCrop, onSave, onClose }) {
  const isEditing = !!income;
  const [formData, setFormData] = useState({
    field_id: income?.field_id || fields[0]?.id || '',
    year: income?.year || defaultYear,
    crop_number: income?.crop_number || defaultCrop,
    category: income?.category || 'nel',
    yield_kg: income?.yield_kg || '',
    rate_per_kottai: income?.rate_per_kottai || '',
    amount: income?.amount || '',
    income_date: income?.income_date || new Date().toISOString().split('T')[0],
    notes: income?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const isNel = formData.category === 'nel';
  const kottaiCount = isNel && formData.yield_kg ? (parseFloat(formData.yield_kg) / 87).toFixed(2) : '';
  const calculatedAmount = isNel && kottaiCount && formData.rate_per_kottai
    ? (parseFloat(kottaiCount) * parseFloat(formData.rate_per_kottai)).toFixed(2)
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        field_id: parseInt(formData.field_id),
        year: formData.year,
        crop_number: formData.crop_number,
        category: formData.category,
        income_date: formData.income_date,
        notes: formData.notes
      };

      if (isNel) {
        data.yield_kg = parseFloat(formData.yield_kg);
        data.kottai_count = parseFloat(kottaiCount);
        data.rate_per_kottai = parseFloat(formData.rate_per_kottai);
        data.amount = parseFloat(calculatedAmount);
      } else {
        data.amount = parseFloat(formData.amount);
      }

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

            {isNel ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Yield (விளைச்சல்) kg *</label>
                    <input
                      type="number"
                      value={formData.yield_kg}
                      onChange={(e) => setFormData({ ...formData, yield_kg: e.target.value })}
                      className="input"
                      placeholder="Enter kg"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Kottai (கோட்டை)</label>
                    <input
                      type="text"
                      value={kottaiCount}
                      className="input bg-gray-100 dark:bg-gray-700"
                      disabled
                      placeholder="Auto-calculated"
                    />
                    <p className="text-xs text-gray-500 mt-1">87 kg = 1 kottai</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Rate per Kottai *</label>
                    <input
                      type="number"
                      value={formData.rate_per_kottai}
                      onChange={(e) => setFormData({ ...formData, rate_per_kottai: e.target.value })}
                      className="input"
                      placeholder="Rate"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Total Amount</label>
                    <input
                      type="text"
                      value={calculatedAmount ? `Rs. ${calculatedAmount}` : ''}
                      className="input bg-gray-100 dark:bg-gray-700 font-bold text-green-600"
                      disabled
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>
              </>
            ) : (
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
            )}

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
