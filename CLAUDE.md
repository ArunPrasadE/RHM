# CLAUDE.md - Project Context for Claude Code

## Project Overview

RHM (Rental House Management) is a self-hosted web application for managing 11 rental houses in Tamil Nadu, India. Single admin user with JWT authentication, responsive mobile-first design.

**Current Status:** Production-ready, deployed on Raspberry Pi with remote access via Tailscale.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite with better-sqlite3
- **Auth**: JWT + bcrypt
- **PDF**: jsPDF + jspdf-autotable
- **Backup**: Google Drive API
- **Production Server**: Nginx (reverse proxy) + PM2 (process manager)
- **Remote Access**: Tailscale (mesh VPN)

## Project Structure

```
/home/pi/RHM/
├── install.sh          # Install all dependencies
├── start.sh            # Start development servers
├── start-prod.sh       # Deploy to production
├── requirements.txt    # Dependencies documentation
├── SETUP.md            # Setup guide
├── WORKFLOW.md         # Development workflow guide
├── CLAUDE.md           # This file
├── backend/
│   ├── src/
│   │   ├── index.js    # Server entry point
│   │   ├── config/     # Database setup
│   │   ├── middleware/ # JWT auth
│   │   ├── routes/     # API endpoints
│   │   └── utils/      # Helpers (PDF, WhatsApp, notifications)
│   ├── database/       # SQLite database file (gitignored)
│   ├── package.json
│   └── .env            # Environment config
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   ├── context/    # React context (AuthContext)
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # API client, formatters
│   ├── dist/           # Production build (generated)
│   └── package.json
└── nginx/
    └── rhm.conf        # Nginx configuration
```

## Quick Commands

### Installation
```bash
./install.sh            # Install all dependencies
```

### Development
```bash
./start.sh              # Start both servers (frontend :5173, backend :3001)
```

### Production
```bash
./start-prod.sh         # Build and deploy to production
pm2 stop rhm-backend    # Stop backend
pm2 restart rhm-backend # Restart backend
sudo systemctl stop nginx   # Stop nginx
sudo systemctl restart nginx # Restart nginx
```

### Tailscale
```bash
tailscale status        # Check connection
tailscale ip -4         # Get Tailscale IP
sudo tailscale up       # Reconnect
```

## Access URLs

| Environment | URL | Access From |
|-------------|-----|-------------|
| Development | http://localhost:5173 | Local only |
| Production (LAN) | http://192.168.31.253 | Home network |
| Production (Tailscale) | http://100.95.218.115 | Anywhere |

## Default Login

- Username: `admin`
- Password: `admin123`

## Current Data Status

| Table | Records |
|-------|---------|
| Houses | 11 |
| Tenants | 11 |
| Rent Payments | 11 |
| Expenses | 0 |
| Maintenance | 0 |

**Note:** Database files (`*.db`) are gitignored and not tracked by version control.

## Key Business Logic

### Rent Due Dates
- Rent is due on the 10th of each month
- Overdue notifications show 7 days AFTER due date (17th onwards)

### New Tenant Rent Calculation
- First rent is always due **next month** after move-in (not move-in month)
- If move-in date is **after 15th**: First rent = **half amount**
- If move-in date is **on or before 15th**: First rent = **full amount**
- Subsequent months are always full rent

### Rent Payment Scheduler
- Cron job runs on **1st of every month at 00:05 AM IST**
- Automatically generates rent payment records for all current tenants
- Backfills missing records on server startup
- Located in `backend/src/utils/scheduler.js`

### Tenant Management
- **Move Out**: Marks tenant as past tenant, preserves all records
- **Delete**: Permanently removes tenant and all related payment records

### Bill Splitting
- **Motor bill**: Auto-splits among houses with same `motor_service_number`
- **Water bill**: User selects houses, amount splits equally
- **Maintenance**: Can be shared among multiple houses, adds to rent

### Expense Types
- `eb_bill` - Electricity bill (per house)
- `house_tax` - Property tax (per house)
- `motor_bill` - Shared motor connection
- `water_bill` - Shared water connection

## Database

### Tables
`users`, `houses`, `tenants`, `rent_payments`, `expenses`, `maintenance_expenses`, `maintenance_expense_houses`, `rent_additions`, `backup_log`

### Files (gitignored)
- `backend/database/rhm.db` - Production database
- `backend/database/rhm_test.db` - Test database
- `backend/database/backups/` - Backup files

## API Endpoints

Base URL: `/api`

All endpoints except `/auth/login` require `Authorization: Bearer <token>` header.

## Important Files

- `backend/.env` - Environment config (JWT secret, DB path, admin credentials)
- `backend/src/config/db.js` - Database schema and initialization
- `frontend/src/utils/api.js` - API client with auth handling
- `frontend/src/context/AuthContext.jsx` - Authentication state
- `nginx/rhm.conf` - Nginx reverse proxy configuration

## Deployment

### Target Platform
- Raspberry Pi 3 Model B
- Raspbian Bookworm (Linux)
- Node.js v18.20.4

### Production Architecture
```
Internet/Tailscale → Nginx (port 80)
                        ├── /* → Static files (frontend/dist)
                        └── /api/* → Backend (port 3001) → SQLite
```

### Remote Access
- **Tailscale**: Mesh VPN for secure access from anywhere
- Tailscale IP: `100.95.218.115`
- No port forwarding required
- Works from any network

### Process Management
- **PM2**: Keeps backend running, auto-restart on crash
- **Nginx**: Serves frontend, proxies API requests
- **systemd**: Auto-start services on boot

### Auto-Start on Boot
```bash
pm2 save
pm2 startup
sudo systemctl enable nginx
```

## Documentation

- `SETUP.md` - Complete setup guide for development and production
- `WORKFLOW.md` - Git workflow and Tailscale remote access
- `requirements.txt` - All dependencies and installation steps

## Git Branches

- `main` - Production-ready code
- `internet-access` - Remote access features (Tailscale)
- `remote-access` - Earlier remote access work
