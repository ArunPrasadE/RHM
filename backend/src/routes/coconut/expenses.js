import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/expenses
router.get('/', (req, res) => {
  try {
    const { grove_id, year, category } = req.query;

    let query = 'SELECT * FROM coconut_expenses WHERE 1=1';
    const params = [];

    if (grove_id) {
      query += ' AND grove_id = ?';
      params.push(grove_id);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
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

// GET /api/coconut/expenses/:id
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/coconut/expenses - Split total amount across all groves by area
router.post('/', (req, res) => {
  try {
    const { year, category, total_amount, expense_date, worker_id, notes } = req.body;

    if (!year || !category || !total_amount || !expense_date) {
      return res.status(400).json({ error: 'Year, category, total amount, and date are required' });
    }

    // Get all active groves with their areas
    const groves = db.prepare('SELECT id, name, area_cents FROM coconut_groves WHERE is_active = 1').all();

    if (groves.length === 0) {
      return res.status(400).json({ error: 'No active groves found' });
    }

    // Calculate total area
    const totalAreaCents = groves.reduce((sum, grove) => sum + grove.area_cents, 0);

    // Insert expense for each grove with proportional amount
    const insertStmt = db.prepare(`
      INSERT INTO coconut_expenses (grove_id, year, category, amount, expense_date, worker_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const createdExpenses = [];
    const insertExpenses = db.transaction(() => {
      for (const grove of groves) {
        // Calculate proportional amount: total_amount / total_area * grove_area
        const groveAmount = Math.round((total_amount / totalAreaCents * grove.area_cents) * 100) / 100;

        const result = insertStmt.run(
          grove.id,
          year,
          category,
          groveAmount,
          expense_date,
          worker_id || null,
          notes || null
        );

        const newExpense = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(result.lastInsertRowid);
        createdExpenses.push({ ...newExpense, grove_name: grove.name });
      }
    });

    insertExpenses();

    res.status(201).json({
      message: `Expense split across ${groves.length} groves`,
      total_amount: total_amount,
      expenses: createdExpenses
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/coconut/expenses/grouped - Update all expenses in a group (re-split total)
router.put('/grouped', (req, res) => {
  try {
    const {
      category,
      expense_date,
      year,
      new_total_amount,
      worker_id,
      notes
    } = req.body;

    if (!category || !expense_date || !year || !new_total_amount) {
      return res.status(400).json({ error: 'Category, date, year, and new total amount are required' });
    }

    // Find all related expenses
    const relatedExpenses = db.prepare(`
      SELECT ce.*, cg.area_cents
      FROM coconut_expenses ce
      JOIN coconut_groves cg ON ce.grove_id = cg.id
      WHERE ce.category = ?
        AND ce.expense_date = ?
        AND ce.year = ?
    `).all(category, expense_date, year);

    if (relatedExpenses.length === 0) {
      return res.status(404).json({ error: 'No related expenses found' });
    }

    // Calculate total area from related expenses
    const totalAreaCents = relatedExpenses.reduce((sum, e) => sum + e.area_cents, 0);

    // Update all related expenses with new proportional amounts
    const updateStmt = db.prepare(`
      UPDATE coconut_expenses
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

// PUT /api/coconut/expenses/:id
router.put('/:id', (req, res) => {
  try {
    const { grove_id, year, category, amount, expense_date, worker_id, notes } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare(`
      UPDATE coconut_expenses
      SET grove_id = ?, year = ?, category = ?, amount = ?, expense_date = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `).run(
      grove_id || existing.grove_id,
      year || existing.year,
      category || existing.category,
      amount || existing.amount,
      expense_date || existing.expense_date,
      worker_id ?? existing.worker_id,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/coconut/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM coconut_expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/coconut/expenses/categories - List all custom expense categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM coconut_expense_categories WHERE is_active = 1 ORDER BY label').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

// POST /api/coconut/expenses/categories - Add new expense category
router.post('/categories', (req, res) => {
  try {
    const { value, label, label_tamil } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    const existing = db.prepare('SELECT * FROM coconut_expense_categories WHERE value = ?').get(value);
    if (existing) {
      if (existing.is_active === 0) {
        db.prepare('UPDATE coconut_expense_categories SET is_active = 1 WHERE id = ?').run(existing.id);
        const updated = db.prepare('SELECT * FROM coconut_expense_categories WHERE id = ?').get(existing.id);
        return res.status(201).json(updated);
      }
      return res.status(400).json({ error: 'Category with this value already exists' });
    }

    const result = db.prepare('INSERT INTO coconut_expense_categories (value, label, label_tamil) VALUES (?, ?, ?)').run(value, label, label_tamil || null);
    const newCategory = db.prepare('SELECT * FROM coconut_expense_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ error: 'Failed to create expense category' });
  }
});

// PUT /api/coconut/expenses/categories/:id - Update expense category
router.put('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { value, label, label_tamil } = req.body;

    db.prepare('UPDATE coconut_expense_categories SET value = ?, label = ?, label_tamil = ? WHERE id = ?').run(
      value || existing.value,
      label || existing.label,
      label_tamil ?? existing.label_tamil,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_expense_categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

// DELETE /api/coconut/expenses/categories/:id - Soft delete expense category
router.delete('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.prepare('UPDATE coconut_expense_categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({ error: 'Failed to delete expense category' });
  }
});

export default router;
