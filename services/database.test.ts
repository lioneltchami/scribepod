/**
 * Database Service Tests
 * Tests for database CRUD operations and service layer
 */

import {
  db,
  DatabaseError,
  getPrismaClient,
  disconnectDatabase,
  healthCheck,
} from './database';

async function testServiceStructure() {
  console.log('\n=== Test 1: Service Structure ===');
  try {
    // Check that db export has all expected methods
    const expectedMethods = [
      'getClient',
      'disconnect',
      'healthCheck',
      'createContent',
      'getContentById',
      'listContent',
      'deleteContent',
      'createFact',
      'createManyFacts',
      'getFactsByContentId',
      'createPodcast',
      'getPodcastById',
      'updatePodcastStatus',
      'listPodcasts',
      'createPersona',
      'getPersonaById',
      'getPersonaByName',
      'listPersonas',
      'addPersonaToPodcast',
      'createDialogue',
      'createManyDialogues',
      'getDialoguesByPodcastId',
      'createAudioSegment',
      'getAudioSegmentsByPodcastId',
      'createProcessingJob',
      'updateProcessingJob',
      'getProcessingJobById',
      'getPendingProcessingJobs',
    ];

    const missingMethods: string[] = [];
    for (const method of expectedMethods) {
      if (typeof (db as any)[method] !== 'function') {
        missingMethods.push(method);
      }
    }

    if (missingMethods.length > 0) {
      console.log(`✗ Missing methods: ${missingMethods.join(', ')}`);
      return false;
    }

    console.log(`✓ All ${expectedMethods.length} database methods exist`);
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n=== Test 2: Error Handling ===');
  try {
    // Test DatabaseError class
    const error = new DatabaseError('Test error', { code: 'TEST' });

    if (error instanceof DatabaseError) {
      console.log('✓ DatabaseError class works correctly');
    } else {
      console.log('✗ DatabaseError class not working');
      return false;
    }

    if (error.name === 'DatabaseError') {
      console.log('✓ DatabaseError has correct name');
    } else {
      console.log('✗ DatabaseError name incorrect');
      return false;
    }

    if (error.originalError?.code === 'TEST') {
      console.log('✓ DatabaseError captures original error');
    } else {
      console.log('✗ DatabaseError does not capture original error');
      return false;
    }

    return true;
  } catch (error) {
    console.error('✗ Unexpected error:', error);
    return false;
  }
}

async function testClientManagement() {
  console.log('\n=== Test 3: Client Management ===');
  try {
    // Test getPrismaClient
    const client = getPrismaClient();
    if (!client) {
      console.log('✗ getPrismaClient returned null');
      return false;
    }
    console.log('✓ Prisma client instance created');

    // Test that subsequent calls return same instance
    const client2 = getPrismaClient();
    if (client !== client2) {
      console.log('✗ getPrismaClient not returning singleton');
      return false;
    }
    console.log('✓ Prisma client is singleton');

    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testHealthCheckExists() {
  console.log('\n=== Test 4: Health Check Function ===');
  try {
    // We can't actually run the health check without a database,
    // but we can verify the function exists and has the right signature
    if (typeof healthCheck !== 'function') {
      console.log('✗ healthCheck is not a function');
      return false;
    }
    console.log('✓ healthCheck function exists');

    // Test that it returns a Promise
    const result = healthCheck();
    if (!(result instanceof Promise)) {
      console.log('✗ healthCheck does not return a Promise');
      return false;
    }
    console.log('✓ healthCheck returns Promise<boolean>');

    // Wait for it to complete (will fail without database, but that's expected)
    try {
      await result;
    } catch (error) {
      // Expected to fail without database connection
    }

    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testTypeExports() {
  console.log('\n=== Test 5: Type Exports ===');
  try {
    // Test that we can import types from generated Prisma client
    const { PrismaClient, Prisma } = await import('../generated/prisma');

    if (!PrismaClient) {
      console.log('✗ PrismaClient not exported');
      return false;
    }
    console.log('✓ PrismaClient exported correctly');

    if (!Prisma) {
      console.log('✗ Prisma namespace not exported');
      return false;
    }
    console.log('✓ Prisma namespace exported correctly');

    // Check for expected enums
    const expectedEnums = ['SourceType', 'ConversationStyle', 'ProcessingStatus', 'PersonaRole', 'VoiceProvider', 'AudioFormat'];
    const missingEnums: string[] = [];

    for (const enumName of expectedEnums) {
      if (!(Prisma as any)[enumName]) {
        missingEnums.push(enumName);
      }
    }

    if (missingEnums.length > 0) {
      console.log(`✗ Missing enums: ${missingEnums.join(', ')}`);
      return false;
    }

    console.log(`✓ All ${expectedEnums.length} expected enums exist`);
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testFunctionSignatures() {
  console.log('\n=== Test 6: Function Signatures ===');
  try {
    // Test that CRUD functions have correct signatures (number of parameters)
    const functionsToTest = [
      { name: 'createContent', minParams: 1 },
      { name: 'getContentById', minParams: 1 },
      { name: 'createPodcast', minParams: 1 },
      { name: 'getPodcastById', minParams: 1 },
      { name: 'createPersona', minParams: 1 },
      { name: 'getPersonaByName', minParams: 1 },
      { name: 'createDialogue', minParams: 1 },
      { name: 'createManyFacts', minParams: 1 },
    ];

    for (const func of functionsToTest) {
      const fn = (db as any)[func.name];
      if (fn.length < func.minParams) {
        console.log(`✗ ${func.name} has wrong number of parameters`);
        return false;
      }
    }

    console.log('✓ All functions have correct signatures');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testDatabaseServiceImport() {
  console.log('\n=== Test 7: Database Service Import ===');
  try {
    // Test that we can import the database service
    const dbService = await import('./database');

    if (!dbService.db) {
      console.log('✗ db export not found');
      return false;
    }
    console.log('✓ Database service imported successfully');

    if (!dbService.DatabaseError) {
      console.log('✗ DatabaseError not exported');
      return false;
    }
    console.log('✓ DatabaseError exported');

    if (!dbService.getPrismaClient) {
      console.log('✗ getPrismaClient not exported');
      return false;
    }
    console.log('✓ getPrismaClient exported');

    return true;
  } catch (error) {
    console.error('✗ Error importing database service:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('==========================================');
  console.log('Database Service Test Suite');
  console.log('==========================================');

  const results = {
    serviceStructure: await testServiceStructure(),
    errorHandling: await testErrorHandling(),
    clientManagement: await testClientManagement(),
    healthCheck: await testHealthCheckExists(),
    typeExports: await testTypeExports(),
    functionSignatures: await testFunctionSignatures(),
    serviceImport: await testDatabaseServiceImport(),
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

  // Clean up
  try {
    await disconnectDatabase();
    console.log('\n✓ Database connection cleaned up');
  } catch (error) {
    console.error('\n✗ Error during cleanup:', error);
  }

  if (passed === total) {
    console.log('\n✓ ALL TESTS PASSED!');
    console.log('Note: These tests verify service structure and types.');
    console.log('To test actual database operations, set DATABASE_URL in .env');
    console.log('and ensure PostgreSQL is running.');
  }

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
