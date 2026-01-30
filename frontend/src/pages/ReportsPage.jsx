import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../utils/api';

export default function ReportsPage() {
  const [houses, setHouses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const [housesData, tenantsData, summaryData] = await Promise.all([
        api.get('/houses'),
        api.get('/tenants?current_only=true'),
        api.get(`/reports/summary/${selectedYear}`)
      ]);
      setHouses(housesData);
      setTenants(tenantsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (type, id, name) => {
    setDownloading(`${type}-${id}`);
    try {
      let endpoint, filename;

      switch (type) {
        case 'tenant':
          endpoint = `/reports/tenant/${id}/pdf`;
          filename = `tenant_${name.replace(/\s+/g, '_')}_report.pdf`;
          break;
        case 'house':
          endpoint = `/reports/house/${id}/pdf`;
          filename = `house_${name}_report.pdf`;
          break;
        case 'yearly':
          endpoint = `/reports/yearly/${id}/pdf`;
          filename = `yearly_report_${id}.pdf`;
          break;
        default:
          return;
      }

      await api.downloadFile(endpoint, filename);
    } catch (error) {
      alert(error.message);
    } finally {
      setDownloading(null);
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      {/* Yearly Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yearly Summary</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-32"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400">Total Income</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">Net Profit</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summary.netProfit)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">Pending Rent</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(summary.pendingRent)}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => downloadReport('yearly', selectedYear, selectedYear)}
          disabled={downloading === `yearly-${selectedYear}`}
          className="btn btn-primary flex items-center gap-2"
        >
          {downloading === `yearly-${selectedYear}` ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download {selectedYear} Report
            </>
          )}
        </button>
      </div>

      {/* House Reports */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">House Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div key={house.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">{house.house_number}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{house.type || 'House'}</p>
              </div>
              <button
                onClick={() => downloadReport('house', house.id, house.house_number)}
                disabled={downloading === `house-${house.id}`}
                className="btn btn-secondary text-sm"
              >
                {downloading === `house-${house.id}` ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Reports */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tenant Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tenant.house_number}</p>
              </div>
              <button
                onClick={() => downloadReport('tenant', tenant.id, tenant.name)}
                disabled={downloading === `tenant-${tenant.id}`}
                className="btn btn-secondary text-sm"
              >
                {downloading === `tenant-${tenant.id}` ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          ))}

          {tenants.length === 0 && (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-4">
              No current tenants
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
