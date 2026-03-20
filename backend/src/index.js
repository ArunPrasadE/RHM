import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import db, { initializeDatabase } from './config/db.js';
import { initializeScheduler } from './utils/scheduler.js';
import authRoutes from './routes/auth.js';
import housesRoutes from './routes/houses.js';
import tenantsRoutes from './routes/tenants.js';
import paymentsRoutes from './routes/payments.js';
import expensesRoutes from './routes/expenses.js';
import maintenanceRoutes from './routes/maintenance.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';
import backupRoutes from './routes/backup.js';

// Paddy module routes
import paddyFieldsRoutes from './routes/paddy/fields.js';
import paddyWorkersRoutes from './routes/paddy/workers.js';
import paddyExpensesRoutes from './routes/paddy/expenses.js';
import paddyIncomeRoutes from './routes/paddy/income.js';
import paddyReportsRoutes from './routes/paddy/reports.js';

// Coconut module routes
import coconutGrovesRoutes from './routes/coconut/groves.js';
import coconutWorkersRoutes from './routes/coconut/workers.js';
import coconutExpensesRoutes from './routes/coconut/expenses.js';
import coconutIncomeRoutes from './routes/coconut/income.js';
import coconutReportsRoutes from './routes/coconut/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Initialize scheduler for automatic rent record generation
initializeScheduler();

// API Routes - Rental Module
app.use('/api/auth', authRoutes);
app.use('/api/houses', housesRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/backup', backupRoutes);

// API Routes - Paddy Module
app.use('/api/paddy/fields', paddyFieldsRoutes);
app.use('/api/paddy/workers', paddyWorkersRoutes);
app.use('/api/paddy/expenses', paddyExpensesRoutes);
app.use('/api/paddy/income', paddyIncomeRoutes);
app.use('/api/paddy/reports', paddyReportsRoutes);

// API Routes - Coconut Module
app.use('/api/coconut/groves', coconutGrovesRoutes);
app.use('/api/coconut/workers', coconutWorkersRoutes);
app.use('/api/coconut/expenses', coconutExpensesRoutes);
app.use('/api/coconut/income', coconutIncomeRoutes);
app.use('/api/coconut/reports', coconutReportsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`RHM Backend running on port ${PORT}`);
});
