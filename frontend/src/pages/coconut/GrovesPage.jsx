import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import GroveForm from '../../components/Coconut/GroveForm';

export default function GrovesPage() {
  const [groves, setGroves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGrove, setEditingGrove] = useState(null);

  useEffect(() => {
    fetchGroves();
  }, []);

  const fetchGroves = async () => {
    try {
      const data = await api.get('/coconut/groves');
      setGroves(data);
    } catch (error) {
      console.error('Failed to fetch groves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingGrove) {
        await api.put(`/coconut/groves/${editingGrove.id}`, data);
      } else {
        await api.post('/coconut/groves', data);
      }
      setShowForm(false);
      setEditingGrove(null);
      fetchGroves();
    } catch (error) {
      console.error('Failed to save grove:', error);
      alert('Failed to save grove');
    }
  };

  const handleEdit = (grove) => {
    setEditingGrove(grove);
    setShowForm(true);
  };

  const handleDelete = async (grove) => {
    if (!confirm(`Are you sure you want to delete ${grove.name}?`)) return;
    try {
      await api.delete(`/coconut/groves/${grove.id}`);
      fetchGroves();
    } catch (error) {
      console.error('Failed to delete grove:', error);
      alert('Failed to delete grove');
    }
  };

  const formatArea = (cents) => {
    const acres = Math.floor(cents / 100);
    const remainingCents = cents % 100;
    if (acres > 0 && remainingCents > 0) {
      return `${acres} acre${acres > 1 ? 's' : ''} ${remainingCents} cents`;
    } else if (acres > 0) {
      return `${acres} acre${acres > 1 ? 's' : ''}`;
    }
    return `${cents} cents`;
  };

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
          Coconut Groves
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (தென்னந்தோப்புகள்)
          </span>
        </h1>
        <button
          onClick={() => { setEditingGrove(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          + Add Grove
        </button>
      </div>

      {groves.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No groves added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Add Your First Grove
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groves.map((grove) => (
            <div key={grove.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{grove.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatArea(grove.area_cents)}
                  </p>
                  {grove.google_maps_url && (
                    <a
                      href={grove.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View on Map
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(grove)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(grove)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <Link
                    to={`/coconut/groves/${grove.id}`}
                    className="btn btn-secondary text-sm px-3 py-1"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GroveForm
          grove={editingGrove}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingGrove(null); }}
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
