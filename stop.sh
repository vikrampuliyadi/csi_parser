#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${RED}Stopping CSI Parse Services...${NC}\n"

# Stop Backend
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo "Backend process not found"
    fi
    rm -f "$SCRIPT_DIR/.backend.pid"
else
    # Try to find and kill uvicorn process
    pkill -f "uvicorn app.main:app" 2>/dev/null && echo -e "${GREEN}Backend stopped${NC}" || echo "Backend not running"
fi

# Stop Frontend
if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo "Frontend process not found"
    fi
    rm -f "$SCRIPT_DIR/.frontend.pid"
else
    # Try to find and kill vite process
    pkill -f "vite" 2>/dev/null && echo -e "${GREEN}Frontend stopped${NC}" || echo "Frontend not running"
fi

echo -e "\n${GREEN}✓ All services stopped${NC}"

