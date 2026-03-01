import { useState, useEffect } from 'react';
import api from '../../utils/api';
import WorkerForm from '../../components/Paddy/WorkerForm';

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [newCategory, setNewCategory] = useState({ value: '', label: '', label_tamil: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workersData, categoriesData] = await Promise.all([
        api.get('/paddy/workers'),
        api.get('/paddy/workers/categories/list')
      ]);
      setWorkers(workersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await api.get('/paddy/workers');
      setWorkers(data);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingWorker) {
        await api.put(`/paddy/workers/${editingWorker.id}`, data);
      } else {
        await api.post('/paddy/workers', data);
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
      await api.delete(`/paddy/workers/${worker.id}`);
      fetchWorkers();
    } catch (error) {
      console.error('Failed to delete worker:', error);
      alert('Failed to delete worker');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.value || !newCategory.label) {
      alert('Value and Label are required');
      return;
    }
    try {
      await api.post('/paddy/workers/categories', newCategory);
      setShowCategoryForm(false);
      setNewCategory({ value: '', label: '', label_tamil: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert(error.response?.data?.error || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory.label) {
      alert('Label is required');
      return;
    }
    try {
      await api.put(`/paddy/workers/categories/${editingCategory.id}`, {
        label: editingCategory.label,
        label_tamil: editingCategory.label_tamil
      });
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert(error.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.label}"?`)) return;
    try {
      await api.delete(`/paddy/workers/categories/${category.id}`);
      if (filterCategory === category.value) {
        setFilterCategory('all');
      }
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? `${cat.label}${cat.label_tamil ? ` (${cat.label_tamil})` : ''}` : category;
  };

  const filteredWorkers = filterCategory === 'all'
    ? workers
    : workers.filter(w => w.category === filterCategory);

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

      {/* Filter and Manage Categories */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterCategory === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterCategory === cat.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => setShowManageCategories(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
        >
          Manage Categories
        </button>
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
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
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
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingWorker(null); }}
        />
      )}

      {/* Manage Categories Modal */}
      {showManageCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Manage Categories
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (வகைகளை நிர்வகி)
                </span>
              </h2>
              <button
                onClick={() => { setShowManageCategories(false); setEditingCategory(null); setShowCategoryForm(false); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2 mb-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {editingCategory?.id === cat.id ? (
                    <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editingCategory.label}
                          onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                          className="input text-sm"
                          placeholder="Label"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editingCategory.label_tamil || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, label_tamil: e.target.value })}
                          className="input text-sm"
                          placeholder="Tamil"
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">Save</button>
                      <button type="button" onClick={() => setEditingCategory(null)} className="btn btn-secondary btn-sm">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{cat.label}</p>
                        {cat.label_tamil && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cat.label_tamil}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCategory({ ...cat })}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Category Form */}
            {showCategoryForm ? (
              <form onSubmit={handleAddCategory} className="border-t dark:border-gray-600 pt-4 space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Add New Category</h3>
                <div>
                  <label className="label text-sm">Value (unique identifier) *</label>
                  <input
                    type="text"
                    value={newCategory.value}
                    onChange={(e) => setNewCategory({ ...newCategory, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="input"
                    placeholder="e.g., field_worker"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-sm">Label (English) *</label>
                    <input
                      type="text"
                      value={newCategory.label}
                      onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                      className="input"
                      placeholder="Field Worker"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Label (Tamil)</label>
                    <input
                      type="text"
                      value={newCategory.label_tamil}
                      onChange={(e) => setNewCategory({ ...newCategory, label_tamil: e.target.value })}
                      className="input"
                      placeholder="வயல் வேலையாளர்"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Add</button>
                  <button
                    type="button"
                    onClick={() => { setShowCategoryForm(false); setNewCategory({ value: '', label: '', label_tamil: '' }); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCategoryForm(true)}
                className="w-full btn btn-secondary"
              >
                + Add New Category
              </button>
            )}
          </div>
        </div>
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
