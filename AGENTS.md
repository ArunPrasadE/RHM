# AGENTS.md

Compact instruction file for OpenCode sessions working on RHM (Rental House Management).

## Deployment Context

**Current environment:** Ubuntu server with **Dokploy** (self-hosted PaaS) running in Docker.

**Local directory `/home/ape/RHM/`** is the source repository but **NOT used by running instances**. Production apps run inside Docker containers managed by Dokploy.

## Repository Structure

**Monorepo** with separate backend and frontend:
```
backend/     Node.js + Express + SQLite (ESM modules)
frontend/    React + Vite + Tailwind
nginx/       Production reverse proxy config (unused in Dokploy)
Dockerfile   Docker build config for Dokploy deployment
```

Both use `"type": "module"` in package.json — **always use ESM imports**, never CommonJS.

## Dokploy Deployment

### Current Setup
- **Dokploy dashboard:** http://localhost:3000
- **Three RHM instances** running from GitHub (`ArunPrasadE/RHM`):

| Instance | Port | Purpose | Database |
|----------|------|---------|----------|
| **RHM-AEK** | 3001 | Production (customer AEK) | Persistent (Docker volume) |
| **RHM-dev** | 3002 | Development/testing before production | Persistent (Docker volume) |
| **RHM-temp** | 3003 | Casual testing/demo | Auto-reset (see GEMINI.md) |

- **Container internal port:** 3000 (Dockerfile EXPOSE 3000, Dokploy remaps to 3001/3002/3003)
- **Databases:** Each instance has separate SQLite database in Docker volume

### Deployment Flow
1. Code changes pushed to GitHub (branch depends on instance)
2. Dokploy pulls from GitHub and rebuilds Docker image
3. New container deployed with fresh code
4. SQLite database persists via Docker volume (except RHM-temp resets)

**Local directory changes DON'T affect running apps** — must push to GitHub and redeploy via Dokploy.

## Key Commands

### Local Development (Testing Only)
```bash
./install.sh              # First time setup
./start.sh                # Start both servers (backend :3004, frontend :5173)
                          # Uses rhm_test.db, not production database
                          # Port 3004 avoids conflict with Dokploy instances
```

**Note:** These commands test locally. To deploy changes, push to GitHub and redeploy via Dokploy.

### Dokploy Management
Access Dokploy dashboard at http://localhost:3000 to:
- View running instances (RHM-AEK :3001, RHM-dev :3002, RHM-temp :3003)
- Check container logs for each instance
- Redeploy after GitHub push
- Manage environment variables per instance

**Typical workflow:**
1. Test changes in **RHM-dev** (port 3002) first
2. Once verified, promote to **RHM-AEK** (port 3001) production
3. Use **RHM-temp** (port 3003) for quick experiments/demos

**No direct PM2/Nginx commands** — Dokploy handles process management.

## Critical Business Logic

### Rent Scheduler (`backend/src/utils/scheduler.js`)

Auto-generates rent records via cron (1st of month, 00:05 AM IST, timezone: 'Asia/Kolkata') + backfills on startup.

**Rules:**
- Rent due **10th of each month**
- Overdue notifications show **7 days after** due date (17th onwards) - see `notifications.js:21`
- **First rent is always next month** after move-in (not move-in month)
- If move-in **after 15th**: first rent = **half amount**
- If move-in **on or before 15th**: first rent = **full amount**
- Subsequent rents always full amount

**DO NOT change this logic without understanding the full calculation flow.** Many edge cases handled.

### Database Isolation

**Docker deployment (Dokploy):**
- Each instance has **separate SQLite database** in Docker volume:
  - **RHM-AEK (port 3001)**: Production customer data — **DO NOT TOUCH**
  - **RHM-dev (port 3002)**: Test data for verifying changes
  - **RHM-temp (port 3003)**: Demo data (auto-resets per GEMINI.md)
- Database location inside container: `/app/backend/database/rhm.db`
- **Database persists across redeployments** (volume not deleted when updating code)

**Local development:**
- `backend/database/rhm_test.db` — Local test data (gitignored, isolated from Docker)
- `./start.sh` automatically uses test database via `DB_PATH=./database/rhm_test.db`
- **Completely separate** from Dokploy instances

**CRITICAL:** Never run commands against RHM-AEK (port 3001) production database. Always test on RHM-dev (port 3002) first.

## Environment Variables (Docker Deployment)

