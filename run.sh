#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define terminal colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0;0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}          DarpanAI Cognitive Health Twin           ${NC}"
echo -e "${CYAN}====================================================${NC}"

# Function to check if a port is in use and free it
check_and_free_port() {
  local port=$1
  local pid=$(lsof -t -i:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}[!] Port $port is already in use by PID $pid.${NC}"
    read -p "Would you like to kill this process and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${BLUE}[*] Terminating process $pid...${NC}"
      kill -9 $pid 2>/dev/null || true
      sleep 1
    else
      echo -e "${RED}[-] Cannot start the application if port $port is blocked. Exiting.${NC}"
      exit 1
    fi
  fi
}

# 1. Environment Variable Setup (.env)
echo -e "\n${BLUE}[1/5] Checking Environment Variables (.env)...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}[!] .env file not found in the root directory. Creating a template .env file...${NC}"
  cat <<EOT > .env
# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/darpanai_db
MONGODB_URL=mongodb://localhost:27017/darpanai

# ── LLM / AI ──────────────────────────────────────────
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ANTHROPIC_API_KEY=

# ── Memory ────────────────────────────────────────────
MEM0_API_KEY=

# ── Telegram Bot ──────────────────────────────────────
TELEGRAM_BOT_TOKEN=

# ── Auth ──────────────────────────────────────────────
JWT_SECRET=super-secret-key-$(openssl rand -hex 16 2>/dev/null || echo "default-secret-key-12345")
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOT
  echo -e "${GREEN}[+] Created default template .env file.${NC}"
  echo -e "${YELLOW}[i] Please make sure to fill in your API keys in the .env file if required.${NC}"
else
  echo -e "${GREEN}[+] .env file found.${NC}"
fi

# 2. Database Port Reachability Check
echo -e "\n${BLUE}[2/5] Checking PostgreSQL Database Connection...${NC}"
if nc -zv localhost 5432 &>/dev/null; then
  echo -e "${GREEN}[+] PostgreSQL is running on port 5432.${NC}"
else
  echo -e "${YELLOW}[!] Warning: PostgreSQL is not reachable on port 5432.${NC}"
  echo -e "${YELLOW}[i] Make sure PostgreSQL is running and you have created the database specified in your DATABASE_URL.${NC}"
fi

# 3. Python Environment Setup
echo -e "\n${BLUE}[3/5] Setting up Python Virtual Environment...${NC}"

# Candidate commands, prioritized by target version compatibility for ML libraries (3.10-3.12)
CANDIDATES=(
  "/Users/akashvishwakarma/Agentic-AI_Course/venv/bin/python"
  "/Users/akashvishwakarma/pashumitra/backend/venv/bin/python"
  "python3.12"
  "python3.11"
  "python3.10"
  "python3"
  "python"
  "/usr/local/bin/python3"
  "/usr/local/bin/python3.14"
)

PYTHON_CMD=""
PYTHON_VERSION=""

# Check candidates for highly compatible versions (3.10 to 3.12) first
for cmd in "${CANDIDATES[@]}"; do
  if command -v "$cmd" &>/dev/null; then
    ver=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
    if [[ "$ver" == "3.10" || "$ver" == "3.11" || "$ver" == "3.12" ]]; then
      PYTHON_CMD="$cmd"
      PYTHON_VERSION="$ver"
      break
    fi
  fi
done

# Fallback to any Python version if target version wasn't found
if [ -z "$PYTHON_CMD" ]; then
  for cmd in "${CANDIDATES[@]}"; do
    if command -v "$cmd" &>/dev/null; then
      ver=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
      if [ -n "$ver" ]; then
        PYTHON_CMD="$cmd"
        PYTHON_VERSION="$ver"
        break
      fi
    fi
  done
fi

if [ -z "$PYTHON_CMD" ]; then
  echo -e "${RED}[-] Error: Python not found on the system. Please install Python 3.10-3.12.${NC}"
  exit 1
