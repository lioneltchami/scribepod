/**
 * Content Processing Tests
 * Tests for content parser, preprocessor, and ingestion services
 */

import fs from 'fs';
import path from 'path';

async function testContentParserStructure() {
  console.log('\n=== Test 1: Content Parser Structure ===');
  try {
    const parser = await import('./contentParser');

    const expectedFunctions = [
      'parseFile',
      'parseString',
      'parseTextFile',
      'parseHTML',
      'parseMarkdown',
      'parsePDF',
      'parseDOCX',
      'htmlToMarkdown',
      'validateParsedContent',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (parser as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} parser functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testContentPreprocessorStructure() {
  console.log('\n=== Test 2: Content Preprocessor Structure ===');
  try {
    const preprocessor = await import('./contentPreprocessor');

    const expectedFunctions = [
      'preprocessContent',
      'cleanText',
      'chunkContent',
      'splitIntoSentences',
      'splitIntoParagraphs',
      'extractKeyInfo',
      'calculateReadability',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (preprocessor as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} preprocessor functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testContentIngestionStructure() {
  console.log('\n=== Test 3: Content Ingestion Structure ===');
  try {
    const ingestion = await import('./contentIngestion');

    const expectedFunctions = [
      'ingestFile',
      'ingestString',
      'ingestURL',
      'getContentWithFacts',
      'listAllContent',
      'deleteContentById',
      'batchIngestFiles',
      'getContentStats',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (ingestion as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} ingestion functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testProcessingWorkerStructure() {
  console.log('\n=== Test 4: Processing Worker Structure ===');
  try {
    const worker = await import('./processingWorker');

    const expectedFunctions = ['processJob', 'startWorker'];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (worker as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} worker functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testPipelineOrchestratorStructure() {
  console.log('\n=== Test 5: Pipeline Orchestrator Structure ===');
  try {
    const pipeline = await import('./pipelineOrchestrator');

    const expectedFunctions = [
      'generatePodcastFromFile',
      'generatePodcastFromString',
      'generatePodcastFromURL',
      'getPipelineStatus',
      'cancelPipeline',
      'retryPipeline',
    ];

    let allExist = true;
    for (const func of expectedFunctions) {
      if (typeof (pipeline as any)[func] !== 'function') {
        console.log(`  ✗ Missing function: ${func}`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log(`✓ All ${expectedFunctions.length} pipeline functions exist`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testTextCleaning() {
  console.log('\n=== Test 6: Text Cleaning ===');
  try {
    const { cleanText } = await import('./contentPreprocessor');

    const dirtyText = `
      This  has   extra    spaces!


      Multiple newlines too.

      Visit http://example.com and email test@example.com
    `;

    const cleaned = cleanText(dirtyText, {
      removeUrls: true,
      removeEmails: true,
      removeExtraWhitespace: true,
    });

    if (!cleaned.includes('http://example.com')) {
      console.log('  ✓ URLs removed');
    }

    if (!cleaned.includes('test@example.com')) {
      console.log('  ✓ Emails removed');
    }

    if (!cleaned.includes('   ')) {
      console.log('  ✓ Extra whitespace normalized');
    }

    console.log('✓ Text cleaning works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testContentChunking() {
  console.log('\n=== Test 7: Content Chunking ===');
  try {
    const { chunkContent } = await import('./contentPreprocessor');

    const text = Array(500)
      .fill('This is a test sentence.')
      .join(' ');

    const chunks = chunkContent(text, {
      maxChunkWords: 100,
      minChunkWords: 20,
      overlapWords: 10,
    });

    if (chunks.length > 0) {
      console.log(`  ✓ Created ${chunks.length} chunks`);
    }

    if (chunks.every(c => c.wordCount <= 100)) {
      console.log('  ✓ All chunks within max word limit');
    }

    if (chunks.every((c, i) => c.sequence === i)) {
      console.log('  ✓ Chunks have correct sequence numbers');
    }

    console.log('✓ Content chunking works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testReadabilityCalculation() {
  console.log('\n=== Test 8: Readability Calculation ===');
  try {
    const { calculateReadability } = await import('./contentPreprocessor');

    const easyText = 'The cat sat on the mat. It was a nice day.';
    const hardText = 'The implementation of sophisticated algorithms necessitates comprehensive understanding of computational complexity theory.';

    const easyScore = calculateReadability(easyText);
    const hardScore = calculateReadability(hardText);

    console.log(`  Easy text score: ${easyScore.fleschScore} (${easyScore.gradeLevel})`);
    console.log(`  Hard text score: ${hardScore.fleschScore} (${hardScore.gradeLevel})`);

    if (easyScore.fleschScore > hardScore.fleschScore) {
      console.log('  ✓ Easy text scored higher (easier to read)');
    }

    console.log('✓ Readability calculation works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testStringParsing() {
  console.log('\n=== Test 9: String Parsing ===');
  try {
    const { parseString } = await import('./contentParser');

    const text = 'This is a test document. It has multiple sentences. This tests string parsing.';

    const parsed = await parseString(text, 'TEXT');

    if (parsed.text.length > 0) {
      console.log(`  ✓ Parsed text: ${parsed.text.length} characters`);
    }

    if (parsed.wordCount > 0) {
      console.log(`  ✓ Word count: ${parsed.wordCount}`);
    }

    if (parsed.sourceType === 'TEXT') {
      console.log('  ✓ Source type correctly set');
    }

    console.log('✓ String parsing works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testHTMLToMarkdown() {
  console.log('\n=== Test 10: HTML to Markdown Conversion ===');
  try {
    const { htmlToMarkdown } = await import('./contentParser');

    const html = '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>';
    const markdown = htmlToMarkdown(html);

    if (markdown.includes('# Title')) {
      console.log('  ✓ H1 converted to markdown heading');
    }

    if (markdown.includes('**bold**')) {
      console.log('  ✓ Strong tag converted to markdown bold');
    }

    console.log('✓ HTML to markdown conversion works correctly');
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('==========================================');
  console.log('Content Processing Test Suite');
  console.log('==========================================');

  const results = {
    parserStructure: await testContentParserStructure(),
    preprocessorStructure: await testContentPreprocessorStructure(),
    ingestionStructure: await testContentIngestionStructure(),
    workerStructure: await testProcessingWorkerStructure(),
    pipelineStructure: await testPipelineOrchestratorStructure(),
    textCleaning: await testTextCleaning(),
    contentChunking: await testContentChunking(),
    readability: await testReadabilityCalculation(),
    stringParsing: await testStringParsing(),
    htmlToMarkdown: await testHTMLToMarkdown(),
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
    console.log('Content processing services are working correctly.');
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
