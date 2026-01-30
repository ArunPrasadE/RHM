import { useState } from 'react';

export default function TenantForm({ houseId, tenant, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    phone: tenant?.phone || '',
    id_proof_number: tenant?.id_proof_number || '',
    occupation: tenant?.occupation || '',
    household_members: tenant?.household_members || '',
    move_in_date: tenant?.move_in_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    advance_amount: tenant?.advance_amount || '',
    advance_date: tenant?.advance_date?.split('T')[0] || new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        household_members: formData.household_members ? parseInt(formData.household_members) : null,
        advance_amount: formData.advance_amount ? parseFloat(formData.advance_amount) : null
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
            <h2 className="text-xl font-semibold">
              {tenant ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Tenant full name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="10-digit mobile"
                />
              </div>

              <div>
                <label className="label">ID Proof Number</label>
                <input
                  type="text"
                  value={formData.id_proof_number}
                  onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                  className="input"
                  placeholder="Aadhaar/PAN"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="input"
                  placeholder="e.g., IT Professional"
                />
              </div>

              <div>
                <label className="label">Household Members</label>
                <input
                  type="number"
                  value={formData.household_members}
                  onChange={(e) => setFormData({ ...formData, household_members: e.target.value })}
                  className="input"
                  placeholder="Total members"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="label">Move-in Date {!tenant && '*'}</label>
              <input
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                className={`input ${tenant ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required={!tenant}
                disabled={!!tenant}
              />
              {tenant && (
                <p className="text-xs text-gray-500 mt-1">Move-in date cannot be changed</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Advance Amount</label>
                <input
                  type="number"
                  value={formData.advance_amount}
                  onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                  className="input"
                  placeholder="Amount received"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Advance Date</label>
                <input
                  type="date"
                  value={formData.advance_date}
                  onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                  className="input"
                />
              </div>
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
                {loading ? 'Saving...' : tenant ? 'Update Tenant' : 'Add Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
