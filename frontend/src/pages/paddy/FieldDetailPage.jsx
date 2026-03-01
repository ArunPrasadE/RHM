import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import MapPopup from '../../components/Paddy/MapPopup';

export default function FieldDetailPage() {
  const { id } = useParams();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchField();
  }, [id]);

  const fetchField = async () => {
    try {
      const data = await api.get(`/paddy/fields/${id}`);
      setField(data);
    } catch (error) {
      console.error('Failed to fetch field:', error);
    } finally {
      setLoading(false);
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

  if (!field) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Field not found</p>
        <Link to="/paddy/fields" className="btn btn-primary mt-4">
          Back to Fields
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/paddy/fields" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {field.name}
        </h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Field Details (வயல் விவரங்கள்)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Area (பரப்பளவு)</p>
            <p className="font-medium">{formatArea(field.area_cents)}</p>
          </div>
          {field.gps_latitude && field.gps_longitude && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">GPS Location</p>
              <p className="font-medium">{field.gps_latitude}, {field.gps_longitude}</p>
            </div>
          )}
          {(field.google_maps_url || (field.gps_latitude && field.gps_longitude)) && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Map (வரைபடம்)</p>
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View on Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for expenses and income summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Season Summary (பருவ சுருக்கம்)</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Expense and income summary will appear here once data is added.
        </p>
      </div>

      {showMap && (
        <MapPopup
          field={field}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
