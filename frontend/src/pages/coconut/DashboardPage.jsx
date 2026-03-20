import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function CoconutDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const grovesData = await api.get('/coconut/groves');

      setStats({
        totalGroves: grovesData.length,
        totalAreaCents: grovesData.reduce((sum, g) => sum + g.area_cents, 0)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({ totalGroves: 0, totalAreaCents: 0 });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Coconut Groves Dashboard
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
          (தென்னந்தோப்புகள்)
        </span>
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Groves"
          titleTamil="மொத்த தோப்புகள்"
          value={stats?.totalGroves || 0}
          icon={GroveIcon}
          color="amber"
        />
        <StatCard
          title="Total Area"
          titleTamil="மொத்த பரப்பளவு"
          value={formatArea(stats?.totalAreaCents || 0)}
          icon={AreaIcon}
          color="green"
        />
        <StatCard
          title="This Year"
          titleTamil="இந்த ஆண்டு"
          value={new Date().getFullYear()}
          icon={CalendarIcon}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/coconut/groves" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
            <GroveIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-medium">Manage Groves</span>
        </Link>
        <Link to="/coconut/workers" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <WorkerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium">Manage Workers</span>
        </Link>
        <Link to="/coconut/expenses" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
            <ExpenseIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <span className="font-medium">Add Expense</span>
        </Link>
        <Link to="/coconut/income" className="card hover:shadow-lg transition-shadow flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <IncomeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="font-medium">Add Income</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, titleTamil, value, icon: Icon, color }) {
  const colorClasses = {
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">({titleTamil})</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function GroveIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="14" r="6" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V3M8 5l4 3M16 5l-4 3" />
    </svg>
  );
}

function AreaIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function WorkerIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ExpenseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IncomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
