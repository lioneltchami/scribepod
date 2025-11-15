/**
 * Content Ingestion Service
 * Orchestrates content parsing, preprocessing, and storage in database
 */

import { parseFile, parseString, type ParsedContent } from './contentParser';
import { preprocessContent, type PreprocessedContent, type PreprocessingOptions } from './contentPreprocessor';
import { db, type CreateContentInput } from './database';
import type { SourceType } from '../shared/types';
import type { Content, Fact } from '../generated/prisma';

export class ContentIngestionError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ContentIngestionError';
  }
}

export interface IngestionOptions extends PreprocessingOptions {
  storeFacts?: boolean; // Automatically extract and store facts (default: false)
  author?: string;
  sourceUrl?: string;
}

export interface IngestionResult {
  content: Content;
  preprocessed: PreprocessedContent;
  factsExtracted?: number;
}

/**
 * Ingest content from a file
 */
export async function ingestFile(
  filePath: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  try {
    console.log(`[ContentIngestion] Ingesting file: ${filePath}`);

    // Step 1: Parse the file
    const parsed = await parseFile(filePath);
    console.log(`[ContentIngestion] Parsed ${parsed.sourceType} file: ${parsed.title}`);

    // Step 2: Preprocess the content
    const preprocessed = await preprocessContent(parsed, options);
    console.log(`[ContentIngestion] Preprocessed: ${preprocessed.totalChunks} chunks, ${preprocessed.totalWords} words`);

    // Step 3: Store in database
    const contentData: CreateContentInput = {
      title: parsed.title,
      sourceType: parsed.sourceType,
      rawText: preprocessed.cleanedText,
      wordCount: preprocessed.totalWords,
      author: options.author || parsed.metadata?.author,
      sourceUrl: options.sourceUrl,
    };

    const content = await db.createContent(contentData);
    console.log(`[ContentIngestion] Stored content in database: ${content.id}`);

    // Step 4: Extract and store facts (if requested)
    let factsExtracted = 0;
    if (options.storeFacts) {
      console.log(`[ContentIngestion] Fact extraction requested but will be handled by processing job`);
      // Fact extraction will be handled by the processing job worker
      // This keeps the ingestion fast and allows async processing
    }

    console.log(`[ContentIngestion] ✓ Ingestion complete: ${content.id}`);

    return {
      content,
      preprocessed,
      factsExtracted,
    };
  } catch (error) {
    throw new ContentIngestionError('Failed to ingest file', error);
  }
}

/**
 * Ingest content from a string
 */
export async function ingestString(
  text: string,
  sourceType: SourceType,
  title: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  try {
    console.log(`[ContentIngestion] Ingesting string: ${title}`);

    // Step 1: Parse the string
    const parsed = await parseString(text, sourceType);
    parsed.title = title; // Override with provided title

    console.log(`[ContentIngestion] Parsed ${parsed.sourceType} string: ${parsed.title}`);

    // Step 2: Preprocess the content
    const preprocessed = await preprocessContent(parsed, options);
    console.log(`[ContentIngestion] Preprocessed: ${preprocessed.totalChunks} chunks, ${preprocessed.totalWords} words`);

    // Step 3: Store in database
    const contentData: CreateContentInput = {
      title: parsed.title,
      sourceType: parsed.sourceType,
      rawText: preprocessed.cleanedText,
      wordCount: preprocessed.totalWords,
      author: options.author,
      sourceUrl: options.sourceUrl,
    };

    const content = await db.createContent(contentData);
    console.log(`[ContentIngestion] Stored content in database: ${content.id}`);

    // Step 4: Handle facts (if requested)
    let factsExtracted = 0;
    if (options.storeFacts) {
      console.log(`[ContentIngestion] Fact extraction requested but will be handled by processing job`);
    }

    console.log(`[ContentIngestion] ✓ Ingestion complete: ${content.id}`);

    return {
      content,
      preprocessed,
      factsExtracted,
    };
  } catch (error) {
    throw new ContentIngestionError('Failed to ingest string', error);
  }
}

/**
 * Ingest content from URL (fetches and processes)
 */
