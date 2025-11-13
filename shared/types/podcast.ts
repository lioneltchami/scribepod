/**
 * Shared Types for Scribepod Podcast Generator
 * Used across the application for type safety
 */

// Source types for input content
export type SourceType = 'PDF' | 'HTML' | 'TEXT' | 'LATEX' | 'DOCX' | 'MARKDOWN';

export interface ParsedContent {
  title: string;
  sections: ContentSection[];
  metadata: ContentMetadata;
}

export interface ContentSection {
  heading?: string;
  text: string;
  wordCount: number;
}

export interface ContentMetadata {
  wordCount: number;
  estimatedReadTime: number; // minutes
  sourceType: SourceType;
  author?: string;
  date?: string;
}

// Podcast generation configuration
export interface PodcastConfig {
  host: PersonaConfig;
  guests: PersonaConfig[];
  style: ConversationStyle;
  targetLength: number; // minutes
  includeIntro?: boolean;
  includeOutro?: boolean;
  backgroundMusic?: boolean;
}

export type ConversationStyle = 'conversational' | 'interview' | 'debate' | 'storytelling' | 'educational';

// Persona configuration for multi-guest podcasts
export interface PersonaConfig {
  id: string;
  name: string;
  role: 'host' | 'guest';

  // Personality traits (0-1 scale)
  personality: {
    formality: number;      // 0 = casual, 1 = formal
    enthusiasm: number;     // 0 = subdued, 1 = energetic
    humor: number;          // 0 = serious, 1 = funny
    expertise: number;      // 0 = layperson, 1 = expert
    interruption: number;   // 0 = patient, 1 = interruptive
  };

  // Speaking style
  style: {
    sentenceLength: 'short' | 'medium' | 'long';
    vocabulary: 'simple' | 'academic' | 'technical';
    expressiveness: 'monotone' | 'varied' | 'dramatic';
    pace: 'slow' | 'medium' | 'fast';
  };

  // Voice configuration (for TTS)
  voice?: {
    provider: 'elevenlabs' | 'playht' | 'azure' | 'google';
    voiceId: string;
    stability?: number;      // 0-1
    similarityBoost?: number; // 0-1
  };

  // Background info
  bio: string;
  expertise: string[];
}

// Dialogue generation
export interface DialogueTurn {
  speaker: string;  // Persona name
  text: string;
  timestamp?: number; // milliseconds
  emotions?: string[]; // e.g., ['enthusiastic', 'thoughtful']
}

export interface GeneratedDialogue {
  turns: DialogueTurn[];
  metadata: {
    totalWords: number;
    estimatedDuration: number; // seconds
    speakerStats: Record<string, {
      turnCount: number;
      wordCount: number;
      percentage: number;
    }>;
  };
}

// Audio synthesis
export interface AudioSegment {
  id: string;
  speaker: string;
  text: string;
  audioPath?: string;
  duration?: number; // seconds
  volume?: number;   // 0-1
}

export interface PodcastAudio {
  segments: AudioSegment[];
  finalPath?: string;
  totalDuration?: number;
  format: 'mp3' | 'wav' | 'ogg';
  bitrate?: number;
}

// Processing status
export type ProcessingStatus = 'pending' | 'parsing' | 'summarizing' | 'generating' | 'synthesizing' | 'completed' | 'failed';

export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

// OpenAI-specific types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Fact extraction (for podcast content)
export interface ExtractedFact {
  text: string;
  importance: number; // 0-1
  category?: string;
  sourceSection?: string;
}

export interface FactSummary {
  facts: ExtractedFact[];
  totalFacts: number;
  categories: string[];
}
