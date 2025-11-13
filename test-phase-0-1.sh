#!/bin/bash

# Phase 0.1 Critical Bug Fixes - Validation Script
# This script validates all the critical bug fixes we made

set -e

echo "========================================"
echo "PHASE 0.1 VALIDATION TESTS"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check for duplicate function definitions in Python
echo "[TEST 1] Checking for duplicate function definitions in agent/whisper/app.py..."
DUPLICATE_COUNT=$(grep -n "^def build_state\|^def get_persons_intent\|^def get_inference_about_person" agent/whisper/app.py | wc -l)
if [ "$DUPLICATE_COUNT" -eq 3 ]; then
    echo "✓ PASS: No duplicate functions found (each function defined exactly once)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Expected 3 function definitions, found $DUPLICATE_COUNT"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check for semaphore fix in frontend
echo "[TEST 2] Checking for semaphore fix in agent/ear/src/index.tsx..."
if grep -q "if (!semaphore)" agent/ear/src/index.tsx; then
    echo "✓ PASS: Semaphore check added at beginning of event handler"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Semaphore fix not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check for error handling in localInference.ts
echo "[TEST 3] Checking for error handling in reason/localInference.ts..."
if grep -q "class TranscriptionError\|class ThoughtGenerationError" reason/localInference.ts; then
    echo "✓ PASS: Custom error classes defined"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Custom error classes not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check for environment variables usage
echo "[TEST 4] Checking for environment variable usage..."
ENV_VAR_COUNT=0

if grep -q "WHISPER_SERVER_URL" reason/localInference.ts; then
    echo "  ✓ WHISPER_SERVER_URL used in localInference.ts"
    ((ENV_VAR_COUNT++))
fi

if grep -q "REACT_APP_REASON_SERVER_URL" agent/ear/src/config.ts; then
    echo "  ✓ REACT_APP_REASON_SERVER_URL used in config.ts"
    ((ENV_VAR_COUNT++))
fi

if [ "$ENV_VAR_COUNT" -eq 2 ]; then
    echo "✓ PASS: Environment variables correctly used"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Environment variables not properly configured"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check for HTTP timeouts
echo "[TEST 5] Checking for HTTP timeouts..."
TIMEOUT_COUNT=0

if grep -q "timeout: HTTP_TIMEOUT_MS" reason/localInference.ts; then
    echo "  ✓ Axios timeout configured in localInference.ts"
    ((TIMEOUT_COUNT++))
fi

if grep -q "fetchWithTimeout" agent/ear/src/config.ts; then
    echo "  ✓ Fetch timeout helper created in config.ts"
    ((TIMEOUT_COUNT++))
fi

if grep -q "config.fetchWithTimeout" agent/ear/src/index.tsx; then
    echo "  ✓ Fetch timeout helper used in index.tsx"
    ((TIMEOUT_COUNT++))
fi

if [ "$TIMEOUT_COUNT" -eq 3 ]; then
    echo "✓ PASS: HTTP timeouts properly configured"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: HTTP timeouts not fully implemented"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check .env.example updated
echo "[TEST 6] Checking .env.example configuration..."
ENV_EXAMPLE_COUNT=0

if grep -q "WHISPER_SERVER_URL" .env.example; then
    ((ENV_EXAMPLE_COUNT++))
fi

if grep -q "HTTP_TIMEOUT_MS" .env.example; then
    ((ENV_EXAMPLE_COUNT++))
fi

if grep -q "CORS_ALLOWED_ORIGINS" .env.example; then
    ((ENV_EXAMPLE_COUNT++))
fi

if [ "$ENV_EXAMPLE_COUNT" -eq 3 ]; then
    echo "✓ PASS: .env.example contains all required variables"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: .env.example missing some variables"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check Python syntax
echo "[TEST 7] Validating Python syntax..."
if python3 -m py_compile agent/whisper/app.py 2>/dev/null; then
    echo "✓ PASS: Python code has no syntax errors"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Python syntax errors detected"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check for hardcoded URLs removal
echo "[TEST 8] Checking for hardcoded URL removal..."
HARDCODED_FOUND=0

if grep -q "http://0.0.0.0:5000/transcribe" reason/localInference.ts 2>/dev/null; then
    echo "  ✗ Found hardcoded URL in localInference.ts"
    ((HARDCODED_FOUND++))
fi

if grep -q "http://0.0.0.0:4200/conversation" agent/ear/src/index.tsx 2>/dev/null; then
    echo "  ✗ Found hardcoded URL in index.tsx"
    ((HARDCODED_FOUND++))
fi

if [ "$HARDCODED_FOUND" -eq 0 ]; then
    echo "✓ PASS: No hardcoded URLs found in critical files"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Hardcoded URLs still present"
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
    echo "Phase 0.1 critical bug fixes have been successfully validated."
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    echo "Please review the failed tests above."
    exit 1
fi
