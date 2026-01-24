# CLAUDE.md - Project Context for Claude Code

## Project Overview

RHM (Rental House Management) is a self-hosted web application for managing 11 rental houses in Tamil Nadu, India. Single admin user with JWT authentication, responsive mobile-first design.

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
│   ├── database/       # SQLite database file
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

## Access URLs

| Environment | Frontend | Backend API |
|-------------|----------|-------------|
| Development | http://localhost:5173 | http://localhost:3001 |
| Production (LAN) | http://192.168.31.253 | http://192.168.31.253/api |
| Production (Tailscale) | http://100.95.218.115 | http://100.95.218.115/api |

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

### Production Architecture
```
Internet/Tailscale → Nginx (port 80)
                        ├── /* → Static files (frontend/dist)
                        └── /api/* → Backend (port 3001) → SQLite
```

### Remote Access
- **Tailscale**: Mesh VPN for secure access from anywhere
- Tailscale IP: `100.95.218.115`

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
- `WORKFLOW.md` - Git workflow for development and deployment
- `requirements.txt` - All dependencies and installation steps
