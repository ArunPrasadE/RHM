#!/bin/bash

# RHM Installation Script
# Installs all dependencies for backend and frontend

set -e  # Exit on any error

echo "================================"
echo "RHM Installation Script"
echo "================================"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Step 1: Create database directory
echo "[1/3] Creating database directory..."
mkdir -p "$SCRIPT_DIR/backend/database"
echo "      Done!"
echo ""

# Step 2: Install backend dependencies
echo "[2/3] Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install
echo "      Done!"
echo ""

# Step 3: Install frontend dependencies
echo "[3/3] Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install
echo "      Done!"
echo ""

echo "================================"
echo "Installation complete!"
echo "================================"
echo ""
echo "To start the servers, run:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use: ./start.sh"
