import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatCurrency, formatDate, generateWhatsAppLink } from '../utils/api';
import PaymentForm from '../components/Payments/PaymentForm';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [paymentsData, tenantsData] = await Promise.all([
        api.get(`/payments?status=${filter}`),
        api.get('/tenants?current_only=true')
      ]);
      setPayments(paymentsData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (payment) => {
    const tenant = {
      id: payment.tenant_id,
      name: payment.tenant_name,
      house_id: payment.house_id,
      house_number: payment.house_number,
      phone: payment.tenant_phone
    };
    setSelectedTenant(tenant);
    setShowPaymentForm(true);
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      await api.post('/payments', {
        tenant_id: selectedTenant.id,
        house_id: selectedTenant.house_id,
        ...paymentData
      });
      fetchData();
      setShowPaymentForm(false);
      setSelectedTenant(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const getWhatsAppLink = (payment) => {
    if (!payment.tenant_phone) return null;

    const message = `Dear ${payment.tenant_name},

This is a reminder that your rent of ${formatCurrency(payment.due_amount)} for house ${payment.house_number} was due on ${formatDate(payment.due_date)}.

Pending amount: ${formatCurrency(payment.pending_amount)}

Please pay at the earliest.

Thank you.`;

    return generateWhatsAppLink(payment.tenant_phone, message);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'paid'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === ''
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <th className="px-4 py-3">House</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Due Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const isOverdue = !payment.is_fully_paid && new Date(payment.due_date) < new Date();
                const daysOverdue = payment.days_overdue ? Math.floor(payment.days_overdue) : 0;
                const whatsAppLink = getWhatsAppLink(payment);

                return (
                  <tr key={payment.id} className={`border-b dark:border-gray-700 last:border-0 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <td className="px-4 py-3">
                      <Link to={`/houses/${payment.house_id}`} className="text-primary-500 hover:underline font-medium">
                        {payment.house_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/tenants/${payment.tenant_id}`} className="hover:underline">
                        {payment.tenant_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(payment.due_date)}
                      {daysOverdue > 0 && (
                        <span className="block text-xs text-red-600 dark:text-red-400">{daysOverdue} days overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(payment.due_amount)}
                      {payment.additions?.length > 0 && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          includes {payment.additions.length} addition(s)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(payment.paid_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${payment.is_fully_paid ? 'badge-success' : 'badge-warning'}`}>
                        {payment.is_fully_paid ? 'Paid' : `Pending ${formatCurrency(payment.due_amount - payment.paid_amount)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!payment.is_fully_paid && (
                          <>
                            <button
                              onClick={() => handleRecordPayment(payment)}
                              className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
                            >
                              Pay
                            </button>
                            {whatsAppLink && (
                              <a
                                href={whatsAppLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                              >
                                WhatsApp
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {payments.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No {filter} payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedTenant && (
        <PaymentForm
          tenant={selectedTenant}
          onSave={handlePaymentSave}
          onClose={() => { setShowPaymentForm(false); setSelectedTenant(null); }}
        />
      )}
    </div>
  );
}
