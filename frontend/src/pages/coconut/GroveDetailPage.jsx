import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function GroveDetailPage() {
  const { id } = useParams();
  const [grove, setGrove] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrove();
  }, [id]);

  const fetchGrove = async () => {
    try {
      const data = await api.get(`/coconut/groves/${id}`);
      setGrove(data);
    } catch (error) {
      console.error('Failed to fetch grove:', error);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!grove) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Grove not found</p>
        <Link to="/coconut/groves" className="btn btn-primary mt-4">
          Back to Groves
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/coconut/groves" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {grove.name}
        </h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Grove Details (தோப்பு விவரங்கள்)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Area (பரப்பளவு)</p>
            <p className="font-medium">{formatArea(grove.area_cents)}</p>
          </div>
          {grove.gps_latitude && grove.gps_longitude && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">GPS Location</p>
              <p className="font-medium">{grove.gps_latitude}, {grove.gps_longitude}</p>
            </div>
          )}
          {grove.google_maps_url && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Map</p>
              <a
                href={grove.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for expenses and income summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Yearly Summary (வருடாந்திர சுருக்கம்)</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Expense and income summary will appear here once data is added.
        </p>
      </div>
    </div>
  );
}
