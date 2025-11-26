#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting CSI Parse Services...${NC}\n"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Backend
echo -e "${GREEN}Starting Backend (FastAPI)...${NC}"
cd "$SCRIPT_DIR/backend"

# Check if virtual environment exists and get the path
if [ -d "csi_backend" ]; then
    VENV_PYTHON="$SCRIPT_DIR/backend/csi_backend/bin/python"
    VENV_UVICORN="$SCRIPT_DIR/backend/csi_backend/bin/uvicorn"
elif [ -d ".venv" ]; then
    VENV_PYTHON="$SCRIPT_DIR/backend/.venv/bin/python"
    VENV_UVICORN="$SCRIPT_DIR/backend/.venv/bin/uvicorn"
else
    echo -e "${YELLOW}Warning: No virtual environment found. Please create one first.${NC}"
    exit 1
fi

# Start backend in background using full path to uvicorn
cd "$SCRIPT_DIR/backend"
$VENV_UVICORN app.main:app --reload --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID) on http://127.0.0.1:8000${NC}"
echo "  Logs: backend.log"

# Wait a moment for backend to start
sleep 2

# Start Frontend
echo -e "${GREEN}Starting Frontend (Vite)...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check for nvm and use Node 18+ if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    # Try to use Node 18+, fallback to latest if 18 not available
    if nvm use 18 2>/dev/null || nvm use 20 2>/dev/null || nvm use 22 2>/dev/null || nvm use node 2>/dev/null; then
        echo -e "${GREEN}Using Node $(node --version)${NC}"
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID) on http://127.0.0.1:5173${NC}"
echo "  Logs: frontend.log"

# Save PIDs to file for stop script
echo "$BACKEND_PID" > ../.backend.pid
echo "$FRONTEND_PID" > ../.frontend.pid

# Wait a bit longer for services to fully start
sleep 3

# Check if services are actually running
echo -e "\n${BLUE}Checking services...${NC}"
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Backend may have failed to start. Check backend.log${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may have failed to start. Check frontend.log${NC}"
fi

# Check if ports are listening
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend port 8000 is listening${NC}"
else
    echo -e "${YELLOW}⚠ Backend port 8000 is not listening${NC}"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend port 5173 is listening${NC}"
else
    echo -e "${YELLOW}⚠ Frontend port 5173 is not listening${NC}"
fi

echo -e "\n${BLUE}Service URLs:${NC}"
echo -e "${BLUE}Backend:  http://127.0.0.1:8000${NC}"
echo -e "${BLUE}Frontend: http://127.0.0.1:5173${NC}"
echo -e "\n${YELLOW}To stop services, run: ./stop.sh${NC}"
echo -e "${YELLOW}Or press Ctrl+C and run: ./stop.sh${NC}"

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f ../.backend.pid ../.frontend.pid; exit" INT TERM

# Keep script running
wait

