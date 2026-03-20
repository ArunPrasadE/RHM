import { useState, useEffect } from 'react';
import api, { formatCurrency } from '../../utils/api';

export default function ReportsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCrop, setSelectedCrop] = useState(1);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const data = await api.get('/paddy/fields');
      setFields(data);
      if (data.length > 0) {
        setSelectedField(data[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedField) return;

    setReportLoading(true);
    try {
      const data = await api.get(`/paddy/reports/summary/${selectedField}/${selectedYear}/${selectedCrop}`);
      setReport(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Field (வயல்)</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="input"
            >
              {fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
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
          <div>
            <label className="label">Crop (பயிர்)</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>Crop 1 (பயிர் 1)</option>
              <option value={2}>Crop 2 (பயிர் 2)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={reportLoading || !selectedField}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses (மொத்த செலவு)</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(report.totalExpenses || 0)}
              </p>
            </div>
            <div className="card bg-green-50 dark:bg-green-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Income (மொத்த வருமானம்)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(report.totalIncome || 0)}
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
          {report.expensesByCategory && report.expensesByCategory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown (செலவு விவரம்)</h3>
              <div className="space-y-2">
                {report.expensesByCategory.map((exp, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b dark:border-gray-700 last:border-0">
                    <span>{exp.category}</span>
                    <span className="font-medium">{formatCurrency(exp.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income Breakdown */}
          {report.incomeByCategory && report.incomeByCategory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Income Breakdown (வருமான விவரம்)</h3>
              <div className="space-y-2">
                {report.incomeByCategory.map((inc, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b dark:border-gray-700 last:border-0">
                    <span>{inc.category}</span>
                    <span className="font-medium text-green-600">{formatCurrency(inc.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yield Summary */}
          {report.yieldSummary && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Yield Summary (விளைச்சல் சுருக்கம்)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Yield (மொத்த விளைச்சல்)</p>
                  <p className="font-bold text-lg">{report.yieldSummary.totalKg || 0} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Kottai (மொத்த கொட்டை)</p>
                  <p className="font-bold text-lg">{(report.yieldSummary.totalKottai || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Rate (சராசரி விலை)</p>
                  <p className="font-bold text-lg">{formatCurrency(report.yieldSummary.avgRate || 0)}/kottai</p>
                </div>
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
