/**
 * Complete Podcast Generator
 * End-to-end multi-persona podcast generation with high-quality dialogue
 */

import {
  generateMultiPersonaDialogue,
  generatePodcastIntro,
  generatePodcastOutro,
  personaToProfile,
  type PersonaProfile,
  type DialogueTurn,
} from './dialogueGenerator';

import {
  createContext,
  addTurns,
  markFactsDiscussed,
  getNextFacts,
  updateMood,
  getConversationStats,
  getRecentHistory,
  type ConversationContext,
} from './dialogueContext';

import {
  validateDialogueQuality,
  filterLowQualityTurns,
  exportAsJSON,
  exportAsText,
  exportAsSRT,
  exportAsMarkdown,
  type QualityReport,
} from './dialogueQuality';

import { db } from './database';
import type { Persona, Podcast } from '../generated/prisma';

export class PodcastGeneratorError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'PodcastGeneratorError';
  }
}

export interface PodcastGenerationOptions {
  // Content
  contentId: string;
  facts: string[];
  title: string;

  // Personas
  personas: Persona[]; // Must include 1 host + 1-4 guests

  // Style
  style?: 'conversational' | 'interview' | 'debate' | 'educational';
  targetDurationMinutes?: number; // Target podcast length

  // Quality
  minQualityScore?: number; // Minimum quality score (0-100)
  maxRetries?: number; // Max retries if quality is low

  // Structure
  includeIntro?: boolean;
  includeOutro?: boolean;
  factsPerSegment?: number; // Facts to discuss per segment
}

export interface GeneratedPodcast {
  podcastId: string;
  intro?: string;
  dialogueTurns: DialogueTurn[];
  outro?: string;
  context: ConversationContext;
  qualityReport: QualityReport;
  stats: {
    totalTurns: number;
    totalWords: number;
    estimatedDurationMinutes: number;
    factsCovered: number;
    factsTotal: number;
  };
}

/**
 * Generate complete multi-persona podcast
 */
