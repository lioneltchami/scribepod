#!/bin/bash

# Phase 0.2 OpenAI Integration - Validation Script
# This script validates all the OpenAI service integration work

set -e

echo "========================================"
echo "PHASE 0.2 VALIDATION TESTS"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check OpenAI SDK in package.json
echo "[TEST 1] Checking for OpenAI SDK in package.json..."
if grep -q '"openai".*"^4' package.json; then
    echo "✓ PASS: OpenAI SDK v4+ found in package.json"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: OpenAI SDK not found or wrong version"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check p-retry in package.json
echo "[TEST 2] Checking for p-retry in package.json..."
if grep -q '"p-retry"' package.json; then
    echo "✓ PASS: p-retry found in package.json"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: p-retry not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check services/openai.ts exists and has key functions
echo "[TEST 3] Checking services/openai.ts structure..."
OPENAI_FUNCTIONS=0

if [ -f "services/openai.ts" ]; then
    if grep -q "export async function generateCompletion" services/openai.ts; then
        echo "  ✓ generateCompletion function found"
        ((OPENAI_FUNCTIONS++))
    fi

    if grep -q "export async function extractFacts" services/openai.ts; then
        echo "  ✓ extractFacts function found"
        ((OPENAI_FUNCTIONS++))
    fi

    if grep -q "export async function generateDialogueFromFacts" services/openai.ts; then
        echo "  ✓ generateDialogueFromFacts function found"
        ((OPENAI_FUNCTIONS++))
    fi

    if grep -q "export class OpenAIError" services/openai.ts; then
        echo "  ✓ OpenAIError class found"
        ((OPENAI_FUNCTIONS++))
    fi

    if grep -q "import pRetry from 'p-retry'" services/openai.ts; then
        echo "  ✓ p-retry import found"
        ((OPENAI_FUNCTIONS++))
    fi
fi

if [ "$OPENAI_FUNCTIONS" -eq 5 ]; then
    echo "✓ PASS: services/openai.ts has all required functions"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: services/openai.ts missing some functions ($OPENAI_FUNCTIONS/5)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check services/openai.test.ts exists
echo "[TEST 4] Checking services/openai.test.ts..."
if [ -f "services/openai.test.ts" ] && grep -q "async function testBasicCompletion" services/openai.test.ts; then
    echo "✓ PASS: OpenAI test file exists with test functions"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: OpenAI test file missing or incomplete"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check shared/types/podcast.ts exists with key types
echo "[TEST 5] Checking shared/types/podcast.ts..."
PODCAST_TYPES=0

if [ -f "shared/types/podcast.ts" ]; then
    if grep -q "export interface PersonaConfig" shared/types/podcast.ts; then
        echo "  ✓ PersonaConfig interface found"
        ((PODCAST_TYPES++))
    fi

    if grep -q "export interface DialogueTurn" shared/types/podcast.ts; then
        echo "  ✓ DialogueTurn interface found"
        ((PODCAST_TYPES++))
    fi

    if grep -q "export interface ChatMessage" shared/types/podcast.ts; then
        echo "  ✓ ChatMessage interface found"
        ((PODCAST_TYPES++))
    fi

    if grep -q "export interface CompletionOptions" shared/types/podcast.ts; then
        echo "  ✓ CompletionOptions interface found"
        ((PODCAST_TYPES++))
    fi
fi

