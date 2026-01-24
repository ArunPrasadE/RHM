# RHM Setup Guide

Step-by-step guide to set up and run the Rental House Management application.

---

## Prerequisites

### System Requirements
- Raspberry Pi 3 or higher (or any Linux system)
- Node.js >= 18.0.0
- npm (comes with Node.js)

### Check Node.js Version
```bash
node --version   # Should be v18.x.x or higher
npm --version
```

If Node.js is not installed, install it:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Installation

### Step 1: Clone or Copy the Project
```bash
cd /home/pi
git clone <repository-url> RHM
# Or copy the RHM folder to /home/pi/
```

### Step 2: Run the Install Script
```bash
cd /home/pi/RHM
./install.sh
```

This script will:
- Create the database directory
- Install backend dependencies
- Install frontend dependencies

### Manual Installation (Alternative)
If you prefer to install manually:
```bash
# Create database directory
mkdir -p /home/pi/RHM/backend/database

# Install backend dependencies
cd /home/pi/RHM/backend
npm install

# Install frontend dependencies
cd /home/pi/RHM/frontend
npm install
```

---

## Development Environment

Use this for local development and testing.

### Start Both Servers
```bash
cd /home/pi/RHM
./start.sh
```

### Or Start Servers Individually

**Terminal 1 - Backend:**
```bash
cd /home/pi/RHM/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/pi/RHM/frontend
npm run dev
```

### Access the App (Development)
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Stop Servers
Press `Ctrl+C` in each terminal.

---

## Production Environment

Use this for deployment on Raspberry Pi.

### Step 1: Install Production Dependencies (One-Time)
```bash
# Install nginx
sudo apt update
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Deploy to Production
```bash
cd /home/pi/RHM
./start-prod.sh
```

This script will:
1. Build frontend static files
2. Configure nginx
3. Start backend with PM2

### Step 3: Fix Permissions (Required for nginx)
```bash
chmod 755 /home/pi
chmod -R 755 /home/pi/RHM/frontend/dist
sudo systemctl restart nginx
```

### Step 4: Enable Auto-Start on Boot
```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup
# Run the command it outputs (starts with sudo)

# Enable nginx on boot
sudo systemctl enable nginx
```

### Access the App (Production)
- From Raspberry Pi: http://localhost
- From other devices: http://<raspberry-pi-ip>

Find your Raspberry Pi's IP:
```bash
hostname -I
```

---

## Default Login Credentials

- **Username:** admin
- **Password:** admin123

---

## Useful Commands

### PM2 (Production Process Manager)
```bash
pm2 status              # Check process status
pm2 logs rhm-backend    # View backend logs
pm2 restart rhm-backend # Restart backend
pm2 stop rhm-backend    # Stop backend
pm2 delete rhm-backend  # Remove from PM2
```

### Nginx
```bash
sudo systemctl status nginx   # Check status
sudo systemctl start nginx    # Start
sudo systemctl stop nginx     # Stop
sudo systemctl restart nginx  # Restart
sudo nginx -t                 # Test configuration
```

### View Logs
```bash
# Backend logs (production)
pm2 logs rhm-backend

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Error: "Cannot find package 'express'"
Dependencies not installed. Run:
```bash
cd /home/pi/RHM/backend && npm install
```

### Error: "vite: not found"
Frontend dependencies not installed. Run:
```bash
cd /home/pi/RHM/frontend && npm install
```

### Error: "Cannot open database because the directory does not exist"
Database directory missing. Run:
```bash
mkdir -p /home/pi/RHM/backend/database
```

### Error: "500 Internal Server Error" (Production)
Nginx can't read frontend files. Fix permissions:
```bash
chmod 755 /home/pi
chmod -R 755 /home/pi/RHM/frontend/dist
sudo systemctl restart nginx
```

### Backend Not Starting
Check PM2 logs:
```bash
pm2 logs rhm-backend
```

### Port Already in Use
Find and kill the process:
```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill the process
kill -9 <PID>
```

---

## Architecture

### Development
```
Browser → Vite Dev Server (5173) → React App
                ↓ API calls
        Backend (3001) → SQLite Database
```

### Production
```
Browser → Nginx (80)
              ├── /* → Static Files (frontend/dist)
              └── /api/* → Backend (3001) → SQLite Database
```

---

## File Structure

```
/home/pi/RHM/
├── install.sh          # Install all dependencies
├── start.sh            # Start dev servers
├── start-prod.sh       # Deploy to production
├── requirements.txt    # Dependencies documentation
├── SETUP.md            # This file
├── CLAUDE.md           # Project context
├── backend/
│   ├── src/            # Backend source code
│   ├── database/       # SQLite database
│   ├── package.json    # Backend dependencies
│   └── .env            # Environment config
├── frontend/
│   ├── src/            # Frontend source code
│   ├── dist/           # Production build (generated)
│   └── package.json    # Frontend dependencies
└── nginx/
    └── rhm.conf        # Nginx configuration
```
