import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/income
router.get('/', (req, res) => {
  try {
    // Migration - add new columns if they don't exist (ignore errors if already exist)
    const migrate = () => {
      try {
        const tableInfo = db.prepare("PRAGMA table_info(coconut_income)").all();
        const colNames = tableInfo.map(c => c.name);
        console.log('Current columns:', colNames);
        
        if (!colNames.includes('unit_type')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN unit_type TEXT DEFAULT 'kg'").run();
        }
        if (!colNames.includes('quantity_count')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN quantity_count INTEGER").run();
        }
        if (!colNames.includes('rate_per_unit')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN rate_per_unit REAL").run();
        }
        if (!colNames.includes('sale_time')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN sale_time TEXT").run();
        }
        console.log('Migration completed, now columns:', db.prepare("PRAGMA table_info(coconut_income)").all().map(c => c.name));
      } catch (e) {
        console.log('Migration error:', e.message);
      }
    };
    
    // Try migration
    migrate();

    const { grove_id, year, category } = req.query;

    let query = 'SELECT * FROM coconut_income WHERE 1=1';
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

    query += ' ORDER BY income_date DESC';

    const incomes = db.prepare(query).all(...params);
    // Handle old data - convert to new format
    const formattedIncomes = incomes.map(inc => ({
      ...inc,
      unit_type: inc.unit_type || 'kg',
      rate_per_unit: inc.rate_per_unit || inc.rate_per_kg || 0,
      quantity_count: inc.quantity_count || null
    }));
    res.json(formattedIncomes);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// GET /api/coconut/income/:id
router.get('/:id', (req, res) => {
  try {
    const income = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!income) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({
      ...income,
      unit_type: income.unit_type || 'kg',
      rate_per_unit: income.rate_per_unit || income.rate_per_kg || 0
    });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/coconut/income
router.post('/', (req, res) => {
  try {
    const { grove_id, year, category, unit_type, quantity_kg, quantity_count, rate_per_unit, amount, income_date, sale_time, notes } = req.body;
    console.log('POST income payload:', JSON.stringify(req.body));

    // Ensure columns exist (migration on POST)
    const migrate = () => {
      try {
        const tableInfo = db.prepare("PRAGMA table_info(coconut_income)").all();
        const colNames = tableInfo.map(c => c.name);
        if (!colNames.includes('unit_type')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN unit_type TEXT DEFAULT 'kg'").run();
        }
        if (!colNames.includes('quantity_count')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN quantity_count INTEGER").run();
        }
        if (!colNames.includes('rate_per_unit')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN rate_per_unit REAL").run();
        }
        if (!colNames.includes('sale_time')) {
          db.prepare("ALTER TABLE coconut_income ADD COLUMN sale_time TEXT").run();
        }
      } catch (e) {
        // Ignore migration errors
      }
    };
    migrate();

    // Insert with all fields including rate_per_kg for old table
    const result = db.prepare(`
      INSERT INTO coconut_income (grove_id, year, category, unit_type, quantity_kg, quantity_count, rate_per_unit, rate_per_kg, amount, income_date, sale_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(grove_id, year, category, unit_type || 'kg', quantity_kg || null, quantity_count || null, rate_per_unit, rate_per_unit, amount, income_date, sale_time || null, notes || null);

    const newIncome = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(result.lastInsertRowid);
    console.log('Income saved:', newIncome);
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create income', details: error.message });
  }
});

// PUT /api/coconut/income/:id
router.put('/:id', (req, res) => {
  try {
    const { grove_id, year, category, unit_type, quantity_kg, quantity_count, rate_per_unit, amount, income_date, sale_time, notes } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    // Handle old column names
    const finalRatePerUnit = rate_per_unit || existing.rate_per_unit || existing.rate_per_kg;

    db.prepare(`
      UPDATE coconut_income
      SET grove_id = ?, year = ?, category = ?, unit_type = ?, quantity_kg = ?, quantity_count = ?, rate_per_unit = ?, amount = ?, income_date = ?, sale_time = ?, notes = ?
      WHERE id = ?
    `).run(
      grove_id || existing.grove_id,
      year || existing.year,
      category || existing.category,
      unit_type || existing.unit_type || 'kg',
      quantity_kg ?? existing.quantity_kg,
      quantity_count ?? existing.quantity_count,
      finalRatePerUnit,
      amount || existing.amount,
      income_date || existing.income_date,
      sale_time ?? existing.sale_time,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /api/coconut/income/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.prepare('DELETE FROM coconut_income WHERE id = ?').run(req.params.id);
    res.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;
