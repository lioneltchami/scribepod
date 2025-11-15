/**
 * Content Parser Service
 * Extracts text content from various document formats
 * Supports: PDF, HTML, Markdown, Text, DOCX
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { TurndownService } from 'turndown';
import type { SourceType } from '../shared/types';

// Parser error class
export class ContentParserError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ContentParserError';
  }
}

// Parsed content structure
export interface ParsedContent {
  text: string;
  title: string;
  wordCount: number;
  sourceType: SourceType;
  metadata?: {
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    pageCount?: number;
    language?: string;
  };
}

/**
 * Parse text file content
 */
export async function parseTextFile(filePath: string): Promise<ParsedContent> {
  try {
    console.log(`[ContentParser] Parsing text file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new ContentParserError(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));

    // Clean up content
    const cleanedText = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const wordCount = cleanedText.split(/\s+/).length;

    console.log(`[ContentParser] Extracted ${wordCount} words from text file`);

    return {
      text: cleanedText,
      title: fileName.replace(/[-_]/g, ' '),
      wordCount,
      sourceType: 'TEXT',
      metadata: {
        createdDate: fs.statSync(filePath).birthtime,
        modifiedDate: fs.statSync(filePath).mtime,
      },
    };
  } catch (error) {
    throw new ContentParserError('Failed to parse text file', error);
  }
}

/**
 * Parse HTML content (from file or string)
 */
export async function parseHTML(input: string, isFilePath: boolean = true): Promise<ParsedContent> {
  try {
    console.log(`[ContentParser] Parsing HTML ${isFilePath ? 'file' : 'string'}`);

    let htmlContent: string;
    let fileName = 'Untitled';
    let fileStats: fs.Stats | null = null;

    if (isFilePath) {
      if (!fs.existsSync(input)) {
        throw new ContentParserError(`File not found: ${input}`);
      }
      htmlContent = fs.readFileSync(input, 'utf8');
      fileName = path.basename(input, path.extname(input));
      fileStats = fs.statSync(input);
    } else {
      htmlContent = input;
    }

    // Parse HTML with JSDOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Remove script and style tags
    const scriptsAndStyles = document.querySelectorAll('script, style, noscript');
    scriptsAndStyles.forEach(element => element.remove());

    // Try to extract title
    let title = document.querySelector('title')?.textContent || fileName;
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent) {
      title = h1.textContent.trim();
    }

    // Try to extract author from meta tags
    let author: string | undefined;
    const authorMeta = document.querySelector('meta[name="author"]');
    if (authorMeta) {
      author = authorMeta.getAttribute('content') || undefined;
    }

    // Extract text content
    const textContent = document.body.textContent || '';
    const cleanedText = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const wordCount = cleanedText.split(/\s+/).length;

    console.log(`[ContentParser] Extracted ${wordCount} words from HTML`);

    return {
      text: cleanedText,
      title: title.replace(/[-_]/g, ' ').trim(),
      wordCount,
      sourceType: 'HTML',
      metadata: {
        author,
        createdDate: fileStats?.birthtime,
        modifiedDate: fileStats?.mtime,
      },
    };
  } catch (error) {
    throw new ContentParserError('Failed to parse HTML', error);
  }
}

/**
 * Parse Markdown content
 */
export async function parseMarkdown(input: string, isFilePath: boolean = true): Promise<ParsedContent> {
  try {
    console.log(`[ContentParser] Parsing Markdown ${isFilePath ? 'file' : 'string'}`);

    let markdownContent: string;
    let fileName = 'Untitled';
    let fileStats: fs.Stats | null = null;

    if (isFilePath) {
      if (!fs.existsSync(input)) {
        throw new ContentParserError(`File not found: ${input}`);
      }
      markdownContent = fs.readFileSync(input, 'utf8');
      fileName = path.basename(input, path.extname(input));
      fileStats = fs.statSync(input);
    } else {
      markdownContent = input;
    }

    // Parse markdown to HTML first
    const html = await marked(markdownContent);

    // Convert HTML to plain text using JSDOM
    const dom = new JSDOM(html);
    const textContent = dom.window.document.body.textContent || '';

    // Try to extract title from first heading
    let title = fileName;
    const firstHeadingMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim();
    }

    // Clean up text
    const cleanedText = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const wordCount = cleanedText.split(/\s+/).length;

    console.log(`[ContentParser] Extracted ${wordCount} words from Markdown`);

    return {
      text: cleanedText,
      title: title.replace(/[-_]/g, ' '),
      wordCount,
      sourceType: 'MARKDOWN',
      metadata: {
        createdDate: fileStats?.birthtime,
        modifiedDate: fileStats?.mtime,
      },
    };
  } catch (error) {
    throw new ContentParserError('Failed to parse Markdown', error);
  }
}

/**
 * Parse PDF file
 */
export async function parsePDF(filePath: string): Promise<ParsedContent> {
  try {
    console.log(`[ContentParser] Parsing PDF file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new ContentParserError(`File not found: ${filePath}`);
    }

    // Dynamic import for pdf-parse (ESM module)
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF
    const data = await pdfParse(dataBuffer);

    const fileName = path.basename(filePath, path.extname(filePath));
    const fileStats = fs.statSync(filePath);

    // Extract metadata
    const title = data.info?.Title || fileName.replace(/[-_]/g, ' ');
    const author = data.info?.Author;
    const createdDate = data.info?.CreationDate ? new Date(data.info.CreationDate) : fileStats.birthtime;

    // Clean up extracted text
    const cleanedText = data.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const wordCount = cleanedText.split(/\s+/).length;

    console.log(`[ContentParser] Extracted ${wordCount} words from PDF (${data.numpages} pages)`);

    return {
      text: cleanedText,
      title,
      wordCount,
      sourceType: 'PDF',
      metadata: {
        author,
        createdDate,
        modifiedDate: fileStats.mtime,
        pageCount: data.numpages,
      },
    };
  } catch (error) {
    throw new ContentParserError('Failed to parse PDF', error);
  }
}