export async function generateCompletePodcast(
  options: PodcastGenerationOptions
): Promise<GeneratedPodcast> {
  try {
    console.log(`[PodcastGenerator] Starting podcast generation: ${options.title}`);

    // Validate inputs
    validateOptions(options);

    const {
      contentId,
      facts,
      title,
      personas,
      style = 'conversational',
      targetDurationMinutes = 30,
      minQualityScore = 70,
      maxRetries = 2,
      includeIntro = true,
      includeOutro = true,
      factsPerSegment = 7,
    } = options;

    // Convert Prisma personas to profiles
    const personaProfiles: PersonaProfile[] = personas.map(personaToProfile);

    // Validate personas
    const host = personaProfiles.find(p => p.role === 'host');
    if (!host) {
      throw new PodcastGeneratorError('At least one host persona required');
    }

    const guests = personaProfiles.filter(p => p.role === 'guest');
    if (guests.length === 0) {
      throw new PodcastGeneratorError('At least one guest persona required');
    }

    console.log(`[PodcastGenerator] Host: ${host.name}, Guests: ${guests.map(g => g.name).join(', ')}`);

    // Calculate segments
    const totalSegments = Math.ceil(facts.length / factsPerSegment);
    console.log(`[PodcastGenerator] Generating ${totalSegments} segments with ~${factsPerSegment} facts each`);

    // Create conversation context
    const context = createContext(
      contentId,
      title,
      personaProfiles,
      facts,
      totalSegments
    );

    let allDialogueTurns: DialogueTurn[] = [];
    let intro: string | undefined;
    let outro: string | undefined;

    // Generate intro
    if (includeIntro) {
      console.log('[PodcastGenerator] Generating intro...');
      intro = await generatePodcastIntro(
        host,
        guests,
        title,
        `A discussion about ${title} covering ${facts.length} key points`
      );

      // Add intro as special turn
      allDialogueTurns.push({
        speaker: host.name,
        speakerId: host.id,
        text: intro,
        turnNumber: 0,
        type: 'statement',
      });

      addTurns(context, [allDialogueTurns[0]]);
    }

    // Generate dialogue segments
    for (let segment = 0; segment < totalSegments; segment++) {
      context.currentSegment = segment;
      updateMood(context);

      console.log(`[PodcastGenerator] Generating segment ${segment + 1}/${totalSegments} (mood: ${context.currentMood})`);

      // Get facts for this segment
      const segmentFacts = getNextFacts(context, factsPerSegment);

      if (segmentFacts.length === 0) {
        console.log('[PodcastGenerator] No more facts to discuss');
        break;
      }

      // Calculate target turns for this segment
      const wordsPerMinute = 150;
      const targetWords = (targetDurationMinutes / totalSegments) * wordsPerMinute;
      const wordsPerTurn = 40; // Average
      const targetTurns = Math.round(targetWords / wordsPerTurn);

      // Generate dialogue with retry on low quality
      let segmentDialogue: DialogueTurn[] = [];
      let attempts = 0;
      let quality: QualityReport | null = null;

      while (attempts < maxRetries) {
        attempts++;

        console.log(`[PodcastGenerator] Attempt ${attempts}/${maxRetries} for segment ${segment + 1}`);

        // Generate dialogue
        const isFirst = segment === 0 && !includeIntro;
        const isLast = segment === totalSegments - 1 && includeOutro;

        const recentHistory = getRecentHistory(context);

        segmentDialogue = await generateMultiPersonaDialogue(
          personaProfiles,
          segmentFacts,
          {
            previousTurns: recentHistory,
            currentFacts: segmentFacts,
            discussedFacts: context.discussedFacts,
            conversationGoal: context.conversationGoal,
          },
          {
            title,
            style,
            isFirst,
            isLast: false, // Don't close until outro
            targetTurns: Math.max(10, targetTurns),
          }
        );

        // Filter low-quality turns
        segmentDialogue = filterLowQualityTurns(segmentDialogue);

        // Validate quality
        quality = validateDialogueQuality(segmentDialogue, personaProfiles, minQualityScore);

        console.log(`[PodcastGenerator] Segment quality score: ${quality.score}/100`);

        if (quality.passed) {
          break;
        }

        if (attempts < maxRetries) {
          console.log(`[PodcastGenerator] Quality too low (${quality.score}/100), retrying...`);
          console.log(`[PodcastGenerator] Issues: ${quality.issues.map(i => i.message).join(', ')}`);
        }
      }

      if (!quality || !quality.passed) {
        console.warn(`[PodcastGenerator] Segment ${segment + 1} quality below threshold after ${maxRetries} attempts`);
        // Continue anyway but log warning
      }

      // Add turns to context and collection
      const baselineNumber = allDialogueTurns.length;
      segmentDialogue.forEach((turn, index) => {
        turn.turnNumber = baselineNumber + index;
      });

      allDialogueTurns.push(...segmentDialogue);
      addTurns(context, segmentDialogue);
      markFactsDiscussed(context, segmentFacts);

      console.log(`[PodcastGenerator] Segment ${segment + 1} complete: ${segmentDialogue.length} turns`);
    }

    // Generate outro
    if (includeOutro) {
      console.log('[PodcastGenerator] Generating outro...');

      const stats = getConversationStats(context);
      const keyTakeaways = facts.slice(0, 3); // Top 3 facts as takeaways

      outro = await generatePodcastOutro(host, keyTakeaways);

      // Add outro as special turn
      allDialogueTurns.push({
        speaker: host.name,
        speakerId: host.id,
        text: outro,
        turnNumber: allDialogueTurns.length,
        type: 'statement',
      });

      addTurns(context, [allDialogueTurns[allDialogueTurns.length - 1]]);
    }

    // Final quality validation
    console.log('[PodcastGenerator] Validating final podcast quality...');
    const finalQuality = validateDialogueQuality(allDialogueTurns, personaProfiles, minQualityScore);

    console.log(`[PodcastGenerator] Final quality score: ${finalQuality.score}/100`);
    console.log(`[PodcastGenerator] Strengths: ${finalQuality.strengths.join(', ')}`);

    if (finalQuality.issues.length > 0) {
      console.log(`[PodcastGenerator] Issues found: ${finalQuality.issues.length}`);
      finalQuality.issues.forEach(issue => {
        console.log(`  - [${issue.severity}] ${issue.message}`);
      });
    }

    // Get final stats
    const finalStats = getConversationStats(context);

    console.log(`[PodcastGenerator] ✓ Podcast generation complete!`);
    console.log(`[PodcastGenerator]   - Total turns: ${allDialogueTurns.length}`);
    console.log(`[PodcastGenerator]   - Total words: ${finalStats.totalWords}`);
    console.log(`[PodcastGenerator]   - Estimated duration: ${finalStats.estimatedDurationMinutes} minutes`);
    console.log(`[PodcastGenerator]   - Facts covered: ${context.discussedFacts.length}/${context.allFacts.length}`);

    return {
      podcastId: contentId,
      intro,
      dialogueTurns: allDialogueTurns,
      outro,
      context,
      qualityReport: finalQuality,
      stats: {
        totalTurns: allDialogueTurns.length,
        totalWords: finalStats.totalWords,
        estimatedDurationMinutes: finalStats.estimatedDurationMinutes,
        factsCovered: context.discussedFacts.length,
        factsTotal: context.allFacts.length,
      },
    };

  } catch (error) {
    throw new PodcastGeneratorError('Failed to generate podcast', error);
  }
}

