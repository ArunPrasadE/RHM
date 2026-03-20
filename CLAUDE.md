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

This project uses **git worktrees** to separate production and development:

```
/home/pi/RHM/           ← PRODUCTION (always on main branch)
├── install.sh          # Install all dependencies
├── start.sh            # Start development servers
├── start-prod.sh       # Deploy to production
├── backend/
│   ├── database/rhm.db # Production database
│   └── .env            # Production config (port 3001)
├── frontend/dist/      # Production build
└── nginx/rhm.conf      # Nginx configuration

/home/pi/RHM-dev/       ← DEVELOPMENT (switch branches freely)
├── start.sh            # Start dev servers (port 3002)
├── backend/
│   ├── database/rhm_test.db  # Test database
│   └── .env            # Dev config (port 3002)
└── frontend/           # Dev frontend (port 5173)
```

## Quick Commands

### Development (in /home/pi/RHM-dev)
```bash
cd /home/pi/RHM-dev
./install.sh            # Install dependencies (first time only)
./start.sh              # Start dev servers (frontend :5173, backend :3002)
git checkout -b feature # Create feature branch
git checkout main       # Switch branches freely
```

### Production (in /home/pi/RHM)
```bash
cd /home/pi/RHM
git pull origin main    # Get latest changes
./start-prod.sh         # Build and deploy
pm2 restart rhm-backend # Restart backend only
sudo systemctl restart nginx # Restart nginx
```

### Deploy Changes to Production
```bash
# 1. In dev directory - merge to main and push
cd /home/pi/RHM-dev
git checkout main
git merge feature-branch
git push origin main

# 2. In production directory - pull and deploy
cd /home/pi/RHM
git pull origin main
./start-prod.sh
```

### Tailscale
```bash
tailscale status        # Check connection
tailscale ip -4         # Get Tailscale IP
sudo tailscale up       # Reconnect
```

## Access URLs

| Environment | URL | Port | Database |
|-------------|-----|------|----------|
| Development | http://localhost:5173 | 3002 | rhm_test.db |
| Production (LAN) | http://192.168.31.253 | 3001 | rhm.db |
| Production (Tailscale) | http://100.95.218.115 | 3001 | rhm.db |

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

## Git Worktrees

This project uses git worktrees to isolate production from development:

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `/home/pi/RHM` | main (locked) | Production - never switch branches here |
| `/home/pi/RHM-dev` | any | Development - switch branches freely |

### Worktree Commands
```bash
git worktree list              # List all worktrees
git worktree add ../RHM-dev branch  # Add new worktree (already done)
git worktree remove ../RHM-dev      # Remove worktree (if needed)
```

### Branches
- `main` - Production-ready code
- `internet-access` - Development branch
- `remote-access` - Earlier remote access work
