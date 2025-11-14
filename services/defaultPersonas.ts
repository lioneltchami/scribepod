/**
 * Default Personas Library
 * Curated collection of 8 preset personas for podcast generation
 * Inspired by NotebookLM but with full customization
 */

import type { PersonaRole } from '../generated/prisma';

/**
 * Default persona definition
 */
export interface DefaultPersona {
  name: string;
  role: PersonaRole;
  bio: string;
  expertise: string[];

  // Personality traits (0-1 scale)
  formality: number;
  enthusiasm: number;
  humor: number;
  expertiseLevel: number;
  interruption: number;

  // Speaking style
  sentenceLength: 'short' | 'medium' | 'long';
  vocabulary: 'simple' | 'academic' | 'technical';
  expressiveness: 'monotone' | 'varied' | 'dramatic';
  pace: 'slow' | 'medium' | 'fast';

  // Description for users
  description: string;
  bestFor: string[];
}

/**
 * All default personas (8 curated options)
 */
export const DEFAULT_PERSONAS: Record<string, DefaultPersona> = {
  // 1. Sarah Chen - Enthusiastic Host (inspired by NotebookLM's female voice)
  'sarah-chen': {
    name: 'Sarah Chen',
    role: 'HOST',
    bio: 'Enthusiastic podcast host with a passion for exploring new ideas and making complex topics accessible to everyone',
    expertise: ['interviewing', 'storytelling', 'audience engagement', 'curiosity'],

    formality: 0.4,        // Casual and approachable
    enthusiasm: 0.85,      // Very energetic and engaging
    humor: 0.7,            // Playful and light-hearted
    expertiseLevel: 0.6,   // Knowledgeable but not specialist
    interruption: 0.35,    // Occasionally interjects with excitement

    sentenceLength: 'medium',
    vocabulary: 'simple',
    expressiveness: 'varied',
    pace: 'medium',

    description: 'Energetic and curious host who brings enthusiasm to every conversation',
    bestFor: ['general topics', 'interviews', 'beginner-friendly content', 'conversational style'],
  },

  // 2. Marcus Thompson - Expert Guest (inspired by NotebookLM's male voice)
  'marcus-thompson': {
    name: 'Marcus Thompson',
    role: 'GUEST',
    bio: 'Thoughtful expert who excels at breaking down complex topics into clear, understandable explanations',
    expertise: ['analysis', 'research', 'clear communication', 'deep knowledge'],

    formality: 0.6,        // Professional but friendly
    enthusiasm: 0.6,       // Measured and thoughtful
    humor: 0.5,            // Balanced, occasional wit
    expertiseLevel: 0.85,  // Deep subject matter expertise
    interruption: 0.2,     // Polite, waits for turn

    sentenceLength: 'long',
    vocabulary: 'academic',
    expressiveness: 'varied',
    pace: 'medium',

    description: 'Knowledgeable expert who explains complex concepts with clarity and patience',
    bestFor: ['technical topics', 'in-depth analysis', 'educational content', 'expert insights'],
  },

  // 3. Dr. Emily Rivera - Technical Specialist
  'dr-emily-rivera': {
    name: 'Dr. Emily Rivera',
    role: 'GUEST',
    bio: 'Leading researcher and technical expert with 15+ years of experience in cutting-edge technology and scientific research',
    expertise: ['AI/ML', 'data science', 'research methodology', 'technical innovation'],

    formality: 0.8,        // Very professional and precise
    enthusiasm: 0.5,       // Measured and controlled
    humor: 0.3,            // Serious, rarely jokes
    expertiseLevel: 0.95,  // World-class expertise
    interruption: 0.15,    // Very polite, rarely interrupts

    sentenceLength: 'long',
    vocabulary: 'technical',
    expressiveness: 'monotone',
    pace: 'slow',

    description: 'Top-tier technical expert who provides authoritative, detailed insights',
    bestFor: ['technical deep-dives', 'scientific topics', 'research papers', 'advanced content'],
  },

  // 4. Alex Park - Casual Interviewer
  'alex-park': {
    name: 'Alex Park',
    role: 'HOST',
    bio: 'Laid-back conversationalist who creates a comfortable, fun atmosphere and asks the questions everyone wants answered',
    expertise: ['conversation', 'humor', 'relatability', 'casual discussion'],

    formality: 0.2,        // Very casual and relaxed
    enthusiasm: 0.9,       // High energy and fun
    humor: 0.85,           // Frequently humorous
    expertiseLevel: 0.4,   // Knowledgeable novice
    interruption: 0.5,     // Often interjects with jokes or reactions

    sentenceLength: 'short',
    vocabulary: 'simple',
    expressiveness: 'dramatic',
    pace: 'fast',

    description: 'Fun, casual host who keeps things light and entertaining',
    bestFor: ['casual conversations', 'entertainment', 'pop culture', 'approachable content'],
  },

  // 5. Jordan Lee - Balanced Moderator
  'jordan-lee': {
    name: 'Jordan Lee',
    role: 'HOST',
    bio: 'Professional podcast moderator who expertly balances multiple perspectives and keeps discussions focused and productive',
    expertise: ['moderation', 'balance', 'facilitation', 'professionalism'],

    formality: 0.65,       // Professional yet personable
    enthusiasm: 0.65,      // Engaged but controlled
    humor: 0.55,           // Occasional light humor
    expertiseLevel: 0.7,   // Well-rounded knowledge
    interruption: 0.3,     // Interjects to guide discussion

    sentenceLength: 'medium',
    vocabulary: 'academic',
    expressiveness: 'varied',
    pace: 'medium',

    description: 'Balanced, professional moderator perfect for multi-guest discussions',
    bestFor: ['panel discussions', 'debates', 'business topics', 'professional content'],
  },

  // 6. Prof. David Williams - Academic Scholar
  'prof-david-williams': {
    name: 'Prof. David Williams',
    role: 'GUEST',
    bio: 'Distinguished professor and scholar known for rigorous analysis and comprehensive understanding of academic subjects',
    expertise: ['academic theory', 'historical context', 'critical analysis', 'pedagogy'],

    formality: 0.9,        // Highly formal and scholarly
    enthusiasm: 0.4,       // Reserved and contemplative
    humor: 0.25,           // Rare, dry humor
    expertiseLevel: 0.9,   // Academic authority
    interruption: 0.1,     // Very respectful of speaking turns

    sentenceLength: 'long',
    vocabulary: 'academic',
    expressiveness: 'monotone',
    pace: 'slow',

    description: 'Distinguished academic who provides scholarly depth and theoretical frameworks',
    bestFor: ['academic papers', 'theoretical discussions', 'educational content', 'research'],
  },

  // 7. Jamie Martinez - Curious Learner
  'jamie-martinez': {
    name: 'Jamie Martinez',
    role: 'GUEST',
    bio: 'Eager learner who asks insightful questions from a beginner\'s perspective, making content accessible to all audiences',
    expertise: ['asking questions', 'learning in public', 'relatability', 'curiosity'],

    formality: 0.3,        // Casual and friendly
    enthusiasm: 0.75,      // Excited to learn
    humor: 0.6,            // Playful and self-deprecating
    expertiseLevel: 0.3,   // Novice perspective
    interruption: 0.4,     // Asks questions frequently

    sentenceLength: 'short',
    vocabulary: 'simple',
    expressiveness: 'varied',
    pace: 'medium',

    description: 'Curious learner who asks the questions your audience wants answered',
    bestFor: ['educational content', 'beginner topics', 'explanatory content', 'Q&A format'],
  },

  // 8. Taylor Anderson - Critical Thinker
  'taylor-anderson': {
    name: 'Taylor Anderson',
    role: 'GUEST',
    bio: 'Critical analyst who challenges assumptions, explores counterarguments, and ensures thorough examination of all perspectives',
    expertise: ['critical thinking', 'debate', 'analysis', 'argumentation'],

    formality: 0.7,        // Professional and serious
    enthusiasm: 0.55,      // Engaged but measured
    humor: 0.4,            // Occasional sharp wit
    expertiseLevel: 0.75,  // Strong analytical skills
    interruption: 0.45,    // Challenges and questions actively

    sentenceLength: 'medium',
    vocabulary: 'academic',
    expressiveness: 'varied',
    pace: 'medium',

    description: 'Analytical thinker who challenges ideas and explores multiple perspectives',
    bestFor: ['debates', 'critical analysis', 'controversial topics', 'argumentative content'],
  },
};

