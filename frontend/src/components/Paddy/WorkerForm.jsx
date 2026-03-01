import { useState } from 'react';

export default function WorkerForm({ worker, categories, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: worker?.name || '',
    category: worker?.category || (categories[0]?.value || ''),
    place: worker?.place || '',
    mobile: worker?.mobile || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
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
              {worker ? 'Edit Worker (பணியாளர் திருத்து)' : 'Add Worker (பணியாளர் சேர்)'}
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
              <label className="label">Name (பெயர்) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Worker name"
                required
              />
            </div>

            <div>
              <label className="label">Category (வகை) *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}{(cat.label_tamil || cat.labelTamil) ? ` (${cat.label_tamil || cat.labelTamil})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Place (இடம்)</label>
              <input
                type="text"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="input"
                placeholder="Village/Town name"
              />
            </div>

            <div>
              <label className="label">Mobile Number (கைபேசி எண்)</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="input"
                placeholder="10-digit mobile"
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
                {loading ? 'Saving...' : worker ? 'Update Worker' : 'Add Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
