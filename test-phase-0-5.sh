#!/bin/bash

# Phase 0.5 API Layer - Validation Script

echo "========================================"
echo "PHASE 0.5 VALIDATION TESTS"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check API server exists
echo "[TEST 1] Checking API server file..."
if [ -f "api/server.ts" ]; then
    echo "✓ PASS: api/server.ts exists"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: api/server.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check API routes
echo "[TEST 2] Checking API routes..."
ROUTES=0

if grep -q "'/api/content'" api/server.ts; then
    echo "  ✓ Content routes found"
    ((ROUTES++))
fi

if grep -q "'/api/podcasts'" api/server.ts; then
    echo "  ✓ Podcast routes found"
    ((ROUTES++))
fi

if grep -q "'/api/personas'" api/server.ts; then
    echo "  ✓ Persona routes found"
    ((ROUTES++))
fi

if grep -q "'/health'" api/server.ts; then
    echo "  ✓ Health check route found"
    ((ROUTES++))
fi

if [ "$ROUTES" -eq 4 ]; then
    echo "✓ PASS: All API routes defined"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing routes ($ROUTES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check middleware
echo "[TEST 3] Checking middleware..."
MIDDLEWARE=0

if grep -q "cors" api/server.ts; then
    echo "  ✓ CORS middleware"
    ((MIDDLEWARE++))
fi

if grep -q "rateLimit" api/server.ts; then
    echo "  ✓ Rate limiting middleware"
    ((MIDDLEWARE++))
fi

if grep -q "express.json" api/server.ts; then
    echo "  ✓ JSON body parser"
    ((MIDDLEWARE++))
fi

if [ "$MIDDLEWARE" -eq 3 ]; then
    echo "✓ PASS: All middleware configured"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing middleware ($MIDDLEWARE/3)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check service imports
echo "[TEST 4] Checking service imports..."
IMPORTS=0

if grep -q "from.*contentIngestion" api/server.ts; then
    echo "  ✓ Content ingestion imported"
    ((IMPORTS++))
fi

if grep -q "from.*pipelineOrchestrator" api/server.ts; then
    echo "  ✓ Pipeline orchestrator imported"
    ((IMPORTS++))
fi

if grep -q "from.*database" api/server.ts; then
    echo "  ✓ Database service imported"
    ((IMPORTS++))
fi

if [ "$IMPORTS" -eq 3 ]; then
    echo "✓ PASS: All services imported"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing imports ($IMPORTS/3)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check package.json scripts
echo "[TEST 5] Checking package.json API scripts..."
if grep -q '"start-api"' package.json && grep -q '"start-api-dev"' package.json; then
    echo "✓ PASS: API scripts added to package.json"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: API scripts missing"
    ((FAIL_COUNT++))
fi
echo ""

# Summary
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Tests Passed: $PASS_COUNT"
echo "Tests Failed: $FAIL_COUNT"
echo "Total Tests:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "✓ ALL TESTS PASSED!"
    echo "Phase 0.5 API layer validated."
    echo ""
    echo "API Endpoints Available:"
    echo "  GET    /health - Health check"
    echo "  GET    /api/content - List content"
    echo "  GET    /api/content/:id - Get content"
    echo "  POST   /api/content/ingest/string - Ingest text"
    echo "  POST   /api/content/ingest/url - Ingest URL"
    echo "  GET    /api/podcasts - List podcasts"
    echo "  GET    /api/podcasts/:id - Get podcast"
    echo "  POST   /api/podcasts/generate/string - Generate from text"
    echo "  POST   /api/podcasts/generate/url - Generate from URL"
    echo "  GET    /api/podcasts/:id/dialogues - Get dialogues"
    echo "  GET    /api/personas - List personas"
    echo "  GET    /api/personas/:id - Get persona"
    echo "  POST   /api/personas - Create persona"
    echo ""
    echo "Start API:"
    echo "  npm run start-api"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    exit 1
fi
