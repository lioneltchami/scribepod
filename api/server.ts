/**
 * Scribepod API Server
 * REST API for podcast generation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Import services
import { ingestFile, ingestString, ingestURL, listAllContent, getContentStats } from '../services/contentIngestion';
import { generatePodcastFromFile, generatePodcastFromString, generatePodcastFromURL, getPipelineStatus } from '../services/pipelineOrchestrator';
import { db } from '../services/database';
import { healthCheck as dbHealthCheck } from '../services/database';
import { healthCheck as openaiHealthCheck } from '../services/openai';
import {
  generatePersonaResponse,
  generatePersonaStreamingResponse,
  generatePersonaGreeting,
  personaToConversationProfile,
} from '../services/conversationAgent';
import {
  createConversationSession,
  getConversationSession,
  addUserMessage,
  addAssistantMessage,
  switchPersona,
  getConversationHistory,
  getSessionStats,
  deleteConversationSession,
  cleanupExpiredSessions,
  getAllSessionIds,
  getCurrentPersona,
  getSessionPersonas,
} from '../services/conversationManager';

// Initialize Express app
const app = express();
const PORT = process.env.API_PORT || 3001;

// ==============================================================================
// Middleware
// ==============================================================================

// CORS
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// ==============================================================================
// Health Check Routes
// ==============================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealth = await dbHealthCheck();
    const openaiHealth = await openaiHealthCheck();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        openai: openaiHealth ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

app.get('/api/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'Scribepod API',
  });
});

// ==============================================================================
// Content Management Routes
// ==============================================================================

// Get all content
app.get('/api/content', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const content = await listAllContent(limit, offset);

    res.json({
      success: true,
      data: content,
      count: content.length,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content',
    });
  }
});

// Get single content
app.get('/api/content/:id', async (req: Request, res: Response) => {
  try {
    const content = await db.getContentById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content',
    });
  }
});

// Ingest content from string
app.post('/api/content/ingest/string', async (req: Request, res: Response) => {
  try {
    const { text, title, sourceType, author, sourceUrl } = req.body;

    if (!text || !title || !sourceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, title, sourceType',
      });
    }

    const result = await ingestString(text, sourceType, title, { author, sourceUrl });

    res.json({
      success: true,
      data: result.content,
      preprocessed: {
        totalWords: result.preprocessed.totalWords,
        totalChunks: result.preprocessed.totalChunks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest content',
    });
  }
});

// Ingest content from URL
app.post('/api/content/ingest/url', async (req: Request, res: Response) => {
  try {
    const { url, author } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: url',
      });
    }

    const result = await ingestURL(url, { author });

    res.json({
      success: true,
      data: result.content,
      preprocessed: {
        totalWords: result.preprocessed.totalWords,
        totalChunks: result.preprocessed.totalChunks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest URL',
    });
  }
});

// Get content statistics
app.get('/api/content/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getContentStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ==============================================================================
// Podcast Generation Routes
// ==============================================================================

// Get all podcasts
app.get('/api/podcasts', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const podcasts = await db.listPodcasts(limit, offset);

    res.json({
      success: true,
      data: podcasts,
      count: podcasts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get podcasts',
    });
  }
});

// Get single podcast
app.get('/api/podcasts/:id', async (req: Request, res: Response) => {
  try {
    const podcast = await db.getPodcastById(req.params.id);

    if (!podcast) {
      return res.status(404).json({
        success: false,
        error: 'Podcast not found',
      });
    }

    res.json({
      success: true,
      data: podcast,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get podcast',
    });
  }
});

// Generate podcast from string
app.post('/api/podcasts/generate/string', async (req: Request, res: Response) => {
  try {
    const { text, title, sourceType, personaIds, podcastTitle, targetLength, podcastStyle } = req.body;

    if (!text || !title || !sourceType || !personaIds || personaIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields or insufficient personas (minimum 2)',
      });
    }

    const result = await generatePodcastFromString(text, title, sourceType, {
      personaIds,
      podcastTitle,
      targetLength,
      podcastStyle,
    });

    res.json({
      success: true,
      data: {
        podcast: result.podcast,
        content: result.content,
        status: result.status,
        jobs: {
          factExtraction: result.jobs.factExtraction?.id,
          dialogueGeneration: result.jobs.dialogueGeneration?.id,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate podcast',
    });
  }
});

// Generate podcast from URL
app.post('/api/podcasts/generate/url', async (req: Request, res: Response) => {
  try {
    const { url, personaIds, podcastTitle, targetLength, podcastStyle } = req.body;

    if (!url || !personaIds || personaIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields or insufficient personas (minimum 2)',
      });
    }

    const result = await generatePodcastFromURL(url, {
      personaIds,
      podcastTitle,
      targetLength,
      podcastStyle,
    });

    res.json({
      success: true,
      data: {
        podcast: result.podcast,
        content: result.content,
        status: result.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate podcast',
    });
  }
});

// Get podcast status
app.get('/api/podcasts/:id/status', async (req: Request, res: Response) => {
  try {
    const status = await getPipelineStatus(req.params.id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
    });
  }
});

// Get podcast dialogues
app.get('/api/podcasts/:id/dialogues', async (req: Request, res: Response) => {
  try {
    const dialogues = await db.getDialoguesByPodcastId(req.params.id);

    res.json({
      success: true,
      data: dialogues,
      count: dialogues.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dialogues',
    });
  }
});

// ==============================================================================
// Persona Management Routes
// ==============================================================================

// Get all personas
app.get('/api/personas', async (req: Request, res: Response) => {
  try {
    const personas = await db.listPersonas();

    res.json({
      success: true,
      data: personas,
      count: personas.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get personas',
    });
  }
});

// Get single persona
app.get('/api/personas/:id', async (req: Request, res: Response) => {
  try {
    const persona = await db.getPersonaById(req.params.id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      });
    }

    res.json({
      success: true,
      data: persona,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get persona',
    });
  }
});

// Create persona
app.post('/api/personas', async (req: Request, res: Response) => {
  try {
    const persona = await db.createPersona(req.body);

    res.status(201).json({
      success: true,
      data: persona,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create persona',
    });
  }
});

// ==============================================================================
// Conversation Endpoints (Phase 2: Real-Time Conversation Agent)
// ==============================================================================

/**
 * POST /api/conversations
 * Create a new conversation session
 */
