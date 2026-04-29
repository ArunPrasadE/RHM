import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

export default function ReportsPage() {
  const [groves, setGroves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrove, setSelectedGrove] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchGroves();
  }, []);

  const fetchGroves = async () => {
    try {
      const data = await api.get('/coconut/groves');
      setGroves(data);
      if (data.length > 0) {
        setSelectedGrove(data[0].id.toString());
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedGrove) return;

    setReportLoading(true);
    try {
      const data = await api.get(`/coconut/reports/summary/${selectedGrove}/${selectedYear}`);
      setReport(data);
    } catch (error) {
      setReport(null);
    } finally {
      setReportLoading(false);
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
        Reports
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
          (அறிக்கைகள்)
        </span>
      </h1>

      {/* Report Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Generate Report (அறிக்கை உருவாக்கு)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Grove (தோப்பு)</label>
            <select
              value={selectedGrove}
              onChange={(e) => setSelectedGrove(e.target.value)}
              className="input"
            >
              {groves.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year (ஆண்டு)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={reportLoading || !selectedGrove}
              className="btn btn-primary w-full"
            >
              {reportLoading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Grove Info */}
          <div className="card bg-amber-50 dark:bg-amber-900/20">
            <h3 className="text-lg font-semibold mb-2">{report.grove?.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Area: {formatArea(report.grove?.area_cents || 0)} | Year: {report.year}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses (மொத்த செலவு)</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(report.expenses?.total || 0)}
              </p>
            </div>
            <div className="card bg-green-50 dark:bg-green-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Income (மொத்த வருமானம்)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(report.income?.total || 0)}
              </p>
            </div>
            <div className={`card ${report.profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {report.profit >= 0 ? 'Profit (லாபம்)' : 'Loss (நஷ்டம்)'}
              </p>
              <p className={`text-2xl font-bold mt-1 ${report.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(report.profit || 0))}
              </p>
            </div>
          </div>

          {/* Expense Breakdown */}
          {report.expenses?.byCategory && report.expenses.byCategory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown (செலவு விவரம்)</h3>
              <div className="space-y-2">
                {report.expenses.byCategory.map((exp, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b dark:border-gray-700 last:border-0">
                    <span>{exp.category}</span>
                    <span className="font-medium">{formatCurrency(exp.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income Breakdown */}
          {report.income?.byCategory && report.income.byCategory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Income Breakdown (வருமான விவரம்)</h3>
              <div className="space-y-2">
                {report.income.byCategory.map((inc, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b dark:border-gray-700 last:border-0">
                    <div>
                      <span>{inc.category}</span>
                      {inc.total_kg && (
                        <span className="text-sm text-gray-500 ml-2">({inc.total_kg} kg)</span>
                      )}
                    </div>
                    <span className="font-medium text-green-600">{formatCurrency(inc.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yield Summary */}
          {report.yieldSummary && report.yieldSummary.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Yield Summary (விளைச்சல் சுருக்கம்)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {report.yieldSummary.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                    <p className="font-bold text-lg">{item.totalKg || 0} kg</p>
                    <p className="text-sm text-gray-500">
                      Avg Rate: {formatCurrency(item.avgRate || 0)}/kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !reportLoading && (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Select filters and click "Generate Report" to view the summary
          </p>
        </div>
      )}
    </div>
  );
}
