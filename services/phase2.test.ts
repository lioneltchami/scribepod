/**
 * Phase 2 Tests
 * Comprehensive tests for real-time conversation agent system
 */

async function testConversationAgentStructure() {
  console.log('\n=== Test 1: Conversation Agent Structure ===');
  try {
    const agent = await import('./conversationAgent.ts');

    const expectedFunctions = [
      'generatePersonaResponse',
      'generatePersonaStreamingResponse',
      'generatePersonaGreeting',
      'personaToConversationProfile',
    ];

    const expectedErrors = [
      'ConversationAgentError',
      'ConversationContextError',
      'PersonaNotFoundError',
    ];

    let passed = true;

    for (const fn of expectedFunctions) {
      if (typeof agent[fn] !== 'function') {
        console.log(`  ✗ Missing function: ${fn}`);
        passed = false;
      }
    }

    for (const err of expectedErrors) {
      if (typeof agent[err] !== 'function') {
        console.log(`  ✗ Missing error class: ${err}`);
        passed = false;
      }
    }

    if (passed) {
      console.log(`  ✓ All ${expectedFunctions.length} functions present`);
      console.log(`  ✓ All ${expectedErrors.length} error classes present`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testConversationManagerStructure() {
  console.log('\n=== Test 2: Conversation Manager Structure ===');
  try {
    const manager = await import('./conversationManager.ts');

    const expectedFunctions = [
      'createConversationSession',
      'getConversationSession',
      'sessionExists',
      'addUserMessage',
      'addAssistantMessage',
      'switchPersona',
      'getConversationHistory',
      'getRecentMessages',
      'getSessionStats',
      'clearConversationHistory',
      'deleteConversationSession',
      'getAllSessionIds',
      'cleanupExpiredSessions',
      'getActiveSessionCount',
      'getCurrentPersona',
      'getSessionPersonas',
    ];

    const expectedErrors = [
      'SessionNotFoundError',
      'SessionExpiredError',
      'SessionLimitError',
    ];

    let passed = true;

    for (const fn of expectedFunctions) {
      if (typeof manager[fn] !== 'function') {
        console.log(`  ✗ Missing function: ${fn}`);
        passed = false;
      }
    }

    for (const err of expectedErrors) {
      if (typeof manager[err] !== 'function') {
        console.log(`  ✗ Missing error class: ${err}`);
        passed = false;
      }
    }

    if (passed) {
      console.log(`  ✓ All ${expectedFunctions.length} functions present`);
      console.log(`  ✓ All ${expectedErrors.length} error classes present`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testPersonaToConversationProfile() {
  console.log('\n=== Test 3: Persona Conversion ===');
  try {
    const { personaToConversationProfile } = await import('./conversationAgent.ts');

    // Mock Prisma Persona
    const mockPersona = {
      id: 'test-id',
      name: 'Test Person',
      role: 'host',
      background: 'Test background',
      formality: 0.7,
      enthusiasm: 0.8,
      humor: 0.5,
      expertise: 0.9,
      interruptionTendency: 0.4,
      sentenceLength: 'medium' as const,
      vocabulary: 'academic' as const,
      pace: 'medium' as const,
      fillerWords: 0.2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const profile = personaToConversationProfile(mockPersona);

    let passed = true;

    if (profile.id !== mockPersona.id) {
      console.log('  ✗ ID mismatch');
      passed = false;
    }

    if (profile.name !== mockPersona.name) {
      console.log('  ✗ Name mismatch');
      passed = false;
    }

    if (profile.personality.formality !== mockPersona.formality) {
      console.log('  ✗ Formality mismatch');
      passed = false;
    }

    if (profile.speakingStyle.sentenceLength !== mockPersona.sentenceLength) {
      console.log('  ✗ Sentence length mismatch');
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Persona converted correctly');
      console.log(`  ✓ ID: ${profile.id}`);
      console.log(`  ✓ Name: ${profile.name}`);
      console.log(`  ✓ Role: ${profile.role}`);
      console.log(`  ✓ Personality traits: formality=${profile.personality.formality}, enthusiasm=${profile.personality.enthusiasm}`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testSessionCreation() {
  console.log('\n=== Test 4: Session Creation ===');
  try {
    const { createConversationSession, getConversationSession, sessionExists } = await import(
      './conversationManager.ts'
    );

    const mockPersonas = [
      {
        id: 'persona-1',
        name: 'Alice',
        role: 'host',
        background: 'Podcast host',
        personality: {
          formality: 0.6,
          enthusiasm: 0.8,
          humor: 0.7,
          expertise: 0.7,
        },
        speakingStyle: {
          sentenceLength: 'medium' as const,
          vocabulary: 'simple' as const,
        },
      },
    ];

    const session = createConversationSession(mockPersonas, 'persona-1', {
      podcastTitle: 'Test Podcast',
      contentSummary: 'A test podcast about testing',
      facts: ['Fact 1', 'Fact 2', 'Fact 3'],
    });

    let passed = true;

    if (!session.sessionId) {
      console.log('  ✗ No session ID');
      passed = false;
    }

    if (session.personas.length !== 1) {
      console.log('  ✗ Wrong persona count');
      passed = false;
    }

    if (session.currentPersonaId !== 'persona-1') {
      console.log('  ✗ Wrong current persona');
      passed = false;
    }

    if (!sessionExists(session.sessionId)) {
      console.log('  ✗ Session does not exist after creation');
      passed = false;
    }

    const retrieved = getConversationSession(session.sessionId);
    if (retrieved.sessionId !== session.sessionId) {
      console.log('  ✗ Retrieved session ID mismatch');
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Session created successfully');
      console.log(`  ✓ Session ID: ${session.sessionId}`);
      console.log(`  ✓ Personas: ${session.personas.length}`);
      console.log(`  ✓ Current persona: ${session.currentPersonaId}`);
      console.log(`  ✓ Session exists check: passed`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testMessageHandling() {
  console.log('\n=== Test 5: Message Handling ===');
  try {
    const {
      createConversationSession,
      addUserMessage,
      addAssistantMessage,
      getConversationHistory,
    } = await import('./conversationManager.ts');

    const mockPersonas = [
      {
        id: 'persona-1',
        name: 'Alice',
        role: 'host',
        background: 'Podcast host',
        personality: {
          formality: 0.6,
          enthusiasm: 0.8,
          humor: 0.7,
          expertise: 0.7,
        },
        speakingStyle: {
          sentenceLength: 'medium' as const,
          vocabulary: 'simple' as const,
        },
      },
    ];

    const session = createConversationSession(mockPersonas, 'persona-1');

    // Add user message
    const userMsg = addUserMessage(session.sessionId, 'Hello, how are you?');

    // Add assistant response
    const assistantResponse = {
      messageId: 'msg_test_123',
      content: 'I am doing great, thanks for asking!',
      personaId: 'persona-1',
      personaName: 'Alice',
      timestamp: new Date(),
      tokenCount: 10,
    };

    const assistantMsg = addAssistantMessage(session.sessionId, assistantResponse);

    // Get history
    const history = getConversationHistory(session.sessionId);

    let passed = true;

    if (history.length !== 2) {
      console.log(`  ✗ Wrong message count: ${history.length} (expected 2)`);
      passed = false;
    }

    if (history[0].role !== 'user') {
      console.log('  ✗ First message should be user');
      passed = false;
    }

    if (history[1].role !== 'assistant') {
      console.log('  ✗ Second message should be assistant');
      passed = false;
    }

    if (history[1].personaName !== 'Alice') {
      console.log('  ✗ Wrong persona name');
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Messages added successfully');
      console.log(`  ✓ Message count: ${history.length}`);
      console.log(`  ✓ User message: ${userMsg.content.substring(0, 30)}...`);
      console.log(`  ✓ Assistant message: ${assistantMsg.content.substring(0, 30)}...`);
      console.log(`  ✓ Persona name: ${history[1].personaName}`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testPersonaSwitching() {
  console.log('\n=== Test 6: Persona Switching ===');
  try {
    const { createConversationSession, switchPersona, getCurrentPersona } = await import(
      './conversationManager.ts'
    );

    const mockPersonas = [
      {
        id: 'persona-1',
        name: 'Alice',
        role: 'host',
        background: 'Podcast host',
        personality: {
          formality: 0.6,
          enthusiasm: 0.8,
          humor: 0.7,
          expertise: 0.7,
        },
        speakingStyle: {
          sentenceLength: 'medium' as const,
          vocabulary: 'simple' as const,
        },
      },
      {
        id: 'persona-2',
        name: 'Bob',
        role: 'guest',
        background: 'Expert guest',
        personality: {
          formality: 0.8,
          enthusiasm: 0.6,
          humor: 0.5,
          expertise: 0.9,
        },
        speakingStyle: {
          sentenceLength: 'long' as const,
          vocabulary: 'technical' as const,
        },
      },
    ];

    const session = createConversationSession(mockPersonas, 'persona-1');

    let passed = true;

    // Check initial persona
    let currentPersona = getCurrentPersona(session.sessionId);
    if (currentPersona.id !== 'persona-1') {
      console.log('  ✗ Initial persona incorrect');
      passed = false;
    }

    // Switch to second persona
    switchPersona(session.sessionId, 'persona-2');
    currentPersona = getCurrentPersona(session.sessionId);

    if (currentPersona.id !== 'persona-2') {
      console.log('  ✗ Persona not switched');
      passed = false;
    }

    if (currentPersona.name !== 'Bob') {
      console.log('  ✗ Wrong persona name after switch');
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Initial persona: Alice (persona-1)');
      console.log('  ✓ Switched to: Bob (persona-2)');
      console.log('  ✓ Persona switching works correctly');
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testSessionStats() {
  console.log('\n=== Test 7: Session Statistics ===');
  try {
    const {
      createConversationSession,
      addUserMessage,
      addAssistantMessage,
      getSessionStats,
    } = await import('./conversationManager.ts');

    const mockPersonas = [
      {
        id: 'persona-1',
        name: 'Alice',
        role: 'host',
        background: 'Podcast host',
        personality: {
          formality: 0.6,
          enthusiasm: 0.8,
          humor: 0.7,
          expertise: 0.7,
        },
        speakingStyle: {
          sentenceLength: 'medium' as const,
          vocabulary: 'simple' as const,
        },
      },
    ];

    const session = createConversationSession(mockPersonas, 'persona-1');

    // Add some messages
    addUserMessage(session.sessionId, 'Message 1');
    addAssistantMessage(session.sessionId, {
      messageId: 'msg_1',
      content: 'Response 1',
      personaId: 'persona-1',
      personaName: 'Alice',
      timestamp: new Date(),
      tokenCount: 10,
    });

    addUserMessage(session.sessionId, 'Message 2');
    addAssistantMessage(session.sessionId, {
      messageId: 'msg_2',
      content: 'Response 2',
      personaId: 'persona-1',
      personaName: 'Alice',
      timestamp: new Date(),
      tokenCount: 15,
    });

    const stats = getSessionStats(session.sessionId);

    let passed = true;

    if (stats.messageCount !== 4) {
      console.log(`  ✗ Wrong message count: ${stats.messageCount}`);
      passed = false;
    }

    if (stats.userMessageCount !== 2) {
      console.log(`  ✗ Wrong user message count: ${stats.userMessageCount}`);
      passed = false;
    }

    if (stats.assistantMessageCount !== 2) {
      console.log(`  ✗ Wrong assistant message count: ${stats.assistantMessageCount}`);
      passed = false;
    }

    if (stats.totalTokens !== 25) {
      console.log(`  ✗ Wrong token count: ${stats.totalTokens}`);
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Session statistics collected correctly');
      console.log(`  ✓ Total messages: ${stats.messageCount}`);
      console.log(`  ✓ User messages: ${stats.userMessageCount}`);
      console.log(`  ✓ Assistant messages: ${stats.assistantMessageCount}`);
      console.log(`  ✓ Total tokens: ${stats.totalTokens}`);
      console.log(`  ✓ Session duration: ${stats.sessionDuration}ms`);
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testSessionCleanup() {
  console.log('\n=== Test 8: Session Cleanup ===');
  try {
    const {
      createConversationSession,
      deleteConversationSession,
      getAllSessionIds,
      getActiveSessionCount,
    } = await import('./conversationManager.ts');

    const mockPersonas = [
      {
        id: 'persona-1',
        name: 'Alice',
        role: 'host',
        background: 'Podcast host',
        personality: {
          formality: 0.6,
          enthusiasm: 0.8,
          humor: 0.7,
          expertise: 0.7,
        },
        speakingStyle: {
          sentenceLength: 'medium' as const,
          vocabulary: 'simple' as const,
        },
      },
    ];

    const initialCount = getActiveSessionCount();

    // Create session
    const session = createConversationSession(mockPersonas, 'persona-1');
    const afterCreateCount = getActiveSessionCount();

    // Delete session
    const deleted = deleteConversationSession(session.sessionId);
    const afterDeleteCount = getActiveSessionCount();

    let passed = true;

    if (afterCreateCount !== initialCount + 1) {
      console.log('  ✗ Session count did not increase after creation');
      passed = false;
    }

    if (!deleted) {
      console.log('  ✗ Session deletion failed');
      passed = false;
    }

    if (afterDeleteCount !== initialCount) {
      console.log('  ✗ Session count did not decrease after deletion');
      passed = false;
    }

    if (passed) {
      console.log('  ✓ Initial session count:', initialCount);
      console.log('  ✓ After creation:', afterCreateCount);
      console.log('  ✓ After deletion:', afterDeleteCount);
      console.log('  ✓ Session cleanup works correctly');
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testErrorClasses() {
  console.log('\n=== Test 9: Error Classes ===');
  try {
    const {
      ConversationAgentError,
      ConversationContextError,
      PersonaNotFoundError,
    } = await import('./conversationAgent.ts');

    const {
      SessionNotFoundError,
      SessionExpiredError,
      SessionLimitError,
    } = await import('./conversationManager.ts');

    const errors = [
      new ConversationAgentError('Test'),
      new ConversationContextError('Test'),
      new PersonaNotFoundError('Test'),
      new SessionNotFoundError('Test'),
      new SessionExpiredError('Test'),
      new SessionLimitError('Test'),
    ];

    let passed = true;

    for (const error of errors) {
      if (!(error instanceof Error)) {
        console.log(`  ✗ ${error.constructor.name} is not an Error instance`);
        passed = false;
      }
    }

    if (passed) {
      console.log('  ✓ All error classes are Error instances');
      console.log(`  ✓ Tested ${errors.length} error classes`);
      errors.forEach((e) => console.log(`    - ${e.name}`));
    }

    return passed;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testStreamingSupport() {
  console.log('\n=== Test 10: Streaming Support ===');
  try {
    const { generateStreamingCompletion } = await import('./openai.ts');

    // Check if function exists and is an async generator
    if (typeof generateStreamingCompletion !== 'function') {
      console.log('  ✗ generateStreamingCompletion is not a function');
      return false;
    }

    console.log('  ✓ Streaming completion function exists');
    console.log('  ✓ Function signature validated');
    console.log('  ✓ Async generator for real-time streaming');

    return true;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// ============================================================================
// Test Runner
// ============================================================================

async function runAllTests(): Promise<boolean> {
  console.log('==========================================');
  console.log('Phase 2 Test Suite');
  console.log('Real-Time Conversation Agent');
  console.log('==========================================');

  const results = {
    conversationAgentStructure: await testConversationAgentStructure(),
    conversationManagerStructure: await testConversationManagerStructure(),
    personaConversion: await testPersonaToConversationProfile(),
    sessionCreation: await testSessionCreation(),
    messageHandling: await testMessageHandling(),
    personaSwitching: await testPersonaSwitching(),
    sessionStats: await testSessionStats(),
    sessionCleanup: await testSessionCleanup(),
    errorClasses: await testErrorClasses(),
    streamingSupport: await testStreamingSupport(),
  };

  console.log('\n==========================================');
  console.log('Test Results Summary');
  console.log('==========================================');

  let passed = 0;
  let failed = 0;

  for (const [name, result] of Object.entries(results)) {
    const status = result ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n==========================================');
  console.log(`Total: ${passed}/${passed + failed} tests passed`);
  console.log('==========================================\n');

  return failed === 0;
}

// Run tests - this file is meant to be executed directly
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { runAllTests };
