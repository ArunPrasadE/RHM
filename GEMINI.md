# Webapp Business Architecture: Sunny-Go

## Project Overview
Starting a webapp personal business providing managed instances of the **RHM** (Rental House Management) application for small businesses.

## Core Mandates
- **Validation First:** Whenever the user reports completing a task and asks for the next step, Gemini CLI MUST verify that the task was performed correctly and without issues (using commands like `docker ps`, `curl`, or checking logs) before providing subsequent instructions.

## Server Environment
- **Host:** Hetzner Cloud (Ubuntu Server)
- **Server Name:** `sunny-go`
- **Management Tool:** [Dokploy](https://dokploy.com/) (Self-hosted PaaS)

## Architecture Details

### 1. RHM-AEK (Production)
- **Role:** Main production instance.
- **Source:** GitHub (`ArunPrasadE/RHM`, `main` branch).
- **Database:** SQLite (Persistent Volume).
- **Access:** Public IP + Dedicated Port (or Subdomain).

### 2. RHM-dev (Development)
- **Role:** Testing new features before production.
- **Source:** GitHub (`ArunPrasadE/RHM`).
- **Database:** SQLite (Independent).
- **Access:** Public IP + Dedicated Port (or Subdomain).

### 3. RHM-temp (Demo/Trial)
- **Role:** Temporary instance for user testing.
- **Source:** GitHub (`ArunPrasadE/RHM`).
- **Database:** SQLite (Auto-resets every 2 weeks).
- **Access:** Public IP + Dedicated Port (or Subdomain).
- **Auto-Cleanup:** Implemented via Dokploy Schedule Jobs (Cron).

## Deployment Strategy
1. **Clean Slate:** All existing Docker containers and images have been removed to prevent port 80 conflicts.
2. **Dokploy Install:** Install via official script.
3. **Application Setup:** Use Nixpacks or custom Dockerfile via Dokploy dashboard.
4. **Networking:** Map internal port 3000 (standard for the RHM Node.js app) to unique external ports or subdomains.
