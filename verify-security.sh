#!/bin/bash
# ==============================================================================
# SECURITY FIXES VERIFICATION SCRIPT
# ==============================================================================
# Tests all Phase 1 security fixes to ensure they're working correctly
# Run this after starting the servers to verify security is properly configured
# ==============================================================================

echo "======================================================================"
echo "SCRIBEPOD SECURITY VERIFICATION"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# ==============================================================================
# TEST 1: Environment Variables Loaded
# ==============================================================================
echo "TEST 1: Checking .env file exists..."
if [ -f .env ]; then
    echo -e "${GREEN}✓ PASS${NC} - .env file exists"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - .env file not found"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 2: CORS Configuration
# ==============================================================================
echo "TEST 2: Checking CORS_ALLOWED_ORIGINS is configured..."
if grep -q "CORS_ALLOWED_ORIGINS" .env; then
    CORS_VALUE=$(grep "CORS_ALLOWED_ORIGINS" .env | cut -d '=' -f 2)
    if [[ "$CORS_VALUE" == *"localhost"* ]]; then
        echo -e "${GREEN}✓ PASS${NC} - CORS configured: $CORS_VALUE"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - CORS may be misconfigured: $CORS_VALUE"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - CORS_ALLOWED_ORIGINS not found in .env"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 3: Rate Limiting Configuration
# ==============================================================================
echo "TEST 3: Checking rate limiting is configured..."
if grep -q "RATE_LIMIT_MAX_REQUESTS" .env; then
    RATE_LIMIT=$(grep "RATE_LIMIT_MAX_REQUESTS" .env | cut -d '=' -f 2)
    echo -e "${GREEN}✓ PASS${NC} - Rate limiting configured: $RATE_LIMIT requests/minute"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - RATE_LIMIT_MAX_REQUESTS not found in .env"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 4: Security Dependencies Installed (Node.js)
# ==============================================================================
echo "TEST 4: Checking Node.js security dependencies..."
if [ -f package.json ]; then
    if grep -q '"dotenv"' package.json && grep -q '"express-rate-limit"' package.json; then
        echo -e "${GREEN}✓ PASS${NC} - Security dependencies found in package.json"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Security dependencies missing from package.json"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - package.json not found"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 5: Security Dependencies Installed (Python)
# ==============================================================================
echo "TEST 5: Checking Python security dependencies..."
if [ -f agent/whisper/requirements.txt ]; then
    if grep -q "python-dotenv" agent/whisper/requirements.txt && grep -q "flask-limiter" agent/whisper/requirements.txt; then
        echo -e "${GREEN}✓ PASS${NC} - Security dependencies found in requirements.txt"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Security dependencies missing from requirements.txt"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - requirements.txt not found"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 6: Code Contains Security Fixes (reason/server.ts)
# ==============================================================================
echo "TEST 6: Verifying security fixes in reason/server.ts..."
if [ -f reason/server.ts ]; then
    HAS_DOTENV=false
    HAS_RATE_LIMIT=false
    HAS_CORS_CONFIG=false

    if grep -q "import dotenv" reason/server.ts; then
        HAS_DOTENV=true
    fi

    if grep -q "rateLimit" reason/server.ts; then
        HAS_RATE_LIMIT=true
    fi

    if grep -q "allowedOrigins" reason/server.ts; then
        HAS_CORS_CONFIG=true
    fi

    if [ "$HAS_DOTENV" = true ] && [ "$HAS_RATE_LIMIT" = true ] && [ "$HAS_CORS_CONFIG" = true ]; then
        echo -e "${GREEN}✓ PASS${NC} - All security fixes found in reason/server.ts"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Security fixes incomplete in reason/server.ts"
        echo "  - dotenv import: $HAS_DOTENV"
        echo "  - rate limiting: $HAS_RATE_LIMIT"
        echo "  - CORS config: $HAS_CORS_CONFIG"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - reason/server.ts not found"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 7: Code Contains Security Fixes (agent/whisper/app.py)
# ==============================================================================
echo "TEST 7: Verifying security fixes in agent/whisper/app.py..."
if [ -f agent/whisper/app.py ]; then
    HAS_DOTENV=false
    HAS_LIMITER=false
    HAS_CLEANUP=false

    if grep -q "from dotenv import load_dotenv" agent/whisper/app.py; then
        HAS_DOTENV=true
    fi

    if grep -q "from flask_limiter import Limiter" agent/whisper/app.py; then
        HAS_LIMITER=true
    fi

    if grep -q "shutil.rmtree" agent/whisper/app.py; then
        HAS_CLEANUP=true
    fi

    if [ "$HAS_DOTENV" = true ] && [ "$HAS_LIMITER" = true ] && [ "$HAS_CLEANUP" = true ]; then
        echo -e "${GREEN}✓ PASS${NC} - All security fixes found in agent/whisper/app.py"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Security fixes incomplete in agent/whisper/app.py"
        echo "  - dotenv import: $HAS_DOTENV"
        echo "  - flask_limiter: $HAS_LIMITER"
        echo "  - temp cleanup: $HAS_CLEANUP"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - agent/whisper/app.py not found"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 8: Flask Debug Mode
# ==============================================================================
echo "TEST 8: Checking Flask debug mode is disabled..."
if grep -q "FLASK_DEBUG" .env; then
    DEBUG_VALUE=$(grep "FLASK_DEBUG" .env | cut -d '=' -f 2)
    if [ "$DEBUG_VALUE" = "0" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Flask debug mode disabled (secure)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Flask debug mode enabled (only OK for development)"
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC} - FLASK_DEBUG not configured in .env"
fi
echo ""

# ==============================================================================
# TEST 9: API Key Configured
# ==============================================================================
echo "TEST 9: Checking API key is configured..."
if grep -q "API_KEY" .env; then
    API_KEY=$(grep "API_KEY" .env | cut -d '=' -f 2)
    KEY_LENGTH=${#API_KEY}
    if [ $KEY_LENGTH -ge 32 ]; then
        echo -e "${GREEN}✓ PASS${NC} - API key configured (length: $KEY_LENGTH characters)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - API key too short (length: $KEY_LENGTH, minimum: 32)"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - API_KEY not found in .env"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "======================================================================"
echo "VERIFICATION SUMMARY"
echo "======================================================================"
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL SECURITY CHECKS PASSED!${NC}"
    echo ""
    echo "Security fixes are properly configured."
    echo "You can now proceed to start the servers and test functionality."
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME SECURITY CHECKS FAILED${NC}"
    echo ""
    echo "Please review the failed checks above and fix any issues."
    echo "Refer to SECURITY-FIXES-SUMMARY.md for detailed information."
    echo ""
    exit 1
fi
