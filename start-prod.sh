#!/bin/bash

# RHM Production Start Script
# Builds frontend, configures nginx, and starts backend with PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================"
echo "RHM Production Deployment"
echo "================================"
echo ""

# Step 1: Build frontend
echo "[1/5] Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm run build
echo "      Done! Static files in frontend/dist/"
echo ""

# Step 2: Fix permissions for nginx
echo "[2/5] Setting permissions..."
chmod 755 /home/pi
chmod -R 755 "$SCRIPT_DIR/frontend/dist"
echo "      Done!"
echo ""

# Step 3: Configure nginx
echo "[3/5] Configuring nginx..."
if [ ! -L /etc/nginx/sites-enabled/rhm.conf ]; then
    sudo ln -sf "$SCRIPT_DIR/nginx/rhm.conf" /etc/nginx/sites-enabled/rhm.conf
    sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    echo "      Nginx configured!"
else
    echo "      Nginx already configured."
fi

# Test nginx config
sudo nginx -t
sudo systemctl reload nginx
echo "      Nginx reloaded!"
echo ""

# Step 4: Start Tailscale for remote access
echo "[4/5] Starting Tailscale for remote access..."
sudo tailscale up
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "Not available")
echo "      Tailscale IP: $TAILSCALE_IP"
echo ""

# Step 5: Start backend with PM2
echo "[5/5] Starting backend with PM2..."
cd "$SCRIPT_DIR/backend"

# Stop existing instance if running
pm2 delete rhm-backend 2>/dev/null || true

# Start with PM2
NODE_ENV=production pm2 start src/index.js --name rhm-backend

echo ""
echo "================================"
echo "Production deployment complete!"
echo "================================"
echo ""
echo "Access URLs:"
echo "  Local:     http://localhost"
echo "  LAN:       http://192.168.31.253"
echo "  Tailscale: http://$TAILSCALE_IP"
echo ""
echo "API Backend: http://localhost:3001 (proxied via /api/)"
echo ""
echo "PM2 Commands:"
echo "  pm2 status              # Check status"
echo "  pm2 logs rhm-backend    # View logs"
echo "  pm2 restart rhm-backend # Restart"
echo "  pm2 stop rhm-backend    # Stop"
echo ""
echo "To auto-start on boot:"
echo "  pm2 save"
echo "  pm2 startup"
echo "  sudo systemctl enable nginx"