fi

echo -e "${BLUE}[*] Using Python: $PYTHON_CMD (version $PYTHON_VERSION)${NC}"

RECREATE_VENV=false
if [ -d ".venv" ]; then
  VENV_VER=$(.venv/bin/python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
  if [ "$VENV_VER" != "$PYTHON_VERSION" ]; then
    echo -e "${YELLOW}[!] Existing .venv python version ($VENV_VER) differs from selected python version ($PYTHON_VERSION). Re-creating venv...${NC}"
    rm -rf .venv
    RECREATE_VENV=true
  fi
else
  RECREATE_VENV=true
fi

if [ "$RECREATE_VENV" = true ]; then
  echo -e "${BLUE}[*] Creating virtual environment in .venv...${NC}"
  "$PYTHON_CMD" -m venv .venv
  echo -e "${GREEN}[+] Virtual environment created successfully.${NC}"
fi

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip and install requirements
echo -e "${BLUE}[*] Installing/updating backend Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}[+] Python environment setup complete.${NC}"

# 4. Node.js & Frontend Environment Setup
echo -e "\n${BLUE}[4/5] Checking Node.js Environment for Frontend...${NC}"
# Load NVM if it exists
if ! command -v node &>/dev/null; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "${BLUE}[*] Loading NVM from $HOME/.nvm/nvm.sh...${NC}"
    source "$HOME/.nvm/nvm.sh"
  elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
    echo -e "${BLUE}[*] Loading NVM from /usr/local/opt/nvm/nvm.sh...${NC}"
    source "/usr/local/opt/nvm/nvm.sh"
  fi
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}[-] Error: Node.js/npm not found. Please install Node.js (v20+ recommended).${NC}"
  exit 1
fi

echo -e "${BLUE}[*] Using Node.js: $(node -v)${NC}"

# Check if node_modules exists in frontend, if not install dependencies
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${BLUE}[*] frontend/node_modules not found. Installing frontend dependencies...${NC}"
  (cd frontend && npm install)
  echo -e "${GREEN}[+] Frontend dependencies installed successfully.${NC}"
else
  echo -e "${GREEN}[+] Frontend dependencies are already installed.${NC}"
fi

# 5. Start Servers
echo -e "\n${BLUE}[5/5] Checking Ports & Starting Services...${NC}"

# Ensure ports 8000 and 3000 are free
check_and_free_port 8000
check_and_free_port 3000

# Trap SIGINT and SIGTERM to kill background servers gracefully
cleanup() {
  echo -e "\n\n${YELLOW}[*] Shutting down all services gracefully...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    echo -e "${BLUE}[*] Stopping backend FastAPI server (PID $BACKEND_PID)...${NC}"
    kill -15 "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    echo -e "${BLUE}[*] Stopping frontend Next.js server (PID $FRONTEND_PID)...${NC}"
    kill -15 "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${GREEN}[+] All services stopped. Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}      Starting Backend & Frontend concurrently      ${NC}"
echo -e "${YELLOW}           Press Ctrl+C to terminate both           ${NC}"
echo -e "${CYAN}====================================================${NC}"

# Start Backend FastAPI Server
echo -e "${BLUE}[*] Launching FastAPI Backend on http://localhost:8000...${NC}"
PYTHONUNBUFFERED=1 PYTHONPATH=. python -m uvicorn backend.main:app --port 8000 --reload 2>&1 | sed -u -e "s/^/${CYAN}[BACKEND]${NC} /" &
BACKEND_PID=$!

# Give backend a moment to start up
sleep 2

# Start Frontend Next.js Dev Server
echo -e "${BLUE}[*] Launching Next.js Frontend on http://localhost:3000...${NC}"
(cd frontend && npm run dev) 2>&1 | sed -u -e "s/^/${GREEN}[FRONTEND]${NC} /" &
FRONTEND_PID=$!

# Wait for both servers to finish
wait
