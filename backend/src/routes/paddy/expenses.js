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
    
    // Add worker and field names
    const workers = db.prepare('SELECT id, name FROM paddy_workers WHERE is_active = 1').all();
    const fields = db.prepare('SELECT id, name FROM paddy_fields WHERE is_active = 1').all();
    const workerMap = {};
    const fieldMap = {};
    workers.forEach(w => workerMap[w.id] = w.name);
    fields.forEach(f => fieldMap[f.id] = f.name);
    
    const result = expenses.map(e => ({
      ...e,
      worker_name: e.worker_id ? workerMap[e.worker_id] : null,
      field_name: fieldMap[e.field_id] || null
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/paddy/expenses/categories - List all custom expense categories
router.get('/categories', (req, res) => {
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='paddy_expense_categories'").get();
    if (!tableExists) {
      db.prepare(`CREATE TABLE IF NOT EXISTS paddy_expense_categories (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        label_tamil TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
      return res.json([]);
    }
    const categories = db.prepare('SELECT * FROM paddy_expense_categories WHERE is_active = 1 ORDER BY label').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

// POST /api/paddy/expenses/categories - Add new expense category
router.post('/categories', (req, res) => {
  try {
    const { value, label, label_tamil } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='paddy_expense_categories'").get();
    if (!tableExists) {
      db.prepare(`CREATE TABLE IF NOT EXISTS paddy_expense_categories (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        label_tamil TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
    }

    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE LOWER(value) = LOWER(?)').get(value);
    if (existing) {
      db.prepare('UPDATE paddy_expense_categories SET is_active = 1, label = ?, label_tamil = ? WHERE id = ?').run(label, label_tamil || null, existing.id);
      const updated = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(existing.id);
      return res.status(201).json(updated);
    }

    const result = db.prepare('INSERT INTO paddy_expense_categories (value, label, label_tamil) VALUES (?, ?, ?)').run(value, label, label_tamil || null);
    const newCategory = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ error: 'Failed to create expense category' });
  }
});

// PUT /api/paddy/expenses/categories/:id - Update expense category
router.put('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { value, label, label_tamil } = req.body;

    db.prepare('UPDATE paddy_expense_categories SET value = ?, label = ?, label_tamil = ? WHERE id = ?').run(
      value || existing.value,
      label || existing.label,
      label_tamil ?? existing.label_tamil,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

// DELETE /api/paddy/expenses/categories/:id - Soft delete expense category
router.delete('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.prepare('UPDATE paddy_expense_categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({ error: 'Failed to delete expense category' });
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

// POST /api/paddy/expenses - Split total amount across all fields OR direct to single field
router.post('/', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      sequence_number,
      total_amount,
      amount,
      expense_date,
      worker_id,
      notes
    } = req.body;

    if (!year || !crop_number || !category || !expense_date) {
      return res.status(400).json({ error: 'Year, crop number, category, and date are required' });
    }

    // Check if this is a direct expense to a single field (e.g., patta_nel)
    if (field_id && amount && !total_amount) {
      // Direct expense - no split
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required for direct expenses' });
      }

      const insertStmt = db.prepare(`
        INSERT INTO paddy_expenses (field_id, year, crop_number, category, sequence_number, amount, expense_date, worker_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        field_id,
        year,
        crop_number,
        category,
        sequence_number || null,
        amount,
        expense_date,
        null, // No worker for direct expenses like patta_nel
        notes || null
      );

      const newExpense = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(result.lastInsertRowid);
      const field = db.prepare('SELECT name FROM paddy_fields WHERE id = ?').get(field_id);

      res.status(201).json({
        message: `Direct expense added to ${field?.name || 'field'}`,
        amount: amount,
        expenses: [{ ...newExpense, field_name: field?.name }]
      });
      return;
    }

    // Default behavior: split across all fields
    if (!total_amount) {
      return res.status(400).json({ error: 'Total amount is required for split expenses' });
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
      notes,
      // Old values to find the group
      old_category,
      old_sequence_number,
      old_expense_date,
      old_year,
      old_crop_number
    } = req.body;

    if (!new_total_amount) {
      return res.status(400).json({ error: 'New total amount is required' });
    }

    // Use old values to find the group, or current values if not provided
    const searchCategory = old_category ?? category;
    const searchSequence = old_sequence_number ?? sequence_number;
    const searchDate = old_expense_date ?? expense_date;
    const searchYear = old_year ?? year;
    const searchCrop = old_crop_number ?? crop_number;

    // Find all related expenses using OLD values
    const relatedExpenses = db.prepare(`
      SELECT pe.*, pf.area_cents
      FROM paddy_expenses pe
      JOIN paddy_fields pf ON pe.field_id = pf.id
      WHERE pe.category = ?
        AND pe.sequence_number IS ?
        AND pe.expense_date = ?
        AND pe.year = ?
        AND pe.crop_number = ?
    `).all(searchCategory, searchSequence || null, searchDate, searchYear, searchCrop);

    if (relatedExpenses.length === 0) {
      return res.status(404).json({ error: 'No related expenses found' });
    }

    // Calculate total area from related expenses
    const totalAreaCents = relatedExpenses.reduce((sum, e) => sum + e.area_cents, 0);

    // Update all related expenses with new values
    const updateStmt = db.prepare(`
      UPDATE paddy_expenses
      SET year = ?, crop_number = ?, category = ?, sequence_number = ?, amount = ?, expense_date = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `);

    const updateExpenses = db.transaction(() => {
      for (const expense of relatedExpenses) {
        const newAmount = Math.round((new_total_amount / totalAreaCents * expense.area_cents) * 100) / 100;
        updateStmt.run(
          year ?? expense.year,
          crop_number ?? expense.crop_number,
          category ?? expense.category,
          sequence_number ?? expense.sequence_number,
          newAmount,
          expense_date ?? expense.expense_date,
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
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update grouped expenses', details: error.message });
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

// GET /api/paddy/expenses/categories - List all custom expense categories
router.get('/categories', (req, res) => {
  try {
    // Check if table exists, create if not
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='paddy_expense_categories'").get();
    if (!tableExists) {
      db.prepare(`CREATE TABLE IF NOT EXISTS paddy_expense_categories (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        label_tamil TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
      return res.json([]);
    }
    const categories = db.prepare('SELECT * FROM paddy_expense_categories WHERE is_active = 1 ORDER BY label').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
});

// POST /api/paddy/expenses/categories - Add new expense category
router.post('/categories', (req, res) => {
  try {
    const { value, label, label_tamil } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    // Check if table exists, create if not
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='paddy_expense_categories'").get();
    if (!tableExists) {
      db.prepare(`CREATE TABLE IF NOT EXISTS paddy_expense_categories (
        id INTEGER PRIMARY KEY,
        value TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        label_tamil TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
    }

    // Check case-insensitively for existing - update if found
    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE LOWER(value) = LOWER(?)').get(value);
    if (existing) {
      db.prepare('UPDATE paddy_expense_categories SET is_active = 1, label = ?, label_tamil = ? WHERE id = ?').run(label, label_tamil || null, existing.id);
      const updated = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(existing.id);
      return res.status(201).json(updated);
    }

    const result = db.prepare('INSERT INTO paddy_expense_categories (value, label, label_tamil) VALUES (?, ?, ?)').run(value, label, label_tamil || null);
    const newCategory = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ error: 'Failed to create expense category' });
  }
});

// PUT /api/paddy/expenses/categories/:id - Update expense category
router.put('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { value, label, label_tamil } = req.body;

    db.prepare('UPDATE paddy_expense_categories SET value = ?, label = ?, label_tamil = ? WHERE id = ?').run(
      value || existing.value,
      label || existing.label,
      label_tamil ?? existing.label_tamil,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({ error: 'Failed to update expense category' });
  }
});

// DELETE /api/paddy/expenses/categories/:id - Soft delete expense category
router.delete('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expense_categories WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.prepare('UPDATE paddy_expense_categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({ error: 'Failed to delete expense category' });
  }
});

export default router;
