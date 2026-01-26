#!/bin/bash

# RHM Start Script (Development/Test Environment)
# Starts both backend and frontend servers
# Uses test database (rhm_test.db) and port 3002

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

LAN_IP=$(hostname -I | awk '{print $1}')

echo "================================"
echo "Starting RHM Servers (TEST ENV)"
echo "================================"
echo ""
echo "Database: rhm_test.db"
echo "Backend:  http://localhost:3002"
echo "Frontend: http://localhost:5173"
echo "LAN:      http://$LAN_IP:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================"
echo ""

# Start backend in background with test config
cd "$SCRIPT_DIR/backend"
PORT=3002 DB_PATH=./database/rhm_test.db npm run dev &
BACKEND_PID=$!

# Start frontend with proxy pointing to test backend port
# --host flag makes it accessible from LAN
cd "$SCRIPT_DIR/frontend"
VITE_API_PORT=3002 npm run dev -- --host &
FRONTEND_PID=$!

# Handle Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both processes
wait
