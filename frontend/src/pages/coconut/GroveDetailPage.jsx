import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatCurrency } from '../../utils/api';

export default function GroveDetailPage() {
  const { id } = useParams();
  const [grove, setGrove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearSummary, setYearSummary] = useState({});
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchGrove();
  }, [id]);

  useEffect(() => {
    fetchYearSummary();
  }, [id, filterYear]);

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

  const fetchYearSummary = async () => {
    try {
      console.log('Fetching summary for grove:', id, 'year:', filterYear);
      const summary = await api.get(`/coconut/reports/summary/${id}/${filterYear}`);
      console.log('Summary received:', summary);
      setYearSummary(summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setYearSummary({});
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

      {/* Yearly Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yearly Summary (வருடாந்திர சுருக்கம்)</h2>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="input w-32"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
        
        {yearSummary.grove ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Total Income</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(yearSummary.income?.total || 0)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(yearSummary.expenses?.total || 0)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Net Profit</p>
                <p className={`text-xl font-bold ${(yearSummary.income?.total - yearSummary.expenses?.total) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency((yearSummary.income?.total || 0) - (yearSummary.expenses?.total || 0))}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Profit %</p>
                <p className="text-xl font-bold text-gray-600 dark:text-gray-300">
                  {yearSummary.income?.total > 0 
                    ? (((yearSummary.income?.total - yearSummary.expenses?.total) / yearSummary.income?.total * 100)).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Income by Category</h3>
                {yearSummary.income?.byCategory?.length > 0 ? (
                  <div className="space-y-1">
                    {yearSummary.income.byCategory.map((item) => (
                      <div key={item.category} className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No income data</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Expenses by Category</h3>
                {yearSummary.expenses?.byCategory?.length > 0 ? (
                  <div className="space-y-1">
                    {yearSummary.expenses.byCategory.map((item) => (
                      <div key={item.category} className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No expense data</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No data available for {filterYear}
          </p>
        )}
      </div>
    </div>
  );
}
