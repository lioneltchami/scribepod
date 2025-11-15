/**
 * OpenAI Service - GPT-4 Turbo Integration
 * Handles all interactions with OpenAI API with retry logic and error handling
 */

import OpenAI from 'openai';
import pRetry from 'p-retry';
import { config as dotenvConfig } from 'dotenv';
import type { ChatMessage, CompletionOptions } from '../shared/types';

// Load environment variables
dotenvConfig();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4000;
const MAX_RETRIES = 3;
const RETRY_MIN_TIMEOUT = 1000; // 1 second
const RETRY_MAX_TIMEOUT = 10000; // 10 seconds

// Validate API key
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-key-here') {
  console.warn('[OpenAI Service] Warning: OPENAI_API_KEY not configured. Set it in .env file.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout
  maxRetries: 0, // We handle retries manually with p-retry
});

/**
 * Custom error class for OpenAI-specific errors
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on rate limit errors
  if (error.status === 429) return true;

  // Retry on server errors
  if (error.status >= 500) return true;

  // Retry on timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;

  // Don't retry on client errors (400-499 except 429)
  if (error.status >= 400 && error.status < 500) return false;

  // Retry on network errors
  return true;
}

/**
 * Generate completion using GPT-4 Turbo with retry logic
 *
 * @param messages - Array of chat messages
 * @param options - Completion options
 * @returns The generated completion text
 */
export async function generateCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<string> {
  if (!messages || messages.length === 0) {
    throw new OpenAIError('Messages array cannot be empty');
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-key-here') {
    throw new OpenAIError(
      'OpenAI API key not configured. Please set OPENAI_API_KEY in .env file',
      'MISSING_API_KEY'
    );
  }

  const startTime = Date.now();

  try {
    // Use p-retry for exponential backoff
    const completion = await pRetry(
      async () => {
        console.log(`[OpenAI] Generating completion (attempt ${completion !== undefined ? 'retry' : '1'})...`);

        const response = await openai.chat.completions.create({
          model: options?.model || DEFAULT_MODEL,
          messages: messages as any, // OpenAI SDK has its own types
          temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
          top_p: options?.topP,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
        });

        return response;
      },
      {
        retries: MAX_RETRIES,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        factor: 2, // Exponential backoff factor
        onFailedAttempt: (error) => {
          console.warn(`[OpenAI] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          console.warn(`[OpenAI] Error: ${error.message}`);

          if (!isRetryableError(error)) {
            throw error; // Stop retrying on non-retryable errors
          }
        },
      }
    );

    const duration = Date.now() - startTime;
    const text = completion.choices[0]?.message?.content || '';

    if (!text) {
      throw new OpenAIError('Empty completion received from OpenAI');
    }

    console.log(`[OpenAI] Completion generated successfully (${duration}ms, ${text.length} chars)`);

    return text;

  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error(`[OpenAI] Error after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type,
    });

    // Transform error into OpenAIError
    if (error instanceof OpenAIError) {
      throw error;
    }

    throw new OpenAIError(
      error.message || 'Unknown OpenAI error',
      error.code,
      error.status,
      error
    );
  }
}

/**
 * Generate completion with streaming (for future use)
 * Currently returns promise of full text
 */
export async function generateCompletionStream(
  messages: ChatMessage[],
  options?: CompletionOptions,
  onChunk?: (chunk: string) => void
): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-key-here') {
    throw new OpenAIError(
      'OpenAI API key not configured. Please set OPENAI_API_KEY in .env file',
      'MISSING_API_KEY'
    );
  }

  try {
    const stream = await openai.chat.completions.create({
      model: options?.model || DEFAULT_MODEL,
      messages: messages as any,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        if (onChunk) {
          onChunk(content);
        }
      }
    }

    return fullText;

  } catch (error: any) {
    console.error('[OpenAI] Streaming error:', error);
    throw new OpenAIError(
      error.message || 'Streaming error',
      error.code,
      error.status,
      error
    );
  }
}

