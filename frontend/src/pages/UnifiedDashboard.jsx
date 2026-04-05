import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';

export default function UnifiedDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/unified/summary?year=${selectedYear}`);
      setData(response);
    } catch (error) {
      console.error('Failed to fetch unified dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate year options (current year - 5 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear + 1; i >= currentYear - 5; i--) {
    yearOptions.push(i);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        Failed to load dashboard data
      </div>
    );
  }

  const { summary, modules, yearOverYear } = data;

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getModuleLink = (moduleId) => {
    switch (moduleId) {
      case 'rental':
        return '/rental/reports';
      case 'paddy':
        return '/paddy/reports';
      case 'coconut':
        return '/coconut/reports';
      default:
        return '#';
    }
  };

  const getModuleColorClass = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'amber':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Business Overview
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income Card */}
        <div className="card">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatCurrency(summary.totalIncome)}
          </div>
          <div className={`text-sm font-medium ${getChangeColor(yearOverYear.incomeChange)}`}>
            {getChangeIcon(yearOverYear.incomeChange)} {Math.abs(yearOverYear.incomeChange)}% vs last year
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="card">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className={`text-sm font-medium ${getChangeColor(yearOverYear.expenseChange)}`}>
            {getChangeIcon(yearOverYear.expenseChange)} {Math.abs(yearOverYear.expenseChange)}% vs last year
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="card">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Profit</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatCurrency(summary.netProfit)}
          </div>
          <div className={`text-sm font-medium ${getChangeColor(yearOverYear.profitChange)}`}>
            {getChangeIcon(yearOverYear.profitChange)} {Math.abs(yearOverYear.profitChange)}% vs last year
          </div>
        </div>
      </div>

      {/* Module Performance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Module Performance
        </h2>
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module.id} className="space-y-2">
              {/* Module Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{module.icon}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {module.name}
                  </span>
                </div>
                <Link
                  to={getModuleLink(module.id)}
                  className="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getModuleColorClass(module.color)} transition-all duration-500`}
                  style={{ width: `${module.contribution}%` }}
                ></div>
              </div>

              {/* Module Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Income</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(module.income)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Expenses</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(module.expenses)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Profit</div>
                  <div className={`font-semibold ${module.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(module.profit)}
                  </div>
                </div>
              </div>

              {/* Contribution Percentage */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {module.contribution}% of total income
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Profit Margin for {selectedYear}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {summary.profitMargin}%
            </div>
          </div>
          <div className="text-5xl opacity-20">📊</div>
        </div>
      </div>
    </div>
  );
}
