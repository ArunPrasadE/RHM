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
  const [generating, setGenerating] = useState(false);

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

  const handleGenerateRent = async () => {
    if (!confirm('Generate rent records for current month for all tenants?\n\nNote: Existing records will not be duplicated.')) {
      return;
    }

    setGenerating(true);
    try {
      const result = await api.post('/payments/generate-current-month');
      alert(`${result.message}\n\n${result.details}`);
      fetchData(); // Refresh the payments list
    } catch (error) {
      alert(`Failed to generate rent: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const getWhatsAppLink = (payment) => {
    if (!payment.tenant_phone) return null;

    // Find all pending payments for this tenant (including previous months)
    const tenantPendingPayments = payments.filter(p =>
      p.tenant_id === payment.tenant_id && !p.is_fully_paid
    ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // Calculate previous months pending (excluding current payment)
    const previousPending = tenantPendingPayments
      .filter(p => p.id !== payment.id)
      .reduce((sum, p) => sum + (p.due_amount - p.paid_amount), 0);

    // Current payment details
    const additions = payment.additions || [];
    const additionsTotal = additions.reduce((sum, a) => sum + a.amount, 0);
    const regularRent = payment.due_amount - additionsTotal;
    const currentPending = payment.due_amount - payment.paid_amount;

    // Build message parts
    let messageParts = [`Dear ${payment.tenant_name},`];
    messageParts.push('');
    messageParts.push(`Rent reminder for house ${payment.house_number} (Due: ${formatDate(payment.due_date)})`);
    messageParts.push('');

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

    // Show total due line if there are additions
    if (additionsTotal > 0 && regularRent > 0) {
      messageParts.push(`-----------------------`);
      messageParts.push(`Total Due: ${formatCurrency(payment.due_amount)}`);
    }

    // Already paid amount (if partial payment made)
    if (payment.paid_amount > 0) {
      messageParts.push('');
      messageParts.push(`Already Paid: ${formatCurrency(payment.paid_amount)}`);
    }

    // Previous months pending (if any)
    if (previousPending > 0) {
      messageParts.push('');
      messageParts.push(`Previous Dues: ${formatCurrency(previousPending)}`);
    }

    // Total pending amount
    const totalPending = currentPending + previousPending;
    if (totalPending > 0) {
      messageParts.push('');
      messageParts.push(`*Total Pending: ${formatCurrency(totalPending)}*`);
    }

    messageParts.push('');
    messageParts.push('Please pay at the earliest.');
    messageParts.push('');
    messageParts.push('Thank you.');

    return generateWhatsAppLink(payment.tenant_phone, messageParts.join('\n'));
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
            onClick={handleGenerateRent}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Generate rent records for current month"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate Rent
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
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
