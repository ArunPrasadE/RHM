import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/workers
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM coconut_workers WHERE is_active = 1';
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

// GET /api/coconut/workers/:id
router.get('/:id', (req, res) => {
  try {
    const worker = db.prepare('SELECT * FROM coconut_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// POST /api/coconut/workers
router.post('/', (req, res) => {
  try {
    const { name, category, place, mobile } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const result = db.prepare(`
      INSERT INTO coconut_workers (name, category, place, mobile)
      VALUES (?, ?, ?, ?)
    `).run(name, category, place, mobile);

    const newWorker = db.prepare('SELECT * FROM coconut_workers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newWorker);
  } catch (error) {
    console.error('Error creating worker:', error);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

// PUT /api/coconut/workers/:id
router.put('/:id', (req, res) => {
  try {
    const { name, category, place, mobile } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare(`
      UPDATE coconut_workers
      SET name = ?, category = ?, place = ?, mobile = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      category || existing.category,
      place ?? existing.place,
      mobile ?? existing.mobile,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_workers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// DELETE /api/coconut/workers/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_workers WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare('UPDATE coconut_workers SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

// ========================
// WORKER CATEGORIES
// ========================

// GET /api/coconut/workers/categories - List all categories
router.get('/categories/list', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM coconut_worker_categories WHERE is_active = 1 ORDER BY label').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/coconut/workers/categories - Add new category
router.post('/categories', (req, res) => {
  try {
    const { value, label, label_tamil } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    // Check if value already exists
    const existing = db.prepare('SELECT * FROM coconut_worker_categories WHERE value = ?').get(value);
    if (existing) {
      if (existing.is_active === 0) {
        // Reactivate existing category
        db.prepare('UPDATE coconut_worker_categories SET is_active = 1, label = ?, label_tamil = ? WHERE id = ?')
          .run(label, label_tamil || null, existing.id);
        const updated = db.prepare('SELECT * FROM coconut_worker_categories WHERE id = ?').get(existing.id);
        return res.status(201).json(updated);
      }
      return res.status(400).json({ error: 'Category with this value already exists' });
    }

    const result = db.prepare(`
      INSERT INTO coconut_worker_categories (value, label, label_tamil)
      VALUES (?, ?, ?)
    `).run(value, label, label_tamil || null);

    const newCategory = db.prepare('SELECT * FROM coconut_worker_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/coconut/workers/categories/:id - Update category
router.put('/categories/:id', (req, res) => {
  try {
    const { label, label_tamil } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_worker_categories WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.prepare(`
      UPDATE coconut_worker_categories
      SET label = ?, label_tamil = ?
      WHERE id = ?
    `).run(
      label || existing.label,
      label_tamil ?? existing.label_tamil,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_worker_categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/coconut/workers/categories/:id - Soft delete category
router.delete('/categories/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_worker_categories WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.prepare('UPDATE coconut_worker_categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
