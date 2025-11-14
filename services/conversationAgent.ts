/**
 * Real-Time Conversation Agent
 * Enables real-time chat with podcast personas
 * SECONDARY FEATURE: Users can ask questions and get in-character responses
 */

import { generateCompletion, generateStreamingCompletion } from './openai';
import type { Persona, ChatMessage } from '../shared/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Conversation message with role and content
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  personaId?: string;
  personaName?: string;
  tokenCount?: number;
}

/**
 * Persona profile for conversation
 */
export interface ConversationPersona {
  id: string;
  name: string;
  role: string;
  background: string;
  personality: {
    formality: number;
    enthusiasm: number;
    humor: number;
    expertise: number;
  };
  speakingStyle: {
    sentenceLength: 'short' | 'medium' | 'long';
    vocabulary: 'simple' | 'academic' | 'technical';
  };
}

/**
 * Conversation context - includes podcast content and history
 */
export interface ConversationContext {
  sessionId: string;
  podcastId?: string;
  contentId?: string;
  podcastTitle?: string;
  contentSummary?: string;
  facts?: string[];
  personas: ConversationPersona[];
  currentPersonaId: string;
  messages: ConversationMessage[];
  startedAt: Date;
  lastActivityAt: Date;
  totalTokens: number;
}

/**
 * Options for generating responses
 */
export interface ResponseGenerationOptions {
  personaId?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  includeContext?: boolean;
}

/**
 * Response from conversation agent
 */
export interface ConversationResponse {
  messageId: string;
  content: string;
  personaId: string;
  personaName: string;
  timestamp: Date;
  tokenCount: number;
}

/**
 * Streaming response chunk
 */
export interface StreamingChunk {
  type: 'start' | 'token' | 'end' | 'error';
  content?: string;
  personaName?: string;
  error?: string;
  tokenCount?: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ConversationAgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationAgentError';
  }
}

export class ConversationContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationContextError';
  }
}

export class PersonaNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersonaNotFoundError';
  }
}

// ============================================================================
// Persona Conversion
// ============================================================================

/**
 * Convert Prisma Persona to ConversationPersona
 */
export function personaToConversationProfile(persona: Persona): ConversationPersona {
  return {
    id: persona.id,
    name: persona.name,
    role: persona.role,
    background: persona.bio || 'Podcast participant',
    personality: {
      formality: persona.formality,
      enthusiasm: persona.enthusiasm,
      humor: persona.humor,
      expertise: persona.expertiseLevel,
    },
    speakingStyle: {
      sentenceLength: persona.sentenceLength as 'short' | 'medium' | 'long',
      vocabulary: persona.vocabulary as 'simple' | 'academic' | 'technical',
    },
  };
}

// ============================================================================
// System Prompt Generation
// ============================================================================

/**
 * Generate personality-aware system prompt for conversation
 */
function generateConversationSystemPrompt(
  persona: ConversationPersona,
  context: Partial<ConversationContext>
): string {
  const traits: string[] = [];

  // Formality
  if (persona.personality.formality < 0.3) {
    traits.push('very casual and relaxed');
  } else if (persona.personality.formality > 0.7) {
    traits.push('formal and professional');
  } else {
    traits.push('moderately formal but approachable');
  }

  // Enthusiasm
  if (persona.personality.enthusiasm > 0.7) {
    traits.push('enthusiastic and energetic');
  } else if (persona.personality.enthusiasm < 0.3) {
    traits.push('reserved and measured');
  }

  // Humor
  if (persona.personality.humor > 0.7) {
    traits.push('frequently humorous and playful');
  } else if (persona.personality.humor < 0.3) {
    traits.push('serious and professional');
  }

  // Expertise
  if (persona.personality.expertise > 0.7) {
    traits.push('highly knowledgeable and authoritative');
  } else if (persona.personality.expertise < 0.3) {
    traits.push('curious learner asking questions');
  }

  // Speaking style
  let styleDesc = '';
  if (persona.speakingStyle.sentenceLength === 'short') {
    styleDesc += 'concise, punchy sentences';
  } else if (persona.speakingStyle.sentenceLength === 'long') {
    styleDesc += 'detailed, flowing sentences';
  } else {
    styleDesc += 'clear, well-structured sentences';
  }

  if (persona.speakingStyle.vocabulary === 'technical') {
    styleDesc += ' with technical terminology';
  } else if (persona.speakingStyle.vocabulary === 'academic') {
    styleDesc += ' with sophisticated vocabulary';
  } else {
    styleDesc += ' with accessible language';
  }

  let systemPrompt = `You are ${persona.name}, ${persona.role} on a podcast.

PERSONALITY & TRAITS:
- ${traits.join(', ')}
- Speaking style: ${styleDesc}
- Background: ${persona.background}

YOUR ROLE:
You are having a real-time conversation with a listener who wants to learn more about the podcast topic or ask you questions. Stay completely in character as ${persona.name}.

CRITICAL INSTRUCTIONS:
1. Always respond as ${persona.name} - never break character
2. Use your unique personality traits and speaking style
3. Be helpful, engaging, and authentic to your character
4. Reference the podcast content when relevant`;

  // Add podcast context if available
  if (context.podcastTitle) {
    systemPrompt += `\n5. You are from the podcast: "${context.podcastTitle}"`;
  }

  if (context.contentSummary) {
    systemPrompt += `\n6. The podcast discussed: ${context.contentSummary}`;
  }

  if (context.facts && context.facts.length > 0) {
    const topFacts = context.facts.slice(0, 5);
    systemPrompt += `\n7. Key topics covered:\n${topFacts.map((f) => `   - ${f}`).join('\n')}`;
  }

  systemPrompt += `\n\nRespond naturally as ${persona.name} would, using your personality traits and speaking style.`;

  return systemPrompt;
}

