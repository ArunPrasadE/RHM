#!/bin/bash

# RHM Start Script
# Starts both backend and frontend servers

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================"
echo "Starting RHM Servers"
echo "================================"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================"
echo ""

# Start backend in background
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# Start frontend in foreground
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Handle Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both processes
wait
