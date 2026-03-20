import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/paddy/income - List income with filters
router.get('/', (req, res) => {
  try {
    const { field_id, year, crop_number, category } = req.query;

    let query = 'SELECT * FROM paddy_income WHERE 1=1';
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

    query += ' ORDER BY income_date DESC';

    const incomes = db.prepare(query).all(...params);
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// GET /api/paddy/income/:id
router.get('/:id', (req, res) => {
  try {
    const income = db.prepare('SELECT * FROM paddy_income WHERE id = ?').get(req.params.id);

    if (!income) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/paddy/income
router.post('/', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      yield_kg,
      kottai_count,
      rate_per_kottai,
      amount,
      income_date,
      notes
    } = req.body;

    if (!field_id || !year || !crop_number || !category || !amount || !income_date) {
      return res.status(400).json({ error: 'Field, year, crop number, category, amount, and date are required' });
    }

    const result = db.prepare(`
      INSERT INTO paddy_income (field_id, year, crop_number, category, yield_kg, kottai_count, rate_per_kottai, amount, income_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(field_id, year, crop_number, category, yield_kg, kottai_count, rate_per_kottai, amount, income_date, notes);

    const newIncome = db.prepare('SELECT * FROM paddy_income WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income' });
  }
});

// PUT /api/paddy/income/:id
router.put('/:id', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      yield_kg,
      kottai_count,
      rate_per_kottai,
      amount,
      income_date,
      notes
    } = req.body;

    const existing = db.prepare('SELECT * FROM paddy_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.prepare(`
      UPDATE paddy_income
      SET field_id = ?, year = ?, crop_number = ?, category = ?, yield_kg = ?, kottai_count = ?, rate_per_kottai = ?, amount = ?, income_date = ?, notes = ?
      WHERE id = ?
    `).run(
      field_id || existing.field_id,
      year || existing.year,
      crop_number || existing.crop_number,
      category || existing.category,
      yield_kg ?? existing.yield_kg,
      kottai_count ?? existing.kottai_count,
      rate_per_kottai ?? existing.rate_per_kottai,
      amount || existing.amount,
      income_date || existing.income_date,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_income WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /api/paddy/income/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.prepare('DELETE FROM paddy_income WHERE id = ?').run(req.params.id);
    res.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;
