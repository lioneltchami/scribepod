/**
 * Content Preprocessor Service
 * Cleans, normalizes, and prepares content for fact extraction and dialogue generation
 */

import type { ParsedContent } from './contentParser';

export class PreprocessorError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'PreprocessorError';
  }
}

export interface PreprocessedContent {
  title: string;
  cleanedText: string;
  chunks: ContentChunk[];
  totalWords: number;
  totalChunks: number;
  metadata: {
    originalWordCount: number;
    removedWords: number;
    averageChunkSize: number;
  };
}

export interface ContentChunk {
  id: string;
  text: string;
  wordCount: number;
  sequence: number; // Order in the original content
  startOffset: number; // Character offset in original text
  endOffset: number;
}

export interface PreprocessingOptions {
  // Chunking
  maxChunkWords?: number; // Max words per chunk (default: 1000)
  minChunkWords?: number; // Min words per chunk (default: 50)
  overlapWords?: number; // Overlap between chunks (default: 50)

  // Text cleaning
  removeUrls?: boolean; // Remove URLs (default: true)
  removeEmails?: boolean; // Remove email addresses (default: true)
  removeExtraWhitespace?: boolean; // Normalize whitespace (default: true)
  removeSpecialChars?: boolean; // Remove special characters (default: false)
  toLowerCase?: boolean; // Convert to lowercase (default: false)

  // Content filtering
  minContentLength?: number; // Minimum content length in words (default: 10)
  maxContentLength?: number; // Maximum content length in words (default: 100000)
}

const DEFAULT_OPTIONS: Required<PreprocessingOptions> = {
  maxChunkWords: 1000,
  minChunkWords: 50,
  overlapWords: 50,
  removeUrls: true,
  removeEmails: true,
  removeExtraWhitespace: true,
  removeSpecialChars: false,
  toLowerCase: false,
  minContentLength: 10,
  maxContentLength: 100000,
};

/**
 * Clean and normalize text content
 */
export function cleanText(text: string, options: PreprocessingOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let cleaned = text;

  // Remove URLs
  if (opts.removeUrls) {
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  }

  // Remove email addresses
  if (opts.removeEmails) {
    cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '');
  }

  // Remove extra whitespace
  if (opts.removeExtraWhitespace) {
    cleaned = cleaned
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newline
      .trim();
  }

  // Remove special characters (keep alphanumeric, basic punctuation, and newlines)
  if (opts.removeSpecialChars) {
    cleaned = cleaned.replace(/[^\w\s.,!?;:()\-\n]/g, '');
  }

  // Convert to lowercase
  if (opts.toLowerCase) {
    cleaned = cleaned.toLowerCase();
  }

  return cleaned;
}

/**
 * Split text into sentences (basic implementation)
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (.!?) followed by space/newline
  const sentences = text
    .split(/([.!?]+[\s\n]+)/)
    .filter(s => s.trim().length > 0)
    .reduce((acc: string[], curr, idx, arr) => {
      if (idx % 2 === 0) {
        // Combine sentence with its punctuation
        const sentence = curr + (arr[idx + 1] || '');
        if (sentence.trim().length > 0) {
          acc.push(sentence.trim());
        }
      }
      return acc;
    }, []);

  return sentences;
}

/**
 * Split text into paragraphs
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Chunk content into manageable pieces with overlap
 */
export function chunkContent(
  text: string,
  options: PreprocessingOptions = {}
): ContentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: ContentChunk[] = [];

  // Split into sentences for better chunking
  const sentences = splitIntoSentences(text);

  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let chunkSequence = 0;
  let charOffset = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceWordCount = sentence.split(/\s+/).length;

    // Check if adding this sentence would exceed max chunk size
    if (currentWordCount + sentenceWordCount > opts.maxChunkWords && currentChunk.length > 0) {
      // Save current chunk
      const chunkText = currentChunk.join(' ');
      const startOffset = charOffset;
      const endOffset = charOffset + chunkText.length;

      chunks.push({
        id: `chunk-${chunkSequence}`,
        text: chunkText,
        wordCount: currentWordCount,
        sequence: chunkSequence,
        startOffset,
        endOffset,
      });

      chunkSequence++;

      // Start new chunk with overlap
      // Keep last few sentences for overlap
      const overlapSentences = Math.ceil(opts.overlapWords / 20); // Approx 20 words per sentence
      const keepSentences = currentChunk.slice(-Math.min(overlapSentences, currentChunk.length));
      currentChunk = keepSentences;
      currentWordCount = keepSentences.join(' ').split(/\s+/).length;

      charOffset = startOffset + (chunkText.length - currentChunk.join(' ').length);
    }

    // Add sentence to current chunk
    currentChunk.push(sentence);
    currentWordCount += sentenceWordCount;
  }

  // Add final chunk if it has content
  if (currentChunk.length > 0 && currentWordCount >= opts.minChunkWords) {
    const chunkText = currentChunk.join(' ');
    chunks.push({
      id: `chunk-${chunkSequence}`,
      text: chunkText,
      wordCount: currentWordCount,
      sequence: chunkSequence,
      startOffset: charOffset,
      endOffset: charOffset + chunkText.length,
    });
  }

  return chunks;
}