Backend reads from `.env` or Dokploy environment variables:
```
PORT=3000 (Dockerfile default, Dokploy may remap externally)
DB_PATH=./database/rhm.db
JWT_SECRET=... (set via Dokploy environment)
NODE_ENV=production
```

**Configure via Dokploy dashboard**, not local `.env` files. Local `.env` only affects `./start.sh` testing.

## Production Architecture (Dokploy)

```
Browser → Dokploy Nginx/Traefik (port 80/443)
            → Docker Container :3000 (RHM backend serves frontend/dist + API)
                → SQLite (Docker volume)
```

**Single backend serves everything** in production:
- Static files from `frontend/dist/` (via `express.static` when `NODE_ENV=production`)
- API endpoints at `/api/*`
- SPA fallback: all non-API routes serve `index.html` (React Router handles client-side routing)
- Built by Dockerfile: `npm run build` (frontend) + `node backend/src/index.js`

See `backend/src/index.js:78-84` for production static file serving logic. No separate Nginx/PM2 setup in Dokploy deployment.

## Common Mistakes to Avoid

1. **Don't deploy directly to RHM-AEK (port 3001)** — always test on RHM-dev (port 3002) first
2. **Don't use CommonJS** (`require`/`module.exports`) — both projects use ESM
3. **Don't edit `/home/ape/RHM/` expecting production changes** — local files NOT used by Dokploy containers
4. **Don't forget to push to GitHub** — Dokploy deploys from GitHub, not local filesystem
5. **Don't confuse local port 5173 with deployed instances** — local testing (5173) ≠ RHM-dev (3002) ≠ RHM-AEK (3001)
6. **Don't modify rent scheduler** without testing all edge cases (mid-month move-in, half rent, backfill)
7. **Don't assume Nginx/PM2** — Dokploy uses Docker, not traditional Linux process management
8. **Don't assume shared databases** — each instance (3001/3002/3003) has separate SQLite database
9. **Check Dockerfile** — it defines container build (port 3000, copies all files to `/app`)

## Bill Splitting (Expenses)

- **Motor bill**: Auto-splits among houses with same `motor_service_number`
- **Water bill**: User selects houses, splits equally
- **EB bill, house tax**: Per-house, no splitting

Located in `backend/src/routes/expenses.js`.

## No Tests Configured

No test framework (jest/vitest) currently. Verify changes by:
1. Running `./start.sh` (test environment)
2. Manual testing in browser at http://localhost:5173
3. Check backend logs for errors

## Dependencies

Node.js >= 18.0.0 required (uses `node --watch` for dev server).

Key deps:
- `better-sqlite3` (native addon, requires build tools on fresh install)
- `node-cron` (rent scheduler)
- `googleapis` (Google Drive backup, optional)
- `bcrypt` (password hashing)

## Workflow for Making Changes

### Safe Production Deployment Flow

1. **Edit code** in `/home/ape/RHM/` (local development)
2. **Test locally** with `./start.sh` (backend :3004, frontend :5173, isolated test database)
3. **Commit and push** to GitHub (branch: `main` or feature branch)
4. **Deploy to RHM-dev first** (port 3002):
   - Access Dokploy dashboard at http://localhost:3000
   - Redeploy RHM-dev instance
   - Monitor container logs for errors
   - Test functionality at http://localhost:3002
5. **Once verified, deploy to RHM-AEK** (port 3001):
   - Redeploy RHM-AEK instance in Dokploy
   - Verify production at http://localhost:3001
6. **Optional:** Deploy to RHM-temp (port 3003) for demos

**CRITICAL RULES:**
- **Never deploy untested code to RHM-AEK (port 3001)** — always test on RHM-dev (port 3002) first
- Local changes invisible to running apps until pushed to GitHub and redeployed
- Each instance pulls from GitHub independently (can be on different branches/commits)

## Reference Documentation

- `GEMINI.md` — Dokploy deployment architecture (RHM-AEK, RHM-dev, RHM-temp instances)
- `CLAUDE.md` — Full project context (originally for Raspberry Pi, business logic still valid)
- `Dockerfile` — Container build process (must match Dokploy expectations)
- `README.md` — User-facing documentation and API reference

**Deprecated docs for this environment:**
- `SETUP.md` / `WORKFLOW.md` — Raspberry Pi PM2/Nginx setup (NOT used with Dokploy)
- `start-prod.sh` — PM2 deployment script (NOT used with Dokploy)
- `nginx/` directory — Reverse proxy config (Dokploy handles this)

Read `GEMINI.md` for Dokploy-specific architecture. Read `CLAUDE.md` for business logic and rent scheduler details.
