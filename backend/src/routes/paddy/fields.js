import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/paddy/fields - List all fields
router.get('/', (req, res) => {
  try {
    const fields = db.prepare(`
      SELECT * FROM paddy_fields
      WHERE is_active = 1
      ORDER BY name
    `).all();

    res.json(fields);
  } catch (error) {
    console.error('Error fetching paddy fields:', error);
    res.status(500).json({ error: 'Failed to fetch paddy fields' });
  }
});

// GET /api/paddy/fields/:id - Get field details
router.get('/:id', (req, res) => {
  try {
    const field = db.prepare(`
      SELECT * FROM paddy_fields
      WHERE id = ? AND is_active = 1
    `).get(req.params.id);

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json(field);
  } catch (error) {
    console.error('Error fetching field:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// POST /api/paddy/fields - Add new field
router.post('/', (req, res) => {
  try {
    const {
      name,
      area_cents,
      gps_latitude,
      gps_longitude,
      google_maps_url
    } = req.body;

    if (!name || !area_cents) {
      return res.status(400).json({ error: 'Name and area are required' });
    }

    const result = db.prepare(`
      INSERT INTO paddy_fields (name, area_cents, gps_latitude, gps_longitude, google_maps_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, area_cents, gps_latitude, gps_longitude, google_maps_url);

    const newField = db.prepare('SELECT * FROM paddy_fields WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newField);
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// PUT /api/paddy/fields/:id - Update field
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      area_cents,
      gps_latitude,
      gps_longitude,
      google_maps_url
    } = req.body;

    const existingField = db.prepare('SELECT * FROM paddy_fields WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existingField) {
      return res.status(404).json({ error: 'Field not found' });
    }

    db.prepare(`
      UPDATE paddy_fields
      SET name = ?, area_cents = ?, gps_latitude = ?, gps_longitude = ?, google_maps_url = ?
      WHERE id = ?
    `).run(
      name || existingField.name,
      area_cents || existingField.area_cents,
      gps_latitude ?? existingField.gps_latitude,
      gps_longitude ?? existingField.gps_longitude,
      google_maps_url ?? existingField.google_maps_url,
      req.params.id
    );

    const updatedField = db.prepare('SELECT * FROM paddy_fields WHERE id = ?').get(req.params.id);

    res.json(updatedField);
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// DELETE /api/paddy/fields/:id - Soft delete field
router.delete('/:id', (req, res) => {
  try {
    const existingField = db.prepare('SELECT * FROM paddy_fields WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existingField) {
      return res.status(404).json({ error: 'Field not found' });
    }

    db.prepare('UPDATE paddy_fields SET is_active = 0 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

export default router;
