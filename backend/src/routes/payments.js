import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateMissingRentRecords, generateCurrentMonthRent } from '../utils/scheduler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/payments - List all payments with filters
router.get('/', (req, res) => {
  try {
    const { house_id, tenant_id, month, year, status } = req.query;

    let query = `
      SELECT rp.*, t.name as tenant_name, t.phone as tenant_phone, h.house_number, h.rent_amount as base_rent,
        (SELECT json_group_array(json_object('id', ra.id, 'source_type', ra.source_type, 'amount', ra.amount, 'description', ra.description))
         FROM rent_additions ra WHERE ra.rent_payment_id = rp.id) as additions
      FROM rent_payments rp
      JOIN tenants t ON rp.tenant_id = t.id
      JOIN houses h ON rp.house_id = h.id
      WHERE 1=1
    `;

    const params = [];

    if (house_id) {
      query += ' AND rp.house_id = ?';
      params.push(house_id);
    }

    if (tenant_id) {
      query += ' AND rp.tenant_id = ?';
      params.push(tenant_id);
    }

    if (month && year) {
      query += ' AND strftime("%m", rp.due_date) = ? AND strftime("%Y", rp.due_date) = ?';
      params.push(month.padStart(2, '0'), year);
    } else if (year) {
      query += ' AND strftime("%Y", rp.due_date) = ?';
      params.push(year);
    }

    if (status === 'pending') {
      query += ' AND rp.is_fully_paid = 0';
    } else if (status === 'paid') {
      query += ' AND rp.is_fully_paid = 1';
    }

    query += ' ORDER BY rp.due_date DESC';

    const payments = db.prepare(query).all(...params);

    // Parse additions JSON
    payments.forEach(p => {
      p.additions = JSON.parse(p.additions || '[]');
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/pending - Get all pending payments
router.get('/pending', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT rp.*, t.name as tenant_name, t.phone as tenant_phone, h.house_number,
        (rp.due_amount - rp.paid_amount) as pending_amount,
        julianday('now') - julianday(rp.due_date) as days_overdue
      FROM rent_payments rp
      JOIN tenants t ON rp.tenant_id = t.id
      JOIN houses h ON rp.house_id = h.id
      WHERE rp.is_fully_paid = 0
      ORDER BY rp.due_date ASC
    `).all();

    res.json(payments);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// GET /api/tenants/:id/pending - Get consolidated pending for tenant
router.get('/tenant/:id/pending', (req, res) => {
  try {
    const pendingPayments = db.prepare(`
      SELECT rp.*, h.house_number,
        (rp.due_amount - rp.paid_amount) as pending_amount,
        (SELECT json_group_array(json_object('id', ra.id, 'source_type', ra.source_type, 'amount', ra.amount, 'description', ra.description))
         FROM rent_additions ra WHERE ra.rent_payment_id = rp.id) as additions
      FROM rent_payments rp
      JOIN houses h ON rp.house_id = h.id
      WHERE rp.tenant_id = ? AND rp.is_fully_paid = 0
      ORDER BY rp.due_date ASC
    `).all(req.params.id);

    pendingPayments.forEach(p => {
      p.additions = JSON.parse(p.additions || '[]');
    });

    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.due_amount - p.paid_amount), 0);

    res.json({
      payments: pendingPayments,
      totalPending
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// POST /api/payments - Record a payment
router.post('/', (req, res) => {
  try {
    const { tenant_id, house_id, amount, payment_method, payment_date, notes } = req.body;

    if (!tenant_id || !amount) {
      return res.status(400).json({ error: 'Tenant ID and amount are required' });
    }

    // Get the oldest unpaid rent payment for this tenant
    let rentPayment = db.prepare(`
      SELECT * FROM rent_payments
      WHERE tenant_id = ? AND is_fully_paid = 0
      ORDER BY due_date ASC
      LIMIT 1
    `).get(tenant_id);

    // If no existing payment record, create one for current month
    if (!rentPayment) {
      const house = db.prepare('SELECT rent_amount FROM houses WHERE id = ?').get(house_id);
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);

      const result = db.prepare(`
        INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount)
        VALUES (?, ?, ?, ?)
      `).run(tenant_id, house_id, dueDate.toISOString().split('T')[0], house.rent_amount);

      rentPayment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(result.lastInsertRowid);
    }

    let remainingAmount = amount;
    const paymentDateValue = payment_date || new Date().toISOString().split('T')[0];
    const updatedPayments = [];

    // Apply payment to oldest unpaid payments first
    while (remainingAmount > 0) {
      const currentPayment = db.prepare(`
        SELECT * FROM rent_payments
        WHERE tenant_id = ? AND is_fully_paid = 0
        ORDER BY due_date ASC
        LIMIT 1
      `).get(tenant_id);

      if (!currentPayment) break;

      const pendingForThis = currentPayment.due_amount - currentPayment.paid_amount;
      const amountToApply = Math.min(remainingAmount, pendingForThis);

      const newPaidAmount = currentPayment.paid_amount + amountToApply;
      const isFullyPaid = newPaidAmount >= currentPayment.due_amount ? 1 : 0;

      db.prepare(`
        UPDATE rent_payments
        SET paid_amount = ?, payment_date = ?, payment_method = ?, is_fully_paid = ?, notes = COALESCE(notes || '; ', '') || ?
        WHERE id = ?
      `).run(newPaidAmount, paymentDateValue, payment_method, isFullyPaid, notes || '', currentPayment.id);

      updatedPayments.push({
        id: currentPayment.id,
        due_date: currentPayment.due_date,
        amount_applied: amountToApply
      });

      remainingAmount -= amountToApply;
    }

    // If there's remaining amount, it's an overpayment (advance)
    if (remainingAmount > 0) {
      // Create next month's payment record and apply advance
      const tenant = db.prepare('SELECT house_id FROM tenants WHERE id = ?').get(tenant_id);
      const house = db.prepare('SELECT rent_amount FROM houses WHERE id = ?').get(tenant.house_id);

      const lastPayment = db.prepare(`
        SELECT due_date FROM rent_payments
        WHERE tenant_id = ?
        ORDER BY due_date DESC
        LIMIT 1
      `).get(tenant_id);

      const lastDueDate = new Date(lastPayment.due_date);
      const nextDueDate = new Date(lastDueDate.getFullYear(), lastDueDate.getMonth() + 1, 10);

      const result = db.prepare(`
        INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount, paid_amount, payment_date, payment_method, is_fully_paid, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tenant_id,
        tenant.house_id,
        nextDueDate.toISOString().split('T')[0],
        house.rent_amount,
        remainingAmount,
        paymentDateValue,
        payment_method,
        remainingAmount >= house.rent_amount ? 1 : 0,
        'Advance payment'
      );

      updatedPayments.push({
        id: result.lastInsertRowid,
        due_date: nextDueDate.toISOString().split('T')[0],
        amount_applied: remainingAmount,
        is_advance: true
      });
    }

    res.json({
      message: 'Payment recorded successfully',
      totalApplied: amount,
      updatedPayments
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// PUT /api/payments/:id - Update payment
router.put('/:id', (req, res) => {
  try {
    const { paid_amount, payment_date, payment_method, notes } = req.body;

    const existingPayment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(req.params.id);

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const newPaidAmount = paid_amount ?? existingPayment.paid_amount;
    const isFullyPaid = newPaidAmount >= existingPayment.due_amount ? 1 : 0;

    db.prepare(`
      UPDATE rent_payments
      SET paid_amount = ?, payment_date = ?, payment_method = ?, is_fully_paid = ?, notes = ?
      WHERE id = ?
    `).run(
      newPaidAmount,
      payment_date ?? existingPayment.payment_date,
      payment_method ?? existingPayment.payment_method,
      isFullyPaid,
      notes ?? existingPayment.notes,
      req.params.id
    );

    const updatedPayment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(req.params.id);

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// POST /api/payments/generate-monthly - Generate monthly rent payments for all current tenants
router.post('/generate-monthly', (req, res) => {
  try {
    const { month, year } = req.body;

    const targetDate = new Date(year, month - 1, 10);
    const dueDateStr = targetDate.toISOString().split('T')[0];

    // Get all current tenants
    const currentTenants = db.prepare(`
      SELECT t.id as tenant_id, t.house_id, h.rent_amount
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.is_current = 1
    `).all();

    let created = 0;
    let skipped = 0;

    for (const tenant of currentTenants) {
      // Check if payment already exists for this month
      const existing = db.prepare(`
        SELECT id FROM rent_payments
        WHERE tenant_id = ? AND strftime('%Y-%m', due_date) = ?
      `).get(tenant.tenant_id, `${year}-${String(month).padStart(2, '0')}`);

      if (existing) {
        skipped++;
        continue;
      }

      db.prepare(`
        INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount)
        VALUES (?, ?, ?, ?)
      `).run(tenant.tenant_id, tenant.house_id, dueDateStr, tenant.rent_amount);

      created++;
    }

    res.json({
      message: `Monthly payments generated`,
      created,
      skipped
    });
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    res.status(500).json({ error: 'Failed to generate monthly payments' });
  }
});

// POST /api/payments/generate-current-month - Manually generate rent for current month
router.post('/generate-current-month', (req, res) => {
  try {
    const result = generateCurrentMonthRent();
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    res.json({
      message: `Rent generation complete for ${currentMonth}`,
      created: result.created,
      skipped: result.skipped,
      details: `${result.created} new rent record(s) created, ${result.skipped} already existed`
    });
  } catch (error) {
    console.error('Error generating current month rent:', error);
    res.status(500).json({ error: 'Failed to generate current month rent records' });
  }
});

// POST /api/payments/backfill-missing - Manually trigger backfill of missing rent records
router.post('/backfill-missing', (req, res) => {
  try {
    const result = generateMissingRentRecords();
    res.json({
      message: 'Backfill complete',
      created: result.created,
      skipped: result.skipped,
      tenantsProcessed: result.tenants
    });
  } catch (error) {
    console.error('Error during backfill:', error);
    res.status(500).json({ error: 'Failed to backfill missing rent records' });
  }
});

export default router;
