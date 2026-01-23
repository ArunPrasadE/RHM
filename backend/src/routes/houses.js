import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/houses - List all houses
router.get('/', (req, res) => {
  try {
    const houses = db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM tenants t WHERE t.house_id = h.id AND t.is_current = 1) as has_tenant,
        (SELECT t.name FROM tenants t WHERE t.house_id = h.id AND t.is_current = 1) as current_tenant_name,
        (SELECT t.id FROM tenants t WHERE t.house_id = h.id AND t.is_current = 1) as current_tenant_id
      FROM houses h
      WHERE h.is_active = 1
      ORDER BY h.house_number
    `).all();

    res.json(houses);
  } catch (error) {
    console.error('Error fetching houses:', error);
    res.status(500).json({ error: 'Failed to fetch houses' });
  }
});

// GET /api/houses/:id - Get house details with current tenant
router.get('/:id', (req, res) => {
  try {
    const house = db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM tenants t WHERE t.house_id = h.id AND t.is_current = 1) as has_tenant
      FROM houses h
      WHERE h.id = ? AND h.is_active = 1
    `).get(req.params.id);

    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Get current tenant if exists
    const currentTenant = db.prepare(`
      SELECT * FROM tenants
      WHERE house_id = ? AND is_current = 1
    `).get(req.params.id);

    // Get recent expenses
    const recentExpenses = db.prepare(`
      SELECT * FROM expenses
      WHERE house_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id);

    // Get maintenance expenses for this house
    const maintenanceExpenses = db.prepare(`
      SELECT me.*, meh.split_amount
      FROM maintenance_expenses me
      JOIN maintenance_expense_houses meh ON me.id = meh.maintenance_expense_id
      WHERE meh.house_id = ?
      ORDER BY me.expense_date DESC
      LIMIT 10
    `).all(req.params.id);

    res.json({
      ...house,
      currentTenant,
      recentExpenses,
      maintenanceExpenses
    });
  } catch (error) {
    console.error('Error fetching house:', error);
    res.status(500).json({ error: 'Failed to fetch house' });
  }
});

// POST /api/houses - Add new house
router.post('/', (req, res) => {
  try {
    const {
      house_number,
      address,
      type,
      size_sqft,
      eb_service_number,
      motor_service_number,
      google_maps_url,
      rent_amount
    } = req.body;

    if (!house_number || !rent_amount) {
      return res.status(400).json({ error: 'House number and rent amount are required' });
    }

    const result = db.prepare(`
      INSERT INTO houses (house_number, address, type, size_sqft, eb_service_number, motor_service_number, google_maps_url, rent_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(house_number, address, type, size_sqft, eb_service_number, motor_service_number, google_maps_url, rent_amount);

    const newHouse = db.prepare('SELECT * FROM houses WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newHouse);
  } catch (error) {
    console.error('Error creating house:', error);
    res.status(500).json({ error: 'Failed to create house' });
  }
});

// PUT /api/houses/:id - Update house
router.put('/:id', (req, res) => {
  try {
    const {
      house_number,
      address,
      type,
      size_sqft,
      eb_service_number,
      motor_service_number,
      google_maps_url,
      rent_amount
    } = req.body;

    const existingHouse = db.prepare('SELECT * FROM houses WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existingHouse) {
      return res.status(404).json({ error: 'House not found' });
    }

    db.prepare(`
      UPDATE houses
      SET house_number = ?, address = ?, type = ?, size_sqft = ?, eb_service_number = ?, motor_service_number = ?, google_maps_url = ?, rent_amount = ?
      WHERE id = ?
    `).run(
      house_number || existingHouse.house_number,
      address ?? existingHouse.address,
      type ?? existingHouse.type,
      size_sqft ?? existingHouse.size_sqft,
      eb_service_number ?? existingHouse.eb_service_number,
      motor_service_number ?? existingHouse.motor_service_number,
      google_maps_url ?? existingHouse.google_maps_url,
      rent_amount || existingHouse.rent_amount,
      req.params.id
    );

    const updatedHouse = db.prepare('SELECT * FROM houses WHERE id = ?').get(req.params.id);

    res.json(updatedHouse);
  } catch (error) {
    console.error('Error updating house:', error);
    res.status(500).json({ error: 'Failed to update house' });
  }
});

// DELETE /api/houses/:id - Soft delete house
router.delete('/:id', (req, res) => {
  try {
    const existingHouse = db.prepare('SELECT * FROM houses WHERE id = ? AND is_active = 1').get(req.params.id);

    if (!existingHouse) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Check if there's a current tenant
    const currentTenant = db.prepare('SELECT * FROM tenants WHERE house_id = ? AND is_current = 1').get(req.params.id);

    if (currentTenant) {
      return res.status(400).json({ error: 'Cannot delete house with active tenant. Move out the tenant first.' });
    }

    db.prepare('UPDATE houses SET is_active = 0 WHERE id = ?').run(req.params.id);

    res.json({ message: 'House deleted successfully' });
  } catch (error) {
    console.error('Error deleting house:', error);
    res.status(500).json({ error: 'Failed to delete house' });
  }
});

// GET /api/houses/:id/tenants - Get tenant history for a house
router.get('/:id/tenants', (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT * FROM tenants
      WHERE house_id = ?
      ORDER BY move_in_date DESC
    `).all(req.params.id);

    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenant history:', error);
    res.status(500).json({ error: 'Failed to fetch tenant history' });
  }
});

export default router;
