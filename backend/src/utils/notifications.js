import db from '../config/db.js';

/**
 * Get overdue rent notifications
 * Shows notifications 7 days AFTER rent due date (10th + 7 = 17th onwards)
 */
export function getOverdueRentNotifications() {
  const overduePayments = db.prepare(`
    SELECT
      rp.*,
      t.name as tenant_name,
      t.phone as tenant_phone,
      h.house_number,
      (rp.due_amount - rp.paid_amount) as pending_amount,
      CAST(julianday('now') - julianday(rp.due_date) AS INTEGER) as days_overdue
    FROM rent_payments rp
    JOIN tenants t ON rp.tenant_id = t.id
    JOIN houses h ON rp.house_id = h.id
    WHERE rp.is_fully_paid = 0
      AND t.is_current = 1
      AND julianday('now') - julianday(rp.due_date) >= 7
    ORDER BY rp.due_date ASC
  `).all();

  return overduePayments.map(payment => ({
    type: 'overdue_rent',
    severity: payment.days_overdue > 30 ? 'critical' : payment.days_overdue > 14 ? 'high' : 'medium',
    message: `Rent overdue for ${payment.house_number} - ${payment.tenant_name}`,
    details: {
      paymentId: payment.id,
      tenantId: payment.tenant_id,
      tenantName: payment.tenant_name,
      tenantPhone: payment.tenant_phone,
      houseNumber: payment.house_number,
      dueDate: payment.due_date,
      dueAmount: payment.due_amount,
      paidAmount: payment.paid_amount,
      pendingAmount: payment.pending_amount,
      daysOverdue: payment.days_overdue
    }
  }));
}

/**
 * Get upcoming expense notifications
 * Shows notifications 7 days BEFORE expense due date
 */
export function getUpcomingExpenseNotifications() {
  const upcomingExpenses = db.prepare(`
    SELECT
      e.*,
      h.house_number,
      CAST(julianday(e.due_date) - julianday('now') AS INTEGER) as days_until_due
    FROM expenses e
    JOIN houses h ON e.house_id = h.id
    WHERE e.is_paid = 0
      AND e.due_date IS NOT NULL
      AND julianday(e.due_date) - julianday('now') BETWEEN 0 AND 7
    ORDER BY e.due_date ASC
  `).all();

  const expenseTypeLabels = {
    'eb_bill': 'EB Bill',
    'house_tax': 'House Tax',
    'motor_bill': 'Motor Bill',
    'water_bill': 'Water Bill'
  };

  return upcomingExpenses.map(expense => ({
    type: 'upcoming_expense',
    severity: expense.days_until_due <= 2 ? 'high' : 'low',
    message: `${expenseTypeLabels[expense.expense_type] || expense.expense_type} due for ${expense.house_number}`,
    details: {
      expenseId: expense.id,
      houseId: expense.house_id,
      houseNumber: expense.house_number,
      expenseType: expense.expense_type,
      expenseTypeLabel: expenseTypeLabels[expense.expense_type] || expense.expense_type,
      amount: expense.amount,
      dueDate: expense.due_date,
      daysUntilDue: expense.days_until_due
    }
  }));
}

/**
 * Get all active notifications sorted by severity
 */
export function getAllNotifications() {
  const overdueRent = getOverdueRentNotifications();
  const upcomingExpenses = getUpcomingExpenseNotifications();

  const all = [...overdueRent, ...upcomingExpenses];

  // Sort by severity (critical > high > medium > low)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return all;
}

/**
 * Get dashboard statistics
 */
export function getDashboardStats() {
  // Total houses
  const totalHouses = db.prepare('SELECT COUNT(*) as count FROM houses WHERE is_active = 1').get().count;

  // Occupied houses
  const occupiedHouses = db.prepare(`
    SELECT COUNT(DISTINCT house_id) as count
    FROM tenants
    WHERE is_current = 1
  `).get().count;

  // Current month income
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyIncome = db.prepare(`
    SELECT
      SUM(paid_amount) as collected,
      SUM(due_amount) as total_due
    FROM rent_payments
    WHERE strftime('%Y-%m', due_date) = ?
  `).get(currentMonth);

  // Total pending rent
  const totalPending = db.prepare(`
    SELECT SUM(due_amount - paid_amount) as total
    FROM rent_payments
    WHERE is_fully_paid = 0
  `).get().total || 0;

  // Overdue count
  const overdueCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM rent_payments
    WHERE is_fully_paid = 0
      AND julianday('now') - julianday(due_date) >= 7
  `).get().count;

  return {
    totalHouses,
    occupiedHouses,
    vacantHouses: totalHouses - occupiedHouses,
    currentMonthCollected: monthlyIncome?.collected || 0,
    currentMonthDue: monthlyIncome?.total_due || 0,
    totalPending,
    overdueCount
  };
}
