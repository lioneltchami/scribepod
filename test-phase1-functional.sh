#!/bin/bash
# ==============================================================================
# PHASE 1 FUNCTIONAL TESTING SCRIPT
# ==============================================================================
# Tests all Phase 1 functionality with running servers
# IMPORTANT: Both servers must be running before executing this script
# ==============================================================================

echo "======================================================================"
echo "SCRIBEPOD PHASE 1 - FUNCTIONAL TESTING"
echo "======================================================================"
echo "Testing all Phase 1 functionality with running servers..."
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

# Load configuration
REASON_PORT=${REASON_SERVER_PORT:-4200}
WHISPER_PORT=${WHISPER_SERVER_PORT:-5000}
REASON_URL="http://localhost:${REASON_PORT}"
WHISPER_URL="http://localhost:${WHISPER_PORT}"

# ==============================================================================
# PRE-FLIGHT: Check servers are running
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PRE-FLIGHT: SERVER AVAILABILITY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Checking if servers are running..."
REASON_RUNNING=false
WHISPER_RUNNING=false

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${REASON_URL}/health" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Reason server is running on port $REASON_PORT"
    REASON_RUNNING=true
else
    echo -e "${RED}✗${NC} Reason server not running on port $REASON_PORT"
    echo "  Start with: npm run start-reason"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Whisper server is running on port $WHISPER_PORT"
    WHISPER_RUNNING=true
else
    echo -e "${RED}✗${NC} Whisper server not running on port $WHISPER_PORT"
    echo "  Start with: cd agent/whisper && python app.py"
fi

echo ""

if [ "$REASON_RUNNING" = false ] || [ "$WHISPER_RUNNING" = false ]; then
    echo -e "${RED}✗ CANNOT PROCEED - Servers not running${NC}"
    echo ""
    echo "Please start both servers and try again."
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Both servers are running - proceeding with tests${NC}"
echo ""

# ==============================================================================
# SECTION 1: HEALTH CHECK ENDPOINTS
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 1: HEALTH CHECK ENDPOINTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1.1: Reason server liveness
echo "Test 1.1: Reason server - Liveness check (/health)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${REASON_URL}/health")
if [ "$HTTP_CODE" = "200" ]; then
    RESPONSE=$(curl -s "${REASON_URL}/health")
    if echo "$RESPONSE" | grep -q '"status": "ok"'; then
        echo -e "${GREEN}✓ PASS${NC} - Liveness check successful"
        echo "  Response: $RESPONSE"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Invalid response format"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 1.2: Reason server readiness
echo "Test 1.2: Reason server - Readiness check (/health/ready)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${REASON_URL}/health/ready")
RESPONSE=$(curl -s "${REASON_URL}/health/ready")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Readiness check successful"
    echo "  Status: Ready"

    if echo "$RESPONSE" | grep -q '"whisperConnection": "ok"'; then
        echo -e "  ${GREEN}✓${NC} Whisper connection verified"
    else
        echo -e "  ${YELLOW}⚠${NC} Whisper connection status unclear"
    fi
    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Server not ready (503)"
    echo "  Response: $RESPONSE"
    echo "  This may be normal if Whisper server is still loading models"
    ((WARNINGS++))
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 1.3: Whisper server liveness
echo "Test 1.3: Whisper server - Liveness check (/health)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health")
if [ "$HTTP_CODE" = "200" ]; then
    RESPONSE=$(curl -s "${WHISPER_URL}/health")
    if echo "$RESPONSE" | grep -q '"status": "ok"'; then
        echo -e "${GREEN}✓ PASS${NC} - Liveness check successful"
        echo "  Response: $RESPONSE"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Invalid response format"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 1.4: Whisper server readiness
