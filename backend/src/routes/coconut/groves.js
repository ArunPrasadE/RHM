import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/groves - List all groves
router.get('/', (req, res) => {
  try {
    const groves = db.prepare(`
      SELECT * FROM coconut_groves
      WHERE is_active = 1
      ORDER BY name
    `).all();

    res.json(groves);
  } catch (error) {
    console.error('Error fetching coconut groves:', error);
    res.status(500).json({ error: 'Failed to fetch coconut groves' });
  }
});

// GET /api/coconut/groves/:id
router.get('/:id', (req, res) => {
  try {
    const grove = db.prepare(`
      SELECT * FROM coconut_groves
      WHERE id = ? AND is_active = 1
    `).get(req.params.id);

    if (!grove) {
      return res.status(404).json({ error: 'Grove not found' });
    }

    res.json(grove);
  } catch (error) {
    console.error('Error fetching grove:', error);
    res.status(500).json({ error: 'Failed to fetch grove' });
  }
});

// POST /api/coconut/groves
router.post('/', (req, res) => {
  try {
    const { name, area_cents, gps_latitude, gps_longitude, google_maps_url } = req.body;

    if (!name || !area_cents) {
      return res.status(400).json({ error: 'Name and area are required' });
    }

    const result = db.prepare(`
      INSERT INTO coconut_groves (name, area_cents, gps_latitude, gps_longitude, google_maps_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, area_cents, gps_latitude, gps_longitude, google_maps_url);

    const newGrove = db.prepare('SELECT * FROM coconut_groves WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newGrove);
  } catch (error) {
    console.error('Error creating grove:', error);
    res.status(500).json({ error: 'Failed to create grove' });
  }
});

// PUT /api/coconut/groves/:id
router.put('/:id', (req, res) => {
  try {
    const { name, area_cents, gps_latitude, gps_longitude, google_maps_url } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_groves WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Grove not found' });
    }

    db.prepare(`
      UPDATE coconut_groves
      SET name = ?, area_cents = ?, gps_latitude = ?, gps_longitude = ?, google_maps_url = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      area_cents || existing.area_cents,
      gps_latitude ?? existing.gps_latitude,
      gps_longitude ?? existing.gps_longitude,
      google_maps_url ?? existing.google_maps_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_groves WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating grove:', error);
    res.status(500).json({ error: 'Failed to update grove' });
  }
});

// DELETE /api/coconut/groves/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_groves WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Grove not found' });
    }

    db.prepare('UPDATE coconut_groves SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Grove deleted successfully' });
  } catch (error) {
    console.error('Error deleting grove:', error);
    res.status(500).json({ error: 'Failed to delete grove' });
  }
});

export default router;