// ============================================================================
// Response Generation
// ============================================================================

/**
 * Generate a response from a persona in a conversation
 */
export async function generatePersonaResponse(
  userMessage: string,
  context: ConversationContext,
  options: ResponseGenerationOptions = {}
): Promise<ConversationResponse> {
  // Determine which persona is responding
  const personaId = options.personaId || context.currentPersonaId;
  const persona = context.personas.find((p) => p.id === personaId);

  if (!persona) {
    throw new PersonaNotFoundError(`Persona with ID ${personaId} not found in conversation context`);
  }

  // Build conversation history
  const messages: ChatMessage[] = [];

  // Add system prompt
  const systemPrompt = generateConversationSystemPrompt(persona, context);
  messages.push({ role: 'system', content: systemPrompt });

  // Add conversation history (last 10 messages for context)
  const recentMessages = context.messages.slice(-10);
  for (const msg of recentMessages) {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  // Generate response
  const temperature = options.temperature ?? 0.8;
  const maxTokens = options.maxTokens ?? 500;

  try {
    const response = await generateCompletion(messages, {
      temperature,
      maxTokens,
    });

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tokenCount = response.split(/\s+/).length; // Approximate token count

    return {
      messageId,
      content: response,
      personaId: persona.id,
      personaName: persona.name,
      timestamp: new Date(),
      tokenCount,
    };
  } catch (error) {
    throw new ConversationAgentError(
      `Failed to generate persona response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a streaming response from a persona
 */
export async function* generatePersonaStreamingResponse(
  userMessage: string,
  context: ConversationContext,
  options: ResponseGenerationOptions = {}
): AsyncGenerator<StreamingChunk, void, unknown> {
  // Determine which persona is responding
  const personaId = options.personaId || context.currentPersonaId;
  const persona = context.personas.find((p) => p.id === personaId);

  if (!persona) {
    yield {
      type: 'error',
      error: `Persona with ID ${personaId} not found`,
    };
    return;
  }

  // Build conversation history
  const messages: ChatMessage[] = [];

  // Add system prompt
  const systemPrompt = generateConversationSystemPrompt(persona, context);
  messages.push({ role: 'system', content: systemPrompt });

  // Add conversation history (last 10 messages)
  const recentMessages = context.messages.slice(-10);
  for (const msg of recentMessages) {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  // Start streaming
  yield {
    type: 'start',
    personaName: persona.name,
  };

  try {
    const temperature = options.temperature ?? 0.8;
    const maxTokens = options.maxTokens ?? 500;

    let fullContent = '';
    let tokenCount = 0;

    for await (const chunk of generateStreamingCompletion(messages, {
      temperature,
      maxTokens,
    })) {
      fullContent += chunk;
      tokenCount++;

      yield {
        type: 'token',
        content: chunk,
      };
    }

    yield {
      type: 'end',
      tokenCount,
    };
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error during streaming',
    };
  }
}

/**
 * Generate initial greeting from persona
 */
export async function generatePersonaGreeting(
  persona: ConversationPersona,
  context: Partial<ConversationContext>
): Promise<string> {
  const systemPrompt = generateConversationSystemPrompt(persona, context);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Hi ${persona.name}! I just listened to your podcast and have some questions.`,
    },
  ];

  try {
    const greeting = await generateCompletion(messages, {
      temperature: 0.8,
      maxTokens: 150,
    });

    return greeting;
  } catch (error) {
    throw new ConversationAgentError(
      `Failed to generate greeting: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
