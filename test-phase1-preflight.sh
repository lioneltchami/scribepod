#!/bin/bash
# ==============================================================================
# PHASE 1 PRE-FLIGHT VERIFICATION SCRIPT
# ==============================================================================
# Verifies all Phase 1 code changes and configurations are in place
# Run this BEFORE starting servers to ensure everything is ready
# ==============================================================================

echo "======================================================================"
echo "SCRIBEPOD PHASE 1 - PRE-FLIGHT VERIFICATION"
echo "======================================================================"
echo "Verifying all Phase 1 changes are in place..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

# ==============================================================================
# SECTION 1: ENVIRONMENT CONFIGURATION
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 1: ENVIRONMENT CONFIGURATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1.1: .env file exists
echo "Test 1.1: .env file exists"
if [ -f .env ]; then
    echo -e "${GREEN}✓ PASS${NC} - .env file found"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - .env file not found"
    echo "  Create .env file from template"
    ((FAILED++))
fi
echo ""

# Test 1.2: Critical environment variables
echo "Test 1.2: Critical environment variables configured"
REQUIRED_VARS=(
    "NODE_ENV"
    "REASON_SERVER_HOST"
    "REASON_SERVER_PORT"
    "WHISPER_SERVER_HOST"
    "WHISPER_SERVER_PORT"
    "API_KEY"
    "CORS_ALLOWED_ORIGINS"
    "FLASK_ENV"
    "FLASK_DEBUG"
    "LOG_LEVEL"
    "RATE_LIMIT_WINDOW_MS"
    "RATE_LIMIT_MAX_REQUESTS"
    "WHISPER_MODEL_SIZE"
    "FLAN_MODEL_NAME"
    "USE_CUDA"
)

MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${VAR}=" .env 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $VAR"
    else
        echo -e "  ${RED}✗${NC} $VAR - MISSING"
        ((MISSING_VARS++))
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - All required environment variables present"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - $MISSING_VARS required variables missing"
    ((FAILED++))
fi
echo ""

