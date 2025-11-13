/**
 * Conversation Context Manager
 * Manages conversation sessions, history, and state
 */

import type {
  ConversationContext,
  ConversationMessage,
  ConversationPersona,
  ConversationResponse,
} from './conversationAgent';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Session storage - in-memory for now
 * In production, this should use Redis or similar
 */
const conversationSessions = new Map<string, ConversationContext>();

/**
 * Session configuration
 */
export interface SessionConfig {
  maxMessages?: number; // Maximum messages to keep in history
  sessionTimeout?: number; // Session timeout in milliseconds
  maxTokens?: number; // Maximum tokens per session
}

/**
 * Session statistics
 */
export interface SessionStats {
  sessionId: string;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  totalTokens: number;
  sessionDuration: number; // milliseconds
  lastActivityAt: Date;
}

// ============================================================================
// Error Classes
// ============================================================================

export class SessionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class SessionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionLimitError';
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new conversation session
 */
export function createConversationSession(
  personas: ConversationPersona[],
  currentPersonaId: string,
  options: {
    podcastId?: string;
    contentId?: string;
    podcastTitle?: string;
    contentSummary?: string;
    facts?: string[];
  } = {}
): ConversationContext {
  if (personas.length === 0) {
    throw new Error('At least one persona is required to create a conversation');
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date();

  const context: ConversationContext = {
    sessionId,
    podcastId: options.podcastId,
    contentId: options.contentId,
    podcastTitle: options.podcastTitle,
    contentSummary: options.contentSummary,
    facts: options.facts || [],
    personas,
    currentPersonaId,
    messages: [],
    startedAt: now,
    lastActivityAt: now,
    totalTokens: 0,
  };

  conversationSessions.set(sessionId, context);

  return context;
}

/**
 * Get conversation session by ID
 */
export function getConversationSession(sessionId: string): ConversationContext {
  const session = conversationSessions.get(sessionId);

  if (!session) {
    throw new SessionNotFoundError(`Session ${sessionId} not found`);
  }

  return session;
}

/**
 * Check if session exists
 */
export function sessionExists(sessionId: string): boolean {
  return conversationSessions.has(sessionId);
}

/**
 * Add user message to conversation
 */
export function addUserMessage(
  sessionId: string,
  content: string,
  config: SessionConfig = {}
): ConversationMessage {
  const session = getConversationSession(sessionId);

  // Check message limit
  const maxMessages = config.maxMessages ?? 100;
  if (session.messages.length >= maxMessages) {
    throw new SessionLimitError(`Session has reached maximum message limit (${maxMessages})`);
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const message: ConversationMessage = {
    id: messageId,
    role: 'user',
    content,
    timestamp: new Date(),
  };

  session.messages.push(message);
  session.lastActivityAt = new Date();

  // Update session in storage
  conversationSessions.set(sessionId, session);

  return message;
}

/**
 * Add assistant response to conversation
 */
export function addAssistantMessage(
  sessionId: string,
  response: ConversationResponse,
  config: SessionConfig = {}
): ConversationMessage {
  const session = getConversationSession(sessionId);

  // Check token limit
  const maxTokens = config.maxTokens ?? 50000;
  if (session.totalTokens + response.tokenCount > maxTokens) {
    throw new SessionLimitError(`Session has reached maximum token limit (${maxTokens})`);
  }

  const message: ConversationMessage = {
    id: response.messageId,
    role: 'assistant',
    content: response.content,
    timestamp: response.timestamp,
    personaId: response.personaId,
    personaName: response.personaName,
    tokenCount: response.tokenCount,
  };

  session.messages.push(message);
  session.totalTokens += response.tokenCount;
  session.lastActivityAt = new Date();

  // Update session in storage
  conversationSessions.set(sessionId, session);

  return message;
}

/**
 * Switch active persona in conversation
 */
export function switchPersona(sessionId: string, personaId: string): ConversationContext {
  const session = getConversationSession(sessionId);

  const persona = session.personas.find((p) => p.id === personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found in session`);
  }

  session.currentPersonaId = personaId;
  session.lastActivityAt = new Date();

  conversationSessions.set(sessionId, session);

  return session;
}

/**
 * Get conversation history
 */
export function getConversationHistory(
  sessionId: string,
  options: { limit?: number; offset?: number } = {}
): ConversationMessage[] {
  const session = getConversationSession(sessionId);

  const limit = options.limit ?? session.messages.length;
  const offset = options.offset ?? 0;

  return session.messages.slice(offset, offset + limit);
}

/**
 * Get recent messages
 */
export function getRecentMessages(sessionId: string, count: number = 10): ConversationMessage[] {
  const session = getConversationSession(sessionId);
  return session.messages.slice(-count);
}

/**
 * Get session statistics
 */
export function getSessionStats(sessionId: string): SessionStats {
  const session = getConversationSession(sessionId);

  const userMessageCount = session.messages.filter((m) => m.role === 'user').length;
  const assistantMessageCount = session.messages.filter((m) => m.role === 'assistant').length;
  const sessionDuration = session.lastActivityAt.getTime() - session.startedAt.getTime();

  return {
    sessionId: session.sessionId,
    messageCount: session.messages.length,
    userMessageCount,
    assistantMessageCount,
    totalTokens: session.totalTokens,
    sessionDuration,
    lastActivityAt: session.lastActivityAt,
  };
}

/**
 * Clear conversation history (but keep session)
 */
export function clearConversationHistory(sessionId: string): void {
  const session = getConversationSession(sessionId);

  session.messages = [];
  session.totalTokens = 0;
  session.lastActivityAt = new Date();

  conversationSessions.set(sessionId, session);
}

/**
 * Delete conversation session
 */
export function deleteConversationSession(sessionId: string): boolean {
  return conversationSessions.delete(sessionId);
}

/**
 * Get all active session IDs
 */
export function getAllSessionIds(): string[] {
  return Array.from(conversationSessions.keys());
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(timeoutMs: number = 3600000): number {
  // Default 1 hour timeout
  const now = Date.now();
  let deletedCount = 0;

  for (const [sessionId, session] of conversationSessions.entries()) {
    const lastActivity = session.lastActivityAt.getTime();
    if (now - lastActivity > timeoutMs) {
      conversationSessions.delete(sessionId);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Get total number of active sessions
 */
export function getActiveSessionCount(): number {
  return conversationSessions.size;
}

/**
 * Export session data for persistence
 */
export function exportSessionData(sessionId: string): ConversationContext {
  return getConversationSession(sessionId);
}

/**
 * Import session data (restore from persistence)
 */
export function importSessionData(context: ConversationContext): void {
  conversationSessions.set(context.sessionId, context);
}

// ============================================================================
// Context Helpers
// ============================================================================

/**
 * Get current persona from session
 */
export function getCurrentPersona(sessionId: string): ConversationPersona {
  const session = getConversationSession(sessionId);
  const persona = session.personas.find((p) => p.id === session.currentPersonaId);

  if (!persona) {
    throw new Error(`Current persona ${session.currentPersonaId} not found`);
  }

  return persona;
}

/**
 * Get all personas in session
 */
export function getSessionPersonas(sessionId: string): ConversationPersona[] {
  const session = getConversationSession(sessionId);
  return session.personas;
}

/**
 * Add persona to existing session
 */
export function addPersonaToSession(
  sessionId: string,
  persona: ConversationPersona
): ConversationContext {
  const session = getConversationSession(sessionId);

  // Check if persona already exists
  const existingPersona = session.personas.find((p) => p.id === persona.id);
  if (existingPersona) {
    throw new Error(`Persona ${persona.id} already exists in session`);
  }

  session.personas.push(persona);
  session.lastActivityAt = new Date();

  conversationSessions.set(sessionId, session);

  return session;
}

/**
 * Remove persona from session
 */
export function removePersonaFromSession(
  sessionId: string,
  personaId: string
): ConversationContext {
  const session = getConversationSession(sessionId);

  // Don't allow removing the only persona
  if (session.personas.length === 1) {
    throw new Error('Cannot remove the only persona from session');
  }

  // Don't allow removing current persona
  if (session.currentPersonaId === personaId) {
    throw new Error('Cannot remove current active persona - switch to another persona first');
  }

  session.personas = session.personas.filter((p) => p.id !== personaId);
  session.lastActivityAt = new Date();

  conversationSessions.set(sessionId, session);

  return session;
}

/**
 * Update session context information
 */
export function updateSessionContext(
  sessionId: string,
  updates: {
    podcastTitle?: string;
    contentSummary?: string;
    facts?: string[];
  }
): ConversationContext {
  const session = getConversationSession(sessionId);

  if (updates.podcastTitle !== undefined) {
    session.podcastTitle = updates.podcastTitle;
  }

  if (updates.contentSummary !== undefined) {
    session.contentSummary = updates.contentSummary;
  }

  if (updates.facts !== undefined) {
    session.facts = updates.facts;
  }

  session.lastActivityAt = new Date();

  conversationSessions.set(sessionId, session);

  return session;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(sessionId: string, timeoutMs: number = 3600000): boolean {
  try {
    const session = getConversationSession(sessionId);
    const now = Date.now();
    const lastActivity = session.lastActivityAt.getTime();
    return now - lastActivity > timeoutMs;
  } catch (error) {
    // Session not found = expired
    return true;
  }
}

/**
 * Refresh session activity timestamp
 */
export function refreshSession(sessionId: string): void {
  const session = getConversationSession(sessionId);
  session.lastActivityAt = new Date();
  conversationSessions.set(sessionId, session);
}