if [ "$PODCAST_TYPES" -eq 4 ]; then
    echo "✓ PASS: shared/types/podcast.ts has all required types"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: shared/types/podcast.ts missing some types ($PODCAST_TYPES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check shared/types/index.ts exists
echo "[TEST 6] Checking shared/types/index.ts..."
if [ -f "shared/types/index.ts" ] && grep -q "export.*from './podcast'" shared/types/index.ts; then
    echo "✓ PASS: shared/types/index.ts exists and exports podcast types"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: shared/types/index.ts missing or incorrect"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check processWebpage.ts updated to use new OpenAI service
echo "[TEST 7] Checking processWebpage.ts uses new OpenAI service..."
PROCESSWEBPAGE_UPDATES=0

if [ -f "scribepod/lib/processWebpage.ts" ]; then
    if grep -q "import.*extractFacts.*from '../../services/openai'" scribepod/lib/processWebpage.ts; then
        echo "  ✓ extractFacts imported from new service"
        ((PROCESSWEBPAGE_UPDATES++))
    fi

    if grep -q "import.*generateDialogueFromFacts.*from '../../services/openai'" scribepod/lib/processWebpage.ts; then
        echo "  ✓ generateDialogueFromFacts imported from new service"
        ((PROCESSWEBPAGE_UPDATES++))
    fi

    if grep -q "await extractFacts" scribepod/lib/processWebpage.ts; then
        echo "  ✓ extractFacts function called"
        ((PROCESSWEBPAGE_UPDATES++))
    fi

    if grep -q "await generateDialogueFromFacts" scribepod/lib/processWebpage.ts; then
        echo "  ✓ generateDialogueFromFacts function called"
        ((PROCESSWEBPAGE_UPDATES++))
    fi
fi

if [ "$PROCESSWEBPAGE_UPDATES" -eq 4 ]; then
    echo "✓ PASS: processWebpage.ts updated to use new OpenAI service"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: processWebpage.ts not fully updated ($PROCESSWEBPAGE_UPDATES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check old hardcoded API removed
echo "[TEST 8] Checking old hardcoded API removed..."
HARDCODED_REMOVED=0

if ! grep -q "PROMPT_URL.*http://localhost:3000/conversation" scribepod/lib/processWebpage.ts 2>/dev/null; then
    echo "  ✓ Old PROMPT_URL constant removed"
    ((HARDCODED_REMOVED++))
fi

if ! grep -q "function promptGPT" scribepod/lib/processWebpage.ts 2>/dev/null; then
    echo "  ✓ Old promptGPT function removed"
    ((HARDCODED_REMOVED++))
fi

if ! grep -q "import got from 'got'" scribepod/lib/processWebpage.ts 2>/dev/null; then
    echo "  ✓ Old 'got' import removed"
    ((HARDCODED_REMOVED++))
fi

if [ "$HARDCODED_REMOVED" -eq 3 ]; then
    echo "✓ PASS: Old hardcoded API completely removed"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Some old hardcoded API code still present"
    ((FAIL_COUNT++))
fi
echo ""

# Test 9: Check OpenAI service can be imported
echo "[TEST 9] Checking OpenAI service can be imported..."
if npx tsx --eval "import('./services/openai.js').then(() => process.exit(0)).catch(() => process.exit(1))" 2>&1 | grep -q "OPENAI_API_KEY"; then
    echo "✓ PASS: OpenAI service imports correctly (API key warning expected)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: OpenAI service import failed"
    ((FAIL_COUNT++))
fi
echo ""

# Test 10: Check retry configuration
echo "[TEST 10] Checking retry logic configuration..."
RETRY_CONFIG=0

if grep -q "retries:.*MAX_RETRIES" services/openai.ts; then
    echo "  ✓ Retry count configured"
    ((RETRY_CONFIG++))
fi

if grep -q "minTimeout:.*RETRY_MIN_TIMEOUT" services/openai.ts; then
    echo "  ✓ Min timeout configured"
    ((RETRY_CONFIG++))
fi

if grep -q "maxTimeout:.*RETRY_MAX_TIMEOUT" services/openai.ts; then
    echo "  ✓ Max timeout configured"
    ((RETRY_CONFIG++))
fi

if grep -q "factor:.*2" services/openai.ts; then
    echo "  ✓ Exponential backoff factor configured"
    ((RETRY_CONFIG++))
fi

if [ "$RETRY_CONFIG" -eq 4 ]; then
    echo "✓ PASS: Retry logic properly configured with exponential backoff"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Retry logic incomplete ($RETRY_CONFIG/4)"
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
    echo "Phase 0.2 OpenAI integration has been successfully validated."
    echo ""
    echo "Next Steps:"
    echo "  1. Set OPENAI_API_KEY in .env to test API calls"
    echo "  2. Run: npx tsx services/openai.test.ts"
    echo "  3. Proceed to Phase 0.3 (Database Setup)"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    echo "Please review the failed tests above."
    exit 1
fi
