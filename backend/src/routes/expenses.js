import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/expenses - List all expenses
router.get('/', (req, res) => {
  try {
    const { house_id, expense_type, status, year } = req.query;

    let query = `
      SELECT e.*, h.house_number
      FROM expenses e
      JOIN houses h ON e.house_id = h.id
      WHERE 1=1
    `;

    const params = [];

    if (house_id) {
      query += ' AND e.house_id = ?';
      params.push(house_id);
    }

    if (expense_type) {
      query += ' AND e.expense_type = ?';
      params.push(expense_type);
    }

    if (status === 'pending') {
      query += ' AND e.is_paid = 0';
    } else if (status === 'paid') {
      query += ' AND e.is_paid = 1';
    }

    if (year) {
      query += ' AND strftime("%Y", e.due_date) = ?';
      params.push(year);
    }

    query += ' ORDER BY e.due_date DESC';

    const expenses = db.prepare(query).all(...params);

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses/eb-bill - Add EB bill for a house
router.post('/eb-bill', (req, res) => {
  try {
    const { house_id, amount, due_date, notes } = req.body;

    if (!house_id || !amount) {
      return res.status(400).json({ error: 'House ID and amount are required' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (house_id, expense_type, amount, due_date, notes)
      VALUES (?, 'eb_bill', ?, ?, ?)
    `).run(house_id, amount, due_date, notes);

    const newExpense = db.prepare(`
      SELECT e.*, h.house_number
      FROM expenses e
      JOIN houses h ON e.house_id = h.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating EB bill:', error);
    res.status(500).json({ error: 'Failed to create EB bill' });
  }
});

// POST /api/expenses/house-tax - Add house tax
router.post('/house-tax', (req, res) => {
  try {
    const { house_id, amount, due_date, notes } = req.body;

    if (!house_id || !amount) {
      return res.status(400).json({ error: 'House ID and amount are required' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (house_id, expense_type, amount, due_date, notes)
      VALUES (?, 'house_tax', ?, ?, ?)
    `).run(house_id, amount, due_date, notes);

    const newExpense = db.prepare(`
      SELECT e.*, h.house_number
      FROM expenses e
      JOIN houses h ON e.house_id = h.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating house tax:', error);
    res.status(500).json({ error: 'Failed to create house tax' });
  }
});

// POST /api/expenses/motor-bill - Add motor bill (auto-splits among houses with same motor service number)
router.post('/motor-bill', (req, res) => {
  try {
    const { motor_service_number, amount, due_date, notes, add_to_rent } = req.body;

    if (!motor_service_number || !amount) {
      return res.status(400).json({ error: 'Motor service number and amount are required' });
    }

    // Find all houses with the same motor service number
    const houses = db.prepare(`
      SELECT id, house_number FROM houses
      WHERE motor_service_number = ? AND is_active = 1
    `).all(motor_service_number);

    if (houses.length === 0) {
      return res.status(404).json({ error: 'No houses found with this motor service number' });
    }

    const splitAmount = amount / houses.length;
    const createdExpenses = [];

    for (const house of houses) {
      const result = db.prepare(`
        INSERT INTO expenses (house_id, expense_type, amount, due_date, notes)
        VALUES (?, 'motor_bill', ?, ?, ?)
      `).run(house.id, splitAmount, due_date, notes);

      createdExpenses.push({
        id: result.lastInsertRowid,
        house_id: house.id,
        house_number: house.house_number,
        split_amount: splitAmount
      });

      // Add to rent if requested
      if (add_to_rent) {
        const currentTenant = db.prepare(`
          SELECT id FROM tenants WHERE house_id = ? AND is_current = 1
        `).get(house.id);

        if (currentTenant) {
          // Find the next unpaid rent payment or create one
          let rentPayment = db.prepare(`
            SELECT * FROM rent_payments
            WHERE tenant_id = ? AND is_fully_paid = 0
            ORDER BY due_date ASC
            LIMIT 1
          `).get(currentTenant.id);

          if (rentPayment) {
            // Add to existing payment
            db.prepare(`
              UPDATE rent_payments SET due_amount = due_amount + ? WHERE id = ?
            `).run(splitAmount, rentPayment.id);

            db.prepare(`
              INSERT INTO rent_additions (rent_payment_id, source_type, source_id, amount, description)
              VALUES (?, 'motor_bill', ?, ?, ?)
            `).run(rentPayment.id, result.lastInsertRowid, splitAmount, `Motor bill share`);
          }
        }
      }
    }

    res.status(201).json({
      message: 'Motor bill split successfully',
      totalAmount: amount,
      splitAmount,
      houses: createdExpenses
    });
  } catch (error) {
    console.error('Error creating motor bill:', error);
    res.status(500).json({ error: 'Failed to create motor bill' });
  }
});

// POST /api/expenses/water-bill - Add water bill (select houses to split)
router.post('/water-bill', (req, res) => {
  try {
    const { house_ids, amount, due_date, notes, add_to_rent } = req.body;

    if (!house_ids || !Array.isArray(house_ids) || house_ids.length === 0 || !amount) {
      return res.status(400).json({ error: 'House IDs array and amount are required' });
    }

    const splitAmount = amount / house_ids.length;
    const createdExpenses = [];

    for (const house_id of house_ids) {
      const house = db.prepare('SELECT house_number FROM houses WHERE id = ?').get(house_id);

      if (!house) continue;

      const result = db.prepare(`
        INSERT INTO expenses (house_id, expense_type, amount, due_date, notes)
        VALUES (?, 'water_bill', ?, ?, ?)
      `).run(house_id, splitAmount, due_date, notes);

      createdExpenses.push({
        id: result.lastInsertRowid,
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
              VALUES (?, 'water_bill', ?, ?, ?)
            `).run(rentPayment.id, result.lastInsertRowid, splitAmount, `Water bill share`);
          }
        }
      }
    }

    res.status(201).json({
      message: 'Water bill split successfully',
      totalAmount: amount,
      splitAmount,
      houses: createdExpenses
    });
  } catch (error) {
    console.error('Error creating water bill:', error);
    res.status(500).json({ error: 'Failed to create water bill' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', (req, res) => {
  try {
    const { amount, due_date, notes } = req.body;

    const existingExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare(`
      UPDATE expenses
      SET amount = ?, due_date = ?, notes = ?
      WHERE id = ?
    `).run(
      amount ?? existingExpense.amount,
      due_date ?? existingExpense.due_date,
      notes ?? existingExpense.notes,
      req.params.id
    );

    const updatedExpense = db.prepare(`
      SELECT e.*, h.house_number
      FROM expenses e
      JOIN houses h ON e.house_id = h.id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// PUT /api/expenses/:id/pay - Mark expense as paid
router.put('/:id/pay', (req, res) => {
  try {
    const { paid_date } = req.body;

    const existingExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare(`
      UPDATE expenses
      SET is_paid = 1, paid_date = ?
      WHERE id = ?
    `).run(paid_date || new Date().toISOString().split('T')[0], req.params.id);

    const updatedExpense = db.prepare(`
      SELECT e.*, h.house_number
      FROM expenses e
      JOIN houses h ON e.house_id = h.id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error marking expense as paid:', error);
    res.status(500).json({ error: 'Failed to mark expense as paid' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', (req, res) => {
  try {
    const existingExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Remove any rent additions linked to this expense
    db.prepare(`DELETE FROM rent_additions WHERE source_id = ? AND source_type = ?`).run(
      req.params.id,
      existingExpense.expense_type
    );

    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