# Test 1.3: API Key strength
echo "Test 1.3: API Key strength"
if [ -f .env ]; then
    API_KEY=$(grep "^API_KEY=" .env | cut -d '=' -f 2)
    KEY_LENGTH=${#API_KEY}
    if [ $KEY_LENGTH -ge 64 ]; then
        echo -e "${GREEN}✓ PASS${NC} - API key is strong ($KEY_LENGTH characters)"
        ((PASSED++))
    elif [ $KEY_LENGTH -ge 32 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} - API key is acceptable but could be stronger ($KEY_LENGTH characters)"
        echo "  Recommended: 64+ characters"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ FAIL${NC} - API key too weak ($KEY_LENGTH characters)"
        echo "  Generate new key: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Cannot check API key (.env missing)"
    ((FAILED++))
fi
echo ""

# Test 1.4: FLASK_DEBUG disabled
echo "Test 1.4: Flask debug mode disabled (security)"
if [ -f .env ]; then
    FLASK_DEBUG=$(grep "^FLASK_DEBUG=" .env | cut -d '=' -f 2)
    if [ "$FLASK_DEBUG" = "0" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Flask debug mode disabled (secure)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Flask debug mode enabled (only OK for development)"
        echo "  Set FLASK_DEBUG=0 for production"
        ((WARNINGS++))
    fi
fi
echo ""

# ==============================================================================
# SECTION 2: NODE.JS DEPENDENCIES
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 2: NODE.JS DEPENDENCIES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 2.1: package.json has security dependencies
echo "Test 2.1: Node.js security dependencies in package.json"
REQUIRED_PACKAGES=("dotenv" "express-rate-limit" "winston" "axios")
MISSING_PACKAGES=0

for PKG in "${REQUIRED_PACKAGES[@]}"; do
    if grep -q "\"${PKG}\"" package.json 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $PKG"
    else
        echo -e "  ${RED}✗${NC} $PKG - MISSING"
        ((MISSING_PACKAGES++))
    fi
done

if [ $MISSING_PACKAGES -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - All required packages in package.json"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - $MISSING_PACKAGES packages missing from package.json"
    ((FAILED++))
fi
echo ""

# Test 2.2: node_modules exists
echo "Test 2.2: Node.js packages installed"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ PASS${NC} - node_modules directory exists"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - node_modules not found"
    echo "  Run: npm install"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# SECTION 3: PYTHON DEPENDENCIES
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 3: PYTHON DEPENDENCIES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 3.1: Virtual environment exists
echo "Test 3.1: Python virtual environment exists"
if [ -d "agent/whisper/venv" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Virtual environment found"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Virtual environment not found"
    echo "  Create with: cd agent/whisper && python -m venv venv"
    ((FAILED++))
fi
echo ""

# Test 3.2: Requirements file has security dependencies
echo "Test 3.2: Python security dependencies in requirements.txt"
REQUIRED_PYTHON_PACKAGES=("python-dotenv" "flask-limiter" "flask-cors" "psutil")
MISSING_PYTHON_PACKAGES=0

for PKG in "${REQUIRED_PYTHON_PACKAGES[@]}"; do
    if grep -q "${PKG}" agent/whisper/requirements.txt 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $PKG"
    else
        echo -e "  ${RED}✗${NC} $PKG - MISSING"
        ((MISSING_PYTHON_PACKAGES++))
    fi
done

if [ $MISSING_PYTHON_PACKAGES -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - All required Python packages in requirements.txt"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - $MISSING_PYTHON_PACKAGES packages missing"
    ((FAILED++))
fi
echo ""

# Test 3.3: Verify Python packages installed (if venv exists)
echo "Test 3.3: Python packages installed in virtual environment"
if [ -d "agent/whisper/venv" ]; then
    if [ -f "agent/whisper/venv/Scripts/python.exe" ]; then
        # Windows
        PYTHON_CMD="agent/whisper/venv/Scripts/python.exe"
    elif [ -f "agent/whisper/venv/bin/python" ]; then
        # Linux/Mac
        PYTHON_CMD="agent/whisper/venv/bin/python"
    else
        echo -e "${RED}✗ FAIL${NC} - Cannot find Python executable in venv"
        ((FAILED++))
        PYTHON_CMD=""
    fi

    if [ -n "$PYTHON_CMD" ]; then
        # Try to import key packages
        IMPORT_ERRORS=0
        for PKG in "flask" "flask_cors" "flask_limiter" "dotenv" "psutil" "whisper" "transformers" "torch"; do
            if $PYTHON_CMD -c "import $PKG" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} $PKG"
            else
                echo -e "  ${RED}✗${NC} $PKG - NOT INSTALLED"
                ((IMPORT_ERRORS++))
            fi
        done

        if [ $IMPORT_ERRORS -eq 0 ]; then
            echo -e "${GREEN}✓ PASS${NC} - All Python packages installed"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAIL${NC} - $IMPORT_ERRORS packages not installed"
            echo "  Run: cd agent/whisper && ./venv/Scripts/python.exe -m pip install -r requirements.txt"
            ((FAILED++))
        fi
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Virtual environment not found"
fi
echo ""

# ==============================================================================
# SECTION 4: SECURITY FIXES - REASON SERVER
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 4: SECURITY FIXES - REASON SERVER${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 4.1: Dotenv import
echo "Test 4.1: reason/server.ts - dotenv import"
if grep -q "import dotenv from 'dotenv'" reason/server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - dotenv imported"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - dotenv not imported"
    ((FAILED++))
fi
echo ""

# Test 4.2: Rate limiting
echo "Test 4.2: reason/server.ts - rate limiting implemented"
if grep -q "rateLimit" reason/server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - rate limiting code found"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - rate limiting not implemented"
    ((FAILED++))
fi
echo ""

# Test 4.3: CORS configuration
echo "Test 4.3: reason/server.ts - CORS properly configured"
if grep -q "allowedOrigins" reason/server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - CORS configuration found"
    if ! grep -q "app.use(cors())" reason/server.ts 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} - Wildcard CORS removed"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Wildcard CORS still present"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - CORS not properly configured"
    ((FAILED++))
fi
echo ""

# Test 4.4: Environment variable usage
echo "Test 4.4: reason/server.ts - environment variables loaded"
if grep -q "process.env.REASON_SERVER_PORT" reason/server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Environment variables used"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Environment variables not loaded"
    ((FAILED++))
fi
echo ""

# Test 4.5: Health check endpoints
echo "Test 4.5: reason/server.ts - health check endpoints"
if grep -q "/health" reason/server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Health check endpoints found"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Health check endpoints missing"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# SECTION 5: SECURITY FIXES - WHISPER SERVER
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 5: SECURITY FIXES - WHISPER SERVER${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 5.1: Dotenv import
echo "Test 5.1: agent/whisper/app.py - dotenv import"
if grep -q "from dotenv import load_dotenv" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - dotenv imported"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - dotenv not imported"
    ((FAILED++))
fi
echo ""

# Test 5.2: Flask-Limiter
echo "Test 5.2: agent/whisper/app.py - Flask-Limiter implemented"
if grep -q "from flask_limiter import Limiter" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Flask-Limiter imported"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Flask-Limiter not imported"
    ((FAILED++))
fi
echo ""

# Test 5.3: CORS configuration
echo "Test 5.3: agent/whisper/app.py - CORS properly configured"
if grep -q "allowed_origins" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - CORS configuration found"
    if ! grep -q "^CORS(app)$" agent/whisper/app.py 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} - Wildcard CORS removed"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Wildcard CORS may still be present"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - CORS not properly configured"
    ((FAILED++))
fi
echo ""

# Test 5.4: Temp file cleanup
echo "Test 5.4: agent/whisper/app.py - temp file cleanup implemented"
if grep -q "shutil.rmtree" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Temp file cleanup found"
    if grep -q "finally:" agent/whisper/app.py 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} - Proper try/finally block found"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Cleanup may not be in finally block"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Temp file cleanup not implemented"
    ((FAILED++))
fi
echo ""

# Test 5.5: Device flexibility (CPU/GPU)
echo "Test 5.5: agent/whisper/app.py - CPU/GPU device flexibility"
if grep -q "get_device()" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Device flexibility implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Hardcoded CUDA references may still exist"
    ((FAILED++))
fi
echo ""

# Test 5.6: Health check endpoints
echo "Test 5.6: agent/whisper/app.py - health check endpoints"
if grep -q "@app.route('/health'" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Health check endpoints found"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Health check endpoints missing"
    ((FAILED++))
fi
echo ""

# Test 5.7: Health checks exempt from rate limiting
echo "Test 5.7: agent/whisper/app.py - health checks exempt from rate limiting"
if grep -q "@limiter.exempt" agent/whisper/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Health checks exempt from rate limiting"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Health checks may not be exempt from rate limiting"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SECTION 6: DOCUMENTATION
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 6: DOCUMENTATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 6.1: Key documentation files exist
echo "Test 6.1: Documentation files exist"
DOCS=("INSTALLATION-SUMMARY.md" "SECURITY-FIXES-SUMMARY.md" "HEALTH-CHECKS.md" ".env-README.md")
MISSING_DOCS=0

for DOC in "${DOCS[@]}"; do
    if [ -f "$DOC" ]; then
        echo -e "  ${GREEN}✓${NC} $DOC"
    else
        echo -e "  ${YELLOW}⚠${NC} $DOC - MISSING (optional)"
        ((MISSING_DOCS++))
    fi
done

if [ $MISSING_DOCS -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - All documentation files present"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - $MISSING_DOCS documentation files missing"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SECTION 7: GIT CONFIGURATION
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 7: GIT CONFIGURATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 7.1: .gitignore has .env
echo "Test 7.1: .gitignore protects .env file"
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore 2>/dev/null || grep -q "^\.env" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} - .env is in .gitignore"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - .env not in .gitignore (SECURITY RISK!)"
        echo "  Add .env to .gitignore immediately"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC} - .gitignore not found"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
echo "======================================================================"
echo "PRE-FLIGHT VERIFICATION SUMMARY"
echo "======================================================================"
echo -e "Total Tests: $((PASSED + FAILED + WARNINGS))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL CHECKS PASSED!${NC}"
    echo ""
    echo "Your Phase 1 implementation is complete and ready for testing."
    echo ""
    echo "Next steps:"
    echo "  1. Start the servers:"
    echo "     - Terminal 1: npm run start-reason"
    echo "     - Terminal 2: cd agent/whisper && python app.py"
    echo ""
    echo "  2. Run functional tests:"
    echo "     ./test-phase1-functional.sh"
    echo ""
    echo "  3. Review test results and verify all functionality"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME CRITICAL CHECKS FAILED${NC}"
    echo ""
    echo "Please fix the failed checks before proceeding."
    echo "Review the detailed output above for specific issues."
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: Warnings are acceptable but should be reviewed.${NC}"
        echo ""
    fi
    exit 1
fi