app.post('/api/conversations', async (req: Request, res: Response) => {
  try {
    const {
      podcastId,
      contentId,
      personaIds,
      initialPersonaId,
    } = req.body;

    if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'personaIds array is required and must contain at least one persona ID',
      });
    }

    // Fetch personas from database
    const personas = [];
    for (const personaId of personaIds) {
      const persona = await db.getPersonaById(personaId);
      if (persona) {
        personas.push(personaToConversationProfile(persona));
      }
    }

    if (personas.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid personas found',
      });
    }

    // Get podcast/content context if provided
    let podcastTitle: string | undefined;
    let contentSummary: string | undefined;
    let facts: string[] = [];

    if (podcastId) {
      const podcast = await db.getPodcastById(podcastId);
      if (podcast) {
        podcastTitle = podcast.title;
        if (podcast.contentId) {
          const content = await db.getContentById(podcast.contentId);
          if (content) {
            contentSummary = content.rawText?.substring(0, 500);
          }
        }
      }
    }

    if (contentId) {
      const content = await db.getContentById(contentId);
      if (content) {
        contentSummary = content.rawText?.substring(0, 500);
      }
      const contentFacts = await db.getFactsByContentId(contentId);
      facts = contentFacts.map((f) => f.text);
    }

    // Create conversation session
    const currentPersonaId = initialPersonaId || personas[0].id;
    const session = createConversationSession(personas, currentPersonaId, {
      podcastId,
      contentId,
      podcastTitle,
      contentSummary,
      facts: facts.slice(0, 20), // Limit to 20 facts for context
    });

    // Generate initial greeting
    const currentPersona = personas.find((p) => p.id === currentPersonaId)!;
    const greeting = await generatePersonaGreeting(currentPersona, {
      podcastTitle,
      contentSummary,
      facts: facts.slice(0, 5),
    });

    // Add greeting to session
    const greetingResponse = {
      messageId: `msg_${Date.now()}_greeting`,
      content: greeting,
      personaId: currentPersona.id,
      personaName: currentPersona.name,
      timestamp: new Date(),
      tokenCount: greeting.split(/\s+/).length,
    };

    addAssistantMessage(session.sessionId, greetingResponse);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        personas: session.personas,
        currentPersona: currentPersona,
        greeting: greeting,
        context: {
          podcastId: session.podcastId,
          contentId: session.contentId,
          podcastTitle: session.podcastTitle,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    });
  }
});

/**
 * GET /api/conversations/:sessionId
 * Get conversation session details
 */
