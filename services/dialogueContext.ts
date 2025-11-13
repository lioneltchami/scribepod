/**
 * Dialogue Context Manager
 * Manages conversation continuity, topic tracking, and speaker balance
 */

import type { DialogueTurn, PersonaProfile } from './dialogueGenerator';

export class DialogueContextError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DialogueContextError';
  }
}

export interface ConversationContext {
  podcastId: string;
  title: string;
  personas: PersonaProfile[];

  // Dialogue tracking
  allTurns: DialogueTurn[];
  currentSegment: number;
  totalSegments: number;

  // Topic tracking
  allFacts: string[];
  discussedFacts: string[];
  remainingFacts: string[];
  currentTopics: string[];

  // Speaker balancing
  speakerStats: Map<string, {
    turnCount: number;
    wordCount: number;
    questionCount: number;
    lastTurnNumber: number;
  }>;

  // Flow control
  conversationGoal: string;
  currentMood: 'intro' | 'building' | 'peak' | 'winding-down' | 'outro';
}

/**
 * Create initial conversation context
 */
export function createContext(
  podcastId: string,
  title: string,
  personas: PersonaProfile[],
  allFacts: string[],
  totalSegments: number = 1
): ConversationContext {
  const speakerStats = new Map();

  personas.forEach(persona => {
    speakerStats.set(persona.id, {
      turnCount: 0,
      wordCount: 0,
      questionCount: 0,
      lastTurnNumber: -1,
    });
  });

  return {
    podcastId,
    title,
    personas,
    allTurns: [],
    currentSegment: 0,
    totalSegments,
    allFacts,
    discussedFacts: [],
    remainingFacts: [...allFacts],
    currentTopics: [],
    speakerStats,
    conversationGoal: `Create an engaging podcast discussion about ${title}`,
    currentMood: 'intro',
  };
}

/**
 * Add dialogue turns to context
 */
export function addTurns(context: ConversationContext, turns: DialogueTurn[]): void {
  for (const turn of turns) {
    context.allTurns.push(turn);

    // Update speaker stats
    const stats = context.speakerStats.get(turn.speakerId);
    if (stats) {
      stats.turnCount++;
      stats.wordCount += turn.text.split(/\s+/).length;
      stats.lastTurnNumber = turn.turnNumber;

      if (turn.type === 'question' || turn.text.includes('?')) {
        stats.questionCount++;
      }
    }
  }
}

/**
 * Mark facts as discussed
 */
export function markFactsDiscussed(context: ConversationContext, facts: string[]): void {
  facts.forEach(fact => {
    if (!context.discussedFacts.includes(fact)) {
      context.discussedFacts.push(fact);
      const index = context.remainingFacts.indexOf(fact);
      if (index > -1) {
        context.remainingFacts.splice(index, 1);
      }
    }
  });
}

/**
 * Get next facts to discuss
 */
export function getNextFacts(
  context: ConversationContext,
  count: number
): string[] {
  return context.remainingFacts.slice(0, count);
}

/**
 * Get speaker balance analysis
 */
export interface SpeakerBalance {
  balanced: boolean;
  speakerBreakdown: Array<{
    name: string;
    turnPercentage: number;
    wordPercentage: number;
    turnCount: number;
    wordCount: number;
    questionCount: number;
    shouldSpeakMore: boolean;
    shouldSpeakLess: boolean;
  }>;
  recommendations: string[];
}

export function analyzeSpeakerBalance(context: ConversationContext): SpeakerBalance {
  const totalTurns = context.allTurns.length;
  const totalWords = context.allTurns.reduce((sum, turn) =>
    sum + turn.text.split(/\s+/).length, 0
  );

  const breakdown = context.personas.map(persona => {
    const stats = context.speakerStats.get(persona.id)!;
    const turnPercentage = (stats.turnCount / totalTurns) * 100;
    const wordPercentage = (stats.wordCount / totalWords) * 100;

    // Ideal distribution depends on role
    const idealTurnPercentage = persona.role === 'host' ? 30 : 70 / (context.personas.length - 1);
    const idealWordPercentage = persona.role === 'host' ? 35 : 65 / (context.personas.length - 1);

    return {
      name: persona.name,
      turnPercentage: Math.round(turnPercentage * 10) / 10,
      wordPercentage: Math.round(wordPercentage * 10) / 10,
      turnCount: stats.turnCount,
      wordCount: stats.wordCount,
      questionCount: stats.questionCount,
      shouldSpeakMore: turnPercentage < idealTurnPercentage * 0.7,
      shouldSpeakLess: turnPercentage > idealTurnPercentage * 1.3,
    };
  });

  // Check if balanced
  const balanced = !breakdown.some(b => b.shouldSpeakMore || b.shouldSpeakLess);

  // Generate recommendations
  const recommendations: string[] = [];
  breakdown.forEach(b => {
    if (b.shouldSpeakMore) {
      recommendations.push(`${b.name} should participate more (currently ${b.turnPercentage}% of turns)`);
    }
    if (b.shouldSpeakLess) {
      recommendations.push(`${b.name} should give others more space (currently ${b.turnPercentage}% of turns)`);
    }
  });

  return {
    balanced,
    speakerBreakdown: breakdown,
    recommendations,
  };
}

