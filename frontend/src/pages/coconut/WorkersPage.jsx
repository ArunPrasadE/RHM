import { useState, useEffect } from 'react';
import api from '../../utils/api';
import WorkerForm from '../../components/Coconut/WorkerForm';

const WORKER_CATEGORIES = [
  { value: 'thoppu_velai', label: 'Thoppu Velai', labelTamil: 'தோப்பு வேலை' },
  { value: 'thengai_vettu_virpanai', label: 'Thengai Vettu & Virpanai', labelTamil: 'தேங்காய் வெட்டு மற்றும் விற்பனை' },
  { value: 'pazhaya_maram_vettu', label: 'Pazhaya Maram Vettu', labelTamil: 'பழைய மரம் வெட்டு' },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const data = await api.get('/coconut/workers');
      setWorkers(data);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingWorker) {
        await api.put(`/coconut/workers/${editingWorker.id}`, data);
      } else {
        await api.post('/coconut/workers', data);
      }
      setShowForm(false);
      setEditingWorker(null);
      fetchWorkers();
    } catch (error) {
      console.error('Failed to save worker:', error);
      alert('Failed to save worker');
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setShowForm(true);
  };

  const handleDelete = async (worker) => {
    if (!confirm(`Are you sure you want to delete ${worker.name}?`)) return;
    try {
      await api.delete(`/coconut/workers/${worker.id}`);
      fetchWorkers();
    } catch (error) {
      console.error('Failed to delete worker:', error);
      alert('Failed to delete worker');
    }
  };

  const getCategoryLabel = (category) => {
    const cat = WORKER_CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.label} (${cat.labelTamil})` : category;
  };

  const filteredWorkers = filterCategory === 'all'
    ? workers
    : workers.filter(w => w.category === filterCategory);

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
          Workers
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (வேலையாட்கள்)
          </span>
        </h1>
        <button
          onClick={() => { setEditingWorker(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          + Add Worker
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterCategory === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
        {WORKER_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterCategory === cat.value
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filteredWorkers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No workers found</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Add Your First Worker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => (
            <div key={worker.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{worker.name}</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {getCategoryLabel(worker.category)}
                  </p>
                  {worker.place && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {worker.place}
                    </p>
                  )}
                  {worker.mobile && (
                    <a
                      href={`tel:${worker.mobile}`}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      {worker.mobile}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(worker)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(worker)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <WorkerForm
          worker={editingWorker}
          categories={WORKER_CATEGORIES}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingWorker(null); }}
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
