import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/unified/summary - Get unified summary for all modules
router.get('/summary', (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const previousYear = currentYear - 1;

    // ===== RENTAL MODULE =====
    // Calculate rental income (paid rent)
    const rentalIncome = db.prepare(`
      SELECT COALESCE(SUM(paid_amount), 0) as total
      FROM rent_payments
      WHERE strftime('%Y', payment_date) = ?
    `).get(currentYear.toString());

    // Calculate rental expenses
    const rentalExpenses = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total
      FROM expenses
      WHERE strftime('%Y', paid_date) = ?
    `).get(currentYear.toString());

    const rentalMaintenanceExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM maintenance_expenses
      WHERE strftime('%Y', expense_date) = ?
    `).get(currentYear.toString());

    const rentalTotalExpenses = rentalExpenses.total + rentalMaintenanceExpenses.total;
    const rentalProfit = rentalIncome.total - rentalTotalExpenses;

    // Previous year rental for comparison
    const prevRentalIncome = db.prepare(`
      SELECT COALESCE(SUM(paid_amount), 0) as total
      FROM rent_payments
      WHERE strftime('%Y', payment_date) = ?
    `).get(previousYear.toString());

    const prevRentalExpenses = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total
      FROM expenses
      WHERE strftime('%Y', paid_date) = ?
    `).get(previousYear.toString());

    const prevRentalMaintExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM maintenance_expenses
      WHERE strftime('%Y', expense_date) = ?
    `).get(previousYear.toString());

    const prevRentalTotalExpenses = prevRentalExpenses.total + prevRentalMaintExpenses.total;
    const prevRentalProfit = prevRentalIncome.total - prevRentalTotalExpenses;

    // ===== PADDY MODULE =====
    const paddyIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_income
      WHERE year = ?
    `).get(currentYear);

    const paddyExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_expenses
      WHERE year = ?
    `).get(currentYear);

    const paddyProfit = paddyIncome.total - paddyExpenses.total;

    // Previous year paddy
    const prevPaddyIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_income
      WHERE year = ?
    `).get(previousYear);

    const prevPaddyExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_expenses
      WHERE year = ?
    `).get(previousYear);

    const prevPaddyProfit = prevPaddyIncome.total - prevPaddyExpenses.total;

    // ===== COCONUT MODULE =====
    const coconutIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_income
      WHERE year = ?
    `).get(currentYear);

    const coconutExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_expenses
      WHERE year = ?
    `).get(currentYear);

    const coconutProfit = coconutIncome.total - coconutExpenses.total;

    // Previous year coconut
    const prevCoconutIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_income
      WHERE year = ?
    `).get(previousYear);

    const prevCoconutExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_expenses
      WHERE year = ?
    `).get(previousYear);

    const prevCoconutProfit = prevCoconutIncome.total - prevCoconutExpenses.total;

    // ===== TOTALS =====
    const totalIncome = rentalIncome.total + paddyIncome.total + coconutIncome.total;
    const totalExpenses = rentalTotalExpenses + paddyExpenses.total + coconutExpenses.total;
    const netProfit = totalIncome - totalExpenses;

    const prevTotalIncome = prevRentalIncome.total + prevPaddyIncome.total + prevCoconutIncome.total;
    const prevTotalExpenses = prevRentalTotalExpenses + prevPaddyExpenses.total + prevCoconutExpenses.total;
    const prevNetProfit = prevTotalIncome - prevTotalExpenses;

    // Calculate year-over-year changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const incomeChange = calculateChange(totalIncome, prevTotalIncome);
    const expenseChange = calculateChange(totalExpenses, prevTotalExpenses);
    const profitChange = calculateChange(netProfit, prevNetProfit);

    // Calculate contribution percentages
    const rentalContribution = totalIncome > 0 ? Math.round((rentalIncome.total / totalIncome) * 100) : 0;
    const paddyContribution = totalIncome > 0 ? Math.round((paddyIncome.total / totalIncome) * 100) : 0;
    const coconutContribution = totalIncome > 0 ? Math.round((coconutIncome.total / totalIncome) * 100) : 0;

    res.json({
      year: parseInt(currentYear),
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0
      },
      modules: [
        {
          id: 'rental',
          name: 'Rental Houses',
          icon: '🏠',
          income: rentalIncome.total,
          expenses: rentalTotalExpenses,
          profit: rentalProfit,
          contribution: rentalContribution,
          color: 'blue'
        },
        {
          id: 'paddy',
          name: 'Paddy Fields',
          icon: '🌾',
          income: paddyIncome.total,
          expenses: paddyExpenses.total,
          profit: paddyProfit,
          contribution: paddyContribution,
          color: 'green'
        },
        {
          id: 'coconut',
          name: 'Coconut Groves',
          icon: '🥥',
          income: coconutIncome.total,
          expenses: coconutExpenses.total,
          profit: coconutProfit,
          contribution: coconutContribution,
          color: 'amber'
        }
      ],
      yearOverYear: {
        incomeChange,
        expenseChange,
        profitChange
      }
    });
  } catch (error) {
    console.error('Error fetching unified summary:', error);
    res.status(500).json({ error: 'Failed to fetch unified summary' });
  }
});

export default router;