/**
 * Get default persona by key
 */
export function getDefaultPersona(key: string): DefaultPersona | null {
  return DEFAULT_PERSONAS[key] || null;
}

/**
 * Get all default persona keys
 */
export function getDefaultPersonaKeys(): string[] {
  return Object.keys(DEFAULT_PERSONAS);
}

/**
 * Get all default personas
 */
export function getAllDefaultPersonas(): DefaultPersona[] {
  return Object.values(DEFAULT_PERSONAS);
}

/**
 * Search personas by criteria
 */
export function searchPersonas(criteria: {
  role?: PersonaRole;
  minExpertise?: number;
  maxFormality?: number;
  bestFor?: string;
}): DefaultPersona[] {
  let results = getAllDefaultPersonas();

  if (criteria.role) {
    results = results.filter(p => p.role === criteria.role);
  }

  if (criteria.minExpertise !== undefined) {
    results = results.filter(p => p.expertiseLevel >= criteria.minExpertise);
  }

  if (criteria.maxFormality !== undefined) {
    results = results.filter(p => p.formality <= criteria.maxFormality);
  }

  if (criteria.bestFor) {
    results = results.filter(p =>
      p.bestFor.some(tag => tag.toLowerCase().includes(criteria.bestFor!.toLowerCase()))
    );
  }

  return results;
}

/**
 * Get recommended personas for content type
 */
export function getRecommendedPersonas(contentType: string): string[] {
  const type = contentType.toLowerCase();

  // Technical content
  if (type.includes('technical') || type.includes('research') || type.includes('scientific')) {
    return ['sarah-chen', 'dr-emily-rivera', 'marcus-thompson'];
  }

  // Academic content
  if (type.includes('academic') || type.includes('scholarly') || type.includes('paper')) {
    return ['jordan-lee', 'prof-david-williams', 'dr-emily-rivera'];
  }

  // Casual/Entertainment
  if (type.includes('casual') || type.includes('fun') || type.includes('entertainment')) {
    return ['alex-park', 'sarah-chen', 'jamie-martinez'];
  }

  // Debate/Critical
  if (type.includes('debate') || type.includes('critical') || type.includes('controversial')) {
    return ['jordan-lee', 'taylor-anderson', 'marcus-thompson'];
  }

  // Educational/Beginner
  if (type.includes('educational') || type.includes('beginner') || type.includes('intro')) {
    return ['sarah-chen', 'jamie-martinez', 'marcus-thompson'];
  }

  // Default: NotebookLM-style duo
  return ['sarah-chen', 'marcus-thompson'];
}
