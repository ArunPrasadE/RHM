import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import FieldForm from '../../components/Paddy/FieldForm';
import MapPopup from '../../components/Paddy/MapPopup';

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [mapField, setMapField] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const data = await api.get('/paddy/fields');
      setFields(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingField) {
        await api.put(`/paddy/fields/${editingField.id}`, data);
      } else {
        await api.post('/paddy/fields', data);
      }
      setShowForm(false);
      setEditingField(null);
      fetchFields();
    } catch (error) {
      alert('Failed to save field');
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleDelete = async (field) => {
    if (!confirm(`Are you sure you want to delete ${field.name}?`)) return;
    try {
      await api.delete(`/paddy/fields/${field.id}`);
      fetchFields();
    } catch (error) {
      alert('Failed to delete field');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Paddy Fields
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (நெல் வயல்கள்)
          </span>
        </h1>
        <button
          onClick={() => { setEditingField(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          + Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No fields added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Add Your First Field
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div key={field.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{field.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatArea(field.area_cents)}
                  </p>
                  {(field.google_maps_url || (field.gps_latitude && field.gps_longitude)) && (
                    <button
                      onClick={() => setMapField(field)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      <MapIcon className="w-4 h-4" />
                      View on Map
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(field)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(field)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <Link
                    to={`/paddy/fields/${field.id}`}
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
        <FieldForm
          field={editingField}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingField(null); }}
        />
      )}

      {mapField && (
        <MapPopup
          field={mapField}
          onClose={() => setMapField(null)}
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

function MapIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
