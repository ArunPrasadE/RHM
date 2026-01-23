import { useState } from 'react';
import { formatCurrency } from '../../utils/api';

export default function PaymentForm({ tenant, onSave, onClose }) {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Record Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tenant Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.house_number}</p>
              </div>
              {tenant.totalPending > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="font-bold text-red-600">{formatCurrency(tenant.totalPending)}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Payment Amount *</label>
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
                  autoFocus
                />
              </div>
              {tenant.totalPending > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: tenant.totalPending })}
                  className="text-sm text-primary-500 hover:underline mt-1"
                >
                  Pay full pending: {formatCurrency(tenant.totalPending)}
                </button>
              )}
            </div>

            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.payment_method === method.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Payment Date</label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                placeholder="Any notes about this payment"
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
                disabled={loading || !formData.amount}
                className="flex-1 btn btn-success"
              >
                {loading ? 'Recording...' : `Record ${formData.amount ? formatCurrency(parseFloat(formData.amount)) : 'Payment'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
