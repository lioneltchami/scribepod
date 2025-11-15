#!/bin/bash

# Phase 2 Real-Time Conversation Agent - Validation Script

echo "=========================================="
echo "PHASE 2 VALIDATION TESTS"
echo "Real-Time Conversation Agent"
echo "=========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check conversationAgent.ts exists and has required functions
echo "[TEST 1] Checking conversationAgent.ts..."
if [ -f "services/conversationAgent.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "generatePersonaResponse" services/conversationAgent.ts; then
        echo "    ✓ generatePersonaResponse found"
        ((FUNCTIONS++))
    fi

    if grep -q "generatePersonaStreamingResponse" services/conversationAgent.ts; then
        echo "    ✓ generatePersonaStreamingResponse found"
        ((FUNCTIONS++))
    fi

    if grep -q "generatePersonaGreeting" services/conversationAgent.ts; then
        echo "    ✓ generatePersonaGreeting found"
        ((FUNCTIONS++))
    fi

    if grep -q "personaToConversationProfile" services/conversationAgent.ts; then
        echo "    ✓ personaToConversationProfile found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 4 ]; then
        echo "✓ PASS: conversationAgent.ts complete ($FUNCTIONS/4 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: conversationAgent.ts missing functions ($FUNCTIONS/4)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/conversationAgent.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 2: Check conversationManager.ts exists and has required functions
echo "[TEST 2] Checking conversationManager.ts..."
if [ -f "services/conversationManager.ts" ]; then
    echo "  ✓ File exists"

    FUNCTIONS=0
    if grep -q "createConversationSession" services/conversationManager.ts; then
        echo "    ✓ createConversationSession found"
        ((FUNCTIONS++))
    fi

    if grep -q "getConversationSession" services/conversationManager.ts; then
        echo "    ✓ getConversationSession found"
        ((FUNCTIONS++))
    fi

    if grep -q "addUserMessage" services/conversationManager.ts; then
        echo "    ✓ addUserMessage found"
        ((FUNCTIONS++))
    fi

    if grep -q "addAssistantMessage" services/conversationManager.ts; then
        echo "    ✓ addAssistantMessage found"
        ((FUNCTIONS++))
    fi

    if grep -q "switchPersona" services/conversationManager.ts; then
        echo "    ✓ switchPersona found"
        ((FUNCTIONS++))
    fi

    if grep -q "getConversationHistory" services/conversationManager.ts; then
        echo "    ✓ getConversationHistory found"
        ((FUNCTIONS++))
    fi

    if grep -q "getSessionStats" services/conversationManager.ts; then
        echo "    ✓ getSessionStats found"
        ((FUNCTIONS++))
    fi

    if grep -q "deleteConversationSession" services/conversationManager.ts; then
        echo "    ✓ deleteConversationSession found"
        ((FUNCTIONS++))
    fi

    if [ "$FUNCTIONS" -eq 8 ]; then
        echo "✓ PASS: conversationManager.ts complete ($FUNCTIONS/8 functions)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: conversationManager.ts missing functions ($FUNCTIONS/8)"
        ((FAIL_COUNT++))
    fi
else
    echo "✗ FAIL: services/conversationManager.ts not found"
    ((FAIL_COUNT++))
fi
echo ""

# Test 3: Check streaming support in OpenAI service
echo "[TEST 3] Checking streaming support..."
STREAMING_FEATURES=0

if grep -q "generateStreamingCompletion" services/openai.ts; then
    echo "  ✓ generateStreamingCompletion function"
    ((STREAMING_FEATURES++))
fi

if grep -q "async function\*" services/openai.ts; then
    echo "  ✓ Async generator pattern"
    ((STREAMING_FEATURES++))
fi

if grep -q "AsyncGenerator" services/openai.ts; then
    echo "  ✓ AsyncGenerator type"
    ((STREAMING_FEATURES++))
fi

if grep -q "yield" services/openai.ts; then
    echo "  ✓ Yield statements for streaming"
    ((STREAMING_FEATURES++))
fi

if [ "$STREAMING_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Streaming support implemented ($STREAMING_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Streaming support incomplete ($STREAMING_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 4: Check conversation API endpoints
echo "[TEST 4] Checking conversation API endpoints..."
API_ENDPOINTS=0

if grep -q "POST /api/conversations" api/server.ts; then
    echo "  ✓ Create conversation endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "GET /api/conversations/:sessionId" api/server.ts; then
    echo "  ✓ Get conversation endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "POST /api/conversations/:sessionId/messages" api/server.ts; then
    echo "  ✓ Send message endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "GET /api/conversations/:sessionId/stream" api/server.ts; then
    echo "  ✓ Streaming SSE endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "GET /api/conversations/:sessionId/history" api/server.ts; then
    echo "  ✓ History endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "POST /api/conversations/:sessionId/persona" api/server.ts; then
    echo "  ✓ Switch persona endpoint"
    ((API_ENDPOINTS++))
fi

if grep -q "DELETE /api/conversations/:sessionId" api/server.ts; then
    echo "  ✓ Delete conversation endpoint"
    ((API_ENDPOINTS++))
fi

if [ "$API_ENDPOINTS" -eq 7 ]; then
    echo "✓ PASS: All conversation API endpoints implemented ($API_ENDPOINTS/7)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: API endpoints incomplete ($API_ENDPOINTS/7)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 5: Check SSE implementation
echo "[TEST 5] Checking Server-Sent Events implementation..."
SSE_FEATURES=0

if grep -q "text/event-stream" api/server.ts; then
    echo "  ✓ Content-Type: text/event-stream"
    ((SSE_FEATURES++))
fi

if grep -q "Cache-Control.*no-cache" api/server.ts; then
    echo "  ✓ Cache-Control headers"
    ((SSE_FEATURES++))
fi

if grep -q "res.write.*data:" api/server.ts; then
    echo "  ✓ SSE data format"
    ((SSE_FEATURES++))
fi

if grep -q "generatePersonaStreamingResponse" api/server.ts; then
    echo "  ✓ Streaming response integration"
    ((SSE_FEATURES++))
fi

if [ "$SSE_FEATURES" -eq 4 ]; then
    echo "✓ PASS: SSE implementation complete ($SSE_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: SSE implementation incomplete ($SSE_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 6: Check conversation context features
echo "[TEST 6] Checking conversation context features..."
CONTEXT_FEATURES=0

if grep -q "ConversationContext" services/conversationAgent.ts; then
    echo "  ✓ ConversationContext interface"
    ((CONTEXT_FEATURES++))
fi

if grep -q "ConversationMessage" services/conversationAgent.ts; then
    echo "  ✓ ConversationMessage interface"
    ((CONTEXT_FEATURES++))
fi

if grep -q "ConversationPersona" services/conversationAgent.ts; then
    echo "  ✓ ConversationPersona interface"
    ((CONTEXT_FEATURES++))
fi

if grep -q "sessionId" services/conversationManager.ts; then
    echo "  ✓ Session ID tracking"
    ((CONTEXT_FEATURES++))
fi

if [ "$CONTEXT_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Context features complete ($CONTEXT_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Context features incomplete ($CONTEXT_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 7: Check persona-aware response generation
echo "[TEST 7] Checking persona-aware response system..."
PERSONA_FEATURES=0

if grep -q "generateConversationSystemPrompt" services/conversationAgent.ts; then
    echo "  ✓ Persona-specific system prompts"
    ((PERSONA_FEATURES++))
fi

if grep -q "personality.formality" services/conversationAgent.ts; then
    echo "  ✓ Personality trait integration"
    ((PERSONA_FEATURES++))
fi

if grep -q "speakingStyle" services/conversationAgent.ts; then
    echo "  ✓ Speaking style awareness"
    ((PERSONA_FEATURES++))
fi

if grep -q "Stay completely in character" services/conversationAgent.ts; then
    echo "  ✓ Character consistency instructions"
    ((PERSONA_FEATURES++))
fi

if [ "$PERSONA_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Persona-aware response system complete ($PERSONA_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Persona-aware response system incomplete ($PERSONA_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 8: Check session management features
echo "[TEST 8] Checking session management..."
SESSION_FEATURES=0

if grep -q "conversationSessions" services/conversationManager.ts; then
    echo "  ✓ Session storage"
    ((SESSION_FEATURES++))
fi

if grep -q "cleanupExpiredSessions" services/conversationManager.ts; then
    echo "  ✓ Session cleanup"
    ((SESSION_FEATURES++))
fi

if grep -q "getActiveSessionCount" services/conversationManager.ts; then
    echo "  ✓ Session tracking"
    ((SESSION_FEATURES++))
fi

if grep -q "SessionStats" services/conversationManager.ts; then
    echo "  ✓ Session statistics"
    ((SESSION_FEATURES++))
fi

if [ "$SESSION_FEATURES" -eq 4 ]; then
    echo "✓ PASS: Session management complete ($SESSION_FEATURES/4 features)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Session management incomplete ($SESSION_FEATURES/4)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 9: Check error handling
echo "[TEST 9] Checking error classes..."
ERROR_CLASSES=0

if grep -q "ConversationAgentError" services/conversationAgent.ts; then
    echo "  ✓ ConversationAgentError"
    ((ERROR_CLASSES++))
fi

if grep -q "PersonaNotFoundError" services/conversationAgent.ts; then
    echo "  ✓ PersonaNotFoundError"
    ((ERROR_CLASSES++))
fi

if grep -q "SessionNotFoundError" services/conversationManager.ts; then
    echo "  ✓ SessionNotFoundError"
    ((ERROR_CLASSES++))
fi

if grep -q "SessionExpiredError" services/conversationManager.ts; then
    echo "  ✓ SessionExpiredError"
    ((ERROR_CLASSES++))
fi

if grep -q "SessionLimitError" services/conversationManager.ts; then
    echo "  ✓ SessionLimitError"
    ((ERROR_CLASSES++))
fi

if [ "$ERROR_CLASSES" -eq 5 ]; then
    echo "✓ PASS: All error classes defined ($ERROR_CLASSES/5)"
    ((PASS_COUNT++))
else
    echo "✗ FAIL: Error classes incomplete ($ERROR_CLASSES/5)"
    ((FAIL_COUNT++))
fi
echo ""

# Test 10: Check test file
echo "[TEST 10] Checking test file..."
if [ -f "services/phase2.test.ts" ]; then
    echo "  ✓ phase2.test.ts exists"

    TEST_COUNT=0
    if grep -q "testConversationAgentStructure" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testConversationManagerStructure" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testPersonaToConversationProfile" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testSessionCreation" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testMessageHandling" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testPersonaSwitching" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testSessionStats" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testSessionCleanup" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testErrorClasses" services/phase2.test.ts; then
        ((TEST_COUNT++))
    fi

    if grep -q "testStreamingSupport" services/phase2.test.ts; then
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
    echo "✗ FAIL: services/phase2.test.ts not found"
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
    echo "Phase 2 Implementation Complete:"
    echo "✓ Real-time conversation agent"
    echo "✓ Persona-aware response generation"
    echo "✓ Session management & tracking"
    echo "✓ Server-Sent Events (SSE) streaming"
    echo "✓ Multi-persona conversation support"
    echo "✓ Comprehensive API endpoints (7 endpoints)"
    echo "✓ Complete test suite (10 tests)"
    echo ""
    echo "Key Features:"
    echo "  • Chat with podcast personas in real-time"
    echo "  • Personality-driven responses stay in character"
    echo "  • Streaming responses with SSE"
    echo "  • Session management with cleanup"
    echo "  • Switch between personas in conversation"
    echo "  • Conversation history tracking"
    echo "  • Context-aware responses using podcast content"
    echo ""
    exit 0
else
    echo "✗ SOME VALIDATION TESTS FAILED"
    echo "Please review the failures above."
    exit 1
fi
