import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [housesData, paymentsData] = await Promise.all([
        api.get('/houses'),
        api.get('/payments/pending')
      ]);

      // Calculate stats from data
      const occupiedHouses = housesData.filter(h => h.has_tenant).length;
      const currentMonth = new Date().toISOString().slice(0, 7);

      const monthlyPayments = paymentsData.filter(p => p.due_date.startsWith(currentMonth));
      const currentMonthPending = monthlyPayments.reduce((sum, p) => sum + (p.due_amount - p.paid_amount), 0);
      const totalDue = monthlyPayments.reduce((sum, p) => sum + p.due_amount, 0);
      const totalPending = paymentsData.reduce((sum, p) => sum + (p.due_amount - p.paid_amount), 0);
      const overduePayments = paymentsData.filter(p => p.days_overdue >= 7);

      setStats({
        totalHouses: housesData.length,
        occupiedHouses,
        vacantHouses: housesData.length - occupiedHouses,
        currentMonthPending,
        currentMonthDue: totalDue,
        totalPending,
        overdueCount: overduePayments.length
      });

      setPendingPayments(paymentsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Houses"
          value={stats?.totalHouses || 0}
          icon={HouseIcon}
          color="blue"
        />
        <StatCard
          title="Occupied"
          value={stats?.occupiedHouses || 0}
          subtitle={`${stats?.vacantHouses || 0} vacant`}
          icon={OccupiedIcon}
          color="green"
        />
        <StatCard
          title="This Month Pending"
          value={formatCurrency(stats?.currentMonthPending || 0)}
          icon={MoneyIcon}
          color="amber"
        />
        <StatCard
          title="Total Pending"
          value={formatCurrency(stats?.totalPending || 0)}
          subtitle={stats?.overdueCount > 0 ? `${stats.overdueCount} overdue` : null}
          icon={PendingIcon}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/houses" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <HouseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium">Manage Houses</span>
        </Link>
        <Link to="/tenants" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="font-medium">Manage Tenants</span>
        </Link>
        <Link to="/payments" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
            <MoneyIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-medium">Record Payment</span>
        </Link>
        <Link to="/expenses" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
            <ExpenseIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-medium">Add Expense</span>
        </Link>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Payments</h2>
            <Link to="/payments" className="text-primary-500 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{payment.house_number}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{payment.tenant_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(payment.pending_amount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {payment.days_overdue > 0 ? `${Math.floor(payment.days_overdue)} days overdue` : 'Due'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Icons
function HouseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function OccupiedIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PendingIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ExpenseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
