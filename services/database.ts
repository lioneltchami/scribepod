/**
 * Database Service
 * Centralized database access layer using Prisma Client
 */

import { PrismaClient, Prisma } from '../generated/prisma';
import type {
  Content,
  Fact,
  Podcast,
  Persona,
  PodcastPersona,
  Dialogue,
  AudioSegment,
  ProcessingJob,
} from '../generated/prisma';

// Database error class
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Singleton Prisma Client instance
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma Client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prismaInstance?.$disconnect();
    });
  }

  return prismaInstance;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Health check - test database connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Content Operations
// -----------------------------------------------------------------------------

export interface CreateContentInput {
  title: string;
  sourceType: Prisma.SourceType;
  rawText: string;
  wordCount: number;
  author?: string;
  sourceUrl?: string;
}

export async function createContent(data: CreateContentInput): Promise<Content> {
  try {
    const prisma = getPrismaClient();
    const content = await prisma.content.create({ data });
    console.log(`[Database] Created content: ${content.id}`);
    return content;
  } catch (error) {
    throw new DatabaseError('Failed to create content', error);
  }
}

export async function getContentById(id: string): Promise<Content | null> {
  try {
    const prisma = getPrismaClient();
    return await prisma.content.findUnique({
      where: { id },
      include: {
        facts: true,
        podcasts: true,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get content', error);
  }
}

export async function listContent(limit: number = 50, offset: number = 0): Promise<Content[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.content.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    throw new DatabaseError('Failed to list content', error);
  }
}

export async function deleteContent(id: string): Promise<void> {
  try {
    const prisma = getPrismaClient();
    await prisma.content.delete({ where: { id } });
    console.log(`[Database] Deleted content: ${id}`);
  } catch (error) {
    throw new DatabaseError('Failed to delete content', error);
  }
}

// -----------------------------------------------------------------------------
// Fact Operations
// -----------------------------------------------------------------------------

export interface CreateFactInput {
  contentId: string;
  text: string;
  importance?: number;
  category?: string;
  section?: string;
}

export async function createFact(data: CreateFactInput): Promise<Fact> {
  try {
    const prisma = getPrismaClient();
    return await prisma.fact.create({ data });
  } catch (error) {
    throw new DatabaseError('Failed to create fact', error);
  }
}

export async function createManyFacts(facts: CreateFactInput[]): Promise<number> {
  try {
    const prisma = getPrismaClient();
    const result = await prisma.fact.createMany({ data: facts });
    console.log(`[Database] Created ${result.count} facts`);
    return result.count;
  } catch (error) {
    throw new DatabaseError('Failed to create facts', error);
  }
}

export async function getFactsByContentId(contentId: string): Promise<Fact[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.fact.findMany({
      where: { contentId },
      orderBy: { importance: 'desc' },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get facts', error);
  }
}

// -----------------------------------------------------------------------------
// Podcast Operations
// -----------------------------------------------------------------------------

export interface CreatePodcastInput {
  title: string;
  contentId: string;
  style?: Prisma.ConversationStyle;
  targetLength: number;
  includeIntro?: boolean;
  includeOutro?: boolean;
}

export async function createPodcast(data: CreatePodcastInput): Promise<Podcast> {
  try {
    const prisma = getPrismaClient();
    const podcast = await prisma.podcast.create({ data });
    console.log(`[Database] Created podcast: ${podcast.id}`);
    return podcast;
  } catch (error) {
    throw new DatabaseError('Failed to create podcast', error);
  }
}

export async function getPodcastById(id: string): Promise<Podcast | null> {
  try {
    const prisma = getPrismaClient();
    return await prisma.podcast.findUnique({
      where: { id },
      include: {
        content: true,
        personas: {
          include: {
            persona: true,
          },
        },
        dialogues: {
          orderBy: { turnNumber: 'asc' },
        },
        audioSegments: true,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get podcast', error);
  }
}

export async function updatePodcastStatus(
  id: string,
  status: Prisma.ProcessingStatus,
  progress?: number,
  currentStep?: string,
  errorMessage?: string
): Promise<Podcast> {
  try {
    const prisma = getPrismaClient();
    return await prisma.podcast.update({
      where: { id },
      data: {
        status,
        progress,
        currentStep,
        errorMessage,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to update podcast status', error);
  }
}

export async function listPodcasts(limit: number = 50, offset: number = 0): Promise<Podcast[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.podcast.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        content: true,
        personas: {
          include: {
            persona: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to list podcasts', error);
  }
}

// -----------------------------------------------------------------------------
// Persona Operations
// -----------------------------------------------------------------------------

export interface CreatePersonaInput {
  name: string;
  role: Prisma.PersonaRole;
  bio: string;
  expertise: string[];
  formality?: number;
  enthusiasm?: number;
  humor?: number;
  expertiseLevel?: number;
  interruption?: number;
  sentenceLength?: string;
  vocabulary?: string;
  expressiveness?: string;
  pace?: string;
  voiceProvider?: Prisma.VoiceProvider;
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarity?: number;
}

export async function createPersona(data: CreatePersonaInput): Promise<Persona> {
  try {
    const prisma = getPrismaClient();
    const persona = await prisma.persona.create({ data });
    console.log(`[Database] Created persona: ${persona.name}`);
    return persona;
  } catch (error) {
    throw new DatabaseError('Failed to create persona', error);
  }
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  try {
    const prisma = getPrismaClient();
    return await prisma.persona.findUnique({ where: { id } });
  } catch (error) {
    throw new DatabaseError('Failed to get persona', error);
  }
}

export async function getPersonaByName(name: string): Promise<Persona | null> {
  try {
    const prisma = getPrismaClient();
    return await prisma.persona.findUnique({ where: { name } });
  } catch (error) {
    throw new DatabaseError('Failed to get persona', error);
  }
}

export async function listPersonas(): Promise<Persona[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.persona.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    throw new DatabaseError('Failed to list personas', error);
  }
}

// -----------------------------------------------------------------------------
// PodcastPersona Operations (Many-to-Many)
// -----------------------------------------------------------------------------

export async function addPersonaToPodcast(
  podcastId: string,
  personaId: string
): Promise<PodcastPersona> {
  try {
    const prisma = getPrismaClient();
    return await prisma.podcastPersona.create({
      data: { podcastId, personaId },
    });
  } catch (error) {
    throw new DatabaseError('Failed to add persona to podcast', error);
  }
}

// -----------------------------------------------------------------------------
// Dialogue Operations
// -----------------------------------------------------------------------------

export interface CreateDialogueInput {
  podcastId: string;
  personaId: string;
  turnNumber: number;
  text: string;
  timestamp?: number;
  emotions?: string[];
}

export async function createDialogue(data: CreateDialogueInput): Promise<Dialogue> {
  try {
    const prisma = getPrismaClient();
    return await prisma.dialogue.create({ data });
  } catch (error) {
    throw new DatabaseError('Failed to create dialogue', error);
  }
}

export async function createManyDialogues(dialogues: CreateDialogueInput[]): Promise<number> {
  try {
    const prisma = getPrismaClient();
    const result = await prisma.dialogue.createMany({ data: dialogues });
    console.log(`[Database] Created ${result.count} dialogue turns`);
    return result.count;
  } catch (error) {
    throw new DatabaseError('Failed to create dialogues', error);
  }
}

export async function getDialoguesByPodcastId(podcastId: string): Promise<Dialogue[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.dialogue.findMany({
      where: { podcastId },
      orderBy: { turnNumber: 'asc' },
      include: {
        persona: true,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get dialogues', error);
  }
}

// -----------------------------------------------------------------------------
// AudioSegment Operations
// -----------------------------------------------------------------------------

export interface CreateAudioSegmentInput {
  podcastId: string;
  dialogueId: string;
  personaId: string;
  audioPath?: string;
  duration?: number;
  volume?: number;
  format?: Prisma.AudioFormat;
  bitrate?: number;
}

export async function createAudioSegment(data: CreateAudioSegmentInput): Promise<AudioSegment> {
  try {
    const prisma = getPrismaClient();
    return await prisma.audioSegment.create({ data });
  } catch (error) {
    throw new DatabaseError('Failed to create audio segment', error);
  }
}

export async function getAudioSegmentsByPodcastId(podcastId: string): Promise<AudioSegment[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.audioSegment.findMany({
      where: { podcastId },
      include: {
        dialogue: true,
        persona: true,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get audio segments', error);
  }
}

// -----------------------------------------------------------------------------
// ProcessingJob Operations
// -----------------------------------------------------------------------------

export interface CreateProcessingJobInput {
  jobType: string;
  podcastId?: string;
  inputData?: string;
  maxRetries?: number;
}

export async function createProcessingJob(data: CreateProcessingJobInput): Promise<ProcessingJob> {
  try {
    const prisma = getPrismaClient();
    const job = await prisma.processingJob.create({ data });
    console.log(`[Database] Created processing job: ${job.id} (${job.jobType})`);
    return job;
  } catch (error) {
    throw new DatabaseError('Failed to create processing job', error);
  }
}

export async function updateProcessingJob(
  id: string,
  data: {
    status?: Prisma.ProcessingStatus;
    progress?: number;
    outputData?: string;
    errorMessage?: string;
    retryCount?: number;
  }
): Promise<ProcessingJob> {
  try {
    const prisma = getPrismaClient();
    return await prisma.processingJob.update({
      where: { id },
      data: {
        ...data,
        startedAt: data.status === 'GENERATING' ? new Date() : undefined,
        completedAt: data.status === 'COMPLETED' || data.status === 'FAILED' ? new Date() : undefined,
      },
    });
  } catch (error) {
    throw new DatabaseError('Failed to update processing job', error);
  }
}

export async function getProcessingJobById(id: string): Promise<ProcessingJob | null> {
  try {
    const prisma = getPrismaClient();
    return await prisma.processingJob.findUnique({ where: { id } });
  } catch (error) {
    throw new DatabaseError('Failed to get processing job', error);
  }
}

export async function getPendingProcessingJobs(limit: number = 10): Promise<ProcessingJob[]> {
  try {
    const prisma = getPrismaClient();
    return await prisma.processingJob.findMany({
      where: {
        status: 'PENDING',
        retryCount: {
          lt: prisma.processingJob.fields.maxRetries,
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    throw new DatabaseError('Failed to get pending jobs', error);
  }
}

// -----------------------------------------------------------------------------
// Configuration and Exports
// -----------------------------------------------------------------------------

export const db = {
  // Client management
  getClient: getPrismaClient,
  disconnect: disconnectDatabase,
  healthCheck,

  // Content
  createContent,
  getContentById,
  listContent,
  deleteContent,

  // Facts
  createFact,
  createManyFacts,
  getFactsByContentId,

  // Podcasts
  createPodcast,
  getPodcastById,
  updatePodcastStatus,
  listPodcasts,

  // Personas
  createPersona,
  getPersonaById,
  getPersonaByName,
  listPersonas,
  addPersonaToPodcast,

  // Dialogues
  createDialogue,
  createManyDialogues,
  getDialoguesByPodcastId,

  // Audio
  createAudioSegment,
  getAudioSegmentsByPodcastId,

  // Processing Jobs
  createProcessingJob,
  updateProcessingJob,
  getProcessingJobById,
  getPendingProcessingJobs,
};

export default db;