export async function ingestURL(
  url: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  try {
    console.log(`[ContentIngestion] Ingesting URL: ${url}`);

    // Fetch the URL content
    const response = await fetch(url);
    if (!response.ok) {
      throw new ContentIngestionError(`Failed to fetch URL: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let text = await response.text();
    let sourceType: SourceType = 'HTML';

    // Determine source type from content-type header
    if (contentType.includes('text/plain')) {
      sourceType = 'TEXT';
    } else if (contentType.includes('text/markdown')) {
      sourceType = 'MARKDOWN';
    } else if (contentType.includes('text/html')) {
      sourceType = 'HTML';
    }

    // Extract title from URL or HTML
    let title = new URL(url).pathname.split('/').pop() || 'Untitled';

    // If HTML, try to extract title
    if (sourceType === 'HTML') {
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }

    // Ingest as string with URL as sourceUrl
    return await ingestString(text, sourceType, title, {
      ...options,
      sourceUrl: url,
    });
  } catch (error) {
    throw new ContentIngestionError('Failed to ingest URL', error);
  }
}

/**
 * Get content with facts
 */
export async function getContentWithFacts(contentId: string): Promise<Content | null> {
  try {
    return await db.getContentById(contentId);
  } catch (error) {
    throw new ContentIngestionError('Failed to get content', error);
  }
}

/**
 * List all content
 */
export async function listAllContent(limit: number = 50, offset: number = 0): Promise<Content[]> {
  try {
    return await db.listContent(limit, offset);
  } catch (error) {
    throw new ContentIngestionError('Failed to list content', error);
  }
}

/**
 * Delete content and associated data
 */
export async function deleteContentById(contentId: string): Promise<void> {
  try {
    console.log(`[ContentIngestion] Deleting content: ${contentId}`);
    await db.deleteContent(contentId);
    console.log(`[ContentIngestion] ✓ Content deleted: ${contentId}`);
  } catch (error) {
    throw new ContentIngestionError('Failed to delete content', error);
  }
}

/**
 * Batch ingest multiple files
 */
export async function batchIngestFiles(
  filePaths: string[],
  options: IngestionOptions = {}
): Promise<IngestionResult[]> {
  console.log(`[ContentIngestion] Batch ingesting ${filePaths.length} files`);

  const results: IngestionResult[] = [];
  const errors: Array<{ filePath: string; error: any }> = [];

  for (const filePath of filePaths) {
    try {
      const result = await ingestFile(filePath, options);
      results.push(result);
    } catch (error) {
      console.error(`[ContentIngestion] Error ingesting ${filePath}:`, error);
      errors.push({ filePath, error });
    }
  }

  console.log(`[ContentIngestion] Batch complete: ${results.length} succeeded, ${errors.length} failed`);

  if (errors.length > 0) {
    console.error('[ContentIngestion] Errors:', errors);
  }

  return results;
}

/**
 * Update content metadata
 */
export async function updateContentMetadata(
  contentId: string,
  updates: {
    title?: string;
    author?: string;
    sourceUrl?: string;
  }
): Promise<Content> {
  try {
    // Note: This would require adding an update method to the database service
    // For now, we'll throw an error indicating it's not implemented
    throw new ContentIngestionError('Content metadata update not yet implemented');
  } catch (error) {
    throw new ContentIngestionError('Failed to update content metadata', error);
  }
}

/**
 * Get content statistics
 */
export interface ContentStats {
  totalContent: number;
  totalWords: number;
  averageWords: number;
  sourceTypes: Record<SourceType, number>;
  recentContent: Content[];
}

export async function getContentStats(): Promise<ContentStats> {
  try {
    const allContent = await db.listContent(1000, 0); // Get up to 1000 items
    const totalContent = allContent.length;
    const totalWords = allContent.reduce((sum, c) => sum + c.wordCount, 0);
    const averageWords = totalContent > 0 ? totalWords / totalContent : 0;

    // Count by source type
    const sourceTypes: Record<string, number> = {};
    for (const content of allContent) {
      sourceTypes[content.sourceType] = (sourceTypes[content.sourceType] || 0) + 1;
    }

    // Get recent content (last 10)
    const recentContent = allContent.slice(0, 10);

    return {
      totalContent,
      totalWords,
      averageWords: Math.round(averageWords),
      sourceTypes: sourceTypes as Record<SourceType, number>,
      recentContent,
    };
  } catch (error) {
    throw new ContentIngestionError('Failed to get content stats', error);
  }
}

// Export all functions
export default {
  ingestFile,
  ingestString,
  ingestURL,
  getContentWithFacts,
  listAllContent,
  deleteContentById,
  batchIngestFiles,
  updateContentMetadata,
  getContentStats,
};
