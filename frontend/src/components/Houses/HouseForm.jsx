import { useState } from 'react';

export default function HouseForm({ house, onSave, onClose }) {
  const [formData, setFormData] = useState({
    house_number: house?.house_number || '',
    address: house?.address || '',
    type: house?.type || '',
    size_sqft: house?.size_sqft || '',
    eb_service_number: house?.eb_service_number || '',
    motor_service_number: house?.motor_service_number || '',
    google_maps_url: house?.google_maps_url || '',
    rent_amount: house?.rent_amount || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        size_sqft: formData.size_sqft ? parseInt(formData.size_sqft) : null,
        rent_amount: parseFloat(formData.rent_amount)
      });
    } finally {
      setLoading(false);
    }
  };

  const houseTypes = ['1BHK', '2BHK', '3BHK', 'Studio', 'Independent House', 'Shop', 'Other'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {house ? 'Edit House' : 'Add New House'}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">House Number *</label>
                <input
                  type="text"
                  value={formData.house_number}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                  className="input"
                  placeholder="e.g., H-101"
                  required
                />
              </div>

              <div>
                <label className="label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input"
                >
                  <option value="">Select type</option>
                  {houseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                rows={2}
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Size (sq.ft)</label>
                <input
                  type="number"
                  value={formData.size_sqft}
                  onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                  className="input"
                  placeholder="e.g., 650"
                />
              </div>

              <div>
                <label className="label">Rent Amount *</label>
                <input
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                  className="input"
                  placeholder="e.g., 3750"
                  required
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">EB Service Number</label>
                <input
                  type="text"
                  value={formData.eb_service_number}
                  onChange={(e) => setFormData({ ...formData, eb_service_number: e.target.value })}
                  className="input"
                  placeholder="EB service number"
                />
              </div>

              <div>
                <label className="label">Motor Service Number</label>
                <input
                  type="text"
                  value={formData.motor_service_number}
                  onChange={(e) => setFormData({ ...formData, motor_service_number: e.target.value })}
                  className="input"
                  placeholder="Motor service number"
                />
              </div>
            </div>

            <div>
              <label className="label">Google Maps URL</label>
              <input
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                className="input"
                placeholder="https://maps.google.com/..."
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
                {loading ? 'Saving...' : house ? 'Update House' : 'Add House'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
