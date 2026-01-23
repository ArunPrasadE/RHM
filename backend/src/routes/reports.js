import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateTenantPDF, generateHousePDF, generateYearlyReportPDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/reports/tenant/:id/pdf - Generate tenant details PDF
router.get('/tenant/:id/pdf', async (req, res) => {
  try {
    const tenant = db.prepare(`
      SELECT t.*, h.house_number, h.address, h.rent_amount
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const payments = db.prepare(`
      SELECT * FROM rent_payments
      WHERE tenant_id = ?
      ORDER BY due_date DESC
    `).all(req.params.id);

    const pdfBuffer = await generateTenantPDF(tenant, payments);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tenant_${tenant.name.replace(/\s+/g, '_')}_report.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error generating tenant PDF:', error);
    res.status(500).json({ error: 'Failed to generate tenant PDF' });
  }
});

// GET /api/reports/house/:id/pdf - Generate house details PDF
router.get('/house/:id/pdf', async (req, res) => {
  try {
    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(req.params.id);

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    const tenants = db.prepare(`
      SELECT * FROM tenants WHERE house_id = ? ORDER BY move_in_date DESC
    `).all(req.params.id);

    const expenses = db.prepare(`
      SELECT * FROM expenses WHERE house_id = ? ORDER BY due_date DESC
    `).all(req.params.id);

    const maintenanceExpenses = db.prepare(`
      SELECT me.*, meh.split_amount
      FROM maintenance_expenses me
      JOIN maintenance_expense_houses meh ON me.id = meh.maintenance_expense_id
      WHERE meh.house_id = ?
      ORDER BY me.expense_date DESC
    `).all(req.params.id);

    const pdfBuffer = await generateHousePDF(house, tenants, expenses, maintenanceExpenses);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="house_${house.house_number}_report.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error generating house PDF:', error);
    res.status(500).json({ error: 'Failed to generate house PDF' });
  }
});

// GET /api/reports/yearly/:year/pdf - Generate yearly financial report
router.get('/yearly/:year/pdf', async (req, res) => {
  try {
    const year = req.params.year;

    // Get all houses
    const houses = db.prepare('SELECT * FROM houses WHERE is_active = 1 ORDER BY house_number').all();

    // Get monthly income data
    const monthlyIncome = db.prepare(`
      SELECT
        strftime('%m', due_date) as month,
        house_id,
        SUM(paid_amount) as collected,
        SUM(due_amount) as total_due
      FROM rent_payments
      WHERE strftime('%Y', due_date) = ?
      GROUP BY strftime('%m', due_date), house_id
    `).all(year);

    // Get expenses by house
    const expenses = db.prepare(`
      SELECT
        house_id,
        expense_type,
        SUM(amount) as total
      FROM expenses
      WHERE strftime('%Y', due_date) = ? OR strftime('%Y', paid_date) = ?
      GROUP BY house_id, expense_type
    `).all(year, year);

    // Get maintenance expenses
    const maintenance = db.prepare(`
      SELECT
        meh.house_id,
        SUM(meh.split_amount) as total
      FROM maintenance_expense_houses meh
      JOIN maintenance_expenses me ON meh.maintenance_expense_id = me.id
      WHERE strftime('%Y', me.expense_date) = ?
      GROUP BY meh.house_id
    `).all(year);

    const pdfBuffer = await generateYearlyReportPDF(year, houses, monthlyIncome, expenses, maintenance);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="yearly_report_${year}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error generating yearly report PDF:', error);
    res.status(500).json({ error: 'Failed to generate yearly report PDF' });
  }
});

// GET /api/reports/summary/:year - Get yearly summary data (for dashboard)
router.get('/summary/:year', (req, res) => {
  try {
    const year = req.params.year;

    const totalIncome = db.prepare(`
      SELECT SUM(paid_amount) as total
      FROM rent_payments
      WHERE strftime('%Y', due_date) = ?
    `).get(year).total || 0;

    const totalExpenses = db.prepare(`
      SELECT SUM(amount) as total
      FROM expenses
      WHERE strftime('%Y', due_date) = ? OR strftime('%Y', paid_date) = ?
    `).get(year, year).total || 0;

    const totalMaintenance = db.prepare(`
      SELECT SUM(amount) as total
      FROM maintenance_expenses
      WHERE strftime('%Y', expense_date) = ?
    `).get(year).total || 0;

    const pendingRent = db.prepare(`
      SELECT SUM(due_amount - paid_amount) as total
      FROM rent_payments
      WHERE strftime('%Y', due_date) = ? AND is_fully_paid = 0
    `).get(year).total || 0;

    res.json({
      year,
      totalIncome,
      totalExpenses: totalExpenses + totalMaintenance,
      netProfit: totalIncome - totalExpenses - totalMaintenance,
      pendingRent
    });
  } catch (error) {
    console.error('Error fetching yearly summary:', error);
    res.status(500).json({ error: 'Failed to fetch yearly summary' });
  }
});

export default router;
