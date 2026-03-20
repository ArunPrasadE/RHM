import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatCurrency, formatDate } from '../utils/api';
import TenantForm from '../components/Tenants/TenantForm';
import HouseForm from '../components/Houses/HouseForm';

export default function HouseDetailPage() {
  const { id } = useParams();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showHouseForm, setShowHouseForm] = useState(false);

  useEffect(() => {
    fetchHouse();
  }, [id]);

  const fetchHouse = async () => {
    try {
      const data = await api.get(`/houses/${id}`);
      setHouse(data);
    } catch (error) {
      console.error('Failed to fetch house:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (tenantData) => {
    try {
      await api.post('/tenants', { ...tenantData, house_id: parseInt(id) });
      fetchHouse();
      setShowTenantForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateHouse = async (houseData) => {
    try {
      await api.put(`/houses/${id}`, houseData);
      fetchHouse();
      setShowHouseForm(false);
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

  if (!house) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">House not found</p>
        <Link to="/rental/houses" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to Houses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/rental/houses" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">House {house.house_number}</h1>
        <span className={`badge ${house.has_tenant ? 'badge-success' : 'badge-warning'}`}>
          {house.has_tenant ? 'Occupied' : 'Vacant'}
        </span>
        <button
          onClick={() => setShowHouseForm(true)}
          className="ml-auto btn btn-secondary text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit House
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* House Details */}
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">House Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">House Number</dt>
              <dd className="font-medium">{house.house_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="font-medium">{house.type || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Size</dt>
              <dd className="font-medium">{house.size_sqft ? `${house.size_sqft} sq.ft` : '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Rent Amount</dt>
              <dd className="font-medium text-green-600 dark:text-green-400">{formatCurrency(house.rent_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">EB Service No.</dt>
              <dd className="font-medium">{house.eb_service_number || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Motor Service No.</dt>
              <dd className="font-medium">{house.motor_service_number || '-'}</dd>
            </div>
          </dl>

          {house.address && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p className="text-gray-700 dark:text-gray-300">{house.address}</p>
            </div>
          )}

          {house.google_maps_url && (
            <a
              href={house.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              View on Map
            </a>
          )}
        </div>

        {/* Current Tenant */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Tenant</h2>
            {!house.currentTenant && (
              <button
                onClick={() => setShowTenantForm(true)}
                className="btn btn-primary text-sm"
              >
                + Add Tenant
              </button>
            )}
          </div>

          {house.currentTenant ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{house.currentTenant.name}</h3>
                  {house.currentTenant.phone && (
                    <p className="text-gray-500 dark:text-gray-400">{house.currentTenant.phone}</p>
                  )}
                </div>
                <Link
                  to={`/tenants/${house.currentTenant.id}`}
                  className="btn btn-secondary text-sm"
                >
                  View Details
                </Link>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Move-in Date</dt>
                  <dd className="font-medium">{formatDate(house.currentTenant.move_in_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Advance</dt>
                  <dd className="font-medium">{formatCurrency(house.currentTenant.advance_amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Occupation</dt>
                  <dd className="font-medium">{house.currentTenant.occupation || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Household Members</dt>
                  <dd className="font-medium">{house.currentTenant.household_members || '-'}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>No current tenant</p>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Recent Expenses</h2>
          {house.recentExpenses?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {house.recentExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-3 capitalize">{expense.expense_type.replace('_', ' ')}</td>
                      <td className="py-3">{formatCurrency(expense.amount)}</td>
                      <td className="py-3">{formatDate(expense.due_date)}</td>
                      <td className="py-3">
                        <span className={`badge ${expense.is_paid ? 'badge-success' : 'badge-warning'}`}>
                          {expense.is_paid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses recorded</p>
          )}
        </div>
      </div>

      {/* Tenant Form Modal */}
      {showTenantForm && (
        <TenantForm
          houseId={parseInt(id)}
          onSave={handleAddTenant}
          onClose={() => setShowTenantForm(false)}
        />
      )}

      {/* House Edit Form Modal */}
      {showHouseForm && (
        <HouseForm
          house={house}
          onSave={handleUpdateHouse}
          onClose={() => setShowHouseForm(false)}
        />
      )}
    </div>
  );
}
