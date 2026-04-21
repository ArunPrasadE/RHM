import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/rhm.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    -- Users (single admin)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Houses
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY,
      house_number TEXT NOT NULL,
      address TEXT,
      type TEXT,
      size_sqft INTEGER,
      eb_service_number TEXT,
      motor_service_number TEXT,
      google_maps_url TEXT,
      rent_amount REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tenants
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY,
      house_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      id_proof_number TEXT,
      occupation TEXT,
      household_members INTEGER,
      move_in_date DATE NOT NULL,
      move_out_date DATE,
      advance_amount REAL,
      advance_date DATE,
      is_current INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Rent Payments
    CREATE TABLE IF NOT EXISTS rent_payments (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      house_id INTEGER NOT NULL,
      due_date DATE NOT NULL,
      due_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_date DATE,
      payment_method TEXT,
      is_fully_paid INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Expenses (EB bill, house tax)
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY,
      house_id INTEGER NOT NULL,
      expense_type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date DATE,
      paid_date DATE,
      is_paid INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Maintenance Expenses
    CREATE TABLE IF NOT EXISTS maintenance_expenses (
      id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      is_shared INTEGER DEFAULT 0,
      add_to_rent INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Junction table for maintenance expense -> houses
    CREATE TABLE IF NOT EXISTS maintenance_expense_houses (
      id INTEGER PRIMARY KEY,
      maintenance_expense_id INTEGER NOT NULL,
      house_id INTEGER NOT NULL,
      split_amount REAL NOT NULL,
      FOREIGN KEY (maintenance_expense_id) REFERENCES maintenance_expenses(id),
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Rent Additions (tracks motor bill, water bill, maintenance added to rent)
    CREATE TABLE IF NOT EXISTS rent_additions (
      id INTEGER PRIMARY KEY,
      rent_payment_id INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (rent_payment_id) REFERENCES rent_payments(id)
    );

    -- Backup Log
    CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY,
      backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      file_name TEXT,
      google_drive_id TEXT
    );

    -- =====================
    -- PADDY FIELD MANAGEMENT
    -- =====================

    -- Paddy Fields
    CREATE TABLE IF NOT EXISTS paddy_fields (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      area_cents INTEGER NOT NULL,
      gps_latitude REAL,
      gps_longitude REAL,
      google_maps_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Paddy Workers
    CREATE TABLE IF NOT EXISTS paddy_workers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      place TEXT,
      mobile TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Paddy Expenses
    CREATE TABLE IF NOT EXISTS paddy_expenses (
      id INTEGER PRIMARY KEY,
      field_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      crop_number INTEGER NOT NULL,
      category TEXT NOT NULL,
      sequence_number INTEGER,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      worker_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_id) REFERENCES paddy_fields(id),
      FOREIGN KEY (worker_id) REFERENCES paddy_workers(id)
    );

    -- Paddy Income
    CREATE TABLE IF NOT EXISTS paddy_income (
      id INTEGER PRIMARY KEY,
      field_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      crop_number INTEGER NOT NULL,
      category TEXT NOT NULL,
      yield_kg REAL,
      kottai_count REAL,
      rate_per_kottai REAL,
      amount REAL NOT NULL,
      income_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_id) REFERENCES paddy_fields(id)
    );

    -- Paddy Expense Categories (custom categories)
    CREATE TABLE IF NOT EXISTS paddy_expense_categories (
      id INTEGER PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      label_tamil TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================
    -- COCONUT GROVE MANAGEMENT
    -- ========================

    -- Coconut Groves
    CREATE TABLE IF NOT EXISTS coconut_groves (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      area_cents INTEGER NOT NULL,
      gps_latitude REAL,
      gps_longitude REAL,
      google_maps_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coconut Workers
    CREATE TABLE IF NOT EXISTS coconut_workers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      place TEXT,
      mobile TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coconut Expenses
    CREATE TABLE IF NOT EXISTS coconut_expenses (
      id INTEGER PRIMARY KEY,
      grove_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      worker_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grove_id) REFERENCES coconut_groves(id),
      FOREIGN KEY (worker_id) REFERENCES coconut_workers(id)
    );

    -- Coconut Income
    CREATE TABLE IF NOT EXISTS coconut_income (
      id INTEGER PRIMARY KEY,
      grove_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      category TEXT NOT NULL,
      unit_type TEXT NOT NULL DEFAULT 'kg',
      quantity_kg REAL,
      quantity_count INTEGER,
      rate_per_unit REAL NOT NULL,
      amount REAL NOT NULL,
      income_date DATE NOT NULL,
      sale_time TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grove_id) REFERENCES coconut_groves(id)
    );

    -- Coconut Expense Categories (custom categories)
    CREATE TABLE IF NOT EXISTS coconut_expense_categories (
      id INTEGER PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      label_tamil TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ========================
    -- WORKER CATEGORIES
    -- ========================

    -- Paddy Worker Categories
    CREATE TABLE IF NOT EXISTS paddy_worker_categories (
      id INTEGER PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      label_tamil TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coconut Worker Categories
    CREATE TABLE IF NOT EXISTS coconut_worker_categories (
      id INTEGER PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      label_tamil TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get(process.env.ADMIN_USERNAME || 'admin');

  if (!adminExists) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
      process.env.ADMIN_USERNAME || 'admin',
      passwordHash
    );
    console.log('Default admin user created');
  }

  // Seed default paddy worker categories
  const paddyCategoriesExist = db.prepare('SELECT COUNT(*) as count FROM paddy_worker_categories').get();
  if (paddyCategoriesExist.count === 0) {
    const paddyCategories = [
      { value: 'supervisor', label: 'Supervisor', label_tamil: 'மேற்பார்வையாளர்' },
      { value: 'harvester', label: 'Harvester', label_tamil: 'அறுவடையாளர்' },
      { value: 'tractor_manager', label: 'Tractor Manager', label_tamil: 'டிராக்டர் ஓட்டி' },
      { value: 'ploughing_manager', label: 'Ploughing Manager', label_tamil: 'உழவர்' }
    ];
    const insertPaddyCategory = db.prepare('INSERT INTO paddy_worker_categories (value, label, label_tamil) VALUES (?, ?, ?)');
    for (const cat of paddyCategories) {
      insertPaddyCategory.run(cat.value, cat.label, cat.label_tamil);
    }
    console.log('Default paddy worker categories created');
  }

  // Seed default coconut worker categories
  const coconutCategoriesExist = db.prepare('SELECT COUNT(*) as count FROM coconut_worker_categories').get();
  if (coconutCategoriesExist.count === 0) {
    const coconutCategories = [
      { value: 'thoppu_velai', label: 'Thoppu Velai', label_tamil: 'தோப்பு வேலை' },
      { value: 'thengai_vettu_virpanai', label: 'Thengai Vettu & Virpanai', label_tamil: 'தேங்காய் வெட்டு மற்றும் விற்பனை' },
      { value: 'pazhaya_maram_vettu', label: 'Pazhaya Maram Vettu', label_tamil: 'பழைய மரம் வெட்டு' }
    ];
    const insertCoconutCategory = db.prepare('INSERT INTO coconut_worker_categories (value, label, label_tamil) VALUES (?, ?, ?)');
    for (const cat of coconutCategories) {
      insertCoconutCategory.run(cat.value, cat.label, cat.label_tamil);
    }
    console.log('Default coconut worker categories created');
  }

  console.log('Database initialized successfully');
}

export default db;