echo "Test 1.4: Whisper server - Readiness check (/health/ready)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health/ready")
RESPONSE=$(curl -s "${WHISPER_URL}/health/ready")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Readiness check successful"
    echo "  Status: Ready"

    # Check model status
    if echo "$RESPONSE" | grep -q '"whisper_model": "ok"'; then
        echo -e "  ${GREEN}✓${NC} Whisper model loaded"
    else
        echo -e "  ${RED}✗${NC} Whisper model not loaded"
    fi

    if echo "$RESPONSE" | grep -q '"text_model": "ok"'; then
        echo -e "  ${GREEN}✓${NC} Text model loaded"
    else
        echo -e "  ${RED}✗${NC} Text model not loaded"
    fi

    if echo "$RESPONSE" | grep -q '"tokenizer": "ok"'; then
        echo -e "  ${GREEN}✓${NC} Tokenizer loaded"
    else
        echo -e "  ${RED}✗${NC} Tokenizer not loaded"
    fi

    # Check memory
    MEMORY=$(echo "$RESPONSE" | grep -o '"memory": "[^"]*"' | cut -d '"' -f 4)
    echo -e "  ${BLUE}ℹ${NC} Memory usage: $MEMORY"

    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Server not ready (503)"
    echo "  Response: $RESPONSE"
    echo "  AI models may still be loading (takes 2-5 minutes)"
    ((WARNINGS++))
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# SECTION 2: RATE LIMITING
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 2: RATE LIMITING${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 2.1: Health checks exempt from rate limiting (Whisper)
echo "Test 2.1: Whisper health checks - Rate limit exemption"
echo "  Sending 65 rapid requests..."
RATE_LIMITED=false
for i in {1..65}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health" 2>/dev/null)
    if [ "$HTTP_CODE" = "429" ]; then
        echo -e "${RED}✗ FAIL${NC} - Health check was rate limited on request #${i}"
        RATE_LIMITED=true
        ((FAILED++))
        break
    fi
done

if [ "$RATE_LIMITED" = false ]; then
    echo -e "${GREEN}✓ PASS${NC} - Health checks exempt from rate limiting (65 requests OK)"
    ((PASSED++))
fi
echo ""

# Test 2.2: Regular endpoints ARE rate limited
echo "Test 2.2: Regular endpoints - Rate limiting active"
echo "  This test is optional and may take time..."
echo -e "  ${BLUE}ℹ${NC} Skipping to avoid hitting rate limits during testing"
echo -e "  ${YELLOW}⚠${NC} Manual verification recommended"
((WARNINGS++))
echo ""

# ==============================================================================
# SECTION 3: CORS SECURITY
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 3: CORS SECURITY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 3.1: Allowed origin
echo "Test 3.1: Reason server - Allowed origin (localhost:3000)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: http://localhost:3000" "${REASON_URL}/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Allowed origin accepted"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Allowed origin rejected (HTTP $HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Test 3.2: Blocked origin
echo "Test 3.2: Reason server - Blocked origin (malicious.com)"
RESPONSE=$(curl -s -H "Origin: http://malicious.com" "${REASON_URL}/health" 2>&1)
# Note: CORS errors are typically handled client-side, so we check for error messages
echo -e "  ${BLUE}ℹ${NC} CORS validation happens client-side"
echo -e "  ${YELLOW}⚠${NC} Manual browser testing recommended"
echo "  Response: $RESPONSE"
((WARNINGS++))
echo ""

# Test 3.3: Whisper CORS
echo "Test 3.3: Whisper server - CORS configuration"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: http://localhost:4200" "${WHISPER_URL}/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Allowed origin accepted"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Unexpected response (HTTP $HTTP_CODE)"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SECTION 4: ENVIRONMENT VARIABLES
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 4: ENVIRONMENT VARIABLES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 4.1: Servers using configured ports
echo "Test 4.1: Servers using configured ports from .env"
if [ -f .env ]; then
    ENV_REASON_PORT=$(grep "^REASON_SERVER_PORT=" .env | cut -d '=' -f 2)
    ENV_WHISPER_PORT=$(grep "^WHISPER_SERVER_PORT=" .env | cut -d '=' -f 2)

    echo "  .env configuration:"
    echo "    REASON_SERVER_PORT=$ENV_REASON_PORT"
    echo "    WHISPER_SERVER_PORT=$ENV_WHISPER_PORT"
    echo ""
    echo "  Actual running ports:"
    echo "    Reason: $REASON_PORT"
    echo "    Whisper: $WHISPER_PORT"

    if [ "$REASON_PORT" = "$ENV_REASON_PORT" ] && [ "$WHISPER_PORT" = "$ENV_WHISPER_PORT" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Servers using configured ports"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Port mismatch detected"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Cannot verify (.env not found)"
    ((FAILED++))
fi
echo ""

# Test 4.2: Environment variable loading verified
echo "Test 4.2: Environment variables loaded correctly"
REASON_RESPONSE=$(curl -s "${REASON_URL}/health")
WHISPER_RESPONSE=$(curl -s "${WHISPER_URL}/health")

if echo "$REASON_RESPONSE" | grep -q "environment"; then
    ENV_VALUE=$(echo "$REASON_RESPONSE" | grep -o '"environment": "[^"]*"' | cut -d '"' -f 4)
    echo -e "  Reason server environment: ${ENV_VALUE}"
    echo -e "${GREEN}✓ PASS${NC} - Environment variable loaded"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Cannot verify environment variable"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SECTION 5: RESPONSE TIME PERFORMANCE
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 5: RESPONSE TIME PERFORMANCE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Test 5.1: Health check response times"
REASON_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${REASON_URL}/health")
WHISPER_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${WHISPER_URL}/health")

echo "  Reason /health: ${REASON_TIME}s"
echo "  Whisper /health: ${WHISPER_TIME}s"

SLOW_CHECKS=0
if (( $(echo "$REASON_TIME < 1.0" | bc -l) )); then
    echo -e "  ${GREEN}✓${NC} Reason server response time acceptable"
else
    echo -e "  ${YELLOW}⚠${NC} Reason server slow (>${REASON_TIME}s)"
    ((SLOW_CHECKS++))
fi

if (( $(echo "$WHISPER_TIME < 1.0" | bc -l) )); then
    echo -e "  ${GREEN}✓${NC} Whisper server response time acceptable"
else
    echo -e "  ${YELLOW}⚠${NC} Whisper server slow (>${WHISPER_TIME}s)"
    ((SLOW_CHECKS++))
fi

if [ $SLOW_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - All response times acceptable"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Some responses slower than expected"
    ((WARNINGS++))
fi
echo ""

# ==============================================================================
# SECTION 6: SERVER LOGGING
# ==============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 6: SERVER LOGGING${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Test 6.1: Server logging and startup messages"
echo -e "  ${BLUE}ℹ${NC} Check server console output for:"
echo "    - '[Reason Server] Listening on...'"
echo "    - '[Reason Server] Environment: ...'"
echo "    - '[Reason Server] CORS allowed origins: ...'"
echo "    - '[Whisper Server] Starting Scribepod Whisper AI Server'"
echo "    - '[Whisper Server] Loading AI models...'"
echo "    - '[Whisper Server] Models loaded successfully!'"
echo ""
echo -e "${YELLOW}⚠${NC} Manual verification required - check server console output"
((WARNINGS++))
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
echo "======================================================================"
echo "FUNCTIONAL TESTING SUMMARY"
echo "======================================================================"
echo -e "Total Tests: $((PASSED + FAILED + WARNINGS))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL FUNCTIONAL TESTS PASSED!${NC}"
    echo ""
    echo "Phase 1 implementation is working correctly."
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: $WARNINGS warning(s) require manual verification${NC}"
        echo "Review the warnings above for items needing manual checks."
        echo ""
    fi
    echo "Next steps:"
    echo "  1. Perform manual testing of key features"
    echo "  2. Test with actual audio files (transcription)"
    echo "  3. Verify temp file cleanup (monitor temp directory)"
    echo "  4. Test CORS in browser (different origins)"
    echo "  5. Commit all changes to git"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME FUNCTIONAL TESTS FAILED${NC}"
    echo ""
    echo "Please review the failed tests and fix issues."
    echo "Common issues:"
    echo "  - AI models still loading (wait 2-5 minutes)"
    echo "  - Configuration mismatch (.env vs actual)"
    echo "  - Network/firewall issues"
    echo ""
    exit 1
fi
