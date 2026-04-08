import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/paddy/expenses - List expenses with filters
router.get('/', (req, res) => {
  try {
    const { field_id, year, crop_number, category } = req.query;

    let query = 'SELECT * FROM paddy_expenses WHERE 1=1';
    const params = [];

    if (field_id) {
      query += ' AND field_id = ?';
      params.push(field_id);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    if (crop_number) {
      query += ' AND crop_number = ?';
      params.push(crop_number);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY expense_date DESC';

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/paddy/expenses/:id
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/paddy/expenses - Split total amount across all fields by area
router.post('/', (req, res) => {
  try {
    const {
      year,
      crop_number,
      category,
      sequence_number,
      total_amount,
      expense_date,
      worker_id,
      notes
    } = req.body;

    if (!year || !crop_number || !category || !total_amount || !expense_date) {
      return res.status(400).json({ error: 'Year, crop number, category, total amount, and date are required' });
    }

    // Get all active fields with their areas
    const fields = db.prepare('SELECT id, name, area_cents FROM paddy_fields WHERE is_active = 1').all();

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No active fields found' });
    }

    // Calculate total area
    const totalAreaCents = fields.reduce((sum, field) => sum + field.area_cents, 0);

    // Insert expense for each field with proportional amount
    const insertStmt = db.prepare(`
      INSERT INTO paddy_expenses (field_id, year, crop_number, category, sequence_number, amount, expense_date, worker_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdExpenses = [];
    const insertExpenses = db.transaction(() => {
      for (const field of fields) {
        // Calculate proportional amount: total_amount / total_area * field_area
        const fieldAmount = Math.round((total_amount / totalAreaCents * field.area_cents) * 100) / 100;

        const result = insertStmt.run(
          field.id,
          year,
          crop_number,
          category,
          sequence_number || null,
          fieldAmount,
          expense_date,
          worker_id || null,
          notes || null
        );

        const newExpense = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(result.lastInsertRowid);
        createdExpenses.push({ ...newExpense, field_name: field.name });
      }
    });

    insertExpenses();

    res.status(201).json({
      message: `Expense split across ${fields.length} fields`,
      total_amount: total_amount,
      expenses: createdExpenses
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/paddy/expenses/grouped - Update all expenses in a group (re-split total)
router.put('/grouped', (req, res) => {
  try {
    const {
      category,
      sequence_number,
      expense_date,
      year,
      crop_number,
      new_total_amount,
      worker_id,
      notes
    } = req.body;

    if (!category || !expense_date || !year || !crop_number || !new_total_amount) {
      return res.status(400).json({ error: 'Category, date, year, crop number, and new total amount are required' });
    }

    // Find all related expenses
    const relatedExpenses = db.prepare(`
      SELECT pe.*, pf.area_cents
      FROM paddy_expenses pe
      JOIN paddy_fields pf ON pe.field_id = pf.id
      WHERE pe.category = ?
        AND pe.sequence_number IS ?
        AND pe.expense_date = ?
        AND pe.year = ?
        AND pe.crop_number = ?
    `).all(category, sequence_number || null, expense_date, year, crop_number);

    if (relatedExpenses.length === 0) {
      return res.status(404).json({ error: 'No related expenses found' });
    }

    // Calculate total area from related expenses
    const totalAreaCents = relatedExpenses.reduce((sum, e) => sum + e.area_cents, 0);

    // Update all related expenses with new proportional amounts
    const updateStmt = db.prepare(`
      UPDATE paddy_expenses
      SET amount = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `);

    const updateExpenses = db.transaction(() => {
      for (const expense of relatedExpenses) {
        const newAmount = Math.round((new_total_amount / totalAreaCents * expense.area_cents) * 100) / 100;
        updateStmt.run(
          newAmount,
          worker_id ?? expense.worker_id,
          notes ?? expense.notes,
          expense.id
        );
      }
    });

    updateExpenses();

    res.json({
      message: `Updated ${relatedExpenses.length} expense records`,
      new_total_amount
    });
  } catch (error) {
    console.error('Error updating grouped expenses:', error);
    res.status(500).json({ error: 'Failed to update grouped expenses' });
  }
});

// PUT /api/paddy/expenses/:id
router.put('/:id', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      sequence_number,
      amount,
      expense_date,
      worker_id,
      notes
    } = req.body;

    console.log('Update expense request:', { id: req.params.id, body: req.body }); // Debug log

    const existing = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate required fields
    if (!field_id || !year || !crop_number || !category || !amount || !expense_date) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['field_id', 'year', 'crop_number', 'category', 'amount', 'expense_date']
      });
    }

    // Use nullish coalescing for proper handling of all values including 0
    db.prepare(`
      UPDATE paddy_expenses
      SET field_id = ?, year = ?, crop_number = ?, category = ?, sequence_number = ?, amount = ?, expense_date = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `).run(
      field_id ?? existing.field_id,
      year ?? existing.year,
      crop_number ?? existing.crop_number,
      category ?? existing.category,
      sequence_number ?? existing.sequence_number,
      amount ?? existing.amount,
      expense_date ?? existing.expense_date,
      worker_id ?? existing.worker_id,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);
    console.log('Expense updated successfully:', updated); // Debug log
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    console.error('Error stack:', error.stack); // More detailed error
    res.status(500).json({ error: 'Failed to update expense', details: error.message });
  }
});

// DELETE /api/paddy/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM paddy_expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
