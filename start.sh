#!/bin/bash

# AI Podcast Producer - Startup Script
# =====================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       🎙️  AI Podcast Producer            ║"
echo "  ║       Production Studio                  ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Loaded .env configuration${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Kill processes on ports
echo -e "${YELLOW}→ Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"
lsof -ti:$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Ports cleaned${NC}"

# Check PostgreSQL
echo -e "${YELLOW}→ Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ PostgreSQL not found. Please install it.${NC}"
  exit 1
fi

# Create database if not exists
psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-ai_podcast_producer}'" 2>/dev/null | grep -q 1 || \
  psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -c "CREATE DATABASE ${DB_NAME:-ai_podcast_producer}" 2>/dev/null || true
echo -e "${GREEN}✓ Database ready${NC}"

# Install dependencies
echo -e "${YELLOW}→ Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}→ Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Seed database
echo -e "${YELLOW}→ Seeding database...${NC}"
cd "$PROJECT_DIR/backend"
node seeds/seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# Start backend with nodemon (hot reload)
echo -e "${YELLOW}→ Starting backend on port $BACKEND_PORT (with hot reload)...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
sleep 2

# Start frontend with Vite (hot reload built-in)
echo -e "${YELLOW}→ Starting frontend on port $FRONTEND_PORT (with HMR)...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${PURPLE}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎙️  AI Podcast Producer is running!${NC}"
echo -e "${PURPLE}══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e "  ${BLUE}Login:${NC}     admin@podcastpro.com / password123"
echo ""
echo -e "  ${YELLOW}Both servers have hot reload enabled.${NC}"
echo -e "  ${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}→ Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  lsof -ti:$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}✓ All services stopped. Goodbye! 👋${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
