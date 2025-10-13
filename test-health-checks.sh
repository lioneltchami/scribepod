#!/bin/bash
# ==============================================================================
# HEALTH CHECK TESTING SCRIPT
# ==============================================================================
# Tests all health check endpoints on both servers
# Run this after starting both servers to verify health checks work properly
# ==============================================================================

echo "======================================================================"
echo "SCRIBEPOD HEALTH CHECK TESTING"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Get configuration from .env or use defaults
REASON_PORT=${REASON_SERVER_PORT:-4200}
WHISPER_PORT=${WHISPER_SERVER_PORT:-5000}

REASON_URL="http://localhost:${REASON_PORT}"
WHISPER_URL="http://localhost:${WHISPER_PORT}"

# ==============================================================================
# TEST 1: Reason Server - Liveness Check
# ==============================================================================
echo -e "${BLUE}TEST 1: Reason Server - Liveness Check${NC}"
echo "Endpoint: GET ${REASON_URL}/health"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${REASON_URL}/health" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Reason server is alive (200 OK)"
    RESPONSE=$(curl -s "${REASON_URL}/health" 2>/dev/null)
    echo "Response: $RESPONSE"
    ((PASSED++))
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ FAIL${NC} - Cannot connect to Reason server"
    echo "Is the Reason server running on port ${REASON_PORT}?"
    echo "Start it with: npm run start-reason"
    ((FAILED++))
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected status code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 2: Whisper Server - Liveness Check
# ==============================================================================
echo -e "${BLUE}TEST 2: Whisper Server - Liveness Check${NC}"
echo "Endpoint: GET ${WHISPER_URL}/health"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Whisper server is alive (200 OK)"
    RESPONSE=$(curl -s "${WHISPER_URL}/health" 2>/dev/null)
    echo "Response: $RESPONSE"
    ((PASSED++))
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ FAIL${NC} - Cannot connect to Whisper server"
    echo "Is the Whisper server running on port ${WHISPER_PORT}?"
    echo "Start it with: cd agent/whisper && python app.py"
    ((FAILED++))
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected status code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 3: Reason Server - Readiness Check
# ==============================================================================
echo -e "${BLUE}TEST 3: Reason Server - Readiness Check${NC}"
echo "Endpoint: GET ${REASON_URL}/health/ready"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${REASON_URL}/health/ready" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Reason server is ready (200 OK)"
    RESPONSE=$(curl -s "${REASON_URL}/health/ready" 2>/dev/null)
    echo "Response: $RESPONSE"
    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Reason server not ready (503 Service Unavailable)"
    RESPONSE=$(curl -s "${REASON_URL}/health/ready" 2>/dev/null)
    echo "Response: $RESPONSE"
    echo "This usually means the Whisper server is not reachable"
    echo "Make sure Whisper server is running on ${WHISPER_URL}"
    ((FAILED++))
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ FAIL${NC} - Cannot connect to Reason server"
    ((FAILED++))
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected status code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 4: Whisper Server - Readiness Check
# ==============================================================================
echo -e "${BLUE}TEST 4: Whisper Server - Readiness Check${NC}"
echo "Endpoint: GET ${WHISPER_URL}/health/ready"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health/ready" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Whisper server is ready (200 OK)"
    RESPONSE=$(curl -s "${WHISPER_URL}/health/ready" 2>/dev/null)
    echo "Response: $RESPONSE"

    # Check if models are loaded
    if echo "$RESPONSE" | grep -q '"whisper_model": "ok"'; then
        echo -e "${GREEN}  ✓ Whisper model loaded${NC}"
    fi
    if echo "$RESPONSE" | grep -q '"text_model": "ok"'; then
        echo -e "${GREEN}  ✓ Text model loaded${NC}"
    fi
    if echo "$RESPONSE" | grep -q '"tokenizer": "ok"'; then
        echo -e "${GREEN}  ✓ Tokenizer loaded${NC}"
    fi

    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Whisper server not ready (503 Service Unavailable)"
    RESPONSE=$(curl -s "${WHISPER_URL}/health/ready" 2>/dev/null)
    echo "Response: $RESPONSE"

    # Check what's not ready
    if echo "$RESPONSE" | grep -q '"whisper_model": "not_loaded"'; then
        echo -e "${YELLOW}  ⚠ Whisper model not loaded${NC}"
        echo "    Models may still be loading (takes 2-5 minutes on first start)"
    fi
    if echo "$RESPONSE" | grep -q '"text_model": "not_loaded"'; then
        echo -e "${YELLOW}  ⚠ Text model not loaded${NC}"
    fi
    if echo "$RESPONSE" | grep -q '"memory_status": "critical"'; then
        echo -e "${YELLOW}  ⚠ Memory usage critical (>90%)${NC}"
    fi

    ((FAILED++))
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ FAIL${NC} - Cannot connect to Whisper server"
    ((FAILED++))
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected status code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# ==============================================================================
# TEST 5: Health Check Response Time
# ==============================================================================
echo -e "${BLUE}TEST 5: Health Check Response Time${NC}"
echo "Testing response times for all endpoints..."

REASON_HEALTH_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${REASON_URL}/health" 2>/dev/null)
WHISPER_HEALTH_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${WHISPER_URL}/health" 2>/dev/null)

echo "  Reason /health: ${REASON_HEALTH_TIME}s"
echo "  Whisper /health: ${WHISPER_HEALTH_TIME}s"

# Check if response times are reasonable (<1 second for health checks)
if (( $(echo "$REASON_HEALTH_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - Reason health check responds quickly"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Reason health check slow (>${REASON_HEALTH_TIME}s)"
fi

if (( $(echo "$WHISPER_HEALTH_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - Whisper health check responds quickly"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Whisper health check slow (>${WHISPER_HEALTH_TIME}s)"
fi
echo ""

# ==============================================================================
# TEST 6: Rate Limiting Exemption (Whisper)
# ==============================================================================
echo -e "${BLUE}TEST 6: Rate Limiting Exemption (Whisper Health Checks)${NC}"
echo "Sending 65 rapid requests to verify health checks are exempt from rate limiting..."

RATE_LIMIT_FAILED=false
for i in {1..65}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WHISPER_URL}/health" 2>/dev/null)
    if [ "$HTTP_CODE" = "429" ]; then
        echo -e "${RED}✗ FAIL${NC} - Health check was rate limited on request #${i}"
        RATE_LIMIT_FAILED=true
        ((FAILED++))
        break
    fi
done

if [ "$RATE_LIMIT_FAILED" = false ]; then
    echo -e "${GREEN}✓ PASS${NC} - Health checks are exempt from rate limiting (65 requests succeeded)"
    ((PASSED++))
fi
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "======================================================================"
echo "SUMMARY"
echo "======================================================================"
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL HEALTH CHECKS PASSED!${NC}"
    echo ""
    echo "Both servers are running and healthy."
    echo "Health check endpoints are ready for production use."
    echo ""
    echo "Integration examples:"
    echo "  - Docker: See HEALTH-CHECKS.md for docker-compose configuration"
    echo "  - Kubernetes: See HEALTH-CHECKS.md for pod configuration"
    echo "  - Monitoring: Configure Prometheus to scrape these endpoints"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME HEALTH CHECKS FAILED${NC}"
    echo ""
    echo "Please review the failed checks above and ensure:"
    echo "  1. Both servers are running"
    echo "  2. Servers are configured with correct ports"
    echo "  3. AI models have finished loading (Whisper server)"
    echo "  4. Network connectivity is working"
    echo ""
    echo "Refer to HEALTH-CHECKS.md for troubleshooting guidance."
    echo ""
    exit 1
fi
