import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, generateWhatsAppLink } from '../utils/api';
import PaymentForm from '../components/Payments/PaymentForm';
import TenantForm from '../components/Tenants/TenantForm';

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMoveOutConfirm, setShowMoveOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const data = await api.get(`/tenants/${id}`);
      setTenant(data);
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentData) => {
    try {
      await api.post('/payments', {
        tenant_id: parseInt(id),
        house_id: tenant.house_id,
        ...paymentData
      });
      fetchTenant();
      setShowPaymentForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleMoveOut = async () => {
    try {
      await api.put(`/tenants/${id}/move-out`, {
        move_out_date: new Date().toISOString().split('T')[0]
      });
      fetchTenant();
      setShowMoveOutConfirm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tenants/${id}`);
      navigate('/rental/tenants');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateTenant = async (tenantData) => {
    try {
      await api.put(`/tenants/${id}`, tenantData);
      fetchTenant();
      setShowEditForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const getWhatsAppReminderLink = () => {
    if (!tenant || !tenant.phone || tenant.totalPending <= 0) return null;

    const pendingPayments = tenant.payments?.filter(p => !p.is_fully_paid) || [];
    if (pendingPayments.length === 0) return null;

    // Sort by due date (oldest first)
    pendingPayments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    let messageParts = [`Dear ${tenant.name},`];
    messageParts.push('');
    messageParts.push(`Rent reminder for house ${tenant.house_number}`);
    messageParts.push('');

    // Show each pending payment with breakdown
    pendingPayments.forEach((payment) => {
      const additions = payment.additions || [];
      const additionsTotal = additions.reduce((sum, a) => sum + a.amount, 0);
      const regularRent = payment.due_amount - additionsTotal;
      const pendingAmount = payment.due_amount - payment.paid_amount;

      if (pendingPayments.length > 1) {
        messageParts.push(`--- ${formatDate(payment.due_date)} ---`);
      } else {
        messageParts.push(`Due Date: ${formatDate(payment.due_date)}`);
      }

      // Regular rent (only if > 0)
      if (regularRent > 0) {
        messageParts.push(`Regular Rent: ${formatCurrency(regularRent)}`);
      }

      // Additional charges breakdown (only if amount > 0)
      if (additions.length > 0) {
        additions.forEach(addition => {
          if (addition.amount > 0) {
            const label = addition.source_type === 'motor_bill' ? 'Motor Bill' :
                          addition.source_type === 'water_bill' ? 'Water Bill' :
                          addition.source_type === 'maintenance' ? 'Maintenance' :
                          addition.description || 'Other';
            messageParts.push(`${label}: ${formatCurrency(addition.amount)}`);
          }
        });
      }

      // Paid amount (only if > 0)
      if (payment.paid_amount > 0) {
        messageParts.push(`Paid: ${formatCurrency(payment.paid_amount)}`);
      }

      // Pending for this month (only if > 0)
      if (pendingAmount > 0) {
        messageParts.push(`Pending: ${formatCurrency(pendingAmount)}`);
      }
      messageParts.push('');
    });

    // Total pending (only if > 0)
    if (tenant.totalPending > 0) {
      messageParts.push(`*Total Pending: ${formatCurrency(tenant.totalPending)}*`);
      messageParts.push('');
    }

    messageParts.push('Please pay at the earliest.');
    messageParts.push('');
    messageParts.push('Thank you.');

    return generateWhatsAppLink(tenant.phone, messageParts.join('\n'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Tenant not found</p>
        <Link to="/rental/tenants" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to Tenants
        </Link>
      </div>
    );
  }

  const whatsAppLink = getWhatsAppReminderLink();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/rental/tenants" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tenant.name}</h1>
        <span className={`badge ${tenant.is_current ? 'badge-success' : 'badge-info'}`}>
          {tenant.is_current ? 'Current Tenant' : 'Past Tenant'}
        </span>
        <button
          onClick={() => setShowEditForm(true)}
          className="ml-auto btn btn-secondary text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Tenant
        </button>
      </div>

      {/* Pending Amount Alert */}
      {tenant.totalPending > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-red-800 dark:text-red-300 font-medium">Pending Amount</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(tenant.totalPending)}</p>
          </div>
          <div className="flex gap-2">
            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Reminder
              </a>
            )}
            <button
              onClick={() => setShowPaymentForm(true)}
              className="btn btn-primary"
            >
              Record Payment
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Tenant Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="font-medium">{tenant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="font-medium">
                {tenant.phone ? (
                  <a href={`tel:${tenant.phone}`} className="text-primary-500 hover:underline">
                    {tenant.phone}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">ID Proof</dt>
              <dd className="font-medium">{tenant.id_proof_number || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Occupation</dt>
              <dd className="font-medium">{tenant.occupation || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Members</dt>
              <dd className="font-medium">{tenant.household_members || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Move-in</dt>
              <dd className="font-medium">{formatDate(tenant.move_in_date)}</dd>
            </div>
            {tenant.move_out_date && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Move-out</dt>
                <dd className="font-medium">{formatDate(tenant.move_out_date)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Advance</dt>
              <dd className="font-medium text-green-600 dark:text-green-400">{formatCurrency(tenant.advance_amount)}</dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <Link
              to={`/houses/${tenant.house_id}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <p className="font-medium">{tenant.house_number}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(tenant.current_rent)}/month</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {tenant.is_current && (
            <button
              onClick={() => setShowMoveOutConfirm(true)}
              className="mt-4 w-full btn btn-danger"
            >
              Move Out Tenant
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-2 w-full btn bg-gray-600 text-white hover:bg-gray-700"
          >
            Delete Tenant
          </button>
        </div>

        {/* Payment History */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            {tenant.is_current && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="btn btn-primary text-sm"
              >
                + Record Payment
              </button>
            )}
          </div>

          {tenant.payments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Due Amount</th>
                    <th className="pb-3">Paid</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.payments.map((payment) => (
                    <tr key={payment.id} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-3">{formatDate(payment.due_date)}</td>
                      <td className="py-3">
                        {formatCurrency(payment.due_amount)}
                        {payment.additions?.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.additions.map((a, i) => (
                              <span key={i} className="block">
                                +{formatCurrency(a.amount)} ({a.source_type.replace('_', ' ')})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3">{formatCurrency(payment.paid_amount)}</td>
                      <td className="py-3">
                        <span className={`badge ${payment.is_fully_paid ? 'badge-success' : 'badge-warning'}`}>
                          {payment.is_fully_paid ? 'Paid' : `Pending ${formatCurrency(payment.due_amount - payment.paid_amount)}`}
                        </span>
                      </td>
                      <td className="py-3">{payment.payment_date ? formatDate(payment.payment_date) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No payment records</p>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          tenant={tenant}
          onSave={handlePayment}
          onClose={() => setShowPaymentForm(false)}
        />
      )}

      {/* Move Out Confirmation Modal */}
      {showMoveOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Move Out</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to mark {tenant.name} as moved out?
            </p>
            {tenant.totalPending > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  This tenant has pending dues of {formatCurrency(tenant.totalPending)}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMoveOutConfirm(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveOut}
                className="flex-1 btn btn-danger"
              >
                Confirm Move Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Permanently Delete Tenant</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to permanently delete <strong>{tenant.name}</strong>?
            </p>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-red-800 dark:text-red-300 text-sm font-medium">This action cannot be undone!</p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                All payment history and records for this tenant will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Edit Form Modal */}
      {showEditForm && (
        <TenantForm
          tenant={tenant}
          onSave={handleUpdateTenant}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
