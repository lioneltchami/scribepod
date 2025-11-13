/**
 * Advanced Dialogue Generator
 * Multi-persona podcast dialogue with personality-driven conversations
 */

import { generateCompletion, type ChatMessage } from './openai';
import type { Persona } from '../generated/prisma';

export class DialogueGeneratorError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DialogueGeneratorError';
  }
}

export interface PersonaProfile {
  id: string;
  name: string;
  role: 'host' | 'guest';
  personality: {
    formality: number;      // 0-1: casual to formal
    enthusiasm: number;     // 0-1: reserved to enthusiastic
    humor: number;          // 0-1: serious to humorous
    expertise: number;      // 0-1: novice to expert
    interruption: number;   // 0-1: polite to interruptive
  };
  speakingStyle: {
    sentenceLength: 'short' | 'medium' | 'long';
    vocabulary: 'simple' | 'academic' | 'technical';
    pace: 'slow' | 'medium' | 'fast';
  };
  bio: string;
  expertise: string[];
}

export interface DialogueTurn {
  speaker: string;
  speakerId: string;
  text: string;
  turnNumber: number;
  emotions?: string[];
  type?: 'statement' | 'question' | 'response' | 'transition';
}

export interface DialogueContext {
  previousTurns: DialogueTurn[];
  currentFacts: string[];
  discussedFacts: string[];
  conversationGoal: string;
}

/**
 * Convert Prisma Persona to PersonaProfile
 */
export function personaToProfile(persona: Persona): PersonaProfile {
  return {
    id: persona.id,
    name: persona.name,
    role: persona.role.toLowerCase() as 'host' | 'guest',
    personality: {
      formality: persona.formality,
      enthusiasm: persona.enthusiasm,
      humor: persona.humor,
      expertise: persona.expertiseLevel,
      interruption: persona.interruption,
    },
    speakingStyle: {
      sentenceLength: persona.sentenceLength as 'short' | 'medium' | 'long',
      vocabulary: persona.vocabulary as 'simple' | 'academic' | 'technical',
      pace: persona.pace as 'slow' | 'medium' | 'fast',
    },
    bio: persona.bio,
    expertise: persona.expertise,
  };
}

/**
 * Generate personality-aware system prompt
 */
function generatePersonalityPrompt(persona: PersonaProfile): string {
  const traits: string[] = [];

  // Formality
  if (persona.personality.formality < 0.3) {
    traits.push('very casual and relaxed');
  } else if (persona.personality.formality > 0.7) {
    traits.push('formal and professional');
  }

  // Enthusiasm
  if (persona.personality.enthusiasm > 0.7) {
    traits.push('enthusiastic and energetic');
  } else if (persona.personality.enthusiasm < 0.3) {
    traits.push('calm and measured');
  }

  // Humor
  if (persona.personality.humor > 0.7) {
    traits.push('often makes jokes and uses humor');
  } else if (persona.personality.humor < 0.3) {
    traits.push('serious and straightforward');
  }

  // Expertise
  if (persona.personality.expertise > 0.7) {
    traits.push('very knowledgeable and confident');
  } else if (persona.personality.expertise < 0.3) {
    traits.push('curious and asks many questions');
  }

  // Sentence length
  const lengthMap = {
    short: 'speaks in short, concise sentences',
    medium: 'uses varied sentence lengths',
    long: 'tends to explain things in detail with longer sentences',
  };
  traits.push(lengthMap[persona.speakingStyle.sentenceLength]);

  // Vocabulary
  const vocabMap = {
    simple: 'uses everyday language that\'s easy to understand',
    academic: 'uses sophisticated vocabulary and precise language',
    technical: 'frequently uses technical terms and jargon',
  };
  traits.push(vocabMap[persona.speakingStyle.vocabulary]);

  const roleDescription = persona.role === 'host'
    ? `${persona.name} is the HOST of this podcast. They guide the conversation, introduce topics, and ensure all guests get to participate.`
    : `${persona.name} is a GUEST on this podcast. They contribute insights based on their expertise: ${persona.expertise.join(', ')}.`;

  return `${roleDescription}

Personality traits:
- ${traits.join('\n- ')}

Bio: ${persona.bio}`;
}

