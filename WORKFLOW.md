# RHM Development Workflow

Guide for managing development and production environments using Git worktrees.

---

## Overview

This project uses **git worktrees** to completely separate production and development:

```
/home/pi/RHM/        ← PRODUCTION (always main branch)
    │
    ├── PM2 (backend on port 3001)
    ├── Nginx (serves frontend)
    ├── rhm.db (production database)
    └── Tailscale (remote access)

/home/pi/RHM-dev/    ← DEVELOPMENT (switch branches freely)
    │
    ├── Node dev server (backend on port 3002)
    ├── Vite dev server (frontend on port 5173)
    └── rhm_test.db (test database)
```

**Key Benefits:**
- Production code is never affected by development work
- Switch branches freely in dev without touching production
- Separate databases prevent test data from mixing with real data
- Both directories share git history (commits, branches)

---

## Directory Comparison

| Aspect | Production (`/home/pi/RHM`) | Development (`/home/pi/RHM-dev`) |
|--------|----------------------------|----------------------------------|
| Branch | `main` (never change) | Any branch |
| Backend Port | 3001 | 3002 |
| Frontend Port | 80 (Nginx) | 5173 (Vite) |
| Database | `rhm.db` | `rhm_test.db` |
| Process Manager | PM2 + Nginx | Node --watch |
| Access | LAN + Tailscale | localhost only |

---

## Running Production Environment

Production runs from `/home/pi/RHM` and should **always stay on main branch**.

### Start Production (First Time or After Reboot)
```bash
cd /home/pi/RHM
./start-prod.sh
```

### Check Production Status
```bash
pm2 status                    # Backend status
sudo systemctl status nginx   # Nginx status
```

### Restart Production
```bash
pm2 restart rhm-backend       # Restart backend only
sudo systemctl restart nginx  # Restart nginx only

# Or full redeploy
cd /home/pi/RHM
./start-prod.sh
```

### View Production Logs
```bash
pm2 logs rhm-backend          # Live logs
pm2 logs rhm-backend --lines 50  # Last 50 lines
```

### Access Production
| From | URL |
|------|-----|
| Home network | http://192.168.31.253 |
| Anywhere (Tailscale) | http://100.95.218.115 |

---

## Running Development Environment

Development runs from `/home/pi/RHM-dev` and can use **any branch**.

### Start Development Server
```bash
cd /home/pi/RHM-dev
./start.sh
```

### Access Development
| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Frontend (hot reload) |
| http://localhost:3002 | Backend API |

### Stop Development Server
```bash
# Press Ctrl+C in the terminal running ./start.sh
```

### Switch Branches (Development Only)
```bash
cd /home/pi/RHM-dev
git checkout main              # Switch to main
git checkout feature-branch    # Switch to feature
git checkout -b new-feature    # Create new branch
```

---

## Making Changes (Development Only)

**IMPORTANT:** Always make changes in `/home/pi/RHM-dev`, never in `/home/pi/RHM`.

### Step 1: Start Development Environment
```bash
cd /home/pi/RHM-dev
./start.sh
```

### Step 2: Create a Feature Branch
```bash
git checkout main              # Start from main
git pull origin main           # Get latest changes
git checkout -b feature/my-feature  # Create new branch
```

### Step 3: Make Your Changes
- Edit code in `/home/pi/RHM-dev`
- Test at http://localhost:5173
- Changes hot-reload automatically

### Step 4: Commit Changes
```bash
git add <files>                # Stage specific files
git commit -m "Add my feature"
git push origin feature/my-feature
```

---

## Pushing Changes to Production

### Method 1: Merge and Deploy (Recommended)

```bash
# Step 1: In development directory, merge to main
cd /home/pi/RHM-dev
git checkout main
git pull origin main           # Get any remote changes
git merge feature/my-feature   # Merge your feature
git push origin main           # Push to remote

# Step 2: In production directory, pull and deploy
cd /home/pi/RHM
git pull origin main           # Pull the merged changes
./start-prod.sh                # Rebuild and restart
```

