import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function NotificationBar() {
  const [notifications, setNotifications] = useState({ overdueRent: [], upcomingExpenses: [] });
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = notifications.overdueRent.length + notifications.upcomingExpenses.length;

  if (loading || totalCount === 0) return null;

  const hasOverdue = notifications.overdueRent.length > 0;
  const bgColor = hasOverdue ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className={`${bgColor} text-white`}>
      <div className="container mx-auto px-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="font-medium">
              {hasOverdue
                ? `${notifications.overdueRent.length} Overdue Rent Payment${notifications.overdueRent.length > 1 ? 's' : ''}`
                : `${notifications.upcomingExpenses.length} Upcoming Expense${notifications.upcomingExpenses.length > 1 ? 's' : ''}`}
            </span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="pb-4 space-y-2">
            {notifications.overdueRent.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm opacity-90">Overdue Rent</h4>
                {notifications.overdueRent.map((item) => (
                  <Link
                    key={item.details.paymentId}
                    to={`/tenants/${item.details.tenantId}`}
                    className="block bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{item.details.houseNumber}</span>
                        <span className="mx-2">-</span>
                        <span>{item.details.tenantName}</span>
                      </div>
                      <span className="font-bold">₹{item.details.pendingAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      {item.details.daysOverdue} days overdue
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {notifications.upcomingExpenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm opacity-90">Upcoming Expenses</h4>
                {notifications.upcomingExpenses.map((item) => (
                  <Link
                    key={item.details.expenseId}
                    to="/expenses"
                    className="block bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{item.details.expenseTypeLabel}</span>
                        <span className="mx-2">-</span>
                        <span>{item.details.houseNumber}</span>
                      </div>
                      <span className="font-bold">₹{item.details.amount.toLocaleString()}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      Due in {item.details.daysUntilDue} day{item.details.daysUntilDue !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
