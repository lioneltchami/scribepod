/**
 * Persona Library Service
 * Preset combinations and helper functions for default personas
 */

import { db } from './database';
import { DEFAULT_PERSONAS, getDefaultPersona } from './defaultPersonas';
import type { Persona } from '../generated/prisma';

/**
 * Preset combination definition
 */
export interface PresetCombination {
  name: string;
  description: string;
  personaKeys: string[];
  style: 'conversational' | 'interview' | 'debate' | 'educational';
  bestFor: string[];
}

/**
 * All preset combinations
 */
export const PRESET_COMBINATIONS: Record<string, PresetCombination> = {
  // Default: NotebookLM-style (Sarah + Marcus)
  'default': {
    name: 'Default Deep Dive',
    description: 'Classic two-host podcast with enthusiastic host and knowledgeable expert',
    personaKeys: ['sarah-chen', 'marcus-thompson'],
    style: 'conversational',
    bestFor: ['general content', 'balanced discussion', 'beginner-friendly'],
  },

  // Technical deep-dive (3 personas)
  'tech-deep-dive': {
    name: 'Technical Deep Dive',
    description: 'Technical exploration with expert analysis and balanced moderation',
    personaKeys: ['dr-emily-rivera', 'alex-park', 'jordan-lee'],
    style: 'educational',
    bestFor: ['technical topics', 'research papers', 'scientific content'],
  },

  // Academic discussion
  'academic': {
    name: 'Academic Discussion',
    description: 'Scholarly conversation with academic rigor and theoretical depth',
    personaKeys: ['prof-david-williams', 'dr-emily-rivera', 'jordan-lee'],
    style: 'educational',
    bestFor: ['academic papers', 'scholarly content', 'research'],
  },

  // Casual conversation
  'casual': {
    name: 'Casual Chat',
    description: 'Fun, relaxed conversation perfect for approachable content',
    personaKeys: ['alex-park', 'jamie-martinez', 'sarah-chen'],
    style: 'conversational',
    bestFor: ['entertainment', 'pop culture', 'beginner content'],
  },

  // Debate format
  'debate': {
    name: 'Debate Panel',
    description: 'Balanced debate with critical analysis and multiple perspectives',
    personaKeys: ['jordan-lee', 'taylor-anderson', 'marcus-thompson'],
    style: 'debate',
    bestFor: ['controversial topics', 'critical analysis', 'argumentative content'],
  },

  // Interview format
  'interview': {
    name: 'Expert Interview',
    description: 'Traditional interview with curious host and expert guest',
    personaKeys: ['sarah-chen', 'dr-emily-rivera'],
    style: 'interview',
    bestFor: ['expert insights', 'in-depth topics', 'educational'],
  },

  // Learning journey
  'learning-journey': {
    name: 'Learning Journey',
    description: 'Beginner-friendly exploration with curious learner and patient expert',
    personaKeys: ['jamie-martinez', 'marcus-thompson', 'sarah-chen'],
    style: 'educational',
    bestFor: ['beginner content', 'educational', 'explanatory'],
  },

  // Business/Professional
  'professional': {
    name: 'Professional Panel',
    description: 'Professional discussion with balanced moderation and expert insights',
    personaKeys: ['jordan-lee', 'marcus-thompson', 'taylor-anderson'],
    style: 'interview',
    bestFor: ['business topics', 'professional content', 'industry analysis'],
  },
};

/**
 * Get preset combination by key
 */
export function getPresetCombination(key: string): PresetCombination | null {
  return PRESET_COMBINATIONS[key] || null;
}

/**
 * Get all preset keys
 */
export function getPresetKeys(): string[] {
  return Object.keys(PRESET_COMBINATIONS);
}

/**
 * Get all presets
 */
export function getAllPresets(): PresetCombination[] {
  return Object.values(PRESET_COMBINATIONS);
}

/**
 * Get default persona IDs from database
 * Returns the persona IDs for the default combination (Sarah + Marcus)
 */
export async function getDefaultPersonaIds(): Promise<string[]> {
  try {
    const defaultKeys = PRESET_COMBINATIONS['default'].personaKeys;
    const personas: string[] = [];

    for (const key of defaultKeys) {
      const defaultPersona = getDefaultPersona(key);
      if (!defaultPersona) continue;

      // Find persona in database by name
      const dbPersona = await db.getPersonaByName(defaultPersona.name);
      if (dbPersona) {
        personas.push(dbPersona.id);
      }
    }

    return personas;
  } catch (error) {
    console.error('[PersonaLibrary] Error getting default persona IDs:', error);
    return [];
  }
}

/**
 * Get persona IDs for a preset combination
 */