/**
 * Get recent conversation history for context
 */
export function getRecentHistory(
  context: ConversationContext,
  turnCount: number = 6
): DialogueTurn[] {
  return context.allTurns.slice(-turnCount);
}

/**
 * Update conversation mood based on progress
 */
export function updateMood(context: ConversationContext): void {
  const progress = context.currentSegment / context.totalSegments;

  if (progress === 0) {
    context.currentMood = 'intro';
  } else if (progress < 0.25) {
    context.currentMood = 'building';
  } else if (progress < 0.75) {
    context.currentMood = 'peak';
  } else if (progress < 1.0) {
    context.currentMood = 'winding-down';
  } else {
    context.currentMood = 'outro';
  }
}

/**
 * Get conversation statistics
 */
export interface ConversationStats {
  totalTurns: number;
  totalWords: number;
  averageWordsPerTurn: number;
  totalQuestions: number;
  discussedFactPercentage: number;
  estimatedDurationMinutes: number;
  speakerBalance: SpeakerBalance;
}

export function getConversationStats(context: ConversationContext): ConversationStats {
  const totalTurns = context.allTurns.length;
  const totalWords = context.allTurns.reduce((sum, turn) =>
    sum + turn.text.split(/\s+/).length, 0
  );
  const totalQuestions = context.allTurns.filter(t =>
    t.type === 'question' || t.text.includes('?')
  ).length;

  // Estimate duration: ~150 words per minute of speech
  const estimatedDurationMinutes = Math.round(totalWords / 150);

  const discussedFactPercentage = context.allFacts.length > 0
    ? Math.round((context.discussedFacts.length / context.allFacts.length) * 100)
    : 0;

  return {
    totalTurns,
    totalWords,
    averageWordsPerTurn: totalTurns > 0 ? Math.round(totalWords / totalTurns) : 0,
    totalQuestions,
    discussedFactPercentage,
    estimatedDurationMinutes,
    speakerBalance: analyzeSpeakerBalance(context),
  };
}

/**
 * Get personas who should speak next (for balanced conversation)
 */
export function getNextSpeakers(
  context: ConversationContext,
  count: number = 2
): PersonaProfile[] {
  // Sort personas by how long since they last spoke
  const sortedPersonas = [...context.personas].sort((a, b) => {
    const statsA = context.speakerStats.get(a.id)!;
    const statsB = context.speakerStats.get(b.id)!;

    // Prioritize those who spoke less recently
    return statsA.lastTurnNumber - statsB.lastTurnNumber;
  });

  return sortedPersonas.slice(0, count);
}

/**
 * Extract topics from recent dialogue
 */
export function extractCurrentTopics(context: ConversationContext): string[] {
  const recentTurns = getRecentHistory(context, 10);
  const topics = new Set<string>();

  // Simple keyword extraction (can be enhanced with NLP)
  const keywords = ['about', 'discussing', 'talking about', 'topic', 'subject'];

  recentTurns.forEach(turn => {
    const lowerText = turn.text.toLowerCase();
    keywords.forEach(keyword => {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        // Extract following words
        const following = lowerText.substring(index + keyword.length, index + keyword.length + 50);
        const words = following.split(/\s+/).slice(0, 3).join(' ');
        if (words.trim()) {
          topics.add(words.trim());
        }
      }
    });
  });

  return Array.from(topics).slice(0, 3);
}

/**
 * Check if conversation needs rebalancing
 */
export function needsRebalancing(context: ConversationContext): {
  needed: boolean;
  reason?: string;
} {
  const balance = analyzeSpeakerBalance(context);

  if (!balance.balanced) {
    return {
      needed: true,
      reason: balance.recommendations[0],
    };
  }

  // Check if same person spoke 3+ times in a row
  const recentTurns = getRecentHistory(context, 5);
  if (recentTurns.length >= 3) {
    const lastThree = recentTurns.slice(-3);
    if (lastThree.every(t => t.speakerId === lastThree[0].speakerId)) {
      return {
        needed: true,
        reason: `${lastThree[0].speaker} has dominated recent conversation`,
      };
    }
  }

  return { needed: false };
}

// Export all functions
export default {
  createContext,
  addTurns,
  markFactsDiscussed,
  getNextFacts,
  analyzeSpeakerBalance,
  getRecentHistory,
  updateMood,
  getConversationStats,
  getNextSpeakers,
  extractCurrentTopics,
  needsRebalancing,
};
