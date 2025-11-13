/**
 * Phase 1 Tests
 * Comprehensive tests for multi-persona podcast generation
 */

async function testDialogueGeneratorStructure() {
  console.log('\n=== Test 1: Dialogue Generator Structure ===');
  try {
    const dialogueGen = await import('./dialogueGenerator.ts');

    const expectedFunctions = [
      'generateMultiPersonaDialogue',
      'generatePodcastIntro',
      'generatePodcastOutro',
      'personaToProfile',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (dialogueGen as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} dialogue generator functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testDialogueContextStructure() {
  console.log('\n=== Test 2: Dialogue Context Manager Structure ===');
  try {
    const contextMgr = await import('./dialogueContext.ts');

    const expectedFunctions = [
      'createContext',
      'addTurns',
      'markFactsDiscussed',
      'getNextFacts',
      'analyzeSpeakerBalance',
      'getConversationStats',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (contextMgr as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} context manager functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testDialogueQualityStructure() {
  console.log('\n=== Test 3: Dialogue Quality Validator Structure ===');
  try {
    const quality = await import('./dialogueQuality.ts');

    const expectedFunctions = [
      'validateDialogueQuality',
      'filterLowQualityTurns',
      'exportAsJSON',
      'exportAsText',
      'exportAsSRT',
      'exportAsMarkdown',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (quality as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} quality validator functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testPodcastGeneratorStructure() {
  console.log('\n=== Test 4: Podcast Generator Structure ===');
  try {
    const podcastGen = await import('./podcastGenerator.ts');

    const expectedFunctions = [
      'generateCompletePodcast',
      'savePodcastToDatabase',
      'exportPodcast',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (podcastGen as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} podcast generator functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testPersonaToProfile() {
  console.log('\n=== Test 5: Persona Conversion ===');
  try {
    const { personaToProfile } = await import('./dialogueGenerator.ts');

    // Mock Prisma Persona
    const mockPersona = {
      id: 'test-id',
      name: 'Test Persona',
      role: 'HOST',
      bio: 'A test persona',
      expertise: ['Testing', 'Quality Assurance'],
      formality: 0.7,
      enthusiasm: 0.8,
      humor: 0.5,
      expertiseLevel: 0.9,
      interruption: 0.3,
      sentenceLength: 'medium',
      vocabulary: 'academic',
      expressiveness: 'varied',
      pace: 'medium',
      voiceProvider: null,
      voiceId: null,
      voiceStability: null,
      voiceSimilarity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      podcasts: [],
      dialogues: [],
      audioSegments: [],
    };

    const profile = personaToProfile(mockPersona as any);

    if (profile.id === 'test-id' &&
        profile.name === 'Test Persona' &&
        profile.role === 'host' &&
        profile.personality.formality === 0.7) {
      console.log('✓ Persona conversion works correctly');
      return true;
    }

    console.log('✗ Persona conversion failed');
    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testDialogueQualityValidation() {
  console.log('\n=== Test 6: Dialogue Quality Validation ===');
  try {
    const { validateDialogueQuality } = await import('./dialogueQuality.ts');

    const mockTurns = [
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Hello everyone! Welcome to our podcast.', turnNumber: 0 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'Thanks for having me, Alice. I\'m excited to be here.', turnNumber: 1 },
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Today we\'re discussing an interesting topic.', turnNumber: 2 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'Yes, this is very fascinating. Can you tell us more?', turnNumber: 3 },
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Of course! Let me explain the key points.', turnNumber: 4 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'That makes sense. I have a question about that.', turnNumber: 5 },
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Great question! The answer is quite interesting.', turnNumber: 6 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'I see. That\'s a good point you\'re making.', turnNumber: 7 },
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Let me add one more thing to that.', turnNumber: 8 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'Thank you for explaining that so clearly.', turnNumber: 9 },
    ];

    const mockPersonas = [
      {
        id: 'alice-id',
        name: 'Alice',
        role: 'host' as const,
        personality: { formality: 0.5, enthusiasm: 0.7, humor: 0.6, expertise: 0.8, interruption: 0.3 },
        speakingStyle: { sentenceLength: 'medium' as const, vocabulary: 'academic' as const, pace: 'medium' as const },
        bio: 'Host', expertise: ['Hosting'],
      },
      {
        id: 'bob-id',
        name: 'Bob',
        role: 'guest' as const,
        personality: { formality: 0.5, enthusiasm: 0.6, humor: 0.5, expertise: 0.7, interruption: 0.4 },
        speakingStyle: { sentenceLength: 'short' as const, vocabulary: 'simple' as const, pace: 'medium' as const },
        bio: 'Guest', expertise: ['Topics'],
      },
    ];

    const report = validateDialogueQuality(mockTurns as any, mockPersonas as any);

    console.log(`  Quality score: ${report.score}/100`);
    console.log(`  Passed: ${report.passed}`);
    console.log(`  Issues: ${report.issues.length}`);
    console.log(`  Strengths: ${report.strengths.length}`);

    if (report.score > 0 && report.score <= 100) {
      console.log('✓ Quality validation works correctly');
      return true;
    }

    console.log('✗ Quality validation failed');
    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testExportFormats() {
  console.log('\n=== Test 7: Export Formats ===');
  try {
    const { exportAsJSON, exportAsText, exportAsSRT, exportAsMarkdown } = await import('./dialogueQuality.ts');

    const mockTurns = [
      { speaker: 'Alice', speakerId: 'alice-id', text: 'Hello!', turnNumber: 0 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'Hi there!', turnNumber: 1 },
    ];

    const mockPersonas = [
      { id: 'alice-id', name: 'Alice', role: 'host' as const, personality: {}, speakingStyle: {}, bio: '', expertise: [] },
      { id: 'bob-id', name: 'Bob', role: 'guest' as const, personality: {}, speakingStyle: {}, bio: '', expertise: [] },
    ];

    // Test JSON export
    const json = exportAsJSON(mockTurns as any, mockPersonas as any);
    if (!json.includes('Alice') || !json.includes('Hello!')) {
      console.log('✗ JSON export failed');
      return false;
    }
    console.log('  ✓ JSON export works');

    // Test text export
    const text = exportAsText(mockTurns as any, false);
    if (!text.includes('Alice: Hello!')) {
      console.log('✗ Text export failed');
      return false;
    }
    console.log('  ✓ Text export works');

    // Test SRT export
    const srt = exportAsSRT(mockTurns as any);
    if (!srt.includes('-->') || !srt.includes('Alice: Hello!')) {
      console.log('✗ SRT export failed');
      return false;
    }
    console.log('  ✓ SRT export works');

    // Test Markdown export
    const md = exportAsMarkdown(mockTurns as any, 'Test Podcast');
    if (!md.includes('**Alice:**') || !md.includes('Hello!')) {
      console.log('✗ Markdown export failed');
      return false;
    }
    console.log('  ✓ Markdown export works');

    console.log('✓ All export formats work correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testContextCreation() {
  console.log('\n=== Test 8: Context Creation and Management ===');
  try {
    const { createContext, addTurns, getConversationStats } = await import('./dialogueContext.ts');

    const mockPersonas = [
      {
        id: 'alice-id',
        name: 'Alice',
        role: 'host' as const,
        personality: { formality: 0.5, enthusiasm: 0.7, humor: 0.6, expertise: 0.8, interruption: 0.3 },
        speakingStyle: { sentenceLength: 'medium' as const, vocabulary: 'academic' as const, pace: 'medium' as const },
        bio: 'Host',
        expertise: ['Hosting'],
      },
    ];

    const context = createContext('test-id', 'Test Podcast', mockPersonas, ['fact1', 'fact2'], 2);

    if (context.podcastId !== 'test-id' || context.title !== 'Test Podcast') {
      console.log('✗ Context creation failed');
      return false;
    }
    console.log('  ✓ Context created');

    // Test adding turns
    const mockTurn = {
      speaker: 'Alice',
      speakerId: 'alice-id',
      text: 'Test turn',
      turnNumber: 0,
    };

    addTurns(context, [mockTurn as any]);

    if (context.allTurns.length !== 1) {
      console.log('✗ Adding turns failed');
      return false;
    }
    console.log('  ✓ Adding turns works');

    // Test stats
    const stats = getConversationStats(context);

    if (stats.totalTurns !== 1 || stats.totalWords < 1) {
      console.log('✗ Stats calculation failed');
      return false;
    }
    console.log('  ✓ Stats calculation works');

    console.log('✓ Context management works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testFilterLowQualityTurns() {
  console.log('\n=== Test 9: Filter Low Quality Turns ===');
  try {
    const { filterLowQualityTurns } = await import('./dialogueQuality.ts');

    const mockTurns = [
      { speaker: 'Alice', speakerId: 'alice-id', text: 'This is a good turn with substance', turnNumber: 0 },
      { speaker: 'Bob', speakerId: 'bob-id', text: 'um', turnNumber: 1 }, // Should be filtered
      { speaker: 'Alice', speakerId: 'alice-id', text: 'a', turnNumber: 2 }, // Too short
      { speaker: 'Bob', speakerId: 'bob-id', text: 'Another good turn here', turnNumber: 3 },
      { speaker: 'Alice', speakerId: 'alice-id', text: 'yeah', turnNumber: 4 }, // Filler
      { speaker: 'Bob', speakerId: 'bob-id', text: 'This should remain as well', turnNumber: 5 },
    ];

    const filtered = filterLowQualityTurns(mockTurns as any);

    // Should filter out turns 1, 2, and 4
    if (filtered.length !== 3) {
      console.log(`✗ Filter failed: expected 3 turns, got ${filtered.length}`);
      return false;
    }

    console.log('  ✓ Filtered low quality turns correctly');
    console.log(`  Removed ${mockTurns.length - filtered.length} low quality turns`);
    console.log('✓ Quality filtering works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testErrorClasses() {
  console.log('\n=== Test 10: Error Classes ===');
  try {
    const { DialogueGeneratorError } = await import('./dialogueGenerator.ts');
    const { DialogueContextError } = await import('./dialogueContext.ts');
    const { DialogueQualityError } = await import('./dialogueQuality.ts');
    const { PodcastGeneratorError } = await import('./podcastGenerator.ts');

    const errors = [
      new DialogueGeneratorError('Test'),
      new DialogueContextError('Test'),
      new DialogueQualityError('Test'),
      new PodcastGeneratorError('Test'),
    ];

    let allValid = true;
    errors.forEach((error, i) => {
      if (!(error instanceof Error)) {
        console.log(`  ✗ Error class ${i + 1} not instance of Error`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✓ All error classes work correctly');
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('==========================================');
  console.log('Phase 1 Test Suite');
  console.log('Multi-Persona Podcast Generation');
  console.log('==========================================');

  const results = {
    dialogueGeneratorStructure: await testDialogueGeneratorStructure(),
    dialogueContextStructure: await testDialogueContextStructure(),
    dialogueQualityStructure: await testDialogueQualityStructure(),
    podcastGeneratorStructure: await testPodcastGeneratorStructure(),
    personaConversion: await testPersonaToProfile(),
    qualityValidation: await testDialogueQualityValidation(),
    exportFormats: await testExportFormats(),
    contextManagement: await testContextCreation(),
    qualityFiltering: await testFilterLowQualityTurns(),
    errorClasses: await testErrorClasses(),
  };

  console.log('\n==========================================');
  console.log('Test Results Summary');
  console.log('==========================================');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
  });

  console.log(`\nTotal: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✓ ALL TESTS PASSED!');
    console.log('Phase 1 multi-persona podcast generation system is working correctly.');
  }

  return passed === total;
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
