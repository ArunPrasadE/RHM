# RHM Development Workflow

Guide for managing development and production environments with Git branches.

---

## Overview

```
main branch (production) ←── feature branches (development)
      ↓
   PM2 + Nginx (running)
      ↓
   Tailscale (remote access)
```

- **main**: Production-ready code, deployed on server
- **feature branches**: Development work, testing locally
- **Tailscale**: Secure remote access from anywhere

---

## Server Behavior When Switching Branches

| Component | Behavior |
|-----------|----------|
| PM2 Backend | Keeps running (separate daemon process) |
| Nginx | Keeps running (system service) |
| SQLite Database | Persists (stored in backend/database/) |
| Frontend Build | Unchanged until rebuilt |

**Key Point:** Switching branches only affects source files, not running processes.

---

## Recommended Workflow

### 1. Start Production Server (First Time)
```bash
git checkout main
./start-prod.sh
```

### 2. Create Feature Branch for Development
```bash
git checkout -b feature/my-new-feature
```

### 3. Develop and Test Locally
```bash
# Start development servers
./start.sh

# Access at:
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### 4. Commit Changes
```bash
git add .
git commit -m "Add my new feature"
git push origin feature/my-new-feature
```

### 5. Merge to Main and Redeploy
```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature/my-new-feature

# Push to remote
git push origin main

# Redeploy production
./start-prod.sh
```

### 6. Clean Up (Optional)
```bash
# Delete local feature branch
git branch -d feature/my-new-feature

# Delete remote feature branch
git push origin --delete feature/my-new-feature
```

---

## Quick Reference Commands

### Development
```bash
./start.sh              # Start dev servers
Ctrl+C                  # Stop dev servers
```

### Production
```bash
./start-prod.sh         # Deploy/redeploy production
pm2 status              # Check backend status
pm2 logs rhm-backend    # View backend logs
pm2 restart rhm-backend # Restart backend only
pm2 stop rhm-backend    # Stop backend
sudo systemctl stop nginx   # Stop nginx
```

### Git
```bash
git branch                  # List branches
git checkout <branch>       # Switch branch
git checkout -b <branch>    # Create and switch
git merge <branch>          # Merge branch into current
git push origin <branch>    # Push to remote
```

### Tailscale
```bash
tailscale status            # Check connection status
tailscale ip -4             # Get Tailscale IP
sudo tailscale up           # Connect/reconnect
sudo systemctl restart tailscaled  # Restart Tailscale service
```

---

## Common Scenarios

### Hotfix in Production
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/fix-critical-bug

# Make fix, test
./start.sh

# Merge and deploy
git checkout main
git merge hotfix/fix-critical-bug
git push origin main
./start-prod.sh
```

### Update Production Without Stopping
```bash
# Pull latest changes
git checkout main
git pull origin main

# Rebuild frontend only
cd frontend && npm run build

# Restart backend only
pm2 restart rhm-backend
```

### Rollback to Previous Version
```bash
# Find previous commit
git log --oneline

# Reset to previous commit
git checkout main
git reset --hard <commit-hash>
git push origin main --force

# Redeploy
./start-prod.sh
```

---

## Environment Ports & Access URLs

| Environment | Frontend | Backend | Access From |
|-------------|----------|---------|-------------|
| Development | localhost:5173 | localhost:3001 | Local only |
| Production (LAN) | 192.168.31.253 | 192.168.31.253/api | Home network |
| Production (Tailscale) | 100.95.218.115 | 100.95.218.115/api | Anywhere |

---

## Remote Access with Tailscale

Tailscale provides secure access to the app from anywhere without exposing your home network.

### How It Works
```
Your Device (Tailscale) ←→ Mesh VPN ←→ Raspberry Pi (Tailscale)
                                              ↓
                                      Nginx → Backend
```

### Access URLs
- **From home network**: http://192.168.31.253
- **From anywhere (Tailscale)**: http://100.95.218.115

### Tailscale Commands
```bash
# Check Tailscale status
tailscale status

# Get Tailscale IP
tailscale ip -4

# Reconnect if disconnected
sudo tailscale up

# Check if Tailscale is running
sudo systemctl status tailscaled
```

### Accessing from MacBook
1. Ensure Tailscale is running on MacBook (check menu bar icon)
2. Open browser: http://100.95.218.115
3. Login with admin credentials

### Troubleshooting Remote Access

**Can't connect via Tailscale:**
```bash
# On Raspberry Pi, check Tailscale status
tailscale status

# Restart Tailscale if needed
sudo systemctl restart tailscaled
sudo tailscale up
```

**Tailscale connected but app not loading:**
```bash
# Check if production server is running
pm2 status
sudo systemctl status nginx

# Restart if needed
./start-prod.sh
```
