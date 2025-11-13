/**
 * Processing Worker Service
 * Handles async processing jobs: fact extraction, dialogue generation, audio synthesis
 */

import { extractFacts, generateDialogueFromFacts } from './openai';
import { db, type CreateFactInput, type CreateDialogueInput } from './database';
import { preprocessContent } from './contentPreprocessor';
import { parseString } from './contentParser';
import type { ProcessingJob, Content, Podcast } from '../generated/prisma';
import { Prisma } from '../generated/prisma';

export class ProcessingWorkerError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ProcessingWorkerError';
  }
}

export interface JobResult {
  jobId: string;
  status: 'completed' | 'failed';
  output?: any;
  error?: string;
}

/**
 * Process a fact extraction job
 */
async function processFactExtractionJob(job: ProcessingJob): Promise<JobResult> {
  try {
    console.log(`[ProcessingWorker] Starting fact extraction job: ${job.id}`);

    // Parse input data
    const inputData = JSON.parse(job.inputData || '{}');
    const contentId = inputData.contentId;

    if (!contentId) {
      throw new ProcessingWorkerError('Missing contentId in job input data');
    }

    // Get content from database
    const content = await db.getContentById(contentId);
    if (!content) {
      throw new ProcessingWorkerError(`Content not found: ${contentId}`);
    }

    console.log(`[ProcessingWorker] Processing content: ${content.title} (${content.wordCount} words)`);

    // Update job status to in progress
    await db.updateProcessingJob(job.id, {
      status: 'GENERATING',
      progress: 10,
    });

    // Preprocess content to get chunks
    const parsed = await parseString(content.rawText, content.sourceType as any);
    const preprocessed = await preprocessContent(parsed, {
      maxChunkWords: 2000, // Larger chunks for fact extraction
      minChunkWords: 100,
    });

    console.log(`[ProcessingWorker] Content split into ${preprocessed.chunks.length} chunks`);

    // Extract facts from each chunk
    const allFacts: CreateFactInput[] = [];
    const totalChunks = preprocessed.chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = preprocessed.chunks[i];
      console.log(`[ProcessingWorker] Extracting facts from chunk ${i + 1}/${totalChunks}`);

      try {
        const facts = await extractFacts(chunk.text, `${content.title} - Part ${i + 1}`);

        // Create fact objects for database
        for (const fact of facts) {
          allFacts.push({
            contentId: content.id,
            text: fact,
            importance: 0.5, // Default importance
            section: `Chunk ${i + 1}`,
          });
        }

        // Update progress
        const progress = 10 + Math.round((i + 1) / totalChunks * 80);
        await db.updateProcessingJob(job.id, { progress });

      } catch (error) {
        console.error(`[ProcessingWorker] Error extracting facts from chunk ${i + 1}:`, error);
        // Continue with next chunk
      }
    }

    console.log(`[ProcessingWorker] Extracted ${allFacts.length} total facts`);

    // Store facts in database
    const storedCount = await db.createManyFacts(allFacts);

    // Update job as completed
    await db.updateProcessingJob(job.id, {
      status: 'COMPLETED',
      progress: 100,
      outputData: JSON.stringify({ factsExtracted: storedCount }),
    });

    console.log(`[ProcessingWorker] ✓ Fact extraction job completed: ${job.id}`);

    return {
      jobId: job.id,
      status: 'completed',
      output: { factsExtracted: storedCount },
    };

  } catch (error) {
    console.error(`[ProcessingWorker] ✗ Fact extraction job failed: ${job.id}`, error);

    // Update job as failed
    await db.updateProcessingJob(job.id, {
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return {
      jobId: job.id,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process a dialogue generation job
 */
async function processDialogueGenerationJob(job: ProcessingJob): Promise<JobResult> {
  try {
    console.log(`[ProcessingWorker] Starting dialogue generation job: ${job.id}`);

    // Parse input data
    const inputData = JSON.parse(job.inputData || '{}');
    const podcastId = inputData.podcastId;

    if (!podcastId) {
      throw new ProcessingWorkerError('Missing podcastId in job input data');
    }

    // Get podcast from database
    const podcast = await db.getPodcastById(podcastId);
    if (!podcast) {
      throw new ProcessingWorkerError(`Podcast not found: ${podcastId}`);
    }

    console.log(`[ProcessingWorker] Generating dialogue for podcast: ${podcast.title}`);

    // Update job and podcast status
    await db.updateProcessingJob(job.id, {
      status: 'GENERATING',
      progress: 10,
    });

    await db.updatePodcastStatus(podcastId, 'GENERATING', 10, 'Generating dialogue');

    // Get facts for the content
    const facts = await db.getFactsByContentId(podcast.contentId);
    if (facts.length === 0) {
      throw new ProcessingWorkerError('No facts found for content');
    }

    console.log(`[ProcessingWorker] Found ${facts.length} facts`);

    // Split facts into manageable chunks (7 chunks as per original code)
    const factsPerChunk = Math.ceil(facts.length / 7);
    const factChunks: string[][] = [];

    for (let i = 0; i < facts.length; i += factsPerChunk) {
      const chunk = facts.slice(i, i + factsPerChunk).map(f => f.text);
      factChunks.push(chunk);
    }

    console.log(`[ProcessingWorker] Split facts into ${factChunks.length} dialogue chunks`);

    // Get personas for the podcast
    const personas = podcast.personas.map(pp => pp.persona);
    if (personas.length < 2) {
      throw new ProcessingWorkerError('Podcast needs at least 2 personas');
    }

    const speakerA = personas[0].name;
    const speakerB = personas[1].name;

    // Generate dialogue for each fact chunk
    const allDialogues: CreateDialogueInput[] = [];
    let turnNumber = 0;

    for (let i = 0; i < factChunks.length; i++) {
      const factChunk = factChunks[i];
      const isFirst = i === 0;
      const isLast = i === factChunks.length - 1;

      console.log(`[ProcessingWorker] Generating dialogue chunk ${i + 1}/${factChunks.length}`);

      try {
        const dialogue = await generateDialogueFromFacts(factChunk, {
          title: podcast.title,
          speakerA,
          speakerB,
          style: 'conversational',
          isFirst,
          isLast,
        });

        // Parse dialogue into turns
        const lines = dialogue
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        for (const line of lines) {
          // Parse "Speaker: text" format
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            const speakerName = match[1].trim();
            const text = match[2].trim();

            // Find persona by name
            const persona = personas.find(p => p.name === speakerName);
            if (persona) {
              allDialogues.push({
                podcastId: podcast.id,
                personaId: persona.id,
                turnNumber: turnNumber++,
                text,
              });
            }
          }
        }

        // Update progress
        const progress = 10 + Math.round((i + 1) / factChunks.length * 80);
        await db.updateProcessingJob(job.id, { progress });
        await db.updatePodcastStatus(podcastId, 'GENERATING', progress, `Chunk ${i + 1}/${factChunks.length}`);

      } catch (error) {
        console.error(`[ProcessingWorker] Error generating dialogue chunk ${i + 1}:`, error);
        // Continue with next chunk
      }
    }

    console.log(`[ProcessingWorker] Generated ${allDialogues.length} dialogue turns`);

    // Store dialogues in database
    const storedCount = await db.createManyDialogues(allDialogues);

    // Update job and podcast as completed
    await db.updateProcessingJob(job.id, {
      status: 'COMPLETED',
      progress: 100,
      outputData: JSON.stringify({ dialoguesGenerated: storedCount }),
    });

    await db.updatePodcastStatus(podcastId, 'COMPLETED', 100, 'Dialogue generation complete');

    console.log(`[ProcessingWorker] ✓ Dialogue generation job completed: ${job.id}`);

    return {
      jobId: job.id,
      status: 'completed',
      output: { dialoguesGenerated: storedCount },
    };

  } catch (error) {
    console.error(`[ProcessingWorker] ✗ Dialogue generation job failed: ${job.id}`, error);

    // Update job as failed
    await db.updateProcessingJob(job.id, {
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Update podcast status if we have podcastId
    const inputData = JSON.parse(job.inputData || '{}');
    if (inputData.podcastId) {
      await db.updatePodcastStatus(
        inputData.podcastId,
        'FAILED',
        0,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }

    return {
      jobId: job.id,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process a single job based on its type
 */
export async function processJob(job: ProcessingJob): Promise<JobResult> {
  console.log(`[ProcessingWorker] Processing job ${job.id} (type: ${job.jobType})`);

  try {
    switch (job.jobType) {
      case 'fact_extraction':
        return await processFactExtractionJob(job);

      case 'dialogue_generation':
        return await processDialogueGenerationJob(job);

      case 'audio_synthesis':
        // TODO: Implement audio synthesis
        throw new ProcessingWorkerError('Audio synthesis not yet implemented');

      default:
        throw new ProcessingWorkerError(`Unknown job type: ${job.jobType}`);
    }
  } catch (error) {
    console.error(`[ProcessingWorker] Error processing job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Worker loop - polls for pending jobs and processes them
 */
export async function startWorker(options: {
  pollInterval?: number; // Milliseconds between polls (default: 5000)
  batchSize?: number; // Number of jobs to process per batch (default: 1)
  maxRetries?: number; // Max retries per job (default: 3)
} = {}): Promise<void> {
  const pollInterval = options.pollInterval || 5000;
  const batchSize = options.batchSize || 1;

  console.log(`[ProcessingWorker] Starting worker (poll: ${pollInterval}ms, batch: ${batchSize})`);

  let isRunning = true;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('[ProcessingWorker] Received SIGINT, shutting down gracefully...');
    isRunning = false;
  });

  process.on('SIGTERM', () => {
    console.log('[ProcessingWorker] Received SIGTERM, shutting down gracefully...');
    isRunning = false;
  });

  // Main worker loop
  while (isRunning) {
    try {
      // Get pending jobs
      const pendingJobs = await db.getPendingProcessingJobs(batchSize);

      if (pendingJobs.length > 0) {
        console.log(`[ProcessingWorker] Found ${pendingJobs.length} pending jobs`);

        // Process jobs sequentially (could be parallelized for better performance)
        for (const job of pendingJobs) {
          try {
            await processJob(job);
          } catch (error) {
            console.error(`[ProcessingWorker] Failed to process job ${job.id}:`, error);

            // Increment retry count
            await db.updateProcessingJob(job.id, {
              retryCount: job.retryCount + 1,
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      console.error('[ProcessingWorker] Error in worker loop:', error);
      // Wait a bit longer on error
      await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
    }
  }

  console.log('[ProcessingWorker] Worker stopped');
}

// Export functions
export default {
  processJob,
  startWorker,
};
