import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';
import HouseForm from '../components/Houses/HouseForm';

export default function HousesPage() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const data = await api.get('/houses');
      setHouses(data);
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (houseData) => {
    try {
      if (editingHouse) {
        await api.put(`/houses/${editingHouse.id}`, houseData);
      } else {
        await api.post('/houses', houseData);
      }
      fetchHouses();
      setShowForm(false);
      setEditingHouse(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (house) => {
    setEditingHouse(house);
    setShowForm(true);
  };

  const handleDelete = async (house) => {
    if (!confirm(`Are you sure you want to delete ${house.house_number}?`)) return;

    try {
      await api.delete(`/houses/${house.id}`);
      fetchHouses();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Houses</h1>
        <button
          onClick={() => { setEditingHouse(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          + Add House
        </button>
      </div>

      {/* House Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {houses.map((house) => (
          <div key={house.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{house.house_number}</h3>
                <p className="text-sm text-gray-500">{house.type || 'House'}</p>
              </div>
              <span className={`badge ${house.has_tenant ? 'badge-success' : 'badge-warning'}`}>
                {house.has_tenant ? 'Occupied' : 'Vacant'}
              </span>
            </div>

            {house.address && (
              <p className="text-sm text-gray-600 mb-3">{house.address}</p>
            )}

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">Rent</span>
              <span className="font-semibold">{formatCurrency(house.rent_amount)}</span>
            </div>

            {house.current_tenant_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{house.current_tenant_name}</span>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t">
              <Link
                to={`/houses/${house.id}`}
                className="flex-1 btn btn-secondary text-center text-sm py-2"
              >
                View Details
              </Link>
              <button
                onClick={() => handleEdit(house)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(house)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {houses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p>No houses added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-500 hover:underline"
            >
              Add your first house
            </button>
          </div>
        )}
      </div>

      {/* House Form Modal */}
      {showForm && (
        <HouseForm
          house={editingHouse}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingHouse(null); }}
        />
      )}
    </div>
  );
}
