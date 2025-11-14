#!/bin/bash

# Comprehensive Code Review Script
# Verifies all phases are complete and ready

echo "============================================================"
echo "COMPREHENSIVE CODE REVIEW - ALL PHASES"
echo "============================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_file() {
    local file=$1
    local description=$2
    ((TOTAL_CHECKS++))

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} $description - MISSING"
        ((FAILED_CHECKS++))
        return 1
    fi
}

check_in_file() {
    local file=$1
    local pattern=$2
    local description=$3
    ((TOTAL_CHECKS++))

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC} $description - NOT FOUND"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# ============================================================================
# PHASE 0: Core Infrastructure
# ============================================================================

echo "=== PHASE 0: CORE INFRASTRUCTURE ==="
echo ""

echo "Phase 0.1-0.3: Database & OpenAI"
check_file "services/database.ts" "Database service"
check_file "services/openai.ts" "OpenAI service"
check_file "shared/types.ts" "Shared types"
check_file "prisma/schema.prisma" "Prisma schema"
check_file "generated/prisma/index.d.ts" "Generated Prisma client"

echo ""
echo "Phase 0.4: Content Processing Pipeline"
check_file "services/contentParser.ts" "Content parser"
check_file "services/contentPreprocessor.ts" "Content preprocessor"
check_file "services/contentIngestion.ts" "Content ingestion"
check_file "services/processingWorker.ts" "Processing worker"
check_file "services/pipelineOrchestrator.ts" "Pipeline orchestrator"

echo ""
echo "Phase 0.5: REST API Layer"
check_file "api/server.ts" "API server"

# ============================================================================
# PHASE 1: Multi-Persona Podcast Generation
# ============================================================================

echo ""
echo "=== PHASE 1: MULTI-PERSONA PODCAST GENERATION ==="
echo ""

check_file "services/dialogueGenerator.ts" "Dialogue generator"
check_file "services/dialogueContext.ts" "Dialogue context manager"
check_file "services/dialogueQuality.ts" "Dialogue quality validator"
check_file "services/podcastGenerator.ts" "Podcast generator"
check_file "services/phase1.test.ts" "Phase 1 tests"
check_file "test-phase-1.sh" "Phase 1 validation script"

# ============================================================================
# PHASE 2: Real-Time Conversation Agent
# ============================================================================

echo ""
echo "=== PHASE 2: REAL-TIME CONVERSATION AGENT ==="
echo ""

check_file "services/conversationAgent.ts" "Conversation agent"
check_file "services/conversationManager.ts" "Conversation manager"
check_file "services/phase2.test.ts" "Phase 2 tests"
check_file "test-phase-2.sh" "Phase 2 validation script"

# Verify streaming support
check_in_file "services/openai.ts" "generateStreamingCompletion" "Streaming completion function"
check_in_file "services/conversationAgent.ts" "generatePersonaStreamingResponse" "Streaming response function"

# ============================================================================
# PHASE 3: Default Personas & Preset Library
# ============================================================================

echo ""
echo "=== PHASE 3: DEFAULT PERSONAS & PRESET LIBRARY ==="
echo ""

check_file "services/defaultPersonas.ts" "Default personas"
check_file "services/personaLibrary.ts" "Persona library"
check_file "services/phase3.test.ts" "Phase 3 tests"
check_file "test-phase-3.sh" "Phase 3 validation script"
check_file "PHASE_3_DOCUMENTATION.md" "Phase 3 documentation"

# Verify seed script updated
check_in_file "prisma/seed.ts" "DEFAULT_PERSONAS" "Seed script uses default personas"

# ============================================================================
# API INTEGRATION VERIFICATION
# ============================================================================

echo ""
echo "=== API INTEGRATION VERIFICATION ==="
echo ""

# Phase 1 API endpoints
check_in_file "api/server.ts" "/api/podcasts/generate/string" "Podcast generation from string"
check_in_file "api/server.ts" "/api/podcasts/generate/url" "Podcast generation from URL"

# Phase 2 API endpoints
check_in_file "api/server.ts" "/api/conversations" "Conversations endpoint"
check_in_file "api/server.ts" "text/event-stream" "SSE streaming support"

# Phase 3 API endpoints
check_in_file "api/server.ts" "/api/personas/presets" "Persona presets endpoint"
check_in_file "api/server.ts" "/api/personas/defaults" "Default personas endpoint"
check_in_file "api/server.ts" "resolvePersonaIds" "Persona resolution logic"