/**
 * Generate streaming completion with async generator
 * Yields chunks as they arrive for real-time streaming
 */
export async function* generateStreamingCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): AsyncGenerator<string, void, unknown> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-key-here') {
    throw new OpenAIError(
      'OpenAI API key not configured. Please set OPENAI_API_KEY in .env file',
      'MISSING_API_KEY'
    );
  }

  try {
    const stream = await openai.chat.completions.create({
      model: options?.model || DEFAULT_MODEL,
      messages: messages as any,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options?.maxTokens || DEFAULT_MAX_TOKENS,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error('[OpenAI] Streaming error:', error);
    throw new OpenAIError(
      error.message || 'Streaming error',
      error.code,
      error.status,
      error
    );
  }
}

/**
 * Extract facts from text content
 * Specialized prompt for fact extraction
 */
export async function extractFacts(
  text: string,
  title?: string
): Promise<string[]> {
  const systemPrompt = `You are an expert at extracting key facts from text.
Extract the most important facts as a bullet list.
Each fact should be concise, specific, and retain important details.
Format: Start each fact with a hyphen (-).`;

  const userPrompt = title
    ? `Extract key facts from this text titled "${title}":\n\n${text}`
    : `Extract key facts from this text:\n\n${text}`;

  const response = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.3, // Lower temperature for more factual output
    maxTokens: 2000,
  });

  // Parse facts from response
  const facts = response
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.match(/^\d+\./))
    .map(line => line.replace(/^[-\d.]\s*/, '').trim())
    .filter(line => line.length > 0);

  return facts;
}

/**
 * Generate dialogue from facts
 * Creates conversational podcast-style dialogue
 */
export async function generateDialogueFromFacts(
  facts: string[],
  config: {
    title?: string;
    speakerA: string;
    speakerB: string;
    style?: 'conversational' | 'interview' | 'debate';
    isFirst?: boolean;
    isLast?: boolean;
  }
): Promise<string> {
  const { title, speakerA, speakerB, style = 'conversational', isFirst, isLast } = config;

  let systemPrompt = `You are a professional podcast script writer. Create natural, engaging dialogue between ${speakerA} and ${speakerB}.

Guidelines:
- ${speakerA} is the host/presenter
- ${speakerB} is a curious co-host who asks intelligent questions
- Make it sound like real people talking, not reading from a script
- Use natural speech patterns, including occasional "um", "you know", etc.
- Build on previous points naturally
- Format: [SPEAKER_NAME]: dialogue text
- Keep individual turns concise and conversational`;

  if (style === 'interview') {
    systemPrompt += `\n- ${speakerB} should ask probing questions
- ${speakerA} provides detailed answers`;
  } else if (style === 'debate') {
    systemPrompt += `\n- Speakers may have different perspectives
- Include respectful disagreement and discussion`;
  }

  let userPrompt = '';

  if (isFirst) {
    userPrompt = `Start the podcast! ${speakerA} should welcome listeners${title ? ` and introduce the topic: "${title}"` : ''}.

Key facts to discuss:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Begin the conversation:`;
  } else if (isLast) {
    userPrompt = `Continue the conversation. This is the final segment.

Final facts to discuss:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Wrap up the podcast with closing remarks and key takeaways:`;
  } else {
    userPrompt = `Continue the conversation naturally.

Next facts to discuss:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Continue:`;
  }

  const dialogue = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.8, // Higher temperature for more creative dialogue
    maxTokens: 2000,
  });

  return dialogue;
}

/**
 * Health check - verify OpenAI API is accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await generateCompletion([
      { role: 'user', content: 'Say "OK"' }
    ], {
      maxTokens: 10,
      temperature: 0,
    });

    return response.toLowerCase().includes('ok');
  } catch (error) {
    console.error('[OpenAI] Health check failed:', error);
    return false;
  }
}

// Export configuration for testing
export const config = {
  apiKeyConfigured: !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-your-openai-key-here'),
  defaultModel: DEFAULT_MODEL,
  maxRetries: MAX_RETRIES,
};
