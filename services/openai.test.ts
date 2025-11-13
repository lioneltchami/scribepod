/**
 * OpenAI Service Tests
 * Manual test file to verify OpenAI integration
 */

import { generateCompletion, extractFacts, generateDialogueFromFacts, healthCheck, config, OpenAIError } from './openai';
import type { ChatMessage } from '../shared/types';

async function testBasicCompletion() {
  console.log('\n=== Test 1: Basic Completion ===');
  try {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Say "Hello, World!" and nothing else.' }
    ];

    const response = await generateCompletion(messages, {
      maxTokens: 20,
      temperature: 0,
    });

    console.log('✓ Response:', response);
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testFactExtraction() {
  console.log('\n=== Test 2: Fact Extraction ===');
  try {
    const sampleText = `
      The burrito originated in Ciudad Juárez, Mexico. It consists of a wheat flour tortilla
      wrapped around various fillings. The word "burrito" means "little donkey" in Spanish.
      Burritos were first mentioned in U.S. media in 1934 and appeared on American restaurant
      menus in the 1930s. A frozen burrito was developed in Southern California in 1956.
    `;

    const facts = await extractFacts(sampleText, 'Burrito History');
    console.log(`✓ Extracted ${facts.length} facts:`);
    facts.forEach((fact, i) => console.log(`  ${i + 1}. ${fact}`));
    return facts.length > 0;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testDialogueGeneration() {
  console.log('\n=== Test 3: Dialogue Generation ===');
  try {
    const facts = [
      'The burrito originated in Ciudad Juárez, Mexico',
      'The word "burrito" means "little donkey" in Spanish',
      'A frozen burrito was developed in Southern California in 1956',
    ];

    const dialogue = await generateDialogueFromFacts(facts, {
      title: 'History of the Burrito',
      speakerA: 'Alice',
      speakerB: 'Bob',
      style: 'conversational',
      isFirst: true,
    });

    console.log('✓ Generated dialogue:');
    console.log(dialogue.split('\n').slice(0, 10).join('\n')); // First 10 lines
    console.log('...');
    return dialogue.length > 0;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n=== Test 4: Error Handling ===');
  try {
    // Test empty messages error
    try {
      await generateCompletion([]);
      console.log('✗ Should have thrown error for empty messages');
      return false;
    } catch (error) {
      if (error instanceof OpenAIError) {
        console.log('✓ Correctly threw OpenAIError for empty messages');
      } else {
        console.log('✗ Wrong error type');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('✗ Unexpected error:', error);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n=== Test 5: Health Check ===');
  try {
    const healthy = await healthCheck();
    if (healthy) {
      console.log('✓ OpenAI API is accessible');
    } else {
      console.log('✗ OpenAI API health check failed');
    }
    return healthy;
  } catch (error) {
    console.error('✗ Health check error:', error);
    return false;
  }
}

async function testConfiguration() {
  console.log('\n=== Test 6: Configuration ===');
  console.log(`API Key Configured: ${config.apiKeyConfigured ? '✓' : '✗'}`);
  console.log(`Default Model: ${config.defaultModel}`);
  console.log(`Max Retries: ${config.maxRetries}`);
  return config.apiKeyConfigured;
}

async function runAllTests() {
  console.log('==========================================');
  console.log('OpenAI Service Test Suite');
  console.log('==========================================');

  const results = {
    configuration: await testConfiguration(),
    errorHandling: await testErrorHandling(),
    healthCheck: false,
    basicCompletion: false,
    factExtraction: false,
    dialogueGeneration: false,
  };

  // Only run API tests if API key is configured
  if (results.configuration) {
    results.healthCheck = await testHealthCheck();

    if (results.healthCheck) {
      results.basicCompletion = await testBasicCompletion();
      results.factExtraction = await testFactExtraction();
      results.dialogueGeneration = await testDialogueGeneration();
    } else {
      console.log('\n⚠️  Skipping API tests - health check failed');
      console.log('Make sure OPENAI_API_KEY is set correctly in .env');
    }
  } else {
    console.log('\n⚠️  Skipping API tests - API key not configured');
    console.log('Set OPENAI_API_KEY in .env to run full tests');
  }

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

  return passed === total;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests };
