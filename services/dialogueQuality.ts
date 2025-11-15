/**
 * Dialogue Quality Validator and Exporter
 * Ensures high-quality podcast dialogue and exports in multiple formats
 */

import type { DialogueTurn, PersonaProfile } from './dialogueGenerator';
import type { ConversationContext } from './dialogueContext';
import fs from 'fs';

export class DialogueQualityError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DialogueQualityError';
  }
}

export interface QualityIssue {
  type: 'repetition' | 'imbalance' | 'too-short' | 'too-long' | 'formatting' | 'personality-mismatch';
  severity: 'low' | 'medium' | 'high';
  message: string;
  turnNumber?: number;
  suggestion?: string;
}

export interface QualityReport {
  score: number; // 0-100
  passed: boolean;
  issues: QualityIssue[];
  strengths: string[];
  recommendations: string[];
}

/**
 * Validate dialogue quality
 */
export function validateDialogueQuality(
  turns: DialogueTurn[],
  personas: PersonaProfile[],
  minScore: number = 70
): QualityReport {
  const issues: QualityIssue[] = [];
  const strengths: string[] = [];

  // Check 1: Minimum turn count
  if (turns.length < 10) {
    issues.push({
      type: 'too-short',
      severity: 'high',
      message: `Dialogue too short (${turns.length} turns). Minimum 10 turns recommended.`,
      suggestion: 'Generate more dialogue or combine segments.',
    });
  } else {
    strengths.push(`Good length: ${turns.length} dialogue turns`);
  }

  // Check 2: Speaker balance
  const speakerCounts = new Map<string, number>();
  turns.forEach(turn => {
    speakerCounts.set(turn.speaker, (speakerCounts.get(turn.speaker) || 0) + 1);
  });

  const avgTurnsPerSpeaker = turns.length / personas.length;
  personas.forEach(persona => {
    const count = speakerCounts.get(persona.name) || 0;
    const percentage = (count / turns.length) * 100;

    if (count === 0) {
      issues.push({
        type: 'imbalance',
        severity: 'high',
        message: `${persona.name} never speaks`,
        suggestion: 'Ensure all personas participate in the conversation.',
      });
    } else if (count < avgTurnsPerSpeaker * 0.3) {
      issues.push({
        type: 'imbalance',
        severity: 'medium',
        message: `${persona.name} speaks very little (${percentage.toFixed(1)}%)`,
        suggestion: `Increase ${persona.name}'s participation.`,
      });
    } else if (count > avgTurnsPerSpeaker * 2) {
      issues.push({
        type: 'imbalance',
        severity: 'medium',
        message: `${persona.name} dominates conversation (${percentage.toFixed(1)}%)`,
        suggestion: `Give other speakers more turns.`,
      });
    }
  });

  if (issues.filter(i => i.type === 'imbalance').length === 0) {
    strengths.push('Well-balanced speaker distribution');
  }

  // Check 3: Repetition detection
  const recentPhrases = new Set<string>();
  turns.forEach((turn, index) => {
    const words = turn.text.toLowerCase().split(/\s+/);

    // Check for repeated phrases (3+ words)
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (recentPhrases.has(phrase)) {
        issues.push({
          type: 'repetition',
          severity: 'low',
          message: `Repetitive phrase detected: "${phrase}"`,
          turnNumber: index,
          suggestion: 'Vary language and phrasing.',
        });
      }
      recentPhrases.add(phrase);
    }

    // Clear old phrases (keep last 50)
    if (recentPhrases.size > 50) {
      const arr = Array.from(recentPhrases);
      recentPhrases.clear();
      arr.slice(-50).forEach(p => recentPhrases.add(p));
    }
  });

  if (issues.filter(i => i.type === 'repetition').length === 0) {
    strengths.push('No significant repetition detected');
  }

  // Check 4: Turn length variation
  const turnLengths = turns.map(t => t.text.split(/\s+/).length);
  const avgLength = turnLengths.reduce((a, b) => a + b, 0) / turnLengths.length;
  const minLength = Math.min(...turnLengths);
  const maxLength = Math.max(...turnLengths);

  if (maxLength > avgLength * 5) {
    issues.push({
      type: 'too-long',
      severity: 'medium',
      message: `Some turns are excessively long (${maxLength} words vs avg ${avgLength.toFixed(0)})`,
      suggestion: 'Break long monologues into shorter exchanges.',
    });
  }

  if (minLength < 3 && turns.length > 20) {
    issues.push({
      type: 'too-short',
      severity: 'low',
      message: `Some turns are very short (${minLength} words)`,
      suggestion: 'Ensure substantive contributions from all speakers.',
    });
  } else {
    strengths.push('Good turn length variation');
  }

  // Check 5: Formatting consistency
  const formattingIssues = turns.filter(turn =>
    !turn.speaker || !turn.text || turn.text.trim().length === 0
  );

  if (formattingIssues.length > 0) {
    issues.push({
      type: 'formatting',
      severity: 'high',
      message: `${formattingIssues.length} turns have formatting issues`,
      suggestion: 'Ensure all turns have speaker and text.',
    });
  }

  // Calculate score
  let score = 100;

  // Deduct points for issues
  issues.forEach(issue => {
    if (issue.severity === 'high') score -= 15;
    else if (issue.severity === 'medium') score -= 10;
    else score -= 5;
  });

  score = Math.max(0, score);

  // Generate recommendations
  const recommendations: string[] = [];
  if (score < 80) {
    recommendations.push('Consider regenerating dialogue with adjusted parameters');
  }
  if (issues.some(i => i.type === 'imbalance')) {
    recommendations.push('Use dynamic turn-taking to balance speaker participation');
  }
  if (issues.some(i => i.type === 'repetition')) {
    recommendations.push('Increase temperature or use more varied prompts');
  }

  return {
    score,
    passed: score >= minScore,
    issues,
    strengths,
    recommendations,
  };
}

/**
 * Filter out low-quality dialogue turns
 */
export function filterLowQualityTurns(turns: DialogueTurn[]): DialogueTurn[] {
  return turns.filter(turn => {
    // Remove very short turns (< 3 words)
    if (turn.text.split(/\s+/).length < 3) {
      return false;
    }

    // Remove turns that are just filler
    const lowerText = turn.text.toLowerCase();
    const fillerPhrases = ['um', 'uh', 'er', 'ah', 'hmm', 'yeah', 'ok', 'okay'];
    const isJustFiller = fillerPhrases.some(filler =>
      lowerText.trim() === filler
    );

    return !isJustFiller;
  });
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export dialogue as JSON
 */
export function exportAsJSON(
  turns: DialogueTurn[],
  personas: PersonaProfile[],
  metadata?: {
    podcastId?: string;
    title?: string;
    generatedAt?: Date;
  }
): string {
  return JSON.stringify({
    metadata: {
      ...metadata,
      generatedAt: metadata?.generatedAt || new Date(),
      totalTurns: turns.length,
      personas: personas.map(p => ({ id: p.id, name: p.name, role: p.role })),
    },
    dialogue: turns,
  }, null, 2);
}

/**
 * Export dialogue as plain text
 */
export function exportAsText(
  turns: DialogueTurn[],
  includeMetadata: boolean = true
): string {
  let output = '';

  if (includeMetadata) {
    output += `Podcast Transcript\n`;
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `Total Turns: ${turns.length}\n`;
    output += `\n${'='.repeat(60)}\n\n`;
  }

  turns.forEach(turn => {
    output += `${turn.speaker}: ${turn.text}\n\n`;
  });

  return output;
}

/**
 * Export dialogue as SRT (subtitle format)
 */
export function exportAsSRT(
  turns: DialogueTurn[],
  wordsPerMinute: number = 150
): string {
  let output = '';
  let currentTime = 0; // milliseconds

  turns.forEach((turn, index) => {
    const wordCount = turn.text.split(/\s+/).length;
    const durationMs = (wordCount / wordsPerMinute) * 60 * 1000;

    const startTime = formatSRTTime(currentTime);
    const endTime = formatSRTTime(currentTime + durationMs);

    output += `${index + 1}\n`;
    output += `${startTime} --> ${endTime}\n`;
    output += `${turn.speaker}: ${turn.text}\n\n`;

    currentTime += durationMs + 500; // 500ms pause between turns
  });

  return output;
}

/**
 * Format milliseconds as SRT time (HH:MM:SS,mmm)
 */
function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

function pad(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

/**
 * Export dialogue as Markdown
 */
export function exportAsMarkdown(
  turns: DialogueTurn[],
  title?: string
): string {
  let output = '';

  if (title) {
    output += `# ${title}\n\n`;
  }

  output += `## Podcast Transcript\n\n`;
  output += `**Generated:** ${new Date().toLocaleDateString()}\n`;
  output += `**Total Turns:** ${turns.length}\n\n`;
  output += `---\n\n`;

  turns.forEach(turn => {
    output += `**${turn.speaker}:** ${turn.text}\n\n`;
  });

  return output;
}

/**
 * Save dialogue to file
 */
export async function saveDialogue(
  turns: DialogueTurn[],
  filePath: string,
  format: 'json' | 'text' | 'srt' | 'markdown',
  personas?: PersonaProfile[],
  metadata?: any
): Promise<void> {
  try {
    let content: string;

    switch (format) {
      case 'json':
        content = exportAsJSON(turns, personas || [], metadata);
        break;
      case 'text':
        content = exportAsText(turns, true);
        break;
      case 'srt':
        content = exportAsSRT(turns);
        break;
      case 'markdown':
        content = exportAsMarkdown(turns, metadata?.title);
        break;
      default:
        throw new DialogueQualityError(`Unsupported format: ${format}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[DialogueQuality] Saved dialogue to ${filePath}`);

  } catch (error) {
    throw new DialogueQualityError('Failed to save dialogue', error);
  }
}

// Export all functions
export default {
  validateDialogueQuality,
  filterLowQualityTurns,
  exportAsJSON,
  exportAsText,
  exportAsSRT,
  exportAsMarkdown,
  saveDialogue,
};
