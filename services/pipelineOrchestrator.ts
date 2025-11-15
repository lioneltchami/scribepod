/**
 * Pipeline Orchestrator
 * Coordinates the end-to-end podcast generation pipeline:
 * Content Ingestion → Fact Extraction → Dialogue Generation → Audio Synthesis
 */

import { ingestFile, ingestString, ingestURL, type IngestionOptions } from './contentIngestion';
import { db, type CreatePodcastInput } from './database';
import type { Content, Podcast, ProcessingJob } from '../generated/prisma';
import { Prisma } from '../generated/prisma';

export class PipelineError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'PipelineError';
  }
}

export interface PipelineOptions extends IngestionOptions {
  // Podcast configuration
  podcastTitle?: string;
  podcastStyle?: 'CONVERSATIONAL' | 'INTERVIEW' | 'DEBATE' | 'STORYTELLING' | 'EDUCATIONAL';
  targetLength?: number; // minutes
  includeIntro?: boolean;
  includeOutro?: boolean;

  // Personas (required)
  personaIds: string[]; // Must include at least 2 personas

  // Processing options
  autoStartProcessing?: boolean; // Automatically start fact extraction (default: true)
  waitForCompletion?: boolean; // Wait for pipeline to complete (default: false)
}

export interface PipelineResult {
  content: Content;
  podcast: Podcast;
  jobs: {
    factExtraction?: ProcessingJob;
    dialogueGeneration?: ProcessingJob;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Start the podcast generation pipeline from a file
 */
export async function generatePodcastFromFile(
  filePath: string,
  options: PipelineOptions
): Promise<PipelineResult> {
  try {
    console.log(`[Pipeline] Starting podcast generation from file: ${filePath}`);

    // Validate options
    if (!options.personaIds || options.personaIds.length < 2) {
      throw new PipelineError('At least 2 personas required for podcast generation');
    }

    // Step 1: Ingest content
    console.log('[Pipeline] Step 1/4: Ingesting content...');
    const ingestion = await ingestFile(filePath, options);
    const content = ingestion.content;

    console.log(`[Pipeline] ✓ Content ingested: ${content.id}`);

    // Step 2: Create podcast record
    console.log('[Pipeline] Step 2/4: Creating podcast record...');
    const podcastData: CreatePodcastInput = {
      title: options.podcastTitle || `Podcast: ${content.title}`,
      contentId: content.id,
      style: options.podcastStyle || 'CONVERSATIONAL',
      targetLength: options.targetLength || 30,
      includeIntro: options.includeIntro !== false,
      includeOutro: options.includeOutro !== false,
    };

    const podcast = await db.createPodcast(podcastData);
    console.log(`[Pipeline] ✓ Podcast created: ${podcast.id}`);

    // Step 3: Associate personas with podcast
    console.log('[Pipeline] Step 3/4: Associating personas...');
    for (const personaId of options.personaIds) {
      await db.addPersonaToPodcast(podcast.id, personaId);
    }
    console.log(`[Pipeline] ✓ ${options.personaIds.length} personas associated`);

    // Step 4: Create and start processing jobs
    console.log('[Pipeline] Step 4/4: Creating processing jobs...');

    const jobs: PipelineResult['jobs'] = {};

    // Create fact extraction job
    const factExtractionJob = await db.createProcessingJob({
      jobType: 'fact_extraction',
      podcastId: podcast.id,
      inputData: JSON.stringify({ contentId: content.id }),
    });

    jobs.factExtraction = factExtractionJob;
    console.log(`[Pipeline] ✓ Fact extraction job created: ${factExtractionJob.id}`);

    // Create dialogue generation job (will wait for facts)
    const dialogueGenerationJob = await db.createProcessingJob({
      jobType: 'dialogue_generation',
      podcastId: podcast.id,
      inputData: JSON.stringify({ podcastId: podcast.id }),
    });

    jobs.dialogueGeneration = dialogueGenerationJob;
    console.log(`[Pipeline] ✓ Dialogue generation job created: ${dialogueGenerationJob.id}`);

    // Wait for completion if requested
    if (options.waitForCompletion) {
      console.log('[Pipeline] Waiting for pipeline completion...');
      return await waitForPipelineCompletion(podcast.id, jobs);
    }

    console.log('[Pipeline] ✓ Pipeline started successfully');

    return {
      content,
      podcast,
      jobs,
      status: 'pending',
    };

  } catch (error) {
    throw new PipelineError('Failed to generate podcast from file', error);
  }
}

/**
 * Start the podcast generation pipeline from a string
 */
export async function generatePodcastFromString(
  text: string,
  title: string,
  sourceType: 'TEXT' | 'HTML' | 'MARKDOWN',
  options: PipelineOptions
): Promise<PipelineResult> {
  try {
    console.log(`[Pipeline] Starting podcast generation from string: ${title}`);

    // Validate options
    if (!options.personaIds || options.personaIds.length < 2) {
      throw new PipelineError('At least 2 personas required for podcast generation');
    }

    // Step 1: Ingest content
    console.log('[Pipeline] Step 1/4: Ingesting content...');
    const ingestion = await ingestString(text, sourceType, title, options);
    const content = ingestion.content;

    console.log(`[Pipeline] ✓ Content ingested: ${content.id}`);

    // Step 2: Create podcast record
    console.log('[Pipeline] Step 2/4: Creating podcast record...');
    const podcastData: CreatePodcastInput = {
      title: options.podcastTitle || `Podcast: ${content.title}`,
      contentId: content.id,
      style: options.podcastStyle || 'CONVERSATIONAL',
      targetLength: options.targetLength || 30,
      includeIntro: options.includeIntro !== false,
      includeOutro: options.includeOutro !== false,
    };

    const podcast = await db.createPodcast(podcastData);
    console.log(`[Pipeline] ✓ Podcast created: ${podcast.id}`);

    // Step 3: Associate personas with podcast
    console.log('[Pipeline] Step 3/4: Associating personas...');
    for (const personaId of options.personaIds) {
      await db.addPersonaToPodcast(podcast.id, personaId);
    }
    console.log(`[Pipeline] ✓ ${options.personaIds.length} personas associated`);

    // Step 4: Create processing jobs
    console.log('[Pipeline] Step 4/4: Creating processing jobs...');

    const jobs: PipelineResult['jobs'] = {};

    // Create fact extraction job
    const factExtractionJob = await db.createProcessingJob({
      jobType: 'fact_extraction',
      podcastId: podcast.id,
      inputData: JSON.stringify({ contentId: content.id }),
    });

    jobs.factExtraction = factExtractionJob;
    console.log(`[Pipeline] ✓ Fact extraction job created: ${factExtractionJob.id}`);

    // Create dialogue generation job
    const dialogueGenerationJob = await db.createProcessingJob({
      jobType: 'dialogue_generation',
      podcastId: podcast.id,
      inputData: JSON.stringify({ podcastId: podcast.id }),
    });

    jobs.dialogueGeneration = dialogueGenerationJob;
    console.log(`[Pipeline] ✓ Dialogue generation job created: ${dialogueGenerationJob.id}`);

    // Wait for completion if requested
    if (options.waitForCompletion) {
      console.log('[Pipeline] Waiting for pipeline completion...');
      return await waitForPipelineCompletion(podcast.id, jobs);
    }

    console.log('[Pipeline] ✓ Pipeline started successfully');

    return {
      content,
      podcast,
      jobs,
      status: 'pending',
    };

  } catch (error) {
    throw new PipelineError('Failed to generate podcast from string', error);
  }
}

/**
 * Start the podcast generation pipeline from a URL
 */
export async function generatePodcastFromURL(
  url: string,
  options: PipelineOptions
): Promise<PipelineResult> {
  try {
    console.log(`[Pipeline] Starting podcast generation from URL: ${url}`);

    // Validate options
    if (!options.personaIds || options.personaIds.length < 2) {
      throw new PipelineError('At least 2 personas required for podcast generation');
    }

    // Step 1: Ingest content
    console.log('[Pipeline] Step 1/4: Ingesting content from URL...');
    const ingestion = await ingestURL(url, options);
    const content = ingestion.content;

    console.log(`[Pipeline] ✓ Content ingested: ${content.id}`);

    // Rest is same as file/string - create podcast and jobs
    const podcastData: CreatePodcastInput = {
      title: options.podcastTitle || `Podcast: ${content.title}`,
      contentId: content.id,
      style: options.podcastStyle || 'CONVERSATIONAL',
      targetLength: options.targetLength || 30,
      includeIntro: options.includeIntro !== false,
      includeOutro: options.includeOutro !== false,
    };

    const podcast = await db.createPodcast(podcastData);

    for (const personaId of options.personaIds) {
      await db.addPersonaToPodcast(podcast.id, personaId);
    }

    const jobs: PipelineResult['jobs'] = {};

    const factExtractionJob = await db.createProcessingJob({
      jobType: 'fact_extraction',
      podcastId: podcast.id,
      inputData: JSON.stringify({ contentId: content.id }),
    });

    jobs.factExtraction = factExtractionJob;

    const dialogueGenerationJob = await db.createProcessingJob({
      jobType: 'dialogue_generation',
      podcastId: podcast.id,
      inputData: JSON.stringify({ podcastId: podcast.id }),
    });

    jobs.dialogueGeneration = dialogueGenerationJob;

    if (options.waitForCompletion) {
      return await waitForPipelineCompletion(podcast.id, jobs);
    }

    return {
      content,
      podcast,
      jobs,
      status: 'pending',
    };

  } catch (error) {
    throw new PipelineError('Failed to generate podcast from URL', error);
  }
}

/**
 * Wait for pipeline to complete (polls job status)
 */
async function waitForPipelineCompletion(
  podcastId: string,
  jobs: PipelineResult['jobs'],
  timeout: number = 600000 // 10 minutes default
): Promise<PipelineResult> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < timeout) {
    // Get latest podcast status
    const podcast = await db.getPodcastById(podcastId);
    if (!podcast) {
      throw new PipelineError('Podcast not found');
    }

    // Check if completed or failed
    if (podcast.status === 'COMPLETED') {
      console.log('[Pipeline] ✓ Pipeline completed successfully');
      return {
        content: podcast.content,
        podcast,
        jobs,
        status: 'completed',
      };
    }

    if (podcast.status === 'FAILED') {
      console.log('[Pipeline] ✗ Pipeline failed');
      return {
        content: podcast.content,
        podcast,
        jobs,
        status: 'failed',
      };
    }

    // Still processing
    console.log(`[Pipeline] Processing... Status: ${podcast.status}, Progress: ${podcast.progress}%`);

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  // Timeout
  throw new PipelineError('Pipeline completion timeout');
}

/**
 * Get pipeline status
 */
export async function getPipelineStatus(podcastId: string): Promise<{
  podcast: Podcast;
  progress: number;
  currentStep: string;
  jobs: ProcessingJob[];
}> {
  try {
    const podcast = await db.getPodcastById(podcastId);
    if (!podcast) {
      throw new PipelineError('Podcast not found');
    }

    // Get all jobs for this podcast (would need a method in database service)
    // For now, return basic status
    return {
      podcast,
      progress: podcast.progress,
      currentStep: podcast.currentStep || 'Unknown',
      jobs: [], // TODO: Query jobs by podcastId
    };

  } catch (error) {
    throw new PipelineError('Failed to get pipeline status', error);
  }
}

/**
 * Cancel a running pipeline
 */
export async function cancelPipeline(podcastId: string): Promise<void> {
  try {
    console.log(`[Pipeline] Canceling pipeline for podcast: ${podcastId}`);

    // Update podcast status to failed
    await db.updatePodcastStatus(podcastId, 'FAILED', 0, undefined, 'Canceled by user');

    // TODO: Cancel or mark jobs as failed

    console.log('[Pipeline] ✓ Pipeline canceled');

  } catch (error) {
    throw new PipelineError('Failed to cancel pipeline', error);
  }
}

/**
 * Retry a failed pipeline
 */
export async function retryPipeline(podcastId: string): Promise<PipelineResult> {
  try {
    console.log(`[Pipeline] Retrying pipeline for podcast: ${podcastId}`);

    const podcast = await db.getPodcastById(podcastId);
    if (!podcast) {
      throw new PipelineError('Podcast not found');
    }

    // Reset podcast status
    await db.updatePodcastStatus(podcastId, 'PENDING', 0, 'Retrying pipeline');

    // Create new processing jobs
    const jobs: PipelineResult['jobs'] = {};

    const factExtractionJob = await db.createProcessingJob({
      jobType: 'fact_extraction',
      podcastId: podcast.id,
      inputData: JSON.stringify({ contentId: podcast.contentId }),
    });

    jobs.factExtraction = factExtractionJob;

    const dialogueGenerationJob = await db.createProcessingJob({
      jobType: 'dialogue_generation',
      podcastId: podcast.id,
      inputData: JSON.stringify({ podcastId: podcast.id }),
    });

    jobs.dialogueGeneration = dialogueGenerationJob;

    console.log('[Pipeline] ✓ Pipeline retry initiated');

    return {
      content: podcast.content,
      podcast,
      jobs,
      status: 'pending',
    };

  } catch (error) {
    throw new PipelineError('Failed to retry pipeline', error);
  }
}

// Export all functions
export default {
  generatePodcastFromFile,
  generatePodcastFromString,
  generatePodcastFromURL,
  getPipelineStatus,
  cancelPipeline,
  retryPipeline,
};
