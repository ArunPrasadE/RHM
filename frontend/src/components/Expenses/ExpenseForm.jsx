import { useState } from 'react';
import api from '../../utils/api';

export default function ExpenseForm({ houses, onSave, onClose }) {
  const [formData, setFormData] = useState({
    house_id: '',
    expense_type: 'eb_bill',
    amount: '',
    due_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = formData.expense_type === 'eb_bill' ? '/expenses/eb-bill' : '/expenses/house-tax';

      await api.post(endpoint, {
        house_id: parseInt(formData.house_id),
        amount: parseFloat(formData.amount),
        due_date: formData.due_date || null,
        notes: formData.notes
      });

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add EB Bill / Tax</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Expense Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, expense_type: 'eb_bill' })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.expense_type === 'eb_bill'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  EB Bill
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, expense_type: 'house_tax' })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.expense_type === 'house_tax'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  House Tax
                </button>
              </div>
            </div>

            <div>
              <label className="label">House *</label>
              <select
                value={formData.house_id}
                onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select house</option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.house_number} {house.address ? `- ${house.address}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input pl-8"
                  placeholder="Enter amount"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                placeholder="Optional notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-primary"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
