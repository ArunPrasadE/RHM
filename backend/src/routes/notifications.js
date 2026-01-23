import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getOverdueRentNotifications, getUpcomingExpenseNotifications } from '../utils/notifications.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/notifications - Get all active notifications
router.get('/', (req, res) => {
  try {
    const overdueRent = getOverdueRentNotifications();
    const upcomingExpenses = getUpcomingExpenseNotifications();

    res.json({
      overdueRent,
      upcomingExpenses,
      totalCount: overdueRent.length + upcomingExpenses.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/summary - Get notification counts only
router.get('/summary', (req, res) => {
  try {
    // Count overdue rent payments (7+ days after due date)
    const overdueCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM rent_payments
      WHERE is_fully_paid = 0
        AND julianday('now') - julianday(due_date) >= 7
    `).get().count;

    // Count upcoming expenses (within 7 days)
    const upcomingExpensesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM expenses
      WHERE is_paid = 0
        AND due_date IS NOT NULL
        AND julianday(due_date) - julianday('now') BETWEEN 0 AND 7
    `).get().count;

    res.json({
      overdueRentCount: overdueCount,
      upcomingExpensesCount: upcomingExpensesCount,
      totalCount: overdueCount + upcomingExpensesCount
    });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ error: 'Failed to fetch notification summary' });
  }
});

export default router;
