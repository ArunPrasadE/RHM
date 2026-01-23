import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatCurrency, formatDate } from '../utils/api';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('current');

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const fetchTenants = async () => {
    try {
      const params = filter === 'current' ? '?current_only=true' : '';
      const data = await api.get(`/tenants${params}`);
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('current')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'current'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            to={`/tenants/${tenant.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{tenant.name}</h3>
                <p className="text-sm text-gray-500">{tenant.house_number}</p>
              </div>
              <span className={`badge ${tenant.is_current ? 'badge-success' : 'badge-info'}`}>
                {tenant.is_current ? 'Current' : 'Past'}
              </span>
            </div>

            {tenant.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{tenant.phone}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-3 border-t">
              <div>
                <span className="text-gray-500">Move-in:</span>{' '}
                <span className="font-medium">{formatDate(tenant.move_in_date)}</span>
              </div>
              {tenant.move_out_date && (
                <div>
                  <span className="text-gray-500">Move-out:</span>{' '}
                  <span className="font-medium">{formatDate(tenant.move_out_date)}</span>
                </div>
              )}
            </div>

            {tenant.is_current && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current Rent</span>
                  <span className="font-semibold text-green-600">{formatCurrency(tenant.current_rent)}</span>
                </div>
              </div>
            )}
          </Link>
        ))}

        {tenants.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p>No tenants found.</p>
            <Link to="/houses" className="mt-4 text-primary-500 hover:underline inline-block">
              Add a tenant from a house page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
