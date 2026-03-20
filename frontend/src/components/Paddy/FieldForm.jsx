import { useState } from 'react';

export default function FieldForm({ field, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: field?.name || '',
    area_cents: field?.area_cents || '',
    gps_latitude: field?.gps_latitude || '',
    gps_longitude: field?.gps_longitude || '',
    google_maps_url: field?.google_maps_url || ''
  });
  const [loading, setLoading] = useState(false);

  // Calculate acres from cents
  const areaAcres = formData.area_cents ? (parseInt(formData.area_cents) / 100).toFixed(2) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        area_cents: parseInt(formData.area_cents),
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : null,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : null
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
              {field ? 'Edit Field (வயல் திருத்து)' : 'Add New Field (புதிய வயல் சேர்)'}
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
              <label className="label">Field Name (வயல் பெயர்) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Periya Vayal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Area in Cents (சென்ட்) *</label>
                <input
                  type="number"
                  value={formData.area_cents}
                  onChange={(e) => setFormData({ ...formData, area_cents: e.target.value })}
                  className="input"
                  placeholder="e.g., 150"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="label">Area in Acres (ஏக்கர்)</label>
                <input
                  type="text"
                  value={areaAcres ? `${areaAcres} acres` : ''}
                  className="input bg-gray-100 dark:bg-gray-700"
                  disabled
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-gray-500 mt-1">100 cents = 1 acre</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">GPS Latitude</label>
                <input
                  type="number"
                  value={formData.gps_latitude}
                  onChange={(e) => setFormData({ ...formData, gps_latitude: e.target.value })}
                  className="input"
                  placeholder="e.g., 10.7905"
                  step="any"
                />
              </div>
              <div>
                <label className="label">GPS Longitude</label>
                <input
                  type="number"
                  value={formData.gps_longitude}
                  onChange={(e) => setFormData({ ...formData, gps_longitude: e.target.value })}
                  className="input"
                  placeholder="e.g., 79.1378"
                  step="any"
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
                {loading ? 'Saving...' : field ? 'Update Field' : 'Add Field'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