app.get('/api/conversations/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = getConversationSession(sessionId);
    const stats = getSessionStats(sessionId);

    res.json({
      success: true,
      data: {
        session,
        stats,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Session not found',
    });
  }
});

/**
 * POST /api/conversations/:sessionId/messages
 * Send a message in a conversation
 */
app.post('/api/conversations/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message, personaId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message is required and must be a string',
      });
    }

    const session = getConversationSession(sessionId);

    // Add user message
    const userMsg = addUserMessage(sessionId, message);

    // Generate persona response
    const response = await generatePersonaResponse(message, session, { personaId });

    // Add assistant message
    addAssistantMessage(sessionId, response);

    res.json({
      success: true,
      data: {
        userMessage: userMsg,
        assistantMessage: {
          id: response.messageId,
          role: 'assistant',
          content: response.content,
          personaId: response.personaId,
          personaName: response.personaName,
          timestamp: response.timestamp,
          tokenCount: response.tokenCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    });
  }
});

/**
 * GET /api/conversations/:sessionId/stream
 * Server-Sent Events endpoint for streaming responses
 */
app.get('/api/conversations/:sessionId/stream', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message, personaId } = req.query;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message query parameter is required',
      });
    }

    const session = getConversationSession(sessionId);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Add user message
    addUserMessage(sessionId, message);

    // Stream response
    let fullContent = '';
    let tokenCount = 0;

    for await (const chunk of generatePersonaStreamingResponse(message, session, {
      personaId: personaId as string | undefined,
    })) {
      if (chunk.type === 'start') {
        res.write(`data: ${JSON.stringify({ type: 'start', personaName: chunk.personaName })}\n\n`);
      } else if (chunk.type === 'token') {
        fullContent += chunk.content || '';
        tokenCount++;
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`);
      } else if (chunk.type === 'end') {
        res.write(`data: ${JSON.stringify({ type: 'end', tokenCount: chunk.tokenCount })}\n\n`);

        // Add complete response to session
        const currentPersona = getCurrentPersona(sessionId);
        const assistantResponse = {
          messageId: `msg_${Date.now()}_stream`,
          content: fullContent,
          personaId: currentPersona.id,
          personaName: currentPersona.name,
          timestamp: new Date(),
          tokenCount: chunk.tokenCount || tokenCount,
        };
        addAssistantMessage(sessionId, assistantResponse);
      } else if (chunk.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: chunk.error })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stream response',
    });
  }
});

/**
 * GET /api/conversations/:sessionId/history
 * Get conversation message history
 */
app.get('/api/conversations/:sessionId/history', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit, offset } = req.query;

    const history = getConversationHistory(sessionId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        messages: history,
        total: history.length,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    });
  }
});

/**
 * POST /api/conversations/:sessionId/persona
 * Switch active persona in conversation
 */
app.post('/api/conversations/:sessionId/persona', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { personaId } = req.body;

    if (!personaId) {
      return res.status(400).json({
        success: false,
        error: 'personaId is required',
      });
    }

    const updatedSession = switchPersona(sessionId, personaId);
    const newPersona = getCurrentPersona(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: updatedSession.sessionId,
        currentPersona: newPersona,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to switch persona',
    });
  }
});

/**
 * DELETE /api/conversations/:sessionId
 * Delete a conversation session
 */
app.delete('/api/conversations/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const deleted = deleteConversationSession(sessionId);

    res.json({
      success: true,
      data: {
        deleted,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session',
    });
  }
});

/**
 * GET /api/conversations
 * Get all active conversation sessions
 */
app.get('/api/conversations', async (req: Request, res: Response) => {
  try {
    const sessionIds = getAllSessionIds();

    res.json({
      success: true,
      data: {
        sessions: sessionIds,
        count: sessionIds.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list sessions',
    });
  }
});

/**
 * POST /api/conversations/cleanup
 * Clean up expired sessions
 */
app.post('/api/conversations/cleanup', async (req: Request, res: Response) => {
  try {
    const { timeoutMs } = req.body;
    const deletedCount = cleanupExpiredSessions(timeoutMs);

    res.json({
      success: true,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup sessions',
    });
  }
});

// ==============================================================================
// Error Handling Middleware
// ==============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Error:', err);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ==============================================================================
// Start Server
// ==============================================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[API] Scribepod API server running on http://localhost:${PORT}`);
    console.log(`[API] Health check: http://localhost:${PORT}/health`);
    console.log(`[API] API endpoints: http://localhost:${PORT}/api/*`);
  });
}

export default app;