/**
 * Generate multi-persona dialogue with advanced prompting
 */
export async function generateMultiPersonaDialogue(
  personas: PersonaProfile[],
  facts: string[],
  context: Partial<DialogueContext> = {},
  options: {
    title?: string;
    style?: 'conversational' | 'interview' | 'debate' | 'educational';
    isFirst?: boolean;
    isLast?: boolean;
    targetTurns?: number;
  } = {}
): Promise<DialogueTurn[]> {
  try {
    console.log(`[DialogueGenerator] Generating dialogue with ${personas.length} personas`);

    if (personas.length < 2) {
      throw new DialogueGeneratorError('At least 2 personas required');
    }

    const host = personas.find(p => p.role === 'host');
    if (!host) {
      throw new DialogueGeneratorError('At least one host persona required');
    }

    const guests = personas.filter(p => p.role === 'guest');

    // Build system prompt
    let systemPrompt = `You are a professional podcast script writer creating a natural, engaging multi-person conversation.

PODCAST PARTICIPANTS:
${personas.map(p => generatePersonalityPrompt(p)).join('\n\n')}

CRITICAL INSTRUCTIONS:
1. Each person MUST speak according to their unique personality traits and speaking style
2. Format EVERY dialogue turn as: [SPEAKER_NAME]: dialogue text
3. Make conversations feel NATURAL - people interrupt, agree, disagree, ask questions, build on each other's points
4. The host (${host.name}) should facilitate but not dominate - give guests plenty of speaking time
5. Include natural speech patterns: "you know", "I mean", "that's interesting", "actually", etc.
6. Vary turn lengths - not everyone speaks the same amount each time
7. Show personality through HOW they speak, not just what they say
8. Create dynamic back-and-forth, not just sequential statements`;

    if (options.style === 'interview') {
      systemPrompt += `\n9. INTERVIEW style: Host asks questions, guests provide detailed answers, follow-up questions encouraged`;
    } else if (options.style === 'debate') {
      systemPrompt += `\n9. DEBATE style: Guests may have different viewpoints, respectful disagreement is encouraged`;
    } else if (options.style === 'educational') {
      systemPrompt += `\n9. EDUCATIONAL style: Focus on explaining concepts clearly, building understanding step-by-step`;
    } else {
      systemPrompt += `\n9. CONVERSATIONAL style: Relaxed, friendly discussion among equals`;
    }

    // Build user prompt
    let userPrompt = '';

    if (options.isFirst) {
      userPrompt = `START THE PODCAST!

${host.name} should:
1. Welcome listeners warmly
2. Introduce the topic${options.title ? `: "${options.title}"` : ''}
3. Introduce each guest briefly
4. Set an engaging, enthusiastic tone

Then naturally flow into discussing these facts:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Generate ${options.targetTurns || 15}-${(options.targetTurns || 15) + 5} dialogue turns.
Start now:`;
    } else if (options.isLast) {
      userPrompt = `FINAL SEGMENT - WRAP UP THE PODCAST!

Continue the natural flow from previous discussion.

Discuss these final facts:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Then ${host.name} should:
1. Summarize key takeaways
2. Thank the guests
3. Give a warm closing

Generate ${options.targetTurns || 12}-${(options.targetTurns || 12) + 3} dialogue turns including the closing.
Continue:`;
    } else {
      userPrompt = `CONTINUE THE CONVERSATION naturally.

${context.previousTurns?.length ? `Previous context: The last few statements were about ${context.previousTurns.slice(-3).map(t => `${t.speaker}'s point`).join(', ')}.` : ''}

Discuss these facts:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Keep the energy up, maintain personality differences, and create engaging back-and-forth.
Generate ${options.targetTurns || 15}-${(options.targetTurns || 15) + 5} dialogue turns.
Continue:`;
    }

    // Add context from previous turns if available
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Include recent conversation history for context
    if (context.previousTurns && context.previousTurns.length > 0) {
      const recentHistory = context.previousTurns.slice(-6); // Last 6 turns
      const historyText = recentHistory.map(t => `${t.speaker}: ${t.text}`).join('\n');
      messages.push({
        role: 'assistant',
        content: `Previous conversation:\n${historyText}`,
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    // Generate dialogue
    const response = await generateCompletion(messages, {
      temperature: 0.85, // High creativity for natural conversations
      maxTokens: 3000,
    });

    // Parse dialogue into turns
    const turns = parseDialogueTurns(response, personas);

    console.log(`[DialogueGenerator] Generated ${turns.length} dialogue turns`);

    return turns;

  } catch (error) {
    throw new DialogueGeneratorError('Failed to generate dialogue', error);
  }
}

/**
 * Parse dialogue response into structured turns
 */
function parseDialogueTurns(
  dialogueText: string,
  personas: PersonaProfile[]
): DialogueTurn[] {
  const turns: DialogueTurn[] = [];
  const lines = dialogueText.split('\n');

  let turnNumber = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match format: [SPEAKER]: text or SPEAKER: text
    const match = trimmed.match(/^(\[?)([^:\]]+)\]?:\s*(.+)$/);

    if (match) {
      const speakerName = match[2].trim();
      const text = match[3].trim();

      // Find matching persona
      const persona = personas.find(p =>
        p.name.toLowerCase() === speakerName.toLowerCase()
      );

      if (persona && text.length > 0) {
        // Determine turn type
        let type: 'statement' | 'question' | 'response' | 'transition' = 'statement';
        if (text.includes('?')) {
          type = 'question';
        } else if (
          text.toLowerCase().startsWith('yes') ||
          text.toLowerCase().startsWith('no') ||
          text.toLowerCase().startsWith('absolutely') ||
          text.toLowerCase().startsWith('exactly')
        ) {
          type = 'response';
        }

        turns.push({
          speaker: persona.name,
          speakerId: persona.id,
          text,
          turnNumber: turnNumber++,
          type,
        });
      }
    }
  }

  return turns;
}

/**
 * Generate intro for podcast
 */
export async function generatePodcastIntro(
  host: PersonaProfile,
  guests: PersonaProfile[],
  title: string,
  topicSummary: string
): Promise<string> {
  const guestNames = guests.map(g => g.name).join(', ');

  const systemPrompt = `You are ${host.name}, the host of this podcast.
${generatePersonalityPrompt(host)}

You're about to start a podcast episode. Write an engaging intro that:
1. Welcomes listeners warmly
2. Introduces the topic: "${title}"
3. Briefly introduces your guests: ${guestNames}
4. Sets an enthusiastic, inviting tone
5. Hooks listeners with why this topic matters

Keep it natural and conversational, matching your personality. Length: 3-5 sentences.`;

  const userPrompt = `The episode is about: ${topicSummary}

Your guests are:
${guests.map(g => `- ${g.name}: ${g.expertise.join(', ')}`).join('\n')}

Write your intro:`;

  const intro = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.8,
    maxTokens: 300,
  });

  return intro.trim();
}

/**
 * Generate outro for podcast
 */
export async function generatePodcastOutro(
  host: PersonaProfile,
  keyTakeaways: string[]
): Promise<string> {
  const systemPrompt = `You are ${host.name}, the host of this podcast.
${generatePersonalityPrompt(host)}

You're wrapping up this podcast episode. Write a warm, satisfying conclusion that:
1. Briefly summarizes key takeaways
2. Thanks the guests
3. Encourages listeners (subscribe, rate, etc.)
4. Gives a warm sign-off

Keep it natural and match your personality. Length: 3-5 sentences.`;

  const userPrompt = `Key takeaways from this episode:
${keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Write your outro:`;

  const outro = await generateCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.8,
    maxTokens: 300,
  });

  return outro.trim();
}

// Export all functions
export default {
  generateMultiPersonaDialogue,
  generatePodcastIntro,
  generatePodcastOutro,
  personaToProfile,
};
