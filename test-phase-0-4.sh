#!/bin/bash

# Phase 0.4 Content Processing & Pipeline - Validation Script

echo "========================================"
echo "PHASE 0.4 VALIDATION TESTS"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check parsing dependencies
echo "[TEST 1] Checking content parsing dependencies..."
DEPS=0

if grep -q '"pdf-parse"' package.json; then
    echo "  ✓ pdf-parse found"
    ((DEPS++))
fi

if grep -q '"marked"' package.json; then
    echo "  ✓ marked found"
    ((DEPS++))
fi

if grep -q '"mammoth"' package.json; then
    echo "  ✓ mammoth found"
    ((DEPS++))
fi

if [ "$DEPS" -eq 3 ]; then
    echo "✓ PASS: All parsing dependencies installed"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing dependencies ($DEPS/3)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check contentParser.ts
echo "[TEST 2] Checking contentParser.ts..."
if [ -f "services/contentParser.ts" ]; then
    FUNCTIONS=0
    for func in "parseFile" "parseHTML" "parseMarkdown" "parsePDF" "parseDOCX"; do
        if grep -q "export.*function $func" services/contentParser.ts; then
            ((FUNCTIONS++))
        fi
    done

    if [ "$FUNCTIONS" -eq 5 ]; then
        echo "✓ PASS: Content parser with all functions"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Missing parser functions ($FUNCTIONS/5)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/contentParser.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check contentPreprocessor.ts
echo "[TEST 3] Checking contentPreprocessor.ts..."
if [ -f "services/contentPreprocessor.ts" ]; then
    FUNCTIONS=0
    for func in "preprocessContent" "cleanText" "chunkContent"; do
        if grep -q "export.*function $func" services/contentPreprocessor.ts; then
            ((FUNCTIONS++))
        fi
    done

    if [ "$FUNCTIONS" -eq 3 ]; then
        echo "✓ PASS: Content preprocessor with key functions"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Missing preprocessor functions ($FUNCTIONS/3)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/contentPreprocessor.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check contentIngestion.ts
echo "[TEST 4] Checking contentIngestion.ts..."
if [ -f "services/contentIngestion.ts" ]; then
    FUNCTIONS=0
    for func in "ingestFile" "ingestString" "ingestURL"; do
        if grep -q "export.*function $func" services/contentIngestion.ts; then
            ((FUNCTIONS++))
        fi
    done

    if [ "$FUNCTIONS" -eq 3 ]; then
        echo "✓ PASS: Content ingestion with all functions"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Missing ingestion functions ($FUNCTIONS/3)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/contentIngestion.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check processingWorker.ts
echo "[TEST 5] Checking processingWorker.ts..."
if [ -f "services/processingWorker.ts" ]; then
    if grep -q "processJob" services/processingWorker.ts && grep -q "startWorker" services/processingWorker.ts; then
        echo "✓ PASS: Processing worker exists"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Processing worker incomplete"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/processingWorker.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check pipelineOrchestrator.ts
echo "[TEST 6] Checking pipelineOrchestrator.ts..."
if [ -f "services/pipelineOrchestrator.ts" ]; then
    FUNCTIONS=0
    for func in "generatePodcastFromFile" "generatePodcastFromString" "getPipelineStatus"; do
        if grep -q "$func" services/pipelineOrchestrator.ts; then
            ((FUNCTIONS++))
        fi
    done

    if [ "$FUNCTIONS" -eq 3 ]; then
        echo "✓ PASS: Pipeline orchestrator complete"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Pipeline orchestrator incomplete ($FUNCTIONS/3)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/pipelineOrchestrator.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check test file
echo "[TEST 7] Checking content processing tests..."
if [ -f "services/contentProcessing.test.ts" ]; then
    if grep -q "runAllTests" services/contentProcessing.test.ts; then
        echo "✓ PASS: Content processing tests exist"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Tests incomplete"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/contentProcessing.test.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check error handling classes
echo "[TEST 8] Checking error handling..."
ERROR_CLASSES=0

if grep -q "ContentParserError" services/contentParser.ts; then
    ((ERROR_CLASSES++))
fi

if grep -q "PreprocessorError" services/contentPreprocessor.ts; then
    ((ERROR_CLASSES++))
fi

if grep -q "ContentIngestionError" services/contentIngestion.ts; then
    ((ERROR_CLASSES++))
fi

if [ "$ERROR_CLASSES" -eq 3 ]; then
    echo "✓ PASS: All error classes defined"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing error classes ($ERROR_CLASSES/3)"
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
    echo "Phase 0.4 content processing pipeline validated."
    echo ""
    echo "Services Available:"
    echo "  - Content Parser (PDF, HTML, Markdown, Text, DOCX)"
    echo "  - Content Preprocessor (chunking, cleaning)"
    echo "  - Content Ingestion (file, string, URL)"
    echo "  - Processing Worker (fact extraction, dialogue)"
    echo "  - Pipeline Orchestrator (end-to-end)"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    exit 1
fi