# ============================================================================
# IMPORTS AND DEPENDENCIES CHECK
# ============================================================================

echo ""
echo "=== IMPORTS AND DEPENDENCIES ==="
echo ""

# Check critical imports
check_in_file "api/server.ts" "import.*dialogueGenerator" "API imports Phase 1"
check_in_file "api/server.ts" "import.*conversationAgent" "API imports Phase 2"
check_in_file "api/server.ts" "import.*personaLibrary" "API imports Phase 3"

# Check cross-module dependencies
check_in_file "services/podcastGenerator.ts" "import.*dialogueGenerator" "Phase 1 internal imports"
check_in_file "services/conversationAgent.ts" "import.*openai" "Phase 2 OpenAI integration"
check_in_file "services/personaLibrary.ts" "import.*database" "Phase 3 database integration"

# ============================================================================
# TYPESCRIPT FIXES VERIFICATION
# ============================================================================

echo ""
echo "=== TYPESCRIPT FIXES VERIFICATION ==="
echo ""

check_file "shared/types.ts" "Centralized type definitions"
check_in_file "shared/types.ts" "ChatMessage" "ChatMessage type"
check_in_file "shared/types.ts" "CompletionOptions" "CompletionOptions type"

# Verify dotenv fix
check_in_file "services/openai.ts" "config as dotenvConfig" "Dotenv named import"

# Verify Prisma enum imports
check_in_file "services/database.ts" "import.*PersonaRole.*from.*prisma" "Direct Prisma enum imports"

# ============================================================================
# TEST SCRIPTS VERIFICATION
# ============================================================================

echo ""
echo "=== TEST SCRIPTS ==="
echo ""

check_file "test-phase-0-4.sh" "Phase 0.4 validation script"
check_file "test-phase-1.sh" "Phase 1 validation script"
check_file "test-phase-2.sh" "Phase 2 validation script"
check_file "test-phase-3.sh" "Phase 3 validation script"

# Check if scripts are executable
if [ -x "test-phase-1.sh" ]; then
    echo -e "${GREEN}✓${NC} Phase 1 script is executable"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠${NC} Phase 1 script not executable (run: chmod +x test-phase-1.sh)"
fi
((TOTAL_CHECKS++))

if [ -x "test-phase-2.sh" ]; then
    echo -e "${GREEN}✓${NC} Phase 2 script is executable"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠${NC} Phase 2 script not executable (run: chmod +x test-phase-2.sh)"
fi
((TOTAL_CHECKS++))

if [ -x "test-phase-3.sh" ]; then
    echo -e "${GREEN}✓${NC} Phase 3 script is executable"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠${NC} Phase 3 script not executable (run: chmod +x test-phase-3.sh)"
fi
((TOTAL_CHECKS++))

# ============================================================================
# DOCUMENTATION CHECK
# ============================================================================

echo ""
echo "=== DOCUMENTATION ==="
echo ""

check_file "COMPREHENSIVE_REVIEW.md" "Comprehensive review document"
check_file "PHASE_3_DOCUMENTATION.md" "Phase 3 documentation"

# ============================================================================
# LINE COUNT VERIFICATION
# ============================================================================

echo ""
echo "=== CODE STATISTICS ==="
echo ""

if [ -f "services/dialogueGenerator.ts" ]; then
    LINES=$(wc -l < services/dialogueGenerator.ts)
    echo "  dialogueGenerator.ts: $LINES lines"
fi

if [ -f "services/conversationAgent.ts" ]; then
    LINES=$(wc -l < services/conversationAgent.ts)
    echo "  conversationAgent.ts: $LINES lines"
fi

if [ -f "services/defaultPersonas.ts" ]; then
    LINES=$(wc -l < services/defaultPersonas.ts)
    echo "  defaultPersonas.ts: $LINES lines"
fi

if [ -f "api/server.ts" ]; then
    LINES=$(wc -l < api/server.ts)
    echo "  api/server.ts: $LINES lines"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "============================================================"
echo "REVIEW SUMMARY"
echo "============================================================"
echo ""

echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"

if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    echo ""
    echo "❌ Code review found issues"
    exit 1
else
    echo -e "${GREEN}Failed: 0${NC}"
    echo ""
    echo "✅ All structural checks passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Run test suites to verify functionality"
    echo "  2. Check TypeScript compilation"
    echo "  3. Verify database connectivity (if needed)"
fi

echo "============================================================"
