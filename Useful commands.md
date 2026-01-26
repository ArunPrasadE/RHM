# Useful Commands

## Development Environment

| Action | Command |
|--------|---------|
| Start both servers | `./start.sh` |
| Install dependencies | `./install.sh` |

## Production Environment

| Action | Command |
|--------|---------|
| Build and deploy | `./start-prod.sh` |
| Start backend | `pm2 start rhm-backend` |
| Stop backend | `pm2 stop rhm-backend` |
| Restart backend | `pm2 restart rhm-backend` |
| View backend logs | `pm2 logs rhm-backend` |
| Start Nginx | `sudo systemctl start nginx` |
| Stop Nginx | `sudo systemctl stop nginx` |
| Restart Nginx | `sudo systemctl restart nginx` |
| Check Nginx status | `sudo systemctl status nginx` |

## Tailscale (Remote Access)

| Action | Command |
|--------|---------|
| Check connection status | `tailscale status` |
| Get Tailscale IP | `tailscale ip -4` |
| Connect/Reconnect | `sudo tailscale up` |
| Disconnect | `sudo tailscale down` |

## Access URLs

| Environment | URL |
|-------------|-----|
| Development (Local) | http://localhost:5173 |
| Development (LAN) | http://192.168.31.253:5173 |
| Production (LAN) | http://192.168.31.253 |
| Production (Tailscale) | http://100.95.218.115 |

**Note:** Development uses port 5173, Production uses port 80 (default HTTP).
