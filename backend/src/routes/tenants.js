import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/tenants - List all tenants
router.get('/', (req, res) => {
  try {
    const { current_only } = req.query;

    let query = `
      SELECT t.*, h.house_number, h.address, h.rent_amount as current_rent
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
    `;

    if (current_only === 'true') {
      query += ' WHERE t.is_current = 1';
    }

    query += ' ORDER BY t.is_current DESC, t.move_in_date DESC';

    const tenants = db.prepare(query).all();

    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET /api/tenants/:id - Get tenant details with payment history
router.get('/:id', (req, res) => {
  try {
    const tenant = db.prepare(`
      SELECT t.*, h.house_number, h.address, h.rent_amount as current_rent
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get payment history
    const payments = db.prepare(`
      SELECT rp.*,
        (SELECT json_group_array(json_object('id', ra.id, 'source_type', ra.source_type, 'amount', ra.amount, 'description', ra.description))
         FROM rent_additions ra WHERE ra.rent_payment_id = rp.id) as additions
      FROM rent_payments rp
      WHERE rp.tenant_id = ?
      ORDER BY rp.due_date DESC
    `).all(req.params.id);

    // Parse additions JSON
    payments.forEach(p => {
      p.additions = JSON.parse(p.additions || '[]');
    });

    // Calculate total pending
    const pendingResult = db.prepare(`
      SELECT SUM(due_amount - paid_amount) as total_pending
      FROM rent_payments
      WHERE tenant_id = ? AND is_fully_paid = 0
    `).get(req.params.id);

    res.json({
      ...tenant,
      payments,
      totalPending: pendingResult?.total_pending || 0
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// POST /api/tenants - Add new tenant
router.post('/', (req, res) => {
  try {
    const {
      house_id,
      name,
      phone,
      id_proof_number,
      occupation,
      household_members,
      move_in_date,
      advance_amount,
      advance_date
    } = req.body;

    if (!house_id || !name || !move_in_date) {
      return res.status(400).json({ error: 'House ID, name, and move-in date are required' });
    }

    // Check if house exists and is active
    const house = db.prepare('SELECT * FROM houses WHERE id = ? AND is_active = 1').get(house_id);

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Check if house already has a current tenant
    const existingTenant = db.prepare('SELECT * FROM tenants WHERE house_id = ? AND is_current = 1').get(house_id);

    if (existingTenant) {
      return res.status(400).json({ error: 'House already has a current tenant. Move out the existing tenant first.' });
    }

    const result = db.prepare(`
      INSERT INTO tenants (house_id, name, phone, id_proof_number, occupation, household_members, move_in_date, advance_amount, advance_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(house_id, name, phone, id_proof_number, occupation, household_members, move_in_date, advance_amount, advance_date);

    const newTenant = db.prepare(`
      SELECT t.*, h.house_number
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    // Only create rent payment if due date is current month or earlier (not future)
    const moveInDate = new Date(move_in_date);
    const dueDate = new Date(moveInDate.getFullYear(), moveInDate.getMonth() + 1, 10);
    const now = new Date();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    if (dueDate <= currentMonthEnd) {
      // If move-in is after 15th, first month rent is half
      const firstRentAmount = moveInDate.getDate() > 15
        ? Math.round(house.rent_amount / 2)
        : house.rent_amount;

      db.prepare(`
        INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount)
        VALUES (?, ?, ?, ?)
      `).run(newTenant.id, house_id, dueDate.toISOString().split('T')[0], firstRentAmount);
    }
    // Future rent payments will be created by the scheduler on the 1st of each month

    res.status(201).json(newTenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT /api/tenants/:id - Update tenant
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      phone,
      id_proof_number,
      occupation,
      household_members,
      advance_amount,
      advance_date
    } = req.body;

    const existingTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    db.prepare(`
      UPDATE tenants
      SET name = ?, phone = ?, id_proof_number = ?, occupation = ?, household_members = ?, advance_amount = ?, advance_date = ?
      WHERE id = ?
    `).run(
      name || existingTenant.name,
      phone ?? existingTenant.phone,
      id_proof_number ?? existingTenant.id_proof_number,
      occupation ?? existingTenant.occupation,
      household_members ?? existingTenant.household_members,
      advance_amount ?? existingTenant.advance_amount,
      advance_date ?? existingTenant.advance_date,
      req.params.id
    );

    const updatedTenant = db.prepare(`
      SELECT t.*, h.house_number
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE /api/tenants/:id - Permanently delete tenant and all records
router.delete('/:id', (req, res) => {
  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Delete in order: rent_additions -> rent_payments -> tenant
    // First get all rent payment IDs for this tenant
    const paymentIds = db.prepare('SELECT id FROM rent_payments WHERE tenant_id = ?').all(req.params.id);

    // Delete rent additions for these payments
    for (const payment of paymentIds) {
      db.prepare('DELETE FROM rent_additions WHERE rent_payment_id = ?').run(payment.id);
    }

    // Delete rent payments
    db.prepare('DELETE FROM rent_payments WHERE tenant_id = ?').run(req.params.id);

    // Delete tenant
    db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id);

    res.json({ message: 'Tenant and all related records permanently deleted' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// PUT /api/tenants/:id/move-out - Mark tenant as moved out
router.put('/:id/move-out', (req, res) => {
  try {
    const { move_out_date } = req.body;

    if (!move_out_date) {
      return res.status(400).json({ error: 'Move-out date is required' });
    }

    const existingTenant = db.prepare('SELECT * FROM tenants WHERE id = ? AND is_current = 1').get(req.params.id);

    if (!existingTenant) {
      return res.status(404).json({ error: 'Current tenant not found' });
    }

    // Check for pending payments
    const pendingPayments = db.prepare(`
      SELECT SUM(due_amount - paid_amount) as total_pending
      FROM rent_payments
      WHERE tenant_id = ? AND is_fully_paid = 0
    `).get(req.params.id);

    db.prepare(`
      UPDATE tenants
      SET is_current = 0, move_out_date = ?
      WHERE id = ?
    `).run(move_out_date, req.params.id);

    const updatedTenant = db.prepare(`
      SELECT t.*, h.house_number
      FROM tenants t
      JOIN houses h ON t.house_id = h.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json({
      ...updatedTenant,
      pendingAmount: pendingPayments?.total_pending || 0,
      message: pendingPayments?.total_pending > 0 ? 'Tenant moved out with pending payments' : 'Tenant moved out successfully'
    });
  } catch (error) {
    console.error('Error moving out tenant:', error);
    res.status(500).json({ error: 'Failed to move out tenant' });
  }
});

export default router;