export async function getPresetPersonaIds(presetKey: string): Promise<string[]> {
  try {
    const preset = getPresetCombination(presetKey);
    if (!preset) {
      throw new Error(`Preset ${presetKey} not found`);
    }

    const personas: string[] = [];

    for (const key of preset.personaKeys) {
      const defaultPersona = getDefaultPersona(key);
      if (!defaultPersona) continue;

      // Find persona in database by name
      const dbPersona = await db.getPersonaByName(defaultPersona.name);
      if (dbPersona) {
        personas.push(dbPersona.id);
      }
    }

    return personas;
  } catch (error) {
    console.error(`[PersonaLibrary] Error getting preset ${presetKey} persona IDs:`, error);
    return [];
  }
}

/**
 * Check if default personas are seeded in database
 */
export async function areDefaultPersonasSeeded(): Promise<boolean> {
  try {
    const allPersonas = await db.listPersonas();
    const defaultNames = Object.values(DEFAULT_PERSONAS).map(p => p.name);

    // Check if all default personas exist
    const seededCount = allPersonas.filter(p =>
      defaultNames.includes(p.name)
    ).length;

    return seededCount === defaultNames.length;
  } catch (error) {
    console.error('[PersonaLibrary] Error checking seeded personas:', error);
    return false;
  }
}

/**
 * Get persona IDs with fallback to defaults
 * If personaIds provided, use them. Otherwise use default or preset.
 */
export async function resolvePersonaIds(options: {
  personaIds?: string[];
  preset?: string;
  useDefaults?: boolean;
}): Promise<string[]> {
  // If explicit IDs provided, use them
  if (options.personaIds && options.personaIds.length > 0) {
    return options.personaIds;
  }

  // If preset specified, use preset
  if (options.preset) {
    const presetIds = await getPresetPersonaIds(options.preset);
    if (presetIds.length > 0) {
      return presetIds;
    }
  }

  // If useDefaults or no other option, use default
  if (options.useDefaults !== false) {
    const defaultIds = await getDefaultPersonaIds();
    if (defaultIds.length > 0) {
      return defaultIds;
    }
  }

  // No personas available
  return [];
}

/**
 * Get persona details for UI display
 */
export async function getPersonaDetails(personaId: string): Promise<{
  id: string;
  name: string;
  role: string;
  bio: string;
  isDefault: boolean;
} | null> {
  try {
    const persona = await db.getPersonaById(personaId);
    if (!persona) return null;

    const defaultNames = Object.values(DEFAULT_PERSONAS).map(p => p.name);
    const isDefault = defaultNames.includes(persona.name);

    return {
      id: persona.id,
      name: persona.name,
      role: persona.role,
      bio: persona.bio,
      isDefault,
    };
  } catch (error) {
    console.error(`[PersonaLibrary] Error getting persona ${personaId} details:`, error);
    return null;
  }
}

/**
 * List all available personas with metadata
 */
export async function listAvailablePersonas(): Promise<Array<{
  id: string;
  name: string;
  role: string;
  bio: string;
  isDefault: boolean;
  description?: string;
  bestFor?: string[];
}>> {
  try {
    const allPersonas = await db.listPersonas();
    const defaultPersonasMap = new Map(
      Object.values(DEFAULT_PERSONAS).map(p => [p.name, p])
    );

    return allPersonas.map(persona => {
      const defaultPersona = defaultPersonasMap.get(persona.name);
      return {
        id: persona.id,
        name: persona.name,
        role: persona.role,
        bio: persona.bio,
        isDefault: !!defaultPersona,
        description: defaultPersona?.description,
        bestFor: defaultPersona?.bestFor,
      };
    });
  } catch (error) {
    console.error('[PersonaLibrary] Error listing personas:', error);
    return [];
  }
}

/**
 * Get recommended preset for content
 */
export function getRecommendedPreset(contentHint?: string): string {
  if (!contentHint) return 'default';

  const hint = contentHint.toLowerCase();

  if (hint.includes('technical') || hint.includes('research') || hint.includes('scientific')) {
    return 'tech-deep-dive';
  }

  if (hint.includes('academic') || hint.includes('scholarly') || hint.includes('paper')) {
    return 'academic';
  }

  if (hint.includes('casual') || hint.includes('fun') || hint.includes('entertainment')) {
    return 'casual';
  }

  if (hint.includes('debate') || hint.includes('critical') || hint.includes('controversial')) {
    return 'debate';
  }

  if (hint.includes('educational') || hint.includes('beginner') || hint.includes('learning')) {
    return 'learning-journey';
  }

  if (hint.includes('business') || hint.includes('professional') || hint.includes('industry')) {
    return 'professional';
  }

  if (hint.includes('interview') || hint.includes('expert')) {
    return 'interview';
  }

  return 'default';
}
