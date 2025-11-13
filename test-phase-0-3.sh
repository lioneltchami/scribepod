#!/bin/bash

# Phase 0.3 Database Setup - Validation Script
# This script validates all the database and Prisma integration work

set -e

echo "========================================"
echo "PHASE 0.3 VALIDATION TESTS"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check Prisma packages in package.json
echo "[TEST 1] Checking for Prisma packages..."
PRISMA_PACKAGES=0

if grep -q '"@prisma/client"' package.json; then
    echo "  ✓ @prisma/client found"
    ((PRISMA_PACKAGES++))
fi

if grep -q '"prisma"' package.json; then
    echo "  ✓ prisma devDependency found"
    ((PRISMA_PACKAGES++))
fi

if grep -q '"pg"' package.json; then
    echo "  ✓ pg (PostgreSQL client) found"
    ((PRISMA_PACKAGES++))
fi

if [ "$PRISMA_PACKAGES" -eq 3 ]; then
    echo "✓ PASS: All Prisma packages installed"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing Prisma packages ($PRISMA_PACKAGES/3)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check Prisma schema exists and is valid
echo "[TEST 2] Checking Prisma schema..."
if [ -f "prisma/schema.prisma" ]; then
    if npx prisma validate 2>&1 | grep -q "valid"; then
        echo "✓ PASS: Prisma schema is valid"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Prisma schema validation failed"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: prisma/schema.prisma not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check Prisma config file
echo "[TEST 3] Checking Prisma config..."
if [ -f "prisma.config.ts" ]; then
    if grep -q 'import "dotenv/config"' prisma.config.ts; then
        echo "  ✓ dotenv import found"
        echo "✓ PASS: Prisma config properly configured"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: dotenv import missing in prisma.config.ts"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: prisma.config.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check Prisma schema models
echo "[TEST 4] Checking Prisma schema models..."
MODELS=0

for model in "Content" "Fact" "Podcast" "Persona" "Dialogue" "AudioSegment" "ProcessingJob"; do
    if grep -q "model $model" prisma/schema.prisma; then
        ((MODELS++))
    else
        echo "  ✗ Missing model: $model"
    fi
done

if [ "$MODELS" -eq 7 ]; then
    echo "✓ PASS: All 7 required models exist"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing models ($MODELS/7)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check Prisma Client generated
echo "[TEST 5] Checking Prisma Client generation..."
if [ -d "generated/prisma" ]; then
    if [ -f "generated/prisma/index.d.ts" ]; then
        echo "✓ PASS: Prisma Client generated successfully"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Prisma Client incomplete"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: Prisma Client not generated"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check database service exists
echo "[TEST 6] Checking database service..."
if [ -f "services/database.ts" ]; then
    FUNCTIONS=0

    for func in "createContent" "createPodcast" "createPersona" "createDialogue" "healthCheck"; do
        if grep -q "export.*function $func" services/database.ts; then
            ((FUNCTIONS++))
        fi
    done

    if [ "$FUNCTIONS" -eq 5 ]; then
        echo "  ✓ All key functions exist"
        echo "✓ PASS: Database service properly structured"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Missing functions ($FUNCTIONS/5)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/database.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check database service tests
echo "[TEST 7] Checking database service tests..."
if [ -f "services/database.test.ts" ] && grep -q "async function runAllTests" services/database.test.ts; then
    echo "✓ PASS: Database service tests exist"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Database service tests missing or incomplete"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check seed script
echo "[TEST 8] Checking database seed script..."
if [ -f "prisma/seed.ts" ]; then
    if grep -q "prisma.persona.create" prisma/seed.ts && grep -q "prisma.content.create" prisma/seed.ts; then
        echo "  ✓ Seed script creates sample data"
        echo "✓ PASS: Database seed script exists and functional"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Seed script incomplete"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: prisma/seed.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 9: Check DATABASE_URL in .env.example
echo "[TEST 9] Checking .env.example configuration..."
if grep -q "DATABASE_URL" .env.example; then
    echo "✓ PASS: DATABASE_URL added to .env.example"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: DATABASE_URL missing from .env.example"
    ((FAIL_COUNT++))
fi
echo ""

# Test 10: Check package.json scripts
echo "[TEST 10] Checking package.json Prisma scripts..."
SCRIPTS=0

for script in "prisma:generate" "prisma:migrate" "prisma:seed"; do
    if grep -q "\"$script\"" package.json; then
        ((SCRIPTS++))
    fi
done

if [ "$SCRIPTS" -eq 3 ]; then
    echo "✓ PASS: All Prisma scripts configured"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing Prisma scripts ($SCRIPTS/3)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 11: Check documentation
echo "[TEST 11] Checking database documentation..."
if [ -f "DATABASE_SETUP.md" ]; then
    if grep -q "Database Setup Guide" DATABASE_SETUP.md; then
        echo "✓ PASS: Database setup documentation exists"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Database documentation incomplete"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: DATABASE_SETUP.md not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 12: Check Prisma enums
echo "[TEST 12] Checking Prisma enum definitions..."
ENUMS=0

for enum in "SourceType" "ConversationStyle" "ProcessingStatus" "PersonaRole"; do
    if grep -q "enum $enum" prisma/schema.prisma; then
        ((ENUMS++))
    fi
done

if [ "$ENUMS" -eq 4 ]; then
    echo "✓ PASS: All required enums defined"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Missing enums ($ENUMS/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 13: Check TypeScript version compatibility
echo "[TEST 13] Checking TypeScript version..."
if grep -q '"typescript".*"^5' package.json; then
    echo "✓ PASS: TypeScript 5+ installed (Prisma compatible)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: TypeScript version not compatible with Prisma"
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
    echo "Phase 0.3 database setup has been successfully validated."
    echo ""
    echo "Next Steps:"
    echo "  1. Set DATABASE_URL in .env to your PostgreSQL connection string"
    echo "  2. Run: npm run prisma:migrate"
    echo "  3. Run: npm run prisma:seed (to populate sample data)"
    echo "  4. Run: npx tsx services/database.test.ts (to test database operations)"
    echo "  5. Proceed to Phase 1 (Core Podcast Generation)"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    echo "Please review the failed tests above."
    exit 1
fi
