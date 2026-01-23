# CLAUDE.md - Project Context for Claude Code

## Project Overview

RHM (Rental House Management) is a self-hosted web application for managing 11 rental houses in Tamil Nadu, India. Single admin user with JWT authentication, responsive mobile-first design.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (port 5173)
- **Backend**: Node.js + Express.js (port 3001)
- **Database**: SQLite with better-sqlite3
- **Auth**: JWT + bcrypt
- **PDF**: jsPDF + jspdf-autotable
- **Backup**: Google Drive API

## Project Structure

```
/mnt/d/RHM_App/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── index.js   # Server entry point
│   │   ├── config/    # Database setup
│   │   ├── middleware/# JWT auth
│   │   ├── routes/    # API endpoints
│   │   └── utils/     # Helpers (PDF, WhatsApp, notifications)
│   └── database/      # SQLite database file
├── frontend/          # React SPA
│   └── src/
│       ├── components/# Reusable UI components
│       ├── pages/     # Route pages
│       ├── context/   # React context (AuthContext)
│       ├── hooks/     # Custom hooks
│       └── utils/     # API client, formatters
└── README.md
```

## Quick Commands

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Development
cd backend && npm run dev    # Backend on :3001
cd frontend && npm run dev   # Frontend on :5173

# Production build
cd frontend && npm run build
cd backend && NODE_ENV=production npm start
```

## Default Login

- Username: `admin`
- Password: `admin123`

## Key Business Logic

### Rent Due Dates
- Rent is due on the 10th of each month
- Overdue notifications show 7 days AFTER due date (17th onwards)

### Bill Splitting
- **Motor bill**: Auto-splits among houses with same `motor_service_number`
- **Water bill**: User selects houses, amount splits equally
- **Maintenance**: Can be shared among multiple houses, adds to rent

### Expense Types
- `eb_bill` - Electricity bill (per house)
- `house_tax` - Property tax (per house)
- `motor_bill` - Shared motor connection
- `water_bill` - Shared water connection

## Database Tables

Main tables: `users`, `houses`, `tenants`, `rent_payments`, `expenses`, `maintenance_expenses`, `maintenance_expense_houses`, `rent_additions`, `backup_log`

## API Base URL

Development: `http://localhost:3001/api`

All endpoints except `/auth/login` require `Authorization: Bearer <token>` header.

## Important Files

- `backend/.env` - Environment config (JWT secret, DB path, admin credentials)
- `backend/src/config/db.js` - Database schema and initialization
- `frontend/src/utils/api.js` - API client with auth handling
- `frontend/src/context/AuthContext.jsx` - Authentication state

## Deployment Target

Raspberry Pi with Cloudflare Tunnel for remote access. Use PM2 for process management.
