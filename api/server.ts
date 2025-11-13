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