/**
 * Preprocess parsed content
 */
export async function preprocessContent(
  parsedContent: ParsedContent,
  options: PreprocessingOptions = {}
): Promise<PreprocessedContent> {
  try {
    console.log(`[Preprocessor] Preprocessing content: ${parsedContent.title}`);

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalWordCount = parsedContent.wordCount;

    // Validate content length
    if (originalWordCount < opts.minContentLength) {
      throw new PreprocessorError(
        `Content too short: ${originalWordCount} words (minimum: ${opts.minContentLength})`
      );
    }

    if (originalWordCount > opts.maxContentLength) {
      throw new PreprocessorError(
        `Content too long: ${originalWordCount} words (maximum: ${opts.maxContentLength})`
      );
    }

    // Clean the text
    const cleanedText = cleanText(parsedContent.text, options);
    const cleanedWordCount = cleanedText.split(/\s+/).length;
    const removedWords = originalWordCount - cleanedWordCount;

    console.log(`[Preprocessor] Cleaned text: ${removedWords} words removed`);

    // Chunk the content
    const chunks = chunkContent(cleanedText, options);
    const totalWords = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0);
    const averageChunkSize = chunks.length > 0 ? totalWords / chunks.length : 0;

    console.log(`[Preprocessor] Created ${chunks.length} chunks (avg: ${averageChunkSize.toFixed(0)} words/chunk)`);

    return {
      title: parsedContent.title,
      cleanedText,
      chunks,
      totalWords: cleanedWordCount,
      totalChunks: chunks.length,
      metadata: {
        originalWordCount,
        removedWords,
        averageChunkSize,
      },
    };
  } catch (error) {
    if (error instanceof PreprocessorError) {
      throw error;
    }
    throw new PreprocessorError('Failed to preprocess content', error);
  }
}

/**
 * Extract key information from content (titles, headings, etc.)
 */
export interface ExtractedInfo {
  title: string;
  headings: string[];
  keywords: string[];
  summary?: string;
}

export function extractKeyInfo(text: string): ExtractedInfo {
  const lines = text.split('\n');
  const headings: string[] = [];
  const keywords: string[] = [];

  // Extract headings (lines that are short and end with certain punctuation)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 100) {
      // Potential heading
      if (/^[A-Z]/.test(trimmed) && !/[.!?]$/.test(trimmed)) {
        headings.push(trimmed);
      }
    }
  }

  // Extract potential keywords (capitalized words)
  const words = text.split(/\s+/);
  const capitalizedWords = new Set<string>();
  for (const word of words) {
    const cleaned = word.replace(/[^\w]/g, '');
    if (cleaned.length > 3 && /^[A-Z]/.test(cleaned)) {
      capitalizedWords.add(cleaned);
    }
  }

  keywords.push(...Array.from(capitalizedWords).slice(0, 20));

  return {
    title: headings[0] || 'Untitled',
    headings: headings.slice(0, 10),
    keywords: keywords.slice(0, 20),
  };
}

/**
 * Calculate readability metrics (Flesch Reading Ease)
 */
export interface ReadabilityMetrics {
  fleschScore: number; // 0-100 (higher is easier)
  gradeLevel: string;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e'
  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

export function calculateReadability(text: string): ReadabilityMetrics {
  const sentences = splitIntoSentences(text);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  const totalSentences = sentences.length;
  const totalWords = words.length;
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const averageWordsPerSentence = totalWords / totalSentences;
  const averageSyllablesPerWord = totalSyllables / totalWords;

  // Flesch Reading Ease formula
  const fleschScore = 206.835 - 1.015 * averageWordsPerSentence - 84.6 * averageSyllablesPerWord;
  const clampedScore = Math.max(0, Math.min(100, fleschScore));

  // Determine grade level
  let gradeLevel: string;
  if (clampedScore >= 90) gradeLevel = '5th grade';
  else if (clampedScore >= 80) gradeLevel = '6th grade';
  else if (clampedScore >= 70) gradeLevel = '7th-8th grade';
  else if (clampedScore >= 60) gradeLevel = '9th-10th grade';
  else if (clampedScore >= 50) gradeLevel = '11th-12th grade';
  else if (clampedScore >= 30) gradeLevel = 'College';
  else gradeLevel = 'Graduate';

  return {
    fleschScore: Math.round(clampedScore),
    gradeLevel,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 10) / 10,
  };
}

// Export all functions
export default {
  preprocessContent,
  cleanText,
  chunkContent,
  splitIntoSentences,
  splitIntoParagraphs,
  extractKeyInfo,
  calculateReadability,
};
