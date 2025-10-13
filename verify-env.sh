#!/bin/bash
echo "=================================================="
echo "  .ENV FILE VERIFICATION"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. FILE EXISTENCE CHECKS"
echo "-----------------------------------"

# Check .env exists
if [ -f .env ]; then
    check_pass ".env file exists"
else
    check_fail ".env file missing!"
    exit 1
fi

# Check .env in .gitignore
if grep -q "^\.env$" .gitignore; then
    check_pass ".env is in .gitignore (won't be committed)"
else
    check_fail ".env NOT in .gitignore (security risk!)"
fi

# Check logs ignored
if grep -q "^logs/" .gitignore; then
    check_pass "logs/ directory is in .gitignore"
else
    check_warn "logs/ not in .gitignore (recommended)"
fi

echo ""
echo "2. CRITICAL SECURITY CHECKS"
echo "-----------------------------------"

# Check API key is not default
if grep -q "GENERATE_NEW_KEY" .env; then
    check_fail "API_KEY still has default value!"
elif grep -q "^API_KEY=.\{32,\}" .env; then
    check_pass "API_KEY is set with sufficient length"
else
    check_fail "API_KEY is too short or missing!"
fi

# Check API key strength
API_KEY_LENGTH=$(grep "^API_KEY=" .env | cut -d'=' -f2 | wc -c)
if [ $API_KEY_LENGTH -ge 64 ]; then
    check_pass "API_KEY length is $API_KEY_LENGTH characters (strong)"
else
    check_warn "API_KEY length is $API_KEY_LENGTH characters (consider longer)"
fi

echo ""
echo "3. SERVER CONFIGURATION CHECKS"
echo "-----------------------------------"

# Check required variables exist
for var in NODE_ENV REASON_SERVER_PORT WHISPER_SERVER_PORT CORS_ALLOWED_ORIGINS FLASK_ENV; do
    if grep -q "^${var}=" .env; then
        VALUE=$(grep "^${var}=" .env | cut -d'=' -f2)
        check_pass "$var is set to: $VALUE"
    else
        check_fail "$var is missing!"
    fi
done

echo ""
echo "4. SECURITY POSTURE CHECKS"
echo "-----------------------------------"

# Check FLASK_DEBUG is off
if grep -q "^FLASK_DEBUG=0" .env; then
    check_pass "FLASK_DEBUG is OFF (secure for production)"
elif grep -q "^FLASK_DEBUG=1" .env; then
    check_warn "FLASK_DEBUG is ON (only use in development!)"
else
    check_fail "FLASK_DEBUG not set!"
fi

# Check LOG_LEVEL
if grep -q "^LOG_LEVEL=" .env; then
    LOG_LEVEL=$(grep "^LOG_LEVEL=" .env | cut -d'=' -f2)
    check_pass "LOG_LEVEL is set to: $LOG_LEVEL"
else
    check_warn "LOG_LEVEL not set (will use default)"
fi

echo ""
echo "5. CORS SECURITY CHECKS"
echo "-----------------------------------"

CORS_ORIGINS=$(grep "^CORS_ALLOWED_ORIGINS=" .env | cut -d'=' -f2)
if [ -z "$CORS_ORIGINS" ]; then
    check_fail "CORS_ALLOWED_ORIGINS is empty!"
elif echo "$CORS_ORIGINS" | grep -q "localhost"; then
    check_pass "CORS includes localhost (good for development)"
    if [ "$NODE_ENV" == "production" ]; then
        check_warn "Using localhost in production - update for your domain!"
    fi
else
    check_pass "CORS configured for: $CORS_ORIGINS"
fi

echo ""
echo "6. OPTIONAL API KEYS CHECKS"
echo "-----------------------------------"

# Check if external API keys are set
for var in OPENAI_API_KEY PLAY_HT_SECRET_KEY ELEVEN_API; do
    if grep "^${var}=your-" .env > /dev/null 2>&1; then
        check_warn "$var not configured (only needed for podcast mode)"
    elif grep -q "^${var}=.\+$" .env; then
        check_pass "$var is configured"
    else
        check_warn "$var not set"
    fi
done

echo ""
echo "=================================================="
echo "  SUMMARY"
echo "=================================================="
echo -e "${GREEN}Passed:${NC} $PASS"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $FAIL"
fi
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL CHECKS PASSED!${NC}"
    echo "Your .env file is properly configured."
    echo ""
    echo "Next steps:"
    echo "  1. Install dependencies (npm install && pip install -r requirements.txt)"
    echo "  2. Apply security fixes from QUICK-START.md"
    echo "  3. Start services and test"
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED!${NC}"
    echo "Please fix the issues above before proceeding."
    exit 1
fi
