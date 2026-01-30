import { useState, useMemo } from 'react';
import api, { formatCurrency } from '../../utils/api';

export default function MaintenanceForm({ houses, onSave, onClose }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    house_ids: [],
    add_to_rent: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate split amount
  const splitAmount = useMemo(() => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const count = formData.house_ids.length;
    if (count === 0 || totalAmount === 0) return 0;
    return totalAmount / count;
  }, [formData.amount, formData.house_ids]);

  const toggleHouse = (houseId) => {
    setFormData(prev => ({
      ...prev,
      house_ids: prev.house_ids.includes(houseId)
        ? prev.house_ids.filter(id => id !== houseId)
        : [...prev.house_ids, houseId]
    }));
  };

  const selectAllHouses = () => {
    setFormData(prev => ({
      ...prev,
      house_ids: houses.map(h => h.id)
    }));
  };

  const clearSelection = () => {
    setFormData(prev => ({
      ...prev,
      house_ids: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/maintenance', {
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        house_ids: formData.house_ids,
        add_to_rent: formData.add_to_rent
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
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add Maintenance Expense</h2>
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
              <label className="label">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="e.g., Pipe repair, Paint work"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input pl-8"
                    placeholder="Total cost"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="label">Date *</label>
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
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Select Houses *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllHouses}
                    className="text-xs text-primary-500 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {houses.map((house) => (
                  <button
                    key={house.id}
                    type="button"
                    onClick={() => toggleHouse(house.id)}
                    className={`p-2 rounded border text-center text-sm transition-colors ${
                      formData.house_ids.includes(house.id)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {house.house_number}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.house_ids.length} houses selected
                {formData.house_ids.length > 1 && ' (Shared expense)'}
              </p>
            </div>

            {splitAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-600">Each house will be charged:</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(splitAmount)}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="add_to_rent"
                checked={formData.add_to_rent}
                onChange={(e) => setFormData({ ...formData, add_to_rent: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="add_to_rent" className="text-sm text-gray-700">
                Add split amount to each tenant's next rent
              </label>
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
                disabled={loading || formData.house_ids.length === 0}
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