/**
 * Parse DOCX file
 */
export async function parseDOCX(filePath: string): Promise<ParsedContent> {
  try {
    console.log(`[ContentParser] Parsing DOCX file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new ContentParserError(`File not found: ${filePath}`);
    }

    // Extract text from DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    const fileName = path.basename(filePath, path.extname(filePath));
    const fileStats = fs.statSync(filePath);

    // Clean up text
    const cleanedText = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    const wordCount = cleanedText.split(/\s+/).length;

    console.log(`[ContentParser] Extracted ${wordCount} words from DOCX`);

    // Check for warnings
    if (result.messages.length > 0) {
      console.warn('[ContentParser] DOCX parsing warnings:', result.messages);
    }

    return {
      text: cleanedText,
      title: fileName.replace(/[-_]/g, ' '),
      wordCount,
      sourceType: 'DOCX',
      metadata: {
        createdDate: fileStats.birthtime,
        modifiedDate: fileStats.mtime,
      },
    };
  } catch (error) {
    throw new ContentParserError('Failed to parse DOCX', error);
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseFile(filePath: string): Promise<ParsedContent> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.txt':
        return await parseTextFile(filePath);
      case '.html':
      case '.htm':
        return await parseHTML(filePath, true);
      case '.md':
      case '.markdown':
        return await parseMarkdown(filePath, true);
      case '.pdf':
        return await parsePDF(filePath);
      case '.docx':
        return await parseDOCX(filePath);
      default:
        throw new ContentParserError(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    if (error instanceof ContentParserError) {
      throw error;
    }
    throw new ContentParserError('Failed to parse file', error);
  }
}

/**
 * Parse content from string based on source type
 */
export async function parseString(content: string, sourceType: SourceType): Promise<ParsedContent> {
  try {
    switch (sourceType) {
      case 'TEXT':
        const cleanedText = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');

        return {
          text: cleanedText,
          title: 'Untitled',
          wordCount: cleanedText.split(/\s+/).length,
          sourceType: 'TEXT',
        };

      case 'HTML':
        return await parseHTML(content, false);

      case 'MARKDOWN':
        return await parseMarkdown(content, false);

      default:
        throw new ContentParserError(`Cannot parse string for source type: ${sourceType}`);
    }
  } catch (error) {
    if (error instanceof ContentParserError) {
      throw error;
    }
    throw new ContentParserError('Failed to parse string', error);
  }
}

/**
 * Convert HTML to Markdown (useful for preprocessing)
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  return turndownService.turndown(html);
}

/**
 * Validate parsed content
 */
export function validateParsedContent(content: ParsedContent): boolean {
  if (!content.text || content.text.trim().length === 0) {
    throw new ContentParserError('Parsed content has no text');
  }

  if (content.wordCount < 10) {
    throw new ContentParserError('Parsed content has too few words (minimum 10)');
  }

  if (!content.title || content.title.trim().length === 0) {
    throw new ContentParserError('Parsed content has no title');
  }

  return true;
}

// Export all parsers
export default {
  parseFile,
  parseString,
  parseTextFile,
  parseHTML,
  parseMarkdown,
  parsePDF,
  parseDOCX,
  htmlToMarkdown,
  validateParsedContent,
};
