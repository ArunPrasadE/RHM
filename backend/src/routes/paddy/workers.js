import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/paddy/workers - List all workers
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM paddy_workers WHERE is_active = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, name';

    const workers = db.prepare(query).all(...params);
    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET /api/paddy/workers/:id
router.get('/:id', (req, res) => {
  try {
    const worker = db.prepare('SELECT * FROM paddy_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// POST /api/paddy/workers
router.post('/', (req, res) => {
  try {
    const { name, category, place, mobile } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const result = db.prepare(`
      INSERT INTO paddy_workers (name, category, place, mobile)
      VALUES (?, ?, ?, ?)
    `).run(name, category, place, mobile);

    const newWorker = db.prepare('SELECT * FROM paddy_workers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newWorker);
  } catch (error) {
    console.error('Error creating worker:', error);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

// PUT /api/paddy/workers/:id
router.put('/:id', (req, res) => {
  try {
    const { name, category, place, mobile } = req.body;

    const existing = db.prepare('SELECT * FROM paddy_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare(`
      UPDATE paddy_workers
      SET name = ?, category = ?, place = ?, mobile = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      category || existing.category,
      place ?? existing.place,
      mobile ?? existing.mobile,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_workers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// DELETE /api/paddy/workers/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare('UPDATE paddy_workers SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

export default router;
