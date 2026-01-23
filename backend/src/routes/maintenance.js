import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/maintenance - List maintenance expenses
router.get('/', (req, res) => {
  try {
    const { year, house_id } = req.query;

    let query = `
      SELECT me.*,
        (SELECT json_group_array(json_object('house_id', meh.house_id, 'house_number', h.house_number, 'split_amount', meh.split_amount))
         FROM maintenance_expense_houses meh
         JOIN houses h ON meh.house_id = h.id
         WHERE meh.maintenance_expense_id = me.id) as houses
      FROM maintenance_expenses me
      WHERE 1=1
    `;

    const params = [];

    if (year) {
      query += ' AND strftime("%Y", me.expense_date) = ?';
      params.push(year);
    }

    if (house_id) {
      query += ' AND me.id IN (SELECT maintenance_expense_id FROM maintenance_expense_houses WHERE house_id = ?)';
      params.push(house_id);
    }

    query += ' ORDER BY me.expense_date DESC';

    const expenses = db.prepare(query).all(...params);

    // Parse houses JSON
    expenses.forEach(e => {
      e.houses = JSON.parse(e.houses || '[]');
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching maintenance expenses:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance expenses' });
  }
});

// GET /api/maintenance/:id - Get single maintenance expense
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM maintenance_expenses WHERE id = ?').get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Maintenance expense not found' });
    }

    const houses = db.prepare(`
      SELECT meh.*, h.house_number
      FROM maintenance_expense_houses meh
      JOIN houses h ON meh.house_id = h.id
      WHERE meh.maintenance_expense_id = ?
    `).all(req.params.id);

    res.json({ ...expense, houses });
  } catch (error) {
    console.error('Error fetching maintenance expense:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance expense' });
  }
});

// POST /api/maintenance - Add maintenance expense
router.post('/', (req, res) => {
  try {
    const { description, amount, expense_date, house_ids, add_to_rent } = req.body;

    if (!description || !amount || !expense_date || !house_ids || !Array.isArray(house_ids) || house_ids.length === 0) {
      return res.status(400).json({ error: 'Description, amount, expense date, and house IDs are required' });
    }

    const isShared = house_ids.length > 1 ? 1 : 0;
    const splitAmount = amount / house_ids.length;

    // Create maintenance expense
    const result = db.prepare(`
      INSERT INTO maintenance_expenses (description, amount, expense_date, is_shared, add_to_rent)
      VALUES (?, ?, ?, ?, ?)
    `).run(description, amount, expense_date, isShared, add_to_rent ? 1 : 0);

    const maintenanceExpenseId = result.lastInsertRowid;

    // Create house associations
    const createdAssociations = [];

    for (const house_id of house_ids) {
      const house = db.prepare('SELECT house_number FROM houses WHERE id = ?').get(house_id);

      if (!house) continue;

      db.prepare(`
        INSERT INTO maintenance_expense_houses (maintenance_expense_id, house_id, split_amount)
        VALUES (?, ?, ?)
      `).run(maintenanceExpenseId, house_id, splitAmount);

      createdAssociations.push({
        house_id,
        house_number: house.house_number,
        split_amount: splitAmount
      });

      // Add to rent if requested
      if (add_to_rent) {
        const currentTenant = db.prepare(`
          SELECT id FROM tenants WHERE house_id = ? AND is_current = 1
        `).get(house_id);

        if (currentTenant) {
          let rentPayment = db.prepare(`
            SELECT * FROM rent_payments
            WHERE tenant_id = ? AND is_fully_paid = 0
            ORDER BY due_date ASC
            LIMIT 1
          `).get(currentTenant.id);

          if (rentPayment) {
            db.prepare(`
              UPDATE rent_payments SET due_amount = due_amount + ? WHERE id = ?
            `).run(splitAmount, rentPayment.id);

            db.prepare(`
              INSERT INTO rent_additions (rent_payment_id, source_type, source_id, amount, description)
              VALUES (?, 'maintenance', ?, ?, ?)
            `).run(rentPayment.id, maintenanceExpenseId, splitAmount, description);
          }
        }
      }
    }

    const newExpense = db.prepare('SELECT * FROM maintenance_expenses WHERE id = ?').get(maintenanceExpenseId);

    res.status(201).json({
      ...newExpense,
      houses: createdAssociations
    });
  } catch (error) {
    console.error('Error creating maintenance expense:', error);
    res.status(500).json({ error: 'Failed to create maintenance expense' });
  }
});

// PUT /api/maintenance/:id - Update maintenance expense
router.put('/:id', (req, res) => {
  try {
    const { description, amount, expense_date } = req.body;

    const existingExpense = db.prepare('SELECT * FROM maintenance_expenses WHERE id = ?').get(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Maintenance expense not found' });
    }

    db.prepare(`
      UPDATE maintenance_expenses
      SET description = ?, amount = ?, expense_date = ?
      WHERE id = ?
    `).run(
      description || existingExpense.description,
      amount || existingExpense.amount,
      expense_date || existingExpense.expense_date,
      req.params.id
    );

    // Update split amounts if amount changed
    if (amount && amount !== existingExpense.amount) {
      const houseCount = db.prepare(`
        SELECT COUNT(*) as count FROM maintenance_expense_houses WHERE maintenance_expense_id = ?
      `).get(req.params.id).count;

      const newSplitAmount = amount / houseCount;

      db.prepare(`
        UPDATE maintenance_expense_houses SET split_amount = ? WHERE maintenance_expense_id = ?
      `).run(newSplitAmount, req.params.id);
    }

    const updatedExpense = db.prepare('SELECT * FROM maintenance_expenses WHERE id = ?').get(req.params.id);
    const houses = db.prepare(`
      SELECT meh.*, h.house_number
      FROM maintenance_expense_houses meh
      JOIN houses h ON meh.house_id = h.id
      WHERE meh.maintenance_expense_id = ?
    `).all(req.params.id);

    res.json({ ...updatedExpense, houses });
  } catch (error) {
    console.error('Error updating maintenance expense:', error);
    res.status(500).json({ error: 'Failed to update maintenance expense' });
  }
});

// DELETE /api/maintenance/:id - Delete maintenance expense
router.delete('/:id', (req, res) => {
  try {
    const existingExpense = db.prepare('SELECT * FROM maintenance_expenses WHERE id = ?').get(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Maintenance expense not found' });
    }

    // Remove rent additions linked to this maintenance expense
    db.prepare(`DELETE FROM rent_additions WHERE source_type = 'maintenance' AND source_id = ?`).run(req.params.id);

    // Remove house associations
    db.prepare('DELETE FROM maintenance_expense_houses WHERE maintenance_expense_id = ?').run(req.params.id);

    // Remove the expense
    db.prepare('DELETE FROM maintenance_expenses WHERE id = ?').run(req.params.id);

    res.json({ message: 'Maintenance expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance expense:', error);
    res.status(500).json({ error: 'Failed to delete maintenance expense' });
  }
});

export default router;
