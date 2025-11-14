/**
 * Shared Type Definitions
 * Common types used across the application
 */

/**
 * Chat message for OpenAI API
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for completion generation
 */
export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Prisma Persona type export for convenience
 */
export type { Persona } from '../generated/prisma';
