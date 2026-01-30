import { useState, useEffect } from 'react';
import api, { formatCurrency, formatDate } from '../utils/api';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import BillSplitter from '../components/Expenses/BillSplitter';
import MaintenanceForm from '../components/Expenses/MaintenanceForm';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [maintenanceExpenses, setMaintenanceExpenses] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showForm, setShowForm] = useState(null); // 'expense', 'motor', 'water', 'maintenance'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesData, maintenanceData, housesData] = await Promise.all([
        api.get('/expenses'),
        api.get('/maintenance'),
        api.get('/houses')
      ]);
      setExpenses(expensesData);
      setMaintenanceExpenses(maintenanceData);
      setHouses(housesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (expenseId) => {
    try {
      await api.put(`/expenses/${expenseId}/pay`, {
        paid_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const expenseTypeLabels = {
    'eb_bill': 'EB Bill',
    'house_tax': 'House Tax',
    'motor_bill': 'Motor Bill',
    'water_bill': 'Water Bill'
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm('expense')}
            className="btn btn-primary"
          >
            + EB Bill / Tax
          </button>
          <button
            onClick={() => setShowForm('motor')}
            className="btn bg-purple-500 text-white hover:bg-purple-600"
          >
            + Motor Bill
          </button>
          <button
            onClick={() => setShowForm('water')}
            className="btn bg-blue-500 text-white hover:bg-blue-600"
          >
            + Water Bill
          </button>
          <button
            onClick={() => setShowForm('maintenance')}
            className="btn bg-amber-500 text-white hover:bg-amber-600"
          >
            + Maintenance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'expenses'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Bills & Taxes
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'maintenance'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Maintenance
        </button>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">House</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b dark:border-gray-700 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {expenseTypeLabels[expense.expense_type] || expense.expense_type}
                    </td>
                    <td className="px-4 py-3">{expense.house_number}</td>
                    <td className="px-4 py-3">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3">{formatDate(expense.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${expense.is_paid ? 'badge-success' : 'badge-warning'}`}>
                        {expense.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!expense.is_paid && (
                        <button
                          onClick={() => handleMarkPaid(expense.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Table */}
      {activeTab === 'maintenance' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Houses</th>
                  <th className="px-4 py-3">Split Type</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b dark:border-gray-700 last:border-0">
                    <td className="px-4 py-3 font-medium">{expense.description}</td>
                    <td className="px-4 py-3">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {expense.houses.map((h, i) => (
                          <span key={i} className="badge badge-info">
                            {h.house_number} ({formatCurrency(h.split_amount)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${expense.is_shared ? 'badge-info' : 'badge-success'}`}>
                        {expense.is_shared ? 'Shared' : 'Single'}
                      </span>
                    </td>
                  </tr>
                ))}

                {maintenanceExpenses.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No maintenance expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modals */}
      {showForm === 'expense' && (
        <ExpenseForm
          houses={houses}
          onSave={() => { fetchData(); setShowForm(null); }}
          onClose={() => setShowForm(null)}
        />
      )}

      {(showForm === 'motor' || showForm === 'water') && (
        <BillSplitter
          type={showForm}
          houses={houses}
          onSave={() => { fetchData(); setShowForm(null); }}
          onClose={() => setShowForm(null)}
        />
      )}

      {showForm === 'maintenance' && (
        <MaintenanceForm
          houses={houses}
          onSave={() => { fetchData(); setShowForm(null); }}
          onClose={() => setShowForm(null)}
        />
      )}
    </div>
  );
}
