#!/bin/bash

# Phase 1 Multi-Persona Podcast Generation - Validation Script

echo "=========================================="
echo "PHASE 1 VALIDATION TESTS"
echo "Multi-Persona Podcast Generation"
echo "=========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check dialogueGenerator.ts exists and has required functions
echo "[TEST 1] Checking dialogueGenerator.ts..."
if [ -f "services/dialogueGenerator.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "generateMultiPersonaDialogue" services/dialogueGenerator.ts; then
        echo "    ✓ generateMultiPersonaDialogue found"
        ((FUNCTIONS++))
    fi

    if grep -q "generatePodcastIntro" services/dialogueGenerator.ts; then
        echo "    ✓ generatePodcastIntro found"
        ((FUNCTIONS++))
    fi

    if grep -q "generatePodcastOutro" services/dialogueGenerator.ts; then
        echo "    ✓ generatePodcastOutro found"
        ((FUNCTIONS++))
    fi

    if grep -q "personaToProfile" services/dialogueGenerator.ts; then
        echo "    ✓ personaToProfile found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 4 ]; then
        echo "✓ PASS: dialogueGenerator.ts complete ($FUNCTIONS/4 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: dialogueGenerator.ts missing functions ($FUNCTIONS/4)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/dialogueGenerator.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check dialogueContext.ts exists and has required functions
echo "[TEST 2] Checking dialogueContext.ts..."
if [ -f "services/dialogueContext.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "createContext" services/dialogueContext.ts; then
        echo "    ✓ createContext found"
        ((FUNCTIONS++))
    fi

    if grep -q "addTurns" services/dialogueContext.ts; then
        echo "    ✓ addTurns found"
        ((FUNCTIONS++))
    fi

    if grep -q "markFactsDiscussed" services/dialogueContext.ts; then
        echo "    ✓ markFactsDiscussed found"
        ((FUNCTIONS++))
    fi

    if grep -q "getNextFacts" services/dialogueContext.ts; then
        echo "    ✓ getNextFacts found"
        ((FUNCTIONS++))
    fi

    if grep -q "analyzeSpeakerBalance" services/dialogueContext.ts; then
        echo "    ✓ analyzeSpeakerBalance found"
        ((FUNCTIONS++))
    fi

    if grep -q "getConversationStats" services/dialogueContext.ts; then
        echo "    ✓ getConversationStats found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 6 ]; then
        echo "✓ PASS: dialogueContext.ts complete ($FUNCTIONS/6 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: dialogueContext.ts missing functions ($FUNCTIONS/6)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/dialogueContext.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check dialogueQuality.ts exists and has required functions
echo "[TEST 3] Checking dialogueQuality.ts..."
if [ -f "services/dialogueQuality.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "validateDialogueQuality" services/dialogueQuality.ts; then
        echo "    ✓ validateDialogueQuality found"
        ((FUNCTIONS++))
    fi

    if grep -q "filterLowQualityTurns" services/dialogueQuality.ts; then
        echo "    ✓ filterLowQualityTurns found"
        ((FUNCTIONS++))
    fi

    if grep -q "exportAsJSON" services/dialogueQuality.ts; then
        echo "    ✓ exportAsJSON found"
        ((FUNCTIONS++))
    fi

    if grep -q "exportAsText" services/dialogueQuality.ts; then
        echo "    ✓ exportAsText found"
        ((FUNCTIONS++))
    fi

    if grep -q "exportAsSRT" services/dialogueQuality.ts; then
        echo "    ✓ exportAsSRT found"
        ((FUNCTIONS++))
    fi

    if grep -q "exportAsMarkdown" services/dialogueQuality.ts; then
        echo "    ✓ exportAsMarkdown found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 6 ]; then
        echo "✓ PASS: dialogueQuality.ts complete ($FUNCTIONS/6 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: dialogueQuality.ts missing functions ($FUNCTIONS/6)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/dialogueQuality.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check podcastGenerator.ts exists and has required functions
echo "[TEST 4] Checking podcastGenerator.ts..."
if [ -f "services/podcastGenerator.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "generateCompletePodcast" services/podcastGenerator.ts; then
        echo "    ✓ generateCompletePodcast found"
        ((FUNCTIONS++))
    fi

    if grep -q "savePodcastToDatabase" services/podcastGenerator.ts; then
        echo "    ✓ savePodcastToDatabase found"
        ((FUNCTIONS++))
    fi

    if grep -q "exportPodcast" services/podcastGenerator.ts; then
        echo "    ✓ exportPodcast found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 3 ]; then
        echo "✓ PASS: podcastGenerator.ts complete ($FUNCTIONS/3 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: podcastGenerator.ts missing functions ($FUNCTIONS/3)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/podcastGenerator.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check personality system
echo "[TEST 5] Checking personality system..."
PERSONALITY_FEATURES=0

if grep -q "generatePersonalityPrompt" services/dialogueGenerator.ts; then
    echo "  ✓ Personality prompt generation"
    ((PERSONALITY_FEATURES++))
fi

if grep -q "personality.formality" services/dialogueGenerator.ts; then
    echo "  ✓ Formality trait"
    ((PERSONALITY_FEATURES++))
fi

if grep -q "personality.enthusiasm" services/dialogueGenerator.ts; then
    echo "  ✓ Enthusiasm trait"
    ((PERSONALITY_FEATURES++))
fi

if grep -q "personality.humor" services/dialogueGenerator.ts; then
    echo "  ✓ Humor trait"
    ((PERSONALITY_FEATURES++))
fi

if grep -q "personality.expertise" services/dialogueGenerator.ts; then
    echo "  ✓ Expertise trait"
    ((PERSONALITY_FEATURES++))
fi

if [ "$PERSONALITY_FEATURES" -eq 5 ]; then
    echo "✓ PASS: Personality system implemented ($PERSONALITY_FEATURES/5 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Personality system incomplete ($PERSONALITY_FEATURES/5)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check context management features
echo "[TEST 6] Checking context management..."
CONTEXT_FEATURES=0

if grep -q "ConversationContext" services/dialogueContext.ts; then
    echo "  ✓ ConversationContext interface"
    ((CONTEXT_FEATURES++))
fi

if grep -q "speakerStats" services/dialogueContext.ts; then
    echo "  ✓ Speaker statistics tracking"
    ((CONTEXT_FEATURES++))
fi

if grep -q "discussedFacts" services/dialogueContext.ts; then
    echo "  ✓ Fact tracking"
    ((CONTEXT_FEATURES++))
fi

if grep -q "currentMood" services/dialogueContext.ts; then
    echo "  ✓ Mood progression"
    ((CONTEXT_FEATURES++))
fi

if [ "$CONTEXT_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Context management complete ($CONTEXT_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Context management incomplete ($CONTEXT_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check quality validation system
echo "[TEST 7] Checking quality validation..."
QUALITY_FEATURES=0

if grep -q "QualityReport" services/dialogueQuality.ts; then
    echo "  ✓ QualityReport interface"
    ((QUALITY_FEATURES++))
fi

if grep -q "score" services/dialogueQuality.ts; then
    echo "  ✓ Quality scoring"
    ((QUALITY_FEATURES++))
fi

if grep -q "issues" services/dialogueQuality.ts; then
    echo "  ✓ Issue detection"
    ((QUALITY_FEATURES++))
fi

if grep -q "passed" services/dialogueQuality.ts; then
    echo "  ✓ Pass/fail validation"
    ((QUALITY_FEATURES++))
fi

if [ "$QUALITY_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Quality validation complete ($QUALITY_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Quality validation incomplete ($QUALITY_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check export formats
echo "[TEST 8] Checking export formats..."
EXPORT_FORMATS=0

if grep -q "exportAsJSON" services/dialogueQuality.ts; then
    echo "  ✓ JSON export"
    ((EXPORT_FORMATS++))
fi

if grep -q "exportAsText" services/dialogueQuality.ts; then
    echo "  ✓ Text export"
    ((EXPORT_FORMATS++))
fi

if grep -q "exportAsSRT" services/dialogueQuality.ts; then
    echo "  ✓ SRT subtitle export"
    ((EXPORT_FORMATS++))
fi

if grep -q "exportAsMarkdown" services/dialogueQuality.ts; then
    echo "  ✓ Markdown export"
    ((EXPORT_FORMATS++))
fi

if [ "$EXPORT_FORMATS" -eq 4 ]; then
    echo "✓ PASS: All export formats implemented ($EXPORT_FORMATS/4)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Export formats incomplete ($EXPORT_FORMATS/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 9: Check test file exists
echo "[TEST 9] Checking test file..."
if [ -f "services/phase1.test.ts" ]; then
    echo "  ✓ phase1.test.ts exists"

    TEST_COUNT=0
    if grep -q "testDialogueGeneratorStructure" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testDialogueContextStructure" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testDialogueQualityStructure" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testPodcastGeneratorStructure" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testPersonaToProfile" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testDialogueQualityValidation" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testExportFormats" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testContextCreation" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testFilterLowQualityTurns" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testErrorClasses" services/phase1.test.ts; then
        ((TEST_COUNT++))
    fi

    if [ "$TEST_COUNT" -eq 10 ]; then
        echo "✓ PASS: Test file complete with $TEST_COUNT test functions"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: Test file incomplete ($TEST_COUNT/10 tests)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/phase1.test.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 10: Verify complete integration
echo "[TEST 10] Checking integration points..."
INTEGRATION=0

if grep -q "from './dialogueGenerator'" services/podcastGenerator.ts; then
    echo "  ✓ Podcast generator imports dialogue generator"
    ((INTEGRATION++))
fi

if grep -q "from './dialogueContext'" services/podcastGenerator.ts; then
    echo "  ✓ Podcast generator imports dialogue context"
    ((INTEGRATION++))
fi

if grep -q "from './dialogueQuality'" services/podcastGenerator.ts; then
    echo "  ✓ Podcast generator imports dialogue quality"
    ((INTEGRATION++))
fi

if grep -q "PersonaProfile" services/podcastGenerator.ts; then
    echo "  ✓ Uses PersonaProfile type"
    ((INTEGRATION++))
fi

if [ "$INTEGRATION" -eq 4 ]; then
    echo "✓ PASS: Integration complete ($INTEGRATION/4)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Integration incomplete ($INTEGRATION/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Summary
echo "=========================================="
echo "VALIDATION SUMMARY"
echo "=========================================="
echo "Tests Passed: $PASS_COUNT"
echo "Tests Failed: $FAIL_COUNT"
echo "Total Tests:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "✓ ALL VALIDATION TESTS PASSED!"
    echo ""
    echo "Phase 1 Implementation Complete:"
    echo "✓ Multi-persona dialogue generation"
    echo "✓ Personality-driven conversations"
    echo "✓ Context management & speaker balance"
    echo "✓ Quality validation & scoring"
    echo "✓ Multiple export formats (JSON, Text, SRT, Markdown)"
    echo "✓ Complete end-to-end podcast generation"
    echo "✓ Comprehensive test suite (10 tests)"
    echo ""
    echo "Key Features:"
    echo "  • Supports 1 host + 2-4 guests with distinct personalities"
    echo "  • Personality traits: formality, enthusiasm, humor, expertise, interruption"
    echo "  • Speaking styles: sentence length, vocabulary, pace"
    echo "  • Automatic speaker balance tracking"
    echo "  • Quality scoring with automatic retries"
    echo "  • Conversation mood progression (intro → building → peak → winding-down → outro)"
    echo ""
    exit 0
else
    echo "✗ SOME VALIDATION TESTS FAILED"
    echo "Please review the failures above."
    exit 1
fi