/**
 * Validate generation options
 */
function validateOptions(options: PodcastGenerationOptions): void {
  if (!options.contentId) {
    throw new PodcastGeneratorError('contentId is required');
  }

  if (!options.facts || options.facts.length === 0) {
    throw new PodcastGeneratorError('At least one fact is required');
  }

  if (!options.title || options.title.trim().length === 0) {
    throw new PodcastGeneratorError('title is required');
  }

  if (!options.personas || options.personas.length < 2) {
    throw new PodcastGeneratorError('At least 2 personas required (1 host + 1 guest)');
  }

  const hostCount = options.personas.filter(p => p.role === 'HOST').length;
  const guestCount = options.personas.filter(p => p.role === 'GUEST').length;

  if (hostCount === 0) {
    throw new PodcastGeneratorError('At least 1 host persona required');
  }

  if (guestCount === 0) {
    throw new PodcastGeneratorError('At least 1 guest persona required');
  }

  if (options.personas.length > 5) {
    throw new PodcastGeneratorError('Maximum 5 personas supported (too many speakers reduces quality)');
  }
}

/**
 * Save generated podcast to database
 */
export async function savePodcastToDatabase(
  podcastId: string,
  generatedPodcast: GeneratedPodcast
): Promise<void> {
  try {
    console.log(`[PodcastGenerator] Saving podcast to database: ${podcastId}`);

    // Store dialogues
    const dialogues = generatedPodcast.dialogueTurns.map(turn => ({
      podcastId,
      personaId: turn.speakerId,
      turnNumber: turn.turnNumber,
      text: turn.text,
      emotions: turn.emotions,
    }));

    const count = await db.createManyDialogues(dialogues);

    // Update podcast status
    await db.updatePodcastStatus(
      podcastId,
      'COMPLETED',
      100,
      'Podcast generation complete',
      undefined
    );

    console.log(`[PodcastGenerator] ✓ Saved ${count} dialogue turns to database`);

  } catch (error) {
    throw new PodcastGeneratorError('Failed to save podcast to database', error);
  }
}

/**
 * Export generated podcast in multiple formats
 */
export async function exportPodcast(
  generatedPodcast: GeneratedPodcast,
  outputDir: string,
  formats: Array<'json' | 'text' | 'srt' | 'markdown'> = ['json', 'text']
): Promise<string[]> {
  try {
    const filePaths: string[] = [];

    for (const format of formats) {
      let content: string;
      const extension = format;
      const filePath = `${outputDir}/podcast-${generatedPodcast.podcastId}.${extension}`;

      switch (format) {
        case 'json':
          content = exportAsJSON(
            generatedPodcast.dialogueTurns,
            generatedPodcast.context.personas,
            {
              podcastId: generatedPodcast.podcastId,
              title: generatedPodcast.context.title,
              generatedAt: new Date(),
            }
          );
          break;

        case 'text':
          content = exportAsText(generatedPodcast.dialogueTurns, true);
          break;

        case 'srt':
          content = exportAsSRT(generatedPodcast.dialogueTurns);
          break;

        case 'markdown':
          content = exportAsMarkdown(
            generatedPodcast.dialogueTurns,
            generatedPodcast.context.title
          );
          break;
      }

      const fs = await import('fs');
      fs.writeFileSync(filePath, content, 'utf8');
      filePaths.push(filePath);

      console.log(`[PodcastGenerator] Exported ${format.toUpperCase()}: ${filePath}`);
    }

    return filePaths;

  } catch (error) {
    throw new PodcastGeneratorError('Failed to export podcast', error);
  }
}

// Export all functions
export default {
  generateCompletePodcast,
  savePodcastToDatabase,
  exportPodcast,
};
