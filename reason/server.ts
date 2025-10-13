import express from 'express';
import bodyParser from 'body-parser';
import asyncHandler from "express-async-handler"
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { postAudioData, generateThoughts, Thots } from './localInference';

// Load environment variables
dotenv.config();

// Init block
const app = express();

// SECURITY FIX: Configure CORS with specific allowed origins from environment
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// SECURITY FIX: Add rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'), // 60 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// end init block

type StateType = 'listening' | 'responding' | 'done';
type EventType = 'new_transcription' | 'silence_detected';


class MindState {
  stateType: StateType;
  latestQuestion: string;
  thoughts: string[];
  derived_intent: string[];
  subject_is: string[];
  responses: string[];

  constructor(public conversation: string[]) {
    this.latestQuestion = '';
    this.stateType = 'listening';
    this.thoughts = [];
    this.derived_intent = [];
    this.subject_is = [];
    this.responses = [];
  }

  updateThoughts = (thots: Thots) => {
    const {extra_state, intent, person_is, response, thoughts} = thots;
    const dedupedThoughts = Array.from(new Set([...this.thoughts, thoughts, extra_state])).slice(-5); 
    const dedupedDerivedIntent = Array.from(new Set([...this.derived_intent, intent])).slice(-5);
    const dedupedSubjectIs = Array.from(new Set([...this.subject_is, person_is])).slice(-5);
    const dedupedResponses = Array.from(new Set([...this.responses, response])).slice(-5);
    this.subject_is = dedupedSubjectIs;
    this.thoughts = dedupedThoughts;
    this.derived_intent = dedupedDerivedIntent;
    this.responses = dedupedResponses;
  }

  updateConversation = (newTranscription: string, chunk: number) => {
    if (chunk === 1) {
      this.conversation = [...this.conversation, newTranscription];
    } else {
      this.conversation[this.conversation.length - 1] = newTranscription;
    }
    this.eventHandler({ type: 'new_transcription' });
  }

  eventHandler = async (event: { type: EventType }): Promise<string> => {
    return ''
  }

}

let conversation = new MindState([]);

// ==============================================================================
// HEALTH CHECK ENDPOINTS
// ==============================================================================
// These endpoints allow monitoring systems (Kubernetes, Docker, etc.) to verify
// that the server is running and ready to handle requests

/**
 * Basic liveness check - confirms server is running
 * Returns 200 OK if server is alive
 */
app.get('/health', (req: any, res: any) => {
  res.status(200).json({
    status: 'ok',
    service: 'reason-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Readiness check - confirms server is ready to handle requests
 * Checks if Whisper server is reachable
 * Returns 200 OK if ready, 503 Service Unavailable if not ready
 */
app.get('/health/ready', asyncHandler(async (req: any, res: any) => {
  const checks: any = {
    status: 'ok',
    service: 'reason-server',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'ok',
      whisperConnection: 'unknown',
    }
  };

  try {
    // Check if we can reach the Whisper server
    const whisperHost = process.env.WHISPER_SERVER_HOST || 'localhost';
    const whisperPort = process.env.WHISPER_SERVER_PORT || '5000';
    const whisperUrl = `http://${whisperHost}:${whisperPort}/health`;

    // Use node-fetch or axios to check Whisper server
    const axios = require('axios');
    const whisperResponse = await axios.get(whisperUrl, { timeout: 5000 });

    if (whisperResponse.status === 200) {
      checks.checks.whisperConnection = 'ok';
      res.status(200).json(checks);
    } else {
      checks.status = 'degraded';
      checks.checks.whisperConnection = 'unreachable';
      res.status(503).json(checks);
    }
  } catch (error: any) {
    checks.status = 'degraded';
    checks.checks.whisperConnection = 'error';
    checks.error = error.message;
    res.status(503).json(checks);
  }
}));

// ==============================================================================
// APPLICATION ENDPOINTS
// ==============================================================================

app.get('/silence_detect', asyncHandler(async (req: any, res: any, next) => {
  console.log('hi');
}));

app.post('/conversation', upload.any(), asyncHandler(async (req: any, res: any, next) => {
  const { chunk } = req.query;
  const { files } = req;

  const chunkInt = parseInt(chunk);
  const buf = files[0];
  const transcriptionResponse = await postAudioData(buf);
  conversation.updateConversation(transcriptionResponse, chunkInt)

  const thots = await generateThoughts(conversation.conversation);
  conversation.updateThoughts(thots);

  const conversationState = {
    thoughts: conversation.thoughts,
    derived_intent: conversation.derived_intent,
    subject_is: conversation.subject_is,
    responses: conversation.responses,
  }
  res.json({ transcriptionResponse, conversationState});
}));

// SECURITY FIX: Load server configuration from environment
const host = process.env.REASON_SERVER_HOST || '0.0.0.0';
const port = parseInt(process.env.REASON_SERVER_PORT || '4200');

app.listen(port, host, () => {
  console.log(`[Reason Server] Listening on ${host}:${port}`);
  console.log(`[Reason Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Reason Server] CORS allowed origins: ${allowedOrigins.join(', ')}`);
});