### Method 2: Quick Backend-Only Update

If you only changed backend code:
```bash
cd /home/pi/RHM
git pull origin main
pm2 restart rhm-backend
```

### Method 3: Quick Frontend-Only Update

If you only changed frontend code:
```bash
cd /home/pi/RHM
git pull origin main
cd frontend && npm run build
# Nginx serves static files, no restart needed
```

---

## Complete Workflow Example

Here's a complete example of developing a feature and deploying it:

```bash
# 1. Start in development directory
cd /home/pi/RHM-dev

# 2. Make sure you have latest main
git checkout main
git pull origin main

# 3. Create feature branch
git checkout -b feature/add-reports

# 4. Start dev server
./start.sh
# Make changes, test at http://localhost:5173
# Press Ctrl+C when done testing

# 5. Commit your changes
git add src/pages/Reports.jsx src/components/ReportCard.jsx
git commit -m "Add monthly reports feature"
git push origin feature/add-reports

# 6. Merge to main
git checkout main
git merge feature/add-reports
git push origin main

# 7. Deploy to production
cd /home/pi/RHM
git pull origin main
./start-prod.sh

# 8. Verify production is working
pm2 status
# Access http://192.168.31.253 or http://100.95.218.115

# 9. Clean up feature branch (optional)
cd /home/pi/RHM-dev
git branch -d feature/add-reports
git push origin --delete feature/add-reports
```

---

## Hotfix Workflow

For urgent fixes that need to go to production quickly:

```bash
# 1. Create hotfix from main
cd /home/pi/RHM-dev
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug

# 2. Make the fix
./start.sh
# Fix the bug, test it
# Ctrl+C when done

# 3. Commit and merge immediately
git add <fixed-files>
git commit -m "Fix critical bug in rent calculation"
git checkout main
git merge hotfix/fix-critical-bug
git push origin main

# 4. Deploy to production immediately
cd /home/pi/RHM
git pull origin main
./start-prod.sh

# 5. Clean up
cd /home/pi/RHM-dev
git branch -d hotfix/fix-critical-bug
```

---

## Git Worktree Commands

```bash
# List all worktrees
git worktree list

# Output:
# /home/pi/RHM      cbe85d1 [main]
# /home/pi/RHM-dev  c1ce6b6 [internet-access]

# Remove a worktree (if needed)
git worktree remove /home/pi/RHM-dev

# Add a new worktree
git worktree add /home/pi/RHM-dev branch-name
```

---

## Quick Reference

### Production Commands (in /home/pi/RHM)
```bash
./start-prod.sh              # Full deploy
pm2 status                   # Check status
pm2 restart rhm-backend      # Restart backend
pm2 logs rhm-backend         # View logs
git pull origin main         # Get updates (always main)
```

### Development Commands (in /home/pi/RHM-dev)
```bash
./start.sh                   # Start dev servers
git checkout <branch>        # Switch branches
git checkout -b <new-branch> # Create branch
git merge <branch>           # Merge branch
git push origin <branch>     # Push to remote
```

### Tailscale (Remote Access)
```bash
tailscale status             # Check connection
tailscale ip -4              # Get Tailscale IP
sudo tailscale up            # Reconnect
```

---

## Troubleshooting

### Production not updating after git pull
```bash
cd /home/pi/RHM
./start-prod.sh   # Rebuilds frontend and restarts backend
```

### Development server port conflict
```bash
# If port 3002 or 5173 is in use
pkill -f "node.*3002"
pkill -f "vite.*5173"
cd /home/pi/RHM-dev
./start.sh
```

### Wrong branch in production directory
```bash
# Check current branch
cd /home/pi/RHM
git branch
# Should show: * main

# If not on main (should never happen)
git checkout main
git pull origin main
./start-prod.sh
```

### Sync development with production database
```bash
# Copy production data to test database (use with caution)
cp /home/pi/RHM/backend/database/rhm.db /home/pi/RHM-dev/backend/database/rhm_test.db
```
